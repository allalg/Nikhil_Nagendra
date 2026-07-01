"use client";

import React from "react";

export default function MobileCaveView() {
  return (
    <div 
      className="w-full h-[100dvh] overflow-y-auto snap-y snap-mandatory scroll-smooth font-myfont text-[rgba(230,210,175,0.9)] relative z-0"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none",  // IE and Edge
        backgroundColor: "#14100c",
      }}
    >
      {/* Background Cave Wall Texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1]"
        style={{
          backgroundImage: "url('/mobile-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" /> {/* Darken overlay and slight blur for text readability */}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .mobile-cave-scroll::-webkit-scrollbar { display: none; }
        .text-glow { text-shadow: 0 0 12px rgba(251,146,60,0.6); }
        .box-glow { box-shadow: inset 0 0 15px rgba(200,160,80,0.1), 0 4px 20px rgba(0,0,0,0.5); border: 1px solid rgba(180,130,60,0.2); }
      `}} />

      {/* 1. HERO */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative mobile-cave-scroll">
        <h1 className="text-5xl font-bold mb-2 text-white text-glow">Nikhil<br/>Nagendra.</h1>
        <div className="w-16 h-[2px] bg-[rgba(255,255,255,0.7)] mb-6 rounded-full" />
        
        <p className="text-xl mb-1">Building intelligent systems</p>
        <p className="text-xl mb-1">at the intersection of</p>
        <p className="text-xl mb-6">AI, finance & human resilience.</p>
        
        <p className="text-lg italic text-[rgba(200,170,120,0.7)] mb-8">somehow ended up doing all three...</p>

        <div className="box-glow rounded-xl p-5 bg-[rgba(20,15,10,0.6)] backdrop-blur-sm max-w-[280px]">
          <h3 className="text-xl font-bold mb-3 text-glow">STATUS</h3>
          <ul className="text-lg space-y-2">
            <li>doing better.</li>
            <li>still building.</li>
            <li>still curious.</li>
            <li>still me. 😊</li>
          </ul>
        </div>
        
        <div className="absolute bottom-10 w-full text-center left-0 animate-bounce">
          <p className="italic text-[rgba(200,170,120,0.7)]">scroll ↓</p>
        </div>
      </section>

      {/* 2. ABOUT */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative">
        <div className="w-full h-[1px] bg-[rgba(200,160,80,0.2)] mb-4" />
        <h2 className="text-3xl font-bold mb-6 text-glow">01) ABOUT</h2>
        
        <div className="mb-8 space-y-2 text-xl">
          <p>computer science engineer.</p>
          <p>backgrounds in medicine & finance.</p>
          <p>building human-centered technology.</p>
        </div>

        <div className="space-y-4 text-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⛰️</span>
            <p><strong>Explorer</strong> — treks, nature, wandering</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚙️</span>
            <p><strong>Builder</strong> — systems, hackathons, ideas</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎨</span>
            <p><strong>Creative</strong> — painting, origami, cooking</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">👁️</span>
            <p><strong>Thinker</strong> — philosophy, Vedanta, psych</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">❤️</span>
            <p><strong>Humanitarian</strong> — NGOs, healthcare</p>
          </div>
        </div>
      </section>

      {/* 3. PROJECTS */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative">
        <div className="w-full h-[1px] bg-[rgba(200,160,80,0.2)] mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-glow">02) PROJECTS</h2>
        <p className="italic text-[rgba(200,170,120,0.7)] mb-6 text-right">ideas. code. impact.</p>
        
        <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[70vh] pb-8 pr-2" style={{ scrollbarWidth: "none" }}>
          <a href="https://github.com/NitinBharadwajMVS/em-link-med" target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
            <div className="box-glow rounded-lg p-4 bg-[rgba(20,15,10,0.4)]">
              <h3 className="text-xl font-bold text-glow">🚑 MEDI-XPRESS</h3>
              <p className="text-lg">ambulance-hospital coordination</p>
              <p className="text-sm italic text-[rgba(200,170,120,0.7)] mt-1">healthcare chaos → scalable</p>
            </div>
          </a>
          <a href="https://github.com/Kavana917/What-If-" target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
            <div className="box-glow rounded-lg p-4 bg-[rgba(20,15,10,0.4)]">
              <h3 className="text-xl font-bold text-glow">🎮 GAMEATHON</h3>
              <p className="text-lg">Multi-agent game logic</p>
              <p className="text-sm italic text-[rgba(200,170,120,0.7)] mt-1">3hr sleep. questionable decisions.</p>
            </div>
          </a>
          <a href="https://github.com/allalg/simplified-trading-bot" target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
            <div className="box-glow rounded-lg p-4 bg-[rgba(20,15,10,0.4)]">
              <h3 className="text-xl font-bold text-glow">📈 TRADING BOT</h3>
              <p className="text-lg">Binance Futures testnet bot</p>
              <p className="text-sm italic text-[rgba(200,170,120,0.7)] mt-1">paper profits. real lessons.</p>
            </div>
          </a>
          <a href="https://github.com/allalg/acc_ledger" target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
            <div className="box-glow rounded-lg p-4 bg-[rgba(20,15,10,0.4)]">
              <h3 className="text-xl font-bold text-glow">🗄️ FINDB</h3>
              <p className="text-lg">High-throughput ledger DBMS</p>
              <p className="text-sm italic text-[rgba(200,170,120,0.7)] mt-1">CA trauma → useful at last.</p>
            </div>
          </a>
          <a href="https://github.com/allalg/ACIS-X" target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
            <div className="box-glow rounded-lg p-4 bg-[rgba(20,15,10,0.4)]">
              <h3 className="text-xl font-bold text-glow">⚡ ACIS-X</h3>
              <p className="text-lg">Real-time credit intelligence on Kafka</p>
              <p className="text-sm italic text-[rgba(200,170,120,0.7)] mt-1">signals in. decisions out. no sleep.</p>
            </div>
          </a>
          <a href="https://github.com/allalg/devfolio" target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
            <div className="box-glow rounded-lg p-4 bg-[rgba(20,15,10,0.4)]">
              <h3 className="text-xl font-bold text-glow">🧠 RAG ENGINE</h3>
              <p className="text-lg">Vector + graph retrieval (ChromaDB)</p>
              <p className="text-sm italic text-[rgba(200,170,120,0.7)] mt-1">documents finally make sense.</p>
            </div>
          </a>
        </div>
      </section>

      {/* 4. TOOLBOX & MILESTONES */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative">
        <div className="w-full h-[1px] bg-[rgba(200,160,80,0.2)] mb-4" />
        <h2 className="text-3xl font-bold mb-6 text-glow">03) TOOLBOX</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <p className="text-sm text-[rgba(200,170,120,0.7)]">systems & ai</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-3 py-1 box-glow rounded-md text-base">Dist Systems</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">Agent-Based</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">Prompt Eng</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-[rgba(200,170,120,0.7)]">backend, data & security</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-3 py-1 box-glow rounded-md text-base">SQL DBs</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">REST APIs</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">Threat Modeling</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-[rgba(200,170,120,0.7)]">core</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-3 py-1 box-glow rounded-md text-base">Python</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">JS/TS</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">C</span>
              <span className="px-3 py-1 box-glow rounded-md text-base">React/Next</span>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-4 text-glow">MILESTONES</h3>
        <ul className="space-y-3 text-lg">
          <li>🏆 <strong>Gameathon</strong> — 3rd Place</li>
          <li>🎯 <strong>CTF</strong> — 6th / 36 Teams</li>
          <li>💻 <strong>Hackathons</strong> — rapid prototyping</li>
          <li>🏔️ <strong>Himalayan Treks</strong> — reached 5200m</li>
        </ul>
      </section>

      {/* 5. JOURNEY */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative">
        <div className="w-full h-[1px] bg-[rgba(200,160,80,0.2)] mb-4" />
        <h2 className="text-3xl font-bold mb-1 text-glow">04) JOURNEY</h2>
        <p className="italic text-[rgba(200,170,120,0.7)] mb-8 text-right">not a resume. a real path.</p>

        <div className="relative border-l-2 border-[rgba(200,160,80,0.4)] ml-3 pl-6 space-y-8">
          <div className="relative">
            <div className="absolute w-4 h-4 rounded-full bg-[rgba(200,160,80,0.8)] -left-[33px] top-2 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            <h3 className="text-2xl font-bold text-white">⚕️ MBBS</h3>
            <p className="text-lg">2 years of medicine.</p>
            <p className="text-lg">empathy carved deep.</p>
          </div>
          
          <div className="relative">
            <div className="absolute w-4 h-4 rounded-full bg-[rgba(150,100,80,0.8)] -left-[33px] top-2" />
            <h3 className="text-2xl font-bold text-white">🥀 THE PLOT TWIST</h3>
            <p className="text-lg">battles fought (depression/anxiety).</p>
            <p className="text-lg">ground eventually found.</p>
          </div>

          <div className="relative">
            <div className="absolute w-4 h-4 rounded-full bg-[rgba(200,160,80,0.8)] -left-[33px] top-2 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            <h3 className="text-2xl font-bold text-white">📊 CA</h3>
            <p className="text-lg">foundation + inter G1.</p>
            <p className="text-lg">discipline as survival.</p>
          </div>

          <div className="relative">
            <div className="absolute w-4 h-4 rounded-full bg-[rgba(255,200,100,0.9)] -left-[33px] top-2 shadow-[0_0_12px_rgba(251,146,60,1)]" />
            <h3 className="text-2xl font-bold text-white">💻 B.E CSE</h3>
            <p className="text-lg">building now.</p>
            <p className="text-lg">a better direction.</p>
          </div>
        </div>
      </section>

      {/* 6. PHILOSOPHY */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative">
        <div className="w-full h-[1px] bg-[rgba(200,160,80,0.2)] mb-4" />
        <h2 className="text-3xl font-bold mb-8 text-glow">05) PHILOSOPHY</h2>
        
        <div className="space-y-6">
          <div className="box-glow rounded-lg p-5 bg-[rgba(20,15,10,0.4)]">
            <p className="text-lg mb-2">"We do not see things as they are. We see them as we are."</p>
            <p className="text-sm italic text-right">— Anaïs Nin</p>
          </div>

          <div className="box-glow rounded-lg p-5 bg-[rgba(20,15,10,0.4)]">
            <p className="text-lg mb-2">"We must be willing to let go of the life we planned so as to have the life that is waiting for us."</p>
            <p className="text-sm italic text-right">— Joseph Campbell</p>
          </div>

          <div className="box-glow rounded-lg p-5 bg-[rgba(20,15,10,0.4)]">
            <p className="text-lg mb-2">"In a day, when you don't come across any problems - you can be sure that you are travelling in a wrong path"</p>
            <p className="text-sm italic text-right">— Swami Vivekananda</p>
          </div>
        </div>
      </section>

      {/* 7. CONTACT */}
      <section className="h-[100dvh] w-full snap-start flex flex-col justify-center px-6 relative">
        <div className="w-full h-[1px] bg-[rgba(200,160,80,0.2)] mb-4" />
        <h2 className="text-3xl font-bold mb-8 text-glow">06) CONTACT ME</h2>
        
        <p className="text-xl mb-1">if you've made it this far,</p>
        <p className="text-xl mb-8">let's build something cool together.</p>

        <div className="space-y-6">
          <a href="mailto:nikhilnag98@gmail.com" className="flex items-center gap-4 box-glow p-4 rounded-lg bg-[rgba(30,20,10,0.6)] active:scale-95 transition-transform">
            <span className="text-2xl">✉️</span>
            <span className="text-lg">nikhilnag98@gmail.com</span>
          </a>
          
          <a href="tel:+919986890905" className="flex items-center gap-4 box-glow p-4 rounded-lg bg-[rgba(30,20,10,0.6)] active:scale-95 transition-transform">
            <span className="text-2xl">📞</span>
            <span className="text-lg">+91 9986890905</span>
          </a>

          <div className="flex gap-4">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 box-glow p-4 rounded-lg bg-[rgba(30,20,10,0.6)] active:scale-95 transition-transform">
              <span className="text-2xl">💼</span>
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/allalg" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 box-glow p-4 rounded-lg bg-[rgba(30,20,10,0.6)] active:scale-95 transition-transform">
              <span className="text-2xl">💻</span>
              <span>GitHub</span>
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-10 w-full text-center left-0">
          <p className="italic text-[rgba(200,170,120,0.7)] text-lg">looking forward to our next adventure. 😊</p>
        </div>
      </section>

    </div>
  );
}
