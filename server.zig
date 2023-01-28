// zig build-exe server.zig
// ./server
const builtin = @import("builtin");
const std = @import("std");
const fdeventer = @import("fdeventer.zig");
const FdEventer = fdeventer.FdEventer(*Handler);

const http = @import("http.zig");

const Gpa = std.heap.GeneralPurposeAllocator(.{});

fn handlePrintErr(err: anytype) noreturn {
    std.debug.panic("log to stdout failed with {s}", .{@errorName(err)});
}

const log_to_stdout = false;
var stdout_mutex = if (log_to_stdout) std.Thread.Mutex{} else void;

pub fn log(
    comptime level: std.log.Level,
    comptime scope: @TypeOf(.EnumLiteral),
    comptime format: []const u8,
    args: anytype,
) void {
    const now = std.time.timestamp();
    const level_txt = comptime level.asText();
    const prefix2 = if (scope == .default) ": " else "(" ++ @tagName(scope) ++ "): ";

    const unbuffered_writer = if (log_to_stdout) std.io.getStdOut().writer() else std.io.getStdErr().writer();
    var bw = std.io.BufferedWriter(300, @TypeOf(unbuffered_writer)){ .unbuffered_writer = unbuffered_writer };
    const mutex = if (log_to_stdout) &stdout_mutex else std.debug.getStderrMutex();
    mutex.lock();
    defer mutex.unlock();
    bw.writer().print("{}: ", .{now}) catch |e| handlePrintErr(e);
    bw.writer().print(level_txt ++ prefix2 ++ format ++ "\n", args) catch |e| handlePrintErr(e);
    bw.flush() catch |e| handlePrintErr(e);
}

pub fn oom(e: error{OutOfMemory}) noreturn {
    @panic(@errorName(e));
}

pub fn fatal(comptime fmt: []const u8, args: anytype) noreturn {
    std.log.err(fmt, args);
    std.os.exit(0xff);
}

const HandlerContext = struct {
    server_root_path: []const u8,
    server_root_dir: std.fs.Dir,
};

fn createListenSock(addr: std.net.Address) !std.os.socket_t {
    const sock = try std.os.socket(addr.any.family, std.os.SOCK.STREAM, std.os.IPPROTO.TCP);
    errdefer std.os.close(sock);

    if (builtin.os.tag != .windows) {
        try std.os.setsockopt(sock, std.os.SOL.SOCKET, std.os.SO.REUSEADDR, &std.mem.toBytes(@as(c_int, 1)));
    }
    try std.os.bind(sock, &addr.any, addr.getOsSockLen());
    try std.os.listen(sock, 128);
    return sock;
}

pub fn main() !void {
    if (builtin.os.tag == .windows) {
        _ = try std.os.windows.WSAStartup(2, 2);
    }
    if (builtin.os.tag == .linux) {
        std.os.close(0); // close stdin, we don't need it
        if (!log_to_stdout) {
            std.os.close(1); // we don't need stdout
            // we do want stderr cause zig logs things there
        }

        // disable SIGPIPE
        const act = std.os.Sigaction{
            .handler = .{ .handler = std.os.SIG.IGN },
            .mask = std.os.empty_sigset,
            .flags = std.os.SA.SIGINFO,
        };
        try std.os.sigaction(std.os.SIG.PIPE, &act, null);
    }


    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);

    const server_root = try std.fs.selfExeDirPathAlloc(arena.allocator());
    // no need to free
    std.log.info("server root is '{s}'", .{server_root});

//    const all_args = try std.process.argsAlloc(arena.allocator());
//    if (all_args.len <= 1) {
//        try std.io.getStdErr().writer().writeAll("Usage: webserver ROOT_PATH\n");
//        std.os.exit(0xff);
//    }
//    const args = all_args[1..];
//    if (args.len != 1) {
//        std.log.err("expected 1 cmdline argument but got {}", .{args.len});
//        std.os.exit(0xff);
//    }

    var gpa = Gpa{};
    defer _ = gpa.deinit();

    // TODO: support custom listen address
    //const port = 80;
    const port = 8080;
    const listen_addr = try std.net.Address.parseIp("0.0.0.0", port);
    std.log.info("listen address is {}", .{listen_addr});
    const listen_sock = try createListenSock(listen_addr);

    var eventer = try FdEventer.init();
    defer eventer.deinit();

    const server_root_dir = try std.fs.cwd().openDir(server_root, .{});
    server_root_dir.makeDir("g") catch |err| switch (err) {
        error.PathAlreadyExists => {},
        else => |e| return e,
    };

    // no need to close
    const handler_context = HandlerContext{
        .server_root_path = server_root,
        .server_root_dir = server_root_dir,
    };

    var listen_handler = ListenHandler{
        .sock = listen_sock,
        .eventer = &eventer,
        .gpa = &gpa,
        .context = &handler_context,
    };
    try eventer.add(listen_sock, .read, &listen_handler.base);

    while (true) {
        const max_events = 100;
        var events: [max_events]FdEventer.Event = undefined;
        const count = try eventer.wait(max_events, &events);
        for (events[0 .. count]) |*event| {
            try event.data().*.onReady(event.data().*);
        }
    }
}

