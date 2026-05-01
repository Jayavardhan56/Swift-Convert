import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Converts a Word document to PDF using LibreOffice headless mode.
 * Preserves layout, fonts, and complex scripts (Telugu/Hindi).
 */
import { existsSync } from 'fs';

export async function convertDocxToPdf(inputPath: string, outputDir: string): Promise<string> {
  const filename = path.basename(inputPath, path.extname(inputPath)) + '.pdf';
  const outputPath = path.join(outputDir, filename);
  
  // PowerShell script with proper Unicode support and COM safety
  const psScript = `
    $ErrorActionPreference = 'Stop'
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    try {
      $doc = $word.Documents.Open("${inputPath}")
      $doc.SaveAs("${outputPath}", 17)
      $doc.Close()
    } finally {
      $word.Quit()
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
  `;
  
  // Base64 encode the script to avoid character encoding issues with Telugu/Hindi filenames
  const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');
  const command = `powershell -EncodedCommand ${encodedScript}`;
  
  try {
    await execAsync(command);
    return outputPath;
  } catch (error: any) {
    throw new Error(`Word Automation failed: ${error.message}`);
  }
}

/**
 * Converts a PDF to Word using the Python pdf2docx bridge.
 */
export async function convertPdfToDocx(inputPath: string, outputPath: string): Promise<void> {
  const pythonPath = 'python'; // Assumes python is in PATH
  const scriptPath = path.join(process.cwd(), 'convert_pdf_to_word.py');
  
  const command = `${pythonPath} "${scriptPath}" "${inputPath}" "${outputPath}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) console.warn('Python Warning:', stderr);
    console.log('Python Output:', stdout);
  } catch (error: any) {
    throw new Error(`Python conversion failed: ${error.message}`);
  }
}
