'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Plus, Search, Grid, List, Filter, User, LogOut, Bell, Settings, FileText } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import FileUpload from '@/components/FileUpload'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Move hooks to the top - they must always be called in the same order
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeSection, setActiveSection] = useState('resumes')

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/login') // Not authenticated, redirect to login
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Mock resume data
  const resumes = [
    {
      id: 1,
      name: session.user?.name || 'Your Resume',
      lastUpdated: 'a day ago',
      preview: '/api/placeholder/300/400'
    }
  ]

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen flex" style={{ fontFamily: 'Orbitron, monospace', backgroundColor: '#000' }}>
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-800 flex flex-col" style={{ backgroundColor: '#111' }}>
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <span className="text-black font-bold text-lg">Ai</span>
              </div>
              <span className="text-white font-bold text-xl tracking-wider">Apply</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveSection('resumes')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === 'resumes'
                    ? 'bg-gray-800 text-white border-l-2 border-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Grid size={20} />
                <span className="font-medium tracking-wide">RESUMES</span>
              </button>
              <button
                onClick={() => router.push('/templates')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <FileText size={20} />
                <span className="font-medium tracking-wide">TEMPLATES</span>
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === 'settings'
                    ? 'bg-gray-800 text-white border-l-2 border-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Settings size={20} />
                <span className="font-medium tracking-wide">SETTINGS</span>
              </button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <User size={20} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium tracking-wide truncate">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  Licensed under VELTRIX
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm tracking-wide"
            >
              <LogOut size={16} />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-gray-800 p-6" style={{ backgroundColor: '#000' }}>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white tracking-wider">RESUMES</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-900 rounded border border-gray-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
                <span className="text-gray-400 text-sm tracking-wide">Grid</span>
                <span className="text-gray-400 text-sm tracking-wide">List</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6">
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>

              {/* Import Resume Card */}
              <FileUpload />

            </div>
          </main>
        </div>
      </div>
    </>
  )
}
