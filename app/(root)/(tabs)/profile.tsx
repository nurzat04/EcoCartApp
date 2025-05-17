import {
    Alert,
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { useUserStore } from '@/stores/userStore';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect } from "react";
import Toast from "react-native-toast-message";

interface SettingsItemProp {
    icon: ImageSourcePropType;
    title: string;
    onPress?: () => void;
    textStyle?: string;
    showArrow?: boolean;
}

const SettingsItem = ({
    icon,
    title,
    onPress,
    textStyle,
    showArrow = true,
}: SettingsItemProp) => (
    <TouchableOpacity
        onPress={onPress}
        className="flex flex-row items-center justify-between py-3"
    >
        <View className="flex flex-row items-center gap-3">
            <Image source={icon} className="size-6" />
            <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
                {title}
            </Text>
        </View>

        {showArrow && <Image source={icons.rightArrow} className="size-5" />}
    </TouchableOpacity>
);

const Profile = () => {
    const { refetch, setIsLoggedIn } = useGlobalContext();
    const router = useRouter();
    const { username, setUsername, token, setToken, avatar, setAvatar, isAdmin, setIsAdmin, isVendor, setIsVendor } = useUserStore()

    useEffect(() => {
        SecureStore.getItemAsync("username").then((value) => {
            if (value !== null) {
                setUsername(value);
            }
        });
        SecureStore.getItemAsync("jwt").then((value) => {
            if (value !== null) {
                setToken(value);
            }
        });
        SecureStore.getItemAsync("avatar").then((value) => {
            if (value !== null) {
                setAvatar(value);
            }
        });

        SecureStore.getItemAsync("isAdmin").then((value) => {
            if (value !== null) {
                setIsAdmin((value === "true").toString());
            }
        });

        SecureStore.getItemAsync("isVendor").then((value) => {
            if (value !== null) {
                setIsVendor((value === "true").toString());
            }
        });
    }, []);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('jwt');
        await SecureStore.deleteItemAsync("username");
        await SecureStore.deleteItemAsync("avatar");
        await SecureStore.deleteItemAsync("isAdmin");
        await SecureStore.deleteItemAsync("isVendor");
        await refetch();
        setIsLoggedIn(false);
        Alert.alert("Success", "Logged out successfully");
        router.replace("/sign-in");
    };

    const pickImageAndUpload = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission required", "You need to allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            const selectedImage = result.assets[0];

            const formData = new FormData();
            formData.append('image', {
                uri: selectedImage.uri,
                name: 'avatar.jpg',
                type: 'image/jpeg',
            } as any);

            try {
                const response = await axios.put("http://172.20.10.3:8000/users/upload-avatar/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const imageUrl = `http://172.20.10.3:8000${response.data.image}`;
                await SecureStore.setItemAsync("avatar", imageUrl);
                setAvatar(imageUrl);

                Toast.show({
                    type: 'success',
                    text1: '🎉 Image uploaded successfully!',
                    text2: 'You can now see your new profile picture.',
                    position: 'top',
                    visibilityTime: 2000,
                    autoHide: true,
                    topOffset: 60,
                    onHide: () => router.push('/'),
                });
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: '😢 Image upload failed.',
                    text2: 'Please try again later.',
                    position: 'top',
                    visibilityTime: 2500,
                    topOffset: 60,
                });
            }
        }
    };

    return (
        <SafeAreaView className="h-full bg-white">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-32 px-7"
            >
                <View className="flex flex-row items-center justify-between mt-5">
                    <Text className="text-xl font-rubik-bold">Profile</Text>
                    <Image source={icons.bell} className="size-5" />
                </View>

                <View className="flex flex-row justify-center mt-5">
                    <View className="flex flex-col items-center relative mt-5">
                        <Image
                            source={avatar && avatar.trim() !== "" ? { uri: avatar } : require('@/assets/images/japan.png')}
                            className="size-44 relative rounded-full"
                        />

                        <TouchableOpacity
                            className="absolute bottom-11 right-2"
                            onPress={pickImageAndUpload}
                        >
                            <Image source={icons.edit} className="size-8" />
                        </TouchableOpacity>

                        <Text className="text-3xl font-rubik-bold mt-2">{username}</Text>
                    </View>
                </View>

                <View className="flex flex-col mt-8">
                    {/* <SettingsItem icon={icons.calendar} title="My Bookings" /> */}
                    <SettingsItem icon={icons.person} title="Contacts" onPress={() => router.push('/(root)/contactspage')} />
                    {isAdmin === "true" && (
                        <SettingsItem icon={icons.person} title="Dashboard" onPress={() => router.push('/admin')} />
                    )}
                    {isVendor === "true" && (
                        <SettingsItem icon={icons.person} title="Vendor Dashboard" onPress={() => router.push('/vendor')} />
                    )}
                </View>

                {/* <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
                    {settings.slice(2).map((item, index) => (
                        <SettingsItem key={index} {...item} />
                    ))}
                </View> */}

                <View className="flex flex-col border-t mt-5 pt-5 border-primary-200">
                    <SettingsItem
                        icon={icons.logout}
                        title="Logout"
                        textStyle="text-danger"
                        showArrow={false}
                        onPress={handleLogout}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
