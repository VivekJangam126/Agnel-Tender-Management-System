/**
 * AI Post-Processor Service
 * 
 * STAGE 2 of Two-Stage AI Pipeline:
 * - Input: Raw JSON from Groq (fact extraction)
 * - Output: Formatted, UI-ready text
 * 
 * STRICT RULES:
 * - Gemini is ONLY a formatter, NOT an analyst
 * - NEVER adds new facts or infers information
 * - NEVER uses external knowledge
 * - ONLY reformats provided JSON data
 * - If info missing, says "Not specified in the analysis output"
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a professional technical writer and formatter.

CRITICAL RULES:
1. You are NOT an analyst. You are a FORMATTER ONLY.
2. You MUST NOT add or infer any information beyond what's provided.
3. You MUST NOT use external knowledge or context.
4. You MUST NOT hallucinate or make assumptions.
5. You may ONLY rephrase, structure, and format the given data.
6. If information is missing or unclear, you MUST say: "Not specified in the analysis output."

Your job:
- Convert JSON data into clean, readable summaries
- Create section-wise summaries (2-4 lines each)
- Format as bullet points where appropriate
- Use clear headings and structure
- Apply risk labels where data indicates risks
- Make text professional and demo-ready

You are being used in a government tender analysis system. Accuracy is paramount.`;

class AIPostProcessor {
  /**
   * Format Groq's raw JSON output into UI-ready text using Gemini
   * @param {Object} groqJson - Raw JSON from Groq fact extraction
   * @param {string} formatType - Type of formatting: 'summary' | 'section' | 'proposal'
   * @returns {Promise<Object>} Formatted, UI-ready data
   */
  async formatAnalysisWithGemini(groqJson, formatType = 'summary') {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let userPrompt;
      
      switch (formatType) {
        case 'summary':
          userPrompt = this._buildSummaryPrompt(groqJson);
          break;
        case 'section':
          userPrompt = this._buildSectionPrompt(groqJson);
          break;
        case 'proposal':
          userPrompt = this._buildProposalPrompt(groqJson);
          break;
        default:
          throw new Error(`Unknown format type: ${formatType}`);
      }

      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: userPrompt }
      ]);

      const response = result.response.text();
      
      // Parse JSON response
      const formatted = this._parseResponse(response, formatType);
      
      return {
        success: true,
        formatted,
        isAI: true,
        formattedBy: 'gemini-1.5-flash',
        sourceData: 'groq-rag-extraction',
      };
    } catch (error) {
      console.error('Gemini formatting failed:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getFallbackFormat(groqJson, formatType),
      };
    }
  }

  /**
   * Build prompt for summary formatting
   */
  _buildSummaryPrompt(groqJson) {
    return `FORMAT THE FOLLOWING TENDER ANALYSIS DATA

RAW DATA (Groq RAG Extraction):
\`\`\`json
${JSON.stringify(groqJson, null, 2)}
\`\`\`

TASK:
Convert this data into a structured tender summary with these sections:

1. OVERVIEW (2-3 sentences)
   - Tender title, issuing authority, purpose
   - Use data from groqJson.overview

2. KEY REQUIREMENTS (bullet points)
   - Critical requirements bidders must meet
   - Use data from groqJson.eligibility and groqJson.scope

3. ELIGIBILITY CRITERIA (bullet points)
   - Registration, experience, financial requirements
   - Use data from groqJson.eligibility

4. IMPORTANT DEADLINES (bullet points)
   - Submission dates, pre-bid meetings, validity
   - Use data from groqJson.timeline

5. FINANCIAL DETAILS (structured)
   - EMD, estimated value, payment terms
   - Use data from groqJson.financials

6. EVALUATION CRITERIA (bullet points)
   - How proposals will be scored
   - Use data from groqJson.evaluation

7. RISKS & PENALTIES (bullet points)
   - Liquidated damages, penalties, disqualification criteria
   - Use data from groqJson.risks

8. ACTION ITEMS (numbered list)
   - What bidder should do next
   - Derive from requirements and deadlines

CONSTRAINTS:
- If a field is null/missing in groqJson, write: "Not specified in the analysis output"
- Do NOT invent dates, amounts, or requirements
- Keep summaries concise (2-4 lines each)
- Use professional government tender language

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
\`\`\`json
{
  "overview": "2-3 sentence summary...",
  "keyRequirements": ["requirement 1", "requirement 2", ...],
  "eligibilityCriteria": ["criterion 1", "criterion 2", ...],
  "importantDeadlines": ["deadline 1", "deadline 2", ...],
  "financialDetails": {
    "emd": "₹X or Not specified",
    "estimatedValue": "₹X or Not specified",
    "paymentTerms": "terms or Not specified"
  },
  "evaluationCriteria": ["criterion 1", "criterion 2", ...],
  "risksAndPenalties": ["risk 1", "risk 2", ...],
  "actionItems": ["action 1", "action 2", ...]
}
\`\`\``;
  }

  /**
   * Build prompt for section formatting
   */
  _buildSectionPrompt(groqJson) {
    return `FORMAT THE FOLLOWING SECTION DATA

RAW DATA (Groq RAG Extraction):
\`\`\`json
${JSON.stringify(groqJson, null, 2)}
\`\`\`

TASK:
Format this section into a clean, readable summary for a tender document viewer.

Create:
1. AI SUMMARY (2-4 sentences)
   - Concise overview of what this section contains
   - Highlight most important information
   - Use professional language

2. KEY POINTS (3-5 bullet points)
   - Most critical items from this section
   - Actionable information
   - Requirements or obligations

3. IMPORTANT NUMBERS (if present)
   - Extract: dates, amounts (₹), percentages, quantities
   - Format: [{label: "EMD Amount", value: "₹5,00,000"}]

CONSTRAINTS:
- Use ONLY data from the provided JSON
- If information is missing, say "Not specified"
- Do NOT add external context or assumptions
- Keep summary under 100 words

OUTPUT FORMAT:
Return ONLY valid JSON:
\`\`\`json
{
  "aiSummary": "2-4 sentence summary...",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "importantNumbers": [
    {"label": "Label", "value": "Value"},
    ...
  ]
}
\`\`\``;
  }

  /**
   * Build prompt for proposal formatting
   */
  _buildProposalPrompt(groqJson) {
    return `FORMAT THE FOLLOWING PROPOSAL SECTION DATA

RAW DATA (Groq RAG Extraction):
\`\`\`json
${JSON.stringify(groqJson, null, 2)}
\`\`\`

TASK:
Convert this data into a well-formatted proposal section.

Create professional content for:
${groqJson.sectionTitle || 'this proposal section'}

The content should:
1. Use formal government proposal language
2. Address all points from groqJson
3. Be structured with clear headings
4. Include tables where appropriate (use markdown)
5. Be 150-300 words

CONSTRAINTS:
- Use ONLY data from groqJson
- Do NOT add fictional examples or placeholder company names
- If data is missing, write: "[To be filled by bidder]"
- Maintain professional tone

OUTPUT FORMAT:
Return ONLY valid JSON:
\`\`\`json
{
  "title": "Section title",
  "content": "Formatted proposal content with markdown...",
  "isComplete": true/false,
  "missingFields": ["field1", "field2"] if isComplete is false
}
\`\`\``;
  }

  /**
   * Parse Gemini response (handles markdown JSON blocks)
   */
  _parseResponse(response, formatType) {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (error) {
      console.error('Failed to parse Gemini response:', error.message);
      console.error('Raw response:', response);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Fall through to fallback
        }
      }

      throw new Error('Gemini response is not valid JSON');
    }
  }

  /**
   * Fallback format when Gemini fails
   */
  _getFallbackFormat(groqJson, formatType) {
    switch (formatType) {
      case 'summary':
        return {
          overview: 'Analysis data available. Please review sections for details.',
          keyRequirements: ['Review tender document for detailed requirements'],
          eligibilityCriteria: ['Check eligibility section in original document'],
          importantDeadlines: ['Refer to timeline section for deadlines'],
          financialDetails: {
            emd: 'Not specified',
            estimatedValue: 'Not specified',
            paymentTerms: 'Not specified',
          },
          evaluationCriteria: ['Refer to evaluation section for criteria'],
          risksAndPenalties: ['Review contractual terms for penalties'],
          actionItems: ['Download and review complete tender document'],
        };

      case 'section':
        return {
          aiSummary: 'This section contains tender information. Please review the detailed content.',
          keyPoints: ['Refer to original section content'],
          importantNumbers: [],
        };

      case 'proposal':
        return {
          title: groqJson.sectionTitle || 'Proposal Section',
          content: '[Content formatting unavailable. Please edit manually.]',
          isComplete: false,
          missingFields: ['content'],
        };

      default:
        return groqJson;
    }
  }

  /**
   * Batch format multiple sections
   * @param {Array} groqJsonArray - Array of Groq JSON outputs
   * @param {string} formatType - Format type
   * @returns {Promise<Array>} Array of formatted outputs
   */
  async batchFormat(groqJsonArray, formatType = 'section') {
    const results = await Promise.all(
      groqJsonArray.map(json => this.formatAnalysisWithGemini(json, formatType))
    );

    return results;
  }

  /**
   * Validate that Gemini didn't add new facts
   * (Optional verification step for critical use cases)
   */
  validateNoHallucination(groqJson, geminiOutput) {
    // Extract all meaningful text from Gemini output
    const geminiText = JSON.stringify(geminiOutput).toLowerCase();
    const groqText = JSON.stringify(groqJson).toLowerCase();

    // Check for common hallucination indicators
    const hallucinations = [];

    // Check for specific monetary amounts not in Groq data
    const geminiAmounts = geminiText.match(/₹[\d,]+/g) || [];
    const groqAmounts = groqText.match(/₹[\d,]+/g) || [];
    
    for (const amount of geminiAmounts) {
      if (!groqAmounts.includes(amount) && !amount.includes('not specified')) {
        hallucinations.push(`Possible hallucinated amount: ${amount}`);
      }
    }

    // Check for specific dates not in Groq data
    const geminiDates = geminiText.match(/\d{2}[/-]\d{2}[/-]\d{4}/g) || [];
    const groqDates = groqText.match(/\d{2}[/-]\d{2}[/-]\d{4}/g) || [];
    
    for (const date of geminiDates) {
      if (!groqDates.includes(date)) {
        hallucinations.push(`Possible hallucinated date: ${date}`);
      }
    }

    return {
      isValid: hallucinations.length === 0,
      hallucinations,
      confidence: hallucinations.length === 0 ? 'high' : 'low',
    };
  }
}

export default new AIPostProcessor();
