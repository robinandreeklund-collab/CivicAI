import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ContactPage Component - Kontakta oss
 * Kontaktinformation för feedback, support och samarbete
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left Side - Branding */}
          <div className="md:pr-10">
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              Kontakta oss
            </h1>
            <p className="text-lg text-[#888] mb-10 font-light leading-relaxed">
              Vi välkomnar feedback, frågor och förslag på samarbete.
            </p>
            <ul className="space-y-0">
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                ✉ Feedback & Frågor
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                🔧 Teknisk Support
              </li>
              <li className="py-4 border-b border-[#151515] text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                🤝 Samarbete
              </li>
              <li className="py-4 text-[#666] text-sm transition-colors duration-200 hover:text-[#e7e7e7]">
                📰 Media & Press
              </li>
            </ul>
          </div>

          {/* Right Side - Content */}
          <div className="md:pl-10 md:border-l border-[#151515]">
            <div className="space-y-6 text-[#888] leading-relaxed">
              <div>
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

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknisk Support</h2>
                <p className="mb-4">
                  Stöter du på tekniska problem eller har frågor om hur du använder plattformen?
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

              <div>
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Samarbete och Partnerskap</h2>
                <p className="mb-3">Är du intresserad av att samarbeta med OneSeek.AI? Vi är öppna för:</p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="text-[#666]">• Forskningssamarbeten kring transparent AI</div>
                  <div className="text-[#666]">• Integration med andra plattformar</div>
                  <div className="text-[#666]">• Utbildningsinitiativ kring AI och transparens</div>
                  <div className="text-[#666]">• Open source-bidrag och utveckling</div>
                </div>
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4">
                  <p className="text-[#e7e7e7]">
                    <strong>E-post:</strong>{' '}
                    <a href="mailto:partnership@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                      partnership@oneseek.ai
                    </a>
                  </p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-light text-[#e7e7e7] mb-3">Svarstid</h3>
                <p>
                  Vi strävar efter att svara på alla förfrågningar inom 48 timmar. För brådskande 
                  tekniska problem, ange &quot;URGENT&quot; i ämnesraden.
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
