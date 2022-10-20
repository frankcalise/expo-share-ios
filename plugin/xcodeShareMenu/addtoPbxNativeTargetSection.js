"use strict";
exports.__esModule = true;
var util_1 = require("./util");
function addToPbxNativeTargetSection(proj, _a) {
    var shareMenuFolder = _a.shareMenuFolder, targetUuid = _a.targetUuid, productFile = _a.productFile, xCConfigurationList = _a.xCConfigurationList;
    var target = {
        uuid: targetUuid,
        pbxNativeTarget: {
            isa: "PBXNativeTarget",
            name: shareMenuFolder,
            productName: shareMenuFolder,
            productReference: productFile.fileRef,
            productType: (0, util_1.quoted)("com.apple.product-type.app-extension"),
            buildConfigurationList: xCConfigurationList.uuid,
            buildPhases: [],
            buildRules: [],
            dependencies: []
        }
    };
    proj.addToPbxNativeTargetSection(target);
    // console.log(`Added PBXNativeTarget ${target.uuid}`);
    return target;
}
exports["default"] = addToPbxNativeTargetSection;
