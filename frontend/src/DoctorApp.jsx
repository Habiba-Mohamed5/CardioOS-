import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function DoctorApp() {
  return (
    <div className="h-screen w-full bg-[#020617] overflow-hidden flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-blue-400">CardioOS — بوابة الأطباء</h1>
        </div>
        <a href="/" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all backdrop-blur-md shadow-lg">العودة للرئيسية</a>
      </header>
      
      <div className="flex-1 w-full relative">
        <iframe 
          src="https://cardioos-ai.streamlit.app/doctor_app?embedded=true" 
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Doctor Portal"
        />
      </div>
    </div>
  );
}
