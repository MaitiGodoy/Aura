
import { FunctionDeclaration, Type } from '@google/genai';

export const renderCardTool: FunctionDeclaration = {
  name: 'render_concept_card',
  description: 'Deals a Card. CRITICAL: The phonetic, definition, and instruction MUST match the term exactly.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      term: { type: Type.STRING, description: 'The English phrase/word.' },
      definition: { type: Type.STRING, description: 'The PORTUGUESE translation.' },
      phonetic: { type: Type.STRING, description: 'Brazilian phonetics. NO SYMBOLS like / or []. Just the raw sound.' },
      instruction: { type: Type.STRING, description: 'Actionable instruction.' },
      cardType: { type: Type.STRING }
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
          mode: { type: Type.STRING, enum: ['FREE_TALK', 'VOCAB_BLITZ', 'GRAMMAR_GAUNTLET', 'RAPID_FIRE', 'DECODE', 'BRAINSCAPE'] }
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
  description: 'Provides visual feedback on pronunciation accuracy.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetWord: { type: Type.STRING },
      userPhonetic: { type: Type.STRING, description: 'What the user actually sounded like' },
      accuracyScore: { type: Type.NUMBER, description: '0-100' },
      feedback: { type: Type.STRING }
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
