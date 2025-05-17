import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import Icon from 'react-native-vector-icons/Feather';
import { Product } from '../../../types';
dayjs.extend(relativeTime);

type Category = {
    id: number;
    name: string;
    display_name: string;
};

const Products = () => {
    const { selectedCategory } = useLocalSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [discountTimers, setDiscountTimers] = useState<Map<number, string>>(new Map()); // 存储每个折扣的倒计时
    const router = useRouter();
    const { category } = useLocalSearchParams()
    const [showScrollTopButton, setShowScrollTopButton] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'discount' | 'expiry'>('price_asc');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [onlyDiscounted, setOnlyDiscounted] = useState(false);

    useEffect(() => {
        if (typeof category === "string") {
            setActiveCategory(category); // 👈 激活对应分类
        }
    }, [category]);

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
            let nextValidDiscount = false; // 用于标记是否有有效折扣

            products.forEach((product) => {
                // 循环遍历每个供应商，查找有效折扣
                for (let i = 0; i < product.suppliers_info.length; i++) {
                    const supplierInfo = product.suppliers_info[i];
                    const discount = supplierInfo?.discount;

                    if (discount && discount.valid_until) {
                        const deadline = dayjs(discount.valid_until);
                        const now = dayjs();
                        const timeLeft = deadline.diff(now, 'second');

                        if (timeLeft > 0) {
                            // 如果折扣未过期，更新倒计时
                            updatedTimers.set(product.id, deadline.from(now).replace('in ', ''));
                            nextValidDiscount = true; // 标记为有有效折扣
                            break; // 找到有效折扣后跳出循环
                        } else {
                            // 如果折扣过期，标记为过期
                            updatedTimers.set(product.id, 'Expired');
                        }
                    }
                }
            });

            // 如果当前没有有效折扣，选择下一个有效折扣
            if (!nextValidDiscount) {
                products.forEach((product) => {
                    // 继续遍历供应商，查找下一个有效折扣
                    for (let i = 1; i < product.suppliers_info.length; i++) {
                        const supplierInfo = product.suppliers_info[i];
                        const discount = supplierInfo?.discount;

                        if (discount && discount.valid_until) {
                            const deadline = dayjs(discount.valid_until);
                            const now = dayjs();
                            const timeLeft = deadline.diff(now, 'second');

                            if (timeLeft > 0) {
                                updatedTimers.set(product.id, deadline.from(now).replace('in ', ''));
                                break; // 找到有效折扣后跳出循环
                            }
                        }
                    }
                });
            }

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
        let countdown = null;
        let countdownColor = '#000'; // 默认黑色
        let discount = null;
        const lowestSupplier = item.suppliers_info.find(s => s.is_lowest_price);

        // 循环检查所有供应商的折扣
        for (let i = 0; i < item.suppliers_info.length; i++) {
            const supplierInfo = item.suppliers_info[i];
            discount = supplierInfo?.discount;

            if (discount && discount.valid_until) {
                const deadline = dayjs(discount.valid_until);
                const now = dayjs();
                const timeLeft = deadline.diff(now, 'second');

                // 如果找到有效的折扣，计算倒计时
                if (timeLeft > 0) {
                    countdown = deadline.from(now).replace('in ', '');
                    // 根据倒计时剩余时间选择颜色
                    if (countdown.includes('day') && countdown.includes('hour')) {
                        countdownColor = '#d62828'; // 红色
                    } else if (countdown.includes('hour')) {
                        countdownColor = '#ff6f00'; // 橙色
                    }
                    break; // 找到第一个有效折扣后跳出循环
                } else {
                    // 如果折扣过期，跳过此供应商
                    countdown = 'Expired';
                }
            }
        }

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString(), category: activeCategory } })}
            >
                <View>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    <View style={styles.productPriceContainer}>
                        {lowestSupplier ? (
                            <>
                                <Text style={styles.finalPrice}>
                                    ${lowestSupplier.final_price}
                                </Text>
                                {/* <Text style={styles.supplierName}>
                                    {lowestSupplier.supplier_name}（最低价）
                                </Text> */}
                                {lowestSupplier.discount && (
                                    <Text style={styles.originalPrice}>
                                        ${lowestSupplier.price}
                                    </Text>
                                )}
                            </>
                        ) : (
                            <Text style={styles.finalPrice}>
                                ${item.suppliers_info[0]?.final_price}
                            </Text>
                        )}
                    </View>



                    {discount && (
                        <Text style={styles.productDiscount}>
                            {discount.type === 'percentage'
                                ? `${discount.value}% OFF`
                                : `-$${discount.value}`}
                        </Text>
                    )}

                    {discount && countdown !== 'Expired' && (
                        <View style={styles.discountTimerContainer}>
                            <Ionicons name="time" size={10} color="#d62828" />
                            <Text style={[styles.discountTimer, { color: countdownColor }]}>
                                {countdown}
                            </Text>
                        </View>
                    )}

                    {discount && countdown === 'Expired' && (
                        <Text style={styles.discountExpired}>Discount expired</Text>
                    )}

                    <Text style={[styles.productStockStatus, item.suppliers_info[0]?.stock_status === 'in_stock' ? styles.inStock : styles.outOfStock]}>
                        {item.suppliers_info[0]?.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                    </Text>
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

    const applyFilters = () => {
        setFilterModalVisible(false);
        setLoading(true);

        const params = new URLSearchParams();

        if (activeCategory) params.append('category', activeCategory);
        if (sortOption) params.append('sort', sortOption);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (onlyDiscounted) params.append('discounted', 'true');

        axios.get(`http://172.20.10.3:8000/shopping/product-lists?${params.toString()}`)
            .then((res) => setProducts(res.data))
            .catch((err) => console.error('Error loading filtered products:', err))
            .finally(() => setLoading(false));
    };

    return (
        <View className='flex-1 px-5 bg-white'>
            <View className='mt-20 flex-row justify-between items-center'>
                <View>
                    <Text className='text-4xl font-bold text-gray-800'>Daily</Text>
                    <Text className='text-2xl text-primary-300'>Grocery Food</Text>
                </View>
                <TouchableOpacity className='p-2' onPress={() => setFilterModalVisible(true)}>
                    <Icon name="filter" size={30} color="#bc3908" />
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
                    ref={flatListRef}
                    data={products}
                    renderItem={loading ? () => renderSkeleton() : renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={[styles.productListContainer, { paddingBottom: 70 }]}
                    showsVerticalScrollIndicator={false}
                    onScroll={(event) => {
                        const yOffset = event.nativeEvent.contentOffset.y;
                        setShowScrollTopButton(yOffset > 300); // 超过300显示
                    }}
                    scrollEventThrottle={16}
                />

            )}

            {showScrollTopButton && (
                <TouchableOpacity
                    style={styles.scrollTopButton}
                    onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
                >
                    <Ionicons name="arrow-up" size={24} color="white" />
                </TouchableOpacity>
            )}

            <Modal visible={filterModalVisible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                                    <Text style={styles.modalTitle}>Filter Options</Text>

                                    {/* 排序 */}
                                    <Text style={styles.modalSubtitle}>Sort By</Text>
                                    {Object.entries({
                                        comprehensive: 'Comprehensive',
                                        price_asc: 'Price: Low to High',
                                        price_desc: 'Price: High to Low',
                                        discount: 'Discount',
                                        expiry: 'Expiry Date',
                                    }).map(([key, label]) => (
                                        <TouchableOpacity key={key} onPress={() => setSortOption(key as 'discount' | 'price_asc' | 'price_desc' | 'expiry')}>
                                            <Text style={[styles.sortOption, sortOption === key && styles.activeSort]}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    {/* 价格区间 */}
                                    <Text style={styles.modalSubtitle}>Price Range</Text>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Min"
                                            keyboardType="numeric"
                                            value={minPrice}
                                            onChangeText={(text) => setMinPrice(text.replace(/[^0-9.]/g, ''))}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Max"
                                            keyboardType="numeric"
                                            value={maxPrice}
                                            onChangeText={(text) => setMaxPrice(text.replace(/[^0-9.]/g, ''))}
                                        />
                                    </View>

                                    {/* 折扣筛选 */}
                                    <TouchableOpacity style={styles.checkboxRow} onPress={() => setOnlyDiscounted(!onlyDiscounted)}>
                                        <Ionicons
                                            name={onlyDiscounted ? 'checkbox' : 'square-outline'}
                                            size={20}
                                            color="#4F772D"
                                        />
                                        <Text style={styles.checkboxLabel}>Only show discounted</Text>
                                    </TouchableOpacity>
                                </ScrollView>

                                {/* 操作按钮 */}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                        <Text style={styles.cancelButton}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            applyFilters();
                                            setFilterModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.applyButton}>Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>


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
        color: '#000',
    },
    productPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    finalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4F772D',
        marginLeft: 8,
    },
    originalPrice: {
        fontSize: 14,
        textDecorationLine: 'line-through',
        color: '#999',
        marginLeft: 8,
    },
    productDiscount: {
        fontSize: 12,
        color: 'white',
        backgroundColor: '#bc3908',
        width: 70,
        height: 17,
        position: 'relative',
        bottom: 400,
        right: 0,
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
        marginTop: 10,
        color: '#245501',
        width: 70,
        marginLeft: 8,
        marginBottom: 10,
    },
    inStock: { color: '#245501' },
    outOfStock: { color: '#d62828' },

    scrollTopButton: {
        position: 'absolute',
        bottom: 80,
        right: 10,
        backgroundColor: '#4F772D',
        padding: 12,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 10,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 50,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        height: 700,
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    modalSubtitle: {
        fontSize: 16,
        marginTop: 10,
        fontWeight: '600'
    },
    sortOption: {
        paddingVertical: 5,
        color: '#333'
    },
    activeSort: {
        fontWeight: 'bold',
        color: '#4F772D'
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 8,
        marginTop: 5
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10
    },
    checkboxLabel: {
        marginLeft: 8,
        color: '#333'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 20
    },
    cancelButton: {
        color: '#999',
        fontWeight: '600'
    },
    applyButton: {
        color: '#4F772D',
        fontWeight: 'bold'
    },

});

export default Products;

