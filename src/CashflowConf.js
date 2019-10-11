import {Record, List, Head} from 'persisted';

import cashflowStatementDirectDetails from './local/cashflowStatementDirectDetails.txt.json';

let sideOptions = [
    new Record({method: '期初', methodName: '期初'}),
    new Record({method: '贷方', methodName: '贷方'}),
    new Record({method: '借方', methodName: '借方'})
]

let methodOptions = [
    new Record({method: '计入', methodName: '计入'}),
    new Record({method: '减去', methodName: '减去'}),
]

let head = new Header({
    title:       "String",
    category:    "Path",
    side:        "Path",
    method:      "Path",
})

head.setColProp({colDesc: '项目'}, 'title')
head.setColProp({colDesc: '对应的科目类别'}, 'gategory')
head.setColProp({colDesc: '取值方式'}, 'side')
head.setColProp({colDesc: '计入方式'}, 'method')


export default {
    referred: {
        savedCashFlowConf: {desc:'已保存的资产负债表配置表', location: 'remote', type: 'CONF'},
        CATEGORY: {desc: '科目类别', location:'remote'}
    },
    importProc({CATEGORY, savedCashFlowConf}){

        let category = new List(...CATEGORY.data.map(e => new Record(e)))
        .map(e => [e, new Record({...e.cols, ccode:e.cols.ccode+'00', ccode_name:'全部'})])
        .flat()
        .ordr(e => e.get('ccode'))
        .cascade(rec=>rec.get('ccode').length, (desc, ances) => {
            let descCode = desc.get('ccode'),
                ancesCode = ances.get('ccode');
            return descCode.slice(0, ancesCode.length).includes(ancesCode)
        }, '按科目级联');


        let data = cashflowStatementDirectDetails;
        if (savedCashFlowConf.data.length > 0 || Object.keys(savedCashFlowConf.data).length > 0){
            data = savedCashFlowConf.data;
        }

        data = new List(...Object.entries(data))
            .map(([title, content]) => {
                let rec = new Record({title});

                rec.subs = new List(...Object.entries(content).map(([title, content]) => {
                    let rec = new Record({title});
                    rec.subs = content.map(con => new Record(con));
                    return rec;
                }));

                return rec
            })
            .flat(2)

        return {data, head, tableAttr:{expandable: true, editable: true, savable: true}}

    },
    exportProc(data){
        let entries = data.slice().map(e => {
            let entries = e.subs.map (sub => {
                let entryList = sub.subs.map(entry => {
                    let {method, category, side} = entry.cols;
                    return {method, category, side};
                });

                return [sub.cols.title, entryList]
            });

            return [e.cols.title, Object.fromEntries(entries)]
        })

        return Object.fromEntries(entries);
    },
    desc: '现金流量表配置表',
    type: 'CONF'
}