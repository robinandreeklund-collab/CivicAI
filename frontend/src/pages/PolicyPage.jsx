import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * PolicyPage Component - Policy
 * Redogör för plattformens policy kring insyn, beslutsfattande, 
 * transparens och användarens rättigheter
 */
export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding */}
          <div className="md:pr-10">
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Policy
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              OneSeek.AI:s policy bygger på principer om fullständig transparens, användarintegritet 
              och ansvarsfull AI-användning.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Fullständig insyn
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Användarens rättigheter
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Ansvarsfull AI
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Total anonymitet
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Insyn och Transparens</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>All AI-analys visas öppet med fullständig spårbarhet</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Källhänvisningar och faktaunderlag presenteras tydligt</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Analysprocessen dokumenteras steg för steg</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Eventuella bias eller begränsningar identifieras och markeras</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Användarens Rättigheter</h2>
                <p className="mb-3">Som användare av OneSeek.AI har du rätt till:</p>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Total anonymitet:</strong> Inga personuppgifter samlas in eller lagras</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Fullständig insyn:</strong> Se exakt hur din fråga analyseras</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Oberoende analys:</strong> Inga kommersiella intressen påverkar resultaten</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Fri tillgång:</strong> Tjänsten är öppen för alla utan krav på registrering</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Datainsamling</h2>
                <p className="mb-3">
                  Vi sparar användarfrågor och AI-svar för att förbättra systemet, men aldrig på ett sätt som kan kopplas till enskilda användare:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="text-[#666]">• Inga IP-adresser lagras</div>
                  <div className="text-[#666]">• Inga cookies för spårning</div>
                  <div className="text-[#666]">• Ingen användarprofilering</div>
                  <div className="text-[#666]">• Ingen identifiering av återkommande användare</div>
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
