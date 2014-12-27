
var fs      = require("fs");
var through = require("through2");

/*  export a Browserify plugin  */
module.exports = function (browserify, opts) {
    /*  determine filename of header file  */
    var filename;
    if (typeof opts.file === "string")
        filename = opts.file;
    else
        filename = browserify._options.entries[0];

    /*  load header comment from header file  */
    var source;
    try {
        source = fs.readFileSync(filename, "utf8");
    }
    catch (e) {
        throw new Error("browserify-header: " +
            "failed to read file \"" + filename + "\": " + e.message);
    }
    var m = source.match(/^(?:.|\r?\n)*?(\/\*!\r?\n(?:.|\r?\n)*?\*\/\r?\n).*/);
    if (m === null)
        m = source.match(/^(?:.|\r?\n)*?(\/\*\r?\n(?:.|\r?\n)*?\*\/\r?\n).*/);
    if (m === null)
        throw new Error("browserify-header: " +
            "no header comment found in file \"" + filename + "\"");
    var header = m[1].replace(/\r?\n/g, "\n") + "\n";

    /*  hook into the bundle generation pipeline of Browserify  */
    browserify.on("bundle", function (pipeline) {
        var firstChunk = true;
        pipeline.get("wrap").push(through.obj(function (buf, enc, next) {
            if (firstChunk) {
                /*  insert the header comment as the first chunk  */
                this.push(new Buffer(header));
                firstChunk = false;
            }
            this.push(buf);
            next();
        }));
    });
};

