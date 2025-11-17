import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ContactPage Component - Kontakta oss
 * Kontaktinformation för feedback, support och samarbete
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[800px] w-full">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-6 text-[#e7e7e7]">
            Kontakta oss
          </h1>
          
          <div className="space-y-6 text-[#888] leading-relaxed">
            <p className="text-lg">
              Vi välkomnar feedback, frågor och förslag på samarbete. OneSeek.AI utvecklas kontinuerligt 
              och vi värdesätter input från användare och intressenter.
            </p>
            
            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Feedback och Frågor</h2>
              <p className="mb-4">
                Har du synpunkter på plattformen, upptäckt något som kan förbättras, eller har frågor 
                om hur systemet fungerar? Vi vill gärna höra från dig.
              </p>
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[#e7e7e7]">
                  <strong>E-post:</strong>{' '}
                  <a href="mailto:feedback@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                    feedback@oneseek.ai
                  </a>
                </p>
              </div>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknisk Support</h2>
              <p className="mb-4">
                Stöter du på tekniska problem eller har frågor om hur du använder plattformen? 
                Kontakta vår support.
              </p>
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[#e7e7e7]">
                  <strong>E-post:</strong>{' '}
                  <a href="mailto:support@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                    support@oneseek.ai
                  </a>
                </p>
              </div>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Samarbete och Partnerskap</h2>
              <p className="mb-4">
                Är du intresserad av att samarbeta med OneSeek.AI? Vi är öppna för diskussioner om:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Forskningssamarbeten kring transparent AI</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Integration med andra plattformar för samhällsanalys</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Utbildningsinitiativ kring AI och transparens</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#666] mr-3">•</span>
                  <span>Open source-bidrag och utveckling</span>
                </li>
              </ul>
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[#e7e7e7]">
                  <strong>E-post:</strong>{' '}
                  <a href="mailto:partnership@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                    partnership@oneseek.ai
                  </a>
                </p>
              </div>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Media och Press</h2>
              <p className="mb-4">
                För pressförfrågningar, intervjuer eller mediesamarbeten, kontakta oss på:
              </p>
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[#e7e7e7]">
                  <strong>E-post:</strong>{' '}
                  <a href="mailto:press@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                    press@oneseek.ai
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mt-8">
              <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Svarstid</h3>
              <p>
                Vi strävar efter att svara på alla förfrågningar inom 48 timmar. För brådskande 
                tekniska problem, ange &quot;URGENT&quot; i ämnesraden.
              </p>
            </div>

            <div className="border-l-2 border-[#2a2a2a] pl-6 py-4">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Community</h2>
              <p>
                Vi planerar att lansera community-forum och diskussionskanaler. Håll utkik för 
                uppdateringar om hur du kan engagera dig i OneSeek.AI-communityt.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
