import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FooterDemo1 from '../components/footers/FooterDemo1';
import FooterDemo2 from '../components/footers/FooterDemo2';
import FooterDemo3 from '../components/footers/FooterDemo3';
import FooterDemo4 from '../components/footers/FooterDemo4';
import FooterDemo5 from '../components/footers/FooterDemo5';

/**
 * LandingPage Component
 * Split layout design based on search-landing-7-split-layout
 * Minimalist grayscale aesthetic with split-column layout
 */
export default function LandingPage() {
  const [question, setQuestion] = useState('');
  const [activeFooter, setActiveFooter] = useState(1);
  const navigate = useNavigate();

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

  const footerComponents = {
    1: FooterDemo1,
    2: FooterDemo2,
    3: FooterDemo3,
    4: FooterDemo4,
    5: FooterDemo5,
  };

  const FooterComponent = footerComponents[activeFooter];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
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
          <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-1.5 mb-4 transition-all duration-300 focus-within:border-[#2a2a2a]">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="T.ex. Hur kan AI förbättra demokratin?"
              className="w-full bg-transparent border-none px-5 py-[18px] text-[#e7e7e7] text-base outline-none placeholder-[#444]"
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

      {/* Footer Demo Selector */}
      <div className="bg-[#151515] border-t border-[#1a1a1a] py-4">
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className="text-[#666] text-xs uppercase tracking-wider mr-2">
              Footer Demo:
            </span>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setActiveFooter(num)}
                className={`px-4 py-2 text-xs rounded-lg transition-all duration-200 ${
                  activeFooter === num
                    ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                    : 'bg-[#1a1a1a] text-[#666] hover:bg-[#2a2a2a] hover:text-[#e7e7e7]'
                }`}
              >
                Demo {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Active Footer Component */}
    {FooterComponent && <FooterComponent />}
  </div>
  );
}
