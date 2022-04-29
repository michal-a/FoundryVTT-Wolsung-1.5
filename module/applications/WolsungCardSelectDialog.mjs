/** @inheritdoc */
export default class WolsungCardSelectDialog extends Dialog {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/wolsung/templates/chat/card-selector-dialog.hbs",
            classes: ["dialog"],
            width: 400,
            height: 337,
            jQuery: true
        });
    }
    
    /** @inheritdoc */
    activateListeners(html) {
        html.find(".card-selector").change(this._updateSelectedCard.bind(this));

        super.activateListeners(html)
    }

    /**
     * Render Card view inner section on change of the card
     * @param {Object} event 
     */
    async _updateSelectedCard(event) {
        event.preventDefault();
        const cardId = event.currentTarget.value;
        this.data.content.selectedCard = this.data.content.cards.filter(card => card.id == cardId)[0];

        //render Card informations only
        const html = await renderTemplate("systems/wolsung/templates/chat/card-selector-dialog-inner.hbs", {content: this.data.content});
        this._element.find('.wolsung-card-info').html(html);
        
    }
}