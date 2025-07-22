import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Pressable, Animated, PanResponder } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Svg, { Circle, Rect, Ellipse, Path } from 'react-native-svg';

const AVATAR_VIEWS = ['front', 'side', 'back'];

const defaultTraits = {
  gender: 'boy',
  headShape: 'oval',
  hairStyle: 'short',
  hairColor: '#222',
  eyebrows: 'normal',
  eyeColor: '#3a5ba0',
  lipShape: 'normal',
  facialHair: 'none',
  skinTone: '#f5d6c6',
};

export default function AvatarCustomizationScreen({ navigation }) {
  const { theme } = useTheme();
  const [traits, setTraits] = useState(defaultTraits);
  const [view, setView] = useState('front'); // front, side, back
  const pan = useRef(new Animated.Value(0)).current;

  // Load existing avatar traits if they exist
  useEffect(() => {
    const fetchAvatar = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().avatar) {
        setTraits({ ...defaultTraits, ...userDoc.data().avatar });
      }
    };
    fetchAvatar();
  }, []);

  // PanResponder for swipe-to-spin
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 30) {
          // Swipe right: previous view
          setView((prev) => {
            const idx = AVATAR_VIEWS.indexOf(prev);
            return AVATAR_VIEWS[(idx + 2) % 3];
          });
        } else if (gestureState.dx < -30) {
          // Swipe left: next view
          setView((prev) => {
            const idx = AVATAR_VIEWS.indexOf(prev);
            return AVATAR_VIEWS[(idx + 1) % 3];
          });
        }
      },
    })
  ).current;

  // Save avatar traits to Firestore
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { avatar: traits });
    navigation.goBack();
  };

  // Render a simple SVG avatar based on traits and view
  const renderAvatar = () => {
    // For now, just a simple cartoon with a few trait variations
    // You can expand this with more SVG paths for more detail
    const isBoy = traits.gender === 'boy';
    const skin = traits.skinTone;
    const hair = traits.hairColor;
    const eye = traits.eyeColor;
    // ... more trait logic as needed
    if (view === 'front') {
      return (
        <Svg width={180} height={260}>
          {/* Head */}
          <Ellipse cx={90} cy={70} rx={48} ry={54} fill={skin} />
          {/* Hair */}
          {traits.hairStyle === 'short' && (
            <Ellipse cx={90} cy={50} rx={48} ry={30} fill={hair} />
          )}
          {/* Eyes */}
          <Ellipse cx={70} cy={80} rx={8} ry={10} fill={eye} />
          <Ellipse cx={110} cy={80} rx={8} ry={10} fill={eye} />
          {/* Eyebrows */}
          <Rect x={60} y={65} width={20} height={4} rx={2} fill="#222" />
          <Rect x={100} y={65} width={20} height={4} rx={2} fill="#222" />
          {/* Mouth */}
          <Ellipse cx={90} cy={110} rx={16} ry={6} fill="#e28" />
          {/* Body (t-shirt) */}
          <Rect x={50} y={124} width={80} height={50} rx={20} fill="#fff" />
          {/* Arms */}
          <Rect x={30} y={124} width={20} height={80} rx={10} fill={skin} />
          <Rect x={130} y={124} width={20} height={80} rx={10} fill={skin} />
          {/* Jeans */}
          <Rect x={60} y={174} width={60} height={50} rx={16} fill="#3a5ba0" />
          {/* Shoes */}
          <Rect x={60} y={224} width={20} height={16} rx={6} fill="#fff" />
          <Rect x={100} y={224} width={20} height={16} rx={6} fill="#fff" />
        </Svg>
      );
    } else if (view === 'side') {
      return (
        <Svg width={180} height={260}>
          {/* Head (side) */}
          <Ellipse cx={110} cy={70} rx={48} ry={54} fill={skin} />
          {/* Hair (side) */}
          {traits.hairStyle === 'short' && (
            <Ellipse cx={110} cy={50} rx={48} ry={30} fill={hair} />
          )}
          {/* Eye (side) */}
          <Ellipse cx={130} cy={80} rx={8} ry={10} fill={eye} />
          {/* Eyebrow (side) */}
          <Rect x={120} y={65} width={20} height={4} rx={2} fill="#222" />
          {/* Mouth (side) */}
          <Ellipse cx={110} cy={110} rx={16} ry={6} fill="#e28" />
          {/* Body (t-shirt) */}
          <Rect x={70} y={124} width={80} height={50} rx={20} fill="#fff" />
          {/* Arm (side) */}
          <Rect x={150} y={124} width={20} height={80} rx={10} fill={skin} />
          {/* Jeans */}
          <Rect x={80} y={174} width={60} height={50} rx={16} fill="#3a5ba0" />
          {/* Shoes */}
          <Rect x={120} y={224} width={20} height={16} rx={6} fill="#fff" />
        </Svg>
      );
    } else {
      // back view
      return (
        <Svg width={180} height={260}>
          {/* Head (back) */}
          <Ellipse cx={90} cy={70} rx={48} ry={54} fill={skin} />
          {/* Hair (back) */}
          {traits.hairStyle === 'short' && (
            <Ellipse cx={90} cy={50} rx={48} ry={30} fill={hair} />
          )}
          {/* Body (t-shirt) */}
          <Rect x={50} y={124} width={80} height={50} rx={20} fill="#fff" />
          {/* Arms (back) */}
          <Rect x={30} y={124} width={20} height={80} rx={10} fill={skin} />
          <Rect x={130} y={124} width={20} height={80} rx={10} fill={skin} />
          {/* Jeans (back) */}
          <Rect x={60} y={174} width={60} height={50} rx={16} fill="#3a5ba0" />
          {/* Shoes (back) */}
          <Rect x={60} y={224} width={20} height={16} rx={6} fill="#fff" />
          <Rect x={100} y={224} width={20} height={16} rx={6} fill="#fff" />
        </Svg>
      );
    }
  };

  // Simple dropdown for trait selection
  const TraitPicker = ({ label, value, options, onChange }) => (
    <View style={styles.pickerRow}>
      <Text style={[theme.typography.caption, { color: theme.text, width: 100 }]}>{label}</Text>
      <View style={styles.pickerOptions}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pickerOption, value === opt.value && { backgroundColor: theme.primary }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[theme.typography.body, { color: value === opt.value ? theme.surface : theme.text }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}
      {...panResponder.panHandlers}
    >
      {/* Custom header with back button */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.primary }]}>←</Text>
        </Pressable>
        <Text style={[theme.typography.headline, { color: theme.text, flex: 1, textAlign: 'center' }]}>Customize Avatar</Text>
        <View style={styles.backButton} />
      </View>

      {/* Avatar preview with swipe-to-spin */}
      <View style={styles.avatarPreview}>
        {renderAvatar()}
        <Text style={[theme.typography.caption, { color: theme.textDim, marginTop: 8 }]}>Swipe left/right to spin</Text>
      </View>

      {/* Trait pickers */}
      <TraitPicker
        label="Gender"
        value={traits.gender}
        options={[
          { label: 'Boy', value: 'boy' },
          { label: 'Girl', value: 'girl' },
        ]}
        onChange={v => setTraits(t => ({ ...t, gender: v }))}
      />
      <TraitPicker
        label="Head Shape"
        value={traits.headShape}
        options={[
          { label: 'Oval', value: 'oval' },
          { label: 'Round', value: 'round' },
        ]}
        onChange={v => setTraits(t => ({ ...t, headShape: v }))}
      />
      <TraitPicker
        label="Hair Style"
        value={traits.hairStyle}
        options={[
          { label: 'Short', value: 'short' },
          { label: 'Long', value: 'long' },
        ]}
        onChange={v => setTraits(t => ({ ...t, hairStyle: v }))}
      />
      <TraitPicker
        label="Hair Color"
        value={traits.hairColor}
        options={[
          { label: 'Black', value: '#222' },
          { label: 'Brown', value: '#a0522d' },
          { label: 'Blonde', value: '#ffe066' },
          { label: 'Red', value: '#d7263d' },
        ]}
        onChange={v => setTraits(t => ({ ...t, hairColor: v }))}
      />
      <TraitPicker
        label="Eyebrows"
        value={traits.eyebrows}
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'Thick', value: 'thick' },
        ]}
        onChange={v => setTraits(t => ({ ...t, eyebrows: v }))}
      />
      <TraitPicker
        label="Eye Color"
        value={traits.eyeColor}
        options={[
          { label: 'Blue', value: '#3a5ba0' },
          { label: 'Brown', value: '#7c4700' },
          { label: 'Green', value: '#3aaf5a' },
        ]}
        onChange={v => setTraits(t => ({ ...t, eyeColor: v }))}
      />
      <TraitPicker
        label="Lip Shape"
        value={traits.lipShape}
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'Full', value: 'full' },
        ]}
        onChange={v => setTraits(t => ({ ...t, lipShape: v }))}
      />
      <TraitPicker
        label="Facial Hair"
        value={traits.facialHair}
        options={[
          { label: 'None', value: 'none' },
          { label: 'Beard', value: 'beard' },
        ]}
        onChange={v => setTraits(t => ({ ...t, facialHair: v }))}
      />
      <TraitPicker
        label="Skin Tone"
        value={traits.skinTone}
        options={[
          { label: 'Light', value: '#f5d6c6' },
          { label: 'Tan', value: '#e0ac69' },
          { label: 'Brown', value: '#8d5524' },
        ]}
        onChange={v => setTraits(t => ({ ...t, skinTone: v }))}
      />

      {/* Save button */}
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
        <Text style={[theme.typography.body, { color: theme.surface }]}>Save Avatar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
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
    minWidth: 44,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  saveButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
}); 