import wolsungRollFormat from "./wolsungRollFormat.mjs";

export function useTokenOnRollContexCondition(message) {
    //check if message is Roll
    if (!game.messages.get(message.data("messageId")).isRoll) return false;

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

export async function useTokenOnRollDialog(message) {
    //define user hand
    let hand
    if (game.user.role == 4) hand = game.cards.filter(cards => (cards.type == "hand") && !cards.hasPlayerOwner)[0];
    else hand = game.cards.filter(cards => (cards.type == "hand") && cards.isOwner)[0];

    //render html for Dialog
    const html = await renderTemplate("systems/wolsung/templates/chat/use-token-dialog.hbs", {});

    //define and render Dialog
    return new Dialog({
        title: game.i18n.format("wolsung.chat.useToken.title", wolsungRollFormat(message.roll)),
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
    const modFlavor = "+ " + (game.user.charname ? game.user.charname : game.user.name) + game.i18n.localize("wolsung.chat.rollFlavor.addTokenBonus") + bonus;
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
    const modFlavor = "+ " + (game.user.charname ? game.user.charname : game.user.name) + game.i18n.localize("wolsung.chat.rollFlavor.addTokenDice");
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