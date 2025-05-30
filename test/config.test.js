/*
 * Copyright Elasticsearch B.V. and other contributors where applicable.
 * Licensed under the BSD 2-Clause License; you may not use this file except in
 * compliance with the BSD 2-Clause License.
 */

'use strict';

var IncomingMessage = require('http').IncomingMessage;
var util = require('util');

var test = require('tape');

const Agent = require('../lib/agent');
const { MockAPMServer } = require('./_mock_apm_server');
const { NoopApmClient } = require('../lib/apm-client/noop-apm-client');
const { ENV_TABLE } = require('../lib/config/schema');
const config = require('../lib/config/config');

// Options to pass to `agent.start()` to turn off some default agent behavior
// that is unhelpful for these tests.
const agentOpts = {
  centralConfig: false,
  captureExceptions: false,
  metricsInterval: '0s',
  cloudProvider: 'none',
  logLevel: 'warn',
};
const agentOptsNoopTransport = Object.assign({}, agentOpts, {
  transport: function createNoopTransport() {
    // Avoid accidentally trying to send data to an APM server.
    return new NoopApmClient();
  },
});

// ---- support functions

function assertEncodedTransaction(t, trans, result) {
  t.comment('transaction');
  t.strictEqual(result.id, trans.id, 'id matches');
  t.strictEqual(result.trace_id, trans.traceId, 'trace id matches');
  t.strictEqual(result.parent_id, trans.parentId, 'parent id matches');
  t.strictEqual(result.name, trans.name, 'name matches');
  t.strictEqual(result.type, trans.type || 'custom', 'type matches');
  t.strictEqual(result.duration, trans._duration, 'duration matches');
  t.strictEqual(result.timestamp, trans.timestamp, 'timestamp matches');
  t.strictEqual(result.result, trans.result, 'result matches');
  t.strictEqual(result.sampled, trans.sampled, 'sampled matches');
}

function assertEncodedSpan(t, span, result) {
  t.comment('span');
  t.strictEqual(result.id, span.id, 'id matches');
  t.strictEqual(
    result.transaction_id,
    span.transaction.id,
    'transaction id matches',
  );
  t.strictEqual(result.trace_id, span.traceId, 'trace id matches');
  t.strictEqual(result.parent_id, span.parentId, 'parent id matches');
  t.strictEqual(result.name, span.name, 'name matches');
  t.strictEqual(result.type, span.type || 'custom', 'type matches');
  t.strictEqual(result.duration, span._duration, 'duration matches');
  t.strictEqual(result.timestamp, span.timestamp, 'timestamp matches');
}

function assertEncodedError(t, error, result, trans, parent) {
  t.comment('error');
  t.ok(result.id, 'has a valid id');
  t.strictEqual(result.trace_id, trans.traceId, 'trace id matches');
  t.strictEqual(result.transaction_id, trans.id, 'transaction id matches');
  t.strictEqual(result.parent_id, parent.id, 'parent id matches');
  t.ok(result.exception, 'has an exception object');
  t.strictEqual(
    result.exception.message,
    error.message,
    'exception message matches',
  );
  t.strictEqual(
    result.exception.type,
    error.constructor.name,
    'exception type matches',
  );
  t.ok(result.culprit, 'has a valid culprit');
  t.ok(result.timestamp, 'has a valid timestamp');
}

// ---- tests

test('should overwrite option property active by ELASTIC_APM_ACTIVE', function (t) {
  var agent = new Agent();
  var opts = { serviceName: 'foo', secretToken: 'baz', active: true };
  process.env.ELASTIC_APM_ACTIVE = 'false';
  agent.start(Object.assign({}, agentOptsNoopTransport, opts));
  t.strictEqual(agent._conf.active, false);
  delete process.env.ELASTIC_APM_ACTIVE;
  agent.destroy();
  t.end();
});

var captureBodyTests = [
  { value: 'off', errors: '[REDACTED]', transactions: '[REDACTED]' },
  { value: 'transactions', errors: '[REDACTED]', transactions: 'test' },
  { value: 'errors', errors: 'test', transactions: '[REDACTED]' },
  { value: 'all', errors: 'test', transactions: 'test' },
];

