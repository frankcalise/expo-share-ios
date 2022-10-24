import * as util from "util";
import * as path from "path";
import * as fs from "fs";

export type PBXFile = any;

export function quoted(str: string) {
  return util.format(`"%s"`, str);
}

// Copied helper functions from cordova-node-xcode

export function longComment(file: PBXFile) {
  return util.format("%s in %s", file.basename, file.group);
}

export function copyFileSync(source: any, target: any) {
  let targetFile = target;

  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}
