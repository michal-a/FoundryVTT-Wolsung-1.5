export default class WolsungActorSheet extends ActorSheet{

    static get defaultOptions(){
        return mergeObject(super.defaultOptions, {
            resizable: false,
            width: 800,
            height: 600,
            classes: ["wolsung", "sheet", "actor"],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "tabInitial" }]
        });
    }

    itemMenu = [
        {
            name: game.i18n.localize("wolsung.contextMenu.print"),
            icon: '<i class="fas fa-comments"></i>',
            condition: element => {
                return element[0].classList.contains("printable");
            },
            callback: element => {
                this._onItemPrint(element[0]);
            }
        },
        {
            name: game.i18n.localize("wolsung.contextMenu.delete"),
            icon: '<i class="fas fa-trash"></i>',
            condition: element => {
                return element[0].classList.contains("removable");
            },
            callback: element => {
                this.actor.deleteEmbeddedDocuments("Item", [element.data("itemId")]);
            }
        }
    ]

    get template() {
        return `systems/wolsung/templates/sheets/actor-${this.actor.data.type}-sheet.hbs`;
    }

    getData() {
        const baseData = super.getData();
        let sheetData = {
            owner: this.actor.isOwner,
            editable: this.isEditable,
            actor: baseData.actor,
            data: baseData.actor.data.data,
            atuty: baseData.actor.data.items.filter(function(item){return item.type == "atut"}),
            zdolnosci: baseData.actor.data.items.filter(function(item){return item.type == "zdolnosc"}),
            gadzety: baseData.actor.data.items.filter(function(item){return item.type == "gadzet"}),
            moce: baseData.actor.data.items.filter(function(item){return item.type == "moc"}),
            zaklecia: baseData.actor.data.items.filter(function(item){return item.type == "zaklecie"}),
            osiagniecia: baseData.actor.data.items.filter(function(item){return item.type == "osiagniecie"}),
            blizny: baseData.actor.data.items.filter(function(item){return item.type == "blizna"}),
            umiejetnosciWalka: baseData.actor.data.items.filter(function(item){return item.type == "umiejetnoscObsady" && item.data.data.konfrontacja == "walka"}),
            umiejetnosciPoscig: baseData.actor.data.items.filter(function(item){return item.type == "umiejetnoscObsady" && item.data.data.konfrontacja == "poscig"}),
            umiejetnosciDyskusja: baseData.actor.data.items.filter(function(item){return item.type == "umiejetnoscObsady" && item.data.data.konfrontacja == "dyskusja"}),
            umiejetnosciBrak: baseData.actor.data.items.filter(function(item){return item.type == "umiejetnoscObsady" && item.data.data.konfrontacja == "brak"}),
            config: CONFIG.wolsung
        }
        return sheetData;
    }

    activateListeners(html) {

        html.find(".item-create").click(this._onItemCreate.bind(this));
        html.find(".item-click").click(this._onItemClick.bind(this));
        html.find(".item-delete").click(this._onItemDelete.bind(this));
        html.find(".inline-edit").change(this._onUmiejetnoscEdit.bind(this));
        
        //Owner only Listeners
        if (this.actor.isOwner) {
            html.find(".konfrontacja-button").click(this._onGenerujKonfrontacje.bind(this));
            html.find(".umiejetnosc-roll").click(this._onUmiejetnoscRoll.bind(this));
            html.find(".specializacja-roll").click(this._onSpecjalizacjaRoll.bind(this));
            html.find(".bogactwo-roll").click(this._onBogactwoRoll.bind(this));
            html.find(".obsada-roll").click(this._onObsadaRoll.bind(this));

            new ContextMenu(html, ".item-context", this.itemMenu);
        }

        super.activateListeners(html);
    }

    /**
     * Handle a cration of new embedded Item
     * @param {Event} event 
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        let element = event.currentTarget;

        // Define Item name and type based of data-type attribute of the target HTML tag
        let itemData = {
            name: game.i18n.localize("wolsung." + element.dataset.type + ".name"),
            type: element.dataset.type
        }

        // Create the embedded Item
        let result = await this.actor.createEmbeddedDocuments("Item", [itemData]);

        // Get the embedded Item object
        let item = this.actor.items.get(result[0].data._id);

        // Render the Item sheet for all Item's types except umiejetnoscObsady
        if (element.dataset.konfrontacja == undefined) item.sheet.render(true);
        // Update data.konfrontacja of umiejetnoscObsady Item type
        else item.update({ ["data.konfrontacja"]: element.dataset.konfrontacja });
    }

    /**
     * Handle click on the embedded Item
     * @param {Event} event 
     */
    _onItemClick(event) {
        event.preventDefault();
        let element = event.currentTarget;
        // Print element on the chat if ctrl is pushed down and Item is printable
        if (event.ctrlKey && element.classList.contains("printable") && this.actor.isOwner) {
            this._onItemPrint(element);
        }
        // Show Item sheet
        else {
            this._onShowItemSheet(element);
        }
    }

    /**
     * Render sheet of the embedded Item for editing and detailed view
     * @param {Object} element 
     */
    _onShowItemSheet(element) {
        const itemId = element.dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }
    /**
     * Print Item on Chat
     * @param {Object} element 
     */
    _onItemPrint(element) {
        const itemId = element.dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.printOnChat();
    }

    /**
     * Delete embedded Item
     * @param {Event} event 
     */
    _onItemDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.dataset.itemId;
        this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    /**
     * Handle inline edit of umiejetnoscObsady Item's type
     * @param {Event} event 
     * @returns 
     */
    _onUmiejetnoscEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;
        return item.update({ [field]: element.value });
    }

    /**
     * Provide Dialog window for calculating odpornosc based on the type of the konfrontacja
     * @param {Event} event 
     * @returns 
     */
    async _onGenerujKonfrontacje(event) {
        event.preventDefault();

        const template = "systems/wolsung/templates/chat/konfrontacja-dialog.hbs";
        const html = await renderTemplate(template, {});
        return new Promise(resolve => {
            const data = {
                title: game.i18n.localize("wolsung.chat.konfrontacja.title"),
                content: html,
                buttons: {
                    normal: {
                        label: game.i18n.localize("wolsung.chat.konfrontacja.normal"),
                        callback: html => resolve(this._updateKonfrontacja(html[0].querySelector("form")))
                    },
                    cancel: {
                        label: game.i18n.localize("wolsung.chat.konfrontacja.cancel"),
                        callback: html => resolve({cancelled: true})
                    }
                },
                default: "normal",
                close: () => resolve({cancelled: true})
            };
            new Dialog(data, null).render(true);
        });
    }

    /**
     * Update odpornosc of the actor based of the selected konfrontacja type in Dialog
     * @param {Object} form 
     */
    _updateKonfrontacja(form){
        let odpornosc = 13 - parseInt(this.actor.data.data.atrybuty[form.typ.value]["wartosc"]) - Math.abs(this.actor.data.data.atrybuty[form.typ.value]["rany"]);
        if (form.vabanque.checked) {
            odpornosc += 3;
        }
        let maxOdpornosc = {data: {konfrontacja: {odpornosc: {value: odpornosc, max: odpornosc}}}};
        this.actor.update(maxOdpornosc);
    }

    _onUmiejetnoscRoll(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let rollName = element.dataset.umiejetnoscname;
        let rollPodstawa = parseInt(this.actor.data.data.umiejetnosci[rollName]["total"]);
        let rollAtrybut = this.actor.data.data.umiejetnosci[rollName]["atrybut"];
        let rollKosc = parseInt(this.actor.data.data.atrybuty[rollAtrybut]["wartosc"]) + Math.abs(this.actor.data.data.atrybuty[rollAtrybut]["rany"]);
        let rollPula = this.actor.data.data.pula;
        rollName = game.i18n.localize("wolsung.umiejetnosci." + rollName);
        rollName += " (" + game.i18n.localize("wolsung.bohater.atrybuty.skrot." + rollAtrybut) + ")";
        let rollData = {
            name: rollName,
            podstawa: rollPodstawa,
            kosc: this._rollOnJoker() ? rollKosc - 1 : rollKosc,
            pula: rollPula
        };
        if (event.shiftKey) {
            this._onSimpleRoll(rollData);
        }
        else this._onPrepareRoll(rollData);
    }

    _onSpecjalizacjaRoll(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let umiejetnosc = element.dataset.umiejetnoscname;
        let rollName = this.actor.data.data.umiejetnosci[umiejetnosc]["specjalizacja"]
        if ( rollName !== "") {
            let rollPodstawa = this.actor.data.data.umiejetnosci[umiejetnosc]["specjalizacjaTotal"];
            let rollAtrybut = this.actor.data.data.umiejetnosci[umiejetnosc]["atrybut"];
            let rollKosc = parseInt(this.actor.data.data.atrybuty[rollAtrybut]["wartosc"]) + Math.abs(this.actor.data.data.atrybuty[rollAtrybut]["rany"]);
            let rollPula = this.actor.data.data.pula;
            rollName += " - " + game.i18n.localize("wolsung.umiejetnosci." + umiejetnosc) + " (" + game.i18n.localize("wolsung.bohater.atrybuty.skrot." + rollAtrybut) + ")";
            let rollData = {
                name: rollName,
                podstawa: rollPodstawa,
                kosc: this._rollOnJoker() ? rollKosc - 1 : rollKosc,
                pula: rollPula
            };
            if (event.shiftKey) {
                this._onSimpleRoll(rollData);
            }
            else this._onPrepareRoll(rollData);;
        }
    }

    _onBogactwoRoll(event) {
        event.preventDefault();
        let rollName = game.i18n.localize("wolsung.bohater.bogactwo.name");
            let rollPodstawa = parseInt(this.actor.data.data.personalia.bogactwo.biezace);
            let rollKosc = parseInt(this.actor.data.data.atrybuty.prz.wartosc) + Math.abs(this.actor.data.data.atrybuty.prz.rany);
            let rollPula = this.actor.data.data.pula;
            let rollData = {
                name: rollName,
                podstawa: rollPodstawa,
                kosc: this._rollOnJoker() ? rollKosc - 1 : rollKosc,
                pula: rollPula
            };
            if (event.shiftKey) {
                this._onSimpleRoll(rollData);
            }
            else this._onPrepareRoll(rollData);
    }

    _onObsadaRoll(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = element.dataset.itemId;
        let item = this.actor.items.get(itemId);
        let rollName = item.name;
        let rollPodstawa = parseInt(item.data.data.podstawa);
        let rollKosc = parseInt(item.data.data.przerzut);
        let rollPula = this.actor.data.data.pula;
        let rollData = {
            name: rollName,
            podstawa: rollPodstawa,
            kosc: this._rollOnJoker() ? rollKosc - 1 : rollKosc,
            pula: rollPula
        };
        if (event.shiftKey) {
            this._onSimpleRoll(rollData);
        }
        else this._onPrepareRoll(rollData);
    }

    async _onPrepareRoll(rollData) {
        const template = "systems/wolsung/templates/chat/prepareRoll-dialog.hbs";
        const html = await renderTemplate(template, rollData);
        return new Promise(resolve => {
            const data = {
                title: game.i18n.localize("wolsung.chat.prepareRoll.title"),
                content: html,
                buttons: {
                    normal: {
                        label: game.i18n.localize("wolsung.chat.prepareRoll.normal"),
                        callback: html => resolve(this._onPerformRoll(html[0].querySelector("form"), rollData))
                    },
                    cancel: {
                        label: game.i18n.localize("wolsung.chat.prepareRoll.cancel"),
                        callback: html => resolve({cancelled: true})
                    }
                },
                default: "normal",
            };
            new Dialog(data, null).render(true);
            close: () => resolve({cancelled: true});
        });
    }

    async _onSimpleRoll(rollData) {
        let rollFormule = "{" + Array(parseInt(rollData.pula)).fill("1d10x>=" + rollData.kosc).join() + "}kh + " + rollData.podstawa;
        let label = rollData.name + " " + rollData.pula + game.i18n.localize("wolsung.diceShort") + "10 "+ rollData.podstawa + "/" + rollData.kosc + "+";
        let messageData = {
            speaker: ChatMessage.getSpeaker( {actor: this.actor }),
            flavor: label
        }
        let r = new Roll(rollFormule);
        await r.evaluate();
        r.toMessage(messageData)
    }

    async _onPerformRoll(form, rollData) {
        let rollMod = rollData.podstawa + parseInt(form.mod.value);
        let rollFormule = "{" + Array(parseInt(form.pula.value)).fill("1d10x>=" + form.kosc.value).join() + "}kh + " + rollMod;
        let label = rollData.name + " " + form.pula.value + game.i18n.localize("wolsung.diceShort") + "10 "+ rollMod + "/" + form.kosc.value + "+";
        let messageData = {
            speaker: ChatMessage.getSpeaker( {actor: this.actor }),
            flavor: label
        }
        let r = new Roll(rollFormule);
        await r.evaluate();
        r.toMessage(messageData)
    }

    _rollOnJoker() {
        if (game.combat && game.combat.round > 0) {
            for (let combatant of game.combat.combatants.contents.filter(c => {return c.data.actorId == this.actor.id})) {
                if (combatant.initiative >= 15) return true;
            }
        }
        return false;
    }
    
}