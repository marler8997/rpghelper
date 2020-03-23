var analyze = (function() {

// TODO: put this somewhere common
var abilities = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma"
];

function processOp(processedData, op)
{
    type = enforceProp(op, 'type', 'Inside an op');
    context = "Inside op type '" + type + "'";

    var i = 0;
    for (i = 0; i < abilities.length; i++) {
        var ability = abilities[i];
        if (type == abilities[i]) {
            var mod = enforceProp(op, 'mod', context);
            var reason = enforceProp(op, 'reason', context);
            processedData[ability].value += mod;
            processedData[ability].ops.push(op);
            return;
        }
    }
    if (false) {
    } else if (type == 'hp') {
        var mod = enforceProp(op, 'mod', context);
        var reason = enforceProp(op, 'reason', context);
        processedData.hp.max += mod;
        processedData.hp.current += mod;
        processedData.hp.ops.push(op);
    } else if (type == 'speed') {
        var value = enforceProp(op, 'value', context);
        var reason = enforceProp(op, 'reason', context);
        processedData.speed.value = value;
        processedData.speed.ops.push(op);
    } else if (type == 'language') {
        var name = enforceProp(op, 'name', context);
        var reason = enforceProp(op, 'reason', context);
        processedData.languages.names.push(name);
        processedData.languages.ops.push(op);
    } else {
        throw new BadConfigException('unknown op type "' + type + '"');
    }
}

var BadConfigException = function (message) {
    return new Error(message);
}
BadConfigException.prototype = Object.create(Error.prototype);

function enforceProp(obj, name, context) {
    if (name in obj) return obj[name];
    throw new BadConfigException(context + ', missing the "' + name + '" attribute')
}

//function passthrough(dst, src, name, context) {
//    dst[name] = enforceProp(src, name, context);
//}

return {


BadConfigException: BadConfigException,

go: function(jsonData) {
    var context = 'At the top-level';
    var system = enforceProp(jsonData, 'system', context);
    if (system == 'Pathfinder2e') {
        // good
    } else {
        throw new BadConfigException('unknown System "' + system + '"');
    }
    // TODO: get ancestry, generate ops from it
    var processedData = {
        "ignoreme":null
        ,"characterName":enforceProp(jsonData, 'characterName', context)
        ,"playerName":enforceProp(jsonData, 'playerName', context)
        ,"ancestry":enforceProp(jsonData, 'ancestry', context)
        ,"ancestryAndHeritage":enforceProp(jsonData, 'ancestryAndHeritage', context)
        ,"background":enforceProp(jsonData, 'background', context)
        ,"class":enforceProp(jsonData, 'class', context)
        ,"alignment":enforceProp(jsonData, 'alignment', context)
        ,"deity":enforceProp(jsonData, 'deity', context)
        ,"hp": {
            "max": 0
            ,"current": 0
            ,ops: []
        }
        ,"speed": {"value":0,ops:[]}
        ,"languages": {names:[],ops:[]}
        ,ops:jsonData.ops
    };
    var i = 0;
    for (i = 0; i < abilities.length; i++) {
        processedData[abilities[i]] = {"value":10, ops:[]};
    }
    var ops = enforceProp(jsonData, 'ops', context);
    var i = 0;
    for (i = 0; i < ops.length; i++) {
        processOp(processedData, ops[i]);
    }
    return processedData;
}

};
})();