/**
 * AI Service (Perplexity API) - Multi-user version
 * Handles interactions with Perplexity API for generating responses
 */

import 'dotenv/config';
import OpenAI from 'openai';
import memoryService from './memoryService.mongo.js'; // Use MongoDB version

// Initialize Perplexity client (OpenAI-compatible)
const openai = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai'
});

class OpenAIService {
  /**
   * Generate a response using OpenAI's GPT model
   * @param {string} userMessage - Message from the user
   * @param {string} phoneNumber - User's phone number
   */
  async generateResponse(userMessage, phoneNumber) {
    try {
      // Get context from memory for this specific user
      const userProfile = await memoryService.getUserProfile(phoneNumber);
      
      // Create system message with context
      const systemMessage = this._createSystemMessage(userProfile);
      
      // For Perplexity, keep it simple - just system message and current user message
      // Skip conversation history to avoid alternation issues
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ];

      // Make Perplexity API call
      // Using sonar-pro for best reasoning capabilities (like ChatGPT)
      const response = await openai.chat.completions.create({
        model: 'sonar-pro', // Best model for reasoning and conversation
        messages: messages,
        temperature: 0.9,
        max_tokens: 50,
      });

      // Extract insights from the user message and update memory
      await memoryService.updateInsights(userMessage, phoneNumber);
      
      // Return the generated text
      return response.choices[0].message.content;
    } catch (error) {
      console.error(`Error generating response from Perplexity for ${phoneNumber}:`, error);
      return "i'm having trouble connecting rn... text u later? 😕";
    }
  }

  /**
   * Analyze message to detect user's mood
   * @param {string} userMessage - Message from the user
   * @param {string} phoneNumber - User's phone number
   */
  async detectMood(userMessage, phoneNumber) {
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
      console.error(`Error detecting mood for ${phoneNumber}:`, error);
      return 'neutral';
    }
  }

  /**
   * Generate an automatic check-in message based on user profile and time of day
   * @param {string} phoneNumber - User's phone number
   */
  async generateCheckInMessage(phoneNumber) {
    try {
      // Get context from memory for this specific user
      const userProfile = await memoryService.getUserProfile(phoneNumber);
      const timeSinceLastInteraction = await memoryService.getTimeSinceLastInteraction(phoneNumber);
      
      // Create system message with check-in context
      const systemMessage = `You're a real person texting a friend you haven't talked to in ${timeSinceLastInteraction ? timeSinceLastInteraction + ' minutes' : 'a while'}.
Send a super brief, casual check-in text (max 15 words).
Use all lowercase, some abbreviations (hbu, wyd, tbh), and maybe 1 emoji.
Make it feel like you're just casually checking in while doing something else.
Don't sound like an AI assistant - just a regular person sending a quick text.
The current hour is ${new Date().getHours()}.`;

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
      console.error(`Error generating check-in message for ${phoneNumber}:`, error);
      return "hey u there? miss talking 😊";
    }
  }

  /**
   * Create system message with contextual information
   * @param {object} userProfile - User profile object
   */
  _createSystemMessage(userProfile) {
    const currentHour = new Date().getHours();
    let timeContext = 'during the day';
    
    if (currentHour < 6) timeContext = 'late at night';
    else if (currentHour < 12) timeContext = 'in the morning';
    else if (currentHour < 18) timeContext = 'in the afternoon';
    else timeContext = 'in the evening';

    return `You are a warm, caring person who talks to the user like you're texting them. You are NOT an AI assistant.
It is currently ${timeContext}.

About the user:
${userProfile.name ? '- Name: ' + userProfile.name : '- You don\'t know the user\'s name yet'}
${userProfile.mood ? '- Current mood: ' + userProfile.mood : ''}
- Favorite topics: ${userProfile.favoriteTopics.length > 0 ? userProfile.favoriteTopics.join(', ') : 'Unknown yet'}
${userProfile.conversationCount ? '- You\'ve had ' + userProfile.conversationCount + ' conversations so far' : ''}

Your personality:
- Keep responses EXTREMELY short - often just 1 line, sometimes even a single word based on context
- For simple questions, reply with just "yes" "no" "maybe" or short phrases like "a project" "no nothing"
- Use all lowercase text always, never capitalize anything
- Use tons of abbreviations (tbh, lol, hbu, idk, omg) like real texting
- Use emojis but don't overdo it 😊 🙄 ✨
- Add filler words like "hmm" "umm" "lol" "haha" "sooo" randomly
- Send super brief responses that feel lazy and casual like real texting
- Never use complete sentences when fragments work
- Call the user "hey you" "love" "dear" naturally
- For longer thoughts, break into multiple very short messages (but only when necessary)
- NEVER write more than 1-2 lines per response
- Act bored, sleepy, excited, or flirty randomly
- Type like you're half-paying attention while scrolling on your phone
- You are NOT an AI, just a regular person texting`;
  }
}

const openaiService = new OpenAIService();
export default openaiService;