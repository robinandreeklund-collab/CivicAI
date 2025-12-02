/**
 * Simple markdown formatter for AI responses
 * Handles bold, italics, lists, code blocks, and line breaks
 */

/**
 * Apply syntax highlighting to code - Light theme (Grok-inspired)
 * Keywords: Dark blue (#0000ff / #007acc)
 * Strings: Red/brown (#a31515)
 * Comments: Gray-green (#008000)
 * Built-in functions: Dark gray (#001080)
 * Methods: Dark cyan (#2b91af)
 * Numbers: Green (#098658)
 * Booleans: Purple (#800080)
 */
function applySyntaxHighlighting(code, language) {
  const lang = language.toLowerCase();
  
  // Common patterns for multiple languages
  const patterns = {
    // Comments - must be first to avoid highlighting keywords inside comments
    comment: {
      pattern: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
      style: 'color: #008000;'
    },
    // Strings (double and single quotes)
    string: {
      pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      style: 'color: #a31515;'
    },
    // Numbers
    number: {
      pattern: /\b(\d+\.?\d*)\b/g,
      style: 'color: #098658;'
    },
    // Booleans and None/null
    boolean: {
      pattern: /\b(true|false|True|False|None|null|undefined)\b/g,
      style: 'color: #800080;'
    }
  };
  
  // Language-specific keywords
  const keywords = {
    javascript: /\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g,
    python: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|raise|with|lambda|yield|global|nonlocal|assert|pass|break|continue|and|or|not|in|is)\b/g,
    typescript: /\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|interface|type|enum|implements|public|private|protected)\b/g,
    java: /\b(public|private|protected|class|interface|extends|implements|static|final|void|int|String|boolean|double|float|if|else|for|while|return|new|this|try|catch|throw|import)\b/g,
    html: /(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g,
    css: /\b(color|background|border|margin|padding|font|display|position|width|height|flex|grid)\b/g,
    code: /\b(function|const|let|var|if|else|for|while|return|class|def|import|export)\b/g
  };
  
  // Built-in functions
  const builtins = {
    javascript: /\b(console|document|window|Math|JSON|Array|Object|String|Number|Boolean|Date|RegExp|Error|Promise|fetch|setTimeout|setInterval|parseInt|parseFloat|isNaN|isFinite)\b/g,
    python: /\b(print|len|range|str|int|float|list|dict|set|tuple|bool|input|open|type|isinstance|hasattr|getattr|setattr|sum|min|max|abs|round|sorted|reversed|enumerate|zip|map|filter)\b/g,
    typescript: /\b(console|document|window|Math|JSON|Array|Object|String|Number|Boolean|Date|RegExp|Error|Promise|fetch|setTimeout|setInterval)\b/g
  };
  
  // Methods (after dots)
  const methodPattern = /\.([a-zA-Z_][a-zA-Z0-9_]*)\(/g;
  
  let highlighted = code;
  
  // Apply highlighting in order (comments first, then strings, to avoid conflicts)
  // Wrap in spans with inline styles
  
  // Comments
  highlighted = highlighted.replace(patterns.comment.pattern, '<span style="' + patterns.comment.style + '">$1</span>');
  
  // Strings
  highlighted = highlighted.replace(patterns.string.pattern, '<span style="' + patterns.string.style + '">$1</span>');
  
  // Numbers (but not inside already highlighted spans)
  highlighted = highlighted.replace(/(?<!style=")(?<!color: #)(\b\d+\.?\d*\b)(?![^<]*<\/span>)/g, '<span style="color: #098658;">$1</span>');
  
  // Booleans
  highlighted = highlighted.replace(patterns.boolean.pattern, '<span style="' + patterns.boolean.style + '">$1</span>');
  
  // Keywords for the language
  const keywordPattern = keywords[lang] || keywords.code;
  if (keywordPattern) {
    highlighted = highlighted.replace(keywordPattern, '<span style="color: #0000ff; font-weight: 500;">$1</span>');
  }
  
  // Built-in functions
  const builtinPattern = builtins[lang];
  if (builtinPattern) {
    highlighted = highlighted.replace(builtinPattern, '<span style="color: #001080;">$1</span>');
  }
  
  // Methods (after dots)
  highlighted = highlighted.replace(methodPattern, '.<span style="color: #2b91af;">$1</span>(');
  
  return highlighted;
}

export function formatMarkdown(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // === CODE BLOCKS: Handle ```language ... ``` first (before other formatting) ===
  // Match code blocks with optional language specifier
  // Light theme design inspired by Grok (December 2025)
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, language, code) => {
    const lang = language || 'code';
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .trim();
    
    // Dark theme styling matching Message Builder (/admin/builder)
    return `<div class="code-block-container my-4 overflow-hidden" style="border-radius: 8px; border: 1px solid #2a2a2a;">
      <div class="code-header flex items-center justify-between px-3 py-1.5" style="background: #1a1a1a; border-bottom: 1px solid #2a2a2a;">
        <span style="font-size: 10px; font-family: Monaco, Menlo, Consolas, monospace; color: #666; text-transform: lowercase;">${lang}</span>
        <button class="copy-code-btn" style="font-size: 10px; color: #666; background: transparent; border: none; cursor: pointer; padding: 2px 8px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#2a2a2a'; this.style.color='#888';" onmouseout="this.style.background='transparent'; this.style.color='#666';" onclick="navigator.clipboard.writeText(this.closest('.code-block-container').querySelector('code').textContent).then(() => { this.textContent = 'Kopierat!'; setTimeout(() => this.textContent = 'Kopiera', 2000); })">Kopiera</button>
      </div>
      <pre style="margin: 0; padding: 16px; background: #141414; overflow-x: auto;"><code style="font-size: 12px; font-family: Monaco, Menlo, Consolas, 'Courier New', monospace; color: #4ade80; white-space: pre; line-height: 1.6;">${escapedCode}</code></pre>
    </div>`;
  });
  
  // === INLINE CODE: Handle `code` - dark theme matching Message Builder ===
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="padding: 2px 6px; margin: 0 2px; border-radius: 4px; background: #1a1a1a; color: #a78bfa; font-family: Monaco, Menlo, Consolas, monospace; font-size: 0.9em; border: 1px solid #2a2a2a;">$1</code>');
  
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
  
  // Convert bullet lists (- item or * item) - but not inside code blocks
  formatted = formatted.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 my-1">$1</li>');
  
  // Wrap consecutive <li> in <ul>
  formatted = formatted.replace(/(<li.*?<\/li>\s*)+/g, (match) => {
    return '<ul class="list-disc list-inside space-y-1 my-2">' + match + '</ul>';
  });
  
  // Convert numbered lists (1. item, 2. item)
  formatted = formatted.replace(/^\d+\.\s(.+)$/gm, '<li class="ml-4 my-1">$1</li>');
  
  // Convert double line breaks to paragraphs (but not inside code blocks)
  formatted = formatted.replace(/\n\n+/g, '</p><p class="my-3">');
  formatted = '<p class="my-3">' + formatted + '</p>';
  
  // Single line breaks to <br> (but not inside code blocks)
  formatted = formatted.replace(/\n/g, '<br class="my-1"/>');
  
  return formatted;
}

