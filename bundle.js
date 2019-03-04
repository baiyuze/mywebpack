
(function(modules) {
  function require(id) {
    const module = { exports : {} }
    modules[id](module, module.exports, require)
    return module.exports
  }

  require('./src/test2.js');
})({'./src/test2.js': function(module, exports, require) {"use strict";

var _test = require("./test1.js");

var _test2 = _interopRequireDefault(_test);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function test2() {
  (0, _test2.default)();
  console.log('我是测试2');
}

test2();},
'./test1.js': function(module, exports, require) {"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function test1() {
  console.log('我是测试1');
}

exports.default = test1;},
});
