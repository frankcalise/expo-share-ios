import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect } from "react";
import ShareMenu from "react-native-share-menu";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  const [sharedData, setSharedData] = useState(null);
  const [sharedMimeType, setSharedMimeType] = useState(null);

  const handleShare = useCallback((item) => {
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

  console.log({ sharedData, sharedMimeType });

  if (!sharedMimeType && !sharedData) {
    // The user hasn't shared anything yet
    return null;
  }

  if (sharedMimeType === "text/plain") {
    // The user shared text
    return (
      <View style={styles.container}>
        <Text>Shared text: {sharedData}</Text>
      </View>
    );
  }

  // The user shared a file in general
  return (
    <View style={styles.container}>
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
