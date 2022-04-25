import { isWolsungRoll, wolsungRollFormat } from "./functions.mjs";

export default function registerHandlebars() {
    Handlebars.registerHelper("cleartext", function(content){
        let result = "";
        result = content.replace(/<\/?[^>]+(>|$)/g, "");
        result = result.replaceAll("&oacute;", "ó");
        result = result.replaceAll("&nbsp;", " ");
        return result;
    });

    Handlebars.registerHelper("localizeCFG", function(variable, content){
        return game.i18n.localize(CONFIG['wolsung'][variable][content]);
    });

    Handlebars.registerHelper("localizeKey", function(variable, key){
        return game.i18n.localize(variable + "." + key)
    });

    Handlebars.registerHelper("initiative", function(initiative){
        let result = ""
        initiative = initiative.toString().split(".");
        if (initiative[0] == "11") initiative[0] = game.i18n.localize("wolsung.cards.initiative.jack");
        if (initiative[0] == "12") initiative[0] = game.i18n.localize("wolsung.cards.initiative.queen");
        if (initiative[0] == "13") initiative[0] = game.i18n.localize("wolsung.cards.initiative.king");
        if (initiative[0] == "14") initiative[0] = game.i18n.localize("wolsung.cards.initiative.ace");
        if (initiative[0] == "15") initiative[0] = game.i18n.localize("wolsung.cards.initiative.joker");
        result += initiative[0];
        if (initiative[1] == "40") result += "♠";
        if (initiative[1] == "30") result += "♥";
        if (initiative[1] == "20") result += "♦";
        if (initiative[1] == "10") result += "♣";
        return result;
    });

    Handlebars.registerHelper("cardHeight", function(){
        let result = 300 * game.settings.get("wolsung", "cardScale");
        result = result.toString() + "px";
        return result;
    });

    Handlebars.registerHelper("cardWidth", function(height, width){
        let result = 300 * width * game.settings.get("wolsung", "cardScale") / height;
        result = result.toString() + "px";
        return result;
    });

    Handlebars.registerHelper("gameSetting", function(namespace, key){
        return game.settings.get(namespace, key);
    });

    Handlebars.registerHelper("cardsVisibility", function(hasPlayerOwner){
        return (hasPlayerOwner && !game.user.isGM) || (!hasPlayerOwner && game.user.isGM);
    });

    Handlebars.registerHelper("isJoker", function(card){
        return (card.data.value == 15)
    });

    Handlebars.registerHelper("rollFormula", function(formula){
        if (isWolsungRoll(formula)) {
            const rollInfo = wolsungRollFormat(formula);
            const dices = game.i18n.localize("wolsung.chat.rollMessage." + (rollInfo.numberOfDices == 1 ? "dice" : "dices"))
            return game.i18n.format("wolsung.chat.rollMessage.formula", {
                dices: dices,
                ...rollInfo
            })
        }
        else return formula;
    })

    Handlebars.registerHelper("cardDetails", function(card) {
        let title = `${game.i18n.localize("wolsung.cards.hand.bonus")}${card.data.data.testBonus}
${game.i18n.localize("wolsung.cards.hand.sukces")}${card.data.data.st}`;
        if (card.data.data.podbicie) title += `
${game.i18n.localize("wolsung.cards.hand.podbicie")}${card.data.data.podbicie}`;
        if (card.data.value == 15) title += `
${game.i18n.localize("wolsung.cards.hand.jocker")}`
        return title
    })
}