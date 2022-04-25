export default class WolsungDie extends Die {
    
    /** @inheritdoc */
    get stotal() {
        if ( !this._evaluated ) return undefined;
        return this.results.reduce((t, r) => {
            if ( !r.active ) return t;
            if ( r.count !== undefined ) return t + r.count;
            if ( r.exploded && (this.faces == 10)) return t + 10;
            else return t + r.result;
        }, 0);
    }

    get total() {
        const total = this.stotal;
        if ( this.options.marginSuccess ) return total - parseInt(this.options.marginSuccess);
        else if ( this.options.marginFailure ) return parseInt(this.options.marginFailure) - total;
        else return total;
    }
}