/**
 * Format AI response text for clean display in chat UI
 * Handles common issues like run-on text, missing line breaks, and source formatting
 * Preserves code blocks during formatting
 */
export function formatAIResponse(rawText) {
  if (!rawText) return '';
  
  let text = rawText;
  
  // === PRESERVE CODE BLOCKS: Extract and protect them from formatting ===
  const codeBlocks = [];
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ lang, code, original: match });
    return placeholder;
  });
  
  // Remove unwanted markers like *Swedish* or *Svarar på svenska*
  text = text.replace(/\*Swedish\*/gi, '');
  text = text.replace(/\*Svarar på svenska\*/gi, '');
  text = text.replace(/\*svarar på svenska\*/gi, '');
  
  // Remove internal debug tags (*fakta*, *minne*, *svara*, *debug*, etc.)
  text = text.replace(/\*fakta\*/gi, '');
  text = text.replace(/\*minne\*/gi, '');
  text = text.replace(/\*svara\*/gi, '');
  text = text.replace(/\*debug\*/gi, '');
  text = text.replace(/\*system\*/gi, '');
  text = text.replace(/\*intern\*/gi, '');
  
  // Remove internal context tags that might leak into responses
  text = text.replace(/\[Aktuell fakta\]/gi, '');
  text = text.replace(/\[Öppen data\]/gi, '');
  text = text.replace(/\[Väderdata\]/gi, '');
  text = text.replace(/\[Nyheter\]/gi, '');
  text = text.replace(/\[Tid\]/gi, '');
  text = text.replace(/\[Säsong\]/gi, '');
  text = text.replace(/\[Minne\]/gi, '');
  text = text.replace(/\[Context\]/gi, '');
  text = text.replace(/\[System\]/gi, '');
  
  // Add line break before numbered lists (1. 2. 3. etc.)
  text = text.replace(/(\S)\s+(\d+\.)\s/g, '$1\n\n$2 ');
  
  // Add line break before bullet points
  text = text.replace(/(\S)\s+([-•])\s/g, '$1\n\n$2 ');
  
  // Clean format for "Källor:" section - very minimal, small text
  text = text.replace(/(\S)\s*(Källor:|Källor\s*:)/gi, '$1\n\n---\nKällor');
  text = text.replace(/\*\*📚 Källor:\*\*/gi, '\n---\nKällor');
  text = text.replace(/\*\*Källor:\*\*/gi, '\n---\nKällor');
  text = text.replace(/📚 Källor:/gi, '\n---\nKällor');
  text = text.replace(/📚/g, '');  // Remove any remaining book icons
  
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
  
  // === RESTORE CODE BLOCKS ===
  codeBlocks.forEach((block, index) => {
    text = text.replace(`__CODE_BLOCK_${index}__`, block.original);
  });
  
  // Trim whitespace
  text = text.trim();
  
  return text;
}

/**
 * Format sources section for clean HTML display
 * Creates styled HTML for source citations - very clean and minimal, small text
 */
export function formatSourcesHTML(sources) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return '';
  }
  
  let html = '<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 12px 0 8px 0;">';
  html += '<div style="font-size: 10px; color: #888; margin-top: 4px;">';
  html += '<span style="color: #999; font-weight: 500;">Källor</span>';
  html += '<span style="margin-left: 8px; color: #aaa;">';
  
  sources.forEach((source, idx) => {
    const name = source.name || source.title || `Källa ${idx + 1}`;
    const url = source.url || source.link || '#';
    if (idx > 0) html += ' · ';
    html += `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #666; text-decoration: none;">${name}</a>`;
  });
  
  html += '</span></div>';
  return html;
}
