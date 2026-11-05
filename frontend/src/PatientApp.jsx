import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Activity, Camera, MessageSquare, FileText, 
  Send, Upload, CheckCircle2, AlertCircle, Clock, 
  ChevronLeft, Sparkles, RefreshCw, User, ShieldAlert,
  BarChart2, BookOpen, AlertOctagon, Download, CheckSquare, ChevronDown,
  PhoneCall, Calculator, Printer, Mic
} from 'lucide-react';
import { apiRequest, API_BASE_URL } from './apiConfig';
import LiveEcgWidget from './LiveEcgWidget';
import PatientVitalityWidget from './PatientVitalityWidget';
import VoiceInputButton from './VoiceInputButton';
import EmergencySosModal from './EmergencySosModal';
import AscvdCalculatorModal from './AscvdCalculatorModal';
import PrintableReportModal from './PrintableReportModal';
import ThemeToggle from './ThemeToggle';

export default function PatientApp() {
  const [activeTab, setActiveTab] = useState('profile'); // profile | journal | alerts | report | consult | chat | guidelines | bench
  
  // Interactive Modals State
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isAscvdOpen, setIsAscvdOpen] = useState(false);
  const [isPrintableOpen, setIsPrintableOpen] = useState(false);
  
  // Patient Profile & Login
  const [patientId, setPatientId] = useState('حبيبة_محمد');
  const [patientData, setPatientData] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Tab 2: Journal & Vitals Form
  const [vitals, setVitals] = useState({ systolic: '', diastolic: '', sugar: '', weight: '' });
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [journalMessage, setJournalMessage] = useState('');
  const [journalFile, setJournalFile] = useState(null);
  const [journalPreviewUrl, setJournalPreviewUrl] = useState(null);
  const [journalVisionResult, setJournalVisionResult] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [journalSuccess, setJournalSuccess] = useState(false);

  // Tab 4: Doctor Report Generator
  const [generatedReportText, setGeneratedReportText] = useState('');

  // Tab 5: Send Consultation to Doctor
  const [consultKind, setConsultKind] = useState('consultation_routine'); // consultation_urgent | consultation_routine
  const [consultMessage, setConsultMessage] = useState('');
  const [isSendingConsult, setIsSendingConsult] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Tab 6: General Chat
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'أهلاً بك! أنا رفيقك الصحي في CardioOS. كيف تشعر اليوم؟ اسألني عن أدويتك أو أعراضك، أو أرسل لي صورة لوجبتك أو تحاليلك.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Tab 7: Patient Guideline Consultation
  const [guidelineQuery, setGuidelineQuery] = useState('');
  const [guidelineResult, setGuidelineResult] = useState(null);
  const [isSearchingGuidelines, setIsSearchingGuidelines] = useState(false);

  // Tab 8: Population Benchmarking
  const [benchmarks, setBenchmarks] = useState(null);

  const ALL_CONDITIONS = [
    'ارتفاع ضغط الدم (Hypertension)',
    'أمراض القلب التاجية (Heart Disease)',
    'قصور عضلة القلب (Heart Failure)',
    'مرض السكري (Diabetes)',
    'قصور الكلى المزمن (Kidney Disease)',
    'ارتفاع الكوليسترول (High Cholesterol)'
  ];

  const SYMPTOMS_LIST = [
    'ألم أو ثقل في الصدر',
    'ضيق في التنفس',
    'دوخة أو إغماء',
    'خفقان سريع في القلب',
    'تورم في القدمين أو الكاحلين',
    'إرهاق شديد غير معتاد'
  ];

  useEffect(() => {
    loadPatientData(patientId);
  }, [patientId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function loadPatientData(pid) {
    if (!pid.trim()) return;
    try {
      const data = await apiRequest(`/api/patients/${pid}`);
      setPatientData(data);
      if (data.profile) {
        setConditions(data.profile.conditions || []);
        setMedicalNotes(data.profile.notes || '');
      }
      // Load benchmarks
      const bData = await apiRequest(`/api/benchmarking/${pid}`);
      setBenchmarks(bData.benchmarks);
    } catch (err) {
      console.error('Failed to load patient data', err);
    }
  }

  // Save Medical Profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await apiRequest(`/api/patient/profile/${patientId}`, {
        method: 'POST',
        body: JSON.stringify({ conditions, notes: medicalNotes })
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      alert('فشل في حفظ الملف الطبي: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Toggle symptom checkbox
  function toggleSymptom(sym) {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  }

  // Submit Journal Entry
  async function handleJournalSubmit(e) {
    e.preventDefault();
    setIsSubmittingJournal(true);
    setJournalSuccess(false);

    const isEmergency = (parseFloat(vitals.systolic) >= 180) || (parseFloat(vitals.diastolic) >= 120) || selectedSymptoms.includes('ألم أو ثقل في الصدر');

    try {
      const parsedVitals = {};
      if (vitals.systolic) parsedVitals.systolic = parseFloat(vitals.systolic);
      if (vitals.diastolic) parsedVitals.diastolic = parseFloat(vitals.diastolic);
      if (vitals.sugar) parsedVitals.sugar = parseFloat(vitals.sugar);
      if (vitals.weight) parsedVitals.weight = parseFloat(vitals.weight);

      await apiRequest(`/api/patients/${patientId}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'daily',
          message: journalMessage.trim() || undefined,
          vitals: Object.keys(parsedVitals).length > 0 ? parsedVitals : undefined,
          symptoms: selectedSymptoms,
          is_emergency: isEmergency
        })
      });

      setJournalSuccess(true);
      setVitals({ systolic: '', diastolic: '', sugar: '', weight: '' });
      setSelectedSymptoms([]);
      setJournalMessage('');
      setJournalFile(null);
      setJournalPreviewUrl(null);
      setJournalVisionResult(null);
      loadPatientData(patientId);
      setTimeout(() => setJournalSuccess(false), 4000);
    } catch (err) {
      alert('فشل في حفظ القياسات: ' + err.message);
    } finally {
      setIsSubmittingJournal(false);
    }
  }

  // Analyze Image with AI Vision
  async function handleAnalyzeJournalImage() {
    if (!journalFile) return;
    setIsAnalyzingImage(true);
    const formData = new FormData();
    formData.append('file', journalFile);
    if (journalMessage.trim()) formData.append('note', journalMessage.trim());
    formData.append('patient_id', patientId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/analyze-image`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('فشل التحليل البصري');
      const data = await res.json();
      setJournalVisionResult(data.analysis);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAnalyzingImage(false);
    }
  }

  // Generate Doctor Report (Tab 4)
  function handleGenerateDoctorReport() {
    let rep = `=== تقرير CardioOS الطبي الشامل للمريض ===\n`;
    rep += `اسم المريض: ${patientData?.display_name || patientId}\n`;
    rep += `تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}\n`;
    rep += `الأمراض المزمنة: ${conditions.length > 0 ? conditions.join(', ') : 'لا يوجد'}\n`;
    rep += `الأدوية والملاحظات: ${medicalNotes || 'لا يوجد'}\n\n`;
    rep += `--- آخر القياسات الحيوية ---\n`;
    if (patientData?.latest_vitals) {
      rep += `• الضغط: ${patientData.latest_vitals.systolic || '—'}/${patientData.latest_vitals.diastolic || '—'} mmHg\n`;
      rep += `• سكر الدم: ${patientData.latest_vitals.sugar || '—'} mg/dL\n`;
      rep += `• الوزن: ${patientData.latest_vitals.weight || '—'} kg\n\n`;
    }

    rep += `--- سجل اليوميات والشكاوى السابقة ---\n`;
    patientData?.reports?.slice(0, 10).forEach((r, idx) => {
      rep += `[${idx + 1}] (${r.date}) نوع: ${r.kind} | الحالة: ${r.status}\n`;
      if (r.message) rep += `  الملاحظة: ${r.message}\n`;
      if (r.latest_vitals) rep += `  القياسات: ${JSON.stringify(r.latest_vitals)}\n`;
    });

    setGeneratedReportText(rep);
  }

  // Send Consultation Request (Tab 5)
  async function handleSendConsultation(e) {
    e.preventDefault();
    if (!consultMessage.trim()) return;
    setIsSendingConsult(true);
    setConsultSuccess(false);

    try {
      await apiRequest(`/api/patients/${patientId}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          kind: consultKind,
          message: consultMessage.trim(),
          vitals: patientData?.latest_vitals || undefined
        })
      });
      setConsultSuccess(true);
      setConsultMessage('');
      loadPatientData(patientId);
      setTimeout(() => setConsultSuccess(false), 4000);
    } catch (err) {
      alert('فشل في إرسال الاستشارة: ' + err.message);
    } finally {
      setIsSendingConsult(false);
    }
  }

  // Send Chat Message (Tab 6)
  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsChatSending(true);

    try {
      const data = await apiRequest('/api/patient/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg, patient_id: patientId })
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'حدث خطأ في الاتصال بالخادم.' }]);
    } finally {
      setIsChatSending(false);
    }
  }

  // Search Guidelines RAG (Tab 7)
  async function handleSearchGuidelines(e) {
    e.preventDefault();
    if (!guidelineQuery.trim()) return;
    setIsSearchingGuidelines(true);
    setGuidelineResult(null);

    try {
      const data = await apiRequest('/api/patient/guideline-consultation', {
        method: 'POST',
        body: JSON.stringify({ query: guidelineQuery.trim(), patient_id: patientId })
      });
      setGuidelineResult(data);
    } catch (err) {
      alert('فشل في استرجاع الإرشادات الطبية: ' + err.message);
    } finally {
      setIsSearchingGuidelines(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-rose-500/30" dir="rtl">
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-slate-900/95 border-b border-white/10 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/cardioos_named_logo.jpg" alt="CardioOS" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover ring-1 ring-rose-500/50 shrink-0" />
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-1 sm:gap-2">
              Cardio<span className="text-rose-400">OS</span>
            </h1>
            <span className="hidden md:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">بوابة المريض الشاملة</span>
          </div>
        </div>

        {/* Action Buttons (100% visible on both mobile and desktop) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* ASCVD Risk Tool */}
          <button
            type="button"
            onClick={() => setIsAscvdOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition shadow-sm"
            title="حاسبة مخاطر القلب (ASCVD)"
          >
            <Calculator size={14} className="shrink-0" />
            <span className="hidden sm:inline">حاسبة ASCVD</span>
          </button>

          {/* Printable Report Tool */}
          <button
            type="button"
            onClick={() => setIsPrintableOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/15 transition shadow-sm"
            title="طباعة التقرير الطبي PDF"
          >
            <Printer size={14} className="shrink-0" />
            <span className="hidden sm:inline">تقرير PDF</span>
          </button>

          {/* Quick SOS Trigger in Header */}
          <button
            type="button"
            onClick={() => setIsSosOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold transition shadow-sm"
            title="طوارئ واستغاثة القلب SOS"
          >
            <PhoneCall size={14} className="shrink-0 text-rose-400" />
            <span className="text-[11px] font-black">SOS</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Patient Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs">
            <User size={13} className="text-rose-400" />
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-white w-20 focus:outline-none"
              title="اسم المريض"
            />
          </div>

          <a href="/" className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition">
            الرئيسية
          </a>
        </div>
      </header>

      {/* Dedicated Scrollable Tabs Navigation Bar (Sticky, Touch-Friendly, Uncrowded) */}
      <nav className="sticky top-14 sm:top-16 z-30 bg-slate-950/95 border-b border-white/10 backdrop-blur-md px-2 sm:px-6 py-2 overflow-x-auto no-scrollbar smooth-scroll-x">
        <div className="flex items-center gap-1.5 sm:gap-2 max-w-5xl mx-auto">
          {[
            { id: 'profile', label: 'الملف الطبي', icon: FileText },
            { id: 'journal', label: 'اليوميات (نص/صورة)', icon: Activity },
            { id: 'alerts', label: 'المؤشرات والتنبيهات', icon: AlertOctagon },
            { id: 'report', label: 'تقرير للطبيب', icon: Download },
            { id: 'consult', label: 'إرسال للدكتور', icon: Send },
            { id: 'chat', label: 'المساعد الذكي', icon: MessageSquare },
            { id: 'guidelines', label: 'استشارة موثقة', icon: BookOpen },
            { id: 'bench', label: 'مقارنة بالمعدل', icon: BarChart2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 ring-1 ring-white/20' 
                    : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 py-4 sm:p-6 relative">
        {/* Mobile Quick Actions Ribbon (Prominent, large, tap-friendly on phones) */}
        <div className="grid grid-cols-3 gap-2 mb-4 sm:hidden">
          <button
            type="button"
            onClick={() => setIsSosOpen(true)}
            className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white text-center shadow-lg shadow-rose-600/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition"
          >
            <PhoneCall size={18} className="animate-bounce" />
            <span className="text-[11px] font-black">طوارئ SOS (123)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAscvdOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-center flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
          >
            <Calculator size={18} className="text-cyan-400" />
            <span className="text-[11px] font-bold">حاسبة ASCVD</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintableOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900 border border-white/15 text-slate-200 text-center flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-sm"
          >
            <Printer size={18} className="text-slate-300" />
            <span className="text-[11px] font-bold">تقرير سريري PDF</span>
          </button>
        </div>

        {/* Hero Header Banner with Patient Avatar & Integrated Animated Pulse */}
        <div className="relative rounded-3xl overflow-hidden p-4 sm:p-6 md:p-8 mb-6 border border-white/10 shadow-2xl bg-gradient-to-l from-slate-900 via-rose-950/70 to-slate-900 text-right z-10">
          {/* Animated Heart GIF cleanly embedded inside the header background */}
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none overflow-hidden">
            <img src="/hero-bg.gif" alt="Pulsing Heart" className="w-full h-full object-cover scale-110" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <img 
                  src="/patient_icon.jpg" 
                  alt="Patient Avatar" 
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-2 ring-rose-500/50 shadow-xl shadow-rose-500/20" 
                />
                <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" title="Active" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  بوابة رعاية ومتابعة المريض الذكية
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                  مرحباً بك، {patientData?.display_name || patientId} 👋
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  متابعة يومية دقيقة لصحة قلبك، تسجيل القياسات، وتحليل الوجبات بالذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto shrink-0">
              <div className="bg-slate-950/80 border border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block mb-0.5">آخر قياس مسجل</span>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  {patientData?.latest_vitals?.systolic ? `${patientData.latest_vitals.systolic}/${patientData.latest_vitals.diastolic} mmHg` : 'لا توجد قراءات'}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block mb-0.5">التقارير المسجلة</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {patientData?.reports?.length || 0} تقرير
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Medical Telemetry & Vitality Ring */}
        <LiveEcgWidget color="rose" bpm={74} status="إيقاع طبيعي ومستقر (Normal Sinus Rhythm)" />
        <PatientVitalityWidget score={94} name={patientData?.display_name || patientId} streak={7} />

        {/* ========================================================================= */}
        {/* TAB 1: MEDICAL PROFILE */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">الملف الطبي والأمراض المزمنة</h2>
              <p className="text-xs text-slate-400">سجل حالتك الصحية وأمراضك المزمنة والأدوية التي تتناولها بانتظام لتكون مرجعاً لطبيبك والذكاء الاصطناعي.</p>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                تم حفظ وتحديث الملف الطبي بنجاح!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-white block mb-3">الأمراض المزمنة المسجلة:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_CONDITIONS.map((cond) => {
                    const isChecked = conditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => {
                          if (isChecked) setConditions(conditions.filter(c => c !== cond));
                          else setConditions([...conditions, cond]);
                        }}
                        className={`p-3 rounded-xl border text-right text-xs font-medium flex items-center justify-between transition ${
                          isChecked 
                            ? 'bg-rose-500/15 border-rose-500/40 text-white' 
                            : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/15'
                        }`}
                      >
                        <span>{cond}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-600'}`}>
                          {isChecked && '✓'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-2">الأدوية اليومية أو الحساسيات أو ملاحظات خاصة:</label>
                <textarea
                  rows={4}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="مثال: أتناول أسبرين 81mg يومياً، ولدي حساسية من أدوية البنسلين..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isSavingProfile ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>حفظ وتحديث الملف الطبي</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DAILY JOURNAL (TEXT & PHOTO) */}
        {/* ========================================================================= */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">تسجيل اليوميات الصحية (قراءات / وجبات / تحاليل)</h2>
                <p className="text-xs text-slate-400">سجل قياساتك الحيوية اليومية أو ارفع صورة لوجبتك أو تحاليلك لتحليلها فوراً بالذكاء الاصطناعي.</p>
              </div>

              {journalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  تم تسجيل اليوميات وإرسالها لطبيبك بنجاح!
                </div>
              )}

              <form onSubmit={handleJournalSubmit} className="space-y-6">
                {/* Vitals Inputs */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">1. القياسات الحيوية:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الضغط الانقباضي (العالي)</label>
                      <input
                        type="number"
                        placeholder="120"
                        value={vitals.systolic}
                        onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الضغط الانبساطي (المنخفض)</label>
                      <input
                        type="number"
                        placeholder="80"
                        value={vitals.diastolic}
                        onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">سكر الدم (mg/dL)</label>
                      <input
                        type="number"
                        placeholder="95"
                        value={vitals.sugar}
                        onChange={(e) => setVitals({ ...vitals, sugar: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الوزن (kg)</label>
                      <input
                        type="number"
                        placeholder="70"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Symptoms Checkboxes */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">2. الأعراض الحالية (إن وُجدت):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SYMPTOMS_LIST.map((sym) => {
                      const isChecked = selectedSymptoms.includes(sym);
                      return (
                        <button
                          type="button"
                          key={sym}
                          onClick={() => toggleSymptom(sym)}
                          className={`p-2.5 rounded-xl border text-right text-xs transition flex items-center justify-between ${
                            isChecked 
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-200' 
                              : 'bg-slate-950/60 border-white/5 text-slate-400'
                          }`}
                        >
                          <span>{sym}</span>
                          <span className="text-[10px]">{isChecked ? '✓' : '+'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photo Upload & Vision AI */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">3. صورة لوجبة طعام أو نتيجة تحليل (AI Vision):</h4>
                  <div className="border border-dashed border-white/15 rounded-xl p-4 text-center bg-slate-950/40 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setJournalFile(file);
                          setJournalPreviewUrl(URL.createObjectURL(file));
                          setJournalVisionResult(null);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {journalPreviewUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={journalPreviewUrl} alt="Preview" className="max-h-40 rounded-lg object-contain shadow-md" />
                        <span className="text-xs text-rose-400">اضغط لتغيير الصورة</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 space-y-1">
                        <Camera size={24} className="mx-auto text-rose-400" />
                        <p className="text-xs font-medium text-white">اضغط لرفع صورة طبق طعام أو تقرير طبي</p>
                      </div>
                    )}
                  </div>

                  {journalFile && (
                    <button
                      type="button"
                      onClick={handleAnalyzeJournalImage}
                      disabled={isAnalyzingImage}
                      className="mt-2 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAnalyzingImage ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>تحليل الصورة بالذكاء الاصطناعي الآن</span>
                    </button>
                  )}

                  {journalVisionResult && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      <span className="font-bold text-rose-400 block mb-1">نتيجة التحليل البصري:</span>
                      {journalVisionResult}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">4. ملاحظات أو تفاصيل إضافية:</label>
                    <VoiceInputButton onTranscript={(txt) => setJournalMessage(prev => prev ? prev + ' ' + txt : txt)} />
                  </div>
                  <textarea
                    rows={2}
                    value={journalMessage}
                    onChange={(e) => setJournalMessage(e.target.value)}
                    placeholder="اكتب أي ملاحظة عن شعورك اليوم أو وجباتك (أو استخدم المايك للإملاء الصوتي)..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingJournal}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isSubmittingJournal ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>حفظ وإرسال اليوميات</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VITALS & ALERTS */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
              <h2 className="text-xl font-bold text-white mb-1">المؤشرات والتنبيهات السريرية</h2>
              
              {/* Emergency Alert Banner */}
              {patientData?.latest_vitals?.systolic >= 180 || patientData?.latest_vitals?.diastolic >= 120 ? (
                <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3">
                  <AlertOctagon size={24} className="text-rose-400 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-rose-300">تنبيه طوارئ سريري!</h4>
                    <p>قراءات ضغط الدم الأخيرة مسجلة في نطاق حرج ({patientData.latest_vitals.systolic}/{patientData.latest_vitals.diastolic} mmHg). يُرجى الاتصال بطبيبك فوراً أو التوجه لأقرب مركز طوارئ.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>المؤشرات الحيوية الأخيرة ضمن النطاق الطبيعي المستقر.</span>
                </div>
              )}

              {/* Latest Vitals Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { label: 'الضغط الانقباضي', val: patientData?.latest_vitals?.systolic, unit: 'mmHg' },
                  { label: 'الضغط الانبساطي', val: patientData?.latest_vitals?.diastolic, unit: 'mmHg' },
                  { label: 'سكر الدم', val: patientData?.latest_vitals?.sugar, unit: 'mg/dL' },
                  { label: 'الوزن', val: patientData?.latest_vitals?.weight, unit: 'kg' },
                ].map((v, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950 border border-white/10">
                    <span className="text-[11px] text-slate-400 block mb-1">{v.label}</span>
                    <span className="text-2xl font-black text-rose-400 font-mono">{v.val !== undefined ? v.val : '—'}</span>
                    <span className="text-[10px] text-slate-500 mr-1">{v.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous History List */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white">سجل القياسات والبلاغات السابقة</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {patientData?.reports?.map(r => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-mono">{r.date}</span>
                        {r.is_emergency && <span className="px-1.5 rounded bg-rose-500/20 text-rose-300 font-bold">تنبيه حرج</span>}
                        <span className="px-1.5 rounded bg-white/10 text-slate-300">{r.status === 'reviewed' ? 'تمت المراجعة' : 'جديد'}</span>
                      </div>
                      {r.latest_vitals && (
                        <div className="text-slate-300 font-mono mt-1">
                          ضغط: {r.latest_vitals.systolic || '—'}/{r.latest_vitals.diastolic || '—'} | سكر: {r.latest_vitals.sugar || '—'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GENERATE DOCTOR REPORT */}
        {/* ========================================================================= */}
        {activeTab === 'report' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">توليد تقرير طبي موثق للطبيب</h2>
            <p className="text-xs text-slate-400">تجميع كل قياساتك، الأمراض المزمنة، وتاريخ الأعراض في تقرير منسق جاهز للمشاركة والطباعة.</p>

            <button
              onClick={handleGenerateDoctorReport}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition"
            >
              <Download size={14} />
              <span>إنشاء تقرير طبي شامل الآن</span>
            </button>

            {generatedReportText && (
              <div className="space-y-3 pt-3">
                <textarea
                  readOnly
                  rows={12}
                  value={generatedReportText}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none"
                />
                <button
                  onClick={() => {
                    const blob = new Blob([generatedReportText], { type: 'text/plain;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${patientId}_Patient_Clinical_Report.txt`;
                    link.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>تحميل كملف (.txt)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SEND CONSULTATION TO DOCTOR */}
        {/* ========================================================================= */}
        {activeTab === 'consult' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">إرسال استشارة أو بلاغ للدكتور</h2>
            <p className="text-xs text-slate-400">أرسل استفسارك أو طلب استشارتك ليصل فوراً إلى شاشة الطبيب المعالج.</p>

            {consultSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                تم إرسال الاستشارة إلى الطبيب بنجاح!
              </div>
            )}

            <form onSubmit={handleSendConsultation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-2">نوع الاستشارة:</label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="consultKind"
                      checked={consultKind === 'consultation_routine'}
                      onChange={() => setConsultKind('consultation_routine')}
                      className="accent-rose-500"
                    />
                    <span>تقرير دوري / سؤال عادي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="consultKind"
                      checked={consultKind === 'consultation_urgent'}
                      onChange={() => setConsultKind('consultation_urgent')}
                      className="accent-rose-500"
                    />
                    <span className="text-rose-400 font-bold">استشارة طارئة / أعراض مقلقة</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">نص الاستشارة أو السؤال:</label>
                <textarea
                  rows={4}
                  value={consultMessage}
                  onChange={(e) => setConsultMessage(e.target.value)}
                  placeholder="اكتب استشارتك بالتفصيل هنا..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingConsult || !consultMessage.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50 transition"
              >
                {isSendingConsult ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>إرسال للدكتور</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: GENERAL AI CHAT */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && (
          <div className="h-[620px] flex flex-col rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-start flex-row' : 'justify-end flex-row-reverse'}`}>
                  <img 
                    src={m.role === 'user' ? '/patient_icon.jpg' : '/doctor_icon.jpg'} 
                    alt="Avatar" 
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0 mt-1" 
                  />
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-rose-600 text-white rounded-br-none shadow-md shadow-rose-600/20'
                      : 'bg-slate-950/90 text-slate-200 border border-white/10 rounded-bl-none shadow-md'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[10px] text-slate-400">
                        {m.role === 'user' ? (patientData?.display_name || patientId) : 'CardioOS Companion (AI)'}
                      </span>
                      {m.role === 'assistant' && (
                        <VoiceInputButton textToSpeak={m.content} />
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {isChatSending && (
                <div className="flex justify-end">
                  <div className="p-3 rounded-2xl bg-slate-950 text-xs text-slate-400 flex items-center gap-2 border border-white/10">
                    <RefreshCw size={12} className="animate-spin text-rose-400" />
                    <span>جاري التفكير...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-4 bg-slate-950/80 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب سؤالك الصحي هنا أو املأه بالصوت..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
              <VoiceInputButton onTranscript={(txt) => setChatInput(prev => prev ? prev + ' ' + txt : txt)} />
              <button
                type="submit"
                disabled={isChatSending || !chatInput.trim()}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send size={14} />
                إرسال
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: GUIDELINE-BACKED EVIDENCE CONSULTATION */}
        {/* ========================================================================= */}
        {activeTab === 'guidelines' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">استشارة موثقة بالمراجع الطبية الرسمية (AHA / WHO)</h2>
              <p className="text-xs text-slate-400">محرك بحث مخصص للمريض يستخرج المعلومات المعتمدة من أحدث الأدلة السريرية العالمية دون تخمين أو هلوسة.</p>
            </div>

            <form onSubmit={handleSearchGuidelines} className="flex items-center gap-2">
              <input
                type="text"
                value={guidelineQuery}
                onChange={(e) => setGuidelineQuery(e.target.value)}
                placeholder="مثال: ما هو ضغط الدم المستهدف لمرضى القلب؟"
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
              <VoiceInputButton onTranscript={(txt) => setGuidelineQuery(prev => prev ? prev + ' ' + txt : txt)} />
              <button
                type="submit"
                disabled={isSearchingGuidelines || !guidelineQuery.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                {isSearchingGuidelines ? <RefreshCw size={14} className="animate-spin" /> : <BookOpen size={14} />}
                <span>استشارة موثقة</span>
              </button>
            </form>

            {guidelineResult && (
              <div className="space-y-3 pt-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  <span className="font-bold text-rose-300 block mb-2">التوصية المعتمدة:</span>
                  {guidelineResult.answer}
                </div>

                {guidelineResult.citations?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400">المصادر المقتبسة:</span>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {guidelineResult.citations.map((c, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-white/5 text-[11px] text-slate-400">
                          <span className="font-bold text-white block">{c.document} (صفحة {c.page})</span>
                          <p className="mt-1 font-mono text-[10px]">{c.content}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: COMPARE WITH GENERAL POPULATION */}
        {/* ========================================================================= */}
        {activeTab === 'bench' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">مقارنة قياساتك بالمعدل العام للمرضى</h2>
            <p className="text-xs text-slate-400">تعرف على موقع قراءاتك الصحية مقارنة بمتوسط جميع المرضى المسجلين في CardioOS.</p>

            {benchmarks && Object.keys(benchmarks).length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                {Object.entries(benchmarks).map(([k, d]) => (
                  <div key={k} className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{d.label}</span>
                      <span className="text-lg font-black text-rose-400 font-mono">{d.value}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>متوسط المرضى: {d.population_avg}</span>
                      <span className={d.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {d.delta > 0 ? `+${d.delta}` : d.delta}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, d.percentile))}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 text-left font-mono" dir="ltr">
                      Higher than {d.percentile}% of patients.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">لا توجد قراءات كافية للمقارنة حالياً.</p>
            )}
          </div>
        )}

      </main>

      {/* Floating Emergency SOS Button */}
      <button
        type="button"
        onClick={() => setIsSosOpen(true)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 p-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-black shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/20 animate-bounce"
        title="طوارئ واستغاثة القلب SOS"
      >
        <PhoneCall size={18} className="animate-spin text-white" style={{ animationDuration: '3s' }} />
        <span className="text-xs font-black tracking-wider hidden sm:inline">طوارئ SOS (123)</span>
      </button>

      {/* Interactive Modals */}
      <EmergencySosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onAlertDoctor={() => {
          apiRequest(`/api/patients/${patientId}/reports`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'consultation_urgent', message: '⚠️ تنبيه طوارئ: المريض ضغط على زر الاستغاثة العاجل!', is_emergency: true })
          });
        }}
      />
      <AscvdCalculatorModal isOpen={isAscvdOpen} onClose={() => setIsAscvdOpen(false)} />
      <PrintableReportModal 
        isOpen={isPrintableOpen} 
        onClose={() => setIsPrintableOpen(false)} 
        patientData={patientData || { id: patientId, display_name: patientId, latest_vitals: vitals }} 
      />
    </div>
  );
}
