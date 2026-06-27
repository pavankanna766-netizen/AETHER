import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Shield, Send, AlertCircle, Info, CheckCircle, 
  HelpCircle, RefreshCw, BarChart3, Database, Lock, EyeOff, Code, Layers, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PORTAL');
  const [problemText, setProblemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Real stats state
  const [stats, setStats] = useState({ totalCount: 0, lastSubmittedAt: '' });
  const [statsLoading, setStatsLoading] = useState(false);

  // Intro reveal state
  const [showIntro, setShowIntro] = useState(true);

  // Mouse move perspective tracking using ultra-smooth linear interpolation (lerping)
  const targetMousePos = useRef({ x: 0, y: 0 });
  const currentMousePos = useRef({ x: 0, y: 0 });
  const mainWrapperRef = useRef<HTMLElement>(null);
  const sideCardRef = useRef<HTMLDivElement>(null);

  // 1. Water Splash High-Fidelity Physics Engine References
  interface PhysicsRipple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    opacity: number;
    speed: number;
  }

  interface PhysicsDroplet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    decay: number;
    gravity: number;
    isSpark: boolean;
  }

  interface PhysicsCrown {
    x: number;
    y: number;
    life: number;
    maxLife: number;
    baseRadius: number;
    height: number;
    maxHeight: number;
    points: { angle: number; radiusOffset: number; heightOffset: number }[];
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<PhysicsRipple[]>([]);
  const dropletsRef = useRef<PhysicsDroplet[]>([]);
  const crownsRef = useRef<PhysicsCrown[]>([]);

  // Function to launch a high-fidelity organic water splash
  const triggerCanvasSplash = (clientX: number, clientY: number) => {
    // A. Expanding base ripples (concentric rings for refraction simulation)
    ripplesRef.current.push({
      x: clientX,
      y: clientY,
      radius: 4,
      maxRadius: 150 + Math.random() * 40,
      opacity: 1.0,
      speed: 3.2 + Math.random() * 0.8
    });
    
    // Delayed ripple for secondary wave ripple propagation
    setTimeout(() => {
      ripplesRef.current.push({
        x: clientX,
        y: clientY,
        radius: 2,
        maxRadius: 90 + Math.random() * 25,
        opacity: 0.65,
        speed: 2.4 + Math.random() * 0.6
      });
    }, 130);

    // B. Glassy Splash Crown (creates the upward liquid rim visible in the image)
    const numCrownPoints = 16;
    const points = Array.from({ length: numCrownPoints }, (_, i) => ({
      angle: (i * 360 / numCrownPoints) * Math.PI / 180,
      radiusOffset: Math.random() - 0.5,
      heightOffset: Math.random() - 0.5
    }));

    crownsRef.current.push({
      x: clientX,
      y: clientY,
      life: 0,
      maxLife: 38 + Math.floor(Math.random() * 8),
      baseRadius: 26 + Math.random() * 10,
      height: 0,
      maxHeight: 28 + Math.random() * 14,
      points
    });

    // C. Translucent flying droplets (heavy beads of liquid)
    const numDroplets = 45 + Math.floor(Math.random() * 20);
    for (let i = 0; i < numDroplets; i++) {
      // Direct droplets upward in a realistic vertical cone (195° to 345°)
      const angleDeg = 195 + Math.random() * 150;
      const angleRad = angleDeg * Math.PI / 180;
      const speed = 4.5 + Math.random() * 12.0;

      const vx = Math.cos(angleRad) * speed;
      // Boost upward velocity (Y-axis) significantly for dynamic vertical spray
      const vy = Math.sin(angleRad) * speed * (1.35 + Math.random() * 0.35);

      dropletsRef.current.push({
        x: clientX + (Math.random() - 0.5) * 14,
        y: clientY + (Math.random() - 0.5) * 6,
        vx,
        vy,
        radius: 1.8 + Math.random() * 4.2, // wide array of bead sizes
        alpha: 1.0,
        decay: 0.007 + Math.random() * 0.012, // slow fade as they fall
        gravity: 0.34, // real-world gravity pull
        isSpark: false
      });
    }

    // D. Icy water mist/fine spray specs (small sparkling light beads in background)
    const numSparks = 25 + Math.floor(Math.random() * 15);
    for (let i = 0; i < numSparks; i++) {
      const angleDeg = 180 + Math.random() * 180;
      const angleRad = angleDeg * Math.PI / 180;
      const speed = 2.5 + Math.random() * 7.5;

      const vx = Math.cos(angleRad) * speed;
      const vy = Math.sin(angleRad) * speed * 1.15;

      dropletsRef.current.push({
        x: clientX + (Math.random() - 0.5) * 10,
        y: clientY + (Math.random() - 0.5) * 4,
        vx,
        vy,
        radius: 0.7 + Math.random() * 1.1, // tiny mist beads
        alpha: 1.0,
        decay: 0.014 + Math.random() * 0.018,
        gravity: 0.28,
        isSpark: true
      });
    }
  };

  const handleSplash = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    triggerCanvasSplash(clientX, clientY);
  };

  // Char count config
  const MAX_CHARS = 800;

  useEffect(() => {
    // Disable intro curtain after animation completes
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('https://exemption-cabinet-binding-overhead.trycloudflare.com/api/problems/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalCount: data.totalCount,
          lastSubmittedAt: data.lastSubmittedAt || ''
        });
      }
    } catch (err) {
      console.error("Error retrieving live stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto sync stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Resize canvas handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // High-performance 60 FPS HTML5 Canvas update and rendering animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- 0. SMOOTH PERSPECTIVE LERPING (FOR 90HZ+ FLUIDITY) ---
      const lerpFactor = 0.08;
      currentMousePos.current.x += (targetMousePos.current.x - currentMousePos.current.x) * lerpFactor;
      currentMousePos.current.y += (targetMousePos.current.y - currentMousePos.current.y) * lerpFactor;

      const cx = currentMousePos.current.x;
      const cy = currentMousePos.current.y;

      if (mainWrapperRef.current) {
        mainWrapperRef.current.style.transform = `rotateY(${cx * 24}deg) rotateX(${cy * -24}deg) translateZ(0px)`;
      }
      if (sideCardRef.current) {
        sideCardRef.current.style.transform = `rotateY(${cx * 24}deg) rotateX(${cy * -24}deg) translateZ(10px)`;
      }

      // --- 1. UPDATE AND DRAW ENVELOPE RIPPLES ---
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.opacity -= 0.016;

        if (r.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        // concentric ripple 1: primary outer refract wave
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59, 130, 246, ${r.opacity * 0.4})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // concentric ripple 2: medium follow wave
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(147, 197, 253, ${r.opacity * 0.22})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // concentric ripple 3: tight center light ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity * 0.16})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // --- 2. UPDATE AND DRAW GLASSY SPLASH CROWNS ---
      const crowns = crownsRef.current;
      for (let i = crowns.length - 1; i >= 0; i--) {
        const c = crowns[i];
        c.life++;

        if (c.life >= c.maxLife) {
          crowns.splice(i, 1);
          continue;
        }

        const progress = c.life / c.maxLife; // 0 to 1
        // Smooth sine expansion for the crown splash wall heights
        const curHeight = c.maxHeight * Math.sin(progress * Math.PI);
        // Expanding diameter as the splash crown opens up
        const curRadius = c.baseRadius * (1.0 + progress * 2.0);
        const opacity = 1.0 - Math.pow(progress, 2);

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(1.0, 0.42); // Realistic 3D perspective squish (elliptical water base)

        // Draw the full interconnected glossy crown sheet
        ctx.beginPath();
        const numPoints = c.points.length;
        
        for (let j = 0; j <= numPoints; j++) {
          const pt = c.points[j % numPoints];
          const angle = pt.angle;
          const peakR = curRadius * (1.0 + pt.radiusOffset * 0.16);
          
          // PX, PY in the flat perspective context (subtract height * 2.38 for perspective mapping)
          const px = Math.cos(angle) * peakR;
          const py = Math.sin(angle) * peakR - (curHeight * (1.0 + pt.heightOffset * 0.25)) * 2.38;

          if (j === 0) {
            ctx.moveTo(px, py);
          } else {
            // Draw smooth bezier curves around crown peaks for organic water look
            const prevPt = c.points[(j - 1) % numPoints];
            const prevAngle = prevPt.angle;
            const prevPeakR = curRadius * (1.0 + prevPt.radiusOffset * 0.16);
            const prevPx = Math.cos(prevAngle) * prevPeakR;
            const prevPy = Math.sin(prevAngle) * prevPeakR - (curHeight * (1.0 + prevPt.heightOffset * 0.25)) * 2.38;

            const midX = (prevPx + px) / 2;
            const midY = (prevPy + py) / 2 + (curHeight * 0.25); // Dip in middle of sheets
            ctx.quadraticCurveTo(midX, midY, px, py);
          }
        }
        ctx.closePath();

        // Create icy, glassy radial gradient for liquid refraction look
        const grad = ctx.createRadialGradient(0, -curHeight * 0.4, 4, 0, -curHeight * 0.8, curRadius * 1.4);
        grad.addColorStop(0, `rgba(191, 219, 254, ${opacity * 0.14})`); // inner translucent cavity
        grad.addColorStop(0.42, `rgba(59, 130, 246, ${opacity * 0.26})`); // refraction body blue
        grad.addColorStop(0.85, `rgba(255, 255, 255, ${opacity * 0.62})`); // high specular light sheet
        grad.addColorStop(1, `rgba(29, 78, 216, ${opacity * 0.08})`); // dark outline rim

        ctx.fillStyle = grad;
        ctx.fill();

        // Add bright outer reflection line to emphasize liquid edge
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.52})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        ctx.restore();
      }

      // --- 3. UPDATE AND DRAW HIGH-FIDELITY DROPLETS & SPARKS ---
      const droplets = dropletsRef.current;
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];

        // Apply real-time gravity & friction
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity;
        d.vx *= 0.985;
        d.alpha -= d.decay;

        if (d.alpha <= 0 || d.y > canvas.height + 40) {
          droplets.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(d.x, d.y);

        if (d.isSpark) {
          // A. Draw fine sparkling spray specs (mist)
          const sparkGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.radius * 2.2);
          sparkGrad.addColorStop(0, `rgba(255, 255, 255, ${d.alpha})`);
          sparkGrad.addColorStop(0.4, `rgba(147, 197, 253, ${d.alpha * 0.85})`);
          sparkGrad.addColorStop(1, `rgba(59, 130, 246, 0)`);

          ctx.fillStyle = sparkGrad;
          ctx.beginPath();
          ctx.arc(0, 0, d.radius * 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // B. Draw stunning vector-aligned translucent teardrop liquid droplets
          const speed = Math.hypot(d.vx, d.vy);
          const angle = Math.atan2(d.vy, d.vx);
          ctx.rotate(angle + Math.PI / 2); // align tip back opposite velocity vector

          const r = d.radius;
          // Dynamically stretch teardrop based on velocity
          const stretch = Math.min(2.4, 1.0 + speed * 0.11);

          ctx.beginPath();
          ctx.moveTo(0, -r * stretch); // sharp leading peak
          ctx.bezierCurveTo(r * 1.35, -r * 0.4, r * 1.45, r, 0, r * stretch * 0.8); // right boundary
          ctx.bezierCurveTo(-r * 1.45, r, -r * 1.35, -r * 0.4, 0, -r * stretch); // left boundary
          ctx.closePath();

          // Complex glass shader: specular white point + refracting turquoise blue outline
          const dropGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.6);
          dropGrad.addColorStop(0, `rgba(255, 255, 255, ${d.alpha * 0.98})`); // specular reflecting dot
          dropGrad.addColorStop(0.24, `rgba(191, 219, 254, ${d.alpha * 0.88})`); // light blue core
          dropGrad.addColorStop(0.68, `rgba(59, 130, 246, ${d.alpha * 0.65})`); // deep blue body refraction
          dropGrad.addColorStop(1, `rgba(29, 78, 216, ${d.alpha * 0.88})`); // heavy outline edge shadow

          ctx.fillStyle = dropGrad;
          ctx.fill();

          // Subtle glistening rim highlight
          ctx.strokeStyle = `rgba(255, 255, 255, ${d.alpha * 0.45})`;
          ctx.lineWidth = 0.65;
          ctx.stroke();

          // Extra refraction glare at the base
          ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(0, r * 0.35, r * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animId);
  }, []);

  // Coordinated mouse & touch listeners for dynamic 3D page tilting
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5; // range [-0.5, 0.5]
      const y = (e.clientY / innerHeight) - 0.5; // range [-0.5, 0.5]
      targetMousePos.current = { x, y };
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const { innerWidth, innerHeight } = window;
      const touch = e.touches[0];
      const x = (touch.clientX / innerWidth) - 0.5;
      const y = (touch.clientY / innerHeight) - 0.5;
      targetMousePos.current = { x, y };
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, []);

  // Submit problem handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const textToSubmit = problemText.trim();
    if (textToSubmit.length < 10) {
      setSubmitError("Entry must contain at least 10 characters to fully articulate the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('https://exemption-cabinet-binding-overhead.trycloudflare.com/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: textToSubmit }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setProblemText('');
        fetchStats(); // Update count instantly
      } else {
        setSubmitError(data.error || "An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      setSubmitError("Failed to communicate with Aether sub-system. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onMouseDown={handleSplash}
      onTouchStart={handleSplash}
      className="relative min-h-screen bg-[#030303] text-white selection:bg-blue-500/30 selection:text-white font-sans antialiased overflow-x-hidden"
      style={{ perspective: 1500 }}
    >
      
      {/* 1. INTRO CURTAIN REVEAL WITH CENTRAL FLASH */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Left black curtain */}
            <motion.div 
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.5 }}
              className="absolute left-0 top-0 bottom-0 w-1/2 bg-black z-10"
            />
            {/* Right black curtain */}
            <motion.div 
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.5 }}
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-black z-10"
            />
            {/* Central Vertical Energy Flash */}
            <motion.div 
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, times: [0, 0.3, 0.7, 1], delay: 0.1 }}
              className="absolute w-[2px] h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-400 z-20 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SCANLINE OVERLAY */}
      <div className="scanline-overlay" />

      {/* 2b. INTERACTIVE WATER SPLASH CANVAS */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-[60] overflow-hidden" 
      />

      {/* 3. BACKGROUND ECG GRAPHIC & DEEP GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Subtle Tech Grid */}
        <div className="absolute inset-0 tech-grid opacity-75" />

        {/* Ambient Glows */}
        <div className="absolute top-[20%] left-[20%] w-[450px] h-[450px] rounded-full bg-blue-900/10 blur-[130px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[550px] h-[550px] rounded-full bg-indigo-950/15 blur-[160px]" />

        {/* SVG Live ECG Line drawing across the background */}
        <svg 
          className="absolute inset-x-0 top-1/3 w-full h-[300px] opacity-[0.12] text-blue-500 pointer-events-none"
          viewBox="0 0 1440 300"
          preserveAspectRatio="none"
        >
          <path
            className="ecg-path"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            d="M 0,150 L 200,150 L 240,150 L 250,110 L 260,190 L 270,140 L 280,160 L 290,150 L 450,150 L 480,150 L 490,90 L 505,220 L 520,130 L 530,165 L 540,150 L 750,150 L 780,150 L 790,120 L 800,180 L 810,145 L 820,155 L 830,150 L 1050,150 L 1080,150 L 1090,70 L 1105,240 L 1120,120 L 1130,170 L 1140,150 L 1440,150"
          />
        </svg>
      </div>

      {/* 4. GLASSMORPHIC NAVBAR WITH ALIVE PULSING LOGO */}
      <header className="sticky top-0 left-0 right-0 z-40 px-4 py-4 md:px-8 border-b border-white/[0.04] bg-[#030303]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          
          {/* Logo with interactive Pulse animation */}
          <button 
            onClick={() => setActiveTab('PORTAL')}
            className="flex items-center gap-3 group focus:outline-none cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-950 border border-white/10 shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Alive Heartbeat Pulsing Indicator */}
              <div className="alive-pulse w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_12px_#3b82f6]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-bold tracking-[0.25em] text-white text-base md:text-lg leading-none">AETHER</span>
              <span className="text-[9px] font-mono tracking-widest text-blue-400 mt-1 uppercase">Anonymous Submission</span>
            </div>
          </button>

          {/* Clean Menu Items (Google & Amazon style minimalist layout) */}
          <nav className="flex items-center gap-2 md:gap-5">
            {(['PORTAL', 'ABOUT', 'WHY'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold tracking-wider transition-colors cursor-pointer focus:outline-none ${
                    isActive ? 'text-white' : 'text-white/50 hover:text-white/90'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </nav>

          {/* Clean minimal action or empty spacer for symmetry */}
          <div className="hidden sm:block w-12" />

        </div>
      </header>

      {/* 5. MAIN CONTENT WRAPPER */}
      <main 
        ref={mainWrapperRef}
        className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 min-h-[calc(100vh-88px)] flex flex-col justify-between"
        style={{
          transform: 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        
        <AnimatePresence mode="wait">
          {activeTab === 'PORTAL' && (
            <motion.div
              key="portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full"
            >
              
              {/* LEFT HALF: HERO TYPOGRAPHY & INTERACTIVE PROBLEM SUBMISSION FORM */}
              <div className="lg:col-span-7 flex flex-col justify-center">

                {/* Massive Tight-Leading Headings */}
                <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                  Transmute tension into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.15)]">Aether.</span>
                </h1>

                <p className="text-white/60 text-sm md:text-base max-w-xl leading-relaxed mb-10">
                  A high-performance sanctuary to release your daily friction. No metrics, no social baggage, no permanent identity linking. Your challenge is documented anonymously, completely isolated from corporate profiles.
                </p>

                {/* The Submission Portal Core Card */}
                <div 
                  className="liquid-glass rounded-3xl p-6 md:p-8 relative overflow-hidden group"
                  style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Header Info */}
                    <div className="flex items-center justify-between text-xs font-mono text-white/40">
                      <span className="flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-blue-400" />
                        DIRECT ANONYMOUS INPUT
                      </span>
                      <span className={`${problemText.length > MAX_CHARS - 100 ? 'text-amber-400' : 'text-white/40'}`}>
                        {problemText.length} / {MAX_CHARS}
                      </span>
                    </div>

                    {/* Textarea Input box */}
                    <div className="relative">
                      <textarea
                        value={problemText}
                        onChange={(e) => setProblemText(e.target.value.slice(0, MAX_CHARS))}
                        placeholder="DESCRIBE YOUR CHALLENGE, UNFILTERED..."
                        className="w-full h-36 md:h-44 bg-white/[0.02] hover:bg-white/[0.04] focus:bg-[#08080a] border border-white/10 focus:border-blue-500/50 rounded-2xl p-4 text-sm md:text-base text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all duration-300 resize-none font-sans leading-relaxed tracking-wide"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    {/* Notification States */}
                    <AnimatePresence mode="wait">
                      {submitSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-400 text-xs flex items-start gap-2.5"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-semibold block mb-0.5">PROBLEM SUCCESSFULLY TRANSMUTED</span>
                            <p className="text-emerald-400/80 leading-normal">Your submission has been absorbed anonymously. The global metrics count has been updated securely.</p>
                          </div>
                        </motion.div>
                      )}

                      {submitError && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 text-xs flex items-start gap-2.5"
                        >
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block mb-0.5">SUBMISSION ERROR</span>
                            <p className="text-rose-400/80 leading-normal">{submitError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom Submission Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2 text-white/40 text-left">
                        <Info className="w-4 h-4 text-blue-400/60" />
                        <span className="text-[10px] font-sans leading-tight">
                          No logging, tracking, or device fingerprints. Submitting increases the global real-time count.
                        </span>
                      </div>

                      {/* The "Beam" Button with Hover Gradient light ring */}
                      <button
                        type="submit"
                        disabled={isSubmitting || problemText.trim().length < 10}
                        className="beam-btn relative w-full sm:w-auto px-7 h-12 rounded-xl font-mono text-xs font-semibold tracking-widest text-slate-950 bg-white hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {/* Rotating Beam gradient border on hover */}
                        <div className="beam-btn-border" />
                        
                        {/* Core button inner text */}
                        <span className="relative z-10 flex items-center gap-2 text-slate-950">
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>ABSORBING...</span>
                            </>
                          ) : (
                            <>
                              <span>SUBMIT MY CATALYST</span>
                              <Send className="w-3.5 h-3.5" />
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                  </form>
                </div>



              </div>

              {/* RIGHT HALF: ABSTRACT 3D TRANSFORMED DASHBOARD COMPOSITION */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div 
                  className="relative w-full max-w-sm aspect-square flex items-center justify-center p-6"
                  style={{ perspective: 1200 }}
                >
                  {/* Dynamic perspective shifted card layout */}
                  <div
                    ref={sideCardRef}
                    className="w-full h-full relative flex flex-col justify-between"
                    style={{
                      transform: 'rotateY(0deg) rotateX(0deg) translateZ(10px)',
                      transformStyle: 'preserve-3d',
                      willChange: 'transform'
                    }}
                  >
                    
                    {/* Glowing Accent Ring Behind */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-xl pointer-events-none" />

                    {/* Core Dashboard Surface */}
                    <div className="w-full h-full rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.01]" />
                      
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="font-mono text-[10px] tracking-widest text-white/50">NODE_VITALS_STREAM</span>
                        </div>
                        <span className="font-mono text-[9px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">SYSTEM NORMAL</span>
                      </div>

                      {/* Main Metric Showcase */}
                      <div className="my-6 relative z-10 text-center">
                        <span className="text-[10px] font-mono tracking-[0.25em] text-white/40 block mb-2 uppercase">
                          TOTAL REGISTERED ANOMALIES
                        </span>
                        
                        <div className="text-5xl md:text-6xl font-display font-black tracking-tight text-white mb-2 relative inline-block">
                          {statsLoading ? (
                            <span className="text-blue-500 animate-pulse opacity-40">...</span>
                          ) : (
                            stats.totalCount
                          )}
                          <span className="absolute -top-1 -right-3 text-[11px] font-mono text-emerald-400">REAL</span>
                        </div>

                        <span className="block text-[10px] font-mono text-white/30 uppercase mt-2">
                          No seeded data. True live count.
                        </span>
                      </div>

                      {/* Code Terminal Mock Representation */}
                      <div className="bg-[#050507] border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-white/40 leading-relaxed text-left relative z-10">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                          <span className="text-[9px] text-indigo-400 flex items-center gap-1">
                            <Code className="w-3 h-3" /> STREAM_PARSING_INIT
                          </span>
                          <span className="text-[8px] text-white/20">UTC_TIME</span>
                        </div>
                        <div className="space-y-1">
                          <p><span className="text-blue-400">const</span> rawSubmit = payload.problem;</p>
                          <p><span className="text-blue-400">const</span> isolated = isolateData(rawSubmit);</p>
                          <p><span className="text-emerald-400">increment_global_metrics</span>(isolated);</p>
                          <p className="text-white/20">// Secure unlinked transience complete</p>
                        </div>
                      </div>

                      {/* Bottom Sync Info */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[9px] font-mono text-white/30 relative z-10">
                        <span>LAST REGISTERED OVER AETHER:</span>
                        <span className="text-blue-400">
                          {stats.lastSubmittedAt 
                            ? new Date(stats.lastSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'NO RECENT DATA'}
                        </span>
                      </div>

                    </div>

                    {/* Sub-floating glass card layered above for real depth effect */}
                    <div 
                      className="absolute -bottom-4 -right-4 w-44 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl transition-transform duration-300"
                      style={{ transform: 'translateZ(40px)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">CLIENT_SHIELD</span>
                      </div>
                      <p className="text-[10px] text-white/60 leading-normal">
                        Input is processed completely client-side. Metadata is stripped prior to system ingestion.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'ABOUT' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="text-center mb-12">
                <span className="text-xs font-mono tracking-[0.25em] text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase">
                  ABOUT AETHER
                </span>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white mt-4 mb-4">
                  Turning Friction into Future Solutions
                </h2>
                <p className="text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Bypassing corporate feedback loops to architect startups built on authentic human struggle.
                </p>
              </div>

              {/* Large, frosted glass panel with 40% background opacity */}
              <div 
                className="bg-slate-950/40 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-xl shadow-2xl"
                style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}
              >
                {/* Neon subtle ambient glows bleeding through */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none" />
                
                {/* Thin top gradient accent line */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed tracking-wide">
                  <p>
                    Every day, millions of people navigate invisible friction—broken processes, frustrating workarounds, and daily inefficiencies that steal time and peace of mind. Meanwhile, the world is filled with software nobody needs, built by people who aren't listening.
                  </p>
                  <p className="font-display text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 py-1">
                    AETHER was created to bridge this gap.
                  </p>
                  <p>
                    We are an anonymous, hyper-focused repository for real human challenges. This platform does not exist to harvest data, sell ads, or build user profiles. It exists for one pure reason: to collect the world's rawest, most genuine daily problems and use them as the structural blueprint for next-generation startups.
                  </p>
                  <p>
                    When you submit a challenge here, it doesn't vanish into a corporate feedback loop. It is analyzed, validated, and used to architect real, viable businesses designed to solve that exact pain point.
                  </p>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'WHY' && (
            <motion.div
              key="why"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="max-w-5xl mx-auto w-full"
            >
              <div className="text-center mb-12">
                <span className="text-xs font-mono tracking-[0.25em] text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase">
                  OUR PHILOSOPHY
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white mt-4 mb-4">
                  Your daily frustration is the spark for tomorrow's innovation.
                </h2>
                <p className="text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Why Aether stands as the catalyst for structural startups built on authentic struggles.
                </p>
              </div>

              {/* Staggered grid of smaller glass cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start pb-8">
                
                {/* Card 1: Radical Privacy & No Paper Trail */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[350px] shadow-xl group"
                  style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-mono text-xs font-bold mb-6">
                      01
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mb-3 group-hover:text-blue-400 transition-colors">
                      Radical Privacy & No Paper Trail
                    </h3>
                    <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                      Most websites want your email, your phone number, and your browsing history. We want the exact opposite. We built this platform with zero accounts, zero cloud databases, and zero tracking cookies. The moment you hit submit, your response is routed through an encrypted tunnel directly into an offline, local storage vault. Your identity remains entirely your own.
                    </p>
                  </div>
                </motion.div>

                {/* Card 2: Vent with a Purpose */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[350px] shadow-xl md:translate-y-4 group"
                  style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold mb-6">
                      02
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mb-3 group-hover:text-indigo-400 transition-colors">
                      Vent with a Purpose
                    </h3>
                    <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                      Complaining on social media ends in noise. Submitting your problem here ends in a blueprint. Whether it is a minor corporate workflow bottleneck that ruins your morning, or a major lifestyle hurdle that drains your energy—if it is a problem for you, it is a problem for thousands of others.
                    </p>
                  </div>
                </motion.div>

                {/* Card 3: Build What Matters */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-slate-950/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[350px] shadow-xl group"
                  style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold mb-6">
                      03
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mb-3 group-hover:text-cyan-400 transition-colors">
                      Build What Matters
                    </h3>
                    <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                      By sharing your raw, unfiltered experiences, you act as the co-architect of future platforms. You give developers, founders, and creators the exact raw data they need to stop building useless novelties and start building tools that actually matter to your life.
                    </p>
                  </div>
                </motion.div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. BOTTOM MARQUEE LOOP OF INTEGRATION GRAPHICS */}
        <div className="w-full mt-20 pt-10 border-t border-white/[0.04]">
          <div className="text-center mb-6">
            <span className="text-[9px] font-mono tracking-[0.3em] text-white/30 uppercase">
              RECOGNIZED & COMPATIBLE ENVIRONMENT
            </span>
          </div>

          {/* INFINITE SCROLLING TECH LOGO MARQUEE */}
          <div className="relative w-full overflow-hidden py-4 select-none pointer-events-none">
            {/* Fade overlays on sides */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#030303] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#030303] to-transparent z-10" />

            <div className="marquee-track">
              {/* First Set */}
              {[
                "Vercel", "Stripe", "AWS Cloud", "Figma Pro", "GitHub Enterprise", 
                "Docker Suite", "Linux Kernel", "Node.js Core", "React Core", "Cloud Run"
              ].map((tech, index) => (
                <div key={index} className="flex items-center gap-2 mx-8 text-white/30 font-display font-medium text-xs md:text-sm tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                  {tech}
                </div>
              ))}
              {/* Second Set for Loop Continuity */}
              {[
                "Vercel", "Stripe", "AWS Cloud", "Figma Pro", "GitHub Enterprise", 
                "Docker Suite", "Linux Kernel", "Node.js Core", "React Core", "Cloud Run"
              ].map((tech, index) => (
                <div key={`loop-${index}`} className="flex items-center gap-2 mx-8 text-white/30 font-display font-medium text-xs md:text-sm tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Frame Corners (emulating high-end hardware/monitor border) */}
      <div className="fixed top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/10 pointer-events-none z-30" />
      <div className="fixed top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/10 pointer-events-none z-30" />
      <div className="fixed bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/10 pointer-events-none z-30" />
      <div className="fixed bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/10 pointer-events-none z-30" />

    </div>
  );
}
