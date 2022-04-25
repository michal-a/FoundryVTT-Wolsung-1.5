import WolsungCardSelectDialog from "./WolsungCardSelectDialog.mjs";
import { isWolsungRoll, wolsungRollFormat } from "../functions.mjs";

/** @inheritdoc */
export default class WolsungChatLog extends ChatLog {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            dragDrop: [{dragSelector: null, dropSelector: null}]
        });
    }

    /** @inheritdoc */
    _canDragDrop(selector) {
        return true;
    }
    
    /** @inheritdoc */
    _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        switch ( data.type ) {
            case "Karta":
                return this._onDropKarta(event, data);
            case "Zeton":
                return this._onDropZeton(event, data);
        }
    }

    /**
     * Handle Wolsung Card drops on Chat Message
     * @param {Object} event 
     * @param {Object} data 
     */
    _onDropKarta(event, data) {
        const messageId = event.target.closest("[data-message-id]").dataset.messageId;

        // Check if can be dropped
        if (!this._useOnRollCondition(messageId)) return;

        const message = game.messages.get(messageId);
        const hand = game.cards.get(data.handId)
        
        this._useCardOnRoll(message, hand, data.cardId)
    }

    /**
     * Handle Wolsung Token drops on Chat Message
     * @param {Object} event 
     * @param {Object} data 
     */
    _onDropZeton(event, data) {
        const messageId = event.target.closest("[data-message-id]").dataset.messageId;

        // Check if can be dropped
        if (!this._useOnRollCondition(messageId)) return;

        this._useZetonOnRollDialog(messageId);
    }

    /** @inheritdoc */
    _getEntryContextOptions() {
        let options = super._getEntryContextOptions();
        options.push({
            name: "wolsung.contextMenu.useToken",
            icon: "<i>" + CONFIG.wolsung.icons.zeton + "</i>",
            condition: message => this._useZetonOnRollContextCondition(message.data("messageId")),
            callback: message => this._useZetonOnRollDialog(message.data("messageId"))
        });
        options.push({
            name: "wolsung.contextMenu.useCard",
            icon: "<i>" + CONFIG.wolsung.icons.playCard + "</i>",
            condition: message => this._useCardOnRollContextCondition(message.data("messageId")),
            callback: message => this._useCardOnRollDialog(message.data("messageId"))
        });
        return options;
    }

    _useOnRollCondition(messageId) {
        const message = game.messages.get(messageId);

        //check if message is Wolsung Roll
        if (!message.isRoll || !isWolsungRoll(message._roll._formula)) return false;
    
        //check if socketlib is active
        try {
            if (!game.modules.get('socketlib').active) return false;
        }
        catch (e) {
            return false;
        }
        return true;
    }

    _useZetonOnRollContextCondition(messageId) {
        if (!this._useOnRollCondition(messageId)) return false;

        //check if user have Tokens in hand
        let haveZetons = false;
        let hand
        if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
        else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];
        if (hand != undefined) {
            const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
            haveZetons = (hand.cards.filter(card => card.data.origin == zetonDeckId).length > 0);
        }
        return  haveZetons;
    }

    _useCardOnRollContextCondition(messageId) {
        if (!this._useOnRollCondition(messageId)) return false;

        //check if user have Cards in hand
        let haveCards = false;
        let hand
        if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
        else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];
        if (hand != undefined) {
            const cardsDeckId = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).id;
            haveCards = (hand.cards.filter(card => card.data.origin == cardsDeckId).length > 0);
        }
        return  haveCards;
    }

    /**
     * Render Dialog for selecting Token's effect on Roll
     * @param {ChatMessage} message 
     * @returns 
     */
    async _useZetonOnRollDialog(messageId) {
        const message = game.messages.get(messageId);

        //define user hand
        let hand
        if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
        else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];
    
        //render html for Dialog
        const html = await renderTemplate("systems/wolsung/templates/chat/use-token-dialog.hbs", {});
    
        //render Dialog
        return new Dialog({
            title: game.i18n.format("wolsung.chat.useToken.title", wolsungRollFormat(message.roll._formula)),
            content: html,
            buttons: {
                bonus: {
                    label: game.i18n.localize("wolsung.chat.useToken.bonus"),
                    callback: html => {
                        const fd = new FormDataExtended(html[0].querySelector("form")).toObject();
                        this._useZetonOnRollBonus(hand, message, fd.bonus);
                    }
                },
                dice: {
                    label: game.i18n.localize("wolsung.chat.useToken.dice"),
                    callback: async () => {
                        this._useZetonOnRollDice(hand, message);
                    }
                }
            }
        }).render(true);
    }

    /**
     * Add Bonus to the Roll result from the ChatMessage
     * @param {ChatMessage} message 
     * @param {Number} bonus 
     */
    async _useZetonOnRollBonus(hand, message, bonus) {
        //Discard the Token
        const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
        try {
            await hand.cards.filter(card => card.data.origin == zetonDeckId)[0].reset();
        }
        catch (e) {
            ui.notifications.error(game.i18n.localize("wolsung.chat.useToken.empty"))
            return false;
        }

        let modRoll = message.roll;
        let diceFormula = modRoll.terms[0].terms[0];

        //add bonus from Token
        if (modRoll.terms[1].operator == "+") {
            modRoll.terms[2].number += bonus;
            if (modRoll.terms[2].number < 0) {
                modRoll.terms[1].operator = "-";
                modRoll.terms[2].number = -modRoll.terms[2].number;
            }
        }
        else {
            modRoll.terms[2].number -= bonus;
            if (modRoll.terms[2].number <= 0) {
                modRoll.terms[1].operator = "+";
                modRoll.terms[2].number = -modRoll.terms[2].number;
            }
        }
        

        //add Roll flavor to note the Token usage
        const modFlavor = game.i18n.format("wolsung.chat.rollFlavor.addTokenBonus", {
            user: (game.user.charname ? game.user.charname : game.user.name),
            what: game.i18n.localize(bonus >= 0 ? "wolsung.chat.rollFlavor.increase": "wolsung.chat.rollFlavor.decrease"),
            bonus: (bonus >=0 ? bonus : -bonus)
        });
        modRoll.flavor = message.data.flavor ? (message.data.flavor + "<br>" + modFlavor) : modFlavor;

        //update Roll formula
        modRoll._formula = "{" + Array(modRoll.terms[0].terms.length).fill(diceFormula).join() + "}kh " + modRoll.terms[1].operator + " " + modRoll.terms[2].number;
        
        //prepare for Roll.evaluate()
        modRoll._evaluated = false
        modRoll.terms[2]._evaluated = false;

        //evaluate Roll
        await modRoll.evaluate();

        //update ChatMessage
        await socket.executeAsGM("updateChatMessage", message.id, {
            flavor: modRoll.flavor,
            content: modRoll.total,
            roll: JSON.stringify(modRoll)
        });
    }

    /**
     * Add Dice to the Roll from the Chat Message
     * @param {ChatMessage} message 
     */
    async _useZetonOnRollDice(hand, message) {
        //Discard the Token
        const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
        try {
            await hand.cards.filter(card => card.data.origin == zetonDeckId)[0].reset();
        }
        catch (e) {
            ui.notifications.error(game.i18n.localize("wolsung.chat.useToken.empty"))
            return false;
        }

        let modRoll = message.roll;
        let diceFormula = modRoll.terms[0].terms[0];

        //prepare new Dice
        modRoll.terms[0].terms.push(diceFormula); 
        let additionalDice = new Roll(diceFormula);

        //evaluate new Dice
        await additionalDice.evaluate();
        if (game.dice3d != undefined) await game.dice3d.showForRoll(additionalDice, game.user, true);

        //add Dice to Roll
        modRoll.terms[0].rolls.push(additionalDice);

        //add Roll flavor to note the Token usage
        const modFlavor = game.i18n.format("wolsung.chat.rollFlavor.addTokenDice", {
            user: (game.user.charname ? game.user.charname : game.user.name)
        });
        modRoll.flavor = message.data.flavor ? (message.data.flavor + "<br>" + modFlavor) : modFlavor;

        //update Roll formula
        modRoll._formula = "{" + Array(modRoll.terms[0].terms.length).fill(diceFormula).join() + "}kh " + modRoll.terms[1].operator + " " + modRoll.terms[2].number;

        //prepare for Roll.evaluate()
        modRoll._evaluated = false;
        for (let roll of modRoll.terms[0].rolls) roll._evaluated = false;
        modRoll.terms[0].results = [];
        modRoll.terms[0]._evaluated = false;

        //evaluate Roll
        await modRoll.evaluate();

        //update ChatMessage
        await socket.executeAsGM("updateChatMessage", message.id, {
            flavor: modRoll.flavor,
            content: modRoll.total,
            roll: JSON.stringify(modRoll)
        });
    }

    /**
     * Render Dialog for selecting a card
     * @param {Object} message 
     * @returns 
     */
    async _useCardOnRollDialog(messageId) {
        const message = game.messages.get(messageId);

        //define user hand
        let hand
        if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
        else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];

        //get list of Cards on hand
        const cardsDeckId = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).id;
        const cardsList = hand.cards.filter(card => card.data.origin == cardsDeckId)

        //render Dialog
        return WolsungCardSelectDialog.prompt({
            title: game.i18n.format("wolsung.chat.useCard.title", wolsungRollFormat(message.roll._formula)),
            label: game.i18n.localize("wolsung.chat.useCard.label"),
            content: {
                cards: cardsList,
                selectedCard: cardsList[0],
                cardId: cardsList[0].id
            },
            callback: html => {
                const fd = new FormDataExtended(html.querySelector("form")).toObject();
                this._useCardOnRoll(message, hand, fd.cardId);
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }

    /**
     * Add Card effect to the Roll
     * @param {ChatMessage} message 
     * @param {WolsungCards} hand 
     * @param {String} cardId 
     */
    async _useCardOnRoll(message, hand, cardId) {
        //get Discard pile
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));

        try {
            await hand.pass(discard, [cardId], {chatNotification: false});
        }
        catch (e) {
            ui.notifications.error("<div>" + game.i18n.localize("wolsung.cards.hand.inicjatywaError.noCard") + "</div>");
            return false;
        }

        //get Card object
        const card = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).getEmbeddedDocument("Card", cardId);

        let modRoll = message.roll;
        let diceFormula = modRoll.terms[0].terms[0];

        //add bonus from Card
        if (modRoll.terms[1].operator == "+") {
            modRoll.terms[2].number += card.data.data.testBonus;
            if (modRoll.terms[2].number < 0) {
                modRoll.terms[1].operator = "-";
                modRoll.terms[2].number = -modRoll.terms[2].number;
            }
        }
        else {
            modRoll.terms[2].number -= card.data.data.testBonus;
            if (modRoll.terms[2].number <= 0) {
                modRoll.terms[1].operator = "+";
                modRoll.terms[2].number = -modRoll.terms[2].number;
            }
        }

        //increase explosion range if Joker
        if (card.data.value == 15) {
            let explodeOn = parseInt(diceFormula.split('=')[1]) - 1;
            diceFormula = "1d10x>=" + explodeOn;
            modRoll.terms[0]._evaluated = false;
            for (let i = 0; i < modRoll.terms[0].terms.length; i++) modRoll.terms[0].terms[i] = diceFormula;
            for (let roll of modRoll.terms[0].rolls) {
                roll._evaluated = false;
                roll._formula = diceFormula;
                for (let die of roll.terms) {
                    die.modifiers = ["x>=" + explodeOn]
                    if (die.results[die.results.length - 1].result >= explodeOn) {
                        let additonalDie = new Roll(diceFormula);
                        await additonalDie.evaluate();
                        if (game.dice3d != undefined) await game.dice3d.showForRoll(additonalDie, game.user, true);
                        die.results[die.results.length - 1].exploded = true;
                        die.results = die.results.concat(additonalDie.terms[0].results);
                        for (let j = 0; j < die.results.length; j++) die.results[j].indexThrow = j;
                    }
                }
            }
        }

        //create short name of the Card
        let cardShortName
        switch (card.data.value) {
            case 11:
                cardShortName = game.i18n.localize("wolsung.cards.initiative.jack");
                break;
            case 12:
                cardShortName = game.i18n.localize("wolsung.cards.initiative.queen");
                break;
            case 13:
                cardShortName = game.i18n.localize("wolsung.cards.initiative.king");
                break;
            case 14:
                cardShortName = game.i18n.localize("wolsung.cards.initiative.ace");
                break;
            case 15:
                cardShortName = game.i18n.localize("wolsung.cards.initiative.joker");
                break;
            default:
                cardShortName = card.data.value.toString();
        }
        switch (card.data.suit) {
            case "wolsung.cards.spades.suit":
                cardShortName += "♠";
                break;
            case "wolsung.cards.clubs.suit":
                cardShortName += "♣";
                break;
            case "wolsung.cards.hearts.suit":
                cardShortName += '<span style="color: #CF5353;">♥</span>';
                break;
            case "wolsung.cards.diamonds.suit":
                cardShortName += '<span style="color: #CF5353;">♦</span>';
                break;
            case "wolsung.cards.joker.red.suit":
                cardShortName = '<span style="color: #CF5353;">' + cardShortName + '</span>';
                break;
        }
        
        //add Roll flavor to note the Card usage
        const modFlavor = game.i18n.format("wolsung.chat.rollFlavor.addCard", {
            user: (game.user.charname ? game.user.charname : game.user.name),
            cardShortName: cardShortName,
            bonus: card.data.data.testBonus,
            joker: (card.data.value == 15 ? game.i18n.localize("wolsung.chat.rollFlavor.joker") : "")
        });
        modRoll.flavor = message.data.flavor ? (message.data.flavor + "<br>" + modFlavor) : modFlavor;

        //update Roll formula
        modRoll._formula = "{" + Array(modRoll.terms[0].terms.length).fill(diceFormula).join() + "}kh " + modRoll.terms[1].operator + " " + modRoll.terms[2].number;
        
        //prepare for Roll.evaluate()
        modRoll._evaluated = false
        modRoll.terms[2]._evaluated = false;

        //evaluate Roll
        await modRoll.evaluate();

        //update ChatMessage
        await socket.executeAsGM("updateChatMessage", message.id, {
            flavor: modRoll.flavor,
            content: modRoll.total,
            roll: JSON.stringify(modRoll)
        });
    }
}