import PerInterval from './PerInterval';

export default class PerDate extends Date {
    static sum(list){
        return new PerInterval(...list);
    }

    constructor(date){
        super(!date ? 0 : date)
    }
};
