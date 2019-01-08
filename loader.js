/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author AbdelElm
*/
const path = require("path")
var loaderUtils = require("loader-utils");
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
    var name = file.name.substr(1).replace(/\//g, separator || "-").replace(/@/g, "").replace(".vue", "");
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

module.exports = function loader(source, map) {
    var callback = this.async();
    var options = loaderUtils.getOptions(this) || {};

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

        if (this._module)
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

            if (options.test) {
                if (typeof (options.test) === "string")
                    options.test = new RegExp(options.test);

                if (typeof (options.test) !== "object" || !options.test.test)
                    throw new Error("Unknown test value provided")

                list = list.filter((r) => {
                    return options.test.test(r.name);
                })
            }

            if (options.rules) {
                for (const rule of options.rules) {
                    if (rule.test && typeof (rule.test) === "string")
                        rule.test = new RegExp(rule.test);
                }
            }

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
                const prefix = options.importPrefix || 'COMP';
                var imp = 'import ' + prefix + '${ctr} from "${path}";',
                    toadd = "Vue.component(" + prefix + "${ctr}.name || '${name}' ,  " + prefix + "${ctr})"

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

    this.cacheable && this.cacheable();
    callback(null, source, map);
}
