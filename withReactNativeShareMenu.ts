import type { ConfigPlugin } from "@expo/config-plugins";
import {
  withAndroidManifest,
  withEntitlementsPlist,
} from "@expo/config-plugins";

const withReactNativeShareMenu: ConfigPlugin = (expoConfig) => {
  return withShareMenuEntitlements(expoConfig);
};
// withAndroidManifest(expoConfig, async (modConfig) => {
//   let androidManifest = modConfig.modResults.manifest;

//   androidManifest.application.ac

//   return modConfig;
// }

const withShareMenuEntitlements: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [
      "group.com.frankcalise.MYGROUPNAME",
    ];
    return config;
  });
};

export default withReactNativeShareMenu;
