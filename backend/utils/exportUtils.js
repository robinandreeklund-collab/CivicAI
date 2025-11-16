/**
 * Export Utilities
 * Provides export functionality for PDF and README formats
 */

import PDFDocument from 'pdfkit';
import MarkdownIt from 'markdown-it';
import yaml from 'js-yaml';


/**
 * Generate README content from conversation data
 * @param {object} data - Conversation data with question and responses
 * @returns {string} README markdown content
 */
export function generateReadme(data) {
  const { question, responses, synthesizedSummary, synthesizedSummaryMetadata, timestamp } = data;
  
  let readme = `# OneSeek.AI Jämförelse\n\n`;
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
    
    // Add pipeline analysis summary if available
    if (resp.pipelineAnalysis) {
      readme += `**Pipeline-analys:**\n`;
      
      if (resp.pipelineAnalysis.summary) {
        readme += `- ${resp.pipelineAnalysis.summary.text}\n`;
      }
      
      if (resp.pipelineAnalysis.insights) {
        const insights = resp.pipelineAnalysis.insights;
        
        if (insights.qualityIndicators) {
          readme += `- **Kvalitet:** Objektivitet ${Math.round(insights.qualityIndicators.objectivity * 100)}%, `;
          readme += `Klarhet ${Math.round(insights.qualityIndicators.clarity * 100)}%\n`;
        }
        
        if (insights.riskFlags) {
          const risks = [];
          if (insights.riskFlags.highBias) risks.push('hög bias');
          if (insights.riskFlags.highSubjectivity) risks.push('hög subjektivitet');
          if (insights.riskFlags.hasAggression) risks.push('aggression');
          if (insights.riskFlags.manyUnverifiedClaims) risks.push('många overifierade påståenden');
          
          if (risks.length > 0) {
            readme += `- **Riskflaggor:** ${risks.join(', ')}\n`;
          }
        }
      }
      
      readme += `\n`;
    }
    
    readme += `---\n\n`;
  });
  
  // Add synthesized summary if available
  if (synthesizedSummary) {
    const summaryTitle = synthesizedSummaryMetadata?.usedBERT 
      ? 'Syntetiserad sammanfattning (BERT)' 
      : 'Syntetiserad sammanfattning';
    readme += `## ${summaryTitle}\n\n`;
    
    if (synthesizedSummaryMetadata?.usedBERT) {
      readme += `> **Texten nedan är genererad med BERT** - en AI-modell för extraktiv sammanfattning som väljer ut de viktigaste meningarna från alla AI-svar.\n\n`;
    }
    
    readme += `${synthesizedSummary}\n\n`;
    readme += `---\n\n`;
  }
  
  // Add footer
  readme += `\n*Genererad av [OneSeek.AI](https://github.com/robinandreeklund-collab/CivicAI) - Beslut med insyn. AI med ansvar.*\n`;
  
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
      const { question, responses, synthesizedSummary, synthesizedSummaryMetadata, timestamp } = data;
      
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('OneSeek.AI Jämförelse', { align: 'center' });
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
        
        const summaryTitle = synthesizedSummaryMetadata?.usedBERT 
          ? 'Syntetiserad sammanfattning (BERT)' 
          : 'Syntetiserad sammanfattning';
        doc.fontSize(16).font('Helvetica-Bold').text(summaryTitle);
        doc.moveDown(0.5);
        
        if (synthesizedSummaryMetadata?.usedBERT) {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor('#059669').text(
            'Texten nedan är genererad med BERT - en AI-modell för extraktiv sammanfattning som väljer ut de viktigaste meningarna från alla AI-svar.',
            { align: 'justify' }
          );
          doc.fillColor('#000000');
          doc.moveDown(0.5);
        }
        
        doc.fontSize(11).font('Helvetica').text(synthesizedSummary, { align: 'justify' });
        doc.moveDown(2);
      }
      
      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').text(
        'Genererad av OneSeek.AI - Beslut med insyn. AI med ansvar.',
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
    synthesizedSummaryMetadata: data.synthesizedSummaryMetadata,
    metadata: {
      exported_at: new Date().toISOString(),
      version: '0.1.0',
      tool: 'OneSeek.AI',
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
    synthesizedSummaryMetadata: data.synthesizedSummaryMetadata,
    metadata: {
      exported_at: new Date().toISOString(),
      version: '0.1.0',
      tool: 'OneSeek.AI',
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}
