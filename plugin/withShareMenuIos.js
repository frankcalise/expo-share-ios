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
exports.withShareMenuIos = exports.getProjectShareMenuName = exports.SHARE_EXT_NAME = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var plist_1 = require("@expo/plist");
var generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
var config_plugins_2 = require("@expo/config-plugins");
var fs = require("fs");
var path = require("path");
var withShareMenuExtensionTarget_1 = require("./withShareMenuExtensionTarget");
// constants
exports.SHARE_EXT_NAME = "ShareMenu";
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
var withShareMenuIos = function (config, props) {
    // main iOS target
    config = withShareMenuEntitlements(config);
    config = withShareMenuInfoPlist(config);
    config = withShareMenuPodfile(config);
    config = withShareMenuAppDelegate(config);
    // share extension target
    config = (0, withShareMenuExtensionTarget_1.withShareMenuExtensionTarget)(config, props);
    config = withShareMenuExtensionEntitlements(config);
    config = withShareMenuExtensionInfoPlist(config);
    return config;
};
exports.withShareMenuIos = withShareMenuIos;
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
                            "target '".concat(exports.SHARE_EXT_NAME, "' do"),
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
                        shareMenuRootPath = path.join(config.modRequest.platformProjectRoot, exports.SHARE_EXT_NAME);
                        filePath = path.join(shareMenuRootPath, "".concat(exports.SHARE_EXT_NAME, ".entitlements"));
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
                        shareMenuRootPath = path.join(config.modRequest.platformProjectRoot, exports.SHARE_EXT_NAME);
                        filePath = path.join(shareMenuRootPath, "".concat(exports.SHARE_EXT_NAME, "-Info.plist"));
                        appIdentifier = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier;
                        shareMenu = {
                            HostAppBundleIdentifier: "".concat(appIdentifier),
                            HostAppURLScheme: "".concat(appIdentifier, "://"),
                            CFBundleDisplayName: "".concat(config.modRequest.projectName || "", " ").concat(exports.SHARE_EXT_NAME),
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
