export default async function preloadWolsungTemplates() {
    const templatePaths = [
        "systems/wolsung/templates/partials/bohater-umiejetnosci-block.html",
        "systems/wolsung/templates/partials/bohater-atrybuty-block.html",
        "systems/wolsung/templates/partials/bohater-konfrontacja-block.html",
        "systems/wolsung/templates/partials/bohater-pdBogactwo-block.html",
        "systems/wolsung/templates/partials/bohater-archetyp-block.html",
        "systems/wolsung/templates/partials/blizna-card.html",
        "systems/wolsung/templates/partials/atut-card.html",
        "systems/wolsung/templates/partials/zdolnosc-card.html",
        "systems/wolsung/templates/partials/gadzet-card.html",
        "systems/wolsung/templates/partials/moc-card.html",
        "systems/wolsung/templates/partials/zaklecie-card.html",
        "systems/wolsung/templates/partials/osiagniecie-card.html",
        "systems/wolsung/templates/partials/obsada-zdolnosc-card.html",
        "systems/wolsung/templates/partials/obsada-umiejetnosc-card.html"
    ];

    return loadTemplates(templatePaths);
}