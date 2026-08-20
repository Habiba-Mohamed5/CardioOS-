import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BarChart3, Target, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function RagEvaluation() {
  const [activeConfig, setActiveConfig] = useState("800/0");

  const evaluationData = {
    "800/0": {
      precision1: 100,
      precision3: 83,
      foundRate: 100,
      citationAccuracy: 100,
      faithfulness: 75,
      responseSpeed: 1.2
    },
    "1600/200": {
      precision1: 75,
      precision3: 75,
      foundRate: 100,
      citationAccuracy: 100,
      faithfulness: 75,
      responseSpeed: 1.8
    },
    "2400/400": {
      precision1: 25,
      precision3: 58,
      foundRate: 100,
      citationAccuracy: 100,
      faithfulness: 75,
      responseSpeed: 2.5
    }
  };

  const activeData = evaluationData[activeConfig];

  const metrics = [
    { id: 'precision1', label: "Precision @ 1", value: activeData.precision1, icon: <Target className="text-blue-400" /> },
    { id: 'precision3', label: "Precision @ 3", value: activeData.precision3, icon: <BarChart3 className="text-emerald-400" /> },
    { id: 'foundRate', label: "Found Rate @ 3", value: activeData.foundRate, icon: <CheckCircle2 className="text-purple-400" /> },
    { id: 'citationAccuracy', label: "Citation Accuracy", value: activeData.citationAccuracy, icon: <ShieldCheck className="text-amber-400" /> },
    { id: 'faithfulness', label: "Faithfulness", value: activeData.faithfulness, icon: <Brain className="text-rose-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm"
            >
              RAG AI Engine Evaluation
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 mt-2 font-medium"
            >
              تحليل أداء نموذج الذكاء الاصطناعي السريري ومعدلات الدقة
            </motion.p>
          </div>
          <a href="/" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold backdrop-blur-md transition-all shadow-xl flex items-center gap-2 text-sm">
            العودة للرئيسية
          </a>
        </header>

        {/* Configuration Selector */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            اختر حجم تقسيم البيانات (Chunking Configuration)
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.keys(evaluationData).map((config) => (
              <button
                key={config}
                onClick={() => setActiveConfig(config)}
                className={`relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                  activeConfig === config 
                    ? 'text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] border-blue-500/50' 
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 border-white/5'
                } border backdrop-blur-sm`}
              >
                {activeConfig === config && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {config}
              </button>
            ))}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Visualizer */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-8 text-white">مؤشرات الأداء (Metrics)</h2>
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeConfig}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {metrics.map((metric, i) => (
                    <div key={metric.id} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3 font-semibold text-slate-200 text-lg">
                          {metric.icon}
                          {metric.label}
                        </div>
                        <span className="text-xl font-bold">{metric.value}%</span>
                      </div>
                      <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            metric.value >= 90 ? 'from-emerald-500 to-emerald-400' :
                            metric.value >= 70 ? 'from-blue-500 to-blue-400' :
                            metric.value >= 50 ? 'from-amber-500 to-amber-400' :
                            'from-rose-500 to-rose-400'
                          } shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <motion.div 
              key={`speed-${activeConfig}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-md shadow-2xl text-center"
            >
              <h3 className="text-slate-400 font-semibold mb-2">سرعة الاستجابة</h3>
              <div className="text-5xl font-extrabold text-white mb-2">
                {activeData.responseSpeed} <span className="text-2xl text-indigo-400">sec</span>
              </div>
              <p className="text-sm text-slate-500">متوسط وقت المعالجة</p>
            </motion.div>

            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">النتيجة النهائية</h3>
              {activeData.precision1 >= 75 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex gap-3">
                  <CheckCircle2 className="shrink-0" />
                  <p className="text-sm font-semibold">تكوين ممتاز. دقة عالية جداً في استرجاع المعلومات الطبية الصحيحة من المحاولة الأولى.</p>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex gap-3">
                  <ShieldCheck className="shrink-0" />
                  <p className="text-sm font-semibold">حجم البيانات كبير جداً مما يسبب تشتت الموديل وفقدان الدقة المباشرة.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
