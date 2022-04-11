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
}