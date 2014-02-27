var assert = require('assert');

suite('Methods Model', function() {
  test('buildPayload - simple', function(done, server) {
    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodCompleted, 'aa', 'hello', 2, 800 , 10);

    var payload = server.evalSync(function() {
      emit('return', model.buildPayload());
    });

    assert.deepEqual(payload, {
      methodRequests: [],
      methodMetrics: [
        {
          startTime: 100,
          methods: {
            hello: {
              count: 2,
              errors: 0,
              wait: 0,
              db: 0,
              http: 0,
              email: 0,
              async: 0,
              compute: 7.5,
              total: 7.5
            }
          },
          endTime: 800
        }
      ]
    });
    done();
  });

  test('buildPayload - with errors', function(done, server) {
    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodErrored, 'aa', 'hello', 2, 'the-error', 800, 10);
    var payload = server.evalSync(function() {
      var payload = model.buildPayload();
      emit('return', payload);
    });

    assert.deepEqual(payload.methodMetrics, [
      {
        startTime: 100,
        methods: {
          hello: {
            count: 2,
            errors: 1,
            wait: 0,
            db: 0,
            http: 0,
            email: 0,
            async: 0,
            compute: 7.5,
            total: 7.5
          }
        },
        endTime: 800
      }
    ]);

    assert.equal(payload.methodRequests[0]._id, "aa::2");
    assert.equal(payload.methodRequests[0].type, "error");
    assert.equal(payload.methodRequests.length, 1);
    done();
  });

  test('buildPayload - with errors - the response', function(done, server) {
    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodErrored, 'aa', 'hello', 2, 'the-error', 800, 10);
    var payload = server.evalSync(function() {
      var payload = model.buildPayload();
      emit('return', payload);
    });

    var expectedResult = {
      _id: "aa::2",
      name: "hello",
      session: "aa",
      methodId: 2,
      events: [
        {type: 'start', at: 800},
        {type: 'error', at: 810, data: {error: 'the-error'}}
      ],
      type: "error",
      metrics: {
        "compute": 10,
        "total": 10,
        "wait": 0,
        "db": 0,
        "http": 0,
        "email": 0,
        "async": 0
      },
      errorCount: 1
    };

    assert.deepEqual(payload.methodRequests[0], expectedResult);
    assert.equal(payload.methodRequests.length, 1);
    done();
  });

  test('buildPayload - with errors - same error, multiple times', function(done, server) {
    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodErrored, 'aa', 'hello', 2, {message: "the-error"}, 800, 10);
    server.evalSync(createMethodErrored, 'aa', 'hello', 3, {message: "the-error"}, 800, 10);
    server.evalSync(createMethodErrored, 'aa', 'hello', 4, {message: "the-error"}, 800, 10);
    var payload = server.evalSync(function() {
      var payload = model.buildPayload();
      emit('return', payload);
    });

    var expectedResult = {
      _id: "aa::2",
      name: "hello",
      session: "aa",
      methodId: 2,
      events: [
        {type: 'start', at: 800},
        {type: 'error', at: 810, data: {error: {
          message: 'the-error'
        }}}
      ],
      type: "error",
      metrics: {
        "compute": 10,
        "total": 10,
        "wait": 0,
        "db": 0,
        "http": 0,
        "email": 0,
        "async": 0
      },
      errorCount: 3
    };

    assert.deepEqual(payload.methodRequests[0], expectedResult);
    assert.equal(payload.methodRequests.length, 1);
    done();
  });

  test('buildPayload - with errors - same error, diff methods, multiple times', function(done, server) {
    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodErrored, 'aa', 'hello', 2, {message: "the-error"}, 800, 10);
    server.evalSync(createMethodErrored, 'aa', 'hello', 3, {message: "the-error"}, 800, 10);
    server.evalSync(createMethodErrored, 'aa', 'hello2', 4, {message: "the-error"}, 800, 10);
    server.evalSync(createMethodErrored, 'aa', 'hello2', 5, {message: "the-error"}, 800, 10);
    var payload = server.evalSync(function() {
      var payload = model.buildPayload();
      emit('return', payload);
    });

    var expectedResult = {
      _id: "aa::2",
      name: "hello",
      session: "aa",
      methodId: 2,
      events: [
        {type: 'start', at: 800},
        {type: 'error', at: 810, data: {error: {
          message: 'the-error'
        }}}
      ],
      type: "error",
      metrics: {
        "compute": 10,
        "total": 10,
        "wait": 0,
        "db": 0,
        "http": 0,
        "email": 0,
        "async": 0
      },
      errorCount: 2
    };

    var expectedResult2 = {
      _id: "aa::4",
      name: "hello2",
      session: "aa",
      methodId: 4,
      events: [
        {type: 'start', at: 800},
        {type: 'error', at: 810, data: {error: {
          message: 'the-error'
        }}}
      ],
      type: "error",
      metrics: {
        "compute": 10,
        "total": 10,
        "wait": 0,
        "db": 0,
        "http": 0,
        "email": 0,
        "async": 0
      },
      errorCount: 2
    };

    assert.deepEqual(payload.methodRequests[0], expectedResult);
    assert.deepEqual(payload.methodRequests[1], expectedResult2);
    assert.equal(payload.methodRequests.length, 2);
    done();
  });

  test('buildPayload - max min', function(done, server) {
    server.evalSync(function() {
      model = new MethodsModel();
      emit('return');
    });

    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodCompleted, 'aa', 'hello', 2, 800 , 15);
    server.evalSync(createMethodCompleted, 'aa', 'hello', 3, 900 , 2000);

    var lastMethodId = 3;
    var expectedResult = {
      total: {_id: 'aa::3', total: 2000},
      compute: {_id: 'aa::3', compute: 2000},
    };

    ['wait', 'http', 'db', 'email', 'async'].forEach(function(eventType) {
      server.evalSync(createMethodWithEvent, 'aa', 'hello', ++lastMethodId, 800 , eventType, 1000);
      expectedResult[eventType] = {_id: 'aa::' + lastMethodId};
      expectedResult[eventType][eventType] = 1000;
      server.evalSync(createMethodWithEvent, 'aa', 'hello', ++lastMethodId, 800 , eventType, 10);
    });

    var payload2 = server.evalSync(getPayload, true);  

    assert.equal(payload2.methodRequests.length, 7);
    
    var processedResult = {};
    payload2.methodRequests.forEach(function(method) {
      processedResult[method.maxMetric] = {_id: method._id};
      processedResult[method.maxMetric][method.maxMetric] = method.metrics[method.maxMetric];
    });

    assert.deepEqual(processedResult, expectedResult);
    done();
  });

  test('buildPayload - max min - threshold', function(done, server) {
    server.evalSync(function() {
      //define threshold with 1500
      model = new MethodsModel({total: 1500});
      emit('return');
    });

    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodCompleted, 'aa', 'hello', 2, 800 , 15);
    server.evalSync(createMethodCompleted, 'aa', 'hello', 3, 900 , 2000);

    var lastMethodId = 3;
    var expectedResult = {
      total: {_id: 'aa::3', total: 2000},
      compute: {_id: 'aa::3', compute: 2000},
    };

    //these are below the threashold, so not counting
    ['wait', 'http', 'db', 'email', 'async'].forEach(function(eventType) {
      server.evalSync(createMethodWithEvent, 'aa', 'hello', ++lastMethodId, 800 , eventType, 50);
      server.evalSync(createMethodWithEvent, 'aa', 'hello', ++lastMethodId, 800 , eventType, 10);
    });

    var payload2 = server.evalSync(getPayload, true);  

    assert.equal(payload2.methodRequests.length, 2);
    
    var processedResult = {};
    payload2.methodRequests.forEach(function(method) {
      processedResult[method.maxMetric] = {_id: method._id};
      processedResult[method.maxMetric][method.maxMetric] = method.metrics[method.maxMetric];
    });

    assert.deepEqual(processedResult, expectedResult);
    done();
  });

  test('buildPayload - max min - the response', function(done, server) {
    server.evalSync(function() {
      model = new MethodsModel();
      emit('return');
    });

    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 120);
    var payload1 = server.evalSync(getPayload, true);

    var expectedResult = {
      "_id": "aa::1",
      "name": "hello",
      "session": "aa",
      "methodId": 1,
      "events": [
        {
          "type": "start",
          "at": 100
        },
        {
          "type": "complete",
          "at": 220
        }
      ],
      "metrics": {
        "compute": 120,
        "total": 120,
        "wait": 0,
        "db": 0,
        "http": 0,
        "email": 0,
        "async": 0
      },
      "type": "max",
      // "maxMetric": "total" // this is deleted below
    };

    delete payload1.methodRequests[0].maxMetric;

    assert.deepEqual(payload1.methodRequests[0], expectedResult);
    done();
  });

  test('buildPayload - max min - multi-methods', function(done, server) {
    server.evalSync(function() {
      model = new MethodsModel();
      emit('return');
    });

    server.evalSync(createMethodCompleted, 'aa', 'hello', 1, 100, 5);
    server.evalSync(createMethodCompleted, 'aa', 'hello', 2, 800 , 15);

    server.evalSync(createMethodCompleted, 'aa', 'hello', 3, 900 , 2000);
    server.evalSync(createMethodCompleted, 'aa', 'hi', 200, 900 , 2000);
    var lastMethodId = 3;
    var expectedResult = {
      "hello::total": {_id: 'aa::3', total: 2000},
      "hi::total": {_id: 'aa::200', total: 2000},
      "hello::compute": {_id: 'aa::3', compute: 2000},
      "hi::compute": {_id: 'aa::200', compute: 2000},
    };

    ['hello', 'hi'].forEach(function(methodName) {
      ['wait', 'http', 'db', 'email', 'async'].forEach(function(eventType) {
        server.evalSync(createMethodWithEvent, 'aa', methodName, ++lastMethodId, 800 , eventType, 1000);

        var id = methodName + "::" + eventType;
        expectedResult[id] = {_id: 'aa::' + lastMethodId};
        expectedResult[id][eventType] = 1000;

        server.evalSync(createMethodWithEvent, 'aa', methodName, ++lastMethodId, 800 , eventType, 10);
      });
    });

    var payload2 = server.evalSync(getPayload, true);  
    assert.equal(payload2.methodRequests.length, 14);
    
    var processedResult = {};
    payload2.methodRequests.forEach(function(method) {
      var id = method.name + "::" + method.maxMetric;
      processedResult[id] = {_id: method._id};
      processedResult[id][method.maxMetric] = method.metrics[method.maxMetric];
    });

    assert.deepEqual(processedResult, expectedResult);
    done();
  });
});

