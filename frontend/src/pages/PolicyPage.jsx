import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * PolicyPage Component - Policy
 * Redogör för plattformens policy kring insyn, beslutsfattande, 
 * transparens och användarens rättigheter
 */
export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[800px] w-full">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-[#e7e7e7]">
            Policy
          </h1>
          
          <div className="space-y-6 text-[#888] leading-relaxed">
            <p className="text-lg">
              OneSeek.AI:s policy bygger på principer om fullständig transparens, användarintegritet 
              och ansvarsfull AI-användning.
            </p>
            
            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Insyn och Transparens</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>All AI-analys visas öppet med fullständig spårbarhet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Källhänvisningar och faktaunderlag presenteras tydligt</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Analysprocessen dokumenteras steg för steg</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Eventuella bias eller begränsningar identifieras och markeras</span>
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Användarens Rättigheter</h2>
              <p className="mb-3">Som användare av OneSeek.AI har du rätt till:</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Total anonymitet:</strong> Inga personuppgifter samlas in eller lagras</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Fullständig insyn:</strong> Se exakt hur din fråga analyseras</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Oberoende analys:</strong> Inga kommersiella intressen påverkar resultaten</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Fri tillgång:</strong> Tjänsten är öppen för alla utan krav på registrering</span>
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Datainsamling och Lagring</h2>
              <p className="mb-3">
                Vi sparar användarfrågor och AI-svar för att förbättra systemet och skapa transparens, 
                men aldrig på ett sätt som kan kopplas till enskilda användare:
              </p>
              <ul className="space-y-2">
                <li className="text-[#666]">• Inga IP-adresser lagras</li>
                <li className="text-[#666]">• Inga cookies för spårning</li>
                <li className="text-[#666]">• Ingen användarprofilering</li>
                <li className="text-[#666]">• Ingen identifiering av återkommande användare</li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Ansvarsfull AI-användning</h2>
              <p>
                Vi använder AI som verktyg för analys och informationsaggregering, men erkänner dess begränsningar. 
                Resultaten bör alltid ses som ett underlag för vidare reflektion, inte som absoluta sanningar. 
                Vi uppmuntrar källkritiskt tänkande och egna bedömningar.
              </p>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Uppdateringar av Policy</h2>
              <p>
                Denna policy kan uppdateras för att återspegla förbättringar i tjänsten. Väsentliga ändringar 
                kommer att kommuniceras tydligt på plattformen.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
