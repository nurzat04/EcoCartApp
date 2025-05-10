import icons from '@/constants/icons';
import { ShoppingItem } from '@/types';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import * as Animatable from 'react-native-animatable'; // 引入动画库
import { Swipeable } from 'react-native-gesture-handler'; // 引入手势处理库
import Icon from 'react-native-vector-icons/Feather';

const NotificationBell = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expiringItems, setExpiringItems] = useState<ShoppingItem[]>([]);
    const [expiredItems, setExpiredItems] = useState<ShoppingItem[]>([]);
    const router = useRouter()
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchExpiredItems(), fetchExpiringItems()]);
            setLoading(false);
        };
        loadData();
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

    const markAllExpiringAsRead = async () => {
        const token = await SecureStore.getItemAsync('jwt');
        try {
            await axios.post('http://172.20.10.3:8000/shopping/expiring/mark-all/', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchExpiringItems();
        } catch (error) {
            console.error("Error marking all expiring items as read", error);
        }
    };

    const markExpiringRead = async (itemId: number) => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            await axios.patch(`http://172.20.10.3:8000/shopping/expiring-items/${itemId}/`, {
                reminder_sent: true,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpiringItems((prev) => prev.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Mark as read failed:', error);
            Alert.alert('Error', 'Failed to mark item as read.');
        }
    };

    const markAllExpiredAsRead = async () => {
        const token = await SecureStore.getItemAsync('jwt');
        try {
            await axios.post('http://172.20.10.3:8000/shopping/expired/mark-all/', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchExpiredItems();
        } catch (error) {
            console.error("Error marking all expired items as read", error);
        }
    };

    const markExpiredAsRead = async (itemId: number) => {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            await axios.patch(`http://172.20.10.3:8000/shopping/expired-items/${itemId}/`, {
                expired_reminder_sent: true,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpiredItems((prev) => prev.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Mark expired as read failed:', error);
        }
    };

    const toggleModal = () => {
        const newState = !visible;
        setVisible(newState);
        if (newState) {
            fetchExpiredItems();
            fetchExpiringItems();
        }
    };

    const calculateDaysLeft = (expirationDate: string): number => {
        const today = new Date();
        const expiry = new Date(expirationDate);
        const timeDiff = expiry.getTime() - today.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };

    const unreadCount = expiringItems.length + expiredItems.length;

    // Bell 动画效果
    const bellAnimation = visible ? 'shake' : 'fadeIn'; // 根据弹窗状态调整动画

    return (
        <>
            <TouchableOpacity onPress={toggleModal}>
                <Animatable.View animation={bellAnimation} duration={1000} iterationCount={1} style={{ position: 'relative' }}>
                    <Image source={icons.bell} style={{ width: 24, height: 24, marginLeft: 120 }} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </Animatable.View>
            </TouchableOpacity>

            <Modal
                visible={visible}
                animationType="fade"
                transparent
                onRequestClose={() => setVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.popup}>
                                <Text style={styles.title}>Notifications</Text>
                                {loading ? (
                                    <ActivityIndicator size="small" />
                                ) : (
                                    <>
                                        {expiredItems.length > 0 && (
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => router.push('/expiration')}
                                                    style={styles.viewMoreButtonI}
                                                >
                                                    <Text style={styles.viewMoreText}>View More</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.subTitle}>Expired Items</Text>
                                                <TouchableOpacity
                                                    style={styles.markAllButton}
                                                    onPress={markAllExpiredAsRead}
                                                >
                                                    <Text style={styles.markAllButtonText}>✓ Mark All as Read</Text>
                                                </TouchableOpacity>
                                                <FlatList
                                                    data={expiredItems.slice(0, 2)}
                                                    keyExtractor={(item) => `expired-${item.id}`}
                                                    renderItem={({ item }) => (
                                                        <Swipeable
                                                            renderRightActions={() => (
                                                                <TouchableOpacity
                                                                    style={styles.deleteButton}
                                                                    onPress={() => markExpiredAsRead(item.id)}
                                                                >
                                                                    <Icon name="trash" size={15} color="white" />
                                                                </TouchableOpacity>
                                                            )}
                                                        >
                                                            <View style={[styles.itemRow, { backgroundColor: 'rgb(239, 239, 239)' }]} >
                                                                <Text style={styles.itemText}>
                                                                    <Text className='font-semibold'>{item.product.name}</Text>
                                                                    - expired on {item.expiration_date}
                                                                </Text>
                                                            </View>
                                                        </Swipeable>
                                                    )}
                                                />
                                            </>
                                        )}
                                        {expiringItems.length > 0 && (
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => router.push('/expiration')}
                                                    style={styles.viewMoreButtonE}
                                                >
                                                    <Text style={styles.viewMoreText}>View More</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.subTitle}>Expiring Soon</Text>
                                                <TouchableOpacity
                                                    style={styles.markAllButton}
                                                    onPress={markAllExpiringAsRead}
                                                >
                                                    <Text style={styles.markAllButtonText}>✓ Mark All as Read</Text>
                                                </TouchableOpacity>
                                                <FlatList
                                                    data={expiringItems.slice(0, 2)}
                                                    keyExtractor={(item) => `expiring-${item.id}`}
                                                    renderItem={({ item }) => {
                                                        const daysLeft = calculateDaysLeft(item.expiration_date);
                                                        return (
                                                            <Swipeable
                                                                renderRightActions={() => (
                                                                    <TouchableOpacity
                                                                        style={styles.deleteButton}
                                                                        onPress={() => markExpiringRead(item.id)}
                                                                    >
                                                                        <Icon name="trash" size={18} color="white" />
                                                                    </TouchableOpacity>
                                                                )}
                                                            >
                                                                <View style={styles.itemRow}>
                                                                    <Text style={styles.itemText}>
                                                                        <Text className='font-semibold'>{item.product.name}</Text>
                                                                        - in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                                                                    </Text>
                                                                </View>
                                                            </Swipeable>
                                                        );
                                                    }}
                                                />
                                            </>
                                        )}
                                        {expiredItems.length === 0 && expiringItems.length === 0 && (
                                            <Text style={styles.emptyText}>No notifications</Text>
                                        )}
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    popup: {
        width: 310,
        backgroundColor: '#fff',
        marginTop: 110,
        marginRight: 7,
        padding: 20,
        borderRadius: 15,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 12,
        marginLeft: 8,
    },
    subTitle: {
        fontWeight: '600',
        fontSize: 16,
        marginTop: 10,
        marginLeft: 8,
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        width: 280,
        height: 36,
        paddingLeft: 17,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        backgroundColor: '#f9f9f9',
        elevation: 2,
    },
    itemText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 7,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        width: 47,
        height: 36
    },
    markAllButton: {
        marginBottom: 6,
        backgroundColor: '#4F772D',
        padding: 8,
        borderRadius: 8,
    },
    markAllButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: -5,
        left: 134,
        backgroundColor: 'red',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
    },
    viewMoreButtonI: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#f6f6f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        position: 'absolute',
        right: 20,
        top: 50,
    },
    viewMoreButtonE: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#f6f6f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        position: 'absolute',
        right: 20,
        top: 222,
    },

    viewMoreText: {
        fontWeight: '500',
        color: '#333',
    },

});

export default NotificationBell;

