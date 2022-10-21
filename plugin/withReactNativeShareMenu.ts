import {
  ConfigPlugin,
  withAppDelegate,
  withXcodeProject,
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

import * as fs from "fs";
import * as path from "path";
import { withShareMenuAndroid } from "./withShareMenuAndroid";
import {
  addShareMenuExtensionTarget,
  PluginOptions,
} from "./xcodeShareMenu/addShareMenuExtensionTarget";
import { copyFileSync } from "./xcodeShareMenu/util";

// types
export type ShareMenuPluginProps = {
  // (iOS only) Environment name and bundle identifier
  devTeam: string;
  iPhoneDeploymentTarget: string;
};

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
  // config = withShareMenuExtensionEntitlements(config);
  config = withShareMenuExtensionTarget(config, props);
  // config = withShareMenuExtensionInfoPlist(config);

  return config;
};

const withShareMenuExtensionTarget: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  shareMenuProps
) => {
  return withXcodeProject(config, async (config) => {
    const extensionName = "ShareMenu";
    const appIdentifier = config.ios?.bundleIdentifier!;
    const shareExtensionIdentifier = `${appIdentifier}.${extensionName.toLowerCase()}`;

    // support for monorepos where node_modules can be up to 5 parents
    // above the project directory.
    // let dir = "node_modules";
    // for (let x = 0; x < 5 && !FileManager.dirExists(dir); x++) {
    //   dir = "../" + dir;
    // }
    // addShareMenuExtensionTarget(
    //   config,
    //   config.modRequest.projectName || "",
    //   options,
    //   `${config.modRequest.projectRoot}/plugin/extensionFiles/`
    // );

    const shareMenuFolder = "ShareMenu";
    const iosPath = config.modRequest.platformProjectRoot;
    const projPath = `${iosPath}/${extensionName}.xcodeproj/project.pbxproj`;
    const sourceDir = `${config.modRequest.projectRoot}/plugin/extensionFiles/`;
    console.log(`\treact-native-share-menu-expo-plugin: ${projPath}`);

    const extFiles = [
      "ShareMenu.entitlements",
      "ShareMenu-Info.plist",
      "MainInterface.storyboard",
      "ShareMenu-Bridging-Header.h",
    ];

    //   /* COPY OVER EXTENSION FILES */
    fs.mkdirSync(`${iosPath}/${shareMenuFolder}`, { recursive: true });

    for (let i = 0; i < extFiles.length; i++) {
      const extFile = extFiles[i];
      const targetFile = `${iosPath}/${shareMenuFolder}/${extFile}`;
      copyFileSync(path.join(sourceDir, extFile), targetFile);
    }

    const proj = config.modResults;

    // Create PBXGroup for the files within extension
    // const shareMenuKey = proj.pbxCreateGroup(extensionName, extensionName);
    // proj.addToPbxGroup(shareMenuKey);
    // const { uuid: shareMenuKey } = proj.addPbxGroup(
    //   [
    //     "ShareViewController.swift",
    //     "Info.plist",
    //     "MainInterface.storyboard",
    //     `${extensionName}.entitlements`,
    //     `${extensionName}-Bridging-Header.h`,
    //   ],
    //   shareMenuFolder,
    //   shareMenuFolder
    // );

    const { uuid: shareMenuKey } = proj.addPbxGroup(
      extFiles,
      "ShareMenu",
      "ShareMenu"
    );

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = proj.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (groups[key].name === undefined) {
        proj.addToPbxGroup(shareMenuKey, key);
      }
    });

    // Adds the PBXNativeTarget to the project
    const target = proj.addTarget(
      extensionName,
      "app_extension",
      extensionName
    );

    // add target attribute
    // proj.addTargetAttribute("RemoveHeadersOnCopy", "", target.uuid);
    const buildPath = `"$(CONTENTS_FOLDER_PATH)/ShareMenu"`;

    // Add Shell build phase for check pods manifest
    // proj.addBuildPhase(
    //   [],
    //   "PBXShellScriptBuildPhase",
    //   "[CP] Check Pods Manifest.lock",
    //   target.uuid,
    //   {
    //     shellPath: "/bin/sh",
    //     shellScript: `"\"diff \"\${PODS_PODFILE_DIR_PATH}/Podfile.lock\" \"\${PODS_ROOT}/Manifest.lock\" > /dev/null\\nif [ $? != 0 ] ; then\\n    # print error to STDERR\\n    echo \"error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.\" >&2\\n    exit 1\\nfi\\n# This output is used by Xcode 'outputs' to avoid re-running this script phase.\\necho \"SUCCESS\" > \"\${SCRIPT_OUTPUT_FILE_0}\"\\n"`,

    //     // shellScript: `"\"\${PODS_ROOT}/Target Support Files/Pods-ShareMenu/Pods-ShareMenu-resources.sh\"\n"`,
    //   },
    //   buildPath
    // );

    // Build ShareViewController.swift in our extension target
    proj.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);

    // Build phase for the MainInterface.storyboard in extension
    proj.addBuildPhase(
      ["MainInterface.storyboard"],
      "PBXResourcesBuildPhase",
      "Resources",
      target.uuid
    );

    // Build phase for Framework
    proj.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      target.uuid
    );
    proj.addFramework("libPods-ShareMenu.a", { target: target.uuid });

    // Add Shell build phase for copy pods resources
    // proj.addBuildPhase(
    //   [],
    //   "PBXShellScriptBuildPhase",
    //   "[CP] Copy Pods Resources",
    //   target.uuid,
    //   {
    //     shellPath: "/bin/sh",
    //     shellScript: `"\"\${PODS_ROOT}/Target Support Files/Pods-ShareMenu/Pods-ShareMenu-resources.sh\"\n"`,
    //   },
    //   buildPath
    // );

    // Add plist to the group
    // TODO bridging head here too?
    const infoPlistPath = path.join("ShareMenu-Info.plist");
    const bridgingHeaderPath = path.join(`${extensionName}-Bridging-Header.h`);
    const entitlementsPath = path.join(`${extensionName}.entitlements`);
    const storyboardPath = path.join(`MainInterface.storyboard`);
    // console.log(`\t!!!!react-native-share-menu-expo-plugin: ${infoPlistPath}`);
    // console.log(
    //   `\t!!!!react-native-share-menu-expo-plugin: ${bridgingHeaderPath}`
    // );
    // console.log(
    //   `\t!!!!react-native-share-menu-expo-plugin: ${entitlementsPath}`
    // );
    // proj.addResourceFile(infoPlistPath, shareMenuKey);
    // proj.addHeaderFile(bridgingHeaderPath, [], shareMenuKey);
    // proj.addFile(entitlementsPath, shareMenuKey);
    // proj.addFile(infoPlistPath, shareMenuKey);
    // proj.addFile(bridgingHeaderPath, shareMenuKey);

    // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase
    proj.addSourceFile(
      "../../node_modules/ios/ShareViewController.swift",
      { target: target.uuid },
      shareMenuKey
    );

    //  Add the resource file and include it into the target PbxResourcesBuildPhase and PbxGroup
    // proj.addResourceFile(storyboardPath, { target: target.uuid }, shareMenuKey);

    // proj.addSourceFile(
    //   "../../node_modules/react-native-share-menu/ios/ShareViewController.swift",
    //   { target: target.uuid },
    //   shareMenuKey
    // );
    // proj.addResourceFile(
    //   `${shareMenuFolder}/MainInterface.storyboard`,
    //   { variantGroup: true },
    //   shareMenuKey
    // );

    const currentProjectVersion = config.ios!.buildNumber || "1";
    const marketingVersion = config.version!;

    const configurations = proj.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        var buildSettingsObj = configurations[key].buildSettings;
        if (
          typeof buildSettingsObj["PRODUCT_NAME"] !== "undefined" &&
          buildSettingsObj["PRODUCT_NAME"] === `"$(TARGET_NAME)"`
        ) {
          buildSettingsObj["CLANG_ENABLE_MODULES"] = "YES";
          buildSettingsObj["INFOPLIST_FILE"] = `"${infoPlistPath}"`;
          buildSettingsObj["CODE_SIGN_ENTITLEMENTS"] = `"${entitlementsPath}"`;
          buildSettingsObj["CODE_SIGN_STYLE"] = "Automatic";
          buildSettingsObj[
            "CURRENT_PROJECT_VERSION"
          ] = `"${currentProjectVersion}"`;
          buildSettingsObj["GENERATE_INFOPLIST_FILE"] = "YES";
          buildSettingsObj["MARKETING_VERSION"] = `"${marketingVersion}"`;
          buildSettingsObj[
            "PRODUCT_BUNDLE_IDENTIFIER"
          ] = `"${shareExtensionIdentifier}"`;
          buildSettingsObj["SWIFT_EMIT_LOC_STRINGS"] = "YES";
          buildSettingsObj["SWIFT_VERSION"] = "5.0";
          buildSettingsObj["TARGETED_DEVICE_FAMILY"] = `"1,2"`;
          buildSettingsObj[
            "SWIFT_OBJ_BRIDGING_HEADER"
          ] = `"${bridgingHeaderPath}"`;
          // TODO add bridging header
        }
      }
    }

    return config;
  });
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
      const filePath = path.join(shareMenuRootPath, "ShareMenu-Info.plist");

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
