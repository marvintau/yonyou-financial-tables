import {Record, List, Header} from 'mutated';

import cashflowStatementDirectDetails from './local/cashflowStatementDirectDetails.txt.json';

export default {
    referred: {
        savedCashFlowConf: {desc:'已保存的资产负债表配置表', location: 'remote', type: 'CONF'},
        CATEGORY: {desc: '科目类别', location:'remote'}
    },
    importProc({CATEGORY, savedCashFlowConf}){

        let sideOptions = [
            new Record({method: '期初', methodName: '期初'}),
            new Record({method: '贷方', methodName: '贷方'}),
            new Record({method: '借方', methodName: '借方'})
        ]

        let methodOptions = [
            new Record({method: '计入', methodName: '计入'}),
            new Record({method: '减去', methodName: '减去'}),
        ]

        let category = new List(...CATEGORY.data.map(e => new Record(e)))
        .map(e => [e, new Record({...e.cols, ccode:e.cols.ccode+'00', ccode_name:'全部'})])
        .flat()
        .tros(e => e.get('ccode'))
        .cascade(rec=>rec.get('ccode').length, (desc, ances) => {
            let descCode = desc.get('ccode'),
                ancesCode = ances.get('ccode');
            return descCode.slice(0, ancesCode.length).includes(ancesCode)
        }, '按科目级联');

        let head = new Header(
            {colKey: 'title', colDesc: '项目', cellType: 'Display', cellStyle: 'display', expandControl: true, isTitle:true},
            {colKey: 'category', colDesc: '对应的科目类别', cellType: 'CascadeSelect', cellStyle: 'display', options: category, displayKey:'ccode_name', valueKey: 'ccode'},
            {colKey: 'side', colDesc: '取值方式', cellType: 'SingleSelect', cellStyle: 'display', options: sideOptions, displayKey: 'methodName', valueKey: 'method'},
            {colKey: 'method', colDesc: '计入方式', cellType: 'SingleSelect', cellStyle: 'display', options: methodOptions, displayKey: 'methodName', valueKey:'method'},
            {colKey: 'editControl', cellType: 'EditControl', cellStyle: 'control'}
        )

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