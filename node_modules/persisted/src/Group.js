import List from "./List";

/**
 * The Group class
 * ---------------
 * set of key-value pairs with a description
 * 
 * Note: In this project, a Group instance is always created by a List. Because
 *       the value of each entry should be either Group or List at the same time.
 *       Thus you should never create group object manually.
 *  
 */
export default class Group {
    
    constructor(group, {desc='无描述', tabStyle="paginator"}={}){

        if (group instanceof Group){
            Object.assign(this, group);
        } else {
            this.group = group;
            this.desc = desc;
            this.tabStyle = tabStyle;
        }
    }

    get(key){
        return this.group[key];
    }

    set(key, newValue){
        this.group[key] = newValue;
        return new Group(this);
    }

    vals(){
        return Object.values(this.group);
    }

    keys(){
        return Object.keys(this.group);
    }

    iter = (func) => {

        const entries = Object.entries(this.group);

        for (let i = 0; i < entries.length; i++){
            let [key, value] = entries[i];            
            this.group[key] = func(key, value);
        }

        return new Group(this);
    }

    filter = (func) => {

        let newGroup = {};
        for (let groupKey in this.group){
            if (func(groupKey)){
                newGroup[groupKey] = this.group[groupKey];
            }
        }
        this.group = newGroup;
        return new Group(this);
    }

    grap() {
        return new List(this.vals().flat());
    }

}