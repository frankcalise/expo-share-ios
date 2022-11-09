import { ConfigPlugin } from "@expo/config-plugins";
import { withShareMenuAndroid } from "./withShareMenuAndroid";
import { withShareMenuIos } from "./withShareMenuIos";

// types
export type ShareMenuPluginProps = {
  // (iOS only) Development Team ID and deployment target
  devTeam: string;
  shareTarget: string;
  shareScheme: string;
};

// helpers
export function getProjectShareMenuName(name: string) {
  return `${name}`;
}

// main plugin
const withReactNativeShareMenu: ConfigPlugin<ShareMenuPluginProps> = (
  config,
  props
) => {
  config = withShareMenuAndroid(config, props);
  config = withShareMenuIos(config, props);

  return config;
};

export default withReactNativeShareMenu;
