import List from "./List";

export default class Record {
    
    constructor(fields, {schema={}, children=new List(), subtable}={}){

        if (fields instanceof Record){
            Object.assign(this, fields);
        } else {
            this.$fields = {}
            for (let colKey in schema){
                let val = fields[colKey] === null ? undefined : fields[colKey];
                this.$fields[colKey] = new schema[colKey](val);
            }
    
            this.$schema = schema;
            this.$subtable = subtable;    
            this.$children = children;
        }        
    }

    set(key, value){
        let Cons = this.$schema[key];
        this.$fields[key] = new Cons(value);
        return new Record(this);
    }

    get(key){
        return this.$fields[key];
    }

    getChildrenArray(){
        return this.$children.getArray();
    }

    addChild(rec){
        this.$subtable = undefined;
        this.$children.push(rec);
    }
    
    keys(){
        return Object.keys(this.$fields);
    }
}