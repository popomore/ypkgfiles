#!/usr/bin/env node

'use strict';

const argv = require('yargs')
  .version()
  .alias('V', 'version')
  .boolean('check')
  .argv;

try {
  require('..')({
    cwd: argv.cwd || process.cwd(),
    entry: argv.entry,
    files: argv.files,
    check: argv.check,
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
