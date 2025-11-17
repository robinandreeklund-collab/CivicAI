import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * AboutPage Component - Om oss
 * Beskriver projektets syfte, bakgrund och vision
 * Fokus på öppenhet, samhällsnytta och teknisk transparens
 */
export default function AboutPage() {
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
              Om oss
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              En plattform för digitalt självförsvar, demokratisk insyn och teknisk folkbildning.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Main sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vår Vision: Insyn i en tid av osäkerhet</h2>
                <p className="mb-3 text-sm text-[#888]">
                  Vi står inför en ny verklighet där AI-modeller formar människors uppfattningar, påverkar 
                  politiska beslut och styr informationsflöden i det tysta. Samtidigt blir dessa system allt 
                  mer slutna, svårgranskade och asymmetriskt kontrollerade av ett fåtal aktörer.
                </p>
                <p className="mb-3 text-sm text-[#888]">
                  I detta landskap är insyn inte längre en lyx — det är en demokratisk nödvändighet.
                </p>
                <p className="mb-3 text-sm">
                  <strong className="text-[#e7e7e7]">OpenSeek.AI är vår motrörelse.</strong>
                </p>
                <p className="text-sm text-[#888]">
                  Vi bygger en plattform där AI-driven analys blir tillgänglig, transparent och samhällsviktig. 
                  Genom att jämföra flera AI-modeller parallellt, visa hela analyskedjan öppet och skydda 
                  användarens anonymitet, skapar vi ett nytt paradigm: AI som granskar AI.
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Framtidens hot vi adresserar</h2>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3 mt-0.5">•</span>
                    <div className="text-[#888]">
                      <strong className="text-[#aaa]">Undermedveten påverkan:</strong> AI-svar kan vinklas 
                      för att förstärka narrativ, undvika kontroverser eller forma opinion — utan att användaren märker det.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3 mt-0.5">•</span>
                    <div className="text-[#888]">
                      <strong className="text-[#aaa]">Vridna svar för maktpåverkan:</strong> AI-modeller kan 
                      optimeras för att gynna vissa ideologier, företag eller stater.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3 mt-0.5">•</span>
                    <div className="text-[#888]">
                      <strong className="text-[#aaa]">IP-spårning och profilering:</strong> Många AI-plattformar 
                      loggar plats, beteende och identitet — vilket gör beslutsfattare, journalister och forskare 
                      sårbara för kartläggning.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#666] mr-3 mt-0.5">•</span>
                    <div className="text-[#888]">
                      <strong className="text-[#aaa]">Informationsasymmetri:</strong> Vanliga användare får 
                      svar — men aldrig insyn i hur de formades, vilka källor som användes eller vilka modeller 
                      som låg bakom.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Etisk arkitektur - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vårt svar: Etisk arkitektur från grunden</h2>
              <p className="mb-4 text-sm text-[#888]">
                OpenSeek.AI är byggt för att stå emot framtidens informationsrisker. Vi tillämpar:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] font-medium mb-3">Zero Tracking-standard</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Ingen IP-loggning</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Ingen fingerprinting</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Ingen dold analys av användarbeteende</span></li>
                  </ul>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] font-medium mb-3">Anonym nyckelbaserad inloggning</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Inga e-postadresser eller personuppgifter krävs</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Identiteten skapas lokalt via ett nyckelpar</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Återställning sker via seed phrase eller QR-kod</span></li>
                  </ul>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] font-medium mb-3">Bot-skydd utan övervakning</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Proof-of-Work eller privacy-respekterande CAPTCHA</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Skyddar plattformen utan att kompromissa med anonymitet</span></li>
                  </ul>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="text-[#e7e7e7] font-medium mb-3">Insynsprofiler utan identitet</div>
                  <ul className="space-y-1.5 text-xs text-[#888]">
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Användaren kan följa sin egen analysresa</span></li>
                    <li className="flex gap-2"><span className="text-[#666]">•</span><span>Allt kopplas till nyckel-ID — inte till person</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Plattformseffekten: Vi knyter ihop allt</h2>
                <p className="mb-4 text-sm text-[#888]">
                  I dagens AI-landskap tvingas användare hoppa mellan olika modeller, jämföra svar manuellt och 
                  försöka förstå vad som är sant, vinklat eller relevant. Det är tidskrävande, splittrat och 
                  ofta förvirrande.
                </p>
                <p className="mb-3 text-sm text-[#888]">
                  OpenSeek.AI ersätter detta med en samlad insynsplattform:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Vi samlar svar från flera AI-modeller samtidigt</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Vi visar skillnader, bias och källor</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Vi analyserar och syntetiserar — så att du slipper göra det själv</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> Vi sparar tid, minskar kognitiv belastning och ger dig en tydlig överblick</div>
                </div>
                <p className="mt-4 text-sm">
                  <strong className="text-[#e7e7e7]">Resultatet:</strong> <span className="text-[#888]">Du får inte bara ett svar — du får en 
                  karta över AI-landskapet.</span>
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknologi för transparens</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Vi använder flera av världens mest avancerade språkmodeller parallellt — inklusive GPT-4, 
                  Claude, Gemini och fler. Genom att jämföra deras svar, analysera skillnader och visa hela 
                  analyskedjan öppet, bygger vi en balanserad, källkritisk och tillförlitlig analys.
                </p>
              </div>
            </div>

            {/* OQT and role sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Kommande: OQT-1.0 – vår egen språkmodell</h2>
                <p className="mb-3 text-sm text-[#888]">
                  OQT-1.0 (Open Quality Transformer) är OpenSeek.AI:s egen språkmodell under utveckling — en 
                  banbrytande satsning på medveten, transparent och samhällsviktig AI.
                </p>
                <p className="mb-3 text-sm text-[#888]">
                  Den tränas på miljontals AI-genererade svar från över 20 av världens största modeller, och 
                  är designad för att:
                </p>
                <div className="space-y-2 text-xs mb-3">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> syntetisera konsensus</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> avslöja bias</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> ge etiskt balanserade insikter</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> agera som en otryckbar insynsmotor i en snabbt föränderlig värld</div>
                </div>
                <p className="text-sm text-[#888]">
                  OQT-1.0 är inte bara en modell — det är en meta-intelligens som förstår hur andra AI-system tänker.
                </p>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Vår roll i samhället</h2>
                <p className="mb-3 text-sm text-[#888]">
                  OpenSeek.AI är inte ett företag som säljer svar.
                </p>
                <p className="mb-3 text-sm text-[#888]">
                  Vi är en plattform för digitalt självförsvar, demokratisk insyn och teknisk folkbildning.
                </p>
                <p className="mb-3 text-sm text-[#888]">
                  Vi ger medborgare, forskare och beslutsfattare verktyg att förstå — inte bara konsumera — 
                  AI-genererad information.
                </p>
                <p className="text-sm">
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
