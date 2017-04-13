'use strict';

const fs = require('mz/fs');
const path = require('path');
const coffee = require('coffee');
const bin = path.join(__dirname, '../bin/ypkgfiles.js');

describe('test/index.test.js', () => {

  let cwd;
  afterEach(() => fs.writeFile(path.join(cwd, 'package.json'), '{}'));

  it('should check length', function* () {
    cwd = path.join(__dirname, 'fixtures/resolve');
    yield coffee.fork(bin, [ '--check' ], { cwd })
    .expect('code', 1)
    .expect('stderr', 'pkg.files should equal to [ index.js, lib, util.js, c, pkg ], but got [  ]\n')
    .debug()
    .end();
  });

  it('should check content when length is same', function* () {
    cwd = path.join(__dirname, 'fixtures/check-array');
    yield fs.writeFile(path.join(cwd, 'package.json'), '{"files": ["index.js","app"]}');
    yield coffee.fork(bin, [ '--check' ], { cwd })
    .expect('code', 1)
    .expect('stderr', 'pkg.files should equal to [ index.js, lib ], but got [ index.js, app ]\n')
    .debug()
    .end();
  });

  it('should pass checking when order is different', function* () {
    cwd = path.join(__dirname, 'fixtures/check-order');
    yield fs.writeFile(path.join(cwd, 'package.json'), '{"files": ["lib", "index.js"]}');
    yield coffee.fork(bin, [ '--check' ], { cwd })
    .expect('code', 0)
    .debug()
    .end();
  });

});
