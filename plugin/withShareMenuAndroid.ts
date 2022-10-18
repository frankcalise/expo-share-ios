import type { ConfigPlugin } from "@expo/config-plugins";
import type { ShareMenuPluginProps } from "./withReactNativeShareMenu";

export const withShareMenuAndroid: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  props
) => {
  config = withShareMenuManifest(config);

  return config;
};

// TODO
const withShareMenuManifest: ConfigPlugin = (config) => {
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
