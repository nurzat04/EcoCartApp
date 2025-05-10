import { Contact, ShoppingList } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Feather';

// 原先的API地址和样式常量
const API_BASE = 'http://172.20.10.3:8000/shopping'; // 替换为你的后端地址
const TEXT_DARK = '#14532d';
const TEXT_LIGHT = '#6b7280';

export default function ShoppingListScreen() {
    const [loading, setLoading] = useState(false);
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]); // 存储联系人
    const [selectedListId, setSelectedListId] = useState<number | null>(null);

    useEffect(() => {
        fetchShoppingLists();
    }, []);

    const fetchShoppingLists = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.get(`${API_BASE}/lists/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShoppingLists(response.data);
        } catch (error) {
            console.error('Failed to fetch shopping lists', error);
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id: number) => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            await axios.delete(`${API_BASE}/lists/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShoppingLists(prev => prev.filter(list => list.id !== id));
        } catch (error) {
            console.error('Failed to delete list:', error);
        }
    };

    const handleCreateList = () => {
        router.push('/create-shopping-list'); // 根据你的路由结构跳转
    };

    const openAddMemberModal = async (listId: number) => {
        setSelectedListId(listId);
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.get('http://172.20.10.3:8000/users/contacts/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(response.data); // 假设返回联系人列表
            setModalVisible(true);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        }
    };

    const handleAddContactToList = async (contactId: number) => {
        if (!selectedListId) return;
        try {
            const token = await SecureStore.getItemAsync('jwt');
            await axios.post(
                `${API_BASE}/lists/${selectedListId}/share/`,
                { user_id: contactId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setModalVisible(false);
            fetchShoppingLists(); // 更新 UI
        } catch (error) {
            console.error('Failed to share list with contact:', error);
        }
    };

    const handleShare = async (uuid: string) => {
        const link = `http://172.20.10.3:8000/shopping/list/share/${uuid}`;
        await Clipboard.setStringAsync(link);
        Toast.show({
            type: 'success',
            text1: 'Link copied to clipboard!',
            text2: link,
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your</Text>
                <Text style={styles.headerSubtitle}>Shopping Lists</Text>
            </View>

            <View style={{ paddingBottom: 200 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={TEXT_LIGHT} style={{ marginTop: 50 }} />
                ) : shoppingLists.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 80 }}>
                        <Text style={styles.emptyText}>You have no shopping lists yet.</Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleCreateList}>
                            <Text style={styles.addButtonText}>Create your first list</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <SwipeListView
                        data={shoppingLists}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.title}>
                                        {item.name} {item.is_shared ? '(Shared)' : ''}
                                    </Text>
                                    <TouchableOpacity onPress={() =>
                                        router.push({ pathname: '/(root)/shopping-items/[id]', params: { id: item.id.toString() } })
                                    }>
                                        <Icon name='arrow-right' size={20} color={TEXT_LIGHT} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.subtitle}>{item.items.length} items</Text>
                                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                <View style={styles.avatars}>
                                    {item.shared_with.slice(0, 4).map((user, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: user.image }}
                                            style={[styles.avatar, { marginLeft: index === 0 ? 0 : -12, zIndex: 10 - index }]}
                                        />
                                    ))}

                                    {item.shared_with.length > 4 && (
                                        <View style={[styles.avatar, styles.moreAvatar, { marginLeft: -12 }]}>
                                            <Text style={styles.moreAvatarText}>+{item.shared_with.length - 4}</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.avatar, styles.addMemberButton, { marginLeft: -12 }]}
                                        onPress={() => openAddMemberModal(item.id)}
                                    >
                                        <Icon name="plus" size={18} color="black" style={{ marginLeft: 7, marginTop: 6 }} />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => handleShare(item.uuid)} style={{ marginTop: 10, position: 'absolute', right: 230, flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="share-social-outline" size={18} color="#4F772D" />
                                        <Text style={{ marginLeft: 4, color: '#4F772D' }}></Text>
                                    </TouchableOpacity>


                                </View>

                            </View>
                        )}
                        renderHiddenItem={({ item }) => (
                            <View style={styles.rowBack}>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Icon name="trash-2" size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                        rightOpenValue={-75}
                        disableRightSwipe
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchShoppingLists} />
                        }
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>

            {/* Floating Action Button for Creating New List */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateList}
            >
                <Icon name="plus" size={30} color="black" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Add Contact to List</Text>
                        <FlatList
                            data={contacts}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() => handleAddContactToList(item.contact_user.id)}
                                >
                                    <Image source={{ uri: item.contact_user.image }} style={styles.contactAvatar} />
                                    <Text>{item.contact_user.username}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                            <Text style={{ color: 'white' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        marginTop: 60,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 20,
        color: '#36820e',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#36820e',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    card: {
        marginHorizontal: 20,
        marginVertical: 10,
        height: 125,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderLeftWidth: 5,
        borderLeftColor: '#36820e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
    },
    subtitle: {
        fontSize: 14,
        color: TEXT_LIGHT,
    },
    date: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    avatars: {
        flexDirection: 'row',
        marginTop: 10,
        position: 'absolute',
        right: 5,
        bottom: 5,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginLeft: -10,
        zIndex: 1,
    },
    moreAvatar: {
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreAvatarText: {
        fontSize: 12,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    rowBack: {
        alignItems: 'center',
        backgroundColor: '#dc2626',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 15,
        borderRadius: 16,
        marginHorizontal: 20,
        marginVertical: 10,
    },
    deleteButton: {
        width: 60,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addMemberButton: {
        backgroundColor: 'rgb(232, 235, 242)',
    },
    addButtonIcon: {
        position: 'absolute',
        right: 20,
        top: -10,
    },
    fab: {
        position: 'absolute',
        right: 20,
        top: 70,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    contactAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    modalCloseButton: {
        marginTop: 12,
        backgroundColor: '#36820e',
        padding: 10,
        alignItems: 'center',
        borderRadius: 8,
    },

});
