describe('DS#filter', function () {
  it('should throw an error when method pre-conditions are not met', function () {
    assert.throws(function () {
      store.filter('does not exist');
    }, Error, 'does not exist is not a registered resource!');

    DSUtils.forEach(TYPES_EXCEPT_OBJECT, function (key) {
      if (key) {
        assert.throws(function () {
          store.filter('post', key);
        }, Error, '"params" must be an object!');
      }
    });

    store.inject('post', p1);

    DSUtils.forEach(TYPES_EXCEPT_OBJECT, function (key) {
      if (key) {
        assert.throws(function () {
          store.filter('post', {}, key);
        }, Error, '"options" must be an object!');
      }
    });

    store.filter('post');
  });
  it('should correctly apply "where" predicates', function () {
    assert.doesNotThrow(function () {
      store.inject('post', p1);
      store.inject('post', p2);
      store.inject('post', p3);
      store.inject('post', p4);
      store.inject('post', p5);
    }, Error, 'should not throw an error');

    assert.equal(lifecycle.beforeInject.callCount, 5);
    assert.equal(lifecycle.afterInject.callCount, 5);

    var params = {
      author: 'John'
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1]), 'should default a string to "=="');

    params = {
      author: 'Adam',
      id: 9
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p5]), 'should default a string to "=="');

    params = {
      where: {
        author: 'John'
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1]), 'should default a string to "=="');

    params.where.author = {
      '==': 'John'
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1]), 'should accept normal "==" clause');

    params.where.author = {
      '===': null
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([]), 'should accept normal "===" clause');

    params.where.author = {
      '!=': 'John'
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3, p4, p5]), 'should accept normal "!=" clause');

    params.where = {
      age: {
        '>': 31
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p3, p4, p5]), 'should accept normal ">" clause');

    params.where = {
      age: {
        '>=': 31
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3, p4, p5]), 'should accept normal ">=" clause');

    params.where = {
      age: {
        '<': 31
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1]), 'should accept normal "<" clause');

    params.where = {
      age: {
        '>': 30,
        '<': 33
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3]), 'should accept dual "<" and ">" clause');

    params.where = {
      age: {
        '|>': 30,
        '|<': 33
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4, p5]), 'should accept or "<" and ">" clause');

    params.where = {
      age: {
        '|<=': 31
      },
      author: {
        '|==': 'Adam'
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p4, p5]), 'should accept or "<=" and "==" clause');

    params.where = {
      age: {
        '<=': 31
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2]), 'should accept normal "<=" clause');

    params.where = {
      age: {
        'in': [30, 33]
      },
      author: {
        'in': ['John', 'Sally', 'Adam']
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p4, p5]), 'should accept normal "in" clause');

    params.where = {
      author: {
        'in': 'John'
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1]), 'should accept normal "in" clause with a string');

    params.where = {
      author: {
        'notIn': 'John'
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3, p4, p5]), 'should accept normal "notIn" clause with a string');

    params.where = {
      age: {
        '|in': [31]
      },
      id: {
        '|in': [8]
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p4]), 'should accept and/or clause');

    params.where = {
      id: {
        'notIn': [8]
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p5]), 'should accept notIn clause');

    params.where = { age: { garbage: 'should have no effect' } };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4, p5]), 'should return all elements');
  });
  it('should correctly apply "orderBy" predicates', function () {
    assert.doesNotThrow(function () {
      store.inject('post', p1);
      store.inject('post', p2);
      store.inject('post', p3);
      store.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      orderBy: 'age'
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4]), 'should accept a single string and sort in ascending order for numbers');

    params.orderBy = 'author';

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p4, p1, p3, p2]), 'should accept a single string and sort in ascending for strings');

    params.orderBy = [
      ['age', 'DESC']
    ];

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p4, p3, p2, p1]), 'should accept an array of an array and sort in descending for numbers');

    params.orderBy = [
      ['author', 'DESC']
    ];

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3, p1, p4]), 'should accept an array of an array and sort in descending for strings');

    params.orderBy = ['age'];

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4]), 'should accept an array of a string and sort in ascending for numbers');

    params.orderBy = ['author'];

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p4, p1, p3, p2]), 'should accept an array of a string and sort in ascending for strings');
  });
  it('should work with multiple orderBy', function () {
    var items = [
      { id: 1, test: 1, test2: 1 },
      { id: 2, test: 2, test2: 2 },
      { id: 3, test: 3, test2: 3 },
      { id: 4, test: 1, test2: 4 },
      { id: 5, test: 2, test2: 5 },
      { id: 6, test: 3, test2: 6 },
      { id: 7, test: 1, test2: 1 },
      { id: 8, test: 2, test2: 2 },
      { id: 9, test: 3, test2: 3 },
      { id: 10, test: 1, test2: 4 },
      { id: 11, test: 2, test2: 5 },
      { id: 12, test: 3, test2: 6 }
    ];
    var params = {};

    Post.inject(items);

    params.orderBy = [
      ['test', 'DESC'],
      ['test2', 'ASC'],
      ['id', 'ASC']
    ];

    var posts = store.filter('post', params);

    assert.deepEqual(JSON.stringify(posts), JSON.stringify([
      items[2],
      items[8],
      items[5],
      items[11],
      items[1],
      items[7],
      items[4],
      items[10],
      items[0],
      items[6],
      items[3],
      items[9]
    ]));

    params.orderBy = [
      ['test', 'DESC'],
      ['test2', 'ASC'],
      ['id', 'DESC']
    ];

    posts = store.filter('post', params);

    assert.deepEqual(JSON.stringify(posts), JSON.stringify([
      items[8],
      items[2],
      items[11],
      items[5],
      items[7],
      items[1],
      items[10],
      items[4],
      items[6],
      items[0],
      items[9],
      items[3]
    ]));
  });
  it('should correctly apply "skip" predicates', function () {
    assert.doesNotThrow(function () {
      store.inject('post', p1);
      store.inject('post', p2);
      store.inject('post', p3);
      store.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      skip: 1
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3, p4]), 'should skip 1');

    params.skip = 2;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p3, p4]), 'should skip 2');

    params.skip = 3;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p4]), 'should skip 3');

    params.skip = 4;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([]), 'should skip 4');
  });
  it('should correctly apply "limit" predicates', function () {
    assert.doesNotThrow(function () {
      store.inject('post', p1);
      store.inject('post', p2);
      store.inject('post', p3);
      store.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      limit: 1
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1]), 'should limit to 1');

    params.limit = 2;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2]), 'should limit to 2');

    params.limit = 3;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3]), 'should limit to 3');

    params.limit = 4;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4]), 'should limit to 4');
  });
  it('should correctly apply "limit" and "skip" predicates together', function () {
    assert.doesNotThrow(function () {
      store.inject('post', p1);
      store.inject('post', p2);
      store.inject('post', p3);
      store.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      limit: 1,
      skip: 1
    };

    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2]), 'should limit to 1 and skip 2');

    params.limit = 2;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p2, p3]), 'should limit to 2 and skip 1');

    params.skip = 2;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p3, p4]), 'should limit to 2 and skip 2');

    params.limit = 1;
    params.skip = 3;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p4]), 'should limit to 1 and skip 3');

    params.limit = 8;
    params.skip = 0;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4]), 'should return all items');

    params.limit = 1;
    params.skip = 5;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([]), 'should return nothing if skip if greater than the number of items');

    params.limit = 8;
    delete params.skip;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([p1, p2, p3, p4]), 'should return all items');

    delete params.limit;
    params.skip = 5;
    assert.deepEqual(JSON.stringify(store.filter('post', params)), JSON.stringify([]), 'should return nothing if skip if greater than the number of items');
  });
  it('should allow custom filter function', function () {
    store.defineResource({
      name: 'Comment',
      defaultFilter: function (collection, resourceName, params) {
        var filtered = collection;
        var where = params.where;
        filtered = this.utils.filter(filtered, function (attrs) {
          return attrs.author === where.author.EQUALS || attrs.age % where.age.MOD === 1;
        });
        return filtered;
      }
    });
    assert.doesNotThrow(function () {
      store.inject('Comment', p1);
      store.inject('Comment', p2);
      store.inject('Comment', p3);
      store.inject('Comment', p4);
    }, Error, 'should not throw an error');

    var params = {
      where: {
        author: {
          'EQUALS': 'John'
        },
        age: {
          'MOD': 30
        }
      }
    };

    assert.deepEqual(JSON.stringify(store.filter('Comment', params)), JSON.stringify([p1, p2]), 'should keep p1 and p2');
  });
  it('should order by nested keys', function () {
    var Thing = store.defineResource('thing');
    var things = Thing.inject([
      {
        id: 1,
        foo: {
          bar: 'f'
        }
      },
      {
        id: 2,
        foo: {
          bar: 'a'
        }
      },
      {
        id: 3,
        foo: {
          bar: 'c'
        }
      },
      {
        id: 4,
        foo: {
          bar: 'b'
        }
      }
    ]);

    var params = {
      orderBy: [['foo.bar', 'ASC']]
    };

    assert.deepEqual(JSON.stringify(Thing.filter(params)), JSON.stringify([things[1], things[3], things[2], things[0]]), 'should order by a nested key');

    params = {
      orderBy: [['foo.bar', 'DESC']]
    };
    assert.deepEqual(JSON.stringify(Thing.filter(params)), JSON.stringify([things[0], things[2], things[3], things[1]]), 'should order by a nested key');
  });
  it('should filter by nested keys', function () {
    var Thing = store.defineResource('thing');
    var things = Thing.inject([
      {
        id: 1,
        foo: {
          bar: 1
        }
      },
      {
        id: 2,
        foo: {
          bar: 2
        }
      },
      {
        id: 3,
        foo: {
          bar: 3
        }
      },
      {
        id: 4,
        foo: {
          bar: 4
        }
      }
    ]);

    var params = {
      where: {
        'foo.bar': {
          '>': 2
        }
      }
    };

    assert.deepEqual(JSON.stringify(Thing.filter(params)), JSON.stringify([things[2], things[3]]), 'should filter by a nested key');
  });
  it('should allow use of scopes', function () {
    var store = new JSData.DS({
      log: false,
      scopes: {
        defaultScope: {
          foo: 'bar'
        }
      }
    });
    var Foo = store.defineResource({
      name: 'foo',
      scopes: {
        second: {
          beep: 'boop'
        },
        limit: {
          limit: 1
        }
      }
    });
    var foos = Foo.inject([
      { id: 1, foo: 'bar' },
      { id: 2, beep: 'boop' },
      { id: 3, foo: 'bar', beep: 'boop' },
      { id: 4, foo: 'bar', beep: 'boop' },
      { id: 5, foo: 'bar', beep: 'boop' },
      { id: 6, foo: 'bar', beep: 'boop' },
      { id: 7, foo: 'bar', beep: 'boop' },
      { id: 8, foo: 'bar', beep: 'boop' }
    ]);
    assert.objectsEqual(Foo.filter(null, {
      scope: ['second', 'limit']
    }), [foos[2]]);
    assert.objectsEqual(Foo.filter(null, {
      scope: ['second']
    }), Foo.filter({
      foo: 'bar',
      beep: 'boop'
    }));
    assert.objectsEqual(Foo.filter(), Foo.filter({
      foo: 'bar'
    }));
  });
  it('should support the "like" operator', function () {
    var users = User.inject([
      { id: 1, name: 'foo' },
      { id: 2, name: 'xfoo' },
      { id: 3, name: 'foox' },
      { id: 4, name: 'xxfoo' },
      { id: 5, name: 'fooxx' },
      { id: 6, name: 'xxfooxx' },
      { id: 7, name: 'xxfooxxfooxx' },
      { id: 8, name: 'fooxxfoo' },
      { id: 9, name: 'fooxfoo' },
      { id: 10, name: 'fooxxfoox' },
    ]);
    assert.deepEqual(User.filter({ where: { name: { like: 'foo' } } }), [users[0]]);
    assert.deepEqual(User.filter({ where: { name: { like: '_foo' } } }), [users[1]]);
    assert.deepEqual(User.filter({ where: { name: { like: 'foo_' } } }), [users[2]]);
    assert.deepEqual(User.filter({ where: { name: { like: '%foo' } } }), [users[0], users[1], users[3], users[7], users[8]]);
    assert.deepEqual(User.filter({ where: { name: { likei: 'FOO%' } } }), [users[0], users[2], users[4], users[7], users[8], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { like: '%foo%' } } }), users);
    assert.deepEqual(User.filter({ where: { name: { like: '%foo%foo%' } } }), [users[6], users[7], users[8], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { like: 'foo%foo' } } }), [users[7], users[8]]);
    assert.deepEqual(User.filter({ where: { name: { like: 'foo_foo' } } }), [users[8]]);
    assert.deepEqual(User.filter({ where: { name: { like: 'foo%foo_' } } }), [users[9]]);

    assert.deepEqual(User.filter({ where: { name: { notLike: 'foo' } } }), [users[1], users[2], users[3], users[4], users[5], users[6], users[7], users[8], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: '_foo' } } }), [users[0], users[2], users[3], users[4], users[5], users[6], users[7], users[8], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: 'foo_' } } }), [users[0], users[1], users[3], users[4], users[5], users[6], users[7], users[8], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: '%foo' } } }), [users[2], users[4], users[5], users[6], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: 'foo%' } } }), [users[1], users[3], users[5], users[6]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: '%foo%' } } }), []);
    assert.deepEqual(User.filter({ where: { name: { notLike: '%foo%foo%' } } }), [users[0], users[1], users[2], users[3], users[4], users[5]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: 'foo%foo' } } }), [users[0], users[1], users[2], users[3], users[4], users[5], users[6], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: 'foo_foo' } } }), [users[0], users[1], users[2], users[3], users[4], users[5], users[6], users[7], users[9]]);
    assert.deepEqual(User.filter({ where: { name: { notLike: 'foo%foo_' } } }), [users[0], users[1], users[2], users[3], users[4], users[5], users[6], users[7], users[8]]);
  });
  it('should include temporary items when `excludeTemporary` is false', function() {
    var user1 = User.inject({ name: 'foo' }, {temporary: true});
    var user2 = User.inject({ id: 2, name: 'foo' });

    assert.equal(User.filter().length, 2);
    assert.equal(User.filter(null, {excludeTemporary: false}).length, 2);
    assert.equal(User.filter(null, {excludeTemporary: true}).length, 1);

    assert.equal(User.filter({name: 'foo'}, {excludeTemporary: true}).length, 1);
    assert.equal(User.filter({name: 'foo'}, {excludeTemporary: false}).length, 2);
  });
});
