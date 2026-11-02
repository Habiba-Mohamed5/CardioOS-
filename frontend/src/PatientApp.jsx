import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Activity, Camera, MessageSquare, FileText, 
  Send, Upload, CheckCircle2, AlertCircle, Clock, 
  ChevronLeft, Sparkles, RefreshCw, User
} from 'lucide-react';
import { apiRequest, API_BASE_URL } from './apiConfig';

export default function PatientApp() {
  const [activeTab, setActiveTab] = useState('journal'); // journal | vision | chat | notes
  
  // Patient Profile
  const [patientId, setPatientId] = useState('حبيبة_محمد');
  const [patientData, setPatientData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Journal / Vitals Form
  const [vitals, setVitals] = useState({ systolic: '', diastolic: '', sugar: '', weight: '' });
  const [journalMessage, setJournalMessage] = useState('');
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [journalSuccess, setJournalSuccess] = useState(false);

  // Vision Analyzer Form
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageNote, setImageNote] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visionResult, setVisionResult] = useState(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'أهلاً بك! أنا رفيقك الصحي الذكي في CardioOS. كيف تشعر اليوم؟ يمكنك سؤالي عن قياساتك، أدويتك، أو إرسال صورة لوجبتك أو تحاليلك لتحليلها.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    loadPatientData(patientId);
  }, [patientId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function loadPatientData(pid) {
    if (!pid.trim()) return;
    setIsLoadingProfile(true);
    try {
      const data = await apiRequest(`/api/patients/${pid}`);
      setPatientData(data);
    } catch (err) {
      console.error('Failed to load patient data', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function handleJournalSubmit(e) {
    e.preventDefault();
    setIsSubmittingJournal(true);
    setJournalSuccess(false);

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
          vitals: Object.keys(parsedVitals).length > 0 ? parsedVitals : undefined
        })
      });

      setJournalSuccess(true);
      setVitals({ systolic: '', diastolic: '', sugar: '', weight: '' });
      setJournalMessage('');
      loadPatientData(patientId);
      setTimeout(() => setJournalSuccess(false), 4000);
    } catch (err) {
      alert('فشل في حفظ القياسات: ' + err.message);
    } finally {
      setIsSubmittingJournal(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setVisionResult(null);
    }
  }

  async function handleAnalyzeImage(e) {
    e.preventDefault();
    if (!selectedFile) return;

    setIsAnalyzingImage(true);
    setVisionResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (imageNote.trim()) formData.append('note', imageNote.trim());
    if (patientId) formData.append('patient_id', patientId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/analyze-image`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('فشل التحليل البصري للصورة.');
      const data = await res.json();
      setVisionResult(data.analysis);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAnalyzingImage(false);
    }
  }

  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatSending(true);

    try {
      const data = await apiRequest('/api/patient/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          patient_id: patientId
        })
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'عذراً، حدث خطأ أثناء الاتصال بالخادم. يُرجى المحاولة مرة أخرى لاحقاً.' 
      }]);
    } finally {
      setIsChatSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-rose-500/30" dir="rtl">
      {/* Top Navigation */}
      <header className="h-16 px-6 bg-slate-900/90 border-b border-white/10 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/cardioos_named_logo.jpg" alt="CardioOS" className="h-9 w-9 rounded-lg object-cover ring-1 ring-rose-500/50" />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cardio<span className="text-rose-400">OS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">بوابة المريض</span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {[
            { id: 'journal', label: 'يومياتي وقياساتي', icon: Activity },
            { id: 'vision', label: 'تحليل الوجبات والتحاليل بالذكاء الاصطناعي', icon: Camera },
            { id: 'chat', label: 'الرفيق الصحي الذكي', icon: MessageSquare },
            { id: 'notes', label: 'توجيهات الطبيب', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl">
            <User size={13} className="text-rose-400" />
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-white w-24 focus:outline-none"
              title="اسم المريض / المعرف"
            />
          </div>
          <a href="/" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition">
            الرئيسية
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: DAILY HEALTH JOURNAL & VITALS */}
        {/* ========================================================================= */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Heart size={20} className="text-rose-400" />
                تسجيل القياسات والأعراض اليومية
              </h2>
              <p className="text-xs text-slate-400">
                سجل قياساتك بانتظام لتظهر لطبيبك المعالج فوراً في شاشته، مما يساعده في ضبط خطتك العلاجية.
              </p>

              {journalSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  تم تسجيل القياسات بنجاح وإرسالها لطبيبك المعالج!
                </div>
              )}

              <form onSubmit={handleJournalSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">الضغط الانقباضي (العالي)</label>
                    <input
                      type="number"
                      placeholder="120"
                      value={vitals.systolic}
                      onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">الضغط الانبساطي (المنخفض)</label>
                    <input
                      type="number"
                      placeholder="80"
                      value={vitals.diastolic}
                      onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">سكر الدم (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="95"
                      value={vitals.sugar}
                      onChange={(e) => setVitals({ ...vitals, sugar: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">الوزن (kg)</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={vitals.weight}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">كيف تشعر اليوم؟ أو أي ملاحظة تود مشاركتها مع طبيبك:</label>
                  <textarea
                    rows={3}
                    placeholder="مثال: شعرت بدوخة خفيفة بعد وجبة الغداء، وتناولت دوائي في موعده..."
                    value={journalMessage}
                    onChange={(e) => setJournalMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingJournal}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isSubmittingJournal ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>حفظ وإرسال التقرير</span>
                </button>
              </form>
            </div>

            {/* Past History */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-rose-400" />
                سجل قياساتي وبلاغاتي السابقة
              </h3>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {patientData?.reports && patientData.reports.length > 0 ? (
                  patientData.reports.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{r.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {r.status === 'reviewed' ? 'تمت مراجعة الطبيب' : 'بانتظار المراجعة'}
                          </span>
                        </div>
                        {r.message && <p className="text-slate-200">{r.message}</p>}
                        {r.latest_vitals && Object.keys(r.latest_vitals).length > 0 && (
                          <div className="flex gap-3 text-slate-400 font-mono text-[11px] pt-1">
                            {r.latest_vitals.systolic && <span>ضغط: {r.latest_vitals.systolic}/{r.latest_vitals.diastolic}</span>}
                            {r.latest_vitals.sugar && <span>سكر: {r.latest_vitals.sugar}</span>}
                            {r.latest_vitals.weight && <span>وزن: {r.latest_vitals.weight}kg</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">لم تقم بتسجيل أي قياسات حتى الآن.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MULTIMODAL VISION AI (FOOD & LAB ANALYZER) */}
        {/* ========================================================================= */}
        {activeTab === 'vision' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 shadow-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-3">
                <Sparkles size={12} />
                الرؤية الحاسوبية بالذكاء الاصطناعي (Gemini Vision)
              </div>
              <h2 className="text-xl font-bold text-white mb-2">تحليل وجبات الطعام والتحاليل الطبية</h2>
              <p className="text-xs text-slate-400">
                التقط صورة لطبق طعامك أو ورقة تحليلك، وسيقوم المساعد الذكي بتحليل مدى ملاءمتها لصحة قلبك وضغط دمك فوراً.
              </p>

              <form onSubmit={handleAnalyzeImage} className="mt-6 space-y-4">
                <div className="border-2 border-dashed border-white/15 hover:border-rose-500/50 rounded-2xl p-6 text-center transition cursor-pointer relative bg-slate-950/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={previewUrl} alt="Preview" className="max-h-56 rounded-xl object-contain shadow-lg" />
                      <span className="text-xs text-rose-400 font-semibold">اضغط لتغيير الصورة</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                        <Upload size={20} />
                      </div>
                      <p className="text-sm font-semibold text-white">اضغط هنا أو اسحب الصورة للرفع</p>
                      <p className="text-xs text-slate-400">JPG, PNG, WebP (وجبات طعام أو تقارير طبية)</p>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={imageNote}
                    onChange={(e) => setImageNote(e.target.value)}
                    placeholder="ملاحظة إضافية عن الصورة (اختياري: مثلاً 'وجبة عشاء خفيفة')..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || isAnalyzingImage}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isAnalyzingImage ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
                  <span>تحليل الصورة بالذكاء الاصطناعي</span>
                </button>
              </form>
            </div>

            {/* Analysis Result */}
            {visionResult && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  نتيجة التحليل الغذائي والطبي
                </h3>
                <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-4 rounded-xl border border-white/5">
                  {visionResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI PATIENT CHAT ASSISTANT */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && (
          <div className="h-[650px] flex flex-col rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-xl">
            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-rose-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950/90 text-slate-200 border border-white/10 rounded-bl-none shadow-md'
                  }`}>
                    <div className="font-bold text-[10px] text-slate-300 mb-1 opacity-75">
                      {m.role === 'user' ? 'أنت' : 'CardioOS Companion'}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {isChatSending && (
                <div className="flex justify-end">
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-rose-400" />
                    <span>جاري التفكير وصياغة النصيحة الطبية...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-4 bg-slate-950/80 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب استفسارك الطبي أو الصحي هنا..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
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
        {/* TAB 4: DOCTOR NOTES & ORDERS */}
        {/* ========================================================================= */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <FileText size={20} className="text-rose-400" />
                توجيهات وملاحظات الطبيب المعالج
              </h2>
              <p className="text-xs text-slate-400">
                هنا تظهر جميع الملاحظات والتعليمات الدوائية المرسلة إليك مباشرة من طبيبك.
              </p>
            </div>

            <div className="space-y-3">
              {patientData?.notes && patientData.notes.length > 0 ? (
                patientData.notes.map(n => (
                  <div key={n.id} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-300">{n.doctor_name}</span>
                      <span className="text-slate-400 font-mono">{n.date}</span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/5">
                      {n.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 border border-white/5 rounded-2xl">
                  لا توجد ملاحظات أو توجيهات جديدة من طبيبك بعد.
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
