"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { FaGithub,FaMicrosoft, FaGoogle, FaDocker, FaPalette, FaFont, FaLock, FaEnvelope, FaUserShield, FaGlobe, FaRegNoteSticky, FaDownload, FaEye, FaSun, FaMoon, FaCubes, FaLanguage, FaKey, FaRegClone } from "react-icons/fa6";
import { SiOpenai, SiReact, SiTypescript, SiNextdotjs } from "react-icons/si";
import { MdCheckCircle } from "react-icons/md";
import { LiaSignInAltSolid } from "react-icons/lia";
import Head from "next/head";
const FEATURES = [
  { icon: <MdCheckCircle />, text: "Free, forever" },
  { icon: <FaGithub />, text: "Open Source" },
  { icon: <FaKey />, text: "MIT License" },
  { icon: <FaUserShield />, text: "No user tracking or advertising" },
  { icon: <FaDocker />, text: "Self-host with Docker" },
  { icon: <FaLanguage />, text: "Available in 50 languages" },
  { icon: <SiOpenai />, text: "OpenAI Integration" },
  { icon: <FaGithub />, text: "Sign in with GitHub" },
  { icon: <FaGoogle />, text: "Sign in with Google" },
  { icon: <FaEnvelope />, text: "Sign in with Email" },
  { icon: <FaLock />, text: "Secure with two-factor authentication" },
  { icon: <FaRegClone />, text: "12 resume templates to choose from" },
  { icon: <FaCubes />, text: "Design single/multi page resumes" },
  { icon: <FaRegClone />, text: "Manage multiple resumes" },
  { icon: <FaPalette />, text: "Customisable colour palettes" },
  { icon: <FaCubes />, text: "Customisable layouts" },
  { icon: <FaRegNoteSticky />, text: "Custom resume sections" },
  { icon: <FaRegNoteSticky />, text: "Personal notes for each resume" },
  { icon: <FaLock />, text: "Lock a resume to prevent editing" },
  { icon: <FaRegClone />, text: "Supports A4/Letter page formats" },
  { icon: <FaFont />, text: "Pick any font from Google Fonts" },
  { icon: <FaGlobe />, text: "Host your resume publicly" },
  { icon: <FaEye />, text: "Track views and downloads" },
  { icon: <FaSun />, text: "Light or dark theme" },
];

const TECHS = [
  { icon: <SiReact />, name: "React" },
  { icon: <SiNextdotjs />, name: "Next.js" },
  { icon: <SiTypescript />, name: "TypeScript" },
  { icon: <SiOpenai />, name: "OpenAI" },
  { icon: <FaMicrosoft />, name: "Microsoft" },
];

export default function FeaturesSection() {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <section ref={ref} className="w-full min-h-screen bg-black flex flex-col justify-center items-center px-4 py-24 relative" style={{ fontFamily: 'Orbitron, monospace' }}>
        <motion.div
          className="max-w-6xl w-full mx-auto relative z-10"
          initial={{ opacity: 0, y: 80 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron uppercase tracking-wider">
            FEATURES
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-3xl mx-auto font-orbitron tracking-wide">
            DISCOVER THE POWERFUL AI-DRIVEN FEATURES THAT MAKE AIAPPLY THE ULTIMATE RESUME BUILDER
          </p>
          <motion.div
            className="flex flex-wrap gap-4 mb-14"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.span
                key={i}
                className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-gray-200 text-sm font-medium border border-gray-700 hover:border-white hover:bg-gray-800 transition-all duration-300 uppercase tracking-wider"
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 24 } },
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,255,255,0.2)' }}
              >
                {f.icon}
                {f.text}
              </motion.span>
            ))}
          </motion.div>
          <div className="flex flex-wrap gap-6 items-center mt-6 p-6 border border-gray-700 bg-gray-900/30">
            <span className="text-gray-400 text-base uppercase tracking-widest">POWERED BY</span>
            {TECHS.map((t, i) => (
              <motion.span 
                key={i} 
                className="flex items-center gap-2 text-white text-base p-2 border border-gray-600 hover:border-white transition-all duration-300"
                whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(255,255,255,0.3)' }}
              >
                {t.icon}
                <span className="uppercase tracking-wider text-sm">{t.name}</span>
              </motion.span>
            ))}
            <span className="text-gray-400 text-base uppercase tracking-widest">AND MANY MORE...</span>
          </div>
        </motion.div>
        
        {/* Retro Grid Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </section>
    </>
  );
}
