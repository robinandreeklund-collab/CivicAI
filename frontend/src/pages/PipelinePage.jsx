import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * PipelinePage Component - Pipeline
 * Visar hur data bearbetas steg för steg genom NLP-pipelinen
 */
export default function PipelinePage() {
  const steps = [
    { num: "01", title: "Frågeanalys", desc: "Din fråga analyseras för att identifiera nyckelämnen och kontext." },
    { num: "02", title: "Multi-AI Analys", desc: "Frågan skickas parallellt till flera AI-modeller (GPT-4, Claude, Gemini, m.fl.)." },
    { num: "03", title: "Faktakontroll", desc: "Påståenden verifieras mot externa källor via Tavily Search API." },
    { num: "04", title: "Bias-detektion", desc: "Svaren analyseras för eventuella bias och politiska vinklingar." },
    { num: "05", title: "Konsensusanalys", desc: "AI-modellerna jämförs för att identifiera gemensamma slutsatser." },
    { num: "06", title: "Presentation", desc: "Resultaten presenteras med fullständig transparens." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding */}
          <div className="md:pr-10">
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Pipeline
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              OneSeek.AI:s analyspipeline består av flera steg som tillsammans skapar en omfattande 
              och transparent analys.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                01 Frågeanalys
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                02 Multi-AI Analys
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                03 Faktakontroll
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                04 Bias-detektion
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                05 Konsensusanalys
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                06 Presentation
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-4 text-[#888] leading-relaxed">
              {steps.map((step) => (
                <div key={step.num} className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl font-light text-[#e7e7e7] min-w-[40px]">{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-light text-[#e7e7e7] mb-2">{step.title}</h3>
                      <p className="text-sm">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mt-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Kontinuerlig Förbättring</h3>
                <p>
                  Pipelinen utvecklas kontinuerligt med nya moduler och förbättrade analysmetoder. 
                  All utveckling sker öppet med fokus på användarnytta och transparens.
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
