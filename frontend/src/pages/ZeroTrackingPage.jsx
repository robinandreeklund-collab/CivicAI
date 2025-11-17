import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ZeroTrackingPage Component - Zero Tracking Standard
 * Förklarar plattformens strikta integritetspolicy
 */
export default function ZeroTrackingPage() {
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
              Zero Tracking
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              Vi sparar användarfrågor och AI-svar för att förbättra transparens – 
              men aldrig på ett sätt som kan kopplas till dig.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Main sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Alla förblir helt anonyma</h2>
                <p className="mb-4 text-sm text-[#888]">
                  När du använder OneSeek.AI lämnar du inga digitala fotspår. Det finns ingen koppling 
                  mellan dina frågor och dig som person. Vi kan inte identifiera dig, spåra dig över tid, 
                  eller koppla samman olika frågor till samma användare.
                </p>
                <p className="text-sm">
                  <strong className="text-[#e7e7e7]">Detta är inte bara en policy – det är tekniskt omöjligt för oss att identifiera dig.</strong>
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Ett skyddande lager</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Zero Tracking Standard innebär att vi fungerar som ett skyddande lager mellan dig och 
                  teknikjättarnas datainsamling. När du använder OneSeek.AI:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Går dina frågor genom oss, inte direkt till AI-företagen</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Avidentifieras all data innan den når externa AI-tjänster</div>
                  <div className="text-[#888]"><span className="text-[#666]">✓</span> Skyddas din integritet genom vår tekniska arkitektur</div>
                </div>
              </div>
            </div>

            {/* What we save - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vad vi sparar och varför</h2>
              <p className="mb-4 text-sm text-[#888]">Vi sparar anonymiserade frågor och AI-svar för att:</p>
              <div className="grid md:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">📊 Förbättra systemets kvalitet</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🔍 Upptäcka och åtgärda bias</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">📝 Dokumentera AI-resonemang</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🌐 Skapa transparens</div>
              </div>
              <p className="mt-4 text-xs text-[#666] italic">
                All denna data är helt avidentifierad och kan inte kopplas till dig som användare.
              </p>
            </div>

            {/* Technical guarantees and promise - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Tekniska Garantier</h2>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">🚫</span> <span className="text-[#aaa] font-medium">Inga IP-adresser:</span> Loggas eller lagras aldrig</div>
                  <div className="text-[#888]"><span className="text-[#666]">🚫</span> <span className="text-[#aaa] font-medium">Inga cookies:</span> Ingen spårning över tid</div>
                  <div className="text-[#888]"><span className="text-[#666]">🚫</span> <span className="text-[#aaa] font-medium">Ingen övervakning:</span> Inget beteendeanalys</div>
                  <div className="text-[#888]"><span className="text-[#666]">🚫</span> <span className="text-[#aaa] font-medium">Ingen profilering:</span> Användare kan inte identifieras</div>
                  <div className="text-[#888]"><span className="text-[#666]">🚫</span> <span className="text-[#aaa] font-medium">Ingen fingerprinting:</span> Ingen dold identifiering</div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vårt Löfte</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Vi samlar <strong className="text-[#e7e7e7]">aldrig</strong> in, lagrar eller säljer någon personlig information – någonsin. 
                  Detta är en grundläggande princip som aldrig kommer att ändras.
                </p>
                <p className="text-xs text-[#888]">
                  Om du vill verifiera detta, är all vår källkod öppen och granskningsbar. Vi välkomnar 
                  säkerhetsgranskningar och transparensrapporter från oberoende aktörer.
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
