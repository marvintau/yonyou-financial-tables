import {Record, List, Header} from 'persisted';

import FinancialStatementDetails from './local/financialStatementDetails.txt.json';

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
        savedFinancialStatementConf: {desc:'已保存的资产负债表配置表', location: 'remote', type: 'CONF'},
        BALANCE: {desc:'科目余额', location:'remote'}
    },
    importProc({BALANCE, savedFinancialStatementConf}){

        let head = new Header(
            {colKey: 'title', colDesc: '项目', cellType: 'Display', cellStyle: 'display', expandControl: true},
            {colKey: 'mb', colDesc: '期初', cellType: 'Display', cellStyle: 'display', dataType: 'Number'},
            {colKey: 'me', colDesc: '当前', cellType: 'Display', cellStyle: 'display', dataType: 'Number'}
        )
        
        let headYear = 0,
            tailYear = 0,
            headPeriod = 1,
            tailPeriod = 10;

        // periodical balance data
        let balanceData = new List(...BALANCE.data.map(e => new Record(e)))
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
        // a cascaded list of records, that containing the beginning, accumulated
        // credit and debit accrual.

        let data = FinancialStatementDetails;
        if (savedFinancialStatementConf.data.length > 0 || Object.keys(savedFinancialStatementConf.data).length > 0){
            data = savedFinancialStatementConf.data;
        }

        // now calculate the accruals of corresponding entries.
        data = new List(...Object.entries(data))
        .map(([title, content]) => {

            let mb = 0, me = 0;

            // here the content are the entries listed below the title
            // we are going to retrieve the values in balance data first,
            // and then add them up according to the instructions, and finally
            // make it a Record.

            let entries = content.map(entry => {
                let [_, ...path] = entry.category.split('->');
                let rec = traceRecord(balanceData, 'ccode_name', path);
                
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
                    '期初' : 'mb'
                }[side]

                let sign = {
                    '计入' : '+',
                    '减去' : '-',
                    '' : '+'
                }[method];

                console.log('eval', `${sign}${rec[key]}`);
                let finalValue = eval(`${sign}${rec[key]}`);

                let [_, ...path] = category.split('->');
                let newRec = {
                    title: `${method} ${path.join('-')} ${side}`,
                    mb:0, me: 0,
                }
                if (key === 'mb'){
                    newRec.mb = finalValue;
                } else {
                    newRec.me = finalValue;
                }
                subs.push(new Record(newRec))

                me += finalValue;
                if (key === 'mb'){
                    mb += finalValue;
                }
            }

            return new Record({title, mb, me}, {subs});
        })

        console.log(data, 'financialStatemenet items')

        return {head, data, tableAttr: {expandable: true}}
    },
    desc: "资产负债表",
}
