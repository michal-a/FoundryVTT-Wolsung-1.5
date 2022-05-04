export default class WolsungCardsHand extends CardsHand {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            resizable: true,
            width: 800,
            height: 700,
            classes: ["wolsung", "cards", "hand"],
            template: "systems/wolsung/templates/cards/cards-hand.hbs",
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

    cardMenu = [
        {
            name: game.i18n.localize("wolsung.cards.hand.useChat"),
            icon: '<i class="fas fa-comments"></i>',
            callback: element => {
                this._onUseCard(element[0]);
            }
        },
        {
            name: game.i18n.localize("wolsung.cards.hand.inicjatywa"),
            icon: '<i class="fas fa-fist-raised"></i>',
            callback: element => {
                this._onInitiativeCard(element[0]);
            }
        },
        {
            name: game.i18n.localize("wolsung.cards.hand.discard"),
            icon: "<i>" + CONFIG.wolsung.icons.discardCard + "</i>",
            callback: element => {
                this._onDiscardCard(element[0]);
            }
        }
    ]

    zetonMenu = [
        {
            name: game.i18n.localize("wolsung.cards.hand.useChat"),
            icon: '<i class="fas fa-comments"></i>',
            callback: element => {
                this._onUseZeton(element[0]);
            }
        },
        {
            name: game.i18n.localize("wolsung.cards.hand.dobierz"),
            icon: "<i>" + CONFIG.wolsung.icons.dealCard + "</i>",
            callback: element => {
                this._onDrawCards(element[0]);
            }
        }
    ]

    getData() {
        const baseData = super.getData();
        let sheetData = baseData;
        sheetData.hasPlayerOwner = sheetData.document.hasPlayerOwner;
        const wolsungDeckId = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).id;
        const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
        sheetData.wolsungCards = baseData.cards.filter(card => card.data.origin == wolsungDeckId);
        sheetData.zetony = baseData.cards.filter(card => card.data.origin == zetonDeckId);
        return sheetData;
    }

    activateListeners(html) {
        if (this.object.isOwner) {
            new ContextMenu(html, ".karta-active", this.cardMenu);
            new ContextMenu(html, ".zeton-active", this.zetonMenu);
        }
        super.activateListeners(html);
    }

    _onToggleDetails(event) {
        const details = event.currentTarget.getElementsByClassName("details");
        $.each(details, function (index, value) {
            $(value).toggleClass("hidden");
        });
    }

    /** @inheritdoc */
    _canDragStart(selector) {
        return this.object.isOwner;
    }

    /** @inheritdoc */
    _onDragStart(event) {
        const element = event.currentTarget;

        // Create drag data
        const dragData = {
            handId: this.object.id,
            cardId: element.dataset.cardid
        };

        // Wolsung Cards
        if (element.classList.contains("karta")) {
            dragData.type = "Karta";
        }
        else if (element.classList.contains("zeton")) {
            dragData.type = "Zeton";
        }

        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    static async _onDropOnCanvas(canvas, data) {
        switch ( data.type ) {
            case "Karta": 
                const hand = game.cards.get(data.handId);
                const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));
                const card = hand.data.cards.get(data.cardId);
                await hand.pass(discard, [data.cardId], {chatNotification: false});
                return CONFIG.Cards.documentClass._postChatNotification(card, "wolsung.cards.chat.useCard", {
                    name: CONFIG.Cards.documentClass.getCardShortName(card),
                    bonus: card.data.data.testBonus,
                    sukces: card.data.data.st
                });
            case "Zeton":
                const hand2 = game.cards.get(data.handId);
                const zeton = hand2.data.cards.get(data.cardId);
                await zeton.reset();
                return CONFIG.Cards.documentClass._postChatNotification(zeton, "wolsung.cards.chat.useZeton", {});
        }
    }

    async _onUseZeton(element) {
        const card = this.object.cards.get(element.dataset.cardid);
        await card.reset();
        CONFIG.Cards.documentClass._postChatNotification(card, "wolsung.cards.chat.useZeton", {});
    }

    async _onDrawCards(element) {
        const zeton = this.object.cards.get(element.dataset.cardid);
        this.object.drawCards(zeton);
    }


    async _onUseCard(element) {
        const hand = this.object;
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));
        const card = this.object.cards.get(element.dataset.cardid);
        await hand.pass(discard, [card.id], {chatNotification: false});
        CONFIG.Cards.documentClass._postChatNotification(card, "wolsung.cards.chat.useCard", {
            name: CONFIG.Cards.documentClass.getCardShortName(card),
            bonus: card.data.data.testBonus,
            sukces: card.data.data.st
        });

    }

    _getCardName(card) {
        let cardName = card.data.value;
        if (cardName == 11) cardName = game.i18n.localize("wolsung.cards.initiative.jack");
        if (cardName == 12) cardName = game.i18n.localize("wolsung.cards.initiative.queen");
        if (cardName == 13) cardName = game.i18n.localize("wolsung.cards.initiative.king");
        if (cardName == 14) cardName = game.i18n.localize("wolsung.cards.initiative.ace");
        if (cardName == 15) cardName = game.i18n.localize("wolsung.cards.initiative.joker");
        if (card.data.suit == "wolsung.cards.spades.suit") cardName += "♠";
        if (card.data.suit == "wolsung.cards.clubs.suit") cardName += "♣";
        if (card.data.suit == "wolsung.cards.hearts.suit") cardName += '<span style="color: #A52A2A;">♥</span>';
        if (card.data.suit == "wolsung.cards.diamonds.suit") cardName += '<span style="color: #A52A2A;">♦</span>';
        if (card.data.suit == "wolsung.cards.joker.red.suit") cardName = '<span style="color: #A52A2A;">' + cardName + '</span>';
        return cardName;
    }

    async _onDiscardCard(element) {
        const hand = this.object;
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));
        const card = this.object.cards.get(element.dataset.cardid);
        await hand.pass(discard, [card.id], {chatNotification: false});
    }

    async _onInitiativeCard(element) {
        const hand = this.object;
        const card = this.object.cards.get(element.dataset.cardid);
        const combatants = game.combat.turns.filter(combatant => combatant.isOwner);
        const html = await renderTemplate("systems/wolsung/templates/cards/dialog-initiative.hbs", {card: card, combatants: combatants});
        return Dialog.prompt({
            title: game.i18n.localize("wolsung.cards.hand.inicjatywaTitle"),
            label: game.i18n.localize("wolsung.cards.hand.inicjatywaLabel"),
            content: html,
            callback: async (html) => {
                const form = html.querySelector("form.cards-dialog");
                const fd = new FormDataExtended(form).toObject();
                if (!fd.postac) {
                    ui.notifications.error("<div>" + game.i18n.localize("wolsung.cards.hand.inicjatywaError.noCombatant") + "</div>");
                    return false;
                }
                CONFIG.Cards.documentClass._cardForInitiative(card, hand, game.combat, fd.postac);
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }
    
}