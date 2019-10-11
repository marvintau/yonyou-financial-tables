import Group from './Group';

export default class List {

    constructor(array=[]){
        if(array instanceof List){
            Object.assign(this, array);
        } else {
            this.$array = array;
        }
    }

    /**
     * last
     * @param {number} backwardIndex 反向索引，会被自动trim到[1, this.length]的范围
     *                               从而确保最终的值在[0, this.length-1]的范围内。
     */
    last(backwardIndex=1){
        backwardIndex = Math.max(Math.min(backwardIndex, 1), this.length);
        return this.$array[this.length - backwardIndex];
    }

    len(){
        return this.$array.length;
    }

    getArray(){
        return this.$array;
    }

    sort(func, order=1){
        this.$array.sort((a, b) => {
            let indexA = func(a),
                indexB = func(b);

            return indexA < indexB ? -order : indexA > indexB ? order : 0;
        })

        return new List(this);
    }


    grip(func, {desc='noname', style='paginator'}={}){

        let group = {};

        for (let i = 0; i < this.$array.length; i++){

            let key = func(this.$array[i]);
            if(!(key in group)){
                group[key] = new List(0)
            }
            group[key].push(this[i]);
        }

        return new Group(group, desc, style);
    }


    uniq(func) {
        
        let uniq = {};
        for (let i = 0; i < this.length; i++){
            uniq[func(this[i])] = this[i];
        }

        let list = new List();
        for (let key in uniq){
            list.array.push(uniq[key]);
        }

        return list;
    }

    cascade(layerFunc, gatherFunc) {

        // grip使用了layerFunc，将列表分为几代（Generation）
        let layers = this.sort(layerFunc).grip(layerFunc).vals();

        // 每相邻的两代之间两两比较，如果没有找到父辈的孩子会被弃掉。
        for (let descendants = layers.shift(); layers.length > 0; descendants = layers.shift()) {
            let ancestors = layers[0];
            while (descendants.length > 0) {
                let entry = descendants.shift();
                for (let maybeParent of ancestors) if (gatherFunc(entry, maybeParent)) {
                    maybeParent.addChild(entry);
                }
            }
        }

        // 返回祖先一代。
        return new List(descendants);
    }

    flatten(){

        const stack = this.$array.slice();
        const res = [];
        while (stack.length) {
            const next = stack.shift();
            res.push(next);
            if (next.$children.len()) {
                stack.push(...next.getChildrenArray());
            }
        }

        return new List(res);
    }

    join(from, {fromCol, thisCol}){

        // 1. build up a dictionary with entry of 
        //    value of the column. 
        let fromDict = new Map();
        for (let i = from.length-1; i >= 0; i--){
            fromDict.set(fromCol, from[i][fromCol]);
        }

        // 2. find the entry which has same value
        //    in given column, combine two record
        //    together.
        for (let i = this.length-1; i >= 0; i--){
            let thisColVal = this.$array[i][thisCol];
            if(fromDict.has(thisColVal)){
                Object.assign(this[i], fromDict.get(thisColVal));
            }
        }

        return new List(this);
    }

    insert(index, newRec){
        this.array.splice(index, 0, newRec);
        return new List(this);
    }

    swap(index, dir=1){
        if(dir===1){
            if (index < this.length - 1) {
                [this[index], this[index+1]] = [this[index+1], this[index]];
            }    
        } else {
            if (index > 0) {
                [this[index - 1], this[index]] = [this[index], this[index - 1]];
            }    
        }
        return new List(this);
    }

    remove(index){
        this.splice(index, 1);
        return new List(this);
    }
}