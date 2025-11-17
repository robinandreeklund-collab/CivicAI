/**
 * FooterDemo1 Component
 * Classic row layout with gap and hover text animation
 * Minimal grayscale footer with system fonts
 */
export default function FooterDemo1() {
  const links = [
    { text: 'Om oss', href: '#' },
    { text: 'Policy', href: '#' },
    { text: 'Zero Tracking Standard', href: '#' },
    { text: 'Kontakta oss', href: '#' },
    { text: 'Pipeline', href: '#' },
    { text: 'Funktioner', href: '#' },
  ];

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-[#151515] py-8">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-[#666] text-sm transition-all duration-200 hover:text-[#e7e7e7] hover:tracking-wide"
            >
              {link.text}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
