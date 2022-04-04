export default class WolsungActor extends Actor {

    prepareDerivedData() {
        const actorData = this.data;

        this._prepareBohaterData(actorData);
        this._prepareObsadaData(actorData);
    }

    _prepareObsadaData(actorData) {
        if (actorData.type !== 'obsada') return;

        const data = actorData.data;

        data.typBool = {
            przeciwnik: false,
            statysta: false,
            sojusznik: false
        };
        if (data.typ == "przeciwnik") data.typBool.przeciwnik = true;
        if (data.typ == "statysta") {
            this.update({data: {pula: 1}})
            data.typBool.statysta = true;
        }
        if (data.typ == "sojusznik") {
            this.update({data: {pula: 1, konfrontacja: {odpornosc: {value: 1, max: 1}}}});
            data.typBool.sojusznik = true;
        }
    }

    _prepareBohaterData(actorData) {
        if (actorData.type !== 'bohater') return;

        const data = actorData.data;

        const osiagniecieNo = actorData.items.filter(function(item){return item.type == "osiagniecie"}).length;
        if (osiagniecieNo == 0) {
            data.personalia.slawa = game.i18n.localize("wolsung.bohater.slawa.nikt");
            data.pula = 1;
        }
        else if (osiagniecieNo < 16) {
            data.personalia.slawa = game.i18n.localize("wolsung.bohater.slawa.znany");
            data.pula = 2;
        }
        else if (osiagniecieNo < 36) {
            data.personalia.slawa = game.i18n.localize("wolsung.bohater.slawa.slawny");
            data.pula = 3;
        }
        else {
            data.personalia.slawa = game.i18n.localize("wolsung.bohater.slawa.legenda");
            data.pula = 4;
        }

        const krz = 11 - parseInt(data.atrybuty.krz.wartosc) - Math.abs(data.atrybuty.krz.rany);
        const zr = 11 - parseInt(data.atrybuty.zr.wartosc) - Math.abs(data.atrybuty.zr.rany);
        const cha = 11 - parseInt(data.atrybuty.cha.wartosc) - Math.abs(data.atrybuty.cha.rany);
        const op = 11 - parseInt(data.atrybuty.op.wartosc) - Math.abs(data.atrybuty.op.rany);
        data.konfrontacja.kondycja.max = Math.max(krz, zr);
        data.konfrontacja.kondycja.value = data.konfrontacja.kondycja.max + parseInt(data.konfrontacja.kondycja.mod);
        data.konfrontacja.reputacja.max = Math.max(cha, op);
        data.konfrontacja.reputacja.value = data.konfrontacja.reputacja.max + parseInt(data.konfrontacja.reputacja.mod);

        data.konfrontacja.obrona.max = 10 + (2 * data.konfrontacja.kondycja.value);
        data.konfrontacja.obrona.value = data.konfrontacja.obrona.max + parseInt(data.konfrontacja.obrona.mod);
        data.konfrontacja.wytrwalosc.max = 10 + (2 * data.konfrontacja.kondycja.value);
        data.konfrontacja.wytrwalosc.value = data.konfrontacja.wytrwalosc.max + parseInt(data.konfrontacja.wytrwalosc.mod);
        data.konfrontacja.pewnoscSiebie.max = 10 + (2 * data.konfrontacja.reputacja.value);
        data.konfrontacja.pewnoscSiebie.value = data.konfrontacja.pewnoscSiebie.max + parseInt(data.konfrontacja.pewnoscSiebie.mod);

        data.karta = {};
        data.karta.pik = {};
        data.karta.kier = {};
        data.karta.karo = {};
        data.karta.trefl = {};
        data.karta.pik.name = game.i18n.localize("wolsung.karta.pik." + data.personalia.archetyp + ".name");
        data.karta.kier.name = game.i18n.localize("wolsung.karta.kier." + data.personalia.archetyp + ".name");
        data.karta.karo.name = game.i18n.localize("wolsung.karta.karo." + data.personalia.archetyp + ".name");
        data.karta.trefl.name = game.i18n.localize("wolsung.karta.trefl." + data.personalia.archetyp + ".name");
        data.karta.pik.desc = game.i18n.localize("wolsung.karta.pik." + data.personalia.archetyp + ".desc");
        data.karta.kier.desc = game.i18n.localize("wolsung.karta.kier." + data.personalia.archetyp + ".desc");
        data.karta.karo.desc = game.i18n.localize("wolsung.karta.karo." + data.personalia.archetyp + ".desc");
        data.karta.trefl.desc = game.i18n.localize("wolsung.karta.trefl." + data.personalia.archetyp + ".desc");

        for (const [key, value] of Object.entries(data.umiejetnosci)) {
            data.umiejetnosci[key].total = parseInt(value.podstawa) + parseInt(value.modyfikator);
            data.umiejetnosci[key].specjalizacjaTotal = 9 + parseInt(value.modyfikator);
        }
    }

}