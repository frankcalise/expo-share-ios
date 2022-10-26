"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.withShareMenuExtensionTarget = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var fs = require("fs");
var path = require("path");
var util_1 = require("./util");
var withShareMenuIos_1 = require("./withShareMenuIos");
var withShareMenuExtensionTarget = function (config, shareMenuProps) {
    return (0, config_plugins_1.withXcodeProject)(config, function (config) { return __awaiter(void 0, void 0, void 0, function () {
        var appIdentifier, shareExtensionIdentifier, shareMenuFolder, iosPath, sourceDir, extFiles, i, extFile, targetFile, proj, shareMenuKey, groups, projObjects, target, buildPath, STORYBOARD_NAME, storyboardPath, PLIST_NAME, BRIDGING_HEADER_NAME, ENTITLEMENTS_NAME, infoPlistPath, bridgingHeaderPath, entitlementsPath, variantKey, currentProjectVersion, marketingVersion, configurations, key, buildSettingsObj;
        var _a;
        return __generator(this, function (_b) {
            appIdentifier = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier;
            shareExtensionIdentifier = "".concat(appIdentifier, ".").concat(withShareMenuIos_1.SHARE_EXT_NAME.toLowerCase());
            shareMenuFolder = withShareMenuIos_1.SHARE_EXT_NAME;
            iosPath = config.modRequest.platformProjectRoot;
            sourceDir = "".concat(config.modRequest.projectRoot, "/plugin/extensionFiles/");
            extFiles = [
                "MainInterface.storyboard",
                "".concat(withShareMenuIos_1.SHARE_EXT_NAME, "-Bridging-Header.h"),
            ];
            /* COPY OVER EXTENSION FILES */
            fs.mkdirSync("".concat(iosPath, "/").concat(shareMenuFolder), { recursive: true });
            for (i = 0; i < extFiles.length; i++) {
                extFile = extFiles[i];
                targetFile = "".concat(iosPath, "/").concat(shareMenuFolder, "/").concat(extFile);
                (0, util_1.copyFileSync)(path.join(sourceDir, extFile), targetFile);
            }
            proj = config.modResults;
            shareMenuKey = proj.pbxCreateGroup(withShareMenuIos_1.SHARE_EXT_NAME, withShareMenuIos_1.SHARE_EXT_NAME);
            groups = proj.hash.project.objects["PBXGroup"];
            Object.keys(groups).forEach(function (key) {
                if (groups[key].name === undefined) {
                    proj.addToPbxGroup(shareMenuKey, key);
                }
            });
            projObjects = proj.hash.project.objects;
            projObjects["PBXTargetDependency"] =
                projObjects["PBXTargetDependency"] || {};
            projObjects["PBXContainerItemProxy"] =
                projObjects["PBXTargetDependency"] || {};
            if (!!proj.pbxTargetByName(withShareMenuIos_1.SHARE_EXT_NAME)) {
                console.log("\t".concat(withShareMenuIos_1.SHARE_EXT_NAME, " already exists in project. Skipping..."));
                return [2 /*return*/];
            }
            target = proj.addTarget(withShareMenuIos_1.SHARE_EXT_NAME, "app_extension", withShareMenuIos_1.SHARE_EXT_NAME, shareExtensionIdentifier);
            buildPath = "\"$(CONTENTS_FOLDER_PATH)/".concat(withShareMenuIos_1.SHARE_EXT_NAME, "\"");
            // Add Shell build phase for check pods manifest
            proj.addBuildPhase([], "PBXShellScriptBuildPhase", "[CP] Check Pods Manifest.lock", target.uuid, {
                inputPaths: [
                    "\"${PODS_PODFILE_DIR_PATH}/Podfile.lock\"",
                    "\"${PODS_ROOT}/Manifest.lock\"",
                ],
                outputPaths: [
                    "\"$(DERIVED_FILE_DIR)/Pods-".concat(withShareMenuIos_1.SHARE_EXT_NAME, "-checkManifestLockResult.txt\""),
                ],
                shellPath: "/bin/sh",
                shellScript: "\"\"diff \"${PODS_PODFILE_DIR_PATH}/Podfile.lock\" \"${PODS_ROOT}/Manifest.lock\" > /dev/null\\nif [ $? != 0 ] ; then\\n    # print error to STDERR\\n    echo \"error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.\" >&2\\n    exit 1\\nfi\\n# This output is used by Xcode 'outputs' to avoid re-running this script phase.\\necho \"SUCCESS\" > \"${SCRIPT_OUTPUT_FILE_0}\"\\n\""
            }, buildPath);
            // Build ShareViewController.swift in our extension target
            proj.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
            STORYBOARD_NAME = "MainInterface.storyboard";
            storyboardPath = path.join(STORYBOARD_NAME);
            proj.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
            // Build phase for Framework
            proj.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
            proj.addFramework("libPods-".concat(withShareMenuIos_1.SHARE_EXT_NAME, ".a"), { target: target.uuid });
            // Add Shell build phase for copy pods resources
            proj.addBuildPhase([], "PBXShellScriptBuildPhase", "[CP] Copy Pods Resources", target.uuid, {
                inputPaths: [
                    "\"${PODS_ROOT}/Target Support Files/Pods-".concat(withShareMenuIos_1.SHARE_EXT_NAME, "/Pods-").concat(withShareMenuIos_1.SHARE_EXT_NAME, "-resources.sh\""),
                    "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Core/AccessibilityResources.bundle\"",
                ],
                outputPaths: [
                    "\"${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/AccessibilityResources.bundle\"",
                ],
                shellPath: "/bin/sh",
                shellScript: "\"${PODS_ROOT}/Target Support Files/Pods-".concat(withShareMenuIos_1.SHARE_EXT_NAME, "/Pods-").concat(withShareMenuIos_1.SHARE_EXT_NAME, "-resources.sh\"\n\"")
            }, buildPath);
            PLIST_NAME = "".concat(withShareMenuIos_1.SHARE_EXT_NAME, "-Info.plist");
            BRIDGING_HEADER_NAME = "".concat(withShareMenuIos_1.SHARE_EXT_NAME, "-Bridging-Header.h");
            ENTITLEMENTS_NAME = "".concat(withShareMenuIos_1.SHARE_EXT_NAME, ".entitlements");
            infoPlistPath = path.join(shareMenuFolder, PLIST_NAME);
            bridgingHeaderPath = path.join(shareMenuFolder, BRIDGING_HEADER_NAME);
            entitlementsPath = path.join(shareMenuFolder, ENTITLEMENTS_NAME);
            proj.addFile(ENTITLEMENTS_NAME, shareMenuKey);
            proj.addFile(PLIST_NAME, shareMenuKey);
            proj.addFile(BRIDGING_HEADER_NAME, shareMenuKey);
            // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase
            proj.addSourceFile("../../node_modules/react-native-share-menu/ios/ShareViewController.swift", { target: target.uuid }, shareMenuKey);
            variantKey = proj.pbxCreateVariantGroup(STORYBOARD_NAME);
            //  Add the resource file and include it into the target PbxResourcesBuildPhase and PbxGroup
            proj.addResourceFile(storyboardPath, {
                target: target.uuid,
                lastKnownFileType: "file.storyboard"
            }, shareMenuKey);
            currentProjectVersion = config.ios.buildNumber || "1";
            marketingVersion = config.version;
            configurations = proj.pbxXCBuildConfigurationSection();
            for (key in configurations) {
                if (typeof configurations[key].buildSettings !== "undefined") {
                    buildSettingsObj = configurations[key].buildSettings;
                    if (typeof buildSettingsObj["PRODUCT_NAME"] !== "undefined" &&
                        buildSettingsObj["PRODUCT_NAME"] === "\"".concat(withShareMenuIos_1.SHARE_EXT_NAME, "\"")) {
                        buildSettingsObj["DEVELOPMENT_TEAM"] = shareMenuProps.devTeam;
                        buildSettingsObj["CLANG_ENABLE_MODULES"] = "YES";
                        buildSettingsObj["INFOPLIST_FILE"] = "\"".concat(infoPlistPath, "\"");
                        buildSettingsObj["CODE_SIGN_ENTITLEMENTS"] = "\"".concat(entitlementsPath, "\"");
                        buildSettingsObj["CODE_SIGN_STYLE"] = "Automatic";
                        buildSettingsObj["CURRENT_PROJECT_VERSION"] = "\"".concat(currentProjectVersion, "\"");
                        buildSettingsObj["GENERATE_INFOPLIST_FILE"] = "YES";
                        buildSettingsObj["MARKETING_VERSION"] = "\"".concat(marketingVersion, "\"");
                        buildSettingsObj["PRODUCT_BUNDLE_IDENTIFIER"] = "\"".concat(shareExtensionIdentifier, "\"");
                        buildSettingsObj["SWIFT_EMIT_LOC_STRINGS"] = "YES";
                        buildSettingsObj["SWIFT_VERSION"] = "5.0";
                        buildSettingsObj["TARGETED_DEVICE_FAMILY"] = "\"1,2\"";
                        buildSettingsObj["SWIFT_OBJ_BRIDGING_HEADER"] = "\"".concat(bridgingHeaderPath, "\"");
                    }
                }
            }
            // Add development teams to both app and share extension targets
            proj.addTargetAttribute("DevelopmentTeam", shareMenuProps.devTeam);
            // TODO unsure how to add it to the share extension target
            // proj.addTargetAttribute(
            //   "DevelopmentTeam",
            //   shareMenuProps.devTeam,
            //   target.uuid
            // );
            return [2 /*return*/, config];
        });
    }); });
};
exports.withShareMenuExtensionTarget = withShareMenuExtensionTarget;
