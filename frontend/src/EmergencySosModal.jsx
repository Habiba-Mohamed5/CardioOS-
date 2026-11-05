import React from 'react';
import { AlertOctagon, PhoneCall, X, HeartPulse, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function EmergencySosModal({ isOpen, onClose, onAlertDoctor }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-rose-500 rounded-3xl max-w-lg w-full p-4 sm:p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto shadow-rose-500/20 text-right" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              <AlertOctagon size={28} />
            </div>
            <div>
              <h3 className="font-black text-xl text-rose-400">طوارئ القلب السريعة (Cardio SOS)</h3>
              <p className="text-xs text-slate-300">اتصال فوري وإرشادات الإسعافات الأولية للقلب</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>

        {/* Primary Ambulance Call Button */}
        <a
          href="tel:123"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-rose-600/40 transition transform active:scale-95"
        >
          <PhoneCall size={24} className="animate-bounce" />
          <span>اتصال فوري بالإسعاف (123)</span>
        </a>

        {/* Crucial First Aid Steps */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <HeartPulse size={16} className="text-rose-400" />
            إرشادات حرجة فورية لحين وصول الإسعاف:
          </h4>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><b>التوقف والاسترخاء:</b> اجلس فوراً في وضع مريح (نصف جالس) ولا تبذل أي مجهود إضافي.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><b>مضغ الأسبرين:</b> امضغ قرص أسبرين أطفال (أو 300mg) فوراً إذا لم يكن لديك حساسية أو نزيف سابق.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><b>تهوية المكان:</b> فك الملابس الضيقة حول العنق والصدر وتأكد من دخول هواء نقي.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><b>تجنب القيادة:</b> لا تحاول قيادة السيارة بنفسك إلى المستشفى تحت أي ظرف.</span>
            </li>
          </ul>
        </div>

        {/* Secondary: Alert Doctor */}
        {onAlertDoctor && (
          <button
            onClick={() => {
              onAlertDoctor();
              alert("تم إرسال إشعار طارئ فوري لطبيبك المعالج ببياناتك وموقعك السريري!");
              onClose();
            }}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <ShieldAlert size={15} className="text-amber-400" />
            <span>إرسال تنبيه طارئ فوري لمركز قيادة الطبيب</span>
          </button>
        )}
      </div>
    </div>
  );
}
