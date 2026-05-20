
export interface IconItem {
  id: string;
  title: string;
  topics: string[];
  description?: string;
  tags?: ('BASIC' | 'INTERMEDIATE' | 'ADVANCED')[];
}

export interface Module {
  id: string;
  title: string;
  iconItems: IconItem[];
}

export interface Curriculum {
  id: string;
  title: string;
  modules: Module[];
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', es: 'Español', fr: 'Français', it: 'Italiano',
  de: 'Deutsch', zh: '中文', ja: '日本語', ko: '한국어'
};

/** Traduções de títulos de módulos */
const MODULE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'M0':        { es: 'Módulo 0 - Primeiros Passos', fr: 'Module 0 - Premiers Pas', it: 'Modulo 0 - Per Iniziare', de: 'Modul 0 - Erste Schritte', zh: '模块0 - 入门', ja: 'モジュール0 - はじめに', ko: '모듈 0 - 시작하기' },
  'M1':        { es: 'Módulo 1 - Materias de Introducción', fr: 'Module 1 - Sujets d\'Introduction', it: 'Modulo 1 - Argomenti Introduttivi', de: 'Modul 1 - Einführungsthemen', zh: '模块1 - 介绍主题', ja: 'モジュール1 - 導入トピック', ko: '모듈 1 - 소개 주제' },
  'M2':        { es: 'Módulo 2 - Temas Muy Importantes', fr: 'Module 2 - Sujets Très Importants', it: 'Modulo 2 - Argomenti Molto Importanti', de: 'Modul 2 - Sehr Wichtige Themen', zh: '模块2 - 非常重要的主题', ja: 'モジュール2 - 非常に重要なトピック', ko: '모듈 2 - 매우 중요한 주제' },
  'M3':        { es: 'Módulo 3 - Preparación Verbo To Be', fr: 'Module 3 - Préparation Verbe Être', it: 'Modulo 3 - Preparazione Verbo Essere', de: 'Modul 3 - Vorbereitung Verb Sein', zh: '模块3 - Be动词准备', ja: 'モジュール3 - Be動詞の準備', ko: '모듈 3 - Be동사 준비' },
  'M4':        { es: 'Módulo 4 - Verbo To Be', fr: 'Module 4 - Verbe Être', it: 'Modulo 4 - Verbo Essere', de: 'Modul 4 - Verb Sein', zh: '模块4 - Be动词', ja: 'モジュール4 - Be動詞', ko: '모듈 4 - Be동사' },
  'M5':        { es: 'Módulo 5 - Herramientas para Agregar', fr: 'Module 5 - Outils pour Ajouter', it: 'Modulo 5 - Strumenti per Aggiungere', de: 'Modul 5 - Werkzeuge zum Hinzufügen', zh: '模块5 - 添加工具', ja: 'モジュール5 - 追加のツール', ko: '모듈 5 - 추가 도구' },
  'M6':        { es: 'Módulo 6 - Árbol Genealógico', fr: 'Module 6 - Arbre Généalogique', it: 'Modulo 6 - Albero Genealogico', de: 'Modul 6 - Stammbaum', zh: '模块6 - 家谱', ja: 'モジュール6 - 家族図', ko: '모듈 6 - 가계도' },
  'M7':        { es: 'Módulo 7 - Hay / Hay', fr: 'Module 7 - Il y a / Il y a', it: 'Modulo 7 - C\'è / Ci Sono', de: 'Modul 7 - Es Gibt / Es Gibt', zh: '模块7 - 存在句型', ja: 'モジュール7 - 存在表現', ko: '모듈 7 - ~이 있다' },
  'M8':        { es: 'Módulo 8 - Palabras de Pregunta', fr: 'Module 8 - Mots Interrogatifs', it: 'Modulo 8 - Parole Interrogative', de: 'Modul 8 - Fragewörter', zh: '模块8 - 疑问词', ja: 'モジュール8 - 疑問詞', ko: '모듈 8 - 의문사' },
  'M9':        { es: 'Módulo 9 - Presente Continuo', fr: 'Module 9 - Présent Continu', it: 'Modulo 9 - Presente Continuo', de: 'Modul 9 - Verlaufsform Gegenwart', zh: '模块9 - 现在进行时', ja: 'モジュール9 - 現在進行形', ko: '모듈 9 - 현재 진행형' },
  'M10':       { es: 'Módulo 10 - Traducción de Música', fr: 'Module 10 - Traduction Musicale', it: 'Modulo 10 - Traduzione Musicale', de: 'Modul 10 - Musikübersetzung', zh: '模块10 - 歌曲翻译', ja: 'モジュール10 - 音楽翻訳', ko: '모듈 10 - 음악 번역' },
  'M11':       { es: 'Módulo 11 - Presentación', fr: 'Module 11 - Présentation', it: 'Modulo 11 - Presentazione', de: 'Modul 11 - Präsentation', zh: '模块11 - 自我介绍', ja: 'モジュール11 - 自己紹介', ko: '모듈 11 - 자기 소개' },
  'M12':       { es: 'Módulo 12 - Diálogo Básico', fr: 'Module 12 - Dialogue de Base', it: 'Modulo 12 - Dialogo di Base', de: 'Modul 12 - Grundlegender Dialog', zh: '模块12 - 基础对话', ja: 'モジュール12 - 基本対話', ko: '모듈 12 - 기초 대화' },
  'INT.M1':    { es: 'Módulo 13 - Rutina Diaria', fr: 'Module 13 - Routine Quotidienne', it: 'Modulo 13 - Routine Quotidiana', de: 'Modul 13 - Tägliche Routine', zh: '模块13 - 日常生活', ja: 'モジュール13 - 日常ルーティン', ko: '모듈 13 - 일상 루틴' },
  'INT.M2':    { es: 'Módulo 14 - Hablando del Futuro', fr: 'Module 14 - Parler du Futur', it: 'Modulo 14 - Parlare del Futuro', de: 'Modul 14 - Über die Zukunft Sprechen', zh: '模块14 - 谈论未来', ja: 'モジュール14 - 未来について話す', ko: '모듈 14 - 미래 이야기' },
  'INT.M3':    { es: 'Módulo 15 - Hablando del Pasado', fr: 'Module 15 - Parler du Passé', it: 'Modulo 15 - Parlare del Passato', de: 'Modul 15 - Über die Vergangenheit Sprechen', zh: '模块15 - 谈论过去', ja: 'モジュール15 - 過去について話す', ko: '모듈 15 - 과거 이야기' },
  'INT.M4':    { es: 'Módulo 16 - Habilidades de Audición', fr: 'Module 16 - Compétences d\'Écoute', it: 'Modulo 16 - Abilità di Ascolto', de: 'Modul 16 - Hörverständnis', zh: '模块16 - 听力技能', ja: 'モジュール16 - リスニングスキル', ko: '모듈 16 - 듣기 능력' },
  'INT.M5':    { es: 'Módulo 17 - Preposiciones', fr: 'Module 17 - Prépositions', it: 'Modulo 17 - Preposizioni', de: 'Modul 17 - Präpositionen', zh: '模块17 - 介词', ja: 'モジュール17 - 前置詞', ko: '모듈 17 - 전치사' },
  'INT.M6':    { es: 'Módulo 18 - Palabras de Pregunta Avanzadas', fr: 'Module 18 - Mots Interrogatifs Avancés', it: 'Modulo 18 - Parole Interrogative Avanzate', de: 'Modul 18 - Fortgeschrittene Fragewörter', zh: '模块18 - 高级疑问词', ja: 'モジュール18 - 上級疑問詞', ko: '모듈 18 - 고급 의문사' },
  'ADV.M1':    { es: 'Módulo 19 - Sufijos y Prefijos', fr: 'Module 19 - Suffixes et Préfixes', it: 'Modulo 19 - Suffissi e Prefissi', de: 'Modul 19 - Suffixe und Präfixe', zh: '模块19 - 后缀和前缀', ja: 'モジュール19 - 接尾辞と接頭辞', ko: '모듈 19 - 접미사와 접두사' },
  'ADV.M2':    { es: 'Módulo 20 - Verbos Modales', fr: 'Module 20 - Verbes Modaux', it: 'Modulo 20 - Verbi Modali', de: 'Modul 20 - Modalverben', zh: '模块20 - 情态动词', ja: 'モジュール20 - 法助動詞', ko: '모듈 20 - 조동사' },
  'ADV.M3':    { es: 'Módulo 21 - Verbos Frasales', fr: 'Module 21 - Verbes à Particule', it: 'Modulo 21 - Verbi Frasali', de: 'Modul 21 - Phrasal Verbs', zh: '模块21 - 短语动词', ja: 'モジュール21 - 句動詞', ko: '모듈 21 - 구동사' },
  'ADV.M4':    { es: 'Módulo 22 - Matices de Verbos Modales', fr: 'Module 22 - Nuances des Verbes Modaux', it: 'Modulo 22 - Sfumature dei Verbi Modali', de: 'Modul 22 - Nuancen der Modalverben', zh: '模块22 - 情态动词的细微差别', ja: 'モジュール22 - 法助動詞のニュアンス', ko: '모듈 22 - 조동사 뉘앙스' },
  'ADV.M5':    { es: 'Módulo 23 - Presente Perfecto', fr: 'Module 23 - Présent Parfait', it: 'Modulo 23 - Presente Perfetto', de: 'Modul 23 - Perfekt', zh: '模块23 - 现在完成时', ja: 'モジュール23 - 現在完了形', ko: '모듈 23 - 현재완료' },
  'ADV.M6':    { es: 'Módulo 24 - Cuantificadores', fr: 'Module 24 - Quantificateurs', it: 'Modulo 24 - Quantificatori', de: 'Modul 24 - Mengenangaben', zh: '模块24 - 量词', ja: 'モジュール24 - 数量詞', ko: '모듈 24 - 수량사' },
  'ADV.M7':    { es: 'Módulo 25 - Pronombres Indefinidos', fr: 'Module 25 - Pronoms Indéfinis', it: 'Modulo 25 - Pronomi Indefiniti', de: 'Modul 25 - Indefinitpronomen', zh: '模块25 - 不定代词', ja: 'モジュール25 - 不定代名詞', ko: '모듈 25 - 부정 대명사' },
  'ADV.M8':    { es: 'Módulo 26 - Check-in Check-out', fr: 'Module 26 - Enregistrement et Départ', it: 'Modulo 26 - Check-in Check-out', de: 'Modul 26 - Check-in Check-out', zh: '模块26 - 入住与退房', ja: 'モジュール26 - チェックイン/チェックアウト', ko: '모듈 26 - 체크인 체크아웃' },
  'ADV.M9':    { es: 'Módulo 27 - Jerga y Contracciones', fr: 'Module 27 - Argot et Contractions', it: 'Modulo 27 - Gergo e Contrazioni', de: 'Modul 27 - Slang und Kontraktionen', zh: '模块27 - 俚语和缩略', ja: 'モジュール27 - スラングと短縮形', ko: '모듈 27 - 속어와 축약' },
  'ADV.M10':   { es: 'Módulo 28 - Habilidades', fr: 'Module 28 - Capacités', it: 'Modulo 28 - Abilità', de: 'Modul 28 - Fähigkeiten', zh: '模块28 - 能力表达', ja: 'モジュール28 - 能力', ko: '모듈 28 - 능력' },
  'ADV.M11':   { es: 'Módulo 29 - Restaurante', fr: 'Module 29 - Restaurant', it: 'Modulo 29 - Ristorante', de: 'Modul 29 - Restaurant', zh: '模块29 - 餐厅', ja: 'モジュール29 - レストラン', ko: '모듈 29 - 레스토랑' },
  'ADV.M12':   { es: 'Módulo 30 - Conectores', fr: 'Module 30 - Connecteurs', it: 'Modulo 30 - Connettori', de: 'Modul 30 - Satzverbinder', zh: '模块30 - 连接词', ja: 'モジュール30 - 接続詞', ko: '모듈 30 - 접속사' },
  'ADV.M13':   { es: 'Módulo 31 - Verbos de Obligación', fr: 'Module 31 - Verbes d\'Obligation', it: 'Modulo 31 - Verbi di Obbligo', de: 'Modul 31 - Verben der Verpflichtung', zh: '模块31 - 义务动词', ja: 'モジュール31 - 義務の動詞', ko: '모듈 31 - 의무 동사' },
  'ADV.M14':   { es: 'Módulo 32 - Condicionales', fr: 'Module 32 - Conditionnels', it: 'Modulo 32 - Condizionali', de: 'Modul 32 - Bedingungssätze', zh: '模块32 - 条件句', ja: 'モジュール32 - 条件文', ko: '모듈 32 - 조건문' }
};