fn shutCloseSock(sock: std.os.socket_t) void {
    std.os.shutdown(sock, .both) catch {};
    std.os.close(sock);
}

const Handler = struct {
    onReady: *const fn(handler: *Handler) anyerror!void,
};

const ListenHandler = struct {
    base: Handler = .{ .onReady = onReady },
    sock: std.os.socket_t,
    eventer: *FdEventer,
    gpa: *Gpa,
    context: *const HandlerContext,
    fn onReady(base: *Handler) anyerror!void {
        const self = @fieldParentPtr(ListenHandler, "base", base);
        var from: std.net.Address = undefined;
        var fromlen: std.os.socklen_t = @sizeOf(@TypeOf(from));
        // TODO: maybe handle some of the errors we could get?
        const new_sock = try std.os.accept(self.sock, &from.any, &fromlen, 0);
        // TODO: do we ened to tell eventer that we closed the socket?
        errdefer shutCloseSock(new_sock);
        std.log.info("s={}: got new connection from {}", .{new_sock, from});
        const new_handler = try self.gpa.allocator().create(DataHandler);
        errdefer self.gpa.allocator().destroy(new_handler);
        new_handler.* = .{ .sock = new_sock, .gpa = self.gpa, .context = self.context };
        try self.eventer.add(new_sock, .read, &new_handler.base);
    }
};

// helps detur Denial of Service
const max_request_header_len = 4096 * 100;

const DataHandler = struct {
    base: Handler = .{ .onReady = onReady },
    sock: std.os.socket_t,
    gpa: *Gpa,
    al: std.ArrayListUnmanaged(u8) = .{},
    context: *const HandlerContext,
    pub fn deinit(self: *DataHandler) void {
        // TODO: does the eventer need to know we've been closed?
        std.log.info("s={}: shutdown/close", .{self.sock});
        shutCloseSock(self.sock);
        self.al.deinit(self.gpa.allocator());
        self.gpa.allocator().destroy(self);
    }
    fn onReady(base: *Handler) anyerror!void {
        const self = @fieldParentPtr(DataHandler, "base", base);

        // TODO: just close the client if we run out of memory
        try self.al.ensureUnusedCapacity(self.gpa.allocator(), 4096);

        //var buf: [std.mem.page_size]u8 = undefined;
        // TODO: maybe handle some of these errors
        const received = readSock(self.sock, self.al.unusedCapacitySlice(), 0) catch |err| switch (err) {
            error.ConnectionResetByPeer => {
                std.log.info("s={}: connection reset", .{self.sock});
                self.deinit();
                return;
            },
            else => |e| return e,
        };
        if (received == 0) {
            std.log.info("s={}: closed", .{self.sock});
            self.deinit();
            return;
        }

        self.al.items.len += received;
        std.log.info("s={}: got {} bytes", .{self.sock, received});

        const end_of_headers = http.findEndOfHeaders(self.al.items, received) orelse {
            if (self.al.items.len > max_request_header_len) {
                std.log.info("s={}: headers exceeded max len {}, closing", .{self.sock, max_request_header_len});
                self.deinit();
            }
            return;
        };
        try self.onAllHeadersReceived(end_of_headers);
    }

    fn onAllHeadersReceived(self: *DataHandler, end_of_headers: usize) !void {
        const request = self.al.items[0 .. end_of_headers];

        const uri_line = http.parseUriLine(request) catch |err| {
            try sendHttpResponse(self.sock, .{ .keep_alive = false }, "400 Bad Request", .text, @errorName(err));
            self.deinit();
            return;
        };

        const headers = request[uri_line.end()..end_of_headers-2];
        var request_options = RequestOptions {
            .keep_alive = false,
        };
        var content_len: usize = 0;

        //std.log.info("s={}: ------------- GET '{s}' -----------------", .{self.sock, uri_line.uri(request)});
        var header_it = http.HeaderIterator{ .headers = headers };
        while (header_it.next() catch |err| {
            try sendHttpResponse(self.sock, .{ .keep_alive = false }, "400 Bad Request", .text, @errorName(err));
            self.deinit();
            return;
        }) |header| {
            //std.log.info("s={}: {s}: {s}", .{self.sock, header.name, header.value});
            if (std.ascii.eqlIgnoreCase(header.name, "connection")) {
                if (std.mem.eql(u8, header.value, "keep-alive")) {
                    request_options.keep_alive = true;
                } else if (std.mem.eql(u8, header.value, "close")) {
                    request_options.keep_alive = false;
                } else {
                    try sendHttpResponseFmt(self.sock, .{ .keep_alive = false }, "400 Bad Request",
                        .text, "unknown Connection header value '{s}'", .{header.value});
                    self.deinit();
                    return;
                }
            } else if (std.ascii.eqlIgnoreCase(header.name, "content-length")) {
                @panic("todo");
            }
        }
        //std.log.info("s={}: ---------------------------------------", .{self.sock});

        if (content_len > 0) {
            @panic("todo: non-zero content-length");
        }
        switch (try handleRequest(self.context.*, self.sock, request, uri_line, request_options)) {
            .close => {
                self.deinit();
                return;
            },
            .can_keep_alive => {
                if (self.al.items.len > request.len) {
                    @panic("todo");
                }
                self.al.items.len = 0;
            },
        }
    }
};

