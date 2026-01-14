import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ChunkingService } from './chunking.service.js';
import { EmbeddingService } from './embedding.service.js';

const CHAT_MODEL = 'gpt-3.5-turbo';
const MAX_CONTEXT_CHUNKS = 5;

async function callChatCompletion(prompt) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a tender assistant. Use ONLY the provided context. If the answer is not in the context, say you do not know.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Fallback mock response for testing without API key
 */
function generateMockSuggestion(sectionType, userQuestion) {
  const mocksBySection = {
    ELIGIBILITY: [
      {
        observation: 'Missing specific qualification thresholds for bidders',
        suggestedText: 'Bidders must possess a valid registration certificate from relevant statutory authority and demonstrate minimum 3 years of experience in similar works.',
        reason: 'Government tenders require documented evidence of bidder capability and compliance history.'
      },
      {
        observation: 'Financial qualification criteria not clearly defined',
        suggestedText: 'Bidders must have an average annual turnover of minimum ₹5 crores during the last 3 financial years, supported by audited financial statements.',
        reason: 'Ensures bidder has sufficient financial capacity to execute the tender without default risk.'
      }
    ],
    TECHNICAL: [
      {
        observation: 'Technical specifications lack detail on performance standards',
        suggestedText: 'All deliverables must conform to relevant IS (Indian Standards) / ISO standards and undergo third-party quality testing before acceptance.',
        reason: 'Defines measurable quality criteria and enables transparent evaluation of technical compliance.'
      },
      {
        observation: 'Material/resource requirements not specified',
        suggestedText: 'Only materials with ISI/ISO certification are acceptable. Supplier details and certificates must be submitted with the bid for approval.',
        reason: 'Ensures consistency and quality throughout the project lifecycle.'
      }
    ],
    FINANCIAL: [
      {
        observation: 'EMD (Earnest Money Deposit) amount and release terms missing',
        suggestedText: 'EMD amount: 2% of tender value (without GST). EMD will be released within 30 days of contract completion, subject to satisfactory performance.',
        reason: 'EMD is a standard government mechanism to ensure bid seriousness and financial accountability.'
      },
      {
        observation: 'Payment milestone terms not defined',
        suggestedText: 'Payment will be released as follows: 30% on contract signing, 40% on delivery with acceptance certificate, 30% on final completion and sign-off.',
        reason: 'Links payments to deliverables, protecting government interest and ensuring project completion.'
      }
    ],
    EVALUATION: [
      {
        observation: 'Technical vs financial scoring weightage not transparent',
        suggestedText: 'Evaluation methodology: Technical bid (60%) + Financial bid (40%). Minimum 40% marks required in technical evaluation for financial bid to be opened.',
        reason: 'Transparency in evaluation criteria ensures fairness and defensibility of tender award decision.'
      },
      {
        observation: 'Selection criteria and pass/fail thresholds not defined',
        suggestedText: 'Selected bidder will be the one with highest combined score (Technical + Financial). In case of tie, the bidder with higher technical score will be preferred.',
        reason: 'Clear tiebreaker rules prevent disputes and ensure consistent application of evaluation logic.'
      }
    ],
    TERMS: [
      {
        observation: 'Performance guarantee/security period not specified',
        suggestedText: 'Contractor shall maintain defect liability for 12 months from the date of completion. A performance security of 5% of contract value will be held as guarantee.',
        reason: 'Protects government against performance failures and provides recourse for rectification.'
      },
      {
        observation: 'Dispute resolution mechanism not clearly defined',
        suggestedText: 'All disputes arising out of this contract shall first be addressed through mutual consultation. Unresolved disputes will be referred to arbitration under Arbitration and Conciliation Act, 1996.',
        reason: 'Provides clear escalation path for dispute resolution without litigation delays.'
      }
    ]
  };

  return mocksBySection[sectionType] || [
    {
      observation: 'Section content could be enhanced with more specific requirements',
      suggestedText: 'Ensure all criteria are measurable, time-bound, and include specific thresholds or standards relevant to government compliance.',
      reason: 'Clear and specific requirements reduce ambiguity and enable fair evaluation of bids.'
    }
  ];
}

