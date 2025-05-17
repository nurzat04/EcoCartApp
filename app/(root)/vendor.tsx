import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductsScreen = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const token = await SecureStore.getItemAsync('jwt');
        const res = await axios.get('http://172.20.10.3:8000/shopping/products/', {
            headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data);
    };

    const handleDelete = async (id: number) => {
        Alert.alert('Confirmed to delete?', 'Are you sure？', [
            { text: 'cancel', style: 'cancel' },
            {
                text: 'delete',
                style: 'destructive',
                onPress: async () => {
                    const token = await SecureStore.getItemAsync('jwt');
                    await axios.delete(`http://172.20.10.3:8000/shopping/products/${id}/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setProducts(products.filter((product) => product.id !== id));
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push('/(root)/(tabs)/profile')
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <Text style={styles.header}>Products List</Text>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 160 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productInfo}>Category: {item.category}</Text>
                        <Text style={styles.productInfo}>Price: ${item.suppliers_info[0]?.price || '无价格'}</Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push({ pathname: '/vendor-create', params: { id: item.id } })}
                            >
                                <Text style={styles.buttonText}>
                                    <Ionicons name="create-outline" size={16} color="white" />
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                                <Text style={styles.buttonText}>
                                    <Ionicons name="trash-outline" size={16} color="white" />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/vendor-create')}>
                <Text style={styles.createButtonText}>＋ Create product</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 20,
        textAlign: 'center',
        marginTop: 50,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    productInfo: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 12,
    },
    editButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
    },
    deleteButton: {
        backgroundColor: '#f44336',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
    },
    createButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#2196F3',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 30, // 可根据你的状态栏高度调整
        left: 15,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
    },
});

export default ProductsScreen;
