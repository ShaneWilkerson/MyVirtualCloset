import React, { useState } from 'react';
import { View, Image, Text, TextInput, ActivityIndicator, Alert, StyleSheet, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { removeBackgroundAndPredict } from '../services/imageUtils';
import { useTheme } from '../context/ThemeContext';

export default function ImageProcessing({ onConfirm }) {
  const { theme } = useTheme();
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

  const ThemedButton = ({ title, onPress, disabled }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.primary,
          opacity: pressed || disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.buttonGroup}>
        <ThemedButton title="Upload Image" onPress={pickImage} />
        {imageUri && !cleanedImageUri && (
          <ThemedButton title="Process Image" onPress={processImage} disabled={loading} />
        )}
        {loading && <ActivityIndicator style={{ marginTop: 10 }} color={theme.primary} />}
      </View>

      {imageUri && (
        <View style={styles.previewSection}>
          <Text style={[theme.typography.caption, { color: theme.text, marginBottom: 6 }]}>Original Image</Text>
          <Image source={{ uri: imageUri }} style={[styles.image, { borderColor: theme.border }]} />
        </View>
      )}

      {cleanedImageUri && (
        <View style={styles.previewSection}>
          <Text style={[theme.typography.caption, { color: theme.text, marginBottom: 6 }]}>Processed Image</Text>
          <Image source={{ uri: cleanedImageUri }} style={[styles.image, { borderColor: theme.border }]} />

          <View style={styles.inputBlock}>
            <Text style={[theme.typography.caption, { color: theme.text }]}>Type</Text>
            <TextInput
              style={[styles.input, { borderBottomColor: theme.border, color: theme.text }]}
              value={prediction.type}
              onChangeText={(text) => setPrediction((p) => ({ ...p, type: text }))}
            />

            <Text style={[theme.typography.caption, { color: theme.text }]}>Color</Text>
            <TextInput
              style={[styles.input, { borderBottomColor: theme.border, color: theme.text }]}
              value={prediction.color}
              onChangeText={(text) => setPrediction((p) => ({ ...p, color: text }))}
            />

            <Text style={[theme.typography.caption, { color: theme.text }]}>Pattern</Text>
            <TextInput
              style={[styles.input, { borderBottomColor: theme.border, color: theme.text }]}
              value={prediction.pattern}
              onChangeText={(text) => setPrediction((p) => ({ ...p, pattern: text }))}
            />
          </View>

          <ThemedButton title="Confirm & Upload" onPress={async () => {
            try {
              await onConfirm({ base64Image: cleanedImageUri, prediction });
              setImageUri(null);
              setCleanedImageUri(null);
              setPrediction({ type: '', color: '', pattern: '' });
            } catch (err) {
              Alert.alert('Upload failed', err.message || 'Something went wrong.');
            }
          }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  previewSection: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  inputBlock: {
    marginTop: 20,
    width: 220,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: 160,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
