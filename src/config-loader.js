const Plugin = require('broccoli-caching-writer');
const path = require('path');
const fs = require('fs');

module.exports = class ConfigLoader extends Plugin {

  constructor(inputNodes, options = {}) {
    super(inputNodes, {
      annotation: options.annotation
      // see `options` in the below README to see a full list of constructor options
    });
    this.file = options.file || 'environment.js';
  }

  build() {
    Object.keys(require.cache).forEach((key) => {
      if (key.startsWith(this.inputPaths[0])) {
        delete require.cache[key];
      }
    });
    const json = require(path.join(this.inputPaths[0], this.file));
    console.log('out', path.join(this.outputPath, this.file));
    fs.writeFileSync(path.join(this.outputPath, this.file), JSON.stringify(json, null, 2));
  }
};