captureBodyTests.forEach(function (captureBodyTest) {
  test('captureBody => ' + captureBodyTest.value, function (t) {
    const apmServer = new MockAPMServer();
    apmServer.start(function (serverUrl) {
      const agent = new Agent().start(
        Object.assign({}, agentOpts, {
          serverUrl,
          captureBody: captureBodyTest.value,
        }),
      );

      var req = new IncomingMessage();
      req.socket = { remoteAddress: '127.0.0.1' };
      req.headers['transfer-encoding'] = 'chunked';
      req.headers['content-length'] = 4;
      req.body = 'test';

      var trans = agent.startTransaction();
      trans.req = req;
      trans.end();

      agent.captureError(new Error('wat'), { request: req }, function () {
        t.equal(apmServer.events.length, 3, 'apmServer got 3 events');
        let data = apmServer.events[1].transaction;
        t.ok(data, 'event 1 is a transaction');
        t.strictEqual(
          data.context.request.body,
          captureBodyTest.transactions,
          'transaction.context.request.body is ' + captureBodyTest.transactions,
        );
        data = apmServer.events[2].error;
        t.ok(data, 'event 2 is an error');
        t.strictEqual(
          data.context.request.body,
          captureBodyTest.errors,
          'error.context.request.body is ' + captureBodyTest.errors,
        );

        agent.destroy();
        apmServer.close();
        t.end();
      });
    });
  });
});

var usePathAsTransactionNameTests = [
  { value: true, url: '/foo/bar?baz=2', transactionName: 'GET /foo/bar' },
  { value: false, url: '/foo/bar?baz=2', transactionName: 'GET unknown route' },
];

usePathAsTransactionNameTests.forEach(function (usePathAsTransactionNameTest) {
  test(
    'usePathAsTransactionName => ' + usePathAsTransactionNameTest.value,
    function (t) {
      var sentTrans;
      var agent = new Agent();
      agent.start(
        Object.assign({}, agentOptsNoopTransport, {
          usePathAsTransactionName: usePathAsTransactionNameTest.value,
          transport() {
            return {
              sendTransaction(trans, cb) {
                sentTrans = trans;
                if (cb) process.nextTick(cb);
              },
              flush(opts, cb) {
                if (typeof opts === 'function') {
                  cb = opts;
                  opts = {};
                } else if (!opts) {
                  opts = {};
                }
                if (cb) process.nextTick(cb);
              },
            };
          },
        }),
      );

      var req = new IncomingMessage();
      req.socket = { remoteAddress: '127.0.0.1' };
      req.url = usePathAsTransactionNameTest.url;
      req.method = 'GET';

      var trans = agent.startTransaction();
      trans.req = req;
      trans.end();

      agent.flush(function () {
        t.ok(sentTrans, 'sent a transaction');
        t.strictEqual(
          sentTrans.name,
          usePathAsTransactionNameTest.transactionName,
          'transaction.name is ' + usePathAsTransactionNameTest.transactionName,
        );

        agent.destroy();
        t.end();
      });
    },
  );
});

test('disableInstrumentaions', function (t) {
  var agent = new Agent();

  // Spot-check some cases.
  agent.start(
    Object.assign({}, agentOptsNoopTransport, {
      disableInstrumentations: 'foo,express , bar',
    }),
  );
  t.strictEqual(agent._instrumentation._isModuleEnabled('express'), false);
  t.strictEqual(agent._instrumentation._isModuleEnabled('http'), true);

  agent.destroy();
  t.end();
});

