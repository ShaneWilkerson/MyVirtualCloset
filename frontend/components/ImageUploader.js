import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import uuid from 'react-native-uuid';

export async function uploadClothingImage({ base64Image, prediction }) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('You must be logged in.');

  const base64 = base64Image.startsWith('data:')
    ? base64Image.split(',')[1]
    : base64Image;

  const filename = `${uuid.v4()}.png`;
  const fileUri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const storage = getStorage();
  const storagePath = `clothing/${filename}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytesResumable(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);

  await addDoc(collection(db, 'images'), {
    uid: user.uid,
    url: downloadURL,
    path: storagePath, // ✅ Added
    createdAt: Timestamp.now(),
    color: prediction.color,
    pattern: prediction.pattern,
    type: prediction.type,
  });
}