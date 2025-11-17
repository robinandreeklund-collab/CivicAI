import { Link } from 'react-router-dom';
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
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-4 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
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
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Multi-AI Jämförelse</h2>
                <p className="mb-4">
                  Få svar från fem ledande AI-modeller samtidigt och jämför deras perspektiv. 
                  Systemet skickar parallella förfrågningar och aggregerar resultat för maximal transparens.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">OpenAI GPT-4</div>
                    <div className="text-[#666] text-xs">Avancerad språkförståelse och kreativt resonemang. Optimal för komplexa analytiska uppgifter.</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">Anthropic Claude</div>
                    <div className="text-[#666] text-xs">Säkerhetsfokuserad AI med stark etisk grund. Utmärkt för nyanserad analys och riskbedömning.</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">Google Gemini</div>
                    <div className="text-[#666] text-xs">Multimodal förståelse med bred kunskapsbas. Starkt faktaverifieringsförmåga.</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">xAI Grok</div>
                    <div className="text-[#666] text-xs">Realtidsdata från 𝕏 (Twitter). Optimal för aktuella händelser och trender.</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">DeepSeek</div>
                    <div className="text-[#666] text-xs">Teknisk precision och djupgående analys. Stark inom kodgenerering och logiskt resonemang.</div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#666] italic">
                  Varje modell analyseras individuellt med komplett pipeline (sentiment, bias, faktakontroll) 
                  och metadata loggas för fullständig transparens.
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Konsensus Live Debate</h2>
                <p className="mb-4">
                  En unik funktion där AI-modeller diskuterar och debatterar komplexa frågor när konsensus är låg (&lt;60%). 
                  Systemet startar automatiskt en strukturerad debatt för att nå djupare förståelse.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📊 Divergensanalys:</span> Semantisk likhetsjämförelse identifierar meningsskiljaktigheter mellan modeller
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🎯 Strukturerade debattrundor:</span> Upp till 5 rundor där varje AI-modell presenterar och försvarar sitt perspektiv
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🗳️ Demokratisk röstning:</span> Modellerna röstar fram det mest välgrundade svaret (ingen kan rösta på sig själv)
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📝 Röstmotiveringar:</span> Varje modell motiverar sin röst för maximal transparens
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔬 Automatisk analys:</span> Vinnande svar körs genom komplett pipeline-analys
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#666] italic">
                  Hela debattflödet loggas i audit trail med tidsstämplar, deltagare och konsensusmetrik.
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Automatisk Bias-detektion</h2>
                <p className="mb-4">
                  Avancerad hybridanalys som kombinerar Python ML-modeller med JavaScript-fallbacks för att identifiera bias i realtid.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">🐍 Python ML-verktyg (Föredraget)</div>
                    <ul className="space-y-1.5 text-xs text-[#888]">
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>Detoxify v0.5.2: ML-baserad detektion av toxicitet, hot och förolämpningar</span></li>
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>KB/bert-base-swedish-cased: Svensk BERT för politisk ideologiklassificering</span></li>
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>TextBlob v0.17.1: Kontextmedveten sentiment och subjektivitet</span></li>
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>spaCy v3.7.2: POS-tagging och dependency parsing för kontextuell förståelse</span></li>
                    </ul>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="text-[#e7e7e7] mb-2 font-medium">⚡ JavaScript Fallback (Alltid tillgänglig)</div>
                    <ul className="space-y-1.5 text-xs text-[#888]">
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>compromise.js v14.11.0: Lättviktig NLP för tokenisering och POS</span></li>
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom bias detector: Regelbaserad detektion med svensk politisk terminologi</span></li>
                      <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom sentiment: Lexicon-baserad sentimentanalys med sarkasm/aggression</span></li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">Bias-dimensioner:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0a0a0a] rounded p-2 text-[#888]">📊 Politisk vänster-höger-center</div>
                    <div className="bg-[#0a0a0a] rounded p-2 text-[#888]">💰 Ekonomisk omfördelning vs marknad</div>
                    <div className="bg-[#0a0a0a] rounded p-2 text-[#888]">🌈 Social progressiv vs konservativ</div>
                    <div className="bg-[#0a0a0a] rounded p-2 text-[#888]">⚖️ Auktoritet libertär vs auktoritär</div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#666] italic">
                  Per-mening analys med flaggade termer, visuell markering och provenance tracking för varje bias-detektion.
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Faktakontroll med Audit</h2>
                <p className="mb-4">
                  Alla påståenden verifieras automatiskt mot externa källor via Tavily Search API med komplett audit trail.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔍 Automatisk påståendeextraktion:</span> 
                    <span className="ml-2">Systemet identifierar upp till 3 verifierbara påståenden per svar</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📂 Påstående-klassificering:</span>
                    <span className="ml-2">Statistiska, vetenskapliga, temporala, historiska, definitiva</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🌐 Tavily Search API:</span>
                    <span className="ml-2">Söker upp till 3 externa källor per påstående med relevanspoäng</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">✓ Verifikationskriterier:</span>
                    <span className="ml-2">Minst 2 bekräftande källor krävs för verifierad status</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📊 Konfidenspoäng (0-10):</span>
                    <span className="ml-2">0 källor = 0%, 1 källa = 33%, 2 källor = 67%, 3+ källor = 100%</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔗 Källhänvisningar:</span>
                    <span className="ml-2">Direktlänkar till originalkällor för användarverifiering</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📝 Audit trail:</span>
                    <span className="ml-2">Tidsstämpel, sökterm, antal källor, verifieringsstatus för varje påstående</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#666] italic">
                  Overall fact-check score (0-10) beräknas från verifieringsgrad (50%) och genomsnittlig konfideps (50%).
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Transparent Pipeline</h2>
                <p className="mb-4">
                  Varje analyskomponent är fullt transparent med provenance tracking och interaktiv visualisering.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Provenance tracking:</span> Modell, version, metod, tidsstämpel för varje datapunkt</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Timeline-visualisering:</span> Interaktiv tidsaxel med alla pipeline-steg och processtider</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Kvalitetsindikatorer:</span> Objektivitet, klarhet, faktualitet, neutralitet mäts kontinuerligt</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Riskflaggor:</span> Automatisk varning vid hög bias, subjektivitet eller overifierade påståenden</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Metadata-expansion:</span> Klickbara steg för att visa detaljerad teknisk information</div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Auditlogg och Spårbarhet</h2>
                <p className="mb-4">
                  Komplett audit trail för varje analys med fullständig spårbarhet och exportmöjligheter.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Automatisk loggning:</span> Alla API-anrop, pipeline-steg och analyser loggas automatiskt</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Debatt-audit:</span> Debate initiation, rundor, röstning och vinnare trackas med tidsstämplar</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Användarhändelser:</span> Frågor, konfigurationsändringar och export-aktivitet loggas</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Performance-metrik:</span> Responstider, token-användning och API-status per modell</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Export-format:</span> YAML, JSON, PDF, README med fullständig audit trail inkluderad</div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Kommande Funktioner och Utveckling</h3>
                <p className="mb-4 text-sm">
                  Vi arbetar kontinuerligt med att utveckla nya funktioner och förbättra befintliga:
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="text-[#e7e7e7] text-sm font-medium mb-2">🚀 Moduluppdateringar</div>
                    <div className="space-y-1.5 text-xs text-[#888]">
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Fine-tunad Swedish BERT på svensk politisk korpus för bättre ideologiklassificering</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Svenskt sentiment lexicon för VADER med kulturellt anpassade uttryck</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Uppgraderad BERTopic för bättre ämnesmodellering på svenska texter</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[#e7e7e7] text-sm font-medium mb-2">📊 Datavisualisering</div>
                    <div className="space-y-1.5 text-xs text-[#888]">
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Interaktiva diagram för sentiment-trender över tid</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Konsensus-visualisering med heatmaps och divergens-matriser</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Bias-radar för multidimensionell ideologisk kartläggning</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Network-grafer för att visa relationer mellan påståenden och källor</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[#e7e7e7] text-sm font-medium mb-2">🔌 Export och API-integration</div>
                    <div className="space-y-1.5 text-xs text-[#888]">
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>RESTful API med autentisering för extern integration</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>GraphQL endpoints för flexibel dataförfrågan</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>WebSocket för real-time streaming av analysresultat</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Webhooks för event-driven integration med externa system</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Batch-API för massbearbetning av texter</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[#e7e7e7] text-sm font-medium mb-2">⚡ Performance och Skalbarhet</div>
                    <div className="space-y-1.5 text-xs text-[#888]">
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Caching-lager för att återanvända analysresultat vid identiska frågor</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Load balancing mellan flera Python ML-service instanser</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>GPU-acceleration för ML-modeller med CUDA-stöd</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Quantized modeller för snabbare inferens med bibehållen noggrannhet</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[#e7e7e7] text-sm font-medium mb-2">🎯 Användarfunktioner</div>
                    <div className="space-y-1.5 text-xs text-[#888]">
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Anpassade analysprofiler baserat på användarpreferenser</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Historisk tracking och jämförelse av tidigare analyser</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Användargenererade kommentarer och feedback på AI-svar</span></div>
                      <div className="flex gap-2"><span className="text-[#666]">•</span><span>Sparade sökningar och prenumerationer på specifika ämnen</span></div>
                    </div>
                  </div>
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