const ContentType = enum {
    json,
    text,
    pub fn str(self: ContentType) []const u8 {
        return switch (self) {
            .json => "application/json",
            .text => "text/plain",
        };
    }
};
const RequestOptions = struct {
    keep_alive: bool,
};
fn sendHttpResponseFmt(
    sock: std.os.socket_t,
    request_options: RequestOptions,
    code: []const u8,
    content_type: ContentType,
    comptime fmt: []const u8,
    args: anytype,
) !void {
    var buf: [4096]u8 = undefined;
    const content = std.fmt.bufPrint(&buf, fmt, args) catch "[content-too-long]";
    try sendHttpResponse(sock, request_options, code, content_type, content);
}
fn sendHttpResponse(
    sock: std.os.socket_t,
    request_options: RequestOptions,
    code: []const u8,
    content_type: ContentType,
    content: []const u8,
) !void {
    const connection = if (request_options.keep_alive) "keep-alive" else "close";
    const sock_writer = SocketWriter{ .context = sock };
    var bw = std.io.BufferedWriter(300, @TypeOf(sock_writer)){ .unbuffered_writer = sock_writer };
    std.log.info("Sending HTTP Reponse '{s}', Content-Length={}", .{code, content.len});
    try bw.writer().print(
        "HTTP/1.1 {s}\r\nConnection: {s}\r\nContent-Type: {s}\r\nContent-Length: {}\r\n\r\n{s}",
        .{code, connection, content_type.str(), content.len, content});
    try bw.flush();
}
fn sendHttpResponseNoContent(
    sock: std.os.socket_t,
    request_options: RequestOptions,
    code: []const u8,
) !void {
    const connection = if (request_options.keep_alive) "keep-alive" else "close";
    const sock_writer = SocketWriter{ .context = sock };
    var bw = std.io.BufferedWriter(300, @TypeOf(sock_writer)){ .unbuffered_writer = sock_writer };
    std.log.info("Sending HTTP Reponse '{s}'", .{code});
    try bw.writer().print("HTTP/1.1 {s}\r\nConnection: {s}\r\nContent-Length: 0\r\n\r\n", .{code, connection});
    try bw.flush();
}

const write_sock_return_type = @typeInfo(@TypeOf(writeSock)).Fn.return_type.?;
const SocketWriter = std.io.Writer(
    std.os.socket_t,
    @typeInfo(write_sock_return_type).ErrorUnion.error_set,
    writeSock,
);
fn writeSock(sock: std.os.socket_t, buf: []const u8) !usize {
    if (builtin.os.tag == .windows) {
        const result = std.os.windows.sendto(sock, buf.ptr, buf.len, 0, null, 0);
        if (result != std.os.windows.ws2_32.SOCKET_ERROR)
            return @intCast(usize, result);
        switch (std.os.windows.ws2_32.WSAGetLastError()) {
            else => |err| return std.os.windows.unexpectedWSAError(err),
        }
    }
    return std.os.send(sock, buf, 0);
}
fn readSock(sock: std.os.socket_t, buf: []u8, flags: u32) !usize {
    if (builtin.os.tag == .windows) {
        const result = std.os.windows.recvfrom(sock, buf.ptr, buf.len, flags, null, null);
        if (result != std.os.windows.ws2_32.SOCKET_ERROR)
            return @intCast(usize, result);
        switch (std.os.windows.ws2_32.WSAGetLastError()) {
            .WSAECONNRESET => return error.ConnectionResetByPeer,
            else => |err| return std.os.windows.unexpectedWSAError(err),
        }
    }
    return std.os.recv(sock, buf, flags);
}


