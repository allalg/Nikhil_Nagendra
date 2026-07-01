"use client";

import { useState } from "react";

interface MobileViewProps {
  entered: boolean;
  onEnter: () => void;
}

export default function MobileView({ entered, onEnter }: MobileViewProps) {
  if (!entered) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black allow-normal-cursor z-50">
        <div 
          className="relative cursor-pointer flex flex-col items-center gap-12 group p-8"
          onClick={onEnter}
        >
          {/* Flame/Sconce illustration */}
          <div className="relative w-16 h-24 flex justify-center items-end transform transition-transform group-active:scale-95">
            {/* The Flame (CSS animated) */}
            <div className="absolute bottom-12 w-10 h-16 bg-orange-600 rounded-full blur-[4px] animate-pulse shadow-[0_0_30px_rgba(251,146,60,0.9)] opacity-90 mix-blend-screen"
                 style={{ borderRadius: "50% 50% 20% 20% / 60% 60% 40% 40%" }}></div>
            <div className="absolute bottom-12 w-6 h-10 bg-yellow-400 rounded-full blur-[2px] animate-ping opacity-70 mix-blend-screen"
                 style={{ borderRadius: "50% 50% 20% 20% / 60% 60% 40% 40%", animationDuration: "1.2s" }}></div>
            <div className="absolute bottom-12 w-3 h-5 bg-white rounded-full mix-blend-screen"
                 style={{ borderRadius: "50% 50% 20% 20% / 60% 60% 40% 40%" }}></div>
            
            {/* Sconce Base */}
            <div className="w-10 h-10 bg-[#2d1a0d] rounded-b-xl border-t-4 border-[#1a1005] relative z-10 shadow-[0_8px_20px_rgba(0,0,0,0.8)]"></div>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <span
              className="font-handwritten uppercase animate-pulse"
              style={{
                fontSize: "20px",
                color: "rgba(255, 225, 160, 1)",
                letterSpacing: "0.08em",
                textShadow: "0 0 16px rgba(251,146,60,0.8), 0 0 30px rgba(251,146,60,0.4)",
              }}
            >
              tap the sconce to enter
            </span>
          </div>
        </div>
      </div>
    );
  }

  // The main scrolling view
  return (
    <div className="absolute inset-0 bg-[#0a0704] overflow-y-auto snap-y snap-mandatory text-[rgba(230,210,175,0.9)] scroll-smooth allow-normal-cursor z-40">
      {/* Background grain/texture (CSS only to save battery) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
           style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

      <Section id="hero">
        <h1 className="font-handwritten text-5xl mb-2 text-[rgba(255,255,255,0.95)] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">NIKHIL</h1>
        <p className="font-myfont text-sm text-[rgba(180,150,100,0.8)]">(the guy who built this cave)</p>
        
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-70 animate-bounce">
          <p className="font-myfont text-[11px] mb-2 italic">scroll down</p>
          <div className="w-0.5 h-6 bg-[rgba(220,160,80,0.5)]"></div>
        </div>
      </Section>

      <Section id="about">
        <h2 className="font-handwritten text-2xl mb-6 text-[rgba(255,255,255,0.95)] border-b border-[rgba(180,130,60,0.3)] pb-2 inline-block">01) ABOUT</h2>
        <p className="font-myfont text-sm mb-2">computer science engineer.</p>
        <p className="font-myfont text-sm mb-2">backgrounds in medicine & finance.</p>
        <p className="font-myfont text-sm mb-6">building human-centered technology.</p>
        <ul className="font-myfont text-xs space-y-3 opacity-90">
          <li>• Explorer — treks, nature, wandering</li>
          <li>• Builder — systems, hackathons, ideas</li>
          <li>• Creative — painting, origami, cooking</li>
          <li>• Thinker — philosophy, Vedanta, psych</li>
          <li>• Humanitarian — NGOs, healthcare empathy</li>
        </ul>
        <div className="mt-8 text-right opacity-60">
          <p className="font-myfont text-[10px] italic">books &gt; people (most days)</p>
          <p className="font-myfont text-[10px] italic">good food. better mood.</p>
        </div>
      </Section>

      <Section id="projects">
        <h2 className="font-handwritten text-2xl mb-2 text-[rgba(255,255,255,0.95)] border-b border-[rgba(180,130,60,0.3)] pb-2 inline-block">02) PROJECTS</h2>
        <p className="font-myfont text-[11px] mb-6 italic opacity-60">ideas. code. impact.</p>
        
        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          <ProjectCard title="MEDI-XPRESS" role="ambulance-hospital coordination platform" tag="healthcare chaos → scalable" />
          <ProjectCard title="GAMEATHON" role="Multi-agent game logic" tag="3hr sleep. questionable decisions." />
          <ProjectCard title="FINDB" role="High-throughput ledger DBMS" tag="CA trauma → useful at last." />
          <ProjectCard title="ACIS-X" role="Real-time credit intelligence" tag="signals in. decisions out. no sleep." />
          <ProjectCard title="RAG ENGINE" role="Vector + graph retrieval" tag="documents finally make sense." />
        </div>
      </Section>

      <Section id="skills">
        <h2 className="font-handwritten text-2xl mb-6 text-[rgba(255,255,255,0.95)] border-b border-[rgba(180,130,60,0.3)] pb-2 inline-block">03) SKILLS</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-handwritten text-lg mb-2">LANGUAGES</h3>
            <p className="font-myfont text-xs opacity-80 leading-relaxed">TypeScript, Python, C++, SQL, HTML/CSS</p>
          </div>
          <div>
            <h3 className="font-handwritten text-lg mb-2">FRAMEWORKS</h3>
            <p className="font-myfont text-xs opacity-80 leading-relaxed">React, Next.js, Node.js, Express, Tailwind</p>
          </div>
          <div>
            <h3 className="font-handwritten text-lg mb-2">INFRA & DATA</h3>
            <p className="font-myfont text-xs opacity-80 leading-relaxed">AWS, Docker, PostgreSQL, MongoDB, Redis, Kafka</p>
          </div>
        </div>
      </Section>

      <Section id="philosophy">
        <h2 className="font-handwritten text-2xl mb-6 text-[rgba(255,255,255,0.95)] border-b border-[rgba(180,130,60,0.3)] pb-2 inline-block">04) PHILOSOPHY</h2>
        <p className="font-myfont text-sm leading-relaxed mb-6 opacity-90">
          I believe code is poetry and architecture is art.
        </p>
        <p className="font-myfont text-sm leading-relaxed mb-6 opacity-90">
          I build to solve real problems, prioritizing human empathy over technical complexity.
        </p>
        <p className="font-myfont text-[11px] mt-8 italic opacity-60 text-right">
          (this cave is my digital mind)
        </p>
      </Section>

      <Section id="contact">
        <h2 className="font-handwritten text-2xl mb-8 text-[rgba(255,255,255,0.95)] border-b border-[rgba(180,130,60,0.3)] pb-2 inline-block">05) CONTACT</h2>
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <a href="#" className="font-myfont text-sm flex items-center justify-center gap-3 bg-[rgba(30,20,10,0.5)] border border-[rgba(220,160,80,0.3)] px-6 py-4 rounded-xl active:bg-[rgba(50,35,15,0.8)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
            <span>✉️</span> Email Me
          </a>
          <a href="#" className="font-myfont text-sm flex items-center justify-center gap-3 bg-[rgba(30,20,10,0.5)] border border-[rgba(220,160,80,0.3)] px-6 py-4 rounded-xl active:bg-[rgba(50,35,15,0.8)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
            <span>💼</span> LinkedIn
          </a>
          <a href="#" className="font-myfont text-sm flex items-center justify-center gap-3 bg-[rgba(30,20,10,0.5)] border border-[rgba(220,160,80,0.3)] px-6 py-4 rounded-xl active:bg-[rgba(50,35,15,0.8)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
            <span>💻</span> GitHub
          </a>
        </div>
        <p className="font-myfont text-xs mt-16 opacity-50 text-center">thanks for visiting.</p>
      </Section>
    </div>
  );
}

// Helper components

function Section({ id, children }: { id: string, children: React.ReactNode }) {
  return (
    <section id={id} className="h-[100dvh] w-full snap-start flex flex-col justify-center px-8 py-8 relative">
      <div className="max-w-md w-full mx-auto relative z-10">
        {children}
      </div>
    </section>
  );
}

function ProjectCard({ title, role, tag }: { title: string, role: string, tag: string }) {
  return (
    <div className="bg-[rgba(25,18,12,0.6)] border border-[rgba(180,130,60,0.2)] rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <h3 className="font-handwritten text-base mb-1 text-[rgba(255,235,190,0.95)]">{title}</h3>
      <p className="font-myfont text-xs opacity-90 mb-3">{role}</p>
      <p className="font-myfont text-[10px] italic opacity-60 text-right">{tag}</p>
    </div>
  );
}
