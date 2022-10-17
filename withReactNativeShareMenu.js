"use strict";
exports.__esModule = true;
var config_plugins_1 = require("@expo/config-plugins");
var withReactNativeShareMenu = function (expoConfig) {
    return withShareMenuEntitlements(expoConfig);
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
exports["default"] = withReactNativeShareMenu;
