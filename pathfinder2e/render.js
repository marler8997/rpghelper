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

function modifierString(mod) {
    if (mod >= 0) return "+" + mod;
    return mod.toString();
}

function renderModifier(mod) {
    return '<span class="ModifierSpan Tooltip">' + modifierString(mod) + '</span>';
}
function renderStat(stat, ops) {
    return '<span class="StatSpan Tooltip">' + stat +
        '<div class="TooltipText">' +
            '<pre class="OpsTooltipPre">' + opsToTextBlock(ops) + '</pre>' +
        '</div>' +
    '</span>';
}


function renderTooltip(content, tooltip) {
    return '<div class="Tooltip">' + content +
        '<span class="TooltipText">' + tooltip + '</span></div>';
}
function renderOpsTooltip(content, ops) {
    return renderTooltip(content, '<pre class="OpsTooltipPre">' + opsToTextBlock(ops) + '</pre>')
}

function span(class_, content) { return '<span class="' + class_ + '">' + content + '</span>'; }
function labelValue(label, value) { return span("Label", label) + span("Value", value); }

function opsToTextBlock(ops) {
    if (ops.length == 0) return "No Operations";
    var text = '';
    var i = 0;
    for (i = 0; i < ops.length; i++) {
        text += JSON.stringify(ops[i]) + '\n';
    }
    return text;
}

var abilityMap = {
    "strength": {
        "displayName": "STR",
    },
    "dexterity": {
        "displayName": "DEX",
    },
    "constitution": {
        "displayName": "CON",
    },
    "intelligence": {
        "displayName": "INT",
    },
    "wisdom": {
        "displayName": "WIS",
    },
    "charisma": {
        "displayName": "CHA",
    },
};


var RenderException = function (message) {
    return new Error(message);
}
RenderException.prototype = Object.create(Error.prototype);

function enforceProp(obj, name, context) {
    if (name in obj) return obj[name];
    throw new analyze.RenderException(context + ' missing the "' + name + '" property')
}

return {

opsToTextBlock: opsToTextBlock,

go: function(data) {
    html = ''
    html += '<div class="CharacterDiv">';


    html += '<div class="CharacterIdentityDiv">';
    html +=     '<div class="NameXpDiv">';
    html +=         '<div class="RowDiv FieldDiv characterNameDiv">'+ labelValue("Character Name", data.characterName) + '</div>';
    html +=         '<div class="RowDiv FieldDiv playerNameDiv">' + labelValue("Player Name", data.playerName) + '</div>';
    html +=         '<div class="RowDiv FieldDiv xpDiv">' + labelValue("Experience Points (XP)", "TODO") + '</div>';
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
    html +=         '<div class="RowDiv FieldDiv heroPointsDiv">' + labelValue("Hero Points", "?") + '</div>';
    html +=     '</div>';
    html += '</div>';
    html += '<div class="hpDiv">HP: ' + data.hp.current + " / ";
    html +=     renderOpsTooltip(data.hp.max, data.hp.ops);
    html += '</div>';
    html += '<h3>Speed: ' + renderOpsTooltip(data.speed.value,  data.speed.ops) + '</h3>';


    html += '<div class="MainStatsDiv">';
    html +=     '<div class="AbilityScoresBlockDiv BlockDiv">';
    html +=         '<div class="BlockTitleDiv">Ability Scores</div>';
    html +=         '<div class="AbilityScoresContentDiv BlockContentDiv">';
    for (var name in abilityMap) {
        var info = abilityMap[name];
        var charObj = data[name];
        var modifier = Math.floor( (charObj.value - 10) / 2);
        html += '<div class="BlockRowDiv">'
        html +=     renderModifier(modifier);
        html +=     ' <span>' + info.displayName + '</span>';
        html +=     '<span class="ScoreSpan">' + renderStat(charObj.value, charObj.ops) + '</span>';
        html += '</div>'
    }
    html +=         '</div>';
    html +=     '</div>';
    html += '</div>';


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

    // TODO: fully implement skills
    html += '<br/><br/>';
    html += '<div class="SkillsBlockDiv BlockDiv">';
    html +=     '<div class="BlockTitleDiv">Skills</div>';
    html +=     '<div class="SkillsContentDiv BlockContentDiv">';
    for (var skillName in common.skillDefs) {
        var skill = data[skillName];
        var skillDef = common.skillDefs[skillName];
        if (skill.proficiency == "untrained" && skillDef.optional)
            continue;
        html += '<div class="TempSkillRow"><span class="SkillLabel">' + camelCaseToDisplayName(skillName) + '</span>';
        html += renderOpsTooltip(skill.proficiency, skill.ops);
        html += '</div>';
    }
    html +=     '</div>';
    html += '</div>'; // SkillsDiv

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