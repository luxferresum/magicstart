const {expect} = require('chai');
const { build, test, serve } = require('../src/start');
const rimraf = require('rimraf');
const fs = require('fs');
const sinon = require('sinon');
const Mocha = require('mocha');
const { Builder, Watcher } = require('broccoli');
const TreeSync = require('tree-sync');

function timeout(t) {
  return new Promise(r => setTimeout(() => r(), t));
}

describe('magicstart', function() {
  let sync;
  let builderBuild;
  let builderCleanup;
  let watcherStart;
  let watcherQuit;
  let oldCwd;
  let exitCode;
  let mochaAddFile;
  let mochaRun;

  beforeEach(() => {
    oldCwd = process.cwd();
    exitCode = process.exitCode;
    sync = sinon.stub(TreeSync.prototype, 'sync');
    builderBuild = sinon.stub(Builder.prototype, 'build');
    builderCleanup = sinon.stub(Builder.prototype, 'cleanup');
    watcherStart = sinon.stub(Watcher.prototype, 'start');
    watcherQuit = sinon.stub(Watcher.prototype, 'quit');
    mochaAddFile = sinon.stub(Mocha.prototype, 'addFile');
    mochaRun = sinon.stub(Mocha.prototype, 'run');
  });
  afterEach(() => {
    sync.restore();
    builderBuild.restore();
    builderCleanup.restore();
    watcherStart.restore();
    watcherQuit.restore();
    mochaAddFile.restore();
    mochaRun.restore();

    process.chdir(oldCwd);
    process.exitCode = exitCode;
  });

  describe('build', function() {
    it('does build the project', async function() {
      await build();
      expect(builderBuild.callCount).to.be.eq(1);
      expect(builderCleanup.callCount).to.be.eq(1);
      expect(sync.callCount).to.be.eq(1);
    });
  });

  describe('it does test a project', function() {
    it('does test the project', async function() {
      mochaRun.callsFake(fn => fn([]));

      process.chdir('test_fixtures/project1/');

      await test();
      expect(builderBuild.callCount).to.be.eq(1);
      expect(builderCleanup.callCount).to.be.eq(1);
      expect(sync.callCount).to.be.eq(1);
      expect(mochaRun.callCount).to.be.eq(1);
      expect(mochaAddFile.callCount).to.be.eq(2);
    });

    it('does test and watch the project', async function() {
      let instance;
      watcherStart.callsFake(function() {
        instance = this;
      });

      process.chdir('test_fixtures/project1/');

      test(true);

      instance.emit('buildSuccess');
      await timeout(1);

      expect(watcherStart.callCount, 'watcherStart').to.be.eq(1);
      expect(sync.callCount, 'sync').to.be.eq(1);
      expect(mochaRun.callCount, 'mochaRun').to.be.eq(1);
      expect(mochaAddFile.callCount, 'mochaAddFile').to.be.eq(2);

      instance.emit('buildSuccess');
      await timeout(1);

      expect(watcherStart.callCount, 'watcherStart').to.be.eq(1);
      expect(sync.callCount, 'sync').to.be.eq(2);
      expect(mochaRun.callCount, 'mochaRun').to.be.eq(2);
      expect(mochaAddFile.callCount, 'mochaAddFile').to.be.eq(4);
    });
  });

  describe('it does serve a project', function() {
    it('does serve the project', async function() {
      process.chdir('test_fixtures/project1/');
      serve();
      
    });
  });
});

// describe('magicstart', function() {

//   const dir = process.cwd();
//   let exitCode;
//   let logStub;
//   beforeEach(function() {
//     logStub = sinon.stub(console, "log");
//     exitCode = process.exitCode;
//     process.exitCode = 7;
//   //   exitStub = sinon.stub(process, 'exit');
//   //   oldCwd = process.cwd();
//   //   process.chdir('test/fixtures/project/subdir');
//   });
//   afterEach(function() {
//     logStub.restore();
//     process.exitCode = exitCode;
//     sinon.restore();
//     process.chdir(dir);
//     // process.removeAllListeners('SIGTERM');
//     // process.removeAllListeners('SIGINT');
//   });

//   it('should build the project', async function() {
//     process.chdir('test_fixtures/project1');
//     rimraf.sync('dist_testing');
//     await build();
//     expect(fs.existsSync('dist/demo.js')).to.be.true;
//     expect(fs.existsSync('dist/router.js')).to.be.true;
//   });

//   it('should test the bad project', async function() {
//     process.chdir('test_fixtures/project1');
//     rimraf.sync('dist_testing');
//     await test();
//     expect(process.exitCode).to.be.eq(1);
//   });

//   it('should test the good project', async function() {
//     process.chdir('test_fixtures/project2');
//     rimraf.sync('dist_testing');
//     await test();
//     expect(process.exitCode).to.be.eq(0);
//   });

//   it('watches src in test', async function() {
//     this.timeout(10000);

//     const addFile = sinon.stub(Mocha.prototype, 'addFile');
//     const run = sinon.stub(Mocha.prototype, 'run');

//     process.chdir('test_fixtures/project2');

//     test(true);
//     await spin(() => expect(run).to.have.property('callCount', 1), 10000);

//     fs.utimesSync('src/dummy.js', new Date(), new Date());
//     await spin(() => expect(run).to.have.property('callCount', 2), 10000);
//   });

//   it('watches test in test', async function() {
//     this.timeout(10000);

//     const addFile = sinon.stub(Mocha.prototype, 'addFile');
//     const run = sinon.stub(Mocha.prototype, 'run');

//     process.chdir('test_fixtures/project2');

//     test(true);
//     await spin(() => expect(run).to.have.property('callCount', 1), 10000);

//     fs.utimesSync('test/demo-test.js', new Date(), new Date());
//     await spin(() => expect(run).to.have.property('callCount', 2), 10000);
//   });
// });

// function spin(cb, limit) {
//   return new Promise((resolve, reject) => {
//     let spinner;
//     let cancel = setTimeout(() => {
//       clearTimeout(spinner);
//       try {
//         cb();
//         resolve();
//       } catch (e) {
//         reject(e);
//       }
//     }, limit);

//     (function spin() {
//       try {
//         cb();
//         clearTimeout(cancel);
//         resolve();
//       } catch (e) {
//         if (e.name === 'AssertionError') {
//           spinner = setTimeout(spin, 0);
//         }
//       }
//     })();
//   });
// }