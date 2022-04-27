/** @inheritdoc */
export default class WolsungCombatTracker extends CombatTracker {
    
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
}