/**
 * Export Utilities
 * Provides export functionality for PDF and README formats
 */

import PDFDocument from 'pdfkit';
import MarkdownIt from 'markdown-it';
import yaml from 'js-yaml';

const md = new MarkdownIt();

/**
 * Generate README content from conversation data
 * @param {object} data - Conversation data with question and responses
 * @returns {string} README markdown content
 */
export function generateReadme(data) {
  const { question, responses, synthesizedSummary, timestamp } = data;
  
  let readme = `# CivicAI Jämförelse\n\n`;
  readme += `**Genererad:** ${new Date(timestamp).toLocaleString('sv-SE')}\n\n`;
  readme += `## Fråga\n\n${question}\n\n`;
  readme += `---\n\n`;
  
  // Add individual AI responses
  readme += `## AI-svar\n\n`;
  
  responses.forEach((resp, idx) => {
    const agentName = {
      'gpt-3.5': 'GPT-3.5',
      'gemini': 'Gemini',
      'deepseek': 'DeepSeek',
    }[resp.agent] || resp.agent;
    
    readme += `### ${idx + 1}. ${agentName}\n\n`;
    readme += `${resp.response}\n\n`;
    
    // Add analysis if available
    if (resp.analysis) {
      readme += `**Analys:**\n`;
      
      if (resp.analysis.tone) {
        readme += `- **Ton:** ${resp.analysis.tone.primary} (${resp.analysis.tone.confidence}% säkerhet)\n`;
      }
      
      if (resp.analysis.bias && resp.analysis.bias.detected && resp.analysis.bias.types.length > 0) {
        readme += `- **Identifierad bias:** ${resp.analysis.bias.types.map(b => b.type).join(', ')}\n`;
      }
      
      if (resp.analysis.factCheck && resp.analysis.factCheck.claimsFound > 0) {
        readme += `- **Påståenden att verifiera:** ${resp.analysis.factCheck.claimsFound}\n`;
      }
      
      readme += `\n`;
    }
    
    readme += `---\n\n`;
  });
  
  // Add synthesized summary if available
  if (synthesizedSummary) {
    readme += `## Syntetiserad sammanfattning\n\n`;
    readme += `${synthesizedSummary}\n\n`;
    readme += `---\n\n`;
  }
  
  // Add footer
  readme += `\n*Genererad av [CivicAI](https://github.com/robinandreeklund-collab/CivicAI) - Beslut med insyn. AI med ansvar.*\n`;
  
  return readme;
}

/**
 * Generate PDF from conversation data
 * @param {object} data - Conversation data with question and responses
 * @returns {Promise<Buffer>} PDF buffer
 */
export function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const { question, responses, synthesizedSummary, timestamp } = data;
      
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('CivicAI Jämförelse', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Genererad: ${new Date(timestamp).toLocaleString('sv-SE')}`, { align: 'center' });
      doc.moveDown(2);
      
      // Question section
      doc.fontSize(16).font('Helvetica-Bold').text('Fråga');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(question, { align: 'justify' });
      doc.moveDown(2);
      
      // Responses section
      doc.fontSize(16).font('Helvetica-Bold').text('AI-svar');
      doc.moveDown(1);
      
      responses.forEach((resp, idx) => {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }
        
        const agentName = {
          'gpt-3.5': 'GPT-3.5',
          'gemini': 'Gemini',
          'deepseek': 'DeepSeek',
        }[resp.agent] || resp.agent;
        
        doc.fontSize(14).font('Helvetica-Bold').text(`${idx + 1}. ${agentName}`);
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(resp.response, { align: 'justify' });
        doc.moveDown(0.5);
        
        // Add analysis summary
        if (resp.analysis) {
          doc.fontSize(10).font('Helvetica-Bold').text('Analys:', { continued: true });
          doc.font('Helvetica').text(' ');
          
          if (resp.analysis.tone) {
            doc.fontSize(9).text(`• Ton: ${resp.analysis.tone.primary}`);
          }
          
          if (resp.analysis.bias && resp.analysis.bias.detected) {
            doc.fontSize(9).text(`• Bias identifierad: ${resp.analysis.bias.types.length} typer`);
          }
          
          if (resp.analysis.factCheck && resp.analysis.factCheck.claimsFound > 0) {
            doc.fontSize(9).text(`• Påståenden att verifiera: ${resp.analysis.factCheck.claimsFound}`);
          }
        }
        
        doc.moveDown(1.5);
      });
      
      // Synthesized summary
      if (synthesizedSummary) {
        if (doc.y > 600) {
          doc.addPage();
        }
        
        doc.fontSize(16).font('Helvetica-Bold').text('Syntetiserad sammanfattning');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(synthesizedSummary, { align: 'justify' });
        doc.moveDown(2);
      }
      
      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').text(
        'Genererad av CivicAI - Beslut med insyn. AI med ansvar.',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate YAML export (already exists in frontend, keeping for consistency)
 * @param {object} data - Conversation data
 * @returns {string} YAML content
 */
export function generateYAML(data) {
  const exportData = {
    question: data.question,
    timestamp: data.timestamp,
    responses: data.responses.map(({ agent, response, metadata, analysis }) => ({
      agent,
      model: metadata?.model || agent,
      response,
      timestamp: metadata?.timestamp || new Date().toISOString(),
      analysis,
    })),
    synthesizedSummary: data.synthesizedSummary,
    metadata: {
      exported_at: new Date().toISOString(),
      version: '0.1.0',
      tool: 'CivicAI',
    }
  };
  
  return yaml.dump(exportData, { indent: 2, lineWidth: -1 });
}

/**
 * Generate JSON export
 * @param {object} data - Conversation data
 * @returns {string} JSON content
 */
export function generateJSON(data) {
  const exportData = {
    question: data.question,
    timestamp: data.timestamp,
    responses: data.responses.map(({ agent, response, metadata, analysis }) => ({
      agent,
      model: metadata?.model || agent,
      response,
      timestamp: metadata?.timestamp || new Date().toISOString(),
      analysis,
    })),
    synthesizedSummary: data.synthesizedSummary,
    metadata: {
      exported_at: new Date().toISOString(),
      version: '0.1.0',
      tool: 'CivicAI',
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}
