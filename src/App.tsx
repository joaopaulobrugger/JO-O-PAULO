import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trash2, 
  Trophy, 
  AlertCircle,
  HelpCircle,
  X,
  Sparkles,
  Tv,
  Shuffle,
  Play,
  Pause,
  Repeat,
  ChevronRight,
  Info
} from "lucide-react";

// Bingo Number Ranges
const RANGES: Record<string, [number, number]> = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

// Map number to its corresponding Bingo Letter
function getBingoLetter(num: number): string {
  if (num >= 1 && num <= 15) return "B";
  if (num >= 16 && num <= 30) return "I";
  if (num >= 31 && num <= 45) return "N";
  if (num >= 46 && num <= 60) return "G";
  if (num >= 61 && num <= 75) return "O";
  return "";
}

// Convert numbers 1-75 to Portuguese written words
function getNumberInWordsPt(num: number): string {
  const units = ["", "Um", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove"];
  const teens = ["Dez", "Onze", "Doze", "Treze", "Quatorze", "Quinze", "Dezesseis", "Dezessete", "Dezoito", "Dezenove"];
  const tens = ["", "Dez", "Vinte", "Trinta", "Quarenta", "Cinquenta", "Sessenta", "Setenta"];

  if (num < 10) return units[num];
  if (num >= 10 && num < 20) return teens[num - 10];
  
  const ten = Math.floor(num / 10);
  const unit = num % 10;
  
  if (unit === 0) {
    return tens[ten];
  } else {
    return `${tens[ten]} e ${units[unit].toLowerCase()}`;
  }
}

// Get the visual theme configuration for each letter
interface BallTheme {
  name: string;
  gradient: string;
  shadow: string;
  glow: string;
  textColor: string;
}

function getBallTheme(letter: string): BallTheme {
  switch (letter) {
    case "B":
      return {
        name: "Ouro Real",
        gradient: "from-amber-300 via-amber-500 to-amber-700",
        shadow: "shadow-amber-500/30",
        glow: "border-amber-400 bg-amber-50",
        textColor: "text-amber-600"
      };
    case "I":
      return {
        name: "Rubi Flame",
        gradient: "from-rose-400 via-rose-600 to-rose-800",
        shadow: "shadow-rose-600/30",
        glow: "border-rose-400 bg-rose-50",
        textColor: "text-rose-600"
      };
    case "N":
      return {
        name: "Safira Índigo",
        gradient: "from-blue-400 via-indigo-600 to-indigo-800",
        shadow: "shadow-indigo-600/30",
        glow: "border-indigo-400 bg-indigo-50",
        textColor: "text-indigo-600"
      };
    case "G":
      return {
        name: "Esmeralda Verde",
        gradient: "from-emerald-400 via-emerald-600 to-emerald-800",
        shadow: "shadow-emerald-500/30",
        glow: "border-emerald-400 bg-emerald-50",
        textColor: "text-emerald-600"
      };
    case "O":
      return {
        name: "Fogo Coral",
        gradient: "from-orange-400 via-fuchsia-600 to-fuchsia-800",
        shadow: "shadow-fuchsia-600/30",
        glow: "border-fuchsia-400 bg-fuchsia-50",
        textColor: "text-fuchsia-600"
      };
    default:
      return {
        name: "Padrão",
        gradient: "from-slate-400 via-slate-600 to-slate-800",
        shadow: "shadow-slate-500/30",
        glow: "border-slate-400 bg-slate-50",
        textColor: "text-slate-600"
      };
  }
}

// Custom web audio synthesizer for satisfying feedback (no external files needed)
function playSynthesizedSound(type: "shuffle" | "chime") {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    if (type === "shuffle") {
      // Short click/mechanical sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === "chime") {
      // Beautiful layered announcement bell
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5 Note
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Slide to A5
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now); // E5 Note
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // Slide to C6
      
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.9);
    }
  } catch (err) {
    console.warn("AudioContext failed to start", err);
  }
}

