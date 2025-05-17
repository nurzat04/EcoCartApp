import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

interface TopProduct {
    product__name: string;
    count: number;
}

interface AdminDashboardData {
    user_count: number;
    active_users: number;
    top_products: TopProduct[];
}

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    // Replace with your actual API endpoint
    const apiUrl = 'http://172.20.10.3:8000/shopping/admin/dashboard/';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await SecureStore.getItemAsync('jwt');
                const response = await axios.get(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDashboardData(response.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>User Count</Text>
                <Text style={styles.value}>{dashboardData?.user_count ?? 'N/A'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>Active Users</Text>
                <Text style={styles.value}>{dashboardData?.active_users}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>Top Products</Text>
                {dashboardData?.top_products?.length ?? 0 > 0 ? (
                    dashboardData?.top_products.map((product, index) => (
                        <Text key={index} style={styles.value}>
                            {product.product__name} - {product.count} purchases
                        </Text>
                    ))
                ) : (
                    <Text style={styles.value}>No products found</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    value: {
        fontSize: 16,
        color: '#555',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AdminDashboard;
