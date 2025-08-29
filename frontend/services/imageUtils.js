import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveBackendBaseUrl() {
  const extras = Constants.expoConfig?.extra ?? {};
  if (extras.BACKEND_URL) return extras.BACKEND_URL.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : '';

  if (host) return `http://${host}:5000`;

  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
}

export async function removeBackgroundAndPredict(uri) {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });

  const baseUrl = resolveBackendBaseUrl();
  const res = await fetch(`${baseUrl}/remove-bg`, {
    method: 'POST',
    body: formData,
    // Important: let fetch set the multipart boundary automatically
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Backend error: ${res.status} ${text}`);
  }

  const result = await res.json();
  if (!result.base64_image) {
    throw new Error('No base64 image returned from backend.');
  }
  return result;
}
