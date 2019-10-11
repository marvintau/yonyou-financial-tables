import {Head, Record, List} from 'persisted';

export default {
    referred: {
        BALANCE: {desc:'科目余额', location:'remote'}
    },
    importProc({BALANCE}, logger){

        let head = new Head({
            ccode_name: 'String',
            ccode:      'String',
            cclass:     'String',
            mb:         'Float',
            me:         'Float',
        })

        head.setColProp({colDesc: "科目名称", isExpandToggler: true}, 'ccode_name')
        head.setColProp({colDesc: "科目编码"}, 'ccode' )
        head.setColProp({colDesc: "科目类别"}, 'cclass')
        head.setColProp({colDesc: '期初金额'}, 'mb'    )
        head.setColProp({colDesc: '期末金额'}, 'me'    )

        let balanceData = (new List(...BALANCE.data)).map(entry => head.createRecord(entry));
        let data = balanceData
            .grip(rec => rec.get('iyear'), {desc:'年'})
            .iter((key, recs) => {
                return recs
                    .grip((rec) => rec.get('iperiod'), {desc: '期间'})
                    .iter((key, codeRecs) => {
                        return codeRecs
                            .ordr(e => e.get('ccode'))
                            .cascade(rec=>rec.get('ccode').length, (desc, ances) => {
                                let descCode = desc.get('ccode'),
                                    ancesCode = ances.get('ccode');
                                return descCode.slice(0, ancesCode.length).includes(ancesCode)
                            });
                    })
            });

        return {head, data, tableAttr:{
            // expandable: true,
            // editable:true
        }};
    },
    desc: '每期间科目余额',
    dataType: 'DATA',
}