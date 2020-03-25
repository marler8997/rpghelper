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

function analyzeOp(analyzedData, op)
{
    type = enforceProp(op, 'type', 'Inside an op');
    context = "Inside op type '" + type + "'";

    for (var i = 0; i < abilities.length; i++) {
        if (type == abilities[i]) {
            var ability = abilities[i];
            var mod = enforceProp(op, 'mod', context);
            var reason = enforceProp(op, 'reason', context);
            analyzedData[ability].score += mod;
            analyzedData[ability].ops.push(op);
            return;
        }
    }
    for (var skillName in common.skillDefs) {
        if (type == skillName) {
            var proficiency = enforceProp(op, 'proficiency', context);
            var reason = enforceProp(op, 'reason', context);
            analyzedData[skillName].proficiency = proficiency;
            analyzedData[skillName].ops.push(op);
            return;
        }
    }
    if (false) {
    } else if (type == 'comment') {
        // ignore
    } else if (type == 'hp') {
        var mod = enforceProp(op, 'mod', context);
        var reason = enforceProp(op, 'reason', context);
        analyzedData.hp.max += mod;
        analyzedData.hp.current += mod;
        analyzedData.hp.ops.push(op);
    } else if (type == 'classDC') {
        var proficiency = enforceProficiency(enforceProp(op, 'proficiency', context), context);
        var reason = enforceProp(op, 'reason', context);
        analyzedData.classDC.proficiency = proficiency;
        analyzedData.classDC.ops.push(op);
    } else if (type == 'speed') {
        var value = enforceProp(op, 'value', context);
        var reason = enforceProp(op, 'reason', context);
        analyzedData.speed.value = value;
        analyzedData.speed.ops.push(op);
    } else if (type == 'language') {
        var name = enforceProp(op, 'name', context);
        var reason = enforceProp(op, 'reason', context);
        analyzedData.languages.names.push(name);
        analyzedData.languages.ops.push(op);
    } else if (type == 'ancestryFeat') {
        var name = enforceProp(op, 'name', context);
        analyzedData.ancestryFeats.push(name);
    } else if (type == 'reaction') {
        var name = enforceProp(op, 'name', context);
        analyzedData.reactions.names.push(name);
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

function enforceProficiency(name, context) {
    if (name == "untrained") return name;
    if (name == "trained") return name;
    if (name == "expert") return name;
    if (name == "master") return name;
    if (name == "legendary") return name;
    throw new BadConfigException(context + ', found invalid proficiency name "' + name + '"');
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
    var analyzedData = {
        "ignoreme":null
        ,"level":1
        ,"characterName":enforceProp(jsonData, 'characterName', context)
        ,"playerName":enforceProp(jsonData, 'playerName', context)
        ,"ancestry":enforceProp(jsonData, 'ancestry', context)
        ,"ancestryAndHeritage":enforceProp(jsonData, 'ancestryAndHeritage', context)
        ,"background":enforceProp(jsonData, 'background', context)
        ,"class":enforceProp(jsonData, 'class', context)
        ,"keyAbility":enforceProp(jsonData, 'keyAbility', context)
        ,"size":enforceProp(jsonData, 'size', context)
        ,"alignment":enforceProp(jsonData, 'alignment', context)
        ,"traits":enforceProp(jsonData, 'traits', context)
        ,"deity":enforceProp(jsonData, 'deity', context)
        ,"hp": {
            "max": 0
            ,"current": 0
            ,"ops": []
        }
        ,"classDC":{"proficiency":"untrained",ops:[]}
        ,"speed": {"value":0,ops:[]}
        ,"languages": {names:[],ops:[]}
        ,"ancestryFeats":[]
        ,"reactions": {names:[]}
        ,"ops":jsonData.ops
    };
    for (var i = 0; i < abilities.length; i++) {
        analyzedData[abilities[i]] = {"score":10, ops:[]};
    }
    for (var skillName in common.skillDefs) {
        analyzedData[skillName] = {"proficiency":"untrained", ops:[]};
    }
    var ops = enforceProp(jsonData, 'ops', context);
    for (var i = 0; i < ops.length; i++) {
        analyzeOp(analyzedData, ops[i]);
    }
    return analyzedData;
}

};
})();