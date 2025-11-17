/**
 * FooterDemo4 Component
 * Floating sticky footer with blur and centered layout
 * Minimal grayscale footer with system fonts
 */
export default function FooterDemo4() {
  const links = [
    { text: 'Om oss', href: '#' },
    { text: 'Policy', href: '#' },
    { text: 'Zero Tracking Standard', href: '#' },
    { text: 'Kontakta oss', href: '#' },
    { text: 'Pipeline', href: '#' },
    { text: 'Funktioner', href: '#' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
      <div className="max-w-[1100px] mx-auto px-4 pb-4">
        <div className="bg-[#151515]/80 backdrop-blur-md border border-[#2a2a2a] rounded-xl py-4 px-6">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-[#666] text-xs transition-all duration-200 hover:text-[#e7e7e7] hover:scale-105"
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
