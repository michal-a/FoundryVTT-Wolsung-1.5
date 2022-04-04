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

}