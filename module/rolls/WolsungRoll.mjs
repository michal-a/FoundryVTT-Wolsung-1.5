export default async function rollFromChatMessageWolsungCommand(messageText, data) {
    let match = messageText.match(new RegExp(`^/wr\\s*(\\d+)\\s*d\\s*(\\d+)\\s*([\+\-]\\s*\\d+)?\\s*(#.*)?$`));
    if (!match) return (messageText) => {
        ui.notifications.error(
            `<div>Failed parsing your command:</div>
            <div><p style="font-family: monospace">${messageText}</p></div>
            <div>Try instead: <p style="font-family: monospace">/wr 2d9 #something</p></div>
            `,
        );
        return null;
    }
    var rollFormule = "{" + Array(parseInt(match[1])).fill("1d10x>=" + match[2]).join() + "}kh";
    if (typeof match[3] !== "undefined") {
        rollFormule += match[3].replace(/\s/g, '')
    }
    let r = new Roll(rollFormule);
    await r.evaluate();
    r.toMessage();
}