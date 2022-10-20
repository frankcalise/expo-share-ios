"use strict";
exports.__esModule = true;
var util_1 = require("./util");
function addBuildPhases(proj, _a) {
    var groupName = _a.groupName, productFile = _a.productFile, targetUuid = _a.targetUuid;
    var buildPath = (0, util_1.quoted)("$(CONTENTS_FOLDER_PATH)/ShareMenu");
    // Add shell script build phase "Start Packager"
    var startPackagerShellScriptBuildPhaseUuid = proj.addBuildPhase([], "PBXShellScriptBuildPhase", "[CP] Copy Pods Resources", targetUuid, {
        shellPath: "/bin/sh",
        shellScript: "\"\"${PODS_ROOT}/Target Support Files/Pods-ShareMenu/Pods-ShareMenu-resources.sh\"\n\""
    }, buildPath).uuid;
    // console.log(`Added PBXShellScriptBuildPhase ${startPackagerShellScriptBuildPhaseUuid}`);
    // Sources build phase
    var sourcesBuildPhaseUuid = proj.addBuildPhase(["ShareViewController.swift"], "PBXSourcesBuildPhase", groupName, targetUuid, "app_extension", buildPath).uuid;
    // console.log(`Added PBXSourcesBuildPhase ${sourcesBuildPhaseUuid}`);
    // Copy files build phase
    var copyFilesBuildPhaseUuid = proj.addBuildPhase([productFile.path], "PBXCopyFilesBuildPhase", groupName, proj.getFirstTarget().uuid, "app_extension", // "app_extension" uses the same subfolder spec (16), app_clip does not exist in cordova-node-xcode yet,
    buildPath).uuid;
    // console.log(`Added PBXCopyFilesBuildPhase ${copyFilesBuildPhaseUuid}`);
    // Frameworks build phase
    var frameworksBuildPhaseUuid = proj.addBuildPhase([], "PBXFrameworksBuildPhase", groupName, targetUuid, "app_extension", buildPath).uuid;
    // console.log(`Added PBXResourcesBuildPhase ${frameworksBuildPhaseUuid}`);
    // Resources build phase
    var resourcesBuildPhaseUuid = proj.addBuildPhase(["MainInterface.storyboard"], "PBXResourcesBuildPhase", groupName, targetUuid, "app_extension", buildPath).uuid;
    // console.log(`Added PBXResourcesBuildPhase ${resourcesBuildPhaseUuid}`);
    // Add shell script build phase
    // const { uuid: bundleShellScriptBuildPhaseUuid } = proj.addBuildPhase(
    //   [],
    //   "PBXShellScriptBuildPhase",
    //   "Bundle React Native code and images",
    //   targetUuid,
    //   {
    //     shellPath: "/bin/sh",
    //     shellScript: `export NODE_BINARY=node\\n\\n# The project root by default is one level up from the ios directory\\nexport PROJECT_ROOT=\"$PROJECT_DIR\"/..\\n\\n\`node --print \"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\"\`\\n`,
    //   },
    //   buildPath
    // );
    // console.log(`Added PBXShellScriptBuildPhase ${bundleShellScriptBuildPhaseUuid}`);
}
exports["default"] = addBuildPhases;
