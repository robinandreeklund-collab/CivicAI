import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * LanguageModelPage Component - Språkmodell [OQT‑1.0]
 * Beskriver OpenSeek.AI:s egen språkmodell OQT‑1.0
 */
export default function LanguageModelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding */}
          <div className="md:pr-10">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-4 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Språkmodell [OQT‑1.0]
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              OQT‑1.0 (Open Quality Transformer) är OpenSeek.AI:s egen språkmodell under utveckling — 
              en banbrytande satsning på medveten, transparent och samhällsviktig AI.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Meta-intelligens
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Bias-analys
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Transparent träning
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Samhällsverktyg
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Bryta beroendet av slutna system</h2>
                <p className="mb-4">
                  I en tid då AI‑utvecklingen accelererar i rasande takt, och nya modeller lanseras varje månad, 
                  ökar också riskerna med att förlita sig på enstaka, slutna system. Många modeller är kraftfulla, 
                  men deras svar formas av osynliga bias, ideologiska lutningar och kommersiella intressen.
                </p>
                <p>
                  OQT‑1.0 är byggd för att bryta detta beroende — genom att förstå, jämföra och balansera svar 
                  från hela AI‑landskapet.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Träning på globalt AI-landskap</h2>
                <p className="mb-3">
                  Modellen tränas på ett växande dataset som inkluderar AI‑genererade svar från över 20 av 
                  världens största språkmodeller — däribland:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-[#666]">• GPT (OpenAI)</div>
                  <div className="text-[#666]">• Grok (xAI)</div>
                  <div className="text-[#666]">• Gemini (Google DeepMind)</div>
                  <div className="text-[#666]">• DeepSeek</div>
                  <div className="text-[#666]">• Claude (Anthropic)</div>
                  <div className="text-[#666]">• Mistral</div>
                  <div className="text-[#666]">• Cohere</div>
                  <div className="text-[#666]">• LLaMA (Meta)</div>
                  <div className="text-[#666]">• Command R</div>
                  <div className="text-[#666]">• Yi</div>
                  <div className="text-[#666]">• Zephyr</div>
                  <div className="text-[#666]">• Falcon</div>
                  <div className="text-[#666]">• OpenChat</div>
                  <div className="text-[#666]">• Orca</div>
                  <div className="text-[#666]">• RWKV</div>
                  <div className="text-[#666]">• Qwen</div>
                  <div className="text-[#666]">• InternLM</div>
                  <div className="text-[#666]">• Baichuan</div>
                  <div className="text-[#666]">• ChatGLM</div>
                  <div className="text-[#666]">• Claude‑Instant</div>
                  <div className="text-[#666]">• Claude‑Opus</div>
                  <div className="text-[#666] col-span-2">• ...och fler</div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">En meta-intelligens</h2>
                <p className="mb-3">OQT‑1.0 är en meta‑intelligens som:</p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Syntetiserar konsensus mellan modeller</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Analyserar bias och ideologisk lutning</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Identifierar etiska risker och flaggar oreflekterad påverkan</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Bidrar till framtidens insynsverktyg och demokratiska AI‑miljöer</span>
                  </div>
                </div>
                <p className="mt-4">
                  Den växer i styrka ju fler AI‑svar den analyserar, och försöker aktivt balansera sina egna 
                  svar för att undvika ofrivilligt inflytande.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">En otryckbar insynsmotor</h2>
                <p>
                  Med sin unika träningsbas blir OQT‑1.0 en otryckbar insynsmotor — ett samhällsverktyg för 
                  medborgare, forskare och beslutsfattare som vill förstå hur digitala narrativ formas.
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Status</h3>
                <p className="text-[#e7e7e7]">
                  <strong>Work in progress</strong> — lanseras som en experimentell modul i nästa fas av 
                  OpenSeek.AI:s utveckling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
