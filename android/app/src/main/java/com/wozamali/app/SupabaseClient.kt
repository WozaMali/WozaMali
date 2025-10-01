package com.wozamali.app

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

/**
 * Supabase Client Singleton
 * 
 * TODO: Replace these placeholder values with your actual Supabase credentials:
 * - SUPABASE_URL: Your Supabase project URL (e.g., "https://mljtjntkddwkcjixkyuy.supabase.co")
 * - SUPABASE_ANON_KEY: Your Supabase anonymous key from the project settings
 */
object SupabaseClient {
    
    // TODO: Replace with your actual Supabase URL
    private const val SUPABASE_URL = "https://mljtjntkddwkcjixkyuy.supabase.co"
    
    // TODO: Replace with your actual Supabase anonymous key
    private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanRqbnRrZGR3a2NqaXhreXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjY2ODUsImV4cCI6MjA3MDAwMjY4NX0.CmiyoaHDNBKBNnJ3UoYWBO5xePLTPUJ2_edE0jLhiAA"
    
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = SUPABASE_URL,
            supabaseKey = SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
            install(Realtime)
        }
    }
    
    val auth = client.auth
    val postgrest = client.postgrest
    val realtime = client.realtime
}
