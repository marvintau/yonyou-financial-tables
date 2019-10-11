import {Record, List, Header} from 'mutated';

import CashflowStatementDirectDetails from './local/cashflowStatementDirectDetails.txt.json';

function sumAccrual(list){

    let head = new Header(
        {colKey: 'ccode_name', colDesc: "科目名称", dataType: 'String'},
        {colKey: 'ccode', colDesc: "科目编码", dataType: 'String'},
        {colKey: 'cclass', colDesc: "科目类别", dataType: 'String'},
        {colKey: 'mc', colDesc: '贷方发生', dataType: 'Number'},
        {colKey: 'md', colDesc: '借方发生', dataType: 'Number'}
    );

    return head.sum(list);
}

function traceRecord(list, recKey, path){
    let listRef = list, ref;
    for (let node of path){
        if (node === '全部') break;
        ref = listRef.find(rec => rec.get(recKey) === node)
        if (ref === undefined) break;
        listRef = ref.subs;
    }
    return ref;
}

export default{
    referred: {
        savedCashflowConf: {desc:'已保存的资产负债表配置表', location: 'remote', type: 'CONF'},
        RouteAnalysis: {desc:'发生额变动分析' , location:'local', type: 'DATA'}
    },
    importProc({RouteAnalysis, savedCashflowConf}){

        let head = new Header(
            {colKey: 'mainTitle', colDesc: '类别', cellType: 'Display', cellStyle: 'display', dataType:'String', isTitle: true},
            {colKey: 'title', colDesc: '项目', cellType: 'Display', cellStyle: 'display', expandControl: true},
            {colKey: 'accrual', colDesc: '金额', cellType: 'Display', cellStyle: 'display', dataType: 'Number'}
        )
        
        let headYear = 0,
            tailYear = 0,
            headPeriod = 1,
            tailPeriod = 10;

        // periodical balance data
        let routeData = RouteAnalysis.data
        .grap().flat(2) // remove year group
        .map(e => e.grap()).flat(2) // remove iperiod group
        .flatten() // flatten the subs of all records
        // first get the desired period range
        .filter(e => {
            let {iyear, iperiod} = e.cols;
            return (iyear >= headYear) && (iyear <= tailYear) && (iperiod >= headPeriod) && (iperiod <= tailPeriod)
        })

        // sum up the accrual within the category through all the periods.
        .grip(e => e.get('ccode'), '科目')
        .iter((key, val) => {
            let sorted = val.ordr(e => `${e.get('iyear')-e.get('iperiod')}`).reverse(),
                accrualSum = sumAccrual(sorted),
                {mc, md} = accrualSum.cols;
            return new Record({...sorted[0].cols, mc, md});
        }).grap()

        // then form the cascaded records for path searching.
        .ordr(e => e.get('ccode'))
        .cascade(rec=>rec.get('ccode').length, (desc, ances) => {
            let descCode = desc.get('ccode'),
                ancesCode = ances.get('ccode');
            return descCode.slice(0, ancesCode.length).includes(ancesCode)
        }, '按科目级联');
        // What we get so far:
        // similar to financial statement.
        // a cascaded list of records, that containing the beginning, accumulated
        // credit and debit accrual.

        let data = CashflowStatementDirectDetails;
        if (savedCashflowConf.data.length > 0 || Object.keys(savedCashflowConf.data).length > 0){
            data = savedCashflowConf.data;
        }

        // now calculate the accruals of corresponding entries.
        data = new List(...Object.entries(data))
        .map(([mainTitle, headContent]) => {

            let headRec = new Record({mainTitle, title: '', accrual: 0});

            let headContentRec = Object.entries(headContent).map(([title, content]) => {

                let accrual = 0;

                // here the content are the entries listed below the title
                // we are going to retrieve the values in balance data first,
                // and then add them up according to the instructions, and finally
                // make it a Record.

                let entries = content.map(entry => {
                    let [_, ...path] = entry.category.split('->');
                    let rec = traceRecord(routeData, 'ccode_name', path);
                    
                    if (rec === undefined){
                        return rec;
                    }

                    let {mb, mc, md} = rec.cols;
                    return {...entry, mb, mc, md}
                }).filter(rec => rec !== undefined)

                // after find the values, and filter out the undefined,
                // or the value that not found according to given path,
                // we add them up.
                
                let subs = new List();
                for (let rec of entries){
                    let {method, side, category} = rec;

                    let key = {
                        '借方' : 'md',
                        '贷方' : 'mc',
                    }[side]

                    let sign = {
                        '计入' : '+',
                        '减去' : '-',
                        '' : '+'
                    }[method];

                    let finalValue = eval(`${sign}${rec[key]}`);

                    let [_, ...path] = category.split('->');
                    subs.push(new Record({
                        title: `${method} ${path.join('-')} ${side}`,
                        accrual: finalValue,
                    }))

                    accrual += finalValue;
                }

                return new Record({title, accrual}, {subs});
            });

            return [headRec, headContentRec]
        }).flat(2);

        console.log(data, 'financialStatemenet items')

        return {head, data, tableAttr: {expandable: true}}
    },
    desc: "现金流量表",
}
