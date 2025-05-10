import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const ProductDetail = () => {
    const { id, category } = useLocalSearchParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});
    const [countdownColors, setCountdownColors] = useState<{ [key: string]: string }>({});
    const [shoppingLists, setShoppingLists] = useState<any[]>([]);
    const [selectedShoppingList, setSelectedShoppingList] = useState<any>(null);
    const router = useRouter()

    useEffect(() => {
        fetchShoppingLists();
    }, []);

    const fetchShoppingLists = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('jwt');
            const response = await axios.get(`http://172.20.10.3:8000/shopping/lists/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShoppingLists(response.data);
        } catch (error) {
            console.error('Failed to fetch shopping lists', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        axios.get(`http://172.20.10.3:8000/shopping/product-lists/${id}/`)
            .then(res => {
                const productData = res.data;
                setProduct(productData);

                // 找出价格最低且有库存的供应商作为默认选择
                const availableSuppliers = productData.suppliers_info.filter(
                    (s: any) => s.stock_status !== 'out_of_stock'
                );
                if (availableSuppliers.length > 0) {
                    const cheapestSupplier = availableSuppliers.reduce((min: any, curr: any) => {
                        return parseFloat(curr.price) < parseFloat(min.price) ? curr : min;
                    }, availableSuppliers[0]);
                    setSelectedSupplier(cheapestSupplier);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!product) return;

        const interval = setInterval(() => {
            const newCountdowns: { [key: string]: string } = {};
            const newColors: { [key: string]: string } = {};

            product.suppliers_info.forEach((supplier: any, index: number) => {
                if (supplier.discount) {
                    const now = new Date().getTime();
                    const end = new Date(supplier.discount.valid_until).getTime();
                    const diff = end - now;

                    if (diff > 0) {
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                        const minutes = Math.floor((diff / (1000 * 60)) % 60);

                        newCountdowns[supplier.supplier_name] =
                            `${days}d ${hours}h ${minutes}m left`;

                        if (days < 1) newColors[supplier.supplier_name] = 'red';
                        else if (days <= 3) newColors[supplier.supplier_name] = 'orange';
                        else newColors[supplier.supplier_name] = 'green';
                    } else {
                        newCountdowns[supplier.supplier_name] = 'Expired';
                        newColors[supplier.supplier_name] = 'gray';
                    }
                }
            });

            setCountdowns(newCountdowns);
            setCountdownColors(newColors);
        }, 1000);

        return () => clearInterval(interval);
    }, [product]);

    if (loading || !product) return <ActivityIndicator size="large" color="#90a955" style={{ flex: 1 }} />;

    const sortedSuppliers = product.suppliers_info.sort((a: any, b: any) => a.final_price - b.final_price);

    const handleSelectSupplier = (supplier: any) => {
        setSelectedSupplier(supplier);
    };

    const handleAddToCart = async () => {
        if (!selectedSupplier) {
            Alert.alert('No Supplier Selected', 'Please select a supplier first.');
            return;
        }

        if (!selectedShoppingList) {
            Alert.alert('No Shopping List Selected', 'Please select a shopping list.');
            return;
        }

        // 调用 API 将商品添加到购物清单
        const token = await SecureStore.getItemAsync('jwt');

        await axios.post(`http://172.20.10.3:8000/shopping/shopping-lists/${selectedShoppingList.id}/add-product/${id}/`,
            {
                quantity: quantity,

            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )
            .then(() => {
                Alert.alert(
                    'Added to Cart',
                    `Added ${product.name} (${quantity} kg) from ${selectedSupplier.supplier_name} to your selected shopping list.`,
                    [{ text: 'OK', style: 'default' }]
                );
            })
            .catch(err => console.error(err));
    };

    const handleSelectShoppingList = (list: any) => {
        setSelectedShoppingList(list);
    };


    const calculatedPrice = selectedSupplier
        ? (selectedSupplier.final_price * quantity).toFixed(2)
        : '0.00';

    return (
        <View style={styles.container}>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push({
                        pathname: '/(root)/(tabs)/products',
                        params: category ? { category } : {}
                    })
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>

            <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
                <Image source={{ uri: product.image }} style={styles.image} />

                <View style={styles.card}>
                    <Text style={styles.title}>{product.name}</Text>

                    <View style={styles.quantityContainer}>
                        <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                            <Text style={styles.qtyText}>-</Text>
                        </Pressable>
                        <Text style={styles.qtyAmount}>{quantity} kg</Text>
                        <Pressable onPress={() => setQuantity(Math.min(99, quantity + 1))} style={styles.qtyBtn}>
                            <Text style={styles.qtyText}>+</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.sectionTitle}>Product Description</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <Text style={styles.sectionTitle}>Suppliers:</Text>
                    {sortedSuppliers.map((supplier: any, index: number) => (
                        <View key={index} style={styles.supplierBox}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.supplierText}>{supplier.supplier_name}</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.originalPrice}>${supplier.price}</Text>
                                    <Text style={styles.finalPrice}>${supplier.final_price}</Text>
                                </View>
                            </View>

                            {supplier.discount && (
                                <>
                                    <Text style={styles.discount}>
                                        {supplier.discount.type === 'percentage'
                                            ? `${supplier.discount.value}% OFF`
                                            : `-$${supplier.discount.value}`}
                                    </Text>

                                    <Ionicons style={{ position: 'absolute', top: 72, left: 15, color: countdownColors[supplier.supplier_name] }} name="time" size={15} />

                                    <Text style={[styles.countdownText, { color: countdownColors[supplier.supplier_name] }]}>
                                        {countdowns[supplier.supplier_name] || ''}
                                    </Text>
                                </>
                            )}

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                <Text style={[
                                    styles.productStockStatus,
                                    supplier.stock_status === 'in_stock' ? styles.inStock : styles.outOfStock
                                ]}>
                                    {supplier.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                </Text>

                                <Button
                                    title={selectedSupplier?.supplier_name === supplier.supplier_name ? 'Selected' : 'Select'}
                                    color={selectedSupplier?.supplier_name === supplier.supplier_name ? '#386641' : '#90a955'}
                                    onPress={() => handleSelectSupplier(supplier)}
                                />
                            </View>
                        </View>

                    ))}
                    <Text style={styles.sectionTitle}>Your Shopping Lists:</Text>
                    {shoppingLists.map((list, index) => (
                        <Pressable key={index} onPress={() => handleSelectShoppingList(list)}>
                            <Text style={styles.shoppingListText}>{list.name}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <Text style={styles.price}>${calculatedPrice}</Text>
                <Pressable
                    style={[
                        styles.cartBtn,
                        {
                            opacity: (!selectedSupplier || selectedSupplier.stock_status === 'out_of_stock') ? 0.5 : 1
                        }
                    ]}
                    onPress={handleAddToCart}
                    disabled={!selectedSupplier || selectedSupplier.stock_status === 'out_of_stock'}
                >
                    <Text style={styles.cartText}>Add to cart</Text>
                </Pressable>
            </View>

        </View >
    );
};

export default ProductDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    card: {
        flex: 1,
        marginTop: -30,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        width: 200,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        position: 'absolute',
        left: 180,
        top: 15,
    },
    qtyBtn: {
        backgroundColor: '#e5e5e5',
        borderRadius: 50,
        height: 30,
        width: 30,
    },
    qtyText: {
        fontSize: 18,
        marginLeft: 9,
        marginTop: 3,
        fontWeight: '500',
    },
    qtyAmount: {
        marginHorizontal: 15,
        fontSize: 18,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: 20,
        marginBottom: 5,
    },
    description: {
        color: '#666',
        fontSize: 15,
    },
    supplierBox: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 5,
        borderLeftColor: '#90a955',
    },

    supplierText: {
        fontWeight: '400',
        fontSize: 20,
        marginTop: 7,
        marginBottom: 5,
    },
    discount: {
        fontSize: 14,
        color: 'white',
        backgroundColor: '#bc3908',
        width: 80,
        height: 17,
        position: 'absolute',
        bottom: 80,
        left: 15,
        borderRadius: 4,

    },
    countdownText: {
        fontSize: 12,
        color: '#f77f00',
        marginTop: 20,
        marginLeft: 15,
    },

    finalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#31572c',
    },

    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#90a955',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    productStockStatus: {
        fontSize: 13,
        marginTop: 10,
        color: 'gray',
        width: 70,
    },

    inStock: { color: '#245501' },
    outOfStock: { color: '#d62828' },

    cartBtn: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    cartText: {
        color: '#90a955',
        fontWeight: 'bold',
    },
    discountTag: {
        backgroundColor: '#bc3908',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    discountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
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
    shoppingListText: {
        fontSize: 18,
        color: '#90a955',
        marginVertical: 8,
    },
});
