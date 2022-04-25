/**
 * Return parameters of the Wolsung Roll formula
 * @param {String} formula 
 * @returns {Object} {numberOfDices, explodeOn, modficator}
 */
export function wolsungRollFormat(formula) {
    let explodeOn, modificator
    [explodeOn, modificator] = formula.split("kh");
    modificator = parseInt(modificator.replaceAll(" ", ""));
    explodeOn = explodeOn.split(',');
    const numberOfDices =  explodeOn.length;
    explodeOn = parseInt(explodeOn[0].split(">=")[1]);
    
    return {numberOfDices: numberOfDices, explodeOn: explodeOn, modificator: modificator};
}

export function isWolsungRoll(formula) {
    if (formula.match(/^{(1d10x>=\d\d?,?)+}kh\s[\+\-]\s\d+$/g)) return true;
    else return false;
}

export async function wolsungRollCommand(messageText, data) {
    let match = messageText.match(new RegExp(`^/wr\\s*(\\d+)\\s*d\\s*(\\d+)\\s*([\+\-]\\s*\\d+)?\\s*(#.*)?$`));
    if (!match) return (messageText) => {
        ui.notifications.error(
            `<div>Failed parsing your command:</div>
            <div><p style="font-family: monospace">${messageText}</p></div>
            <div>Try instead: <p style="font-family: monospace">/wr 2d9 + 3 #something</p></div>
            `,
        );
        return null;
    }
    let rollFormule = "{" + Array(parseInt(match[1])).fill("1d10x>=" + match[2]).join() + "}kh";
    if (typeof match[3] !== "undefined") {
        rollFormule += match[3].replace(/\s/g, '');
    }
    else {
        rollFormule += "+ 0";
    }
    let r = new Roll(rollFormule);
    await r.evaluate();
    if (typeof match[4] !== "undefined") {
        r.toMessage({flavor: match[4].replace(/^#\s/, '')});
    }
    else r.toMessage();
}

export async function wolsungSessionStart(messageText, data) {
    //Checking if user is GM
    if (game.user.data.role != 4) {
        ui.notifications.error("<div>" + game.i18n.localize("wolsung.wss.notGM") + "</div>");
        return null;
    }

    let hands = [];

    if (messageText == "/wss") {
        //Finding all hands in world if the command was run without arguments
        hands = game.cards.filter(cards => cards.type == "hand");
    }
    else {
        //Parsing arguments to array of hands objects
        hands = messageText.match(/(?:[^\s"']+|['"][^'"]*["'])+/g).slice(1).map(handName =>{
            if ((handName.charAt(0) == "'" || handName.charAt(0) == '"') && (handName.charAt(handName.length - 1) == "'" || handName.charAt(handName.length - 1) == '"')) handName = handName.substring(1,handName.length - 1);
            return game.cards.getName(handName);
        });
        //Checking for undefined hands
        if (hands.filter(hand => hand == undefined).length > 0) {
            const uiText1 = game.i18n.localize("wolsung.wss.undefinedHand");
            ui.notifications.error(
                `<div>${uiText1}</div>
                <div><p style="font-family: monospace">${messageText}</p></div>
                `,
            );
            return null;
        }
    }

    //Filtering players owned hands
    const playersHands = hands.filter(cards => cards.hasPlayerOwner);
    //Filtering GM hand
    const gmHand = hands.filter(cards => !cards.hasPlayerOwner);

    //GM has to have one hand
    if (gmHand.length != 1) {
        const uiText1 = game.i18n.localize("wolsung.wss.gmHandError");
        const uiText2 = game.i18n.localize("wolsung.wss.pleaseSpecify");
        ui.notifications.error(
            `<div>${uiText1}</div>
            <div><p style="font-family: monospace">${messageText}</p></div>
            <div>${uiText2} <p style="font-family: monospace">/wss "gm hand1" "player1 hand" "player2 hand" "player3 hand"</p></div>
            `,
        );
        return null;
    }

    //There should be at least one player hand
    if (playersHands.length < 1) {
        const uiText1 = game.i18n.localize("wolsung.wss.playerHandError");
        const uiText2 = game.i18n.localize("wolsung.wss.pleaseSpecify");
        ui.notifications.error(
            `<div>${uiText1}</div>
            <div><p style="font-family: monospace">${messageText}</p></div>
            <div>${uiText2} <p style="font-family: monospace">/wss "gm hand1" "player1 hand" "player2 hand" "player3 hand"</p></div>
            `,
        );
        return null;
    }

    //Reading system settings
    const wolsungDeck = game.cards.getName(game.settings.get("wolsung", "wolsungDeck"));
    const zetonDeck = game.cards.getName(game.settings.get("wolsung", "zetonDeck"));
    const noPlayers = game.settings.get("wolsung", "numberOfPlayers");

    //Recalling all cards and tokens and suffle Card deck
    await wolsungDeck.reset({chatNotification: false});
    await wolsungDeck.shuffle({chatNotification: false});
    await zetonDeck.reset({chatNotification: false});

    //Deal tokens and cards to players' hands
    await zetonDeck.deal(playersHands, 6, {how: 0, chatNotification: false});
    for (let i = 0; i < 3; i++) await wolsungDeck.deal(playersHands, 1, {how: 2, chatNotification: false});

    //Deal tokens and cards to GM's hand
    let gmMaxCards = 4;
    let gmMaxTokens = 8;
    if (noPlayers > 4) {
        gmMaxCards = noPlayers;
        gmMaxTokens = noPlayers * 2;
    }
    await zetonDeck.deal(gmHand, gmMaxTokens, {how: 0, chatNotification: false});
    for (let i = 0; i < gmMaxCards; i++) await wolsungDeck.deal(gmHand, 1, {how: 2, chatNotification: false});

    //Inform about success
    const uiText1 = game.i18n.localize("wolsung.wss.success");
    ui.notifications.info(
        `
        <div>${uiText1}</div>
        `,
    );
}