test('custom transport', function (t) {
  class MyTransport {
    constructor() {
      this.transactions = [];
      this.spans = [];
      this.errors = [];
    }

    sendTransaction(data, cb) {
      this.transactions.push(data);
      if (cb) setImmediate(cb);
    }

    sendSpan(data, cb) {
      this.spans.push(data);
      if (cb) setImmediate(cb);
    }

    sendError(data, cb) {
      this.errors.push(data);
      if (cb) setImmediate(cb);
    }

    config() {}

    flush(opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      } else if (!opts) {
        opts = {};
      }
      if (cb) setImmediate(cb);
    }

    supportsKeepingUnsampledTransaction() {
      return true;
    }

    supportsActivationMethodField() {
      return true;
    }
  }
  const myTransport = new MyTransport();

  var agent = new Agent();
  agent.start(Object.assign({}, agentOpts, { transport: () => myTransport }));

  var error = new Error('error');
  var trans = agent.startTransaction('transaction');
  var span = agent.startSpan('span');
  agent.captureError(error);
  span.end();
  trans.end();

  agent.flush(function () {
    t.equal(
      myTransport.transactions.length,
      1,
      'received correct number of transactions',
    );
    assertEncodedTransaction(t, trans, myTransport.transactions[0]);
    t.equal(myTransport.spans.length, 1, 'received correct number of spans');
    assertEncodedSpan(t, span, myTransport.spans[0]);
    t.equal(myTransport.errors.length, 1, 'received correct number of errors');
    assertEncodedError(t, error, myTransport.errors[0], trans, span);
    agent.destroy();
    t.end();
  });
});

test('addPatch', function (t) {
  const before = require('generic-pool');
  const patch = require('./_patch');

  delete require.cache[require.resolve('generic-pool')];

  const agent = new Agent();
  agent.start(
    Object.assign({}, agentOptsNoopTransport, {
      addPatch: 'generic-pool=./test/_patch.js',
    }),
  );

  t.deepEqual(require('generic-pool'), patch(before));

  agent.destroy();
  t.end();
});

test('globalLabels should be received by transport', function (t) {
  var globalLabels = {
    foo: 'bar',
  };

  const apmServer = new MockAPMServer();
  apmServer.start(function (serverUrl) {
    const agent = new Agent().start(
      Object.assign({}, agentOpts, {
        serverUrl,
        globalLabels,
      }),
    );
    agent.captureError(new Error('trigger metadata'), function () {
      t.equal(apmServer.events.length, 2, 'apmServer got 2 events');
      const data = apmServer.events[0].metadata;
      t.ok(data, 'first event is metadata');
      t.deepEqual(
        data.labels,
        globalLabels,
        'metadata.labels has globalLabels',
      );
      agent.destroy();
      apmServer.close();
      t.end();
    });
  });
});

test('instrument: false allows manual instrumentation', function (t) {
  const apmServer = new MockAPMServer();
  apmServer.start(function (serverUrl) {
    const agent = new Agent().start(
      Object.assign({}, agentOpts, {
        serverUrl,
        instrument: false,
      }),
    );
    const trans = agent.startTransaction('trans');
    trans.end();
    agent.flush(function () {
      t.equal(apmServer.events.length, 2, 'apmServer got 2 events');
      const data = apmServer.events[1].transaction;
      t.ok(data, 'second event is a transaction');
      assertEncodedTransaction(t, trans, data);
      agent.destroy();
      apmServer.close();
      t.end();
    });
  });
});

