import { MemorySystem } from './memorySystem';
import { getCurriculum } from './curriculum';
import { AuraGraphState, UserProfile } from '../types';

export interface AutonomousAction {
    type: 'CONTENT_HARVEST' | 'PEDAGOGICAL_ADJUST' | 'HABIT_NUDGE' | 'SCENARIO_GEN';
    payload: any;
    priority: number;
}

export class AuraAutonomousAgent {
    private static instance: AuraAutonomousAgent;
    private isRunning: boolean = false;
    private checkInterval: number = 30000; // 30 seconds for the "thinking" loop

    private constructor() {}

    public static getInstance(): AuraAutonomousAgent {
        if (!AuraAutonomousAgent.instance) {
            AuraAutonomousAgent.instance = new AuraAutonomousAgent();
        }
        return AuraAutonomousAgent.instance;
    }

    /**
     * Start the autonomous "Brain" loop
     */
    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("🧠 AURA-AIM: Autonomous Brain Online.");
        this.thinkLoop();
    }

    private async thinkLoop() {
        while (this.isRunning) {
            const user = MemorySystem.getActiveUser();
            if (user) {
                await this.processIntelligence(user);
            }
            await new Promise(resolve => setTimeout(resolve, this.checkInterval));
        }
    }

    private async processIntelligence(user: UserProfile) {
        console.log(`[AURA-AIM] Processing intelligence for ${user.name}...`);
        
        // 1. ScoutEngine: Check for missing context based on background
        const graph = MemorySystem.getGraphState();
        if (graph && graph.knowledge_graph.user_background === 'Não definido') {
            console.log("[AURA-AIM] Action: Requesting user background for ScoutEngine.");
        }

        // 2. GraphArchitect: Analyze weaknesses and adjust curriculum
        this.analyzeWeaknesses(graph);

        // 3. Sentinel: Check for idle time
        this.checkPersistence(user);
    }

    private analyzeWeaknesses(graph: AuraGraphState | null) {
        if (!graph) return;
        const weaknesses = graph.knowledge_graph.current_weakness;
        if (weaknesses.length > 0) {
            console.log(`[AURA-AIM] Architect: Planning remedial blitz for: ${weaknesses.join(', ')}`);
            // Here we would push specific remediation to the 'next_action'
        }
    }

    private checkPersistence(user: UserProfile) {
        // Logic to check last session timestamp (would need memory system update)
        // console.log("[AURA-AIM] Sentinel: User is active. Monitoring for flow state.");
    }

    /**
     * ScoutEngine: Simulates harvesting real-world content
     */
    public async harvestContent(topic: string): Promise<AutonomousAction> {
        console.log(`[AURA-AIM] ScoutEngine: Searching for high-value English content about: ${topic}`);
        // This would eventually call an API or search tool
        return {
            type: 'CONTENT_HARVEST',
            payload: { topic, suggestion: `Real-world article found about ${topic}` },
            priority: 1
        };
    }
}

export const AuraAgent = AuraAutonomousAgent.getInstance();
