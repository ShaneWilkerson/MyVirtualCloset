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

            {/* Top Row */}
            <View style={styles.topRow}>
                <View>
                    <Text style={[theme.typography.headline, { color: theme.text }]}>Hello!</Text>
                    <Text style={[theme.typography.caption, { color: theme.textDim }]}>{today}</Text>
                </View>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <MaterialCommunityIcons name="account-circle" size={36} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Today's Outfit with Avatar */}
            <View style={styles.todayContainer}>
                <View style={styles.todayInfo}>
                    <Text style={[theme.typography.subheadline, { color: theme.text }]}>Today's Outfit</Text>
                    <Image
                        source={require('../assets/outfitPlaceholder.png')}
                        style={styles.outfitImage}
                    />
                </View>
            </View>

            {/* Scrollable Week Plan */}
            <Text style={[theme.typography.subheadline, { color: theme.text, marginBottom: 8 }]}>
                Next Week's Outfits
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.weekScroll}
                contentContainerStyle={styles.scrollContent}
            >
                {weekOutfits.map((day, idx) => (
                    <TouchableOpacity key={idx} style={[styles.dayCard, { backgroundColor: theme.surface }]}>
                        <Text style={[theme.typography.caption, { color: theme.text }]}>{day.day}</Text>
                        <View style={styles.outfitPreview}>
                            <Image
                                source={require('../assets/outfitPlaceholder.png')}
                                style={styles.outfitPreviewImage}
                            />
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
        paddingTop: 45,
        paddingHorizontal: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    profileButton: {
        padding: 4,
    },
    todayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },
    todayInfo: {
        flex: 1,
        alignItems: 'center',
        marginBottom: 30,
    },
    outfitImage: {
        width: 320,
        height: 320,
        borderRadius: 8,
        marginTop: 10,
        backgroundColor: '#ddd',
    },
    weekScroll: {
        marginBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 4,
    },
    dayCard: {
        width: 80,
        alignItems: 'center',
        marginRight: 12,
        padding: 8,
        borderRadius: 10,
    },
    outfitPreview: {
        width: 65,
        height: 85,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        backgroundColor: '#eee',
    },
    outfitPreviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    suggestButton: {
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
        elevation: 2,
        marginBottom: 10,
    },
});
