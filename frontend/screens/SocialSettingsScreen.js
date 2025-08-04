import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SocialSettingsScreen({ navigation }) {
  const { theme } = useTheme();
  const [isPublic, setIsPublic] = useState(true); // Default to public
  const [bio, setBio] = useState(''); // User's bio
  const [isEditingBio, setIsEditingBio] = useState(false); // Bio editing mode
  const [tempBio, setTempBio] = useState(''); // Temporary bio for editing
  const [isLoading, setIsLoading] = useState(true);

  // This screen uses a custom header instead of the default navigation header
  // The header includes a back arrow and centered title for consistent app design
  // SafeAreaView is used to automatically handle status bar and notch spacing

  // Load current user's privacy setting when component mounts
  useEffect(() => {
    loadUserPrivacySetting();
  }, []);

  // Function to load the current user's privacy setting from Firestore
  const loadUserPrivacySetting = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Get the user document from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // If isPublic field exists, use it; otherwise default to true
        const userData = userDoc.data();
        setIsPublic(userData.isPublic !== undefined ? userData.isPublic : true);
        setBio(userData.bio || ''); // Load bio if it exists
      } else {
        // If user document doesn't exist, create it with default public setting
        await updateDoc(userDocRef, { isPublic: true, bio: '' });
        setIsPublic(true);
        setBio('');
      }
    } catch (error) {
      console.error('Error loading privacy setting:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle toggle switch changes
  const handlePrivacyToggle = async (value) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Update the user's privacy setting in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { isPublic: value });

      // Update local state
      setIsPublic(value);

      // Show success message
      const status = value ? 'public' : 'private';
      Alert.alert('Success', `Your profile is now ${status}`);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
      // Revert the toggle if update failed
      setIsPublic(!value);
    }
  };

  // Function to start editing bio
  const startEditBio = () => {
    setTempBio(bio);
    setIsEditingBio(true);
  };

  // Function to save bio changes
  const saveBio = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Update the user's bio in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { bio: tempBio });

      // Update local state
      setBio(tempBio);
      setIsEditingBio(false);

      Alert.alert('Success', 'Bio updated successfully');
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio');
    }
  };

  // Function to cancel bio editing
  const cancelEditBio = () => {
    setTempBio(bio);
    setIsEditingBio(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom header with back arrow and centered title */}
      {/* SafeAreaView automatically handles status bar and notch spacing */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {/* Purple back arrow button on the left */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.primary} 
          />
        </TouchableOpacity>
        
        {/* Centered title using app's typography */}
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>
          Social Settings
        </Text>
        
        {/* Placeholder to balance the layout */}
        <View style={styles.placeholder} />
      </View>

      {/* Settings content with horizontal padding to match other screens */}
      <View style={styles.content}>
        {/* Privacy setting section */}
        <View style={[styles.settingCard, { backgroundColor: theme.surface }]}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons 
              name="account-eye" 
              size={24} 
              color={theme.primary} 
            />
            <Text style={[theme.typography.subheadline, { color: theme.text, marginLeft: 12 }]}>
              Profile Privacy
            </Text>
          </View>
          
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 8 }]}>
            Control who can see your profile and shared content
          </Text>

          {/* Toggle switch for public/private */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabels}>
              <Text style={[theme.typography.body, { color: theme.textDim }]}>
                {isPublic ? 'Public' : 'Private'}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.textDim }]}>
                {isPublic 
                  ? 'Anyone can see your profile' 
                  : 'Only you can see your profile'
                }
              </Text>
            </View>
            
            <Switch
              value={isPublic}
              onValueChange={handlePrivacyToggle}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isPublic ? theme.background : theme.textDim}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Bio editing section */}
        <View style={[styles.settingCard, { backgroundColor: theme.surface }]}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons 
              name="text" 
              size={24} 
              color={theme.primary} 
            />
            <Text style={[theme.typography.subheadline, { color: theme.text, marginLeft: 12 }]}>
              Bio
            </Text>
          </View>
          
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 8 }]}>
            Add a short bio to your profile that others can see
          </Text>

          {isEditingBio ? (
            /* Bio editing mode */
            <View style={styles.bioEditContainer}>
              <TextInput
                style={[styles.bioInput, { 
                  color: theme.text, 
                  borderColor: theme.border,
                  backgroundColor: theme.background 
                }]}
                value={tempBio}
                onChangeText={setTempBio}
                placeholder="Write something about yourself..."
                placeholderTextColor={theme.textDim}
                multiline
                maxLength={150}
                autoFocus
              />
              <Text style={[theme.typography.caption, { color: theme.textDim, textAlign: 'right', marginTop: 4 }]}>
                {tempBio.length}/150
              </Text>
              <View style={styles.bioEditButtons}>
                <TouchableOpacity 
                  style={[styles.bioButton, { backgroundColor: theme.border }]} 
                  onPress={cancelEditBio}
                  activeOpacity={0.7}
                >
                  <Text style={[theme.typography.body, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.bioButton, { backgroundColor: theme.primary }]} 
                  onPress={saveBio}
                  activeOpacity={0.7}
                >
                  <Text style={[theme.typography.body, { color: theme.background }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Bio display mode */
            <View style={styles.bioDisplayContainer}>
              <Text style={[theme.typography.body, { color: theme.text, marginTop: 12 }]}>
                {bio || 'No bio added yet'}
              </Text>
              <TouchableOpacity 
                style={[styles.editBioButton, { borderColor: theme.primary }]} 
                onPress={startEditBio}
                activeOpacity={0.7}
              >
                <Text style={[theme.typography.body, { color: theme.primary }]}>
                  {bio ? 'Edit Bio' : 'Add Bio'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Additional settings can be added here */}
        <View style={[styles.settingCard, { backgroundColor: theme.surface }]}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons 
              name="information-outline" 
              size={24} 
              color={theme.primary} 
            />
            <Text style={[theme.typography.subheadline, { color: theme.text, marginLeft: 12 }]}>
              About Privacy
            </Text>
          </View>
          
          <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 8 }]}>
            When your profile is public, other users can see your shared outfits and activity. 
            When private, only you can see your content.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // Horizontal padding for header content
    paddingVertical: 12, // Vertical padding for header height
    borderBottomWidth: 1,
    // Uses theme border color for consistency
    // SafeAreaView automatically handles top spacing for status bar and notch
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24, // Match padding used in other screens for consistency
    paddingVertical: 16,
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  toggleLabels: {
    flex: 1,
    marginRight: 16,
  },
  bioEditContainer: {
    marginTop: 16,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bioEditButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  bioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bioDisplayContainer: {
    marginTop: 12,
  },
  editBioButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
}); 