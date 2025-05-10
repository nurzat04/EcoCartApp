import GlobalProvider from "@/lib/global-provider";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import Toast from 'react-native-toast-message';
import "./globals.css";

export const unstable_settings = {
    initialRouteName: "index",
    linking: {
        prefixes: ["ecocartapp://"],
        config: {
            screens: {
                "reset-password": "reset-password/:token",
            },
        },
    },
};

const Layout = () => {
    const [fontsLoaded] = useFonts({
        "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
        "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
        "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
        "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
        "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
        "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    });

    const router = useRouter();

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // 监听用户点击推送通知
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log("用户点击通知，数据：", data);

            if (data?.productId) {
                // 跳转到商品详情页，假设你有这个页面
                router.push(`/product/${data.productId}`);
            }
        });

        return () => subscription.remove();
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GlobalProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <Toast />
        </GlobalProvider>
    );
};

export default Layout;
