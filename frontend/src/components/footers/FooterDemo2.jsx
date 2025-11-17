/**
 * FooterDemo2 Component
 * Split-view 2 columns with underline on hover
 * Minimal grayscale footer with system fonts
 */
export default function FooterDemo2() {
  const leftLinks = [
    { text: 'Om oss', href: '#' },
    { text: 'Policy', href: '#' },
    { text: 'Zero Tracking Standard', href: '#' },
  ];

  const rightLinks = [
    { text: 'Kontakta oss', href: '#' },
    { text: 'Pipeline', href: '#' },
    { text: 'Funktioner', href: '#' },
  ];

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-[#151515] py-8">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          <div className="flex flex-col space-y-3">
            {leftLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-[#666] text-sm transition-all duration-200 hover:text-[#e7e7e7] w-fit relative group"
              >
                {link.text}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#e7e7e7] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>
          <div className="flex flex-col space-y-3">
            {rightLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-[#666] text-sm transition-all duration-200 hover:text-[#e7e7e7] w-fit relative group"
              >
                {link.text}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[#e7e7e7] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
