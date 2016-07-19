import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';


let url_pattern_rex = /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g


class Context {
  constructor(options) {
    this.options = Object.assign({
      assets_directories: ['.'],
      hash_length: 8
    }, options || {});
  }

  build_url_replacer() {
    return (decl) => {
      if(!url_pattern_rex.test(decl.value))
        return

      decl.value = decl.value.replace(url_pattern_rex, (_, prefix, url, suffix) => {
        let filebuf = this.find_file(url);
        if(!filebuf) {
          console.error(`file not found "${url}"`);
          throw 'FileNotFound';
        }
        let digest = get_file_hash(filebuf).slice(0, this.options.hash_length);

        // kuso code
        let newUrl = url, urlSuffix = '';

        if(newUrl.indexOf('#') != -1) {
          let t = newUrl.split('#', 2);
          newUrl = t[0];
          urlSuffix = '#' + t[1];
        }
        newUrl += `${newUrl.indexOf('?') != -1 ? '&' : '?'}h=${digest}${urlSuffix}`;

        return `${prefix}${newUrl}${suffix}`;
      });
    };
  }

  find_file(url) {
    let relpath = url.split('?', 2)[0];

    for(let dir of this.options.assets_directories) {
      let filepath = path.resolve(dir, relpath);

      try {
        return fs.readFileSync(filepath);
      } catch(e) {
      }
    }
  }
}

function get_file_hash(filebuf) {
  let hash = crypto.createHash('sha1');
  hash.update(filebuf);
  let digest = hash.digest('hex');
  return digest;
}


function get_root_from_cssnode(node) {
  while(node && node.type != 'root') {
    node = node.parent;
  }
  return node;
}


module.exports = postcss.plugin('postcss-asset-hash', function(options) {
  let context = new Context(options);

  return function(css) {
    css.walkDecls(context.build_url_replacer());
  };
});
