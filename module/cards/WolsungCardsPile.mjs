export default class WolsungCardsPile extends CardsPile {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "cards-config", "wolsung"],
            template: "systems/wolsung/templates/cards/cards-pile.hbs"
        });
    }
}