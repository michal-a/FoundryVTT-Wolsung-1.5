export default class WolsungItem extends Item {
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        if (this.type == "atut") this.data.img = "systems/wolsung/icons/atut.svg";
        if (this.type == "blizna") this.data.img = "systems/wolsung/icons/blizna.svg";
        if (this.type == "gadzet") this.data.img = "systems/wolsung/icons/gadzet.svg";
        if (this.type == "moc") this.data.img = "systems/wolsung/icons/moc.svg";
        if (this.type == "osiagniecie") this.data.img = "systems/wolsung/icons/osiagniecie.svg";
        if (this.type == "umiejetnoscObsady") this.data.img = "systems/wolsung/icons/umiejetnoscObsady.svg";
        if (this.type == "zaklecie") this.data.img = "systems/wolsung/icons/zaklecie.svg";
        if (this.type == "zdolnosc") this.data.img = "systems/wolsung/icons/zdolnosc.svg";
    }
}