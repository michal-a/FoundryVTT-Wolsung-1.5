/** @inheritdoc */
export default class WolsungCardsDirectory extends CardsDirectory {

    /** @override */
    _getEntryContextOptions() {
        const options = super._getEntryContextOptions();
        return [
            {
                name: "wolsung.contextMenu.giveToken",
                icon: "<i>" + CONFIG.wolsung.icons.zeton + "</i>",
                condition: li => {
                    const type = this.constructor.collection.get(li.data("documentId")).type;
                    return game.user.isGM && type == "hand"
                },
                callback: li => {
                    const hand = this.constructor.collection.get(li.data("documentId"));
                    const deck = game.cards.getName(game.settings.get("wolsung", "zetonDeck"));
                    deck.deal([hand], 1, {how: 0, chatNotification: false});
                    ui.notifications.info(game.i18n.format("wolsung.contextMenu.giveTokenNotify", {
                        hand: hand.name
                    }));
                }
            },
            {
                name: "wolsung.contextMenu.dealCard",
                icon: "<i>" + CONFIG.wolsung.icons.dealCard + "</i>",
                condition: li => {
                    const type = this.constructor.collection.get(li.data("documentId")).type;
                    return game.user.isGM && type == "hand"
                },
                callback: li => {
                    const hand = this.constructor.collection.get(li.data("documentId"));
                    const deck = game.cards.getName(game.settings.get("wolsung", "wolsungDeck"));
                    deck.deal([hand], 1, {how: 2, chatNotification: false});
                    ui.notifications.info(game.i18n.format("wolsung.contextMenu.dealCardNotify", {
                        name: hand.name
                    }));
                }
            },
            {
                name: "wolsung.contextMenu.rename",
                icon: '<i class="fas fa-pen"></i>',
                condition: li => {
                    const type = this.constructor.collection.get(li.data("documentId")).type;
                    return game.user.isGM && type == "hand"
                },
                callback: async li => {
                    const hand = this.constructor.collection.get(li.data("documentId"));
                    const html = await renderTemplate("systems/wolsung/templates/cards/dialog-rename-hand.hbs", {
                        handName: hand.name
                    });
                    return Dialog.prompt({
                        title: game.i18n.localize("wolsung.contextMenu.rename"),
                        content: html,
                        callback: html => {
                            const form = html.querySelector("form");
                            const fd = new FormDataExtended(form).toObject();
                            hand.update({name: fd.handName})
                        },
                        rejectClose: false,
                        options: {jQuery: false}
                    });
                }
            }
        ].concat(options);
    }
}