function getPayload(buildDetailInfo) {
  emit('return', model.buildPayload(buildDetailInfo));
}

function createMethodCompleted(sessionName, methodName, methodId, startTime, methodDelay) {
  if(typeof model == 'undefined') {
    model = new MethodsModel();
  }

  methodDelay = methodDelay || 5;
  var method = {session: sessionName, name: methodName, id: methodId, events: []};
  method.events.push({type: 'start', at: startTime});
  method.events.push({type: 'complete', at: startTime + methodDelay});
  model.processMethod(method);

  emit('return');
}

function createMethodWithEvent(sessionName, methodName, methodId, startTime, eventName, eventDelay) {
  if(typeof model == 'undefined') {
    model = new MethodsModel();
  }
  var time = startTime;

  var method = {session: sessionName, name: methodName, id: methodId, events: []};
  method.events.push({type: 'start', at: time});
  method.events.push({type: eventName, at: time += 5});
  method.events.push({type: eventName + 'end', at: time += eventDelay});
  method.events.push({type: 'complete', at: time += 5});
  model.processMethod(method);

  emit('return');
}

function createMethodErrored(sessionName, methodName, methodId, errorMessage, startTime, methodDelay) {
  if(typeof model == 'undefined') {
    model = new MethodsModel();
  }

  methodDelay = methodDelay || 5;
  var method = {session: sessionName, name: methodName, id: methodId, events: []};
  method.events.push({type: 'start', at: startTime});
  method.events.push({type: 'error', at: startTime + methodDelay, data: {error: errorMessage}});
  model.processMethod(method);

  emit('return');
}

function prettyPrint(doc) {
  console.log(JSON.stringify(doc, null, 2));
}

function pick(doc, fields) {
  var newDoc = {};
  fields.forEach(function(field) {
    newDoc[field] = doc[field];
  });
  return newDoc;
}