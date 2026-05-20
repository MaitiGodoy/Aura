/** LanguageEngine — Central de adaptação multilíngue da AURA */

export interface LanguageProfile {
  code: string;
  name: string;
  flag: string;
  phoneticSystem: string;
  commonMistakes: string[];
  macetes: string[];
  culturalNotes: string[];
  connectedSpeechRules: string[];
  trickySounds: { sound: string; tip: string }[];
}

const LANGUAGE_PROFILES: Record<string, LanguageProfile> = {
  'en': {
    code: 'en', name: 'English', flag: '🇺🇸',
    phoneticSystem: 'Stress-timed rhythm. DA-da-da. Unstressed vowels reduce to schwa /ə/.',
    commonMistakes: [
      'Brasileiro tende a pronunciar todas as letras — inglês omite muitas.',
      '"Schedule" não é "skedjul" — é "ské-dju-ol" com schwa.',
      '"Thought", "Though", "Through", "Tough" — todos têm pronúncia diferente.',
      'Brasileiro confunde "Live" (viver) com "Live" (ao vivo) — pronúncia muda.',
      'TH sonoro vs TH mudo — brasileiro faz "d" ou "f" no lugar.'
    ],
    macetes: [
      'Gonna = Going to. Wanna = Want to. Gotta = Got to. Lemme = Let me.',
      '"I dunno" = I don\'t know. "C\'mon" = Come on. "Gotcha" = Got you.',
      'Contrações são obrigatórias para soar natural: I\'m, you\'re, don\'t, won\'t.',
      'Stress-timed: "I\'m GOING to the STORE" — só as palavras importantes têm força.',
      'R vira schwa no final: "Teacher" → "tí-tchə", não "tí-tcher".'
    ],
    culturalNotes: [
      'Small talk é obrigatório: "How are you?" não é pergunta real, é saudação.',
      'Americano usa "awesome", "cool", "literally" o tempo todo.',
      '"Bless you" depois de espirro — obrigatório.',
      'Inglês usa "please" e "thank you" muito mais que português.'
    ],
    connectedSpeechRules: [
      'Linking R: "Car is" → "ca-riz"',
      'Wanna: "Want to" → "wanna" em qualquer contexto informal',
      'Gimme: "Give me" → "gimme"',
      'Dunno: "Don\'t know" → "dunno" (du-nô)',
      'Whaddaya: "What do you" → "whaddaya"'
    ],
    trickySounds: [
      { sound: 'TH (ð)', tip: 'Língua entre os dentes, vibração. "The" → "dda" (não "dê" ou "zê")' },
      { sound: 'TH (θ)', tip: 'Língua entre os dentes, sopro. "Think" → "ssínk" (não "tchink")' },
      { sound: 'R', tip: 'Língua virada pra trás, sem vibrar. "Red" → "rrréd" (não "héd")' },
      { sound: 'Schwa /ə/', tip: 'Som mais neutro do inglês. "About" → "ə-baut" (não "ei-baut")' }
    ]
  },
  'es': {
    code: 'es', name: 'Español', flag: '🇪🇸',
    phoneticSystem: 'Syllable-timed. Cada sílaba tem duração similar. Muito mais regular que inglês.',
    commonMistakes: [
      'Brasileiro acha que "H" espanhol é aspirado — é mudo, como em português.',
      '"V" e "B" têm som idêntico no espanhol — diferente do português.',
      'Confundir "Pero" (mas) com "Perro" (cão) — o RR dobrado muda tudo.',
      '"LL" não é "lh" como português — é "y" ou "j" dependendo da região.',
      'Sotaque brasileiro no espanhol — "tchau" em vez de "chau" (menos intenso).'
    ],
    macetes: [
      'Falsos amigos: "Embarazada" ≠ Embaraçada = Grávida.',
      '"Llevar" cobre "levar" E "carregar" — um verbo faz o trabalho de dois.',
      'Futuro pode ser substituído por "ir a" + infinitivo: "Voy a comer" = Comeré.',
      'Pretérito perfeito simples é mais usado que no português.',
      'Subjuntivo é muito mais frequente que no português — indispensable.'
    ],
    culturalNotes: [
      'Vosotros é usado na Espanha, não na América Latina.',
      'Sotaque argentino usa "sh" no lugar de "y/ll".',
      'Tapas e sobremesa têm horários diferentes — jantar após 21h.',
      'Formalidade: "Usted" vs "Tú" é levado a sério em contextos formais.'
    ],
    connectedSpeechRules: [
      'Sinalefa: vogal final + vogal inicial viram uma sílaba. "Lo otro" → "lwotro"',
      '"Para" reduz pra "pa" na fala rápida.',
      '"Está" vira "tá" (como no português coloquial).',
      '"Voy a" reduz pra "voa".',
      '"Dónde está" → "Dónde tá" (comum).'
    ],
    trickySounds: [
      { sound: 'R vs RR', tip: '"Pero" (R simples) vs "Perro" (RR múltiplo) — vibração prolongada no RR' },
      { sound: 'J', tip: 'Som gutural, como "r" forte do português. "Jamás" → "rramás"' },
      { sound: 'Ñ', tip: 'Igual ao português "nh". "Niño" → "ninho"' },
      { sound: 'Z (Espanha)', tip: 'Na Espanha, Z e C (antes de E/I) viram "th". "Zapato" → "thapato"' }
    ]
  },
  'fr': {
    code: 'fr', name: 'Français', flag: '🇫🇷',
    phoneticSystem: 'Syllable-timed com ênfase na última sílaba. Muitos sons nasais. Liaisons obrigatórias.',
    commonMistakes: [
      'Brasileiro pronuncia R francês como R português — é gutural, como "rr" mas mais suave.',
      'Liaisons são ignoradas por brasileiros — "Vous avez" → "vu-za-vê" (não "vu a-vê").',
      '"U" francês não existe em português — lábios arredondados como "i".',
      'E mudo no final é quase sempre pronunciado? Depende da região e contexto.',
      'Diferença entre "é" (è), "ê" (è), "e" (ə) — três sons diferentes que em português são dois.'
    ],
    macetes: [
      'Liaisons: consoante final + vogal inicial viram uma sílaba. "Petit ami" → "peti-tami".',
      '"Je" reduz pra "j\'" antes de vogal: "J\'aime", "J\'habite".',
      'Ne + verbo + pas — a negação. "Je ne sais pas" → "Je sais pas" (informal perde o "ne").',
      '"Il y a" = "Tem" / "Há" — expressão mais usada do francês.',
      'On = Nous (informal). "On va" = "Nós vamos".'
    ],
    culturalNotes: [
      'Tutoiement (tu) vs Vouvoiement (vous) — crucial para não ser rude.',
      'Francês usa "Bonjour" obrigatoriamente antes de qualquer frase.',
      'Almoço é a refeição principal na França.',
      '"Excusez-moi" + "Bonjour" antes de pedir informação — regra de ouro.'
    ],
    connectedSpeechRules: [
      'Liaison obrigatória: "Les amis" → "lé-za-mi"',
      'Enchaînement: consoante final liga na vogal inicial. "Petit enfant" → "peti-tan-fan"',
      '"Je suis" → "Chui" (informal falado)',
      '"Il n\'y a pas" → "Y a pas" (fala cotidiana)',
      '"Tu as" → "T\'as"'
    ],
    trickySounds: [
      { sound: 'R francês (ʁ)', tip: 'Som da garganta, como gargarejo suave. "Paris" → "Pa-rri"' },
      { sound: 'U vs Ou', tip: '"U" = lábios arredondados como "i". "Ou" = "u" normal. "Tu" vs "Tout"' },
      { sound: 'Nasais (an, in, on, un)', tip: 'Sai pelo nariz. "Vin" não tem o N pronunciado — só ar nasalado.' },
      { sound: 'E caduc (ə)', tip: '"Le" → som fraco, quase mudo. "Je ne" → "jne"' }
    ]
  },
  'it': {
    code: 'it', name: 'Italiano', flag: '🇮🇹',
    phoneticSystem: 'Syllable-timed. Muito regular — cada letra tem um som consistente. Dobradas são pronunciadas.',
    commonMistakes: [
      'Brasileiro não pronuncia consoantes dobradas: "Pala" (pá) vs "Palla" (bola) — diferença crucial.',
      '"GLI" não é "gli" como português — som de "lhi" com língua no céu da boca.',
      '"SC" + E/I vira "sh" — "Pesce" → "pê-she" (não "pê-sce").',
      'C e G: "C" + E/I vira "tch". "Cena" → "tchê-na" (não "sê-na").',
      'Sotaque brasileiro no italiano — entonação errada, sílabas erradas.'
    ],
    macetes: [
      'Dobradas são pronunciadas separadamente: "Fatto" = "fat-to", não "fato".',
      '"C\'è" = "Tem/Há" (singular), "Ci sono" = plural.',
      'Passato Prossimo é o passado mais usado (não o Passato Remoto, que é literário).',
      'Artigos definidos mudam conforme o som inicial: "Lo" antes de S+consoante, Z, GN.',
      'Preposições se fundem com artigos: "Di + il" = "Del", "A + il" = "Al".'
    ],
    culturalNotes: [
      'Italiano gesticula muito — é parte da comunicação.',
      '"Prego" cobre: Por favor, De nada, Como?, Pois não — contexto define.',
      'Formal: "Lei" (terceira pessoa) vs informal "Tu".',
      'Café é expresso, sempre. Cappuccino só de manhã.'
    ],
    connectedSpeechRules: [
      'Elisione: vogal final cai antes de vogal. "L\'amico", "Dov\'è".',
      'Troncamento: sílaba final cai em alguns casos. "Andar via" → "Andar via".',
      '"Che cosa" → "Che" (reduzido na fala informal).',
      '"Non c\'è" → "Nc\'è" (informal rápido).',
      '"Dove sta" → "Dov\'è" (dove+è).'
    ],
    trickySounds: [
      { sound: 'GLI (ʎ)', tip: 'Língua no céu da boca, como "lh" do português. "Figlio" → "fi-lho"' },
      { sound: 'GN (ɲ)', tip: 'Como "nh". "Bagno" → "ba-nho"' },
      { sound: 'ZZ', tip: 'Mais intenso que Z simples. "Pizza" → "pit-sa"' },
      { sound: 'SCH', tip: '"Scherzo" → "skér-tso" (não "shér-tso")' }
    ]
  },
  'de': {
    code: 'de', name: 'Deutsch', flag: '🇩🇪',
    phoneticSystem: 'Stress-timed como inglês. Muitas consoantes agrupadas. Vogais limpas e distintas.',
    commonMistakes: [
      'CH alemão não existe em português — som de "rr" suave ou "ssh" dependendo da vogal.',
      'Umlauts (ä, ö, ü) são sons distintos — não apenas "a com trema".',
      'Verbo SEMPRE na segunda posição em orações principais — erro clássico.',
      'Substantivos são sempre capitalizados — "das Haus", "der Tisch".',
      'Pronúncia de "W" alemão = "V". "Was" → "vas", não "uás".'
    ],
    macetes: [
      'Der, Die, Das — gênero não é intuitivo. Aprenda o artigo JUNTO com o substantivo.',
      'Verbos separáveis: "Ich rufe dich an" — o "an" vai pro final.',
      'Kein vs Nicht: "Kein" nega substantivo (sem artigo), "Nicht" nega o resto.',
      '"Es gibt" = "Tem/Há" (sempre singular).',
      'Ordem: Tempo → Modo → Lugar. "Ich fahre morgen mit dem Bus zur Arbeit."'
    ],
    culturalNotes: [
      'Siezen (formal) vs Duzen (informal) — crucial. Use "Sie" até ser convidado a usar "du".',
      'Pontualidade é levada extremamente a sério.',
      'Alemão é direto — "Nein" é "Não", sem rodeios.',
      '"Bitte" cobre: Por favor, De nada, e "Como?" / "Hein?".'
    ],
    connectedSpeechRules: [
      '"Ich habe" → "Ich hab\'" (informal)',
      '"Nach Hause" vs "zu Hause" — confunde todo mundo.',
      '"Wie geht es Ihnen?" → "Wie geht\'s?" (informal)',
      '"Kannst du" → "Kannste" (informal falado)',
      'Auslautverhärtung: consoante final sonora vira surda. "Tag" → "tak"'
    ],
    trickySounds: [
      { sound: 'CH (ç)', tip: 'Depois de E, I, Ä, Ö, Ü — som de "ssh" suave. "Ich" → "í-sh"' },
      { sound: 'CH (x)', tip: 'Depois de A, O, U —som gutural da garganta. "Nach" → "narr"' },
      { sound: 'Ö', tip: 'Lábios como "o", língua como "e". "Schön" → "shên"' },
      { sound: 'Ü', tip: 'Lábios como "u", língua como "i". "Über" → "ü-ber"' }
    ]
  },
  'zh': {
    code: 'zh', name: 'Mandarim', flag: '🇨🇳',
    phoneticSystem: 'Tonal — 4 tons + neutro. Cada sílaba tem tom fixo. Muda o tom, muda a palavra.',
    commonMistakes: [
      'Brasileiro ignora os tons — "Mā" (mãe) vs "Má" (cânhamo) vs "Mǎ" (cavalo) vs "Mà" (xingar).',
      'Zh, Ch, Sh vs Z, C, S — diferença crucial que brasileiro não ouve.',
      '"X" em mandarim = "ch" (como em "sh" inglês). "Xièxie" = "chiê-chiê".',
      '"Q" em mandarim = "tch" (não "qu" ocidental). "Qǐng" = "tchíng".',
      'B/D/G em mandarim NÃO são sonoros como português — são surdos não aspirados.'
    ],
    macetes: [
      'Cada caractere = uma sílaba = um tom. Não existe "palavra longa" como no ocidente.',
      'Medida: Palavras contam por caracteres, número de	letras não importa.',
      'Gramática é simples: sem conjugação, plural ou gênero. A ordem é SVO.',
      'Partícula "了" (le) indica mudança de estado ou ação completada.',
      'Perguntas com "吗" (ma) no final — só adicionar "ma" transforma frase em pergunta.'
    ],
    culturalNotes: [
      'Uso de "同志" é raro hoje em dia — e varia conforme o país. "先生/小姐" são comuns.',
      'Negócios exigem cartão de visita com as duas mãos — leia antes de guardar.',
      'Sim/Não: "Sim" nem sempre é acordo — pode ser "estou ouvindo".',
      'Hierarquia importa — use título + sobrenome, nunca só o nome.'
    ],
    connectedSpeechRules: [
      'Tom 3 + Tom 3 → Tom 2 + Tom 3. "Nǐ hǎo" → "Ní hǎo" (não "nǐ hǎo").',
      '"不" (bù) + Tom 4 → "bú" + Tom 4.',
      '"一" (yī) muda de tom dependendo do contexto — tom 1 isolado, tom 4 antes de tom 4.',
      'Neutral tone: sílabas átonas perdem o tom original.',
      'Erhua: sufixo "儿" (r) adicionado no norte da China. "哪儿" → "nǎr"'
    ],
    trickySounds: [
      { sound: 'Tons (4 + neutro)', tip: 'Mā (alto) / Má (subindo) / Mǎ (descendo-sobe) / Mà (descendo) / Ma (neutro)' },
      { sound: 'Zh vs Z', tip: '"Zh" = língua enrolada (retroflexo). "Z" = normal. "Zhī" vs "Zī"' },
      { sound: 'X vs Sh', tip: '"X" = "ch" sorrindo (como "sh" mas com língua nos dentes). "Sh" = retroflexo' },
      { sound: 'Q vs Ch', tip: '"Q" = "tch" com lábios sorrindo. "Ch" = retroflexo com lábios arredondados.' }
    ]
  },
  'ja': {
    code: 'ja', name: 'Japanese', flag: '🇯🇵',
    phoneticSystem: 'Mora-timed. Cada "mora" tem duração fixa. Ritmo constante como metrônomo.',
    commonMistakes: [
      'Brasileiro não distingue "tsu" (つ) de "su" (す) — "Tsunami" não é "sunami".',
      'R japonês não existe em português — entre R e L, com língua batendo no céu da boca.',
      'Vogais longas vs curtas — "Obaasan" (avó) vs "Obaasan" (tia) — duração muda.',
      'Partículas (は, が, を) são omitidas ou trocadas por brasileiros.',
      '"F" japonês não é igual ao português — lábios não se tocam (sopra-se).'
    ],
    macetes: [
      'Não tem gênero, número, ou conjugação por pessoa — alívio total.',
      'Hiragana + Katakana + Kanji: aprenda os silabários PRIMEIRO.',
      'Verbo fica no final da frase — sempre. "Eu arroz como" é a estrutura.',
      'Formal (ます) vs Informal (dicionário) — crucial para não soar rude.',
      'Contadores: cada tipo de objeto tem um contador específico.'
    ],
    culturalNotes: [
      'Honoríficos: -san, -kun, -chan, -sama — cada um tem contexto específico.',
      'Curvar é mais importante que apertar a mão.', 
      '"Hai" pode significar "sim", "estou ouvindo", "entendi" — não necessariamente acordo.',
      'Silêncio é comunicação. Pausas não são constrangimento.'
    ],
    connectedSpeechRules: [
      'Vogais surdas: "i" e "u" entre consoantes surdas quase somem. "Desu" → "des".',
      'Dobradas: "Gakkō" — o "k" é pronunciado por mais tempo (pausa).',
      '"Te iru" → "Teru" (informal progressivo). "Tabete iru" → "Tabeteru"',
      '"Te wa" → "Tcha" em alguns dialetos.',
      '"Kute" vira "kute" sem pausa.'
    ],
    trickySounds: [
      { sound: 'R (ɾ)', tip: 'Toque rápido da língua no céu da boca. Entre R e L. "Sakura" → "sakura"' },
      { sound: 'Tsu (つ)', tip: 'TS + U. Língua em posição de T, solta como S. "Tsukue" → "tsu-ku-ê"' },
      { sound: 'F (ɸ)', tip: 'Sopra sem lábios se tocarem. "Fuji" → "fu-dji" (não "fu-dji" labial)' },
      { sound: 'Vogais longas', tip: '"Obāsan" (avó) = 3 moras. "Obasan" (tia) = 2 moras. Duração!' }
    ]
  },
  'ko': {
    code: 'ko', name: 'Korean', flag: '🇰🇷',
    phoneticSystem: 'Mora-timed. Hangul é foneticamente perfeito — cada bloco é uma sílaba.',
    commonMistakes: [
      'Brasileiro não distingue consoantes tensas (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) das normais.',
      'R/L coreano (ㄹ) —entre R e L, como japonês mas ainda mais versátil.',
      'Batchim (받침) — consoante final de bloco muda a pronúncia drasticamente.',
      'Aspiração: ㅋ, ㅌ, ㅍ, ㅊ são aspirados (sopro forte) — diferença crucial.'
    ],
    macetes: [
      'Hangul se aprende em 1-2 horas — leitura fonética perfeita.',
      'Coreano não usa pronomes tanto quanto português — contexto define.',
      'Sujeito + Objeto + Verbo — igual japonês.',
      'Níveis de fala: 7 níveis de formalidade. 해요체 (informal polido) é o mais útil.',
      'Partículas (은/는, 이/가, 을/를) — marcam função gramatical.'
    ],
    culturalNotes: [
      'Idade importa: coreano pergunta idade pra definir formalidade.',
      'Títulos (씨, 님) são obrigatórios com sobrenome.',
      '"Kamsahamnida" é o "obrigado" formal — essencial.',
      'Ajeossi (아저씨) / Ajumma (아줌마) usado para desconhecidos mais velhos.'
    ],
    connectedSpeechRules: [
      'Ligação: batchim + vogal = consoante se move pra próxima sílaba. "음악" → "으막"',
      'Aspiração: batchim ㄱ, ㄷ, ㅂ + ㅎ = ㅋ, ㅌ, ㅍ. "축하" → "추카"',
      'Tensão: batchim ㄴ + ㄱ, ㄷ, ㅂ, ㅅ, ㅈ = versões tensas.',
      '"입니다" → "임니다" (batchim ㅂ + ㄴ = ㅁ).',
      '"하고" → "하구" em fala cotidiana.'
    ],
    trickySounds: [
      { sound: 'ㄹ (R/L)', tip: 'Língua bate no céu da boca uma vez. "Hangul" → "Hangur"' },
      { sound: 'Consoantes tensas (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ)', tip: 'Músculo da garganta contrai. Som mais forte, sem sopro.' },
      { sound: 'Consoantes aspiradas (ㅋ, ㅌ, ㅍ, ㅊ)', tip: 'Sopro forte na saída. "Kim" → "k-him" (não "kim" normal)' },
      { sound: 'Batchim (받침)', tip: 'Consoante final muda: ㄱ→k, ㄴ→n, ㄷ→t, ㄹ→l, ㅁ→m, ㅂ→p, ㅇ→ng' }
    ]
  },
  'ru': {
    code: 'ru', name: 'Russian', flag: '🇷🇺',
    phoneticSystem: 'Stress-timed. Palavras têm uma sílaba tônica muito forte e as outras são reduzidas.',
    commonMistakes: [
      'Brasileiro tem dificuldade com o "Ы" (y) — não é um "I" nem "U", é um som da garganta.',
      'Acentuação móvel: o acento tônico muda de sílaba nas declinações e plurais.',
      'Omitir a diferença entre consoantes duras e palatalizadas (moles) muda o significado das palavras.'
    ],
    macetes: [
      'Não existem artigos (o, a, um, uma). O contexto define.',
      'A ordem das palavras é flexível, a ênfase é dada colocando a palavra mais importante no fim ou início.',
      'Verbo "ser/estar" (быть) não é usado no presente. "Eu sou estudante" vira "Eu estudante" (Я студент).',
      'Cuidado com os falsos cognatos no alfabeto cirílico: "P" é R, "C" é S, "H" é N, "B" é V.'
    ],
    culturalNotes: [
      'Nomes patronímicos são usados em situações formais, junto com o primeiro nome.',
      'Russos não sorriem para desconhecidos à toa — sorrisos são reservados para conhecidos.',
      'Ser direto é valorizado, não é visto como rudeza.',
      'A hospitalidade é sagrada. Sempre tire os sapatos ao entrar na casa de alguém.'
    ],
    connectedSpeechRules: [
      'Redução vocálica: o "O" átono vira som de "A". Ex: Хорошо (khorosho) soa como "kharashó".',
      'As consoantes sonoras no final das palavras tornam-se surdas. Ex: "Зуб" (dente - zub) soa como "zup".'
    ],
    trickySounds: [
      { sound: 'Ы (y)', tip: 'Coloque a boca para falar "i" e tente falar "u" da garganta.' },
      { sound: 'Р (R)', tip: 'R forte e vibrante do português, como em "caro".' },
      { sound: 'Х (Kh)', tip: 'Som do R forte inicial no Brasil, arranhando a garganta. "Харашо" (Kharashó).' },
      { sound: 'Consoantes Brandas (Ь)', tip: 'O sinal brando palataliza a consoante, soando como um "i" bem rápido e suave no final.' }
    ]
  }
};

