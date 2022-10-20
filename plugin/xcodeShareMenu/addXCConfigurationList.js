"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var util_1 = require("./util");
function default_1(proj, _a) {
    var shareMenuFolder = _a.shareMenuFolder, shareMenuBundleIdentifier = _a.shareMenuBundleIdentifier, shareMenuName = _a.shareMenuName, devTeam = _a.devTeam;
    var buildSettings = {
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: (0, util_1.quoted)("gnu++20"),
        CLANG_ENABLE_MODULES: "YES",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_ENTITLEMENTS: "".concat(shareMenuFolder, "/").concat(shareMenuFolder, ".entitlements"),
        CODE_SIGN_STYLE: "Automatic",
        CURRENT_PROJECT_VERSION: "1",
        DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
        DEVELOPMENT_TEAM: devTeam,
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        GENERATE_INFOPLIST_FILE: "YES",
        INFOPLIST_FILE: "".concat(shareMenuFolder, "/Info.plist"),
        INFOPLIST_KEY_CFBundleDisplayName: shareMenuName,
        IPHONEOS_DEPLOYMENT_TARGET: "12.4",
        LD_RUNPATH_SEARCH_PATHS: (0, util_1.quoted)("$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"),
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        OTHER_SWIFT_FLAGS: (0, util_1.quoted)("$(inherited) -D EXPO_CONFIGURATION_RELEASE"),
        PRODUCT_BUNDLE_IDENTIFIER: shareMenuBundleIdentifier,
        PRODUCT_NAME: (0, util_1.quoted)(shareMenuName),
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OBJC_BRIDGING_HEADER: (0, util_1.quoted)("".concat(shareMenuFolder, "/").concat(shareMenuFolder, "-Bridging-Header.h")),
        SWIFT_OPTIMIZATION_LEVEL: (0, util_1.quoted)("-Owholemodule"),
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: (0, util_1.quoted)("1,2")
    };
    var debugBuildSettings = {
        COPY_PHASE_STRIP: "NO",
        DEBUG_INFORMATION_FORMAT: "dwarf",
        MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
        OTHER_SWIFT_FLAGS: (0, util_1.quoted)("$(inherited) -D EXPO_CONFIGURATION_DEBUG"),
        SWIFT_OPTIMIZATION_LEVEL: (0, util_1.quoted)("-Onone"),
        SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG"
    };
    var buildConfigurationsList = [
        {
            name: "Debug",
            isa: "XCBuildConfiguration",
            buildSettings: __assign(__assign({}, buildSettings), debugBuildSettings)
        },
        {
            name: "Release",
            isa: "XCBuildConfiguration",
            buildSettings: __assign({}, buildSettings)
        },
    ];
    var xCConfigurationList = proj.addXCConfigurationList(buildConfigurationsList, "Release", "Build configuration list for PBXNativeTarget ".concat((0, util_1.quoted)(shareMenuFolder), " "));
    // console.log(`Added XCConfigurationList ${xCConfigurationList.uuid}`);
    return xCConfigurationList;
}
exports["default"] = default_1;
