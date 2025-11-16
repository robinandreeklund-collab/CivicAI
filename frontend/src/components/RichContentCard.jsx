/**
 * RichContentCard Component
 * Based on chat-timeline-concept-3
 * Card design for displaying analysis content with metadata
 */
export default function RichContentCard({ 
  title,
  badge,
  content,
  metadata,
  actions
}) {
  return (
    <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-9 mb-6 hover:border-[#2a2a2a] hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        {badge && (
          <div className={`
            inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider
            ${badge.primary 
              ? 'bg-[#2a2a2a] text-[#e7e7e7]' 
              : 'bg-[#1a1a1a] text-[#888]'
            }
          `}>
            {badge.icon && <span>{badge.icon}</span>}
            <span>{badge.text}</span>
          </div>
        )}

        {actions && (
          <div className="flex gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md flex items-center justify-center text-sm text-[#888] hover:bg-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#e7e7e7] transition-all"
                title={action.title}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-lg font-medium text-[#e7e7e7] mb-4.5">
          {title}
        </h3>
      )}

      {/* Content */}
      <div className="text-[15px] leading-relaxed text-[#c0c0c0] mb-5">
        {content}
      </div>

      {/* Metadata Grid */}
      {metadata && metadata.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 border-t border-[#1a1a1a]">
          {metadata.map((meta, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="text-[11px] text-[#666] uppercase tracking-wide">
                {meta.label}
              </div>
              <div className="text-[13px] text-[#888] font-medium">
                {meta.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
