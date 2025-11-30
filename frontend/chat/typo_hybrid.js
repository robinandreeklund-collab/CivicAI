/**
 * Typo Hybrid for ONESEEK Δ+
 * Hybrid-autocorrect med AI-personlighet för frontend
 * 
 * Funktionalitet:
 * - Klient-side stavningskontroll
 * - Fuzzy matching för förslag
 * - Integration med backend typo API
 * - Svensk ordlista
 */

(function(global) {
  'use strict';

  // Svenska vanliga ord för snabb klient-side kontroll
  const SWEDISH_COMMON_WORDS = new Set([
    // Frågeord
    'vad', 'hur', 'var', 'när', 'vem', 'varför', 'vilken', 'vilka',
    
    // Pronomen
    'jag', 'du', 'han', 'hon', 'den', 'det', 'vi', 'ni', 'de',
    
    // Verb (vanliga)
    'är', 'var', 'vara', 'har', 'hade', 'ha', 'gör', 'göra',
    'kan', 'ska', 'vill', 'måste', 'får', 'kommer', 'går', 'ser',
    
    // Prepositioner
    'i', 'på', 'av', 'för', 'med', 'till', 'från', 'om', 'under', 'över',
    
    // Konjunktioner
    'och', 'eller', 'men', 'att', 'som', 'när', 'om', 'än',
    
    // Adjektiv
    'stor', 'liten', 'ny', 'gammal', 'bra', 'fin', 'svensk',
    
    // Substantiv (vanliga)
    'dag', 'tid', 'år', 'folk', 'man', 'barn', 'hus', 'väg',
    
    // Städer
    'stockholm', 'göteborg', 'malmö', 'uppsala', 'linköping',
    'västerås', 'örebro', 'helsingborg', 'norrköping', 'jönköping',
    
    // Väder-relaterat
    'väder', 'vädret', 'regn', 'sol', 'snö', 'temperatur', 'grader',
    
    // Civic-relaterat
    'befolkning', 'invånare', 'nyheter', 'politik', 'riksdag'
  ]);

  // Vanliga stavfel (typo -> korrekt)
  const COMMON_TYPOS = {
    'jga': 'jag',
    'dne': 'den',
    'ochc': 'och',
    'detär': 'det är',
    'hurär': 'hur är',
    'vadär': 'vad är',
    'stockhlom': 'stockholm',
    'stokholm': 'stockholm',
    'götborg': 'göteborg',
    'malmø': 'malmö',
    'uppsal': 'uppsala',
    'väddret': 'vädret',
    'beflkning': 'befolkning',
    'nhyeter': 'nyheter',
    'temprratur': 'temperatur',
    'invnare': 'invånare',
    'igar': 'igår',
    'imorrn': 'imorgon',
    'imorron': 'imorgon'
  };

  /**
   * Beräkna Levenshtein-distans mellan två strängar
   */
  function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Hitta liknande ord baserat på Levenshtein-distans
   */
  function findSimilarWords(word, maxDistance = 2, maxSuggestions = 3) {
    const suggestions = [];
    const wordLower = word.toLowerCase();

    for (const dictWord of SWEDISH_COMMON_WORDS) {
      const distance = levenshteinDistance(wordLower, dictWord);
      if (distance > 0 && distance <= maxDistance) {
        suggestions.push({ word: dictWord, distance });
      }
    }

    // Sortera efter distans och returnera top N
    suggestions.sort((a, b) => a.distance - b.distance);
    return suggestions.slice(0, maxSuggestions).map(s => s.word);
  }

  /**
   * TypoHybrid - Huvudklass för stavningskontroll
   */
  class TypoHybrid {
    constructor(options = {}) {
      this.apiEndpoint = options.apiEndpoint || '/api/ml/typo';
      this.debounceMs = options.debounceMs || 300;
      this.autoCorrect = options.autoCorrect !== false;
      this.showSuggestions = options.showSuggestions !== false;
      this.logTypos = options.logTypos !== false;
      
      this._debounceTimer = null;
      this._cachedResults = new Map();
    }

    /**
     * Kontrollera om ett ord är korrekt (snabb klient-side check)
     */
    isCorrectWord(word) {
      const wordLower = word.toLowerCase();
      
      // Kolla vanliga ord
      if (SWEDISH_COMMON_WORDS.has(wordLower)) {
        return true;
      }
      
      // Kolla om det är ett känt stavfel
      if (COMMON_TYPOS[wordLower]) {
        return false;
      }
      
      // Siffror är alltid ok
      if (/^\d+$/.test(word)) {
        return true;
      }
      
      return null; // Okänt - behöver backend-check
    }

    /**
     * Hämta korrigering för ett ord (snabb klient-side)
     */
    getCorrection(word) {
      const wordLower = word.toLowerCase();
      
      // Kolla kända stavfel
      if (COMMON_TYPOS[wordLower]) {
        return COMMON_TYPOS[wordLower];
      }
      
      return null;
    }

    /**
     * Kontrollera text (klient-side)
     */
    checkText(text) {
      const words = text.split(/\s+/);
      const results = [];
      
      for (const word of words) {
        // Hoppa över korta ord och siffror
        if (word.length < 2 || /^\d+$/.test(word)) {
          results.push({ word, isCorrect: true, suggestions: [] });
          continue;
        }
        
        const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
        const isCorrect = this.isCorrectWord(cleanWord);
        
        if (isCorrect === false) {
          // Känt stavfel
          const correction = this.getCorrection(cleanWord);
          results.push({
            word: cleanWord,
            isCorrect: false,
            correction,
            suggestions: correction ? [correction] : findSimilarWords(cleanWord)
          });
        } else if (isCorrect === null) {
          // Okänt ord - hitta förslag
          const suggestions = findSimilarWords(cleanWord);
          results.push({
            word: cleanWord,
            isCorrect: suggestions.length === 0, // Om inga förslag, anta korrekt
            suggestions
          });
        } else {
          results.push({ word: cleanWord, isCorrect: true, suggestions: [] });
        }
      }
      
      return results;
    }

    /**
     * Auto-korrigera text (klient-side)
     */
    autoCorrectText(text) {
      const words = text.split(/(\s+)/); // Behåll mellanslag
      let corrected = '';
      let changes = [];
      
      for (const word of words) {
        // Behåll mellanslag
        if (/^\s+$/.test(word)) {
          corrected += word;
          continue;
        }
        
        const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
        const punctuation = word.replace(cleanWord, '');
        const correction = this.getCorrection(cleanWord);
        
        if (correction) {
          // Behåll versaler - check if first character is uppercase letter
          let finalCorrection = correction;
          if (cleanWord[0] && /[A-ZÅÄÖ]/.test(cleanWord[0])) {
            finalCorrection = correction.charAt(0).toUpperCase() + correction.slice(1);
          }
          corrected += finalCorrection + punctuation;
          changes.push({ original: cleanWord, corrected: finalCorrection });
        } else {
          corrected += word;
        }
      }
      
      return {
        original: text,
        corrected,
        changes,
        hasChanges: changes.length > 0
      };
    }

    /**
     * Kontrollera text via backend API
     */
    async checkTextAsync(text) {
      // Kolla cache först
      const cacheKey = text.trim().toLowerCase();
      if (this._cachedResults.has(cacheKey)) {
        return this._cachedResults.get(cacheKey);
      }
      
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, auto_correct: this.autoCorrect })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        // Cache resultatet
        this._cachedResults.set(cacheKey, result);
        
        return result;
      } catch (error) {
        console.warn('[TypoHybrid] Backend check failed, using client-side:', error);
        // Fallback till klient-side
        return {
          original: text,
          corrected: this.autoCorrectText(text).corrected,
          word_results: this.checkText(text),
          is_correct: this.checkText(text).every(r => r.isCorrect)
        };
      }
    }

    /**
     * Skapa suggestions-popup
     */
    createSuggestionsPopup(suggestions, onSelect) {
      const popup = document.createElement('div');
      popup.className = 'typo-suggestions-popup';
      popup.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        padding: 4px 0;
        z-index: 1000;
        max-width: 200px;
      `;
      
      for (const suggestion of suggestions) {
        const item = document.createElement('div');
        item.textContent = suggestion;
        item.style.cssText = `
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
        `;
        item.addEventListener('mouseenter', () => {
          item.style.background = '#f0f0f0';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = 'white';
        });
        item.addEventListener('click', () => {
          onSelect(suggestion);
          popup.remove();
        });
        popup.appendChild(item);
      }
      
      return popup;
    }

    /**
     * Anslut till ett input-element
     */
    attachToInput(input, options = {}) {
      const self = this;
      let activePopup = null;
      
      input.addEventListener('input', function() {
        // Debounce
        if (self._debounceTimer) {
          clearTimeout(self._debounceTimer);
        }
        
        self._debounceTimer = setTimeout(async () => {
          const text = input.value;
          
          // Kolla text
          const result = await self.checkTextAsync(text);
          
          // Om ändringar föreslås och popup är aktiverat
          if (result.corrected !== text && self.showSuggestions) {
            // Visa förslag...
            console.log('[TypoHybrid] Suggestions available:', result);
          }
          
          // Auto-korrigera om aktiverat
          if (self.autoCorrect && result.hasChanges) {
            // Spara cursorposition
            const cursorPos = input.selectionStart;
            input.value = result.corrected;
            // Återställ cursor
            input.setSelectionRange(cursorPos, cursorPos);
          }
        }, self.debounceMs);
      });
      
      // Stäng popup vid klick utanför
      document.addEventListener('click', (e) => {
        if (activePopup && !activePopup.contains(e.target)) {
          activePopup.remove();
          activePopup = null;
        }
      });
      
      return this;
    }

    /**
     * Logga stavfel till backend
     */
    async logTypo(original, corrected, context = '') {
      if (!this.logTypos) return;
      
      try {
        await fetch('/api/ml/typo/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ original, corrected, context })
        });
      } catch (error) {
        console.warn('[TypoHybrid] Failed to log typo:', error);
      }
    }

    /**
     * Lägg till ord i ordlistan
     */
    addWord(word) {
      SWEDISH_COMMON_WORDS.add(word.toLowerCase());
    }

    /**
     * Lägg till stavfel-mappning
     */
    addTypo(typo, correction) {
      COMMON_TYPOS[typo.toLowerCase()] = correction.toLowerCase();
    }
  }

  // Exportera
  global.TypoHybrid = TypoHybrid;
  
  // Skapa global instans
  global.typoHybrid = new TypoHybrid();

})(typeof window !== 'undefined' ? window : this);
