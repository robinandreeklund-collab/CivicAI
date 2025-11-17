import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * FeaturesPage Component - Funktioner
 * Fördjupad beskrivning av plattformens nyckelfunktioner
 */
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding */}
          <div className="md:pr-10">
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Funktioner
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              OneSeek.AI erbjuder en rad avancerade funktioner för transparent och balanserad AI-analys.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Multi-AI Jämförelse
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Konsensus Live Debate
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Bias-detektion
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Faktakontroll
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Transparent Pipeline
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Auditlogg
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Multi-AI Jämförelse</h2>
                <p className="mb-3">Få svar från fem ledande AI-modeller samtidigt och jämför deras perspektiv:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• OpenAI GPT-4 - Avancerad språkförståelse</div>
                  <div className="text-[#666]">• Anthropic Claude - Säkerhet och nyanserad analys</div>
                  <div className="text-[#666]">• Google Gemini - Multimodal förståelse</div>
                  <div className="text-[#666]">• xAI Grok - Realtidsdata</div>
                  <div className="text-[#666]">• DeepSeek - Teknisk precision</div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Konsensus Live Debate</h2>
                <p className="mb-3">En unik funktion där AI-modeller diskuterar och debatterar komplexa frågor:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• Strukturerade debattrundor mellan AI-modeller</div>
                  <div className="text-[#666]">• Identifiering av gemensamma slutsatser</div>
                  <div className="text-[#666]">• Tydlig markering av meningsskiljaktigheter</div>
                  <div className="text-[#666]">• Röstning och konsensusbedömning</div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Automatisk Bias-detektion</h2>
                <p className="mb-3">Avancerad analys som identifierar och markerar eventuella bias:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• Politisk vinkling och ideologiska tendenser</div>
                  <div className="text-[#666]">• Sentiment och tonalitet i framställningen</div>
                  <div className="text-[#666]">• Obalanserad källanvändning</div>
                  <div className="text-[#666]">• Visuell markering av detekterade bias</div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Faktakontroll med Tavily</h2>
                <p className="mb-3">Alla påståenden verifieras mot externa källor i realtid:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• Automatisk källsökning och verifiering</div>
                  <div className="text-[#666]">• Tydliga källhänvisningar</div>
                  <div className="text-[#666]">• Markering av overifierade påståenden</div>
                  <div className="text-[#666]">• Direktlänkar till originalkällor</div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Kommande Funktioner</h3>
                <p className="mb-3 text-sm">Vi arbetar kontinuerligt med att utveckla nya funktioner:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• Användaranpassade analysprofiler</div>
                  <div className="text-[#666]">• Avancerad datavisualisering</div>
                  <div className="text-[#666]">• API för externa integrationer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
