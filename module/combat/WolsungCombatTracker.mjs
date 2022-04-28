import WolsungCardSelectDialog from "../applications/WolsungCardSelectDialog.mjs";
import { wolsungGetHand } from "../functions.mjs";

/** @inheritdoc */
export default class WolsungCombatTracker extends CombatTracker {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            dragDrop: [{dragSelector: null, dropSelector: null}]
        });
    }
    
    contextEntries = [
        {
            name: "wolsung.contextMenu.useCard",
            icon: `<i>${CONFIG.wolsung.icons.playCard}</i>`,
            condition: li => {
                return this.viewed.combatants.get(li.data("combatant-id")).isOwner;
            },
            callback: li => {
                const combatantId = li.data("combatant-id");
                this._onCardContext(combatantId);
            }
        }
    ]

    /** @inheritdoc */
    get template() {
        return "systems/wolsung/templates/combat/combat-tracker.hbs";
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.combat-edit').click(event => this._onCombatEdit(event));
        if (!game.user.isGM) ContextMenu.create(this, html, ".directory-item", this.contextEntries);
    }

    _getEntryContextOptions() {
        let options = this.contextEntries;
        return options.concat(super._getEntryContextOptions());
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
        if (!combat.getEmbeddedDocument("Combatant", combatantId).isOwner) return;
        const hand = game.cards.get(data.handId);
        const card = hand.getEmbeddedDocument("Card", data.cardId);
        CONFIG.Cards.documentClass._cardForInitiative(card, hand, combat, combatantId);
    }

    _onCardContext(combatantId) {

        //define user hand
        const hand = wolsungGetHand();

        //get list of Cards on hand
        const cardsDeckId = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).id;
        const cardsList = hand.cards.filter(card => card.data.origin == cardsDeckId);
        const combat = this.viewed;

        return WolsungCardSelectDialog.prompt({
            title: game.i18n.format("wolsung.contextMenu.selectCardInitiative", {
                token: combat.getEmbeddedDocument("Combatant", combatantId).token.name,
                actor: combat.getEmbeddedDocument("Combatant", combatantId).actor.name
            }),
            label: game.i18n.localize("wolsung.chat.useCard.label"),
            content: {
                cards: cardsList,
                selectedCard: cardsList[0],
                cardId: cardsList[0].id
            },
            callback: html => {
                const fd = new FormDataExtended(html.querySelector("form")).toObject();
                const card = hand.getEmbeddedDocument("Card", fd.cardId);
                CONFIG.Cards.documentClass._cardForInitiative(card, hand, combat, combatantId);
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }
}