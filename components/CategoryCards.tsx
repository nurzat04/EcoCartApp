import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

type Category = {
    id: number;
    name: string;
    display_name: string;
};

const categoryStyles: Record<string, { bgColor: string; image: any }> = {
    vegetables: { bgColor: '#c8dd96', image: require('../assets/icons/vegetables.png') },
    fruit: { bgColor: '#fbc4ab', image: require('../assets/icons/fruits.png') },
    juice: { bgColor: '#fefae0', image: require('../assets/icons/juice.png') },
    dairy: { bgColor: '#f4f3ee', image: require('../assets/icons/dairy.png') },
    bread_eggs: { bgColor: '#ffcb69', image: require('../assets/icons/bread.png') },
    meat: { bgColor: '#ffe8d6', image: require('../assets/icons/meat.png') },
    sauces: { bgColor: '#e57c04', image: require('../assets/icons/sauces.png') },
    seafood: { bgColor: '#a8dadc', image: require('../assets/icons/seafood.png') },
    junkfood: { bgColor: '#FFCDD2', image: require('../assets/icons/junkfood.png') },
};

const Category = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        axios
            .get('http://172.20.10.3:8000/shopping/categories')
            .then((response) => setCategories(response.data))
            .catch((error) => console.error('Error fetching categories:', error))
            .finally(() => setLoading(false));
    }, []);

    const onCategoryPress = (category: Category) => {
        router.push({
            pathname: '/products',
            params: { selectedCategory: category.name.toString() },
        });
    };

    const renderItem = ({ item }: { item: Category }) => {
        const style = categoryStyles[item.name] || { bgColor: '#E0E0E0' };

        return (
            <TouchableOpacity onPress={() => onCategoryPress(item)}>
                <View>
                    <View style={[styles.itemContainer, { backgroundColor: style.bgColor }]}>
                        <Image source={style.image} style={styles.iconImage} resizeMode='contain' />
                    </View>
                    <Text style={styles.text}>{item.display_name}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSkeleton = () => (
        <View>
            <ShimmerPlaceholder
                style={styles.itemContainer}
                LinearGradient={LinearGradient}
            />
            <ShimmerPlaceholder
                style={{ width: 40, height: 10, borderRadius: 4, marginTop: 4, marginLeft: 15 }}
                LinearGradient={LinearGradient}
            />
        </View>
    );

    const chunkCategories = (categories: Category[]) => {
        const firstRow = categories.slice(0, 5);
        const secondRow = categories.slice(5, 9);
        return [firstRow, secondRow];
    };

    const [firstRow, secondRow] = chunkCategories(categories);

    return (
        <View style={styles.container}>
            <View>
                <FlatList
                    data={loading ? Array(5).fill({}) : firstRow}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={loading ? () => renderSkeleton() : renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rowContainer}
                />
            </View>
            <FlatList
                data={loading ? Array(4).fill({}) : secondRow}
                keyExtractor={(item, index) => index.toString()}
                renderItem={loading ? () => renderSkeleton() : renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingRight: 0,
    },
    rowContainer: {
        paddingVertical: 4,
    },
    itemContainer: {
        width: 66,
        height: 66,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        marginRight: 20,
    },
    text: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        marginLeft: -16,
    },
    iconImage: {
        width: 40,
        height: 40,
        marginBottom: 0,
    },
});

export default Category;
