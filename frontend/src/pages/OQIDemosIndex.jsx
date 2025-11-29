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

  // OQI Demo 10 variants with enhanced features
  const demo10Variants = [
    {
      id: 'v1',
      title: 'Enhanced Grok Timeline',
      description: 'Full Grok-style vertical timelines on both sides, character personas, live response time',
      features: ['Grok-style timeline', 'DNA Chain ledger', 'Character personas', 'Live timer'],
    },
    {
      id: 'v2',
      title: 'Minimalist Edge',
      description: 'Ultra-thin edge timelines, character pills, animated number counter',
      features: ['Edge timelines', 'Character pills', 'Number flip animation', 'Compact design'],
    },
    {
      id: 'v3',
      title: 'Symmetric DNA',
      description: 'Mirrored timelines with character wheel, pulsing response timer',
      features: ['Symmetric layout', 'Character wheel', 'Timer pulse', 'DNA helix effect'],
    },
    {
      id: 'v4',
      title: 'Curved Timelines',
      description: 'Arc-shaped timelines, floating character badges, streaming time display',
      features: ['Arc timelines', 'Floating badges', 'Stream timer', 'Dynamic spacing'],
    },
    {
      id: 'v5',
      title: 'Integrated Edges',
      description: 'Seamless edge integration, inline character selector, comprehensive metrics',
      features: ['Edge integration', 'Inline selector', 'Live counter', 'Full metrics bar'],
    },
  ];

  // NEW: Refined variants with horizontal DNA chain, classic chat layout, and organic timeline
  const demo10RefinedVariants = [
    {
      id: 'v6',
      title: 'Refined Cinema',
      description: 'Horizontal DNA chain in header, classic chat layout, expandable sidebar with tools',
      features: ['Horizontal DNA chain', 'Chat bubbles', 'Organic timeline', 'Ghost sidebar'],
    },
    {
      id: 'v7',
      title: 'Elegant Monochrome',
      description: 'Flowing DNA, whisper-light UI, organic rhythm timeline, ultra-minimal aesthetic',
      features: ['Flowing DNA', 'Whisper UI', 'Natural rhythm', 'Fade-in send'],
    },
    {
      id: 'v8',
      title: 'Pure Essence',
      description: 'Centered DNA chain, asymmetric bubbles, whisper-thin timeline, ghost sidebar',
      features: ['Centered DNA', 'Asymmetric chat', 'Thin timeline', 'Ghost expand'],
    },
    {
      id: 'v9',
      title: 'Zen Flow',
      description: 'Breath-like animations, natural spacing, extremely minimal elements',
      features: ['Breath animation', 'Natural gaps', 'Zen aesthetic', 'Floating sidebar'],
    },
    {
      id: 'v10',
      title: 'Ultimate Refinement',
      description: 'The most polished version combining all requested features in perfect harmony',
      features: ['All features', 'Premium feel', 'Perfect balance', 'Production ready'],
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

        {/* Demo 10 Enhanced Variants Section */}
        <div className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-2">
              ★ Design 10 Variants – Enhanced Immersive Cinema
            </h2>
            <p className="text-sm text-[#888]">
              5 variants of the Immersive Cinema design with Grok-style timelines, character personas, DNA Chain ledger, and live response metrics.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demo10Variants.map((variant) => (
              <Link
                key={variant.id}
                to={`/oqi-demo-10-${variant.id}`}
                className="block bg-[#0d0d0d] border border-[#6D28D9]/30 rounded-xl p-5 hover:border-[#6D28D9]/60 hover:bg-[#111111] transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] font-mono text-[#6D28D9] uppercase tracking-wider">
                    Variant {variant.id.toUpperCase()}
                  </div>
                  <span className="text-[#666] group-hover:text-[#6D28D9] transition-colors">
                    →
                  </span>
                </div>
                <h3 className="text-lg font-light text-[#e7e7e7] mb-2 group-hover:text-[#fff] transition-colors">
                  {variant.title}
                </h3>
                <p className="text-xs text-[#888] mb-3">
                  {variant.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {variant.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="text-[9px] px-2 py-0.5 bg-[#6D28D9]/10 text-[#6D28D9]/70 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* NEW: Refined Variants Section */}
        <div className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-2">
              ★★ Design 10 – Refined Variants (NEW)
            </h2>
            <p className="text-sm text-[#888]">
              5 new refined variants with horizontal DNA chain in header, classic chat layout, organic timeline rhythm, and ghost sidebar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demo10RefinedVariants.map((variant) => (
              <Link
                key={variant.id}
                to={`/oqi-demo-10-${variant.id}`}
                className="block bg-[#0d0d0d] border border-[#059669]/30 rounded-xl p-5 hover:border-[#059669]/60 hover:bg-[#111111] transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] font-mono text-[#059669] uppercase tracking-wider">
                    Variant {variant.id.toUpperCase()}
                  </div>
                  <span className="text-[#666] group-hover:text-[#059669] transition-colors">
                    →
                  </span>
                </div>
                <h3 className="text-lg font-light text-[#e7e7e7] mb-2 group-hover:text-[#fff] transition-colors">
                  {variant.title}
                </h3>
                <p className="text-xs text-[#888] mb-3">
                  {variant.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {variant.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="text-[9px] px-2 py-0.5 bg-[#059669]/10 text-[#059669]/70 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Original Demo Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-light text-[#888] mb-4">Original Design Proposals</h2>
        </div>
        
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
