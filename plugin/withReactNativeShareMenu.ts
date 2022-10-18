import { ConfigPlugin, withAppDelegate } from "@expo/config-plugins";
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

import * as fs from "fs";
import * as path from "path";
import { withShareMenuAndroid } from "./withShareMenuAndroid";

// constants
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
const withReactNativeShareMenu: ConfigPlugin = (config, props) => {
  config = withShareMenuAndroid(config, props);
  config = withShareMenuIos(config, props);

  return config;
};

const withShareMenuIos: ConfigPlugin = (config, props) => {
  // main iOS target
  config = withShareMenuEntitlements(config);
  config = withShareMenuInfoPlist(config);
  // config = withShareMenuPodfile(config);
  config = withShareMenuAppDelegate(config);

  // share extension target
  // config = withShareMenuExtTarget(config);
  // config = withShareMenuExtEntitlements(config);
  // config = withShareMenuExtInfoPlist(config);

  return config;
};

// this gives TS error?
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

const withShareMenuExtEntitlements: ConfigPlugin = (config) => {
  return config;
};

const withShareMenuExtInfoPlist: ConfigPlugin = (config) => {
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
