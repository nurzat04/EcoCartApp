import { Contact } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const CreateShoppingListScreen = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
    const [listName, setListName] = useState('');
    const [creating, setCreating] = useState(false);
    const router = useRouter();
    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.get('http://172.20.10.3:8000/users/contacts/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(response.data);
        } catch (error) {
            console.error('Error fetching contacts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShoppingList = async () => {
        if (!listName.trim()) {
            Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Please enter a shopping list name',
                visibilityTime: 2000,
                autoHide: true,
                topOffset: 60,
            });
            return;
        }

        if (selectedContacts.length === 0) {
            Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Please select at least one contact',
                visibilityTime: 2000,
                autoHide: true,
            });
            return;
        }


        setCreating(true);

        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.post(
                'http://172.20.10.3:8000/shopping/lists/',
                {
                    name: listName,
                    shared_with_ids: selectedContacts,
                    is_shared: true,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            Toast.show({
                type: 'success',
                position: 'top',
                text1: 'Your shopping list created!✅',
                visibilityTime: 2000,
                autoHide: true,
            });
            router.push('/(root)/(tabs)/shopping-list');
        } catch (error) {
            console.error('Error creating shopping list', error);
            Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Failed to create shopping list! ❌',
                visibilityTime: 2000,
                autoHide: true,
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => router.push('/(root)/(tabs)/shopping-list')}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter shopping list name"
                        value={listName}
                        onChangeText={setListName}
                    />

                    <Text style={styles.title}>Choose Contacts to Share List</Text>


                    {/* 限制联系人列表的高度 */}
                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={contacts}
                            renderItem={({ item }) => {
                                const isSelected = selectedContacts.includes(item.contact_user.id);
                                return (
                                    <View style={[styles.contactCard, isSelected && { backgroundColor: 'rgb(245, 253, 242)' }]}>
                                        <View style={styles.contactHeader}>
                                            <Image source={{ uri: item.contact_user.image }} style={styles.avatar} />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.contactName}>{item.contact_user.username}</Text>
                                                <Text style={styles.contactEmail}>{item.contact_user.email}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setSelectedContacts(selectedContacts.filter(id => id !== item.contact_user.id));
                                                    } else {
                                                        setSelectedContacts([...selectedContacts, item.contact_user.id]);
                                                    }
                                                }}
                                            >
                                                <Ionicons
                                                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                                    size={28}
                                                    color={isSelected ? '#4F772D' : '#ccc'}
                                                />
                                            </TouchableOpacity>

                                        </View>
                                    </View>
                                );
                            }}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </View>

                    {/* 创建购物清单按钮 */}
                    <TouchableOpacity
                        onPress={handleCreateShoppingList}
                        disabled={creating}
                        style={{
                            marginTop: 10,
                            padding: 10,
                            borderRadius: 5,
                            paddingVertical: 14,
                            backgroundColor: creating ? '#cccccc' : '#4F772D',
                            alignSelf: 'center',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: 50,
                            marginBottom: 30,
                        }}
                    >
                        <Text style={styles.createButtonText}>
                            {creating ? 'creating...' : 'Create shopping list'}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

export default CreateShoppingListScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 80,
        paddingHorizontal: 20,
        backgroundColor: '#f0f4f8',
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#2c3e50',
        textAlign: 'center',
    },
    input: {
        height: 45,
        borderColor: '#ddd',
        borderWidth: 1,
        marginBottom: 20,
        paddingLeft: 15,
        borderRadius: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    contactCard: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#eee',
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#ddd',
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    contactEmail: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 15,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
