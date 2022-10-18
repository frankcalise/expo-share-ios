import {
  ConfigPlugin,
  withAppDelegate,
  withXcodeProject,
  XcodeProject,
} from "@expo/config-plugins";
import plist from "@expo/plist";
import {
  mergeContents,
  MergeResults,
  removeContents,
} from "@expo/config-plugins/build/utils/generateCode";
import {
  InfoPlist,
  withEntitlementsPlist,
  withDangerousMod,
  withInfoPlist,
} from "@expo/config-plugins";
import xcode from "xcode";
import * as fs from "fs";
import * as path from "path";
import { withShareMenuAndroid } from "./withShareMenuAndroid";
import { ExpoConfig } from "@expo/config-types";

// types
export type ShareMenuPluginProps = {
  // (iOS only) Environment name and bundle identifier
  devTeam: string;
  iPhoneDeploymentTarget: string;
};

type PluginOptions = {
  iosPath: string;
  devTeam?: string;
  bundleVersion?: string;
  bundleShortVersion?: string;
  bundleIdentifier?: string;
  iPhoneDeploymentTarget?: string;
};

// constants
const IPHONEOS_DEPLOYMENT_TARGET = "12.4";
const TARGETED_DEVICE_FAMILY = "1,2";
const NSE_TARGET_NAME = "ShareMenu";
const SHARE_MENU_TAG = "react-native-share-menu";
// TODO make anchor take in the project name
const IOS_HAS_SHARE_MENU_TARGET = /target 'ExpoPlistShare' do/gm;
const IOS_INSTALLER_ANCHOR =
  /__apply_Xcode_12_5_M1_post_install_workaround\(installer\)/gm;
// TODO make anchor take in the project name
const IOS_MAIN_TARGET_ANCHOR = /target 'ExpoPlist' do/gm;

// helpers
export function getProjectShareMenuName(name: string) {
  return `${name}`;
}

/** Create a namespaced tag */
const tag = (s: string) => `${SHARE_MENU_TAG}-${s}`;

/** Grab the last merge results operation */
const last = (arr: MergeResults[]): MergeResults => {
  const l = arr[arr.length - 1];
  if (typeof l === "undefined") {
    throw new Error(
      "No prior results. This is a bug in expo-community-flipper and should be reported"
    );
  }
  return l;
};

/** Indent code, making generated podfile changes a bit more readable */
const indent = (block: string | string[], size: number) => {
  return (typeof block === "string" ? block.split("\n") : block)
    .map((s) => `${" ".repeat(size)}${s}`)
    .join("\n");
};

/** Removes content by its tag */
const removeTaggedContent = (contents: string, ns: string) => {
  return removeContents({ src: contents, tag: tag(ns) });
};

// main plugin
const withReactNativeShareMenu: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  props
) => {
  config = withShareMenuAndroid(config, props);
  config = withShareMenuIos(config, props);

  return config;
};

const withShareMenuIos: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  props
) => {
  // main iOS target
  config = withShareMenuEntitlements(config);
  config = withShareMenuInfoPlist(config);
  // config = withShareMenuPodfile(config);
  config = withShareMenuAppDelegate(config);

  // share extension target
  config = withShareMenuExtensionTarget(config, props);
  // config = withShareMenuExtensionEntitlements(config);
  // config = withShareMenuExtensionInfoPlist(config);

  return config;
};

const withShareMenuExtensionTarget: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  shareMenuProps
) => {
  return withXcodeProject(config, async (config) => {
    const options: PluginOptions = {
      iosPath: config.modRequest.platformProjectRoot,
      bundleIdentifier: config.ios?.bundleIdentifier,
      devTeam: shareMenuProps?.devTeam,
      bundleVersion: config.ios?.buildNumber,
      bundleShortVersion: config?.version,
      iPhoneDeploymentTarget: shareMenuProps?.iPhoneDeploymentTarget,
    };

    // support for monorepos where node_modules can be up to 5 parents
    // above the project directory.
    // let dir = "node_modules";
    // for (let x = 0; x < 5 && !FileManager.dirExists(dir); x++) {
    //   dir = "../" + dir;
    // }
    addShareMenuExtension(
      config.modRequest.projectName || "",
      options,
      "./extensionFiles"
    );

    return config;
  });
};

