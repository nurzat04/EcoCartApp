import React from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

type Supplier = {
    id: number;
    company_name: string;
    image: any; // require 本地图片
};

const suppliers: Supplier[] = [
    { id: 1, company_name: 'Magnum', image: require('../assets/suppliers/magnum.png') },
    { id: 2, company_name: 'Small', image: require('../assets/suppliers/small.png') },
    { id: 3, company_name: 'Galmart', image: require('../assets/suppliers/galmart.png') },
    { id: 4, company_name: 'Ramstore', image: require('../assets/suppliers/ramstore.png') },
    { id: 5, company_name: 'Walmart', image: require('../assets/suppliers/walmart.png') },
    { id: 6, company_name: 'Costco', image: require('../assets/suppliers/costco.png') },
    { id: 7, company_name: 'Carrefour', image: require('../assets/suppliers/carrefour.png') },
];

const SupplierList = () => {
    const renderSupplier = ({ item }: { item: Supplier }) => (
        <View style={styles.card}>
            <Image source={item.image} style={styles.image} resizeMode="cover" />
            <Text style={styles.companyName}>{item.company_name}</Text>
        </View>
    );

    return (
        <View className='mt-2'>
            <Text style={{ fontSize: 20, fontWeight: 'bold', padding: 10 }}>Suppliers</Text>
            <FlatList
                data={suppliers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSupplier}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: 0,
    },
    card: {
        width: screenWidth * 0.65,
        height: 110,
        marginRight: 14,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: 'gray',
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 80,
    },
    companyName: {
        fontSize: 15,
        fontWeight: 'bold',
        padding: 10,
    },
});

export default SupplierList;
