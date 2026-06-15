"use client";

import { useState, useEffect } from "react";

export default function DecodeHandwriting() {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Toggle button — top-right, styled as a cave-themed icon */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 pointer-events-auto cursor-pointer"
        style={{
          top: "1.5%",
          right: "1.5%",
          padding: "8px 16px",
          background: "rgba(20, 14, 8, 0.7)",
          border: "1px solid rgba(180, 130, 60, 0.25)",
          borderRadius: "6px",
          backdropFilter: "blur(6px)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(40, 28, 12, 0.9)";
          e.currentTarget.style.borderColor = "rgba(217, 168, 80, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(20, 14, 8, 0.7)";
          e.currentTarget.style.borderColor = "rgba(180, 130, 60, 0.25)";
        }}
        aria-label="Decode my handwriting"
      >
        <span
          className="text-amber-200/70 text-[10px] tracking-widest uppercase"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          📜 Decode my handwriting
        </span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: visible
              ? "rgba(5, 3, 1, 0.85)"
              : "rgba(5, 3, 1, 0)",
            backdropFilter: visible ? "blur(8px)" : "blur(0px)",
            transition: "all 0.4s ease",
            cursor: "pointer",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="pointer-events-auto relative"
            style={{
              maxWidth: "720px",
              maxHeight: "85vh",
              width: "92%",
              overflowY: "auto",
              background: "linear-gradient(145deg, rgba(28, 20, 12, 0.97), rgba(18, 12, 6, 0.98))",
              border: "1px solid rgba(180, 130, 60, 0.2)",
              borderRadius: "12px",
              padding: "36px 40px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(200,160,80,0.08)",
              transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
              opacity: visible ? 1 : 0,
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              cursor: "auto",
              userSelect: "text",
              fontFamily: "Inter, system-ui, sans-serif",
              color: "rgba(230, 210, 175, 0.9)",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(180,130,60,0.3) transparent",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute cursor-pointer"
              style={{
                top: "16px",
                right: "20px",
                background: "none",
                border: "none",
                color: "rgba(200, 160, 80, 0.5)",
                fontSize: "20px",
                lineHeight: 1,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(230, 190, 100, 0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200, 160, 80, 0.5)")}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "rgba(217, 168, 80, 0.9)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              📜 Decoded Wall Text
            </h2>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(200, 160, 100, 0.5)",
                marginBottom: "28px",
                letterSpacing: "0.05em",
              }}
            >
              Everything etched on the cave wall — translated from my handwriting to a readable font.
            </p>

            {/* Sections */}
            <Section title="HERO">
              <H>Nikhil Nagendra.</H>
              <P>Building intelligent systems at the intersection of AI, finance & human resilience.</P>
              <I>somehow ended up doing all three</I>
              <I>explore with me →</I>
              <Spacer />
              <H>STATUS</H>
              <P>doing better. still building. still curious. still me. 😊</P>
              <Spacer />
              <Q>&ldquo;The cave you fear to enter holds the treasure you seek.&rdquo;</Q>
              <A>— Joseph Campbell</A>
            </Section>

            <Section title="01 ABOUT">
              <P>Computer science engineer. Backgrounds in medicine & finance. Building human-centered technology.</P>
              <Spacer />
              <P>🏔 Explorer — treks, nature, wandering</P>
              <P>⚙ Builder — systems, hackathons, ideas</P>
              <P>🎨 Creative — painting, origami, cooking</P>
              <P>👁 Thinker — philosophy, Vedanta, psych</P>
              <P>❤ Humanitarian — NGOs, healthcare empathy</P>
              <Spacer />
              <I>books &gt; people (most days)</I>
              <I>good food. better mood.</I>
              <I>ideas that escaped my head.</I>
              <I>a little bit of everything (in a good way).</I>
              <I>terrible handwriting since birth.</I>
              <I>still exploring.</I>
            </Section>

            <Section title="02 PROJECTS">
              <Project name="MEDI-XPRESS" desc="Full-stack ambulance dispatch with real-time GPS + Redis" note="built in 36hrs, slept 3" />
              <Project name="GAMEATHON" desc="Multiplayer game engine prototype, built under extreme pressure" note="3hr sleep. questionable decisions." />
              <Project name="TRADING BOT" desc="Binance Futures testnet bot — market, limit & stop-limit orders" note="paper profits. real lessons." />
              <Project name="FINDB" desc="High-throughput ledger DBMS for financial consolidation" note="CA trauma → useful at last." />
              <Project name="ACIS-X" desc="Real-time credit intelligence — multi-agent risk scoring on Kafka" note="signals in. decisions out. no sleep." />
              <Project name="RAG ENGINE" desc="Vector + graph retrieval — ChromaDB meets NetworkX" note="documents finally make sense." />
            </Section>

            <Section title="03 SKILLS & ACHIEVEMENTS">
              <I>tools. wins. proof of work.</I>
              <Spacer />
              <H>TOOLBOX</H>
              <Project name="Systems & Architecture" desc="Dist Systems, Event-Driven, Agent-Based" note="" />
              <Project name="Artificial Intelligence" desc="AI Agent Design, Prompt Eng, Gen AI Systems" note="" />
              <Project name="Backend & Data" desc="SQL DB Design, REST APIs, Auth Systems" note="" />
              <Project name="Security & Finance" desc="Threat Modeling, Cyber Fundamentals, Accounting & Finance Fundamentals" note="" />
              <Project name="Engineering Core" desc="Python, JS/TS, C, React/Next" note="" />
              <Spacer />
              <H>MILESTONES</H>
              <Project name="Gameathon — 3rd Place" desc="competitive game dev." note="" />
              <Project name="CTF — 6th / 36 Teams" desc="cybersec & problem solving." note="" />
              <Project name="Multiple Hackathons" desc="innovation & rapid prototyping." note="" />
              <Project name="Himalayan Treks (x5)" desc="reached 5200m. nature >> code." note="" />
              <Spacer />
              <I>skills are just proof that you showed up.</I>
            </Section>

            <Section title="04 JOURNEY">
              <I>not a resume. a real path.</I>
              <Spacer />
              <Waypoint label="MBBS" desc="2 years of medicine. empathy carved deep." />
              <Waypoint label="THE PLOT TWIST" desc="battles fought. ground eventually found." />
              <Waypoint label="CA" desc="foundation + inter G1. discipline as survival." />
              <Waypoint label="B.TECH CSE" desc="building now. a better direction." />
              <Spacer />
              <I>some paths are straight. mine had plot twists. still a meaningful one.</I>
            </Section>

            <Section title="05 PHILOSOPHY">
              <Q>&ldquo;We do not see things as they are. We see them as we are.&rdquo;</Q>
              <A>— Anaïs Nin</A>
              <Spacer />
              <Q>&ldquo;We must be willing to let go of the life we planned so as to have the life that is waiting for us.&rdquo;</Q>
              <A>— Joseph Campbell</A>
              <Spacer />
              <Q>&ldquo;In a day, when you don&apos;t come across any problems - you can be sure that you are travelling in a wrong path.&rdquo;</Q>
              <A>— Swami Vivekananda</A>
              <Spacer />
              <I>ideas kept me alive longer than certainty did.</I>
            </Section>

            <Section title="06 CONTACT" last>
              <P>if you&apos;ve made it this far, let&apos;s build something cool together.</P>
              <Spacer />
              <P>✉ nikhilnag98@gmail.com</P>
              <P>📞 +91 9986890905</P>
              <P>🔗 LinkedIn</P>
              <P>💻 GitHub — allalg</P>
              <Spacer />
              <I>looking forward to our next adventure. 😊</I>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : "28px", paddingBottom: last ? 0 : "24px", borderBottom: last ? "none" : "1px solid rgba(180,130,60,0.12)" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, color: "rgba(217, 168, 80, 0.75)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "16px", fontWeight: 700, color: "rgba(240, 220, 180, 0.95)", marginBottom: "4px" }}>{children}</p>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(220, 200, 170, 0.85)", marginBottom: "2px" }}>{children}</p>;
}

