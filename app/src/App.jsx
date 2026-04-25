import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import './App.css';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

// Services
import { generateAITriviaSet, sendChatToAI, getChatSessions, getChatSession, saveChatSession, deleteChatSession, lookupVerses } from './aiService';
import { preloadAllBibles } from './bibleLookup';
import { bibleTopics } from './constants';

// Preload all Bible versions in the background for instant lookups
preloadAllBibles();
import { 
  createGameRoom, joinGameRoom, startRoom, submitScore, listenToRoom, 
  updateRoomQuestions, updateLiveScore, advanceRoomQuestion, forfeitRoom, 
  getGlobalLeaderboard, getUserHistory, setRoomReveal, endGameRoom, saveSoloGame, getAllUsers 
} from './gameRoom';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LandingPage from './components/LandingPage';
import Menu from './components/menu/Menu';
import GameSetup from './components/game/GameSetup';
import Lobby from './components/game/Lobby';
import Gameplay from './components/game/Gameplay';
import Results from './components/game/Results';
import GlobalDashboard from './components/stats/GlobalDashboard';
import AIChat from './components/chat/AIChat';
import ProfileDashboard from './components/profile/ProfileDashboard';
import AdminPanel from './components/admin/AdminPanel';
import VerseLookup from './components/common/VerseLookup';

