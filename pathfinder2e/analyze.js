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

function maxProficiency(left, right) {
    var leftDef = common.tryLookupProficiencyDef(left);
    if (!leftDef) throw new Error('proficiency "' + left + '" does not exist');
    var rightDef = common.tryLookupProficiencyDef(right);
    if (!rightDef) throw new Error('proficiency "' + right + '" does not exist');
    return (leftDef.bonus >= rightDef.bonus) ? left : right;
}
function setBiggerProficiency(obj, newProf) {
    obj.proficiency = maxProficiency(obj.proficiency, newProf);
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
    if (common.tryLookupProficiencyDef(name)) return name;
    throw new BadConfigException(context + ', found invalid proficiency name "' + name + '"');
}

function analyzeOp(d, op)
{
    directive = enforceProp(op, 'directive', 'Inside an op');
    context = "Inside directive '" + directive + "'";

    for (var i = 0; i < abilities.length; i++) {
        if (directive == abilities[i]) {
            var ability = abilities[i];
            var mod = enforceProp(op, 'mod', context);
            var reason = enforceProp(op, 'reason', context);
            d[ability].score += mod;
            d[ability].ops.push(op);
            return;
        }
    }
    for (var skillName in common.skillDefs) {
        if (directive == skillName) {
            var proficiency = enforceProp(op, 'proficiency', context);
            var reason = enforceProp(op, 'reason', context);
            d[skillName].proficiency = proficiency;
            d[skillName].ops.push(op);
            return;
        }
    }
    if (false) {
    } else if (directive == 'comment') {
        // ignore
    } else if (directive == 'xp') {
        var add = enforceProp(op, 'add', context);
        var reason = enforceProp(op, 'reason', context);
        d.xp.value += add;
        d.xp.ops.push(op);
    } else if (directive == 'maxHP') {
        var mod = enforceProp(op, 'mod', context);
        var reason = enforceProp(op, 'reason', context);
        d.maxHP.value += mod;
        d.maxHP.ops.push(op);
        d.currentHP.value += mod;
        d.currentHP.ops.push(op);
    } else if (directive == 'currentHP') {
        var mod = enforceProp(op, 'mod', context);
        var reason = enforceProp(op, 'reason', context);
        d.currentHP.value += mod;
        d.currentHP.ops.push(op);
    } else if (directive == 'classDC') {
        var proficiency = enforceProficiency(enforceProp(op, 'proficiency', context), context);
        var reason = enforceProp(op, 'reason', context);
        setBiggerProficiency(d.classDC, proficiency);
        d.classDC.ops.push(op);
    } else if (directive == 'speed') {
        var value = enforceProp(op, 'value', context);
        var reason = enforceProp(op, 'reason', context);
        d.speed.value = value;
        d.speed.ops.push(op);
    } else if (directive == 'language') {
        var name = enforceProp(op, 'name', context);
        var reason = enforceProp(op, 'reason', context);
        d.languages.names.push(name);
        d.languages.ops.push(op);
    } else if (directive == 'ancestryFeat') {
        var name = enforceProp(op, 'name', context);
        //var reason = enforceProp(op, 'reason', context);
        d.ancestryFeats.push(name);
    } else if (directive == 'classFeat') {
        var name = enforceProp(op, 'name', context);
        var reason = enforceProp(op, 'reason', context);
        d.classFeats.push(name);
    } else if (directive == 'skillFeat') {
        var name = enforceProp(op, 'name', context);
        var reason = enforceProp(op, 'reason', context);
        d.skillFeats.push(name);
    } else if (directive == 'reaction') {
        var name = enforceProp(op, 'name', context);
        d.reactions.names.push(name);
    } else if (directive == 'armorSkill') {
        var armorType = enforceProp(op, 'armorType', context);
        var proficiency = enforceProp(op, 'proficiency', context);
        var reason = enforceProp(op, 'reason', context);
        setBiggerProficiency(d.armorSkills[armorType], proficiency);
        d.armorSkills[armorType].ops.push(op);
    } else if (directive == 'equipArmor') {
        var id = enforceProp(op, 'id', context);
        enforceProp(common.armorDefs, id, context + ', the armorDefs object');
        d.equippedArmor.id = id;
    } else if (directive == 'saveProficiency') {
        var id = enforceProp(op, 'id', context);
        var proficiency = enforceProp(op, 'proficiency', context);
        var reason = enforceProp(op, 'reason', context);
        setBiggerProficiency(d[id], proficiency);
        d[id].ops.push(op);
    } else {
        throw new BadConfigException('unknown op directive "' + directive + '"');
    }
}


//function passthrough(dst, src, name, context) {
//    dst[name] = enforceProp(src, name, context);
//}

return {


BadConfigException: BadConfigException,

go: function(jsonData) {
    var context = 'At the top-level';
    var system = enforceProp(jsonData, 'system', context);
    if (system == 'pathfinder2e') {
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
        ,"xp":{"value":0,"ops":[]}
        ,"ancestry":enforceProp(jsonData, 'ancestry', context)
        ,"ancestryAndHeritage":enforceProp(jsonData, 'ancestryAndHeritage', context)
        ,"background":enforceProp(jsonData, 'background', context)
        ,"class":enforceProp(jsonData, 'class', context)
        ,"keyAbility":enforceProp(jsonData, 'keyAbility', context)
        ,"size":enforceProp(jsonData, 'size', context)
        ,"alignment":enforceProp(jsonData, 'alignment', context)
        ,"image":enforceProp(jsonData, 'image', context)
        ,"traits":enforceProp(jsonData, 'traits', context)
        ,"deity":enforceProp(jsonData, 'deity', context)
        ,"heroPoints":{"value":1,"ops":[]}
        ,"maxHP":{"value":0,"ops":[]}
        ,"currentHP":{"value":0,"ops":[]}
        ,"classDC":{"proficiency":"untrained","ops":[]}
        ,"speed": {"value":0,"ops":[]}
        ,"languages": {names:[],"ops":[]}
        ,"ancestryFeats":[]
        ,"classFeats":[]
        ,"skillFeats":[]
        ,"reactions": {names:[]}
        ,"armorSkills":{}
        ,"equippedArmor":{"id":"noArmor"}
        ,"ops":jsonData.ops
    };
    for (var i = 0; i < abilities.length; i++) {
        analyzedData[abilities[i]] = {"score":10, "ops":[]};
    }
    for (var saveName in common.saveDefs) {
        analyzedData[saveName] = {"proficiency":"untrained","ops":[]};
    }
    for (var skillName in common.skillDefs) {
        analyzedData[skillName] = {"proficiency":"untrained", "ops":[]};
    }
    for (var i = 0; i < common.armorTypes.length; i++) {
        var armorType = common.armorTypes[i];
        analyzedData.armorSkills[armorType] = {"proficiency":"untrained", "ops":[]};
    }
    var ops = enforceProp(jsonData, 'ops', context);
    for (var i = 0; i < ops.length; i++) {
        analyzeOp(analyzedData, ops[i]);
    }
    return analyzedData;
}

};
})();