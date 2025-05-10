import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

interface Discount {
    type: string;
    value: string;
    valid_until: string;
}

interface SupplierInfo {
    supplier_name: string;
    price: string;
    stock_status: string;
    discount: Discount;
    final_price: string;
}

interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    suppliers_info: SupplierInfo[];
    image: string | null;
}

interface RecommendationsData {
    category_based_recommendations: Product[];
    discounted_products: Product[];
}

const Recommendations = () => {
    const [data, setData] = useState<RecommendationsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAllCategory, setShowAllCategory] = useState(false);
    const [showAllDiscounts, setShowAllDiscounts] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const token = await SecureStore.getItemAsync('jwt');
                const response = await axios.get('http://172.20.10.3:8000/shopping/recommendations/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const groupIntoRows = (items: Product[], itemsPerRow = 2): Product[][] => {
        const rows: Product[][] = [];
        for (let i = 0; i < items.length; i += itemsPerRow) {
            rows.push(items.slice(i, i + itemsPerRow));
        }
        return rows;
    };

    const getValidSupplierDiscount = (suppliers: SupplierInfo[]): Discount | null => {
        for (const supplier of suppliers) {
            const discount = supplier.discount;
            if (discount && new Date(discount.valid_until) > new Date()) {
                return discount; // Return the first valid discount
            }
        }
        return null; // Return null if no valid discount found
    };

    const renderProductCard = (item: Product, index: number) => {
        const supplier = item.suppliers_info?.[0]; // Default to the first supplier
        const validDiscount = getValidSupplierDiscount(item.suppliers_info);

        return (
            <TouchableOpacity
                key={`${item.id}-${index}`}
                style={styles.itemContainer}
                onPress={() =>
                    router.push({
                        pathname: '/(root)/product/[id]',
                        params: { id: item.id.toString() },
                    })
                }
            >
                <Image
                    source={
                        item.image
                            ? { uri: `http://172.20.10.3:8000${item.image}` }
                            : require('../assets/images/japan.png')
                    }
                    style={styles.iconImage}
                />
                <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                </Text>
                {supplier && (
                    <View style={styles.productPriceContainer}>
                        <Text style={styles.finalPrice}>${supplier.final_price}</Text>
                        {validDiscount && (
                            <Text style={styles.originalPrice}>${supplier.price}</Text>
                        )}
                    </View>
                )}
                {validDiscount && (
                    <Text style={styles.discountText}>-{validDiscount.value}% off</Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderSection = (
        title: string,
        items: Product[] = [],
        showAll: boolean,
        setShowAll: (val: boolean) => void
    ) => {
        if (!items || items.length === 0) return null;

        const displayItems = showAll ? items : items.slice(0, 4);
        const rows = groupIntoRows(displayItems);

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {rows.map((row, rowIndex) => (
                    <View style={styles.rowContainer} key={`${title}-row-${rowIndex}`}>
                        {row.map((item, idx) => renderProductCard(item, idx))}
                    </View>
                ))}
                {!loading && items.length > 4 && (
                    <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                        <Text style={styles.seeAllButton}>
                            {showAll ? 'Show Less ▲' : 'See All ▼'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderLoadingSkeleton = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loading...</Text>
            {[0, 1].map((rowIdx) => (
                <View key={`skeleton-row-${rowIdx}`} style={styles.rowContainer}>
                    {[0, 1].map((colIdx) => (
                        <View style={styles.itemContainer} key={`skeleton-${rowIdx}-${colIdx}`}>
                            <ShimmerPlaceholder
                                style={{ width: 80, height: 80, borderRadius: 10 }}
                                LinearGradient={LinearGradient}
                            />
                            <ShimmerPlaceholder
                                style={{
                                    width: 60,
                                    height: 10,
                                    borderRadius: 4,
                                    marginTop: 6,
                                }}
                                LinearGradient={LinearGradient}
                            />
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );

    return (
        <ScrollView className="mb-14 mt-2">
            <View style={styles.container}>
                {loading ? (
                    renderLoadingSkeleton()
                ) : (
                    <>
                        {renderSection(
                            'You Might Like',
                            data?.category_based_recommendations || [],
                            showAllCategory,
                            setShowAllCategory
                        )}
                        {renderSection(
                            'Best Deals',
                            data?.discounted_products || [],
                            showAllDiscounts,
                            setShowAllDiscounts
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 10,
        marginTop: 12,
        color: '#1e1e1e',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    itemContainer: {
        width: 138,
        marginRight: 23,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    iconImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginBottom: 10,
        resizeMode: 'cover',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgb(189, 57, 0)',
        marginBottom: 2,
        textAlign: 'center',
    },
    productPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    finalPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#31572c',
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 5,
    },
    discountText: {
        fontSize: 12,
        color: '#fff',
        backgroundColor: '#e63946',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
        marginTop: 4,
        position: 'absolute',
        left: 0,
    },
    seeAllButton: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B8E23',
        textAlign: 'center',
        marginTop: 6,
    },
});

export default Recommendations;
