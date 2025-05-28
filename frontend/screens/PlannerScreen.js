import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PlannerScreen({ navigation }) {
  const { theme } = useTheme();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const weekOutfits = Array.from({ length: 7 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    outfitImage: null,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Top Right Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('Menu')}
      >
        <MaterialCommunityIcons name="menu" size={28} color={theme.text} />
      </TouchableOpacity>

      {/* Greeting */}
      <Text style={[theme.typography.headline, styles.title]}>{`Hello!`}</Text>
      <Text style={[theme.typography.subheadline, styles.subtitle]}>{today}</Text>

      {/* Avatar + Today's Outfit */}
      <View style={styles.avatarOutfitContainer}>
        <Image
          source={require('../assets/avatar-placeholder.png')}
          style={styles.avatar}
        />
        <Text style={[theme.typography.body, { color: theme.text }]}>Today's Outfit</Text>
        <Image
          source={require('../assets/outfit-placeholder.png')}
          style={styles.outfitImage}
        />
      </View>

      {/* Scrollable Week Plan */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {weekOutfits.map((day, idx) => (
          <TouchableOpacity key={idx} style={styles.dayCard}>
            <Text style={[theme.typography.caption, { color: theme.text }]}>{day.day}</Text>
            <View style={styles.outfitPreview}>
              {day.outfitImage ? (
                <Image source={{ uri: day.outfitImage }} style={styles.outfitPreviewImage} />
              ) : (
                <MaterialCommunityIcons name="tshirt-crew" size={36} color={theme.textDim} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Suggest Outfit Button */}
      <TouchableOpacity
        style={[styles.suggestButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('SuggestedOutfit')}
      >
        <Text style={[theme.typography.body, { color: theme.surface }]}>Suggest Outfit</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  menuButton: {
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 2,
  },
  title: {
    marginTop: 10,
    color: 'black',
  },
  subtitle: {
    marginBottom: 20,
    color: 'gray',
  },
  avatarOutfitContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#ccc',
  },
  outfitImage: {
    width: 120,
    height: 150,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#ddd',
  },
  weekScroll: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  dayCard: {
    alignItems: 'center',
    marginRight: 16,
  },
  outfitPreview: {
    width: 60,
    height: 80,
    backgroundColor: '#eee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  outfitPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  suggestButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
