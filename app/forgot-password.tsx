import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as Yup from 'yup';

const ForgotPassword = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    // Validation schema for the form
    const validationSchema = Yup.object().shape({
        email: Yup.string().email('Invalid email').required('Email is required'),
    });

    // Handle the form submission
    const handleSubmit = async (values: { email: string }) => {
        setLoading(true);
        try {
            const reponse = await axios.post("http://172.20.10.3:8000/users/request-password-reset/", {
                email: values.email,
            });
            const { token, uid } = reponse.data;

            Toast.show({
                type: 'success',
                text1: 'Reset link sent',
                text2: 'Check your email inbox 📧',
                position: 'top',
                visibilityTime: 2500,
                topOffset: 60,
            });

            // Redirect to the reset password page after a short delay
            setTimeout(() => {
                router.push({ pathname: '/reset-password', params: { token: token, uid: uid } }); // Navigate to reset-password page
            }, 500);
        } catch (error: any) {
            // Handle errors if the request fails
            const message = error?.response?.data?.error || 'Please try again later.';

            Toast.show({
                type: 'error',
                text1: 'Failed to send email',
                text2: message,
                position: 'top',
                visibilityTime: 3000,
                topOffset: 60,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-5">
            {/* Back button and page title */}
            <View className="flex-row items-center mt-5 mb-8">
                <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-gray-100">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-black">Forgot Password</Text>
            </View>

            {/* Form */}
            <Formik
                initialValues={{ email: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                    <View>
                        {/* Email input */}
                        <Text className="text-base font-medium mb-2 text-black">
                            Enter your email address
                        </Text>
                        <TextInput
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={values.email}
                            onChangeText={handleChange('email')}
                            onBlur={handleBlur('email')}
                            className="border border-gray-300 rounded-lg px-4 py-3 mb-2"
                        />
                        {touched.email && errors.email && (
                            <Text className="text-red-500 text-sm mb-4">{errors.email}</Text>
                        )}

                        {/* Submit button */}
                        <TouchableOpacity
                            onPress={() => handleSubmit()}
                            disabled={loading}
                            className={`py-4 rounded-full items-center mt-2 ${loading ? 'bg-gray-400' : 'bg-primary-100'
                                }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white text-lg font-bold">Send Reset Link</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </Formik>
        </SafeAreaView>
    );
};

export default ForgotPassword;
