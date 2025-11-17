import { useState, useEffect, useRef, useCallback } from 'react';

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
  const timeoutRef = useRef(null);
  const stateRef = useRef({
    questionIndex: 0,
    charIndex: 0,
    phase: 'typing', // typing, paused-typo, deleting-typo, correcting, paused, deleting
  });

  const animate = useCallback(() => {
    if (!enabled || questions.length === 0) return;

    const state = stateRef.current;
    const currentQuestion = questions[state.questionIndex];
    if (!currentQuestion) return;

    const { text, typo } = currentQuestion;

    if (state.phase === 'typing') {
      // Determine if we're typing the typo or the correct text
      const targetText = typo ? typo.text : text;
      
      if (state.charIndex < targetText.length) {
        // Type next character
        state.charIndex++;
        setCurrentText(targetText.slice(0, state.charIndex));
        timeoutRef.current = setTimeout(animate, typingSpeed);
      } else {
        // Finished typing
        if (typo) {
          // We typed the typo, now pause and prepare to delete it
          state.phase = 'paused-typo';
          timeoutRef.current = setTimeout(() => {
            state.phase = 'deleting-typo';
            animate();
          }, pauseBeforeDelete);
        } else {
          // We typed the correct text, pause and then delete
          state.phase = 'paused';
          timeoutRef.current = setTimeout(() => {
            state.phase = 'deleting';
            animate();
          }, pauseDuration);
        }
      }
    } else if (state.phase === 'deleting-typo') {
      const typoText = typo.text;
      const correctText = text;
      
      // Find where the typo diverges from correct text
      let divergeIndex = 0;
      for (let i = 0; i < Math.min(correctText.length, typoText.length); i++) {
        if (correctText[i] !== typoText[i]) {
          divergeIndex = i;
          break;
        }
      }

      if (state.charIndex > divergeIndex) {
        // Delete one character
        state.charIndex--;
        setCurrentText(typoText.slice(0, state.charIndex));
        timeoutRef.current = setTimeout(animate, deletingSpeed);
      } else {
        // Done deleting, now type the correct part
        state.phase = 'correcting';
        timeoutRef.current = setTimeout(animate, 100);
      }
    } else if (state.phase === 'correcting') {
      const correctText = text;
      
      if (state.charIndex < correctText.length) {
        // Type the correct character
        state.charIndex++;
        setCurrentText(correctText.slice(0, state.charIndex));
        timeoutRef.current = setTimeout(animate, typingSpeed);
      } else {
        // Finished correcting, pause then delete all
        state.phase = 'paused';
        timeoutRef.current = setTimeout(() => {
          state.phase = 'deleting';
          animate();
        }, pauseDuration);
      }
    } else if (state.phase === 'deleting') {
      if (state.charIndex > 0) {
        // Delete one character
        state.charIndex--;
        setCurrentText(text.slice(0, state.charIndex));
        timeoutRef.current = setTimeout(animate, deletingSpeed);
      } else {
        // Finished deleting, move to next question
        state.questionIndex = (state.questionIndex + 1) % questions.length;
        state.phase = 'typing';
        state.charIndex = 0;
        setCurrentText('');
        // Small pause before starting next question
        timeoutRef.current = setTimeout(animate, 500);
      }
    }
  }, [enabled, questions, typingSpeed, deletingSpeed, pauseDuration, pauseBeforeDelete]);

  useEffect(() => {
    if (!enabled || questions.length === 0) {
      setCurrentText('');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Reset state when starting
    stateRef.current = {
      questionIndex: 0,
      charIndex: 0,
      phase: 'typing',
    };
    setCurrentText('');

    // Start animation
    animate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, questions, animate]);

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCurrentText('');
    stateRef.current = {
      questionIndex: 0,
      charIndex: 0,
      phase: 'typing',
    };
  };

  return {
    text: currentText,
    isAnimating: enabled && questions.length > 0,
    reset
  };
}
