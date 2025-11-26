import { Link } from 'react-router-dom';

/**
 * OQI Demos Index Page
 * Lists all 10 OQI design proposals for easy navigation
 */
export default function OQIDemosIndex() {
  const demos = [
    {
      id: 1,
      title: 'Classic DNA Ring',
      description: 'Central DNA ring with pulsing animation, three-column layout with history, chat, and character card',
      features: ['360° DNA pulse ring', 'Live typing animation', 'Expandable character card', 'Thought particles'],
    },
    {
      id: 2,
      title: 'Horizontal Split',
      description: 'Wide history panel on left, prominent conversation flow with floating character card',
      features: ['Wide history timeline', 'Horizontal layout', 'Floating panels', 'Glow line effect'],
    },
    {
      id: 3,
      title: 'Full-Width Minimalist',
      description: 'Maximum whitespace, centered conversation focus, subtle breathing animations',
      features: ['Centered focus', 'Breathing UI', 'Concentric rings', 'Expandable metrics'],
    },
    {
      id: 4,
      title: 'Card-Based Modular',
      description: 'Clickable card panels with modular design, stacked information architecture',
      features: ['Modular cards', 'Expandable metrics', 'Grid layout', 'Card pulse animation'],
    },
    {
      id: 5,
      title: 'Vertical Stacked',
      description: 'Full-width sections stacked vertically, scrolling experience with section animations',
      features: ['Section-based scroll', 'DNA sidebar', 'Animated entry', 'Timeline visualization'],
    },
    {
      id: 6,
      title: 'Sidebar-Focused',
      description: 'Prominent collapsible left sidebar with navigation, clean main chat area',
      features: ['Collapsible sidebar', 'Section navigation', 'Particle effects', 'Mood indicator'],
    },
    {
      id: 7,
      title: 'Floating Panels',
      description: 'Glassmorphism aesthetic with layered depth, draggable-looking panels',
      features: ['Floating panels', 'Glassmorphism', 'Ambient glow', 'Panel stacking'],
    },
    {
      id: 8,
      title: 'Terminal Console',
      description: 'Monospace command-line aesthetic, raw data display with system logs',
      features: ['CRT scanline effect', 'Command history', 'System logs', 'Terminal cursor'],
    },
    {
      id: 9,
      title: 'Grid Dashboard',
      description: 'Bento box layout with data-dense metrics, grid-based organization',
      features: ['Bento grid', 'Trend indicators', 'Compact metrics', 'Processing wave'],
    },
    {
      id: 10,
      title: 'Immersive Cinema',
      description: 'Cinema-style presentation with dramatic animations, auto-hiding UI focus mode',
      features: ['Orbit particles', 'Focus mode (F)', 'Auto-hide UI', 'Cinematic transitions'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] font-sans">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
            <span>Tillbaka till startsidan</span>
          </Link>
          <h1 className="text-4xl font-light tracking-wide text-[#e7e7e7] mb-4">
            ONESEEK QUANTUM INTERFACE
          </h1>
          <p className="text-[#888] text-lg max-w-2xl">
            10 design proposals for the world&apos;s most advanced, minimalist, real-time AI consciousness dashboard.
          </p>
          <div className="flex gap-4 mt-6 text-xs text-[#666]">
            <span>Press Q for Quantum Mode</span>
            <span>•</span>
            <span>All animations working</span>
            <span>•</span>
            <span>Demo data included</span>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {demos.map((demo) => (
            <Link
              key={demo.id}
              to={`/oqi-demo-${demo.id}`}
              className="block bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#2a2a2a] hover:bg-[#111111] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Design {demo.id}
                </div>
                <span className="text-[#666] group-hover:text-[#e7e7e7] transition-colors">
                  →
                </span>
              </div>
              <h2 className="text-xl font-light text-[#e7e7e7] mb-2 group-hover:text-[#fff] transition-colors">
                {demo.title}
              </h2>
              <p className="text-sm text-[#888] mb-4">
                {demo.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {demo.features.map((feature, idx) => (
                  <span 
                    key={idx}
                    className="text-[10px] px-2 py-1 bg-[#1a1a1a] text-[#666] rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#1a1a1a] text-center text-xs text-[#666]">
          <p>
            All designs use consistent styling matching ApiDocumentationPage and LandingPage.
          </p>
          <p className="mt-2">
            Colors: Black (#000000), White (#FFFFFF), Dark Gray (#333333), Light Gray (#CCCCCC)
          </p>
          <p className="mt-2">
            Font: Inter (system) • Animations: CSS keyframes
          </p>
        </div>
      </div>
    </div>
  );
}
