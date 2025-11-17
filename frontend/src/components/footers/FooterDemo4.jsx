import { Link, useLocation } from 'react-router-dom';

/**
 * FooterDemo4 Component
 * Floating sticky footer with blur and centered layout
 * Minimal grayscale footer with system fonts
 */
export default function FooterDemo4() {
  const location = useLocation();
  
  const links = [
    { text: 'Start', to: '/' },
    { text: 'Om oss', to: '/about' },
    { text: 'Policy', to: '/policy' },
    { text: 'Zero Tracking Standard', to: '/zero-tracking' },
    { text: 'Kontakta oss', to: '/contact' },
    { text: 'Pipeline', to: '/pipeline' },
    { text: 'Funktioner', to: '/features' },
    { text: 'Språkmodell [OQT‑1.0]', to: '/sprakmodell' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
      <div className="max-w-[1100px] mx-auto px-4 pb-4">
        <div className="bg-[#151515]/80 backdrop-blur-md border border-[#2a2a2a] rounded-xl py-4 px-6">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {links.map((link, index) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={index}
                  to={link.to}
                  className={`text-xs transition-all duration-200 hover:scale-105 ${
                    isActive 
                      ? 'text-[#e7e7e7] font-medium hover:text-white' 
                      : 'text-[#666] hover:text-[#e7e7e7]'
                  }`}
                >
                  {link.text}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
