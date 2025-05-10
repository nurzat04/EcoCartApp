import icons from "@/constants/icons";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useDebouncedCallback } from "use-debounce";

const API_URL = 'http://172.20.10.3:8000/shopping/product-lists/';

const Search = () => {
    const params = useLocalSearchParams<{ query?: string }>();
    const [search, setSearch] = useState(params.query || '');
    const [products, setProducts] = useState([]);  // 初始状态为空，不显示 "No products found"
    const [loading, setLoading] = useState(false);
    const [noProductsFound, setNoProductsFound] = useState(false);  // 用来控制是否显示 "No products found"
    const [showDropdown, setShowDropdown] = useState(false);

    const debouncedSearch = useDebouncedCallback((text: string) => {
        fetchSearchResults(text);
    }, 500);

    const handleSearch = (text: string) => {
        setSearch(text);
        setShowDropdown(true);  // 显示下拉框
        debouncedSearch(text);
    };

    const fetchSearchResults = async (query: string) => {
        if (!query.trim()) {
            setProducts([]);  // 清空产品列表
            setNoProductsFound(false);  // 清空没有产品的状态
            return;
        }
        setLoading(true);
        setNoProductsFound(false);  // 在开始搜索时先不显示 "No products found"
        try {
            const response = await axios.get(API_URL, { params: { search: query } });
            if (response.data.length === 0) {
                setProducts([]);  // 没有找到产品
                setNoProductsFound(true);  // 设置没有产品的状态
            } else {
                setProducts(response.data);  // 获取到实际数据时更新产品列表
                setNoProductsFound(false);  // 清除 "No products found" 状态
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderProductItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => handleProductSelect(item)}>
            <View className="p-4 bg-white border-b border-gray-300 rounded-lg">
                <Text className="font-bold text-md">{item.name}</Text>
            </View>
        </TouchableOpacity>
    );

    interface Product {
        id: number;
        name: string;
    }

    const handleProductSelect = (product: Product): void => {
        setSearch(product.name);  // 这里你想保留名字用于显示在输入框
        setProducts([]);          // 清空产品列表
        setShowDropdown(false);  // 关闭下拉框      
    };

    const handleClearSearch = () => {
        setSearch('');
        setProducts([]);
        setShowDropdown(false);
        setNoProductsFound(false);
    };

    return (
        <View className="flex-1 bg-white relative ">
            {/* Search Bar */}
            <View className="flex flex-row items-center justify-between w-full h-14 px-5 bg-white rounded-lg mt-5 shadow-md z-10">
                <View className="flex-1 flex flex-row items-center">
                    <Image source={icons.search} className="w-5 h-5" />
                    <TextInput
                        value={search}
                        onChangeText={handleSearch}
                        placeholder="Search for anything"
                        placeholderTextColor="#A9A9A9"
                        className="ml-3 text-base font-medium text-gray-700 flex-1"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch}>
                            <Text className="text-gray-500 text-lg ml-2">✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity>
                    <Image source={icons.filter} className="w-5 h-5" />
                </TouchableOpacity>
            </View>

            {/* Floating Search Result Dropdown */}
            {search.trim() && showDropdown && (
                <View
                    style={{
                        position: "absolute",
                        top: 70, // 视具体UI定，略高于搜索框底部
                        left: 20,
                        right: 20,
                        maxHeight: 150,
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 8,
                        zIndex: 999,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 5,
                        padding: 10,
                        overflow: 'hidden',
                    }}
                >
                    {/* Loading State */}
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="small" color="#4CAF50" />
                        </View>
                    ) : (
                        noProductsFound ? (
                            <View className="flex-1 justify-center items-center">
                                <Text className="text-gray-600">No products found.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={products}
                                renderItem={renderProductItem}
                                keyExtractor={(item) => item.id.toString()}
                                keyboardShouldPersistTaps="handled"
                                className="rounded-lg"
                                style={{ maxHeight: 150, flex: 1 }}
                                contentContainerStyle={{
                                    paddingBottom: 10,  // 增加底部的 padding，避免底部被切掉
                                    overflow: 'scroll', // 确保内容滚动
                                }}
                            />
                        )
                    )}
                </View>
            )}
        </View>
    );
};

export default Search;