function I({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "12px", fontStyle: "italic", color: "rgba(200, 170, 120, 0.6)", marginBottom: "2px" }}>{children}</p>;
}

function Q({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "13px", fontStyle: "italic", color: "rgba(230, 210, 170, 0.8)", marginBottom: "2px" }}>{children}</p>;
}

function A({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "11px", color: "rgba(180, 150, 100, 0.5)", marginBottom: "8px" }}>{children}</p>;
}

function Spacer() {
  return <div style={{ height: "10px" }} />;
}

function Project({ name, desc, note }: { name: string; desc: string; note: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(240, 220, 180, 0.9)" }}>{name}</span>
      <span style={{ fontSize: "12px", color: "rgba(200, 180, 140, 0.7)", marginLeft: "8px" }}>— {desc}</span>
      <p style={{ fontSize: "11px", fontStyle: "italic", color: "rgba(180, 150, 100, 0.5)", marginTop: "1px" }}>{note}</p>
    </div>
  );
}

function Waypoint({ label, desc }: { label: string; desc: string }) {
  return (
    <div style={{ marginBottom: "8px", paddingLeft: "12px", borderLeft: "2px solid rgba(180,130,60,0.2)" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(240, 220, 180, 0.9)" }}>{label}</span>
      <span style={{ fontSize: "12px", color: "rgba(200, 180, 140, 0.7)", marginLeft: "8px" }}>— {desc}</span>
    </div>
  );
}
