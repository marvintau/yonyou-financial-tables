import {Record, List, Head} from 'mutated';

// voucherHead是凭证的表头，作为科目发生额分析的子表
let voucherHead = new Head({
    ino_id:      'String',
    ccode_name:  'String',
    ccode:       'String',
    cCusName:    'String',
    ccode_equal: 'String',
    cdigest:     'String',
    md:          'Float',
    mc:          'Float',
})

voucherHead.setColProps({colDesc: '凭证编号'}, 'ino_id');
voucherHead.setColProps({colDesc: '科目名称'}, 'ccode_name');
voucherHead.setColProps({colDesc: '科目编码'}, 'ccode');
voucherHead.setColProps({colDesc: '客户名称'}, 'cCusName');
voucherHead.setColProps({colDesc: '对方科目'}, 'ccode_equal');
voucherHead.setColProps({colDesc: '摘要'},     'cdigest');
voucherHead.setColProps({colDesc: '借方发生'}, 'md');
voucherHead.setColProps({colDesc: '贷方发生'}, 'mc');

voucherHead.setColProps({isExpandToggler: true}, 'ino_id');

// analyzeHead是科目发生额分析的表头
let analyzeHead = new Head({
    ccode_name : 'String',
    ccode :      'String',
    mb :         'Number',
    me :         'Number',
    md :         'Number',
    mc :         'Number',
})

analyzeHead.setColProps({colDesc: "科目名称"}, 'ccode_name');
analyzeHead.setColProps({colDesc: "科目编码"}, 'ccode');
analyzeHead.setColProps({colDesc: '期初余额'}, 'mb');
analyzeHead.setColProps({colDesc: '期末余额'}, 'me');
analyzeHead.setColProps({colDesc: '借方发生'}, 'md');
analyzeHead.setColProps({colDesc: '贷方发生'}, 'mc');

export default{
    referred: {
        BALANCE: {desc: '科目余额', location: 'remote'},
        ENTRIES: {desc: '明细分录', location: 'remote'}
    },
    importProc({BALANCE, ENTRIES}){

        // 这部分所要实现的是：先按照"年-月-记账凭证编号"的方式为
        // vouchers分组。这样就得到了按期间-凭证编号划分的分录。
        // 但是我们所要的并不是每个凭证，而是这些凭证中都出现了哪
        // 些科目。在每个期间之内，我们形成了科目-凭证的反向索引，
        // 即通过科目来找到包含在这个期间之内所有的分录中包含这个
        // 科目的凭证。

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

        // 接下来我们首先获得每个期间的科目发生额

        let balanceData = new List(...BALANCE.data)
            .map(e => new Record(e))
            .ordr(category => `${category.get('iyear')}-${category.get('iperiod')}`)
            .grip(category => `${category.get('iyear')}-${category.get('iperiod')}`, '期间-年')
            .iter((key, balance) => {
                let voucherDict = periodicalVoucherDict.get(key);

                for (let i = 0; i < balance.length; i++){
                    let ccode = balance[i].get('ccode');
                    balance[i].subs = voucherDict[ccode];
                }

                return balance
                    .ordr(rec => rec.get('ccode'))
                    .uniq(rec => rec.get('ccode'))
                    .cascade(rec=>rec.get('ccode').length, (desc, ances) => {
                        let descCode  = desc.get('ccode'),
                            ancesCode = ances.get('ccode');
                        return descCode.slice(0, ancesCode.length).includes(ancesCode)
                    });
            }).grap()
            .grip(category => category.get('iyear'), '年')
            .iter((key, categories) => {
                return categories.grip(category => category.get('iperiod'), '期间')
            })

        return {head: analyzeHead, data: balanceData, tableAttr:{
            expandable: true
        }};
    },
    desc: '发生额变动分析',
    type: 'DATA',
}