export default class PerFloat extends Number {

    static sum(list){
        return list.reduce((acc, elem) => acc+elem, 0);
    }

    constructor(number=0){
        super(number);
    }
}
