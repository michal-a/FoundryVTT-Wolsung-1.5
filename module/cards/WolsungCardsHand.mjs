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
                return WolsungCardsHand._postChatNotification(card, "wolsung.cards.chat.useCard", {
                    name: game.i18n.localize(card.name),
                    bonus: card.data.data.testBonus,
                    sukces: card.data.data.st
                });
            case "Zeton":
                const hand2 = game.cards.get(data.handId);
                const zeton = hand2.data.cards.get(data.cardId);
                await zeton.reset();
                return WolsungCardsHand._postChatNotification(zeton, "wolsung.cards.chat.useZeton", {});
        }
    }

    async _onUseZeton(element) {
        const card = this.object.cards.get(element.dataset.cardid);
        await card.reset();
        WolsungCardsHand._postChatNotification(card, "wolsung.cards.chat.useZeton", {});
    }

    async _onDrawCards(element) {
        const card = this.object.cards.get(element.dataset.cardid);
        const hand = this.object;
        const deck = game.cards.getName(game.settings.get("wolsung", "wolsungDeck"));
        let maxCards = 3;
        if (!this.object.hasPlayerOwner) {
            maxCards = 4;
            const noPlayers = game.settings.get("wolsung", "numberOfPlayers")
            if (noPlayers > 4) maxCards = noPlayers;
        }
        let toDraw = maxCards - this.object.cards.toObject().filter(card => card.origin == deck.id).length;
        if (toDraw > 0) {
            for (let i = 0; i < toDraw; i++) await deck.deal([hand], 1, {how: 2, chatNotification: false});
            await card.reset();
            WolsungCardsHand._postChatNotification(card, "wolsung.cards.chat.drawCards", {
                number: toDraw
            });
        }
        else {
            ui.notifications.error("<div>" + game.i18n.localize("wolsung.cards.chat.errorDraw") + "</div>", );
        }
        
    }

    async _onUseCard(element) {
        const hand = this.object;
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));
        const card = this.object.cards.get(element.dataset.cardid);
        await hand.pass(discard, [card.id], {chatNotification: false});
        WolsungCardsHand._postChatNotification(card, "wolsung.cards.chat.useCard", {
            name: this._getCardName(card),
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
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));
        const card = this.object.cards.get(element.dataset.cardid);
        let initiativeValue = card.data.value;
        if (card.data.suit == "wolsung.cards.joker.black.suit") initiativeValue += 0.6;
        if (card.data.suit == "wolsung.cards.joker.red.suit") initiativeValue += 0.5;
        if (card.data.suit == "wolsung.cards.spades.suit") initiativeValue += 0.4;
        if (card.data.suit == "wolsung.cards.hearts.suit") initiativeValue += 0.3;
        if (card.data.suit == "wolsung.cards.diamonds.suit") initiativeValue += 0.2;
        if (card.data.suit == "wolsung.cards.clubs.suit") initiativeValue += 0.1;
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
                try {
                    await hand.pass(discard, [card.id], {chatNotification: false});
                }
                catch (e) {
                    ui.notifications.error("<div>" + game.i18n.localize("wolsung.cards.hand.inicjatywaError.noCard") + "</div>");
                    return false;
                }
                game.combat.updateEmbeddedDocuments("Combatant", [{_id: fd.postac, initiative: initiativeValue}]);
                WolsungCardsHand._postChatNotification(card, "wolsung.cards.chat.initiativeCard", {
                    name: this._getCardName(card),
                    tokenName: game.combat.getEmbeddedDocument("Combatant", fd.postac).token.name,
                    actorName: game.combat.getEmbeddedDocument("Combatant", fd.postac).actor.name
                });
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }

    static _postChatNotification(source, action, context) {
        const messageData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: {user: game.user},
            content: `
            <div class="cards-notification flexrow">
            <img class="icon" src="${source.img}">
            <p>${game.i18n.format(action, context)}</p>
            </div>`
        };
        ChatMessage.applyRollMode(messageData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(messageData);
    }
    
}