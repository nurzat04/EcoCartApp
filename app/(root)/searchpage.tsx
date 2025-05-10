import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        const loadHistory = async () => {
            const saved = await SecureStore.getItemAsync('searchHistory');
            if (saved) setHistory(JSON.parse(saved));
        };
        loadHistory();
    }, []);

    const saveToHistory = async (term: string) => {
        const updated = [term, ...history.filter(q => q !== term)].slice(0, 5);
        setHistory(updated);
        await SecureStore.setItemAsync('searchHistory', JSON.stringify(updated));
    };

    const debouncedSearch = useDebouncedCallback(async (text: string) => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.get(`http://172.20.10.3:8000/users/users/search/?q=${text}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error searching users', error);
        } finally {
            setLoading(false);
        }
    }, 500);

    const handleSearch = (text: string) => {
        setQuery(text);
        debouncedSearch(text);
    };

    const handleAddContact = async (username: string) => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.post(
                'http://172.20.10.3:8000/users/contacts/add/',
                { username },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response) {
                saveToHistory(username);
                router.push('/(root)/contactspage');
            }
        } catch (error) {
            console.error('Error adding contact', error);
        }
    };

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push('/(root)/contactspage')
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <TextInput
                placeholder="Search by username"
                value={query}
                onChangeText={handleSearch}
                style={styles.input}
            />

            {history.length > 0 && (
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    {history.map((item, index) => (
                        <TouchableOpacity key={index} onPress={() => handleSearch(item)} style={styles.historyItem}>
                            <Text>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#007bff" />
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.resultItem}>
                            <Image source={{ uri: item.image }} style={styles.avatar} />
                            <View style={styles.info}>
                                <Text style={styles.username}>{item.username}</Text>
                                <Text style={styles.email}>{item.email}</Text>
                            </View>
                            {!item.is_contact && (
                                <TouchableOpacity onPress={() => handleAddContact(item.username)} style={styles.addButton}>
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f4f4f9',
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        marginTop: 20,
        marginLeft: 40,
        width: 230,
        backgroundColor: '#fff',
    },
    historyContainer: {
        marginBottom: 20,
    },
    historyItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    info: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        color: '#888',
    },
    addButton: {
        backgroundColor: '#3498db',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
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

export default SearchPage;
