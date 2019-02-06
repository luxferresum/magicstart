const {expect} = require('chai');
const { build, test, serve } = require('../src/start');
const rimraf = require('rimraf');
const fs = require('fs');
const sinon = require('sinon');

describe('magicstart', function() {

  const dir = process.cwd();
  let exitCode;
  let logStub;
  beforeEach(function() {
    logStub = sinon.stub(console, "log");
    exitCode = process.exitCode;
    process.exitCode = 7;
  //   exitStub = sinon.stub(process, 'exit');
  //   oldCwd = process.cwd();
  //   process.chdir('test/fixtures/project/subdir');
  });
  afterEach(function() {
    logStub.restore();
    process.exitCode = exitCode;
    // sinon.restore();
    process.chdir(dir);
    // process.removeAllListeners('SIGTERM');
    // process.removeAllListeners('SIGINT');
  });

  it('should build the project', async function() {
    process.chdir('test_fixtures/project1');
    rimraf.sync('dist_testing');
    await build();
    expect(fs.existsSync('dist/demo.js')).to.be.true;
    expect(fs.existsSync('dist/router.js')).to.be.true;
  });

  it('should test the bad project', async function() {
    process.chdir('test_fixtures/project1');
    rimraf.sync('dist_testing');
    await test();
    expect(process.exitCode).to.be.eq(1);
  });

  it('should test the good project', async function() {
    process.chdir('test_fixtures/project2');
    rimraf.sync('dist_testing');
    await test();
    expect(process.exitCode).to.be.eq(0);
  });
});