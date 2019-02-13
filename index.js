#!/usr/bin/env node

const commander = require('commander');
const { build, test, serve, setupWorld } = require('./src/start');

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
  .option('--reset', 'reset world')
  .action((cmd) => serve(cmd.reset));

commander.command('setup-world')
  .action(() => setupWorld());

commander.parse(process.argv);
