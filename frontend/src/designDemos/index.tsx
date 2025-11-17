import { useState } from 'react';
import ChatViewConcept1 from './ChatViewConcept1';
import ChatViewConcept2 from './ChatViewConcept2';
import ChatViewConcept3 from './ChatViewConcept3';
import ChatViewConcept4 from './ChatViewConcept4';
import ChatViewConcept5 from './ChatViewConcept5';
import ChatViewConcept6 from './ChatViewConcept6';
import ChatViewConcept7 from './ChatViewConcept7';
import ChatViewConcept8 from './ChatViewConcept8';
import ChatViewConcept9 from './ChatViewConcept9';
import ChatViewConcept10 from './ChatViewConcept10';
import ChatViewConcept11 from './ChatViewConcept11';
import ChatViewConcept12 from './ChatViewConcept12';
import ChatViewConcept13 from './ChatViewConcept13';
import ChatViewConcept14 from './ChatViewConcept14';
import ChatViewConcept15 from './ChatViewConcept15';
import ChatViewConcept21 from './ChatViewConcept21';
import ChatViewConcept22 from './ChatViewConcept22';
import ChatViewConcept23 from './ChatViewConcept23';
import ChatViewConcept24 from './ChatViewConcept24';
import ChatViewConcept25 from './ChatViewConcept25';
import ChatViewConcept26 from './ChatViewConcept26';
import ChatViewConcept27 from './ChatViewConcept27';
import ChatViewConcept28 from './ChatViewConcept28';
import ChatViewConcept29 from './ChatViewConcept29';
import ChatViewConcept30 from './ChatViewConcept30';

/**
 * DemoIndex - Navigation component for all chat view design concepts
 * 
 * This component allows easy switching between all 20 design demos
 */

const concepts = [
  {
    id: 1,
    title: 'Minimalist Header with Floating Insight',
    description: 'Ultra-minimal header with draggable insight panel',
    component: ChatViewConcept1,
  },
  {
    id: 2,
    title: 'Timeline-Based History Sidebar',
    description: 'Vertical timeline with integrated agent controls',
    component: ChatViewConcept2,
  },
  {
    id: 3,
    title: 'Grid-Based Multi-Agent Dashboard',
    description: 'Dashboard with multiple view modes',
    component: ChatViewConcept3,
  },
  {
    id: 4,
    title: 'Contextual Sidebar with Sources',
    description: 'Dynamic sidebar adapting to context',
    component: ChatViewConcept4,
  },
  {
    id: 5,
    title: 'Floating Cards Interface',
    description: 'Card-based UI with glassmorphism',
    component: ChatViewConcept5,
  },
  {
    id: 6,
    title: 'Split-Screen Comparison',
    description: 'Compare AI model responses side-by-side',
    component: ChatViewConcept6,
  },
  {
    id: 7,
    title: 'Tabbed Interface with Timeline',
    description: 'Tab navigation with expandable timeline',
    component: ChatViewConcept7,
  },
  {
    id: 8,
    title: 'Bottom Drawer Navigation',
    description: 'Mobile-first with pull-up drawer',
    component: ChatViewConcept8,
  },
  {
    id: 9,
    title: 'Kanban-Style Workflow',
    description: 'Visual pipeline representation',
    component: ChatViewConcept9,
  },
  {
    id: 10,
    title: 'Radial Navigation',
    description: 'Futuristic circular menu system',
    component: ChatViewConcept10,
  },
  {
    id: 11,
    title: 'Enhanced Floating Cards with Model Synthesis',
    description: 'Rich data, particle effects, always-visible input',
    component: ChatViewConcept11,
  },
  {
    id: 12,
    title: 'Minimalist with Animated Insights',
    description: 'Smooth animations, pulsing metrics, micro-interactions',
    component: ChatViewConcept12,
  },
  {
    id: 13,
    title: 'Timeline with Rich Model Perspectives',
    description: 'Animated timeline, detailed model cards, full data',
    component: ChatViewConcept13,
  },
  {
    id: 14,
    title: 'Tabbed Interface with Smooth Transitions',
    description: 'Animated tabs, organized content, rich data',
    component: ChatViewConcept14,
  },
  {
    id: 15,
    title: 'Enhanced Glassmorphism Design',
    description: 'Ambient effects, model comparison, gradient accents',
    component: ChatViewConcept15,
  },
  {
    id: 21,
    title: 'Premium Minimalist Command Center',
    description: 'Ultra-clean interface with floating synthesis card',
    component: ChatViewConcept21,
  },
  {
    id: 22,
    title: 'Elegant Stacked Cards with Side Navigation',
    description: 'Card-based interface with vertical tab navigation',
    component: ChatViewConcept22,
  },
  {
    id: 23,
    title: 'Mobile-First Slide-Up Panel',
    description: 'Bottom drawer with swipe-up navigation',
    component: ChatViewConcept23,
  },
  {
    id: 24,
    title: 'Horizontal Timeline Flow',
    description: 'Horizontal scrolling timeline with card progression',
    component: ChatViewConcept24,
  },
  {
    id: 25,
    title: 'Grid Dashboard with Command Palette',
    description: 'Modular grid layout with quick actions (⌘K)',
    component: ChatViewConcept25,
  },
  {
    id: 26,
    title: 'Split-Screen Dual Model Comparison',
    description: 'Side-by-side model comparison with visual diff highlighting',
    component: ChatViewConcept26,
  },
  {
    id: 27,
    title: 'Horizontal Card Carousel',
    description: 'Swipeable horizontal timeline with stage navigation',
    component: ChatViewConcept27,
  },
  {
    id: 28,
    title: 'Compact Mobile with Floating Actions',
    description: 'Mobile-optimized with floating action button and bottom sheet',
    component: ChatViewConcept28,
  },
  {
    id: 29,
    title: 'Layered Cards with 3D Depth',
    description: 'Stacked perspective cards with expandable details',
    component: ChatViewConcept29,
  },
  {
    id: 30,
    title: 'Zen Minimal with Progressive Disclosure',
    description: 'Ultra-minimal, centered design with content reveal',
    component: ChatViewConcept30,
  },
];

