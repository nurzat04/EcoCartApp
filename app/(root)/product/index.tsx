import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import Icon from 'react-native-vector-icons/Feather';
dayjs.extend(relativeTime);

type Category = {
    id: number;
    name: string;
    display_name: string;
};

type Discount = {
    type: 'percentage' | 'fixed';
    value: number;
    valid_until: string;
};

type SupplierInfo = {
    supplier_name: string;
    price: string;
    stock_status: string;
    discount: Discount | null;
    final_price: string;
};

type Product = {
    id: number;
    name: string;
    description: string;
    category: string;
    suppliers_info: SupplierInfo[];
    image: string;
};

const Products = () => {
    const { selectedCategory } = useLocalSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [discountTimers, setDiscountTimers] = useState<Map<number, string>>(new Map()); // 存储每个折扣的倒计时
    const router = useRouter();
    const pathname = usePathname()

    useEffect(() => {
        if (selectedCategory) {
            setActiveCategory(selectedCategory.toString());
        }
    }, [selectedCategory]);

    useEffect(() => {
        axios.get('http://172.20.10.3:8000/shopping/categories')
            .then((res) => {
                const allCategory: Category = {
                    id: 0,
                    name: '',
                    display_name: 'All',
                };
                setCategories([allCategory, ...res.data]);
            })
            .catch((err) => console.error('Error loading categories:', err));
    }, []);

    useEffect(() => {
        setLoading(true);
        const url = activeCategory
            ? `http://172.20.10.3:8000/shopping/product-lists?category=${activeCategory}`
            : `http://172.20.10.3:8000/shopping/product-lists`;

        axios.get(url)
            .then((res) => setProducts(res.data))
            .catch((err) => console.error('Error loading products:', err))
            .finally(() => setLoading(false));
    }, [activeCategory]);

    // 每秒更新一次倒计时
    useEffect(() => {
        const interval = setInterval(() => {
            const updatedTimers = new Map(discountTimers);

            products.forEach((product) => {
                const supplierInfo = product.suppliers_info[0];
                const discount = supplierInfo?.discount;
                if (discount && discount.valid_until) {
                    const deadline = dayjs(discount.valid_until);
                    const now = dayjs();
                    const timeLeft = deadline.diff(now, 'second');

                    if (timeLeft > 0) {
                        updatedTimers.set(product.id, deadline.from(now).replace('in ', ''));
                    } else {
                        updatedTimers.set(product.id, 'Expired');
                    }
                }
            });

            setDiscountTimers(new Map(updatedTimers));
        }, 1000);

        return () => clearInterval(interval); // 清除定时器
    }, [products, discountTimers]);

    const renderCategory = useCallback(({ item }: { item: Category }) => (
        <TouchableOpacity
            style={[
                styles.categoryButton,
                item.name === activeCategory && styles.categoryButtonActive,
                activeCategory === undefined && item.name === '' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveCategory(item.name)}
        >
            <Text style={styles.categoryText}>{item.display_name}</Text>
        </TouchableOpacity>
    ), [activeCategory]);

    const renderProduct = useCallback(({ item }: { item: Product }) => {
        const supplierInfo = item.suppliers_info[0];
        const discount = supplierInfo?.discount;
        const countdown = discount ? discountTimers.get(item.id) : null;

        // 根据倒计时剩余时间选择颜色
        let countdownColor = '#000'; // 默认黑色
        if (countdown === 'Expired') {
            countdownColor = '#808080'; // 过期的折扣显示灰色
        } else if (countdown && countdown.includes('day') && countdown.includes('hour')) {
            countdownColor = '#d62828'; // 红色
        } else if (countdown && countdown.includes('hour')) {
            countdownColor = '#ff6f00'; // 橙色
        }

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString(), from: `/product?category=${activeCategory}` } })}
            >
                <View>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>

                        <View style={styles.productPriceContainer}>
                            <Text style={styles.finalPrice}>${supplierInfo.final_price}</Text>
                            {supplierInfo.discount && (
                                <Text style={styles.originalPrice}>${supplierInfo.price}</Text>
                            )}
                        </View>

                        {supplierInfo?.discount && (
                            <Text style={styles.productDiscount}>
                                {supplierInfo.discount.type === 'percentage'
                                    ? `${supplierInfo.discount.value}% OFF`
                                    : `-$${supplierInfo.discount.value}`}
                            </Text>
                        )}

                        {supplierInfo.discount && countdown !== 'Expired' && (
                            <View style={styles.discountTimerContainer}>
                                <Ionicons name="time" size={10} color="#d62828" />
                                <Text style={[styles.discountTimer, { color: countdownColor }]}>
                                    {countdown}
                                </Text>
                            </View>
                        )}

                        {supplierInfo.discount && countdown === 'Expired' && (
                            <Text style={styles.discountExpired}>Discount expired</Text>
                        )}

                        <Text style={[
                            styles.productStockStatus,
                            supplierInfo?.stock_status === 'in_stock' ? styles.inStock : styles.outOfStock
                        ]}>
                            {supplierInfo?.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.addToCartButton}>
                        <Icon name="plus-circle" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }, [discountTimers]);

    const renderSkeleton = () => (
        <View>
            <ShimmerPlaceholder
                style={styles.productImage}
                LinearGradient={LinearGradient}
            />
            <ShimmerPlaceholder
                style={{ width: 40, height: 10, borderRadius: 4, marginTop: 4, marginLeft: 15 }}
                LinearGradient={LinearGradient}
            />
        </View>
    );

    return (
        <View className='flex-1 px-5 bg-white'>
            <View className='mt-20 flex-row justify-between items-center'>
                <View>
                    <Text className='text-4xl font-bold text-gray-800'>Daily</Text>
                    <Text className='text-2xl text-primary-300'>Grocery Food</Text>
                </View>
                <TouchableOpacity className='p-2'>
                    <Icon name="search" size={30} color="#bc3908" />
                </TouchableOpacity>
            </View>
            <View>
                <FlatList
                    data={categories}
                    horizontal
                    renderItem={renderCategory}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.categoryListContainer}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4F772D" />
            ) : (
                <FlatList
                    data={products}
                    renderItem={loading ? () => renderSkeleton() : renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={[styles.productListContainer, { paddingBottom: 70 }]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    categoryListContainer: {
        paddingHorizontal: 0,
        paddingBottom: 10,
        paddingTop: 10,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: '#ddd',
        minWidth: 90,
        maxWidth: 170,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40
    },
    categoryButtonActive: {
        backgroundColor: '#90a955',
    },
    categoryText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    productListContainer: {
        marginTop: 10,
    },
    productCard: {
        marginBottom: 15,
        backgroundColor: '#f7f7f7',
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        width: '48%',
    },
    productImage: {
        width: '100%',
        height: 150,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
        color: '#333',
    },
    productPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
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
        marginLeft: 5,
    },
    productDiscount: {
        fontSize: 12,
        color: 'white',
        backgroundColor: '#bc3908',
        width: 70,
        height: 17,
        position: 'absolute',
        bottom: 260,
        right: 67,
        borderRadius: 4,
    },

    discountTimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },

    discountTimer: {
        fontSize: 12,
        marginLeft: 5,
    },
    discountExpired: {
        fontSize: 12,
        color: '#808080',
        fontStyle: 'italic',
        marginTop: 4,
    },
    productStockStatus: {
        fontSize: 11,
        marginTop: 30,
        color: '#245501',
        width: 70,
    },
    inStock: { color: '#245501' },
    outOfStock: { color: '#d62828' },

    addToCartButton: {
        marginLeft: 100,
        borderRadius: 6,
        paddingVertical: 4,
        alignItems: 'center',
        width: 30,
        position: 'absolute',
        top: 240,
    },
});

export default Products;
