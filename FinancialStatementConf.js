import {Record, List, Header} from 'mutated';

import FinancialStatementDetails from './local/financialStatementDetails.txt.json';

export default {
    referred: {
        savedFinancialStatementConf: {desc:'已保存的资产负债表配置表', location: 'remote', type: 'CONF'},
        CATEGORY: {desc: '科目类别', location:'remote'}
    },
    importProc({CATEGORY, savedFinancialStatementConf}){

        console.log(savedFinancialStatementConf, 'saved')

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

        // console.log(category, 'imported');

        let head = new Header(
            {colKey: 'title', colDesc: '项目', cellType: 'Display', cellStyle: 'display', expandControl: true, isTitle:true},
            {colKey: 'category', colDesc: '对应的科目类别', cellType: 'CascadeSelect', cellStyle: 'display', options: category, displayKey:'ccode_name', valueKey: 'ccode'},
            {colKey: 'side', colDesc: '取值方式', cellType: 'SingleSelect', cellStyle: 'display', options: sideOptions, displayKey: 'methodName', valueKey: 'method'},
            {colKey: 'method', colDesc: '计入方式', cellType: 'SingleSelect', cellStyle: 'display', options: methodOptions, displayKey: 'methodName', valueKey:'method'},
            {colKey: 'editControl', cellType: 'EditControl', cellStyle: 'control'}
        )

        let data = new List(...Object.entries(FinancialStatementDetails))
            .map(([title, content]) => {
                let rec = new Record({title});
                rec.subs = new List(...content).map(con => new Record(con));
                return rec
            })
            .flat()

        return {data, head, tableAttr:{expandable: true, editable: true, savable: true}}

    },
    exportProc(data){
        return data.slice().map(e => {
            return Object.assign({}, e.cols, {
                content: e.subs.map(entry => entry.cols)
            })
        })
   },
    desc: '资产负债表配置表',
    type: 'CONF'
}