export default function App() {
  // State
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [historyStack, setHistoryStack] = useState<number[]>([]);
  const [bigNumber, setBigNumber] = useState<number | null>(null);
  
  // Shuffling State for Globe Animation
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleNumber, setShuffleNumber] = useState<number>(1);
  const [shuffleLetter, setShuffleLetter] = useState<string>("B");
  
  const [showBingoModal, setShowBingoModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timerProgress, setTimerProgress] = useState(100);
  
  // Projection mode
  const [projectionMode, setProjectionMode] = useState(false);
  
  // Auto raffle settings
  const [autoDrawActive, setAutoDrawActive] = useState(false);
  const [autoDrawInterval, setAutoDrawInterval] = useState(8); // in seconds
  const autoDrawTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger browser Speech Synthesis
  const speakNumber = (num: number) => {
    if (!voiceEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const letter = getBingoLetter(num);
      // Clear, professional Portuguese bingo announcement with a longer delay before repeating: e.g., "Letra B... 12... [long pause]... Letra B... 12"
      const utterance = new SpeechSynthesisUtterance(`Letra ${letter}, , ${num}, , , , , , Letra ${letter}, , ${num}`);
      utterance.lang = "pt-BR";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis error:", e);
    }
  };

  // Timer for Big Ball display (7 seconds for a better full-screen reading experience)
  const startDisplayTimer = (num: number) => {
    if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setBigNumber(num);
    setTimerProgress(100);

    const duration = 7000; 
    const intervalTime = 50; 
    const steps = duration / intervalTime;
    let currentStep = 0;

    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const remainingPercent = Math.max(0, 100 - (currentStep / steps) * 100);
      setTimerProgress(remainingPercent);
      if (remainingPercent <= 0) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, intervalTime);

    displayTimeoutRef.current = setTimeout(() => {
      setBigNumber(null);
    }, duration);
  };

  // Automated raffle drawer algorithm
  const handleDrawNext = () => {
    if (isShuffling) return;
    
    // Find all remaining numbers
    const remaining = [];
    for (let i = 1; i <= 75; i++) {
      if (!selectedNumbers.has(i)) {
        remaining.push(i);
      }
    }

    if (remaining.length === 0) {
      setShowBingoModal(true);
      setAutoDrawActive(false);
      return;
    }

    // Start shuffling animation
    setIsShuffling(true);
    setBigNumber(null);
    
    let shuffleCount = 0;
    const maxShuffles = 18; // Number of fast rolls
    
    const interval = setInterval(() => {
      const tempNum = Math.floor(Math.random() * 75) + 1;
      setShuffleNumber(tempNum);
      setShuffleLetter(getBingoLetter(tempNum));
      shuffleCount++;
      
      if (soundEnabled) {
        playSynthesizedSound("shuffle");
      }

      if (shuffleCount >= maxShuffles) {
        clearInterval(interval);
        
        // Pick the real lucky number
        const luckyIndex = Math.floor(Math.random() * remaining.length);
        const luckyNum = remaining[luckyIndex];

        // Update states
        setSelectedNumbers((prev) => {
          const next = new Set(prev);
          next.add(luckyNum);
          return next;
        });
        setHistoryStack((prev) => [...prev, luckyNum]);
        setIsShuffling(false);
        
        // Show in Big Ball & Speak
        startDisplayTimer(luckyNum);
        if (soundEnabled) {
          playSynthesizedSound("chime");
        }
        speakNumber(luckyNum);
      }
    }, 70);
  };

  // Toggle single number selection manually on the board
  const handleToggleNumber = (num: number) => {
    if (isShuffling) return;
    
    const newSelected = new Set(selectedNumbers);
    if (newSelected.has(num)) {
      // Deselect
      newSelected.delete(num);
      setSelectedNumbers(newSelected);
      setHistoryStack((prev) => prev.filter((n) => n !== num));
      if (bigNumber === num) {
        setBigNumber(null);
        if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    } else {
      // Select
      newSelected.add(num);
      setSelectedNumbers(newSelected);
      setHistoryStack((prev) => [...prev, num]);
      
      if (soundEnabled) {
        playSynthesizedSound("chime");
      }
      startDisplayTimer(num);
      speakNumber(num);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (historyStack.length === 0 || isShuffling) return;
    const lastNum = historyStack[historyStack.length - 1];
    
    const newSelected = new Set(selectedNumbers);
    newSelected.delete(lastNum);
    setSelectedNumbers(newSelected);
    setHistoryStack((prev) => prev.slice(0, -1));
    
    if (bigNumber === lastNum || bigNumber === null) {
      setBigNumber(null);
      if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  };

  // Clear all selections
  const handleClearBoard = () => {
    setSelectedNumbers(new Set());
    setHistoryStack([]);
    setBigNumber(null);
    setIsShuffling(false);
    setAutoDrawActive(false);
    setShowResetConfirm(false);
    if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  // Automated raffle loop
  useEffect(() => {
    if (autoDrawActive) {
      const delayMs = autoDrawInterval * 1000;
      autoDrawTimerRef.current = setInterval(() => {
        handleDrawNext();
      }, delayMs);
    } else {
      if (autoDrawTimerRef.current) {
        clearInterval(autoDrawTimerRef.current);
      }
    }

    return () => {
      if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
    };
  }, [autoDrawActive, autoDrawInterval, selectedNumbers, isShuffling]);

  // Clean up display timers on unmount
  useEffect(() => {
    return () => {
      if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const totalDrawn = selectedNumbers.size;
  const percentageDrawn = Math.round((totalDrawn / 75) * 100);
  const lastDrawnSequence = historyStack.slice().reverse();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-start p-3 md:p-6 selection:bg-indigo-100 antialiased">
      
      {/* 3D Glassy Bingo Ball Component inside an elegant card */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col transition-all duration-300">
        
        {/* UPPER HEADER BAR */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white px-5 py-4 md:px-7 md:py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-300 flex items-center justify-center font-bold text-2xl text-slate-950 shadow-xl shadow-indigo-500/20">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  Painel do Bingo
                </h1>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-400/20 tracking-wider uppercase">
                  Pro v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                CONTROLE DA BANCA & DECK TRANSMISSÃO DE NÚMEROS
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-6 bg-slate-800/60 px-5 py-2.5 rounded-2xl border border-slate-700/50 shadow-inner">
            <div className="text-right">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Marcadas
              </span>
              <span className="text-lg md:text-xl font-black font-mono text-emerald-400">
                {totalDrawn} <span className="text-slate-500 text-xs">/ 75</span>
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700/80" />
            <div className="text-right">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Disponíveis
              </span>
              <span className="text-lg md:text-xl font-black font-mono text-cyan-400">
                {75 - totalDrawn}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700/80" />
            <div className="text-right">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Sorteio %
              </span>
              <span className="text-lg md:text-xl font-black font-mono text-indigo-400">
                {percentageDrawn}%
              </span>
            </div>
          </div>
        </div>

        {/* BINGO BALL PRESENTATION AREA */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6 md:p-8 relative overflow-hidden border-b border-slate-850">
          {/* Subtle cyber grid backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          
          {/* Colorful stage lights decoration */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Draw actions & configurations */}
            <div className="md:col-span-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                  Painel de Operações
                </span>
                <span className="text-xs font-mono text-slate-500">Ctrl + Space</span>
              </div>

              {/* Draw Random Button */}
              <button
                id="btn-draw-random"
                onClick={handleDrawNext}
                disabled={isShuffling || totalDrawn >= 75}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 active:scale-98 text-slate-950 font-black text-lg py-4 px-6 rounded-2xl transition-all duration-150 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 border-b-4 border-emerald-700/80 cursor-pointer disabled:pointer-events-none disabled:text-slate-500"
              >
                <Shuffle className={`w-5 h-5 ${isShuffling ? "animate-spin text-slate-900" : "text-slate-950"}`} />
                {isShuffling ? "Sorteando..." : "SORTEAR NÚMERO"}
              </button>

              {/* Custom Auto Draw Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-auto-draw"
                  onClick={() => setAutoDrawActive(!autoDrawActive)}
                  disabled={totalDrawn >= 75 || isShuffling}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    autoDrawActive 
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                      : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                  }`}
                >
                  {autoDrawActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5 animate-pulse" />
                      Pausar Auto
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Auto-Sorteio
                    </>
                  )}
                </button>

                <div className="bg-slate-850 px-3 py-1 rounded-xl flex items-center justify-between border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Tempo</span>
                  <select
                    value={autoDrawInterval}
                    onChange={(e) => setAutoDrawInterval(Number(e.target.value))}
                    className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={5} className="bg-slate-900">5s</option>
                    <option value={8} className="bg-slate-900">8s</option>
                    <option value={12} className="bg-slate-900">12s</option>
                    <option value={15} className="bg-slate-900">15s</option>
                  </select>
                </div>
              </div>

              {/* Utility Button Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-undo-op"
                  onClick={handleUndo}
                  disabled={historyStack.length === 0 || isShuffling}
                  className="bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700/50 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Desfazer Último
                </button>

                <button
                  id="btn-clear-op"
                  onClick={() => setShowResetConfirm(true)}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-900/50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Zerar Jogo
                </button>
              </div>

              {/* Broadcaster controls */}
              <div className="flex flex-col gap-2 mt-1 p-3 bg-slate-850/60 rounded-xl border border-slate-800">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Controle de Áudio & TV</span>
                
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300 font-medium">Chamada de Voz</span>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      voiceEnabled 
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
                        : "bg-slate-800 text-slate-500 border border-slate-750"
                    }`}
                  >
                    {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    {voiceEnabled ? "Ativa" : "Muda"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300 font-medium">Efeitos Sonoros</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      soundEnabled 
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                        : "bg-slate-800 text-slate-500 border border-slate-750"
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    {soundEnabled ? "Ligado" : "Desligado"}
                  </button>
                </div>

                <button
                  onClick={() => setProjectionMode(true)}
                  className="w-full mt-1 bg-indigo-900 hover:bg-indigo-850 text-indigo-200 font-bold text-xs py-2 px-3 rounded-xl transition-all border border-indigo-700/30 flex items-center justify-center gap-2 cursor-pointer shadow-inner"
                >
                  <Tv className="w-4 h-4 text-indigo-400" />
                  Abrir Tela de Projeção (TV)
                </button>
              </div>

            </div>

            {/* REALISTIC 3D BALL CONTAINER - CRITICAL RE-DESIGN */}
            <div className="md:col-span-5 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-b from-slate-950/80 to-slate-900/90 rounded-2xl p-6 text-white border border-slate-800 shadow-2xl relative">
              
              <AnimatePresence mode="wait">
                {isShuffling ? (
                  // Globe shuffling simulation
                  <motion.div
                    key="shuffling-stage"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-6"
                  >
                    {/* Spinning ring animation */}
                    <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-500/20 animate-spin" style={{ animationDuration: "3s" }} />
                      <div className="absolute inset-1.5 rounded-full border-4 border-dashed border-emerald-400/40 animate-spin" style={{ animationDuration: "1.5s" }} />
                      
                      {/* Virtual Bingo ball shuffling fast */}
                      <motion.div 
                        animate={{ 
                          y: [0, -12, 10, -5, 0],
                          x: [0, 8, -8, 4, 0] 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.6, 
                          type: "keyframes" 
                        }}
                        className={`w-28 h-28 rounded-full bg-gradient-to-br ${getBallTheme(shuffleLetter).gradient} flex items-center justify-center text-white border-4 border-white shadow-2xl relative select-none`}
                      >
                        <div className="absolute top-1 left-2 w-7 h-4 bg-white/25 rounded-full blur-[1.5px]" />
                        <div className="w-18 h-18 rounded-full bg-white text-slate-900 font-extrabold text-2xl flex flex-col items-center justify-center shadow-inner blur-[0.6px]">
                          <span className="text-[10px] text-slate-400 font-mono tracking-widest">{shuffleLetter}</span>
                          <span className="text-xl -mt-1 font-mono tracking-tighter">{shuffleNumber}</span>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-850 rounded-full border border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      <span className="text-[11px] font-mono tracking-widest text-indigo-300 uppercase font-black">
                        Misturando Globo...
                      </span>
                    </div>
                  </motion.div>

                ) : bigNumber !== null ? (
                  // Premium 3D Glossy Ball Display
                  <motion.div
                    key={bigNumber}
                    initial={{ scale: 0.3, opacity: 0, rotate: -30, y: 15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                    exit={{ scale: 0.7, opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    className="flex flex-col items-center relative z-10 w-full"
                  >
                    {/* Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-400/20 mb-4 shadow-sm animate-pulse">
                      <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                      <span className="text-[10px] font-bold text-indigo-300 font-mono uppercase tracking-widest">
                        ÚLTIMA PEDRA REVELADA
                      </span>
                    </div>

                    {/* Glorious 3D Glossy Ball Sphere */}
                    <div className="relative group cursor-pointer" onClick={() => speakNumber(bigNumber)} title="Clique para anunciar novamente">
                      
                      {/* Realistic shadow on the floor of the stage */}
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/60 rounded-full blur-md" />
                      
                      {/* Sphere Outer Layer */}
                      <div className={`w-36 h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br ${getBallTheme(getBingoLetter(bigNumber)).gradient} ${getBallTheme(getBingoLetter(bigNumber)).shadow} shadow-2xl flex items-center justify-center p-4 border-4 border-slate-100/90 relative select-none transform hover:scale-105 active:scale-95 transition-transform duration-150`}>
                        
                        {/* Realistic light highlight reflection (top left) */}
                        <div className="absolute top-1.5 left-5 w-12 h-6 bg-gradient-to-b from-white/45 to-transparent rounded-full rotate-[-15deg] blur-[0.5px]" />
                        
                        {/* Secondary soft reflection crescent (bottom right) */}
                        <div className="absolute bottom-2 right-5 w-8 h-4 bg-white/10 rounded-full rotate-[165deg] blur-[1px]" />

                        {/* Central Circular Badge - Traditional real bingo ball design */}
                        <div className="w-24 h-24 md:w-26 md:h-26 rounded-full bg-gradient-to-b from-white via-white to-slate-100 text-slate-900 flex flex-col items-center justify-center shadow-2xl border-2 border-slate-250 relative">
                          {/* Inner circle border ring */}
                          <div className="absolute inset-1 rounded-full border border-dashed border-slate-300/60 pointer-events-none" />
                          
                          {/* Letter on top */}
                          <span className={`text-base md:text-lg font-black tracking-widest font-mono leading-none ${getBallTheme(getBingoLetter(bigNumber)).textColor}`}>
                            {getBingoLetter(bigNumber)}
                          </span>
                          
                          {/* Giant Number below */}
                          <span className="text-4xl md:text-5xl font-black font-sans leading-none tracking-tight -mt-0.5 text-slate-950 font-sans">
                            {bigNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Spelled-out text in Portuguese (Phonetic spelling) */}
                    <div className="mt-5 text-center px-4 w-full">
                      <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase mb-1">
                        Pronúncia por Extenso
                      </span>
                      <h3 className="text-xl font-extrabold text-white tracking-wide uppercase font-sans flex items-center justify-center gap-1.5">
                        <span className={`text-2xl font-black ${getBallTheme(getBingoLetter(bigNumber)).textColor}`}>
                          {getBingoLetter(bigNumber)}
                        </span>
                        <span className="text-slate-400 text-sm font-semibold">—</span>
                        <span className="text-slate-100">{getNumberInWordsPt(bigNumber)}</span>
                      </h3>
                    </div>

                    {/* Progress bar within active timer */}
                    <div className="w-40 bg-slate-800 h-1 rounded-full mt-4 overflow-hidden border border-slate-700/50">
                      <div 
                        className={`h-full bg-gradient-to-r ${getBallTheme(getBingoLetter(bigNumber)).gradient} transition-all duration-75`}
                        style={{ width: `${timerProgress}%` }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  // Initial Waiting State
                  <motion.div
                    key="empty-stage"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-10"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-slate-850 border border-slate-800/80 flex items-center justify-center mb-4 shadow-inner">
                      <HelpCircle className="w-10 h-10 text-slate-500 animate-pulse" />
                    </div>
                    <span className="text-base font-bold text-slate-200 tracking-wide">
                      Globo Pronto para Sorteio
                    </span>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                      Clique no botão <strong className="text-emerald-400">SORTEAR NÚMERO</strong> ou escolha diretamente no painel de marcação abaixo.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RECENT DRAW HISTORY COLUMN */}
            <div className="md:col-span-3 flex flex-col gap-3 h-full justify-start md:border-l border-slate-800/80 md:pl-6 pt-4 md:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Últimas Sorteadas
                </span>
                <span className="bg-slate-800 text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded-full font-bold">
                  Histórico
                </span>
              </div>
              
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none max-h-[280px] md:overflow-y-auto">
                {lastDrawnSequence.length > 0 ? (
                  lastDrawnSequence.slice(0, 5).map((num, idx) => {
                    const theme = getBallTheme(getBingoLetter(num));
                    return (
                      <motion.div 
                        key={`${num}-${idx}`} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border shrink-0 ${
                          idx === 0 
                            ? "bg-slate-850 border-emerald-500/30 text-white shadow-md shadow-emerald-500/5" 
                            : "bg-slate-900/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        {/* Mini ball sphere style */}
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-slate-900 bg-gradient-to-br ${theme.gradient} border border-white shadow-md shadow-black/40 shrink-0 relative`}>
                          <span className="absolute top-0.5 left-1.5 w-2 h-1 bg-white/30 rounded-full" />
                          {getBingoLetter(num)}
                        </span>
                        <div className="flex flex-col">
                          <span className={`font-mono text-sm font-black leading-none ${idx === 0 ? "text-emerald-400" : "text-slate-300"}`}>
                            Número {num}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono capitalize leading-none mt-1">
                            {getNumberInWordsPt(num).toLowerCase()}
                          </span>
                        </div>
                        {idx === 0 && (
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-black uppercase font-mono ml-auto">
                            Fila [1]
                          </span>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                    <p className="italic">Nenhuma pedra sorteada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BINGO BOARD GRID - INTERACTIVE CONTROLS */}
        <div className="p-4 md:p-6 flex flex-col gap-5 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-widest font-mono">
                Painel Geral de Marcação (Clique para selecionar manualmente)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="inline-block w-3 h-3 rounded bg-emerald-500" />
              <span>Sorteado</span>
              <span className="inline-block w-3 h-3 rounded bg-slate-100 border border-slate-200 ml-2" />
              <span>Disponível</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Object.entries(RANGES).map(([letter, [start, end]]) => {
              const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
              const theme = getBallTheme(letter);

              return (
                <div key={letter} className="flex flex-col md:flex-row items-stretch gap-2.5 md:gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  
                  {/* Row Letter Header Box */}
                  <div className={`w-full md:w-16 h-10 md:h-auto bg-gradient-to-br ${theme.gradient} text-white font-black text-xl md:text-2xl flex items-center justify-center rounded-xl shadow-md shrink-0 border border-white/20 relative select-none`}>
                    <div className="absolute top-0.5 left-1 w-4 h-1.5 bg-white/20 rounded-full" />
                    {letter}
                  </div>

                  {/* 15 Columns Number Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-1.5 w-full">
                    {nums.map((num) => {
                      const isSelected = selectedNumbers.has(num);
                      return (
                        <button
                          key={num}
                          id={`num-${num}`}
                          onClick={() => handleToggleNumber(num)}
                          disabled={isShuffling}
                          className={`aspect-square rounded-xl text-sm md:text-[15px] font-black transition-all duration-150 flex flex-col items-center justify-center border shadow-sm relative overflow-hidden group cursor-pointer select-none ${
                            isSelected
                              ? `bg-gradient-to-br ${theme.gradient} border-white text-white scale-102 shadow-md ${theme.shadow} border-2`
                              : "bg-slate-50 hover:bg-white hover:border-slate-300 hover:scale-102 text-slate-700 border-slate-200"
                          }`}
                        >
                          {/* Interactive highlights for selected buttons */}
                          {isSelected ? (
                            <>
                              <div className="absolute top-0.5 left-1 w-3 h-1 bg-white/30 rounded-full" />
                              <span className="relative z-10">{num}</span>
                            </>
                          ) : (
                            <span>{num}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STATS AND GRAPHICS METRICS BAR */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-bold uppercase font-mono tracking-wider">Distribuição por Letra:</span>
            {Object.keys(RANGES).map((letter) => {
              const [start, end] = RANGES[letter];
              const count = Array.from(selectedNumbers).filter(
                (n: any) => n >= start && n <= end
              ).length;
              return (
                <div key={letter} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold font-mono text-slate-700 shadow-sm flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${getBallTheme(letter).gradient}`} />
                  {letter}: <span className="text-indigo-600">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Tip */}
          <div className="flex items-center gap-1.5 text-slate-400 font-medium font-sans">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Abra o <strong>Modo Projeção</strong> para exibir em TVs e telões.</span>
          </div>

        </div>

        {/* FOOTER INFO */}
        <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 text-center text-[11px] text-slate-400 font-medium flex flex-col md:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Bingo rainha da Paz  &bull; Homologado para Eventos e Sorteios</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
            GERADOR DE FLUXO ATIVO
          </span>
        </div>
      </div>

      {/* ====================================
          1. TELECAST PROJECTION SCREEN MODAL
         ==================================== */}
      <AnimatePresence>
        {projectionMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950 flex flex-col z-55 overflow-y-auto"
          >
            {/* Upper control header inside projection screen */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between text-white select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center font-bold text-lg text-slate-950">
                  📺
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-sans uppercase">Tela de Projeção Pública</h3>
                  <p className="text-[10px] text-slate-500 font-mono tracking-wider">Apropriado para projetar em TV ou Monitor de Alta Definição</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Voice toggle inside projection view */}
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    voiceEnabled ? "bg-slate-800 text-emerald-400" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  Voz: {voiceEnabled ? "Ativa" : "Muda"}
                </button>
                <button
                  onClick={() => setProjectionMode(false)}
                  className="bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-xs py-1.5 px-4 rounded-xl flex items-center gap-1 transition-all cursor-pointer border border-rose-400/40"
                >
                  <X className="w-4 h-4" />
                  Fechar Tela (Esc)
                </button>
              </div>
            </div>

            {/* Giant Display Arena */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center relative max-w-6xl mx-auto w-full">
              
              {/* Giant backdrop grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_2px,transparent_2px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

              <AnimatePresence mode="wait">
                {isShuffling ? (
                  // Globe shuffling animation inside projection screen
                  <motion.div
                    key="proj-shuffle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                      <div className="absolute inset-0 rounded-full border-8 border-dashed border-indigo-500/10 animate-spin" style={{ animationDuration: "3s" }} />
                      <div className="absolute inset-3 rounded-full border-8 border-dashed border-emerald-400/30 animate-spin" style={{ animationDuration: "1.5s" }} />
                      
                      <motion.div 
                        animate={{ 
                          y: [0, -25, 20, -10, 0],
                          x: [0, 15, -15, 8, 0] 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.5, 
                          type: "keyframes" 
                        }}
                        className={`w-48 h-48 rounded-full bg-gradient-to-br ${getBallTheme(shuffleLetter).gradient} flex items-center justify-center text-white border-8 border-slate-100 shadow-2xl relative select-none`}
                      >
                        <div className="absolute top-3 left-8 w-14 h-8 bg-white/25 rounded-full blur-[2px]" />
                        <div className="w-32 h-32 rounded-full bg-white text-slate-900 font-extrabold flex flex-col items-center justify-center shadow-inner">
                          <span className="text-xl text-slate-400 font-mono tracking-widest">{shuffleLetter}</span>
                          <span className="text-4xl font-mono tracking-tighter -mt-1">{shuffleNumber}</span>
                        </div>
                      </motion.div>
                    </div>

                    <div className="bg-slate-900/80 px-6 py-2 rounded-full border border-slate-800 flex items-center gap-3 shadow-lg">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-400 animate-ping" />
                      <span className="text-lg font-mono tracking-widest text-indigo-300 font-black">
                        GERANDO PRÓXIMA PEDRA DO BINGO...
                      </span>
                    </div>
                  </motion.div>

                ) : bigNumber !== null ? (
                  // Spectacular Giant Ball Display
                  <motion.div
                    key={bigNumber}
                    initial={{ scale: 0.4, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Projection text */}
                    <div className="text-slate-400 font-mono tracking-widest text-sm font-black uppercase mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                      SORTEADO AGORA
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                    </div>

                    {/* Massive 3D Ball Sphere */}
                    <div className="relative mb-8" onClick={() => speakNumber(bigNumber)}>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/70 rounded-full blur-xl" />
                      
                      <div className={`w-52 h-52 md:w-64 md:h-64 rounded-full bg-gradient-to-br ${getBallTheme(getBingoLetter(bigNumber)).gradient} ${getBallTheme(getBingoLetter(bigNumber)).shadow} shadow-2xl flex items-center justify-center border-8 border-slate-50 relative select-none cursor-pointer transform hover:scale-102 transition-transform duration-150`}>
                        {/* Shines */}
                        <div className="absolute top-2.5 left-8 w-20 h-10 bg-gradient-to-b from-white/45 to-transparent rounded-full rotate-[-15deg] blur-[0.5px]" />
                        <div className="absolute bottom-4 right-8 w-14 h-7 bg-white/10 rounded-full rotate-[165deg] blur-[1px]" />

                        {/* Central Ring */}
                        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-b from-white via-white to-slate-100 text-slate-900 flex flex-col items-center justify-center shadow-2xl border-4 border-slate-200">
                          <div className="absolute inset-1.5 rounded-full border border-dashed border-slate-300 pointer-events-none" />
                          <span className={`text-2xl md:text-3xl font-black tracking-widest font-mono leading-none ${getBallTheme(getBingoLetter(bigNumber)).textColor}`}>
                            {getBingoLetter(bigNumber)}
                          </span>
                          <span className="text-7xl md:text-8xl font-black font-sans leading-none tracking-tighter text-slate-950">
                            {bigNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Spelled-out name in large format */}
                    <div className="mb-6">
                      <h2 className="text-3xl md:text-5xl font-black tracking-wider text-white uppercase font-sans">
                        {getBingoLetter(bigNumber)} <span className="text-indigo-400 font-semibold">—</span> {getNumberInWordsPt(bigNumber)}
                      </h2>
                    </div>

                    {/* Progres bar projection */}
                    <div className="w-64 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full bg-gradient-to-r ${getBallTheme(getBingoLetter(bigNumber)).gradient} transition-all duration-75`}
                        style={{ width: `${timerProgress}%` }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  // Idle projection screen
                  <motion.div
                    key="proj-waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-slate-800 flex items-center justify-center mb-6">
                      <HelpCircle className="w-12 h-12 text-slate-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-400 uppercase tracking-widest">Aguardando Sorteio</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">Operador está preparando a próxima rodada no painel principal.</p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Projection screen footer tray with last 5 numbers & Stats */}
            <div className="bg-slate-900 p-6 border-t border-slate-800 select-none shrink-0">
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Last drawn list in big format */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Fila de Pedras Anteriores</span>
                  <div className="flex gap-3 overflow-x-auto">
                    {lastDrawnSequence.length > 0 ? (
                      lastDrawnSequence.slice(0, 5).map((num, index) => {
                        const isLatest = index === 0 && bigNumber !== null;
                        const theme = getBallTheme(getBingoLetter(num));
                        return (
                          <div 
                            key={`proj-history-${num}`}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${
                              isLatest 
                                ? "bg-indigo-900/40 border-indigo-500/30 text-white" 
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-slate-900 bg-gradient-to-br ${theme.gradient} border border-white shadow-md shadow-black/40`}>
                              {getBingoLetter(num)}
                            </span>
                            <span className="font-mono font-black text-base">{num}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-600 italic">Nenhum número sorteado até o momento.</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 shrink-0">
                  <div className="text-right">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Bolas Sorteadas</span>
                    <span className="text-3xl font-black text-emerald-400 font-mono">{totalDrawn} <span className="text-slate-600 text-sm">/ 75</span></span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Disponíveis</span>
                    <span className="text-3xl font-black text-cyan-400 font-mono">{75 - totalDrawn}</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================
          2. BINGO VICTORY CELEBRATION MODAL
         ==================================== */}
      <AnimatePresence>
        {showBingoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-indigo-100 relative overflow-hidden"
            >
              {/* Confetti-like background decor */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50" />

              <button
                onClick={() => setShowBingoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border border-indigo-100">
                <Trophy className="w-10 h-10 text-indigo-600 animate-bounce" />
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tight flex items-center justify-center gap-2">
                BINGO!
                <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
              </h2>
              
              <p className="text-lg font-bold text-slate-600 mt-3">
                Temos um vencedor na rodada!
              </p>
              
              <p className="text-sm text-slate-400 mt-2 font-mono">
                Total de números sorteados nesta partida: <span className="font-bold text-emerald-600">{totalDrawn}</span>
              </p>

              {/* Drawn list preview in modal */}
              {totalDrawn > 0 && (
                <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-2">
                    Últimos 5 Sorteados
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {historyStack.slice().reverse().slice(0, 5).map((num) => (
                      <span key={num} className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-extrabold text-slate-700 shadow-sm flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${getBallTheme(getBingoLetter(num)).gradient}`} />
                        {getBingoLetter(num)} {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowBingoModal(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-colors cursor-pointer shadow-md"
                >
                  Continuar Jogo
                </button>
                <button
                  onClick={() => {
                    setShowBingoModal(false);
                    setShowResetConfirm(true);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold py-3.5 px-5 rounded-2xl transition-colors cursor-pointer"
                >
                  Nova Partida
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================
          3. CONFIRMATION RESET MODAL
         ==================================== */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-rose-100"
            >
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>

              <h3 className="text-lg font-black text-slate-900">
                Limpar todo o Painel?
              </h3>
              
              <p className="text-sm text-slate-500 mt-2">
                Isso apagará todo o progresso do jogo atual e redefinirá o histórico. Essa ação não pode ser desfeita.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearBoard}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-600/10"
                >
                  Sim, Limpar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
