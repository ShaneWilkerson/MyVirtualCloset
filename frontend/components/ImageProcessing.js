import React, { useState } from 'react';
import { View, Button, Image, Text, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { removeBackgroundAndPredict } from '../services/imageUtils'; // external helper

export default function ImageProcessing({ onConfirm }) {
  const [imageUri, setImageUri] = useState(null);
  const [cleanedImageUri, setCleanedImageUri] = useState(null);
  const [prediction, setPrediction] = useState({ type: '', color: '', pattern: '' });
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setCleanedImageUri(null);
      setPrediction({ type: '', color: '', pattern: '' });
    }
  };

  const processImage = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const result = await removeBackgroundAndPredict(imageUri);

      // Strip data:image/... prefix
      const base64 = result.base64_image.startsWith('data:')
        ? result.base64_image.split(',')[1]
        : result.base64_image;

      setCleanedImageUri(`data:image/png;base64,${base64}`);
      setPrediction(result.prediction || {});
    } catch (err) {
      console.error('Processing failed:', err);
      Alert.alert('Processing Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <Button title="Pick Image" onPress={pickImage} />

      {imageUri && !cleanedImageUri && (
        <Button title="Process Image" onPress={processImage} disabled={loading} />
      )}

      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

      {imageUri && (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={{ marginBottom: 5 }}>Original Image:</Text>
          <Image source={{ uri: imageUri }} style={{ width: 200, height: 200, marginBottom: 10, borderWidth: 1 }} />
        </View>
      )}

      {cleanedImageUri && (
        <>
          <Text style={{ marginBottom: 5 }}>Processed Image:</Text>
          <Image source={{ uri: cleanedImageUri }} style={{ width: 200, height: 200, marginBottom: 10, borderWidth: 1 }} />
          <Text>Type:</Text>
          <TextInput
            style={{ borderBottomWidth: 1, width: 200, marginBottom: 10 }}
            value={prediction.type}
            onChangeText={(text) => setPrediction((p) => ({ ...p, type: text }))}
          />
          <Text>Color:</Text>
          <TextInput
            style={{ borderBottomWidth: 1, width: 200, marginBottom: 10 }}
            value={prediction.color}
            onChangeText={(text) => setPrediction((p) => ({ ...p, color: text }))}
          />
          <Text>Pattern:</Text>
          <TextInput
            style={{ borderBottomWidth: 1, width: 200, marginBottom: 10 }}
            value={prediction.pattern}
            onChangeText={(text) => setPrediction((p) => ({ ...p, pattern: text }))}
          />
          <Button
            title="Confirm & Upload"
            onPress={async () => {
              try {
                await onConfirm({ base64Image: cleanedImageUri, prediction });
                // Clear UI state on successful upload
                setImageUri(null);
                setCleanedImageUri(null);
                setPrediction({ type: '', color: '', pattern: '' });
              } catch (err) {
                Alert.alert('Upload failed', err.message || 'Something went wrong.');
              }
            }}
          />
        </>
      )}
    </View>
  );
}
