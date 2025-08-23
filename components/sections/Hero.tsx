"use client"

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useInView } from 'framer-motion'
import { animate, stagger } from 'animejs'
import { useRouter } from 'next/navigation'
import Head from 'next/head'


export default function Hero() {
  const router = useRouter()
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const xVal = ((e.clientX - rect.left) / rect.width - 0.5) * 50; // rotateY (increased)
    const yVal = ((e.clientY - rect.top) / rect.height - 0.5) * -50; // rotateX (increased)
    x.set(xVal);
    y.set(yVal);
  }
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  useEffect(() => {
    if (headingRef.current) {
      animate(
        headingRef.current.querySelectorAll('span'),
        {
          translateY: [100, 0],
          opacity: [0, 1],
          delay: stagger(50),
          easing: 'easeOutExpo',
          duration: 800,
        }
      )
    }
  }, [])

  const handleSignIn = () => {
    router.push('/login')
  }


  const text = 'Your AI-Powered Resume Assistant'

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <motion.section
        ref={sectionRef}
        className="relative flex flex-row items-center justify-between h-screen w-full bg-black overflow-hidden"
        style={{ fontFamily: 'Orbitron, monospace' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 80 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Left: Text and CTA */}
        <div className="z-10 flex flex-col justify-center items-start h-full w-1/2 pl-12">
          <span className="text-white text-lg font-semibold mb-3 uppercase tracking-widest">FINALLY,</span>
          <h1 className="text-3xl md:text-6xl font-extrabold leading-tight text-white mb-6 uppercase tracking-wider">
            A FREE AND OPEN-
            <br />
            SOURCE RESUME
            <br />
            BUILDER
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl uppercase tracking-wide">
            A FREE AND OPEN-SOURCE RESUME BUILDER THAT SIMPLIFIES THE PROCESS OF CREATING, UPDATING, AND SHARING YOUR RESUME.
          </p>
          <div className="flex gap-6">
            <motion.button 
              onClick={handleSignIn} 
              className="px-8 py-4 bg-white text-black text-base font-semibold shadow-xl border-2 border-white hover:bg-gray-100 transition-all duration-300 uppercase tracking-wider"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              GET STARTED
            </motion.button>
            <motion.button 
              className="flex items-center gap-2 px-8 py-4 bg-transparent text-white text-base font-semibold border-2 border-gray-600 hover:bg-gray-900 hover:border-white transition-all duration-300 uppercase tracking-wider"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span>LEARN MORE</span>
            </motion.button>
          </div>
        </div>
        {/* Right: Image with overlay */}
        <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center">
          <div className="relative w-full h-3/4 my-auto flex items-center">
            <div className="absolute inset-0 bg-gradient-to-l from-black/70 to-transparent z-10" />
            <motion.div
              style={{
                rotateX: y,
                rotateY: x,
                willChange: 'transform',
                width: '100%',
                height: '100%',
                perspective: 1200,
              }}
              className="w-full h-full"
            >
              <Image
                src="/builder.jpg"
                alt="Resume Builder Preview"
                fill
                className="object-cover object-left"
                priority
              />
            </motion.div>
          </div>
          
          {/* Retro Grid Overlay */}
          <div className="absolute inset-0 opacity-10 z-20">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>
        </div>
      </motion.section>
    </>
  
  )
}