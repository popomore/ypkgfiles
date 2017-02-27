'use strict';

const fs = require('mz/fs');
const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const bin = path.join(__dirname, '../bin/pkgfiles.js');

describe('test/index.test.js', () => {

  let cwd;
  afterEach(() => fs.writeFile(path.join(cwd, 'package.json'), '{}'));

  it('should resolve files', function* () {
    cwd = path.join(__dirname, 'fixtures/resolve');
    yield coffee.fork(bin, [], { cwd })
    .debug()
    .end();

    assert.deepEqual(getFiles(cwd), [
      'index.js',
      'lib',
      'util.js',
      'c',
      'pkg',
    ]);
  });

  it('should resolve recursively', function* () {
    cwd = path.join(__dirname, 'fixtures/recursive');
    yield coffee.fork(bin, [], { cwd })
    .debug()
    .end();

    assert.deepEqual(getFiles(cwd), [
      'index.js',
      'lib',
      'util.js',
    ]);
  });

  it('should multi entry', function* () {
    cwd = path.join(__dirname, 'fixtures/multi-entry');
    yield coffee.fork(bin, [ '--entry', 'a.js', '--entry', 'b.js', '--entry', 'app' ], { cwd })
    .debug()
    .end();

    assert.deepEqual(getFiles(cwd), [
      'index.js',
      'a.js',
      'a',
      'b.js',
      'b',
      'app',
      'c',
    ]);
  });

  it('should support glob entry', function* () {
    cwd = path.join(__dirname, 'fixtures/multi-entry');
    yield coffee.fork(bin, [ '--entry', '*.js' ], { cwd })
    .debug()
    .end();

    assert.deepEqual(getFiles(cwd), [
      'index.js',
      'a.js',
      'a',
      'b.js',
      'b',
    ]);
  });

  it('should resolve bin', function* () {
    cwd = path.join(__dirname, 'fixtures/bin');
    fs.writeFileSync(path.join(cwd, 'package.json'), '{"bin":{"bin":"bin/bin.js"}}');
    yield coffee.fork(bin, [], { cwd })
    .debug()
    .end();

    assert.deepEqual(getFiles(cwd), [
      'index.js',
      'bin',
    ]);
  });

  it('should ignore when no export', function* () {
    cwd = path.join(__dirname, 'fixtures/no-export');
    yield coffee.fork(bin, [ '--entry', 'a.js' ], { cwd })
    .debug()
    .end();

    assert.deepEqual(getFiles(cwd), [
      'a.js',
    ]);
  });

});

function getFiles(cwd) {
  const body = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8');
  assert(/\n$/.test(body));
  return JSON.parse(body).files;
}
