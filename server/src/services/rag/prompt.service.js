/**
 * RAG Prompt Builder Service
 * Creates structured prompts for different analysis types
 */

/**
 * Build prompt for tender overview analysis
 */
export function buildTenderOverviewPrompt(context) {
  const sessionContext = formatChunks(context.session_chunks);
  const globalContext = formatChunks(context.global_chunks);

  return `You are a tender analysis expert. Analyze the following tender document and provide a structured overview.

TENDER DOCUMENT CONTEXT:
${sessionContext}

REFERENCE TENDERS (for comparison):
${globalContext}

Based ONLY on the tender document context above, provide a JSON response with:

{
  "estimatedValue": "Extract estimated value or budget (e.g., ₹5.2Cr) or 'Not specified'",
  "totalSections": <number of distinct sections identified>,
  "mandatorySections": <number of mandatory sections>,
  "readTime": <estimated read time in minutes>,
  "competition": "Low/Medium/High based on complexity and requirements",
  "keyDeadlines": ["deadline 1", "deadline 2"],
  "eligibilitySummary": "Brief summary of eligibility requirements"
}

IMPORTANT:
- Base your analysis ONLY on the provided context
- If information is not in the context, use "Not specified"
- Do not hallucinate or invent information
- Return ONLY valid JSON, no additional text`;
}

/**
 * Build prompt for section-wise summary
 */
export function buildSectionSummaryPrompt(retrievalResult, sectionName) {
  const sessionContext = formatChunks(retrievalResult.session_chunks);
  const globalContext = formatChunks(retrievalResult.global_chunks);

  return `You are analyzing the "${sectionName}" section of a tender document.

TENDER SECTION CONTENT:
${sessionContext}

REFERENCE SECTIONS FROM OTHER TENDERS:
${globalContext}

Provide a JSON response with:

{
  "summary": "Concise 2-3 sentence summary of this section",
  "isMandatory": true/false,
  "riskLevel": "Low/Medium/High",
  "keyRequirements": ["requirement 1", "requirement 2", "requirement 3"],
  "concerns": ["concern 1", "concern 2"] or []
}

IMPORTANT:
- Base analysis ONLY on provided context
- If section appears mandatory, set isMandatory to true
- Assess risk based on complexity, penalties, and strictness
- Return ONLY valid JSON`;
}

/**
 * Build prompt for AI insights (comparative analysis)
 */
export function buildInsightsPrompt(context) {
  const sessionContext = formatChunks(context.session_chunks);
  const globalContext = formatChunks(context.global_chunks);

  return `You are a tender risk analyst comparing this tender against standard industry practices.

THIS TENDER:
${sessionContext}

REFERENCE TENDERS (industry standard):
${globalContext}

Provide a comparative analysis in JSON format:

{
  "unusualClauses": [
    {
      "clause": "Brief description",
      "concern": "Why it's unusual or risky",
      "comparison": "How it differs from standard practice"
    }
  ],
  "highPenalties": [
    {
      "type": "Type of penalty (e.g., liquidated damages)",
      "details": "Specific details",
      "severity": "Low/Medium/High"
    }
  ],
  "missingClauses": [
    {
      "expectedClause": "What's typically included but missing",
      "impact": "Potential impact"
    }
  ],
  "overallRiskAssessment": "Low/Medium/High",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

IMPORTANT:
- Compare ONLY based on provided contexts
- Highlight genuine differences, not minor variations
- If no unusual clauses found, return empty arrays
- Return ONLY valid JSON`;
}

/**
 * Build prompt for conversational AI assistant
 */
export function buildConversationalPrompt(retrievalResult, question, conversationHistory) {
  const sessionContext = formatChunks(retrievalResult.session_chunks);
  const globalContext = formatChunks(retrievalResult.global_chunks);

  const history = conversationHistory
    .slice(-3) // Last 3 exchanges for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  return `You are an AI assistant helping a bidder understand this tender document.

TENDER DOCUMENT:
${sessionContext}

REFERENCE KNOWLEDGE:
${globalContext}

${history ? `CONVERSATION HISTORY:\n${history}\n\n` : ''}USER QUESTION: ${question}

Provide a clear, helpful answer based ONLY on the tender document content above.

RULES:
- Use information from "TENDER DOCUMENT" section as primary source
- Use "REFERENCE KNOWLEDGE" only for comparative context
- If the answer is not in the document, say: "This information is not specified in the tender document"
- Be concise but complete
- Use bullet points for lists
- Highlight critical information

Your answer:`;
}

/**
 * Format chunks for prompts
 */
function formatChunks(chunks) {
  if (!chunks || chunks.length === 0) {
    return 'No relevant content found.';
  }

  return chunks
    .map((chunk, i) => {
      const source = chunk.source || 'unknown';
      const page = chunk.page_no ? ` (Page ${chunk.page_no})` : '';
      return `[Chunk ${i + 1}] ${source}${page}:\n${chunk.text}`;
    })
    .join('\n\n---\n\n');
}
