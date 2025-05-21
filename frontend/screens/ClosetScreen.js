import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { TouchableOpacity } from 'react-native';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 30) / 2;

export default function ClosetScreen({ navigation }) {
    const [images, setImages] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const fetchClothing = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(
                collection(db, 'images'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setImages(data);
        } catch (err) {
            console.error('Error fetching clothing:', err);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchClothing();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchClothing();
    }, []);

    return (
        <FlatList
            data={images}
            keyExtractor={(item) => item.id}
            numColumns={2}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.container}
            ListEmptyComponent={
                <Text style={styles.message}>No clothing uploaded yet.</Text>
            }
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigation.navigate('ClothingDetail', { item })}>
                    <Image source={{ uri: item.url }} style={styles.image} />
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: { padding: 10 },
    message: { textAlign: 'center', marginTop: 40, fontSize: 16 },
    image: {
        width: imageSize,
        height: imageSize,
        margin: 5,
        borderRadius: 8,
        backgroundColor: '#eee',
    }
});
