var render = (function() {

function modifierString(mod) {
    if (mod >= 0) return "+" + mod;
    return mod.toString();
}

function renderTooltip(content, tooltip) {
    return '<div class="tooltip">' + content +
        '<span class="tooltiptext">' + tooltip + '</span>';
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
    html +=         '<div class="FieldDiv ancestryAndHeritageDiv">' + labelValue("Ancestry and Heritage", "TODO") + '</div>';
    html +=         '<div class="FieldDiv backgroundDiv">' + labelValue("Background", "TODO") + '</div>';
    html +=         '<div class="FieldDiv classDiv">' + labelValue("Class", "TODO") + '</div>';
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

    html += '<table>';
    var i = 0;
    for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        var attrObj = data[attr];
        var modifier = Math.floor( (attrObj.value - 10) / 2);
        html += '<tr><td>' + attr.substring(0,3).toUpperCase() + '</td><td><strong>' + modifierString(modifier) + '</strong></td><td>';
        html +=     renderOpsTooltip(attrObj.value, attrObj.ops);
        html += '</td></tr>';
    }
    html += '<table>';
    html += '<h5>Languages: ' + renderOpsTooltip(data.languages.names.join(", "), data.languages.ops) + '</h5>';
    html += '</div>'; // CharacterDiv
    return html;
}

};
})();