"use strict";
exports.__esModule = true;
function addToPbxProjectSection(proj, target) {
    proj.addToPbxProjectSection(target);
    // console.log(`Added target to pbx project section ${target.uuid}`);
    // Add target attributes to project section
    if (!proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes
        .TargetAttributes) {
        proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes.TargetAttributes = {};
    }
    proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes.TargetAttributes[target.uuid] = {
        CreatedOnToolsVersion: "14.0"
    };
}
exports["default"] = addToPbxProjectSection;
