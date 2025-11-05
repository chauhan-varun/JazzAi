/**
 * WhatsApp Token Refresh Guide
 * 
 * Since WhatsApp Business API tokens expire every 24 hours by default,
 * here's how to get a long-lived token:
 * 
 * 1. Go to https://developers.facebook.com/apps/
 * 2. Select your WhatsApp Business app
 * 3. Go to "App Dashboard" → "Settings" → "Advanced"
 * 4. Under "System Users", create a new system user if you don't have one
 * 5. Grant the system user appropriate permissions:
 *    - whatsapp_business_messaging
 *    - whatsapp_business_management
 * 6. Generate a token for this system user with "Never Expires" option
 * 7. Update your .env file with this new token
 * 
 * This script just provides instructions - you'll need to manually
 * follow the steps in the Meta developer portal.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("\n🔑 WhatsApp Token Management 🔑");
console.log("================================\n");
console.log("Your WhatsApp token is set to expire every 24 hours by default.");
console.log("This script will guide you through updating it.\n");

// Function to update the token in .env file
function updateToken(newToken) {
  try {
    // Read the current .env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the token
    const updatedContent = envContent.replace(
      /WHATSAPP_TOKEN=.*/,
      `WHATSAPP_TOKEN=${newToken}`
    );
    
    // Write back to .env
    fs.writeFileSync(envPath, updatedContent);
    
    console.log("\n✅ Token updated successfully in .env file!");
    console.log("🚀 Restart your server for the changes to take effect.\n");
  } catch (error) {
    console.error("\n❌ Error updating token:", error.message);
  }
}

console.log("Please follow these steps to get a permanent token:");
console.log("1. Go to https://developers.facebook.com/apps/");
console.log("2. Select your WhatsApp Business app");
console.log("3. Go to Settings → Advanced → System Users");
console.log("4. Create a system user with appropriate permissions");
console.log("5. Generate a token with 'Never Expires' option\n");

rl.question("Do you have a new token to update now? (y/n): ", (answer) => {
  if (answer.toLowerCase() === 'y') {
    rl.question("Please paste your new WhatsApp token: ", (token) => {
      if (token && token.length > 20) { // Simple validation
        updateToken(token);
      } else {
        console.log("\n❌ Invalid token format. Token not updated.");
      }
      rl.close();
    });
  } else {
    console.log("\nGot it! When you have a new token, run this script again or manually update your .env file.");
    rl.close();
  }
});