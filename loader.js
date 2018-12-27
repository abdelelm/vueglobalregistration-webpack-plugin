/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author AbdelElm
*/
const path = require("path")
var loaderUtils = require("loader-utils");
var VueGlobalRegistration = require('./index.js');
var chokidar = require('chokidar');
const fs = require("fs");
var RunWatch = function (directory, file) {
    if (!process.watcher)
        process.watcher = {};
    directory = path.resolve(directory);
    if (process.watcher[directory])
        return;

    if (process.env.NODE_ENV === "development") {
        console.log("Watch directory for global registration on folder ", directory)
        process.watcher[directory] = chokidar.watch(directory, {
            persistent: true,
            ignoreInitial: true,
        });


        var func = () => {
            fs.writeFileSync(file, fs.readFileSync(file, "utf-8"))
        }
        process.watcher[directory].on('add', func);
        process.watcher[directory].on('unlink', func);
    }


}
var walkSync = function (dir, ext, base, rec) {
    if (!base)
        base = dir;
    var filelist = [],
        fs = fs || require('fs');
    if (!fs.existsSync(dir))
        return filelist;

    var files = fs.readdirSync(dir);

    files.forEach(function (file) {
        var fullpath = path.join(dir, file);
        var isdir = fs.statSync(fullpath).isDirectory();
        if (isdir && rec) {
            filelist = filelist.concat(walkSync(fullpath, ext, base, rec));
        } else if (!isdir) {
            var data = {
                name: fullpath.replace(base, "").replace(/\\/g, "/"),
                fullpath: fullpath.replace(/\\/g, "/"),
                file: file
            };
            if (path.extname(file) === ext && path.basename(data.name)[0] !== "_")
                filelist.push(data);
        }
    });
    return filelist;
};

function GetComponentPath(file, separator) {
    var name = file.name.substr(1).replace(/\//g, separator || "-").replace(".vue", "");
    if (file.file === "index.vue")
        name = name.replace("-index", "");
    return name;
}

function GetRouterPath(file) {
    var name = [];
    var _n = file.name.split("/");
    _n.splice(-1)
    for (var i in _n) {
        if (_n[i][0] !== "@")
            name.push(_n[i])
    }
    name = name.join("/");
    if (name.length == 0)
        name = "/";

    var params = file.file.replace(".vue", "").split("_");
    var l = params.splice(0, 1)[0];
    if (l !== "index")
        name += (name === "/" ? "" : "/") + l
    for (var i in params)
        name += "/:" + params[i]
    return name;
}

module.exports = function (source, map) {
    var callback = this.async();
    var id = loaderUtils.parseQuery(this.query).id;
    var source = source;
    var registerReplaceOptions = VueGlobalRegistration.RegistrationOptions;
    if (!registerReplaceOptions.hasOwnProperty(id)) {
        this.emitWarning('no registration options found for id ' + id);
    } else {
        var options = registerReplaceOptions[id];

        if (typeof source === "string") {

            var file = [],
                index_comp = 1,
                index_route = 1;
            var setResult = (result) => {
                if (options.replace)
                    source = source.replace(options.replace, result)
                else
                    source = file.join("\n");
            }
            if (options.replace && source.indexOf(options.replace) == -1)
                return callback(null, source, map);
            RunWatch.apply(this, [options.folder, this._module.resource]);
            if (!options.replace) {
                file = source.split("\n");
                for (var i in file) {
                    var x = file[i];
                    if (x.indexOf("import") == 0) {
                        ++index_comp;
                    }
                    if (x.indexOf("routes") > 0)
                        ++index_route;
                }
            }


            if (options) {
                var list = walkSync(path.resolve(options.folder.replace(/\\/g, "/")), ".vue", null, !(options.recursive == false));
                var imports = [];
                var inject = [];

                if (options.type === "routing") {
                    var variable = options.array || "routes"
                    var imp = 'import ROUT${ctr} from "${path}";',
                        toadd = variable + ".push({ path: '${name}', meta : ${meta},  component: ROUT${ctr} })";

                    for (var i in list) {
                        var el = list[i];
                        var meta = (options.rules || []).find(obj => obj.test.test(el.fullpath)) || {
                            meta: {}
                        };
                        imports.push(imp.replace("${ctr}", i).replace("${path}", el.fullpath))
                        inject.push(toadd.replace("${ctr}", i)
                            .replace("${meta}", JSON.stringify(meta.meta))
                            .replace("${name}", GetRouterPath(el)))
                    }
                    if (!options.replace)
                        file.splice(index_route, 0, imports.concat(inject).join("\n"))

                } else if (options.type === "component") {
                    var imp = 'import COMP${ctr} from "${path}";',
                        toadd = "Vue.component(COMP${ctr}.name || '${name}' ,  COMP${ctr})"

                    for (var i in list) {
                        var el = list[i];
                        imports.push(imp.replace("${ctr}", i).replace("${path}", el.fullpath))
                        inject.push(toadd.replace("${ctr}", i)
                            .replace("${ctr}", i)
                            .replace("${name}", GetComponentPath(el, options.separator)))
                    }
                    if (!options.replace)
                        file.splice(index_comp, 0, imports.concat(inject).join("\n"))
                }

                setResult(imports.concat(inject).join("\n"))


            }


        } else {
            this.emitWarning("'source' received by loader was not a string");
        }
    }

    this.cacheable && this.cacheable();
    callback(null, source, map);
};