test('parsing of ARRAY and KEY_VALUE opts', function (t) {
  var cases = [
    {
      opts: { transactionIgnoreUrls: ['foo', 'bar'] },
      expect: { transactionIgnoreUrls: ['foo', 'bar'] },
    },
    {
      opts: { transactionIgnoreUrls: 'foo' },
      expect: { transactionIgnoreUrls: ['foo'] },
    },
    {
      opts: { transactionIgnoreUrls: 'foo,bar' },
      expect: { transactionIgnoreUrls: ['foo', 'bar'] },
    },
    {
      env: { ELASTIC_APM_TRANSACTION_IGNORE_URLS: 'foo, bar' },
      expect: { transactionIgnoreUrls: ['foo', 'bar'] },
    },
    {
      opts: { transactionIgnoreUrls: ' \tfoo , bar ' },
      expect: { transactionIgnoreUrls: ['foo', 'bar'] },
    },
    {
      opts: { transactionIgnoreUrls: 'foo, bar bling' },
      expect: { transactionIgnoreUrls: ['foo', 'bar bling'] },
    },

    {
      opts: { elasticsearchCaptureBodyUrls: '*/_search, */_msearch/template ' },
      expect: {
        elasticsearchCaptureBodyUrls: ['*/_search', '*/_msearch/template'],
      },
    },

    {
      opts: { disableInstrumentations: 'foo, bar' },
      expect: { disableInstrumentations: ['foo', 'bar'] },
    },

    {
      opts: { addPatch: 'foo=./foo.js,bar=./bar.js' },
      expect: {
        addPatch: [
          ['foo', './foo.js'],
          ['bar', './bar.js'],
        ],
      },
    },
    {
      opts: { addPatch: ' foo=./foo.js, bar=./bar.js ' },
      expect: {
        addPatch: [
          ['foo', './foo.js'],
          ['bar', './bar.js'],
        ],
      },
    },
    {
      env: { ELASTIC_APM_ADD_PATCH: ' foo=./foo.js, bar=./bar.js ' },
      expect: {
        addPatch: [
          ['foo', './foo.js'],
          ['bar', './bar.js'],
        ],
      },
    },

    {
      opts: { globalLabels: 'foo=bar, spam=eggs' },
      expect: {
        globalLabels: [
          ['foo', 'bar'],
          ['spam', 'eggs'],
        ],
      },
    },
  ];

  cases.forEach(function testOneCase({ opts, env, expect }) {
    var origEnv = process.env;
    try {
      if (env) {
        process.env = Object.assign({}, origEnv, env);
      }
      var cfg = config.createConfig(opts);
      for (var field in expect) {
        t.deepEqual(
          cfg[field],
          expect[field],
          util.format('opts=%j env=%j -> %j', opts, env, expect),
        );
      }
    } finally {
      process.env = origEnv;
    }
  });

  t.end();
});

test('transactionSampleRate precision', function (t) {
  var cases = [
    {
      opts: { transactionSampleRate: 0 },
      expect: { transactionSampleRate: 0 },
    },
    {
      env: { ELASTIC_APM_TRANSACTION_SAMPLE_RATE: '0' },
      expect: { transactionSampleRate: 0 },
    },
    {
      opts: { transactionSampleRate: 0.0001 },
      expect: { transactionSampleRate: 0.0001 },
    },
    {
      opts: { transactionSampleRate: 0.00002 },
      expect: { transactionSampleRate: 0.0001 },
    },
    {
      env: { ELASTIC_APM_TRANSACTION_SAMPLE_RATE: '0.00002' },
      expect: { transactionSampleRate: 0.0001 },
    },
    {
      opts: { transactionSampleRate: 0.300000002 },
      expect: { transactionSampleRate: 0.3 },
    },
    {
      opts: { transactionSampleRate: 0.444444 },
      expect: { transactionSampleRate: 0.4444 },
    },
    {
      opts: { transactionSampleRate: 0.555555 },
      expect: { transactionSampleRate: 0.5556 },
    },
    {
      opts: { transactionSampleRate: 1 },
      expect: { transactionSampleRate: 1 },
    },
  ];

  cases.forEach(function testOneCase({ opts, env, expect }) {
    var origEnv = process.env;
    try {
      if (env) {
        process.env = Object.assign({}, origEnv, env);
      }
      var cfg = config.createConfig(opts);
      for (var field in expect) {
        t.deepEqual(
          cfg[field],
          expect[field],
          util.format('opts=%j env=%j -> %j', opts, env, expect),
        );
      }
    } finally {
      process.env = origEnv;
    }
  });

  t.end();
});

