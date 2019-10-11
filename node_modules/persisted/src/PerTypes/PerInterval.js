export default class PerInterval {

    static sum(){}

    constructor(...dates){

        let denulled = dates.filter(e => e !== null && e !== undefined)

        this.head = new Date(Math.min(0, ...denulled));
        this.tail = new Date(Math.max(0, ...denulled));
    }

    valueOf(){
        return this.tail - this.head;
    }

    addDate(date){
        this.head = new Date(Math.min(this.head, date));
        this.tail = new Date(Math.max(this.tail, date));
    }

    addInterval(interval){
        this.head = new Date(Math.min(this.head, this.tail, interval.head, interval.tail));
        this.tail = new Date(Math.max(this.head, this.tail, interval.head, interval.tail));
    }

    toString(){}
}

