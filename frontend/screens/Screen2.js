import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Screen2({ navigation }) {
  const { theme } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.surface },
      headerTitleStyle: theme.typography.headline,
      headerTintColor: theme.primary,
    });
  }, [navigation, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[theme.typography.headline, { color: theme.text }]}>
        Social Page
      </Text>
      <Text style={[theme.typography.body, { color: theme.textDim, marginTop: 10 }]}>
        Connect with people, browse and share outfits.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
});
