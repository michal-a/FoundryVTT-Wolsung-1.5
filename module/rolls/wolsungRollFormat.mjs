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