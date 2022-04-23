export default async function preloadWolsungTemplates() {
    const templatePaths = [
        "systems/wolsung/templates/partials/bohater-umiejetnosci-block.hbs",
        "systems/wolsung/templates/partials/bohater-atrybuty-block.hbs",
        "systems/wolsung/templates/partials/bohater-konfrontacja-block.hbs",
        "systems/wolsung/templates/partials/bohater-pdBogactwo-block.hbs",
        "systems/wolsung/templates/partials/bohater-archetyp-block.hbs",
        "systems/wolsung/templates/partials/blizna-card.hbs",
        "systems/wolsung/templates/partials/atut-card.hbs",
        "systems/wolsung/templates/partials/zdolnosc-card.hbs",
        "systems/wolsung/templates/partials/gadzet-card.hbs",
        "systems/wolsung/templates/partials/moc-card.hbs",
        "systems/wolsung/templates/partials/zaklecie-card.hbs",
        "systems/wolsung/templates/partials/osiagniecie-card.hbs",
        "systems/wolsung/templates/partials/obsada-zdolnosc-card.hbs",
        "systems/wolsung/templates/partials/obsada-umiejetnosc-card.hbs",
        "systems/wolsung/templates/chat/card-selector-dialog-inner.hbs"
    ];

    return loadTemplates(templatePaths);
}