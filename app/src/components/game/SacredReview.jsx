import React from 'react';
import { motion } from 'framer-motion';
import './SacredReview.css';

const SacredReview = ({ questions, userAnswers }) => {
  if (!questions || !userAnswers || questions.length === 0 || userAnswers.length === 0) return null;

  return (
    <div className="review-area" id="sacred-review-printable">
      <h3 className="review-title">📖 Sacred Review</h3>
      <div className="review-grid">
        {questions.map((q, i) => {
          const ans = userAnswers.find(a => a.questionIndex === i);
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`review-item glass-panel ${ans?.isCorrect ? 'is-correct' : 'is-wrong'}`}
            >
              <div className="review-header">
                <span className="q-number">QUESTION {i + 1}</span>
                <span className={`q-status-badge ${ans?.isCorrect ? 'correct' : 'wrong'}`}>
                  {ans?.isCorrect ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>
              <p className="review-text">{q.question}</p>
              <div className="review-options">
                {q.options.map((opt, j) => (
                  <div key={j} className={`review-opt ${opt === q.correct ? 'correct' : ''} ${opt === ans?.selected && !ans?.isCorrect ? 'wrong' : ''}`}>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="review-insight">
                <label>INSIGHT</label>
                <p>{q.explanation}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SacredReview;
