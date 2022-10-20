import { XcodeProject } from "@expo/config-plugins";

import { quoted } from "./util";

export default function (
  proj: XcodeProject,
  {
    shareMenuFolder,
    shareMenuBundleIdentifier,
    shareMenuName,
    devTeam,
  }: {
    shareMenuFolder: string;
    shareMenuBundleIdentifier: string;
    shareMenuName: string;
    devTeam: string;
  }
) {
  const buildSettings: any = {
    CLANG_ANALYZER_NONNULL: "YES",
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
    CLANG_CXX_LANGUAGE_STANDARD: quoted("gnu++20"),
    CLANG_ENABLE_MODULES: "YES",
    CLANG_ENABLE_OBJC_WEAK: "YES",
    CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
    CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
    CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
    CODE_SIGN_ENTITLEMENTS: `${shareMenuFolder}/${shareMenuFolder}.entitlements`,
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: "1",
    DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
    DEVELOPMENT_TEAM: devTeam,
    GCC_C_LANGUAGE_STANDARD: "gnu11",
    GENERATE_INFOPLIST_FILE: "YES",
    INFOPLIST_FILE: `${shareMenuFolder}/Info.plist`,
    INFOPLIST_KEY_CFBundleDisplayName: shareMenuName,
    IPHONEOS_DEPLOYMENT_TARGET: "12.4",
    LD_RUNPATH_SEARCH_PATHS: quoted(
      "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"
    ),
    MARKETING_VERSION: "1.0",
    MTL_FAST_MATH: "YES",
    OTHER_SWIFT_FLAGS: quoted("$(inherited) -D EXPO_CONFIGURATION_RELEASE"),
    PRODUCT_BUNDLE_IDENTIFIER: shareMenuBundleIdentifier,
    PRODUCT_NAME: quoted(shareMenuName),
    SKIP_INSTALL: "YES",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_OBJC_BRIDGING_HEADER: quoted(
      `${shareMenuFolder}/${shareMenuFolder}-Bridging-Header.h`
    ),
    SWIFT_OPTIMIZATION_LEVEL: quoted("-Owholemodule"),
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: quoted("1,2"),
  };

  const debugBuildSettings: any = {
    COPY_PHASE_STRIP: "NO",
    DEBUG_INFORMATION_FORMAT: "dwarf",
    MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
    OTHER_SWIFT_FLAGS: quoted("$(inherited) -D EXPO_CONFIGURATION_DEBUG"),
    SWIFT_OPTIMIZATION_LEVEL: quoted("-Onone"),
    SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
  };

  const buildConfigurationsList = [
    {
      name: "Debug",
      isa: "XCBuildConfiguration",
      buildSettings: {
        ...buildSettings,
        ...debugBuildSettings,
      },
    },
    {
      name: "Release",
      isa: "XCBuildConfiguration",
      buildSettings: {
        ...buildSettings,
      },
    },
  ];

  const xCConfigurationList = proj.addXCConfigurationList(
    buildConfigurationsList,
    "Release",
    `Build configuration list for PBXNativeTarget ${quoted(shareMenuFolder)} `
  );

  // console.log(`Added XCConfigurationList ${xCConfigurationList.uuid}`);

  return xCConfigurationList;
}
