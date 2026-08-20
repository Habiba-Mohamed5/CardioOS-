import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Shield, BookOpen, Brain, User, UserCheck, BarChart } from 'lucide-react';
import DoctorApp from './DoctorApp';
import PatientApp from './PatientApp';
import RagEvaluation from './RagEvaluation';

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Dynamic GIF Background */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/70 to-[#020617] z-10" />
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-color z-10" />
        <img 
          src="/hero-bg.gif" 
          alt="Cinematic Background" 
          className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105"
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#020617]/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity size={18} className="text-white" />
            </span>
            Cardio<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">OS</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">المميزات السريرية</a>
            <a href="#portals" className="hover:text-white transition">بوابات الوصول</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-bold backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            النظام جاهز للتشغيل والإطلاق الفوري
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
            مستقبل الطب <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">المدعوم بالذكاء</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            أول منظومة سريرية RAG متكاملة توفر تحليلات لحظية دقيقة بناءً على أحدث الأدلة الطبية، لربط الأطباء والمرضى في بيئة آمنة وفائقة الذكاء.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#portals" className="px-10 py-5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105">
              ابدأ الاستخدام الآن
            </a>
            <a href="#features" className="px-10 py-5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-bold text-lg backdrop-blur-md transition-all hover:border-slate-500">
              استكشف النظام
            </a>
          </div>
        </motion.div>
      </div>

      {/* Floating Features */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard icon={<Activity size={28} />} title="تحليل فوري" desc="معالجة البيانات الحيوية اللحظية واكتشاف التدهور المبكر" delay={0.1} />
          <FeatureCard icon={<Shield size={28} />} title="موثوقية تامة" desc="منع الهلوسة الطبية (Zero Hallucination) بأدلة RAG" delay={0.2} />
          <FeatureCard icon={<BookOpen size={28} />} title="أدلة عالمية" desc="تكامل مباشر مع إرشادات WHO و AHA" delay={0.3} />
          <FeatureCard icon={<Brain size={28} />} title="مستشار ذكي" desc="مساعد طبيب AI يستنتج ويحلل التقارير المعقدة" delay={0.4} />
        </div>
      </div>

      {/* Portals Section */}
      <div id="portals" className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">بوابات النظام</h2>
          <p className="text-slate-400 text-lg">اختر واجهتك للبدء في استخدام CardioOS</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <PortalCard 
            to="/doctor" 
            title="بوابة الأطباء" 
            desc="لوحة تحكم سريرية شاملة، إدارة المرضى، والتنبيهات." 
            icon={<UserCheck size={48} />} 
            color="blue" 
          />
          <PortalCard 
            to="/patient" 
            title="بوابة المرضى" 
            desc="تسجيل المؤشرات اليومية والتواصل مع المستشار." 
            icon={<User size={48} />} 
            color="rose" 
          />
          <PortalCard 
            to="/evaluation" 
            title="تقييم RAG" 
            desc="عرض الأداء والدقة التحليلية لنظام الذكاء الاصطناعي." 
            icon={<BarChart size={48} />} 
            color="purple" 
          />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#020617]/80 backdrop-blur-xl py-8 text-center text-slate-500 text-sm font-semibold">
        <p>© 2026 CardioOS System. All rights reserved for clinical AI excellence.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="bg-slate-900/40 border border-white/5 hover:border-white/10 p-8 rounded-3xl text-right backdrop-blur-md transition-all group"
    >
      <div className="w-14 h-14 bg-white/5 border border-white/10 text-white flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function PortalCard({ to, title, desc, icon, color }) {
  const gradients = {
    blue: "from-blue-500/10 hover:from-blue-500/20 border-blue-500/20 hover:border-blue-500/40 text-blue-400",
    rose: "from-rose-500/10 hover:from-rose-500/20 border-rose-500/20 hover:border-rose-500/40 text-rose-400",
    purple: "from-purple-500/10 hover:from-purple-500/20 border-purple-500/20 hover:border-purple-500/40 text-purple-400"
  };

  return (
    <Link to={to} className="block">
      <motion.div 
        whileHover={{ y: -8, scale: 1.02 }}
        className={`h-full bg-gradient-to-b to-slate-900/80 border p-8 rounded-[2rem] relative overflow-hidden backdrop-blur-xl transition-all ${gradients[color]}`}
      >
        <div className="absolute -right-4 -top-4 opacity-10 scale-150 rotate-12">
          {icon}
        </div>
        <div className="mb-6">{icon}</div>
        <h3 className="text-3xl font-black mb-4 text-white">{title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-8">
          {desc}
        </p>
        <div className="inline-flex items-center gap-2 font-bold bg-white/10 px-4 py-2 rounded-full">
          دخول <span>←</span>
        </div>
      </motion.div>
    </Link>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/doctor" element={<DoctorApp />} />
        <Route path="/patient" element={<PatientApp />} />
        <Route path="/evaluation" element={<RagEvaluation />} />
      </Routes>
    </Router>
  );
}
