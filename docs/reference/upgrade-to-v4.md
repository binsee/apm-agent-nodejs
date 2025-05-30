---
mapped_pages:
  - https://www.elastic.co/guide/en/apm/agent/nodejs/current/upgrade-to-v4.html
---

# Upgrade to v4.x [upgrade-to-v4]

The following is a guide on upgrading your usage of the Elastic APM Node.js agent (`elastic-apm-node`) from version 3.x to version 4.x.

## Node.js versions [v4-nodejs]

Version 4.x of `elastic-apm-node` supports Node.js v14.17.0 and later. (The previous 3.x major supported back to Node.js v8.6.0.)


## Config options [v4-config-options]

### `ELASTIC_APM_KUBERNETES_*` [_elastic_apm_kubernetes]

Support for the following Kubernetes environment variables have been removed: `ELASTIC_APM_KUBERNETES_NAMESPACE`, `ELASTIC_APM_KUBERNETES_NODE_NAME`, `ELASTIC_APM_KUBERNETES_POD_NAME`, and `ELASTIC_APM_KUBERNETES_POD_UID`. The correct environment variables for these config vars are *without* the `ELASTIC_APM_` prefix — for example [`KUBERNETES_POD_NAME`](/reference/configuration.md#kubernetes-pod-name) — and has been documented that way since v2.11.0.

**How to check.** Search for any usage of `ELASTIC_APM_KUBERNETES_` in your project. For example, using [ripgrep](https://github.com/BurntSushi/ripgrep), run `rg ELASTIC_APM_KUBERNETES_`. If there are any hits, remove the `ELASTIC_APM_` prefix.


### `filterHttpHeaders` [_filterhttpheaders]

Support for `filterHttpHeaders` config option has been removed. Redaction of HTTP headers and also request cookies is controlled by the existing config option [`sanitizeFieldNames`](/reference/configuration.md#sanitize-field-names).

**How to check.** Search your project for `rg filterHttpHeaders` or `rg ELASTIC_APM_FILTER_HTTP_HEADERS` and remove them.


### `useElasticTraceparentHeader` [_useelastictraceparentheader]

The default value of the [`useElasticTraceparentHeader`](/reference/configuration.md#use-elastic-traceparent-header) config option has changed to `false`. This means that the vendor-specific `elastic-apm-traceparent` header will no longer be added to outgoing HTTP requests by default. The `traceparent` header (from the [W3C trace-context standard](https://w3c.github.io/trace-context/)) is added by the APM agent. If you need the agent to continue sending `elastic-apm-traceparent` HTTP header you can set it to `true` via env var or start options.

**How to check.** Search your project for `rg useElasticTraceparentHeader` or `rg ELASTIC_APM_USE_ELASTIC_TRACEPARENT_HEADER`.


### `contextManager: "patch"` [_contextmanager_patch]

The "patch" value for the [`contextManager`](/reference/configuration.md#context-manager) config option has been removed. This was a limited async context management that predated the preferred `AsyncLocalStorage` core Node.js mechanism for context tracking. As well, the related and deprecated `asyncHooks` config option has been removed. Both were deprecated in v3.37.0.

**How to check.** Search your project for `rg -w contextManager` or `rg -w ELASTIC_APM_CONTEXT_MANAGER` which set the value to "patch". Also search for `rg -w asyncHooks` or `rg -w ELASTIC_APM_ASYNC_HOOKS` which set the value to `false`. If so, that config setting is no longer supported.


### `logUncaughtExceptions` [_loguncaughtexceptions]

The `logUncaughtExceptions` config option has been removed. In v3 and earlier, when the APM agent was [capturing an uncaught exception](/reference/configuration.md#capture-exceptions) setting `logUncaughtExceptions: true` would tell the agent to print the error details to stderr before exiting; but `logUncaughtExceptions` was `false` by default. In v4, printing the error to stderr is done by default (to mimic the default Node.js uncaught exception behavior) and there is no option to disable that.

**How to check.** Search your project for `rg -w logUncaughtExceptions` or `rg -w ELASTIC_APM_LOG_UNCAUGHT_EXCEPTIONS` and remove any usages.


### `ELASTIC_SANITIZE_FIELD_NAMES`, `ELASTIC_IGNORE_MESSAGE_QUEUES` [_elastic_sanitize_field_names_elastic_ignore_message_queues]

Support for the erroneous `ELASTIC_SANITIZE_FIELD_NAMES` and `ELASTIC_IGNORE_MESSAGE_QUEUES` config environment variables has been removed. The correct env vars are `ELASTIC_APM_SANITIZE_FIELD_NAMES` and `ELASTIC_APM_IGNORE_MESSAGE_QUEUES`, respectively, and were supported starting in v3.36.0.



## API changes [v4-api-changes]

### `apm.startTransaction(...)` [v4-api-start-transaction]

The `apm.startTransaction()` method has been changed to return a do-nothing no-op Transaction, if the agent is not yet started. The return type has changed to no longer include `| null`. The intent of these changes is to allow the user to use `.startTransaction()` without having to worry if the agent is yet started, nor to have to handle a possible `null` return value.

**How to check.** Search your project for `rg '\.startTransaction\b'`. If your code handled a possible `null` return value from this function call, you can remove that handling.


### `transaction.subtype` and `transaction.action` [v4-api-transaction-subtype-action]

The `subtype` and `action` properties have been removed from `Transaction`. This also impacts [`apm.startTransaction([name][, type][, options])`](/reference/agent-api.md#apm-start-transaction) and `transaction.setType(...)`, both of which now no longer accept `subtype` and `action` parameters. These two properties were deprecated in v3.25.0.

**How to check.** Search your project for `rg '\.startTransaction\b'`. If your code passed in `subtype` or `action` arguments, e.g. `apm.startTransaction('a-name', 'a-type', 'a-subtype', 'an-action', { /* options */ })`, then those need to be updated.  Also search your project for `rg '\.subtype\b'` and `rg '\.action\b'`. If those property accesses are on an APM Transaction object, then you should remove them. (Note that `subtype` and `action` on APM **Span** objects remain in the API.)


### `span.toString()`, `transaction.toString()` [v4-api-to-string]

The `span.toString()` and `transaction.toString()` methods have been removed as documented APIs. They were never in the "index.d.ts" types and were deprecated in v3.23.0.

Since v2.17.0 they would return a string of the form `trace.id=<hex id the trace> span.id=<hex id of the span>`, with the intent that this could be used in text-only loggers for log correlation. Using `.toString()` for this was deprecated in v3.23.0, and has now been removed in v4. In v4 the output of `.toString()` is not defined.

Instead, prefer the use of [`span.ids`](/reference/span-api.md#span-ids), [`transaction.ids`](/reference/transaction-api.md#transaction-ids), or [`apm.currentTraceIds`](/reference/agent-api.md#apm-current-trace-ids). The v3 format may be reproduced via:

```js
const {stringify} = require('querystring');
console.log(stringify(span.ids, ' ', '='));
```

For log correlation with *structured* logs, see [Log correlation](/reference/logs.md#log-correlation-ids).


### `apm.destroy()` [v4-api-destroy]

The `apm.destroy()` method is now async. Almost no users should need to use this method. However, if used, to be sure to wait for APM agent shutdown to be complete, one can now `await apm.destroy()`.



## Log warnings [v4-warnings]

This section documents some new log output warnings from the APM agent, and how to avoid them.

### "units missing in duration value" [v4-warning-duration-units]

```json
{"log.level":"warn","@timestamp":"2023-08-04T16:54:03.116Z","log":{"logger":"elastic-apm-node"},"ecs":{"version":"1.6.0"},"message":"units missing in duration value \"5\" for \"metricsInterval\" config option: using default units \"s\""}
```

Configuration options that define a duration, like `metricsInterval` or `exitSpanMinDuration`, expect to have their units specified in the value (e.g. `"10s"`, `"100ms"`). While current duration options have a default unit, to avoid ambiguity the APM agent will now warn if the units are not provided.


### "units missing in size value" [v4-warning-size-units]

Byte size config options like `apiRequestSize` expect to have the size units specified in the value (e.g. `"10kb"`, `"1gb"`). If the unit is not in the value, the agent will warn about it and fallback to bytes (`b`).
