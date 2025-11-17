import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * PipelinePage Component - Pipeline
 * Visar hur data bearbetas steg för steg genom NLP-pipelinen
 */
export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[800px] w-full">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-[#e7e7e7]">
            Pipeline
          </h1>
          
          <div className="space-y-6 text-[#888] leading-relaxed">
            <p className="text-lg">
              OneSeek.AI:s analyspipeline består av flera steg som tillsammans skapar en omfattande 
              och transparent analys av din fråga.
            </p>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">01</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-2">Frågeanalys</h3>
                    <p className="text-sm text-[#888] mb-3">
                      Din fråga analyseras för att identifiera nyckelämnen, kontext och avsikt. 
                      Systemet avgör vilken typ av analys som behövs.
                    </p>
                    <div className="text-xs text-[#666]">
                      Moduler: NLP Preprocessing, Intent Classification
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">02</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-2">Multi-AI Analys</h3>
                    <p className="text-sm text-[#888] mb-3">
                      Frågan skickas parallellt till flera AI-modeller (GPT-4, Claude, Gemini, m.fl.). 
                      Varje modell ger sitt perspektiv och resonemang.
                    </p>
                    <div className="text-xs text-[#666]">
                      AI-modeller: OpenAI GPT-4, Anthropic Claude, Google Gemini, xAI Grok, DeepSeek
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">03</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-2">Faktakontroll</h3>
                    <p className="text-sm text-[#888] mb-3">
                      Påståenden i AI-svaren verifieras mot externa källor via Tavily Search API. 
                      Faktaunderlag och källhänvisningar samlas in.
                    </p>
                    <div className="text-xs text-[#666]">
                      Externa källor: Tavily Search, Verifierade databaser
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">04</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-2">Bias-detektion</h3>
                    <p className="text-sm text-[#888] mb-3">
                      Svaren analyseras för eventuella bias, politiska vinklingar eller obalanserad 
                      framställning. Identifierade bias markeras tydligt.
                    </p>
                    <div className="text-xs text-[#666]">
                      Moduler: Bias Detection, Ideological Classification, Sentiment Analysis
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">05</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-2">Konsensusanalys</h3>
                    <p className="text-sm text-[#888] mb-3">
                      AI-modellerna jämförs för att identifiera gemensamma slutsatser och punkter 
                      där de skiljer sig åt. En balanserad sammanfattning skapas.
                    </p>
                    <div className="text-xs text-[#666]">
                      Moduler: Consensus Debate System, Meta-Analysis
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">06</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-2">Presentation</h3>
                    <p className="text-sm text-[#888] mb-3">
                      Resultaten presenteras med fullständig transparens: alla AI-svar, källor, 
                      detekterad bias, och analyssteg visas öppet för användaren.
                    </p>
                    <div className="text-xs text-[#666]">
                      Output: Transparent Analytics Dashboard, Timeline View, Source References
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4 mt-8">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknisk Arkitektur</h2>
              <p className="mb-3">Systemet består av:</p>
              <ul className="space-y-2">
                <li className="text-[#666]">• <strong className="text-[#888]">Frontend:</strong> React-baserat användargränssnitt</li>
                <li className="text-[#666]">• <strong className="text-[#888]">Backend:</strong> Node.js API-server</li>
                <li className="text-[#666]">• <strong className="text-[#888]">NLP Pipeline:</strong> Python-baserad språkbehandling</li>
                <li className="text-[#666]">• <strong className="text-[#888]">AI Integration:</strong> Direktanslutning till flera AI-tjänster</li>
                <li className="text-[#666]">• <strong className="text-[#888]">Faktakontroll:</strong> Tavily Search API</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mt-8">
              <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Kontinuerlig Förbättring</h3>
              <p>
                Pipelinen utvecklas kontinuerligt med nya moduler och förbättrade analysmetoder. 
                All utveckling sker öppet och med fokus på användarnytta och transparens.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
