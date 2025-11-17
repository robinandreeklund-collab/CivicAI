import { Link } from 'react-router-dom';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ContactPage Component - Kontakta oss
 * Kontaktinformation för feedback, support och samarbete
 */
export default function ContactPage() {
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
              Kontakta oss
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              Vi välkomnar feedback, frågor och förslag på samarbete.
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Main contact sections - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Feedback och Frågor</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Har du synpunkter på plattformen, upptäckt något som kan förbättras, eller har frågor 
                  om hur systemet fungerar? Vi vill gärna höra från dig.
                </p>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-[#e7e7e7]">E-post:</strong>{' '}
                    <a href="mailto:feedback@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                      feedback@oneseek.ai
                    </a>
                  </p>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Teknisk Support</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Stöter du på tekniska problem eller har frågor om hur du använder plattformen?
                </p>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-[#e7e7e7]">E-post:</strong>{' '}
                    <a href="mailto:support@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                      support@oneseek.ai
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Partnership - Full width */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
              <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Samarbete och Partnerskap</h2>
              <p className="mb-4 text-sm text-[#888]">Är du intresserad av att samarbeta med OneSeek.AI? Vi är öppna för:</p>
              <div className="grid md:grid-cols-4 gap-2 mb-4 text-xs">
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🔬 Forskningssamarbeten</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">🔌 Integration med plattformar</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">📚 Utbildningsinitiativ</div>
                <div className="bg-[#0a0a0a] rounded p-2 text-center text-[#888]">💻 Open source-bidrag</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-sm">
                  <strong className="text-[#e7e7e7]">E-post:</strong>{' '}
                  <a href="mailto:partnership@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                    partnership@oneseek.ai
                  </a>
                </p>
              </div>
            </div>

            {/* Response time and media - 2 column grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Svarstid</h2>
                <p className="mb-4 text-sm text-[#888]">
                  Vi strävar efter att svara på alla förfrågningar inom 48 timmar. För brådskande 
                  tekniska problem, ange &quot;URGENT&quot; i ämnesraden.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Feedback:</span> 1-2 arbetsdagar</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Support:</span> Samma dag för brådskande ärenden</div>
                  <div className="text-[#888]"><span className="text-[#666]">•</span> <span className="text-[#aaa] font-medium">Partnerskap:</span> 3-5 arbetsdagar</div>
                </div>
              </div>

              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">Media & Press</h2>
                <p className="mb-4 text-sm text-[#888]">
                  För pressförfrågningar, intervjuer eller mediasamarbeten, vänligen kontakta oss via:
                </p>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-[#e7e7e7]">E-post:</strong>{' '}
                    <a href="mailto:press@oneseek.ai" className="text-[#888] hover:text-[#e7e7e7] transition-colors duration-200">
                      press@oneseek.ai
                    </a>
                  </p>
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