/** Traduções de títulos de lições */
const LESSON_TRANSLATIONS: Record<string, Record<string, string>> = {
  'L0.1':     { es: 'Introducción: Nivelación', fr: 'Introduction: Évaluation', it: 'Introduzione: Livellamento', de: 'Einführung: Einstufung', zh: '入门：水平评估', ja: '導入：レベル確認', ko: '소개: 수준 평가' },
  'L0.2':     { es: 'Experimental: Alfabeto y Números', fr: 'Expérimental: Alphabet et Nombres', it: 'Sperimentale: Alfabeto e Numeri', de: 'Experimentell: Alphabet und Zahlen', zh: '体验：字母和数字', ja: '体験：アルファベットと数字', ko: '체험: 알파벳과 숫자' },
  'L1.1':     { es: 'Presentación de la Metodología', fr: 'Présentation de la Méthodologie', it: 'Presentazione della Metodologia', de: 'Methodikvorstellung', zh: '方法介绍', ja: '方法論の紹介', ko: '방법론 소개' },
  'L2.1':     { es: 'Meses, Estaciones, Días de la Semana', fr: 'Mois, Saisons, Jours de la Semaine', it: 'Mesi, Stagioni, Giorni della Settimana', de: 'Monate, Jahreszeiten, Wochentage', zh: '月份、季节、星期', ja: '月、季節、曜日', ko: '월, 계절, 요일' },
  'L2.2':     { es: 'Números Ordinales, Fechas, Hora', fr: 'Nombres Ordinaux, Dates, Heure', it: 'Numeri Ordinali, Date, Ora', de: 'Ordnungszahlen, Daten, Uhrzeit', zh: '序数词、日期、时间', ja: '序数、日付、時間', ko: '서수, 날짜, 시간' },
  'L3.1':     { es: 'Artículos, Pronombres Personales', fr: 'Articles, Pronoms Personnels', it: 'Articoli, Pronomi Personali', de: 'Artikel, Personalpronomen', zh: '冠词、人称代词', ja: '冠詞、人称代名詞', ko: '관사, 인칭 대명사' },
  'L4.1':     { es: 'Plurales + Some y Any', fr: 'Pluriels + Some et Any', it: 'Plurali + Some e Any', de: 'Plural + Some und Any', zh: '复数 + Some和Any', ja: '複数形 + Some と Any', ko: '복수형 + Some/Any' },
  'L4.2':     { es: 'Verbo To Be + Estructuras', fr: 'Verbe Être + Structures', it: 'Verbo Essere + Strutture', de: 'Verb Sein + Strukturen', zh: 'Be动词 + 结构', ja: 'Be動詞 + 構造', ko: 'Be동사 + 구조' },
  'L4.3':     { es: 'Contracciones e Interrogativas', fr: 'Contractions et Interrogatives', it: 'Contrazioni e Interrogative', de: 'Verkürzungen und Fragen', zh: '缩略形式和疑问句', ja: '短縮形と疑問文', ko: '축약형과 의문문' },
  'L5.1':     { es: 'Continentes, Países, Nacionalidades', fr: 'Continents, Pays, Nationalités', it: 'Continenti, Paesi, Nazionalità', de: 'Kontinente, Länder, Nationalitäten', zh: '大洲、国家、国籍', ja: '大陸、国、国籍', ko: '대륙, 국가, 국적' },
  'L5.2':     { es: 'Adjetivos', fr: 'Adjectifs', it: 'Aggettivi', de: 'Adjektive', zh: '形容词', ja: '形容詞', ko: '형용사' },
  'L6.1':     { es: 'Árbol Genealógico', fr: 'Arbre Généalogique', it: 'Albero Genealogico', de: 'Stammbaum', zh: '家谱', ja: '家族図', ko: '가계도' },
  'L7.1':     { es: 'Hay / Hay (There is / There Are)', fr: 'Il y a / Il y a', it: 'C\'è / Ci Sono', de: 'Es Gibt', zh: '存在句型', ja: '存在表現', ko: '~이 있다' },
  'L8.1':     { es: 'Qué, Dónde, Cuándo, Quién, Cómo, Por Qué', fr: 'Quoi, Où, Quand, Qui, Comment, Pourquoi', it: 'Cosa, Dove, Quando, Chi, Come, Perché', de: 'Was, Wo, Wann, Wer, Wie, Warum', zh: '什么、哪里、何时、谁、如何、为什么', ja: '何、どこ、いつ、誰、どうやって、なぜ', ko: '무엇, 어디, 언제, 누가, 어떻게, 왜' },
  'L9.1':     { es: 'Presente Continuo', fr: 'Présent Continu', it: 'Presente Continuo', de: 'Verlaufsform Gegenwart', zh: '现在进行时', ja: '現在進行形', ko: '현재 진행형' },
  'L10.1':    { es: 'Habilidades de Audición + Vocabulario', fr: 'Compétences d\'Écoute + Vocabulaire', it: 'Abilità di Ascolto + Vocabolario', de: 'Hörverständnis + Wortschatz', zh: '听力技巧 + 词汇', ja: 'リスニングスキル + 語彙', ko: '듣기 능력 + 어휘' },
  'L11.1':    { es: 'Presentación Personal', fr: 'Présentation Personnelle', it: 'Presentazione Personale', de: 'Selbstvorstellung', zh: '自我介绍', ja: '自己紹介', ko: '자기 소개' },
  'L12.1':    { es: 'Desrobotización', fr: 'Dérobotisation', it: 'De-robotizzazione', de: 'Entrobotisierung', zh: '摆脱机器人式说话', ja: 'ロボット話法脱却', ko: '로봇 말투 탈피' },
  'LINT.1':   { es: 'Presente Simple (Do & Does)', fr: 'Présent Simple (Do & Does)', it: 'Presente Semplice (Do & Does)', de: 'Einfaches Präsens (Do & Does)', zh: '一般现在时', ja: '単純現在形', ko: '단순 현재형' },
  'LINT.2':   { es: 'Rutina + Adverbios de Frecuencia', fr: 'Routine + Adverbes de Fréquence', it: 'Routine + Avverbi di Frequenza', de: 'Routine + Häufigkeitsadverbien', zh: '日常 + 频率副词', ja: 'ルーティン + 頻度の副詞', ko: '루틴 + 빈도 부사' },
  'LINT.3':   { es: 'Pronombres de Objeto', fr: 'Pronoms Objets', it: 'Pronomi Oggetto', de: 'Objektpronomen', zh: '宾格代词', ja: '目的格代名詞', ko: '목적격 대명사' },
  'LINT.4':   { es: 'Clase de Creación Mixta', fr: 'Cours de Création Mixte', it: 'Lezione di Creazione Mista', de: 'Gemischter Kreativkurs', zh: '混合创作课', ja: 'ミックス創作クラス', ko: '혼합 창작 수업' },
  'LINT.5':   { es: 'Will y Won\'t', fr: 'Will et Won\'t', it: 'Will e Won\'t', de: 'Will und Won\'t', zh: 'Will和Won\'t', ja: 'Will と Won\'t', ko: 'Will 과 Won\'t' },
  'LINT.6':   { es: 'Will vs Going to', fr: 'Will vs Going to', it: 'Will vs Going to', de: 'Will vs Going to', zh: 'Will与Going to的区别', ja: 'Will と Going to', ko: 'Will 과 Going to' },
  'LINT.7':   { es: 'Habrá / No Habrá', fr: 'Il y aura / Il n\'y aura pas', it: 'Ci Sarà / Non Ci Sarà', de: 'Es Wird Geben / Es Wird Nicht Geben', zh: 'There Will / Won\'t Be', ja: 'There Will / Won\'t Be', ko: '~이 있을 것이다 / 없을 것이다' },
  'LINT.8':   { es: 'Conversación: Metas', fr: 'Conversation: Objectifs', it: 'Conversazione: Obiettivi', de: 'Gespräch: Ziele', zh: '对话：目标', ja: '会話：目標', ko: '대화: 목표' },
  'LINT.9':   { es: 'Was / Were', fr: 'Was / Were', it: 'Was / Were', de: 'Was / Were', zh: 'Was/Were', ja: 'Was/Were', ko: 'Was/Were' },
  'LINT.10':  { es: 'Había / Había (There Was/Were)', fr: 'Il y avait (There Was/Were)', it: 'C\'era / C\'erano', de: 'Es Gibt (Vergangenheit)', zh: 'There Was/Were', ja: 'There Was/Were', ko: '~이 있었다' },
  'LINT.11':  { es: 'Verbos Regulares e Irregulares en Pasado', fr: 'Verbes Réguliers et Irréguliers au Passé', it: 'Verbi Regolari e Irregolari al Passato', de: 'Regelmäßige und Unregelmäßige Verben in der Vergangenheit', zh: '过去式规则和不规则动词', ja: '過去形の規則・不規則動詞', ko: '과거 규칙/불규칙 동사' },
  'LINT.12':  { es: 'Did y Didn\'t', fr: 'Did et Didn\'t', it: 'Did e Didn\'t', de: 'Did und Didn\'t', zh: 'Did和Didn\'t', ja: 'Did と Didn\'t', ko: 'Did 와 Didn\'t' },
  'LINT.13':  { es: 'Conversación: Infancia', fr: 'Conversation: Enfance', it: 'Conversazione: Infanzia', de: 'Gespräch: Kindheit', zh: '对话：童年', ja: '会話：子供時代', ko: '대화: 어린 시절' },
  'LINT.14':  { es: 'Traducción de Música/Video', fr: 'Traduction de Musique/Vidéo', it: 'Traduzione di Musica/Video', de: 'Musik-/Videoübersetzung', zh: '歌曲/视频翻译', ja: '音楽/動画翻訳', ko: '음악/비디오 번역' },
  'LINT.15':  { es: 'IN / ON / AT', fr: 'IN / ON / AT', it: 'IN / ON / AT', de: 'IN / ON / AT', zh: 'IN/ON/AT', ja: 'IN/ON/AT', ko: 'IN/ON/AT' },
  'LINT.16':  { es: 'Disparadores de Extracción de Datos', fr: 'Déclencheurs d\'Extraction de Données', it: 'Gattoni di Estrazione Dati', de: 'Datenabruf-Auslöser', zh: '数据提取触发词', ja: 'データ抽出トリガー', ko: '데이터 추출 트리거' },
  'LADV.1':   { es: 'Comparativos y Superlativos', fr: 'Comparatifs et Superlatifs', it: 'Comparativi e Superlativi', de: 'Komparativ und Superlativ', zh: '比较级和最高级', ja: '比較級と最上級', ko: '비교급과 최상급' },
  'LADV.2':   { es: 'Sufijos y Prefijos', fr: 'Suffixes et Préfixes', it: 'Suffissi e Prefissi', de: 'Suffixe und Präfixe', zh: '后缀和前缀', ja: '接尾辞と接頭辞', ko: '접미사와 접두사' },
  'LADV.3':   { es: 'Verbos Modales', fr: 'Verbes Modaux', it: 'Verbi Modali', de: 'Modalverben', zh: '情态动词', ja: '法助動詞', ko: '조동사' },
  'LADV.4':   { es: 'Verbos Frasales', fr: 'Verbes à Particule', it: 'Verbi Frasali', de: 'Phrasal Verbs', zh: '短语动词', ja: '句動詞', ko: '구동사' },
  'LADV.5':   { es: 'Habilidades de Audición Avanzadas', fr: 'Compétences d\'Écoute Avancées', it: 'Abilità di Ascolto Avanzate', de: 'Fortgeschrittene Hörfähigkeiten', zh: '高级听力技巧', ja: '上級リスニングスキル', ko: '고급 듣기 능력' },
  'LADV.6':   { es: 'Could, Would y Should', fr: 'Could, Would et Should', it: 'Could, Would e Should', de: 'Could, Would und Should', zh: 'Could/Would/Should', ja: 'Could, Would, Should', ko: 'Could, Would, Should' },
  'LADV.7':   { es: 'Presente Perfecto Simple/Continuo', fr: 'Présent Parfait Simple/Continu', it: 'Presente Perfetto Semplice/Continuo', de: 'Perfekt Einfach/Verlaufsform', zh: '现在完成时/完成进行时', ja: '現在完了形/完了進行形', ko: '현재완료/완료진행' },
  'LADV.8':   { es: 'Cuantificadores', fr: 'Quantificateurs', it: 'Quantificatori', de: 'Mengenangaben', zh: '量词', ja: '数量詞', ko: '수량사' },
  'LADV.9':   { es: 'Pronombres Indefinidos', fr: 'Pronoms Indéfinis', it: 'Pronomi Indefiniti', de: 'Indefinitpronomen', zh: '不定代词', ja: '不定代名詞', ko: '부정 대명사' },
  'LADV.10':  { es: 'Hotel y Aeropuerto', fr: 'Hôtel et Aéroport', it: 'Hotel e Aeroporto', de: 'Hotel und Flughafen', zh: '酒店和机场', ja: 'ホテルと空港', ko: '호텔과 공항' },
  'LADV.11':  { es: 'Wanna, Gonna, Gotta, Lemme', fr: 'Wanna, Gonna, Gotta, Lemme', it: 'Wanna, Gonna, Gotta, Lemme', de: 'Wanna, Gonna, Gotta, Lemme', zh: 'Wanna/Gonna/Gotta/Lemme', ja: 'Wanna, Gonna, Gotta, Lemme', ko: 'Wanna, Gonna, Gotta, Lemme' },
  'LADV.12':  { es: 'Can, Can\'t, May, Might', fr: 'Can, Can\'t, May, Might', it: 'Can, Can\'t, May, Might', de: 'Can, Can\'t, May, Might', zh: 'Can/Can\'t/May/Might', ja: 'Can, Can\'t, May, Might', ko: 'Can, Can\'t, May, Might' },
  'LADV.13':  { es: 'Simulación de Restaurante', fr: 'Simulation de Restaurant', it: 'Simulazione di Ristorante', de: 'Restaurantsimulation', zh: '餐厅模拟', ja: 'レストランシミュレーション', ko: '레스토랑 시뮬레이션' },
  'LADV.14':  { es: 'Conectores y Secuenciadores', fr: 'Connecteurs et Séquenceurs', it: 'Connettori e Sequenziatori', de: 'Verknüpfungswörter und Abfolge', zh: '连接词和顺序词', ja: '接続詞と順序を示す語', ko: '접속사와 순서어' },
  'LADV.15':  { es: 'Must, Have to y Should', fr: 'Must, Have to et Should', it: 'Must, Have to e Should', de: 'Must, Have to und Should', zh: 'Must/Have to/Should', ja: 'Must, Have to, Should', ko: 'Must, Have to, Should' },
  'LADV.16':  { es: 'Primer y Segundo Condicional', fr: 'Premier et Deuxième Conditionnel', it: 'Primo e Secondo Condizionale', de: 'Erster und Zweiter Konditional', zh: '第一和第二条件句', ja: '第一・第二条件文', ko: '1차/2차 조건문' },
  'LADV.17':  { es: 'Tercer Condicional', fr: 'Troisième Conditionnel', it: 'Terzo Condizionale', de: 'Dritter Konditional', zh: '第三条件句', ja: '第三条件文', ko: '3차 조건문' }
};

