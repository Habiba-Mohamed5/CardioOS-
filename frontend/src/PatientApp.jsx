export default function PatientApp() {
  return (
    <div className="h-screen w-full bg-slate-900 overflow-hidden flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div>
          <h1 className="text-2xl font-extrabold text-rose-400">🫀 CardioOS — بوابة المرضى</h1>
        </div>
        <a href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition border border-white/10">العودة للرئيسية</a>
      </header>
      
      <div className="flex-1 w-full relative">
        <iframe 
          src="http://localhost:8501/patient_app?embedded=true" 
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Patient Portal"
        />
      </div>
    </div>
  );
}
