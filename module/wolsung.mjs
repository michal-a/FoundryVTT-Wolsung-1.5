import {wolsungCFG} from "./config.mjs";
import {wolsungSettings} from "./settings.mjs";
import {wolsungRollCommand, wolsungSessionStart} from "./functions.mjs";
import registerHandlebars from "./handlebars.mjs";
import loadWolsung from "./load.mjs";
import WolsungItemSheet from "./sheets/WolsungItemSheet.mjs";
import WolsungItem from "./documents/WolsungItem.mjs";
import WolsungActorSheet from "./sheets/WolsungActorSheet.mjs";
import WolsungActor from "./documents/WolsungActor.mjs";
import WolsungDiceTerm from "./dice/WolsungDiceTerm.mjs";
import WolsungDie from "./dice/WolsungDie.mjs";
import WolsungCardConfig from "./cards/WolsungCardConfig.mjs";
import WolsungCards from "./cards/WolsungCards.mjs";
import WolsungCardsHand from "./cards/WolsungCardsHand.mjs";
import WolsungCardsDeck from "./cards/WolsungCardsDeck.mjs";
import WolsungCardsPile from "./cards/WolsungCardsPile.mjs";
import WolsungCardsDirectory from "./applications/WolsungCardsDirectory.mjs";
import WolsungChatLog from "./applications/WolsungChatLog.mjs";
import WolsungCombat from "./combat/WolsungCombat.mjs";
import WolsungCombatTracker from "./combat/WolsungCombatTracker.mjs";

Hooks.once("init", async function(){
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
    // Support Card Hand Mini Toolbar
    if (game.modules.get('hand-mini-bar').active) {
        const { default: WHMB } = await import('./cards/WolsungHandMiniBar.mjs');
        CONFIG.HandMiniBar.documentClass = WHMB;
        HandMiniBar = WHMB;
    }


    console.log("Wolsung | Wolsung 1.5 System is initialized");
});

Hooks.on('ready', async function(){
    if (game.user.isGM) {

        // Check for socketlib
        if (!game.user.getFlag('wolsung', 'socketlibInfo')) {
            try {
                if (!game.modules.get('socketlib').active) {
                    //Ask for socketlib activation
                    const messageData = {
                        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                        speaker: {user: game.user},
                        content: `<p>${game.i18n.localize("wolsung.socketlib.activate")}</p>`,
                        whisper: [game.user.id]
                    }
                    ChatMessage.create(messageData);
                    game.user.setFlag('wolsung', 'socketlibInfo', true);
                }
            }
            catch (e) {
                //Ask for socketlib installation
                const messageData = {
                    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                    speaker: {user: game.user},
                    content: `<p>${game.i18n.localize("wolsung.socketlib.install")}</p>`,
                    whisper: [game.user.id]
                }
                ChatMessage.create(messageData);
                game.user.setFlag('wolsung', 'socketlibInfo', true);
            }
        }

        // Import Cards for Wolsung pack during first start
        if (!game.settings.get('wolsung', 'wereCardsImported')) {
            game.packs.get('wolsung.wolsung-cards').importAll();
            game.settings.set('wolsung', 'wereCardsImported', true);
        }

        // Encounters settings for Wolsung
        if (game.settings.get('wolsung', 'firstRun')) {
            game.settings.set("core", Combat.CONFIG_SETTING, {
                resource: 'konfrontacja.odpornosc.value',
                skipDefeated: false
              });
              game.settings.set('wolsung', 'firstRun', false);
        }

        // Create Cards Hand for GM if there is none
        if (!game.settings.get('wolsung', 'GMHandId') || !game.cards.get(game.settings.get('wolsung', 'GMHandId'))) {
            const hand = await WolsungCards.create({
                name: "GM hand",
                img: "icons/svg/card-hand.svg",
                type: "hand"
            });
            game.settings.set('wolsung', 'GMHandId', hand.id);
        }

        // Create Cards Hand for each player which doesn't have one
        for (let player of game.users.players) {
            if (!player.getFlag('wolsung', 'handId') || !game.cards.get(player.getFlag('wolsung', 'handId'))) {
                const hand = await WolsungCards.create({
                    name: player.name,
                    img: "icons/svg/card-hand.svg",
                    type: "hand"
                });
                let permission = {}
                permission[player.id] = 3
                hand.update({ permission: permission })
                player.setFlag('wolsung', 'handId', hand.id);
            }
        }

    }

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
	CONFIG.wolsungSocket = socketlib.registerSystem("wolsung");
    CONFIG.wolsungSocket.register("updateChatMessage", async (messageId, data) => {
        const message = game.messages.get(messageId);
        message.update(data);
    });
});

// Handle dropping Cards and Wolsung Tokens on canvas
Hooks.on("dropCanvasData", WolsungCardsHand._onDropOnCanvas);