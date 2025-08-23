"use client";

import React from "react";
import Image from "next/image";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";

// AnimatedCount animates numbers from 0 to value on scroll
function AnimatedCount({ value, className = "" }: { value: string; className?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.7 });

  useEffect(() => {
    if (!inView) return;
    // Only animate if value is a number (strip commas, plus)
    const num = parseInt(value.replace(/[^\d]/g, ""), 10);
    if (isNaN(num)) {
      setDisplay(value);
      return;
    }
    let frame: number;
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();
    function animateCount(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * num);
      setDisplay(current.toLocaleString() + "+");
      if (progress < 1) {
        frame = requestAnimationFrame(animateCount);
      } else {
        setDisplay(value);
      }
    }
    frame = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [inView, value]);

  return <span ref={ref} className={className}>{display}</span>;
}

const COMPANIES = [
  { name: "Amazon", logo: "/amazon.svg" },
  { name: "Google", logo: "/google.svg" },
  { name: "Postman", logo: "/postman.svg" },
  { name: "Twilio", logo: "/twilio.svg" },
  { name: "Zalando", logo: "/zalando.svg" },
];

const STATS = [
  { value: "27,000+", label: "GitHub Stars" },
  { value: "650,000+", label: "Users Signed Up" },
  { value: "840,000+", label: "Resumes Generated" },
];

export default function CompaniesStatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <section ref={ref} className="w-full h-screen bg-black flex flex-col justify-center items-center" style={{ fontFamily: 'Orbitron, monospace' }}>
        <motion.div
          className="w-full max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 80 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Companies Row */}
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
            <p className="text-gray-200 text-center mb-8 text-lg uppercase tracking-wider">
              REACTIVE RESUME HAS HELPED PEOPLE LAND JOBS AT THESE GREAT COMPANIES:
            </p>
            <div className="flex flex-wrap justify-center gap-12 items-center mb-10">
              {COMPANIES.map((c) => (
                <motion.div 
                  key={c.name} 
                  className="flex items-center h-12 transition-all duration-300"
                  whileHover={{ scale: 1.1, filter: 'brightness(1.2)' }}
                >
                  <Image src={c.logo} alt={c.name} width={120} height={48} className="object-contain h-12 w-auto filter brightness-0 invert opacity-80 hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
            <p className="text-gray-400 text-center text-sm mb-10 max-w-lg uppercase tracking-wide">
              IF THIS APP HAS HELPED YOU WITH YOUR JOB HUNT, LET ME KNOW BY REACHING OUT THROUGH THIS CONTACT FORM.
            </p>
          </div>
          {/* Fun pun line above stats */}
          <div className="w-full flex flex-col items-center mt-16 mb-4">
            <span className="text-xl text-gray-400 mb-2 animate-pulse uppercase tracking-wider">HOPING ONE DAY IT WOULD REACH THERE! 🚀</span>
          </div>
          {/* Stats Row with more space and animation */}
          <div className="w-full max-w-5xl mx-auto py-16">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-1 bg-white"></div>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-16 md:gap-0">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="flex-1 flex flex-col items-center p-6 border border-gray-700 bg-gray-900/30 hover:border-white transition-all duration-300"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.8, delay: i * 0.2, type: "spring" }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
                >
                  <AnimatedCount value={stat.value} className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wider" />
                  <div className="text-gray-400 text-base uppercase tracking-widest text-center">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
          <p className="text-gray-400 text-center text-sm mb-10 max-w-lg uppercase tracking-wide">
            IF THIS APP HAS HELPED YOU WITH YOUR JOB HUNT, LET ME KNOW BY REACHING OUT THROUGH THIS CONTACT FORM.
          </p>
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
