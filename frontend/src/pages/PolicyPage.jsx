import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * PolicyPage Component - Policy
 * Redogör för plattformens policy kring insyn, beslutsfattande, 
 * transparens och användarens rättigheter
 */
export default function PolicyPage() {
  return (
    <div className="bg-[#0a0a0a] text-[#e7e7e7]">
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
              Policy
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              OneSeek.AI:s policy bygger på principer om fullständig transparens, användarintegritet 
              och ansvarsfull AI-användning.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Main sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Insyn och Transparens</h2>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> All AI-analys visas öppet med fullständig spårbarhet</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Källhänvisningar och faktaunderlag presenteras tydligt</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Analysprocessen dokumenteras steg för steg</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Eventuella bias eller begränsningar identifieras och markeras</div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Användarens Rättigheter</h2>
                <p className="mb-4 text-sm text-[#888]">Som användare av OneSeek.AI har du rätt till:</p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> <span className="text-[#aaa] font-medium">Total anonymitet:</span> Inga personuppgifter samlas in eller lagras</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> <span className="text-[#aaa] font-medium">Fullständig insyn:</span> Se exakt hur din fråga analyseras</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> <span className="text-[#aaa] font-medium">Oberoende analys:</span> Inga kommersiella intressen påverkar resultaten</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> <span className="text-[#aaa] font-medium">Fri tillgång:</span> Tjänsten är öppen för alla utan krav på registrering</div>
                </div>
              </div>
            </div>

            {/* Data collection - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Datainsamling</h2>
              <p className="mb-4 text-sm text-[#888]">
                Vi sparar användarfrågor och AI-svar för att förbättra systemet, men aldrig på ett sätt som kan kopplas till enskilda användare:
              </p>
              <div className="grid md:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🚫 Inga IP-adresser lagras</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🚫 Inga cookies för spårning</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🚫 Ingen användarprofilering</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🚫 Ingen identifiering</div>
              </div>
            </div>

            {/* Core principles - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Ansvarsfull AI-användning</h2>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Multi-AI jämförelse:</span> Inga enskilda modeller får dominera</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Bias-detektion:</span> Automatisk analys av ideologisk lutning</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Faktakontroll:</span> Externa källor verifierar påståenden</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Öppen källkod:</span> Alla analysmetoder är transparenta</div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vårt Åtagande</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Vi åtar oss att aldrig kompromissa med dessa grundprinciper:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Fullständig transparens i alla processer</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Användarens integritet kommer alltid först</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Oberoende från kommersiella intressen</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Öppen kommunikation om systemets begränsningar</div>
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
