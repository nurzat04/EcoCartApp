import Category from "@/components/CategoryCards";
import NotificationBell from "@/components/NotificationBell";
import Recommendations from "@/components/recommendations";
import SupplierList from "@/components/Suppliers";
import icons from "@/constants/icons";
import { useUserStore } from '@/stores/userStore';
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
    const router = useRouter();
    const { username, avatar, setUsername, setAvatar } = useUserStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const storedName = await SecureStore.getItemAsync("username");
            const storedAvatar = await SecureStore.getItemAsync("avatar");
            if (storedName) setUsername(storedName);
            if (storedAvatar) setAvatar(storedAvatar);
            setLoading(false)
        };
        loadData();
    }, []);
    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }
    return (
        <SafeAreaView className="bg-white h-full">
            <ScrollView className="px-3">
                <View >
                    {/* 顶部头像+欢迎语 */}
                    <View className="flex flex-row items-center justify-between mt-5">
                        <View className="flex flex-row items-center">
                            <Image
                                source={avatar ? { uri: avatar } : require('@/assets/images/avatar.png')}
                                className="size-12 rounded-full"
                            />
                            <View className="flex flex-col items-start ml-2 justify-center">
                                <Text className="text-xs font-rubik text-black-100">Good Morning</Text>
                                <Text className="text-base font-rubik-medium text-black-300">{username}</Text>
                            </View>
                        </View>
                        <GestureHandlerRootView style={{ flex: 1, marginLeft: 20 }}>
                            <NotificationBell />
                        </GestureHandlerRootView>
                    </View>

                    {/* 搜索框（点击跳转） */}
                    <TouchableOpacity
                        className="flex flex-row items-center w-full h-14 px-5 bg-white rounded-lg mt-5 shadow-md"
                        onPress={() => router.push("/search")}
                    >
                        <Image source={icons.search} className="w-5 h-5" />
                        <Text className="ml-3 text-base text-gray-400">Search for anything</Text>
                    </TouchableOpacity>

                    {/* 分类部分 */}
                    <View className="my-5">
                        <View className="flex flex-row items-center justify-between">
                            <Text style={styles.sectionTitle}>Shop By Category</Text>
                            <TouchableOpacity onPress={() => router.push('/products')}>
                                <Text className="text-base font-rubik-medium text-primary-100">See All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 分类卡片、供应商列表、推荐商品 */}
                <Category />
                <SupplierList />
                <Recommendations />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
