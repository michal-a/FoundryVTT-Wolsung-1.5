export const wolsungSettings = {};

wolsungSettings.wolsungDeck = {
    config: true,
    scope: "world",
    name: "SETTINGS.wolsungDeck.name",
    hint: "SETTINGS.wolsungDeck.label",
    type: String,
    default: "Wolsung"
};

wolsungSettings.initiativePile = {
    config: true,
    scope: "world",
    name: "SETTINGS.initiativePile.name",
    hint: "SETTINGS.initiativePile.label",
    type: String,
    default: "Inicjatywa"
};

wolsungSettings.discardPile = {
    config: true,
    scope: "world",
    name: "SETTINGS.discardPile.name",
    hint: "SETTINGS.discardPile.label",
    type: String,
    default: "Odrzucone"
};

wolsungSettings.zetonDeck = {
    config: true,
    scope: "world",
    name: "SETTINGS.zetonDeck.name",
    hint: "SETTINGS.zetonDeck.label",
    type: String,
    default: "Żetony"
};

wolsungSettings.cardScale = {
    config: true,
    scope: "client",
    name: "SETTINGS.cardScale.name",
    hint: "SETTINGS.cardScale.label",
    type: Number,
    default: 1
};

wolsungSettings.numberOfPlayers = {
    config: true,
    scope: "world",
    name: "SETTINGS.numberOfPlayers.name",
    hint: "SETTINGS.numberOfPlayers.label",
    type: Number,
    default: 4
};

wolsungSettings.sortingOfSkills = {
    config: true,
    scope: "client",
    name: "SETTINGS.sortingOfSkills.name",
    label: "SETTINGS.sortingOfSkills.label",
    type: String,
    choices: {
        "row": "SETTINGS.sortingOfSkills.row",
        "column": "SETTINGS.sortingOfSkills.column"
    },
    default: "row",
    onChange: value => {
        if (value == "row") game.settings.set("wolsung", "sortingOfSkillsBoolean", true);
        else game.settings.set("wolsung", "sortingOfSkillsBoolean", false);
    }
};

wolsungSettings.sortingOfSkillsBoolean = {
    config: false,
    scope: "client",
    type: Boolean,
    default: true
}