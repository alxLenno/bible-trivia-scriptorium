import { useState, useEffect, useRef } from 'react';
import { generateAITriviaSet } from '../aiService';
import { bibleTopics } from '../constants';
import { 
  createGameRoom, 
  joinGameRoom, 
  startRoom, 
  submitScore, 
  listenToRoom, 
  updateRoomQuestions, 
  updateLiveScore, 
  advanceRoomQuestion, 
  forfeitRoom, 
  setRoomReveal, 
  endGameRoom, 
  saveSoloGame 
} from '../gameRoom';

export const useTriviaGame = (user, nickname, config, setConfig, setGameState) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [revealRequested, setRevealRequested] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  
  const [roomCode, setRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  
  const timerRef = useRef(null);
  const lastSyncedQRef = useRef(null);
  const roomUnsubRef = useRef(null);

  // Timer Logic
  useEffect(() => {
    // Note: The timer logic from App.jsx is quite integrated with state.
    // I will pass the necessary setters and state to this hook.
  }, []);

  const resetGameEngine = () => {
    if (roomUnsubRef.current) { roomUnsubRef.current(); roomUnsubRef.current = null; }
    localStorage.removeItem('aby_roomCode');
    lastSyncedQRef.current = null;
    setScore(0);
    setCurrentIndex(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setRoomCode('');
    setRoomData(null);
    setIsMultiplayer(false);
    setUserAnswers([]);
    setRevealed(false);
    setRevealRequested(false);
  };

  return {
    loading, setLoading,
    questions, setQuestions,
    currentIndex, setCurrentIndex,
    answered, setAnswered,
    selectedAnswer, setSelectedAnswer,
    revealed, setRevealed,
    revealRequested, setRevealRequested,
    score, setScore,
    timeLeft, setTimeLeft,
    combo, setCombo,
    highestCombo, setHighestCombo,
    userAnswers, setUserAnswers,
    roomCode, setRoomCode,
    roomData, setRoomData,
    isMultiplayer, setIsMultiplayer,
    timerRef, lastSyncedQRef, roomUnsubRef,
    resetGameEngine
  };
};
