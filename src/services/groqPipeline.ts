/** GroqPipeline — Character data only (colors, labels, orb states) */

export type CharacterName = 'aura' | 'icon' | 'amos' | 'gaucho';

export interface CharacterInfo {
  name: CharacterName;
  label: string;
  color: string;
  accentColor: string;
  orbListening: string;
  orbSpeaking: string;
  orbIdle: string;
  description: string;
}

export const CHARACTERS: Record<CharacterName, CharacterInfo> = {
  aura: {
    name: 'aura',
    label: 'AURA',
    color: '#00FFFF',
    accentColor: '#00E5FF',
    orbListening: 'rgba(250, 204, 21, 0.9)',
    orbSpeaking: 'rgba(34, 197, 94, 0.9)',
    orbIdle: 'rgba(255, 255, 255, 0.5)',
    description: 'Free Conversation',
  },
  icon: {
    name: 'icon',
    label: 'iCON',
    color: '#E6E6FA',
    accentColor: '#D4B4FF',
    orbListening: 'rgba(139, 92, 246, 0.9)',
    orbSpeaking: 'rgba(59, 130, 246, 0.9)',
    orbIdle: 'rgba(230, 230, 250, 0.5)',
    description: 'Structured Lessons',
  },
  amos: {
    name: 'amos',
    label: 'AMOS',
    color: '#FFB6C1',
    accentColor: '#FF69B4',
    orbListening: 'rgba(244, 114, 182, 0.9)',
    orbSpeaking: 'rgba(236, 72, 153, 0.9)',
    orbIdle: 'rgba(255, 182, 193, 0.5)',
    description: 'Spaced Repetition',
  },
  gaucho: {
    name: 'gaucho',
    label: 'GAÚCHA',
    color: '#FF8C00',
    accentColor: '#FFA500',
    orbListening: 'rgba(255, 140, 0, 0.9)',
    orbSpeaking: 'rgba(255, 165, 0, 0.9)',
    orbIdle: 'rgba(255, 140, 0, 0.5)',
    description: 'Gaúcha Mode',
  },
};
