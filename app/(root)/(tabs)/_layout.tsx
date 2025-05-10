import icons from '@/constants/icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, ImageSourcePropType, Text, View } from 'react-native';

const TabIcon = ({
    focused,
    icon,
    title,
}: {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}) => (
    <View className="flex-1 mt-3 flex flex-col items-center">
        <Image
            source={icon}
            tintColor={focused ? "#0061FF" : "#666876"}
            resizeMode="contain"
            className="size-6"
        />
        <Text
            className={`${focused
                ? "text-primary-300 font-rubik-medium"
                : "text-black-200 font-rubik"
                } text-xs w-full text-center mt-1`}
        >
            {title}
        </Text>
    </View>
);


const TabsLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarShowLabel: false,
            tabBarStyle: {
                backgroundColor: 'white',
                position: 'absolute',
                borderTopColor: '#0061FF1A',
                borderTopWidth: 1,
                minHeight: 70,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.home} focused={focused} title="Home" />
                    )
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.person} focused={focused} title="Products" />
                    )
                }}
            />
            <Tabs.Screen
                name="shopping-list"
                options={{
                    title: 'Shopping-list',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.person} focused={focused} title="Shopping List" />
                    )
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon={icons.person} focused={focused} title="Profile" />
                    )
                }}
            />

        </Tabs>
    )
}

export default TabsLayout