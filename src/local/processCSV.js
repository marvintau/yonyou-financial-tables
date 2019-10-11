const fs = require('fs').promises;

const {fileName, levels=1} = Object.fromEntries(process.argv.slice(2).map(param => param.split('=')));

fs.readFile(fileName, 'utf-8')
    .then((res) => {
        let lines = res.split('\n');

        let currentClass = Array(levels);
        // console.log(levels);

        res = [];

        for (let line of lines) {
            let columns = line.split('\t');

            for (let i = 0; i < levels; i++){
                if (columns[i].length !== 0){
                    currentClass[i] = columns[i];
                }
                columns[i] = currentClass[i];
            }
        
            res.push(columns);
        }

        let categoryDictionary = {};
        for (let line of res){
            // get method, category, and side
            let [method, category, side] = line.slice(-3)
            console.log(method, category, side)
            // find the deepest level of dictionary
            let ref = categoryDictionary,
                lastLevel = levels - 1;
            for (let i = 0; i < lastLevel; i++){
                if(ref[line[i]] === undefined) ref[line[i]] = {};
                ref = ref[line[i]];
            }
            if (ref[line[lastLevel]] === undefined){
                ref[line[lastLevel]] = [];
            }

            ref[line[lastLevel]].push({
                method,
                category: category.split('-').join('->'),
                side
            });
        }

        let output = JSON.stringify(categoryDictionary, null, 4);

        return fs.writeFile(`${fileName}.json`, output, 'utf-8')

    }).then((res) => {
        console.log('write file done');
    }).catch((err) => {
        console.log('err', err);
    })