import React, { useState, useEffect } from 'react';
import { Heart, Activity, Zap, Sparkles } from 'lucide-react';

export default function LiveEcgWidget({ title = "شريط التخطيط السريري اللحظي (Live ECG)", color = "rose", bpm = 72, status = "إيقاع طبيعي ومستقر (Normal Sinus Rhythm)" }) {
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(p => (p + 1) % 1000);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const strokeColor = color === "rose" ? "#f43f5e" : "#06b6d4";
  const glowClass = color === "rose" ? "text-rose-400" : "text-cyan-400";
  const bgGlow = color === "rose" ? "from-rose-500/10 via-pink-500/5 to-transparent" : "from-cyan-500/10 via-blue-500/5 to-transparent";

  return (
    <div className={`p-4 rounded-2xl border border-white/10 bg-gradient-to-r ${bgGlow} backdrop-blur-xl relative overflow-hidden shadow-xl mb-6`}>
      {/* Background Medical Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', 
          backgroundSize: '16px 16px' 
        }} 
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Heart Rate & Info */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-lg">
            <Heart size={24} className={`${glowClass} animate-heartbeat`} fill="currentColor" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                {status}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white font-mono tracking-tight">{bpm}</span>
              <span className="text-xs text-slate-400 font-bold">BPM (نبضة/دقيقة)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Animated ECG Waveform */}
        <div className="w-full md:w-80 h-10 flex items-center relative">
          <svg className="w-full h-full" viewBox="0 0 300 40" preserveAspectRatio="none">
            {/* Background base wave */}
            <path
              d="M 0 20 L 40 20 L 50 10 L 60 30 L 70 20 L 90 20 L 100 5 L 110 35 L 120 18 L 130 20 L 170 20 L 180 10 L 190 30 L 200 20 L 220 20 L 230 5 L 240 35 L 250 18 L 260 20 L 300 20"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeOpacity="0.25"
            />
            {/* Active glowing sweep wave */}
            <path
              className="ecg-line"
              d="M 0 20 L 40 20 L 50 10 L 60 30 L 70 20 L 90 20 L 100 5 L 110 35 L 120 18 L 130 20 L 170 20 L 180 10 L 190 30 L 200 20 L 220 20 L 230 5 L 240 35 L 250 18 L 260 20 L 300 20"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
