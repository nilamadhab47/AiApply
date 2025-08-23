#!/bin/bash

echo "🚀 Setting up Resume Builder for Local Development"
echo "=================================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Development AI Configuration
NODE_ENV=development
USE_LOCAL_AI=true
OLLAMA_BASE_URL=http://localhost:11434

# NextAuth Configuration (for development)
NEXTAUTH_SECRET=dev-secret-key-for-local-development-only-$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Parser Service
PARSER_SERVICE_URL=http://localhost:8000

# Optional: OAuth Providers (uncomment and add your keys if needed)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_ID=your-github-id
# GITHUB_SECRET=your-github-secret
EOF
    echo "✅ Created .env.local with local development configuration"
else
    echo "📄 .env.local already exists"
fi

# Check if Ollama is running
echo "🔍 Checking Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
    
    # Check if llama3.1:8b model is available
    if ollama list | grep -q "llama3.1:8b"; then
        echo "✅ llama3.1:8b model is available"
    else
        echo "📥 Downloading llama3.1:8b model..."
        ollama pull llama3.1:8b
    fi
else
    echo "❌ Ollama is not running. Please start it with: ollama serve"
    echo "   Then run this script again."
    exit 1
fi

# Test Ollama connection
echo "🧪 Testing Ollama connection..."
RESPONSE=$(curl -s -X POST http://localhost:11434/api/chat \
    -H "Content-Type: application/json" \
    -d '{"model": "llama3.1:8b", "messages": [{"role": "user", "content": "Hello!"}], "stream": false}' \
    | jq -r '.message.content' 2>/dev/null)

if [ ! -z "$RESPONSE" ] && [ "$RESPONSE" != "null" ]; then
    echo "✅ Ollama is responding correctly"
else
    echo "❌ Ollama test failed. Please check your setup."
    exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Start the parser service: cd document-parser-service && python main.py"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "💡 You now have unlimited, free AI-powered resume analysis!"
echo "   All AI processing happens locally with Ollama."
