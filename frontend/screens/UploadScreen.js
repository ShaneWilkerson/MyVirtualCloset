import React from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import ImageProcessing from '../components/ImageProcessing';
import { uploadClothingImage } from '../components/ImageUploader';

export default function UploadScreen() {
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
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Upload Clothing</Text>
      <ImageProcessing onConfirm={handleConfirmUpload} />
    </ScrollView>
  );
}
