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

function enforcePositionalArgsCount(op, count, context) {
    if (op.positionalArgs.length != count)
        throw new BadConfigException(context + ', requires ' + count + ' positional args but got ' + op.positionalArgs.length);
}
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

    if (false) {
    } else if (directive == 'ability') {
        enforcePositionalArgsCount(op, 2, context);
        var ability = op.positionalArgs[0];
        var mod = op.positionalArgs[1];
        var reason = enforceProp(op, 'reason', context);
        d.abilities[ability].score += mod;
        d.abilities[ability].ops.push(op);
    } else if (directive == 'skill') {
        enforcePositionalArgsCount(op, 1, context);
        var skill = op.positionalArgs[0];
        var proficiency = enforceProp(op, 'proficiency', context);
        var reason = enforceProp(op, 'reason', context);
        d.skills[skill].proficiency = proficiency;
        d.skills[skill].ops.push(op);
    } else if (directive == 'xp') {
        enforcePositionalArgsCount(op, 1, context);
        var add = op.positionalArgs[0];
        var reason = enforceProp(op, 'reason', context);
        d.xp.value += add;
        d.xp.ops.push(op);
    } else if (directive == 'maxHP') {
        enforcePositionalArgsCount(op, 1, context);
        var mod = op.positionalArgs[0];
        var reason = enforceProp(op, 'reason', context);
        d.maxHP.value += mod;
        d.maxHP.ops.push(op);
        d.currentHP.value += mod;
        d.currentHP.ops.push(op);
    } else if (directive == 'currentHP') {
        enforcePositionalArgsCount(op, 0, context);
        var mod = enforceProp(op, 'mod', context);
        var reason = enforceProp(op, 'reason', context);
        d.currentHP.value += mod;
        d.currentHP.ops.push(op);
    } else if (directive == 'classDC') {
        enforcePositionalArgsCount(op, 0, context);
        var proficiency = enforceProficiency(enforceProp(op, 'proficiency', context), context);
        var reason = enforceProp(op, 'reason', context);
        setBiggerProficiency(d.classDC, proficiency);
        d.classDC.ops.push(op);
    } else if (directive == 'speed') {
        enforcePositionalArgsCount(op, 1, context);
        var value = op.positionalArgs[0];
        var reason = enforceProp(op, 'reason', context);
        d.speed.value = value;
        d.speed.ops.push(op);
    } else if (directive == 'language') {
        enforcePositionalArgsCount(op, 1, context);
        var name = op.positionalArgs[0];
        var reason = enforceProp(op, 'reason', context);
        d.languages.names.push(name);
        d.languages.ops.push(op);
    } else if (directive == 'feat') {
        enforcePositionalArgsCount(op, 2, context);
        var type = op.positionalArgs[0];
        var name = op.positionalArgs[1];
        var reason = enforceProp(op, 'reason', context);
        d.feats[type].push({'name':name,'op':op});
    } else if (directive == 'reaction') {
        enforcePositionalArgsCount(op, 0, context);
        var name = enforceProp(op, 'name', context);
        d.reactions.names.push(name);
    } else if (directive == 'armorSkill') {
        enforcePositionalArgsCount(op, 1, context);
        var armorType = op.positionalArgs[0];
        var proficiency = enforceProp(op, 'proficiency', context);
        var reason = enforceProp(op, 'reason', context);
        setBiggerProficiency(d.armorSkills[armorType], proficiency);
        d.armorSkills[armorType].ops.push(op);
    } else if (directive == 'equipArmor') {
        enforcePositionalArgsCount(op, 1, context);
        var id = op.positionalArgs[0];
        enforceProp(common.armorDefs, id, context + ', the armorDefs object');
        d.equippedArmor.id = id;
    } else if (directive == 'save') {
        enforcePositionalArgsCount(op, 1, context);
        var id = op.positionalArgs[0];
        var proficiency = enforceProp(op, 'proficiency', context);
        var reason = enforceProp(op, 'reason', context);
        setBiggerProficiency(d[id], proficiency);
        d[id].ops.push(op);
    } else {
        throw new BadConfigException('unknown op directive "' + directive + '"');
    }
}


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
        ,"abilities":{}
        ,"classDC":{"proficiency":"untrained","ops":[]}
        ,"speed": {"value":0,"ops":[]}
        ,"languages": {names:[],"ops":[]}
        ,"feats":{"ancestry":[],"class":[],"skill":[]}
        ,"skills":[]
        ,"reactions": {names:[]}
        ,"armorSkills":{}
        ,"money":{"p":0,"g":0,"s":0,"c":0}
        ,"equippedArmor":{"id":"noArmor"}
        ,"currentHP":{"value":0,"ops":[]}
        ,"ops":jsonData.ops
    };
    for (var i = 0; i < abilities.length; i++) {
        analyzedData.abilities[abilities[i]] = {"score":10, "ops":[]};
    }
    for (var saveName in common.saveDefs) {
        analyzedData[saveName] = {"proficiency":"untrained","ops":[]};
    }
    for (var skillName in common.skillDefs) {
        analyzedData.skills[skillName] = {"proficiency":"untrained", "ops":[]};
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