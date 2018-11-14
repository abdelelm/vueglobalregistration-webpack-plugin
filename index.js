
var opts = {};
var cache =  {};
function VueGlobalRegistration() {}

// export the replacement options
// so that the loader can refer to them
VueGlobalRegistration.RegistrationOptions = opts;
VueGlobalRegistration.RegistrationCache = cache;
module.exports = VueGlobalRegistration;

VueGlobalRegistration.Register = function(nextLoaders, registerOptions, prevLoaders) {
    // shift params to account for optional nextLoaders
    if(!prevLoaders && (typeof registerOptions === "string")) {
        prevLoaders = registerOptions;
        registerOptions = nextLoaders;
        nextLoaders = undefined;
    } else if(!registerOptions){
        registerOptions = nextLoaders;
        nextLoaders = undefined;
    }

    var id = Math.random().toString(36).slice(2);
    opts[id] = registerOptions;
    var replaceLoader = require.resolve("./loader") + "?id=" + id,
        val = replaceLoader;
    if(nextLoaders || prevLoaders) {
        var loaders = [replaceLoader];
        if(nextLoaders) loaders.unshift(nextLoaders);
        if(prevLoaders) loaders.push(prevLoaders);
        val = loaders.join("!");
    }
    
    return val;
};


VueGlobalRegistration.prototype.apply = function(compiler) {
};