import { XcodeProject } from "@expo/config-plugins";

import { PBXFile, quoted } from "./util";

export default function addToPbxNativeTargetSection(
  proj: XcodeProject,
  {
    shareMenuFolder,
    targetUuid,
    productFile,
    xCConfigurationList,
  }: {
    shareMenuFolder: string;
    targetUuid: string;
    productFile: PBXFile;
    xCConfigurationList: any;
  }
) {
  const target = {
    uuid: targetUuid,
    pbxNativeTarget: {
      isa: "PBXNativeTarget",
      name: shareMenuFolder,
      productName: shareMenuFolder,
      productReference: productFile.fileRef,
      productType: quoted("com.apple.product-type.app-extension"),
      buildConfigurationList: xCConfigurationList.uuid,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
    },
  };

  proj.addToPbxNativeTargetSection(target);

  // console.log(`Added PBXNativeTarget ${target.uuid}`);

  return target;
}
