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
import { ShareMenuPluginProps } from "./withReactNativeShareMenu";
import { withShareMenuExtensionTarget } from "./withShareMenuExtensionTarget";

// constants
export const SHARE_EXT_NAME = "ShareMenu";
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

export const withShareMenuIos: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  props
) => {
  // main iOS target
  config = withShareMenuEntitlements(config);
  config = withShareMenuInfoPlist(config);
  config = withShareMenuPodfile(config);
  config = withShareMenuAppDelegate(config);

  // share extension target
  config = withShareMenuExtensionTarget(config, props);
  config = withShareMenuExtensionEntitlements(config);
  config = withShareMenuExtensionInfoPlist(config);

  return config;
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
      `group.${config?.ios?.bundleIdentifier || ""}`,
    ];
    return config;
  });
};

const withShareMenuInfoPlist: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    const plistItems = {
      CFBundleTypeRole: "editor",
      CFBundleURLSchemes: [`${config?.ios?.bundleIdentifier}`],
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
                `target '${SHARE_EXT_NAME}' do`,
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
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const shareMenuRootPath = path.join(
        config.modRequest.platformProjectRoot,
        SHARE_EXT_NAME
      );
      const filePath = path.join(
        shareMenuRootPath,
        `${SHARE_EXT_NAME}.entitlements`
      );

      const shareMenu: InfoPlist = {
        "com.apple.security.application-groups": [
          `group.${config?.ios?.bundleIdentifier || ""}`,
        ],
      };

      await fs.mkdirSync(path.dirname(filePath), { recursive: true });
      await fs.writeFileSync(filePath, plist.build(shareMenu));

      return config;
    },
  ]);
};

const withShareMenuExtensionInfoPlist: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const shareMenuRootPath = path.join(
        config.modRequest.platformProjectRoot,
        SHARE_EXT_NAME
      );
      const filePath = path.join(
        shareMenuRootPath,
        `${SHARE_EXT_NAME}-Info.plist`
      );
      const appIdentifier = config.ios?.bundleIdentifier!;

      const shareMenu: InfoPlist = {
        HostAppBundleIdentifier: `${appIdentifier}`,
        HostAppURLScheme: `${appIdentifier}://`,
        CFBundleDisplayName: `${
          config.modRequest.projectName || ""
        } ${SHARE_EXT_NAME}`,
        NSExtension: {
          NSExtensionAttributes: {
            NSExtensionActivationRule: {
              NSExtensionActivationSupportsText: true,
              NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            },
          },
          NSExtensionMainStoryboard: "MainInterface",
          NSExtensionPointIdentifier: "com.apple.share-services",
        },
      };

      await fs.mkdirSync(path.dirname(filePath), { recursive: true });
      await fs.writeFileSync(filePath, plist.build(shareMenu));

      return config;
    },
  ]);
};
