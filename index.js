'use strict';

const fs = require('fs');
const path = require('path');
const is = require('is-type-of');
const crequire = require('crequire');
const glob = require('glob');


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

  addResult(getFiles(options), result, cwd);

  pkg.files = Array.from(result);
  writePackage(path.join(cwd, 'package.json'), pkg);
};

function resolveRelativeFiles(entry, files) {
  if (!files) files = new Set();
  files.add(entry);
  const body = fs.readFileSync(entry, 'utf8');
  const rfiles = crequire(body, true).map(o => o.path);
  for (let file of rfiles) {
    // only resolve relative path
    if (file[0] === '.') {
      file = path.join(path.dirname(entry), file);
      if (fs.existsSync(file.replace(/\.js$/, '') + '.js')) {
        file = file.replace(/\.js$/, '') + '.js';
      } else {
        file = path.join(file, 'index.js');
      }
      resolveRelativeFiles(file, files);
    }
  }
  return files;
}

function addResult(files, result, cwd) {
  for (const file of files) {
    result.add(path.relative(cwd, file).split('/')[0]);
  }
}

function readPackage(pkgPath) {
  const content = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(content);
}

function writePackage(pkgPath, obj) {
  const content = JSON.stringify(obj, null, 2);
  fs.writeFileSync(pkgPath, content);
}

function resolveEntry(options) {
  const cwd = options.cwd;
  const pkg = options.pkg;
  let entries = [];
  if (is.array(options.entry)) entries = options.entry;
  if (is.string(options.entry)) entries.push(options.entry);

  const result = new Set();

  // set the entry that module exports
  result.add(require.resolve(cwd));

  for (const entry of entries) {
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

function getFiles(options) {
  const cwd = options.cwd;
  let files = [];
  if (is.array(options.files)) files = options.files;
  if (is.string(options.files)) files.push(options.files);

  const result = new Set();
  for (let file of files) {
    file = path.join(cwd, file);
    if (fs.existsSync(file)) {
      result.add(file);
    }
  }
  return result;
}
