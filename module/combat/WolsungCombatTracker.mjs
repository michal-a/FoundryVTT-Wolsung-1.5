/** @inheritdoc */
export default class WolsungCombatTracker extends CombatTracker {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            dragDrop: [{dragSelector: null, dropSelector: null}]
        });
    }
    
    /** @inheritdoc */
    get template() {
        return "systems/wolsung/templates/combat/combat-tracker.hbs";
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.combat-edit').click(event => this._onCombatEdit(event));
    }

    /** @inheritdoc */
    async _onCombatCreate(event) {
        event.preventDefault();
        event.stopPropagation();
        const button = event.currentTarget;
        const options = {width: 320, left: window.innerWidth - 630, top: button.offsetTop };
        this.createDialog({}, true, options);
    }

    async _onCombatEdit(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const options = {width: 320, left: window.innerWidth - 630, top: button.offsetTop };
        this.createDialog({}, false, options);
    }

    async createDialog(data={}, newCombat, {parent=null, pack=null, ...options}={}) {
        const types = CONFIG.wolsung.domyslnaKonfrontacja;
        let selected
        if (newCombat) selected = {
            type: Object.keys(types)[0],
            vaBanque: false
        };
        else selected = {
            type: this.viewed.getFlag("wolsung", "konfrontacja"),
            vaBanque: this.viewed.getFlag("wolsung", "vaBanque")
        };

        const html = await renderTemplate('systems/wolsung/templates/combat/create-combat-dialog.hbs', {
            types: types,
            selected: selected
        });

        return Dialog.prompt({
            title: game.i18n.localize("wolsung.combat.selectType"),
            content: html,
            label: game.i18n.localize("wolsung.combat.select"),
            callback: async html => {
                const form = html[0].querySelector("form");
                const fd = new FormDataExtended(form).toObject();
                let combat;
                if (newCombat) combat = await this.newCombat();
                else {
                    combat= this.viewed;
                    if ((selected.type != fd.type || selected.vaBanque != fd.vabanque) && combat.rund != 0) {
                        combat.combatants.map(c => {combat.generateOdpornosc(c, fd.type, fd.vabanque)});
                    }
                }
                combat.setFlag("wolsung", "konfrontacja", fd.type);
                combat.setFlag("wolsung", "vaBanque", fd.vabanque);
            },
            rejectClose: false,
            options: options
        });
    }

    async newCombat() {
        let scene = game.scenes.current;
        const cls = getDocumentClass("Combat");
        const combat = await cls.create({scene: scene?.id});
        await combat.activate({render: false});
        return combat
    }

    /** @inheritdoc */
    _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        if (data.type == "Karta") return this._onDropKarta(event, data);
    }

    _onDropKarta(event, data) {
        const combat = this.viewed;
        let combatantId
        try {
            combatantId = event.target.closest("[data-combatant-id]").dataset.combatantId;
        }
        catch (e) {return;}
        const combatant = combat.getEmbeddedDocument("Combatant", combatantId);
        if (!combatant.isOwner) return;
        const hand = game.cards.get(data.handId);
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));
        const card = hand.getEmbeddedDocument("Card", data.cardId);
        let initiativeValue = card.data.value;
        if (card.data.suit == "wolsung.cards.joker.black.suit") initiativeValue += 0.6;
        if (card.data.suit == "wolsung.cards.joker.red.suit") initiativeValue += 0.5;
        if (card.data.suit == "wolsung.cards.spades.suit") initiativeValue += 0.4;
        if (card.data.suit == "wolsung.cards.hearts.suit") initiativeValue += 0.3;
        if (card.data.suit == "wolsung.cards.diamonds.suit") initiativeValue += 0.2;
        if (card.data.suit == "wolsung.cards.clubs.suit") initiativeValue += 0.1;
        hand.pass(discard, [card.id], {chatNotification: false});
        combat.updateEmbeddedDocuments("Combatant", [{_id: combatantId, initiative: initiativeValue}]);
        CONFIG.Cards.documentClass._postChatNotification(card, "wolsung.cards.chat.initiativeCard", {
            name: CONFIG.Cards.documentClass.getCardShortName(card),
            tokenName: combatant.token.name,
            actorName: combatant.actor.name
        });
    }
}