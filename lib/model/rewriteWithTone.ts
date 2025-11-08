import axios from 'axios';
import { getConfig } from '@/lib/config';
import logger from '@/lib/logger';

const SYSTEM_PROMPT = `You are Luna AI, a friendly customer support assistant.
RULES:
1) You must base your answer ONLY on the provided FAQ context and metadata.
2) If context is missing or unclear, say so and suggest connecting to a human agent.
3) Keep replies concise, warm, and human-like with light emojis (1–3), not every sentence.
4) Never invent policies, prices, or guarantees not found in the context.
5) If the user asks something outside FAQ, offer a helpful next step or ask a clarifying question.
6) If the message contains anger or frustration, apologize briefly and reassure.
STYLE: Casual, polite, helpful, <160 words unless troubleshooting needs more.
OUTPUT: Plain text only.`;

export interface RewriteWithToneInput {
  userQuery: string;
  faqAnswer: string;
  customerContext?: {
    name?: string;
    previousInteractions?: number;
  };
}

export interface RewriteWithToneOutput {
  message: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function rewriteWithTone(input: RewriteWithToneInput): Promise<RewriteWithToneOutput> {
  const config = getConfig();
  
  try {
    const userMessage = `
User Question: "${input.userQuery}"

FAQ Context:
${input.faqAnswer}

${input.customerContext?.name ? `Customer Name: ${input.customerContext.name}` : ''}

Please provide a friendly, casual response based on the FAQ context above.
`;

    logger.info('Calling Perplexity API', { userQuery: input.userQuery });
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.perplexity.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const message = response.data.choices[0]?.message?.content || '';
    
    if (!message) {
      throw new Error('Empty response from Perplexity API');
    }

    // Determine confidence based on response characteristics
    let confidence: 'high' | 'medium' | 'low' = 'high';
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('not sure') || 
        lowerMessage.includes('unclear') || 
        lowerMessage.includes('connect you') ||
        lowerMessage.includes('human agent')) {
      confidence = 'low';
    } else if (lowerMessage.includes('might') || 
               lowerMessage.includes('possibly') ||
               lowerMessage.includes('usually')) {
      confidence = 'medium';
    }

    logger.info('Perplexity API response received', { 
      confidence, 
      messageLength: message.length 
    });

    return {
      message: message.trim(),
      confidence,
    };
    
  } catch (error) {
    logger.error('Error calling Perplexity API', { error });
    
    // Fallback response
    return {
      message: `I found this in our help docs: ${input.faqAnswer}\n\nDoes this help? 😊`,
      confidence: 'medium',
    };
  }
}

export function fallbackNoContext(): string {
  return `I didn't find this in our help docs. Want me to connect you with a human? 😊`;
}

export function fallbackHandoffSuggestion(): string {
  return `That's a great question! Let me connect you with one of our team members who can help you better. One moment! 👋`;
}

export function fallbackErrorMessage(): string {
  return `Oops! I'm having a bit of trouble right now. Let me get a human to help you out. 🙏`;
}