const addShareMenuExtension = (
  appName: string,
  options: PluginOptions,
  sourceDir: string
) => {
  const {
    iosPath,
    devTeam,
    bundleIdentifier,
    bundleVersion,
    bundleShortVersion,
    iPhoneDeploymentTarget,
  } = options;
  const projPath = `${iosPath}/${appName}.xcodeproj/project.pbxproj`;
  console.log(`\treact-native-share-menu-expo-plugin: ${projPath}`);

  const extFiles = ["ShareMenu.entitlements", `Info.plist`];

  const xcodeProject = xcode.project(projPath);

  // xcodeProject.parse(async function (err: Error) {
  //   if (err) {
  //     console.log(`\tError parsing iOS project: ${JSON.stringify(err)}`);
  //     return;
  //   }

  //   /* COPY OVER EXTENSION FILES */
  //   fs.mkdirSync(`${iosPath}/${NSE_TARGET_NAME}`, { recursive: true });

  //   for (let i = 0; i < extFiles.length; i++) {
  //     const extFile = extFiles[i];
  //     const targetFile = `${iosPath}/${NSE_TARGET_NAME}/${extFile}`;
  //     await FileManager.copyFile(`${sourceDir}${extFile}`, targetFile);
  //   }

  //   // will happen in withShareMenuIos following withShareMenuExtensionTarget
  //   // /* MODIFY COPIED EXTENSION FILES */
  //   // const nseUpdater = new NseUpdaterManager(iosPath);
  //   // await nseUpdater.updateNSEEntitlements(
  //   //   `group.${bundleIdentifier}.onesignal`
  //   // );
  //   // await nseUpdater.updateNSEBundleVersion(
  //   //   bundleVersion ?? DEFAULT_BUNDLE_VERSION
  //   // );
  //   // await nseUpdater.updateNSEBundleShortVersion(
  //   //   bundleShortVersion ?? DEFAULT_BUNDLE_SHORT_VERSION
  //   // );

  //   // Create new PBXGroup for the extension
  //   const extGroup = xcodeProject.addPbxGroup(
  //     extFiles,
  //     NSE_TARGET_NAME,
  //     NSE_TARGET_NAME
  //   );

  //   // Add the new PBXGroup to the top level group. This makes the
  //   // files / folder appear in the file explorer in Xcode.
  //   const groups = xcodeProject.hash.project.objects["PBXGroup"];
  //   Object.keys(groups).forEach(function (key) {
  //     if (groups[key].name === undefined) {
  //       xcodeProject.addToPbxGroup(extGroup.uuid, key);
  //     }
  //   });

  //   // WORK AROUND for codeProject.addTarget BUG
  //   // Xcode projects don't contain these if there is only one target
  //   // An upstream fix should be made to the code referenced in this link:
  //   //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
  //   const projObjects = xcodeProject.hash.project.objects;
  //   projObjects["PBXTargetDependency"] =
  //     projObjects["PBXTargetDependency"] || {};
  //   projObjects["PBXContainerItemProxy"] =
  //     projObjects["PBXTargetDependency"] || {};

  //   if (!!xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
  //     throw new Error(
  //       `${NSE_TARGET_NAME} already exists in project. Skipping...`
  //     );
  //   }

  //   // Add the NSE target
  //   // This adds PBXTargetDependency and PBXContainerItemProxy for you
  //   const nseTarget = xcodeProject.addTarget(
  //     NSE_TARGET_NAME,
  //     "app_extension",
  //     NSE_TARGET_NAME,
  //     `${bundleIdentifier}.${NSE_TARGET_NAME}`
  //   );

  //   // Add build phases to the new target
  //   xcodeProject.addBuildPhase(
  //     ["NotificationService.m"],
  //     "PBXSourcesBuildPhase",
  //     "Sources",
  //     nseTarget.uuid
  //   );
  //   xcodeProject.addBuildPhase(
  //     [],
  //     "PBXResourcesBuildPhase",
  //     "Resources",
  //     nseTarget.uuid
  //   );

  //   xcodeProject.addBuildPhase(
  //     [],
  //     "PBXFrameworksBuildPhase",
  //     "Frameworks",
  //     nseTarget.uuid
  //   );

  //   // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
  //   // However, can be more
  //   const configurations = xcodeProject.pbxXCBuildConfigurationSection();
  //   for (const key in configurations) {
  //     if (
  //       typeof configurations[key].buildSettings !== "undefined" &&
  //       configurations[key].buildSettings.PRODUCT_NAME == `"${NSE_TARGET_NAME}"`
  //     ) {
  //       const buildSettingsObj = configurations[key].buildSettings;
  //       buildSettingsObj.DEVELOPMENT_TEAM = devTeam;
  //       buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
  //         iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
  //       buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
  //       buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NSE_TARGET_NAME}/${NSE_TARGET_NAME}.entitlements`;
  //       buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
  //     }
  //   }

  //   // Add development teams to both your target and the original project
  //   xcodeProject.addTargetAttribute("DevelopmentTeam", devTeam, nseTarget);
  //   xcodeProject.addTargetAttribute("DevelopmentTeam", devTeam);

  //   fs.writeFileSync(projPath, xcodeProject.writeSync());
  // });
};

