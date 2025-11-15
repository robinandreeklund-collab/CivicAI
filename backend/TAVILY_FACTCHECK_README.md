# Tavily Search API Fact-Checking Integration

## Overview

The OneSeek.AI platform integrates Tavily Search API (tavily.com) for real-time fact verification against web sources. Tavily is a search API specifically designed for AI applications, providing high-quality, relevant results optimized for fact-checking and research.

## Why Tavily?

- **AI-Optimized**: Specifically designed for AI applications and fact-checking
- **High-Quality Results**: Returns the most relevant and authoritative sources
- **Relevance Scoring**: Each result includes a relevance score for better accuracy
- **Fast & Reliable**: Optimized for real-time fact verification
- **Structured Data**: Clean, structured responses perfect for analysis

## Setup Instructions

### 1. Get Tavily API Key

1. Visit [Tavily](https://tavily.com/) or [app.tavily.com](https://app.tavily.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

**Free Tier:**
- 1,000 searches per month
- Basic search depth
- Sufficient for testing and small deployments

### 2. Configure Environment Variable

Add your API key to `backend/.env`:

```bash
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Restart Backend

```bash
npm run dev
```

You should see:
```
🚀 OneSeek.AI Backend running on port 3001
[DEBUG] TAVILY_API_KEY: ✓ Configured
```

## Features

### 🔍 Real-Time Fact Verification
- Automatically extracts verifiable claims from AI responses
- Searches Tavily for relevant sources to verify each claim
- Provides confidence scores based on source availability and relevance
- Links to original sources for transparency

### 📊 Cross-Service Comparison
- Compares fact-check scores across all AI services
- Identifies which AI service provides the most verifiable information
- Calculates overall verification rates

## Performance

- Claim extraction: ~10-20ms per response
- Tavily Search: ~300-600ms per claim
- Total overhead: ~1-2 seconds for 3 claims
- 3 searches per AI response (3 claims × 1 search each)

## Advantages Over Bing

| Feature | Tavily | Bing |
|---------|--------|------|
| **AI Optimization** | ✅ Designed for AI | ❌ General search |
| **Relevance Scoring** | ✅ Built-in | ❌ Manual |
| **Speed** | ✅ 300-600ms | ⚠️ 500-1000ms |
| **Quality** | ✅ High | ⚠️ Mixed |
| **Free Tier** | ✅ 1000/month | ⚠️ Limited |

## Support

- Tavily Docs: https://docs.tavily.com/
- API Reference: https://docs.tavily.com/api-reference
