'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var url_pattern_rex = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g;

var Context = function () {
  function Context(options) {
    _classCallCheck(this, Context);

    this.options = Object.assign({
      assets_directories: ['.'],
      hash_length: 8
    }, options || {});
  }

  _createClass(Context, [{
    key: 'build_url_replacer',
    value: function build_url_replacer() {
      var _this = this;

      return function (decl) {
        if (!url_pattern_rex.test(decl.value)) return;

        decl.value = decl.value.replace(url_pattern_rex, function (_, prefix, url, suffix) {
          var filebuf = _this.find_file(url);
          if (!filebuf) {
            console.error('file not found "' + url + '"');
            throw 'FileNotFound';
          }
          var digest = get_file_hash(filebuf).slice(0, _this.options.hash_length);

          // kuso code
          var newUrl = url,
              urlSuffix = '';

          if (newUrl.indexOf('#') != -1) {
            var t = newUrl.split('#', 2);
            newUrl = t[0];
            urlSuffix = '#' + t[1];
          }
          newUrl += (newUrl.indexOf('?') != -1 ? '&' : '?') + 'h=' + digest + urlSuffix;

          return '' + prefix + newUrl + suffix;
        });
      };
    }
  }, {
    key: 'find_file',
    value: function find_file(url) {
      var relpath = url.split('?', 2)[0];

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.options.assets_directories[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var dir = _step.value;

          var filepath = _path2.default.resolve(dir, relpath);

          try {
            return _fs2.default.readFileSync(filepath);
          } catch (e) {}
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);

  return Context;
}();

function get_file_hash(filebuf) {
  var hash = _crypto2.default.createHash('sha1');
  hash.update(filebuf);
  var digest = hash.digest('hex');
  return digest;
}

function get_root_from_cssnode(node) {
  while (node && node.type != 'root') {
    node = node.parent;
  }
  return node;
}

module.exports = _postcss2.default.plugin('postcss-asset-hash', function (options) {
  var context = new Context(options);

  return function (css) {
    css.walkDecls(context.build_url_replacer());
  };
});