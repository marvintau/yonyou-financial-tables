import Jasmine from 'jasmine';
import path from 'path';

console.log(__dirname, 'es6cog');

let jasmine = new Jasmine();
// modify this line to point to your jasmine.json
jasmine.loadConfigFile(path.resolve(__dirname, 'support/jasmine.json'));
jasmine.execute();
