import Schema from '../../src/Schema';
import Record from '../../src/Record';

function randomVowel(){
    const vowels = ['chi', 'ma', 'po', 're', 'l', 'se', 'tra', 'cki', 'te', 'cro'];
    let index = (Math.random() * (vowels.length - 1)).toFixed(0);
    return vowels[index];
}

const gen = {
    String(finalLength=20, newRate=1.8){
        let dict = [];
    
        while(dict.length < finalLength){
    
            let index = parseInt((Math.random() * dict.length * newRate).toFixed(0)),
                vowel = randomVowel();
    
            if (index > dict.length - 1){
                dict.push(vowel);
            } else {
                dict.push(`${dict[index]}${vowel}`);
            }
        }
    
        dict = [...new Set(dict)];
        dict.sort();

        return dict;
    },
    
    Integer(length=20, range=[0, 100]){
        let list = [];
        for (let i = 0; i < length; i++){
            list.push((range[0] + Math.random()*(range[1] - range[0])).toFixed(0));
        }
        return list;
    },
    
    Float(length=20, range=[0, 100]){
        let list = [];
        for (let i = 0; i < length; i++){
            list.push((range[0] + Math.random()*(range[1] - range[0])));
        }
        return list;
    },
    
    Date(length=20){
        return Array(length).fill(0).map(e => new Date(Math.random() * 2e5));
    },

    Interval(length=20){
        return Array(length).fill(0).map(e => {
            let head = new Date(Math.random() * 2e5),
                tail = new Date(Math.random() * 2e5);
            return [head, tail];
        })
    }
}

function genTable(typeSpec, length=20){
    let table = {};
    for (let key in typeSpec){
        let type = typeSpec[key].slice(2);
        table[key] = gen[type](length);
        if (type === 'String'){
            console.log(table[key], 'string');
        }
    }
    return {length, table};
}

describe("TypeDict", function() {

    let typeSpec = {
        entry:     'PerString',
        date:      'PerDate',
        accrual:   'PerFloat',
        frequency: 'PerInteger',
        interval:  'PerInterval'
    }

    let schema = new Schema(typeSpec);

    let generated = genTable(typeSpec, 40);

    let newTable = schema.createTableFromColumnLists(generated);

    it("should contain all given property", function() {
        for (let key in schema){
            expect(schema[key].name).toBe(typeSpec[key])
        }
    });

    it("shouldn't be modified once created", function() {
        let errorText = "Cannot assign to read only property 'entry' of object '#<Schema>'";
        expect(() => {schema.entry = Number})
            .toThrow(new TypeError(errorText));
    })

    let cols = {
        entry:     undefined,
        date:      null,
        accrual:   0.123,
        frequency: null,
        interval:  null
    }

    let rec = schema.createRecord(cols);
    it('created a record', function(){

        expect(rec.get('accrual').valueOf()).toBe(0.123);
        expect(rec.get('frequency').valueOf()).toBe(0);
        expect(rec.get('interval').valueOf()).toBe(0);
    })

    let ref;

    it('is able to modify the value of record', function(){

        ref = rec.set('entry', 1);
        expect(rec.get('entry')).not.toBe(1);
        expect(rec.get('entry')).not.toBe('1');
        expect(rec.get('entry')).toEqual(new String(1));
    })

    it('also produces a new object by shallow copy', function(){
        expect(ref.constructor.name).toBe('Record');
        expect(ref).not.toBe(rec);
    })
});