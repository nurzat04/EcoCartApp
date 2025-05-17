import images from '@/constants/images';
//import { loginWithCredentials } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import * as Yup from 'yup';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [imageHeight] = useState(new Animated.Value(230));
    const [loadings, setLoadings] = useState(false);
    const { refetch, loading, isLoggedIn } = useGlobalContext()
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVendor, setIsVendor] = useState(false);
    const router = useRouter();
    const { setIsLoggedIn } = useGlobalContext()

    if (isLoggedIn && !loadings) {
        return <Redirect href="/" />
    }
    const validationSchema = Yup.object().shape({
        email: Yup.string().email('Invalid email').required('Email is required'),
        password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
    });

    const handleFocus = (field: any) => {
        setFocusedField(field);
        Animated.timing(imageHeight, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        setFocusedField(null);
        Animated.timing(imageHeight, {
            toValue: 230,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleSubmitForm = async (values: any) => {
        setLoadings(true);
        try {
            const response = await axios.post("http://172.20.10.3:8000/users/auth/login/", {
                email: values.email,
                password: values.password,
            });
            const token = response.data.access;
            if (token) {
                setIsLoggedIn(true)
            }
            await SecureStore.setItemAsync('jwt', token);
            await SecureStore.setItemAsync('username', response.data.user.username);
            const imageUrl = `http://172.20.10.3:8000${response.data.user.image}`;
            await SecureStore.setItemAsync("avatar", imageUrl);

            const isAdmin = response.data.user.is_admin;
            setIsAdmin(isAdmin);
            await SecureStore.setItemAsync('isAdmin', String(isAdmin));

            const isVendor = response.data.user.is_vendor;
            setIsVendor(isVendor);
            await SecureStore.setItemAsync('isVendor', String(isVendor));



            Toast.show({
                type: 'success',
                text1: '🎉 Welcome to EcoCart!',
                text2: 'Account created successfully 🥝',
                position: 'top',
                visibilityTime: 2000,
                autoHide: true,
                topOffset: 60,
                onHide: () => router.push('/'),
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: '😢 Registration Failed',
                text2: 'Please try again later.',
                position: 'top',
                visibilityTime: 2500,
                topOffset: 60,
            });
        } finally {
            setLoadings(false);
        }
    };

    return (
        <LinearGradient
            colors={['rgb(251, 225, 201)', 'rgb(250, 241, 231)']}
            style={{ height: '100%', width: '100%' }}
        >
            <SafeAreaView className="flex-1">
                <Animated.View style={{ height: imageHeight, width: '100%' }}>
                    <ImageBackground
                        source={images.login}
                        imageStyle={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 60 }}
                        resizeMode="cover"
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute mt-7 ml-5 bg-white rounded-full p-2"
                        >
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>

                        <View className="h-64 bg-primary/90 items-center justify-center rounded-b-[40px]">
                            <Text className="text-black-300 text-3xl font-bold mt-40">Log In</Text>
                        </View>
                    </ImageBackground>
                </Animated.View>

                <ScrollView contentContainerStyle={{ alignItems: 'center', marginTop: 10, paddingBottom: 10 }}>
                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmitForm}
                    >
                        {({ handleChange, handleBlur: formikBlur, handleSubmit, values, errors, touched, setFieldTouched }) => (
                            <View className="bg-white rounded-3xl shadow-lg w-11/12 px-6 py-8">
                                <View className="mb-4">
                                    <Text className="text-black mb-2 font-medium">Email</Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-4 py-3"
                                        placeholder="Enter email"
                                        keyboardType="email-address"
                                        value={values.email}
                                        onChangeText={handleChange('email')}
                                        onFocus={() => handleFocus('email')}
                                        onBlur={() => {
                                            setFieldTouched('email');
                                            formikBlur('email');
                                            handleBlur();
                                        }}
                                    />
                                    {touched.email && errors.email && <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>}
                                </View>
                                <View className="mb-6">
                                    <Text className="text-black mb-2 font-medium">Password</Text>
                                    <View className="relative">
                                        <TextInput
                                            className="border border-gray-300 rounded-lg px-4 py-3 pr-10"
                                            placeholder="Enter password"
                                            secureTextEntry={!showPassword}
                                            value={values.password}
                                            onChangeText={handleChange('password')}
                                            onFocus={() => handleFocus('password')}
                                            onBlur={() => {
                                                setFieldTouched('password');
                                                formikBlur('password');
                                                handleBlur();
                                            }}
                                        />
                                        <TouchableOpacity
                                            className="absolute right-3 top-3"
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
                                        </TouchableOpacity>
                                    </View>
                                    {touched.password && errors.password && <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>}
                                    <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                        <Text className="text-primary-300 text-right mt-2">Forgot password?</Text>
                                    </TouchableOpacity>

                                </View>

                                <TouchableOpacity
                                    onPress={() => handleSubmit()}
                                    disabled={loading}
                                    className="bg-primary-100 py-4 rounded-full items-center"
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Login</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </Formik>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default Login;
