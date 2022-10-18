import type { ConfigPlugin } from "@expo/config-plugins";
import plist from "@expo/plist";
import {
  withAndroidManifest,
  withEntitlementsPlist,
  InfoPlist,
  withDangerousMod,
  withInfoPlist,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

export function getProjectShareMenuName(name: string) {
  return `${name}`;
}

const withReactNativeShareMenu: ConfigPlugin = (config) => {
  config = withShareMenuEntitlements(config);
  config = withShareMenuInfoPlist(config);

  return config;
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

const withShareMenuInfoPlist: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    const plistItems = {
      CFBundleTypeRole: "editor",
      CFBundleURLSchemes: ["$(PRODUCT_BUNDLE_IDENTIFIER)"],
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

export default withReactNativeShareMenu;
