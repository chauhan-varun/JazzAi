#!/bin/bash
# MongoDB Setup Script - Makes MongoDB version the permanent default

# Path settings
JAZZAI_DIR="/home/varun/web2/jazzAi"
BACKUP_DIR="$JAZZAI_DIR/json_backup"

echo "JazzAI MongoDB Setup"
echo "--------------------"
echo "This script will replace your existing files with MongoDB versions"
echo "Original files will be backed up to $BACKUP_DIR"
echo

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Function to backup and replace a file
replace_with_mongo() {
  local orig_file="$1"
  local mongo_file="${orig_file%.js}.mongo.js"
  
  # Check if mongo version exists
  if [ ! -f "$mongo_file" ]; then
    echo "Warning: MongoDB version not found: $mongo_file"
    return
  fi
  
  # Backup original if it exists
  if [ -f "$orig_file" ]; then
    echo "Backing up: $orig_file"
    cp "$orig_file" "$BACKUP_DIR/$(basename $orig_file)"
  fi
  
  # Replace with MongoDB version
  echo "Replacing with MongoDB version: $orig_file"
  cp "$mongo_file" "$orig_file"
}

# Backup the memory.json file
if [ -f "$JAZZAI_DIR/data/memory.json" ]; then
  echo "Backing up memory.json"
  cp "$JAZZAI_DIR/data/memory.json" "$BACKUP_DIR/memory.json"
  mv "$JAZZAI_DIR/data/memory.json" "$JAZZAI_DIR/data/memory.json.bak"
fi

# Replace all files with MongoDB versions
cd "$JAZZAI_DIR"

replace_with_mongo "$JAZZAI_DIR/server.js"
replace_with_mongo "$JAZZAI_DIR/services/memoryService.js"
replace_with_mongo "$JAZZAI_DIR/services/whatsappService.js"
replace_with_mongo "$JAZZAI_DIR/services/perplexity.js"
replace_with_mongo "$JAZZAI_DIR/services/schedulerService.js"
replace_with_mongo "$JAZZAI_DIR/controllers/webhookController.js"
replace_with_mongo "$JAZZAI_DIR/utils/utils.js"
replace_with_mongo "$JAZZAI_DIR/config/config.js"

echo
echo "MongoDB setup complete!"
echo "Original files were backed up to: $BACKUP_DIR"
echo
echo "Next steps:"
echo "1. Make sure MongoDB is installed and running"
echo "2. Update your .env file with MongoDB connection string:"
echo "   MONGODB_URI=mongodb://localhost:27017/jazzai"
echo "3. Run the migration script to transfer data:"
echo "   node scripts/migrate-to-mongodb.js"
echo "4. Restart your server"

exit 0