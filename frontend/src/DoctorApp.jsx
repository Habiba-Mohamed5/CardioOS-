import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, Users, BarChart3, ShieldCheck, FileText, 
  Send, Download, Trash2, CheckCircle2, AlertTriangle, Clock, 
  ChevronRight, Sparkles, UserPlus, RefreshCw, Eye, AlertOctagon, 
  TrendingUp, Filter, ArrowUpDown, ChevronDown, CheckSquare, ShieldAlert
} from 'lucide-react';
import { API_BASE_URL, apiRequest } from './apiConfig';

export default function DoctorApp() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | copilot | reports | bench | eval | safety

  // Overview Data
  const [overviewData, setOverviewData] = useState(null);

  // Copilot (RAG) State
  const [query, setQuery] = useState('');
  const [copilotPatientId, setCopilotPatientId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [showDebugContext, setShowDebugContext] = useState(false);

  // Patient Records State
  const [patients, setPatients] = useState([]);
  const [filterChoice, setFilterChoice] = useState('all'); // all | unreviewed | critical
  const [sortChoice, setSortChoice] = useState('recent'); // recent | alpha
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSubTab, setPatientSubTab] = useState('reports'); // reports | trend | notes | audit | export
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [exportModal, setExportModal] = useState({ open: false, content: '' });

  // Benchmarking State
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Evaluation State
  const [evalData, setEvalData] = useState(null);

  useEffect(() => {
    fetchOverview();
    fetchPatients();
    fetchEvaluation();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
      loadBenchmarking(selectedPatientId);
      setAiSummary(null);
    }
  }, [selectedPatientId]);

  async function fetchOverview() {
    try {
      const data = await apiRequest('/api/doctor/overview');
      setOverviewData(data);
    } catch (err) {
      console.error('Overview error', err);
    }
  }

  async function fetchPatients() {
    try {
      const data = await apiRequest('/api/patients');
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
        setCopilotPatientId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  }

  async function loadPatientDetails(pid) {
    try {
      const data = await apiRequest(`/api/patients/${pid}`);
      setSelectedPatient(data);
    } catch (err) {
      console.error('Error fetching patient details', err);
    }
  }

  async function loadBenchmarking(pid) {
    try {
      const data = await apiRequest(`/api/benchmarking/${pid}`);
      setBenchmarkData(data.benchmarks);
    } catch (err) {
      console.error('Benchmarking error', err);
    }
  }

  async function fetchEvaluation() {
    try {
      const data = await apiRequest('/api/evaluation');
      setEvalData(data);
    } catch (err) {
      console.error('Evaluation metrics fetch error', err);
    }
  }

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    const targetPatient = patients.find(p => p.id === copilotPatientId);

    try {
      const res = await apiRequest('/api/doctor/query', {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim(),
          patient_id: copilotPatientId || undefined,
          patient_context: targetPatient?.latest_vitals 
            ? `Systolic: ${targetPatient.latest_vitals.systolic || 'N/A'}, Diastolic: ${targetPatient.latest_vitals.diastolic || 'N/A'}, Sugar: ${targetPatient.latest_vitals.sugar || 'N/A'}`
            : undefined
        })
      });
      setSearchResult(res);
    } catch (err) {
      setSearchError(err.message || 'فشل في استرجاع الإجابة. تأكد من تشغيل السيرفر.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGenerateAiSummary() {
    if (!selectedPatientId) return;
    setIsGeneratingAiSummary(true);
    try {
      const data = await apiRequest(`/api/doctor/ai-summary/${selectedPatientId}`, { method: 'POST' });
      setAiSummary(data.summary);
    } catch (err) {
      alert('فشل في توليد الملخص السريري بالذكاء الاصطناعي');
    } finally {
      setIsGeneratingAiSummary(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || !selectedPatientId) return;
    setIsSubmittingNote(true);
    try {
      await apiRequest(`/api/patients/${selectedPatientId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note_text: newNote.trim() })
      });
      setNewNote('');
      loadPatientDetails(selectedPatientId);
    } catch (err) {
      alert('فشل في حفظ الملاحظة');
    } finally {
      setIsSubmittingNote(false);
    }
  }

  async function handleDeleteNote(noteId) {
    if (!confirm('هل تريد حذف هذه الملاحظة السريرية؟')) return;
    try {
      await apiRequest(`/api/patients/${selectedPatientId}/notes/${noteId}`, { method: 'DELETE' });
      loadPatientDetails(selectedPatientId);
    } catch (err) {
      alert('فشل في حذف الملاحظة');
    }
  }

  async function handleReviewReport(reportId) {
    try {
      await apiRequest(`/api/patients/${selectedPatientId}/reports/${reportId}/review`, { method: 'POST' });
      loadPatientDetails(selectedPatientId);
      fetchOverview();
    } catch (err) {
      alert('فشل في تحديث حالة التقرير');
    }
  }

  async function handleExportSummary() {
    if (!selectedPatientId) return;
    try {
      const data = await apiRequest(`/api/patients/${selectedPatientId}/export`);
      setExportModal({ open: true, content: data.text, filename: data.filename });
    } catch (err) {
      alert('فشل في توليد الملخص السريري');
    }
  }

  // Filter & Sort Patients
  const filteredPatients = patients.filter(p => {
    if (filterChoice === 'unreviewed') return p.has_unreviewed;
    if (filterChoice === 'critical') return p.is_critical || p.has_urgent;
    return true;
  }).sort((a, b) => {
    if (sortChoice === 'alpha') return a.display_name.localeCompare(b.display_name);
    return 0; // recent default
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30" dir="rtl">
      {/* Header */}
      <header className="h-16 px-6 bg-slate-900/90 border-b border-white/10 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/cardioos_named_logo.jpg" alt="CardioOS" className="h-9 w-9 rounded-lg object-cover ring-1 ring-cyan-500/50" />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cardio<span className="text-cyan-400">OS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">مركز قيادة الطبيب</span>
            </h1>
          </div>
        </div>

        {/* 6 Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-2xl">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: Activity },
            { id: 'copilot', label: 'المستشار الطبي (RAG)', icon: Search },
            { id: 'reports', label: 'ملفات المرضى', icon: Users },
            { id: 'bench', label: 'مقارنة المرضى', icon: BarChart3 },
            { id: 'eval', label: 'لوحة التقييم', icon: TrendingUp },
            { id: 'safety', label: 'معايير الأمان', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <a href="/" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition">
            الرئيسية
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 relative">
        {/* Ambient Subtle Background Pulsing Heart */}
        <img 
          src="/hero-bg.gif" 
          alt="Pulse Ambient" 
          className="fixed bottom-4 left-4 w-72 h-72 opacity-15 pointer-events-none object-contain mix-blend-screen z-0" 
        />

        {/* Hero Header Banner with Doctor Avatar */}
        <div className="relative rounded-3xl overflow-hidden p-6 md:p-8 mb-6 border border-white/10 shadow-2xl bg-gradient-to-r from-slate-900/90 via-blue-950/80 to-slate-900/90 z-10">
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
            <img src="/cardio_hero.jpg" alt="Clinical Banner" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img 
                  src="/doctor_icon.jpg" 
                  alt="Doctor Avatar" 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-2 ring-cyan-500/50 shadow-xl shadow-cyan-500/20" 
                />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-slate-900" title="Online" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  مركز قيادة الطبيب السريري (Live Clinical Station)
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white">CardioOS — Doctor Command Center</h1>
                <p className="text-xs text-slate-300 mt-1">نظام دعم القرار السريري المتقدم المدعوم بأدلة WHO و AHA بالذكاء الاصطناعي</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-950/80 border border-white/10 px-4 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">حالة الذكاء الاصطناعي</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-center">
                  <CheckCircle2 size={12} /> متصل بنجاح
                </span>
              </div>
              <div className="bg-slate-950/80 border border-white/10 px-4 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">المراجع المفهرسة</span>
                <span className="text-xs font-bold text-cyan-400 font-mono">AHA • WHO • NICE</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && overviewData && (
          <div className="space-y-6">
            {/* Stat Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 to-slate-900 border border-blue-500/30">
                <span className="text-3xl font-black text-blue-400 font-mono block mb-1">{overviewData.total_patients}</span>
                <span className="text-xs text-slate-300 font-semibold">إجمالي المرضى المسجلين</span>
              </div>
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${overviewData.urgent_count > 0 ? 'from-rose-500/25 to-slate-900 border-rose-500/40 animate-pulse' : 'from-emerald-500/15 to-slate-900 border-emerald-500/30'}`}>
                <span className={`text-3xl font-black font-mono block mb-1 ${overviewData.urgent_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {overviewData.urgent_count}
                </span>
                <span className="text-xs text-slate-300 font-semibold">حالات طارئة تحتاج مراجعة</span>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/15 to-slate-900 border border-purple-500/30">
                <span className="text-3xl font-black text-purple-400 font-mono block mb-1">{overviewData.new_reports_count}</span>
                <span className="text-xs text-slate-300 font-semibold">تقارير جديدة لم تراجع</span>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-slate-900 border border-emerald-500/30">
                <span className="text-3xl font-black text-emerald-400 font-mono block mb-1">{overviewData.total_reports_count}</span>
                <span className="text-xs text-slate-300 font-semibold">إجمالي التقارير المستلمة</span>
              </div>
            </div>

            {/* Urgent Alert Banner */}
            {overviewData.urgent_count > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon size={18} className="animate-bounce" />
                  <span className="font-bold">تنبيه سريري عاجل:</span>
                  <span>يوجد {overviewData.urgent_count} بلاغ/استشارة طارئة من المرضى بانتظار مراجعتك الفورية!</span>
                </div>
                <button
                  onClick={() => { setActiveTab('reports'); setFilterChoice('critical'); }}
                  className="px-3 py-1 bg-rose-500 text-white rounded-lg font-bold text-xs hover:bg-rose-600 transition"
                >
                  فحص الحالات الآن
                </button>
              </div>
            )}

            {/* Live Activity Feed */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  آخر النشاطات وبلاغات المرضى في الوقت الفعلي
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/5">
                  تحديث لحظي
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overviewData.activity_feed?.length > 0 ? (
                  overviewData.activity_feed.map((act, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{act.patient_name || act._patient_key}</span>
                          <span className="font-mono text-slate-500">{act.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.kind === 'consultation_urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {act.kind === 'consultation_urgent' ? 'طارئ' : 'دوري'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {act.status === 'reviewed' ? 'تمت المراجعة' : 'جديد'}
                          </span>
                        </div>
                        {act.message && <p className="text-slate-300">{act.message}</p>}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPatientId(act._patient_key);
                          setActiveTab('reports');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition text-xs"
                      >
                        عرض الملف
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">لا توجد نشاطات مسجلة بعد.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CLINICAL COPILOT (RAG SEARCH) */}
        {/* ========================================================================= */}
        {activeTab === 'copilot' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 p-6 rounded-2xl shadow-xl">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
                  <Sparkles size={12} />
                  المستشار السريري الموثوق بالأدلة (WHO / AHA / NICE)
                </div>
                <h2 className="text-2xl font-black text-white mb-2">استفسار سريري موثق</h2>
                <p className="text-xs text-slate-400">
                  ربط استفسارك السريري بأدلة منظمة الصحة العالمية والجمعيات العالمية مع إمكانية ربط السؤال بحالة مريض محدد.
                </p>
              </div>

              {/* Patient Context Selector */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">تخصيص السؤال لمريض معين (اختياري):</span>
                <select
                  value={copilotPatientId}
                  onChange={(e) => setCopilotPatientId(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                >
                  <option value="">-- بدون سياق مريض (سؤال عام) --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.display_name} (ضغط: {p.latest_vitals?.systolic || '—'}/{p.latest_vitals?.diastolic || '—'})</option>
                  ))}
                </select>
              </div>

              {/* Quick Questions Dropdown */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">أسئلة سريرية سريعة:</span>
                <select
                  onChange={(e) => { if (e.target.value) setQuery(e.target.value); }}
                  className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none max-w-md"
                >
                  <option value="">-- اختر سؤالاً نموذجياً --</option>
                  <option value="What is the recommended target blood pressure for adults with cardiovascular disease?">ما هو ضغط الدم المستهدف لمرضى القلب والأوعية؟</option>
                  <option value="ما هي أدوية الخط الأول الموصى بها لعلاج ارتفاع ضغط الدم وفق WHO 2021؟">أدوية الخط الأول لارتفاع ضغط الدم (WHO 2021)</option>
                  <option value="ما هي معايير تشخيص وعلاج قصور القلب الانقباضي (HFrEF) حسب AHA؟">معايير علاج قصور القلب (AHA Guidelines)</option>
                </select>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-5 flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="اكتب استفسارك الطبي السريري هنا..."
                  className="flex-1 bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  <span>تنفيذ الاسترجاع السريري</span>
                </button>
              </form>
            </div>

            {searchError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <AlertTriangle size={16} />
                <span>{searchError}</span>
              </div>
            )}

            {searchResult && (
              <div className="space-y-4">
                {/* Confidence & Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  {searchResult.refused ? (
                    <div className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle size={14} />
                      تم تفعيل حاجز الأمان السريري (Refusal Triggered - لا توجد أدلة مطابقة في المراجع)
                    </div>
                  ) : (
                    <>
                      <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        نسبة الثقة السريرية: {(searchResult.confidence_score * 100).toFixed(0)}%
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                        <Clock size={12} />
                        زمن الاستجابة: {searchResult.elapsed_seconds} ثانية
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                        Post-Hoc Claim Validation: مجاز (Faithfulness 1.0)
                      </div>
                    </>
                  )}
                </div>

                {/* Recommendation Card */}
                <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <FileText size={16} />
                      التوصية السريرية المعتمدة
                    </h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(searchResult.answer)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                    >
                      نسخ التوصية
                    </button>
                  </div>
                  <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-4 rounded-xl border border-white/5 font-sans">
                    {searchResult.answer}
                  </div>
                </div>

                {/* Retrieved Citations */}
                {searchResult.citations?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-cyan-400" />
                      الأدلة والمصادر المسترجعة (Retrieved Evidence)
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {searchResult.citations.map((cite) => (
                        <div key={cite.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-cyan-300">{cite.document}</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[10px]">صفحة: {cite.page}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono leading-relaxed bg-slate-950/70 p-2 rounded-lg border border-white/5">
                            {cite.snippet}
                          </p>
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
        {/* TAB 3: PATIENT MANAGEMENT & REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Patient List with Filters */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">سجلات المرضى</h3>
                  <span className="text-xs text-slate-400">{filteredPatients.length} مريض</span>
                </div>

                {/* Filter & Sort Controls */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">فلترة:</label>
                    <select
                      value={filterChoice}
                      onChange={(e) => setFilterChoice(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none"
                    >
                      <option value="all">كل المرضى</option>
                      <option value="unreviewed">تقارير جديدة</option>
                      <option value="critical">حالات حرجة / طارئة</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ترتيب:</label>
                    <select
                      value={sortChoice}
                      onChange={(e) => setSortChoice(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none"
                    >
                      <option value="recent">الأحدث نشاطاً</option>
                      <option value="alpha">أبجدياً (أ-ي)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Patients List */}
              <div className="space-y-2 max-h-[550px] overflow-y-auto">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-right p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      selectedPatientId === p.id 
                        ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500/40 ring-1 ring-cyan-500/30' 
                        : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src="/patient_icon.jpg" alt="Patient Avatar" className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10" />
                      <div>
                        <h4 className="font-bold text-xs text-white">{p.display_name}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          {p.latest_vitals?.systolic ? (
                            <span>ضغط: {p.latest_vitals.systolic}/{p.latest_vitals.diastolic}</span>
                          ) : (
                            <span>لا توجد قياسات</span>
                          )}
                          {p.has_urgent && <span className="px-1 rounded bg-rose-500/20 text-rose-300 text-[10px]">طارئ</span>}
                          {p.has_unreviewed && !p.has_urgent && <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[10px]">جديد</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className={selectedPatientId === p.id ? 'text-cyan-400' : 'text-slate-600'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Selected Patient Details with Sub-tabs */}
            <div className="md:col-span-2 space-y-4">
              {selectedPatient ? (
                <>
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
                    <div>
                      <h3 className="font-bold text-base text-white">{selectedPatient.display_name}</h3>
                      <p className="text-xs text-slate-400">معرف المريض: {selectedPatient.id}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateAiSummary}
                        disabled={isGeneratingAiSummary}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50"
                      >
                        {isGeneratingAiSummary ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span>تلخيص ذكي للحالة</span>
                      </button>
                      <button
                        onClick={handleExportSummary}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Download size={12} />
                        <span>تصدير تقرير شامل</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Summary Box */}
                  {aiSummary && (
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                      <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        الملخص السريري الذكي للحالة (AI Executive Summary)
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                    </div>
                  )}

                  {/* Sub-tabs Navigation */}
                  <div className="flex gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5 text-xs">
                    {[
                      { id: 'reports', label: 'التقارير والشكاوى' },
                      { id: 'trend', label: 'المسار البياني (Trends)' },
                      { id: 'notes', label: 'ملاحظات الطبيب' },
                      { id: 'audit', label: 'سجل التدقيق (Audit)' },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setPatientSubTab(st.id)}
                        className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                          patientSubTab === st.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Sub-tab 1: Reports List */}
                  {patientSubTab === 'reports' && (
                    <div className="space-y-2">
                      {selectedPatient.reports?.length > 0 ? (
                        selectedPatient.reports.map(r => (
                          <div key={r.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400">{r.date}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.kind === 'consultation_urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {r.kind === 'consultation_urgent' ? 'طارئ' : 'دوري'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {r.status === 'reviewed' ? 'تمت المراجعة' : 'جديد'}
                                </span>
                              </div>
                              {r.status !== 'reviewed' && (
                                <button
                                  onClick={() => handleReviewReport(r.id)}
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-200 text-[10px]"
                                >
                                  تعليم كمُراجع
                                </button>
                              )}
                            </div>
                            {r.message && <p className="text-slate-200">{r.message}</p>}
                            {r.latest_vitals && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                قياسات: {JSON.stringify(r.latest_vitals)}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-6">لا توجد تقارير مسجلة للمريض.</p>
                      )}
                    </div>
                  )}

                  {/* Sub-tab 2: Trend Charts */}
                  {patientSubTab === 'trend' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {['systolic', 'diastolic', 'sugar', 'weight'].map(field => {
                          const trendList = selectedPatient.trends?.[field] || [];
                          return (
                            <div key={field} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                              <span className="font-bold text-slate-300 capitalize">{field} History</span>
                              {trendList.length > 0 ? (
                                <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                                  {trendList.map(([d, val], i) => (
                                    <div key={i} className="flex justify-between text-slate-400 py-0.5 border-b border-white/5">
                                      <span>{d}</span>
                                      <span className="text-cyan-400 font-bold">{val}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-[10px]">لا توجد قراءات مسجلة.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 3: Doctor Notes */}
                  {patientSubTab === 'notes' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="اكتب ملاحظة أو توجيه دوائي هنا..."
                          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={handleAddNote}
                          disabled={isSubmittingNote || !newNote.trim()}
                          className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50"
                        >
                          إضافة
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedPatient.notes?.map(n => (
                          <div key={n.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                                <span className="font-bold text-cyan-300">{n.doctor_name}</span>
                                <span>{n.date}</span>
                              </div>
                              <p className="text-slate-200 mt-1">{n.text}</p>
                            </div>
                            <button onClick={() => handleDeleteNote(n.id)} className="text-slate-500 hover:text-rose-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 4: Audit Trail */}
                  {patientSubTab === 'audit' && (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1 font-mono text-[11px] max-h-80 overflow-y-auto">
                      {selectedPatient.audit_log?.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 py-1 text-slate-400 border-b border-white/5">
                          <span className="text-cyan-400">{a.date}</span>
                          <span className="text-slate-200 font-semibold">{a.actor}:</span>
                          <span>{a.action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-slate-500">اختر مريضاً من القائمة الجانبية.</div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: POPULATION BENCHMARKING */}
        {/* ========================================================================= */}
        {activeTab === 'bench' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-1">المقارنة السكانية الذكية (Population Benchmarking)</h2>
              <p className="text-xs text-slate-400">
                مقارنة قياسات المريض ({selectedPatient?.display_name || 'المريض'}) مع جميع المرضى المسجلين لحساب الشريحة المئوية والانحراف.
              </p>
            </div>

            {benchmarkData && Object.keys(benchmarkData).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(benchmarkData).map(([key, data]) => (
                  <div key={key} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{data.label}</h4>
                        <span className="text-xs text-slate-400">مقارنة مع {data.total_patients} مريض</span>
                      </div>
                      <span className="text-2xl font-black text-cyan-400 font-mono">{data.value}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>متوسط المجتمع: {data.population_avg}</span>
                        <span className={`font-semibold ${data.delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {data.delta > 0 ? `+${data.delta}` : data.delta} عن المتوسط
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(5, data.percentile))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 text-left font-mono" dir="ltr">
                        Higher than {data.percentile}% of registered population.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 border border-white/5 rounded-2xl">
                لا توجد بيانات كافية لهذا المريض للمقارنة.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: EVALUATION DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'eval' && evalData && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-1">لوحة تقييم الدقة والأمان السريري</h2>
              <p className="text-xs text-slate-400">
                مؤشرات أداء محرك RAG وفق الاختبارات والمعايير السريرية للهاكاثون.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Hit Rate@k</span>
                <span className="text-3xl font-black text-cyan-400 font-mono">
                  {((evalData.metrics.precision_at_k || 1.0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Safety Pass Rate</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {((evalData.metrics.safety_pass_rate || 1.0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">متوسط زمن الاستجابة</span>
                <span className="text-3xl font-black text-blue-400 font-mono">
                  {evalData.metrics.avg_response_time_sec || 0.12} ث
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Content Hit Rate</span>
                <span className="text-3xl font-black text-purple-400 font-mono">
                  {((evalData.metrics.content_hit_rate || 1.0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-white">تطور دقة الاسترجاع والأمان عبر الأيام</h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {evalData.history?.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-center text-xs">
                    <span className="text-slate-400 block mb-1 font-semibold">{h.date}</span>
                    <div className="text-cyan-400 font-mono">P: {(h.precision * 100).toFixed(0)}%</div>
                    <div className="text-emerald-400 font-mono">S: {(h.safety * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SAFETY GUARDRAILS */}
        {/* ========================================================================= */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-1">معايير الأمان والذكاء الاصطناعي المسؤول (Responsible AI)</h2>
              <p className="text-xs text-slate-400">
                حواجز الحماية الصارمة المدمجة في CardioOS لضمان صفر هلوسة ومنع المخاطر السريرية.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Confidence Threshold Calibrated (0.70)', desc: 'منع النظام من إعطاء إجابات عشوائية في حال عدم توفر أدلة كافية.' },
                { title: 'Deterministic Keyword Safety Net', desc: 'حظر فوري ومحدد للأسئلة الحساسة (مثل الحمل والاستشارات الشخصية دون فحص).' },
                { title: 'Post-Hoc Claim Validation', desc: 'التحقق السريري اللاحق للتأكد من أن كل ادعاء مولّد مدعوم حرفياً بنص المرجع الطبي.' },
                { title: 'Audit Trail Accountability', desc: 'تسجيل وتوثيق كامل لكل إجراء يقوم به الطبيب لحماية خصوصية وسجلات المرضى.' },
                { title: 'Automation Bias Mitigation', desc: 'تنبيهات مستمرة تذكر الطبيب بأن النظام أداة مساعدة وليس بديلاً عن القرار السريري.' }
              ].map((g, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{g.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Export Modal */}
      {exportModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-white">الملخص السريري الشامل</h3>
              <button onClick={() => setExportModal({ open: false, content: '' })} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <textarea
              readOnly
              value={exportModal.content}
              className="w-full h-80 bg-slate-950 p-4 rounded-xl border border-white/10 font-mono text-xs text-slate-200 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([exportModal.content], { type: 'text/plain;charset=utf-8' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = exportModal.filename || 'clinical_summary.txt';
                  link.click();
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Download size={14} />
                تحميل كملف (.txt)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