test('should accept and normalize cloudProvider', function (t) {
  const agentDefault = new Agent();
  agentDefault.start({
    disableSend: true,
  });
  t.equals(
    agentDefault._conf.cloudProvider,
    'auto',
    'cloudProvider config defaults to auto',
  );
  agentDefault.destroy();

  const agentGcp = new Agent();
  agentGcp.start({
    disableSend: true,
    cloudProvider: 'gcp',
  });
  agentGcp.destroy();
  t.equals(
    agentGcp._conf.cloudProvider,
    'gcp',
    'cloudProvider can be set to gcp',
  );

  const agentAzure = new Agent();
  agentAzure.start({
    disableSend: true,
    cloudProvider: 'azure',
  });
  agentAzure.destroy();
  t.equals(
    agentAzure._conf.cloudProvider,
    'azure',
    'cloudProvider can be set to azure',
  );

  const agentAws = new Agent();
  agentAws.start({
    disableSend: true,
    cloudProvider: 'aws',
  });
  agentAws.destroy();
  t.equals(
    agentAws._conf.cloudProvider,
    'aws',
    'cloudProvider can be set to aws',
  );

  const agentNone = new Agent();
  agentNone.start({
    disableSend: true,
    cloudProvider: 'none',
  });
  agentNone.destroy();
  t.equals(
    agentNone._conf.cloudProvider,
    'none',
    'cloudProvider can be set to none',
  );

  const agentUnknown = new Agent();
  agentUnknown.start({
    disableSend: true,
    logLevel: 'off', // Silence the log.warn for the invalid cloudProvider value.
    cloudProvider: 'this-is-not-a-thing',
  });
  agentUnknown.destroy();
  t.equals(
    agentUnknown._conf.cloudProvider,
    'auto',
    'unknown cloudProvider defaults to auto',
  );

  const agentGcpFromEnv = new Agent();
  process.env.ELASTIC_APM_CLOUD_PROVIDER = 'gcp';
  agentGcpFromEnv.start({
    disableSend: true,
  });
  t.equals(
    agentGcpFromEnv._conf.cloudProvider,
    'gcp',
    'cloudProvider can be set via env',
  );
  delete process.env.ELASTIC_APM_CLOUD_PROVIDER;
  agentGcpFromEnv.destroy();

  t.end();
});

test('should accept and normalize ignoreMessageQueues', function (suite) {
  suite.test('ignoreMessageQueues defaults', function (t) {
    const agent = new Agent();
    agent.start(agentOptsNoopTransport);
    t.equals(
      agent._conf.ignoreMessageQueues.length,
      0,
      'ignore message queue defaults empty',
    );

    t.equals(
      agent._conf.ignoreMessageQueuesRegExp.length,
      0,
      'ignore message queue regex defaults empty',
    );
    agent.destroy();
    t.end();
  });

  suite.test('ignoreMessageQueues via configuration', function (t) {
    const agent = new Agent();
    agent.start(
      Object.assign({}, agentOptsNoopTransport, {
        ignoreMessageQueues: ['f*o', 'bar'],
      }),
    );
    t.equals(
      agent._conf.ignoreMessageQueues.length,
      2,
      'ignore message picks up configured values',
    );

    t.equals(
      agent._conf.ignoreMessageQueuesRegExp.length,
      2,
      'ignore message queue regex picks up configured values',
    );

    t.ok(
      agent._conf.ignoreMessageQueuesRegExp[0].test('faooooo'),
      'wildcard converted to regular expression',
    );
    agent.destroy();
    t.end();
  });

  suite.test('ignoreMessageQueues via env', function (t) {
    const agent = new Agent();
    process.env.ELASTIC_APM_IGNORE_MESSAGE_QUEUES = 'f*o,bar,baz';
    agent.start(agentOptsNoopTransport);
    t.equals(
      agent._conf.ignoreMessageQueues.length,
      3,
      'ignore message queue picks up env values',
    );

    t.equals(
      agent._conf.ignoreMessageQueuesRegExp.length,
      3,
      'ignore message queue regex picks up env values',
    );

    t.ok(
      agent._conf.ignoreMessageQueuesRegExp[0].test('faooooo'),
      'wildcard converted to regular expression',
    );
    agent.destroy();
    t.end();
  });

  suite.end();
});

