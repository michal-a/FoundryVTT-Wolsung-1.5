import {wolsung} from "./config.mjs";
import {wolsungSettings} from "./settings.mjs";
import preloadWolsungTemplates from "./sheets/preloadWolsungTemplates.mjs";
import WolsungItemSheet from "./sheets/WolsungItemSheet.mjs";
import WolsungItem from "./documents/WolsungItem.mjs";
import WolsungActorSheet from "./sheets/WolsungActorSheet.mjs";
import WolsungActor from "./documents/WolsungActor.mjs";
import WolsungDiceTerm from "./rolls/WolsungDiceTerm.mjs";
import rollFromChatMessageWolsungCommand from "./rolls/WolsungRoll.mjs";
import WolsungCardConfig from "./cards/WolsungCardConfig.mjs";
import WolsungCards from "./cards/WolsungCards.mjs";
import WolsungCardsHand from "./cards/WolsungCardsHand.mjs";
import WolsungCardsDeck from "./cards/WolsungCardsDeck.mjs";
import WolsungCardsPile from "./cards/WolsungCardsPile.mjs";
import WolsungSessionStart from "./cards/WolsungSessionStart.mjs";
import WolsungCombat from "./combat/combat.mjs";
import WolsungCombatTracker from "./combat/combatTracker.mjs";


Hooks.once("init", function(){
    console.log("Wolsung | Initialising Wolsung 1.5 System");

    Die.prototype.__proto__ = WolsungDiceTerm.prototype;

    CONFIG.wolsung = wolsung;
    CONFIG.Item.documentClass = WolsungItem;
    CONFIG.Actor.documentClass = WolsungActor;
    CONFIG.Dice.termTypes.DiceTerm = WolsungDiceTerm;
    CONFIG.Cards.documentClass = WolsungCards;
    CONFIG.Combat.documentClass = WolsungCombat;
    CONFIG.ui.combat = WolsungCombatTracker;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("wolsung", WolsungItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("wolsung", WolsungActorSheet, {makeDefault: true});

    DocumentSheetConfig.unregisterSheet(Card, "core", CardConfig);
    DocumentSheetConfig.registerSheet(Card, "wolsung", WolsungCardConfig, {makeDefault: true});

    DocumentSheetConfig.unregisterSheet(Cards, "core", CardsHand);
    DocumentSheetConfig.registerSheet(Cards, "wolsung", WolsungCardsHand, {types: ["hand"], makeDefault: true});

    DocumentSheetConfig.unregisterSheet(Cards, "core", CardsConfig);
    DocumentSheetConfig.registerSheet(Cards, "wolsung", WolsungCardsDeck, {types: ["deck"], makeDefault: true});

    DocumentSheetConfig.unregisterSheet(Cards, "core", CardsPile);
    DocumentSheetConfig.registerSheet(Cards, "wolsung", WolsungCardsPile, {types: ["pile"], makeDefault: true});

    preloadWolsungTemplates();
    Object.keys(wolsungSettings).map(key => game.settings.register("wolsung", key, wolsungSettings[key]));
});

Hooks.on('chatMessage', (_, messageText, data) => {
    if (messageText !== undefined && messageText.startsWith('/wr')) {
        rollFromChatMessageWolsungCommand(messageText, data);
        return false;
    }
    else {
        return true;
    }
});

Hooks.on('chatMessage', (_, messageText, data) => {
    if (messageText !== undefined && messageText.startsWith('/wss')) {
        WolsungSessionStart(messageText, data);
        return false;
    }
    else {
        return true;
    }
});

Handlebars.registerHelper("cleartext", function(content){
    let result = "";
    result = content.replace(/<\/?[^>]+(>|$)/g, "");
    result = result.replaceAll("&oacute;", "ó");
    result = result.replaceAll("&nbsp;", " ");
    return result;
});

Handlebars.registerHelper("localizeCFG", function(variable, content){
    return game.i18n.localize(CONFIG['wolsung'][variable][content]);
});

Handlebars.registerHelper("localizeKey", function(variable, key){
    return game.i18n.localize(variable + "." + key)
});

Handlebars.registerHelper("initiative", function(initiative){
    let result = ""
    initiative = initiative.toString().split(".");
    if (initiative[0] == "11") initiative[0] = game.i18n.localize("wolsung.cards.initiative.jack");
    if (initiative[0] == "12") initiative[0] = game.i18n.localize("wolsung.cards.initiative.queen");
    if (initiative[0] == "13") initiative[0] = game.i18n.localize("wolsung.cards.initiative.king");
    if (initiative[0] == "14") initiative[0] = game.i18n.localize("wolsung.cards.initiative.ace");
    if (initiative[0] == "15") initiative[0] = game.i18n.localize("wolsung.cards.initiative.joker");
    result += initiative[0];
    if (initiative[1] == "40") result += "♠";
    if (initiative[1] == "30") result += "♥";
    if (initiative[1] == "20") result += "♦";
    if (initiative[1] == "10") result += "♣";
    return result;
});

Handlebars.registerHelper("cardHeight", function(){
    let result = 300 * game.settings.get("wolsung", "cardScale");
    result = result.toString() + "px";
    return result;
});

Handlebars.registerHelper("cardWidth", function(height, width){
    let result = 300 * width * game.settings.get("wolsung", "cardScale") / height;
    result = result.toString() + "px";
    return result;
});

Handlebars.registerHelper("gameSetting", function(namespace, key){
    return game.settings.get(namespace, key);
});