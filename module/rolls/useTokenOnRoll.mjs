import { isWolsungRoll, wolsungRollFormat } from "./wolsungRollFormat.mjs";

/**
 * Check if Context Menu Entry could be shown
 * @param {ChatMessage} message 
 * @returns {boolean} can Context Menu Entry be shown
 */
export function useTokenOnRollContextCondition(message) {
    //check if message is Wolsung Roll
    if (!message.isRoll || !isWolsungRoll(message._roll._formula)) return false;

    //check if socketlib is active
    try {
        if (!game.modules.get('socketlib').active) return false;
    }
    catch (e) {
        return false;
    }

    //check if user have Tokens in hand
    let haveTokens = false;
    let hand
    if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
    else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];
    if (hand != undefined) {
        const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
        haveTokens = (hand.cards.filter(card => card.data.origin == zetonDeckId).length > 0);
    }
    return  haveTokens;
}

/**
 * Render Dialog for selecting Token's effect on Roll
 * @param {ChatMessage} message 
 * @returns 
 */
export async function useTokenOnRollDialog(message) {
    //define user hand
    let hand
    if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
    else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];

    //render html for Dialog
    const html = await renderTemplate("systems/wolsung/templates/chat/use-token-dialog.hbs", {});

    //render Dialog
    return new Dialog({
        title: game.i18n.format("wolsung.chat.useToken.title", wolsungRollFormat(message.roll._formula)),
        content: html,
        buttons: {
            bonus: {
                label: game.i18n.localize("wolsung.chat.useToken.bonus"),
                callback: async html => {
                    if (await discardToken(hand)) {
                        const fd = new FormDataExtended(html[0].querySelector("form")).toObject();
                        useTokenOnRollBonus(message, fd.bonus);
                    } 
                }
            },
            dice: {
                label: game.i18n.localize("wolsung.chat.useToken.dice"),
                callback: async () => {
                    if (await discardToken(hand)) useTokenOnRollDice(message);
                }
            }
        }
    }).render(true);
}

/**
 * Add Bonus to the Roll result from the ChatMessage
 * @param {ChatMessage} message 
 * @param {Number} bonus 
 */
export async function useTokenOnRollBonus(message, bonus) {
    let modRoll = message.roll;
    let diceFormula = modRoll.terms[0].terms[0];

    //add bonus from Token
    if (modRoll.terms[1].operator == "+") {
        modRoll.terms[2].number += bonus;
        if (modRoll.terms[2].number < 0) {
            modRoll.terms[1].operator = "-";
            modRoll.terms[2].number = -modRoll.terms[2].number;
        }
    }
    else {
        modRoll.terms[2].number -= bonus;
        if (modRoll.terms[2].number <= 0) {
            modRoll.terms[1].operator = "+";
            modRoll.terms[2].number = -modRoll.terms[2].number;
        }
    }
    

    //add Roll flavor to note the Token usage
    const modFlavor = game.i18n.format("wolsung.chat.rollFlavor.addTokenBonus", {
        user: (game.user.charname ? game.user.charname : game.user.name),
        what: game.i18n.localize(bonus >= 0 ? "wolsung.chat.rollFlavor.increase": "wolsung.chat.rollFlavor.decrease"),
        bonus: (bonus >=0 ? bonus : -bonus)
    });
    modRoll.flavor = message.data.flavor ? (message.data.flavor + "<br>" + modFlavor) : modFlavor;

    //update Roll formula
    modRoll._formula = "{" + Array(modRoll.terms[0].terms.length).fill(diceFormula).join() + "}kh " + modRoll.terms[1].operator + " " + modRoll.terms[2].number;
    
    //prepare for Roll.evaluate()
    modRoll._evaluated = false
    modRoll.terms[2]._evaluated = false;

    //evaluate Roll
    await modRoll.evaluate();

    //update ChatMessage
    await socket.executeAsGM("updateChatMessage", message.id, {
        flavor: modRoll.flavor,
        content: modRoll.total,
        roll: JSON.stringify(modRoll)
    });
}

/**
 * Add Dice to the Roll from the Chat Message
 * @param {ChatMessage} message 
 */
export async function useTokenOnRollDice(message) {
    let modRoll = message.roll;
    let diceFormula = modRoll.terms[0].terms[0];

    //prepare new Dice
    modRoll.terms[0].terms.push(diceFormula); 
    let additionalDice = new Roll(diceFormula);

    //evaluate new Dice
    await additionalDice.evaluate();
    if (game.dice3d != undefined) await game.dice3d.showForRoll(additionalDice, game.user, true);

    //add Dice to Roll
    modRoll.terms[0].rolls.push(additionalDice);

    //add Roll flavor to note the Token usage
    const modFlavor = game.i18n.format("wolsung.chat.rollFlavor.addTokenDice", {
        user: (game.user.charname ? game.user.charname : game.user.name)
    });
    modRoll.flavor = message.data.flavor ? (message.data.flavor + "<br>" + modFlavor) : modFlavor;

    //update Roll formula
    modRoll._formula = "{" + Array(modRoll.terms[0].terms.length).fill(diceFormula).join() + "}kh " + modRoll.terms[1].operator + " " + modRoll.terms[2].number;

    //prepare for Roll.evaluate()
    modRoll._evaluated = false;
    for (let roll of modRoll.terms[0].rolls) roll._evaluated = false;
    modRoll.terms[0].results = [];
    modRoll.terms[0]._evaluated = false;

    //evaluate Roll
    await modRoll.evaluate();

    //update ChatMessage
    await socket.executeAsGM("updateChatMessage", message.id, {
        flavor: modRoll.flavor,
        content: modRoll.total,
        roll: JSON.stringify(modRoll)
    });
}

/**
 * Try to discard one Token from the Cards Hand and return status
 * @param {WolsungCards} hand 
 * @returns {boolean} was a success
 */
export async function discardToken(hand) {
    const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
    try {
        await hand.cards.filter(card => card.data.origin == zetonDeckId)[0].reset();
    }
    catch (e) {
        ui.notifications.error("<div>" + game.i18n.localize("wolsung.chat.useToken.empty") + "</div>")
        return false;
    }
    return true;
}