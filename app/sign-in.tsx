import icons from '@/constants/icons'
import images from '@/constants/images'
import { login } from '@/lib/appwrite'
import { useGlobalContext } from '@/lib/global-provider'
import { Link, Redirect } from 'expo-router'
import React from 'react'
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SignIn = () => {
    const { refetch, isLoggedIn } = useGlobalContext()

    if (isLoggedIn) return <Redirect href="/" />

    const handleLogin = async () => {
        const result = await login();
        if (result) {
            refetch()
            console.log('login ok')
        } else {
            Alert.alert('Error', 'Failed to login');
        }
    }
    return (
        <SafeAreaView className='bg-white h-full'>
            <ScrollView contentContainerStyle={{ flex: 1 }}>
                <View>
                    <Image source={images.signin} className=" w-full h-4/6 mt-10" resizeMode="contain" />
                </View>
                <View className='px-10 absolute top-85 bottom-0'>
                    <Text className='text-base text-center uppercase font-rubik text-black-200'>Welcome to EcoCart</Text>
                    <Text className='text-3xl font-rubik-bold text-black-300 text-center mt-2'>
                        Smarter Shopping {"\n"}
                        <Text className='text-primary-100'>With EcoCart</Text>
                    </Text>
                    <Text className='text-lg font-rubik text-black-200 text-center mt-0'>
                        Login to EcoCart with Google
                    </Text>
                    <TouchableOpacity onPress={handleLogin} className='bg-white shadow-md shadow-zinc-300 rounded-full w-full py-4 mt-5'>
                        <View className='flex-row items-center justify-center'>
                            <Image
                                source={icons.google}
                                className='w-5 h-5'
                                resizeMode='contain'
                            />
                            <Text className='text-lg font-rubik-medium text-black-300 ml-2'>Continue with Google</Text>
                        </View>
                    </TouchableOpacity>
                    <View className="mt-5">
                        <Link href="/register" className="text-center text-primary-100 mt-2 underline">Don't have an account?</Link>
                        <Link href="/login" className="text-center text-primary-100 mt-2 underline">Login with Email?</Link>
                    </View>
                    <View>
                        <Text className='text-center text-black-200 mt-5'></Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default SignIn
