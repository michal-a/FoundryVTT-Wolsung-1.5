import {wolsung} from "./config.mjs";
import {wolsungSettings} from "./settings.mjs";
import registerHandlebars from "./handlebars.mjs";
import loadWolsung from "./load.mjs";
import preloadWolsungTemplates from "./sheets/preloadWolsungTemplates.mjs";
import WolsungItemSheet from "./sheets/WolsungItemSheet.mjs";
import WolsungItem from "./documents/WolsungItem.mjs";
import WolsungActorSheet from "./sheets/WolsungActorSheet.mjs";
import WolsungActor from "./documents/WolsungActor.mjs";
import WolsungDiceTerm from "./rolls/WolsungDiceTerm.mjs";
import rollFromChatMessageWolsungCommand from "./rolls/WolsungRoll.mjs";
import { useTokenOnRollContextCondition, useTokenOnRollDialog } from "./rolls/useTokenOnRoll.mjs";
import { useCardOnRollContextCondition, useCardOnRollDialog } from "./rolls/useCardOnRoll.mjs";
import WolsungCardConfig from "./cards/WolsungCardConfig.mjs";
import WolsungCards from "./cards/WolsungCards.mjs";
import WolsungCardsHand from "./cards/WolsungCardsHand.mjs";
import WolsungCardsDeck from "./cards/WolsungCardsDeck.mjs";
import WolsungCardsPile from "./cards/WolsungCardsPile.mjs";
import WolsungCardsDirectory from "./cards/WolsungCardsDirectory.mjs";
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
    CONFIG.ui.cards = WolsungCardsDirectory;
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

    loadWolsung();
    Object.keys(wolsungSettings).map(key => game.settings.register("wolsung", key, wolsungSettings[key]));
    
    registerHandlebars();

    var socket;
});

// Hook for /wr (Wolsung Roll) command
Hooks.on('chatMessage', (_, messageText, data) => {
    if (messageText !== undefined && messageText.startsWith('/wr')) {
        rollFromChatMessageWolsungCommand(messageText, data);
        return false;
    }
    else {
        return true;
    }
});

// Hook for /wss (Wolsung Start of Session) command
Hooks.on('chatMessage', (_, messageText, data) => {
    if (messageText !== undefined && messageText.startsWith('/wss')) {
        WolsungSessionStart(messageText, data);
        return false;
    }
    else {
        return true;
    }
});

// Create options to modify roll in Chat Context Menu
Hooks.on("getChatLogEntryContext", (html, options) => {
    options.push({
        name: "wolsung.contextMenu.useToken",
        icon: "<i>" + CONFIG.wolsung.icons.zeton + "</i>",
        condition: message => useTokenOnRollContextCondition(game.messages.get(message.data("messageId"))),
        callback: message => useTokenOnRollDialog(game.messages.get(message.data("messageId")))
    });
    options.push({
        name: "wolsung.contextMenu.useCard",
        icon: "<i>" + CONFIG.wolsung.icons.playCard + "</i>",
        condition: message => useCardOnRollContextCondition(game.messages.get(message.data("messageId"))),
        callback: message => useCardOnRollDialog(game.messages.get(message.data("messageId")))
    });
});

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerSystem("wolsung");
    socket.register("updateChatMessage", async (messageId, data) => {
        const message = game.messages.get(messageId);
        message.update(data);
    });
});