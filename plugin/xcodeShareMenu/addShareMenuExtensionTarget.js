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
exports.addShareMenuExtensionTarget = void 0;
var fs = require("fs");
var util_1 = require("./util");
var IPHONEOS_DEPLOYMENT_TARGET = "12.4";
var TARGETED_DEVICE_FAMILY = "1,2";
var shareMenuFolder = "ShareMenu";
function addShareMenuExtensionTarget(proj, appName, options, sourceDir) {
    return __awaiter(this, void 0, void 0, function () {
        var iosPath, devTeam, bundleIdentifier, bundleVersion, bundleShortVersion, iPhoneDeploymentTarget, platformProjectRoot, projPath, extFiles, i, extFile, targetFile, targetUuid, groupName;
        return __generator(this, function (_a) {
            iosPath = options.iosPath, devTeam = options.devTeam, bundleIdentifier = options.bundleIdentifier, bundleVersion = options.bundleVersion, bundleShortVersion = options.bundleShortVersion, iPhoneDeploymentTarget = options.iPhoneDeploymentTarget, platformProjectRoot = options.platformProjectRoot;
            projPath = "".concat(iosPath, "/").concat(appName, ".xcodeproj/project.pbxproj");
            console.log("\treact-native-share-menu-expo-plugin: ".concat(projPath));
            extFiles = [
                "ShareMenu.entitlements",
                "Info.plist",
                "MainInterface.storyboard",
            ];
            //   /* COPY OVER EXTENSION FILES */
            fs.mkdirSync("".concat(iosPath, "/").concat(shareMenuFolder), { recursive: true });
            for (i = 0; i < extFiles.length; i++) {
                extFile = extFiles[i];
                targetFile = "".concat(iosPath, "/").concat(shareMenuFolder, "/").concat(extFile);
                (0, util_1.copyFileSync)("".concat(sourceDir).concat(extFile), targetFile);
            }
            targetUuid = proj.generateUuid();
            groupName = "group.".concat(bundleIdentifier);
            console.log("\treact-native-share-menu-expo-plugin: ".concat(targetUuid));
            // // Add XCConfigurationList
            // const xCConfigurationList = addXCConfigurationList(proj, {
            //   shareMenuFolder,
            //   shareMenuBundleIdentifier: bundleIdentifier,
            //   shareMenuName: shareMenuFolder,
            //   devTeam,
            // });
            // // Add product file
            // const productFile = addProductFile(proj, shareMenuFolder, groupName);
            // // Add target
            // const target = addToPbxNativeTargetSection(proj, {
            //   shareMenuFolder,
            //   targetUuid,
            //   productFile,
            //   xCConfigurationList,
            // });
            // // Add target to PBX project section
            // addToPbxProjectSection(proj, target);
            // // Add target dependency
            // addTargetDependency(proj, target);
            // // Add build phases
            // addBuildPhases(proj, { groupName, productFile, targetUuid });
            // // Add PBXGroup
            // addPbxGroup(proj, { appName, shareMenuFolder, platformProjectRoot });
            return [2 /*return*/, true];
        });
    });
}
exports.addShareMenuExtensionTarget = addShareMenuExtensionTarget;