export default function DemoIndex() {
  const [selectedConcept, setSelectedConcept] = useState(null);

  if (selectedConcept !== null) {
    const ConceptComponent = concepts[selectedConcept].component;
    return (
      <div className="h-screen flex flex-col bg-[#0a0a0a]">
        {/* Navigation Bar */}
        <div className="bg-[#151515] border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedConcept(null)}
              className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm text-[#e7e7e7] transition-colors"
            >
              ← Tillbaka till översikt
            </button>
            <div>
              <div className="text-sm text-[#e7e7e7] font-medium">
                Koncept {selectedConcept + 1}: {concepts[selectedConcept].title}
              </div>
              <div className="text-xs text-[#666]">
                {concepts[selectedConcept].description}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedConcept(Math.max(0, selectedConcept - 1))}
              disabled={selectedConcept === 0}
              className="p-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-[#e7e7e7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedConcept(Math.min(concepts.length - 1, selectedConcept + 1))}
              disabled={selectedConcept === concepts.length - 1}
              className="p-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-[#e7e7e7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Demo Component */}
        <div className="flex-1 overflow-hidden">
          <ConceptComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{
              background: 'linear-gradient(90deg, #666 0%, #f5f5f5 50%, #666 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            OneSeek.AI Design Concepts
          </h1>
          <p className="text-[#888] text-lg">
            25 innovativa chattgränssnitt med integrerad meny och insyn
          </p>
        </div>

        {/* Grid of Concepts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concepts.map((concept, idx) => (
            <button
              key={concept.id}
              onClick={() => setSelectedConcept(idx)}
              className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6 text-left hover:border-[#2a2a2a] hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {concept.id}
                </div>
                <svg 
                  className="w-5 h-5 text-[#666] group-hover:text-[#e7e7e7] transition-colors"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <h3 className="text-[#e7e7e7] font-medium mb-2 group-hover:text-white transition-colors">
                {concept.title}
              </h3>
              
              <p className="text-sm text-[#666] leading-relaxed">
                {concept.description}
              </p>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-[#151515] border border-[#1a1a1a] rounded-xl px-6 py-4">
            <p className="text-xs text-[#666] mb-2">
              Alla demos är interaktiva React-komponenter
            </p>
            <p className="text-xs text-[#888]">
              Klicka på ett koncept för att testa det
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
