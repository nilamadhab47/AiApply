"use client";

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Head from 'next/head';


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard'); // Redirect to dashboard if already logged in
      }
    };
    checkSession();
  }, [router]);

  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-black flex flex-col lg:flex-row" style={{ fontFamily: 'Orbitron, monospace' }}>
        {/* Left side - Image (65%) */}
        <div className="w-full lg:w-[65%] h-64 lg:h-auto relative overflow-hidden">
          <Image
            src="/patrick-tomasso-Oaqk7qqNh_c-unsplash.jpg"
            alt="Futuristic workspace"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/80" />
        </div>

        {/* Right side - Login Form (35%) */}
        <div className="w-full lg:w-[35%] bg-black flex items-center justify-center p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            {/* Logo/Brand Section */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-white mx-auto flex items-center justify-center mb-6 border-2 border-white">
                  <span className="text-3xl font-bold text-black">R</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-wider">AIAPPY</h1>
                <p className="text-gray-300 text-sm tracking-wide uppercase">NEURAL RESUME ARCHITECT</p>
              </motion.div>
            </div>

            {/* Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-gray-900/80 border border-gray-600 p-8 backdrop-blur-sm"
            >
              <div className="space-y-4">
                {/* Google Sign In */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#f8f9fa' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSignIn('google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-semibold py-4 px-6 transition-all duration-300 border border-white disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? 'INITIALIZING...' : 'GOOGLE ACCESS'}
                </motion.button>

                {/* GitHub Sign In */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#1f2937' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSignIn('github')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 transition-all duration-300 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {isLoading ? 'INITIALIZING...' : 'GITHUB ACCESS'}
                </motion.button>
              </div>

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-500"></div>
                <span className="px-4 text-sm text-gray-400 tracking-widest">OR</span>
                <div className="flex-1 border-t border-gray-500"></div>
              </div>

              {/* Guest Access */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#374151' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-gray-700/50 text-gray-300 font-semibold py-4 px-6 transition-all duration-300 border border-gray-500 hover:border-gray-400 tracking-wide"
              >
                GUEST ACCESS
              </motion.button>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center mt-8 tracking-wide">
                NEURAL LINK AGREEMENT:{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">TERMS</a>
                {' '}|{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">PRIVACY</a>
              </p>
            </motion.div>

            {/* Back to Home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-center mt-8"
            >
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 text-sm tracking-widest uppercase"
              >
                ← RETURN TO BASE
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}