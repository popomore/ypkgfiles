#!/usr/bin/env node

'use strict';

const argv = require('yargs').argv;

require('..')({
  cwd: argv.cwd || process.cwd(),
  entry: argv.entry,
  files: argv.files,
});