export const AIService = {
  /**
   * Ingest tender content: chunk + embed + store in tender_content_chunk.
   * Runs in a single transaction when no external client is provided.
   */
  async ingestTender(tenderId, options = {}) {
    const { client: externalClient, skipTransaction = false } = options;
    const client = externalClient || (await pool.connect());
    const manageTx = !skipTransaction;

    try {
      if (manageTx) await client.query('BEGIN');

      const tenderRes = await client.query(
        `SELECT tender_id, title, description, status
         FROM tender
         WHERE tender_id = $1`,
        [tenderId]
      );

      if (tenderRes.rows.length === 0) {
        throw new Error('Tender not found');
      }

      const tender = tenderRes.rows[0];

      if (tender.status !== 'PUBLISHED') {
        throw new Error('Tender must be published before ingestion');
      }

      const sectionsRes = await client.query(
        `SELECT section_id, title, order_index, is_mandatory
         FROM tender_section
         WHERE tender_id = $1
         ORDER BY order_index ASC`,
        [tenderId]
      );

      const sections = sectionsRes.rows.map((row) => ({
        sectionId: row.section_id,
        title: row.title,
        content: row.content || '', // content column may not exist; fallback to empty
      }));

      const chunks = ChunkingService.chunkTender({
        tenderId,
        tenderTitle: tender.title,
        tenderDescription: tender.description || '',
        sections,
      });

      if (!chunks.length) {
        throw new Error('No tender content available for ingestion');
      }

      // Remove existing embeddings for this tender
      await client.query('DELETE FROM tender_content_chunk WHERE tender_id = $1', [tenderId]);

      // Insert new chunks with embeddings
      for (const chunk of chunks) {
        const embedding = await EmbeddingService.embed(chunk.content);
        await client.query(
          `INSERT INTO tender_content_chunk (tender_id, section_id, content, embedding)
           VALUES ($1, $2, $3, $4::vector)`,
          [tenderId, chunk.sectionId, chunk.content, embedding]
        );
      }

      if (manageTx) await client.query('COMMIT');
    } catch (err) {
      if (manageTx) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (!externalClient) {
        client.release();
      }
    }
  },

  /**
   * Answer a user question using RAG over tender content.
   */
  async queryTenderAI(tenderId, question) {
    if (!question || !question.trim()) {
      throw new Error('Question is required');
    }

    // Ensure tender exists and is published
    const tenderRes = await pool.query(
      'SELECT status FROM tender WHERE tender_id = $1',
      [tenderId]
    );

    if (tenderRes.rows.length === 0) {
      throw new Error('Tender not found');
    }

    if (tenderRes.rows[0].status !== 'PUBLISHED') {
      throw new Error('Tender must be published to query AI');
    }

    // Embed the question
    const questionEmbedding = await EmbeddingService.embed(question);

    // Vector similarity search for top chunks
    const contextRes = await pool.query(
      `SELECT content
       FROM tender_content_chunk
       WHERE tender_id = $1
       ORDER BY embedding <-> $2::vector
       LIMIT $3`,
      [tenderId, questionEmbedding, MAX_CONTEXT_CHUNKS]
    );

    const contexts = contextRes.rows.map((row) => row.content).filter(Boolean);

    if (!contexts.length) {
      return "I don't have enough information from the tender content to answer that.";
    }

    const prompt = `CONTEXT:\n${contexts.join('\n\n---\n\n')}\n\nUSER QUESTION:\n${question}`;

    const answer = await callChatCompletion(prompt);

    return answer || "I don't have enough information from the tender content to answer that.";
  },

  /**
   * Admin assistance: generate content using only tender metadata (no embeddings).
   */
  async generateTenderContent(tenderId, prompt) {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt is required');
    }

    // Fetch tender metadata
    const tenderRes = await pool.query(
      `SELECT tender_id, title, description, status
       FROM tender
       WHERE tender_id = $1`,
      [tenderId]
    );

    if (tenderRes.rows.length === 0) {
      throw new Error('Tender not found');
    }

    const tender = tenderRes.rows[0];

    // Sections metadata
    const sectionsRes = await pool.query(
      `SELECT title, is_mandatory, order_index
       FROM tender_section
       WHERE tender_id = $1
       ORDER BY order_index ASC`,
      [tenderId]
    );

    const sectionLines = sectionsRes.rows.map((s, idx) => {
      const flag = s.is_mandatory ? 'MANDATORY' : 'OPTIONAL';
      return `${idx + 1}. ${s.title} (${flag})`;
    });

    const context = [
      `Title: ${tender.title || ''}`,
      `Description: ${tender.description || ''}`,
      `Status: ${tender.status}`,
      'Sections:',
      sectionLines.length ? sectionLines.join('\n') : 'None',
    ].join('\n');

    const fullPrompt = `TENDER METADATA:\n${context}\n\nUSER REQUEST:\n${prompt}`;

    const response = await callChatCompletion(fullPrompt);

    return response || 'I cannot generate content without sufficient tender metadata.';
  },

  /**
   * AI Drafting Assistance: Review existing content and suggest improvements (no auto-apply)
   * Uses RAG to retrieve similar sections from published tenders as reference
   * @param {Object} options - Configuration
   * @param {string} options.mode - "section" or "tender"
   * @param {string} options.sectionType - Section key (for section mode)
   * @param {string} options.existingContent - Current content to review
   * @param {Object} options.tenderMetadata - Tender metadata (department, sector, etc.)
   * @param {string} options.userQuestion - User's question/request
   * @returns {Promise<Array>} - Array of suggestions with {observation, suggestedText, reason}
   */
  async assistTenderDrafting(options = {}) {
    const { mode, sectionType, existingContent, tenderMetadata = {}, userQuestion } = options;

    if (!userQuestion || !userQuestion.trim()) {
      throw new Error('User question is required');
    }

    // RAG: Retrieve similar published tender sections for reference
    let referenceContext = '';
    try {
      const referenceEmbedding = await EmbeddingService.embed(userQuestion);
      
      // Search for similar published sections
      const referenceRes = await pool.query(
        `SELECT ts.content, t.sector, t.tender_type
         FROM tender_content_chunk tcc
         JOIN tender_section ts ON tcc.section_id = ts.section_id
         JOIN tender t ON tcc.tender_id = t.tender_id
         WHERE t.status = 'PUBLISHED'
         ORDER BY tcc.embedding <-> $1::vector
         LIMIT 3`,
        [referenceEmbedding]
      );

      if (referenceRes.rows.length > 0) {
        referenceContext = '\n\nREFERENCE EXAMPLES from published tenders:\n';
        referenceRes.rows.forEach((row, idx) => {
          referenceContext += `\nExample ${idx + 1} (${row.tender_type || 'General'} - ${row.sector || 'N/A'}):\n${row.content?.substring(0, 300)}...\n`;
        });
      }
    } catch (err) {
      // If embedding fails, continue without RAG context
      console.warn('RAG embedding failed, proceeding without reference context:', err.message);
    }

    // Build section-specific guidance
    const getSectionGuidance = (sectionType) => {
      const guidance = {
        ELIGIBILITY: `
SECTION FOCUS: Eligibility Criteria
Key areas to review:
- Qualification thresholds (certifications, registrations, licenses)
- Experience requirements (years, similar work, proven track record)
- Financial capacity (turnover, credit rating, banking relationships)
- Organizational details (company structure, staff credentials)
- Compliance history (regulatory compliance, previous project performance)

CRITICAL RULES for this section:
- Suggest specific qualification benchmarks (not vague language)
- Include measurable criteria with numbers (years, rupees amounts, percentages)
- Reference relevant government/statutory bodies for validations
- Avoid creating new categories - only fill gaps
`,
        TECHNICAL: `
SECTION FOCUS: Technical Requirements/Specifications
Key areas to review:
- Performance specifications and standards (IS/ISO standards)
- Material and resource requirements
- Quality assurance and testing methodologies
- Delivery timelines and milestones
- Technical compliance and certifications

CRITICAL RULES for this section:
- Suggest specific technical standards (IS, ISO, BIS codes)
- Include measurable performance criteria with units
- Reference government technical guidelines where applicable
- Never rewrite existing specifications, only add missing ones
`,
        FINANCIAL: `
SECTION FOCUS: Financial Conditions
Key areas to review:
- EMD (Earnest Money Deposit) amount and terms
- Payment milestones and conditions
- Bill of Quantities (BOQ) structure
- Price adjustment clauses (if any)
- Financial penalties and liquidated damages

CRITICAL RULES for this section:
- Suggest EMD percentages aligned with government norms (typically 1-5%)
- Link payment releases to specific deliverables
- Use standard government formulations for financial clauses
- Include clear terms for GST applicability
`,
        EVALUATION: `
SECTION FOCUS: Evaluation Criteria
Key areas to review:
- Technical vs financial bid scoring weightage
- Pass/fail thresholds for technical evaluation
- Selection methodology and tiebreaker rules
- Scoring transparency and formula
- Committee composition (if applicable)

CRITICAL RULES for this section:
- Suggest transparent, objective evaluation criteria
- Include specific percentage/point allocations (e.g., 60% technical, 40% financial)
- Define minimum qualifying marks for technical bid
- Ensure consistency with government procurement guidelines
`,
        TERMS: `
SECTION FOCUS: Terms & Conditions / Legal Framework
Key areas to review:
- Defect liability period and performance guarantees
- Penalty clauses and dispute resolution mechanisms
- Force majeure and risk allocation
- Insurance and indemnity requirements
- Contract termination and exit clauses

CRITICAL RULES for this section:
- Suggest clauses aligned with Indian legal standards
- Include dispute resolution hierarchy (negotiation → arbitration)
- Reference relevant acts (Indian Contract Act, Arbitration Act)
- Ensure balanced risk allocation between parties
`
      };
      return guidance[sectionType] || '';
    };

    // Build the system prompt for government-friendly reviewing
    const systemPrompt = `You are a senior government tender drafting officer and compliance expert.

YOUR CORE RESPONSIBILITIES:
1. REVIEW existing tender section content
2. IDENTIFY gaps, missing clauses, or weak wording
3. SUGGEST INCREMENTAL improvements ONLY
4. NEVER rewrite entire sections
5. NEVER remove user-written content
6. NEVER add clauses that conflict with existing content
7. Make suggestions audit-friendly, defensible, and government-compliant

CRITICAL OUTPUT RULES:
- Provide DELTA-ONLY suggestions (small, insertable text blocks)
- Each suggestion should address ONE specific gap
- Suggestions should be concrete and measurable
- Keep suggested text brief (1-3 sentences maximum)
- Always explain WHY the suggestion matters for government compliance

For each suggestion, provide exactly:
- observation: What is missing or could be improved (specific, not vague)
- suggestedText: The exact text to ADD (not replace) - keep it concise
- reason: Why this is important for government compliance/clarity

OUTPUT FORMAT RULES:
- Provide 2-3 targeted suggestions ONLY if there are gaps
- Format each suggestion exactly as: SUGGESTION [number]: Observation: ... Text: ... Reason: ...
- If content is adequate, respond with: "No improvements needed for this request."
${getSectionGuidance(sectionType)}
`;

    const userPrompt = `MODE: ${mode === 'section' ? 'Reviewing a single section' : 'Reviewing entire tender'}
${sectionType ? `SECTION TYPE: ${sectionType}` : ''}

CURRENT CONTENT TO REVIEW:
${existingContent || '(empty)'}

USER QUESTION/REQUEST:
${userQuestion}
${referenceContext}

Provide 2-3 targeted suggestions ONLY if there are gaps. Format each suggestion as:
SUGGESTION [number]:
Observation: [what is missing]
Text: [exact text to add]
Reason: [why it matters]

If content is adequate, respond with: "No improvements needed for this request."`;

    try {
      const response = await callChatCompletion(systemPrompt + '\n\n' + userPrompt);

      // Parse AI response into structured suggestions
      const suggestions = parseAISuggestions(response);

      return suggestions;
    } catch (err) {
      // Fallback to mock suggestions if API fails
      console.warn('AI API failed, using mock suggestions:', err.message);
      const mockSuggestions = generateMockSuggestion(sectionType, userQuestion);
      return mockSuggestions;
    }
  },
};

