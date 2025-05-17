// stores/userStore.ts
import { create } from 'zustand'

type UserStore = {
    username: string
    avatar: string
    token: string
    isAdmin: string
    isVendor: string
    setUsername: (username: string) => void
    setAvatar: (avatar: string) => void
    setToken: (token: string) => void
    setIsAdmin: (isAdmin: string) => void
    setIsVendor: (isVendor: string) => void
}

export const useUserStore = create<UserStore>((set) => ({
    username: '',
    avatar: '',
    token: '',
    isAdmin: '',
    isVendor: '',
    setIsAdmin: (isAdmin) => set({ isAdmin }),
    setIsVendor: (isVendor) => set({ isVendor }),
    setUsername: (username) => set({ username }),
    setAvatar: (avatar) => set({ avatar }),
    setToken: (token) => set({ token })
}))
