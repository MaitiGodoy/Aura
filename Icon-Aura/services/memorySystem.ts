
import { UserProfile, AuraGraphState } from '../types';

// PERSISTENT STORAGE ENABLED.
const STORAGE_KEY = 'aura_persistent_memory';
const USERS_DB_KEY = 'aura_local_users'; // Stores username -> password map

let currentSessionUser: UserProfile | null = null;
let sessionContext: string[] = [];
let graphState: AuraGraphState | null = null;

const getStateKey = (userId: string) => `aura_graph_state_${userId}`;

// Helper to save current state
const persistMemory = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    user: currentSessionUser,
    context: sessionContext
  }));
  if (graphState && currentSessionUser) {
    localStorage.setItem(getStateKey(currentSessionUser.id), JSON.stringify(graphState));
  }
};

// Helper to load state
const loadMemory = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentSessionUser = data.user;
            sessionContext = data.context || [];
            
            // Load specific graph state for the active user
            if (currentSessionUser) {
                const savedGraph = localStorage.getItem(getStateKey(currentSessionUser.id));
                if (savedGraph) {
                    graphState = JSON.parse(savedGraph);
                }
            }
        } catch (e) {
            console.error("Failed to load persistent memory", e);
        }
    }
};

// Load on initialization
loadMemory();

export const MemorySystem = {
  // --- SESSION OPERATIONS ---
  
  authenticateLocalUser: (username: string, password: string): { success: boolean, user?: UserProfile, error?: string } => {
    username = username.trim().toLowerCase();
    if (!username || !password) return { success: false, error: 'Preencha todos os campos.' };

    const usersDbStr = localStorage.getItem(USERS_DB_KEY);
    const usersDb = usersDbStr ? JSON.parse(usersDbStr) : {};

    // Verifica se usuário existe na autenticação estrita
    if (!usersDb[username]) {
      return { success: false, error: 'Usuário não encontrado. Vá para a tela de cadastro.' };
    }

    if (usersDb[username] !== password) {
      return { success: false, error: 'Senha incorreta.' };
    }

    // Define o usuário ativo
    currentSessionUser = {
      id: username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      coins: 0,
      difficultyLevel: 'AUTO',
      currentPhase: 'PHASE_0'
    };

    // Carrega o Graph State do usuário
    const savedGraph = localStorage.getItem(getStateKey(username));
    if (savedGraph) {
      graphState = JSON.parse(savedGraph);
    } else {
      graphState = {
        student_id: username,
        last_checkpoint: 'MOD_00_AULA_01_EXEC_01', 
        knowledge_graph: {
          assimilated_concepts: [],
          current_weakness: [],
          user_background: 'Não definido'
        },
        next_action: 'START_PROMPT_DIRECT_LINE'
      };
    }
    
    sessionContext = [];
    persistMemory();
    return { success: true, user: currentSessionUser };
  },

  registerLocalUser: (username: string, password: string): { success: boolean, user?: UserProfile, error?: string } => {
    username = username.trim().toLowerCase();
    if (!username || !password) return { success: false, error: 'Preencha todos os campos.' };
    if (password.length < 4) return { success: false, error: 'A senha deve ter no mínimo 4 caracteres.' };

    const usersDbStr = localStorage.getItem(USERS_DB_KEY);
    const usersDb = usersDbStr ? JSON.parse(usersDbStr) : {};

    if (usersDb[username]) {
      return { success: false, error: 'Este nome de usuário já está em uso.' };
    }

    // Cadastra novo usuário
    usersDb[username] = password;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));

    // Define o usuário ativo (Login imediato)
    currentSessionUser = {
      id: username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      coins: 0,
      difficultyLevel: 'AUTO',
      currentPhase: 'PHASE_0'
    };

    // Inicializa o Graph State
    graphState = {
      student_id: username,
      last_checkpoint: 'MOD_00_AULA_01_EXEC_01', 
      knowledge_graph: {
        assimilated_concepts: [],
        current_weakness: [],
        user_background: 'Não definido'
      },
      next_action: 'START_PROMPT_DIRECT_LINE'
    };
    
    sessionContext = [];
    persistMemory();
    return { success: true, user: currentSessionUser };
  },

  logout: () => {
    currentSessionUser = null;
    graphState = null;
    sessionContext = [];
    localStorage.removeItem(STORAGE_KEY);
  },

  getGraphState: (): AuraGraphState | null => {
    return graphState;
  },

  // Novo: Controle de Estado de UI (Eixo 1 & 2)
  getUIStatePayload: (openCardId: string | null, brainscapeInput: string | null): string => {
    const payload = {
      active_session: {
        current_context: currentSessionUser?.currentPhase || "MOD_00_START",
        ui_state: {
          open_cards: openCardId ? [openCardId] : [],
          brainscape_metrics: {
            active_flashcard: (currentSessionUser?.currentPhase as string) === 'BRAINSCAPE' ? "FC_ACTIVE" : null,
            user_filled_input: brainscapeInput || ""
          }
        }
      }
    };
    return JSON.stringify(payload, null, 2);
  },

  updateGraphState: (updates: Partial<AuraGraphState>) => {
    if (graphState) {
      graphState = { ...graphState, ...updates };
      persistMemory();
    }
  },

  createSessionUser: (name: string, difficultyOverride?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE_SHOCK' | 'AUTO', phase?: any): UserProfile => {
    // If we have a user in persistent memory, try to respect it
    if (currentSessionUser) {
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
      coins: 0,
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

  // Generates the Dynamic Prompt based on PERSISTENT CONTEXT
  getContextPrompt: (): string => {
    const homeworkHistory = localStorage.getItem('homework_history');
    const grammarGaps = localStorage.getItem('grammar_gaps');

    const graphPayload = graphState ? JSON.stringify(graphState, null, 2) : 'Aura Graph State Missing';

    return `
    === 🧠 AURA PERSISTENT MEMORY ===
    PLAYER: ${currentSessionUser?.name.toUpperCase() || 'GUEST'}
    METHODOLOGY_PHASE: ${currentSessionUser?.currentPhase || 'PHASE_0'}
    DIFFICULTY_LEVEL: ${currentSessionUser?.difficultyLevel || 'BEGINNER'}
    LONG_TERM_INTERACTIONS: ${sessionContext.join(' | ')}
    KNOWN GRAMMAR GAPS: ${grammarGaps || 'None recorded yet.'}
    PREVIOUS HOMEWORK COUNT: ${homeworkHistory ? JSON.parse(homeworkHistory).length : 0}
    
    [STATE SYNC PAYLOAD]
    ${graphPayload}
    
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
