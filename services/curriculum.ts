


export interface Lesson {
  id: string;
  title: string;
  topics: string[];
  description?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Curriculum {
  id: string;
  title: string;
  modules: Module[];
}

const ENGLISH_CURRICULUM: Curriculum[] = [
  {
    id: 'BASIC',
    title: 'BASIC LEVEL',
    modules: [
      {
        id: 'M0',
        title: 'Module 0 - Getting Started',
        lessons: [
          { id: 'L0.1', title: 'Intro: Leveling', topics: ['Introduction', 'Initial Assessment'] },
          { id: 'L0.2', title: 'Experimental: Alphabet & Numbers', topics: ['Real Sounds', 'Physical Counting'] }
        ]
      },
      {
        id: 'M1',
        title: 'Module 1 - Intro Subjects',
        lessons: [
          { id: 'L1.1', title: 'Methodology Presentation', topics: ['Immersion', 'Alphabet', 'Numbers'] }
        ]
      },
      {
        id: 'M2',
        title: 'Module 2 - Very Important Subjects',
        lessons: [
          { id: 'L2.1', title: 'Months, Seasons, Days of the Week', topics: ['Rhythm', 'Connected speech'] },
          { id: 'L2.2', title: 'Ordinal Numbers, Dates, Time', topics: ['Time', 'Stress-timed'] }
        ]
      },
      {
        id: 'M3',
        title: 'Module 3 - Verb To Be Prep',
        lessons: [
          { id: 'L3.1', title: 'Articles, Personal Pronouns', topics: ['Articles', 'Pronouns'] }
        ]
      },
      {
        id: 'M4',
        title: 'Module 4 - Verb To Be',
        lessons: [
          { id: 'L4.1', title: 'Plurals + Some and Any', topics: ['Quantities', 'Targets'] },
          { id: 'L4.2', title: 'Verb to Be + structures', topics: ['Affirmation', 'Negation'] },
          { id: 'L4.3', title: 'Contractions and Interrogative', topics: ['Interrogative', 'Brainscape'] }
        ]
      },
      {
        id: 'M5',
        title: 'Module 5 - Tools to Add',
        lessons: [
          { id: 'L5.1', title: 'Continents, Countries, Nationalities', topics: ['Countries', 'Nationality'] },
          { id: 'L5.2', title: 'Adjectives', topics: ['Characteristics', 'Flavor'] }
        ]
      },
      {
        id: 'M6',
        title: 'Module 6 - Family Tree',
        lessons: [
          { id: 'L6.1', title: 'Family Tree', topics: ['Family', 'Emotion'] }
        ]
      },
      {
        id: 'M7',
        title: 'Module 7 - There is / There Are',
        lessons: [
          { id: 'L7.1', title: 'There is / There Are', topics: ['Existence', 'Presence'] }
        ]
      },
      {
        id: 'M8',
        title: 'Module 8 - Question Words',
        lessons: [
          { id: 'L8.1', title: 'What, Where, When, Who, How, Why', topics: ['Triggers', 'Investigation'] }
        ]
      },
      {
        id: 'M9',
        title: 'Module 9 - Present Continuous',
        lessons: [
          { id: 'L9.1', title: 'Present Continuous', topics: ['Exact actions', 'Movement sound'] }
        ]
      },
      {
        id: 'M10',
        title: 'Module 10 - Music Translation',
        lessons: [
          { id: 'L10.1', title: 'Listening Skills + Vocabulary', topics: ['TPRS', 'Shadowing'] }
        ]
      },
      {
        id: 'M11',
        title: 'Module 11 - Presentation',
        lessons: [
          { id: 'L11.1', title: 'Self Presentation', topics: ['Pitch', 'Self Introduction'] }
        ]
      },
      {
        id: 'M12',
        title: 'Module 12 - Basic Dialogue',
        lessons: [
          { id: 'L12.1', title: 'De-robotizing', topics: ['Fluidity', 'Rhythm'] }
        ]
      }
    ]
  },
  {
    id: 'INTERMEDIATE',
    title: 'INTERMEDIATE LEVEL',
    modules: [
       {
        id: 'INT.M1',
        title: 'Module 1 - Daily Routine',
        lessons: [
          { id: 'LINT.1', title: 'Simple Present (Do & Does)', topics: ['Habits', 'Routine'] },
          { id: 'LINT.2', title: 'Routine + Frequency Adverbs', topics: ['Frequency'] },
          { id: 'LINT.3', title: 'Object Pronouns', topics: ['Targets'] },
          { id: 'LINT.4', title: 'Mix Creation Class', topics: ['TPRS'] }
        ]
      },
      {
        id: 'INT.M2',
        title: 'Module 2 - Talking about the Future',
        lessons: [
          { id: 'LINT.5', title: 'Will & Won\'t', topics: ['Certainties'] },
          { id: 'LINT.6', title: 'Will x Going to', topics: ['Plans', 'Intentions'] },
          { id: 'LINT.7', title: 'There Will be / Won\'t be', topics: ['Future', 'Existence'] },
          { id: 'LINT.8', title: 'Conversation: Goals', topics: ['Goals', 'Vision'] }
        ]
      },
      {
        id: 'INT.M3',
        title: 'Module 3 - Talking about the Past',
        lessons: [
          { id: 'LINT.9', title: 'Was / Were', topics: ['Past', 'State'] },
          { id: 'LINT.10', title: 'There Was / Were', topics: ['Past', 'Existence'] },
          { id: 'LINT.11', title: 'Past Regular and Irregular Verbs', topics: ['Past actions'] },
          { id: 'LINT.12', title: 'Did & Didn\'t', topics: ['Past', 'Motor lock'] },
          { id: 'LINT.13', title: 'Conversation: Childhood', topics: ['Narrative'] }
        ]
      },
      {
        id: 'INT.M4',
        title: 'Module 4 - Listening Skills',
        lessons: [
          { id: 'LINT.14', title: 'Music/Video Translation', topics: ['Immersion'] }
        ]
      },
      {
        id: 'INT.M5',
        title: 'Module 5 - Prepositions',
        lessons: [
          { id: 'LINT.15', title: 'IN / ON / AT', topics: ['Spatial', 'Temporal'] }
        ]
      },
      {
        id: 'INT.M6',
        title: 'Module 6 - Advanced Question Words',
        lessons: [
          { id: 'LINT.16', title: 'Data Extraction Triggers', topics: ['Metrics', 'Information'] }
        ]
      }
    ]
  },
  {
    id: 'ADVANCED',
    title: 'ADVANCED LEVEL',
    modules: [
       {
        id: 'ADV.M1',
        title: 'Module 1 - Suffixes and Prefixes',
        lessons: [
          { id: 'LADV.1', title: 'Comparatives and Superlatives', topics: ['Comparison', 'Impact'] },
          { id: 'LADV.2', title: 'Suffixes and Prefixes', topics: ['Modifiers'] }
        ]
      },
      {
        id: 'ADV.M2',
        title: 'Module 2 - Modal Verbs',
        lessons: [
          { id: 'LADV.3', title: 'Modal Verbs', topics: ['Intentions', 'Attitudes'] }
        ]
      },
      {
        id: 'ADV.M3',
        title: 'Module 3 - Phrasal Verbs',
        lessons: [
          { id: 'LADV.4', title: 'Phrasal Verbs', topics: ['Movement', 'Result'] },
          { id: 'LADV.5', title: 'Advanced Listening Skills', topics: ['Resistance', 'Focus'] }
        ]
      },
      {
        id: 'ADV.M4',
        title: 'Module 4 - Modal Verbs Nuance',
        lessons: [
          { id: 'LADV.6', title: 'Could, Would and Should', topics: ['Politeness', 'Register'] }
        ]
      },
      {
        id: 'ADV.M5',
        title: 'Module 5 - Present Perfect',
        lessons: [
          { id: 'LADV.7', title: 'Present Perfect Simple/Continuous', topics: ['Connection', 'Past/Present'] }
        ]
      },
      {
        id: 'ADV.M6',
        title: 'Module 6 - Quantifiers',
        lessons: [
          { id: 'LADV.8', title: 'Quantifiers', topics: ['Precision', 'Volume'] }
        ]
      },
      {
        id: 'ADV.M7',
        title: 'Module 7 - Indefinite Pronouns',
        lessons: [
          { id: 'LADV.9', title: 'Indefinite Pronouns', topics: ['Scope'] }
        ]
      },
      {
        id: 'ADV.M8',
        title: 'Module 8 - Check-in Check-out',
        lessons: [
          { id: 'LADV.10', title: 'Hotel & Airport', topics: ['Roleplay', 'Friction'] }
        ]
      },
      {
        id: 'ADV.M9',
        title: 'Module 9 - Slang',
        lessons: [
          { id: 'LADV.11', title: 'Wanna, Gonna, Gotta, Lemme', topics: ['Street', 'Fluidity'] }
        ]
      },
      {
        id: 'ADV.M10',
        title: 'Module 10 - Abilities',
        lessons: [
          { id: 'LADV.12', title: 'Can, Can\'t, May, Might', topics: ['Permissions', 'Capacities'] }
        ]
      },
      {
        id: 'ADV.M11',
        title: 'Module 11 - Restaurant',
        lessons: [
          { id: 'LADV.13', title: 'Restaurant Simulation', topics: ['Orders', 'Negotiation'] }
        ]
      },
      {
        id: 'ADV.M12',
        title: 'Module 12 - Sequencers',
        lessons: [
          { id: 'LADV.14', title: 'Sequencers & Connectors', topics: ['Argumentation', 'Concatenation'] }
        ]
      },
      {
        id: 'ADV.M13',
        title: 'Module 13 - Verbs of Obligation',
        lessons: [
          { id: 'LADV.15', title: 'Must, Have to & Should', topics: ['Duties', 'Necessities'] }
        ]
      },
      {
        id: 'ADV.M14',
        title: 'Module 14 - Conditionals',
        lessons: [
          { id: 'LADV.16', title: 'First & Second Conditionals', topics: ['Hypotheses', 'Logic'] },
          { id: 'LADV.17', title: 'Third Conditional', topics: ['Past scenarios'] }
        ]
      }
    ]
  }
];

const SPANISH_CURRICULUM: Curriculum[] = [
  ...ENGLISH_CURRICULUM.map(c => ({
    ...c,
    modules: c.modules // For now, just copying English structure until translated
  }))
];

// ... add other languages similarly ...

const CURRICULA: Record<string, Curriculum[]> = {
  'en': ENGLISH_CURRICULUM,
  'es': SPANISH_CURRICULUM,
  // Add other languages
};

export const getCurriculum = (language: string): Curriculum[] => {
    return CURRICULA[language] || ENGLISH_CURRICULUM;
};
