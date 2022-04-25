export default class WolsungDiceTerm extends DiceTerm {
    get total() {
      if ( !this._evaluated ) return undefined;
      return this.results.reduce((t, r) => {
        if ( !r.active ) return t;
        if ( r.count !== undefined ) return t + r.count;
        if ( r.exploded && (this.faces == 10)) return t + 10;
        else return t + r.result;
      }, 0);
    }  
}