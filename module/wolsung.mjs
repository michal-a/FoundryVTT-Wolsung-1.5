import {wolsungCFG} from "./config.mjs";
import {wolsungSettings} from "./settings.mjs";
import {wolsungRollCommand, wolsungSessionStart} from "./functions.mjs";
import registerHandlebars from "./handlebars.mjs";
import loadWolsung from "./load.mjs";
import WolsungItemSheet from "./sheets/WolsungItemSheet.mjs";
import WolsungItem from "./documents/WolsungItem.mjs";
import WolsungActorSheet from "./sheets/WolsungActorSheet.mjs";
import WolsungActor from "./documents/WolsungActor.mjs";
import WolsungDiceTerm from "./rolls/WolsungDiceTerm.mjs";
import WolsungDie from "./rolls/WolsungDie.mjs";
import WolsungCardConfig from "./cards/WolsungCardConfig.mjs";
import WolsungCards from "./cards/WolsungCards.mjs";
import WolsungCardsHand from "./cards/WolsungCardsHand.mjs";
import WolsungCardsDeck from "./cards/WolsungCardsDeck.mjs";
import WolsungCardsPile from "./cards/WolsungCardsPile.mjs";
import WolsungCardsDirectory from "./applications/WolsungCardsDirectory.mjs";
import WolsungChatLog from "./applications/WolsungChatLog.mjs";
import WolsungCombat from "./combat/combat.mjs";
import WolsungCombatTracker from "./combat/combatTracker.mjs";

Hooks.once("init", function(){
    console.log("Wolsung | Initialising Wolsung 1.5 System");

    // Import Wolsung Config
    CONFIG.wolsung = wolsungCFG;

    // Configure Item
    CONFIG.Item.documentClass = WolsungItem;
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("wolsung", WolsungItemSheet, {makeDefault: true});

    // Configure Actor
    CONFIG.Actor.documentClass = WolsungActor;
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("wolsung", WolsungActorSheet, {makeDefault: true});

    // Configure Rolls
    CONFIG.Dice.termTypes.DiceTerm = WolsungDiceTerm;
    CONFIG.Dice.terms.d = WolsungDie;
    CONFIG.Dice.types[0] = WolsungDie;
    Roll.CHAT_TEMPLATE = "systems/wolsung/templates/dice/roll.hbs";

    // Configure Cards
    CONFIG.Cards.documentClass = WolsungCards;
    CONFIG.ui.cards = WolsungCardsDirectory;
    DocumentSheetConfig.unregisterSheet(Card, "core", CardConfig);
    DocumentSheetConfig.registerSheet(Card, "wolsung", WolsungCardConfig, {makeDefault: true});
    DocumentSheetConfig.unregisterSheet(Cards, "core", CardsHand);
    DocumentSheetConfig.registerSheet(Cards, "wolsung", WolsungCardsHand, {types: ["hand"], makeDefault: true});
    DocumentSheetConfig.unregisterSheet(Cards, "core", CardsConfig);
    DocumentSheetConfig.registerSheet(Cards, "wolsung", WolsungCardsDeck, {types: ["deck"], makeDefault: true});
    DocumentSheetConfig.unregisterSheet(Cards, "core", CardsPile);
    DocumentSheetConfig.registerSheet(Cards, "wolsung", WolsungCardsPile, {types: ["pile"], makeDefault: true});

    // Configure Chat
    CONFIG.ui.chat = WolsungChatLog;

    // Configure Combat
    CONFIG.Combat.documentClass = WolsungCombat;
    CONFIG.ui.combat = WolsungCombatTracker;

    // Load Templates
    loadWolsung();
    
    // Register Handlebars
    registerHandlebars();

    // Create System Settings
    Object.keys(wolsungSettings).map(key => game.settings.register("wolsung", key, wolsungSettings[key]));

    // Create socket for socketlib
    var socket;

    console.log("Wolsung | Wolsung 1.5 System is initialized");
});

// Hook for /wr (Wolsung Roll) command
Hooks.on('chatMessage', (_, messageText, data) => {
    if (messageText !== undefined && messageText.startsWith('/wr')) {
        wolsungRollCommand(messageText, data);
        return false;
    }
    else {
        return true;
    }
});

// Hook for /wss (Wolsung Start of Session) command
Hooks.on('chatMessage', (_, messageText, data) => {
    if (messageText !== undefined && messageText.startsWith('/wss')) {
        wolsungSessionStart(messageText, data);
        return false;
    }
    else {
        return true;
    }
});

// Register wolsung socketlib functions
Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerSystem("wolsung");
    socket.register("updateChatMessage", async (messageId, data) => {
        const message = game.messages.get(messageId);
        message.update(data);
    });
});