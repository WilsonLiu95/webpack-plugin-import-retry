const webpack = require("webpack");
class AssetReload {
  constructor({ fmtRequireUrlFuncStr, cdnDomain } = {}) {
    this.options = {
      fmtRequireUrlFuncStr: `function (htmlNode, chunkId, __webpack_require__, options){
            var modifyReloadQry = function(url, reloadTimes){
                if(/reloadAssets=(\d+)&?/.test(url)){
                    return url.replace('reloadAssets='+reloadTimes, 'reloadAssets='+(1+reloadTimes));
                }
                return url + (url.indexOf('?')!=-1 ? '&':'?') + 'reloadAssets='+(reloadTimes+1);
            }
            options = options || {
                LINK: 0,
                SCRIPT: 0
            };
            var nodeName = htmlNode.nodeName;
            var reloadTimes = options[nodeName] || 0;
            var linkKey = 'src';
            if(nodeName =='LINK'){
                linkKey = 'href';
            }
            if(!htmlNode[linkKey]) return;
            if(reloadTimes == 0 || reloadTimes > 2) return;
            var replaceUrl = modifyReloadQry(htmlNode[linkKey], reloadTimes-1);
            ${
              cdnDomain
                ? "if(reloadTimes == 2){replaceUrl = replaceUrl.replace('" +
                  cdnDomain +
                  "', location.hostname)}"
                : ""
            }
            
            htmlNode[linkKey] = replaceUrl;
        }`
    };
    if (fmtRequireUrlFuncStr) {
      this.options.fmtRequireUrlFuncStr =
        typeof fmtRequireUrlFuncStr == "function"
          ? fmtRequireUrlFuncStr.toString()
          : fmtRequireUrlFuncStr;
    }
  }
  apply(compiler) {
    compiler.hooks.compilation.tap("MyPlugin", compilation => {
      const { Template } = webpack;
      const { mainTemplate } = compilation;
      mainTemplate.hooks.requireExtensions.tap("assets-reload", source => {
        // hack requireEnsure add options params
        return source.replace(
          "function requireEnsure(chunkId) {",
          "function requireEnsure(chunkId, options) {"
        );
      });
      mainTemplate.hooks.bootstrap.tap("assets-reload", source => {
        if (!source) {
          return;
        }
        // add fmtRequireUrl function
        return Template.asString([
          source,
          `window.fmtRequireUrl = ${this.options.fmtRequireUrlFuncStr}`
        ]);
      });
      mainTemplate.hooks.beforeStartup.tap(
        "assets-reload",
        (source, chunk, hash) => {
          if (!source) {
            return;
          }
          // new RequireEnsure to reload again
          var newRequireEnsure = `function newRequireEnsure (chunkId, options) {
                    return __webpack_require__.oldE(chunkId, options).then(function () {}, function (err) {
                        console.error(err);
                        var type;
                        if (/.*\.css\??/.test(err.request)) {
                            type = 'LINK';
                        } else if (/.*\.js\??.*/.test(err.request)) {
                            type = 'SCRIPT';
                        }
                        if (options === undefined) {
                            options = {
                                LINK: 0,
                                SCRIPT: 0
                            };
                        }
                        options[type]++;
                        // 最小值为1
                        if (options[type] <= 2) {
                            return newRequireEnsure(chunkId, options);
                        }
                    })
                }`;

          return Template.asString([
            source,
            "__webpack_require__.oldE = __webpack_require__.e;",
            `__webpack_require__.e = ${newRequireEnsure}`
          ]);
        }
      );

      mainTemplate.hooks.requireEnsure.tap(
        "assets-reload",
        (source, chunk, hash) => {
          // hack fmtRequireUrl
          const cssHackReplace = "linkTag.href = fullhref;";

          source = source.replace(
            cssHackReplace,
            Template.asString([
              cssHackReplace,
              `window.fmtRequireUrl && window.fmtRequireUrl(linkTag, chunkId, __webpack_require__, options);`
            ])
          );
          const jsHackReplace = "script.src = jsonpScriptSrc(chunkId);";
          source = source.replace(
            jsHackReplace,
            Template.asString([
              jsHackReplace,
              `window.fmtRequireUrl && fmtRequireUrl(script, chunkId, __webpack_require__, options);`
            ])
          );
          return source;
        }
      );
    });
  }
}
module.exports = AssetReload;
