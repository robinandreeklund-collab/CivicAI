/**
 * Simple markdown formatter for AI responses
 * Handles bold, italics, lists, and line breaks
 */
export function formatMarkdown(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  
  // Convert ### headers to h3
  formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>');
  
  // Convert ## headers to h2
  formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-white mt-5 mb-3">$1</h2>');
  
  // Convert # headers to h1
  formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>');
  
  // Convert bullet lists (- item or * item)
  formatted = formatted.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 my-1">$1</li>');
  
  // Wrap consecutive <li> in <ul>
  formatted = formatted.replace(/(<li.*?<\/li>\s*)+/g, (match) => {
    return '<ul class="list-disc list-inside space-y-1 my-2">' + match + '</ul>';
  });
  
  // Convert numbered lists (1. item, 2. item)
  formatted = formatted.replace(/^\d+\.\s(.+)$/gm, '<li class="ml-4 my-1">$1</li>');
  
  // Convert double line breaks to paragraphs
  formatted = formatted.replace(/\n\n+/g, '</p><p class="my-3">');
  formatted = '<p class="my-3">' + formatted + '</p>';
  
  // Single line breaks to <br>
  formatted = formatted.replace(/\n/g, '<br class="my-1"/>');
  
  return formatted;
}
