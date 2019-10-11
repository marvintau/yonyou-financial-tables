import Record from './Record'
import List from './List';

import PerString from './PerTypes/PerString';
import PerInteger from './PerTypes/PerInteger';
import PerFloat from './PerTypes/PerFloat';
import PerInterval from './PerTypes/PerInterval';
import PerDate from './PerTypes/PerDate';

/**
 * Schema
 * ------
 * @param {Object} colsTypeSpec 字段名称及其对应类型。可选的类型包括：
 * ```
 * 'Float' | 'Integer' | 'String' | 'Date' | 'Interval'
 * ```
 * 请特别注意大小写。
 */

export default class Schema {

    constructor(colsTypeSpec){

        const types = {
            Float:    PerFloat,
            Integer:  PerInteger,
            String:   PerString,
            Date:     PerDate,
            Interval: PerInterval,
        }

        for (let key in colsTypeSpec){
            let type = types[colsTypeSpec[key]]
            this[key] = {type}
        }
    }

    /**
     * setFieldProp
     * ============
     * @param {string|Object} field 字段名，或者一个包含有若干字段名的Object。对于后者，Object中的key是字段名，而value则是对应字段的属性。
     * @param {Object} props 将为字段设置的属性。如果field是一个Object，那么props将被忽略。
     */
    setFieldProp(field, props={}){
        
        const availableProps = {
            display: 'Normal',
            style:   'Normal',
            expandControl: false,
        }

        if (field in this){
            Object.assign(this[field], {fieldDesc: field}, availableProps, props);
        } else if (fieldName instanceof Object){
            for (let fieldName in field) if (fieldName in this){
                Object.assign(this[fieldName], {fieldDesc: fieldName}, availableProps, field[fieldName]);
            }
        }
    }

    createRecord(colsData){
        return new Record(colsData, {schema:this});
    }

    // for test purpose only
    createTableFromColumnLists({length, table}){
        let recs = [];
        for (let i = 0; i < length; i++){
            let rec = {};
            for (let key in table){
                rec[key] = table[key][i];
            }
            recs.push(new Record(rec, {schema: this}));
        }
        return new List(recs);
    }
}