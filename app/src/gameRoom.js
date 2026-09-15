import { resolveApiBase } from './apiConfig.js';

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('env') === 'local') {
  localStorage.setItem('aby_env', 'local');
} else if (urlParams.get('env') === 'prod') {
  localStorage.removeItem('aby_env');
}

export const API_BASE = resolveApiBase({
  hostname: window.location.hostname,
  configuredBase: import.meta.env.VITE_API_BASE,
  override: urlParams.get('env') || localStorage.getItem('aby_env'),
});
export const STATS_API = API_BASE;

// Create a new game room
export const createGameRoom = async (hostUser, nickname, questions, config) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: hostUser.uid,
        name: nickname || hostUser.displayName,
        photo: hostUser.photoURL,
        config: config
      })
    });

  } catch {
    throw new Error('Unable to connect to the room server. Check your connection and try again.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`The room server is unavailable (HTTP ${response.status}). Please try again shortly.`);
  }
  if (!response.ok || !data.success) throw new Error(data.error || 'Failed to create room');
  
  return data.code;
};

// Join a game room
export const joinGameRoom = async (roomCode, joiningUser, nickname) => {
  const response = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: joiningUser.uid,
      name: nickname || joiningUser.displayName,
      photo: joiningUser.photoURL
    })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Room not found! Check the code and try again.');
  
  return data.room;
};

// Start the game (host only)
export const startRoom = async (roomCode) => {
  const response = await fetch(`${API_BASE}/rooms/${roomCode}/start`, {
    method: 'POST'
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to start room');
};

// Trigger reveal phase (host only)
export const setRoomReveal = async (roomCode) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/reveal`, {
    method: 'POST'
  });
};

// End the game for everyone (host only)
export const endGameRoom = async (roomCode) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/end`, {
    method: 'POST'
  });
};

// Advance to next question (host only)
export const advanceRoomQuestion = async (roomCode, nextIndex) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index: nextIndex })
  });
};

// Forfeit game
export const forfeitRoom = async (roomCode, uid) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/forfeit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid })
  });
};

// Submit a player's score
export const submitScore = async (roomCode, uid, finalScore, combo = 0, answers = []) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, score: finalScore, combo, answers, finished: true })
  });
};

// Update a player's score during gameplay without marking as finished
export const updateLiveScore = async (roomCode, uid, currentScore, combo = 0, answers = []) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, score: currentScore, combo, answers, finished: false })
  });
};

// Listen to room changes via polling
export const listenToRoom = (roomCode, callback) => {
  const poll = async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.room) {
          callback(data.room);
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  };
  
  poll(); // Initial call
  const intervalId = setInterval(poll, 2000); // Poll every 2 seconds
  
  // Return a cleanup function similar to Firebase's unsubscribe
  return () => clearInterval(intervalId);
};

// Update room questions asynchronously
export const updateRoomQuestions = async (roomCode, questions) => {
  await fetch(`${API_BASE}/rooms/${roomCode}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions })
  });
};

// --- GLOBAL STATS API ---

export const getGlobalLeaderboard = async () => {
  const response = await fetch(`${STATS_API}/stats/leaderboard`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.leaderboard;
};

export const getAllUsers = async () => {
  const response = await fetch(`${STATS_API}/admin/users`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.users;
};

export const getUserHistory = async (uid) => {
  const response = await fetch(`${STATS_API}/stats/user/${uid}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return { stats: data.stats, history: data.history };
};

export const saveSoloGame = async (uid, nickname, photo, score, combo, won, config, questions, userAnswers) => {
  await fetch(`${STATS_API}/stats/user/${uid}/solo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, photo, score, combo, won, config, questions, userAnswers })
  });
};
