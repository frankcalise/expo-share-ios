import { XcodeProject } from "@expo/config-plugins";

import { PBXFile, quoted } from "./util";

export default function addBuildPhases(
  proj: XcodeProject,
  {
    groupName,
    productFile,
    targetUuid,
  }: {
    groupName: string;
    productFile: PBXFile;
    targetUuid: string;
  }
) {
  const buildPath = quoted("$(CONTENTS_FOLDER_PATH)/ShareMenu");

  // Add shell script build phase "Start Packager"
  const { uuid: startPackagerShellScriptBuildPhaseUuid } = proj.addBuildPhase(
    [],
    "PBXShellScriptBuildPhase",
    "[CP] Copy Pods Resources",
    targetUuid,
    {
      shellPath: "/bin/sh",
      shellScript: `"\"\${PODS_ROOT}/Target Support Files/Pods-ShareMenu/Pods-ShareMenu-resources.sh\"\n"`,
    },
    buildPath
  );
  // console.log(`Added PBXShellScriptBuildPhase ${startPackagerShellScriptBuildPhaseUuid}`);

  // Sources build phase
  const { uuid: sourcesBuildPhaseUuid } = proj.addBuildPhase(
    ["ShareViewController.swift"],
    "PBXSourcesBuildPhase",
    groupName,
    targetUuid,
    "app_extension",
    buildPath
  );
  // console.log(`Added PBXSourcesBuildPhase ${sourcesBuildPhaseUuid}`);

  // Copy files build phase
  const { uuid: copyFilesBuildPhaseUuid } = proj.addBuildPhase(
    [productFile.path],
    "PBXCopyFilesBuildPhase",
    groupName,
    proj.getFirstTarget().uuid,
    "app_extension", // "app_extension" uses the same subfolder spec (16), app_clip does not exist in cordova-node-xcode yet,
    buildPath
  );
  // console.log(`Added PBXCopyFilesBuildPhase ${copyFilesBuildPhaseUuid}`);

  // Frameworks build phase
  const { uuid: frameworksBuildPhaseUuid } = proj.addBuildPhase(
    [],
    "PBXFrameworksBuildPhase",
    groupName,
    targetUuid,
    "app_extension",
    buildPath
  );
  // console.log(`Added PBXResourcesBuildPhase ${frameworksBuildPhaseUuid}`);

  // Resources build phase
  const { uuid: resourcesBuildPhaseUuid } = proj.addBuildPhase(
    ["MainInterface.storyboard"],
    "PBXResourcesBuildPhase",
    groupName,
    targetUuid,
    "app_extension",
    buildPath
  );
  // console.log(`Added PBXResourcesBuildPhase ${resourcesBuildPhaseUuid}`);

  // Add shell script build phase
  // const { uuid: bundleShellScriptBuildPhaseUuid } = proj.addBuildPhase(
  //   [],
  //   "PBXShellScriptBuildPhase",
  //   "Bundle React Native code and images",
  //   targetUuid,
  //   {
  //     shellPath: "/bin/sh",
  //     shellScript: `export NODE_BINARY=node\\n\\n# The project root by default is one level up from the ios directory\\nexport PROJECT_ROOT=\"$PROJECT_DIR\"/..\\n\\n\`node --print \"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\"\`\\n`,
  //   },
  //   buildPath
  // );
  // console.log(`Added PBXShellScriptBuildPhase ${bundleShellScriptBuildPhaseUuid}`);
}
