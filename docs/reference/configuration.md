---
mapped_pages:
  - https://www.elastic.co/guide/en/apm/agent/nodejs/current/configuration.html
---

# Configuration options [configuration]

The available configuration options and equivalent environment variable names are listed below.

For more information on setting configuration options, including configuration precedence, see [configuring the agent](/reference/configuring-agent.md).

::::{tip}
The only required parameter is [`serviceName`](#service-name). However, the agent will use the `name` from `package.json` by default if available.
::::


## `serviceName` [service-name]

* **Type:** String
* **Default:** `name` field of `package.json`, or "unknown-nodejs-service"
* **Env:** `ELASTIC_APM_SERVICE_NAME`

The name to identify this service in Elastic APM. Multiple instances of the same service should use the same name. Allowed characters: `a-z`, `A-Z`, `0-9`, `-`, `_`, and space.

If `serviceName` is not provided, the agent will attempt to use the "name" field from "package.json" — looking up from the current working directory. The name will be normalized to the allowed characters. If the name cannot be inferred from package.json, then a fallback value of "unknown-nodejs-service" is used.


## `serviceNodeName` [service-node-name]

* **Type:** String
* **Env:** `ELASTIC_APM_SERVICE_NODE_NAME`

A unique name for the service node. This is optional, and if omitted, the APM Server will fall back on `system.container.id` if available, and finally `host.name` if necessary.

This option allows you to set the node name manually to ensure uniqueness and meaningfulness.


## `secretToken` [secret-token]

* **Type:** String
* **Env:** `ELASTIC_APM_SECRET_TOKEN`

The secret token optionally expected by the APM Server.


## `apiKey` [api-key]

* **Type:** String
* **Env:** `ELASTIC_APM_API_KEY`

The API key optionally expected by the APM Server. This is an alternative to `secretToken`.

This base64-encoded string is used to ensure that only your agents can send data to your APM server. You must have created the API key using the APM server command line tool. Please see the [APM server documentation](docs-content://solutions/observability/apm/api-keys.md) for details on how to do that.

::::{note}
This feature is fully supported in the APM Server versions >= 7.6.
::::


::::{warning}
The API key is sent as plain-text in every request to the server, so you should secure your communications using HTTPS. Unless you do so, your API key could be observed by an attacker.
::::



## `serverUrl` [server-url]

* **Type:** String
* **Default:** `http://127.0.0.1:8200`
* **Env:** `ELASTIC_APM_SERVER_URL`

The URL to where the APM Server is deployed.


## `verifyServerCert` [validate-server-cert]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_VERIFY_SERVER_CERT`

By default the agent will validate the TLS/SSL certificate of the APM Server if using HTTPS. You can switch this behavior off by setting this option to `false`.


## `serverCaCertFile` [server-ca-cert-file]

* **Type:** String
* **Env:** `ELASTIC_APM_SERVER_CA_CERT_FILE`

By default the agent will validate the TLS/SSL certificate of the APM Server using the well-known CAs curated by Mozilla, as described in the Node.js docs for [`tls.createSecureContext()`](https://nodejs.org/api/tls.md#tls_tls_createsecurecontext_options). You can set this option to the path of a file containing a CA certificate that will be used instead.

Specifying this option is required when using self-signed certificates, unless server certificate validation is disabled.


## `serviceVersion` [service-version]

* **Type:** String
* **Default:** `version` field of `package.json`
* **Env:** `ELASTIC_APM_SERVICE_VERSION`

The version of the app currently running. This could be the version from your `package.json` file, a git commit reference, or any other string that might help you pinpoint a specific version or deployment.


## `active` [active]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_ACTIVE`

A boolean specifying if the agent should be active or not. If active, the agent will instrument incoming HTTP requests and track errors. Normally you would not want to run the agent in your development or testing environments. If you are using the `NODE_ENV` environment variable, you can use this to determine the state:

```js
var options = {
  active: process.env.NODE_ENV === 'production'
}
```


## `environment` [environment]

* **Type:** String
* **Default:** `process.env.NODE_ENV || 'development'`
* **Env:** `ELASTIC_APM_ENVIRONMENT`

The environment name is automatically logged along with all errors and transactions. If you want to overwrite this, use this option.

Environments allow you to easily filter data on a global level in the APM app. It’s important to be consistent when naming environments across agents. See [environment selector](docs-content://solutions/observability/apm/filter-data.md#apm-filter-your-data-service-environment-filter) in the APM app for more information.

::::{note}
This feature is fully supported in the APM app in Kibana versions >= 7.2. You must use the query bar to filter for a specific environment in versions prior to 7.2.
::::



## `contextPropagationOnly` [context-propagation-only]

* **Type:** Boolean
* **Default:** `false`
* **Env:** `ELASTIC_APM_CONTEXT_PROPAGATION_ONLY`

If set to `true`, the agent will reduce its work to the minimum required to support automatic [HTTP trace-context](https://w3c.github.io/trace-context/) propagation (for distributed tracing) and log correlation. The agent will not communicate with APM server (no tracing data is forwarded, no central configuration is retrieved) and will not collect metrics. This setting allows using the APM agent with a service that cannot use APM server. Usage is expected to be rare.


## `disableSend` [disable-send]

* **Type:** Boolean
* **Default:** `false`
* **Env:** `ELASTIC_APM_DISABLE_SEND`

If set to `true`, the agent will work as usual, except that it will not attempt to communicate with APM server. Tracing and metrics data will be dropped and the agent won’t be able to receive central configuration, which means that any other configuration cannot be changed in this state without restarting the service.

This setting is similar to [`contextPropagationOnly`](#context-propagation-only) in functionality. However, `disableSend` does not attempt to reduce time spent collecting tracing data. A use case for this setting is in CI environments, to test agent functionality without requiring a configured APM server.


## `instrument` [instrument]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_INSTRUMENT`

A boolean specifying if the agent should automatically apply instrumentation to supported modules when they are loaded.

Note that both `active` and `instrument` needs to be `true` for instrumentation to be running.


## `instrumentIncomingHTTPRequests` [instrument-incoming-http-requests]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_INSTRUMENT_INCOMING_HTTP_REQUESTS`

A boolean specifying if the agent should instrument incoming HTTP requests.

To configure if outgoing http requests should be instrumented, see [`disableInstrumentations`](#disable-instrumentations).


## `centralConfig` [central-config]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_CENTRAL_CONFIG`

Activate APM Agent Configuration via Kibana. If set to `true`, the client will poll the APM Server regularly for new agent configuration.

::::{note}
This feature requires APM Server v7.3 or later. More information is available in [APM Agent configuration](docs-content://solutions/observability/apm/apm-agent-central-configuration.md).
::::



## `contextManager` [context-manager]

Added in: v3.37.0<br> The "patch" context manager was removed in: v4.0.0

* **Type:** String
* **Env:** `ELASTIC_APM_CONTEXT_MANAGER`

This configuration option provides a way to override the APM agent’s default technique for tracking Node.js asynchronous tasks; sometimes referred to as "run context", "async context", or just "context". Most users should not need to change this setting. This setting replaces the older `asyncHooks` configuration option.

To effectively trace an application, the APM agent needs to track the logical thread of control through asynchronous tasks. The preferred mechanism for this is [`AsyncLocalStorage`](https://nodejs.org/api/async_context.md#class-asynclocalstorage), usable in Node.js versions >=14.5 and >=12.19. In older versions of Node, the APM agent will fallback to using [`async_hooks`](https://nodejs.org/api/async_hooks.md), which can have a higher performance overhead, especially in Promise-heavy applications.

Supported values for `contextManager` are:

* `"asynclocalstorage"` - Use the `AsyncLocalStorage` mechanism, if able. Otherwise it will fallback to using `async_hooks`.
* `"asynchooks"` - Use the `async_hooks` mechanism. (Using this value will restore the agent behavior from before v3.37.0.)


## `transactionIgnoreUrls` [transaction-ignore-urls]

* **Type:** Array
* **Default:** `[]`
* **Env:** `ELASTIC_APM_TRANSACTION_IGNORE_URLS`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `transaction_ignore_urls`

Array or comma-separated string used to restrict requests for certain URLs from being instrumented.

When an incoming HTTP request is detected, its URL pathname will be tested against each string in this list.  The `transactionIgnoreUrls` property supports exact string matches, simple wildcard (`*`) matches, and may not include commas.  Wildcard matches are case-insensitive by default. You may make wildcard searches case-sensitive by using the `(?-i)` prefix.

Note that all errors that are captured during a request to an ignored URL are still sent to the APM Server regardless of this setting.

If you need full regular expression pattern matching, see [`ignoreUrls`](#ignore-urls).

Example usage:

```js
require('elastic-apm-node').start({
  transactionIgnoreUrls: [
    '/ping',
    '/fetch/*',
    '(?-i)/caseSensitiveSearch'
  ]
})
```


## `ignoreUrls` [ignore-urls]

* **Type:** Array
* **Default:** `undefined`

Used to restrict requests to certain URLs from being instrumented.

This property should be set to an array containing one or more strings or `RegExp` objects. When an incoming HTTP request is detected, its URL will be tested against each element in this list. If an element in the array is a `String`, an exact match will be performed. If an element in the array is a `RegExp` object, its test function will be called with the URL being tested.

Note that all errors that are captured during a request to an ignored URL are still sent to the APM Server regardless of this setting.

If you’d prefer simple wildcard pattern matching, see [`transactionIgnoreUrls`](#transaction-ignore-urls).

Example usage:

```js
require('elastic-apm-node').start({
  ignoreUrls: [
    '/ping',
    /^\/admin\//i
  ]
})
```


## `ignoreUserAgents` [ignore-user-agents]

* **Type:** Array
* **Default:** `undefined`

Used to restrict requests from certain User-Agents from being instrumented.

This property should be set to an array containing one or more strings or `RegExp` objects. When an incoming HTTP request is detected, the User-Agent from the request headers will be tested against each element in this list. If an element in the array is a `String`, it’s matched against the beginning of the User-Agent. If an element in the array is a `RegExp` object, its test function will be called with the User-Agent string being tested.

Note that all errors that are captured during a request by an ignored user agent are still sent to the APM Server regardless of this setting.

Example usage:

```js
require('elastic-apm-node').start({
  ignoreUserAgents: [
    'curl/',
    /pingdom/i
  ]
})
```


## `captureBody` [capture-body]

* **Type:** String
* **Default:** `off`
* **Env:** `ELASTIC_APM_CAPTURE_BODY`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `capture_body`

The HTTP body of incoming HTTP requests is not recorded and sent to the APM Server by default.

Possible options are: `off`, `all`, `errors`, and `transactions`.

* `off` - request bodies will never be reported
* `errors` - request bodies will only be reported with errors
* `transactions` - request bodies will only be reported with request transactions
* `all` - request bodies will be reported with both errors and request transactions

The recorded body will be truncated if larger than 2 KiB.

If the body parsing middleware captures the body as raw `Buffer` data, the request body will be represented as the string `"<Buffer>"`.

For the agent to be able to access the body, the body needs to be available as a property on the incoming HTTP [`request`](https://nodejs.org/api/http.md#http_class_http_incomingmessage) object. The agent will look for the body on the following properties: `req.json || req.body || req.payload`


## `captureHeaders` [capture-headers]

* **Type:** Boolean
* **Default:** true
* **Env:** `ELASTIC_APM_CAPTURE_HEADERS`

The HTTP headers of incoming HTTP requests, and its resulting response headers, are recorded and sent to the APM Server by default. This can be disabled by setting this option to `false`.


## `errorOnAbortedRequests` [error-on-aborted-requests]

* **Type:** Boolean
* **Default:** `false`
* **Env:** `ELASTIC_APM_ERROR_ON_ABORTED_REQUESTS`

A boolean specifying if the agent should monitor for aborted TCP connections with un-ended HTTP requests. An error will be generated and sent to the APM Server if this happens.


## `abortedErrorThreshold` [aborted-error-threshold]

* **Type:** Number
* **Default:** `25s`
* **Env:** `ELASTIC_APM_ABORTED_ERROR_THRESHOLD`

Specify the threshold for when an aborted TCP connection with an un-ended HTTP request is considered an error. The value is expected to be in seconds, or should include a time suffix.

If the `errorOnAbortedRequests` property is `false`, this property is ignored.


## `transactionSampleRate` [transaction-sample-rate]

* **Type:** Number
* **Default:** `1.0`
* **Env:** `ELASTIC_APM_TRANSACTION_SAMPLE_RATE`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `transaction_sample_rate`

Specify the sampling rate to use when deciding whether to trace a request.

This must be a value between `0.0` and `1.0`, where `1.0` means 100% of requests are traced. The value is rounded to four decimal places of precision (e.g. 0.0001, 0.3333) to ensure consistency and reasonable size when propagating the sampling rate in the `tracestate` header for [distributed tracing](/reference/distributed-tracing.md).


## `hostname` [hostname]

* **Type:** String
* **Default:** OS hostname
* **Env:** `ELASTIC_APM_HOSTNAME`

The OS hostname is automatically logged along with all errors and transactions. If you want to overwrite this, use this option.


## `frameworkName` [framework-name]

* **Type:** String
* **Env:** `ELASTIC_APM_FRAMEWORK_NAME`

Set the name of the web framework used by the instrumented service/application. The name will be available as metadata for all errors and transactions sent to the APM Server. This can be useful for debugging and filtering.

By default, the agent will set the value of this config option if the framework can be detected automatically.


## `frameworkVersion` [framework-version]

* **Type:** String
* **Env:** `ELASTIC_APM_FRAMEWORK_VERSION`

Set the version of the web framework used by the instrumented service/application. The version will be available as metadata for all errors and transactions sent to the APM Server. This can be useful for debugging and filtering.

By default, the agent will set the value of this config option if the framework can be detected automatically.

Example of setting [`frameworkName`](#framework-name) and `frameworkVersion` for a framework named `my-custom-framework`:

```js
// read the version from the package.json file
var frameworkVersion = require('my-custom-framework/package').version

require('elastic-apm-node').start({
  frameworkName: 'my-custom-framework',
  frameworkVersion: frameworkVersion
})
```


## `logLevel` [log-level]

* **Type:** String
* **Default:** `'info'`
* **Env:** `ELASTIC_APM_LOG_LEVEL`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `log_level`

Set the verbosity level for the agent’s logging. Note that this does not have any influence on the types of errors that are sent to the APM Server. This only controls how chatty the agent is in your logs. Possible levels are: `trace` (the most verbose logging, avoid in production), `debug`, `info`, `warning`, `error`, `critical`, and `off` (disable all logging).

This config only applies when using the built-in logger. Log levels will not be automatically applied to a custom [`logger`](#logger).


## `logger` [logger]

* **Type:** object
* **Env:** `ELASTIC_APM_LOGGER=false` to *ignore* a custom logger

By default, the APM agent logs to stdout in [ecs-logging](ecs-logging://reference/intro.md) format. Use the `logger` config to pass in a custom logger object. The custom logger must provide `trace`, `debug`, `info`, `warn`, `error`, and `fatal` methods that take a string message argument.

A custom logger may result in *structured log data being lost*. As of version 3.13, the agent uses structured logging using the [pino API](https://getpino.io/#/docs/api?id=logger). To avoid issues with incompatible logger APIs, a given custom logger is wrapped in such a way that only the log message is passed through. As a special case, if the provided logger is a *pino logger instance*, then it will be used directly without loss of structured fields. Setting the environment variable `ELASTIC_APM_LOGGER=false` will **ignore** a custom logger. This is provided to assist with [Debug mode](docs-content://troubleshoot/observability/apm-agent-nodejs/apm-nodejs-agent.md#debug-mode) troubleshooting.

An example using a custom pino logger:

```js
const pino = require('pino')
require('elastic-apm-node').start({
  logger: pino({ level: 'info' })
})
```

or using a [Bunyan](https://github.com/trentm/node-bunyan) logger:

```js
const bunyan = require('bunyan')
require('elastic-apm-node').start({
  logger: bunyan.createLogger({ level: 'info' })
})
```

To get the [unstructured logging output](https://github.com/watson/console-log-level) similar to agent versions before 3.13, use the following:

```js
require('elastic-apm-node').start({
  logger: require('console-log-level')()
})
```


## `captureExceptions` [capture-exceptions]

As of v4.0.0 a captured exception will always be printed to stderr.

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_CAPTURE_EXCEPTIONS`

Whether or not the APM agent should monitor for uncaught exceptions ([`uncaughtException`](https://nodejs.org/api/process.md#event-uncaughtexception)) and send them to the APM Server automatically. This also includes unhandled rejections ([`unhandledRejection`](https://nodejs.org/api/process.md#event-unhandledrejection)), when the node process is started with `--unhandled-rejections=throw`, which is the default Node.js behavior since v15 ([reference](https://nodejs.org/api/cli.md#--unhandled-rejectionsmode)).

When `captureExceptions` is true and an `uncaughtException` event is emitted, the APM agent will: capture error details, send that error (and buffered APM data) to APM server, and `process.exit(1)` ([as `uncaughtException` handlers should](https://nodejs.org/api/process.md#warning-using-uncaughtexception-correctly)). Some things to be aware of:

* Because the APM agent’s handler will `process.exit(1)`, to use your own `uncaughtException` handler, you must pass your handler to [`apm.handleUncaughtExceptions([callback])`](/reference/agent-api.md#apm-handle-uncaught-exceptions). The APM agent will capture and send the error, and then call your handler. It is then up to your handler to `process.exit(1)`.
* The APM agent’s handler is async, so there is a short period while it is sending error details while the Node.js event loop will still be executing.
* When the exception and stack trace are printed to stderr, the exact format differs from [the Node.js core formatter](https://github.com/nodejs/node/blob/v20.5.0/src/node_errors.cc#L246-L266).
* Using Node.js’s [`process.setUncaughtExceptionCaptureCallback(fn)`](https://nodejs.org/api/process.md#processsetuncaughtexceptioncapturecallbackfn) results in `uncaughtException` not being called, so the APM agent’s capturing will not work.

Set `captureExceptions: false` to disable this, and get the default Node.js behavior for uncaught exceptions.


## `captureErrorLogStackTraces` [capture-error-log-stack-traces]

* **Type:** String
* **Default:** `messages`
* **Env:** `ELASTIC_APM_CAPTURE_ERROR_LOG_STACK_TRACES`

Normally only `Error` objects have a stack trace associated with them. This stack trace is stored along with the error message when the error is sent to the APM Server. The stack trace points to the place where the `Error` object was instantiated.

But sometimes it’s valuable to know, not where the `Error` was instantiated, but where it was detected. For instance, when an error happens deep within a database driver, the location where the error bubbles up to, is sometimes more useful for debugging, than where the error occurred.

Set this config option to `always` to — besides the error stack trace — also capture a stack trace at the location where [`captureError`](/reference/agent-api.md#apm-capture-error) was called.

By default, this config option has the value `messages`, which means that a stack trace of the capture location will be recorded only when `captureError` is called with either a [string](/reference/agent-api.md#message-strings) or the [special parameterized message object](/reference/agent-api.md#parameterized-message-object), in which case a normal stack trace isn’t available.

Set this config option to `never` to never record a capture location stack trace.

A capture location stack trace is never generated for uncaught exceptions.


## `spanStackTraceMinDuration` [span-stack-trace-min-duration]

Added in: v3.30.0, replaces [`captureSpanStackTraces`](#capture-span-stack-traces) and [`spanFramesMinDuration`](#span-frames-min-duration)

* **Type:** Duration
* **Default:** `'-1s'` (never capture span stack traces)
* **Env:** `ELASTIC_APM_SPAN_STACK_TRACE_MIN_DURATION`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `span_stack_trace_min_duration`

Use this option to control if stack traces are never captured for spans (the default), always captured for spans, or only captured for spans that are longer than a given duration. If you choose to enable span stack traces, even if only for slower spans, please read the [possible performance implications](/reference/performance-tuning.md#performance-stack-traces).

* a negative value, e.g. `'-1ms'` or `-1`, means *never* capture stack traces for spans;
* a zero value, e.g. `'0ms'` or `0`, means *always* capture stack traces for spans, regardless of the span’s duration; and
* any positive value, e.g. `'50ms'`, means to capture stack traces for spans longer than that duration.

The duration value should be a string of the form `'<integer><unit>'`. The allowed units are `ms` for milliseconds, `s` for seconds, and `m` for minutes and are case-sensitive. The *<unit>* is optional and defaults to *milliseconds*. A Number value of milliseconds may also be provided. For example, `'10ms'` and `10` are 10 milliseconds, `'2s'` is 2 seconds.

(Note: If you are migrating from the deprecated `spanFramesMinDuration` option, the meaning for negative and zero values has changed *and* the default unit has changed to milliseconds.)


## `captureSpanStackTraces` [capture-span-stack-traces]

Deprecated in: v3.30.0, use [`spanStackTraceMinDuration`](#span-stack-trace-min-duration)

* **Type:** Boolean
* **Env:** `ELASTIC_APM_CAPTURE_SPAN_STACK_TRACES`

This option is **deprecated** — use [`spanStackTraceMinDuration`](#span-stack-trace-min-duration) instead. In versions before v3.30.0 this option was `true` by default. As of version v3.30.0 this default has *effectively* changed to false, because the default is `spanStackTraceMinDuration: '-1s'`.

If `spanStackTraceMinDuration` is specified, then any provided value for this option is ignored. Otherwise,

* setting `captureSpanStackTraces: false` is equivalent to setting `spanStackTraceMinDuration: '-1s'` (stack traces will never be captured for spans), and
* setting `captureSpanStackTraces: true` will enable capture of stack traces for spans that are longer than [`spanFramesMinDuration`](#span-frames-min-duration), or 10ms if `spanFramesMinDuration` is not specified.


## `spanFramesMinDuration` [span-frames-min-duration]

Deprecated in: v3.30.0, use [`spanStackTraceMinDuration`](#span-stack-trace-min-duration)

* **Type:** Duration
* **Env:** `ELASTIC_APM_SPAN_FRAMES_MIN_DURATION`

This option is **deprecated** — use [`spanStackTraceMinDuration`](#span-stack-trace-min-duration) instead. Note that the sense of a *negative* value and a *zero* value has switched in the new option. Also note that the default unit has changed from `s` to `ms` in the new option.

If `spanStackTraceMinDuration` is specified, then any provided value for this option is ignored. Otherwise,

* a zero value, e.g. `0ms`, is equivalent to `spanStackTraceMinDuration: '-1s'` (never capture span stack traces);
* a negative value, e.g. `-1ms`, is equivalent to `spanStackTraceMinDuration: 0` (always capture span stack traces); and
* any positive value, e.g. `'50ms'`, is equivalent to setting `spanStackTraceMinDuration` to the same value.

The duration value should be a string of the form `'<integer><unit>'`. The allowed units are `ms` for milliseconds, `s` for seconds, and `m` for minutes and are case-sensitive. The *<unit>* is optional and defaults to seconds. A Number value of seconds may also be provided. For example, `'10ms'` is 10 milliseconds, `'5'` and `5` (number) are 5 seconds.


## `usePathAsTransactionName` [use-path-as-transaction-name]

* **Type:** Boolean
* **Default:** `false`
* **Env:** `ELASTIC_APM_USE_PATH_AS_TRANSACTION_NAME`

Set this option to `true` to use the URL path as the transaction name if no other route could be determined. If the agent do not support your router, you can set this option to `true` to use specific URL path as the transaction name instead of `GET unknown route`.


## `sourceLinesErrorAppFrames` + `sourceLinesErrorLibraryFrames` [source-context-error]

When an error is captured by the agent, its stack trace is stored in Elasticsearch.

By default, the agent will also collect a few lines of source code around the lines for each frame in the stack trace. This can make it easier to determine the cause of an error as the source code related to the error is visible directly in Kibana.

The agent differentiates between so-called in-app frames and library frames. Library frames are frames belonging to Node core and code inside the application’s `node_modules` folder. In-app frames are everything else.

Use the following two config options to change how many lines of source code to include for the different types of stack frames:

$$$source-context-error-app-frames$$$
**`sourceLinesErrorAppFrames`**

* **Type:** Number
* **Default:** `5`
* **Env:** `ELASTIC_APM_SOURCE_LINES_ERROR_APP_FRAMES`

The default value `5` means that 5 lines of source code will be collected for in-app error frames. 2 lines above the stack frame line + 2 below + the stack frame line itself.

Setting this config option to `0` means that no source code will be collected for in-app error frames.

$$$source-context-error-library-frames$$$
**`sourceLinesErrorLibraryFrames`**

* **Type:** Number
* **Default:** `5`
* **Env:** `ELASTIC_APM_SOURCE_LINES_ERROR_LIBRARY_FRAMES`

The default value `5` means that 5 lines of source code will be collected for error library frames. 2 lines above the stack frame line + 2 below + the stack frame line itself.

Setting this config option to `0` means that no source code will be collected for error library frames.


## `sourceLinesSpanAppFrames` + `sourceLinesSpanLibraryFrames` [source-context-span]

When a span is recorded by the agent, a stack trace is recorded together with the span, pointing to the location where the span was initiated. This stack trace is stored in Elasticsearch along with the other span data.

By default, the agent will also collect a few lines of source code around the lines for each frame in the stack trace. This can make it easier to determine why and how the span was initiated as the source code related to the span is visible directly in Kibana.

The agent differentiates between so-called in-app frames and library frames. Library frames are frames belonging to Node core and code inside the applications `node_modules` folder. In-app frames are everything else.

Use the following two config options to change how many lines of source code to include for the different types of stack frames:

$$$source-context-span-app-frames$$$
**`sourceLinesSpanAppFrames`**

* **Type:** Number
* **Default:** `0`
* **Env:** `ELASTIC_APM_SOURCE_LINES_SPAN_APP_FRAMES`

The default value `0` means that no source code will be collected for in-app span frames.

$$$source-context-span-library-frames$$$
**`sourceLinesSpanLibraryFrames`**

* **Type:** Number
* **Default:** `0`
* **Env:** `ELASTIC_APM_SOURCE_LINES_SPAN_LIBRARY_FRAMES`

The default value `0` means that no source code will be collected for span library frames.


## `errorMessageMaxLength` [error-message-max-length]

Deprecated in: v3.21.0, use [`longFieldMaxLength`](#long-field-max-length)

* **Type:** String
* **Default:** `longFieldMaxLength`'s value
* **Env:** `ELASTIC_APM_ERROR_MESSAGE_MAX_LENGTH`

This option is **deprecated** — use [`longFieldMaxLength`](#long-field-max-length) instead.

The maximum length allowed for error messages. It is expressed in bytes or includes a size suffix such as `2kb`. Size suffixes are case-insensitive and include `b`, `kb`, `mb`, and `gb`. Messages above this length will be truncated before being sent to the APM Server. Note that while the configuration option accepts a number of **bytes**, truncation is based on a number of unicode characters, not bytes.

Set to `-1` do disable truncation.

This applies to the following properties:

* `error.exception.message`
* `error.log.message`


## `longFieldMaxLength` [long-field-max-length]

* **Type:** Integer
* **Default:** 10000
* **Env:** `ELASTIC_APM_LONG_FIELD_MAX_LENGTH`

The following transaction, span, and error fields will be truncated at this number of unicode characters before being sent to APM server:

* `transaction.context.request.body`, `error.context.request.body`
* `transaction.context.message.body`, `span.context.message.body`, `error.context.message.body`
* `span.context.db.statement`
* `error.exception.message`, `error.log.message` - If [`errorMessageMaxLength`](#error-message-max-length) is specified, then that value takes precedence for these error message fields.

Note that tracing data is limited at the upstream APM server to [`max_event_size`](docs-content://solutions/observability/apm/general-configuration-options.md#apm-max_event_size), which defaults to 300kB. If you configure `longFieldMaxLength` too large, it could result in transactions, spans, or errors that are rejected by APM server.


## `stackTraceLimit` [stack-trace-limit]

* **Type:** Number
* **Default:** `50`
* **Env:** `ELASTIC_APM_STACK_TRACE_LIMIT`

Setting it to `0` will disable stack trace collection. Any finite integer value will be used as the maximum number of frames to collect. Setting it to `Infinity` means that all frames will be collected.


## `transactionMaxSpans` [transaction-max-spans]

* **Type:** Number
* **Default:** `500`
* **Env:** `ELASTIC_APM_TRANSACTION_MAX_SPANS`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `transaction_max_spans`

Specify the maximum number of spans to capture within a request transaction before dropping further spans. Setting to `-1` means that spans will never be dropped.


## `maxQueueSize` [max-queue-size]

* **Type:** Number
* **Default:** `1024`
* **Env:** `ELASTIC_APM_MAX_QUEUE_SIZE`

The maximum size of buffered events.

Events like transactions, spans, and errors are buffered when the agent can’t keep up with sending them to the APM Server or if the APM server is down. If the queue is full, events are rejected which means you will lose transactions and spans. This guards the application from consuming too much memory and possibly crashing in case the APM server is unavailable for a longer period of time.

A lower value will decrease the heap overhead of the agent, while a higher value makes it less likely to lose events in case of a temporary spike in throughput.


## `apiRequestTime` [api-request-time]

* **Type:** String
* **Default:** `10s`
* **Env:** `ELASTIC_APM_API_REQUEST_TIME`

The agent maintains an open HTTP request to the APM Server that is used to transmit the collected transactions, spans, and errors to the server.

To avoid issues with intermittent proxies and load balancers, the HTTP request is ended and a new one created at regular intervals controlled by this config option. The value is expected to be in seconds, or should include a time suffix.

::::{note}
The HTTP request is ended before the time threshold is reached if enough bytes are sent over it. Use the [`apiRequestSize`](#api-request-size) config option to control the byte threshold.

::::



## `apiRequestSize` [api-request-size]

* **Type:** String
* **Default:** `768kb`
* **Env:** `ELASTIC_APM_API_REQUEST_SIZE`

The agent maintains an open HTTP request to the APM Server that is used to transmit the collected transactions, spans, and errors to the server.

To avoid issues with intermittent proxies and load balancers, the HTTP request is ended and a new one created if its body becomes too large. That limit is controlled by this config option. The value is expected to be in bytes, or include a size suffix such as `1mb`. Size suffixes are case-insensitive and include `b`, `kb`, `mb`, and `gb`.

::::{note}
The HTTP request is otherwise ended at regular intervals controlled by the [`apiRequestTime`](#api-request-time) config option.

::::



## `serverTimeout` [server-timeout]

* **Type:** String
* **Default:** `30s`
* **Env:** `ELASTIC_APM_SERVER_TIMEOUT`

Specify a timeout on the socket used for communication between the APM agent and APM Server. If no data is sent or received on the socket for this amount of time, the request will be aborted. It’s not recommended to set a `serverTimeout` lower than the [`apiRequestTime`](#api-request-time) config option. That will likely result in healthy requests being aborted prematurely.

The value should include a time suffix (*m* for minutes, *s* for seconds, or *ms* for milliseconds), but defaults to seconds if no suffix is given.


## `apmClientHeaders` [apm-client-headers]

Added in: v4.3.0

* **Type:** Object
* **Env:** `ELASTIC_APM_APM_CLIENT_HEADERS`

Specify custom headers to be included in HTTP requests by the APM agent to APM Server. Generally this should not be required for normal usage.

Examples:

```bash
ELASTIC_APM_APM_CLIENT_HEADERS="foo=bar,spam=eggs"
```

```js
require('elastic-apm-node').start({
  apmClientHeaders: { foo: 'bar', spam: 'eggs' },
  // ...
})
```


## `sanitizeFieldNames` [sanitize-field-names]

* **Type:** Array
* **Default:** `['password', 'passwd', 'pwd', 'secret', '*key', '*token*', '*session*', '*credit*', '*card*', '*auth*', 'set-cookie', '*principal*', 'pw', 'pass', 'connect.sid']`
* **Env:** `ELASTIC_APM_SANITIZE_FIELD_NAMES`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `sanitize_field_names`

Remove sensitive data sent to Elastic APM.

The `sanitizeFieldNames` configuration value allows you to configure a list of wildcard patterns of field names which should be redacted from agent payloads. Wildcard matches are case-insensitive by default. You may make wildcard searches case-sensitive by using the `(?-i)` prefix. These patterns apply to the request and response HTTP headers, HTTP request cookies, and also any form field captured during an `application/x-www-form-urlencoded` data request.

The `sanitizeFieldNames` will redact any matched *field names*.  If you wish to filter or *redact* other data the [API filtering functions](/reference/agent-api.md#apm-add-filter) may be a better choice.


## `disableInstrumentations` [disable-instrumentations]

* **Type:** Array of strings
* **Env:** `ELASTIC_APM_DISABLE_INSTRUMENTATIONS`

Array or comma-separated string of module names for which to disable instrumentation. When instrumentation is disabled for a module, no spans will be collected for that module.

Example using options object:

```js
require('elastic-apm-node').start({
  disableInstrumentations: ['graphql', 'redis']
})
```

Example using environment variable:

```bash
ELASTIC_APM_DISABLE_INSTRUMENTATIONS=graphql,redis
```

For an always up-to-date list of modules for which instrumentation can be disabled, see the [lib/instrumentation/modules](https://github.com/elastic/apm-agent-nodejs/tree/main/lib/instrumentation/modules) folder in the agent repository. Note that not all modules represented in this directory will generate spans, and adding those to this array has no effect.

To configure if incoming http requests should be instrumented, see [`instrumentIncomingHTTPRequests`](#instrument-incoming-http-requests).


## `containerId` [container-id]

* **Type:** String
* **Env:** `ELASTIC_APM_CONTAINER_ID`

Specify the docker container id to associate with all reported events. If absent, it will be parsed out of the `/proc/self/cgroup` file.


## `kubernetesNodeName` [kubernetes-node-name]

* **Type:** String
* **Env:** `KUBERNETES_NODE_NAME`

Specify the kubernetes node name to associate with all reported events.


## `kubernetesNamespace` [kubernetes-namespace]

* **Type:** String
* **Env:** `KUBERNETES_NAMESPACE`

Specify the kubernetes namespace to associate with all reported events.


## `kubernetesPodName` [kubernetes-pod-name]

* **Type:** String
* **Env:** `KUBERNETES_POD_NAME`

Specify the kubernetes pod name to associate with all reported events. If absent, and if `kubernetesPodUID` is parsed out of the `/proc/self/cgroup` file, this will default to the local hostname.


## `kubernetesPodUID` [kubernetes-pod-uid]

* **Type:** String
* **Env:** `KUBERNETES_POD_UID`

Specify the kubernetes pod uid to associate with all reported events. If absent, it will be parsed out of the `/proc/self/cgroup` file.


## `metricsInterval` [metrics-interval]

* **Type:** String
* **Default:** `"30s"`
* **Env:** `ELASTIC_APM_METRICS_INTERVAL`

Specify the interval for reporting metrics to APM Server. The interval should be in seconds, or should include a time suffix.

To disable all metrics reporting, including breakdown metrics, set the interval to `"0s"`.


## `metricsLimit` [metrics-limit]

* **Type:** Number
* **Default:** `1000`
* **Env:** `ELASTIC_APM_METRICS_LIMIT`

Specify the maximum number of metrics to track at any given time. When a new metric is inserted which would exceed the limit, the oldest metric will be dropped to give it space.


## `globalLabels` [global-labels]

* **Type:** Object
* **Env:** `ELASTIC_APM_GLOBAL_LABELS`

Supply a key/value pair object of labels to apply to any data recorded by the agent.

Example:

```bash
ELASTIC_APM_GLOBAL_LABELS="subspace=sap-hana,rack=number6"
```


## `configFile` [config-file]

* **Type:** String
* **Default:** `elastic-apm-node.js`
* **Env:** `ELASTIC_APM_CONFIG_FILE`

The Node.js agent will look for a file named `elastic-apm-node.js` in the current working directory. You can specify a custom path using this config option (this path must include the filename), e.g:

```bash
ELASTIC_APM_CONFIG_FILE=/path/to/my-elastic-apm-node.js
```

::::{note}
The inline version of this config option, that is passed to the [`start`](/reference/agent-api.md#apm-start) function, will be ignored if a config file was already loaded when this module was required (based on either the default value or because of the `ELASTIC_APM_CONFIG_FILE` environment variable).
::::


The configuration file is expected to export an object, following the same conventions as the `options` object, given as the first argument to the [`start`](/reference/agent-api.md#apm-start) function, e.g.:

```js
module.exports = {
  // Override service name from package.json
  // Allowed characters: a-z, A-Z, 0-9, -, _, and space
  serviceName: '',

  // Use if APM Server requires a token
  secretToken: '',

  // Set custom APM Server URL (default: http://127.0.0.1:8200)
  serverUrl: ''
}
```


## `breakdownMetrics` [breakdown-metrics]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_BREAKDOWN_METRICS`

Set `breakdownMetrics: false` to disable reporting of breakdown metrics. Note that if `metricsInterval: 0`, then breakdown metrics will not be reported.

Breakdown metrics ([`span.self_time.*`](/reference/metrics.md#metrics-span.self_time.sum)) record the self-time spent in each unique type of span. This data drives the [Time spent by span type](docs-content://solutions/observability/apm/service-overview.md#service-span-duration) chart in the APM app.


## `disableMetrics` [disable-metrics]

Added in: v3.45.0

* **Type:** Array
* **Env:** `ELASTIC_APM_DISABLE_METRICS`

The `disableMetrics` configuration variable is a list of wildcard patterns of metric names to **not** send to APM server. The filter is applied to [core APM agent metrics](/reference/metrics.md), custom metrics defined by [`apm.registerMetric(name[, labels], callback)`](/reference/agent-api.md#apm-register-custom-metrics), and metrics defined [using the OpenTelemetry Metrics API](/reference/opentelemetry-bridge.md#otel-metrics-api).

For example, setting the `ELASTIC_APM_DISABLE_METRICS="nodejs.*,my_counter"` environment variable (or the equivalent `disableMetrics: ['nodejs.*', 'my_counter']` option to [`apm.start([options])`](/reference/agent-api.md#apm-start)) will result in reported metrics excluding any metric named `my_counter` and any starting with `nodejs.`.  Wildcard matches are case-insensitive by default. You may make wildcard searches case-sensitive by using the `(?-i)` prefix.

Use `metricsInterval: '0s'` to completely disable metrics collection. See [`metricsInterval`](#metrics-interval).


## `customMetricsHistogramBoundaries` [custom-metrics-histogram-boundaries]

Added in: v3.45.0 as experimental

* **Type:** number[]
* **Default:** (See below.)
* **Env:** `ELASTIC_APM_CUSTOM_METRICS_HISTOGRAM_BOUNDARIES`

Defines the default bucket boundaries to use for OpenTelemetry Metrics histograms. By default the value is:

```js
[
  0.00390625, 0.00552427, 0.0078125, 0.0110485,
    0.015625,  0.0220971,   0.03125, 0.0441942,
      0.0625,  0.0883883,     0.125,  0.176777,
        0.25,   0.353553,       0.5,  0.707107,
           1,    1.41421,         2,   2.82843,
           4,    5.65685,         8,   11.3137,
          16,    22.6274,        32,   45.2548,
          64,    90.5097,       128,   181.019,
         256,    362.039,       512,   724.077,
        1024,    1448.15,      2048,   2896.31,
        4096,    5792.62,      8192,   11585.2,
       16384,    23170.5,     32768,     46341,
       65536,    92681.9,    131072
]
```

This differs from the [OpenTelemetry default histogram boundaries](https://opentelemetry.io/docs/reference/specification/metrics/sdk/#explicit-bucket-histogram-aggregation). To use the OpenTelemetry default boundaries, configure the APM agent with:

```js
apm.start({
  customMetricsHistogramBoundaries: [ 0, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000 ],
  // ...
})
```

or

```bash
export ELASTIC_APM_CUSTOM_METRICS_HISTOGRAM_BOUNDARIES=0,5,10,25,50,75,100,250,500,750,1000,2500,5000,7500,10000
```

To customize the boundaries for specific histogram metrics, use an OpenTelemetry Metrics SDK [`View`](https://opentelemetry.io/docs/reference/specification/metrics/sdk/#view). See [this script](https://github.com/elastic/apm-agent-nodejs/blob/main/examples/opentelemetry-metrics/use-otel-metrics-sdk.js) for an example.

See [*OpenTelemetry bridge*](/reference/opentelemetry-bridge.md) for a general guide on using OpenTelemetry with this APM agent.


## `cloudProvider` [cloud-provider]

* **Type:** String
* **Default:** `auto`
* **Env:** `ELASTIC_APM_CLOUD_PROVIDER`

During startup the Node.js agent queries the local environment to determine whether the application is running in a cloud environment, and provides the agent with details about that environment.  These details are called metadata, and will be sent to APM Server with other instrumented data. The `cloudProvider` configuration value allows you to control this behavior.

* `auto`: Automatically determine which cloud provider the agent is running on.
* `gcp`: Only query for Google Cloud Platform information.
* `aws`: Only query for Amazon Web Service information.
* `azure`: Only query for Azure information.
* `none`: Do not query for any cloud provider information.

If the value is not one of the five listed above, the agent will use the value of `auto`.


## `ignoreMessageQueues` [ignore-message-queues]

* **Type:** Array
* **Default:** `[]`
* **Env:** `ELASTIC_APM_IGNORE_MESSAGE_QUEUES`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `ignore_message_queues`

Array or comma-separated string of wildcard patterns that tell the agent to ignore certain queues/topics when instrumenting messaging systems.

When an instrumented messaging system sends or receives a message, the agent will test the queue/topic name against each wildcard in this list. If the name matches, the agent will skip instrumenting the operation.

The `ignoreMessageQueues` property supports simple wildcard (`*`) patterns, and may not include commas.  Wildcard matches are case-insensitive by default. You may make wildcard searches case-sensitive by using the `(?-i)` prefix.

Example usage:

```js
require('elastic-apm-node').start({
  ignoreMessageQueues: [
    'overnight_jobs',
    'events_*',
    '(?-i)caseSensitiveSearch'
  ]
})
```


## `traceContinuationStrategy` [trace-continuation-strategy]

Added in: v3.34.0

* **Type:** String
* **Default:** `'continue'`
* **Env:** `ELASTIC_APM_TRACE_CONTINUATION_STRATEGY`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `trace_continuation_strategy`

This option allows some control on how the APM agent handles W3C trace-context headers on incoming requests. By default, the `traceparent` and `tracestate` headers are used per W3C spec for distributed tracing. However, in certain cases it can be helpful to **not** use the incoming `traceparent` header. Some example use cases:

* An Elastic-monitored service is receiving requests with `traceparent` headers from **unmonitored** services.
* An Elastic-monitored service is publicly exposed, and does not want tracing data (trace-ids, sampling decisions) to possibly be spoofed by user requests.

Valid values are:

* `'continue'` - The default behavior. An incoming `traceparent` value is used to continue the trace and determine the sampling decision.
* `'restart'` - Always ignores the `traceparent` header of incoming requests. A new trace-id will be generated and the sampling decision will be made based on [`transactionSampleRate`](#transaction-sample-rate). A **span link** will be made to the incoming traceparent.
* `'restart_external'` - If an incoming request includes the `es` vendor flag in `tracestate`, then any *traceparent* will be considered internal and will be handled as described for *continue* above. Otherwise, any *traceparent* is considered external and will be handled as described for *restart* above.

Starting with Elastic Observability 8.2, span links will be visible in trace views.


## `spanCompressionEnabled` [span-compression-enabled]

* **Type:** Boolean
* **Default:** `true`
* **Env:** `ELASTIC_APM_SPAN_COMPRESSION_ENABLED`

Setting this option to false will disable the [Span compression](docs-content://solutions/observability/apm/spans.md) feature. Span compression reduces the collection, processing, and storage overhead, and removes clutter from the UI. The tradeoff is that some information, such as DB statements of all the compressed spans, will not be collected.

Example usage:

```js
require('elastic-apm-node').start({
  spanCompressionEnabled: true
})
```


## `spanCompressionExactMatchMaxDuration` [span-compression-exact-match-max-duration]

* **Type:** String
* **Default:** `50ms`
* **Env:** `ELASTIC_APM_SPAN_COMPRESSION_EXACT_MATCH_MAX_DURATION`

Consecutive spans that are exact match and that are under this threshold will be compressed into a single composite span. This option does not apply to composite spans. This reduces the collection, processing, and storage overhead, and removes clutter from the UI. The tradeoff is that the DB statements of all the compressed spans will not be collected.

Supports the duration suffixes ms (milliseconds), s (seconds) and m (minutes).

Example usage:

```js
require('elastic-apm-node').start({
  spanCompressionExactMatchMaxDuration:'100ms'
})
```


## `spanCompressionSameKindMaxDuration` [span-compression-same-kind-max-duration]

* **Type:** String
* **Default:** `0ms`
* **Env:** `ELASTIC_APM_SPAN_COMPRESSION_SAME_KIND_MAX_DURATION`

Consecutive spans to the same destination that are under this threshold will be compressed into a single composite span. This option does not apply to composite spans. This reduces the collection, processing, and storage overhead, and removes clutter from the UI. The tradeoff is that the DB statements of all the compressed spans will not be collected.

Example usage:

```js
require('elastic-apm-node').start({
  spanCompressionSameKindMaxDuration:'0ms'
})
```


## `opentelemetryBridgeEnabled` [opentelemetry-bridge-enabled]

Added in: v3.34.0 as experimental

* **Type:** Boolean
* **Default:** `false`
* **Env:** `ELASTIC_APM_OPENTELEMETRY_BRIDGE_ENABLED`

Setting this option to true will enable the [OpenTelemetry Bridge](/reference/opentelemetry-bridge.md). Briefly, the OpenTelemetry Bridge allows one to use the vendor-neutral [OpenTelemetry Tracing API](https://opentelemetry.io/docs/instrumentation/js/api/) ([`@opentelemetry/api`](https://www.npmjs.com/package/@opentelemetry/api)) to manually instrument your code, and have the Elastic Node.js APM agent handle those API calls.

Example usage:

```js
require('elastic-apm-node').start({
  opentelemetryBridgeEnabled: true
})
```


## `exitSpanMinDuration` [exit-span-min-duration]

* **Type:** String
* **Default:** `0ms`
* **Env:** `ELASTIC_APM_EXIT_SPAN_MIN_DURATION`
* [![dynamic config](images/dynamic-config.svg "") ](/reference/configuring-agent.md#dynamic-configuration) **Central config name:** `exit_span_min_duration`

Sets the minimum duration of exit spans. If an exit span’s duration is less than this threshold the agent will attempt to drop the span and not send it.

In some cases exit spans will not be discarded. Spans that propagate the trace context to downstream services, such as outgoing HTTP requests, will not be discarded. However, external calls that don’t propagate context, such as calls to a database, can be discarded using this threshold.

Additionally, spans that lead to an error will not be discarded.

Example usage:

```js
require('elastic-apm-node').start({
  exitSpanMinDuration: '10ms'
})
```


## `elasticsearchCaptureBodyUrls` [elasticsearch-capture-body-urls]

* **Type:** Array of wildcard patterns
* **Default:** `['*/_search', '*/_search/template', '*/_msearch', '*/_msearch/template', '*/_async_search', '*/_count', '*/_sql', '*/_eql/search' ]`
* **Env:** `ELASTIC_APM_ELASTICSEARCH_CAPTURE_BODY_URLS`

The URL path patterns for which the APM agent will capture the request body of outgoing requests to Elasticsearch made with the `@elastic/elasticsearch` module (or the legacy `elasticsearch` module). The default setting captures the body for [Elasticsearch REST APIs](elasticsearch://reference/elasticsearch/rest-apis/index.md) making a search.

The captured request body (if any) is stored on the `span.db.statement` field. Captured request bodies are truncated to a maximum length defined by [`longFieldMaxLength`](#long-field-max-length).


## `useElasticTraceparentHeader` [use-elastic-traceparent-header]

Change default in v4.0.0, in v3.x the default was `true`

* **Type:** Boolean
* **Default:** `false`
* **Env:** `ELASTIC_APM_USE_ELASTIC_TRACEPARENT_HEADER`

To enable [distributed tracing](docs-content://solutions/observability/apm/traces.md), the agent adds trace context headers to outgoing requests (like HTTP requests, etc.). These headers (`traceparent` and `tracestate`) are defined in the [W3C Trace Context](https://www.w3.org/TR/trace-context-1/) specification.

When this setting is `true`, the agent will also add the header `elastic-apm-traceparent` for backwards compatibility with older versions of Elastic APM agents. (In the next major version of this APM agent, this setting will default to false.)
