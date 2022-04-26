export default class WolsungCombat extends Combat {
    async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        const chatRollMode = game.settings.get("core", "rollMode");
    
        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        let deck = game.cards.getName(game.settings.get("wolsung", "wolsungDeck"));
        let initiativePile = game.cards.getName(game.settings.get("wolsung", "initiativePile"));
        let pile = game.cards.getName(game.settings.get("wolsung", "discardPile"));
        for ( let [i, id] of ids.entries() ) {
    
            // Get Combatant data (non-strictly)
            const combatant = this.combatants.get(id);
            if ( !combatant?.isOwner ) continue;
            
            await deck.deal([initiativePile], 1, {how: 2, chatNotification: false});
            let initiativeCard = initiativePile.getEmbeddedCollection("Card").toObject()[0];
            let initiativeValue = initiativeCard.value;
            if (initiativeCard.suit == "wolsung.cards.joker.black.suit") initiativeValue += 0.6;
            if (initiativeCard.suit == "wolsung.cards.joker.red.suit") initiativeValue += 0.5;
            if (initiativeCard.suit == "wolsung.cards.spades.suit") initiativeValue += 0.4;
            if (initiativeCard.suit == "wolsung.cards.hearts.suit") initiativeValue += 0.3;
            if (initiativeCard.suit == "wolsung.cards.diamonds.suit") initiativeValue += 0.2;
            if (initiativeCard.suit == "wolsung.cards.clubs.suit") initiativeValue += 0.1;
            await initiativePile.deal([pile], 1, {chatNotification: false});
            updates.push({_id: id, initiative: initiativeValue});
        }
        if ( !updates.length ) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Ensure the turn order remains with the same combatant
        if ( updateTurn && currentId ) {
            await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
        }

        return this;
    }

    async nextRound() {
        await this.rollInitiative(this.combatants.map(c => {return c.id}));
        super.nextRound();
    }
}