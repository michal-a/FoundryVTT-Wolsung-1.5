/** @inheritdoc */
export default class WolsungCardConfig extends CardConfig {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "card-config", "wolsung"],
            template: "systems/wolsung/templates/cards/card-config.hbs"
        });
    }
}