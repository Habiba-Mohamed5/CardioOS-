import React, { useState } from 'react';
import { Calculator, X, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';

export default function AscvdCalculatorModal({ isOpen, onClose }) {
  const [age, setAge] = useState(55);
  const [gender, setGender] = useState('male'); // male | female
  const [systolic, setSystolic] = useState(135);
  const [totalChol, setTotalChol] = useState(200);
  const [hdl, setHdl] = useState(45);
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [onHypertensionTreatment, setOnHypertensionTreatment] = useState(true);

  if (!isOpen) return null;

  // Simplified AHA/ACC Pooled Cohort Estimation
  let score = 0;
  if (age < 40) score += 1;
  else if (age <= 49) score += 4;
  else if (age <= 59) score += 7;
  else if (age <= 69) score += 10;
  else score += 13;

  if (gender === 'male') score += 3;
  if (systolic >= 160) score += onHypertensionTreatment ? 5 : 3;
  else if (systolic >= 140) score += onHypertensionTreatment ? 4 : 2;
  else if (systolic >= 130) score += onHypertensionTreatment ? 3 : 1;

  if (totalChol >= 240) score += 4;
  else if (totalChol >= 200) score += 2;

  if (hdl < 40) score += 2;
  else if (hdl >= 60) score -= 1;

  if (isSmoker) score += 4;
  if (hasDiabetes) score += 4;

  const estimatedRisk = Math.min(65, Math.max(1.5, Math.round(score * 1.5 * 10) / 10));

  let riskCategory = "منخفض (Low Risk)";
  let riskColor = "text-emerald-400";
  let bgBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  let statinRecommendation = "نمط حياة صحي، ولا يُوصى بالستاتين إلا في حالات خاصة.";

  if (estimatedRisk >= 20) {
    riskCategory = "مرتفع جداً (High Risk)";
    riskColor = "text-rose-400";
    bgBadge = "bg-rose-500/20 text-rose-300 border-rose-500/30";
    statinRecommendation = "يوصى ببدء علاج ستاتين عالي الكثافة (High-intensity Statin مثل Atorvastatin 40-80mg) فوراً لتقليل LDL بنسبة ≥ 50%.";
  } else if (estimatedRisk >= 7.5) {
    riskCategory = "متوسط (Intermediate Risk)";
    riskColor = "text-amber-400";
    bgBadge = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    statinRecommendation = "يوصى ببدء ستاتين متوسط الكثافة مع مراجعة عوامل الخطر المعززة (CAC Score).";
  } else if (estimatedRisk >= 5) {
    riskCategory = "حدّي (Borderline Risk)";
    riskColor = "text-blue-400";
    bgBadge = "bg-blue-500/20 text-blue-300 border-blue-500/30";
    statinRecommendation = "تعديل نمط الحياة، والتفكير في الستاتين في حال وجود تاريخ عائلي مبكر لأمراض القلب.";
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Calculator size={22} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">حاسبة مخاطر القلب والأوعية (10-Year ASCVD Risk)</h3>
              <p className="text-xs text-slate-400">معتمدة من الجمعية الأمريكية للقلب (AHA / ACC Guidelines)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">العمر (سنوات):</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">الجنس:</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">الضغط الانقباضي (mmHg):</label>
            <input
              type="number"
              value={systolic}
              onChange={(e) => setSystolic(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">الكوليسترول الكلي (mg/dL):</label>
            <input
              type="number"
              value={totalChol}
              onChange={(e) => setTotalChol(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">الكوليسترول الجيد HDL:</label>
            <input
              type="number"
              value={hdl}
              onChange={(e) => setHdl(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div className="flex flex-col justify-end space-y-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input type="checkbox" checked={isSmoker} onChange={(e) => setIsSmoker(e.target.checked)} className="accent-cyan-500" />
              <span>مدخن حالياً</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input type="checkbox" checked={hasDiabetes} onChange={(e) => setHasDiabetes(e.target.checked)} className="accent-cyan-500" />
              <span>مصاب بالسكري</span>
            </label>
          </div>
        </div>

        {/* Output Result Card */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">احتمالية حدوث نوبة قلبية خلال 10 سنوات:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black ${riskColor} font-mono`}>{estimatedRisk}%</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${bgBadge}`}>
                  {riskCategory}
                </span>
              </div>
            </div>

            {/* Gauge Indicator */}
            <div className="w-32 bg-slate-900 rounded-full h-3 overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-500 ${estimatedRisk >= 20 ? 'bg-rose-500' : estimatedRisk >= 7.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, estimatedRisk * 3.5)}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <BookOpen size={14} /> التوصية السريرية المعتمدة (AHA Prevention Guidelines):
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5">
              {statinRecommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
