/**
 * FollowUpButtons Component
 * Displays interactive yes/no style buttons when AI asks a follow-up question
 * Used primarily for Socionomen case law follow-ups
 */
export default function FollowUpButtons({ options, onOptionSelected, disabled = false }) {
  if (!options || options.length === 0) {
    return null;
  }

  const handleClick = (option) => {
    if (disabled) return;
    onOptionSelected(option);
  };

  return (
    <div className="flex gap-3 mt-6 pt-6 border-t border-[#1a1a1a]">
      {options.map((option) => {
        // Style primary action (Yes) differently from decline (No)
        const isPrimary = option.action === 'search_prejudikat';
        
        return (
          <button
            key={option.id}
            onClick={() => handleClick(option)}
            disabled={disabled}
            className={`
              flex-1 px-6 py-3 rounded-[8px] font-medium text-[14px] 
              transition-all duration-200 
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isPrimary 
                ? 'bg-[#2a2a2a] border border-[#3a3a3a] text-[#e7e7e7] hover:bg-[#353535] hover:border-[#4a4a4a]' 
                : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#999] hover:bg-[#252525] hover:border-[#3a3a3a] hover:text-[#c0c0c0]'
              }
            `}
            title={`${option.label} - ${option.action}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
