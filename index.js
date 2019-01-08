module.exports = require('./loader.js');

function parser(key, value) {
  if (value instanceof RegExp)
    return value.source;
  else
    return value;
}

module.exports.Register = function(nextLoaders, registerOptions, prevLoaders) {
    // shift params to account for optional nextLoaders
    if(!prevLoaders && (typeof registerOptions === "string")) {
        prevLoaders = registerOptions;
        registerOptions = nextLoaders;
        nextLoaders = undefined;
    } else if(!registerOptions){
        registerOptions = nextLoaders;
        nextLoaders = undefined;
    }

    const query = JSON.stringify(registerOptions, parser, 2);
    var replaceLoader = require.resolve("./loader") + "?" + query,
        val = replaceLoader;
    if(nextLoaders || prevLoaders) {
        var loaders = [replaceLoader];
        if(nextLoaders) loaders.unshift(nextLoaders);
        if(prevLoaders) loaders.push(prevLoaders);
        val = loaders.join("!");
    }

    return val;
}
