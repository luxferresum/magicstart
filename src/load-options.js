const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const ConfigLoader = require('./config-loader.js');

const fs = require('fs');
const path = require('path');

module.exports = function() {
  const options = {
    srcTree: new Funnel('src'),
    configTree: new ConfigLoader([new Funnel('config')]),
    testTree: new Funnel('test'),
    mockTree: new Funnel('mock'),

    get appTree() {
      return new MergeTrees([
        new Funnel(options.srcTree, { destDir: 'src' }),
        new Funnel(options.configTree, { destDir: 'config' }),
      ]);
    },

    get servingTree() {
      return new MergeTrees([
        options.appTree,
        new Funnel(options.mockTree, { destDir: 'mock' }),
      ]);
    },

    get testingTree() {
      return new MergeTrees([
        options.appTree,
        new Funnel(options.mockTree, { destDir: 'mock' }),
        new Funnel(options.testTree, { destDir: 'test' }),
      ]);
    },

    build: tree => tree,

    resetWorld: () => {},

    initFile: 'init.js',

    routerFile: 'router.js',
    routerExportName: null, // for example default for ES6 export
    routerExportIsAFunction: true,
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