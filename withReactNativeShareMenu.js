"use strict";
exports.__esModule = true;
exports.getProjectShareMenuName = void 0;
var config_plugins_1 = require("@expo/config-plugins");
function getProjectShareMenuName(name) {
    return "".concat(name);
}
exports.getProjectShareMenuName = getProjectShareMenuName;
var withReactNativeShareMenu = function (config) {
    config = withShareMenuEntitlements(config);
    config = withShareMenuInfoPlist(config);
    return config;
};
// withAndroidManifest(expoConfig, async (modConfig) => {
//   let androidManifest = modConfig.modResults.manifest;
//   androidManifest.application.ac
//   return modConfig;
// }
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
