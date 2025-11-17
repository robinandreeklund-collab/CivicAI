import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ZeroTrackingPage Component - Zero Tracking Standard
 * Förklarar plattformens strikta integritetspolicy
 */
export default function ZeroTrackingPage() {
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
              Zero Tracking
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              Vi sparar användarfrågor och AI-svar för att förbättra transparens – 
              men aldrig på ett sätt som kan kopplas till dig.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                🚫 Inga IP-adresser
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                🚫 Inga cookies
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                🚫 Ingen övervakning
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                🚫 Ingen profilering
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Alla förblir helt anonyma</h2>
                <p className="mb-4">
                  När du använder OneSeek.AI lämnar du inga digitala fotspår. Det finns ingen koppling 
                  mellan dina frågor och dig som person. Vi kan inte identifiera dig, spåra dig över tid, 
                  eller koppla samman olika frågor till samma användare.
                </p>
                <p className="text-[#e7e7e7] font-medium">
                  Detta är inte bara en policy – det är tekniskt omöjligt för oss att identifiera dig.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Ett skyddande lager</h2>
                <p className="mb-3">
                  Zero Tracking Standard innebär att vi fungerar som ett skyddande lager mellan dig och 
                  teknikjättarnas datainsamling. När du använder OneSeek.AI:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span>Går dina frågor genom oss, inte direkt till AI-företagen</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span>Avidentifieras all data innan den når externa AI-tjänster</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span>Skyddas din integritet genom vår tekniska arkitektur</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vad vi sparar och varför</h2>
                <p className="mb-3">Vi sparar anonymiserade frågor och AI-svar för att:</p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• Förbättra systemets kvalitet och noggrannhet</div>
                  <div className="text-[#666]">• Upptäcka och åtgärda bias i AI-modellerna</div>
                  <div className="text-[#666]">• Dokumentera och granska AI-systemens resonemang</div>
                  <div className="text-[#666]">• Skapa transparens i hur AI används</div>
                </div>
                <p className="mt-4 text-sm">
                  All denna data är helt avidentifierad och kan inte kopplas till dig som användare.
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Vårt Löfte</h3>
                <p className="text-[#e7e7e7]">
                  Vi samlar <strong>aldrig</strong> in, lagrar eller säljer någon personlig information – någonsin. 
                  Detta är en grundläggande princip som aldrig kommer att ändras.
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