/**
 * Parse AI response into structured suggestions
 * @param {string} response - Raw AI response
 * @returns {Array} - Structured suggestions
 */
function parseAISuggestions(response) {
  const suggestions = [];

  // Check if AI says no improvements needed
  if (response.toLowerCase().includes('no improvements needed')) {
    return [{
      observation: 'Content review complete',
      suggestedText: '',
      reason: 'Your content is well-structured and comprehensive.'
    }];
  }

  // Parse "SUGGESTION [n]:" blocks
  const suggestionBlocks = response.split(/SUGGESTION\s+\d+:/i).filter(Boolean);

  suggestionBlocks.forEach(block => {
    try {
      // Extract observation
      const obsMatch = block.match(/Observation:\s*(.+?)(?=Text:|Reason:|$)/is);
      const observation = obsMatch?.[1]?.trim() || '';

      // Extract suggested text
      const textMatch = block.match(/Text:\s*(.+?)(?=Reason:|$)/is);
      const suggestedText = textMatch?.[1]?.trim() || '';

      // Extract reason
      const reasonMatch = block.match(/Reason:\s*(.+?)$/is);
      const reason = reasonMatch?.[1]?.trim() || '';

      if (observation && suggestedText) {
        suggestions.push({
          observation,
          suggestedText,
          reason
        });
      }
    } catch (err) {
      console.warn('Failed to parse suggestion block:', err.message);
    }
  });

  return suggestions.length > 0 ? suggestions : [{
    observation: 'Analysis complete',
    suggestedText: '',
    reason: 'Consider reviewing the content for completeness.'
  }];
}

