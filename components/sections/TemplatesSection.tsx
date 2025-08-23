"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { animate } from "animejs";
import Head from "next/head";

const templates = [
  { name: "azurill", pdf: "azurill.pdf", jpg: "azurill.jpg" },
  { name: "bronzor", pdf: "bronzor.pdf", jpg: "bronzor.jpg" },
  { name: "chikorita", pdf: "chikorita.pdf", jpg: "chikorita.jpg" },
  { name: "ditto", pdf: "ditto.pdf", jpg: "ditto.jpg" },
  { name: "gengar", pdf: "gengar.pdf", jpg: "gengar.jpg" },
  { name: "glalie", pdf: "glalie.pdf", jpg: "glalie.jpg" },
  { name: "kakuna", pdf: "kakuna.pdf", jpg: "kakuna.jpg" },
  { name: "leafish", pdf: "leafish.pdf", jpg: "leafish.jpg" },
  { name: "nosepass", pdf: "nosepass.pdf", jpg: "nosepass.jpg" },
  { name: "onyx", pdf: "onyx.pdf", jpg: "onyx.jpg" },
  { name: "pikachu", pdf: "pikachu.pdf", jpg: "pikachu.jpg" },
  { name: "rhyhorn", pdf: "rhyhorn.pdf", jpg: "rhyhorn.jpg" },
];

export default function TemplatesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality with smooth animation - faster movement
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setTimeout(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % templates.length);
    }, 2000); // 2 seconds for faster auto-movement

    return () => clearTimeout(timer);
  }, [currentIndex, isAutoPlaying]);

  // Mouse enter/leave handlers for auto-play
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Get multiple templates for infinite scroll effect
  const getVisibleTemplates = () => {
    const visibleCount = 5; // Show 5 templates at once
    const result = [];
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % templates.length;
      result.push({
        ...templates[index],
        displayIndex: i
      });
    }
    
    return result;
  };

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <section className="relative py-16 lg:py-24 bg-black text-white overflow-hidden" style={{ fontFamily: 'Orbitron, monospace' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-12 lg:min-h-[600px] lg:flex-row lg:items-center">
            {/* Left content */}
            <div className="space-y-6 lg:basis-96 lg:flex-shrink-0">
              <h2 className="text-4xl lg:text-6xl font-bold uppercase tracking-wider">TEMPLATES</h2>
              <p className="text-lg text-gray-300 leading-relaxed uppercase tracking-wide">
                EXPLORE THE TEMPLATES AVAILABLE IN REACTIVE RESUME AND VIEW THE RESUMES CRAFTED WITH THEM. THEY COULD ALSO SERVE AS EXAMPLES TO HELP GUIDE THE CREATION OF YOUR NEXT RESUME.
              </p>
              <div className="w-24 h-1 bg-white"></div>
            </div>
            
            {/* Right content - Auto-moving Templates carousel */}
            <div 
              className="flex-1 relative"
              ref={containerRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative h-[500px] w-full overflow-hidden">
                {/* Infinite scrolling container */}
                <motion.div 
                  className="flex gap-6 h-full items-center"
                  animate={{
                    x: `${-currentIndex * 280}px` // Move by template width + gap
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeInOut"
                  }}
                >
                  {/* Render multiple sets for infinite effect */}
                  {[...Array(3)].map((_, setIndex) => 
                    templates.map((tpl, index) => {
                      const globalIndex = setIndex * templates.length + index;
                      const isCenter = Math.abs(globalIndex - currentIndex - 2) <= 1;
                      
                      return (
                        <motion.a
                          key={`${tpl.name}-${setIndex}-${index}`}
                          className="flex-shrink-0 w-[260px] h-[380px] relative group"
                          href={`https://rxresu.me/templates/pdf/${tpl.pdf}`}
                          target="_blank"
                          rel="noreferrer"
                          whileHover={{ 
                            scale: 1.05,
                            boxShadow: '0 0 30px rgba(255,255,255,0.3)'
                          }}
                          style={{
                            opacity: isCenter ? 1 : 0.6,
                            filter: isCenter ? 'none' : 'blur(2px)'
                          }}
                        >
                          <div className="relative w-full h-full border-2 border-gray-700 hover:border-white transition-all duration-300 bg-gray-900/30">
                            <Image
                              alt={tpl.name}
                              src={`https://rxresu.me/templates/jpg/${tpl.jpg}`}
                              fill
                              className="object-cover"
                              sizes="260px"
                            />
                            {/* Template name overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3">
                              <p className="text-white text-sm uppercase tracking-widest font-semibold">
                                {tpl.name}
                              </p>
                            </div>
                          </div>
                        </motion.a>
                      );
                    })
                  )}
                </motion.div>
              </div>
              
              {/* Enhanced gradient overlays for blur/fade effect */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-black via-black/80 to-transparent z-10"></div>
              
              {/* Top and bottom fade */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/50 to-transparent z-10"></div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
            </div>
          </div>
        </div>
        
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
