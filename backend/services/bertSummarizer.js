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
 * Get Python executable path from environment variable or use default
 * @returns {string} Python executable path
 */
function getPythonPath() {
  // Use PYTHON_PATH environment variable if set, otherwise default to "python"
  return process.env.PYTHON_PATH || 'python';
}

/**
 * Spawn Python process using configured Python path
 * @param {string} pythonScript - Path to Python script
 * @returns {Object|null} Spawned process or null
 */
function spawnPython(pythonScript) {
  try {
    const pythonPath = getPythonPath();
    // Use shell: true for Windows compatibility to resolve commands from PATH
    const process = spawn(pythonPath, [pythonScript], { shell: true });
    return { process, command: pythonPath };
  } catch (error) {
    console.error(`[BERT Summarizer] Failed to spawn Python process: ${error.message}`);
    return null;
  }
}

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
    
    // Spawn Python process using configured Python path
    const spawnResult = spawnPython(pythonScript);
    
    if (!spawnResult) {
      console.error('[BERT Summarizer] Could not spawn Python process');
      resolve({
        success: false,
        error: 'Failed to spawn Python process',
        fallback: true
      });
      return;
    }
    
    const pythonProcess = spawnResult.process;
    console.log(`[BERT Summarizer] Using Python command: ${spawnResult.command}`);
    
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
