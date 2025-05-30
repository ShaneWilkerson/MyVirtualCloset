import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../services/firebase';

export default function ClothingDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { item } = route.params;
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    type: item.type || '',
    color: item.color || '',
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
  });

  const uploadedAt = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleString()
    : 'Unknown';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setEditMode(prev => !prev)}>
          <MaterialCommunityIcons
            name={editMode ? 'close' : 'pencil'}
            size={24}
            color={theme.text}
            style={{ marginRight: 16 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode]);

  const handleSave = async () => {
    try {
      const updatedData = {
        type: form.type.trim(),
        color: form.color.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      await updateDoc(doc(db, 'images', item.id), updatedData);
      Alert.alert('Success', 'Changes saved.');
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save changes:', err);
      Alert.alert('Error', 'Could not save changes.');
    }
  };

const handleDelete = async () => {
  Alert.alert(
    'Delete Item',
    'Are you sure you want to delete this clothing item?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete Firestore document
            await deleteDoc(doc(db, 'images', item.id));

            // Delete Storage file
            if (item.path) {
              const storage = getStorage();
              console.log('Deleting from storage path:', item.path);
              const fileRef = ref(storage, item.path);
              await deleteObject(fileRef);
            } else {
              console.warn('No path found. Skipping storage delete.');
            }

            navigation.goBack();
          } catch (err) {
            console.error('Error deleting item:', err);
            Alert.alert('Error', 'Failed to delete item. Check your permissions and path.');
          }
        },
      },
    ]
  );
};


  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={{ uri: item.url }} style={styles.image} />

      <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Uploaded:</Text>
      <Text style={[theme.typography.body, { color: theme.text }]}>{uploadedAt}</Text>

      <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Type:</Text>
      {editMode ? (
        <TextInput
          style={[theme.typography.body, styles.input, { color: theme.text, borderColor: theme.textDim }]}
          value={form.type}
          onChangeText={(text) => setForm(prev => ({ ...prev, type: text }))}
          placeholder="Type"
          placeholderTextColor={theme.textDim}
        />
      ) : (
        <Text style={[theme.typography.body, { color: theme.text }]}>{item.type}</Text>
      )}

      <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Color:</Text>
      {editMode ? (
        <TextInput
          style={[theme.typography.body, styles.input, { color: theme.text, borderColor: theme.textDim }]}
          value={form.color}
          onChangeText={(text) => setForm(prev => ({ ...prev, color: text }))}
          placeholder="Color"
          placeholderTextColor={theme.textDim}
        />
      ) : (
        <Text style={[theme.typography.body, { color: theme.text }]}>{item.color}</Text>
      )}

      <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 10 }]}>Tags:</Text>
      {editMode ? (
        <TextInput
          style={[theme.typography.body, styles.input, { color: theme.text, borderColor: theme.textDim }]}
          value={form.tags}
          onChangeText={(text) => setForm(prev => ({ ...prev, tags: text }))}
          placeholder="Tags (comma separated)"
          placeholderTextColor={theme.textDim}
        />
      ) : (
        <Text style={[theme.typography.body, { color: theme.text }]}>
          {item.tags && Array.isArray(item.tags) ? item.tags.join(', ') : ''}
        </Text>
      )}

      {editMode && (
        <>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <MaterialCommunityIcons name="content-save" size={20} color="white" />
            <Text style={{ color: 'white', marginLeft: 8 }}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.error }]}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons name="delete" size={20} color="white" />
            <Text style={{ color: 'white', marginLeft: 8 }}>Delete Item</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    alignItems: 'center',
    flexGrow: 1,
  },
  image: {
    width: 310,
    height: 310,
    marginBottom: 20,
    borderRadius: 10,
  },
  input: {
    borderBottomWidth: 1,
    width: 200,
    paddingVertical: 4,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
