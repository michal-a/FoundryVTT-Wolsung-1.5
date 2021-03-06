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

/**
 * Return if Roll formula is for Wolsung roll
 * @param {String} formula 
 * @returns {Boolean}
 */
export function isWolsungRoll(formula) {
    if (formula.match(/^{(1d10x>=\d\d?,?)+}kh\s[\+\-]\s\d+$/g)) return true;
    else return false;
}

/**
 * Handle creating of Wolsung Roll by command /wr
 * @param {String} messageText 
 * @param {Object} data 
 * @returns 
 */
export async function wolsungRollCommand(messageText, data) {
    // Match command to regexp
    let match = messageText.match(new RegExp(`^/wr\\s*(\\d+)\\s*d\\s*(\\d+)\\s*([\+\-]\\s*\\d+)?\\s*(#.*)?$`));
    // Return error if command doesn't match
    if (!match) return (messageText) => {
        ui.notifications.error(
            `<div>Failed parsing your command:</div>
            <div><p style="font-family: monospace">${messageText}</p></div>
            <div>Try instead: <p style="font-family: monospace">/wr 2d9 + 3 #something</p></div>
            `,
        );
        return null;
    }
    // Prepare formula for roll
    let rollFormula = "{" + Array(parseInt(match[1])).fill("1d10x>=" + match[2]).join() + "}kh";
    // Add modificator or + 0 if there is no modificator
    if (typeof match[3] !== "undefined") {
        rollFormula += match[3].replace(/\s/g, '');
    }
    else {
        rollFormula += "+ 0";
    }
    // Evaluate roll from formula
    let r = new Roll(rollFormula);
    await r.evaluate();

    // Add flavor if provided after #
    if (typeof match[4] !== "undefined") {
        r.toMessage({flavor: match[4].replace(/^#\s/, '')});
    }
    else r.toMessage(data);
}

/**
 * Handle command /wss for dealing cards at start of the session
 * @param {String} messageText 
 * @param {Object} data 
 * @returns 
 */
export async function wolsungSessionStart(messageText, data) {
    //Checking if user is GM
    if (game.user.data.role != 4) {
        ui.notifications.error("<div>" + game.i18n.localize("wolsung.wss.notGM") + "</div>");
        return null;
    }

    let playersHands = []

    if (messageText == "/wss") {
        // Get Players Hands
        for (let player of game.users.players) playersHands.push(game.cards.get(player.getFlag('wolsung', 'handId')));
    }
    else {
        // Get Players Hands' Ids
        let playersHandsIds = []
        for (let player of game.users.players) playersHandsIds.push(player.getFlag('wolsung', 'handId'));

        let errorHands = [];

        // Parse arguments to array of hands objects
        playersHands = messageText.match(/(?:[^\s"']+|['"][^'"]*["'])+/g).slice(1).map(handName =>{
            if ((handName.charAt(0) == "'" || handName.charAt(0) == '"') && (handName.charAt(handName.length - 1) == "'" || handName.charAt(handName.length - 1) == '"')) handName = handName.substring(1,handName.length - 1);
            let hand;
            // Try to find all hands by their names
            try { 
                hand = game.cards.getName(handName);
                if (!playersHandsIds.includes(hand.id)) errorHands.push(handName);
            }
            catch (e) {
                errorHands.push(handName);
            }
            return hand;
        });

        // Check for errors in hand name. If they exist, stop execution
        if (errorHands.length > 0) {
            ui.notifications.error(game.i18n.format("wolsung.wss.undefinedHand", {hands: errorHands.join(', ')}));
            return null;
        }
    }

    //Filtering GM hand
    const gmHand = [game.cards.get(game.settings.get('wolsung', 'GMHandId'))];

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
    ui.notifications.info(game.i18n.localize("wolsung.wss.success"));
}

/**
 * Return Cards object which is current user's hand
 * @returns {Object}
 */
export function wolsungGetHand() {
    if (game.user.role == 4) return game.cards.get(game.settings.get('wolsung', 'GMHandId'));
    else return game.cards.get(game.user.getFlag('wolsung', 'handId'))
}