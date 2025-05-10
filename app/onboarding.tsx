// app/onboarding.tsx
import React, { useState, useRef, useEffect } from 'react'
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import images from '@/constants/images'

const slides = [
    {
        id: '1',
        title: 'Welcome to EcoCart',
        description: 'Smarter shopping that saves money and the planet.',
        image: images.japan,
    },
    {
        id: '2',
        title: 'Compare & Save',
        description: 'Find the best price for every product across multiple suppliers.',
        image: images.newYork,
    },
    {
        id: '3',
        title: 'Green & Secure',
        description: 'We help reduce food waste, and protect your data responsibly.',
        image: images.signin,
    },
]

const Onboarding = () => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const router = useRouter()
    const flatListRef = useRef(null)
    const { width } = Dimensions.get('window')

    useEffect(() => {
        AsyncStorage.getItem('hasSeenOnboarding').then(value => {
            if (value === 'true') router.replace('/sign-in')
        })
    }, [])

    const handleDone = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true')
        router.replace('/sign-in')
    }

    const renderItem = ({ item }: any) => (
        <View style={{ width, alignItems: 'center', padding: 20 }}>
            <Image source={item.image} style={{ width: 300, height: 300 }} resizeMode="contain" />
            <Text className='text-2xl font-bold text-center mt-6'>{item.title}</Text>
            <Text className='text-base text-gray-500 text-center mt-2'>{item.description}</Text>
        </View>
    )

    const renderIndicators = () => (
        <View className='flex-row justify-center mt-4'>
            {slides.map((_, index) => (
                <View
                    key={index}
                    className={`w-3 h-3 mx-1 rounded-full ${index === currentIndex ? 'bg-primary-100' : 'bg-gray-300'}`}
                />
            ))}
        </View>
    )

    return (
        <View className='flex-1 bg-white'>
            <FlatList
                data={slides}
                ref={flatListRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onScroll={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width)
                    setCurrentIndex(index)
                }}
                renderItem={renderItem}
            />
            {renderIndicators()}
            <TouchableOpacity
                onPress={handleDone}
                className='bg-primary-100 mx-10 py-4 rounded-full mt-8 mb-10'
            >
                <Text className='text-white text-center text-lg font-bold'>
                    {currentIndex === slides.length - 1 ? 'Start Using EcoCart' : 'Skip'}
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default Onboarding
