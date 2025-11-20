import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * LanguageModelPage Component - Språkmodell [OQT‑1.0]
 * Beskriver OpenSeek.AI:s egen språkmodell OQT‑1.0
 */
export default function LanguageModelPage() {
  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[1400px] mx-auto pb-8">
          {/* Header */}
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Språkmodell [OQT‑1.0]
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              OQT‑1.0 (Open Quality Transformer) är OpenSeek.AI:s egen språkmodell under utveckling — 
              en banbrytande satsning på medveten, transparent och samhällsviktig AI.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Main sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Bryta beroendet av slutna system</h2>
                <p className="mb-4 text-sm text-[#888]">
                  I en tid då AI‑utvecklingen accelererar i rasande takt, och nya modeller lanseras varje månad, 
                  ökar också riskerna med att förlita sig på enstaka, slutna system. Många modeller är kraftfulla, 
                  men deras svar formas av osynliga bias, ideologiska lutningar och kommersiella intressen.
                </p>
                <p className="text-sm text-[#888]">
                  OQT‑1.0 är byggd för att bryta detta beroende — genom att förstå, jämföra och balansera svar 
                  från hela AI‑landskapet.
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">En meta-intelligens</h2>
                <p className="mb-4 text-sm text-[#888]">OQT‑1.0 är en meta‑intelligens som:</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-[#666] mt-0.5">—</span>
                    <span className="text-[#888]">Syntetiserar konsensus mellan modeller</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#666] mt-0.5">—</span>
                    <span className="text-[#888]">Analyserar bias och ideologisk lutning</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#666] mt-0.5">—</span>
                    <span className="text-[#888]">Identifierar etiska risker och flaggar oreflekterad påverkan</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#666] mt-0.5">—</span>
                    <span className="text-[#888]">Bidrar till framtidens insynsverktyg och demokratiska AI‑miljöer</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#888]">
                  Den växer i styrka ju fler AI‑svar den analyserar, och försöker aktivt balansera sina egna 
                  svar för att undvika ofrivilligt inflytande.
                </p>
              </div>
            </div>

            {/* Training data - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Träning på globalt AI-landskap</h2>
              <p className="mb-4 text-sm text-[#888]">
                Modellen tränas på ett växande dataset som inkluderar AI‑genererade svar från över 20 av 
                världens största språkmodeller:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">GPT (OpenAI)</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Grok (xAI)</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Gemini (Google)</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">DeepSeek</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Claude (Anthropic)</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Mistral</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Cohere</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">LLaMA (Meta)</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Command R</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Yi</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Zephyr</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Falcon</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">OpenChat</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Orca</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">RWKV</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Qwen</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">InternLM</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">Baichuan</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">ChatGLM</div>
                <div className="border-l border-[#2a2a2a] pl-3 text-[#888]">...och fler</div>
              </div>
            </div>

            {/* Features and status - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Nyckelfunktioner</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#151515]">
                    <span className="text-[#666]">Konsensus-syntes</span>
                    <span className="text-[#888]">Sammanställer gemensamma slutsatser</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#151515]">
                    <span className="text-[#666]">Bias-analys</span>
                    <span className="text-[#888]">Identifierar ideologiska lutningar</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#151515]">
                    <span className="text-[#666]">Etisk balans</span>
                    <span className="text-[#888]">Neutrala, välavvägda perspektiv</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#151515]">
                    <span className="text-[#666]">Meta-förståelse</span>
                    <span className="text-[#888]">Förstår AI-systemens resonemang</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#151515]">
                    <span className="text-[#666]">Insynsverktyg</span>
                    <span className="text-[#888]">Transparent dokumentation</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">En otryckbar insynsmotor</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Med sin unika träningsbas blir OQT‑1.0 en otryckbar insynsmotor — ett samhällsverktyg för 
                  medborgare, forskare och beslutsfattare som vill förstå hur digitala narrativ formas.
                </p>
                <p className="text-sm text-[#888]">
                  Genom att exponera mönster i hur olika AI-system svarar, bidrar modellen till en mer 
                  transparent och granskningsbar AI-ekosystem.
                </p>
              </div>
            </div>

            {/* Status - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Status</div>
                  <h2 className="text-2xl font-light text-[#e7e7e7] mb-3">Work in Progress</h2>
                  <p className="mb-3 text-sm text-[#888]">
                    OQT-1.0 är för närvarande under utveckling och träning. Modellen lanseras som en experimentell 
                    modul i nästa fas av OpenSeek.AI:s utveckling.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Fas 1 – Datainsamling</span>
                      <span className="text-[#888]">Pågående</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Fas 2 – Modellträning</span>
                      <span className="text-[#666]">Planerad Q2 2025</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Fas 3 – Beta-lansering</span>
                      <span className="text-[#666]">Planerad Q3 2025</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Fas 4 – Fullständig integration</span>
                      <span className="text-[#666]">Planerad Q4 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OQT Dashboard Link */}
          <div className="mt-8 pt-6 border-t border-[#2a2a2a] text-center">
            <Link 
              to="/oqt-dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-sm rounded-lg transition-colors duration-200"
            >
              <span>Visa fullständig OQT-1.0 Dashboard →</span>
            </Link>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
