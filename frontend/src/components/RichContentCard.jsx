/**
 * RichContentCard Component
 * Refined card design based on design improvement prototype
 * Maintains all functionality with improved visual aesthetics
 */
export default function RichContentCard({ 
  title,
  badge,
  content,
  metadata,
  actions
}) {
  return (
    <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-8 mb-5 hover:border-[#2a2a2a] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {badge && (
          <div className={`
            inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[20px] text-[10px] font-semibold uppercase tracking-wider border
            ${badge.primary 
              ? 'bg-[#2a2a2a] border-[#3a3a3a] text-[#e7e7e7]' 
              : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#e7e7e7]'
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
                className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md flex items-center justify-center text-sm text-[#888] hover:bg-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#e7e7e7] transition-all duration-200"
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
        <h3 className="text-[18px] font-medium text-[#e7e7e7] mb-5 tracking-[-0.2px]">
          {title}
        </h3>
      )}

      {/* Content */}
      <div className="text-[15px] leading-[1.7] text-[#c0c0c0] mb-6">
        {content}
      </div>

      {/* Metadata Grid */}
      {metadata && metadata.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-[#1a1a1a]">
          {metadata.map((meta, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="text-[10px] text-[#666] uppercase tracking-wide font-semibold">
                {meta.label}
              </div>
              <div className="text-[13px] text-[#c0c0c0] font-medium">
                {meta.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