export const getLanguageProfile = (code: string): LanguageProfile => {
  return LANGUAGE_PROFILES[code] || LANGUAGE_PROFILES['en'];
};

export const getAvailableLanguages = () => {
  return Object.values(LANGUAGE_PROFILES).map(({ code, name, flag }) => ({ code, name, flag }));
};

/** Gera a system instruction adaptada para o idioma */
export const generateSystemInstruction = (
  baseInstruction: string,
  langCode: string,
  mode: 'FULL' | 'WOKE' | 'ICON' | 'AMOS'
): string => {
  const profile = getLanguageProfile(langCode);
  
  const langAdaptation = `
=== LANGUAGE ADAPTATION: ${profile.name} (${profile.flag}) ===
PHONETIC SYSTEM: ${profile.phoneticSystem}

COMMON MISTAKES (BRAZILIAN PORTUGUESE SPEAKERS):
${profile.commonMistakes.map(m => `- ${m}`).join('\n')}

MACETES (TRICKS):
${profile.macetes.map(m => `- ${m}`).join('\n')}

CONNECTED SPEECH RULES:
${profile.connectedSpeechRules.map(r => `- ${r}`).join('\n')}

TRICKY SOUNDS:
${profile.trickySounds.map(s => `- ${s.sound}: ${s.tip}`).join('\n')}

CULTURAL CONTEXT:
${profile.culturalNotes.map(n => `- ${n}`).join('\n')}

CRITICAL: Apply these language-specific rules during ALL interactions.
Code-switch between Portuguese and ${profile.name} naturally.
Mix basic and advanced structures from Day 1 in ${profile.name}.
`;

  // Inject into the base instruction
  let adapted = baseInstruction
    .replace(/English/g, profile.name)
    .replace(/INGLÊS/g, profile.name.toUpperCase());

  // Prepend language adaptation before MEMORY CONTEXT
  adapted = adapted.replace(
    /\{\{MEMORY_CONTEXT\}\}/,
    `${langAdaptation}\n\n{{MEMORY_CONTEXT}}`
  );

  return adapted;
};
