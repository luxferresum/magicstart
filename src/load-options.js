const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const fs = require('fs');
const path = require('path');

module.exports = function() {
  const options = {
    srcTree: new Funnel('src'),
    testTree: new Funnel('test'),

    get testingTree() {
      return new MergeTrees([
        new Funnel(options.srcTree, { destDir: 'src' }),
        new Funnel(options.testTree, { destDir: 'test' })
      ]);
    },

    build: tree => tree,

    routerFile: 'router.js',
    loadRouter: router => router,
    unloadRouter: () => {},
    resetWorld: () => {},
    routerPrefix: '/api',
    port: 3000,
  }

  if(fs.existsSync('magicstart.js')) {
    Object.entries(require(path.join(process.cwd(), 'magicstart.js')))
      .forEach(([key, val]) => {
        options[key] = val;
      });
  }

  return options;
};