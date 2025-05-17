import * as SecureStore from "expo-secure-store";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { getCurrentUser } from "./appwrite";

interface GlobalContextType {
    isLoggedIn: boolean;
    user: User | null;
    loading: boolean;
    refetch: (newParams?: Record<string, string | number>) => Promise<void>;
    setIsLoggedIn: (isLoggedIn: boolean) => void;  // 新增：更新 isLoggedIn 的函数
}

interface User {
    $id: string;
    name: string;
    email: string;
    avatar: string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
    children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync("token");
            if (!token) {
                setUser(null);
            } else {
                const currentUser = await getCurrentUser();
                setUser(currentUser ?? null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // 更新 isLoggedIn 的状态
    if (user && !isLoggedIn) {
        setIsLoggedIn(true);

    }

    const refetch = async () => {
        await fetchUser(); // 重新请求并更新状态
    };

    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                user,
                loading,
                refetch: fetchUser,
                setIsLoggedIn,  // 提供修改 isLoggedIn 的方法
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = (): GlobalContextType => {
    const context = useContext(GlobalContext);
    if (!context)
        throw new Error("useGlobalContext must be used within a GlobalProvider");

    return context;
};

export default GlobalProvider;