// `spanStackTraceMinDuration` is synthesized from itself and two deprecated
// config vars (`captureSpanStackTraces` and `spanFramesMinDuration`).
test('spanStackTraceMinDuration', (suite) => {
  const spanStackTraceMinDurationTestScenarios = [
    {
      name: 'spanStackTraceMinDuration defaults to -1',
      startOpts: {},
      env: {},
      expectedVal: -1,
    },
    {
      name: 'spanStackTraceMinDuration defaults to milliseconds',
      startOpts: {
        spanStackTraceMinDuration: 40,
      },
      env: {},
      expectedVal: 0.04,
    },
    {
      name: 'ELASTIC_APM_SPAN_STACK_TRACE_MIN_DURATION defaults to milliseconds',
      startOpts: {},
      env: {
        ELASTIC_APM_SPAN_STACK_TRACE_MIN_DURATION: '30',
      },
      expectedVal: 0.03,
    },
    {
      name: 'a given spanStackTraceMinDuration=0s wins',
      startOpts: {
        spanStackTraceMinDuration: '0s',
        captureSpanStackTraces: false,
        spanFramesMinDuration: '500ms',
      },
      env: {},
      expectedVal: 0,
    },
    {
      name: 'a given spanStackTraceMinDuration=0s wins over envvars',
      startOpts: {
        spanStackTraceMinDuration: '0s',
      },
      env: {
        ELASTIC_APM_CAPTURE_SPAN_STACK_TRACES: 'false',
        ELASTIC_APM_SPAN_FRAMES_MIN_DURATION: '500ms',
      },
      expectedVal: 0,
    },
    {
      name: 'a given spanStackTraceMinDuration=-1s wins',
      startOpts: {
        spanStackTraceMinDuration: '-1s',
        captureSpanStackTraces: true,
      },
      env: {},
      expectedVal: -1,
    },
    {
      name: 'a given spanStackTraceMinDuration=50ms wins',
      startOpts: {
        spanStackTraceMinDuration: '50ms',
        captureSpanStackTraces: false,
        spanFramesMinDuration: '300ms',
      },
      env: {},
      expectedVal: 0.05,
    },
    {
      name: 'captureSpanStackTraces=true alone results in spanStackTraceMinDuration=10ms',
      startOpts: {
        captureSpanStackTraces: true,
      },
      env: {},
      expectedVal: 0.01,
    },
    {
      name: 'captureSpanStackTraces=false results in spanStackTraceMinDuration=-1',
      startOpts: {
        captureSpanStackTraces: false,
        spanFramesMinDuration: '50ms', // this value is ignored
      },
      env: {},
      expectedVal: -1,
    },
    {
      name: 'ELASTIC_APM_CAPTURE_SPAN_STACK_TRACES=false results in spanStackTraceMinDuration=-1',
      startOpts: {},
      env: {
        ELASTIC_APM_CAPTURE_SPAN_STACK_TRACES: 'false',
      },
      expectedVal: -1,
    },
    {
      name: 'spanFramesMinDuration=0s results in spanStackTraceMinDuration=-1',
      startOpts: {
        spanFramesMinDuration: '0s',
      },
      env: {},
      expectedVal: -1,
    },
    {
      name: 'ELASTIC_APM_SPAN_FRAMES_MIN_DURATION=0s results in spanStackTraceMinDuration=-1',
      startOpts: {},
      env: {
        ELASTIC_APM_SPAN_FRAMES_MIN_DURATION: '0s',
      },
      expectedVal: -1,
    },
    {
      name: 'spanFramesMinDuration value takes if captureSpanStackTraces=true',
      startOpts: {
        spanFramesMinDuration: '55ms',
        captureSpanStackTraces: 'true',
      },
      env: {},
      expectedVal: 0.055,
    },
    {
      name: 'spanFramesMinDuration value takes if ELASTIC_APM_CAPTURE_SPAN_STACK_TRACES=true',
      startOpts: {
        spanFramesMinDuration: '56ms',
      },
      env: {
        ELASTIC_APM_CAPTURE_SPAN_STACK_TRACES: 'true',
      },
      expectedVal: 0.056,
    },
    {
      name: 'spanFramesMinDuration value takes if captureSpanStackTraces unspecified',
      startOpts: {
        spanFramesMinDuration: '57ms',
      },
      env: {},
      expectedVal: 0.057,
    },
    {
      name: 'spanFramesMinDuration<0 is translated',
      startOpts: {
        spanFramesMinDuration: '-3',
      },
      env: {},
      expectedVal: 0,
    },
    {
      name: 'spanFramesMinDuration==0 is translated',
      startOpts: {},
      env: {
        ELASTIC_APM_SPAN_FRAMES_MIN_DURATION: '0m',
      },
      expectedVal: -1,
    },
  ];

  spanStackTraceMinDurationTestScenarios.forEach((scenario) => {
    suite.test(scenario.name, (t) => {
      const preEnv = Object.assign({}, process.env);
      for (const [k, v] of Object.entries(scenario.env)) {
        process.env[k] = v;
      }
      const agent = new Agent();
      agent.start(
        Object.assign({}, agentOptsNoopTransport, scenario.startOpts),
      );

      t.notOk(
        agent._conf.captureSpanStackTraces,
        'captureSpanStackTraces is not set on agent._conf',
      );
      t.notOk(
        agent._conf.spanFramesMinDuration,
        'spanFramesMinDuration is not set on agent._conf',
      );
      t.strictEqual(
        agent._conf.spanStackTraceMinDuration,
        scenario.expectedVal,
        `spanStackTraceMinDuration=${scenario.expectedVal}`,
      );

      agent.destroy();
      for (const k of Object.keys(scenario.env)) {
        if (k in preEnv) {
          process.env[k] = preEnv[k];
        } else {
          delete process.env[k];
        }
      }
      t.end();
    });
  });

  suite.end();
});

