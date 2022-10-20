"use strict";
exports.__esModule = true;
function addProductFile(proj, shareMenuFolder, groupName) {
    var productFile = {
        basename: "".concat(shareMenuFolder, ".appex"),
        fileRef: proj.generateUuid(),
        uuid: proj.generateUuid(),
        group: groupName,
        explicitFileType: "wrapper.app-extension",
        /* fileEncoding: 4, */
        settings: {
            ATTRIBUTES: ["RemoveHeadersOnCopy"]
        },
        includeInIndex: 0,
        path: "".concat(shareMenuFolder, ".appex"),
        sourceTree: "BUILT_PRODUCTS_DIR"
    };
    proj.addToPbxFileReferenceSection(productFile);
    // console.log(`Added PBXFileReference: ${productFile.fileRef}`);
    proj.addToPbxBuildFileSection(productFile);
    // console.log(`Added PBXBuildFile: ${productFile.fileRef}`);
    return productFile;
}
exports["default"] = addProductFile;
