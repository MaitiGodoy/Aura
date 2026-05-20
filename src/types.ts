
export type CardType = 'VOCAB' | 'DRILL' | 'LEGENDARY' | 'SESSION_END' | 'TRANSLATION' | 'CONTEXT' | 'CORRECTION' | 'BRAINSCAPE' | 'CHALLENGE' | 'MEMORY_GAP' | 'EXPRESSION';
export type SemanticColor = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'yellow';

export interface ConceptCardData {
  term: string;
  definition: string;
  phonetic: string;
  context?: string;
  imageUrl?: string;
  type?: CardType;
  semanticColor?: SemanticColor;
  hint?: string;
  isChallenge?: boolean;
  exampleSentence?: string;
  exampleTranslation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudioTranscription?: boolean;
  actionRequired?: 'LOGIN_GOOGLE' | 'NONE';
}

export enum AppState {
  IDLE = 'IDLE',
  HUB = 'HUB',
  LIVE_SESSION = 'LIVE_SESSION',
  TEXT_CHAT = 'TEXT_CHAT',
  SESSION_SUMMARY = 'SESSION_SUMMARY',
  SESSION_HISTORY = 'SESSION_HISTORY'
}

export type LiveGameMode = 'FREE_TALK' | 'VOCAB_FOCUS' | 'GRAMMAR_PRACTICE' | 'RAPID_DRILL' | 'DECODE' | 'ICON_MODE' | 'BRAINSCAPE' | 'GROQ_PIPELINE';

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  userId: string | null;
}

export interface AudioVisualizerData {
  volume: number;
}

export interface UserProfile {
  id: string;
  name: string;
  difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE_SHOCK' | 'AUTO';
  currentPhase?: 'PHASE_0' | 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'PHASE_4';
}

export interface PronunciationFeedback {
  targetWord: string;
  userPhonetic: string;
  accuracyScore: number;
  feedback: string;
  syllableBreakdown?: { syllable: string; correct: boolean; tip?: string }[];
  specificErrors?: string[];
  nativePhonetic?: string;
}

export interface SessionReport {
  durationSeconds: number;
  cardsCollected: ConceptCardData[];
  wordsPracticed: number;
  accuracyRate: number;
  flowRating: string;
  difficultyLevel?: string;
  aiBrief?: string;
  timestamp?: number;
}
