import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import ImageUploader from '../components/ImageUploader';

export default function UploadScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Upload Clothing</Text>
      <ImageUploader />
    </ScrollView>
  );
}