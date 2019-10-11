class MuString extends String {

    static sum(list){
        let identical = list.every((v, i, a) => v == a[0]);
        return identical ? list[0] : '...';
    }

    constructor(rawString=""){
        super(rawString);
    }
}