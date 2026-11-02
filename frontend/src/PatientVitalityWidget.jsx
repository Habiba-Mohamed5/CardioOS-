import React from 'react';
import { Sparkles, Trophy, Award, HeartHandshake, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function PatientVitalityWidget({ score = 92, name = "حبيبة", streak = 5 }) {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {/* 1. Vitality Score Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/15 via-slate-900/80 to-slate-900 border border-rose-500/30 backdrop-blur-xl relative overflow-hidden shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
            <Sparkles size={11} /> مؤشر حيوية القلب
          </div>
          <h3 className="text-xl font-black text-white">ممتاز ومستقر 💖</h3>
          <p className="text-[11px] text-slate-300">نسبة التزامك وانتظام قياساتك</p>
        </div>

        {/* Circular Progress Display */}
        <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
          <svg className="w-18 h-18 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-rose-500"
              strokeDasharray={`${score}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.8))' }}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-lg font-black text-white font-mono">{score}%</span>
          </div>
        </div>
      </div>

      {/* 2. Streak & Motivation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-slate-900 border border-amber-500/30 backdrop-blur-xl shadow-xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
          <Trophy size={28} className="animate-bounce" />
        </div>
        <div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
            التزام متواصل 🔥
          </span>
          <h4 className="text-lg font-bold text-white mt-1">{streak} أيام متتالية!</h4>
          <p className="text-[11px] text-slate-300">أنتِ على الطريق الصحيح لحماية عضلة قلبك.</p>
        </div>
      </div>

      {/* 3. Daily AI Heart Tip */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-slate-900/80 to-slate-900 border border-cyan-500/30 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center gap-1">
            <HeartHandshake size={12} /> نصيحة اليوم الذكية
          </span>
          <span className="text-[10px] text-slate-400 font-mono">CardioOS AI</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed mt-2 font-medium">
          "تقليل ملح الصوديوم بمقدار ملعقة صغيرة يومياً يوازي أثر دواء خافض للضغط! استبدلي الملح بالليمون والأعشاب الطبيعية 🌿"
        </p>
      </div>
    </div>
  );
}
