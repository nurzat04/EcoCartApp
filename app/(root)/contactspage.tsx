import { Contact } from '@/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ContactsPage = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter()
    const [editingNotes, setEditingNotes] = useState<{ [key: number]: string }>({});

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

    const handleDelete = async (contactId: number) => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            await axios.delete(`http://172.20.10.3:8000/users/contacts/delete/${contactId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchContacts();  // Refresh the contact list after deletion
        } catch (error) {
            console.error('Error deleting contact', error);
        }
    };

    const handleNoteChange = async (note: string, contactId: number) => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.patch(
                `http://172.20.10.3:8000/users/contacts/update/${contactId}/`, // 修改这里，指定联系人 ID
                { note },
                { headers: { Authorization: `Bearer ${token}` } }
            );

        } catch (error) {
            console.error('Error updating note', error);
        }
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
            <TouchableOpacity onPress={() => router.push('/(root)/searchpage')} style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Search Contacts</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={contacts}
                    renderItem={({ item }) => (
                        <View style={styles.contactCard}>
                            <View style={styles.contactHeader}>
                                <Image source={{ uri: item.contact_user.image }} style={styles.avatar} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.contactName}>{item.contact_user.username}</Text>
                                    <Text style={styles.contactEmail}>{item.contact_user.email}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                    <MaterialIcons name="delete" size={24} color="#e74c3c" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Add a note..."
                                value={editingNotes[item.id] ?? item.note ?? ''}
                                onChangeText={(text) => setEditingNotes({ ...editingNotes, [item.id]: text })}
                                onBlur={() => {
                                    if (editingNotes[item.id] !== item.note) {
                                        handleNoteChange(editingNotes[item.id], item.id);
                                    }
                                }}
                                placeholderTextColor="#aaa"
                            />
                        </View>
                    )}

                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9fafc',
    },
    searchButton: {
        padding: 12,
        backgroundColor: '#2c7be5',
        borderRadius: 10,
        marginBottom: 20,
        marginTop: 15,
        width: 200,
        marginLeft: 44,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
    },
    contactCard: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 15,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#ddd',
    },
    contactName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    contactEmail: {
        fontSize: 14,
        color: '#666',
    },
    noteInput: {
        height: 42,
        backgroundColor: '#f1f3f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#333',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 15,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
    },
});
export default ContactsPage;
