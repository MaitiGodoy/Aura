
import { UserProfile, SessionReport } from '../types';
import { SupabaseService } from './supabase';

// PERSISTENT STORAGE ENABLED.
const STORAGE_KEY = 'aura_persistent_memory';

let currentSessionUser: UserProfile | null = null;
let sessionContext: string[] = [];

// Helper to save current state
const persistMemory = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    user: currentSessionUser,
    context: sessionContext
  }));
};

// Helper to load state
const loadMemory = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentSessionUser = data.user;
            sessionContext = data.context || [];
        } catch (e) {
            console.error("Failed to load persistent memory", e);
        }
    }
};

// Load on initialization
loadMemory();

export const MemorySystem = {
  // --- SESSION OPERATIONS ---
  
  createSessionUser: (name: string, difficultyOverride?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE_SHOCK' | 'AUTO', phase?: any): UserProfile => {
    // If we have a user in persistent memory, try to respect it
    if (currentSessionUser) {
        if (name && name !== 'STUDENT' && name !== currentSessionUser.name) {
            currentSessionUser.name = name;
            persistMemory();
        }
        return currentSessionUser;
    }
    
    // Fallback/Initial Creation
    let savedDifficulty: any = difficultyOverride;
    
    if (!savedDifficulty) {
        try {
            const history = localStorage.getItem('session_history');
            if (history) {
                const reports = JSON.parse(history);
                if (reports.length > 0) {
                    const lastReport = reports[reports.length - 1];
                    if (lastReport.flowRating === 'GODLIKE') savedDifficulty = 'ADVANCED';
                    else if (lastReport.flowRating === 'SOLID') savedDifficulty = 'INTERMEDIATE';
                    else savedDifficulty = 'BEGINNER';
                }
            }
        } catch (e) {}
    }

    if (!savedDifficulty) savedDifficulty = 'AUTO';

    currentSessionUser = {
      id: 'PLAYER_1',
      name: name || 'PLAYER',
      difficultyLevel: savedDifficulty,
      currentPhase: phase
    };
    sessionContext = [];
    persistMemory(); 
    return currentSessionUser;
  },

  getActiveUser: (): UserProfile | null => {
    return currentSessionUser;
  },

  getDifficultyLevel: (): string => {
      return currentSessionUser?.difficultyLevel || 'BEGINNER';
  },

  setDifficultyLevel: (level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE_SHOCK') => {
      if (currentSessionUser) {
          currentSessionUser.difficultyLevel = level;
          persistMemory();
      }
  },

  updateMemory: (category: string, value: any) => {
    console.log(`[PERSISTENT MEMORY] ${category}:`, value);
    sessionContext.push(`${category}: ${JSON.stringify(value)}`);
    if (sessionContext.length > 20) sessionContext.shift(); // Increased to keep longer context
    persistMemory();
  },

  logSessionStart: () => {
    console.log("SESSION STARTED - PERSISTENT MEMORY LOADED");
  },

  logCardTrigger: (card: any) => {
    console.log("CARD TRIGGERED", card);
    MemorySystem.updateMemory('card_seen', card.term);
  },

  /** Save session report locally and optionally sync to Supabase */
  saveSessionReport: (report: SessionReport) => {
    try {
      const existing = localStorage.getItem('session_history');
      const history = existing ? JSON.parse(existing) : [];
      history.push(report);
      localStorage.setItem('session_history', JSON.stringify(history));
      // Sync to Supabase if available
      SupabaseService.saveSessionReport(report);
    } catch (e) {
      console.error("Failed to save session report", e);
    }
  },

  /** Load session history (local first, Supabase as secondary) */
  loadSessionHistory: async (): Promise<SessionReport[]> => {
    try {
      const local = localStorage.getItem('session_history');
      if (local) return JSON.parse(local);
    } catch (e) {}
    // Fall back to Supabase
    const remote = await SupabaseService.loadSessionHistory();
    if (remote.length > 0) {
      localStorage.setItem('session_history', JSON.stringify(remote));
    }
    return remote;
  },

  // Generates the Dynamic Prompt based on PERSISTENT CONTEXT
  getContextPrompt: (): string => {
    const homeworkHistory = localStorage.getItem('homework_history');
    const grammarGaps = localStorage.getItem('grammar_gaps');

    return `
    === 🧠 AURA PERSISTENT MEMORY ===
    PLAYER: ${currentSessionUser?.name.toUpperCase() || 'GUEST'}
    METHODOLOGY_PHASE: ${currentSessionUser?.currentPhase || 'PHASE_0'}
    DIFFICULTY_LEVEL: ${currentSessionUser?.difficultyLevel || 'BEGINNER'}
    LONG_TERM_INTERACTIONS: ${sessionContext.join(' | ')}
    KNOWN GRAMMAR GAPS: ${grammarGaps || 'None recorded yet.'}
    PREVIOUS HOMEWORK COUNT: ${homeworkHistory ? JSON.parse(homeworkHistory).length : 0}
    
    USE ALL PERSISTENT CONTEXT TO TAILOR THE TEACHING.
    KEEP THE ENERGY AT MAXIMUM.
    `;
  },

  saveHomework: (exercise: string, answer: string) => {
    try {
      const existing = localStorage.getItem('homework_history');
      const history = existing ? JSON.parse(existing) : [];
      history.push({
        id: Date.now().toString(),
        timestamp: Date.now(), 
        date: new Date().toISOString(),
        exercise,
        answer
      });
      localStorage.setItem('homework_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save homework", e);
    }
  },

  recordGrammarGap: (gap: string) => {
    try {
      const existing = localStorage.getItem('grammar_gaps') || '';
      const gaps = existing ? existing.split(',').map(g => g.trim()) : [];
      if (!gaps.includes(gap)) {
        gaps.push(gap);
        localStorage.setItem('grammar_gaps', gaps.join(', '));
      }
    } catch (e) {
      console.error("Failed to record grammar gap", e);
    }
  }
};