test('contextManager', (suite) => {
  const contextManagerTestScenarios = [
    {
      name: 'contextManager defaults to empty',
      startOpts: {},
      env: {},
      expectedVal: undefined,
    },
    {
      name: 'contextManager=asynchooks is valid',
      startOpts: {
        contextManager: 'asynchooks',
      },
      env: {},
      expectedVal: 'asynchooks',
    },
    {
      name: 'contextManager=asynclocalstorage is valid',
      startOpts: {
        contextManager: 'asynclocalstorage',
      },
      env: {},
      expectedVal: 'asynclocalstorage',
    },
    {
      name: 'ELASTIC_APM_CONTEXT_MANAGER works',
      startOpts: {},
      env: {
        ELASTIC_APM_CONTEXT_MANAGER: 'asynchooks',
      },
      expectedVal: 'asynchooks',
    },
    {
      name: 'contextManager=bogus',
      startOpts: {
        contextManager: 'bogus',
      },
      env: {},
      expectedVal: undefined,
    },
  ];

  contextManagerTestScenarios.forEach((scenario) => {
    suite.test(scenario.name, (t) => {
      const preEnv = Object.assign({}, process.env);
      // Tests run in Jenkins CI sets `ELASTIC_APM_CONTEXT_MANAGER`, which
      // interferes with these tests.
      delete process.env.ELASTIC_APM_CONTEXT_MANAGER;
      for (const [k, v] of Object.entries(scenario.env)) {
        process.env[k] = v;
      }
      const agent = new Agent();
      agent.start(
        Object.assign({}, agentOptsNoopTransport, scenario.startOpts),
      );

      t.strictEqual(
        agent._conf.contextManager,
        scenario.expectedVal,
        `contextManager=${scenario.expectedVal}`,
      );

      agent.destroy();
      for (const k of Object.keys(process.env)) {
        if (!(k in preEnv)) {
          delete process.env[k];
        } else if (process.env[k] !== preEnv[k]) {
          process.env[k] = preEnv[k];
        }
      }
      t.end();
    });
  });

  suite.end();
});

test('env variable names start with "ELASTIC_APM_" prefix', (t) => {
  const names = Object.values(ENV_TABLE).flat();
  const exclusions = [
    // The KUBERNETES_ envvars are intentionally not prefixed per
    // https://github.com/elastic/apm/blob/main/specs/agents/metadata.md#containerkubernetes-metadata
    'KUBERNETES_NAMESPACE',
    'KUBERNETES_NODE_NAME',
    'KUBERNETES_POD_NAME',
    'KUBERNETES_POD_UID',
  ];
  for (const name of names) {
    if (exclusions.indexOf(name) !== -1) {
      continue;
    }
    t.ok(
      name.indexOf('ELASTIC_APM_') === 0,
      `${name} starts with ELASTIC_APM_`,
    );
  }
  t.end();
});
