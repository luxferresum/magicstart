const { Builder, Watcher } = require('broccoli');
const TreeSync = require('tree-sync');
const Mocha = require('mocha');
const walkSync = require('walk-sync');
const path = require('path');
const express = require('express');
const http = require('http');

const options = require('./loaded-options.js');

function cleanupCache() {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(path.join(process.cwd(), 'dist'))) {
      delete require.cache[key];
    }
  });
}

function _watch(tree, hooks = {}) {
  const builder = new Builder(tree);
  const watcher = new Watcher(builder);
  const treeSync = new TreeSync(builder.outputPath, 'dist');

  watcher.on('buildSuccess', async () => {
    await treeSync.sync();
    cleanupCache();
    if(hooks.buildSuccess) {
      await hooks.buildSuccess();
    }
  });

  watcher.on('buildStart', async () => {
    if(hooks.buildStart) {
      await hooks.buildStart();
    }
  });

  watcher.start();
}

async function _build(tree) {
  const builder = new Builder(tree);
  await builder.build();
  const treeSync = new TreeSync(builder.outputPath, 'dist');
  await treeSync.sync();
  await builder.cleanup();
}

function _test() {
  const mocha = new Mocha();
  walkSync(path.join('dist', 'test'))
    .filter(x => !x.endsWith('/'))
    .forEach(x => mocha.addFile(path.join('dist', 'test', x)));

  return new Promise((resolve) => {
    mocha.run(failures => {
      resolve(failures);
    });
  });
}

async function test(watch) {
  if(watch) {
    _watch(options.testingTree, {
      buildSuccess: () => _test(),
    });
  } else {
    await _build(options.testingTree);
    const failures = await _test();
    process.exitCode = failures ? 1 : 0;
  }
}

// function debouncePromiseFn(fn) {
//   let promise = null;
//   let scheduled = null;
//   let blockCount = 0;

//   async function _call() {
//     await fn();
//     promise = null;
//   }

//   function call() {
//     if(!promise) {
//       promise = fn();
//       return;
//     }
//     if(!scheduled) {
//       scheduled = true;
//       promise.then(() => {
//         scheduled = false;
//         call();
//       });
//       return;
//     }
//   }

//   return call;
// }

class RequestHandler {
  constructor() {
    this.requests = [];
    this.blockCount = 0;
  }

  push({req, res, next}) {
    this.requests.push({req, res, next});
    this.flush();
  }

  async _flush() {
    if(!this.router) {
      if(!this.setupPromise) {
        this.setupPromise = this._setup();
      }
      await this.setupPromise;
      this.setupPromise = null;
    }

    this.blockCount++;
    this.requests.forEach(({req, res, next}) => {
      this.router(req, res, next);
    });
    this.requests.length = 0;
    this.blockCount--;
  }

  async _setup() {
    const {start, stop} = require(path.join(process.cwd(), 'dist', 'src', options.initFile));
    this._stopFn = stop;
    await start();

    console.log(`------------- started ---`);

    this.router = require(path.join(process.cwd(), 'dist', 'src', options.routerFile));

    if(options.routerExportName) {
      this.router = this.router[options.routerExportName];
    }

    if(options.routerExportIsAFunction) {
      this.router = this.router();
    }
  }

  async _teardown() {
    console.log('_teardown');
    if(this._setupPromise) {
      await this._setupPromise;
    }
    if(this._stopFn) {
      await this._stopFn();
    }
  }

  flush() {
    if(this.blockCount === 0) {
      this._flush();
    }
  }

  async block() {
    console.log('block');

    this.blockCount++;
    this.router = null;
    if(!this._teardownPromise) {
      this._teardownPromise = this._teardown();
    }
    await this._teardownPromise;
    this._teardownPromise = null;
  }

  async unblock() {
    console.log('unblock');

    this.blockCount--;
    await this.flush();
  }
}

function serve() {
  const app = express();
  const server = http.Server(app);
  const handler = new RequestHandler();
  
  server.listen(options.port, () => {
    console.log('development server started on port ' + options.port);
  });

  app.use(options.routerPrefix, (req, res, next) => {
    handler.push({req, res, next});
  });

  app.use('/CLEANUP_WORLD', async (req, res, next) => {
    try {
      await handler.block();
      await options.resetWorld();
      await handler.unblock();
      res.status(200).end();
    } catch (e) {
      res.status(500).end();
    }
  });

  _watch(options.servingTree, {
    buildStart: () => handler.block(),
    buildSuccess: () => handler.unblock(),
  });
}

async function build() {
  await _build(options.appTree);
  console.log('build complete');
}

async function setupWorld() {
  await _build(options.servingTree);
  await options.resetWorld();
}

module.exports = { build, test, serve, setupWorld };
