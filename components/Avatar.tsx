import React from "react";
import { View, Image, Text, TouchableOpacity } from "react-native";
import icons from "@/constants/icons";

const roleColors: Record<Role, string> = {
    customer: "#6B8E23",   // 橄榄绿
    admin: "#1E90FF",      // 道奇蓝
    supplier: "#FFD700",   // 金黄
};

type Role = "customer" | "admin" | "supplier";

const Avatar = ({ user }: { user: { name: string; avatar: string; role: Role } }) => {
    const bgColor = roleColors[user.role];

    return (
        <View className="flex flex-col items-center relative mt-5">
            <View style={{ backgroundColor: bgColor }} className="p-[5px] rounded-full">
                <Image
                    source={{ uri: user.avatar }}
                    className="size-44 rounded-full"
                />
            </View>

            <TouchableOpacity className="absolute bottom-11 right-2">
                <Image source={icons.edit} className="size-9" />
            </TouchableOpacity>

            <Text className="text-2xl font-rubik-bold mt-2">{user.name}</Text>
        </View>
    );
};

export default Avatar;
