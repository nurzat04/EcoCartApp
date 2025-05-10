import { ShoppingItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ExpirationScreen = () => {
    const [activeTab, setActiveTab] = useState<'expired' | 'expiring'>('expired');
    const [expiredItems, setExpiredItems] = useState<ShoppingItem[]>([]);
    const [expiringItems, setExpiringItems] = useState<ShoppingItem[]>([]);
    const router = useRouter()

    useEffect(() => {
        fetchExpiredItems();
        fetchExpiringItems();
    }, []);

    const fetchExpiredItems = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const res = await axios.get('http://172.20.10.3:8000/shopping/expired-items/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpiredItems(res.data);
        } catch (error) {
            console.error('Fetch expired error:', error);
        }
    };

    const fetchExpiringItems = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const res = await axios.get('http://172.20.10.3:8000/shopping/expiring-items/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpiringItems(res.data);
        } catch (error) {
            console.error('Fetch expired error:', error);
        }
    };

    const renderItem = ({ item }: { item: ShoppingItem }) => (
        <View style={styles.item}>
            <Text style={styles.name}>{item.product.name}</Text>
            <Text style={styles.date}>Expires: {item.expiration_date}</Text>
        </View>
    );

    const productsToShow = activeTab === 'expired' ? expiredItems : expiringItems;

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push('/')
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
                    onPress={() => setActiveTab('expired')}
                >
                    <Text style={styles.tabText}>Expired</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'expiring' && styles.activeTab]}
                    onPress={() => setActiveTab('expiring')}
                >
                    <Text style={styles.tabText}>Expiring</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={productsToShow}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

export default ExpirationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        marginTop: 77,
    },
    tab: {
        flex: 1,
        padding: 12,
        backgroundColor: '#eee',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: '#4caf50',
    },
    tabText: {
        color: '#000',
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 32,
    },
    item: {
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    date: {
        color: '#555',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
    },
});
