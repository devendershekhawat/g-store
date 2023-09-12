"use client";
import { createContext, useState } from 'react';
import './globals.css'
import { SupabaseClient, createClient } from '@supabase/supabase-js';

export const SupabaseContext = createContext<SupabaseClient>(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_KEY || ''));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = useState(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_KEY || ''))
  return (
    <html lang="en">
      <body>
        <SupabaseContext.Provider value={supabase}>
          {children}
        </SupabaseContext.Provider>
      </body>
    </html>
  )
}
