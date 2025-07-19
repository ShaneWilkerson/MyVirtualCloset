import React, { useState, useLayoutEffect } from 'react';
import { View, Text, Image, Alert, StyleSheet, Pressable, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PanGestureHandler, PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const IMAGE_SIZE = Math.min(screenWidth - 40, 300); // Keep image within screen bounds

export default function ProfilePictureScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Animation values for pan and zoom
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Remove the useLayoutEffect since we're using headerShown: false
  // We'll add a custom back button in the screen content instead

  // Handle image selection from camera roll
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // We'll handle cropping ourselves
        quality: 0.8,
        aspect: [1, 1], // Square aspect ratio for profile pics
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        // Reset animation values for new image
        translateX.value = 0;
        translateY.value = 0;
        scale.value = 1;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Pan gesture handler for moving the image around
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      // Keep image within bounds
      const maxTranslate = (scale.value - 1) * IMAGE_SIZE / 2;
      translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateX.value));
      translateY.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateY.value));
    },
  });

  // Pinch gesture handler for zooming
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      scale.value = Math.max(1, Math.min(3, context.startScale * event.scale));
    },
    onEnd: () => {
      // Reset position if scale is 1 (no zoom)
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
      }
    },
  });

  // Animated style for the image
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Save the profile picture to Firebase
  const saveProfilePicture = async () => {
    if (!selectedImage || !user) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      // Convert image to blob for upload
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const imageRef = ref(storage, `profilePictures/${user.uid}_${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      // Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL, // Changed from profilePicture to photoURL to match SocialScreen
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Profile picture updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving profile picture:', error);
      Alert.alert('Error', 'Failed to save profile picture');
    } finally {
      setLoading(false);
    }
  };

  // Cancel and go back without saving
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Custom header with back button - similar to other screens */}
      <View style={styles.headerContainer}>
        <Pressable
          onPress={() => navigation.navigate('Social')}
          style={styles.backButton}
        >
          <Text style={[styles.backArrow, { color: theme.primary }]}>←</Text>
        </Pressable>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>
          Update Profile Picture
        </Text>
        {/* Empty view for spacing to center the title */}
        <View style={styles.backButton} />
      </View>

      {/* Image preview area with cropping functionality - centered container */}
      <View style={styles.imageSection}>
        <View style={[styles.imageContainer, { borderColor: theme.border }]}>
          {selectedImage ? (
            <GestureHandlerRootView style={{ flex: 1 }}>
              <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
                <Animated.View>
                  <PanGestureHandler onGestureEvent={panGestureHandler}>
                    <Animated.View>
                      <Animated.Image
                        source={{ uri: selectedImage }}
                        style={[styles.previewImage, animatedImageStyle]}
                        resizeMode="cover"
                      />
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </GestureHandlerRootView>
          ) : (
            <View style={[styles.placeholder, { backgroundColor: theme.surface }]}>
              <Text style={[theme.typography.caption, { color: theme.textSecondary }]}>
                No image selected
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Instructions */}
      <Text style={[theme.typography.caption, { color: theme.textSecondary, marginTop: 16, textAlign: 'center' }]}>
        {selectedImage 
          ? 'Pinch to zoom • Drag to move'
          : 'Select an image to get started'
        }
      </Text>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        {!selectedImage ? (
          <Pressable
            onPress={pickImage}
            style={[styles.button, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.buttonText}>Choose Image</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={saveProfilePicture}
              disabled={loading}
              style={[
                styles.button,
                { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }
              ]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={handleCancel}
              style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 44, // Ensures consistent touch target size
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageSection: {
    flex: 1, // Takes up available space
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
    paddingVertical: 20, // Adds some breathing room
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2, // Make it circular
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  placeholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 20, // Reduced from 30 for better balance
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20, // Ensures buttons don't touch bottom edge
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 