/** Traduções de tópicos */
const TOPIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Introduction':     { es: 'Introducción', fr: 'Introduction', it: 'Introduzione', de: 'Einführung', zh: '介绍', ja: '導入', ko: '소개' },
  'Initial Assessment': { es: 'Evaluación Inicial', fr: 'Évaluation Initiale', it: 'Valutazione Iniziale', de: 'Ersteinschätzung', zh: '初始评估', ja: '初期評価', ko: '초기 평가' },
  'Real Sounds':      { es: 'Sonidos Reales', fr: 'Sons Réels', it: 'Suoni Reali', de: 'Authentische Laute', zh: '真实发音', ja: '実際の音', ko: '실제 발음' },
  'Physical Counting': { es: 'Conteo Físico', fr: 'Comptage Physique', it: 'Conteggio Fisico', de: 'Physisches Zählen', zh: '实物数数', ja: '物を使って数える', ko: '실물 세기' },
  'Immersion':        { es: 'Inmersión', fr: 'Immersion', it: 'Immersione', de: 'Eintauchen', zh: '沉浸', ja: '没入', ko: '몰입' },
  'Alphabet':         { es: 'Alfabeto', fr: 'Alphabet', it: 'Alfabeto', de: 'Alphabet', zh: '字母表', ja: 'アルファベット', ko: '알파벳' },
  'Rhythm':           { es: 'Ritmo', fr: 'Rythme', it: 'Ritmo', de: 'Rhythmus', zh: '节奏', ja: 'リズム', ko: '리듬' },
  'Connected speech': { es: 'Habla Conectada', fr: 'Parole Connectée', it: 'Discorso Connesso', de: 'Verbundenes Sprechen', zh: '连读', ja: '連結音声', ko: '연결 발음' },
  'Time':             { es: 'Hora', fr: 'Heure', it: 'Ora', de: 'Uhrzeit', zh: '时间', ja: '時間', ko: '시간' },
  'Stress-timed':     { es: 'Ritmo Acentual', fr: 'Rythme Accentuel', it: 'Ritmo Accentuale', de: 'Betonungsrhythmus', zh: '重音节奏', ja: 'ストレスリズム', ko: '강세 리듬' },
  'Articles':         { es: 'Artículos', fr: 'Articles', it: 'Articoli', de: 'Artikel', zh: '冠词', ja: '冠詞', ko: '관사' },
  'Pronouns':         { es: 'Pronombres', fr: 'Pronoms', it: 'Pronomi', de: 'Pronomen', zh: '代词', ja: '代名詞', ko: '대명사' },
  'Quantities':       { es: 'Cantidades', fr: 'Quantités', it: 'Quantità', de: 'Mengen', zh: '数量', ja: '数量', ko: '수량' },
  'Targets':          { es: 'Objetivos', fr: 'Cibles', it: 'Obiettivi', de: 'Ziele', zh: '目标', ja: 'ターゲット', ko: '목표' },
  'Affirmation':      { es: 'Afirmación', fr: 'Affirmation', it: 'Affermazione', de: 'Bejahung', zh: '肯定句', ja: '肯定文', ko: '긍정문' },
  'Negation':         { es: 'Negación', fr: 'Négation', it: 'Negazione', de: 'Verneinung', zh: '否定句', ja: '否定文', ko: '부정문' },
  'Interrogative':    { es: 'Interrogativo', fr: 'Interrogatif', it: 'Interrogativo', de: 'Frageform', zh: '疑问句', ja: '疑問文', ko: '의문문' },
  'Brainscape':       { es: 'AMOS', fr: 'AMOS', it: 'AMOS', de: 'AMOS', zh: 'AMOS', ja: 'AMOS', ko: 'AMOS' },
  'Countries':        { es: 'Países', fr: 'Pays', it: 'Paesi', de: 'Länder', zh: '国家', ja: '国', ko: '국가' },
  'Nationality':      { es: 'Nacionalidad', fr: 'Nationalité', it: 'Nazionalità', de: 'Nationalität', zh: '国籍', ja: '国籍', ko: '국적' },
  'Characteristics':  { es: 'Características', fr: 'Caractéristiques', it: 'Caratteristiche', de: 'Eigenschaften', zh: '特征', ja: '特徴', ko: '특징' },
  'Flavor':           { es: 'Sabor', fr: 'Saveur', it: 'Sapore', de: 'Würze', zh: '调味', ja: '味わい', ko: '양념' },
  'Family':           { es: 'Familia', fr: 'Famille', it: 'Famiglia', de: 'Familie', zh: '家庭', ja: '家族', ko: '가족' },
  'Emotion':          { es: 'Emoción', fr: 'Émotion', it: 'Emozione', de: 'Gefühl', zh: '情感', ja: '感情', ko: '감정' },
  'Existence':        { es: 'Existencia', fr: 'Existence', it: 'Esistenza', de: 'Vorhandensein', zh: '存在', ja: '存在', ko: '존재' },
  'Presence':         { es: 'Presencia', fr: 'Présence', it: 'Presenza', de: 'Anwesenheit', zh: '在场', ja: '存在（その場）', ko: '있음' },
  'Triggers':         { es: 'Disparadores', fr: 'Déclencheurs', it: 'Gattoni', de: 'Auslöser', zh: '触发词', ja: 'トリガー', ko: '트리거' },
  'Investigation':    { es: 'Investigación', fr: 'Investigation', it: 'Indagine', de: 'Erkundung', zh: '调查', ja: '探求', ko: '탐구' },
  'Exact actions':    { es: 'Acciones Exactas', fr: 'Actions Exactes', it: 'Azioni Esatte', de: 'Genaue Handlungen', zh: '精确动作', ja: '正確な動作', ko: '정확한 동작' },
  'Movement sound':   { es: 'Sonido de Movimiento', fr: 'Son de Mouvement', it: 'Suono di Movimento', de: 'Bewegungsklang', zh: '动作声音', ja: '動作の音', ko: '동작 소리' },
  'TPRS':             { es: 'TPRS', fr: 'TPRS', it: 'TPRS', de: 'TPRS', zh: 'TPRS', ja: 'TPRS', ko: 'TPRS' },
  'Shadowing':        { es: 'Shadowing', fr: 'Shadowing', it: 'Shadowing', de: 'Shadowing', zh: '影子跟读', ja: 'シャドーイング', ko: '섀도잉' },
  'Pitch':            { es: 'Entonación', fr: 'Intonation', it: 'Intonazione', de: 'Tonhöhe', zh: '语调', ja: 'イントネーション', ko: '억양' },
  'Self Introduction':{ es: 'Autopresentación', fr: 'Auto-présentation', it: 'Auto-presentazione', de: 'Selbstvorstellung', zh: '自我介绍', ja: '自己紹介', ko: '자기 소개' },
  'Fluidity':         { es: 'Fluidez', fr: 'Fluidité', it: 'Fluidità', de: 'Flüssigkeit', zh: '流利度', ja: '流暢さ', ko: '유창성' },
  'Habits':           { es: 'Hábitos', fr: 'Habitudes', it: 'Abitudini', de: 'Gewohnheiten', zh: '习惯', ja: '習慣', ko: '습관' },
  'Routine':          { es: 'Rutina', fr: 'Routine', it: 'Routine', de: 'Alltag', zh: '日常', ja: 'ルーティン', ko: '루틴' },
  'Frequency':        { es: 'Frecuencia', fr: 'Fréquence', it: 'Frequenza', de: 'Häufigkeit', zh: '频率', ja: '頻度', ko: '빈도' },
  'Certainties':      { es: 'Certidumbres', fr: 'Certitudes', it: 'Cerchezze', de: 'Gewissheiten', zh: '确定性', ja: '確実性', ko: '확실성' },
  'Plans':            { es: 'Planes', fr: 'Plans', it: 'Piani', de: 'Pläne', zh: '计划', ja: '計画', ko: '계획' },
  'Future':           { es: 'Futuro', fr: 'Futur', it: 'Futuro', de: 'Zukunft', zh: '未来', ja: '未来', ko: '미래' },
  'Goals':            { es: 'Metas', fr: 'Objectifs', it: 'Obiettivi', de: 'Ziele', zh: '目标', ja: '目標', ko: '목표' },
  'Vision':           { es: 'Visión', fr: 'Vision', it: 'Visione', de: 'Vision', zh: '愿景', ja: 'ビジョン', ko: '비전' },
  'Past':             { es: 'Pasado', fr: 'Passé', it: 'Passato', de: 'Vergangenheit', zh: '过去', ja: '過去', ko: '과거' },
  'State':            { es: 'Estado', fr: 'État', it: 'Stato', de: 'Zustand', zh: '状态', ja: '状態', ko: '상태' },
  'Past actions':     { es: 'Acciones Pasadas', fr: 'Actions Passées', it: 'Azioni Passate', de: 'Vergangene Handlungen', zh: '过去动作', ja: '過去の動作', ko: '과거 동작' },
  'Motor lock':       { es: 'Bloqueo Motor', fr: 'Verrou Moteur', it: 'Blocco Motorio', de: 'Motorische Blockade', zh: '习惯固化', ja: '運動的固定', ko: '습관화' },
  'Narrative':        { es: 'Narrativa', fr: 'Récit', it: 'Narrativa', de: 'Erzählung', zh: '叙述', ja: '物語', ko: '이야기' },
  'Spatial':          { es: 'Espacial', fr: 'Spatial', it: 'Spaziale', de: 'Räumlich', zh: '空间', ja: '空間', ko: '공간' },
  'Temporal':         { es: 'Temporal', fr: 'Temporel', it: 'Temporale', de: 'Zeitlich', zh: '时间', ja: '時間', ko: '시간' },
  'Metrics':          { es: 'Métricas', fr: 'Mesures', it: 'Metriche', de: 'Kennzahlen', zh: '度量', ja: '指標', ko: '지표' },
  'Information':      { es: 'Información', fr: 'Information', it: 'Informazione', de: 'Information', zh: '信息', ja: '情報', ko: '정보' },
  'Comparison':       { es: 'Comparación', fr: 'Comparaison', it: 'Comparazione', de: 'Vergleich', zh: '比较', ja: '比較', ko: '비교' },
  'Impact':           { es: 'Impacto', fr: 'Impact', it: 'Impatto', de: 'Wirkung', zh: '影响', ja: '影響', ko: '영향' },
  'Modifiers':        { es: 'Modificadores', fr: 'Modificateurs', it: 'Modificatori', de: 'Modifikatoren', zh: '修饰语', ja: '修飾語', ko: '수식어' },
  'Intentions':       { es: 'Intenciones', fr: 'Intentions', it: 'Intenzioni', de: 'Absichten', zh: '意图', ja: '意図', ko: '의도' },
  'Attitudes':        { es: 'Actitudes', fr: 'Attitudes', it: 'Atteggiamenti', de: 'Einstellungen', zh: '态度', ja: '態度', ko: '태도' },
  'Movement':         { es: 'Movimiento', fr: 'Mouvement', it: 'Movimento', de: 'Bewegung', zh: '动作', ja: '動作', ko: '동작' },
  'Result':           { es: 'Resultado', fr: 'Résultat', it: 'Risultato', de: 'Ergebnis', zh: '结果', ja: '結果', ko: '결과' },
  'Resistance':       { es: 'Resistencia', fr: 'Résistance', it: 'Resistenza', de: 'Widerstand', zh: '抗干扰', ja: '抵抗', ko: '저항' },
  'Focus':            { es: 'Enfoque', fr: 'Concentration', it: 'Focalizzazione', de: 'Fokus', zh: '专注', ja: '集中', ko: '집중' },
  'Politeness':       { es: 'Cortesía', fr: 'Politesse', it: 'Cortesia', de: 'Höflichkeit', zh: '礼貌', ja: '丁寧さ', ko: '공손함' },
  'Register':         { es: 'Registro', fr: 'Registre', it: 'Registro', de: 'Sprachebene', zh: '语域', ja: '言語レベル', ko: '언어 수준' },
  'Connection':       { es: 'Conexión', fr: 'Connexion', it: 'Connessione', de: 'Verbindung', zh: '连接', ja: 'つながり', ko: '연결' },
  'Past/Present':     { es: 'Pasado/Presente', fr: 'Passé/Présent', it: 'Passato/Presente', de: 'Vergangenheit/Gegenwart', zh: '过去/现在', ja: '過去/現在', ko: '과거/현재' },
  'Precision':        { es: 'Precisión', fr: 'Précision', it: 'Precisione', de: 'Präzision', zh: '精确度', ja: '正確さ', ko: '정확성' },
  'Volume':           { es: 'Volumen', fr: 'Volume', it: 'Volume', de: 'Menge', zh: '量', ja: '量', ko: '양' },
  'Scope':            { es: 'Alcance', fr: 'Portée', it: 'Portata', de: 'Reichweite', zh: '范围', ja: '範囲', ko: '범위' },
  'Roleplay':         { es: 'Juego de Roles', fr: 'Jeu de Rôle', it: 'Gioco di Ruoli', de: 'Rollenspiel', zh: '角色扮演', ja: 'ロールプレイ', ko: '역할극' },
  'Friction':         { es: 'Fricción', fr: 'Friction', it: 'Attrito', de: 'Reibung', zh: '摩擦', ja: '摩擦', ko: '마찰' },
  'Street':           { es: 'Calle', fr: 'Rue', it: 'Strada', de: 'Umgangssprache', zh: '街头', ja: '日常会話', ko: '일상 회화' },
  'Permissions':      { es: 'Permisos', fr: 'Permissions', it: 'Permessi', de: 'Erlaubnis', zh: '允许', ja: '許可', ko: '허가' },
  'Capacities':       { es: 'Capacidades', fr: 'Capacités', it: 'Capacità', de: 'Fähigkeiten', zh: '能力', ja: '能力', ko: '능력' },
  'Orders':           { es: 'Pedidos', fr: 'Commandes', it: 'Ordini', de: 'Bestellungen', zh: '点餐', ja: '注文', ko: '주문' },
  'Negotiation':      { es: 'Negociación', fr: 'Négociation', it: 'Negoziazione', de: 'Verhandlung', zh: '交涉', ja: '交渉', ko: '협상' },
  'Argumentation':    { es: 'Argumentación', fr: 'Argumentation', it: 'Argomentazione', de: 'Argumentation', zh: '论证', ja: '議論', ko: '논증' },
  'Concatenation':    { es: 'Concatenación', fr: 'Enchaînement', it: 'Concatenazione', de: 'Verkettung', zh: '连接', ja: '連結', ko: '연결' },
  'Duties':           { es: 'Deberes', fr: 'Devoirs', it: 'Doveri', de: 'Pflichten', zh: '义务', ja: '義務', ko: '의무' },
  'Necessities':      { es: 'Necesidades', fr: 'Nécessités', it: 'Necessità', de: 'Notwendigkeiten', zh: '必要性', ja: '必要性', ko: '필요성' },
  'Hypotheses':       { es: 'Hipótesis', fr: 'Hypothèses', it: 'Ipotesi', de: 'Hypothesen', zh: '假设', ja: '仮説', ko: '가설' },
  'Logic':            { es: 'Lógica', fr: 'Logique', it: 'Logica', de: 'Logik', zh: '逻辑', ja: '論理', ko: '논리' },
  'Past scenarios':   { es: 'Escenarios Pasados', fr: 'Scénarios Passés', it: 'Scenari Passati', de: 'Vergangene Szenarien', zh: '过去情境', ja: '過去のシナリオ', ko: '과거 시나리오' },
};

