var render = (function() {

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

var ancestryAndHeritageMap = {
    "ancientBloodedDwarf" : {
        "displayName": "Ancient-Blooded Dwarf"
    }
};
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

function ancestryAndHeritageDisplayName(value) {
    return enforceProp(ancestryAndHeritageMap, value, 'ancestryAndHeritageMap is').displayName;
}


return {

opsToTextBlock: opsToTextBlock,

go: function(data) {
    html = ''
    html += '<div class="CharacterDiv">';


    html += '<div class="CharacterIdentityDiv">';
    html +=     '<div class="NameXpDiv">';
    html +=         '<div class="FieldDiv characterNameDiv">'+ labelValue("Character Name", data.characterName) + '</div>';
    html +=         '<div class="FieldDiv playerNameDiv">' + labelValue("Player Name", data.playerName) + '</div>';
    html +=         '<div class="FieldDiv xpDiv">' + labelValue("Experience Points (XP)", "TODO") + '</div>';
    html +=     '</div>';
    html +=     '<div class="AncestryDiv">';
    html +=         '<div class="FieldDiv ancestryAndHeritageDiv">';
    html +=             labelValue("Ancestry and Heritage", ancestryAndHeritageDisplayName(data.ancestryAndHeritage)) + '</div>';
    html +=         '<div class="FieldDiv backgroundDiv">' + labelValue("Background", data.background) + '</div>';
    html +=         '<div class="FieldDiv classDiv">' + labelValue("Class", data.class) + '</div>';
    html +=         '<div class="FieldDiv miscDiv">' + labelValue("Size/Alignment/Traits", "TODO") + '</div>';
    html +=         '<div class="FieldDiv deityDiv">' + labelValue("Deity", "TODO") + '</div>';
    html +=     '</div>';
    html +=     '<div class="LevelDiv">';
    html +=         '<div class="FieldDiv levelDiv">' + labelValue("Level", "??") + '</div>';
    html +=         '<div class="FieldDiv heroPointsDiv">' + labelValue("Hero Points", "??") + '</div>';
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
    html += '</div>'; // CharacterDiv
    return html;
}

};
})();