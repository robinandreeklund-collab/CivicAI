import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * PipelinePage Component - Pipeline
 * Visar hur data bearbetas steg för steg genom NLP-pipelinen med full transparens
 */
export default function PipelinePage() {
  const steps = [
    { 
      num: "01", 
      title: "Frågeanalys", 
      desc: "Din fråga analyseras med avancerad NLP-teknik för att identifiera nyckelämnen, kontext och semantiska mönster.",
      details: [
        "Tokenisering och POS-tagging med spaCy (v3.7.2) eller compromise.js (v14.11.0)",
        "Named Entity Recognition (NER) för att identifiera personer, platser och organisationer",
        "Språkdetektion med langdetect (v1.0.9)",
        "Subjektivitetsanalys för att bedöma objektiva vs subjektiva formuleringar",
        "Alla steg loggas med provenance: modell, version, metod och tidsstämpel"
      ]
    },
    { 
      num: "02", 
      title: "Multi-AI Analys", 
      desc: "Frågan skickas parallellt till fem ledande AI-modeller för att få olika perspektiv och undvika single-point-of-failure.",
      details: [
        "OpenAI GPT-4 - Avancerad språkförståelse och resonemang",
        "Anthropic Claude - Säkerhetsfokuserad och etisk analys",
        "Google Gemini - Multimodal förståelse och faktakontroll",
        "xAI Grok - Realtidsdata och nyhetsbaserad kontext",
        "DeepSeek - Teknisk precision och djup analys",
        "Systemet loggar responstid, token-användning och API-status för varje modell"
      ]
    },
    { 
      num: "03", 
      title: "Faktakontroll", 
      desc: "Alla påståenden verifieras automatiskt mot externa källor via Tavily Search API för maximal tillförlitlighet.",
      details: [
        "Automatisk påståendeextraktion med klassificering (statistiska, vetenskapliga, temporala, historiska, definitiva)",
        "Tavily Search API söker upp till 3 externa källor per påstående",
        "Påståenden markeras som verifierade vid minst 2 bekräftande källor",
        "Konfidenspoäng (0-10) beräknas baserat på antal och kvalitet på källor",
        "Alla källor presenteras med direktlänkar för användarverifiering",
        "Audit trail: tidsstämpel, sökterm, antal källor, verifieringsstatus"
      ]
    },
    { 
      num: "04", 
      title: "Bias-detektion", 
      desc: "Svaren analyseras automatiskt för politiska vinklingar, sentiment och toxicitet med hybrid Python ML och JavaScript.",
      details: [
        "Politisk bias: Vänster-höger-center klassificering med KB/bert-base-swedish-cased",
        "Toxicitetsanalys med Detoxify (v0.5.2) - ML-baserad detektion av toxicitet, hot, förolämpningar",
        "Sentimentanalys med TextBlob (v0.17.1) - Polaritet och subjektivitet",
        "Ideologiska dimensioner: Ekonomisk, social och auktoritetsdimension",
        "Automatisk fallback till JavaScript (compromise.js) om Python ML ej tillgänglig",
        "Per-mening analys med flaggade termer och visuell markering"
      ]
    },
    { 
      num: "05", 
      title: "Konsensusanalys", 
      desc: "AI-modellernas svar jämförs för att identifiera gemensamma slutsatser, meningsskiljaktigheter och konsensusnivå.",
      details: [
        "Semantisk likhetsjämförelse mellan alla fem AI-modeller",
        "Konsensuspoäng (0-100%) baserat på överensstämmelse i kärnpåståenden",
        "Identifiering av högseveritets-skillnader i fakta eller slutsatser",
        "Vid låg konsensus (<60%): Möjlighet att starta Konsensus Live Debate",
        "Live Debate: 5 debattrundor där AI-modeller argumenterar och röstar fram bästa svar",
        "Vinnande svar analyseras automatiskt med komplett pipeline"
      ]
    },
    { 
      num: "06", 
      title: "Presentation", 
      desc: "Alla resultat presenteras med fullständig transparens, interaktiv visualisering och exportmöjligheter.",
      details: [
        "Timeline-vy med alla pipeline-steg, processtider och metadata",
        "Interaktiva analyspaneler för sentiment, ideologi och faktakontroll",
        "Kvalitetsindikatorer och riskflaggor tydligt visualiserade",
        "Provenance tracking: Varje datapunkt spåras till källa, modell och version",
        "Exportformat: YAML, JSON, PDF, README med komplett audit trail",
        "API-endpoints för extern integration och automatisering"
      ]
    },
  ];

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
              Pipeline
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              OneSeek.AI:s analyspipeline består av flera steg som tillsammans skapar en omfattande 
              och transparent analys. Varje steg använder avancerade verktyg och metoder för att säkerställa 
              maximal kvalitet och transparens.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Pipeline Steps - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step) => (
                <div key={step.num} className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-light text-[#e7e7e7] mb-3">{step.title}</h3>
                      <p className="text-sm mb-4 text-[#aaa]">{step.desc}</p>
                      <ul className="space-y-2 text-xs">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-[#666] mt-0.5">•</span>
                            <span className="text-[#888]">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hybrid Pipeline Architecture - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Hybrid Pipeline-arkitektur</h3>
              <p className="mb-4 text-sm text-[#888]">
                Systemet använder en hybrid-arkitektur som kombinerar Python ML-verktyg med JavaScript-fallbacks för maximal tillförlitlighet:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] font-medium mb-3">🐍 Python ML Pipeline (Föredraget)</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>spaCy v3.7.2 (sv_core_news_sm) - Avancerad tokenisering och NER</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>TextBlob v0.17.1 - Sentiment polarity och subjectivity</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Detoxify v0.5.2 - ML-baserad toxicitetsanalys</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>KB/bert-base-swedish-cased - Svensk BERT för ideologiklassificering</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>langdetect v1.0.9 - Multi-språkdetektion</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>BERTopic v0.16.0 / Gensim v4.3.2 - Ämnesmodellering</span></li>
                  </ul>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] font-medium mb-3">⚡ JavaScript Fallback (Alltid tillgänglig)</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>compromise.js v14.11.0 - Lättviktig NLP och tokenisering</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom sentiment analyzer - Lexicon-baserad sentimentanalys</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom bias detector - Regelbaserad bias-detektion</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Custom ideology classifier - Svensk politisk terminologi</span></li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-xs text-[#666] italic">
                Systemet väljer automatiskt Python ML när tillgängligt och faller tillbaka på JavaScript vid behov.
                Provenance tracking dokumenterar exakt vilka verktyg som användes för varje analys.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Auditlogg och Transparens</h3>
                <p className="mb-4 text-sm text-[#888]">
                  Varje pipeline-körning genererar en komplett audit trail med fullständig spårbarhet:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Provenance tracking:</span> Modell, version, metod och tidsstämpel för varje steg</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Timeline-visualisering:</span> Interaktiv tidsaxel med processtider och metadata</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Export-format:</span> YAML, JSON, PDF, README med fullständiga analysresultat</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">API-access:</span> RESTful endpoints för extern integration och automatisering</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Kvalitetsindikatorer:</span> Objektitivitet, klarhet, faktualitet och neutralitet mäts kontinuerligt</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Riskflaggor:</span> Automatisk detektering av hög bias, subjektivitet, aggression eller overifierade påståenden</div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Kontinuerlig Utveckling</h3>
                <p className="mb-4 text-sm text-[#888]">
                  Pipelinen utvecklas kontinuerligt med nya moduler och förbättrade analysmetoder. 
                  All utveckling sker öppet med fokus på användarnytta och transparens.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Planerade moduluppdateringar:</span> Fine-tunad Swedish BERT för bättre ideologiklassificering</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Kommande funktioner:</span> Real-time streaming, batch-processing, historisk tracking</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">API-expansion:</span> Webhooks, GraphQL endpoints, WebSocket för live-uppdateringar</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Datavisualisering:</span> Avancerade diagram för sentiment, konsensus och bias över tid</div>
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
