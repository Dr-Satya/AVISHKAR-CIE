"use client";

/**
 * G D Goenka University - Inter-Disciplinary Project (IDP) Portal
 * Official Ceremonial Inauguration & Launch Experience
 * 
 * Aesthetic: Prestigious Academic Luxury (Midnight Obsidian & Imperial Gold)
 * - Zero AI-slop neon cyans, purples, or arcade beeps
 * - Pure orchestral soundtrack with cello/violin pads, timpani roll, and cathedral chimes
 * - Elegant golden stardust particle simulation and physical brass/enamel inauguration seal
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowRight,
  RotateCcw,
  Award,
  Crown,
  Compass,
} from "lucide-react";
import { launchAudio } from "@/lib/launch-audio";

type LaunchPhase = "IDLE" | "CHARGING" | "COUNTDOWN" | "SUPERNOVA";

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: "stardust" | "confetti" | "shockwave";
  rotation: number;
  rotationSpeed: number;
  radius?: number;
}

const SCHOOLS = [
  { code: "SOES", name: "Engineering & Sciences" },
  { code: "SOM", name: "School of Management" },
  { code: "SOL", name: "School of Law" },
  { code: "SOAS", name: "Agricultural Sciences" },
  { code: "SOHAS", name: "Healthcare & Allied" },
  { code: "SOLA", name: "School of Liberal Arts" },
  { code: "UID", name: "Institute of Design" },
  { code: "CAES", name: "Aerospace & Energy" },
  { code: "SOHT", name: "Hospitality & Tourism" },
  { code: "COE", name: "Fire & Safety Sciences" },
];

export default function LaunchPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<LaunchPhase>("IDLE");
  const [statusText, setStatusText] = useState<string>("CEREMONIAL PROTOCOL READY");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [connectedSchools, setConnectedSchools] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(6);
  const [goldFlash, setGoldFlash] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const speedRef = useRef<number>(0.8);
  const targetSpeedRef = useRef<number>(0.8);

  // Prestigious Champagne & Imperial Gold Palette
  const luxuryGolds = ["#d4af37", "#c59b27", "#f3e5ab", "#e6ca65", "#ffffff", "#faf0be", "#b3881e"];

  // Toggle Audio
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    launchAudio.setMuted(next);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Initialize Golden Celestial Starfield
  useEffect(() => {
    const stars: Star[] = [];
    const count = 350;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 1500,
        pz: 1500,
      });
    }
    starsRef.current = stars;
  }, []);

  // Spawn Golden Stardust Bursts
  const spawnGoldStardust = useCallback((x: number, y: number, count = 45) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3 + Math.random() * 8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2.5 + Math.random() * 4.5,
        color: luxuryGolds[Math.floor(Math.random() * luxuryGolds.length)],
        alpha: 1,
        decay: 0.012 + Math.random() * 0.014,
        type: "stardust",
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
      });
    }
  }, [luxuryGolds]);

  // Spawn Sovereign Gold Confetti Shower
  const spawnGoldConfetti = useCallback((count = 60) => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * w,
        y: -30 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 8,
        color: luxuryGolds[Math.floor(Math.random() * luxuryGolds.length)],
        alpha: 1,
        decay: 0.003 + Math.random() * 0.004,
        type: "confetti",
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.12,
      });
    }
  }, [luxuryGolds]);

  // Spawn Golden Resonance Wave
  const spawnResonanceWave = useCallback((x: number, y: number) => {
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 12,
      size: 4,
      color: "#d4af37",
      alpha: 1,
      decay: 0.018,
      type: "shockwave",
      rotation: 0,
      rotationSpeed: 0,
    });
  }, []);

  // Canvas Starfield & Particle Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    const render = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth acceleration
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.04;
      const curSpeed = speedRef.current;

      // 1. Golden Starfield
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.pz = star.z;
        star.z -= curSpeed;

        if (star.z <= 0) {
          star.z = 1500;
          star.pz = 1500;
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
        }

        const k = 400 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        const pk = 400 / star.pz;
        const prevPx = star.x * pk + cx;
        const prevPy = star.y * pk + cy;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          const shade = Math.min(1, Math.max(0.2, 1 - star.z / 1500));

          if (curSpeed > 6) {
            ctx.beginPath();
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(212, 175, 55, ${shade * 0.8})`;
            ctx.lineWidth = Math.max(1, (1 - star.z / 1500) * 2.5);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.7, (1 - star.z / 1500) * 2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(243, 229, 171, ${shade * 0.85})`;
            ctx.fill();
          }
        }
      }

      // 2. Golden Particles & Confetti
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        if (p.type === "shockwave") {
          p.radius = (p.radius || 12) + 12;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212, 175, 55, ${p.alpha * 0.7})`;
          ctx.lineWidth = Math.max(1, p.size * p.alpha);
          ctx.stroke();
          ctx.restore();
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.type === "stardust") {
          p.vy += 0.14;
          p.vx *= 0.985;
        } else if (p.type === "confetti") {
          p.vy += 0.045;
          p.vx += Math.sin(p.y * 0.02) * 0.05;
        }

        if (p.alpha <= 0 || p.y > canvas.height + 50) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.type === "confetti") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // INITIATE INAUGURAL CEREMONY (12s Orchestral Progression)
  const handleInitiateLaunch = () => {
    if (phase !== "IDLE") return;

    setPhase("CHARGING");
    targetSpeedRef.current = 18;

    // Start Authentic Orchestral Soundtrack
    launchAudio.playCeremonyTrack(() => {
      triggerSupernova();
    });

    // 10 Schools Sequential Connection
    for (let i = 1; i <= 10; i++) {
      setTimeout(() => {
        setConnectedSchools(i);
        setProgressPercent(Math.floor((i / 10) * 65));
      }, i * 550);
    }

    // Dignified Institutional Milestones
    setStatusText("COMMENCING INAUGURAL CEREMONIAL PROTOCOL");
    setTimeout(() => setStatusText("UNITING 10 ACADEMIC SCHOOLS & 1,416 RESEARCH SCHOLARS"), 1800);
    setTimeout(() => setStatusText("SYNCHRONIZING AVISHKAR CIE ACADEMIC REGISTRY"), 3600);
    setTimeout(() => setStatusText("VERIFYING MULTI-DISCIPLINARY COHORTS & MENTOR ACCESS"), 5000);

    // Countdown 3... 2... 1...
    setTimeout(() => {
      setPhase("COUNTDOWN");
      targetSpeedRef.current = 32;
      setCountdownVal(3);
      setStatusText("INAUGURATION MOMENT APPROACHING · III");
      if (typeof window !== "undefined") {
        spawnResonanceWave(window.innerWidth / 2, window.innerHeight / 2);
      }
    }, 6500);

    setTimeout(() => {
      setCountdownVal(2);
      setStatusText("INAUGURATION MOMENT APPROACHING · II");
      if (typeof window !== "undefined") {
        spawnResonanceWave(window.innerWidth / 2, window.innerHeight / 2);
      }
    }, 7500);

    setTimeout(() => {
      setCountdownVal(1);
      setStatusText("INAUGURATION MOMENT APPROACHING · I");
      if (typeof window !== "undefined") {
        spawnResonanceWave(window.innerWidth / 2, window.innerHeight / 2);
      }
    }, 8500);
  };

  // THE CLIMAX (At 9.5s)
  const triggerSupernova = () => {
    setGoldFlash(true);
    setTimeout(() => setGoldFlash(false), 250);

    setPhase("SUPERNOVA");
    targetSpeedRef.current = 1.0;
    setProgressPercent(100);
    setStatusText("PORTAL OFFICIALLY INAUGURATED FOR ACADEMIC SESSION 2026–2027");

    if (typeof window !== "undefined") {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      spawnResonanceWave(cx, cy);
      setTimeout(() => spawnResonanceWave(cx, cy), 350);

      spawnGoldStardust(cx, cy, 75);
      setTimeout(() => spawnGoldStardust(cx - 250, cy - 100, 50), 300);
      setTimeout(() => spawnGoldStardust(cx + 250, cy - 100, 50), 600);
      setTimeout(() => spawnGoldStardust(cx, cy - 150, 70), 900);

      spawnGoldConfetti(120);
      const confInterval = setInterval(() => {
        spawnGoldConfetti(35);
      }, 750);

      setTimeout(() => clearInterval(confInterval), 7500);
    }
  };

  // Redirect once completed
  useEffect(() => {
    if (phase !== "SUPERNOVA") return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, router]);

  // Reset to IDLE
  const handleReset = () => {
    launchAudio.stopAll();
    setPhase("IDLE");
    setStatusText("CEREMONIAL PROTOCOL READY");
    setProgressPercent(0);
    setCountdownVal(null);
    setConnectedSchools(0);
    setRedirectCountdown(6);
    targetSpeedRef.current = 0.8;
    particlesRef.current = [];
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#050c18] text-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Warm Golden Celestial Flash on Inauguration */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none bg-gradient-to-b from-[#f3e5ab] via-white to-[#d4af37] transition-opacity duration-500 ${
          goldFlash ? "opacity-90" : "opacity-0"
        }`}
      />

      {/* Deep Obsidian & Warm Gold Ambient Illumination */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[42rem] h-[42rem] bg-[#0a192f] rounded-full blur-[160px] opacity-80" />
        <div className="absolute -bottom-40 -right-40 w-[44rem] h-[44rem] bg-[#c59b27]/20 rounded-full blur-[160px] opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] bg-[#12243d]/40 rounded-full blur-[180px]" />
      </div>

      {/* Golden Celestial Starfield & Stardust Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none w-full h-full"
      />

      {/* TOP INSTITUTIONAL BAR */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex items-center justify-between gap-2 border-b border-[#c59b27]/20 bg-[#050c18]/60 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-xl border border-[#c59b27]/30 shadow-md shrink-0">
            <img src="/gdgu-logo.jpeg" alt="GDGU" className="h-6 sm:h-7 w-auto object-contain" />
            <div className="h-4 w-px bg-slate-300" />
            <img src="/avishkar-logo.png" alt="Avishkar CIE" className="h-5 sm:h-6 w-auto object-contain" />
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200/90 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]" />
            Official Launch Ceremony
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#c59b27]/30 text-xs font-medium text-amber-100 transition-all active:scale-95 shadow-sm"
            title={isMuted ? "Unmute Orchestral Music" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#c59b27]" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Music ON"}</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[#c59b27]/30 text-amber-100 transition-all active:scale-95 shadow-sm"
            title="Toggle Stage Fullscreen for Auditorium"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Direct Portal Access */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c59b27]/15 hover:bg-[#c59b27]/25 border border-[#c59b27]/40 text-xs font-semibold text-[#fcd34d] transition-all active:scale-95 shadow-sm"
          >
            <span>Skip to Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* CENTER STAGE */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-3 sm:px-6 text-center max-w-4xl mx-auto my-auto py-3 sm:py-6 w-full">

        {/* ======================================================== */}
        {/* PHASE 1 & 2: IDLE / CHARGING / COUNTDOWN                 */}
        {/* ======================================================== */}
        {phase !== "SUPERNOVA" && (
          <div className="flex flex-col items-center space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-7 animate-fade-in w-full">

            {/* Academic Session Crest Header */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c59b27]/10 border border-[#c59b27]/35 text-[#fcd34d] text-[10px] xs:text-xs sm:text-sm font-semibold tracking-wider shadow-md backdrop-blur-sm">
              <Crown className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>G D GOENKA UNIVERSITY · AVISHKAR CIE</span>
            </div>

            {/* Dignified University Title */}
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Inter-Disciplinary Project
                <span className="block mt-1 bg-gradient-to-r from-[#dfb743] via-[#f7e7a8] to-[#c59b27] bg-clip-text text-transparent font-extrabold">
                  (IDP) Portal 2026
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-300/90 max-w-2xl mx-auto font-normal leading-relaxed">
                Centralized academic innovation platform unifying 1,416 scholars, 194 faculty mentors, and 10 academic schools.
              </p>
            </div>

            {/* 10 SCHOOLS ORBITAL CONSTELLATION */}
            <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
              {SCHOOLS.map((school, idx) => {
                const isLit = connectedSchools > idx || phase === "COUNTDOWN";
                return (
                  <div
                    key={school.code}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg border text-[10px] sm:text-xs font-mono font-semibold transition-all duration-500 flex items-center gap-1.5 ${
                      isLit
                        ? "bg-[#c59b27]/20 border-[#c59b27] text-amber-200 shadow-md shadow-[#c59b27]/20 scale-105"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLit ? "bg-[#c59b27] animate-pulse" : "bg-slate-600"}`} />
                    <span>{school.code}</span>
                    <span className="hidden md:inline font-sans font-normal text-[10px] text-slate-300">({school.name})</span>
                  </div>
                );
              })}
            </div>

            {/* THE CEREMONIAL GOLDEN INAUGURATION BUTTON */}
            <div className="relative my-2 sm:my-3 flex items-center justify-center">
              {/* Outer Golden Aura Rings */}
              <div
                className={`absolute w-52 h-52 xs:w-60 xs:h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border border-[#c59b27]/30 pointer-events-none transition-all duration-1000 ${
                  phase === "CHARGING" || phase === "COUNTDOWN"
                    ? "scale-110 border-[#c59b27] animate-spin"
                    : "animate-pulse"
                }`}
                style={{ animationDuration: phase === "COUNTDOWN" ? "4s" : "24s" }}
              />

              <div
                className={`absolute w-44 h-44 xs:w-52 xs:h-52 sm:w-60 sm:h-60 md:w-68 md:h-68 rounded-full border border-[#c59b27]/20 pointer-events-none transition-all duration-700 ${
                  phase === "CHARGING" || phase === "COUNTDOWN" ? "scale-105 border-[#c59b27]/60" : ""
                }`}
              />

              {/* Warm Golden Glow */}
              <div
                className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
                  phase === "COUNTDOWN"
                    ? "bg-[#c59b27]/60 opacity-90 scale-125 animate-pulse"
                    : phase === "CHARGING"
                    ? "bg-[#c59b27]/40 opacity-70 scale-110"
                    : "bg-[#c59b27]/25 opacity-40 hover:opacity-70"
                }`}
              />

              {/* Button Core or Elegant Countdown */}
              {phase === "COUNTDOWN" ? (
                <div className="relative z-10 w-36 h-36 xs:w-44 xs:h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-[#0c1f38] via-[#071324] to-[#040a12] border-4 border-[#c59b27] flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-5xl xs:text-6xl sm:text-7xl font-serif font-black text-[#f3e5ab] drop-shadow-[0_0_25px_rgba(212,175,55,0.8)]">
                    {countdownVal}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-amber-200 font-semibold mt-1">
                    INAUGURATING...
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleInitiateLaunch}
                  disabled={phase === "CHARGING"}
                  className={`relative z-10 w-36 h-36 xs:w-44 xs:h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-300 transform shadow-2xl ${
                    phase === "CHARGING"
                      ? "bg-gradient-to-br from-[#122849] via-[#0a192f] to-[#050c18] border-4 border-[#c59b27] scale-95 ring-8 ring-[#c59b27]/30"
                      : "bg-gradient-to-br from-[#0e2444] via-[#09172c] to-[#050e1b] border-4 border-[#c59b27] hover:scale-105 active:scale-95 hover:border-[#dfb743] cursor-pointer group"
                  }`}
                  style={{
                    boxShadow:
                      phase === "CHARGING"
                        ? "0 0 60px rgba(197, 155, 39, 0.7), inset 0 0 30px rgba(197, 155, 39, 0.4)"
                        : "0 0 40px rgba(197, 155, 39, 0.3), inset 0 0 20px rgba(10, 25, 47, 0.8)",
                  }}
                >
                  {phase === "CHARGING" ? (
                    <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
                      <Compass className="w-9 h-9 sm:w-11 sm:h-11 text-[#dfb743] animate-spin" style={{ animationDuration: "3s" }} />
                      <span className="text-2xl sm:text-3xl font-serif font-bold tracking-wider text-[#f3e5ab]">
                        {progressPercent}%
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-amber-200/90 font-semibold">
                        SYNCHRONIZING
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
                      <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#c59b27] to-[#8d6912] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-[#fff5cb]" />
                      </div>
                      <span className="text-xs xs:text-sm sm:text-base font-extrabold tracking-wider text-white uppercase text-center leading-tight">
                        COMMENCE
                        <span className="block text-[#dfb743] font-black text-[11px] xs:text-xs sm:text-sm">
                          INAUGURATION
                        </span>
                      </span>
                      <span className="text-[8px] xs:text-[9px] uppercase tracking-widest text-slate-400 font-medium">
                        PRESS TO COMMENCE
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* CEREMONIAL PROGRESS READOUT */}
            <div className="w-full max-w-md bg-white/5 border border-[#c59b27]/25 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-xl space-y-2 sm:space-y-2.5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${phase === "CHARGING" ? "bg-amber-400 animate-pulse" : "bg-[#c59b27]"}`} />
                  PROTOCOL
                </span>
                <span className="text-amber-200 font-semibold tracking-wide truncate max-w-[260px] sm:max-w-[320px]">
                  {statusText}
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#b3881e] via-[#c59b27] to-[#f3e5ab] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-0.5">
                <span>{connectedSchools} / 10 SCHOOLS CONNECTED</span>
                <span>1,416 RESEARCH SCHOLARS</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: THE SUPERNOVA CLIMAX & GRAND UNVEILING          */}
        {/* ======================================================== */}
        {phase === "SUPERNOVA" && (
          <div className="flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-7 my-auto animate-scale-up w-full px-2">

            {/* University Crest Monument Reveal */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#c59b27] blur-3xl opacity-50 animate-pulse" />
              <div className="relative p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-[#0a192f] via-[#102444] to-[#0a192f] border-3 sm:border-4 border-[#c59b27] flex items-center gap-3 sm:gap-4 shadow-2xl">
                <div className="bg-white p-2 rounded-xl sm:rounded-2xl shadow-md">
                  <img src="/gdgu-logo.jpeg" alt="GDGU" className="h-9 xs:h-11 sm:h-14 md:h-16 w-auto object-contain" />
                </div>
                <div className="h-8 sm:h-10 w-px bg-white/20" />
                <div className="bg-white p-2 rounded-xl sm:rounded-2xl shadow-md">
                  <img src="/avishkar-logo.png" alt="Avishkar CIE" className="h-9 xs:h-11 sm:h-14 md:h-16 w-auto object-contain" />
                </div>
              </div>
            </div>

            {/* Formal Inauguration Proclamation */}
            <div className="space-y-2 sm:space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/45 text-[#fcd34d] text-[11px] xs:text-xs sm:text-sm font-bold uppercase tracking-widest shadow-md">
                <Award className="w-4 h-4 text-[#c59b27]" />
                <span>OFFICIALLY INAUGURATED &amp; DEPLOYED LIVE</span>
              </div>

              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-serif font-black text-white tracking-tight leading-tight">
                PORTAL IS NOW{" "}
                <span className="bg-gradient-to-r from-[#dfb743] via-[#f7e7a8] to-[#c59b27] bg-clip-text text-transparent">
                  LIVE
                </span>
              </h1>

              <p className="text-xs sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
                Welcome Scholars, Faculty Mentors, and Leadership of G D Goenka University. The 2026–2027 IDP academic portal is officially synchronized and active.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full max-w-md">
              <button
                onClick={() => router.push("/")}
                className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#c59b27] via-[#dfb743] to-[#c59b27] hover:from-[#dfb743] hover:to-[#c59b27] text-[#09131f] font-black text-sm sm:text-base shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ENTER OFFICIAL PORTAL</span>
                <span className="text-[11px] sm:text-xs bg-[#09131f]/20 text-[#09131f] px-2 py-0.5 rounded-full font-mono font-bold">
                  ({redirectCountdown}s)
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="w-full sm:w-auto py-3.5 sm:py-4 px-5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-[#c59b27]/30 text-amber-100 font-semibold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
                title="Re-run inaugural ceremony"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>Replay Ceremony</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-30 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-400 border-t border-[#c59b27]/20 bg-[#050c18]/60 backdrop-blur-md gap-1.5 text-center sm:text-left">
        <p>
          © 2026 G D Goenka University · Avishkar Centre for Innovation &amp; Entrepreneurship
        </p>
        <p className="flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]" />
          Academic Session 2026–2027 · 2,238 Scholars · 194 Faculty
        </p>
      </footer>
    </div>
  );
}
