"use strict";
exports.__esModule = true;
exports.withShareMenuAndroid = void 0;
var withShareMenuAndroid = function (config, props) {
    config = withShareMenuManifest(config);
    return config;
};
exports.withShareMenuAndroid = withShareMenuAndroid;
// TODO
var withShareMenuManifest = function (config) {
    // add intent filter
    // <intent-filter>
    //   <action android:name="android.intent.action.SEND" />
    //   <category android:name="android.intent.category.DEFAULT" />
    //   <data android:mimeType="text/plain" />
    //   <data android:mimeType="image/*" />
    //   <!-- Any other mime types you want to support -->
    // </intent-filter>
    return config;
};
