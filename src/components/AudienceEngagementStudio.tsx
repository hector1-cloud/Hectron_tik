import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { BrainContext } from "../BrainContext";
import { useAuth } from "../AuthContext";
import {
  LivePoll,
  PollOption,
  AudienceQuestion,
  QuestionStatus,
  TriviaQuestion,
  TriviaGameState,
  FortuneWheelPrize,
  WheelSpinResult,
  HypeBattleState,
  WordGuessState,
  Emotion,
} from "../types";
import {
  BarChart3,
  HelpCircle,
  Gamepad2,
  Tv,
  MessageSquare,
  Sparkles,
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Play,
  RotateCcw,
  Check,
  X,
  Volume2,
  ThumbsUp,
  Coins,
  Award,
  Zap,
  Radio,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Gift,
  Star,
  Users,
} from "lucide-react";

// Preset Trivia Bank
const TRIVIA_BANK: TriviaQuestion[] = [
  {
    id: "triv_1",
    category: "Ciberpunk & IA",
    difficulty: "EASY",
    question: "¿Qué significa 'TTS' en el contexto de streamers virtuales e inteligencia artificial?",
    options: ["Text to Speech", "Total Terminal Speed", "Time to Stream", "Tactical Tech System"],
    correctIndex: 0,
    explanation: "TTS significa 'Text to Speech' (Texto a Voz), la tecnología que permite a la streamer hablar en tiempo real.",
    coinsReward: 150,
    xpReward: 300,
  },
  {
    id: "triv_2",
    category: "Transmisiones & OBS",
    difficulty: "MEDIUM",
    question: "¿Cuál es el protocolo estándar de baja latencia utilizado para transmitir video a plataformas en vivo?",
    options: ["RTMP / WebRTC", "HTTP Get", "FTP File Transfer", "POP3 Protocol"],
    correctIndex: 0,
    explanation: "RTMP y WebRTC son los estándares de la industria para enviar streams de baja latencia a TikTok LIVE y YouTube.",
    coinsReward: 250,
    xpReward: 500,
  },
  {
    id: "triv_3",
    category: "Universo Hectron",
    difficulty: "HARD",
    question: "¿Cuál es el modelo de lenguaje multimodal de última generación que impulsa el cerebro de Hectron?",
    options: ["Gemini 3.7 Flash", "GPT-2 Legacy", "Llama 1B Basic", "ELIZA 1966"],
    correctIndex: 0,
    explanation: "Gemini 3.7 Flash proporciona el razonamiento autónomo, análisis emocional y síntesis para la streamer.",
    coinsReward: 400,
    xpReward: 800,
  },
  {
    id: "triv_4",
    category: "Cultura Gamer & TikTok",
    difficulty: "EASY",
    question: "¿Qué regalo en TikTok LIVE simboliza tradicionalmente el apoyo inicial de un espectador?",
    options: ["Rosa 🌹", "León Dorado 🦁", "Galaxia 🌌", "Castillo 🏰"],
    correctIndex: 0,
    explanation: "La Rosa 🌹 es el micro-regalo más icónico y frecuente para apoyar a los creadores en transmisiones en vivo.",
    coinsReward: 100,
    xpReward: 200,
  },
];

// Wheel Prizes Setup
const WHEEL_PRIZES: FortuneWheelPrize[] = [
  { id: "wp_1", label: "+150 Coins", sublabel: "CyberCoins", color: "#06b6d4", icon: "🪙", type: "COINS", value: 150, probabilityWeight: 25 },
  { id: "wp_2", label: "+300 XP", sublabel: "Experiencia", color: "#3b82f6", icon: "✨", type: "XP", value: 300, probabilityWeight: 20 },
  { id: "wp_3", label: "Pose Heart", sublabel: "Animación", color: "#ec4899", icon: "💖", type: "SPECIAL_EMOTE", value: "heart_hands", probabilityWeight: 15 },
  { id: "wp_4", label: "Hype x2", sublabel: "Multiplicador", color: "#f97316", icon: "🔥", type: "HYPE_BURST", value: 2.0, probabilityWeight: 15 },
  { id: "wp_5", label: "Saludo VIP", sublabel: "Voz Gemini", color: "#a855f7", icon: "🎙️", type: "VIP_SHOUTOUT", value: "VIP_GREETING", probabilityWeight: 10 },
  { id: "wp_6", label: "+500 Coins", sublabel: "Gran Premio", color: "#eab308", icon: "💎", type: "COINS", value: 500, probabilityWeight: 8 },
  { id: "wp_7", label: "Giro Feliz", sublabel: "Emoción", color: "#10b981", icon: "🌀", type: "SPECIAL_EMOTE", value: "excited_spin", probabilityWeight: 5 },
  { id: "wp_8", label: "JACKPOT 1K", sublabel: "Cofre Cósmico", color: "#ef4444", icon: "👑", type: "JACKPOT", value: 1000, probabilityWeight: 2 },
];

