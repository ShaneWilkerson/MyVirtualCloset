import React, { useState } from 'react';
import { View, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../services/firebase';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import uuid from 'react-native-uuid';

export default function ImageUploader() {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const predictWithModel = async (uri) => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    try {
      const res = await fetch('http://192.168.86.48:5000/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await res.json();
      console.log('Model prediction:', result);
      return result;
    } catch (err) {
      console.error('Model prediction failed:', err);
      return null;
    }
  };

  const uploadImage = async () => {
  if (!imageUri) return;

  const user = getAuth().currentUser;
  if (!user) {
    Alert.alert('Error', 'You must be logged in to upload');
    return;
  }

  try {
    setUploading(true);

    // 🔍 Predict from backend
    const prediction = await predictWithModel(imageUri);

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const filename = `${uuid.v4()}.jpg`;
    const storage = getStorage();
    const storageRef = ref(storage, `clothing/${filename}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    //  Save prediction details to Firestore
    await addDoc(collection(db, 'images'), {
      uid: user.uid,
      url: downloadURL,
      createdAt: Timestamp.now(),
      color: prediction?.color || null,
      pattern: prediction?.pattern || null,
      type: prediction?.type || null,
    });

    Alert.alert(
      'Success',
      `Image uploaded!\nType: ${prediction?.type || 'Unknown'}\nColor: ${prediction?.color || 'Unknown'}\nPattern: ${prediction?.pattern || 'Unknown'}`
    );

    setImageUri(null);
  } catch (err) {
    console.error('Upload failed:', JSON.stringify(err, null, 2));
    Alert.alert('Upload failed', err.message || 'Unknown error');
  } finally {
    setUploading(false);
  }
};

  return (
    <View style={{ alignItems: 'center', marginTop: 20 }}>
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: 200, height: 200, marginBottom: 10 }}
        />
      )}
      <Button title="Pick Image" onPress={pickImage} />
      <Button title="Upload Image" onPress={uploadImage} disabled={!imageUri || uploading} />
      {uploading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
}