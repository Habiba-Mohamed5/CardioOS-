import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function VoiceInputButton({ onTranscript, textToSpeak = "", lang = "ar-EG" }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSupport, setHasSupport] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setHasSupport(false);
    }
  }, []);

  function toggleListening() {
    if (!hasSupport) {
      alert("متصفحك الحالي لا يدعم التعرف على الصوت. يُرجى تجربة Google Chrome أو Microsoft Edge.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  }

  function handleSpeak() {
    if (!('speechSynthesis' in window)) {
      alert("متصفحك لا يدعم قراءة النصوص بالصوت.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!textToSpeak.trim()) return;

    // Clean markdown/symbols from text
    const cleanText = textToSpeak.replace(/[*#_`]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar-SA";
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Speech-to-Text Button */}
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? "جاري الاستماع... اضغط للإيقاف" : "اضغط وتحدث بصوتك"}
        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
          isListening 
            ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30' 
            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
        }`}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>

      {/* Text-to-Speech Button */}
      {textToSpeak && (
        <button
          type="button"
          onClick={handleSpeak}
          title={isSpeaking ? "إيقاف القراءة الصوتية" : "استمع للإجابة بصوت الذكاء الاصطناعي"}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            isSpeaking 
              ? 'bg-cyan-500 text-slate-950 animate-bounce' 
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 border border-white/10'
          }`}
        >
          {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      )}
    </div>
  );
}
