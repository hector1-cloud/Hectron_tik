import { useState, useCallback } from "react";
import { Emotion, AvatarAnimationClass, TtsSentimentMetadata } from "../types";

export function useGeminiTtsEmotion() {
  const [animationClass, setAnimationClass] = useState<AvatarAnimationClass>("happy");
  const [emotion, setEmotion] = useState<Emotion>("HAPPY");
  const [sentimentScore, setSentimentScore] = useState<number>(0.5);
  const [latestMetadata, setLatestMetadata] = useState<TtsSentimentMetadata | null>(null);

  /**
   * Process synthesized text and optional raw Gemini TTS metadata
   * Returns calculated emotion, animation class, sentiment score, and voice config
   */
  const processTtsMetadata = useCallback((text: string, rawMetadata?: any): TtsSentimentMetadata => {
    const lower = text.toLowerCase();

    // Word categories for sentiment evaluation
    const excitedKeywords = ["increíble", "increible", "guao", "súper", "super", "ganamos", "fiesta", "celebración", "celebracion", "genial", "excelente", "vamos", "!!", "fuego", "regalo", "corona"];
    const thinkingKeywords = ["hmm", "pensando", "analizando", "quizás", "quizas", "por qué", "porque", "cómo", "como", "dónde", "donde", "pregunta", "calculando", "veamos", "?", "investigando"];
    const happyKeywords = ["hola", "bienvenidos", "bienvenido", "gracias", "placer", "feliz", "miku", "música", "musica", "sonrisa", "alegría", "alegria", "lindo", "saludos"];
    const surpriseKeywords = ["wow", "sorpresa", "impactante", "dios mío", "dios mio", "imposible", "no puede ser", "¡qué!", "que!"];
    const flirtKeywords = ["rosa", "linda", "hermosa", "cariño", "carino", "beso", "amor", "encanta", "tierna", "romántico", "romantico", "💖", "🌸"];
    const angryKeywords = ["picante", "furia", "error", "no me gusta", "molesto", "pica", "inaceptable", "malo", "feo"];
    const sadKeywords = ["triste", "lo siento", "llorar", "lástima", "lastima", "dolor", "pena", "desafortunado"];

    let calculatedEmotion: Emotion = "HAPPY";
    let calculatedAnim: AvatarAnimationClass = "happy";
    let score = 0.2; // default slightly positive
    let pitch = 1.35;
    let speed = 1.05;

    // Count matches
    const excitedCount = excitedKeywords.filter((k) => lower.includes(k)).length;
    const thinkingCount = thinkingKeywords.filter((k) => lower.includes(k)).length;
    const happyCount = happyKeywords.filter((k) => lower.includes(k)).length;
    const surpriseCount = surpriseKeywords.filter((k) => lower.includes(k)).length;
    const flirtCount = flirtKeywords.filter((k) => lower.includes(k)).length;
    const angryCount = angryKeywords.filter((k) => lower.includes(k)).length;
    const sadCount = sadKeywords.filter((k) => lower.includes(k)).length;

    // Extract raw metadata from Gemini if provided
    if (rawMetadata) {
      if (rawMetadata.emotion) {
        calculatedEmotion = rawMetadata.emotion as Emotion;
      }
      if (rawMetadata.sentimentScore !== undefined) {
        score = rawMetadata.sentimentScore;
      }
    }

    // Determine primary animation class and emotion based on highest keyword density / sentiment
    if (thinkingCount > 0 && thinkingCount >= Math.max(excitedCount, happyCount, surpriseCount, flirtCount)) {
      calculatedAnim = "thinking";
      calculatedEmotion = "IDLE";
      score = 0.0;
      pitch = 1.15;
      speed = 0.95;
    } else if (excitedCount > 0 || text.includes("!!") || score > 0.6) {
      calculatedAnim = "excited";
      calculatedEmotion = "HAPPY";
      score = 0.85;
      pitch = 1.45;
      speed = 1.15;
    } else if (flirtCount > 0) {
      calculatedAnim = "flirt";
      calculatedEmotion = "FLIRT";
      score = 0.7;
      pitch = 1.4;
      speed = 1.0;
    } else if (surpriseCount > 0) {
      calculatedAnim = "surprised";
      calculatedEmotion = "SURPRISE";
      score = 0.6;
      pitch = 1.5;
      speed = 1.2;
    } else if (angryCount > 0) {
      calculatedAnim = "angry";
      calculatedEmotion = "ANGRY";
      score = -0.6;
      pitch = 1.0;
      speed = 1.1;
    } else if (sadCount > 0) {
      calculatedAnim = "sad";
      calculatedEmotion = "SAD";
      score = -0.5;
      pitch = 0.95;
      speed = 0.85;
    } else if (happyCount > 0 || lower.includes("hola")) {
      calculatedAnim = "happy";
      calculatedEmotion = "HAPPY";
      score = 0.5;
      pitch = 1.35;
      speed = 1.05;
    }

    const matchedKeywords = [
      ...(excitedCount ? ["excited"] : []),
      ...(thinkingCount ? ["thinking"] : []),
      ...(happyCount ? ["happy"] : []),
      ...(surpriseCount ? ["surprise"] : []),
      ...(flirtCount ? ["flirt"] : []),
      ...(angryCount ? ["angry"] : []),
      ...(sadCount ? ["sad"] : []),
    ];

    const metadata: TtsSentimentMetadata = {
      text,
      emotion: calculatedEmotion,
      animationClass: calculatedAnim,
      sentimentScore: score,
      keywords: matchedKeywords,
      pitch,
      speed,
      timestamp: new Date().toISOString(),
    };

    setAnimationClass(calculatedAnim);
    setEmotion(calculatedEmotion);
    setSentimentScore(score);
    setLatestMetadata(metadata);

    return metadata;
  }, []);

  return {
    animationClass,
    setAnimationClass,
    emotion,
    setEmotion,
    sentimentScore,
    latestMetadata,
    processTtsMetadata,
    isThinking: animationClass === "thinking",
    isExcited: animationClass === "excited",
  };
}
