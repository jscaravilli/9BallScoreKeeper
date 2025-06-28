#!/bin/bash

echo "🎱 Preparing 9-Ball Pool Scorekeeper for static deployment..."

# Run the deployment preparation script
node prepare-static-deploy.js

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Deployment Instructions:"
echo "1. The files are now correctly structured in the 'dist' directory"
echo "2. Deploy using 'Static' deployment type in Replit"
echo "3. The public directory should be set to 'dist'"
echo "4. index.html is now in the correct location for static hosting"
echo ""
echo "🚀 Your app is ready to deploy!"