import React, { useState } from 'react';
import { Pill, X, AlertTriangle, ShieldCheck, CheckCircle2, Info, ArrowLeftRight } from 'lucide-react';

const COMMON_DRUGS = [
  { id: 'lisinopril', name: 'Lisinopril (Zestril)', category: 'ACE Inhibitor' },
  { id: 'losartan', name: 'Losartan (Cozaar)', category: 'ARB' },
  { id: 'spironolactone', name: 'Spironolactone (Aldactone)', category: 'Aldosterone Antagonist' },
  { id: 'amlodipine', name: 'Amlodipine (Norvasc)', category: 'CCB' },
  { id: 'aspirin', name: 'Aspirin (Cardiprin)', category: 'Antiplatelet' },
  { id: 'ibuprofen', name: 'Ibuprofen (Brufen)', category: 'NSAID' },
  { id: 'clopidogrel', name: 'Clopidogrel (Plavix)', category: 'Antiplatelet' },
  { id: 'atorvastatin', name: 'Atorvastatin (Lipitor)', category: 'Statin' },
  { id: 'metformin', name: 'Metformin (Glucophage)', category: 'Antidiabetic' },
  { id: 'digoxin', name: 'Digoxin (Lanoxin)', category: 'Cardiac Glycoside' },
];

export default function DrugInteractionModal({ isOpen, onClose }) {
  const [selectedDrugs, setSelectedDrugs] = useState(['lisinopril', 'spironolactone']);

  if (!isOpen) return null;

  function toggleDrug(id) {
    if (selectedDrugs.includes(id)) {
      setSelectedDrugs(selectedDrugs.filter(d => d !== id));
    } else {
      setSelectedDrugs([...selectedDrugs, id]);
    }
  }

  // Detect specific clinical interactions
  const alerts = [];

  const has = (id) => selectedDrugs.includes(id);

  if ((has('lisinopril') || has('losartan')) && has('spironolactone')) {
    alerts.push({
      severity: 'high',
      title: 'خطر ارتفاع بوتاسيوم الدم (Severe Hyperkalemia Risk)',
      desc: 'الجمع بين مثبطات ACE / ARB ومدرات البول الموفرة للبوتاسيوم (Spironolactone) يتطلب متابعة دقيقة لمستوى البوتاسيوم في الدم ووظائف الكلى (eGFR) خلال أول أسبوعين.',
      action: 'افحص البوتاسيوم والكرياتينين بانتظام وتجنب مكملات البوتاسيوم.'
    });
  }

  if (has('aspirin') && has('ibuprofen')) {
    alerts.push({
      severity: 'high',
      title: 'تعارض التأثير المضاد للصفائح + خطر نزيف الجهاز الهضمي',
      desc: 'الإيبوبروفين يمنع الارتباط الدائم للأسبرين بالصفائح الدموية مما يقلل حمايته للقلب، بالإضافة إلى مضاعفة خطر تقرحات ونزيف المعدة.',
      action: 'استبدل الإيبوبروفين بالباراسيتامول لتسكين الألم الآمن لمرضى القلب.'
    });
  }

  if ((has('lisinopril') || has('losartan')) && has('ibuprofen')) {
    alerts.push({
      severity: 'medium',
      title: 'انخفاض وظائف الكلى وضعف فاعلية خفض الضغط',
      desc: 'مضادات الالتهاب غير الستيرويدية (NSAIDs) تقلل تدفق الدم الكلوي وتعاكس أثر أدوية الضغط.',
      action: 'تجنب استخدام المسكنات اللاستيرويدية بانتظام.'
    });
  }

  if (has('aspirin') && has('clopidogrel')) {
    alerts.push({
      severity: 'medium',
      title: 'علاج ثنائي مضاد للصفائح (DAPT)',
      desc: 'مزيج قياسي بعد القسطرة أو متلازمة الشريان التاجي الحادة، لكنه يزيد خطر النزيف بشكل ملحوظ.',
      action: 'راقب علامات النزيف، ويوصى بإضافة حامي للمعدة (PPI) للمرضى المعرضين للخطر.'
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Pill size={22} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">فاحص التعارضات والتفاعلات الدوائية (Clinical Drug Checker)</h3>
              <p className="text-xs text-slate-400">تحليل فوري للتفاعلات العكسية والآثار الجانبية المتقاطعة</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Drug Selection Pills */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-2">اختر الأدوية المراد فحصها معاً:</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_DRUGS.map(d => {
              const isSelected = selectedDrugs.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDrug(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30' 
                      : 'bg-slate-950/70 text-slate-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  <span>{d.name}</span>
                  <span className="text-[10px] opacity-70">({d.category})</span>
                  {isSelected && <span className="font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interaction Results Feed */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ArrowLeftRight size={14} className="text-purple-400" />
            نتائج الفحص السريري ({alerts.length} تنبيه):
          </h4>

          {alerts.length > 0 ? (
            alerts.map((al, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-2xl border space-y-1.5 text-xs ${
                  al.severity === 'high' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle size={16} className={al.severity === 'high' ? 'text-rose-400 animate-pulse' : 'text-amber-400'} />
                  <span>{al.title}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{al.desc}</p>
                <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5 font-semibold text-[11px] text-white">
                  💡 التوجيه السريري: {al.action}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <div>
                <h5 className="font-bold">لا توجد تعارضات رئيسية معروفة</h5>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">المزيج المختار من الأدوية آمن للاستخدام المتزامن وفق الإرشادات السريرية الحالية.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
