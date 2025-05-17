import { ShoppingItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const API_BASE = 'http://172.20.10.3:8000/shopping'; // Replace with your backend address

export default function FridgeScreen() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [showExpiredOnly, setShowExpiredOnly] = useState(false);
    const [sortOption, setSortOption] = useState<'name' | 'date_asc' | 'date_desc' | 'expired'>('date_asc');
    const router = useRouter();

    useEffect(() => {
        fetchFridgeItems();
    }, []);

    const fetchFridgeItems = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const res = await axios.get(`${API_BASE}/fridge/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(res.data);
        } catch (error) {
            console.error('Failed to fetch fridge items:', error);
        } finally {
            setLoading(false);
        }
    };

    const editExpiration = (item: any) => {
        setSelectedItem(item);
        setDatePickerVisible(true);
    };

    const onDateChange = async (event: any, selectedDate?: Date) => {
        setDatePickerVisible(false);
        if (event.type === 'set' && selectedItem && selectedDate) {
            const token = await SecureStore.getItemAsync('jwt');
            const isoDate = selectedDate.toISOString().split('T')[0];
            try {
                await axios.patch(`${API_BASE}/items/${selectedItem.id}/`, {
                    expiration_date: isoDate,
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchFridgeItems();
            } catch (err) {
                console.error('Error updating expiration date', err);
            }
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        if (sortOption === 'name') {
            return a.product.name.localeCompare(b.product.name);
        } else if (sortOption === 'date_asc') {
            if (!a.expiration_date) return 1;
            if (!b.expiration_date) return -1;
            return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
        } else if (sortOption === 'date_desc') {
            if (!a.expiration_date) return 1;
            if (!b.expiration_date) return -1;
            return new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime();
        } else if (sortOption === 'expired') {
            const aExpired = a.expiration_date && new Date(a.expiration_date) < new Date();
            const bExpired = b.expiration_date && new Date(b.expiration_date) < new Date();
            return (bExpired ? 1 : 0) - (aExpired ? 1 : 0);
        }
        return 0;
    });

    const renderItem = ({ item }: { item: ShoppingItem }) => {
        const isExpired = item.expiration_date && new Date(item.expiration_date) < new Date();

        return (
            <View style={styles.item}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, isExpired && { color: '#DC2626' }]}>
                        {item.product.name} {isExpired && '⚠️ Expired'}
                    </Text>
                    <Text style={styles.expiration}>
                        Expiration Date: {item.expiration_date ? format(new Date(item.expiration_date), 'yyyy-MM-dd') : 'Not Set'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => editExpiration(item)}>
                    <Icon name="calendar" size={18} color="#4B5563" />
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" />;
    }

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push('/(root)/(tabs)/shopping-list');
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>

            <Text style={styles.header}>Fridge</Text>

            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowExpiredOnly(prev => !prev)}
            >
                <Text style={styles.toggleButtonText}>
                    {showExpiredOnly ? 'Show All' : 'Show Expired Only'}
                </Text>
            </TouchableOpacity>

            <Picker
                selectedValue={sortOption}
                onValueChange={(value) => setSortOption(value)}
                style={styles.picker}
            >
                <Picker.Item label="Sort by Expiry (Earliest)" value="date_asc" />
                <Picker.Item label="Sort by Expiry (Latest)" value="date_desc" />
                <Picker.Item label="Sort by Name (A-Z)" value="name" />
                <Picker.Item label="Sort by Expired" value="expired" />

            </Picker>
            <FlatList
                data={sortedItems.filter(item => {
                    if (!showExpiredOnly) return true;
                    return item.expiration_date && new Date(item.expiration_date) < new Date();
                })}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {datePickerVisible && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    textColor="black"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F5F5F5',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: '#212121',
        position: 'relative',
        top: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
        color: '#616161',
    },
    expiration: {
        marginTop: 4,
        color: '#9E9E9E',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        backgroundColor: '#E0E0E0',  // 冰箱风格的按钮灰色
        padding: 10,
        borderRadius: 50,  // 圆形按钮，像冰箱上的按钮
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    toggleButton: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#BBDEF8',  // 冰箱风格的蓝色按钮
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    toggleButtonText: {
        fontSize: 14,
        color: '#212121',
    },
    picker: {
        marginBottom: 12,
        backgroundColor: '#0288D1',
        borderRadius: 8,
        color: '#212121',
    },
});
