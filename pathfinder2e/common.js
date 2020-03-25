var common = (function() {

var proficiencyDefs = {
    "untrained": {"levelMult":0,"bonus":0},
    "trained"  : {"levelMult":1,"bonus":2},
    "expert"   : {"levelMult":1,"bonus":4},
    "master"   : {"levelMult":1,"bonus":6},
    "legendary": {"levelMult":1,"bonus":8},
};

return {


"proficiencyDefs": proficiencyDefs,

"tryLookupProficiencyDef": function tryLookupProficiencyDef(name) {
    return proficiencyDefs[name];
},

"skillDefs": {
    "perception": {"key":"wisdom","optional":false},
    "acrobatics": {"key":"dexterity","optional":false},
    "arcana": {"key":"intelligence","optional":false},
    "athletics": {"key":"strength","optional":false},
    "crafting": {"key":"intelligence","optional":false},
    "deception": {"key":"charisma","optional":false},
    "diplomacy": {"key":"charisma","optional":false},
    "intimidation": {"key":"charisma","optional":false},
    "dwarvenLore": {"key":"intelligence","optional":true},
    "theatreLore": {"key":"intelligence","optional":true},
    "medicine": {"key":"wisdom","optional":false},
    "nature": {"key":"wisdom","optional":false},
    "occultism": {"key":"intelligence","optional":false},
    "performance": {"key":"charisma","optional":false},
    "religion": {"key":"wisdom","optional":false},
    "society": {"key":"intelligence","optional":false},
    "stealth": {"key":"dexterity","optional":false},
    "survival": {"key":"wisdom","optional":false},
    "thievery": {"key":"dexterity","optional":false}
}

};
})();