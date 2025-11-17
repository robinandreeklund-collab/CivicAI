import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * FeaturesPage Component - Funktioner
 * Fördjupad beskrivning av plattformens nyckelfunktioner
 */
export default function FeaturesPage() {
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
              Funktioner
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              OneSeek.AI erbjuder en rad avancerade funktioner för transparent och balanserad AI-analys med 
              fullständig transparens i varje steg av analysprocessen.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Main Features - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Multi-AI Jämförelse</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Få svar från fem ledande AI-modeller samtidigt och jämför deras perspektiv. 
                  Systemet skickar parallella förfrågningar och aggregerar resultat för maximal transparens.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                    <div className="text-[#e7e7e7] mb-1 font-medium">OpenAI GPT-4</div>
                    <div className="text-[#666]">Avancerad språkförståelse och kreativt resonemang</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                    <div className="text-[#e7e7e7] mb-1 font-medium">Anthropic Claude</div>
                    <div className="text-[#666]">Säkerhetsfokuserad AI med stark etisk grund</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                    <div className="text-[#e7e7e7] mb-1 font-medium">Google Gemini</div>
                    <div className="text-[#666]">Multimodal förståelse med bred kunskapsbas</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                    <div className="text-[#e7e7e7] mb-1 font-medium">xAI Grok</div>
                    <div className="text-[#666]">Realtidsdata från 𝕏 (Twitter)</div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-3">
                    <div className="text-[#e7e7e7] mb-1 font-medium">DeepSeek</div>
                    <div className="text-[#666]">Teknisk precision och djupgående analys</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Konsensus Live Debate</h2>
                <p className="mb-4 text-sm text-[#888]">
                  En unik funktion där AI-modeller diskuterar och debatterar komplexa frågor när konsensus är låg (&lt;60%).
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📊 Divergensanalys:</span> 
                    <span className="ml-2">Semantisk likhetsjämförelse identifierar meningsskiljaktigheter</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🎯 Strukturerade rundor:</span> 
                    <span className="ml-2">Upp till 5 debattrundor mellan AI-modeller</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🗳️ Demokratisk röstning:</span> 
                    <span className="ml-2">Modellerna röstar fram det mest välgrundade svaret</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📝 Röstmotiveringar:</span> 
                    <span className="ml-2">Varje modell motiverar sin röst för transparens</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔬 Automatisk analys:</span> 
                    <span className="ml-2">Vinnande svar körs genom komplett pipeline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bias Detection - Full width */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Automatisk Bias-detektion</h2>
              <p className="mb-4 text-sm text-[#888]">
                Avancerad hybridanalys som kombinerar Python ML-modeller med JavaScript-fallbacks för att identifiera bias i realtid.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">🐍 Python ML-verktyg (Föredraget)</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Detoxify v0.5.2: ML-baserad toxicitetsanalys</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>KB/bert-base-swedish-cased: Politisk ideologiklassificering</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>TextBlob v0.17.1: Sentiment och subjektivitet</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>spaCy v3.7.2: POS-tagging och dependency parsing</span></li>
                  </ul>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">⚡ JavaScript Fallback (Alltid tillgänglig)</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>compromise.js v14.11.0: Lättviktig NLP</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom bias detector: Regelbaserad detektion</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom sentiment: Lexicon-baserad analys</span></li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">📊 Politisk vänster-höger-center</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">💰 Ekonomisk dimension</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🌈 Social dimension</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">⚖️ Auktoritetsdimension</div>
              </div>
            </div>

            {/* Fact Check and Pipeline - 2 columns */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Faktakontroll med Audit</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Alla påståenden verifieras automatiskt mot externa källor via Tavily Search API.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔍 Påståendeextraktion:</span> 
                    <span className="ml-2">Upp till 3 verifierbara påståenden per svar</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🌐 Tavily Search API:</span> 
                    <span className="ml-2">Upp till 3 externa källor per påstående</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">✓ Verifiering:</span> 
                    <span className="ml-2">Minst 2 källor krävs för verifierad status</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📊 Konfidenspoäng:</span> 
                    <span className="ml-2">0-10 baserat på antal och kvalitet</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📝 Audit trail:</span> 
                    <span className="ml-2">Tidsstämpel, källor, verifieringsstatus</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Transparent Pipeline</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Varje analyskomponent är fullt transparent med provenance tracking och interaktiv visualisering.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Provenance tracking:</span> Modell, version, metod, tidsstämpel</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Timeline-visualisering:</span> Interaktiv tidsaxel med processtider</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Kvalitetsindikatorer:</span> Objektivitet, klarhet, faktualitet</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Riskflaggor:</span> Automatisk varning vid problem</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Metadata-expansion:</span> Detaljerad teknisk information</div>
                </div>
              </div>
            </div>

            {/* Audit Log - Full width */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Auditlogg och Spårbarhet</h2>
              <p className="mb-4 text-sm text-[#888]">
                Komplett audit trail för varje analys med fullständig spårbarhet och exportmöjligheter.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Automatisk loggning:</span> API-anrop, pipeline-steg, analyser</div>
                  <div className="text-[#888] mt-2"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Debatt-audit:</span> Rundor, röstning, vinnare</div>
                </div>
                <div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Användarhändelser:</span> Frågor, konfigurationsändringar</div>
                  <div className="text-[#888] mt-2"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Performance-metrik:</span> Responstider, token-användning</div>
                </div>
                <div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Export-format:</span> YAML, JSON, PDF, README</div>
                </div>
              </div>
            </div>

            {/* Model Explainability - SHAP & LIME - Full width */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Model Förklarbarhet (SHAP & LIME)</h2>
              <p className="mb-4 text-sm text-[#888]">
                Förstå exakt hur AI-modellen fattar beslut genom avancerad explainability-analys med SHAP och LIME.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">🔍 SHAP - Global Förklaringar</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Feature importance för alla klasser</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Identifierar mest inflytelserika ord</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Visar bidrag per vänster/center/höger</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Model-agnostisk analys (fungerar med alla modeller)</span></li>
                  </ul>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">💡 LIME - Lokala Förklaringar</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Förklaring för varje individuell prediktion</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Ord-nivå bidrag med vikter</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Interaktiva klickbara insights cards</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Visar alternativa prediktionsscenarier</span></li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🎯 Transparent beslutsfattande</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">📊 Visuella förklaringar</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🔬 Vetenskaplig grund</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">💾 Exporterbara resultat</div>
              </div>
            </div>

            {/* Fairness & Bias Analysis - Full width */}
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Rättvisa & Bias Analys (Fairlearn)</h2>
              <p className="mb-4 text-sm text-[#888]">
                Säkerställ etisk AI med automatisk fairness-analys som mäter demographic parity och equal opportunity över demografiska grupper.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">⚖️ Demographic Parity</div>
                  <div className="space-y-1.5 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Mäter jämlik behandling över grupper</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Detekterar bias i selection rates</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Automatiska varningar vid tröskelvärden</span></div>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">🎯 Equal Opportunity</div>
                  <div className="space-y-1.5 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Säkerställer lika chanser för alla grupper</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Balanserad accuracy tracking</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Statistisk paritet beräkning</span></div>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] mb-2 font-medium text-sm">📊 Fairness Indicators</div>
                  <div className="space-y-1.5 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Realtids dashboards med metriker</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Historisk tracking av bias över tid</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Rekommendationer vid bias-detektion</span></div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#888] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3">
                <span className="text-[#e7e7e7] font-medium">✓ Fairness Status Indicators:</span> 
                <span className="ml-2">Fair (&lt;0.10) | Borderline (0.10-0.15) | Biased (&gt;0.15)</span>
              </div>
            </div>

            {/* Data Quality & EDA - 2 columns */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Data Quality Reports (Sweetviz)</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Automatiska HTML-rapporter för djupgående dataset-analys med Sweetviz.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📊 Automatisk EDA:</span> 
                    <span className="ml-2">Feature korrelationer, distributions, missing values</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔄 Dataset-jämförelser:</span> 
                    <span className="ml-2">Train vs test, före vs efter preprocessing</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📈 Interaktiva rapporter:</span> 
                    <span className="ml-2">Klickbara HTML-rapporter med visualiseringar</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">💾 Export-format:</span> 
                    <span className="ml-2">HTML, PDF för delning och dokumentation</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Interactive Visualizations (Lux)</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Smarta visualiseringar direkt i Pandas DataFrames med Lux-integration.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🎯 Smart rekommendationer:</span> 
                    <span className="ml-2">Automatisk val av bästa visualiseringar</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">📊 Flera charttyper:</span> 
                    <span className="ml-2">Bar, scatter, histogram, correlation heatmaps</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">🔍 Interaktiv utforskning:</span> 
                    <span className="ml-2">Zoom, pan, filter direkt i visualiseringen</span>
                  </div>
                  <div className="text-[#888]">
                    <span className="text-[#e7e7e7] font-medium">⚡ One-line integration:</span> 
                    <span className="ml-2">Automatisk enhancement av Pandas workflow</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Development */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Kommande Funktioner och Utveckling</h3>
              <p className="mb-4 text-sm text-[#888]">
                Vi arbetar kontinuerligt med att utveckla nya funktioner och förbättra befintliga:
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-[#e7e7e7] text-sm font-medium mb-2">🚀 Moduluppdateringar</div>
                  <div className="space-y-1 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Fine-tunad Swedish BERT</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Svenskt sentiment lexicon</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Uppgraderad BERTopic</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[#e7e7e7] text-sm font-medium mb-2">📊 Datavisualisering</div>
                  <div className="space-y-1 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Sentiment-trender över tid</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Konsensus-heatmaps</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Bias-radar och network-grafer</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[#e7e7e7] text-sm font-medium mb-2">🔌 Export och API</div>
                  <div className="space-y-1 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>RESTful API med autentisering</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>GraphQL endpoints</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>WebSocket, Webhooks, Batch-API</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[#e7e7e7] text-sm font-medium mb-2">⚡ Performance</div>
                  <div className="space-y-1 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Caching-lager</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Load balancing</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>GPU-acceleration</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[#e7e7e7] text-sm font-medium mb-2">🎯 Användarfunktioner</div>
                  <div className="space-y-1 text-xs text-[#888]">
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Anpassade analysprofiler</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Historisk tracking</span></div>
                    <div className="flex gap-2"><span className="text-[#666]">•</span><span>Användarfeedback</span></div>
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
