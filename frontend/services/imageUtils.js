export async function removeBackgroundAndPredict(uri) {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });

  const res = await fetch('http://192.168.86.48:5000/remove-bg', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const result = await res.json();

  if (!result.base64_image) {
    throw new Error('No base64 image returned from backend.');
  }

  return result;
}