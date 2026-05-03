import React, { useState } from 'react';

export default function InteractiveQuiz({ title = "Quiz", questions = [] }) {
  const [mode, setMode] = useState(null); // 'study' or 'test'
  const [selectedSetIndex, setSelectedSetIndex] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const SET_SIZE = 20;
  const numSets = Math.ceil(questions.length / SET_SIZE);

  if (!questions || questions.length === 0) {
    return <div style={{ color: 'var(--text-secondary)' }}>No questions available.</div>;
  }

  const startQuiz = (setIndex) => {
    setSelectedSetIndex(setIndex);
    setStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setQuizCompleted(false);
  };

  const handleOptionSelect = (option) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(option);
  };

  const activeQuestions = selectedSetIndex !== null 
    ? questions.slice(selectedSetIndex * SET_SIZE, (selectedSetIndex + 1) * SET_SIZE)
    : questions; // Fallback

  const nextQuestion = () => {
    setAnswers([...answers, selectedOption]);

    if (currentQuestionIndex + 1 < activeQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    setStarted(false);
    setSelectedSetIndex(null);
    setMode('test');
  };

  const resetMode = () => {
    setMode(null);
    setStarted(false);
    setSelectedSetIndex(null);
  };

  const getCorrectOption = (q) => {
    if (typeof q.correctAnswer === 'number') {
      return q.options[q.correctAnswer];
    }
    return q.correctAnswer;
  };

  // MAIN MENU (Select Mode)
  if (!mode) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧪</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: 'white', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-secondary, #a0aec0)', marginBottom: '32px' }}>
          {questions.length} questions available
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button
            onClick={() => setMode('study')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '2rem' }}>📖</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Study Mode</span>
            <span style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Review all questions and answers</span>
          </button>

          <button
            onClick={() => {
              if (questions.length <= SET_SIZE) {
                // If 20 or fewer questions, just start the quiz immediately
                startQuiz(0);
                setMode('test');
              } else {
                setMode('test');
              }
            }}
            style={{
              background: 'rgba(49, 130, 206, 0.1)',
              border: '1px solid rgba(49, 130, 206, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(49, 130, 206, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(49, 130, 206, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '2rem' }}>✍️</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Test Mode</span>
            <span style={{ fontSize: '0.9rem', color: '#a0aec0' }}>
              {questions.length > SET_SIZE ? `Take a quiz in sets of ${SET_SIZE}` : 'Take the quiz'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // STUDY MODE
  if (mode === 'study') {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', margin: 0 }}>Study Mode</h2>
          <button 
            onClick={resetMode}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary, #a0aec0)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary, #a0aec0)'}
          >
            ← Back
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((q, idx) => {
            const correctOpt = getCorrectOption(q);
            return (
              <div key={idx} style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '20px', 
                borderRadius: '12px',
                borderLeft: '4px solid #3182ce'
              }}>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  {idx + 1}. {q.question}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: opt === correctOpt ? 'rgba(72, 187, 120, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${opt === correctOpt ? '#48bb78' : 'rgba(255,255,255,0.1)'}`,
                      color: opt === correctOpt ? '#48bb78' : 'rgba(255,255,255,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {opt === correctOpt && <span>✅</span>}
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // TEST MODE: Set Selection
  if (mode === 'test' && !started && questions.length > SET_SIZE) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', margin: 0, marginBottom: '4px' }}>Select a Test Set</h2>
            <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.9rem' }}>Sets of {SET_SIZE} questions</p>
          </div>
          <button 
            onClick={resetMode}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary, #a0aec0)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary, #a0aec0)'}
          >
            ← Back
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {Array.from({ length: numSets }).map((_, idx) => {
            const startQ = idx * SET_SIZE + 1;
            const endQ = Math.min((idx + 1) * SET_SIZE, questions.length);
            return (
              <button
                key={idx}
                onClick={() => startQuiz(idx)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Set {idx + 1}</span>
                <span style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Questions {startQ} - {endQ}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // TEST MODE: Result Screen
  if (quizCompleted) {
    const score = answers.filter((ans, idx) => ans === getCorrectOption(activeQuestions[idx])).length;
    const percentage = Math.round((score / activeQuestions.length) * 100);

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'white' }}>
          {questions.length > SET_SIZE ? `Set ${selectedSetIndex + 1} Completed!` : 'Quiz Completed!'}
        </h2>
        <div style={{ 
          fontSize: '4rem', 
          fontWeight: 800, 
          color: percentage >= 70 ? '#48bb78' : percentage >= 40 ? '#ecc94b' : '#f56565',
          margin: '24px 0'
        }}>
          {percentage}%
        </div>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary, #a0aec0)', marginBottom: '32px' }}>
          You scored {score} out of {activeQuestions.length}
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px' }}>
          {questions.length > SET_SIZE ? (
            <button 
              onClick={restartQuiz}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ← Back to Sets
            </button>
          ) : (
            <button 
              onClick={resetMode}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ← Main Menu
            </button>
          )}

          <button 
            onClick={() => startQuiz(selectedSetIndex || 0)}
            style={{
              background: 'var(--primary, #3182ce)',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-hover, #2b6cb0)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary, #3182ce)'}
          >
            Retry Quiz
          </button>
        </div>

        <div style={{ textAlign: 'left', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '24px' }}>Review Your Answers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeQuestions.map((q, idx) => {
              const userAns = answers[idx];
              const correctOpt = getCorrectOption(q);
              const isCorrect = userAns === correctOpt;
              
              return (
                <div key={idx} style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  borderLeft: `4px solid ${isCorrect ? '#48bb78' : '#f56565'}`
                }}>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '12px' }}>
                    {idx + 1}. {q.question}
                  </p>
                  <p style={{ 
                    color: isCorrect ? '#48bb78' : '#f56565', 
                    margin: '4px 0',
                    fontSize: '1rem'
                  }}>
                    <strong>Your Answer:</strong> {userAns || 'No Answer'}
                  </p>
                  {!isCorrect && (
                    <p style={{ color: '#48bb78', margin: '4px 0', fontSize: '1rem' }}>
                      <strong>Correct Answer:</strong> {correctOpt}
                    </p>
                  )}
                  {q.explanation && (
                    <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // TEST MODE: Quiz Behavior & Progress Indicator
  const currentQ = activeQuestions[currentQuestionIndex];
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '32px',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => {
              if (questions.length > SET_SIZE) restartQuiz();
              else resetMode();
            }}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary, #a0aec0)',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Exit quiz"
          >
            ←
          </button>
          <span style={{ color: 'var(--text-secondary, #a0aec0)', fontWeight: 600 }}>
            Question {currentQuestionIndex + 1} / {activeQuestions.length}
          </span>
        </div>
        {questions.length > SET_SIZE && (
          <span style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '4px 12px', 
            borderRadius: '12px',
            fontSize: '0.9rem',
            color: 'white'
          }}>
            Set {selectedSetIndex + 1}
          </span>
        )}
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '32px', lineHeight: 1.4 }}>
        {currentQ.question}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const correctOpt = getCorrectOption(currentQ);
          const isCorrect = option === correctOpt;
          const showResult = selectedOption !== null;
          
          let bgColor = 'rgba(255, 255, 255, 0.05)';
          let borderColor = 'rgba(255, 255, 255, 0.1)';
          let color = 'white';
          
          if (showResult) {
            if (isCorrect) {
              bgColor = 'rgba(72, 187, 120, 0.15)'; // Green
              borderColor = '#48bb78';
              color = '#48bb78';
            } else if (isSelected && !isCorrect) {
              bgColor = 'rgba(245, 101, 101, 0.15)'; // Red
              borderColor = '#f56565';
              color = '#f56565';
            } else {
              color = 'rgba(255,255,255,0.4)';
            }
          } else if (isSelected) {
            bgColor = 'rgba(255, 255, 255, 0.1)';
            borderColor = 'rgba(255, 255, 255, 0.3)';
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option)}
              disabled={showResult}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '12px',
                color: color,
                fontSize: '1.1rem',
                textAlign: 'left',
                cursor: showResult ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                if (!showResult) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showResult) {
                  e.currentTarget.style.background = bgColor;
                  e.currentTarget.style.borderColor = borderColor;
                }
              }}
            >
              <span>{option}</span>
              {showResult && isCorrect && <span style={{ fontSize: '1.2rem' }}>✅</span>}
              {showResult && isSelected && !isCorrect && <span style={{ fontSize: '1.2rem' }}>❌</span>}
            </button>
          );
        })}
      </div>

      {selectedOption !== null && (
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentQ.explanation && (
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'white' }}>Explanation:</strong> {currentQ.explanation}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={nextQuestion}
              style={{
                background: 'white',
                color: 'black',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {currentQuestionIndex + 1 === activeQuestions.length ? 'Finish' : 'Next Question →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
