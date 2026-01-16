/**
 * Text Chunking Service
 * Splits long documents into manageable chunks for embedding
 */

/**
 * Chunk text into overlapping segments
 * @param {string} text - Full document text
 * @param {Object} options - Chunking options
 * @returns {Array} - Array of chunk objects
 */
export function chunkText(text, options = {}) {
  const {
    chunkSize = 800,
    chunkOverlap = 200,
  } = options;

  const chunks = [];
  const sentences = splitIntoSentences(text);
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    
    // If adding this sentence exceeds chunk size, save current chunk
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        start: i - Math.floor(currentChunk.length / 100),
        end: i,
      });
      
      // Create overlap by keeping last few sentences
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(chunkOverlap / 5));
      currentChunk = overlapWords.join(' ') + ' ';
      chunkIndex++;
    }
    
    currentChunk += sentence + ' ';
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      start: sentences.length - 10,
      end: sentences.length,
    });
  }

  console.log(`[Chunking] Created ${chunks.length} chunks from ${text.length} characters`);
  return chunks;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text) {
  // Simple sentence splitting (can be improved with NLP libraries)
  return text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Ignore very short fragments
}
