import { Link } from 'react-router-dom';
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
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-4 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Om oss
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              En plattform för digitalt självförsvar, demokratisk insyn och teknisk folkbildning.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ AI som granskar AI
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Zero Tracking-standard
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Anonym nyckelbaserad inloggning
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✓ Total transparens i analyskedjan
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vår Vision: Insyn i en tid av osäkerhet</h2>
                <p className="mb-3">
                  Vi står inför en ny verklighet där AI-modeller formar människors uppfattningar, påverkar 
                  politiska beslut och styr informationsflöden i det tysta. Samtidigt blir dessa system allt 
                  mer slutna, svårgranskade och asymmetriskt kontrollerade av ett fåtal aktörer.
                </p>
                <p className="mb-3">
                  I detta landskap är insyn inte längre en lyx — det är en demokratisk nödvändighet.
                </p>
                <p className="mb-3">
                  <strong className="text-[#e7e7e7]">OpenSeek.AI är vår motrörelse.</strong>
                </p>
                <p>
                  Vi bygger en plattform där AI-driven analys blir tillgänglig, transparent och samhällsviktig. 
                  Genom att jämföra flera AI-modeller parallellt, visa hela analyskedjan öppet och skydda 
                  användarens anonymitet, skapar vi ett nytt paradigm: AI som granskar AI.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Framtidens hot vi adresserar</h2>
                <ul className="space-y-3 list-none">
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3 mt-1">•</span>
                    <div>
                      <strong className="text-[#e7e7e7]">Undermedveten påverkan:</strong> AI-svar kan vinklas 
                      för att förstärka narrativ, undvika kontroverser eller forma opinion — utan att användaren märker det.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3 mt-1">•</span>
                    <div>
                      <strong className="text-[#e7e7e7]">Vridna svar för maktpåverkan:</strong> AI-modeller kan 
                      optimeras för att gynna vissa ideologier, företag eller stater.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3 mt-1">•</span>
                    <div>
                      <strong className="text-[#e7e7e7]">IP-spårning och profilering:</strong> Många AI-plattformar 
                      loggar plats, beteende och identitet — vilket gör beslutsfattare, journalister och forskare 
                      sårbara för kartläggning.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3 mt-1">•</span>
                    <div>
                      <strong className="text-[#e7e7e7]">Informationsasymmetri:</strong> Vanliga användare får 
                      svar — men aldrig insyn i hur de formades, vilka källor som användes eller vilka modeller 
                      som låg bakom.
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vårt svar: Etisk arkitektur från grunden</h2>
                <p className="mb-3">
                  OpenSeek.AI är byggt för att stå emot framtidens informationsrisker. Vi tillämpar:
                </p>
                <div className="space-y-4">
                  <div>
                    <strong className="text-[#e7e7e7]">Zero Tracking-standard:</strong>
                    <ul className="mt-2 space-y-2 list-none ml-4">
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Ingen IP-loggning</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Ingen fingerprinting</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Ingen dold analys av användarbeteende</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[#e7e7e7]">Anonym nyckelbaserad inloggning:</strong>
                    <ul className="mt-2 space-y-2 list-none ml-4">
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Inga e-postadresser eller personuppgifter krävs</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Identiteten skapas lokalt via ett nyckelpar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Återställning sker via seed phrase eller QR-kod</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[#e7e7e7]">Bot-skydd utan övervakning:</strong>
                    <ul className="mt-2 space-y-2 list-none ml-4">
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Proof-of-Work eller privacy-respekterande CAPTCHA</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Skyddar plattformen utan att kompromissa med anonymitet</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[#e7e7e7]">Insynsprofiler utan identitet:</strong>
                    <ul className="mt-2 space-y-2 list-none ml-4">
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Användaren kan följa sin egen analysresa</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#666] mr-3">•</span>
                        <span>Allt kopplas till nyckel-ID — inte till person</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Plattformseffekten: Vi knyter ihop allt</h2>
                <p className="mb-3">
                  I dagens AI-landskap tvingas användare hoppa mellan olika modeller, jämföra svar manuellt och 
                  försöka förstå vad som är sant, vinklat eller relevant. Det är tidskrävande, splittrat och 
                  ofta förvirrande.
                </p>
                <p className="mb-3">
                  OpenSeek.AI ersätter detta med en samlad insynsplattform:
                </p>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Vi samlar svar från flera AI-modeller samtidigt</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Vi visar skillnader, bias och källor</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Vi analyserar och syntetiserar — så att du slipper göra det själv</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>Vi sparar tid, minskar kognitiv belastning och ger dig en tydlig överblick</span>
                  </li>
                </ul>
                <p className="mt-3">
                  <strong className="text-[#e7e7e7]">Resultatet:</strong> Du får inte bara ett svar — du får en 
                  karta över AI-landskapet.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknologi för transparens</h2>
                <p>
                  Vi använder flera av världens mest avancerade språkmodeller parallellt — inklusive GPT-4, 
                  Claude, Gemini och fler. Genom att jämföra deras svar, analysera skillnader och visa hela 
                  analyskedjan öppet, bygger vi en balanserad, källkritisk och tillförlitlig analys.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Kommande: OQT-1.0 – vår egen språkmodell</h2>
                <p className="mb-3">
                  OQT-1.0 (Open Quality Transformer) är OpenSeek.AI:s egen språkmodell under utveckling — en 
                  banbrytande satsning på medveten, transparent och samhällsviktig AI.
                </p>
                <p className="mb-3">
                  Den tränas på miljontals AI-genererade svar från över 20 av världens största modeller, och 
                  är designad för att:
                </p>
                <ul className="space-y-2 list-none mb-3">
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>syntetisera konsensus</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>avslöja bias</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>ge etiskt balanserade insikter</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#666] mr-3">•</span>
                    <span>agera som en otryckbar insynsmotor i en snabbt föränderlig värld</span>
                  </li>
                </ul>
                <p>
                  OQT-1.0 är inte bara en modell — det är en meta-intelligens som förstår hur andra AI-system tänker.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vår roll i samhället</h2>
                <p className="mb-3">
                  OpenSeek.AI är inte ett företag som säljer svar.
                </p>
                <p className="mb-3">
                  Vi är en plattform för digitalt självförsvar, demokratisk insyn och teknisk folkbildning.
                </p>
                <p className="mb-3">
                  Vi ger medborgare, forskare och beslutsfattare verktyg att förstå — inte bara konsumera — 
                  AI-genererad information.
                </p>
                <p>
                  <strong className="text-[#e7e7e7]">I en tid av osäkerhet bygger vi tillit genom transparens.</strong>
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
