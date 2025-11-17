import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for typewriter animation with typo correction
 * @param {Array} questions - Array of question objects with text and optional typo
 * @param {Object} options - Configuration options
 * @returns {Object} - Current text and animation state
 */
export function useTypewriter(questions = [], options = {}) {
  const {
    typingSpeed = 80,      // Speed of typing in ms
    deletingSpeed = 50,    // Speed of deleting in ms
    pauseDuration = 2000,  // Pause after typing complete
    pauseBeforeDelete = 1000, // Pause before deleting typo
    enabled = true         // Whether animation is enabled
  } = options;

  const [currentText, setCurrentText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState('typing'); // typing, paused, deleting, correcting
  const timeoutRef = useRef(null);
  const charIndexRef = useRef(0);

  useEffect(() => {
    if (!enabled || questions.length === 0) {
      setCurrentText('');
      return;
    }

    const currentQuestion = questions[questionIndex];
    if (!currentQuestion) return;

    const { text, typo } = currentQuestion;
    const targetText = phase === 'typing' && typo 
      ? typo.text 
      : text;

    const animate = () => {
      if (phase === 'typing') {
        // Typing phase
        if (charIndexRef.current < targetText.length) {
          setCurrentText(targetText.slice(0, charIndexRef.current + 1));
          charIndexRef.current++;
          timeoutRef.current = setTimeout(animate, typingSpeed);
        } else {
          // Finished typing
          if (typo && typo.text === targetText) {
            // We just typed the typo, now pause and delete it
            setPhase('paused-typo');
            timeoutRef.current = setTimeout(() => {
              setPhase('deleting-typo');
              animate();
            }, pauseBeforeDelete);
          } else {
            // Finished typing correct text, pause then move to next
            setPhase('paused');
            timeoutRef.current = setTimeout(() => {
              setPhase('deleting');
              animate();
            }, pauseDuration);
          }
        }
      } else if (phase === 'deleting-typo') {
        // Delete the typo back to the point where it diverges
        const correctText = text;
        const typoText = typo.text;
        
        // Find where the typo starts
        let divergeIndex = 0;
        for (let i = 0; i < Math.min(correctText.length, typoText.length); i++) {
          if (correctText[i] !== typoText[i]) {
            divergeIndex = i;
            break;
          }
        }

        if (charIndexRef.current > divergeIndex) {
          setCurrentText(typoText.slice(0, charIndexRef.current - 1));
          charIndexRef.current--;
          timeoutRef.current = setTimeout(animate, deletingSpeed);
        } else {
          // Done deleting typo, now type the correct version
          setPhase('correcting');
          animate();
        }
      } else if (phase === 'correcting') {
        // Type the correct text from where the typo was
        if (charIndexRef.current < text.length) {
          setCurrentText(text.slice(0, charIndexRef.current + 1));
          charIndexRef.current++;
          timeoutRef.current = setTimeout(animate, typingSpeed);
        } else {
          // Finished correction, pause then delete all
          setPhase('paused');
          timeoutRef.current = setTimeout(() => {
            setPhase('deleting');
            animate();
          }, pauseDuration);
        }
      } else if (phase === 'deleting') {
        // Delete everything
        if (charIndexRef.current > 0) {
          setCurrentText(text.slice(0, charIndexRef.current - 1));
          charIndexRef.current--;
          timeoutRef.current = setTimeout(animate, deletingSpeed);
        } else {
          // Finished deleting, move to next question
          const nextIndex = (questionIndex + 1) % questions.length;
          setQuestionIndex(nextIndex);
          charIndexRef.current = 0;
          setPhase('typing');
          // Small pause before starting next question
          timeoutRef.current = setTimeout(animate, 500);
        }
      }
    };

    animate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, questions, questionIndex, phase, typingSpeed, deletingSpeed, pauseDuration, pauseBeforeDelete]);

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCurrentText('');
    setQuestionIndex(0);
    charIndexRef.current = 0;
    setPhase('typing');
  };

  return {
    text: currentText,
    isAnimating: enabled && questions.length > 0,
    reset
  };
}
