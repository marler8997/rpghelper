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


function renderTooltipCommon(type, extraClasses, content, tooltip) {
    return '<' + type + ' class="Tooltip ' + extraClasses + '">' + content +
        '<div class="TooltipText">' + tooltip + '</div></' + type + '>';
}
function renderTooltip(extraClasses, content, tooltip) {
    return renderTooltipCommon('span', 'SpanTooltip ' + extraClasses, content, tooltip);
}
function renderDivTooltip(extraClasses, content, tooltip) {
    return renderTooltipCommon('div', extraClasses, content, tooltip);
}

function span(class_, content) { return '<span class="' + class_ + '">' + content + '</span>'; }
function labelValue(label, value) { return span("Label", label) + span("Value", value); }

function opsToText(ops) {
    if (ops.length == 0) return "No Operations";
    var text = '';
    var i = 0;
    for (i = 0; i < ops.length; i++) {
        text += ops[i].line + '\n';
    }
    return text;
}
function opsToPre(ops) {
    return '<pre class="OpsTooltipPre">' + opsToText(ops) + '</pre>';
}

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
    for (var name in common.abilityDefs) {
        var abilityDef = common.abilityDefs[name];
        var abilityObj = data.abilities[name];
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
        var skill = data.skills[skillName];
        var skillDef = common.skillDefs[skillName];
        if (skill.proficiency == "untrained" && skillDef.optional)
            continue;
        var abilityObj = data.abilities[skillDef.key];
        var abilityMod = abilityScoreToModifier(abilityObj.score);
        var profMod = getProficiencyModifier(data.level, skill.proficiency, 'for the "' + skillName + '" skill');
        html += '<div class="BlockRowDiv StatRowDiv">';
        html +=     span('Span OneLine SkillLabel', camelCaseToDisplayName(skillName));
        html +=     span('Span OneLine BoxSpan ModifierSpan Curved', getModifierString(profMod + abilityMod));
        html +=     span('Span OneLine',  '&nbsp;=&nbsp;');
        html +=     span('Span TwoLine BoxSpan TwoLineBoxSpan', common.abilityDefs[skillDef.key].displayName + '<br/>' + getModifierString(abilityMod));
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
    var abilityMod = abilityScoreToModifier(data.abilities[abilityName].score);
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
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan', common.abilityDefs[abilityName].displayName + '<br/>' + getModifierString(abilityMod));
    html +=             renderTooltip('', span('Span TwoLine BoxSpan TwoLineBoxSpan', 'Prof<br/>' + getModifierString(profMod)) +
                            data.classDC.proficiency,
                            opsToPre(data.classDC.ops));
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    return html;
}
function renderArmorClass(data) {
    var dexMod = abilityScoreToModifier(data.abilities.dexterity.score);
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
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan' + dexAppliedClass, 'DEX<br/>' + getModifierString(dexMod));
    html +=             span('Span OneLine',  '&nbsp;or&nbsp;');
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan' + capAppliedClass, 'CAP<br/>' + capString);
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan', 'Prof<br/>' + getModifierString(profMod));
    html +=             renderTooltip('Span OneLine', equippedArmorSkill.proficiency, opsToPre(equippedArmorSkill.ops));
    html +=             renderTooltip('Span TwoLine BoxSpan TwoLineBoxSpan', 'Item<br/>' + getModifierString(itemBonus), armorTooltip);
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
    var i = 0;
    for (var saveName in common.saveDefs) {
        i += 1;
        var saveDef = common.saveDefs[saveName];
        var saveObj = data[saveName];
        var abilityDef = common.abilityDefs[saveDef.ability];
        var abilityMod = abilityScoreToModifier(data.abilities[saveDef.ability].score);
        var profMod = getProficiencyModifier(data.level, saveObj.proficiency, '');
        var total = abilityMod + profMod;
        html +=         '<div class="Column Column' + i + '">';
        html +=             '<div class="Centered">' + saveDef.displayName + '</div>';
        html +=             '<div class="BlockRowDiv StatRowDiv Centered">';
        html +=                 span('Span OneLine BoxSpan ModifierSpan Curved', total);
        html +=             '</div>';
        html +=             '<div class="BlockRowDiv StatRowDiv Centered">';
        html +=                 span('Span TwoLine BoxSpan TwoLineBoxSpan', abilityDef.displayName + '<br/>' + getModifierString(abilityMod));
        html +=                 renderTooltip('Span TwoLine BoxSpan TwoLineBoxSpan', 'Prof<br/>' + getModifierString(profMod), opsToPre(saveObj.ops));
        html +=             '</div>';
        html +=             '<div class="BlockRowDiv StatRowDiv Centered">';
        html +=                 span('Span OneLine', saveObj.proficiency);
        html +=             '</div>';
        html +=         '</div>';
    }
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
function renderFeatsList(className, title, featList) {
    html = '';
    html +=     '<div class="BlockDiv ' + className + 'BlockDiv">';
    html +=         '<div class="BlockTitleDiv">' + title + '</div>';
    html +=         '<div class="BlockContentDiv ' + className + 'ContentDiv ">';
    for (var i = 0; i < featList.length; i++) {
        var feat = featList[i];
        html += renderDivTooltip('FieldDiv', feat.name, opsToPre([feat.op]));
    }
    html +=         '</div>';
    html +=     '</div>';
    return html;
}
function renderSpellAttackRollBlock(data) {
    var keyAbilityObj = data.abilities[data.keyAbility];
    var keyAbilityDef = common.abilityDefs[data.keyAbility];
    var profMod = getProficiencyModifier(data.level, data.spellAttack.proficiency, '');
    var keyAbilityMod = abilityScoreToModifier(keyAbilityObj.score);
    var total = keyAbilityMod + profMod;
    html = '';
    html += '<div class="BlockDiv SpellAttackRollBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Spell Attack Roll</div>';
    html +=     '<div class="BlockContentDiv SpellAttackRollContentDiv ">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=             span('Span OneLine BoxSpan ModifierSpan Curved', total);
    html +=             span('Span OneLine',  '&nbsp;=&nbsp;');
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan', keyAbilityDef.displayName + '<br/>' + getModifierString(keyAbilityMod));
    html +=             renderTooltip('', span('Span TwoLine BoxSpan TwoLineBoxSpan', 'Prof<br/>' + getModifierString(profMod))
                                          + data.spellAttack.proficiency,
                                      opsToPre(data.spellAttack.ops));
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    return html;
}
function renderSpellDCBlock(data) {
    var keyAbilityObj = data.abilities[data.keyAbility];
    var keyAbilityDef = common.abilityDefs[data.keyAbility];
    var profMod = getProficiencyModifier(data.level, data.spellDC.proficiency, '');
    var keyAbilityMod = abilityScoreToModifier(keyAbilityObj.score);
    var total = 10 + keyAbilityMod + profMod;
    html = '';
    html += '<div class="BlockDiv SpellDCBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Spell DC</div>';
    html +=     '<div class="BlockContentDiv SpellDCContentDiv ">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=             span('Span OneLine BoxSpan ModifierSpan Curved', total);
    html +=             span('Span OneLine',  '&nbsp;=&nbsp;');
    html +=             span('Span TwoLine Centered', 'BASE<br/>10');
    html +=             span('Span TwoLine BoxSpan TwoLineBoxSpan', keyAbilityDef.displayName + '<br/>' + getModifierString(keyAbilityMod));
    html +=             renderTooltip('', span('Span TwoLine BoxSpan TwoLineBoxSpan', 'Prof<br/>' + getModifierString(profMod))
                                          + data.spellDC.proficiency,
                                      opsToPre(data.spellDC.ops));
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
    html +=         '<div class="RowDiv FieldDiv deityDiv">' + labelValue("Deity", camelCaseToDisplayName(data.deity)) + '</div>';
    html +=     '</div>';
    html +=     '<div class="LevelDiv">';
    html +=         '<div class="RowDiv FieldDiv levelDiv">' + labelValue("Level", "1") + '</div>';
    html +=         '<div class="RowDiv FieldDiv heroPointsDiv">' + labelValue("Hero Points", data.heroPoints.value) + '</div>';
    html +=     '</div>';
    html += '</div>';


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
    html += '<div class="BlockDiv SpeedBlockDiv">';
    html +=     '<div class="BlockContentDiv">';
    html +=         '<div class="BlockRowDiv StatRowDiv">';
    html +=             span('Span OneLine', 'Speed: ');
    html +=             renderTooltip('Span OneLine BoxSpan ModifierSpan Curved', data.speed.value,  opsToPre(data.speed.ops));
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';
    html += '<br/>';
    html += renderSkillsBlock(data);

    html += '<div class="BlockDiv LanguagesBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Languages</div>';
    html +=     '<div class="BlockContentDiv LanguagesContentDiv ">';
    html +=         renderTooltip('', data.languages.names.join(", "), opsToPre(data.languages.ops));
    html +=     '</div>';
    html += '</div>';

    html += '<div class="FeatsDiv">';
    html +=     '<div class="FeatsLeftDiv">';
    html +=         renderFeatsList('AncestryFeatsAndAbilities', 'Ancestry Feats And Abilities', data.feats.ancestry);
    html +=         renderFeatsList('SkillFeats', 'Skill Feats', data.feats.skill);
    html +=     '</div>';
    html +=     '<div class="FeatsRightDiv">';
    html +=         renderFeatsList('ClassFeatsAndAbilities', 'Class Feats And Abilities', data.feats.class);
    html +=     '</div>';
    html += '</div>'; // FeatsDiv

    // TODO: fully implement reactions info
    html += '<br/><br/>';
    html += '<div class="BlockDiv ReactionsBlockDiv">';
    html +=     '<div class="BlockTitleDiv">Reactions</div>';
    html +=     '<div class="BlockContentDiv ReactionsContentDiv">';
    for (var i = 0; i < data.reactions.names.length; i++) {
        var name = data.reactions.names[i];
        html +=         '<div>' + name + '</div>';
    }
    html +=     '</div>';
    html += '</div>'; // ReactionsDiv

    html += '<div class="SpellSectionDiv">';
    html += renderSpellAttackRollBlock(data);
    html += renderSpellDCBlock(data);
    html += '</div>'; // SpellSectionDiv

    html += '</div>'; // CharacterDiv
    return html;
}

};
})();