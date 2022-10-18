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
var generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
var config_plugins_1 = require("@expo/config-plugins");
var fs = require("fs");
var path = require("path");
// constants
var SHARE_MENU_TAG = "react-native-share-menu";
var IOS_HAS_SHARE_MENU_TARGET = /target 'ExpoPlistShare' do/gm;
var IOS_INSTALLER_ANCHOR = /__apply_Xcode_12_5_M1_post_install_workaround\(installer\)/gm;
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
var withReactNativeShareMenu = function (config) {
    config = withShareMenuEntitlements(config);
    config = withShareMenuInfoPlist(config);
    config = withShareMenuPodfile(config);
    return config;
};
// modifiers
// android
// withAndroidManifest(expoConfig, async (modConfig) => {
//   let androidManifest = modConfig.modResults.manifest;
//   androidManifest.application.ac
//   return modConfig;
// }
// ios
var withShareMenuEntitlements = function (config) {
    return (0, config_plugins_1.withEntitlementsPlist)(config, function (config) {
        config.modResults["com.apple.security.application-groups"] = [
            "group.com.frankcalise.MYGROUPNAME",
        ];
        return config;
    });
};
var withShareMenuInfoPlist = function (config) {
    return (0, config_plugins_1.withInfoPlist)(config, function (config) {
        var plistItems = {
            CFBundleTypeRole: "editor",
            CFBundleURLSchemes: ["$(PRODUCT_BUNDLE_IDENTIFIER)"]
        };
        config.modResults.CFBundleURLTypes.push(plistItems);
        return config;
    });
};
var withShareMenuPodfile = function (config) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        function (config) { return __awaiter(void 0, void 0, void 0, function () {
            var filePath, contents, results, preexisting;
            return __generator(this, function (_a) {
                filePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
                contents = fs.readFileSync(filePath, "utf-8");
                results = [];
                results.push(removeTaggedContent(contents, "urn"));
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
                            "target 'HelloWorldShare' do",
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
// const withShareMenuExtInfoPlist: ConfigPlugin = (config) => {
//   return withDangerousMod(config, [
//     "ios",
//     async (config) => {
//       const shareMenuExtName = getProjectShareMenuName(
//         config.modRequest.projectName!
//       );
//       const shareMenuRootPath = path.join(
//         config.modRequest.platformProjectRoot,
//         shareMenuExtName
//       );
//       const filePath = path.join(shareMenuRootPath, "Info.plist");
//       const shareMenu: InfoPlist = {
//         HostAppBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
//         HostAppURLScheme: "$(PRODUCT_BUNDLE_IDENTIFIER)://",
//         NSExtension: {
//           NSExtensionAttributes: [
//             {
//               NSExtensionActivationRule: [
//                 { NSExtensionActivationSupportsText: true },
//                 { NSExtensionActivationSupportsWebURLWithMaxCount: 1 },
//               ],
//             },
//           ],
//         },
//       };
//       await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
//       await fs.promises.writeFile(filePath, plist.build(shareMenu));
//       return config;
//     },
//   ]);
// };
exports["default"] = withReactNativeShareMenu;
/*
Function
config = XCodeProject config
targetName: String = name of the new target
iphoneOsTarget: String = iPhone OS to target, incl. decimal point. e.g. "10.0"
devicesTargeted: String = Which devices are targeted (iPhone, iPad or Mac), e.g. "1,2" for iPhone and iPad
 */
// function withAddXcodeTarget(
//   config,
//   targetName,
//   iphoneOSTarget,
//   devicesTargeted,
//   bundleId,
//   bundleVersion,
//   devTeam
// ) {
//   const appName = config.modRequest.projectName;
//   const iosPath = config.modRequest.platformProjectRoot;
//   const projPath = `${iosPath}/${appName}.xcodeproj/project.pbxproj`;
//   const extName = targetName;
//   const extFiles = [
//     "NotificationService.h",
//     "NotificationService.m",
//     `${extName}-Info.plist`,
//     `${extName}.entitlements`,
//   ];
//   // The directory where the source extension files are stored
//   const sourceDir = `./plugins/${extName}/`;
//   let proj = xcode.project(projPath);
//   proj.parse(function (err) {
//     if (err) {
//       console.log(`Error parsing iOS project: ${err}`);
//     }
//     // Copy in the extension files
//     fs.mkdirSync(`${iosPath}/${extName}`, { recursive: true });
//     extFiles.forEach(function (extFile) {
//       let targetFile = `${iosPath}/${extName}/${extFile}`;
//       try {
//         fs.createReadStream(`${sourceDir}${extFile}`).pipe(
//           fs.createWriteStream(targetFile)
//         );
//       } catch (err) {
//         console.log(err);
//       }
//     });
//     // Create new PBXGroup for the extension
//     let extGroup = proj.addPbxGroup(extFiles, extName, extName);
//     // Add the new PBXGroup to the top level group. This makes the
//     // files / folder appear in the file explorer in Xcode.
//     let groups = proj.hash.project.objects["PBXGroup"];
//     Object.keys(groups).forEach(function (key) {
//       if (groups[key].name === undefined) {
//         proj.addToPbxGroup(extGroup.uuid, key);
//       }
//     });
//     // Add a target for the extension
//     let target = proj.addTarget(extName, "app_extension", extName, bundleId);
//     // Add build phases to the new target
//     proj.addBuildPhase(
//       ["NotificationService.m"],
//       "PBXSourcesBuildPhase",
//       "Sources",
//       target.uuid
//     );
//     proj.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
//     proj.addBuildPhase(
//       [],
//       "PBXFrameworksBuildPhase",
//       "Frameworks",
//       target.uuid
//     );
//     // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
//     // However, can be more
//     let configurations = proj.pbxXCBuildConfigurationSection();
//     for (let key in configurations) {
//       if (
//         typeof configurations[key].buildSettings !== "undefined" &&
//         configurations[key].buildSettings.PRODUCT_NAME == `"${extName}"`
//       ) {
//         let buildSettingsObj = configurations[key].buildSettings;
//         buildSettingsObj.DEVELOPMENT_TEAM = devTeam;
//         buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET = iphoneOSTarget;
//         buildSettingsObj.TARGETED_DEVICE_FAMILY = `"${devicesTargeted}"`;
//       }
//     }
//     // Add development teams to both your target and the original project
//     proj.addTargetAttribute("DevelopmentTeam", devTeam, target);
//     proj.addTargetAttribute("DevelopmentTeam", devTeam);
//     fs.writeFileSync(projPath, proj.writeSync());
//   });
// }
