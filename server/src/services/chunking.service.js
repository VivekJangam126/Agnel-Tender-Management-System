const MIN_TOKENS = 300;
const MAX_TOKENS = 500;

function chunkTextByTokens(text, minTokens = MIN_TOKENS, maxTokens = MAX_TOKENS) {
  if (!text || !text.trim()) return [];

  const words = text.trim().split(/\s+/);
  const chunks = [];
  let buffer = [];

  for (const word of words) {
    buffer.push(word);
    if (buffer.length >= maxTokens) {
      chunks.push(buffer.join(' '));
      buffer = [];
    }
  }

  if (buffer.length) {
    // If the last chunk is very small and there is a previous chunk, merge it.
    if (buffer.length < minTokens && chunks.length) {
      const last = chunks.pop();
      chunks.push(`${last} ${buffer.join(' ')}`.trim());
    } else {
      chunks.push(buffer.join(' '));
    }
  }

  return chunks;
}

export const ChunkingService = {
  /**
   * Chunk tender content into 300-500 token segments.
   *
   * @param {Object} tenderData
   * @param {string} tenderData.tenderId
   * @param {string} tenderData.tenderTitle
   * @param {string} tenderData.tenderDescription
   * @param {Array<{sectionId:string, title:string, content?:string}>} tenderData.sections
   * @returns {Array<{tenderId:string, sectionId:string|null, content:string}>}
   */
  chunkTender(tenderData) {
    const { tenderId, tenderTitle = '', tenderDescription = '', sections = [] } = tenderData;

    const results = [];

    // Include the main tender overview as the first chunk source
    const overviewText = `${tenderTitle}\n\n${tenderDescription}`.trim();
    const overviewChunks = chunkTextByTokens(overviewText);
    overviewChunks.forEach((content) => {
      results.push({ tenderId, sectionId: null, content });
    });

    // Process each section: combine title + content, then chunk
    sections.forEach((section) => {
      const combined = `${section.title || ''}\n\n${section.content || ''}`.trim();
      const chunks = chunkTextByTokens(combined);
      chunks.forEach((content) => {
        results.push({ tenderId, sectionId: section.sectionId || null, content });
      });
    });

    return results;
  },
};
