export default class WolsungCardsDeck extends CardsConfig {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "cards-config", "wolsung"],
            template: "systems/wolsung/templates/cards/cards-deck.hbs"
        });
    }
}