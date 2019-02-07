const { Builder, Watcher } = require('broccoli');
const TreeSync = require('tree-sync');
const Mocha = require('mocha');
const walkSync = require('walk-sync');
const path = require('path');
const express = require('express');
const http = require('http');

const options = require('./load-options.js')();

function cleanupCache(prfxDir) {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(path.join(process.cwd(), prfxDir))) {
      delete require.cache[key];
    }
  });
}

function _watch(tree, outDir, buildSuccess = () => {}, beforeBuildSuccess = () => {}) {
  const builder = new Builder(tree);
  const watcher = new Watcher(builder);
  const treeSync = new TreeSync(builder.outputPath, outDir);

  watcher.on('buildSuccess', async (...args) => {
    beforeBuildSuccess();
    await treeSync.sync();
    cleanupCache(outDir);
    buildSuccess();
  });
  watcher.start();
}

async function _build(tree, outDir) {
  const builder = new Builder(tree);
  await builder.build();
  const treeSync = new TreeSync(builder.outputPath, outDir);
  await treeSync.sync();
  await builder.cleanup();
}

function _test(dir) {
  const mocha = new Mocha();
  walkSync(path.join(dir, 'test'))
    .filter(x => !x.endsWith('/'))
    .forEach(x => mocha.addFile(path.join(dir, 'test', x)));

  return new Promise((resolve) => {
    mocha.run(failures => {
      resolve(failures);
    });
  });
}

async function test(watch) {
  const outDir = 'dist_testing';

  if(watch) {
    _watch(options.testingTree, outDir, () => _test(outDir));
  } else {
    await _build(options.testingTree, outDir);
    const failures = await _test(outDir);
    process.exitCode = failures ? 1 : 0;
  }
}

function serve() {
  const outDir = 'dist_server';
  const app = express();
  const server = http.Server(app);
  server.listen(options.port, () => {
    console.log('development server started on port ' + options.port);
  });

  let router = null;
  const waitingRequests = [];
  app.use(options.routerPrefix, (req, res, next) => {
    if(router) {
      router(req, res, next);
    } else {
      waitingRequests.push({req, res, next});
    }
  });

  _watch(options.srcTree, outDir, () => {
    console.log('reloaded server');
    router = require(path.join(process.cwd(), outDir, options.router));
    waitingRequests.forEach(({ req, res, next }) => router(req, res, next));
    waitingRequests.length = 0;
  }, () => {
    router = null;
  });
}

async function build() {
  await _build(options.srcTree, 'dist');
  console.log('build complete');
}

module.exports = { build, test, serve };
