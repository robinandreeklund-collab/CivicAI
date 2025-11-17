import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * AboutPage Component - Om oss
 * Beskriver projektets syfte, bakgrund och vision
 * Fokus på öppenhet, samhällsnytta och teknisk transparens
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding */}
          <div className="md:pr-10">
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Om oss
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              OneSeek.AI är en plattform för transparent och ansvarsfull användning av artificiell intelligens 
              i samhällsfrågor och beslutsfattande.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Öppenhet i varje steg
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Samhällsnytta i fokus
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Teknisk transparens
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Zero tracking standard
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vår Vision</h2>
                <p>
                  Vi strävar efter att göra AI-driven analys tillgänglig, transparent och pålitlig. Genom att 
                  jämföra flera AI-modeller samtidigt och visa hela analysprocessen öppet, bidrar vi till ett 
                  mer informerat och demokratiskt beslutsfattande.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Våra Principer</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Öppenhet:</strong> Hela analysprocessen är synlig och spårbar</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Samhällsnytta:</strong> Fokus på frågor som påverkar människors vardag</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Teknisk transparens:</strong> Visa hur AI-modeller resonerar och vilka källor de använder</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3">✓</span>
                    <span><strong className="text-[#e7e7e7]">Integritet:</strong> Zero tracking – ingen övervakning av användare</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Bakgrund</h2>
                <p>
                  OneSeek.AI skapades ur behovet av transparens i AI-driven informationsanalys. I en tid då 
                  AI-modeller blir allt viktigare för beslutsfattande, är det avgörande att förstå hur dessa 
                  system fungerar och vilka begränsningar de har.
                </p>
              </div>

              <div>
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
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
