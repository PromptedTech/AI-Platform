// Text extraction utilities for various file formats
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from a file based on its type
 * @param {File} file - The file to extract text from
 * @returns {Promise<string>} - The extracted text
 */
export async function extractTextFromFile(file) {
  const fileType = file.type || file.name.split('.').pop().toLowerCase();
  
  switch (fileType) {
    case 'application/pdf':
    case 'pdf':
      return await extractTextFromPDF(file);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
    case 'docx':
    case 'doc':
      return await extractTextFromDOCX(file);
    
    case 'text/plain':
    case 'txt':
      return await extractTextFromTXT(file);
    
    case 'text/markdown':
    case 'md':
      return await extractTextFromTXT(file);
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract text from TXT or MD file
 */
async function extractTextFromTXT(file) {
  const text = await file.text();
  return text;
}

/**
 * Get file type category
 */
export function getFileTypeCategory(file) {
  const fileType = file.type || file.name.split('.').pop().toLowerCase();
  
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('doc')) return 'docx';
  if (fileType.includes('text') || fileType === 'txt') return 'txt';
  if (fileType === 'md' || fileType === 'markdown') return 'markdown';
  
  return 'unknown';
}

