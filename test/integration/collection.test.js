import { assert, JSData, sinon } from '../_setup'

describe('Collection integration tests', function () {
  it('should bubble up record events', function (done) {
    const mapper = new JSData.Mapper({ name: 'user' })
    const data = [
      mapper.createRecord({ id: 2, age: 19 }),
      mapper.createRecord({ id: 1, age: 27 })
    ]
    const collection = new JSData.Collection(data, {
      mapper
    })
    const listener = sinon.stub()
    const listener2 = sinon.stub()
    collection.on('foo', listener)
    collection.on('all', listener2)
    data[0].emit('foo', 'bar', 'biz', 'baz')
    setTimeout(() => {
      assert(listener.calledOnce, 'listener should have been called once')
      assert.deepEqual(listener.firstCall.args, ['bar', 'biz', 'baz'], 'should have been called with the correct args')
      assert(listener2.calledOnce, 'listener2 should have been called once')
      assert.deepEqual(listener2.firstCall.args, [ 'foo', 'bar', 'biz', 'baz' ], 'should have been called with the correct args')
      done()
    }, 30)
  })

  it('should bubble up change events (assignment operator)', function (done) {
    let changed = false
    const store = new JSData.DataStore()
    store.defineMapper('foo', {
      schema: {
        properties: {
          bar: { type: 'string', track: true }
        }
      }
    })
    const foo = store.add('foo', { id: 1 })

    setTimeout(() => {
      if (!changed) {
        done('failed to fire change event')
      }
    }, 1000)

    store.getCollection('foo').on('change', (fooCollection, foo) => {
      changed = true
      done()
    })

    foo.bar = 'baz'
  })

  it('should bubble up change events (setter method)', function (done) {
    let changed = false
    const store = new JSData.DataStore()
    store.defineMapper('foo', {
      schema: {
        properties: {
          bar: { type: 'string', track: true }
        }
      }
    })
    const foo = store.add('foo', { id: 1 })

    setTimeout(() => {
      if (!changed) {
        done('failed to fire change event')
      }
    }, 1000)

    store.getCollection('foo').on('change', (fooCollection, foo) => {
      changed = true
      done()
    })

    foo.set('bar', 'baz')
  })
})
