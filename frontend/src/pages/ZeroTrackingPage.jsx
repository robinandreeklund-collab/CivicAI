import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ZeroTrackingPage Component - Zero Tracking Standard
 * Förklarar plattformens strikta integritetspolicy
 */
export default function ZeroTrackingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[800px] w-full">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-[#e7e7e7]">
            Zero Tracking Standard
          </h1>
          
          <div className="space-y-6 text-[#888] leading-relaxed">
            <p className="text-lg text-[#e7e7e7]">
              Vi sparar användarfrågor och AI-svar för att förbättra transparens och funktionalitet – 
              men <strong>aldrig</strong> på ett sätt som kan kopplas till enskilda användare.
            </p>
            
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 my-8">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-6 text-center">
                Vad Zero Tracking Innebär
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🚫</span>
                    <div>
                      <h3 className="text-[#e7e7e7] font-medium mb-1">Inga IP-adresser lagras</h3>
                      <p className="text-sm text-[#666]">Vi registrerar aldrig var du är eller varifrån du använder tjänsten</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🚫</span>
                    <div>
                      <h3 className="text-[#e7e7e7] font-medium mb-1">Inga cookies används</h3>
                      <p className="text-sm text-[#666]">Ingen spårning via cookies eller liknande tekniker</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🚫</span>
                    <div>
                      <h3 className="text-[#e7e7e7] font-medium mb-1">Ingen användarövervakning</h3>
                      <p className="text-sm text-[#666]">Vi följer inte ditt beteende eller dina mönster</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🚫</span>
                    <div>
                      <h3 className="text-[#e7e7e7] font-medium mb-1">Ingen profilering</h3>
                      <p className="text-sm text-[#666]">Inga användarprofiler skapas eller analyseras</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
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

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Ett skyddande lager</h2>
              <p>
                Zero Tracking Standard innebär att vi fungerar som ett skyddande lager mellan dig och 
                teknikjättarnas datainsamling. När du använder OneSeek.AI:
              </p>
              <ul className="space-y-2 mt-3">
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span>Går dina frågor genom oss, inte direkt till AI-företagen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span>Avidentifieras all data innan den når externa AI-tjänster</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span>Skyddas din integritet genom vår tekniska arkitektur</span>
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vad vi sparar och varför</h2>
              <p className="mb-3">
                Vi sparar anonymiserade frågor och AI-svar för att:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Förbättra systemets kvalitet och noggrannhet</li>
                <li className="text-[#666]">• Upptäcka och åtgärda bias i AI-modellerna</li>
                <li className="text-[#666]">• Dokumentera och granska AI-systemens resonemang</li>
                <li className="text-[#666]">• Skapa transparens i hur AI används</li>
              </ul>
              <p className="mt-4 text-sm">
                All denna data är helt avidentifierad och kan inte kopplas till dig som användare.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mt-8">
              <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Vårt Löfte</h3>
              <p className="text-[#e7e7e7]">
                Vi samlar <strong>aldrig</strong> in, lagrar eller säljer någon personlig information – någonsin. 
                Detta är en grundläggande princip som aldrig kommer att ändras.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
