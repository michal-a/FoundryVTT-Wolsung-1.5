export default class WolsungCards extends Cards {
    async _drawCards(number, how) {

        // Confirm that sufficient cards are available
        let available = this.availableCards;
        if ( available.length < number ) {
            if (this.name == game.settings.get("wolsung", "wolsungDeck")) {
                await game.cards.getName(game.settings.get("wolsung", "discardPile")).reset({chatNotification: false});
                await this.shuffle({chatNotificatio: false});
                available = this.availableCards;
            }
            else {
                throw new Error(`There are not ${number} available cards remaining in Cards [${this.id}]`);
            }
        }

        // Draw from the stack
        let drawn;
        switch ( how ) {
            case CONST.CARD_DRAW_MODES.FIRST:
            available.sort(this.sortShuffled.bind(this));
            drawn = available.slice(0, number);
            break;
            case CONST.CARD_DRAW_MODES.LAST:
            available.sort(this.sortShuffled.bind(this));
            drawn = available.slice(-number);
            break;
            case CONST.CARD_DRAW_MODES.RANDOM:
            const shuffle = available.map(c => [Math.random(), c]);
            shuffle.sort((a, b) => a[0] - b[0]);
            drawn = shuffle.slice(-number).map(x => x[1]);
            break;
        }
        return drawn;
    }
    
    async deal(to, number=1, {action="deal", how=0, updateData={}, chatNotification=true}={}) {

        // Validate the request
        if ( !to.every(d => d instanceof Cards) ) {
          throw new Error("You must provide an array of Cards documents as the destinations for the Cards#deal operation");
        }
    
        // Draw from the sorted stack
        const total = number * to.length;
        const drawn = await this._drawCards(total, how);
    
        // Allocate cards to each destination
        const toCreate = to.map(() => []);
        const toUpdate = [];
        const toDelete = [];
        for ( let i=0; i<total; i++ ) {
          const n = i % to.length;
          const card = drawn[i];
          const createData = foundry.utils.mergeObject(card.toObject(), updateData);
          if ( card.isHome || !createData.origin ) createData.origin = this.id;
          toCreate[n].push(createData);
          if ( card.isHome ) toUpdate.push({_id: card.id, drawn: true});
          else toDelete.push(card.id);
        }
    
        /**
         * A hook event that fires when Cards are dealt from a deck to other hands
         * @function dealCards
         * @memberof hookEvents
         * @param {Cards} origin                The origin Cards document
         * @param {Cards[]} destinations        An array of destination Cards documents
         * @param {object} context              Additional context which describes the operation
         * @param {string} context.action       The action name being performed, i.e. "deal", "pass"
         * @param {object[][]} context.toCreate   An array of Card creation operations to be performed in each destination Cards document
         * @param {object[]} context.fromUpdate   Card update operations to be performed in the origin Cards document
         * @param {object[]} context.fromDelete   Card deletion operations to be performed in the origin Cards document
         *
         */
        const allowed = Hooks.call("dealCards", this, to, {
          action: action,
          toCreate: toCreate,
          fromUpdate: toUpdate,
          fromDelete: toDelete
        });
        if ( allowed === false ) {
          console.debug(`${vtt} | The Cards#deal operation was prevented by a hooked function`);
          return this;
        }
    
        // Perform database operations
        const promises = to.map((cards, i) => {
          return cards.createEmbeddedDocuments("Card", toCreate[i], {keepId: true})
        });
        promises.push(this.updateEmbeddedDocuments("Card", toUpdate));
        promises.push(this.deleteEmbeddedDocuments("Card", toDelete));
        await Promise.all(promises);
    
        // Dispatch chat notification
        if ( chatNotification ) {
          const chatActions = {
            deal: "CARDS.NotifyDeal",
            pass: "CARDS.NotifyPass"
          }
          this._postChatNotification(this, chatActions[action], {number, link: to.map(t => t.link).join(", ")});
        }
        return this;
    }

    async draw(from, number=1, {how=0, updateData={}, ...options}={}) {
        if ( !(from instanceof Cards) || (from === this) ) {
            throw new Error("You must provide some other Cards document as the source for the Cards#draw operation");
        }
        const toDraw = await from._drawCards(number, how);
        return from.pass(this, toDraw.map(c => c.id), {updateData, action: "draw", ...options});
    }

    async dealDialog() {
        const hands = game.cards.filter(c => (c.type !== "deck") && (c.type !== "pile") && c.testUserPermission(game.user, "LIMITED"));
        if ( !hands.length ) return ui.notifications.warn("CARDS.DealWarnNoTargets", {localize: true});
  
        // Construct the dialog HTML
        const html = await renderTemplate("systems/wolsung/templates/cards/dialog-deal.hbs", {
            hands: hands,
            modes: {
                [CONST.CARD_DRAW_MODES.TOP]: "CARDS.DrawModeTop",
                [CONST.CARD_DRAW_MODES.BOTTOM]: "CARDS.DrawModeBottom",
                [CONST.CARD_DRAW_MODES.RANDOM]: "CARDS.DrawModeRandom",
            }
        });
  
        // Display the prompt
        return Dialog.prompt({
            title: game.i18n.localize("CARDS.DealTitle"),
            label: game.i18n.localize("CARDS.Deal"),
            content: html,
            callback: html => {
                const form = html.querySelector("form.cards-dialog");
                const fd = new FormDataExtended(form).toObject();
                if ( !fd.to ) return this;
                if ( !(fd.to instanceof Array) ) fd.to = [html.querySelector('[name="to"]').value];
                const to = fd.to.map(id => game.cards.get(id));
                const options = {how: fd.how, updateData: fd.down ? {face: null} : {}};
                return this.deal(to, fd.number, options).catch(err => {
                    ui.notifications.error(err.message);
                    return this;
                });
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }

    async playDialog(card) {
        const cards = game.cards.filter(c => (c !== this) && (c.type !== "deck") && (c.name !== game.settings.get("wolsung", "initiativePile")) && c.testUserPermission(game.user, "LIMITED"));
        if ( !cards.length ) return ui.notifications.warn("CARDS.PassWarnNoTargets", {localize: true});
  
        // Construct the dialog HTML
        const html = await renderTemplate("systems/wolsung/templates/cards/dialog-play.hbs", {card, cards});
  
        // Display the prompt
        return Dialog.prompt({
            title: game.i18n.localize("CARD.Play"),
            label: game.i18n.localize("CARD.Play"),
            content: html,
            callback: html => {
                const form = html.querySelector("form.cards-dialog");
                const fd = new FormDataExtended(form).toObject();
                const to = game.cards.get(fd.to);
                const options = {action: "play", updateData: fd.down ? {face: null} : {}};
                return this.pass(to, [card.id], options).catch(err => {
                    return ui.notifications.error(err.message);
                });
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }

    static getCardShortName(card) {
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
        return cardShortName;
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