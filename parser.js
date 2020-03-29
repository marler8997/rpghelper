var parser = (function() {

var ParseError = function (message) {
    return new Error(message);
}
ParseError.prototype = Object.create(Error.prototype);

function convertUnquotedValue(value) {
    if (isNaN(value)) return value;
    return parseInt(value);
}

function parseLine(lineNum, line) {
    if (line.length == 0) return null;
    if (line.charAt(0) == '#') return null;
    var result = {
        "line":line,
        "directive":null,
        "positionalArgs":[],
        "namedArgs":{},
    };
    var directiveMatch = line.match(/^([a-zA-Z][a-zA-Z0-9]*)( |$)/)
    if (directiveMatch == null)
        throw new ParseError('line ' + lineNum + ' does not begin with [a-zA-Z][a-zA-Z0-9]: ' + line);
    result.directive = directiveMatch[1];
    remaining = line.substring(directiveMatch[0].length);

    // search for positional args
    while (true) {
        var unquotedValue = remaining.match(/^ *([a-zA-Z0-9-]+)( |$)/);
        if (unquotedValue != null) {
            result.positionalArgs.push(convertUnquotedValue(unquotedValue[1]));
            remaining = remaining.substring(unquotedValue[0].length);
        } else {
            var quotedMatch = remaining.match(/^"([^"]*)"( |$)/);
            if (quotedMatch == null) break;
            result.positionalArgs.push(quotedMatch[1]);
            remaining = remaining.substring(quotedMatch[0].length);
        }
    }
    // search for named args
    while (true) {
        var namedArgMatch = remaining.match(/^ *([a-zA-Z0-9]+)=/)
        if (namedArgMatch == null) break;

        var name = namedArgMatch[1];
        remaining = remaining.substring(namedArgMatch[0].length);
        var unquotedMatch = remaining.match(/^([a-zA-Z0-9-]+)( |$)/);
        if (unquotedMatch != null) {
            result.namedArgs[name] = convertUnquotedValue(unquotedMatch[1]);
            remaining = remaining.substring(unquotedMatch[0].length);
        } else {
            var quotedMatch = remaining.match(/^"([^"]*)"( |$)/);
            if (quotedMatch == null)
                throw new ParseError('line ' + lineNum + ' got "' + namedArgMatch[0] + '" but it was not followed by ' +
                    'an unquotedValue or a "quoted value": ' + line);
            result.namedArgs[name] = quotedMatch[1];
            remaining = remaining.substring(quotedMatch[0].length);
        }
    }

    if (remaining.length > 0)
        throw new ParseError('line ' + lineNum + ' contained unrecognized data at the end "' +
            remaining + '": ' + line);

    return result;
}

function checkLine(lineNum, line) {
    if (line.length > 0 && line.charAt(line.length - 1) == '\r')
        throw new ParseError('line ' + lineNum + ' ends with carriage return \\r');
}


return {

"go": function(text) {
    var data = {"ops":[]};
    lines = text.split('\n');
    var lineIndex = 0;
    // parse top-level config
    for(; lineIndex < lines.length; lineIndex++) {
        var line = lines[lineIndex];
        var lineNum = lineIndex + 1;
        checkLine(lineNum, line);

        parsed = parseLine(lineNum, line);
        if (parsed == null) continue;
        //console.log(JSON.stringify(parsed));
        if (parsed.directive == "startOperations") {
            lineIndex++;
            break;
        }
        if (parsed.directive in data)
            throw new ParseError('line ' + lineNum + ', the top-level "' + parsed.directive + '" value has already been configured');
        if (parsed.positionalArgs.length != 1)
            throw new ParseError('line ' + lineNum + ', all top-level configs should have 1 position value but got ' + parsed.positionalArgs.length + ': ' + line);
        //if (parsed.namedArgs.length != 0)
        //    throw new ParseError('line ' + lineNum + ', all top-level configs should have 0 named args but got ' + parsed.namedArgs.length + ': ' + line);
        data[parsed.directive] = parsed.positionalArgs[0];
    }
    // parse operations
    for(; lineIndex < lines.length; lineIndex++) {
        var line = lines[lineIndex];
        var lineNum = lineIndex + 1;
        checkLine(lineNum, line);

        parsed = parseLine(lineNum, line);
        if (parsed == null) continue;
        //console.log(JSON.stringify(parsed));
        //var op = parsed;
        var op = Object.assign({"directive":parsed.directive,"line":parsed.line,"positionalArgs":parsed.positionalArgs}, parsed.namedArgs);
        //console.log(JSON.stringify(op));
        data.ops.push(op);
    }
    return data;
}

};
})();