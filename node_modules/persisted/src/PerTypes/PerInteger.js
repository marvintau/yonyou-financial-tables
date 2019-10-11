export default class PerInteger extends Number {

    static sum(list){
        return list.reduce((acc, elem) => acc+elem, 0);
    }

    constructor(number=0){
        super(parseFloat(number).toFixed(0))
    }
}
