# Working Services - Quick Reference

## ✅ Fully Functional Services

### Crawler Services (3 Working)

#### 1. Firecrawl ⭐ Recommended
- **Status:** ✅ Working
- **Best for:** Most websites, fastest results
- **Get API Key:** https://firecrawl.dev
- **Type:** Fast web scraping API

#### 2. Exa Search
- **Status:** ✅ Working
- **Best for:** AI-powered content extraction
- **Get API Key:** https://exa.ai
- **Type:** Semantic search and extraction

#### 3. Browserbase
- **Status:** ✅ Working
- **Best for:** JavaScript-heavy websites
- **Get API Key:** https://browserbase.com
- **Type:** Full browser automation

### AI Providers (2 Working)

#### 1. OpenRouter
- **Status:** ✅ Working
- **Free Models:** 8+ available (check website for current list)
- **Get API Key:** https://openrouter.ai/keys
- **Check Models:** https://openrouter.ai/models

**Free Models:**
1. `google/gemma-2-9b-it:free` - Google Gemma 2 9B ⭐
2. `meta-llama/llama-3.2-3b-instruct:free` - Llama 3.2 3B Instruct
3. `meta-llama/llama-3.1-8b-instruct:free` - Llama 3.1 8B Instruct
4. `microsoft/phi-3-mini-128k-instruct:free` - Phi-3 Mini 128K
5. `qwen/qwen-2-7b-instruct:free` - Qwen 2 7B Instruct
6. `mistralai/mistral-7b-instruct:free` - Mistral 7B Instruct
7. `huggingfaceh4/zephyr-7b-beta:free` - Zephyr 7B Beta
8. `openchat/openchat-7b:free` - OpenChat 7B

**Note:** Free models change frequently. Visit https://openrouter.ai/models to see current offerings.

**Paid Models:**
- `openai/gpt-4o` - GPT-4o
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- `google/gemini-pro-1.5` - Gemini Pro 1.5
- `meta-llama/llama-3.1-70b-instruct` - Llama 3.1 70B Instruct

#### 2. Chutes AI
- **Status:** ✅ Working
- **Free Models:** 5 available
- **Paid Models:** 2 available
- **Get API Key:** https://chutes.ai

**Free Models:**
1. `unsloth/gemma-3-4b-it` - Gemma 3 4B Instruct
2. `zai-org/GLM-4.5-Air` - GLM 4.5 Air
3. `meituan-longcat/LongCat-Flash-Chat-FP8` - LongCat Flash Chat
4. `openai/gpt-oss-20b` - GPT OSS 20B
5. `Alibaba-NLP/Tongyi-DeepResearch-30B-A3B` - Tongyi DeepResearch 30B ⭐

**Paid Models:**
- `MiniMaxAI/MiniMax-M2` - MiniMax M2 ($0.15/$0.45)
- `deepseek-ai/DeepSeek-R1-0528-Qwen3-8B` - DeepSeek R1 Qwen3 8B ($0.02/$0.35)

---

## ❌ Not Working Services

### Brave Search
- **Status:** ❌ Not Working
- **Reason:** CORS restrictions prevent client-side requests
- **Alternative:** Use Firecrawl, Exa, or Browserbase instead
- **Note:** Would require backend proxy to work

---

## 🎯 Recommended Setups

### Setup 1: Best for Most Users
```
Crawler: Firecrawl
AI Provider: OpenRouter
AI Model: Google Gemma 2 9B (Free)
```

**Why:**
- Firecrawl is fast and reliable
- OpenRouter has the most free model options
- Gemma 2 9B has excellent performance

**Get API Keys:**
1. Firecrawl: https://firecrawl.dev
2. OpenRouter: https://openrouter.ai/keys

### Setup 2: Best Free Quality
```
Crawler: Firecrawl
AI Provider: Chutes
AI Model: Tongyi DeepResearch 30B (Free)
```

**Why:**
- Largest free model available (30B parameters)
- Excellent for complex color analysis
- Good alternative to paid models

**Get API Keys:**
1. Firecrawl: https://firecrawl.dev
2. Chutes: https://chutes.ai

### Setup 3: Fast and Light
```
Crawler: Exa Search
AI Provider: OpenRouter
AI Model: Llama 3.2 3B Instruct (Free)
```

**Why:**
- Fast content extraction
- Small model for quick results
- Best for simple color schemes

**Get API Keys:**
1. Exa: https://exa.ai
2. OpenRouter: https://openrouter.ai/keys

### Setup 4: Premium Quality (Paid)
```
Crawler: Browserbase
AI Provider: OpenRouter
AI Model: Claude 3.5 Sonnet (Paid)
```

**Why:**
- Browserbase handles JavaScript-heavy sites
- Claude 3.5 Sonnet is best-in-class for analysis
- Professional-grade results

**Get API Keys:**
1. Browserbase: https://browserbase.com
2. OpenRouter: https://openrouter.ai/keys

---

## 📊 Comparison

| Service | Type | Free? | Working? | Best For |
|---------|------|-------|----------|----------|
| **Firecrawl** | Crawler | ✅ Trial | ✅ Yes | Most sites |
| **Exa Search** | Crawler | ✅ Trial | ✅ Yes | Semantic extraction |
| **Browserbase** | Crawler | ✅ Trial | ✅ Yes | JS-heavy sites |
| **Brave Search** | Crawler | ✅ Yes | ❌ No | N/A (CORS) |
| **OpenRouter** | AI | ✅ 8+ models | ✅ Yes | Most users |
| **Chutes** | AI | ✅ 5 models | ✅ Yes | Large models |

---

## 🚀 Quick Start

### 1. Choose Your Services
Pick one crawler and one AI provider from the working options above.

### 2. Get API Keys
Visit the links provided and sign up for API keys.

### 3. Configure in App
```
1. Select your crawler (e.g., Firecrawl)
2. Select your AI provider (e.g., OpenRouter)
3. Select a free model
4. Enter your API keys
5. Click "Save Keys" (optional)
```

### 4. Generate Theme
```
1. Enter a website URL
2. Click "Generate Theme"
3. Wait 30-60 seconds
4. Download your themes!
```

---

## 💡 Tips

### For Best Results
1. **Use Firecrawl** for most websites
2. **Choose OpenRouter** for more model options
3. **Try different models** if results aren't good
4. **Save your keys** to avoid re-entering

### If You Get Errors
1. **Check API keys** are correct
2. **Verify account** has credits/quota
3. **Try different crawler** if one fails
4. **Switch AI model** if generation fails

### Model Selection Guide
- **Gemma 2 9B (OpenRouter)**: Best general purpose ⭐
- **Tongyi DeepResearch 30B (Chutes)**: Largest free model
- **Llama 3.2 3B (OpenRouter)**: Fastest, for simple sites
- **Phi-3 Mini 128K (OpenRouter)**: Long context support
- **GPT OSS 20B (Chutes)**: Good balance
- **Claude 3.5 Sonnet (Paid)**: Best quality overall

---

## 📞 Support

### If Something Doesn't Work
1. Check this guide for working services
2. Read FIXES.md for detailed troubleshooting
3. Try a different service combination
4. Report issues on GitHub

### Resources
- Full Documentation: README.md
- Bug Fixes: FIXES.md
- Quick Start: QUICKSTART.md
- Deployment: DEPLOYMENT.md

---

**Last Updated:** 2025-11-06
**Total Free Models:** 13+ (8+ OpenRouter + 5 Chutes)
**Working Crawlers:** 3 (Firecrawl, Exa, Browserbase)
**Note:** OpenRouter models change frequently - always check https://openrouter.ai/models
