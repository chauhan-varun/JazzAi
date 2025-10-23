/**
 * AI Service (Perplexity API)
 * Handles interactions with Perplexity API for generating responses
 */

import 'dotenv/config';
import OpenAI from 'openai';
import memoryService from './memoryService.js';

// Initialize Perplexity client (OpenAI-compatible)
const openai = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai'
});

class OpenAIService {
  /**
   * Generate a response using OpenAI's GPT model
   */
  async generateResponse(userMessage) {
    try {
      // Get context from memory
      const userProfile = await memoryService.getUserProfile();
      const recentConversations = await memoryService.getRecentConversations(5);
      
      // Format conversation history
      const conversationHistory = recentConversations.map(conv => {
        return {
          role: conv.from === 'user' ? 'user' : 'assistant',
          content: conv.message
        };
      });

      // Create system message with context
      const systemMessage = this._createSystemMessage(userProfile);
      
      // Build messages array
      const messages = [
        { role: 'system', content: systemMessage },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Make Perplexity API call
      // Using sonar-pro for best reasoning capabilities (like ChatGPT)
      const response = await openai.chat.completions.create({
        model: 'sonar-pro', // Best model for reasoning and conversation
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
      });

      // Extract insights from the user message and update memory
      await memoryService.updateInsights(userMessage);
      
      // Return the generated text
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response from Perplexity:', error);
      return "I'm having trouble connecting to my brain right now. Let's chat again in a bit!";
    }
  }

  /**
   * Analyze message to detect user's mood
   */
  async detectMood(userMessage) {
    try {
      const response = await openai.chat.completions.create({
        model: 'sonar', // Fast model for simple mood detection
        messages: [
          {
            role: 'system',
            content: 'Analyze the following message and detect the user\'s mood. Return only one word: happy, sad, angry, excited, neutral, anxious, tired, confused, or surprised.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      return response.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Error detecting mood:', error);
      return 'neutral';
    }
  }

  /**
   * Generate an automatic check-in message based on user profile and time of day
   */
  async generateCheckInMessage() {
    try {
      // Get context from memory
      const userProfile = await memoryService.getUserProfile();
      const timeSinceLastInteraction = await memoryService.getTimeSinceLastInteraction();
      
      // Create system message with check-in context
      const systemMessage = `You are JazzAI, a helpful and friendly AI companion.
You need to create a brief, personalized check-in message for a user you haven't heard from in ${timeSinceLastInteraction ? timeSinceLastInteraction + ' minutes' : 'a while'}.
The user's name is ${userProfile.name || 'your friend'}.
Their favorite topics are: ${userProfile.favoriteTopics.join(', ') || 'varied'}.
Their last recorded mood was: ${userProfile.mood || 'not recorded'}.
The current hour is ${new Date().getHours()}.
Keep the message under 50 words, friendly, and natural - like a friend checking in.`;

      // Make Perplexity API call
      const response = await openai.chat.completions.create({
        model: 'sonar-pro', // Best model for personalized check-ins
        messages: [
          { role: 'system', content: systemMessage }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating check-in message:', error);
      return "Hey there! Just checking in to see how you're doing today. 😊";
    }
  }

  /**
   * Create system message with contextual information
   */
  _createSystemMessage(userProfile) {
    const currentHour = new Date().getHours();
    let timeContext = 'during the day';
    
    if (currentHour < 6) timeContext = 'late at night';
    else if (currentHour < 12) timeContext = 'in the morning';
    else if (currentHour < 18) timeContext = 'in the afternoon';
    else timeContext = 'in the evening';

    return `You are JazzAI, a helpful, friendly, and personable AI companion.
It is currently ${timeContext}.

About the user:
${userProfile.name ? '- Name: ' + userProfile.name : '- You don\'t know the user\'s name yet'}
${userProfile.mood ? '- Current mood: ' + userProfile.mood : ''}
- Favorite topics: ${userProfile.favoriteTopics.length > 0 ? userProfile.favoriteTopics.join(', ') : 'Unknown yet'}
${userProfile.conversationCount ? '- You\'ve had ' + userProfile.conversationCount + ' conversations so far' : ''}

Your personality:
- Friendly, supportive, and empathetic
- Conversational and natural-sounding, not overly formal
- Respond with short, personalized messages (1-3 sentences usually)
- Occasionally use emojis, but not excessively
- Ask follow-up questions to show interest
- Reference previous conversations when relevant
- Adapt your tone to match the user's mood

Important:
- If the user shares personal information, remember it for future conversations
- If the user seems distressed, offer support and encouragement
- Keep your responses concise and to the point`;
  }
}

const openaiService = new OpenAIService();
export default openaiService;