var render = (function() {


    /*
function toTitleCase(s) {
    s = str.toLowerCase().split(' ');
    for (var i = 0; i < s.length; i++) {
        s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1);
    }
    return s.join(' ');
}
*/
var A_CHARCODE = 'A'.charCodeAt(0);
var Z_CHARCODE = 'Z'.charCodeAt(0);
function charCodeIsUpperCase(c) {
    return c < Z_CHARCODE && c >= A_CHARCODE;
}

function camelCaseToDisplayName(s) {
    if (s.length == 0) return "";
    var nextPartIndex = 0;
    var parts = [];
    var prefix = '';
    for (var i = 0;; i++) {
        var atEnd = i >= s.length;
        if (atEnd || charCodeIsUpperCase(s.charCodeAt(i))) {
            parts.push(prefix +
                s.substring(nextPartIndex, nextPartIndex + 1).toUpperCase() +
                s.substring(nextPartIndex + 1, i))
            if (atEnd) break;
            nextPartIndex = i;
            prefix = ' ';
        }
    }
    return parts.join(' ');
}

function getModifierString(mod) {
    if (!Number.isInteger(mod)) throw new RenderException('the value "' + mod + '" is not a valid modifier');
    if (mod >= 0) return "+" + mod;
    return mod.toString();
}

function span(class_,content) {
    return '<span class="' + class_ + '">' + content + '</span>';
}
function renderStatAndOps(extraClasses, stat, ops) {
    return '<span class="Tooltip ' + extraClasses + '">' + stat +
        '<div class="TooltipText">' + opsToPre(ops) + '</div>' +
    '</span>';
}


function renderTooltip(extraClasses, content, tooltip) {
    return '<span class="Tooltip ' + extraClasses + '">' + content +
        '<div class="TooltipText">' + tooltip + '</div></span>';
}
function renderOpsTooltip(content, ops) {
    return renderTooltip('', content, opsToPre(ops))
}

function span(class_, content) { return '<span class="' + class_ + '">' + content + '</span>'; }
function labelValue(label, value) { return span("Label", label) + span("Value", value); }

function opsToText(ops) {
    if (ops.length == 0) return "No Operations";
    var text = '';
    var i = 0;
    for (i = 0; i < ops.length; i++) {
        text += JSON.stringify(ops[i]) + '\n';
    }
    return text;
}
function opsToPre(ops) {
    return '<pre class="OpsTooltipPre">' + opsToText(ops) + '</pre>';
}

// TODO: rename to abilityDefMap
var abilityMap = {
    "strength": {"displayName": "STR"},
    "dexterity": {"displayName": "DEX"},
    "constitution": {"displayName": "CON"},
    "intelligence": {"displayName": "INT"},
    "wisdom": {"displayName": "WIS"},
    "charisma": {"displayName": "CHA"},
};


var RenderException = function (message) {
    return new Error(message);
}
RenderException.prototype = Object.create(Error.prototype);

function enforceProp(obj, name, context) {
    if (name in obj) return obj[name];
    throw new RenderException(context + ' missing the "' + name + '" property')
}

function getProficiencyModifier(level, prof, context) {
    var def = common.tryLookupProficiencyDef(prof);
    if (def) return level * def.levelMult + def.bonus;
    throw new RenderException(context + ' found invalid proficiency "' + prof +
        '" expected untrained, trained, expert, master or legendary');
}

function abilityScoreToModifier(score) { return Math.floor( (score - 10) / 2); }

function renderAbilityScoresBlock(data) {
    html = '';
    html += '<div class="BlockDiv AbilityScoresBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Ability Scores</div>';
    html +=     '<div class="BlockContentDiv AbilityScoresContentDiv">';
    for (var name in abilityMap) {
        var abilityDef = abilityMap[name];
        var abilityObj = data[name];
        var modifier = abilityScoreToModifier(abilityObj.score);
        html += '<div class="BlockRowDiv StatRowDiv">'
        html +=     span('Span OneLine BoxSpan ModifierSpan Curved', getModifierString(modifier));
        html +=     span('Span OneLine AbilityLabel', abilityDef.displayName);
        html +=     renderTooltip('Span OneLine BoxSpan ModifierSpan', abilityObj.score, opsToPre(abilityObj.ops));
        html += '</div>'
    }
    html +=     '</div>';
    html += '</div>';
    return html;
}
function renderSkillsBlock(data) {
    html = '';
    html += '<div class="BlockDiv SkillsBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Skills</div>';
    html +=     '<div class="BlockContentDiv SkillsContentDiv">';
    for (var skillName in common.skillDefs) {
        var skill = data[skillName];
        var skillDef = common.skillDefs[skillName];
        if (skill.proficiency == "untrained" && skillDef.optional)
            continue;
        var abilityObj = data[skillDef.key];
        var abilityMod = abilityScoreToModifier(abilityObj.score);
        var profMod = getProficiencyModifier(data.level, skill.proficiency, 'for the "' + skillName + '" skill');
        html += '<div class="BlockRowDiv StatRowDiv">';
        html +=     span('Span OneLine SkillLabel', camelCaseToDisplayName(skillName));
        html +=     span('Span OneLine BoxSpan ModifierSpan Curved', getModifierString(profMod + abilityMod));
        html +=     span('Span OneLine',  '&nbsp;=&nbsp;');
        html +=     span('Span TwoLine BoxSpan TwoLineBoxSpan', abilityMap[skillDef.key].displayName + '<br/>' + getModifierString(abilityMod));
        html +=     span('Span TwoLine BoxSpan TwoLineBoxSpan Proficiency', 'Prof<br/>' + getModifierString(profMod));
        html +=     renderTooltip('', skill.proficiency, opsToPre(skill.ops));
        html += '</div>';
    }
    html +=     '</div>';
    html += '</div>';
    return html;
}
function renderClassDCBlock(data) {
    var abilityName = data.keyAbility;
    var abilityMod = abilityScoreToModifier(data[abilityName].score);
    var profMod = getProficiencyModifier(data.level, data.classDC.proficiency, '');
    var classDC = 10 + abilityMod + profMod;
    html = '';
    html += '<div class="BlockDiv ClassDCBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Class DC</div>';
    html +=     '<div class="BlockContentDiv ClassDCContentDiv">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=             span('Span OneLine BoxSpan ModifierSpan', classDC);
    html +=             span('Span OneLine',  '&nbsp;=&nbsp;');
    html +=             span('Span TwoLine Centered', 'BASE<br/>10');
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan', abilityMap[abilityName].displayName + '<br/>' + getModifierString(abilityMod));
    html +=             renderTooltip('', span('Span TwoLine BoxSpan TwoLineBoxSpan', 'Prof<br/>' + getModifierString(profMod)) +
                            data.classDC.proficiency,
                            opsToPre(data.classDC.ops));
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    return html;
}

function renderArmorClass(data) {
    var dexMod = abilityScoreToModifier(data.dexterity.score);
    var dexOrCap = dexMod;
    var dexAppliedClass = '';
    var capAppliedClass = ' DisabledBox';
    var itemBonus = 0;
    armorDef = common.armorDefs[data.equippedArmor.id];
    var armorTooltip = '<pre>' + data.equippedArmor.id + ': ' + JSON.stringify(armorDef) + '</pre>';

    var capString = ''; // todo get real cap
    if (armorDef.dexCap != null) {
        capString = getModifierString(armorDef.dexCap);
        if (armorDef.dexCap < dexMod) {
            dexOrCap = armorDef.dexCap;
            dexAppliedClass = ' DisabledBox';
            capAppliedClass = '';
        }
    }
    itemBonus = armorDef.acBonus;
    var equippedArmorSkill = data.armorSkills[armorDef.type];
    var profMod = getProficiencyModifier(data.level, equippedArmorSkill.proficiency, '');
    var ac = 10 + dexOrCap + profMod + itemBonus;

    html = '';
    html += '<div class="BlockDiv ArmorClassBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Armor Class</div>';
    html +=     '<div class="BlockContentDiv ArmorClassContentDiv">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=             span('Span OneLine BoxSpan ModifierSpan Curved', ac);
    html +=             span('Span OneLine',  '&nbsp;=&nbsp;');
    html +=             span('Span TwoLine Centered', 'BASE<br/>10');
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan' + dexAppliedClass, span('', 'DEX<br/>' + getModifierString(dexMod)));
    html +=             span('Span OneLine',  '&nbsp;or&nbsp;');
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan' + capAppliedClass, span('', 'CAP<br/>' + capString));
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan', span('', 'Prof<br/>' + getModifierString(profMod)));
    html +=             renderTooltip('Span OneLine', equippedArmorSkill.proficiency, opsToPre(equippedArmorSkill.ops));
    html +=             renderTooltip('Span TwoLine BoxSpan TwoLineBoxSpan', span('', 'Item<br/>' + getModifierString(itemBonus)), armorTooltip);
    html +=         '</div>';
    for (var i = 0; i < common.armorTypes.length; i++) {
        var armorType = common.armorTypes[i];
        var armorSkill = data.armorSkills[armorType];
        html +=         '<div class="ArmorSkillDiv">';
        html +=         span('Type', armorType + ': ');
        html +=         renderTooltip('', armorSkill.proficiency, opsToPre(armorSkill.ops));
        html +=         '</div>';
    }
    html +=     '</div>';
    html += '</div>';
    return html;
}
function renderSavingThrows(data) {
    html = '';
    html += '<div class="BlockDiv SavingThrowsBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Saving Throws</div>';
    html +=     '<div class="BlockContentDiv SavingThrowsContentDiv">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    return html;
}
function renderHitPoints(data) {
    html = '';
    html += '<div class="BlockDiv HitPointsBlockDiv">';
    html +=     '<div class="BlockTitleDiv">HitPoints</div>';
    html +=     '<div class="BlockContentDiv HitPointsContentDiv">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=             renderTooltip('Span OneLine BoxSpan BigText CurrentHPSpan', data.currentHP.value, opsToPre(data.currentHP.ops));
    html +=             span("", '&nbsp;/&nbsp;');
    html +=             renderTooltip('Span OneLine BoxSpan BigText MaxHPSpan', data.maxHP.value, opsToPre(data.maxHP.ops));
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    return html;
}

return {

    opsToPre: opsToPre,

go: function(data) {
    html = ''
    html += '<div class="CharacterDiv">';


    html += '<div class="CharacterIdentityDiv">';
    html +=     '<div class="ImageDiv">';
    html +=         '<img src="' + data.image + '" alt="Character Image" />';
    html +=     '</div>';
    html +=     '<div class="NameXpDiv">';
    html +=         '<div class="RowDiv FieldDiv characterNameDiv">'+ labelValue("Character Name", data.characterName) + '</div>';
    html +=         '<div class="RowDiv FieldDiv playerNameDiv">' + labelValue("Player Name", data.playerName) + '</div>';
    html +=         '<div class="RowDiv FieldDiv xpDiv">' + labelValue("Experience Points (XP)", data.xp.value) + '</div>';
    html +=     '</div>';
    html +=     '<div class="AncestryDiv">';
    html +=         '<div class="RowDiv FieldDiv ancestryAndHeritageDiv">';
    html +=             labelValue("Ancestry and Heritage", camelCaseToDisplayName(data.ancestryAndHeritage)) + '</div>';
    html +=         '<div class="RowDiv FieldDiv backgroundDiv">' + labelValue("Background", camelCaseToDisplayName(data.background)) + '</div>';
    html +=         '<div class="RowDiv FieldDiv classDiv">' + labelValue("Class", camelCaseToDisplayName(data.class)) + '</div>';
    html +=         '<div class="RowDiv SizeAlignmentTraitsDiv">';
    html +=             '<div class="FieldDiv sizeDiv">' + labelValue("Size", data.size) + '</div>';
    html +=             '<div class="FieldDiv alignmentDiv">' + labelValue("Alignment", "TODO") + '</div>';
    html +=             '<div class="FieldDiv traitsDiv">' + labelValue("Traits", data.traits) + '</div>';
    html +=         '</div>';
    html +=         '<div class="RowDiv FieldDiv deityDiv">' + labelValue("Deity", "TODO") + '</div>';
    html +=     '</div>';
    html +=     '<div class="LevelDiv">';
    html +=         '<div class="RowDiv FieldDiv levelDiv">' + labelValue("Level", "1") + '</div>';
    html +=         '<div class="RowDiv FieldDiv heroPointsDiv">' + labelValue("Hero Points", data.heroPoints.value) + '</div>';
    html +=     '</div>';
    html += '</div>';
    html += '<h3>Speed: ' + renderOpsTooltip(data.speed.value,  data.speed.ops) + '</h3>';


    html += '<div class="MainStatsDiv">';
    html +=     '<div class="Column1">';
    html +=         renderAbilityScoresBlock(data);
    html +=         renderClassDCBlock(data);
    html +=     '</div>';
    html +=     '<div class="Column2">';
    html +=         renderArmorClass(data);
    html +=         renderSavingThrows(data);
    html +=     '</div>';
    html +=     '<div class="Column3">';
    html +=         renderHitPoints(data);
    html +=     '</div>';
    html += '</div>';

    html += '<br/>';
    html += renderSkillsBlock(data);

    html += '<h5>Languages: ' + renderOpsTooltip(data.languages.names.join(", "), data.languages.ops) + '</h5>';

    html += '<div class="FeatsDiv">';
    html += '<div class="FeatsLeftDiv">';
    html +=     '<div class="AncestryFeatsAndAbilitiesBlockDiv BlockDiv">';
    html +=         '<div class="BlockTitleDiv">Ancestry Feats And Abilities</div>';
    html +=         '<div class="AncestryFeatsAndAbilitiesContentDiv BlockContentDiv">';
    for (var i = 0; i < data.ancestryFeats.length; i++) {
        var feat = data.ancestryFeats[i];
        html +=         '<div class="FieldDiv">' + feat + '</div>';
    }
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    html += '<div class="FeatsRightDiv">';
    html +=     '<div class="ClassFeatsAndAbilitiesBlockDiv BlockDiv">';
    html +=         '<div class="BlockTitleDiv">Class Feats And Abilities</div>';
    html +=         '<div class="ClassFeatsAndAbilitiesContentDiv BlockContentDiv">';
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    html += '</div>'; // FeatsDiv

    // TODO: fully implement reactions info
    html += '<br/><br/>';
    html += '<div class="ReactionsBlockDiv BlockDiv">';
    html +=     '<div class="BlockTitleDiv">Reactions</div>';
    html +=     '<div class="ReactionsContentDiv BlockContentDiv">';
    for (var i = 0; i < data.reactions.names.length; i++) {
        var name = data.reactions.names[i];
        html +=         '<div>' + name + '</div>';
    }
    html +=     '</div>';
    html += '</div>'; // ReactionsDiv



    html += '</div>'; // CharacterDiv
    return html;
}

};
})();