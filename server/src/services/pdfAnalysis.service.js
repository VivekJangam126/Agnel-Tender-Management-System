/**
 * PDF Analysis Service
 * Comprehensive AI-powered analysis of uploaded tender PDFs
 * Provides: Summary, Proposal Draft, and Evaluation
 */
import { env } from '../config/env.js';
import { PDFParserService } from './pdfParser.service.js';
import { ChunkingService } from './chunking.service.js';

const GROQ_MODEL = env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Call GROQ Chat Completion API
 */
async function callGroq(systemPrompt, userPrompt, options = {}) {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || GROQ_MODEL,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GROQ API failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
function parseJSON(response) {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    return null;
  }
}

export const PDFAnalysisService = {
  /**
   * Analyze uploaded PDF and generate comprehensive analysis
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} Complete analysis with summary, proposal draft, evaluation
   */
  async analyzeUploadedPDF(pdfBuffer, filename) {
    // Step 1: Parse PDF
    const parsed = await PDFParserService.parsePDF(pdfBuffer, filename);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error,
        stage: 'parsing',
      };
    }

    // Step 2: Generate Summary
    let summary;
    try {
      summary = await this.generateSummary(parsed);
    } catch (err) {
      console.error('Summary generation failed:', err.message);
      summary = this._generateFallbackSummary(parsed);
    }

    // Step 3: Generate Proposal Draft
    let proposalDraft;
    try {
      proposalDraft = await this.generateProposalDraft(parsed, summary);
    } catch (err) {
      console.error('Proposal draft failed:', err.message);
      proposalDraft = this._generateFallbackProposalDraft(parsed);
    }

    return {
      success: true,
      analysisId: `analysis-${Date.now()}`,
      analyzedAt: new Date().toISOString(),

      // Original parsed data
      parsed: {
        filename: parsed.filename,
        title: parsed.title,
        metadata: parsed.metadata,
        stats: parsed.stats,
        sections: parsed.sections,
        pdfInfo: parsed.pdfInfo,
      },

      // AI-generated summary
      summary,

      // AI-generated proposal draft
      proposalDraft,
    };
  },

  /**
   * Generate comprehensive summary with bullet points
   */
  async generateSummary(parsed) {
    const systemPrompt = `You are an expert government tender analyst. Analyze the tender document and extract key information.

Your task is to:
1. Write a clear executive summary (4-6 sentences)
2. Extract bullet points for each category
3. Identify critical requirements, deadlines, and risks
4. Assess opportunity and provide actionable insights

IMPORTANT:
- Be specific - extract actual values (amounts, dates, percentages) where mentioned
- Focus on what bidders need to prepare their proposal
- Identify unusual or strict requirements
- Use clear, concise bullet points`;

    const contentForAnalysis = this._prepareContentForAnalysis(parsed);

    const userPrompt = `Analyze this government tender and provide a comprehensive summary:

TENDER DETAILS:
Title: ${parsed.title}
Authority: ${parsed.metadata?.authority || 'Not specified'}
Sector: ${parsed.metadata?.sector || 'Not specified'}
Estimated Value: ${parsed.metadata?.estimatedValue ? `₹${parsed.metadata.estimatedValue.toLocaleString()}` : 'Not specified'}
EMD: ${parsed.metadata?.emdAmount ? `₹${parsed.metadata.emdAmount.toLocaleString()}` : 'Not specified'}
Deadline: ${parsed.metadata?.deadline || 'Not specified'}
Reference: ${parsed.metadata?.referenceNumber || 'Not specified'}

TENDER CONTENT:
${contentForAnalysis}

Respond in this exact JSON format:
{
  "executiveSummary": "4-6 sentence overview of the tender scope, objectives, key deliverables, and requirements",
  "criticalRequirements": ["requirement 1", "requirement 2", "..."],
  "eligibilityCriteria": ["criteria 1", "criteria 2", "..."],
  "technicalSpecifications": ["spec 1", "spec 2", "..."],
  "financialTerms": ["EMD amount", "payment terms", "price structure", "..."],
  "complianceRequirements": ["compliance 1", "compliance 2", "..."],
  "deadlinesAndTimelines": ["deadline 1", "milestone 1", "..."],
  "documentsRequired": ["document 1", "document 2", "..."],
  "riskFactors": ["risk 1", "risk 2", "..."],
  "opportunityScore": 75,
  "opportunityAssessment": "Assessment of this opportunity for bidders",
  "actionItems": ["action 1", "action 2", "..."]
}`;

    const response = await callGroq(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 3000 });
    const summaryData = parseJSON(response);

    if (!summaryData) {
      throw new Error('Failed to parse summary response');
    }

    return {
      isAI: true,
      executiveSummary: summaryData.executiveSummary || '',
      bulletPoints: {
        criticalRequirements: summaryData.criticalRequirements || [],
        eligibilityCriteria: summaryData.eligibilityCriteria || [],
        technicalSpecifications: summaryData.technicalSpecifications || [],
        financialTerms: summaryData.financialTerms || [],
        complianceRequirements: summaryData.complianceRequirements || [],
        deadlinesAndTimelines: summaryData.deadlinesAndTimelines || [],
        documentsRequired: summaryData.documentsRequired || [],
        riskFactors: summaryData.riskFactors || [],
      },
      opportunityScore: summaryData.opportunityScore || 70,
      opportunityAssessment: summaryData.opportunityAssessment || '',
      actionItems: summaryData.actionItems || [],
      sectionSummaries: this._generateSectionSummaries(parsed.sections),
    };
  },

  /**
   * Generate proposal draft sections
   */
  async generateProposalDraft(parsed, summary) {
    const systemPrompt = `You are an expert proposal writer for government tenders. Generate a comprehensive proposal draft based on the tender requirements.

Your task is to:
1. Create draft content for each standard proposal section
2. Include placeholders where bidder-specific information is needed (use [BIDDER_NAME], [COMPANY_INFO], etc.)
3. Make the content professional, compliant, and aligned with government tender expectations
4. Include specific references to tender requirements where appropriate

IMPORTANT:
- Use formal, professional language suitable for government proposals
- Include compliance statements where applicable
- Be specific and detailed
- Mark areas needing bidder input with clear placeholders`;

    const contentForAnalysis = this._prepareContentForAnalysis(parsed);

    const userPrompt = `Generate a proposal draft for this tender:

TENDER TITLE: ${parsed.title}
TENDER SUMMARY: ${summary.executiveSummary}

KEY REQUIREMENTS:
${summary.bulletPoints.criticalRequirements.slice(0, 5).map(r => `- ${r}`).join('\n')}

ELIGIBILITY CRITERIA:
${summary.bulletPoints.eligibilityCriteria.slice(0, 5).map(e => `- ${e}`).join('\n')}

TENDER SECTIONS:
${parsed.sections.map(s => `- ${s.title} (${s.type})`).join('\n')}

Generate a proposal draft with the following sections in JSON format:
{
  "coverLetter": {
    "title": "Cover Letter",
    "content": "Professional cover letter text with [BIDDER_NAME] placeholder",
    "isEditable": true
  },
  "companyProfile": {
    "title": "Company Profile & Experience",
    "content": "Company profile section with placeholders for company details",
    "isEditable": true
  },
  "eligibilityCompliance": {
    "title": "Eligibility Compliance Statement",
    "content": "Statement addressing each eligibility criterion",
    "isEditable": true
  },
  "technicalApproach": {
    "title": "Technical Approach & Methodology",
    "content": "Detailed technical approach addressing tender requirements",
    "isEditable": true
  },
  "projectPlan": {
    "title": "Project Plan & Timeline",
    "content": "Implementation timeline and milestones",
    "isEditable": true
  },
  "teamComposition": {
    "title": "Team Composition & Resources",
    "content": "Key personnel and resource allocation",
    "isEditable": true
  },
  "financialProposal": {
    "title": "Financial Proposal",
    "content": "Pricing structure and payment terms compliance",
    "isEditable": true
  },
  "complianceMatrix": {
    "title": "Compliance Matrix",
    "content": "Point-by-point compliance with tender requirements",
    "isEditable": true
  }
}`;

    const response = await callGroq(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 4000 });
    const proposalData = parseJSON(response);

    if (!proposalData) {
      throw new Error('Failed to parse proposal draft response');
    }

    // Convert to array format for easier rendering
    const sections = Object.entries(proposalData).map(([key, value], index) => ({
      id: key,
      order: index + 1,
      title: value.title,
      content: value.content,
      isEditable: true,
      wordCount: value.content.split(/\s+/).filter(w => w).length,
    }));

    return {
      isAI: true,
      generatedAt: new Date().toISOString(),
      sections,
      totalSections: sections.length,
      totalWords: sections.reduce((sum, s) => sum + s.wordCount, 0),
      status: 'DRAFT',
    };
  },

  /**
   * Evaluate a proposal against tender requirements
   * @param {Object} proposal - The user's edited proposal
   * @param {Object} tenderAnalysis - Original tender analysis
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluateProposal(proposal, tenderAnalysis) {
    const systemPrompt = `You are a government tender evaluation expert. Evaluate the proposal against tender requirements.

Score each aspect from 0-100 and provide specific feedback:
- Compliance: Does the proposal meet all mandatory requirements?
- Technical: Is the technical approach sound and well-detailed?
- Financial: Is the pricing competitive and clearly structured?
- Presentation: Is the proposal well-organized and professional?
- Completeness: Are all required sections and documents addressed?

Be constructive but honest. Identify specific gaps and provide actionable improvements.`;

    const proposalContent = proposal.sections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');

    const userPrompt = `Evaluate this proposal against the tender requirements:

TENDER: ${tenderAnalysis.parsed.title}

KEY TENDER REQUIREMENTS:
${tenderAnalysis.summary.bulletPoints.criticalRequirements.slice(0, 8).map(r => `- ${r}`).join('\n')}

ELIGIBILITY CRITERIA:
${tenderAnalysis.summary.bulletPoints.eligibilityCriteria.slice(0, 5).map(e => `- ${e}`).join('\n')}

PROPOSAL CONTENT:
${proposalContent.substring(0, 6000)}

Provide evaluation in this JSON format:
{
  "overallScore": 75,
  "overallAssessment": "Summary assessment of the proposal",
  "scores": {
    "compliance": {"score": 80, "feedback": "Specific feedback on compliance"},
    "technical": {"score": 75, "feedback": "Specific feedback on technical content"},
    "financial": {"score": 70, "feedback": "Specific feedback on financial proposal"},
    "presentation": {"score": 85, "feedback": "Specific feedback on presentation quality"},
    "completeness": {"score": 75, "feedback": "Specific feedback on completeness"}
  },
  "strengths": ["strength 1", "strength 2", "..."],
  "weaknesses": ["weakness 1", "weakness 2", "..."],
  "missingElements": ["missing 1", "missing 2", "..."],
  "improvements": [
    {"section": "Section Name", "suggestion": "Specific improvement suggestion"},
    {"section": "Section Name", "suggestion": "Specific improvement suggestion"}
  ],
  "winProbability": "Medium",
  "winProbabilityReason": "Explanation of win probability assessment",
  "recommendedActions": ["action 1", "action 2", "..."]
}`;

    const response = await callGroq(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 3000 });
    const evaluation = parseJSON(response);

    if (!evaluation) {
      return this._generateFallbackEvaluation(proposal);
    }

    return {
      isAI: true,
      evaluatedAt: new Date().toISOString(),
      ...evaluation,
    };
  },

  /**
   * Prepare content for AI analysis (truncate if needed)
   */
  _prepareContentForAnalysis(parsed) {
    let content = '';

    // Add sections with priority to important ones
    const prioritySections = parsed.sections.filter(s =>
      ['ELIGIBILITY', 'TECHNICAL', 'FINANCIAL', 'EVALUATION'].includes(s.type)
    );
    const otherSections = parsed.sections.filter(s =>
      !['ELIGIBILITY', 'TECHNICAL', 'FINANCIAL', 'EVALUATION'].includes(s.type)
    );

    // Add priority sections first
    for (const section of prioritySections) {
      content += `\n--- ${section.title} (${section.type}) ---\n`;
      content += section.content.substring(0, 2000) + '\n';
    }

    // Add other sections with remaining space
    for (const section of otherSections) {
      if (content.length > 10000) break;
      content += `\n--- ${section.title} ---\n`;
      content += section.content.substring(0, 1000) + '\n';
    }

    return content.substring(0, 12000);
  },

  /**
   * Generate section-wise summaries
   */
  _generateSectionSummaries(sections) {
    return sections.map(section => ({
      id: section.id,
      title: section.title,
      type: section.type,
      wordCount: section.wordCount,
      isMandatory: section.isMandatory,
      summary: section.content.substring(0, 200) + (section.content.length > 200 ? '...' : ''),
    }));
  },

  /**
   * Fallback summary when AI fails
   */
  _generateFallbackSummary(parsed) {
    return {
      isAI: false,
      executiveSummary: `This tender document titled "${parsed.title}" contains ${parsed.sections.length} sections with approximately ${parsed.stats.totalWords} words. Review all sections carefully to understand the complete requirements.`,
      bulletPoints: {
        criticalRequirements: ['Review all tender sections', 'Meet eligibility criteria', 'Submit before deadline'],
        eligibilityCriteria: parsed.sections.filter(s => s.type === 'ELIGIBILITY').map(s => `Review: ${s.title}`),
        technicalSpecifications: parsed.sections.filter(s => s.type === 'TECHNICAL').map(s => `Review: ${s.title}`),
        financialTerms: parsed.metadata.emdAmount ? [`EMD: ₹${parsed.metadata.emdAmount.toLocaleString()}`] : ['Review financial requirements'],
        complianceRequirements: ['Follow all tender guidelines', 'Submit required documents'],
        deadlinesAndTimelines: parsed.metadata.deadline ? [`Deadline: ${parsed.metadata.deadline}`] : ['Check submission deadline'],
        documentsRequired: ['Technical documents', 'Financial documents', 'Compliance certificates'],
        riskFactors: ['Verify all requirements before submission'],
      },
      opportunityScore: 60,
      opportunityAssessment: 'Manual review recommended',
      actionItems: ['Review all sections', 'Prepare required documents', 'Calculate EMD', 'Verify eligibility'],
      sectionSummaries: this._generateSectionSummaries(parsed.sections),
    };
  },

  /**
   * Fallback proposal draft when AI fails
   */
  _generateFallbackProposalDraft(parsed) {
    const sections = [
      {
        id: 'coverLetter',
        order: 1,
        title: 'Cover Letter',
        content: `[Date]\n\nTo,\nThe [Authority Name]\n[Address]\n\nSubject: Submission of Proposal for ${parsed.title}\n\nRef: ${parsed.metadata?.referenceNumber || '[Tender Reference Number]'}\n\nDear Sir/Madam,\n\nWe, [BIDDER_NAME], are pleased to submit our proposal for the above-referenced tender. We have carefully reviewed all tender documents and confirm our understanding of the requirements.\n\nWe hereby confirm that:\n1. We meet all the eligibility criteria specified in the tender\n2. We have read and understood all terms and conditions\n3. We commit to delivering as per the specifications mentioned\n\nPlease find enclosed all required documents as per the tender requirements.\n\nYours faithfully,\n\n[Authorized Signatory]\n[BIDDER_NAME]\n[Contact Details]`,
        isEditable: true,
        wordCount: 120,
      },
      {
        id: 'companyProfile',
        order: 2,
        title: 'Company Profile & Experience',
        content: `# Company Profile\n\n## About [BIDDER_NAME]\n[Provide company overview, history, and core competencies]\n\n## Relevant Experience\n[List similar projects completed with values and timelines]\n\n## Certifications & Registrations\n- [Certification 1]\n- [Certification 2]\n- [Registration details]\n\n## Financial Capacity\n[Brief financial capability statement]`,
        isEditable: true,
        wordCount: 60,
      },
      {
        id: 'eligibilityCompliance',
        order: 3,
        title: 'Eligibility Compliance Statement',
        content: `# Eligibility Compliance\n\nWe hereby declare that [BIDDER_NAME] meets all eligibility criteria as specified in the tender:\n\n| Criteria | Requirement | Our Status | Supporting Document |\n|----------|-------------|------------|---------------------|\n| [Criteria 1] | [Requirement] | Compliant | [Document Reference] |\n| [Criteria 2] | [Requirement] | Compliant | [Document Reference] |\n\n[Add rows for each eligibility criterion]`,
        isEditable: true,
        wordCount: 50,
      },
      {
        id: 'technicalApproach',
        order: 4,
        title: 'Technical Approach & Methodology',
        content: `# Technical Approach\n\n## Understanding of Requirements\n[Demonstrate understanding of the tender scope and objectives]\n\n## Proposed Methodology\n[Detailed approach to execute the project]\n\n## Quality Assurance\n[Quality control measures and standards]\n\n## Risk Management\n[Identified risks and mitigation strategies]`,
        isEditable: true,
        wordCount: 50,
      },
      {
        id: 'projectPlan',
        order: 5,
        title: 'Project Plan & Timeline',
        content: `# Project Implementation Plan\n\n## Project Phases\n\n| Phase | Activities | Duration | Deliverables |\n|-------|------------|----------|-------------|\n| Phase 1 | [Activities] | [Duration] | [Deliverables] |\n| Phase 2 | [Activities] | [Duration] | [Deliverables] |\n\n## Milestones\n[Key milestones with dates]\n\n## Resource Allocation\n[Resource deployment plan]`,
        isEditable: true,
        wordCount: 50,
      },
      {
        id: 'financialProposal',
        order: 6,
        title: 'Financial Proposal',
        content: `# Financial Proposal\n\n## Pricing Summary\n[Total bid amount and breakdown]\n\n## Payment Terms\n[Accepted payment terms as per tender]\n\n## EMD Details\n- EMD Amount: [Amount]\n- Mode: [Bank Guarantee/DD]\n- Validity: [Period]\n\n## Price Validity\n[Price validity period]`,
        isEditable: true,
        wordCount: 50,
      },
    ];

    return {
      isAI: false,
      generatedAt: new Date().toISOString(),
      sections,
      totalSections: sections.length,
      totalWords: sections.reduce((sum, s) => sum + s.wordCount, 0),
      status: 'DRAFT',
    };
  },

  /**
   * Fallback evaluation when AI fails
   */
  _generateFallbackEvaluation(proposal) {
    const totalWords = proposal.sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);
    const sectionCount = proposal.sections.length;

    return {
      isAI: false,
      evaluatedAt: new Date().toISOString(),
      overallScore: 60,
      overallAssessment: 'Manual evaluation recommended. Please review your proposal against tender requirements.',
      scores: {
        compliance: { score: 60, feedback: 'Verify compliance with all tender requirements' },
        technical: { score: 60, feedback: 'Ensure technical approach addresses all specifications' },
        financial: { score: 60, feedback: 'Verify pricing is competitive and complete' },
        presentation: { score: 70, feedback: 'Proposal structure appears reasonable' },
        completeness: { score: sectionCount >= 5 ? 70 : 50, feedback: `Proposal has ${sectionCount} sections` },
      },
      strengths: ['Proposal structure created', `Contains ${sectionCount} sections`],
      weaknesses: ['AI evaluation unavailable', 'Manual review recommended'],
      missingElements: ['Verify all required documents are included'],
      improvements: [
        { section: 'All Sections', suggestion: 'Review each section against tender requirements' },
      ],
      winProbability: 'Unknown',
      winProbabilityReason: 'Manual evaluation required for accurate assessment',
      recommendedActions: ['Review tender requirements', 'Complete all placeholders', 'Verify document checklist'],
    };
  },
};
