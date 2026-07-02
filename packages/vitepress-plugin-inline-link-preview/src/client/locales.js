"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "defaultEnLocale", {
  enumerable: true,
  get: function () {
    return _index.defaultEnLocale;
  }
});
exports.defaultLocales = void 0;
Object.defineProperty(exports, "defaultZhCNLocale", {
  enumerable: true,
  get: function () {
    return _index.defaultZhCNLocale;
  }
});
var _index = require("../locales/index");
const defaultLocales = exports.defaultLocales = {
  "zh-CN": _index.defaultZhCNLocale,
  "zh-Hans": _index.defaultZhCNLocale,
  "zh": _index.defaultZhCNLocale,
  "en-US": _index.defaultEnLocale,
  "en": _index.defaultEnLocale
};