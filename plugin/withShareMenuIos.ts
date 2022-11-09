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
const IOS_HAS_SHARE_MENU_TARGET = (shareTarget: string) =>
  new RegExp(`target '${shareTarget}' do`, "gm");
const IOS_INSTALLER_ANCHOR =
  /__apply_Xcode_12_5_M1_post_install_workaround\(installer\)/gm;
const IOS_MAIN_TARGET_ANCHOR = (mainTarget: string) =>
  new RegExp(`target '${mainTarget}' do`, "gm");

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

export interface ShareMenuOptions extends ShareMenuPluginProps {
  nodeModulesDir: string;
  shareScheme: string;
}

export const withShareMenuIos: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  props
) => {
  // Support for monorepos where node_modules/react-native-share-menu
  // can be up to 5 parents above the project directory.
  let nodeModulesDir = "node_modules/react-native-share-menu";
  for (let x = 0; x < 5 && !fs.existsSync(nodeModulesDir); x++) {
    nodeModulesDir = "../" + nodeModulesDir;
  }

  // build share scheme
  const appIdentifier = config.ios?.bundleIdentifier!;
  const appScheme = config.scheme || appIdentifier;
  const shareScheme = `${appScheme}.share`;

  const options = {
    ...props,
    shareTarget: props.shareTarget ?? SHARE_EXT_NAME,
    nodeModulesDir,
    shareScheme,
  };

  // main iOS target
  config = withShareMenuEntitlements(config);
  config = withShareMenuInfoPlist(config, options);
  config = withShareMenuPodfile(config, options);
  config = withShareMenuAppDelegate(config, options);

  // share extension target
  config = withShareMenuExtensionTarget(config, options);
  config = withShareMenuExtensionEntitlements(config);
  config = withShareMenuExtensionInfoPlist(config, options);

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

function addShareMenuAppDelegateLinkingAPI(
  src: string,
  scheme: string
): MergeResults {
  return mergeContents({
    tag: "LinkingAPI",
    src,
    newSrc: `if ([[url absoluteString] hasPrefix:@"${scheme}"]) {\n\t\treturn [super application:application openURL:url options:options] || [ShareMenuManager application:application openURL:url options:options];\n\t}`,
    anchor:
      /return \[super application:application openURL:url options:options\] \|\| \[RCTLinkingManager application:application openURL:url options:options\];/gm,
    offset: 0,
    comment: "//",
  });

  // Obviously fragile - need AppDelegate proxy via wrapper package?
  // https://docs.expo.dev/guides/config-plugins/#ios-app-delegate

  // Although this method seems to be used here
  // https://github.com/bndkt/react-native-app-clip/blob/main/src/withAppClipAppDelegate.ts#L65
  // const findString =
  //   "return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];"
  // const replaceString = `if ([[url absoluteString] hasPrefix:@"${scheme}"]) {\n\t\treturn [super application:application openURL:url options:options] || [ShareMenuManager application:application openURL:url options:options];\n\t}\n\treturn [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];\n`

  // return {
  //   contents: src.replace(findString, replaceString),
  //   didClear: false,
  //   didMerge: true,
  // }
}

const withShareMenuAppDelegate: ConfigPlugin<ShareMenuOptions> = (
  config,
  options
) => {
  return withAppDelegate(config, (config) => {
    if (["objc", "objcpp"].includes(config.modResults.language)) {
      try {
        config.modResults.contents = addShareMenuAppDelegateImport(
          config.modResults.contents
        ).contents;
        config.modResults.contents = addShareMenuAppDelegateLinkingAPI(
          config.modResults.contents,
          options.shareScheme
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

const withShareMenuInfoPlist: ConfigPlugin<ShareMenuOptions> = (
  config,
  options
) => {
  return withInfoPlist(config, (config) => {
    const shareScheme = {
      CFBundleTypeRole: "editor",
      CFBundleURLSchemes: [`${options.shareScheme}`],
    };

    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // assign the share scheme to the first index of this plist array
    // must be that way as per the docs (https://github.com/meedan/react-native-share-menu/blob/master/IOS_INSTRUCTIONS.md)
    // do a find for "Add the following to your app's Info.plist"
    // due to this native line of code https://github.com/meedan/react-native-share-menu/blob/master/ios/Modules/ShareMenu.swift#L73
    config.modResults.CFBundleURLTypes.splice(0, 0, shareScheme);

    return config;
  });
};

const withShareMenuPodfile: ConfigPlugin<ShareMenuOptions> = (
  config,
  props
) => {
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
      const preexisting = IOS_HAS_SHARE_MENU_TARGET(props.shareTarget).test(
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
            offset: 1,
            comment: "#",
          })
        );

        // Path here adjusted for monorepo
        // single ../ up dir to account for ios folder plus any parent folders coming from nodeModulesDir
        results.push(
          mergeContents({
            tag: tag("ShareTarget"),
            src: last(results).contents,
            newSrc: indent(
              [
                `target '${SHARE_EXT_NAME}' do`,
                "  config = use_native_modules!",
                "",
                "  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']",
                "",
                "  # Flags change depending on the env values.",
                "  flags = get_default_flags()",
                "",
                "  use_react_native!(",
                "    :path => config[:reactNativePath],",
                "    :hermes_enabled => flags[:hermes_enabled] || podfile_properties['expo.jsEngine'] == 'hermes',",
                "    :fabric_enabled => flags[:fabric_enabled]",
                "  )",
                "",
                `  pod 'RNShareMenu', :path => '../${props.nodeModulesDir}'`,
                "end",
              ],
              0
            ),
            anchor: IOS_MAIN_TARGET_ANCHOR(config.modRequest.projectName || ""),
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

const withShareMenuExtensionInfoPlist: ConfigPlugin<ShareMenuOptions> = (
  config,
  options
) => {
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
        HostAppURLScheme: `${options.shareScheme}://`,
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
        // ENABLE-CUSTOM-UI
        // NSAppTransportSecurity: {
        //   NSAllowsArbitraryLoads: true,
        //   NSExceptionDomains: {
        //     localhost: {
        //       NSExceptionAllowsInsecureHTTPLoads: true,
        //     },
        //   },
        // },
        // ReactShareViewBackgroundColor: {
        //   Alpha: 1,
        //   Blue: 1,
        //   Green: 1,
        //   Red: 1,
        //   Transparent: false,
        // },
      };

      await fs.mkdirSync(path.dirname(filePath), { recursive: true });
      await fs.writeFileSync(filePath, plist.build(shareMenu));

      return config;
    },
  ]);
};