const BibleTrivia = () => {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('landing');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lookupRef, setLookupRef] = useState(null); // { ref, x, y }

  // Config
  const [config, setConfig] = useState({
    version: 'KJV', mode: 'general', target: null,
    difficulty: 'medium', numQuestions: 5, timePerQuestion: 15
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Game State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [revealRequested, setRevealRequested] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [userAnswers, setUserAnswers] = useState([]);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);

  // Multiplayer
  const [roomCode, setRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [nickname, setNickname] = useState(localStorage.getItem('aby_nickname') || '');
  const [isJoining, setIsJoining] = useState(false);
  
  // Stats & Chat
  const [globalLeaderboardData, setGlobalLeaderboardData] = useState([]);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Welcome to the Scriptorium archives. I am your AI Scribe.' }]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatModel, setChatModel] = useState('llama-3-8b');
  const [userStats, setUserStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const lastSyncedQRef = useRef(null);
  const roomUnsubRef = useRef(null);
  const chatScrollRef = useRef(null);

  // --- EFFECTS ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        const defaultNick = localStorage.getItem('aby_nickname') || u.displayName?.split(' ')[0] || 'Player';
        setNickname(defaultNick);
        const savedRoom = localStorage.getItem('aby_roomCode');
        if (savedRoom) handleJoinRoom(savedRoom);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (gameState === 'profile' && user) fetchProfile();
    if (gameState === 'chat' && user) fetchSessions();
  }, [gameState, user]);

  useEffect(() => {
    if (gameState === 'playing' && !revealed && timeLeft > 0) {
      if (isMultiplayer && roomData?.status === 'reveal') setTimeLeft(0);
      else timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (timeLeft === 0 && !revealed && gameState === 'playing') {
        if (!answered) handleAnswer(null);
        if (!isMultiplayer) setRevealed(true);
        else if (roomData?.hostId === user?.uid && !revealRequested) {
          setRevealRequested(true);
          setRoomReveal(roomCode);
        }
      }
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, revealed, timeLeft, answered, isMultiplayer, roomData?.status, roomData?.hostId, user?.uid, roomCode, revealRequested]);

  // Multiplayer Sync
  useEffect(() => {
    if (!isMultiplayer || !roomData?.questions?.length) return;
    const newFingerprint = roomData.questions[0]?.question;
    if (newFingerprint && newFingerprint !== lastSyncedQRef.current) {
      lastSyncedQRef.current = newFingerprint;
      setQuestions(roomData.questions);
      if (gameState === 'results' && roomData.status === 'playing') startNewRound();
      else if (gameState === 'results' && roomData.status === 'lobby') setGameState('lobby');
    }
  }, [roomData?.questions, isMultiplayer]);

  useEffect(() => {
    if (isMultiplayer && gameState === 'lobby' && roomData?.status === 'playing') startNewRound();
  }, [roomData?.status, gameState, isMultiplayer]);

  useEffect(() => {
    if (isMultiplayer && gameState === 'playing' && roomData?.currentQuestion !== undefined && roomData.currentQuestion > currentIndex) {
      advanceLocalQuestion(roomData.currentQuestion);
    }
  }, [roomData?.currentQuestion, gameState, isMultiplayer]);

  useEffect(() => {
    if (isMultiplayer && gameState === 'playing' && roomData?.status === 'reveal' && !revealed) {
       setRevealed(true);
       if (roomCode && user) updateLiveScore(roomCode, user.uid, score, combo, userAnswers);
    }
  }, [roomData?.status, gameState, revealed, userAnswers]);

  useEffect(() => {
    if (isMultiplayer && gameState === 'playing' && roomData?.status === 'finished') {
      if (roomUnsubRef.current) roomUnsubRef.current();
      localStorage.removeItem('aby_roomCode');
      setGameState('results');
    }
  }, [roomData?.status]);

  // --- HANDLERS ---
  const handleSignIn = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { console.error(e); } };
  
  const startSoloGame = async () => {
    setLoading(true); setIsMultiplayer(false);
    try {
      let targetName = getTargetName();
      const qs = await generateAITriviaSet(config.mode, targetName, config.numQuestions, config.version, config.difficulty);
      if (qs?.length > 0) setupNewGame(qs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!user) { handleSignIn(); return; }
    setLoading(true); setIsMultiplayer(true);
    try {
      const aiPromise = generateAITriviaSet(config.mode, getTargetName(), config.numQuestions, config.version, config.difficulty);
      const code = await createGameRoom(user, nickname, [], config);
      setRoomCode(code);
      roomUnsubRef.current = listenToRoom(code, data => setRoomData(data));
      setGameState('lobby'); setLoading(false);
      const qs = await aiPromise;
      if (qs?.length > 0) { await updateRoomQuestions(code, qs); setQuestions(qs); }
    } catch (e) { console.error(e); setLoading(false); }
  };

  const handleJoinRoom = async (code) => {
    if (!user) { handleSignIn(); return; }
    const codeToUse = code || joinCode.toUpperCase();
    if (!isJoining && !code) { setIsJoining(true); return; }
    try {
      const data = await joinGameRoom(codeToUse, user, nickname);
      setRoomCode(codeToUse); setQuestions(data.questions); setConfig(prev => ({ ...prev, ...data.config }));
      setIsMultiplayer(true);
      roomUnsubRef.current = listenToRoom(codeToUse, roomSnap => setRoomData(roomSnap));
      setGameState('lobby'); setIsJoining(false);
    } catch (e) { alert(e.message); setIsJoining(false); }
  };

  const handleAnswer = (option) => {
    if (answered) return;
    setSelectedAnswer(option); setAnswered(true);
    if (!isMultiplayer) setRevealed(true);
    
    let updatedScore = score;
    let newCombo = combo;
    if (option === questions[currentIndex].correct) {
      newCombo += 1;
      updatedScore += 100 + Math.floor((timeLeft / config.timePerQuestion) * 50) + (newCombo > 1 ? (newCombo * 10) : 0);
      setScore(updatedScore); setCombo(newCombo); setHighestCombo(Math.max(highestCombo, newCombo));
    } else {
      newCombo = 0; setCombo(0);
    }
    setUserAnswers(prev => [...prev, { questionIndex: currentIndex, selected: option, correct: questions[currentIndex].correct, isCorrect: option === questions[currentIndex].correct }]);
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      if (isMultiplayer && roomData?.hostId === user?.uid) advanceRoomQuestion(roomCode, nextIdx);
      advanceLocalQuestion(nextIdx);
    } else {
      if (isMultiplayer && roomData?.hostId === user?.uid) { await submitScore(roomCode, user.uid, score, combo, userAnswers); await endGameRoom(roomCode); }
      else if (!isMultiplayer) {
        if (user) saveSoloGame(user.uid, nickname || user.displayName, user.photoURL, score, highestCombo, score > 0, config, questions, userAnswers).catch(e => console.error(e));
        setGameState('results');
      }
    }
  };

  // Helper logic
  const getTargetName = () => {
    if (config.mode === 'topic') return bibleTopics.find(t => t.id === config.target)?.name;
    if (config.mode === 'book' || config.mode === 'chapter') return config.target;
    return 'general';
  };
  const setupNewGame = (qs) => { 
    setQuestions(qs); 
    setCurrentIndex(0); 
    setScore(0); 
    setCombo(0); 
    setHighestCombo(0); 
    setAnswered(false); 
    setSelectedAnswer(null); 
    setRevealed(false); 
    setRevealRequested(false);
    setUserAnswers([]);
    setTimeLeft(config.timePerQuestion || 15); 
    setGameState('playing'); 
  };
  const startNewRound = () => { setupNewGame(questions); setTimeLeft(config.timePerQuestion || 15); };
  const advanceLocalQuestion = (idx) => { setCurrentIndex(idx); setAnswered(false); setSelectedAnswer(null); setRevealed(false); setRevealRequested(false); setTimeLeft(config.timePerQuestion || 15); };
  const fetchProfile = async () => { setDashboardLoading(true); try { const data = await getUserHistory(user.uid); setUserStats(data.stats); setUserHistory(data.history); } finally { setDashboardLoading(false); } };
  const fetchSessions = async () => { if (user) setChatSessions(await getChatSessions(user.uid)); };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user', text: chatInput };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs); setChatInput(''); setChatLoading(true);
    try {
      const result = await sendChatToAI(userMsg.text, newMsgs.slice(0, -1).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })), chatModel);
      const finalMsgs = [...newMsgs, { role: 'ai', text: result.text, audio: result.audioUrl }];
      setChatMessages(finalMsgs);
      if (user) {
        const sessionId = activeSessionId || `session-${Date.now()}`;
        const title = activeSessionId ? null : (userMsg.text.slice(0, 30) + '...');
        const result_save = await saveChatSession(user.uid, sessionId, finalMsgs, title);
        if (!activeSessionId) { 
          setActiveSessionId(sessionId); 
          fetchSessions(); 
        }
      }
    } catch (e) { setChatMessages(p => [...p, { role: 'ai', text: `Error: ${e.message || "Connection interrupted."}` }]); }
    setChatLoading(false);
  };

  const handleVerseLookup = (ref, event) => {
    if (event) {
      const rect = event.target.getBoundingClientRect();
      setLookupRef({ ref, x: rect.left, y: rect.bottom + 6 });
    } else {
      setLookupRef({ ref, x: window.innerWidth / 2 - 200, y: 200 });
    }
  };

  const resetGame = () => { if (roomUnsubRef.current) roomUnsubRef.current(); setGameState('landing'); resetGameEngine(); };
  const resetGameEngine = () => { 
    localStorage.removeItem('aby_roomCode'); 
    setScore(0); 
    setCurrentIndex(0); 
    setAnswered(false); 
    setSelectedAnswer(null); 
    setRevealed(false); 
    setRevealRequested(false);
    setRoomCode(''); 
    setRoomData(null); 
    setIsMultiplayer(false); 
    setUserAnswers([]); 
    lastSyncedQRef.current = null; 
    window.history.replaceState({}, '', window.location.pathname); 
  };

  // Navigate to GlobalDashboard (fetches leaderboard data first)
  const openGlobalDashboard = async () => {
    try {
      const lb = await getGlobalLeaderboard();
      setGlobalLeaderboardData(lb);
    } catch (e) { console.error("Could not fetch leaderboard:", e); }
    setGameState('stats');
  };

  // Handle sidebar navigation from dashboard
  const handleDashboardNavigate = (target) => {
    if (target === 'setup-classic') {
      setConfig({ ...config, mode: 'general', timePerQuestion: 15 });
      setGameState('setup');
    } else if (target === 'setup-blitz') {
      setConfig({ ...config, mode: 'general', timePerQuestion: 7 });
      setGameState('setup');
    } else if (target === 'setup-theme') {
      setConfig({ ...config, mode: 'topic' });
      setGameState('setup');
    } else {
      setGameState(target);
    }
  };

  // --- RENDER ---
  if (gameState === 'landing') {
    return <LandingPage user={user} onSignIn={handleSignIn} onEnter={() => setGameState('menu')} />;
  }

  return (
    <div className="app-container">
      <Header user={user} gameState={gameState} setGameState={setGameState} onSignIn={handleSignIn} resetGame={resetGame} onOpenDashboard={openGlobalDashboard} />
      <main className="content" style={{ padding: gameState === 'stats' ? 0 : '1rem' }}>
        {gameState === 'menu' && <Menu onSolo={() => setGameState('setup')} onMulti={() => setGameState('setup-multi')} onChat={() => setGameState('chat')} joinCode={joinCode} setJoinCode={setJoinCode} onJoin={() => handleJoinRoom()} isJoining={isJoining} nickname={nickname} setNickname={setNickname} onConfirmJoin={() => handleJoinRoom()} onCancelJoin={() => setIsJoining(false)} />}
        {(gameState === 'setup' || gameState === 'setup-multi') && <GameSetup isMultiplayer={gameState === 'setup-multi'} config={config} setConfig={setConfig} selectedBook={selectedBook} setSelectedBook={setSelectedBook} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onStart={gameState === 'setup-multi' ? handleCreateRoom : startSoloGame} loading={loading} />}
        {gameState === 'lobby' && <Lobby roomCode={roomCode} roomData={roomData} user={user} onCopyLink={() => { navigator.clipboard.writeText(`${window.location.origin}?room=${roomCode}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }} copied={copied} onStartMultiplayer={() => startRoom(roomCode)} />}
        {gameState === 'playing' && questions.length > 0 && <Gameplay questions={questions} currentIndex={currentIndex} revealed={revealed} timeLeft={timeLeft} config={config} isMultiplayer={isMultiplayer} roomData={roomData} user={user} score={score} combo={combo} answered={answered} selectedAnswer={selectedAnswer} handleAnswer={handleAnswer} nextQuestion={nextQuestion} gracefullyForfeit={() => { if(window.confirm("Forfeit?")) { if(isMultiplayer) forfeitRoom(roomCode, user.uid); setGameState('results'); } }} />}
        {gameState === 'results' && <Results score={score} isMultiplayer={isMultiplayer} roomData={roomData} questions={questions} userAnswers={userAnswers} resetGame={resetGame} onShowGlobalStats={openGlobalDashboard} />}
        {gameState === 'stats' && <GlobalDashboard leaderboardData={globalLeaderboardData} userStats={userStats} user={user} onBack={resetGame} onRefresh={async () => setGlobalLeaderboardData(await getGlobalLeaderboard())} onNavigate={handleDashboardNavigate} />}
        {gameState === 'chat' && <AIChat sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} chatSessions={chatSessions} activeSessionId={activeSessionId} handleSelectSession={async id => { 
          const session = await getChatSession(id);
          if (session) {
            setActiveSessionId(id); 
            setChatMessages(JSON.parse(session.messages_json)); 
          }
        }} handleDeleteSession={async id => { if(window.confirm("Delete?")) { await deleteChatSession(id); if(activeSessionId===id) setActiveSessionId(null); fetchSessions(); } }} startNewSession={() => { setActiveSessionId(null); setChatMessages([{ role: 'ai', text: 'New session started.' }]); }} chatMessages={chatMessages} chatLoading={chatLoading} chatInput={chatInput} setChatInput={setChatInput} chatModel={chatModel} setChatModel={setChatModel} handleSendMessage={handleSendMessage} handleVerseLookup={handleVerseLookup} lookupRef={lookupRef} closeLookup={() => setLookupRef(null)} chatScrollRef={chatScrollRef} onExit={() => setGameState('menu')} />}
        {gameState === 'profile' && <ProfileDashboard user={user} nickname={nickname} setNickname={setNickname} userStats={userStats} userHistory={userHistory} dashboardLoading={dashboardLoading} onEnterAdmin={async () => { setGameState('admin'); setAdminLoading(true); setAdminUsers(await getAllUsers()); setAdminLoading(false); }} onExit={() => setGameState('menu')} onSignOut={() => { signOut(auth); resetGame(); }} />}
        {gameState === 'admin' && <AdminPanel adminUsers={adminUsers} adminLoading={adminLoading} onExit={() => setGameState('profile')} />}
      </main>
      <Footer />

    </div>
  );
};

export default BibleTrivia;
