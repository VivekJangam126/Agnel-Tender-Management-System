/**
 * LLM Service
 * Handles calls to Groq LLM API
 */

import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
  console.warn('[LLM] Warning: GROQ_API_KEY not set. LLM calls will fail.');
}

/**
 * Call Groq LLM with a prompt
 * @param {string} systemPrompt - System message with context
 * @param {string} userMessage - Optional user message
 * @returns {Promise<string>} - LLM response
 */
export async function callGroqLLM(systemPrompt, userMessage = '') {
  try {
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    if (userMessage) {
      messages.push({
        role: 'user',
        content: userMessage,
      });
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages,
        temperature: 0.3, // Low temperature for factual responses
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from LLM');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('[LLM] Error calling Groq:', error.response?.data || error.message);
    throw new Error('LLM service unavailable: ' + (error.response?.data?.error?.message || error.message));
  }
}
