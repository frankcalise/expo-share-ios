"use strict";
exports.__esModule = true;
function addTargetDependency(proj, target) {
    if (!proj.hash.project.objects["PBXTargetDependency"]) {
        proj.hash.project.objects["PBXTargetDependency"] = {};
    }
    if (!proj.hash.project.objects["PBXContainerItemProxy"]) {
        proj.hash.project.objects["PBXContainerItemProxy"] = {};
    }
    proj.addTargetDependency(proj.getFirstTarget().uuid, [target.uuid]);
    // console.log(`Added target dependency for target ${target.uuid}`);
}
exports["default"] = addTargetDependency;
