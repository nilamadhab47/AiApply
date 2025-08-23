# Development Setup with Local AI Models

This guide helps you set up the resume builder for development using local AI models to avoid premium API costs.

## Option 1: Using Ollama (Recommended for Development)

### 1. Install Ollama
```bash
# On macOS
brew install ollama

# Or download from https://ollama.ai
```

### 2. Start Ollama Service
```bash
ollama serve
```

### 3. Pull a Model
```bash
# Recommended models for development (choose one):
ollama pull llama3.1:8b      # Good balance of speed and quality
ollama pull llama3.1:7b      # Faster, smaller model
ollama pull codellama:7b     # Good for code-related tasks
```

### 4. Environment Configuration
Create a `.env.local` file in your project root:

```env
# Development AI Configuration
NODE_ENV=development
USE_LOCAL_AI=true
OLLAMA_BASE_URL=http://localhost:11434

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: Keep OpenRouter for production
# OPENROUTER_API_KEY=your-openrouter-key

# Parser Service
PARSER_SERVICE_URL=http://localhost:8000

# OAuth Providers (optional for development)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_ID=your-github-id
# GITHUB_SECRET=your-github-secret
```

### 5. Test Ollama Connection
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false
}'
```

## Option 2: Using Free/Test APIs

### Hugging Face (Free Tier)
```env
USE_LOCAL_AI=false
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your-free-hf-token
```

### OpenAI Free Tier
```env
USE_LOCAL_AI=false
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-3.5-turbo  # Cheaper than GPT-4
```

## How It Works

The application automatically detects your environment:

1. **Development Mode** (`NODE_ENV=development` or `USE_LOCAL_AI=true`):
   - Uses Ollama running on localhost:11434
   - No API costs, unlimited usage
   - Good for testing and development

2. **Production Mode** (`NODE_ENV=production` and `USE_LOCAL_AI=false`):
   - Uses OpenRouter with premium models
   - Better quality but costs credits
   - Use for final testing and production

3. **Fallback Mode** (no AI service available):
   - Returns static responses
   - Ensures app doesn't crash
   - Basic functionality maintained

## Model Recommendations

### For Development:
- **llama3.1:8b** - Best balance of quality and speed
- **llama3.1:7b** - Faster responses, good quality
- **codellama:7b** - Good for technical content

### For Production:
- **claude-3.5-sonnet** - Highest quality (via OpenRouter)
- **gpt-4** - Good alternative (via OpenAI)
- **llama-3.1-70b** - Good open-source option (via OpenRouter)

## Switching Between Modes

Simply change your `.env.local` file:

```bash
# For local development
USE_LOCAL_AI=true

# For production testing
USE_LOCAL_AI=false
```

Restart your development server after changing environment variables.

## Troubleshooting

### Ollama Not Working?
1. Check if Ollama is running: `ollama list`
2. Verify the model is downloaded: `ollama pull llama3.1:8b`
3. Test the API endpoint: `curl http://localhost:11434/api/tags`

### Still Getting API Errors?
The app will automatically fall back to static responses if AI services fail, so core functionality remains available.

## Cost Comparison

- **Ollama (Local)**: Free, unlimited usage
- **OpenRouter Premium**: ~$0.01-0.10 per request
- **OpenAI GPT-3.5**: ~$0.002 per request
- **Fallback Mode**: Free, static responses

For development and testing, Ollama is the most cost-effective option!
