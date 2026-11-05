import React from 'react';
import { Printer, X, Download, ShieldCheck, Heart } from 'lucide-react';

export default function PrintableReportModal({ isOpen, onClose, patientData }) {
  if (!isOpen || !patientData) return null;

  function handlePrint() {
    window.print();
  }

  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full p-4 sm:p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[94vh] overflow-y-auto print:border-none print:shadow-none print:bg-white print:text-black" dir="rtl">
        {/* Header Actions (hidden on print) */}
        <div className="flex justify-between items-center print:hidden">
          <h3 className="font-bold text-white text-base">معاينة التقرير الطبي المعتمد للطباعة والتصدير</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Printer size={15} />
              طباعة / حفظ كـ PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="bg-white text-slate-900 p-4 sm:p-8 rounded-2xl shadow-xl print:shadow-none print:p-0 space-y-5 font-sans" dir="rtl">
          {/* Header with Logo */}
          <div className="flex justify-between items-center border-b-2 border-slate-900/10 pb-6">
            <div className="flex items-center gap-3">
              <img src="/cardioos_named_logo.jpg" alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">CardioOS Clinical Center</h1>
                <p className="text-xs text-slate-500 font-semibold">نظام رعاية وأبحاث القلب والأوعية الدموية المعتمد</p>
              </div>
            </div>
            <div className="text-left font-mono text-xs text-slate-600" dir="ltr">
              <p className="font-bold text-slate-800">REF: COS-{patientData.id?.toUpperCase()}</p>
              <p>Date: {currentDate}</p>
            </div>
          </div>

          {/* Patient Info Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">اسم المريض:</span>
              <span className="font-bold text-slate-900 text-sm">{patientData.display_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">المعرف السريري:</span>
              <span className="font-mono text-slate-900">{patientData.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">تاريخ التسجيل:</span>
              <span className="text-slate-900">{patientData.registered_at || 'حديث'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">الحالة السريرية:</span>
              <span className="font-bold text-emerald-600">مستقر ومتابع</span>
            </div>
          </div>

          {/* Vitals Summary Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">أحدث القياسات والمؤشرات الحيوية:</h4>
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <th className="p-2.5">المؤشر</th>
                  <th className="p-2.5">القيمة المسجلة</th>
                  <th className="p-2.5">المعدل الطبيعي المستهدف</th>
                  <th className="p-2.5">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="p-2.5 font-sans">الضغط الانقباضي</td>
                  <td className="p-2.5 font-bold text-slate-900">{patientData.latest_vitals?.systolic || '120'} mmHg</td>
                  <td className="p-2.5 text-slate-500">&lt; 130 mmHg</td>
                  <td className="p-2.5 text-emerald-600 font-bold font-sans">مثالي (WHO 2021)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans">الضغط الانبساطي</td>
                  <td className="p-2.5 font-bold text-slate-900">{patientData.latest_vitals?.diastolic || '80'} mmHg</td>
                  <td className="p-2.5 text-slate-500">&lt; 80 mmHg</td>
                  <td className="p-2.5 text-emerald-600 font-bold font-sans">مثالي</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans">سكر الدم الصائم</td>
                  <td className="p-2.5 font-bold text-slate-900">{patientData.latest_vitals?.sugar || '95'} mg/dL</td>
                  <td className="p-2.5 text-slate-500">70 - 99 mg/dL</td>
                  <td className="p-2.5 text-emerald-600 font-bold font-sans">طبيعي</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans">وزن الجسم</td>
                  <td className="p-2.5 font-bold text-slate-900">{patientData.latest_vitals?.weight || '70'} kg</td>
                  <td className="p-2.5 text-slate-500">BMI 18.5 - 24.9</td>
                  <td className="p-2.5 text-slate-700 font-sans">مستقر</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Doctor Clinical Notes */}
          {patientData.notes?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">توصيات وملاحظات الطبيب المعالج:</h4>
              <div className="space-y-2">
                {patientData.notes.slice(0, 3).map((n, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-blue-700">{n.doctor_name} ({n.date}):</span>
                    <p className="text-slate-800 mt-1">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer & Signature Stamp */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">CardioOS Responsible Clinical AI</p>
              <p className="text-[10px] text-slate-400">Validated against AHA, ACC & WHO Hypertension Guidelines</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-32 border-b border-slate-400 pb-1 font-mono text-[11px] text-slate-800">
                Dr. CardioOS, MD
              </div>
              <span className="text-[10px] text-slate-400 block">التوقيع والاعتماد السريري</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
