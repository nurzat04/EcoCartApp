import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Checkbox from 'expo-checkbox';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Feather';

const API_BASE = 'http://172.20.10.3:8000/shopping';

const ShoppingListItems = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [collapsedCompleted, setCollapsedCompleted] = useState(false); // 新增状态，控制已完成分组的展开/折叠
    const router = useRouter()

    useEffect(() => {
        if (id) fetchItems();
    }, [id]);

    const fetchItems = async () => {
        setLoading(true);
        const token = await SecureStore.getItemAsync('jwt');
        try {
            const res = await axios.get(`${API_BASE}/lists/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(res.data.items || []);
        } catch (err) {
            console.error('Failed to load items', err);
        } finally {
            setLoading(false);
        }
    };

    const activeItems = items
        .filter(item => !item.is_checked)
        .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime());

    const completedItems = items
        .filter(item => item.is_checked)
        .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime());

    const toggleChecked = async (itemId: number, currentChecked: boolean) => {
        const token = await SecureStore.getItemAsync('jwt');
        try {
            await axios.patch(
                `${API_BASE}/items/${itemId}/`,
                { is_checked: !currentChecked },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setItems(prev =>
                prev.map(item =>
                    item.id === itemId ? { ...item, is_checked: !currentChecked } : item
                )
            );
        } catch (err) {
            console.error('Toggle failed', err);
        }
    };

    const deleteItem = async (itemId: number) => {
        const token = await SecureStore.getItemAsync('jwt');
        try {
            await axios.delete(`${API_BASE}/items/${itemId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(prev => prev.filter(item => item.id !== itemId));
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const deleteSelectedItems = async () => {
        Alert.alert('Confirm', 'Delete selected items?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const token = await SecureStore.getItemAsync('jwt');
                    try {
                        await Promise.all(
                            selected.map(id =>
                                axios.delete(`${API_BASE}/items/${id}/`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                })
                            )
                        );
                        setItems(prev => prev.filter(item => !selected.includes(item.id)));
                        setSelected([]);
                        setEditMode(false);
                    } catch (err) {
                        console.error('Batch delete failed', err);
                    }
                },
            },
        ]);
    };

    const toggleSelect = (itemId: number) => {
        setSelected(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleLongPress = () => {
        setEditMode(true);
        setSelected([]);
    };

    const toggleSelectAll = () => {
        const targetIds = activeItems.map(item => item.id);
        if (selected.length === targetIds.length) {
            setSelected([]);
        } else {
            setSelected(targetIds);
        }
    };

    const handleDelete = (itemId: number) => {
        Alert.alert('Delete', 'Delete this item?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteItem(itemId),
            },
        ]);
    };

    const editQuantity = async (item: any) => {
        Alert.prompt('Update Quantity', 'Enter new quantity:', async (text) => {
            const quantity = parseInt(text);
            if (!isNaN(quantity)) {
                const token = await SecureStore.getItemAsync('jwt');
                await axios.patch(`${API_BASE}/items/${item.id}/`, { quantity }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchItems();
            }
        });
    };

    const editExpiration = (item: any) => {
        setSelectedItem(item);
        setDatePickerVisible(true);
    };

    const onDateChange = async (event: any, selectedDate?: Date) => {
        setDatePickerVisible(false);
        if (event.type === 'set' && selectedItem && selectedDate) {
            const token = await SecureStore.getItemAsync('jwt');
            const isoDate = selectedDate.toISOString().split('T')[0]; // 格式为 YYYY-MM-DD
            await axios.patch(`${API_BASE}/items/${selectedItem.id}/`, {
                expiration_date: isoDate,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchItems();
            setSelectedItem(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const product = item.product;
        const supplier = product.suppliers_info?.[0];
        const expired = new Date(item.expiration_date) < new Date();
        const isSelected = selected.includes(item.id);
        let longPressTimeout: ReturnType<typeof setTimeout>;


        return (
            <TouchableOpacity
                activeOpacity={0.97}
                onPressIn={() => {
                    longPressTimeout = setTimeout(() => {
                        handleLongPress();
                    }, 500); // 长按判定时间
                }}
                onPressOut={() => {
                    clearTimeout(longPressTimeout);
                }}
                onPress={() => {
                    if (!editMode) toggleChecked(item.id, item.is_checked);
                    else toggleSelect(item.id);
                }}
            >
                <View style={styles.card}>
                    <View style={styles.row}>
                        {editMode ? (
                            <Checkbox
                                value={isSelected}
                                color={'#4F772D'}
                                onValueChange={() => toggleSelect(item.id)}
                                style={styles.boxCheckbox}
                                className='mb-10'
                            />
                        ) : (
                            <TouchableOpacity
                                onPress={() => toggleChecked(item.id, item.is_checked)}
                                style={[styles.circleCheckbox, item.is_checked && { backgroundColor: '#4F772D' }]}>
                                {item.is_checked && <Icon name="check" size={14} color="#fff" />}
                            </TouchableOpacity>
                        )}

                        <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                            <View style={styles.imageWrapper}>
                                {product.image ? (
                                    <Image source={{ uri: product.image }} style={styles.image} />
                                ) : (
                                    <Icon name="image" size={20} color="#9CA3AF" />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.name, item.is_checked && { textDecorationLine: 'line-through', color: '#9CA3AF' }]}>
                                    <Text>{product.name}</Text>
                                    <Text style={[styles.detail, item.is_checked && { textDecorationLine: 'line-through', color: '#9CA3AF' }]}>({item.quantity})</Text>
                                </Text>


                                <Text style={styles.category}>{product.category}</Text>
                                <Text
                                    style={[expired && { color: '#EF4444' }]}>
                                    <Text>
                                        <Text className='bg-blue-200' style={[expired && { backgroundColor: '#EF4444', color: 'white' }]} >{expired ? 'Expired' : 'Expires'}</Text>
                                        {item.expiration_date}
                                    </Text>
                                </Text>

                                <Text>{supplier?.price * item.quantity}</Text>
                                <Text>{item.total_price}</Text>

                                <View style={{ flexDirection: 'row', gap: 12, position: 'relative', top: 4, left: 110 }}>
                                    <TouchableOpacity onPress={() => editQuantity(item)}>
                                        <Icon name="edit-2" size={16} color="#4B5563" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => editExpiration(item)}>
                                        <Icon name="calendar" size={16} color="#4B5563" />
                                    </TouchableOpacity>
                                </View>


                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <GestureHandlerRootView style={[styles.container, { flex: 1, paddingTop: 100, paddingVertical: 0 }]}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push('/(root)/(tabs)/shopping-list')
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <View>
                <Text></Text>
            </View>
            {editMode && items.length > 0 && (
                <View style={styles.editBar}>
                    <TouchableOpacity onPress={toggleSelectAll}>
                        <Icon name="check-square" size={20} color="#4F772D" />
                        {/* <Text style={styles.editBarText}>
                            {selected.length === items.length ? 'Deselect All' : 'Select All'}
                        </Text> */}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEditMode(false); setSelected([]); }}>
                        <Icon name="x-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deleteSelectedItems}>
                        <Icon name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#4F772D" style={{ marginTop: 40 }} />
            ) : items.length === 0 ? (
                <Text style={styles.emptyText}>No items in this shopping list.</Text>
            ) : (
                <>
                    {/* 渲染未完成的商品 */}
                    <SwipeListView
                        data={activeItems}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        renderHiddenItem={({ item }) => (
                            <View style={styles.rowBack}>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(item.id)} // 删除操作
                                >
                                    <Icon name="trash-2" size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                        rightOpenValue={-75}
                        disableRightSwipe={true}
                        closeOnRowPress={true}
                    />

                    {/* 渲染已完成的商品（可以折叠/展开） */}
                    <TouchableOpacity
                        onPress={() => setCollapsedCompleted(!collapsedCompleted)}
                        style={styles.toggleCompletedButton}
                    >
                        <Icon name={collapsedCompleted ? 'chevron-down' : 'chevron-up'} size={16} color="#4B5563" />
                        <Text style={{ marginLeft: 6, color: '#4B5563', fontWeight: '500', }}>
                            {collapsedCompleted ? 'Show Completed' : 'Hide Completed'}
                        </Text>
                    </TouchableOpacity>

                    {!collapsedCompleted && completedItems.length > 0 && (
                        <SwipeListView
                            data={completedItems}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderItem}
                            renderHiddenItem={({ item }) => (
                                <View style={styles.rowBack}>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(item.id)} // 删除操作
                                    >
                                        <Icon name="trash-2" size={22} color="white" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            rightOpenValue={-75}
                            disableRightSwipe={true}
                            closeOnRowPress={true}

                        />
                    )}
                </>
            )}
            {datePickerVisible && (
                <DateTimePicker
                    value={new Date(selectedItem?.expiration_date || new Date())}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
        </GestureHandlerRootView>
    );
};

export default ShoppingListItems;

// 修改后的样式表
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(254, 247, 247, 0.85)',
        padding: 16,
    },
    card: {
        marginTop: 5,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        height: 150,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowBack: {
        flex: 1,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 15,
        borderRadius: 20,
        marginTop: 8,
        marginBottom: 10,
        position: 'absolute',
        right: 0,
        left: 0,
        bottom: 0,
        top: 0,
        height: 140,
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        height: '100%',
        borderRadius: 16,
    },
    imageWrapper: {
        width: 56,
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoSection: {
        flex: 1,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    category: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    detail: {
        fontSize: 17,
        color: 'black',
        borderRadius: 20,
        fontWeight: '500',
    },
    prices: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    strike: {
        fontSize: 14,
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    finalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4F772D',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discount: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 16,
        marginTop: 50,
    },
    circleCheckbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4F772D',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginLeft: 8,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    boxCheckbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4F772D',
        borderRadius: 6,
    },
    editBar: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 12,
    },
    editBarText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    toggleCompletedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    backButton: {
        position: 'absolute',
        top: 40, // 可根据你的状态栏高度调整
        left: 20,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
    },

});
