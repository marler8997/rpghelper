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

"saveDefs": {
    "fortitude":{"ability":"constitution",'displayName':"Fortitude"},
    "reflex":{"ability":"dexterity","displayName":"Reflex"},
    "will":{"ability":"wisdom","displayName":"Will"}
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
},

"armorTypes":[
    "unarmored","light","medium","heavy"
],

"armorDefs":{
    "noArmor":{"type":"unarmored","acBonus":0,"dexCap":null,"checkPenalty":0,"speedPenalty":0,"strength":0,"bulk":0,"group":null,"traits":null}
    ,"scaleMail":{"type":"medium","acBonus":4,"dexCap":2,"checkPenalty":-2,"speedPenalty":-5,"strength":14,"bulk":2,"group":"leather","traits":null}
}

};
})();