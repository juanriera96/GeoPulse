import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile(session.user.id)
      }
      set({ loading: false })
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set({ user: session.user })
          await get().fetchProfile(session.user.id)
        } else {
          set({ user: null, profile: null })
        }
      })
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        set({ profile: data })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      set({ loading: false, error: error.message })
      return { error }
    }
    if (data?.user) {
      set({ user: data.user, loading: false })
    } else {
      set({ loading: false })
    }
    return { data }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false, error: error.message })
      return { error }
    }
    if (data?.user) {
      set({ user: data.user, loading: false })
    } else {
      set({ loading: false })
    }
    return { data }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return { error: 'Not authenticated' }
    try {
      // Step 1: UPDATE only (no .select() to avoid slowness)
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      if (error) return { error }
      // Step 2: Re-fetch the full profile to get updated data
      await get().fetchProfile(user.id)
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  },
}))
