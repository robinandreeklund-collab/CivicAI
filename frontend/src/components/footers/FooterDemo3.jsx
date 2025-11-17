/**
 * FooterDemo3 Component
 * Grid layout with icons and small font
 * Minimal grayscale footer with system fonts
 */
export default function FooterDemo3() {
  const links = [
    { text: 'Om oss', href: '#', icon: '◉' },
    { text: 'Policy', href: '#', icon: '◉' },
    { text: 'Zero Tracking Standard', href: '#', icon: '◉' },
    { text: 'Kontakta oss', href: '#', icon: '◉' },
    { text: 'Pipeline', href: '#', icon: '◉' },
    { text: 'Funktioner', href: '#', icon: '◉' },
  ];

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-[#151515] py-8">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="flex items-center gap-2 text-[#666] text-xs transition-all duration-200 hover:text-[#e7e7e7] hover:gap-3 group"
            >
              <span className="text-[8px] transition-all duration-200 group-hover:scale-125">{link.icon}</span>
              <span>{link.text}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
