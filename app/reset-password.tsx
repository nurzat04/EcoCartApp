import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as Yup from 'yup';

const ResetPassword = () => {
    const router = useRouter();
    const { token, uid } = useLocalSearchParams(); // 从 URL 中获取 token 和 uid
    const [loading, setLoading] = useState(false);
    const { userId, secret } = useLocalSearchParams()
    // 验证规则
    const validationSchema = Yup.object().shape({
        new_password: Yup.string().min(8, 'Password must be at least 8 characters').required('Required'),
        confirm_password: Yup.string()
            .oneOf([Yup.ref('new_password'), undefined], 'Passwords do not match')
            .required('Required'),
    });

    // 提交表单
    const handleSubmit = async (values: { new_password: string; confirm_password: string }) => {
        setLoading(true);
        try {
            // 将 token、uid 和新密码发送给后端
            await axios.post('http://172.20.10.3:8000/users/reset-password/', {
                token,
                uid,  // 传递用户 ID
                password: values.new_password,  // 新密码
            });

            // 显示成功提示
            Toast.show({
                type: 'success',
                text1: 'Password reset successful',
                text2: 'You can now log in 🔐',
                position: 'top',
                visibilityTime: 2500,
                topOffset: 60,
            });

            // 跳转到登录页面
            setTimeout(() => {
                router.replace('/login'); // 跳转登录页
            }, 1000);
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Reset failed. Try again.';
            // 显示错误提示
            Toast.show({
                type: 'error',
                text1: 'Reset failed',
                text2: msg,
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
            {/* 返回按钮和标题 */}
            <View className="flex-row items-center mt-5 mb-8">
                <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-gray-100">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-black">Reset Password</Text>
            </View>

            {/* 表单组件 */}
            <Formik
                initialValues={{ new_password: '', confirm_password: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                    <View>
                        {/* 新密码 */}
                        <Text className="text-base font-medium mb-2 text-black">New Password</Text>
                        <TextInput
                            secureTextEntry
                            placeholder="••••••••"
                            value={values.new_password}
                            onChangeText={handleChange('new_password')}
                            onBlur={handleBlur('new_password')}
                            className="border border-gray-300 rounded-lg px-4 py-3 mb-2"
                        />
                        {touched.new_password && errors.new_password && (
                            <Text className="text-red-500 text-sm mb-4">{errors.new_password}</Text>
                        )}

                        {/* 确认密码 */}
                        <Text className="text-base font-medium mb-2 text-black">Confirm Password</Text>
                        <TextInput
                            secureTextEntry
                            placeholder="••••••••"
                            value={values.confirm_password}
                            onChangeText={handleChange('confirm_password')}
                            onBlur={handleBlur('confirm_password')}
                            className="border border-gray-300 rounded-lg px-4 py-3 mb-2"
                        />
                        {touched.confirm_password && errors.confirm_password && (
                            <Text className="text-red-500 text-sm mb-4">{errors.confirm_password}</Text>
                        )}

                        {/* 提交按钮 */}
                        <TouchableOpacity
                            onPress={() => handleSubmit()}
                            disabled={loading}
                            className={`py-4 rounded-full items-center mt-2 ${loading ? 'bg-gray-400' : 'bg-primary-100'
                                }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white text-lg font-bold">Reset Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </Formik>
        </SafeAreaView>
    );
};

export default ResetPassword;
