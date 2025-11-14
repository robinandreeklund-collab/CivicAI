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
  icon,
  actions
}) {
  return (
    <div className="bg-gradient-to-br from-civic-dark-800 to-civic-dark-850 border border-civic-dark-700 rounded-xl p-9 mb-6 hover:border-civic-dark-600 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        {badge && (
          <div className={`
            inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider
            ${badge.primary 
              ? 'bg-gradient-to-r from-civic-dark-600 to-civic-dark-700 text-civic-gray-100' 
              : 'bg-civic-dark-750 text-civic-gray-300'
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
                className="w-8 h-8 bg-civic-dark-900 border border-civic-dark-700 rounded-md flex items-center justify-center text-sm text-civic-gray-400 hover:bg-civic-dark-750 hover:border-civic-dark-600 hover:text-civic-gray-300 transition-all"
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
        <h3 className="text-lg font-medium text-civic-gray-100 mb-4.5">
          {title}
        </h3>
      )}

      {/* Content */}
      <div className="text-[15px] leading-relaxed text-civic-gray-300 mb-5">
        {content}
      </div>

      {/* Metadata Grid */}
      {metadata && metadata.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 border-t border-civic-dark-700">
          {metadata.map((meta, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="text-[11px] text-civic-gray-600 uppercase tracking-wide">
                {meta.label}
              </div>
              <div className="text-[13px] text-civic-gray-300 font-medium">
                {meta.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
