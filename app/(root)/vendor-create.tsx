import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const CATEGORY_OPTIONS = [
    { name: 'vegetables', display_name: 'Vegetables' },
    { name: 'fruit', display_name: 'Fruit' },
    { name: 'juice', display_name: 'Juice' },
    { name: 'dairy', display_name: 'Dairy' },
    { name: 'bread_eggs', display_name: 'Bread and Eggs' },
    { name: 'meat', display_name: 'Meat' },
    { name: 'sauces', display_name: 'Sauces' },
    { name: 'seafood', display_name: 'Seafood' },
    { name: 'junkfood', display_name: 'Junk Food' },
];

const ProductFormScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        stock_status: 'in_stock',
        discount_type: 'percentage',
        discount_value: '',
        discount_valid_from: new Date(),
        discount_valid_until: new Date(),
    });
    const [image, setImage] = useState<ImagePicker.ImagePickerSuccessResult | null>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showUntilPicker, setShowUntilPicker] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            if (id) {
                const token = await SecureStore.getItemAsync('jwt');
                const res = await axios.get(`http://172.20.10.3:8000/shopping/products/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const p = res.data;
                setProduct({
                    ...p,
                    discount_type: p.discount?.type || 'percentage',
                    discount_value: p.discount?.value?.toString() || '',
                    discount_valid_from: p.discount?.valid_from ? new Date(p.discount.valid_from) : new Date(),
                    discount_valid_until: p.discount?.valid_until ? new Date(p.discount.valid_until) : new Date(),
                });
            }
        };
        fetchProduct();
    }, [id]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            setImage(result);
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('description', product.description);
        formData.append('category', product.category);
        formData.append('price', parseFloat(product.price).toString());
        formData.append('stock_status', product.stock_status);

        if (product.discount_value) {
            formData.append('discount_type', product.discount_type);
            formData.append('discount_value', product.discount_value);
            formData.append('discount_valid_from', product.discount_valid_from.toISOString());
            formData.append('discount_valid_until', product.discount_valid_until.toISOString());
        }

        if (image) {
            const localUri = image.assets[0].uri;
            const filename = localUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename ?? '');
            const type = match ? `image/${match[1]}` : 'image';

            formData.append('image', {
                uri: localUri,
                name: filename,
                type,
            } as any); // `as any` is used to bypass TypeScript errors
        }

        const token = await SecureStore.getItemAsync('jwt');
        const url = id
            ? `http://172.20.10.3:8000/shopping/products/${id}/`
            : 'http://172.20.10.3:8000/shopping/products/';
        const method = id ? 'PUT' : 'POST';

        try {
            await axios({
                method,
                url,
                data: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            router.back();
        } catch (error: any) {
            console.error('Error:', error.response?.data || error.message);
            alert('提交失败，请检查字段是否填写完整或格式正确。');
        }
    };

    return (
        <View>
            <Pressable
                style={styles.backButton}
                onPress={() => {
                    router.push('/(root)/vendor')
                }}
            >
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <ScrollView style={styles.container}>


                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <TextInput
                        value={product.name}
                        onChangeText={(text) => setProduct({ ...product, name: text })}
                        placeholder="product name"
                        style={styles.input}
                    />
                    <TextInput
                        value={product.description}
                        onChangeText={(text) => setProduct({ ...product, description: text })}
                        placeholder="description"
                        style={styles.input}
                    />
                    <Picker
                        selectedValue={product.category}
                        onValueChange={(value) => setProduct({ ...product, category: value })}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select category" value="" />
                        {CATEGORY_OPTIONS.map((option) => (
                            <Picker.Item key={option.name} label={option.display_name} value={option.name} />
                        ))}
                    </Picker>
                    <TextInput
                        value={product.price}
                        onChangeText={(text) => setProduct({ ...product, price: text })}
                        placeholder="price"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Picker
                        selectedValue={product.stock_status}
                        onValueChange={(value) => setProduct({ ...product, stock_status: value })}
                        style={styles.picker}
                    >
                        <Picker.Item label="In stock" value="in_stock" />
                        <Picker.Item label="Out of stock" value="out_of_stock" />
                    </Picker>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Discount Information</Text>
                    <TextInput
                        value={product.discount_value}
                        onChangeText={(text) => setProduct({ ...product, discount_value: text })}
                        placeholder="discount value"
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Picker
                        selectedValue={product.discount_type}
                        onValueChange={(value) => setProduct({ ...product, discount_type: value })}
                        style={styles.picker}
                    >
                        <Picker.Item label="percentage" value="percentage" />
                        <Picker.Item label="fixed" value="fixed" />
                    </Picker>
                    <Text>Discount valid from</Text>
                    <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateButton}>
                        <Text>{product.discount_valid_from.toDateString()}</Text>
                    </TouchableOpacity>
                    {showFromPicker && (
                        <DateTimePicker
                            value={product.discount_valid_from}
                            mode="date"
                            display="default"
                            onChange={(_, selectedDate) => {
                                setShowFromPicker(false);
                                if (selectedDate) {
                                    setProduct({ ...product, discount_valid_from: selectedDate });
                                }
                            }}
                        />
                    )}

                    <Text>Discount valid until</Text>
                    <TouchableOpacity onPress={() => setShowUntilPicker(true)} style={styles.dateButton}>
                        <Text>{product.discount_valid_until.toDateString()}</Text>
                    </TouchableOpacity>
                    {showUntilPicker && (
                        <DateTimePicker
                            value={product.discount_valid_until}
                            mode="date"
                            display="default"
                            onChange={(_, selectedDate) => {
                                setShowUntilPicker(false);
                                if (selectedDate) {
                                    setProduct({ ...product, discount_valid_until: selectedDate });
                                }
                            }}
                        />
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Image</Text>
                    <TouchableOpacity onPress={handlePickImage} style={styles.imageButton}>
                        <Text style={styles.imageButtonText}>Select Image</Text>
                    </TouchableOpacity>
                    {image && (
                        <Image
                            source={{ uri: image.assets[0].uri }}
                            style={{ width: 120, height: 120, marginTop: 10, borderRadius: 8 }}
                        />
                    )}
                </View>
                <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>{id ? 'Update Product' : 'Create Product'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f6f6f6',
        padding: 16,
        marginTop: 55,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fafafa',
    },
    picker: {
        backgroundColor: '#fafafa',
        borderRadius: 8,
        marginBottom: 10,
    },
    dateButton: {
        padding: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        marginVertical: 5,
    },
    imageButton: {
        backgroundColor: '#4caf50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    imageButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#2196f3',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 40,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButton: {
        position: 'absolute',
        top: 30, // 可根据你的状态栏高度调整
        left: 15,
        zIndex: 10,
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20,
    },
});

export default ProductFormScreen;
