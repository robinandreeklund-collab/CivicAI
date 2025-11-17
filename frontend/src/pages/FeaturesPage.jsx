import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * FeaturesPage Component - Funktioner
 * Fördjupad beskrivning av plattformens nyckelfunktioner
 */
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[800px] w-full">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-[#e7e7e7]">
            Funktioner
          </h1>
          
          <div className="space-y-6 text-[#888] leading-relaxed">
            <p className="text-lg">
              OneSeek.AI erbjuder en rad avancerade funktioner för transparent och balanserad AI-analys.
            </p>
            
            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Multi-AI Jämförelse</h2>
              <p className="mb-3">
                Få svar från fem ledande AI-modeller samtidigt och jämför deras perspektiv:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span><strong className="text-[#e7e7e7]">OpenAI GPT-4:</strong> Avancerad språkförståelse och resonemang</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span><strong className="text-[#e7e7e7]">Anthropic Claude:</strong> Fokus på säkerhet och nyanserad analys</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span><strong className="text-[#e7e7e7]">Google Gemini:</strong> Multimodal förståelse och bred kunskapsbas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span><strong className="text-[#e7e7e7]">xAI Grok:</strong> Realtidsdata och alternativa perspektiv</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span><strong className="text-[#e7e7e7]">DeepSeek:</strong> Teknisk precision och detaljerad analys</span>
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Konsensus Live Debate</h2>
              <p className="mb-3">
                En unik funktion där AI-modeller diskuterar och debatterar komplexa frågor:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Strukturerade debattrundor mellan AI-modeller</li>
                <li className="text-[#666]">• Identifiering av gemensamma slutsatser</li>
                <li className="text-[#666]">• Tydlig markering av meningsskiljaktigheter</li>
                <li className="text-[#666]">• Röstning och konsensusbedömning</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Automatisk Bias-detektion</h2>
              <p className="mb-3">
                Avancerad analys som identifierar och markerar eventuella bias i AI-svar:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Politisk vinkling och ideologiska tendenser</li>
                <li className="text-[#666]">• Sentiment och tonalitet i framställningen</li>
                <li className="text-[#666]">• Obalanserad källanvändning</li>
                <li className="text-[#666]">• Visuell markering av detekterade bias</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Faktakontroll med Tavily</h2>
              <p className="mb-3">
                Alla påståenden verifieras mot externa källor i realtid:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Automatisk källsökning och verifiering</li>
                <li className="text-[#666]">• Tydliga källhänvisningar till alla påståenden</li>
                <li className="text-[#666]">• Markering av overifierade påståenden</li>
                <li className="text-[#666]">• Direktlänkar till originalkällor</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Transparent Analyspipeline</h2>
              <p className="mb-3">
                Se exakt hur din fråga bearbetas steg för steg:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Visuell tidslinje för hela analysprocessen</li>
                <li className="text-[#666]">• Detaljerad loggning av varje steg</li>
                <li className="text-[#666]">• Insyn i vilka moduler som används</li>
                <li className="text-[#666]">• Tidsåtgång och processinformation</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Auditlogg och Spårbarhet</h2>
              <p className="mb-3">
                Fullständig dokumentation av alla analyser:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Komplett historik över alla frågor och svar</li>
                <li className="text-[#666]">• Spårbarhet av AI-resonemang och slutsatser</li>
                <li className="text-[#666]">• Export av analyser i olika format</li>
                <li className="text-[#666]">• Möjlighet att granska tidigare analyser</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Policy Question Bank</h2>
              <p className="mb-3">
                Färdiga frågemallar för vanliga samhällsfrågor:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Förberedda frågor inom politik, ekonomi och samhälle</li>
                <li className="text-[#666]">• Strukturerade analyser av komplexa ämnen</li>
                <li className="text-[#666]">• Jämförande perspektiv på aktuella frågor</li>
                <li className="text-[#666]">• Kontinuerligt uppdaterad frågebank</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Realtidsanalys</h2>
              <p className="mb-3">
                Live-uppdateringar under hela analysprocessen:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Se AI-svar genereras i realtid</li>
                <li className="text-[#666]">• Progressindikatorer för varje analyssteg</li>
                <li className="text-[#666]">• Animerade visualiseringar av dataflöden</li>
                <li className="text-[#666]">• Omedelbar feedback på analysens status</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mt-8">
              <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Kommande Funktioner</h3>
              <p className="mb-3">Vi arbetar kontinuerligt med att utveckla nya funktioner:</p>
              <ul className="space-y-2 text-sm">
                <li className="text-[#666]">• Användaranpassade analysprofiler</li>
                <li className="text-[#666]">• Avancerad datavisualisering</li>
                <li className="text-[#666]">• Jämförande historisk analys</li>
                <li className="text-[#666]">• API för externa integrationer</li>
                <li className="text-[#666]">• Community-funktioner och delning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
