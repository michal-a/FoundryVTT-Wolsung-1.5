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
                    const notify = game.i18n.localize("wolsung.contextMenu.giveTokenNotify");
                    ui.notifications.info(
                        `
                        <div>${notify} ${hand.name}.</div>
                        `,
                    );
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
                    const notify = game.i18n.localize("wolsung.contextMenu.dealCardNotify");
                    ui.notifications.info(
                        `
                        <div>${notify} ${hand.name}.</div>
                        `,
                    );
                }
            }
        ].concat(options);
    }
}