// this gives TS error? change to function signature
// const addShareMenuAppDelegateImport: MergeResults = (src: string) => {
function addShareMenuAppDelegateImport(src: string): MergeResults {
  return mergeContents({
    tag: "Import",
    src,
    newSrc: "#import <RNShareMenu/ShareMenuManager.h>",
    anchor: /#import <React\/RCTAppSetupUtils\.h>/,
    offset: 1,
    comment: "//",
  });
}

function addShareMenuAppDelegateLinkingAPI(src: string): MergeResults {
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
  const findString =
    "return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];";
  const replaceString =
    "return [ShareMenuManager application:application openURL:url options:options];";

  return {
    contents: src.replace(findString, replaceString),
    didClear: false,
    didMerge: true,
  };
}

const withShareMenuAppDelegate: ConfigPlugin = (config) => {
  return withAppDelegate(config, (config) => {
    if (["objc", "objcpp"].includes(config.modResults.language)) {
      try {
        config.modResults.contents = addShareMenuAppDelegateImport(
          config.modResults.contents
        ).contents;
        config.modResults.contents = addShareMenuAppDelegateLinkingAPI(
          config.modResults.contents
        ).contents;
      } catch (error: any) {
        if (error.code === "ERR_NO_MATCH") {
          throw new Error(
            `Cannot add Share Menu to the project's AppDelegate because it's malformed. Please report this with a copy of your project AppDelegate.`
          );
        }
        throw error;
      }
    } else {
      throw new Error(
        "Cannot setup Share Menu because the AppDelegate is not Objective C"
      );
    }
    return config;
  });
};

const withShareMenuEntitlements: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [
      `group.${config?.ios?.bundleIdentifier || ""}.sharemenu`,
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

const withShareMenuPodfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      const contents = fs.readFileSync(filePath, "utf-8");

      // We cannot tell if a merge failed because of a malformed Podfile or it was a noop
      // so instead, remove the content first, then attempt the insert
      const results: MergeResults[] = [];
      results.push(removeTaggedContent(contents, "BuildSettings"));
      results.push(removeTaggedContent(contents, "ShareTarget"));

      // Check to see if it block already exists
      const preexisting = IOS_HAS_SHARE_MENU_TARGET.test(
        last(results).contents
      );

      if (!preexisting) {
        results.push(
          mergeContents({
            tag: tag("BuildSettings"),
            src: last(results).contents,
            newSrc: indent(
              [
                "# Build settings for react-native-share-menu",
                "installer.pods_project.targets.each do |target|",
                "  target.build_configurations.each do |config|",
                "    config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'NO'",
                "  end",
                "end",
              ],
              4
            ),
            anchor: IOS_INSTALLER_ANCHOR,
            offset: 2,
            comment: "#",
          })
        );

        results.push(
          mergeContents({
            tag: tag("ShareTarget"),
            src: last(results).contents,
            newSrc: indent(
              [
                "target 'HelloWorldShare' do",
                "  use_react_native!",
                "",
                "  pod 'RNShareMenu', :path => '../node_modules/react-native-share-menu'",
                "end",
              ],
              0
            ),
            anchor: IOS_MAIN_TARGET_ANCHOR,
            offset: -1,
            comment: "#",
          })
        );
      }

      // couldn't remove and couldn't add. Treat the operation as failed
      if (!last(results).didMerge) {
        throw new Error(
          "Cannot add react-native-share-menu to the project's ios/Podfile. Please report this with a copy of your project Podfile. You can generate this with the `expo prebuild` command."
        );
      }

      fs.writeFileSync(filePath, last(results).contents);

      return config;
    },
  ]);
};

const withShareMenuExtensionEntitlements: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [
      `group.${config?.ios?.bundleIdentifier || ""}.sharemenu`,
    ];
    return config;
  });
};

const withShareMenuExtensionInfoPlist: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const shareMenuExtName = getProjectShareMenuName(
        config.modRequest.projectName!
      );
      const shareMenuRootPath = path.join(
        config.modRequest.platformProjectRoot,
        shareMenuExtName
      );
      const filePath = path.join(shareMenuRootPath, "Info.plist");

      const shareMenu: InfoPlist = {
        HostAppBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
        HostAppURLScheme: "$(PRODUCT_BUNDLE_IDENTIFIER)://",
        NSExtension: {
          NSExtensionAttributes: [
            {
              NSExtensionActivationRule: [
                { NSExtensionActivationSupportsText: true },
                { NSExtensionActivationSupportsWebURLWithMaxCount: 1 },
              ],
            },
          ],
        },
      };

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, plist.build(shareMenu));

      return config;
    },
  ]);
};

export default withReactNativeShareMenu;

class FileManager {
  static async readFile(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
        if (err || !data) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  static async writeFile(path: string, contents: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, contents, "utf8", (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  static async copyFile(path1: string, path2: string): Promise<void> {
    const fileContents = await FileManager.readFile(path1);
    await FileManager.writeFile(path2, fileContents);
  }

  static dirExists(path: string): boolean {
    return fs.existsSync(path);
  }
}
