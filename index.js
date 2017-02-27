'use strict';

const fs = require('fs');
const path = require('path');
const is = require('is-type-of');
const crequire = require('crequire');
const glob = require('glob');
const debug = require('debug')('ypkgfiles');


const defaults = {
  cwd: process.cwd(),
  entry: [],
  files: [],
};

module.exports = options => {
  options = Object.assign({}, defaults, options);

  const cwd = options.cwd;
  const pkg = options.pkg = readPackage(path.join(cwd, 'package.json'));
  const entries = resolveEntry(options);
  const result = new Set();

  for (const entry of entries) {
    const files = resolveRelativeFiles(entry);
    addResult(files, result, cwd);
  }

  pkg.files = Array.from(result);
  writePackage(path.join(cwd, 'package.json'), pkg);
};

function resolveRelativeFiles(entry, files) {
  if (!files) files = new Set();
  if (files.has(entry)) return;
  files.add(entry);
  debug('resolve entry %s', entry);
  const body = fs.readFileSync(entry, 'utf8');
  const rfiles = crequire(body, true).map(o => o.path);
  for (let file of rfiles) {
    // only resolve relative path
    if (file[0] === '.') {
      // ./foo.js > foo.js
      file = path.join(path.dirname(entry), file);
      if (isFile(file)) {
        resolveRelativeFiles(file, files);
        continue;
      }

      // ./foo > foo.js
      const filejs = file + '.js';
      if (isFile(filejs)) {
        resolveRelativeFiles(filejs, files);
        continue;
      }

      // ./foo > foo/index.js
      const filedir = path.join(file, 'index.js');
      if (isFile(filedir)) {
        resolveRelativeFiles(filedir, files);
        continue;
      }
    }
  }
  return files;
}

function addResult(files, result, cwd) {
  for (let file of files) {
    file = path.relative(cwd, file).split('/')[0];
    if (file !== 'package.json') {
      result.add(file);
      debug('add return %s', file);
    }
  }
}

function readPackage(pkgPath) {
  const content = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(content);
}

function writePackage(pkgPath, obj) {
  const content = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(pkgPath, content);
}

// return entries with fullpath based on options.entry
function resolveEntry(options) {
  const cwd = options.cwd;
  const pkg = options.pkg;
  let entries = [];
  if (is.array(options.entry)) entries = options.entry;
  if (is.string(options.entry)) entries.push(options.entry);

  const result = new Set();

  try {
    // set the entry that module exports
    result.add(require.resolve(cwd));
  } catch (_) {
    // ignore
  }

  for (let entry of entries) {
    const dir = path.join(cwd, entry);
    // if entry is directory, find all js in the directory
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      entry = path.join(entry, '**/*.js');
    }
    const files = glob.sync(entry, { cwd });
    for (const file of files) {
      result.add(path.join(cwd, file));
    }
  }

  if (pkg.bin) {
    const keys = Object.keys(pkg.bin);
    for (const key of keys) {
      result.add(path.join(cwd, pkg.bin[key]));
    }
  }

  return result;
}

function isFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}
