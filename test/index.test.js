'use strict';

const fs = require('mz/fs');
const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const bin = path.join(__dirname, '../bin/ypkgfiles.js');

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

  it('should resolve egg', function* () {
    cwd = path.join(__dirname, 'fixtures/pkgfiles');
    yield coffee.fork(bin, [
      '--entry', 'app',
      '--entry', 'config',
      '--entry', '*.js',
    ], { cwd })
      .debug()
      .end();

    assert.deepEqual(getFiles(cwd), [
      'app',
      'config',
      'app.js',
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

  it('should resolve index.d.ts', function* () {
    cwd = path.join(__dirname, 'fixtures/dts');
    yield coffee.fork(bin, [], { cwd })
      .debug()
      .end();

    assert.deepEqual(getFiles(cwd), [
      'index.js',
      'index.d.ts',
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

  it('should deprecate pkgfiles', function* () {
    const bin = path.join(__dirname, '../bin/pkgfiles.js');
    cwd = path.join(__dirname, 'fixtures/resolve');
    yield coffee.fork(bin, [], { cwd })
    // .debug()
    .expect('stderr', 'WARN: recommend to use ypkgfiles\n')
    .end();
  });

  it('should print --version', function* () {
    cwd = path.join(__dirname, 'fixtures/resolve');
    yield coffee.fork(bin, [ '--version' ], { cwd })
    // .debug()
    .expect('stdout', require('../package.json').version + '\n')
    .end();
  });

  it('should print -V', function* () {
    cwd = path.join(__dirname, 'fixtures/resolve');
    yield coffee.fork(bin, [ '-V' ], { cwd })
    // .debug()
    .expect('stdout', require('../package.json').version + '\n')
    .end();
  });

  it('should ignore when private', function* () {
    cwd = path.join(__dirname, 'fixtures/resolve');
    yield fs.writeFile(path.join(cwd, 'package.json'), '{"private":true}\n');
    yield coffee.fork(bin, [], { cwd })
    .debug()
    .end();

    assert.equal(getFiles(cwd), undefined);
  });
});

function getFiles(cwd) {
  const body = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8');
  assert(/\n$/.test(body));
  return JSON.parse(body).files;
}