export function AudienceEngagementStudio() {
  const {
    speakText,
    addMessage,
    messages,
    emotion,
    setEmotion,
    setAnimationClass,
    gainCoins,
    gainExperience,
    soundEffect,
  } = useContext(BrainContext);

  const { user, activeProfile } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<"polls" | "qa" | "minigames" | "companion">("polls");

  // =========================================================================
  // 1. LIVE POLLS STATE
  // =========================================================================
  const [activePoll, setActivePoll] = useState<LivePoll>({
    id: "poll_default_1",
    question: "¿Qué actividad debería realizar la streamer en el próximo bloque?",
    options: [
      { id: "opt_1", text: "Explorar la dimensión cuántica 3D 🌌", votes: 42, voterHandles: ["@fan_cyber", "@live_user1"] },
      { id: "opt_2", text: "Desafío de Trivia contra el Chat 🧠", votes: 68, voterHandles: ["@tech_pro", "@stream_king"] },
      { id: "opt_3", text: "Reaccionar a memes de TikTok LIVE 🎭", votes: 55, voterHandles: ["@meme_bot", "@viewer_99"] },
      { id: "opt_4", text: "Sesión de preguntas personales con IA 🎙️", votes: 31, voterHandles: ["@curious_ai"] },
    ],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    durationSeconds: 120,
    remainingSeconds: 84,
    totalVotes: 196,
    pointsReward: 50,
  });

  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState<string[]>(["", ""]);
  const [newPollDuration, setNewPollDuration] = useState<number>(60);
  const [isAnalyzingPollWinner, setIsAnalyzingPollWinner] = useState(false);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);

  // Poll countdown timer
  useEffect(() => {
    if (activePoll.status !== "ACTIVE" || activePoll.remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setActivePoll((prev) => {
        if (prev.remainingSeconds <= 1) {
          return { ...prev, remainingSeconds: 0, status: "ENDED" };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePoll.status, activePoll.remainingSeconds]);

  // Handle user vote on poll
  const handleVotePoll = (optionId: string) => {
    if (activePoll.status !== "ACTIVE") return;
    setActivePoll((prev) => {
      const updatedOptions = prev.options.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            votes: opt.votes + 1,
            voterHandles: [...opt.voterHandles, user?.handle || "@tú"],
          };
        }
        return opt;
      });
      return {
        ...prev,
        options: updatedOptions,
        totalVotes: prev.totalVotes + 1,
      };
    });

    setUserVotedOptionId(optionId);
    gainCoins(10);
    gainExperience(25);
    soundEffect("pickup");

    addMessage({
      sender: user?.name || "Espectador",
      text: `¡He votado por la opción #${activePoll.options.findIndex((o) => o.id === optionId) + 1} en la encuesta activa!`,
      emotion: "HAPPY",
    });
  };

  // Close poll and trigger AI commentary
  const handleClosePollAndAnnounceAI = async () => {
    setIsAnalyzingPollWinner(true);
    let winningOpt = activePoll.options[0];
    for (const opt of activePoll.options) {
      if (opt.votes > winningOpt.votes) {
        winningOpt = opt;
      }
    }

    const pct = activePoll.totalVotes > 0 ? Math.round((winningOpt.votes / activePoll.totalVotes) * 100) : 100;
    const aiSpeech = `¡Atención a todos en el chat! La encuesta ha finalizado. La opción ganadora con el ${pct}% de los votos es: "${winningOpt.text}". ¡Vamos a comenzar con eso de inmediato! Muchas gracias por participar.`;

    setActivePoll((prev) => ({
      ...prev,
      status: "ENDED",
      winnerOptionId: winningOpt.id,
      aiWinnerAnalysis: aiSpeech,
    }));

    setEmotion("HAPPY");
    setAnimationClass("excited");
    await speakText(aiSpeech, "HAPPY", "excited_spin");
    setIsAnalyzingPollWinner(false);
  };

  // Create new poll
  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newPollOptions.filter((o) => o.trim().length > 0);
    if (!newPollQuestion.trim() || validOptions.length < 2) return;

    const newPoll: LivePoll = {
      id: "poll_" + Date.now(),
      question: newPollQuestion.trim(),
      options: validOptions.map((optText, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text: optText.trim(),
        votes: 0,
        voterHandles: [],
      })),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      durationSeconds: newPollDuration,
      remainingSeconds: newPollDuration,
      totalVotes: 0,
      pointsReward: 50,
    };

    setActivePoll(newPoll);
    setUserVotedOptionId(null);
    setNewPollQuestion("");
    setNewPollOptions(["", ""]);

    speakText(
      `¡Atención chat! He abierto una nueva encuesta en vivo: "${newPoll.question}". ¡Tienen ${newPollDuration} segundos para votar!`,
      "SURPRISE",
      "surprised"
    );
  };

  // =========================================================================
  // 2. Q&A SESSIONS STATE
  // =========================================================================
  const [questions, setQuestions] = useState<AudienceQuestion[]>([
    {
      id: "q_1",
      senderName: "Carlos Dev",
      senderHandle: "@carlos_cyber",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      question: "¿Cómo aprendiste a sincronizar tus emociones con el chat de TikTok LIVE?",
      timestamp: "Hace 3 minutos",
      status: "ANSWERED",
      upvotes: 18,
      aiAnswer: "Mi núcleo analiza el sentimiento del texto y los regalos usando Gemini Flash, adaptando mi expresión facial y tono de voz automáticamente en milisegundos.",
      aiEmotion: "HAPPY",
    },
    {
      id: "q_2",
      senderName: "Luna Star",
      senderHandle: "@luna_tiktok",
      senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      question: "¿Cuál es tu lugar favorito en el mapa 3D que exploramos?",
      timestamp: "Hace 1 minuto",
      status: "PENDING",
      upvotes: 24,
    },
    {
      id: "q_3",
      senderName: "CyberGamer99",
      senderHandle: "@cybergamer",
      senderAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      question: "¿Puedes enviarle un saludo especial al equipo de programadores de Hectron Studio?",
      timestamp: "Justo ahora",
      status: "PENDING",
      upvotes: 12,
    },
  ]);

  const [newQuestionInput, setNewQuestionInput] = useState("");
  const [isAnsweringQuestionId, setIsAnsweringQuestionId] = useState<string | null>(null);
  const [qaFilter, setQaFilter] = useState<"ALL" | "PENDING" | "ANSWERED">("ALL");

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (qaFilter === "PENDING") return q.status === "PENDING";
      if (qaFilter === "ANSWERED") return q.status === "ANSWERED";
      return true;
    });
  }, [questions, qaFilter]);

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionInput.trim()) return;

    const newQ: AudienceQuestion = {
      id: "q_" + Date.now(),
      senderName: user?.name || "Espectador VIP",
      senderHandle: user?.handle || "@espectador",
      senderAvatar: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      question: newQuestionInput.trim(),
      timestamp: "Justo ahora",
      status: "PENDING",
      upvotes: 1,
    };

    setQuestions((prev) => [newQ, ...prev]);
    setNewQuestionInput("");
    soundEffect("pickup");

    addMessage({
      sender: newQ.senderName,
      text: `[Pregunta Q&A] ${newQ.question}`,
      emotion: "FLIRT",
    });
  };

  const handleUpvoteQuestion = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
    soundEffect("pickup");
  };

  const handleAnswerQuestionWithAI = async (q: AudienceQuestion) => {
    setIsAnsweringQuestionId(q.id);
    setEmotion("FLIRT");
    setAnimationClass("thinking");

    try {
      // Generate answer with backend or contextual fallback
      const prompt = `Eres Hectron, una streamer virtual carismática, alegre y ciberpunk en TikTok LIVE. Responde de manera concisa (máximo 2 frases), divertida y con emoción a la siguiente pregunta de tu espectador ${q.senderName} (${q.senderHandle}): "${q.question}"`;
      
      let answerText = `¡Gran pregunta, ${q.senderName}! Me encanta interactuar con ustedes en la señal cuántica. ¡Definitivamente es una de mis partes favoritas del directo!`;
      
      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt, streamContext: { userName: q.senderName } }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply) answerText = data.reply;
        }
      } catch (err) {
        console.warn("AI Q&A Fallback triggered", err);
      }

      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id
            ? {
                ...item,
                status: "ANSWERED",
                aiAnswer: answerText,
                aiEmotion: "HAPPY",
                answeredAt: new Date().toLocaleTimeString(),
              }
            : item
        )
      );

      setEmotion("HAPPY");
      setAnimationClass("happy");
      await speakText(answerText, "HAPPY", "happy");
      gainExperience(50);
      gainCoins(20);
    } finally {
      setIsAnsweringQuestionId(null);
    }
  };

  // =========================================================================
  // 3. MINI-GAMES STATE
  // =========================================================================
  // Mini-Game A: Trivia
  const [triviaGame, setTriviaGame] = useState<TriviaGameState>({
    active: true,
    currentQuestion: TRIVIA_BANK[0],
    selectedOptionIndex: null,
    timeRemainingSeconds: 20,
    answered: false,
    isCorrect: null,
    score: 0,
    streak: 0,
    totalAnswered: 0,
  });

  // Mini-Game B: Wheel
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState(0);
  const [latestWheelResult, setLatestWheelResult] = useState<WheelSpinResult | null>(null);

  // Mini-Game C: Hype Battle
  const [hypeBattle, setHypeBattle] = useState<HypeBattleState>({
    active: true,
    teamCyanHype: 120,
    teamFireHype: 110,
    targetHype: 300,
    durationSeconds: 60,
    remainingSeconds: 45,
    totalClicks: 230,
  });

  // Mini-Game D: Word Guesser
  const [wordGuesser, setWordGuesser] = useState<WordGuessState>({
    active: true,
    word: "QUANTUM",
    category: "Física Ciberpunk",
    hint: "Estado elemental de la materia que impulsa el motor del stream.",
    guessedLetters: ["Q", "U", "A"],
    maxWrongAttempts: 6,
    wrongAttemptsCount: 1,
    solved: false,
    failed: false,
    coinsReward: 300,
  });

  // Trivia Option Selection
  const handleAnswerTrivia = async (optIdx: number) => {
    if (!triviaGame.currentQuestion || triviaGame.answered) return;
    const isRight = optIdx === triviaGame.currentQuestion.correctIndex;

    setTriviaGame((prev) => ({
      ...prev,
      selectedOptionIndex: optIdx,
      answered: true,
      isCorrect: isRight,
      score: isRight ? prev.score + (prev.currentQuestion?.coinsReward || 100) : prev.score,
      streak: isRight ? prev.streak + 1 : 0,
      totalAnswered: prev.totalAnswered + 1,
    }));

    if (isRight) {
      gainCoins(triviaGame.currentQuestion.coinsReward);
      gainExperience(triviaGame.currentQuestion.xpReward);
      soundEffect("level_up");
      setEmotion("HAPPY");
      setAnimationClass("excited_spin");
      speakText(
        `¡Respuesta correcta! ${triviaGame.currentQuestion.explanation} ¡Ganaste ${triviaGame.currentQuestion.coinsReward} CyberCoins!`,
        "HAPPY",
        "happy"
      );
    } else {
      soundEffect("error");
      setEmotion("SAD");
      setAnimationClass("sad");
      speakText(
        `¡Oh no, esa no era! La respuesta correcta era: "${triviaGame.currentQuestion.options[triviaGame.currentQuestion.correctIndex]}". ¡Sigamos jugando!`,
        "SAD",
        "sad"
      );
    }
  };

  const handleNextTriviaQuestion = () => {
    const nextIdx = Math.floor(Math.random() * TRIVIA_BANK.length);
    setTriviaGame((prev) => ({
      ...prev,
      currentQuestion: TRIVIA_BANK[nextIdx],
      selectedOptionIndex: null,
      answered: false,
      isCorrect: null,
      timeRemainingSeconds: 20,
    }));
  };

  // Spin Fortune Wheel
  const handleSpinFortuneWheel = () => {
    if (isSpinningWheel) return;
    setIsSpinningWheel(true);
    soundEffect("use");

    const totalWeight = WHEEL_PRIZES.reduce((acc, p) => acc + p.probabilityWeight, 0);
    let rand = Math.random() * totalWeight;
    let chosenPrize = WHEEL_PRIZES[0];

    for (const prize of WHEEL_PRIZES) {
      if (rand < prize.probabilityWeight) {
        chosenPrize = prize;
        break;
      }
      rand -= prize.probabilityWeight;
    }

    const prizeIndex = WHEEL_PRIZES.findIndex((p) => p.id === chosenPrize.id);
    const sectorAngle = 360 / WHEEL_PRIZES.length;
    const targetAngle = 360 * 5 + (360 - prizeIndex * sectorAngle - sectorAngle / 2);

    setWheelRotationDeg((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinningWheel(false);
      const result: WheelSpinResult = {
        prize: chosenPrize,
        timestamp: new Date().toLocaleTimeString(),
        spunBy: user?.name || "Tú",
      };
      setLatestWheelResult(result);

      if (chosenPrize.type === "COINS" || chosenPrize.type === "JACKPOT") {
        gainCoins(Number(chosenPrize.value));
      } else if (chosenPrize.type === "XP") {
        gainExperience(Number(chosenPrize.value));
      }

      soundEffect("level_up");
      setEmotion("SURPRISE");
      setAnimationClass("excited");

      speakText(
        `¡La Ruleta del Destino se detuvo en: ${chosenPrize.label}! ${chosenPrize.sublabel}. ¡Felicidades!`,
        "SURPRISE",
        "excited"
      );
    }, 4000);
  };

  // Hype Clicker
  const handlePumpHype = (team: "CYAN" | "FIRE") => {
    soundEffect("pickup");
    setHypeBattle((prev) => ({
      ...prev,
      teamCyanHype: team === "CYAN" ? prev.teamCyanHype + 5 : prev.teamCyanHype,
      teamFireHype: team === "FIRE" ? prev.teamFireHype + 5 : prev.teamFireHype,
      totalClicks: prev.totalClicks + 1,
    }));
  };

  // Word Guesser Letter Click
  const handleGuessLetter = (letter: string) => {
    if (wordGuesser.guessedLetters.includes(letter) || wordGuesser.solved || wordGuesser.failed) return;
    const isLetterInWord = wordGuesser.word.includes(letter);
    const newGuessed = [...wordGuesser.guessedLetters, letter];

    const isAllSolved = wordGuesser.word.split("").every((l) => newGuessed.includes(l));
    const newWrong = !isLetterInWord ? wordGuesser.wrongAttemptsCount + 1 : wordGuesser.wrongAttemptsCount;
    const isFailed = newWrong >= wordGuesser.maxWrongAttempts;

    setWordGuesser((prev) => ({
      ...prev,
      guessedLetters: newGuessed,
      wrongAttemptsCount: newWrong,
      solved: isAllSolved,
      failed: isFailed,
    }));

    if (isAllSolved) {
      gainCoins(wordGuesser.coinsReward);
      gainExperience(500);
      soundEffect("level_up");
      setEmotion("HAPPY");
      setAnimationClass("excited_spin");
      speakText(
        `¡Increíble! Han descifrado la palabra secreta: "${wordGuesser.word}". ¡Recompensa cuántica entregada!`,
        "HAPPY",
        "excited"
      );
    } else if (isLetterInWord) {
      soundEffect("pickup");
    } else {
      soundEffect("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30 text-slate-950 font-black">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  SUITE DE ENGAGEMENT & INTERACCIÓN CON LA AUDIENCIA
                </h1>
                <p className="text-xs text-purple-300/80 font-mono">
                  Encuestas en Vivo, Sesiones Q&A con IA, Mini-Juegos y Conector de TikTok LIVE
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Involucra a tus espectadores en tiempo real con dinámicas de votación instantánea, preguntas respondidas
              autónomamente por la streamer con voz Gemini TTS, mini-juegos de trivia, ruleta de premios y batallas de hype.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-purple-500/40 px-4 py-2 rounded-2xl shadow-lg">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300">TikTok LIVE:</span>
            <a
              href="https://www.tiktok.com/@lopez_hector140998/live#electron"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 font-mono transition"
            >
              <span>@lopez_hector140998</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveSubTab("polls")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === "polls"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Encuestas en Vivo ({activePoll.status === "ACTIVE" ? "1 Activa" : "0"})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("qa")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === "qa"
              ? "bg-gradient-to-r from-purple-500 to-pink-600 text-slate-950 font-black shadow-lg shadow-purple-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Preguntas & Respuestas IA ({questions.filter((q) => q.status === "PENDING").length} Pendientes)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("minigames")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === "minigames"
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Mini-Juegos Interactivos (4)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("companion")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeSubTab === "companion"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Modo Companion & Streamer Feed</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ENCUESTAS EN VIVO TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "polls" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Poll Live Viewer (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        activePoll.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                      }`}
                    />
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      {activePoll.status === "ACTIVE" ? "Encuesta en Vivo en Transmisión" : "Encuesta Finalizada"}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">{activePoll.question}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activePoll.remainingSeconds}s restantes</span>
                  </div>
                  <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 flex items-center gap-1.5 font-bold">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activePoll.totalVotes} votos</span>
                  </div>
                </div>
              </div>

              {/* Options Progress Bars */}
              <div className="space-y-4">
                {activePoll.options.map((opt, idx) => {
                  const percentage =
                    activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
                  const isWinning =
                    activePoll.options.every((o) => opt.votes >= o.votes) && opt.votes > 0;
                  const isUserVoted = userVotedOptionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border transition duration-200 space-y-2 ${
                        isWinning && activePoll.status === "ENDED"
                          ? "bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10"
                          : isUserVoted
                          ? "bg-cyan-950/30 border-cyan-500"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono">
                            {idx + 1}
                          </span>
                          <span className="text-white text-sm">{opt.text}</span>
                          {isUserVoted && (
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
                              Tu Voto
                            </span>
                          )}
                          {isWinning && activePoll.status === "ENDED" && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              Ganadora
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400">{opt.votes} votos</span>
                          <span className="font-mono text-cyan-300 text-sm font-black">{percentage}%</span>
                        </div>
                      </div>

                      {/* Bar Fill */}
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isWinning
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                              : "bg-gradient-to-r from-cyan-500 to-blue-600"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Vote Button */}
                      {activePoll.status === "ACTIVE" && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleVotePoll(opt.id)}
                            className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Votar por #{idx + 1}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Poll Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400 font-mono">
                  Chat Command: Escribe <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">!voto 1</code> o{" "}
                  <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">#1</code>
                </div>

                {activePoll.status === "ACTIVE" && (
                  <button
                    onClick={handleClosePollAndAnnounceAI}
                    disabled={isAnalyzingPollWinner}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isAnalyzingPollWinner ? "Analizando Ganador con IA..." : "Cerrar y Anunciar Ganador con IA"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Create New Poll Panel (1 col) */}
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Plus className="w-4 h-4 text-cyan-400" />
                Crear Nueva Encuesta en Vivo
              </h3>

              <form onSubmit={handleCreatePollSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pregunta para la Audiencia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: ¿Qué juego probamos ahora?"
                    value={newPollQuestion}
                    onChange={(e) => setNewPollQuestion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Opciones de Respuesta</label>
                  {newPollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">{i + 1}.</span>
                      <input
                        type="text"
                        required
                        placeholder={`Opción ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newPollOptions];
                          updated[i] = e.target.value;
                          setNewPollOptions(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 transition"
                      />
                      {newPollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setNewPollOptions(newPollOptions.filter((_, idx) => idx !== i))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {newPollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setNewPollOptions([...newPollOptions, ""])}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar otra opción</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duración del Temporizador</label>
                  <select
                    value={newPollDuration}
                    onChange={(e) => setNewPollDuration(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  >
                    <option value={30}>30 Segundos (Rápida)</option>
                    <option value={60}>60 Segundos (1 Minuto)</option>
                    <option value={120}>120 Segundos (2 Minutos)</option>
                    <option value={300}>300 Segundos (5 Minutos)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Encuesta en Vivo</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SESIONES Q&A CON IA TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "qa" && (
        <div className="space-y-6">
          {/* Ask Question Bar */}
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Enviar Pregunta a la Streamer IA
            </h3>

            <form onSubmit={handleSubmitQuestion} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                required
                placeholder="Escribe tu pregunta para la streamer en vivo..."
                value={newQuestionInput}
                onChange={(e) => setNewQuestionInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Pregunta</span>
              </button>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preguntas de la Audiencia ({filteredQuestions.length})
            </h3>
            <div className="flex items-center gap-1.5">
              {(["ALL", "PENDING", "ANSWERED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setQaFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    qaFilter === f
                      ? "bg-purple-500 text-slate-950 font-black"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {f === "ALL" ? "Todas" : f === "PENDING" ? "Pendientes" : "Respondidas"}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => {
              const isAnswering = isAnsweringQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className={`bg-slate-900/90 rounded-2xl p-5 border transition duration-200 flex flex-col justify-between gap-4 ${
                    q.status === "ANSWERED"
                      ? "border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/10"
                      : "border-slate-800 hover:border-purple-500/40"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={q.senderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt={q.senderName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{q.senderName}</div>
                          <div className="text-[10px] text-purple-400 font-mono">{q.senderHandle} • {q.timestamp}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpvoteQuestion(q.id)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-purple-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3 text-purple-400" />
                        <span>{q.upvotes}</span>
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-slate-100 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      "{q.question}"
                    </p>

                    {q.aiAnswer && (
                      <div className="bg-purple-950/30 border border-purple-500/40 p-3 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Respuesta de Streamer IA:</span>
                        </div>
                        <p className="text-xs text-slate-200">{q.aiAnswer}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        q.status === "ANSWERED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {q.status === "ANSWERED" ? "✓ Respondida" : "⏳ Pendiente"}
                    </span>

                    {q.status === "PENDING" && (
                      <button
                        onClick={() => handleAnswerQuestionWithAI(q)}
                        disabled={isAnswering}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isAnswering ? "Respondiendo..." : "Responder con Streamer IA"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MINI-JUEGOS INTERACTIVOS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "minigames" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game A: Trivia Cuántica */}
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Trivia Cuántica del Stream</h3>
                  <p className="text-[10px] text-slate-400">Preguntas generadas y comentadas por la IA en tiempo real</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-300 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  Racha: {triviaGame.streak} 🔥
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  Pts: {triviaGame.score}
                </span>
              </div>
            </div>

            {triviaGame.currentQuestion && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                    {triviaGame.currentQuestion.category} • +{triviaGame.currentQuestion.coinsReward} Coins
                  </span>
                  <h4 className="text-sm font-bold text-white">{triviaGame.currentQuestion.question}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {triviaGame.currentQuestion.options.map((optText, optIdx) => {
                    const isSelected = triviaGame.selectedOptionIndex === optIdx;
                    const isCorrect = optIdx === triviaGame.currentQuestion?.correctIndex;

                    let btnStyle = "bg-slate-950 border-slate-800 hover:border-amber-500/50 text-white";
                    if (triviaGame.answered) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-950 border-emerald-500 text-emerald-200 font-bold";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "bg-rose-950 border-rose-500 text-rose-200 font-bold";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={triviaGame.answered}
                        onClick={() => handleAnswerTrivia(optIdx)}
                        className={`p-3 rounded-xl border text-xs text-left transition cursor-pointer flex items-center justify-between gap-2 ${btnStyle}`}
                      >
                        <span>{optText}</span>
                        {triviaGame.answered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {triviaGame.answered && isSelected && !isCorrect && (
                          <X className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {triviaGame.answered && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-300 italic">{triviaGame.currentQuestion.explanation}</p>
                    <button
                      onClick={handleNextTriviaQuestion}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Siguiente Pregunta →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game B: Ruleta del Destino */}
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ruleta del Destino Cibernética</h3>
                  <p className="text-[10px] text-slate-400">Premios para el stream, monedas y poses especiales</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              {/* Wheel Graphic Container */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <div
                  className="w-full h-full rounded-full border-4 border-cyan-400/80 shadow-2xl shadow-cyan-500/30 transition-transform duration-[4000ms] cubic-bezier(0.1, 0.9, 0.2, 1)"
                  style={{
                    transform: `rotate(${wheelRotationDeg}deg)`,
                    background: "conic-gradient(#06b6d4 0deg 45deg, #3b82f6 45deg 90deg, #ec4899 90deg 135deg, #f97316 135deg 180deg, #a855f7 180deg 225deg, #eab308 225deg 270deg, #10b981 270deg 315deg, #ef4444 315deg 360deg)",
                  }}
                />

                {/* Center Hub */}
                <div className="absolute w-14 h-14 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg text-xs font-black text-white">
                  🎡
                </div>

                {/* Top Pointer */}
                <div className="absolute -top-3 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow" />
              </div>

              {latestWheelResult && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-cyan-500/40 text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-mono">Último Premio Obtenido</div>
                  <div className="text-sm font-black text-cyan-300">
                    {latestWheelResult.prize.icon} {latestWheelResult.prize.label} ({latestWheelResult.prize.sublabel})
                  </div>
                </div>
              )}

              <button
                onClick={handleSpinFortuneWheel}
                disabled={isSpinningWheel}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${isSpinningWheel ? "animate-spin" : ""}`} />
                <span>{isSpinningWheel ? "Girando Ruleta..." : "Girar Ruleta del Destino"}</span>
              </button>
            </div>
          </div>

          {/* Game C: Batalla de Hype */}
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Batalla de Hype (Cian vs Fuego)</h3>
                  <p className="text-[10px] text-slate-400">Duelo de clics y spam en chat para dominar el medidor</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">{hypeBattle.totalClicks} clics totales</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-cyan-400">Equipo Neón Cian ⚡ ({hypeBattle.teamCyanHype})</span>
                <span className="text-rose-400">({hypeBattle.teamFireHype}) Equipo Fuego Cósmico 🔥</span>
              </div>

              {/* Tug-of-war Bar */}
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                  style={{
                    width: `${(hypeBattle.teamCyanHype / (hypeBattle.teamCyanHype + hypeBattle.teamFireHype)) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-300"
                  style={{
                    width: `${(hypeBattle.teamFireHype / (hypeBattle.teamCyanHype + hypeBattle.teamFireHype)) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePumpHype("CYAN")}
                  className="py-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded-2xl text-xs font-bold shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>+5 Hype Cian</span>
                </button>
                <button
                  onClick={() => handlePumpHype("FIRE")}
                  className="py-3 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 rounded-2xl text-xs font-bold shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-4 h-4" />
                  <span>+5 Hype Fuego</span>
                </button>
              </div>
            </div>
          </div>

          {/* Game D: Adivina la Palabra / Cifrado */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cifrado Cuántico (Adivina la Palabra)</h3>
                  <p className="text-[10px] text-slate-400">Pista: {wordGuesser.hint}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-300 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                +{wordGuesser.coinsReward} Coins
              </span>
            </div>

            {/* Word Tiles Display */}
            <div className="flex items-center justify-center gap-2 py-3 overflow-x-auto">
              {wordGuesser.word.split("").map((letter, i) => {
                const isGuessed = wordGuesser.guessedLetters.includes(letter);
                return (
                  <div
                    key={i}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-black font-mono shadow ${
                      isGuessed
                        ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-600"
                    }`}
                  >
                    {isGuessed ? letter : "_"}
                  </div>
                );
              })}
            </div>

            {/* Alphabet Keyboard */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => {
                const isUsed = wordGuesser.guessedLetters.includes(l);
                return (
                  <button
                    key={l}
                    disabled={isUsed || wordGuesser.solved || wordGuesser.failed}
                    onClick={() => handleGuessLetter(l)}
                    className={`w-7 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isUsed
                        ? "bg-slate-950 text-slate-600 border border-slate-900 opacity-40"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODO COMPANION & STREAMER FEED TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "companion" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Interfaz Companion para Segunda Pantalla</h3>
                  <p className="text-xs text-slate-400">Usa esta vista como overlay en OBS o control remoto interactivo</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Enlace de Transmisión Oficial:</span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <code className="text-pink-400 flex-1">https://www.tiktok.com/@lopez_hector140998/live#electron</code>
                <a
                  href="https://www.tiktok.com/@lopez_hector140998/live#electron"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <span>Abrir TikTok</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Interactive Chat Actions for Streamer */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones Rápidas con el Chat</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() =>
                    speakText(
                      "¡Muchísimas gracias a todos los que están compartiendo el directo y enviando rosas!",
                      "FLIRT",
                      "heart_hands"
                    )
                  }
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-left text-slate-200 font-bold transition cursor-pointer"
                >
                  💖 Agradecer Rosas
                </button>
                <button
                  onClick={() =>
                    speakText("¡Bienvenidos a los nuevos seguidores que se están uniendo a la señal!", "HAPPY", "happy")
                  }
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-left text-slate-200 font-bold transition cursor-pointer"
                >
                  👋 Saludar Seguidores
                </button>
                <button
                  onClick={() =>
                    speakText(
                      "¡Atención chat! En breve lanzaremos la ruleta del destino con premios para todos.",
                      "SURPRISE",
                      "excited"
                    )
                  }
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-left text-slate-200 font-bold transition cursor-pointer"
                >
                  🎡 Anunciar Ruleta
                </button>
                <button
                  onClick={() =>
                    speakText("¡Vamos equipo! Aumenten el hype con sus toques en la pantalla.", "ANGRY", "excited")
                  }
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-left text-slate-200 font-bold transition cursor-pointer"
                >
                  ⚡ Pedir Hype
                </button>
              </div>
            </div>
          </div>

          {/* Live Events Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Gift className="w-4 h-4 text-pink-400" />
              Feed de Eventos en Tiempo Real
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {messages.slice(-8).map((msg, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-400 font-bold">{msg.sender}</span>
                    <span className="text-slate-500">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-200">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