const TAG_TRANSLATIONS: Record<string, Record<string, string>> = {
  'BASIC':        { es: 'BASICO', fr: 'BASE', it: 'BASE', de: 'BASIS', zh: '基础', ja: '基本', ko: '기초' },
  'INTERMEDIATE': { es: 'INTERMEDIO', fr: 'INTERMÉDIAIRE', it: 'INTERMEDIO', de: 'MITTELSTUFE', zh: '中级', ja: '中級', ko: '중급' },
  'ADVANCED':     { es: 'AVANZADO', fr: 'AVANCÉ', it: 'AVANZATO', de: 'FORTGESCHRITTEN', zh: '高级', ja: '上級', ko: '고급' }
};

function translateTopics(topics: string[], lang: string): string[] {
  return topics.map(t => TOPIC_TRANSLATIONS[t]?.[lang] || t);
}

/** Aplica traduções ao curriculum base */
function applyTranslations(curriculum: Curriculum, lang: string): Curriculum {
  if (lang === 'en') return curriculum;
  
  return {
    ...curriculum,
    title: `FUSION • ${LANG_NAMES[lang] || 'English'}`,
    modules: curriculum.modules.map(mod => ({
      ...mod,
      title: MODULE_TRANSLATIONS[mod.id]?.[lang] || mod.title,
      iconItems: mod.iconItems.map(item => ({
        ...item,
        title: LESSON_TRANSLATIONS[item.id]?.[lang] || item.title,
        topics: translateTopics(item.topics, lang)
      }))
    }))
  };
}

