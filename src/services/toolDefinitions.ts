
import { FunctionDeclaration, Type } from '@google/genai';

export const renderCardTool: FunctionDeclaration = {
  name: 'render_concept_card',
  description: 'Deals a Card. CRITICAL: The phonetic, definition, and instruction MUST match the term exactly. ALWAYS include a complete example sentence showing the term in context.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      term: { type: Type.STRING, description: 'The English phrase/word or complete sentence.' },
      definition: { type: Type.STRING, description: 'The PORTUGUESE translation.' },
      phonetic: { type: Type.STRING, description: 'Brazilian phonetics. NO SYMBOLS like / or []. Just the raw sound.' },
      instruction: { type: Type.STRING, description: 'Actionable instruction.' },
      cardType: { type: Type.STRING, description: 'VOCAB | CORRECTION | EXPRESSION | CHALLENGE | CONTEXT | MEMORY_GAP | BRAINSCAPE' },
      semanticColor: { type: Type.STRING, description: 'iCON mode color: blue=nova palavra, red=erro, green=como se diz, purple=expressão, orange=passado, yellow=futuro' },
      hint: { type: Type.STRING, description: 'Descriptive hint for Dica button. Describe the term WITHOUT revealing the word itself.' },
      exampleSentence: { type: Type.STRING, description: 'A complete example sentence using the term in context.' },
      exampleTranslation: { type: Type.STRING, description: 'Portuguese translation of the example sentence.' }
    },
    required: ['term', 'definition', 'phonetic', 'instruction', 'cardType'],
  },
};

export const switchModeTool: FunctionDeclaration = {
  name: 'switch_game_mode',
  description: 'Automatically switches the Game Mode.',
  parameters: {
      type: Type.OBJECT,
      properties: {
          mode: { type: Type.STRING, enum: ['FREE_TALK', 'VOCAB_FOCUS', 'GRAMMAR_PRACTICE', 'RAPID_DRILL', 'DECODE', 'BRAINSCAPE'] }
      },
      required: ['mode']
  }
};

export const switchDifficultyTool: FunctionDeclaration = {
  name: 'switch_difficulty',
  description: 'Adjusts the student level (BEGINNER, INTERMEDIATE, ADVANCED, NATIVE_SHOCK) based on real-time diagnosis.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      level: { type: Type.STRING, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'NATIVE_SHOCK'] }
    },
    required: ['level']
  }
};

export const analyzePronunciationTool: FunctionDeclaration = {
  name: 'analyze_pronunciation',
  description: 'Provides detailed visual feedback on pronunciation accuracy, including syllable breakdown and specific errors.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetWord: { type: Type.STRING },
      userPhonetic: { type: Type.STRING, description: 'What the user actually sounded like' },
      accuracyScore: { type: Type.NUMBER, description: '0-100' },
      feedback: { type: Type.STRING, description: 'Detailed coaching feedback explaining exactly what to fix' },
      syllableBreakdown: { type: Type.ARRAY, description: 'Array of syllables with correctness status and tips', items: { type: Type.OBJECT, properties: { syllable: { type: Type.STRING }, correct: { type: Type.BOOLEAN }, tip: { type: Type.STRING } } } },
      specificErrors: { type: Type.ARRAY, description: 'List of specific pronunciation errors found', items: { type: Type.STRING } },
      nativePhonetic: { type: Type.STRING, description: 'How a native speaker would pronounce it (Brazilian-friendly phonetics)' }
    },
    required: ['targetWord', 'userPhonetic', 'accuracyScore', 'feedback']
  }
};

export const triggerHomeworkTool: FunctionDeclaration = {
  name: 'trigger_homework',
  description: 'Triggers a written homework exercise based on the current lesson.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      exercise: { type: Type.STRING, description: 'A short description of the written task.' }
    },
    required: ['exercise']
  }
};

export const recordGrammarGapTool: FunctionDeclaration = {
  name: 'record_grammar_gap',
  description: 'Records a grammar gap found in user speech.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      gap: { type: Type.STRING, description: 'The specific grammar point the user failed.' }
    },
    required: ['gap']
  }
};

export const AURA_TOOLS = [
  renderCardTool, 
  switchModeTool, 
  analyzePronunciationTool, 
  triggerHomeworkTool, 
  recordGrammarGapTool, 
  switchDifficultyTool
];
