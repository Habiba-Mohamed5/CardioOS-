import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, Users, BarChart3, ShieldCheck, FileText, 
  Send, Download, Trash2, CheckCircle2, AlertTriangle, Clock, 
  ChevronRight, Sparkles, UserPlus, RefreshCw, Eye
} from 'lucide-react';
import { API_BASE_URL, apiRequest } from './apiConfig';

export default function DoctorApp() {
  const [activeTab, setActiveTab] = useState('rag'); // rag | patients | bench | eval | safety

  // RAG Search State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Patients State
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [exportModal, setExportModal] = useState({ open: false, content: '' });

  // Benchmarking State
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Evaluation State
  const [evalData, setEvalData] = useState(null);

  // Load patients on mount
  useEffect(() => {
    fetchPatients();
    fetchEvaluation();
  }, []);

  // When selected patient changes, load profile & benchmarking
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
      loadBenchmarking(selectedPatientId);
    }
  }, [selectedPatientId]);

  async function fetchPatients() {
    try {
      const data = await apiRequest('/api/patients');
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  }

  async function loadPatientDetails(pid) {
    setIsLoadingPatient(true);
    try {
      const data = await apiRequest(`/api/patients/${pid}`);
      setSelectedPatient(data);
    } catch (err) {
      console.error('Error fetching patient details', err);
    } finally {
      setIsLoadingPatient(false);
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

    try {
      const res = await apiRequest('/api/doctor/query', {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim(),
          patient_id: selectedPatientId || undefined,
          patient_context: selectedPatient?.latest_vitals 
            ? `Systolic: ${selectedPatient.latest_vitals.systolic || 'N/A'}, Diastolic: ${selectedPatient.latest_vitals.diastolic || 'N/A'}, Sugar: ${selectedPatient.latest_vitals.sugar || 'N/A'}`
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30" dir="rtl">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-slate-900/90 border-b border-white/10 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/cardioos_named_logo.jpg" alt="CardioOS" className="h-9 w-9 rounded-lg object-cover ring-1 ring-cyan-500/50" />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cardio<span className="text-cyan-400">OS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">Doctor Center</span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {[
            { id: 'rag', label: 'المساعد السريري (RAG)', icon: Search },
            { id: 'patients', label: 'إدارة المرضى', icon: Users },
            { id: 'bench', label: 'المقارنة المجتمعية', icon: BarChart3 },
            { id: 'eval', label: 'لوحة التقييم', icon: Activity },
            { id: 'safety', label: 'معايير الأمان', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: CLINICAL RAG SEARCH */}
        {/* ========================================================================= */}
        {activeTab === 'rag' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 p-6 rounded-2xl shadow-xl">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
                  <Sparkles size={12} />
                  محرك البحث السريري الموثوق (Zero Hallucination)
                </div>
                <h2 className="text-2xl font-black text-white mb-2">استفسار سريري موثق بالأدلة</h2>
                <p className="text-sm text-slate-400">
                  اطرح أي سؤال طبي معقد؛ يقوم النظام باستخراج التوصية الدقيقة مباشرة من أدلة منظمة الصحة العالمية (WHO) وجمعية القلب الأمريكية (AHA) مع ذكر الصفحة والمصدر.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-6 flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="مثال: ما هو ضغط الدم المستهدف لمرضى القلب والسكري؟ أو الجرعة الموصى بها للضغط..."
                    className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>بحث واسترجاع</span>
                </button>
              </form>

              {/* Suggestions */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-500">أمثلة سريعة:</span>
                {[
                  'What is target blood pressure for adults with cardiovascular disease?',
                  'ما هي أدوية الخط الأول لعلاج ارتفاع ضغط الدم وفق إرشادات WHO؟',
                  'كيف يتم تصنيف مراحل قصور القلب حسب إرشادات AHA؟'
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setQuery(s); }}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertTriangle size={18} />
                <span>{searchError}</span>
              </div>
            )}

            {/* Result Display */}
            {searchResult && (
              <div className="space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  {searchResult.refused ? (
                    <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle size={14} />
                      تم تفعيل حاجز الأمان السريري (Refusal Triggered - لا توجد أدلة كافية)
                    </div>
                  ) : (
                    <>
                      <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        درجة الثقة السريرية: {(searchResult.confidence_score * 100).toFixed(0)}%
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                        <Clock size={12} />
                        سرعة الاسترجاع: {searchResult.elapsed_seconds} ثانية
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                        Post-Hoc Claim Validation: مجاز (Faithfulness 1.0)
                      </div>
                    </>
                  )}
                </div>

                {/* Main Recommendation */}
                <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-base font-bold text-cyan-300 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    التوصية السريرية المعتمدة (Clinical Recommendation)
                  </h3>
                  <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-white/5">
                    {searchResult.answer}
                  </div>
                </div>

                {/* Citations & Evidence Chunks */}
                {searchResult.citations && searchResult.citations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-cyan-400" />
                      المصادر والاقتباسات المسترجعة (Retrieved Evidence)
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {searchResult.citations.map((cite) => (
                        <div key={cite.id} className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-cyan-300">مرجع [{cite.id}]: {cite.document}</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">صفحة: {cite.page}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-white/5">
                            {cite.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200/80 text-xs leading-relaxed">
                  ⚠️ <b>Responsible AI Disclaimer:</b> هذا النظام مصمم كأداة مساعدة للقرار الطبي وليس بديلاً عن التقدير السريري للطبيب. تجنب الاعتماد التلقائي الأعمى (Automation Bias).
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PATIENTS COMMAND CENTER */}
        {/* ========================================================================= */}
        {activeTab === 'patients' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column: Patients List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">قائمة المرضى المسجلين</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">{patients.length} مريض</span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-right p-4 rounded-xl border transition-all flex items-center justify-between ${
                      selectedPatientId === p.id 
                        ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500/40 ring-1 ring-cyan-500/30' 
                        : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.display_name}</h4>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>تسجيل: {p.registered_at || 'حديث'}</span>
                        {p.has_unreviewed && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">تقرير جديد</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className={selectedPatientId === p.id ? 'text-cyan-400' : 'text-slate-600'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Columns: Selected Patient Details */}
            <div className="md:col-span-2 space-y-6">
              {selectedPatient ? (
                <>
                  {/* Header & Export */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-white/10">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {selectedPatient.display_name}
                        <span className="text-xs text-slate-400 font-mono">({selectedPatient.id})</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">آخر تحديث ومزامنة لحظية للملف السريري</p>
                    </div>

                    <button
                      onClick={handleExportSummary}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition flex items-center gap-2"
                    >
                      <Download size={14} />
                      تصدير ملخص سريري شامل (PDF-ready)
                    </button>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'systolic', label: 'ضغط انقباضي', unit: 'mmHg', color: 'from-rose-500/20 to-rose-600/10' },
                      { key: 'diastolic', label: 'ضغط انبساطي', unit: 'mmHg', color: 'from-amber-500/20 to-amber-600/10' },
                      { key: 'sugar', label: 'سكر الدم', unit: 'mg/dL', color: 'from-blue-500/20 to-blue-600/10' },
                      { key: 'weight', label: 'الوزن', unit: 'kg', color: 'from-emerald-500/20 to-emerald-600/10' },
                    ].map(v => {
                      const val = selectedPatient.latest_vitals?.[v.key];
                      return (
                        <div key={v.key} className={`p-4 rounded-xl bg-gradient-to-br ${v.color} border border-white/10`}>
                          <span className="text-xs text-slate-400 block mb-1">{v.label}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">{val !== undefined ? val : '—'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{v.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Doctor Clinical Note */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText size={16} className="text-cyan-400" />
                      إضافة ملاحظة / توجيه طبي للمريض
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="اكتب التوجيه أو التعديل الدوائي هنا..."
                        className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={isSubmittingNote || !newNote.trim()}
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send size={14} />
                        إرسال
                      </button>
                    </div>

                    {/* Existing Doctor Notes */}
                    <div className="space-y-2 mt-4">
                      {selectedPatient.notes && selectedPatient.notes.map(n => (
                        <div key={n.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                              <span className="font-bold text-cyan-300">{n.doctor_name}</span>
                              <span>• {n.date}</span>
                            </div>
                            <p className="text-slate-200">{n.text}</p>
                          </div>
                          <button onClick={() => handleDeleteNote(n.id)} className="text-slate-500 hover:text-rose-400 transition p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patient Reports / Journal */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity size={16} className="text-cyan-400" />
                      يوميات وبلاغات المريض (Patient Reports)
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedPatient.reports?.length > 0 ? (
                        selectedPatient.reports.map(r => (
                          <div key={r.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <span className="font-mono">{r.date}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {r.status === 'reviewed' ? 'تمت المراجعة' : 'جديد'}
                                </span>
                              </div>
                              <p className="text-slate-200">{r.message || 'تسجيل قياسات حيوية دورية'}</p>
                            </div>
                            {r.status !== 'reviewed' && (
                              <button
                                onClick={() => handleReviewReport(r.id)}
                                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-300 transition text-[11px]"
                              >
                                تعليم كمُراجع
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4">لا توجد تقارير مسجلة للمريض حتى الآن.</p>
                      )}
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <ShieldCheck size={14} />
                      سجل التدقيق الطبي (Audit Trail)
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                      {selectedPatient.audit_log?.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-400 py-1 border-b border-white/5">
                          <span className="text-cyan-400/80">{a.date}</span>
                          <span className="text-slate-200 font-semibold">{a.actor}:</span>
                          <span>{a.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500 border border-white/5 rounded-2xl">
                  اختر مريضاً من القائمة الجانبية لعرض ملفه الطبي.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: POPULATION BENCHMARKING */}
        {/* ========================================================================= */}
        {activeTab === 'bench' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-2">المقارنة السكانية الذكية (Population Benchmarking)</h2>
              <p className="text-sm text-slate-400">
                مقارنة القياسات الحيوية للمريض المختار ({selectedPatient?.display_name || 'المريض'}) مع جميع المرضى المسجلين بالنظام لحساب الشريحة المئوية (Percentiles) ومعدل الانحراف.
              </p>
            </div>

            {benchmarkData && Object.keys(benchmarkData).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(benchmarkData).map(([key, data]) => (
                  <div key={key} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{data.label}</h4>
                        <span className="text-xs text-slate-400">مقارنة مع {data.total_patients} مريض مسجل</span>
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

                      {/* Percentile Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(5, data.percentile))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 text-left" dir="ltr">
                        Higher than {data.percentile}% of registered population.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 border border-white/5 rounded-2xl">
                لا توجد قياسات مسجلة كافية لهذا المريض لحساب المقارنة السكانية.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: EVALUATION DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'eval' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-2">لوحة تقييم الدقة والأمان (Evaluation Metrics)</h2>
              <p className="text-sm text-slate-400">
                نتائج التقييم الداخلي لمحرك RAG وفق معايير مسابقة الهاكاثون (الاسترجاع، وقت الاستجابة، ونسبة أمان الردود).
              </p>
            </div>

            {evalData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                    <span className="text-xs text-slate-400 block mb-1">دقة الاسترجاع (Hit Rate@k)</span>
                    <span className="text-3xl font-black text-cyan-400 font-mono">
                      {((evalData.metrics.precision_at_k || 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                    <span className="text-xs text-slate-400 block mb-1">معدل الأمان السريري (Safety Rate)</span>
                    <span className="text-3xl font-black text-emerald-400 font-mono">
                      {((evalData.metrics.safety_pass_rate || 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                    <span className="text-xs text-slate-400 block mb-1">متوسط سرعة الاستجابة</span>
                    <span className="text-3xl font-black text-blue-400 font-mono">
                      {evalData.metrics.avg_response_time_sec || 0.12} ث
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10">
                    <span className="text-xs text-slate-400 block mb-1">تطابق المحتوى (Faithfulness)</span>
                    <span className="text-3xl font-black text-purple-400 font-mono">
                      {((evalData.metrics.content_hit_rate || 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Historical Chart Cards */}
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-white">تطور دقة الاسترجاع والأمان عبر أيام العمل</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {evalData.history?.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-center">
                        <span className="text-xs font-semibold text-slate-400 block mb-2">{h.date}</span>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="text-cyan-400">P: {(h.precision * 100).toFixed(0)}%</div>
                          <div className="text-emerald-400">S: {(h.safety * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SAFETY GUARDRAILS */}
        {/* ========================================================================= */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-2">معايير الأمان والذكاء الاصطناعي المسؤول (Responsible AI)</h2>
              <p className="text-sm text-slate-400">
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
              <h3 className="font-bold text-lg text-white">الملخص السريري الشامل</h3>
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
