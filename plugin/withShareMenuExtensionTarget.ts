import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";

import * as fs from "fs";
import * as path from "path";
import { copyFileSync } from "./util";
import { ShareMenuOptions, SHARE_EXT_NAME } from "./withShareMenuIos";

export const withShareMenuExtensionTarget: ConfigPlugin<ShareMenuOptions> = (
  config,
  options
) => {
  return withXcodeProject(config, (config) => {
    const appIdentifier = config.ios?.bundleIdentifier!;
    const shareExtensionIdentifier = `${appIdentifier}.${SHARE_EXT_NAME.toLowerCase()}`;

    const shareMenuFolder = SHARE_EXT_NAME;
    const STORYBOARD_NAME = `MainInterface.storyboard`;
    const iosPath = config.modRequest.platformProjectRoot;
    const sourceDir = `${iosPath}/../../../packages/react-native-share-menu/build/extensionFiles/`;

    const extFiles = [STORYBOARD_NAME, `${SHARE_EXT_NAME}-Bridging-Header.h`];

    /* COPY OVER EXTENSION FILES */
    fs.mkdirSync(`${iosPath}/${shareMenuFolder}`, { recursive: true });

    for (let i = 0; i < extFiles.length; i++) {
      const extFile = extFiles[i];
      const targetFile = `${iosPath}/${shareMenuFolder}/${extFile}`;
      copyFileSync(path.join(sourceDir, extFile), targetFile);
    }

    const proj = config.modResults;

    const shareMenuKey = proj.pbxCreateGroup(SHARE_EXT_NAME, SHARE_EXT_NAME);

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = proj.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (groups[key].name === undefined) {
        proj.addToPbxGroup(shareMenuKey, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    var projObjects = proj.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // TODO safety mechanism if target already exists, do we want to delete it before starting, etc
    // if (!!proj.pbxTargetByName(SHARE_EXT_NAME)) {
    //   console.log(`\t${SHARE_EXT_NAME} already exists in project. Skipping...`);
    //   return;
    // }

    // Adds the PBXNativeTarget to the project
    const target = proj.addTarget(
      SHARE_EXT_NAME,
      "app_extension",
      SHARE_EXT_NAME,
      shareExtensionIdentifier
    );

    // TODO not sure if this matters? but it's missing from PBXBuildFile for ShareMenu.appex
    // /* ShareMenu.appex */; settings = {ATTRIBUTES = (RemoveHeadersOnCopy, ); }; };

    const buildPath = `"$(CONTENTS_FOLDER_PATH)/${SHARE_EXT_NAME}"`;

    // Add Shell build phase for check pods manifest
    proj.addBuildPhase(
      [],
      "PBXShellScriptBuildPhase",
      "[CP] Check Pods Manifest.lock",
      target.uuid,
      {
        inputPaths: [
          `"\${PODS_PODFILE_DIR_PATH}/Podfile.lock"`,
          `"\${PODS_ROOT}/Manifest.lock"`,
        ],
        outputPaths: [
          `"\$(DERIVED_FILE_DIR)/Pods-${SHARE_EXT_NAME}-checkManifestLockResult.txt"`,
        ],
        shellPath: "/bin/sh",
        shellScript: `"\"diff \"\${PODS_PODFILE_DIR_PATH}/Podfile.lock\" \"\${PODS_ROOT}/Manifest.lock\" > /dev/null\\nif [ $? != 0 ] ; then\\n    # print error to STDERR\\n    echo \"error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.\" >&2\\n    exit 1\\nfi\\n# This output is used by Xcode 'outputs' to avoid re-running this script phase.\\necho \"SUCCESS\" > \"\${SCRIPT_OUTPUT_FILE_0}\"\\n"`,
      },
      buildPath
    );

    // Build ShareViewController.swift in our extension target
    proj.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);

    // Build phase for the MainInterface.storyboard in extension
    proj.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);

    // Build phase for Framework
    proj.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      target.uuid
    );
    proj.addFramework(`libPods-${SHARE_EXT_NAME}.a`, { target: target.uuid });

    // Add Shell build phase for copy pods resources
    proj.addBuildPhase(
      [],
      "PBXShellScriptBuildPhase",
      "[CP] Copy Pods Resources",
      target.uuid,
      {
        inputPaths: [
          `"\${PODS_ROOT}/Target Support Files/Pods-${SHARE_EXT_NAME}/Pods-${SHARE_EXT_NAME}-resources.sh"`,
          `"\${PODS_CONFIGURATION_BUILD_DIR}/React-Core/AccessibilityResources.bundle"`,
        ],
        outputPaths: [
          `"\${TARGET_BUILD_DIR}/\${UNLOCALIZED_RESOURCES_FOLDER_PATH}/AccessibilityResources.bundle"`,
        ],
        shellPath: "/bin/sh",
        shellScript: `"\${PODS_ROOT}/Target Support Files/Pods-${SHARE_EXT_NAME}/Pods-${SHARE_EXT_NAME}-resources.sh"\n"`,
      },
      buildPath
    );

    // Add non source/resource files to the group (info plist, bridging header, entitlements)
    const PLIST_NAME = `${SHARE_EXT_NAME}-Info.plist`;
    const BRIDGING_HEADER_NAME = `${SHARE_EXT_NAME}-Bridging-Header.h`;
    const ENTITLEMENTS_NAME = `${SHARE_EXT_NAME}.entitlements`;

    const infoPlistPath = path.join(shareMenuFolder, PLIST_NAME);
    const bridgingHeaderPath = path.join(shareMenuFolder, BRIDGING_HEADER_NAME);
    const entitlementsPath = path.join(shareMenuFolder, ENTITLEMENTS_NAME);
    const storyboardPath = path.join(STORYBOARD_NAME);

    proj.addFile(ENTITLEMENTS_NAME, shareMenuKey);
    proj.addFile(PLIST_NAME, shareMenuKey);
    proj.addFile(BRIDGING_HEADER_NAME, shareMenuKey);

    // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase
    const shareViewControllerPath = path.join(
      "../../",
      options.nodeModulesDir,
      "ios/ShareViewController.swift"
    );
    // ENABLE-CUSTOM-UI
    // const reactShareViewControllerPath = path.join(
    //   '../../',
    //   options.nodeModulesDir,
    //   'ios/ReactShareViewController.swift',
    // );

    proj.addSourceFile(
      shareViewControllerPath,
      { target: target.uuid },
      shareMenuKey
    );
    // ENABLE-CUSTOM-UI
    // proj.addSourceFile(
    //   reactShareViewControllerPath,
    //   { target: target.uuid },
    //   shareMenuKey,
    // );

    //  Add the resource file and include it into the target PbxResourcesBuildPhase and PbxGroup
    proj.addResourceFile(
      storyboardPath,
      {
        target: target.uuid,
        lastKnownFileType: "file.storyboard",
      },
      shareMenuKey
    );

    // TODO figure this one out - although end result didn't seem to be necessary
    // this was to mimic the manual by hand changes
    // const variantKey = proj.pbxCreateVariantGroup(STORYBOARD_NAME)
    // proj.addToPbxVariantGroup(resourceFile, variantKey);
    // proj.addToPbxVariantGroup(resourceFile, shareMenuKey);

    const currentProjectVersion = config.ios!.buildNumber || "1";
    const marketingVersion = config.version!;
    var configurations = proj.pbxXCBuildConfigurationSection();

    for (var key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        var buildSettingsObj = configurations[key].buildSettings;
        if (
          typeof buildSettingsObj["PRODUCT_NAME"] !== "undefined" &&
          buildSettingsObj["PRODUCT_NAME"] === `"${SHARE_EXT_NAME}"`
        ) {
          buildSettingsObj["DEVELOPMENT_TEAM"] = options.devTeam;
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
        }
      }
    }

    // This should be handled by EAS itself?
    // Add development teams to both app and share extension targets
    // proj.addTargetAttribute('DevelopmentTeam', options.devTeam);

    // TODO unsure how to add it to the share extension target
    // proj.addTargetAttribute(
    //   "DevelopmentTeam",
    //   options.devTeam,
    //   target.uuid
    // );
    return config;
  });
};