const path_whitelist = std.ComptimeStringMap(void, .{
    .{ "/", .{} },
    .{ "/favicon.ico", {} },
});
const Action = enum {
    CreateGame,
};
const action_map = std.ComptimeStringMap(Action, .{
    .{ "/CreateGame", .CreateGame },
});

const HandleRequestResult = enum {
    close,
    can_keep_alive,
};
fn handleRequest(
    context: HandlerContext,
    sock: std.os.socket_t,
    request: []const u8,
    uri_line: http.UriLine,
    opt: RequestOptions,
) !HandleRequestResult {
    const http_method = uri_line.method(request);
    const uri_str = uri_line.uri(request);
    std.log.info("{s} {s}", .{http_method, uri_str});

    if (!std.mem.startsWith(u8, http_method, "GET")) {
        try sendHttpResponseFmt(sock, opt, "501 Not Implemented", .text, "HTTP method '{s}' not implemented", .{http_method});
        return .can_keep_alive;
    }

    const uri = http.Uri.parse(uri_str) catch |err| {
        try sendHttpResponseFmt(sock, opt, "400 Bad Request", .text, "failed to parse '{s}' as URI with {s}", .{uri_str, @errorName(err)});
        return .can_keep_alive;
    };

    if (path_whitelist.get(uri.path)) |_| {
        const path = if (std.mem.eql(u8, uri.path, "/")) "/rpghelper.html" else uri.path;
        try sendHttpResponseFile(context, sock, opt, path);
    } else {
        try sendHttpResponseNoContent(sock, opt, "404 Not Found");
    }
    return .can_keep_alive;
}

fn sendJsonError(sock: std.os.socket_t, opt: RequestOptions, comptime fmt: []const u8, args: anytype) !void {
    try sendHttpResponseFmt(sock, opt, "200 OK", .json, "{{\"error\":\"" ++ fmt ++ "\"}}", args);
}
fn sendJsonSuccess(sock: std.os.socket_t, opt: RequestOptions) !void {
    try sendHttpResponse(sock, opt, "200 OK", .json, "{\"error\":null}");
}

fn matchArg(arg: []const u8, comptime against: []const u8) ?[]const u8 {
    return if (std.mem.startsWith(u8, arg, against ++ "="))
        arg[against.len + 1..] else null;
}

fn sendHttpResponseFile(context: HandlerContext, sock: std.os.socket_t, opt: RequestOptions, path: []const u8) !void {
    std.debug.assert(path.len >= 2);
    std.debug.assert(path[0] == '/');
    const path_relative = path[1..];

    // TODO: dont' return error if file fails to open, send the error to the client instead
    const file = try context.server_root_dir.openFile(path_relative, .{});
    defer file.close();

    // TODO: dont' return error if this fails?
    const file_size = try file.getEndPos();
    const sock_writer = SocketWriter{ .context = sock };

    {
        const connection = if (opt.keep_alive) "keep-alive" else "close";
        var buf: [400]u8 = undefined;
        const headers = std.fmt.bufPrint(
            &buf,
            "HTTP/1.1 200 OK\r\nConnection: {s}\r\nContent-Length: {}\r\n\r\n",
            .{ connection, file_size },
        ) catch unreachable;
        std.log.info("Sending file '{s}', header is {} bytes", .{path, headers.len});
        try sock_writer.writeAll(headers);
    }

    // TODO: use sendfile when possible
    var buf: [std.mem.page_size]u8 = undefined;
    var remaining = file_size;
    while (remaining > 0) {
        const next_len = std.math.min(remaining, buf.len);

        // TODO: handle errors better
        const len = try file.read(&buf);
        if (len == 0) {
            std.log.err("file read returned 0 with {} bytes left", .{remaining});
            return error.GotEofBeforeExpectedEndOfFile;
        }
        //std.log.info("sending {} bytes", .{len});
        try sock_writer.writeAll(buf[0 .. len]);
        remaining -= next_len;
    }
}
