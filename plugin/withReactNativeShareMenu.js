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
exports.getProjectShareMenuName = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var plist_1 = require("@expo/plist");
var generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
var config_plugins_2 = require("@expo/config-plugins");
var fs = require("fs");
var path = require("path");
var withShareMenuAndroid_1 = require("./withShareMenuAndroid");
var util_1 = require("./util");
// constants
var SHARE_EXT_NAME = "ShareMenu";
var SHARE_MENU_TAG = "react-native-share-menu";
// TODO make anchor take in the project name
var IOS_HAS_SHARE_MENU_TARGET = /target 'ExpoPlistShare' do/gm;
var IOS_INSTALLER_ANCHOR = /__apply_Xcode_12_5_M1_post_install_workaround\(installer\)/gm;
// TODO make anchor take in the project name
var IOS_MAIN_TARGET_ANCHOR = /target 'ExpoPlist' do/gm;
// helpers
function getProjectShareMenuName(name) {
    return "".concat(name);
}
exports.getProjectShareMenuName = getProjectShareMenuName;
/** Create a namespaced tag */
var tag = function (s) { return "".concat(SHARE_MENU_TAG, "-").concat(s); };
/** Grab the last merge results operation */
var last = function (arr) {
    var l = arr[arr.length - 1];
    if (typeof l === "undefined") {
        throw new Error("No prior results. This is a bug in expo-community-flipper and should be reported");
    }
    return l;
};
/** Indent code, making generated podfile changes a bit more readable */
var indent = function (block, size) {
    return (typeof block === "string" ? block.split("\n") : block)
        .map(function (s) { return "".concat(" ".repeat(size)).concat(s); })
        .join("\n");
};
/** Removes content by its tag */
var removeTaggedContent = function (contents, ns) {
    return (0, generateCode_1.removeContents)({ src: contents, tag: tag(ns) });
};
// main plugin
var withReactNativeShareMenu = function (config, props) {
    config = (0, withShareMenuAndroid_1.withShareMenuAndroid)(config, props);
    config = withShareMenuIos(config, props);
    return config;
};
var withShareMenuIos = function (config, props) {
    // main iOS target
    config = withShareMenuEntitlements(config);
    config = withShareMenuInfoPlist(config);
    config = withShareMenuPodfile(config);
    config = withShareMenuAppDelegate(config);
    // share extension target
    config = withShareMenuExtensionTarget(config, props);
    config = withShareMenuExtensionEntitlements(config);
    config = withShareMenuExtensionInfoPlist(config);
    return config;
};
var withShareMenuExtensionTarget = function (config, shareMenuProps) {
    return (0, config_plugins_1.withXcodeProject)(config, function (config) { return __awaiter(void 0, void 0, void 0, function () {
        var extensionName, appIdentifier, shareExtensionIdentifier, shareMenuFolder, iosPath, projPath, sourceDir, extFiles, i, extFile, targetFile, proj, shareMenuKey, groups, projObjects, target, buildPath, STORYBOARD_NAME, storyboardPath, PLIST_NAME, BRIDGING_HEADER_NAME, ENTITLEMENTS_NAME, infoPlistPath, bridgingHeaderPath, entitlementsPath, variantKey, currentProjectVersion, marketingVersion, configurations, key, buildSettingsObj;
        var _a;
        return __generator(this, function (_b) {
            extensionName = "ShareMenu";
            appIdentifier = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier;
            shareExtensionIdentifier = "".concat(appIdentifier, ".").concat(extensionName.toLowerCase());
            shareMenuFolder = "ShareMenu";
            iosPath = config.modRequest.platformProjectRoot;
            projPath = "".concat(iosPath, "/").concat(extensionName, ".xcodeproj/project.pbxproj");
            sourceDir = "".concat(config.modRequest.projectRoot, "/plugin/extensionFiles/");
            extFiles = [
                // "ShareMenu.entitlements",
                // "ShareMenu-Info.plist",
                "MainInterface.storyboard",
                "ShareMenu-Bridging-Header.h",
            ];
            /* COPY OVER EXTENSION FILES */
            fs.mkdirSync("".concat(iosPath, "/").concat(shareMenuFolder), { recursive: true });
            for (i = 0; i < extFiles.length; i++) {
                extFile = extFiles[i];
                targetFile = "".concat(iosPath, "/").concat(shareMenuFolder, "/").concat(extFile);
                (0, util_1.copyFileSync)(path.join(sourceDir, extFile), targetFile);
            }
            proj = config.modResults;
            shareMenuKey = proj.pbxCreateGroup(SHARE_EXT_NAME, SHARE_EXT_NAME);
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
            if (!!proj.pbxTargetByName(SHARE_EXT_NAME)) {
                console.log("\t".concat(SHARE_EXT_NAME, " already exists in project. Skipping..."));
                return [2 /*return*/];
            }
            target = proj.addTarget(extensionName, "app_extension", extensionName, shareExtensionIdentifier);
            buildPath = "\"$(CONTENTS_FOLDER_PATH)/ShareMenu\"";
            // Add Shell build phase for check pods manifest
            proj.addBuildPhase([], "PBXShellScriptBuildPhase", "[CP] Check Pods Manifest.lock", target.uuid, {
                inputPaths: [
                    "\"${PODS_PODFILE_DIR_PATH}/Podfile.lock\"",
                    "\"${PODS_ROOT}/Manifest.lock\"",
                ],
                outputPaths: [
                    "\"$(DERIVED_FILE_DIR)/Pods-".concat(SHARE_EXT_NAME, "-checkManifestLockResult.txt\""),
                ],
                shellPath: "/bin/sh",
                shellScript: "\"\"diff \"${PODS_PODFILE_DIR_PATH}/Podfile.lock\" \"${PODS_ROOT}/Manifest.lock\" > /dev/null\\nif [ $? != 0 ] ; then\\n    # print error to STDERR\\n    echo \"error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.\" >&2\\n    exit 1\\nfi\\n# This output is used by Xcode 'outputs' to avoid re-running this script phase.\\necho \"SUCCESS\" > \"${SCRIPT_OUTPUT_FILE_0}\"\\n\""
            }, buildPath);
            // Build ShareViewController.swift in our extension target
            proj.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
            STORYBOARD_NAME = "MainInterface.storyboard";
            storyboardPath = path.join(STORYBOARD_NAME);
            proj.addBuildPhase(
            // [storyboardPath],
            [], "PBXResourcesBuildPhase", "Resources", target.uuid);
            // Build phase for Framework
            proj.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
            proj.addFramework("libPods-ShareMenu.a", { target: target.uuid });
            // Add Shell build phase for copy pods resources
            proj.addBuildPhase([], "PBXShellScriptBuildPhase", "[CP] Copy Pods Resources", target.uuid, {
                inputPaths: [
                    "\"${PODS_ROOT}/Target Support Files/Pods-".concat(SHARE_EXT_NAME, "/Pods-").concat(SHARE_EXT_NAME, "-resources.sh\""),
                    "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Core/AccessibilityResources.bundle\"",
                ],
                outputPaths: [
                    "\"${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/AccessibilityResources.bundle\"",
                ],
                shellPath: "/bin/sh",
                shellScript: "\"${PODS_ROOT}/Target Support Files/Pods-ShareMenu/Pods-".concat(SHARE_EXT_NAME, "-resources.sh\"\n\"")
            }, buildPath);
            PLIST_NAME = "ShareMenu-Info.plist";
            BRIDGING_HEADER_NAME = "".concat(extensionName, "-Bridging-Header.h");
            ENTITLEMENTS_NAME = "".concat(extensionName, ".entitlements");
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
                        buildSettingsObj["PRODUCT_NAME"] === "\"".concat(SHARE_EXT_NAME, "\"")) {
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
            proj.addTargetAttribute("DevelopmentTeam", shareMenuProps.devTeam, shareMenuKey);
            proj.addTargetAttribute("DevelopmentTeam", shareMenuProps.devTeam);
            return [2 /*return*/, config];
        });
    }); });
};
// this gives TS error? change to function signature
// const addShareMenuAppDelegateImport: MergeResults = (src: string) => {
function addShareMenuAppDelegateImport(src) {
    return (0, generateCode_1.mergeContents)({
        tag: "Import",
        src: src,
        newSrc: "#import <RNShareMenu/ShareMenuManager.h>",
        anchor: /#import <React\/RCTAppSetupUtils\.h>/,
        offset: 1,
        comment: "//"
    });
}
function addShareMenuAppDelegateLinkingAPI(src) {
    // TODO Only does an insert, needed replace, better way to do this?
    // return mergeContents({
    //   tag: "LinkingAPI",
    //   src,
    //   newSrc:
    //     "return [super application:application openURL:url options:options] || [ShareMenuManager application:application openURL:url options:options];",
    //   anchor:
    //     /return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];/,
    //   offset: 0,
    //   comment: "//",
    // });
    // Obviously fragile - need AppDelegate proxy via wrapper package?
    // https://docs.expo.dev/guides/config-plugins/#ios-app-delegate
    // Although this method seems to be used here
    // https://github.com/bndkt/react-native-app-clip/blob/main/src/withAppClipAppDelegate.ts#L65
    var findString = "return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];";
    var replaceString = "return [ShareMenuManager application:application openURL:url options:options];";
    return {
        contents: src.replace(findString, replaceString),
        didClear: false,
        didMerge: true
    };
}
var withShareMenuAppDelegate = function (config) {
    return (0, config_plugins_1.withAppDelegate)(config, function (config) {
        if (["objc", "objcpp"].includes(config.modResults.language)) {
            try {
                config.modResults.contents = addShareMenuAppDelegateImport(config.modResults.contents).contents;
                config.modResults.contents = addShareMenuAppDelegateLinkingAPI(config.modResults.contents).contents;
            }
            catch (error) {
                if (error.code === "ERR_NO_MATCH") {
                    throw new Error("Cannot add Share Menu to the project's AppDelegate because it's malformed. Please report this with a copy of your project AppDelegate.");
                }
                throw error;
            }
        }
        else {
            throw new Error("Cannot setup Share Menu because the AppDelegate is not Objective C");
        }
        return config;
    });
};
var withShareMenuEntitlements = function (config) {
    return (0, config_plugins_2.withEntitlementsPlist)(config, function (config) {
        var _a;
        config.modResults["com.apple.security.application-groups"] = [
            "group.".concat(((_a = config === null || config === void 0 ? void 0 : config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier) || ""),
        ];
        return config;
    });
};
var withShareMenuInfoPlist = function (config) {
    return (0, config_plugins_2.withInfoPlist)(config, function (config) {
        var _a;
        var plistItems = {
            CFBundleTypeRole: "editor",
            CFBundleURLSchemes: ["".concat((_a = config === null || config === void 0 ? void 0 : config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier)]
        };
        config.modResults.CFBundleURLTypes.push(plistItems);
        return config;
    });
};
var withShareMenuPodfile = function (config) {
    return (0, config_plugins_2.withDangerousMod)(config, [
        "ios",
        function (config) { return __awaiter(void 0, void 0, void 0, function () {
            var filePath, contents, results, preexisting;
            return __generator(this, function (_a) {
                filePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
                contents = fs.readFileSync(filePath, "utf-8");
                results = [];
                results.push(removeTaggedContent(contents, "BuildSettings"));
                results.push(removeTaggedContent(contents, "ShareTarget"));
                preexisting = IOS_HAS_SHARE_MENU_TARGET.test(last(results).contents);
                if (!preexisting) {
                    results.push((0, generateCode_1.mergeContents)({
                        tag: tag("BuildSettings"),
                        src: last(results).contents,
                        newSrc: indent([
                            "# Build settings for react-native-share-menu",
                            "installer.pods_project.targets.each do |target|",
                            "  target.build_configurations.each do |config|",
                            "    config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'NO'",
                            "  end",
                            "end",
                        ], 4),
                        anchor: IOS_INSTALLER_ANCHOR,
                        offset: 2,
                        comment: "#"
                    }));
                    results.push((0, generateCode_1.mergeContents)({
                        tag: tag("ShareTarget"),
                        src: last(results).contents,
                        newSrc: indent([
                            "target '".concat(SHARE_EXT_NAME, "' do"),
                            "  use_react_native!",
                            "",
                            "  pod 'RNShareMenu', :path => '../node_modules/react-native-share-menu'",
                            "end",
                        ], 0),
                        anchor: IOS_MAIN_TARGET_ANCHOR,
                        offset: -1,
                        comment: "#"
                    }));
                }
                // couldn't remove and couldn't add. Treat the operation as failed
                if (!last(results).didMerge) {
                    throw new Error("Cannot add react-native-share-menu to the project's ios/Podfile. Please report this with a copy of your project Podfile. You can generate this with the `expo prebuild` command.");
                }
                fs.writeFileSync(filePath, last(results).contents);
                return [2 /*return*/, config];
            });
        }); },
    ]);
};
var withShareMenuExtensionEntitlements = function (config) {
    return (0, config_plugins_2.withDangerousMod)(config, [
        "ios",
        function (config) { return __awaiter(void 0, void 0, void 0, function () {
            var shareMenuRootPath, filePath, shareMenu;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        shareMenuRootPath = path.join(config.modRequest.platformProjectRoot, SHARE_EXT_NAME);
                        filePath = path.join(shareMenuRootPath, "ShareMenu.entitlements");
                        shareMenu = {
                            "com.apple.security.application-groups": [
                                "group.".concat(((_a = config === null || config === void 0 ? void 0 : config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier) || ""),
                            ]
                        };
                        return [4 /*yield*/, fs.mkdirSync(path.dirname(filePath), { recursive: true })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, fs.writeFileSync(filePath, plist_1["default"].build(shareMenu))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, config];
                }
            });
        }); },
    ]);
};
var withShareMenuExtensionInfoPlist = function (config) {
    return (0, config_plugins_2.withDangerousMod)(config, [
        "ios",
        function (config) { return __awaiter(void 0, void 0, void 0, function () {
            var shareMenuRootPath, filePath, appIdentifier, shareMenu;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        shareMenuRootPath = path.join(config.modRequest.platformProjectRoot, SHARE_EXT_NAME);
                        filePath = path.join(shareMenuRootPath, "ShareMenu-Info.plist");
                        appIdentifier = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier;
                        shareMenu = {
                            HostAppBundleIdentifier: "".concat(appIdentifier),
                            HostAppURLScheme: "".concat(appIdentifier, "://"),
                            CFBundleDisplayName: "".concat(config.modRequest.projectName || "", " ").concat(SHARE_EXT_NAME),
                            NSExtension: {
                                NSExtensionAttributes: {
                                    NSExtensionActivationRule: {
                                        NSExtensionActivationSupportsText: true,
                                        NSExtensionActivationSupportsWebURLWithMaxCount: 1
                                    }
                                },
                                NSExtensionMainStoryboard: "MainInterface",
                                NSExtensionPointIdentifier: "com.apple.share-services"
                            }
                        };
                        return [4 /*yield*/, fs.mkdirSync(path.dirname(filePath), { recursive: true })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, fs.writeFileSync(filePath, plist_1["default"].build(shareMenu))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, config];
                }
            });
        }); },
    ]);
};
exports["default"] = withReactNativeShareMenu;
