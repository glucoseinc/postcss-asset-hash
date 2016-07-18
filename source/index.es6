import crypto from 'crypto';
import postcss from 'postcss';

let url_pattern_rex = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g

module.exports = postcss.plugin('postcss-asset-hash', function() {
  return function(css) {
    css.walkDecls(build_url_replacer());
  };
});


function build_url_replacer() {
  return (decl) => {
    if(!url_pattern_rex.test(decl.value))
      return

    decl.value.replace(url_pattern_rex, (_, prefix, url, suffix) => {
      console.log(url);
      return _;
    });
  };
}
