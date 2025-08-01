import React, { useLayoutEffect } from 'react';
import { View, ScrollView, Text, Alert, StyleSheet } from 'react-native';
import ImageProcessing from '../components/ImageProcessing';
import { uploadClothingImage } from '../components/ImageUploader';
import { useTheme } from '../context/ThemeContext';

export default function UploadScreen({ navigation }) {
  const { theme } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.surface },
      headerTitleStyle: theme.typography.headline,
      headerTintColor: theme.primary,
    });
  }, [navigation, theme]);

  const handleConfirmUpload = async ({ base64Image, prediction }) => {
    try {
      await uploadClothingImage({ base64Image, prediction });
      Alert.alert('Success', 'Clothing image uploaded!');
    } catch (err) {
      console.error(err);
      Alert.alert('Upload Failed', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[theme.typography.headline, { color: theme.text, marginBottom: 16, textAlign: 'center' }]}>
          Upload Clothing
        </Text>
        <ImageProcessing onConfirm={handleConfirmUpload} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
});
