import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';
import { useTypewriter } from '../hooks/useTypewriter';

/**
 * LandingPage Component
 * Split layout design based on search-landing-7-split-layout
 * Minimalist grayscale aesthetic with split-column layout
 */
export default function LandingPage() {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  // Sample questions for typewriter animation
  const sampleQuestions = [
    { text: 'Hur säkrar vi tillgång till psykisk vård?' },
    { text: 'Hur gör vi klimatomställningen rättvis?' },
    { text: 'Hur stärker vi ungas demokratiska tänkande?' },
    { 
      text: 'Hur löser vi bostadsbristen för unga?',
      typo: { text: 'Hur löser vi bostadsbresten för unga?' }
    },
    { text: 'Hur skyddar vi digital integritet?' },
    { 
      text: 'Hur minskar vi ekonomisk ojämlikhet?',
      typo: { text: 'Hur minskar vi ekonmisk ojämlikhet?' }
    },
    { text: 'Hur förbättrar vi integration och inkludering?' },
    { 
      text: 'Hur säkrar vi tillgång till kvalitativ utbildning?',
      typo: { text: 'Hur säkrar vi tillgång till kvalitativ utbilding?' }
    },
    { text: 'Hur bekämpar vi desinformation i samhället?' },
    { text: 'Hur stärker vi civilsamhällets inflytande?' }
  ];

  // Enable typewriter only when input is empty and not focused
  const typewriterEnabled = !question && !isFocused;
  const { text: typewriterText } = useTypewriter(sampleQuestions, {
    typingSpeed: 80,
    deletingSpeed: 50,
    pauseDuration: 2000,
    pauseBeforeDelete: 800,
    enabled: typewriterEnabled
  });

  const handleAnalyze = () => {
    if (question.trim()) {
      // Navigate to chat interface with the question
      navigate('/chat', { state: { initialQuestion: question } });
    }
  };

  const handleExampleClick = (exampleText) => {
    setQuestion(exampleText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && question.trim()) {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <style>{`
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background-color: #444;
          animation: typewriter-blink 1s step-end infinite;
        }
        
        @keyframes typewriter-blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left Side - Branding & Features */}
        <div className="md:pr-10">
          <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
            OneSeek.AI
          </h1>
          <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
            Beslut med insyn. AI med ansvar.<br />
            Jämför AI-modeller och få en balanserad bild.
          </p>
          <ul className="space-y-0">
            <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
              ✓ Jämför 5 AI-modeller samtidigt
            </li>
            <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
              ✓ Automatisk bias-detektion
            </li>
            <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
              ✓ Faktakontroll med Tavily
            </li>
            <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
              ✓ Full transparens i processen
            </li>
          </ul>
        </div>

        {/* Right Side - Search Interface */}
        <div className="md:pl-10 md:border-l border-[#151515]">
          <div className="text-xs text-[#666] uppercase tracking-wider mb-4">
            Ställ Din Fråga
          </div>
          
          {/* Search Box */}
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-1.5 mb-4 transition-all duration-300 focus-within:border-[#2a2a2a] relative">
            {/* Typewriter placeholder overlay - shown when input is empty and not focused */}
            {typewriterEnabled && typewriterText && (
              <div 
                className="absolute inset-0 px-5 py-[19.5px] pointer-events-none flex items-center text-base text-[#444]"
                style={{ zIndex: 1 }}
              >
                <span>{typewriterText}</span>
                <span className="typewriter-cursor ml-0.5"></span>
              </div>
            )}
            
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyPress={handleKeyPress}
              placeholder="T.ex. Hur kan AI förbättra demokratin?"
              className={`
                w-full bg-transparent border-none px-5 py-[18px] text-[#e7e7e7] text-base outline-none placeholder-[#444]
                relative
                ${typewriterEnabled && typewriterText ? 'placeholder-transparent' : ''}
              `}
              style={{ zIndex: 2, position: 'relative' }}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!question.trim()}
            className="w-full bg-[#e7e7e7] text-[#0a0a0a] border-none py-4 rounded-xl text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            Analysera
          </button>

          {/* Example Questions */}
          <div className="text-[11px] text-[#444] uppercase tracking-wider mb-3">
            Exempelfrågor
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleExampleClick('Demokrati & AI-transparens')}
              className="bg-transparent border border-[#1a1a1a] rounded-lg py-3 px-4 text-[13px] text-[#666] cursor-pointer text-left transition-all duration-200 hover:bg-[#151515] hover:border-[#2a2a2a] hover:text-[#e7e7e7]"
            >
              Demokrati & AI-transparens
            </button>
            <button
              onClick={() => handleExampleClick('Klimatpolitik & åtgärder')}
              className="bg-transparent border border-[#1a1a1a] rounded-lg py-3 px-4 text-[13px] text-[#666] cursor-pointer text-left transition-all duration-200 hover:bg-[#151515] hover:border-[#2a2a2a] hover:text-[#e7e7e7]"
            >
              Klimatpolitik & åtgärder
            </button>
            <button
              onClick={() => handleExampleClick('Utbildning & likvärdighet')}
              className="bg-transparent border border-[#1a1a1a] rounded-lg py-3 px-4 text-[13px] text-[#666] cursor-pointer text-left transition-all duration-200 hover:bg-[#151515] hover:border-[#2a2a2a] hover:text-[#e7e7e7]"
            >
              Utbildning & likvärdighet
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <FooterDemo4 />
  </div>
  );
}
