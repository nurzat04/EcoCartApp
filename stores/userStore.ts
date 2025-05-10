// stores/userStore.ts
import { create } from 'zustand'

type UserStore = {
    username: string
    avatar: string
    token: string
    setUsername: (username: string) => void
    setAvatar: (avatar: string) => void
    setToken: (token: string) => void
}

export const useUserStore = create<UserStore>((set) => ({
    username: '',
    avatar: '',
    token: '',
    setUsername: (username) => set({ username }),
    setAvatar: (avatar) => set({ avatar }),
    setToken: (token) => set({ token })
}))
