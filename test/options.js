const {expect} = require('chai');
const loadOptions = require('../src/load-options');

describe('options', function() {
  const dir = process.cwd();
  afterEach(function() {
    process.chdir(dir);
  });

  it('can load the overloaded options', function() {
    process.chdir('test_fixtures/project1');
    const options = loadOptions();
    expect(options).to.have.property('port', 42);
  });
});
