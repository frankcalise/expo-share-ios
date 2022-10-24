import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect } from "react";
import ShareMenu from "react-native-share-menu";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  const [sharedData, setSharedData] = useState(null);
  const [sharedMimeType, setSharedMimeType] = useState(null);

  const handleShare = useCallback((item) => {
    console.log({ item: JSON.stringify(item) });
    if (!item) {
      return;
    }

    setSharedData(item?.data?.[0]?.data ?? "");
    setSharedMimeType(item?.data?.[0]?.mimeType ?? "");
  }, []);

  useEffect(() => {
    ShareMenu.getInitialShare(handleShare);
  }, []);

  useEffect(() => {
    const listener = ShareMenu.addNewShareListener(handleShare);

    return () => {
      listener.remove();
    };
  }, []);

  // The user shared a file in general
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>Shared mime type: {sharedMimeType}</Text>
      <Text>Shared file location: {sharedData}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
