import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cardioos_theme');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.documentElement.classList.add('light-mode');
    }
  }, []);

  function toggleTheme() {
    if (isLight) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('cardioos_theme', 'dark');
      setIsLight(false);
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('cardioos_theme', 'light');
      setIsLight(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "التحويل للوضع الليلي الفاخر" : "التحويل للوضع الطبي الفاتح"}
      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
    >
      {isLight ? <Moon size={15} className="text-cyan-400" /> : <Sun size={15} className="text-amber-400" />}
      <span className="hidden sm:inline">{isLight ? "ليلي" : "فاتح"}</span>
    </button>
  );
}
