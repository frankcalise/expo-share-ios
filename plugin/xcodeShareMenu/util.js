"use strict";
exports.__esModule = true;
exports.copyFileSync = exports.longComment = exports.quoted = void 0;
var util = require("util");
var path = require("path");
var fs = require("fs");
function quoted(str) {
    return util.format("\"%s\"", str);
}
exports.quoted = quoted;
// Copied helper functions from cordova-node-xcode
function longComment(file) {
    return util.format("%s in %s", file.basename, file.group);
}
exports.longComment = longComment;
function copyFileSync(source, target) {
    var targetFile = target;
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}
exports.copyFileSync = copyFileSync;
