const commander = require('commander');
const { build, test, serve } = require('./src/start');

commander.version(require('./package.json').version)
commander.command('build')
  .alias('b')
  .action(() => build());

commander.command('test')
  .alias('t')
  .option('-w, --watch', 'watch file changes')
  .action((cmd) => test(cmd.watch));

commander.command('serve')
  .alias('s')
  .action(() => serve());

commander.parse(process.argv);
