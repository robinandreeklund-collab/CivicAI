/**
 * FooterDemo5 Component
 * Column layout with fade-border and centered alignment
 * Minimal grayscale footer with system fonts
 */
export default function FooterDemo5() {
  const links = [
    { text: 'Om oss', href: '#' },
    { text: 'Policy', href: '#' },
    { text: 'Zero Tracking Standard', href: '#' },
    { text: 'Kontakta oss', href: '#' },
    { text: 'Pipeline', href: '#' },
    { text: 'Funktioner', href: '#' },
  ];

  return (
    <footer className="w-full bg-[#0a0a0a] py-8 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent"></div>
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex flex-col items-center space-y-3">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-[#666] text-sm transition-all duration-300 hover:text-[#e7e7e7] hover:translate-x-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {link.text}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
