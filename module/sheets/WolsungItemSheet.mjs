export default class WolsungItemSheet extends ItemSheet{

    static get defaultOptions(){
        return mergeObject(super.defaultOptions, {
            width: 600,
            height: 340,
            classes: ["wolsung", "sheet", "item"],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "description" }]
        });
    }

    get template() {
        return `systems/wolsung/templates/sheets/item-${this.item.data.type}-sheet.html`;
    }

    getData() {
        const baseData = super.getData();
        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: baseData.item,
            data: baseData.item.data.data,
            config: CONFIG.wolsung
        }
        return sheetData;
    }

}