/*
 * Copyright Elasticsearch B.V. and other contributors where applicable.
 * Licensed under the BSD 2-Clause License; you may not use this file except in
 * compliance with the BSD 2-Clause License.
 */

module.exports = {
  lambda: {
    foo: function myHandler(event, context) {
      return 'hi';
    },
  },
};