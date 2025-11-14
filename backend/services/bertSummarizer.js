/**
 * BERT Summarizer Service Wrapper
 * Node.js wrapper to call Python BERT Extractive Summarizer service
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Call Python BERT Extractive Summarizer to generate neutral summary
 * @param {Array<string>} responses - Array of response texts
 * @param {string} question - The original question
 * @param {number} minLength - Minimum summary length
 * @param {number} maxLength - Maximum summary length
 * @returns {Promise<Object>} Summary result
 */
export async function generateBERTSummary(responses, question, minLength = 100, maxLength = 500) {
  return new Promise((resolve, reject) => {
    const pythonScript = join(__dirname, '..', 'python_services', 'bert_summarizer.py');
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [pythonScript]);
    
    let outputData = '';
    let errorData = '';
    
    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[BERT Summarizer] Python process error:', errorData);
        resolve({
          success: false,
          error: `Python process exited with code ${code}: ${errorData}`,
          fallback: true
        });
        return;
      }
      
      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (e) {
        console.error('[BERT Summarizer] Failed to parse JSON output:', e.message);
        resolve({
          success: false,
          error: `Failed to parse Python output: ${e.message}`,
          fallback: true
        });
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('[BERT Summarizer] Failed to start Python process:', error.message);
      resolve({
        success: false,
        error: `Failed to start Python process: ${error.message}`,
        fallback: true
      });
    });
    
    // Send input data to Python process via stdin
    const inputData = JSON.stringify({
      responses,
      question,
      min_length: minLength,
      max_length: maxLength
    });
    
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
    
    // Set timeout (30 seconds)
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        success: false,
        error: 'Python process timeout',
        fallback: true
      });
    }, 30000);
  });
}