/** Retorna o label traduzido de uma tag */
export const getTranslatedTag = (tag: string, lang: string): string => {
  return TAG_TRANSLATIONS[tag]?.[lang] || tag;
};

const ENGLISH_CURRICULUM: Curriculum = {
  id: 'FUSION',
  title: 'FUSION CURRICULUM',
  modules: [
    {
      id: 'M0',
      title: 'Module 0 - Getting Started',
      iconItems: [
        { id: 'L0.1', title: 'Intro: Leveling', topics: ['Introduction', 'Initial Assessment'], tags: ['BASIC'] },
        { id: 'L0.2', title: 'Experimental: Alphabet & Numbers', topics: ['Real Sounds', 'Physical Counting'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M1',
      title: 'Module 1 - Intro Subjects',
      iconItems: [
        { id: 'L1.1', title: 'Methodology Presentation', topics: ['Immersion', 'Alphabet', 'Numbers'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M2',
      title: 'Module 2 - Very Important Subjects',
      iconItems: [
        { id: 'L2.1', title: 'Months, Seasons, Days of the Week', topics: ['Rhythm', 'Connected speech'], tags: ['BASIC'] },
        { id: 'L2.2', title: 'Ordinal Numbers, Dates, Time', topics: ['Time', 'Stress-timed'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M3',
      title: 'Module 3 - Verb To Be Prep',
      iconItems: [
        { id: 'L3.1', title: 'Articles, Personal Pronouns', topics: ['Articles', 'Pronouns'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M4',
      title: 'Module 4 - Verb To Be',
      iconItems: [
        { id: 'L4.1', title: 'Plurals + Some and Any', topics: ['Quantities', 'Targets'], tags: ['BASIC'] },
        { id: 'L4.2', title: 'Verb to Be + structures', topics: ['Affirmation', 'Negation'], tags: ['BASIC'] },
        { id: 'L4.3', title: 'Contractions and Interrogative', topics: ['Interrogative', 'Brainscape'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M5',
      title: 'Module 5 - Tools to Add',
      iconItems: [
        { id: 'L5.1', title: 'Continents, Countries, Nationalities', topics: ['Countries', 'Nationality'], tags: ['BASIC'] },
        { id: 'L5.2', title: 'Adjectives', topics: ['Characteristics', 'Flavor'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M6',
      title: 'Module 6 - Family Tree',
      iconItems: [
        { id: 'L6.1', title: 'Family Tree', topics: ['Family', 'Emotion'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M7',
      title: 'Module 7 - There is / There Are',
      iconItems: [
        { id: 'L7.1', title: 'There is / There Are', topics: ['Existence', 'Presence'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M8',
      title: 'Module 8 - Question Words',
      iconItems: [
        { id: 'L8.1', title: 'What, Where, When, Who, How, Why', topics: ['Triggers', 'Investigation'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M9',
      title: 'Module 9 - Present Continuous',
      iconItems: [
        { id: 'L9.1', title: 'Present Continuous', topics: ['Exact actions', 'Movement sound'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M10',
      title: 'Module 10 - Music Translation',
      iconItems: [
        { id: 'L10.1', title: 'Listening Skills + Vocabulary', topics: ['TPRS', 'Shadowing'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M11',
      title: 'Module 11 - Presentation',
      iconItems: [
        { id: 'L11.1', title: 'Self Presentation', topics: ['Pitch', 'Self Introduction'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'M12',
      title: 'Module 12 - Basic Dialogue',
      iconItems: [
        { id: 'L12.1', title: 'De-robotizing', topics: ['Fluidity', 'Rhythm'], tags: ['BASIC'] }
      ]
    },
    {
      id: 'INT.M1',
      title: 'Module 13 - Daily Routine',
      iconItems: [
        { id: 'LINT.1', title: 'Simple Present (Do & Does)', topics: ['Habits', 'Routine'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.2', title: 'Routine + Frequency Adverbs', topics: ['Frequency'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.3', title: 'Object Pronouns', topics: ['Targets'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.4', title: 'Mix Creation Class', topics: ['TPRS'], tags: ['INTERMEDIATE'] }
      ]
    },
    {
      id: 'INT.M2',
      title: 'Module 14 - Talking about the Future',
      iconItems: [
        { id: 'LINT.5', title: 'Will & Won\'t', topics: ['Certainties'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.6', title: 'Will x Going to', topics: ['Plans', 'Intentions'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.7', title: 'There Will be / Won\'t be', topics: ['Future', 'Existence'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.8', title: 'Conversation: Goals', topics: ['Goals', 'Vision'], tags: ['INTERMEDIATE'] }
      ]
    },
    {
      id: 'INT.M3',
      title: 'Module 15 - Talking about the Past',
      iconItems: [
        { id: 'LINT.9', title: 'Was / Were', topics: ['Past', 'State'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.10', title: 'There Was / Were', topics: ['Past', 'Existence'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.11', title: 'Past Regular and Irregular Verbs', topics: ['Past actions'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.12', title: 'Did & Didn\'t', topics: ['Past', 'Motor lock'], tags: ['INTERMEDIATE'] },
        { id: 'LINT.13', title: 'Conversation: Childhood', topics: ['Narrative'], tags: ['INTERMEDIATE'] }
      ]
    },
    {
      id: 'INT.M4',
      title: 'Module 16 - Listening Skills',
      iconItems: [
        { id: 'LINT.14', title: 'Music/Video Translation', topics: ['Immersion'], tags: ['INTERMEDIATE'] }
      ]
    },
    {
      id: 'INT.M5',
      title: 'Module 17 - Prepositions',
      iconItems: [
        { id: 'LINT.15', title: 'IN / ON / AT', topics: ['Spatial', 'Temporal'], tags: ['INTERMEDIATE'] }
      ]
    },
    {
      id: 'INT.M6',
      title: 'Module 18 - Advanced Question Words',
      iconItems: [
        { id: 'LINT.16', title: 'Data Extraction Triggers', topics: ['Metrics', 'Information'], tags: ['INTERMEDIATE'] }
      ]
    },
    {
      id: 'ADV.M1',
      title: 'Module 19 - Suffixes and Prefixes',
      iconItems: [
        { id: 'LADV.1', title: 'Comparatives and Superlatives', topics: ['Comparison', 'Impact'], tags: ['ADVANCED'] },
        { id: 'LADV.2', title: 'Suffixes and Prefixes', topics: ['Modifiers'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M2',
      title: 'Module 20 - Modal Verbs',
      iconItems: [
        { id: 'LADV.3', title: 'Modal Verbs', topics: ['Intentions', 'Attitudes'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M3',
      title: 'Module 21 - Phrasal Verbs',
      iconItems: [
        { id: 'LADV.4', title: 'Phrasal Verbs', topics: ['Movement', 'Result'], tags: ['ADVANCED'] },
        { id: 'LADV.5', title: 'Advanced Listening Skills', topics: ['Resistance', 'Focus'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M4',
      title: 'Module 22 - Modal Verbs Nuance',
      iconItems: [
        { id: 'LADV.6', title: 'Could, Would and Should', topics: ['Politeness', 'Register'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M5',
      title: 'Module 23 - Present Perfect',
      iconItems: [
        { id: 'LADV.7', title: 'Present Perfect Simple/Continuous', topics: ['Connection', 'Past/Present'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M6',
      title: 'Module 24 - Quantifiers',
      iconItems: [
        { id: 'LADV.8', title: 'Quantifiers', topics: ['Precision', 'Volume'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M7',
      title: 'Module 25 - Indefinite Pronouns',
      iconItems: [
        { id: 'LADV.9', title: 'Indefinite Pronouns', topics: ['Scope'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M8',
      title: 'Module 26 - Check-in Check-out',
      iconItems: [
        { id: 'LADV.10', title: 'Hotel & Airport', topics: ['Roleplay', 'Friction'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M9',
      title: 'Module 27 - Slang & Contractions',
      iconItems: [
        { id: 'LADV.11', title: 'Wanna, Gonna, Gotta, Lemme', topics: ['Street', 'Fluidity'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M10',
      title: 'Module 28 - Abilities',
      iconItems: [
        { id: 'LADV.12', title: 'Can, Can\'t, May, Might', topics: ['Permissions', 'Capacities'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M11',
      title: 'Module 29 - Restaurant',
      iconItems: [
        { id: 'LADV.13', title: 'Restaurant Simulation', topics: ['Orders', 'Negotiation'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M12',
      title: 'Module 30 - Sequencers',
      iconItems: [
        { id: 'LADV.14', title: 'Sequencers & Connectors', topics: ['Argumentation', 'Concatenation'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M13',
      title: 'Module 31 - Verbs of Obligation',
      iconItems: [
        { id: 'LADV.15', title: 'Must, Have to & Should', topics: ['Duties', 'Necessities'], tags: ['ADVANCED'] }
      ]
    },
    {
      id: 'ADV.M14',
      title: 'Module 32 - Conditionals',
      iconItems: [
        { id: 'LADV.16', title: 'First & Second Conditionals', topics: ['Hypotheses', 'Logic'], tags: ['ADVANCED'] },
        { id: 'LADV.17', title: 'Third Conditional', topics: ['Past scenarios'], tags: ['ADVANCED'] }
      ]
    }
  ]
};

const CURRICULA: Record<string, Curriculum> = {
  'en': ENGLISH_CURRICULUM,
  'es': applyTranslations(ENGLISH_CURRICULUM, 'es'),
  'fr': applyTranslations(ENGLISH_CURRICULUM, 'fr'),
  'it': applyTranslations(ENGLISH_CURRICULUM, 'it'),
  'de': applyTranslations(ENGLISH_CURRICULUM, 'de'),
  'zh': applyTranslations(ENGLISH_CURRICULUM, 'zh'),
  'ja': applyTranslations(ENGLISH_CURRICULUM, 'ja'),
  'ko': applyTranslations(ENGLISH_CURRICULUM, 'ko'),
};

export const getCurriculum = (language: string): Curriculum => {
  return CURRICULA[language] || ENGLISH_CURRICULUM;
};

export const getAllIconItems = (language: string): IconItem[] => {
  const curriculum = getCurriculum(language);
  return curriculum.modules.flatMap(m => m.iconItems);
};
