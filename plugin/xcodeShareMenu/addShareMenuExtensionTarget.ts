import { XcodeProject } from "@expo/config-plugins";
import { propertiesListToString } from "@expo/config-plugins/build/android/Properties";
import * as fs from "fs";
import addBuildPhases from "./addBuildPhases";
import addPbxGroup from "./addPbxGroup";
import addProductFile from "./addProductFile";
import addTargetDependency from "./addTargetDependency";
import addToPbxNativeTargetSection from "./addtoPbxNativeTargetSection";
import addToPbxProjectSection from "./addToPbxProjectSection";
import addXCConfigurationList from "./addXCConfigurationList";
import { copyFileSync } from "./util";

const IPHONEOS_DEPLOYMENT_TARGET = "12.4";
const TARGETED_DEVICE_FAMILY = "1,2";
const shareMenuFolder = "ShareMenu";

export type PluginOptions = {
  iosPath: string;
  devTeam?: string;
  bundleVersion?: string;
  bundleShortVersion?: string;
  bundleIdentifier?: string;
  iPhoneDeploymentTarget?: string;
  platformProjectRoot: string;
};

export async function addShareMenuExtensionTarget(
  proj: XcodeProject,
  appName: string,
  options: PluginOptions,
  sourceDir: string
) {
  const {
    iosPath,
    devTeam,
    bundleIdentifier,
    bundleVersion,
    bundleShortVersion,
    iPhoneDeploymentTarget,
    platformProjectRoot,
  } = options;
  const projPath = `${iosPath}/${appName}.xcodeproj/project.pbxproj`;
  console.log(`\treact-native-share-menu-expo-plugin: ${projPath}`);

  const extFiles = [
    "ShareMenu.entitlements",
    "Info.plist",
    "Base.lproj/MainInterface.storyboard",
  ];

  //   /* COPY OVER EXTENSION FILES */
  fs.mkdirSync(`${iosPath}/${shareMenuFolder}`, { recursive: true });
  fs.mkdirSync(`${iosPath}/${shareMenuFolder}/Base.lproj`, { recursive: true });

  for (let i = 0; i < extFiles.length; i++) {
    const extFile = extFiles[i];
    const targetFile = `${iosPath}/${shareMenuFolder}/${extFile}`;
    copyFileSync(`${sourceDir}${extFile}`, targetFile);
  }

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

  const targetUuid = proj.generateUuid();
  const groupName = `group.${bundleIdentifier}`;
  console.log(`\treact-native-share-menu-expo-plugin: ${targetUuid}`);

  // Add XCConfigurationList
  const xCConfigurationList = addXCConfigurationList(proj, {
    shareMenuFolder,
    shareMenuBundleIdentifier: bundleIdentifier,
    shareMenuName: shareMenuFolder,
    devTeam,
  });

  // Add product file
  const productFile = addProductFile(proj, shareMenuFolder, groupName);

  // Add target
  const target = addToPbxNativeTargetSection(proj, {
    shareMenuFolder,
    targetUuid,
    productFile,
    xCConfigurationList,
  });

  // Add target to PBX project section
  addToPbxProjectSection(proj, target);

  // Add target dependency
  addTargetDependency(proj, target);

  // Add build phases
  addBuildPhases(proj, { groupName, productFile, targetUuid });

  // Add PBXGroup
  addPbxGroup(proj, { appName, shareMenuFolder, platformProjectRoot });

  return true;

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
}
