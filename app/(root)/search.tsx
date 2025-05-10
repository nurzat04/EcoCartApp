import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useDebouncedCallback } from "use-debounce";

const API_URL = 'http://172.20.10.3:8000/shopping/product-lists/';
const STORAGE_KEY = "search_history";

const SearchPage = () => {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const inputRef = useRef<TextInput>(null);

    const hotKeywords = ["Milk", "Eggs", "Rice", "Tomato", "Chicken"];

    useEffect(() => {
        loadHistory();

        // 自动 focus 并选中已有内容
        setTimeout(() => {
            inputRef.current?.focus();
            if (query) {
                inputRef.current?.setNativeProps({
                    selection: { start: 0, end: query.length }
                });
            }
        }, 100);
    }, []);

    const loadHistory = async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setHistory(JSON.parse(stored));
    };

    const saveToHistory = async (term: string) => {
        const updated = [term, ...history.filter(h => h !== term)].slice(0, 10);
        setHistory(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const clearHistory = async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setHistory([]);
    };

    const deleteHistoryItem = async (item: string) => {
        const updated = history.filter(h => h !== item);
        setHistory(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const fetchSearchResults = async (text: string) => {
        if (!text.trim()) {
            setProducts([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(API_URL, { params: { search: text } });
            setProducts(res.data);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebouncedCallback((text: string) => {
        fetchSearchResults(text);
    }, 300);

    const handleSearch = (text: string) => {
        setQuery(text);
        debouncedSearch(text);
    };

    const handleKeywordPress = (text: string) => {
        setQuery(text);
        fetchSearchResults(text);
    };

    const goToProduct = (id: number) => {
        router.push(`/product/${id}`);
    };

    return (
        <View className="flex-1 bg-white px-4 pt-12">
            {/* 搜索栏 */}
            <View className="flex-row items-center mb-4 border border-gray-300 rounded-lg px-3 py-2">
                <TextInput
                    ref={inputRef}
                    className="flex-1 text-base"
                    placeholder="Search products..."
                    value={query}
                    onChangeText={handleSearch}
                    autoFocus
                />
                {query.trim().length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch("")}>
                        <Text className="text-gray-500 text-xl px-2">×</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="ml-2 text-blue-500 text-base">Cancel</Text>
                </TouchableOpacity>
            </View>

            {/* 联想结果列表 */}
            {query.trim() ? (
                loading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={async () => {
                                    await saveToHistory(item.name); // ✅ 点击真实产品才保存历史
                                    goToProduct(item.id);
                                }}
                            >
                                <View className="py-3 border-b border-gray-200">
                                    <Text className="text-base font-medium">{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text className="text-center text-gray-400 mt-10">
                                No products found.
                            </Text>
                        }
                    />
                )
            ) : (
                <>
                    {/* 搜索历史 */}
                    {history.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-semibold">Search History</Text>
                                <TouchableOpacity onPress={clearHistory}>
                                    <Text className="text-sm text-red-500">Clear All</Text>
                                </TouchableOpacity>
                            </View>
                            {history.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    className="py-2 flex-row justify-between items-center border-b border-gray-200"
                                    onPress={() => handleKeywordPress(item)}
                                    onLongPress={() =>
                                        Alert.alert("Delete History", `Remove "${item}"?`, [
                                            { text: "Cancel" },
                                            {
                                                text: "Delete",
                                                onPress: () => deleteHistoryItem(item),
                                                style: "destructive"
                                            }
                                        ])
                                    }
                                >
                                    <Text className="text-base">{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* 热搜 */}
                    <View>
                        <Text className="text-lg font-semibold mb-2">Hot Searches</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {hotKeywords.map((kw) => (
                                <TouchableOpacity
                                    key={kw}
                                    className="bg-gray-200 px-3 py-1 rounded-full"
                                    onPress={() => handleKeywordPress(kw)}
                                >
                                    <Text className="text-sm text-gray-800">{kw}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </>
            )}
        </View>
    );
};

export default SearchPage;
