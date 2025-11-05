/**
 * Diagnostic Script for JazzAI WhatsApp Integration
 */

import 'dotenv/config';

console.log('=== JazzAI WhatsApp Integration Diagnostics ===\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('   ✓ OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set (length: ' + process.env.OPENAI_API_KEY.length + ')' : '✗ NOT SET');
console.log('   ✓ WHATSAPP_TOKEN:', process.env.WHATSAPP_TOKEN ? '✓ Set (length: ' + process.env.WHATSAPP_TOKEN.length + ')' : '✗ NOT SET');
console.log('   ✓ PHONE_NUMBER_ID:', process.env.PHONE_NUMBER_ID ? '✓ Set (' + process.env.PHONE_NUMBER_ID + ')' : '✗ NOT SET');
console.log('   ✓ USER_NUMBER:', process.env.USER_NUMBER ? '✓ Set (' + process.env.USER_NUMBER + ')' : '✗ NOT SET');
console.log('   ✓ PORT:', process.env.PORT || '3000 (default)');
console.log();

// Check phone number format
console.log('2. Phone Number Format Check:');
const userNumber = process.env.USER_NUMBER;
if (userNumber) {
  const digitsOnly = userNumber.replace(/\D/g, '');
  console.log('   - Raw number:', userNumber);
  console.log('   - Digits only:', digitsOnly);
  console.log('   - Total digits:', digitsOnly.length);
  
  if (userNumber.startsWith('+55')) {
    console.log('   - Country: Brazil (+55)');
    const withoutCountry = digitsOnly.substring(2);
    console.log('   - Digits after country code:', withoutCountry.length);
    
    if (withoutCountry.length < 10) {
      console.log('   ⚠️  WARNING: Brazilian phone numbers should have 10-11 digits after country code');
      console.log('   ⚠️  Your number has only', withoutCountry.length, 'digits');
      console.log('   ⚠️  Expected format: +55 XX XXXXXXXXX (e.g., +55 11 987654321)');
    } else {
      console.log('   ✓ Phone number format looks correct');
    }
  }
} else {
  console.log('   ✗ USER_NUMBER not set');
}
console.log();

// Check server accessibility
console.log('3. Server Accessibility:');
console.log('   - Local server: http://localhost:' + (process.env.PORT || 3000));
console.log('   ⚠️  IMPORTANT: WhatsApp needs a PUBLIC HTTPS URL');
console.log('   ⚠️  Options:');
console.log('      a) Use ngrok: ngrok http 3000');
console.log('      b) Use cloudflared: cloudflared tunnel --url http://localhost:3000');
console.log('      c) Deploy to a cloud service (Heroku, Railway, etc.)');
console.log();

// Test WhatsApp API connection
console.log('4. Testing WhatsApp API Connection:');
const testConnection = async () => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✓ Successfully connected to WhatsApp API');
      console.log('   ✓ Phone Number ID is valid:', data.id);
      console.log('   ✓ Display Name:', data.display_phone_number);
      console.log('   ✓ Quality Rating:', data.quality_rating || 'N/A');
    } else {
      const error = await response.text();
      console.log('   ✗ Failed to connect to WhatsApp API');
      console.log('   ✗ Status:', response.status);
      console.log('   ✗ Error:', error);
      console.log('   ⚠️  This likely means your PHONE_NUMBER_ID or WHATSAPP_TOKEN is incorrect');
    }
  } catch (error) {
    console.log('   ✗ Error testing connection:', error.message);
  }
};

await testConnection();
console.log();

// Webhook setup instructions
console.log('5. Webhook Setup Instructions:');
console.log('   To receive messages from WhatsApp, you need to:');
console.log('   a) Make your server publicly accessible (see step 3)');
console.log('   b) Go to: https://developers.facebook.com/apps');
console.log('   c) Select your app > WhatsApp > Configuration');
console.log('   d) Under "Webhook", click "Edit"');
console.log('   e) Enter your callback URL: https://your-public-url/webhook');
console.log('   f) Enter verify token: jazzai-webhook-verification');
console.log('   g) Subscribe to "messages" field');
console.log();

console.log('=== Diagnosis Complete ===');
console.log();
console.log('Next Steps:');
console.log('1. Fix any issues marked with ✗ or ⚠️  above');
console.log('2. Make your server publicly accessible');
console.log('3. Configure the webhook in Meta for Developers');
console.log('4. Test by sending a message from WhatsApp');

