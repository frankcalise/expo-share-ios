"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
function addPbxGroup(proj, _a) {
    var appName = _a.appName, shareMenuFolder = _a.shareMenuFolder, platformProjectRoot = _a.platformProjectRoot;
    // App Clip folder
    var appClipPath = path.join(platformProjectRoot, shareMenuFolder);
    // Copy Expo.plist
    // const supportingPath = path.join(appClipPath, "Supporting");
    // const expoPlistSource = path.join(
    //   platformProjectRoot,
    //   appName,
    //   "Supporting",
    //   "Expo.plist"
    // );
    // fs.mkdirSync(supportingPath);
    // copyFileSync(expoPlistSource, supportingPath);
    // // Copy SplashScreen.storyboard
    // const splashScreenStoryboardSource = path.join(
    //   platformProjectRoot,
    //   appName,
    //   "SplashScreen.storyboard"
    // );
    // copyFileSync(splashScreenStoryboardSource, appClipPath);
    // // Copy Images.xcassets
    // const imagesXcassetsSource = path.join(
    //   platformProjectRoot,
    //   appName,
    //   "Images.xcassets"
    // );
    // copyFolderRecursiveSync(imagesXcassetsSource, appClipPath);
    // Add PBX group
    var pbxGroupUuid = proj.addPbxGroup([
        "ShareViewController.swift",
        "Info.plist",
        "MainInterface.storyboard",
        "".concat(shareMenuFolder, ".entitlements"),
        "".concat(shareMenuFolder, "-Bridging-Header.h"),
    ], shareMenuFolder, shareMenuFolder).uuid;
    // console.log(`Added PBXGroup ${pbxGroupUuid}`);
    // Add PBXGroup to top level group
    var groups = proj.hash.project.objects["PBXGroup"];
    if (pbxGroupUuid) {
        Object.keys(groups).forEach(function (key) {
            if (groups[key].name === undefined && groups[key].path === undefined) {
                proj.addToPbxGroup(pbxGroupUuid, key);
                // console.log(`Added PBXGroup ${pbxGroupUuid} root PBXGroup group ${key}`);
            }
        });
    }
}
exports["default"] = addPbxGroup;
function copyFileSync(source, target) {
    var targetFile = target;
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync(source, target) {
    var targetPath = path.join(target, path.basename(source));
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }
    if (fs.lstatSync(source).isDirectory()) {
        var files = fs.readdirSync(source);
        files.forEach(function (file) {
            var currentPath = path.join(source, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                copyFolderRecursiveSync(currentPath, targetPath);
            }
            else {
                copyFileSync(currentPath, targetPath);
            }
        });
    }
}
