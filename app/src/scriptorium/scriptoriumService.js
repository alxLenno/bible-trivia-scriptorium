import { API_BASE } from '../gameRoom';
import { VERSION_LANGUAGES } from '../translations';

export const sendScriptoriumChat = async (message, history = [], context = {}) => {
  try {
    const response = await fetch(`${API_BASE}/scriptorium/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, context })
    });
    
    const data = await response.json();
    if (data.success) {
      return {
        text: data.response,
        genreDetected: data.genre_detected,
        scriptoriumActive: data.scriptorium_active
      };
    }
    throw new Error(data.error || "Backend AI failed");
  } catch (error) {
    console.error("Scriptorium Chat error:", error);
    return {
      text: "I'm having trouble connecting to the Scriptorium archives right now. Please try again in a moment.",
      error: true
    };
  }
};

export const generateScriptoriumTriviaSet = async (mode, target, count, version, difficulty = "scriptorium") => {
  try {
    const langCode = VERSION_LANGUAGES[version] || 'en';
    
    // Attempt to extract book name from the target or mode context for genre detection
    let bookName = null;
    if (mode === 'book') bookName = target;
    if (mode === 'chapter' && target?.book) bookName = target.book;
    
    const response = await fetch(`${API_BASE}/scriptorium/trivia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        mode, 
        target, 
        count, 
        version, 
        difficulty,
        language: langCode,
        book_name: bookName
      })
    });

    const data = await response.json();
    if (data.success && Array.isArray(data.response)) {
      const questions = data.response.map(q => ({
        ...q,
        difficulty: q.difficulty || difficulty,
        isAI: true,
        isScriptorium: true
      }));
      return questions;
    }
    throw new Error(data.error || "Failed to generate scriptorium trivia");
  } catch (error) {
    console.error("Scriptorium Trivia Generation failed:", error.message);
    throw error; // Let the caller fallback if they want
  }
};
