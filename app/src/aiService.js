import { API_BASE, STATS_API } from './gameRoom';
import { VERSION_LANGUAGES } from './translations';

export const getChatSessions = async (uid) => {
  try {
    const response = await fetch(`${STATS_API}/chat/${uid}`);
    const data = await response.json();
    if (data.success) {
      return data.sessions || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch chat sessions:", error);
    return [];
  }
};

export const getChatSession = async (sessionId) => {
  try {
    const response = await fetch(`${STATS_API}/chat/session/${sessionId}`);
    const data = await response.json();
    if (data.success) {
      return data.session;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch chat session:", error);
    return null;
  }
};

export const saveChatSession = async (uid, sessionId, messages, title) => {
  try {
    await fetch(`${STATS_API}/chat/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, messages, title })
    });
  } catch (error) {
    console.error("Failed to save chat session:", error);
  }
};

export const deleteChatSession = async (sessionId) => {
  try {
    const response = await fetch(`${STATS_API}/chat/session/${sessionId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return false;
  }
};

/**
 * Parses a string like "Genesis 1:1-5" into a structured query the backend understands
 */
const parseReference = (ref) => {
  const regex = /(.+?)\s+(\d+):(\d+)(?:-(\d+))?/;
  const match = ref.match(regex);
  if (!match) return null;

  const [_, book, chapter, startVerse, endVerse] = match;
  const start = parseInt(startVerse);
  const end = endVerse ? parseInt(endVerse) : start;
  
  const verses = [];
  for (let i = start; i <= end; i++) verses.push(i);

  return {
    book: book.trim(),
    chapter: parseInt(chapter),
    verses: verses
  };
};

export const lookupVerses = async (queryInput, version = 'KJV') => {
  try {
    // If input is a string (e.g. "John 3:16"), parse it into a structured query list
    let queries = queryInput;
    if (typeof queryInput === 'string') {
      const parsed = parseReference(queryInput);
      queries = parsed ? [parsed] : [];
    }

    if (!queries || queries.length === 0) return [];

    const response = await fetch(`${STATS_API}/bible/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries, version })
    });
    
    const data = await response.json();
    if (data.success && data.results) {
      // Flatten the results into a single list of verses
      const allVerses = [];
      data.results.forEach(res => {
        res.verses.forEach(v => {
          allVerses.push({
            book: res.book,
            chapter: res.chapter,
            verse: v.verse,
            text: v.text
          });
        });
      });
      return allVerses;
    }
  } catch (error) {
    console.error("Bible lookup failed:", error);
  }
  return [];
};

const buildPrompt = (mode, target, count, version, difficulty) => {
  const seed = Date.now(); // ensures different questions each time
  
  const angles = [
    "Focus heavily on lesser-known facts, minor characters, and obscure details.",
    "Focus on numbers, quantities, ages, and durations mentioned.",
    "Focus on the exact sequence of events and cause-and-effect.",
    "Focus on specific quotes and who said what to whom.",
    "Focus on geographical locations, mountains, bodies of water, and cities.",
    "Focus on family lineages, relationships, tribes, and ancestors.",
    "Focus on specific miracles, divine judgments, and supernatural events.",
    "Focus on symbolic items, garments, visions, and building materials."
  ];
  const randomAngle = angles[Math.floor(Math.random() * angles.length)];

  const difficultyGuide = {
    easy: "Ask simple factual recall questions (names, places, basic events). Suitable for beginners.",
    medium: "Ask questions requiring understanding of context, relationships between characters, and sequence of events.",
    hard: "Ask deep theological, symbolic, and cross-referential questions. Include questions about Hebrew/Greek meanings, prophecies, and their fulfillments."
  };

  let contextInstruction = "";
  
  if (mode === "book") {
    contextInstruction = `Focus EXCLUSIVELY on the book of ${target}. 
    Ask about specific events, characters, prophecies, laws, or teachings found in ${target}.`;
  } else if (mode === "chapter") {
    contextInstruction = `Focus EXCLUSIVELY on ${target.book} Chapter ${target.chapter}.
    Be very precise — every question must be answerable from ${target.book} Chapter ${target.chapter} alone.`;
  } else if (mode === "topic") {
    contextInstruction = `Focus on the biblical topic of "${target}".
    Ask questions about how ${target} is demonstrated across different books, key verses, and figures.`;
  } else {
    contextInstruction = `Ask questions from across the entire Bible — Old and New Testament.
    Cover a wide range: creation, patriarchs, exodus, kings, prophets, gospels, epistles, revelation.`;
  }

  const langCode = VERSION_LANGUAGES[version] || 'en';
  const langNames = { en: 'English', sw: 'Swahili', nl: 'Dutch' };
  const targetLanguage = langNames[langCode] || 'English';

  return `You are a Bible trivia generator. Generate ${count} unique, high-quality multiple-choice trivia questions.

LANGUAGE INSTRUCTION (CRITICAL):
You MUST generate the entire JSON response (including questions, options, correct_answer, and explanation) strictly in the ${targetLanguage} language.

CONTEXT: ${contextInstruction}

UNIQUE FOCUS FOR THIS BATCH: ${randomAngle} (Make sure your questions heavily feature this specific angle).

DIFFICULTY: ${difficulty.toUpperCase()} — ${difficultyGuide[difficulty]}

BIBLE VERSION CONTEXT: Questions should align with ${version} translation terminology in ${targetLanguage}.

VARIETY RULES (CRITICAL):
- Each question MUST be a different TYPE. Mix these styles:
  1. "Who" questions (characters, authors)
  2. "What" questions (events, objects, miracles)  
  3. "Where" questions (places, geography)
  4. "How many" questions (numbers, quantities)
  5. "Why" questions (motivations, theology)
  6. "What happened" questions (sequence, cause-effect)
- NEVER repeat the same question style twice in a row.
- NEVER ask "complete this verse" or "which verse says".
- Every question must be a STANDALONE trivia question.
- Each question must have exactly 4 plausible options with only ONE correct answer.
- Include a meaningful explanation (2-3 sentences) that teaches the reader WHY the answer is correct, followed by a scripture reference. Never return just verse numbers alone — always explain the context.

ANSWER LEAK PREVENTION (CRITICAL — NEVER VIOLATE):
- The correct answer must NEVER appear anywhere in the question text.
- Do NOT mention the answer's name, place, or key term in the question itself.
- BAD example: "Who was the ancestor of the tribe of Judah?" (answer: "Judah") — the answer is IN the question!
- GOOD example: "Which of Jacob's sons became the ancestor of the royal tribe of Israel?" (answer: "Judah")
- If the question naturally contains the answer word, REPHRASE the question to avoid it.

FACTUAL ACCURACY (CRITICAL — NEVER VIOLATE):
- Every question and answer MUST be verifiable from the actual biblical text.
- NEVER fabricate, invent, or assume details that are not explicitly stated in scripture.
- The explanation MUST cite a specific, real scripture reference that directly supports the correct answer.
- Do NOT combine or conflate events from different passages into a single misleading question.
- If you are unsure whether a fact is accurate, DO NOT include that question. Generate a different one instead.

UNIQUENESS SEED: ${seed}

OUTPUT: Respond with ONLY a valid JSON array. No markdown, no explanation, just JSON:
[
  {
    "question": "standalone trivia question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": "the exact correct option string",
    "difficulty": "${difficulty}",
    "explanation": "2-3 sentence explanation of WHY this is correct, with context. (Scripture reference e.g. Genesis 3:15)"
  }
]`;
};

export const sendChatToAI = async (message, history = [], modelId = "llama-3-8b") => {
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, model_id: modelId })
    });
    
    const data = await response.json();
    if (data.success) {
      return {
        text: data.response,
        audioUrl: data.audio_url ? `${import.meta.env.VITE_HF_SPACE_URL || 'https://lennoxkk-trivia-model.hf.space'}${data.audio_url}` : null
      };
    }
    throw new Error(data.error || "Backend AI failed");
  } catch (error) {
    console.error("Chat service error:", error);
    return {
      text: "I'm having trouble connecting to the Scriptorium archives right now. Please try again in a moment.",
      error: true
    };
  }
};

export const generateAITriviaSet = async (mode, target, count, version, difficulty = "medium") => {
  const prompt = buildPrompt(mode, target, count, version, difficulty);
  
  try {
    const response = await fetch(`${API_BASE}/ai/generate_trivia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    if (data.success && Array.isArray(data.response)) {
      const questions = data.response.map(q => ({
        ...q,
        difficulty: q.difficulty || difficulty,
        isAI: true
      }));
      return questions;
    }
    throw new Error(data.error || "Failed to generate trivia from backend");
  } catch (error) {
    console.error("Backend Trivia Generation failed, using local bank:", error.message);
    return getContextualFallback(mode, target, count, difficulty);
  }
};

// --- AI VERIFICATION PASS ---
// Sends generated questions back to the AI to verify biblical accuracy.
// Removes any question the AI flags as inaccurate.
const verifyQuestions = async (questions) => {
  // Verification logic is now handled in the backend during generation
  // or can be added as a separate endpoint if needed.
  // For now, we'll assume the backend provides verified results.
  return questions;
};

// Large, categorized question bank for smart fallbacks
const questionBank = {
  general: [
    { question: "Who was the first king of Israel?", options: ["David", "Saul", "Solomon", "Samuel"], correct: "Saul", explanation: "Saul was anointed by Samuel (1 Samuel 10:1).", difficulty: "easy" },
    { question: "How many days and nights did it rain during the Great Flood?", options: ["20", "30", "40", "50"], correct: "40", explanation: "It rained 40 days and 40 nights (Genesis 7:12).", difficulty: "easy" },
    { question: "What was the name of the garden where Adam and Eve lived?", options: ["Gethsemane", "Eden", "Babylon", "Sharon"], correct: "Eden", explanation: "God planted a garden in Eden (Genesis 2:8).", difficulty: "easy" },
    { question: "Who built the ark?", options: ["Abraham", "Moses", "Noah", "David"], correct: "Noah", explanation: "God commanded Noah to build the ark (Genesis 6:14).", difficulty: "easy" },
    { question: "Which disciple denied Jesus three times?", options: ["John", "James", "Judas", "Peter"], correct: "Peter", explanation: "Peter denied knowing Jesus three times before the rooster crowed (Luke 22:61).", difficulty: "easy" },
    { question: "What was the profession of the apostle Paul before his conversion?", options: ["Fisherman", "Tax collector", "Tentmaker and Pharisee", "Shepherd"], correct: "Tentmaker and Pharisee", explanation: "Paul was a Pharisee and tentmaker (Acts 18:3, Philippians 3:5).", difficulty: "medium" },
    { question: "Which Old Testament prophet was taken up to heaven in a chariot of fire?", options: ["Elisha", "Elijah", "Isaiah", "Ezekiel"], correct: "Elijah", explanation: "Elijah was taken up by a whirlwind with chariots of fire (2 Kings 2:11).", difficulty: "medium" },
    { question: "What material was used to make the Ark of the Covenant?", options: ["Cedar wood", "Acacia wood", "Olive wood", "Bronze"], correct: "Acacia wood", explanation: "God instructed acacia wood overlaid with gold (Exodus 25:10-11).", difficulty: "medium" },
    { question: "In the parable of the sower, what does the seed represent?", options: ["Faith", "The Word of God", "Good works", "Prayer"], correct: "The Word of God", explanation: "Jesus explained the seed is the Word of God (Luke 8:11).", difficulty: "medium" },
    { question: "What is the shortest verse in the Bible (KJV)?", options: ["God is love.", "Jesus wept.", "Pray always.", "Amen."], correct: "Jesus wept.", explanation: "John 11:35 — 'Jesus wept.' is the shortest verse.", difficulty: "medium" },
    { question: "What does the Greek word 'agape' specifically refer to in the New Testament?", options: ["Brotherly love", "Romantic love", "Unconditional divine love", "Self-love"], correct: "Unconditional divine love", explanation: "Agape describes God's selfless, sacrificial love (1 John 4:8).", difficulty: "hard" },
    { question: "Which book of the Bible does not mention God by name?", options: ["Ruth", "Esther", "Song of Solomon", "Philemon"], correct: "Esther", explanation: "The book of Esther never directly mentions God's name.", difficulty: "hard" },
    { question: "What is the significance of the number 7 in biblical numerology?", options: ["Judgment", "Completion and perfection", "Testing", "Covenant"], correct: "Completion and perfection", explanation: "Seven represents divine completion (Genesis 2:2, Revelation).", difficulty: "hard" },
    { question: "Who wrote the most books in the New Testament?", options: ["Peter", "John", "Paul", "Luke"], correct: "Paul", explanation: "Paul authored 13 epistles in the New Testament.", difficulty: "medium" },
    { question: "What were the names of the two trees in the Garden of Eden?", options: ["Tree of Life and Tree of Knowledge", "Tree of Wisdom and Tree of Life", "Tree of Good and Tree of Evil", "Tree of Light and Tree of Darkness"], correct: "Tree of Life and Tree of Knowledge", explanation: "The Tree of Life and the Tree of Knowledge of Good and Evil (Genesis 2:9).", difficulty: "medium" },
  ],
  Genesis: [
    { question: "On which day did God create humans?", options: ["5th", "6th", "7th", "3rd"], correct: "6th", explanation: "God created man on the sixth day (Genesis 1:27-31).", difficulty: "easy" },
    { question: "What was the sign of God's covenant with Noah?", options: ["A dove", "A rainbow", "A burning bush", "A star"], correct: "A rainbow", explanation: "God set a rainbow as the sign of His covenant (Genesis 9:13).", difficulty: "easy" },
    { question: "How old was Abraham when Isaac was born?", options: ["75", "90", "100", "120"], correct: "100", explanation: "Abraham was 100 years old when Isaac was born (Genesis 21:5).", difficulty: "medium" },
    { question: "What did Esau sell his birthright for?", options: ["Gold coins", "A field", "A bowl of stew", "A flock of sheep"], correct: "A bowl of stew", explanation: "Esau sold his birthright for bread and lentil stew (Genesis 25:34).", difficulty: "easy" },
    { question: "Who was Joseph's mother?", options: ["Leah", "Rachel", "Bilhah", "Zilpah"], correct: "Rachel", explanation: "Rachel bore Joseph to Jacob (Genesis 30:22-24).", difficulty: "medium" },
  ],
  Exodus: [
    { question: "How many plagues did God send upon Egypt?", options: ["7", "10", "12", "5"], correct: "10", explanation: "God sent 10 plagues on Egypt (Exodus 7-12).", difficulty: "easy" },
    { question: "What was the final plague that convinced Pharaoh to release the Israelites?", options: ["Darkness", "Locusts", "Death of firstborn", "Boils"], correct: "Death of firstborn", explanation: "The tenth plague was the death of every firstborn (Exodus 12:29).", difficulty: "easy" },
    { question: "What did Moses strike to bring water in the wilderness?", options: ["A tree", "A rock", "The ground", "A mountain"], correct: "A rock", explanation: "Moses struck the rock at Horeb (Exodus 17:6).", difficulty: "medium" },
  ],
  Matthew: [
    { question: "How many wise men visited baby Jesus according to Matthew?", options: ["Two", "Three", "The Bible doesn't specify", "Twelve"], correct: "The Bible doesn't specify", explanation: "Matthew 2:1 mentions 'wise men' (Magi) but never states how many.", difficulty: "hard" },
    { question: "What mountain did Jesus deliver the Beatitudes from?", options: ["Mount Sinai", "Mount Carmel", "A mountainside (unnamed)", "Mount Zion"], correct: "A mountainside (unnamed)", explanation: "Matthew 5:1 says Jesus went up on a mountainside, but it is unnamed.", difficulty: "medium" },
  ],
  love: [
    { question: "According to 1 Corinthians 13, love is patient and ___?", options: ["Strong", "Kind", "Fearless", "Wise"], correct: "Kind", explanation: "Love is patient, love is kind (1 Corinthians 13:4).", difficulty: "easy" },
    { question: "In John 3:16, what motivated God to give His only Son?", options: ["Obedience", "Judgment", "Love for the world", "A promise to Abraham"], correct: "Love for the world", explanation: "'For God so loved the world...' (John 3:16).", difficulty: "easy" },
    { question: "Which book says 'God is love'?", options: ["Romans", "1 John", "Ephesians", "Hebrews"], correct: "1 John", explanation: "'God is love' appears in 1 John 4:8.", difficulty: "medium" },
  ],
  faith: [
    { question: "According to Hebrews 11:1, faith is the substance of things hoped for and the evidence of things ___?", options: ["Seen", "Not seen", "Believed", "Promised"], correct: "Not seen", explanation: "Faith is the evidence of things not seen (Hebrews 11:1).", difficulty: "easy" },
    { question: "Who is called the 'father of faith'?", options: ["Moses", "David", "Abraham", "Noah"], correct: "Abraham", explanation: "Abraham is called the father of faith (Romans 4:16).", difficulty: "easy" },
    { question: "In James 2:26, faith without works is described as what?", options: ["Weak", "Incomplete", "Dead", "Blind"], correct: "Dead", explanation: "Faith without works is dead (James 2:26).", difficulty: "medium" },
  ],
  strength: [
    { question: "Who said 'I can do all things through Christ who strengthens me'?", options: ["Peter", "Paul", "John", "James"], correct: "Paul", explanation: "Paul wrote this in Philippians 4:13.", difficulty: "easy" },
    { question: "Which judge's strength was in his hair?", options: ["Gideon", "Samson", "Jephthah", "Ehud"], correct: "Samson", explanation: "Samson's strength was tied to his Nazirite vow and uncut hair (Judges 16:17).", difficulty: "easy" },
  ],
  peace: [
    { question: "Who said 'Peace I leave with you; my peace I give you'?", options: ["Moses", "David", "Jesus", "Paul"], correct: "Jesus", explanation: "Jesus spoke these words to His disciples (John 14:27).", difficulty: "easy" },
    { question: "What does the Hebrew word 'Shalom' mean beyond just 'peace'?", options: ["Silence", "Wholeness, completeness, welfare", "Absence of war", "Submission"], correct: "Wholeness, completeness, welfare", explanation: "Shalom encompasses total well-being, not just absence of conflict.", difficulty: "hard" },
  ],
  wisdom: [
    { question: "Who asked God for wisdom and received it?", options: ["David", "Solomon", "Daniel", "Joseph"], correct: "Solomon", explanation: "Solomon asked for wisdom at Gibeon (1 Kings 3:9-12).", difficulty: "easy" },
    { question: "According to Proverbs 9:10, what is the beginning of wisdom?", options: ["Knowledge", "Understanding", "The fear of the Lord", "Obedience"], correct: "The fear of the Lord", explanation: "The fear of the Lord is the beginning of wisdom (Proverbs 9:10).", difficulty: "easy" },
  ]
};

function getContextualFallback(mode, target, count, difficulty) {
  let pool = [];
  
  if (mode === "book" && questionBank[target]) {
    pool = questionBank[target];
  } else if (mode === "topic" && questionBank[target.toLowerCase()]) {
    pool = questionBank[target.toLowerCase()];
  } else {
    pool = questionBank.general;
  }

  // Filter by difficulty if possible, otherwise use all
  let filtered = pool.filter(q => q.difficulty === difficulty);
  if (filtered.length < count) filtered = pool;

  // Shuffle and return requested count
  return filtered.sort(() => 0.5 - Math.random()).slice(0, count).map(q => ({...q, isAI: false}));
}
