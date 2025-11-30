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

/**
 * Format AI response text for clean display in chat UI
 * Handles common issues like run-on text, missing line breaks, and source formatting
 */
export function formatAIResponse(rawText) {
  if (!rawText) return '';
  
  let text = rawText;
  
  // Remove unwanted markers like *Swedish* or *Svarar på svenska*
  text = text.replace(/\*Swedish\*/gi, '');
  text = text.replace(/\*Svarar på svenska\*/gi, '');
  text = text.replace(/\*svarar på svenska\*/gi, '');
  
  // Add line break before numbered lists (1. 2. 3. etc.)
  text = text.replace(/(\S)\s+(\d+\.)\s/g, '$1\n\n$2 ');
  
  // Add line break before bullet points
  text = text.replace(/(\S)\s+([-•])\s/g, '$1\n\n$2 ');
  
  // Add line break before "Källor:" section  
  text = text.replace(/(\S)\s*(Källor:|Källor\s*:)/gi, '$1\n\n---\n\n**Källor:**');
  text = text.replace(/\*\*Källor:\*\*/gi, '\n\n---\n\n**📚 Källor:**');
  
  // Format HTML <a> tags in sources to markdown-style for clean display
  text = text.replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '[$2]($1)');
  
  // Add line break before common section headers
  text = text.replace(/(\S)\s+(Sammanfattning:|Bakgrund:|Resultat:|Slutsats:)/gi, '$1\n\n**$2**');
  
  // Fix run-on sentences after periods followed by capital letters
  text = text.replace(/\.([A-ZÅÄÖ])/g, '.\n\n$1');
  
  // Add spacing around dashes used as separators
  text = text.replace(/(\S)\s*---\s*(\S)/g, '$1\n\n---\n\n$2');
  
  // Clean up excessive whitespace while preserving intentional breaks
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{4,}/g, '\n\n\n');
  
  // Trim whitespace
  text = text.trim();
  
  return text;
}

/**
 * Format sources section for clean HTML display
 * Creates styled HTML for source citations
 */
export function formatSourcesHTML(sources) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return '';
  }
  
  let html = '<hr style="border-color: #333; margin: 16px 0;">';
  html += '<div style="font-size: 0.85em; color: #888; margin-top: 12px;">';
  html += '<strong style="color: #aaa;">📚 Källor:</strong><br><br>';
  
  sources.forEach((source, idx) => {
    const name = source.name || source.title || `Källa ${idx + 1}`;
    const url = source.url || source.link || '#';
    html += `${idx + 1}. <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4a9eff; text-decoration: none;">${name}</a><br>`;
  });
  
  html += '</div>';
  return html;
}
