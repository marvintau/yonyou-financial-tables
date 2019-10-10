import { equal } from "assert";
import {Record, List, Header} from 'mutated';

let voucherHead = new Header(
    {cellType:"Display", cellStyle:"display", colKey: 'ino_id', colDesc:'凭证编号', dataType: 'String', expandControl: true},
    {cellType:"Display", cellStyle:"display", colKey: 'ccode_name', colDesc: '科目名称', dataType: 'String'},
    {cellType:"Display", cellStyle:"display", colKey: 'ccode', colDesc: '科目编码', display:'none'},
    {cellType:"Display", cellStyle:"display", colKey: 'cCusName', colDesc: '客户名称'},
    {cellType:"Display", cellStyle:"display", colKey: 'ccode_equal', colDesc: '对方科目', dataType: 'String'},
    {cellType:"Display", cellStyle:"display", colKey: 'cdigest', colDesc: '摘要'},
    {cellType:"Display", cellStyle:"display", colKey: 'md', colDesc: '借方发生', sortable: true, dataType: 'Number'},
    {cellType:"Display", cellStyle:"display", colKey: 'mc', colDesc: '贷方发生', sortable: true, dataType: 'Number'},
)

let analyzeHead = new Header(
    {cellType: "Display", cellStyle:"display", colKey: 'ccode_name', colDesc: "科目名称", expandControl: true},
    {cellType: "Display", cellStyle:"display", colKey: 'ccode', colDesc: "科目编码", display:'none'},
    {cellType: "Display", cellStyle:"display", colKey: 'mb', colDesc: '期初余额', sortable: true, dataType: 'Number'},
    {cellType: "Display", cellStyle:"display", colKey: 'me', colDesc: '期末余额', sortable: true, dataType: 'Number'},
    {cellType: "Display", cellStyle:"display", colKey: 'md', colDesc: '借方发生', sortable: true, dataType: 'Number'},
    {cellType: "Display", cellStyle:"display", colKey: 'mc', colDesc: '贷方发生', sortable: true, dataType: 'Number'},
)

export default{
    referred: {
        BALANCE: {desc: '科目余额', location: 'remote'},
        ENTRIES: {desc: '明细分录', location: 'remote'}
    },
    importProc({BALANCE, ENTRIES}, logger){

        // 生成科目发生额查询表的方法：
        // 1. 先按照“年-月-记账凭证编号”的方式为vouchers分组。这样就得到了按期间-同一凭证划分的分录
        // 2. 再根据在分录中出现的所有科目建立凭证索引，从而得到
        //    年-月-科目-凭证（列表）
        //    对应关系

        let vocuhersData = new List(...ENTRIES.data)
            .map(e => new Record(e));

        let periodicalVoucherDict = vocuhersData.grip(entry => `${entry.get('iyear')}-${entry.get('iperiod')}`, 'by-period')
            .iter((key, recs) => {
                let voucherList = recs
                    .grip(route => route.get('ino_id'), 'by-voucher-id')
                    .grap()
                    .map(list => {
                        let voucher = voucherHead.sum(list);
                        voucher.subs = list;

                        let subDict = {},
                            referredCodes = list.map(e => e.get('ccode'));

                        for (let code of referredCodes) {
                            subDict[code] = voucher;
                        }
                        
                        return subDict;
                    });

                let voucherDict = {};
                for (let i = 0; i < voucherList.length; i++){
                    let subDict = voucherList[i];
                    for (let code in subDict){
                        if (voucherDict[code] === undefined){
                            voucherDict[code] = new List(0);
                        }
                        voucherDict[code].push(subDict[code]);
                    }
                }

                for (let code in voucherDict){
                    voucherDict[code] = {head: voucherHead, data: voucherDict[code], tableAttr: {expandable: true}};
                }
                return voucherDict;
            })

        let balanceData = new List(...BALANCE.data)
            .map(e => new Record(e))
            .tros(category => `${category.get('iyear')}-${category.get('iperiod')}`)
            // .reverse()
            .grip(category => `${category.get('iyear')}-${category.get('iperiod')}`, '期间-年')
            .iter((key, balance) => {
                let voucherDict = periodicalVoucherDict.get(key);

                for (let i = 0; i < balance.length; i++){
                    let ccode = balance[i].get('ccode');
                    balance[i].tabs = voucherDict[ccode];
                }

                return balance
                    .tros(rec => rec.get('ccode'))
                    .uniq(rec => rec.get('ccode'))
                    .cascade(rec=>rec.get('ccode').length, (desc, ances) => {
                        let descCode  = desc.get('ccode'),
                            ancesCode = ances.get('ccode');
                        return descCode.slice(0, ancesCode.length).includes(ancesCode)
                    });
            }).grap().flat()
            .grip(category => category.get('iyear'), '年')
            .iter((key, categories) => {
                return categories.grip(category => category.get('iperiod'), '期间')
            })

        return {head: analyzeHead, data: balanceData, tableAttr:{expandable: true}};
    },
    desc: '发生额变动分析',
    type: 'DATA',
}