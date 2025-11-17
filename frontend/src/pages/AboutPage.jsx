import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * AboutPage Component - Om oss
 * Beskriver projektets syfte, bakgrund och vision
 * Fokus på öppenhet, samhällsnytta och teknisk transparens
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[800px] w-full">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-[#e7e7e7]">
            Om oss
          </h1>
          
          <div className="space-y-6 text-[#888] leading-relaxed">
            <p className="text-lg">
              OneSeek.AI är en plattform för transparent och ansvarsfull användning av artificiell intelligens 
              i samhällsfrågor och beslutsfattande.
            </p>
            
            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vår Vision</h2>
              <p>
                Vi strävar efter att göra AI-driven analys tillgänglig, transparent och pålitlig. Genom att 
                jämföra flera AI-modeller samtidigt och visa hela analysprocessen öppet, bidrar vi till ett 
                mer informerat och demokratiskt beslutsfattande.
              </p>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Våra Principer</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Öppenhet:</strong> Hela analysprocessen är synlig och spårbar</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Samhällsnytta:</strong> Fokus på frågor som påverkar människors vardag</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Teknisk transparens:</strong> Visa hur AI-modeller resonerar och vilka källor de använder</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">✓</span>
                  <span><strong className="text-[#e7e7e7]">Integritet:</strong> Zero tracking – ingen övervakning av användare</span>
                </li>
              </ul>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Bakgrund</h2>
              <p>
                OneSeek.AI skapades ur behovet av transparens i AI-driven informationsanalys. I en tid då 
                AI-modeller blir allt viktigare för beslutsfattande, är det avgörande att förstå hur dessa 
                system fungerar och vilka begränsningar de har.
              </p>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknologi</h2>
              <p>
                Plattformen använder flera ledande AI-modeller parallellt, inklusive GPT-4, Claude, Gemini, 
                och andra. Genom att jämföra olika perspektiv och källkritiskt granska information ger vi 
                en mer balanserad och tillförlitlig analys.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
