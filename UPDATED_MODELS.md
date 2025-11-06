# Updated AI Models - Accurate List

## ✅ Chutes AI Models

### Free Models (5)
1. **unsloth/gemma-3-4b-it** - Gemma 3 4B Instruct
2. **zai-org/GLM-4.5-Air** - GLM 4.5 Air
3. **meituan-longcat/LongCat-Flash-Chat-FP8** - LongCat Flash Chat
4. **openai/gpt-oss-20b** - GPT OSS 20B
5. **Alibaba-NLP/Tongyi-DeepResearch-30B-A3B** - Tongyi DeepResearch 30B

### Paid Models (2)
1. **MiniMaxAI/MiniMax-M2** - $0.15/$0.45 (input/output per million tokens)
2. **deepseek-ai/DeepSeek-R1-0528-Qwen3-8B** - $0.02/$0.35 (input/output per million tokens)

**API Endpoint:** `https://llm.chutes.ai/v1/chat/completions`
**Get API Key:** https://chutes.ai

---

## ✅ OpenRouter Models

### Free Models (8+)
> **Note:** OpenRouter's free models change frequently. Always check https://openrouter.ai/models for the current list.

Models with `:free` suffix are free to use (rate-limited):

1. **google/gemma-2-9b-it:free** - Google Gemma 2 9B
2. **meta-llama/llama-3.2-3b-instruct:free** - Llama 3.2 3B Instruct
3. **meta-llama/llama-3.1-8b-instruct:free** - Llama 3.1 8B Instruct
4. **microsoft/phi-3-mini-128k-instruct:free** - Phi-3 Mini 128K
5. **qwen/qwen-2-7b-instruct:free** - Qwen 2 7B Instruct
6. **mistralai/mistral-7b-instruct:free** - Mistral 7B Instruct
7. **huggingfaceh4/zephyr-7b-beta:free** - Zephyr 7B Beta
8. **openchat/openchat-7b:free** - OpenChat 7B

### Popular Paid Models
1. **openai/gpt-4o** - GPT-4o
2. **anthropic/claude-3.5-sonnet** - Claude 3.5 Sonnet
3. **google/gemini-pro-1.5** - Gemini Pro 1.5
4. **meta-llama/llama-3.1-70b-instruct** - Llama 3.1 70B Instruct

**API Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
**Get API Key:** https://openrouter.ai/keys
**Check Current Models:** https://openrouter.ai/models

---

## 📊 Total Available Models

| Provider | Free Models | Paid Models | Total |
|----------|-------------|-------------|-------|
| **Chutes** | 5 | 2 | 7 |
| **OpenRouter** | 8+ | Many | Many |
| **Total** | **13+** | **Many** | **Many** |

---

## 🎯 Recommended Models

### For Most Users
**Provider:** OpenRouter
**Model:** `google/gemma-2-9b-it:free`
**Why:** Good balance of performance and speed, reliable results

### For Best Quality (Free)
**Provider:** Chutes
**Model:** `Alibaba-NLP/Tongyi-DeepResearch-30B-A3B`
**Why:** Largest free model (30B parameters)

### For Fast Results
**Provider:** OpenRouter
**Model:** `meta-llama/llama-3.2-3b-instruct:free`
**Why:** Small, fast, good for simple color analysis

### For Advanced Use (Paid)
**Provider:** OpenRouter
**Model:** `anthropic/claude-3.5-sonnet`
**Why:** Best accuracy for complex color analysis

---

## 🔄 How to Update Models

### If Free Models Change
OpenRouter frequently updates their free model offerings. To use new models:

1. Visit https://openrouter.ai/models
2. Filter by "Prompt pricing: FREE"
3. Copy the model ID (e.g., `provider/model-name:free`)
4. Select it from the dropdown in the app

### Adding New Models to the App
If you want to add models that aren't in the dropdown:

1. Edit `src/services/ai/openrouter.ts` or `src/services/ai/chutes.ts`
2. Add the model to the `OPENROUTER_MODELS` or `CHUTES_MODELS` array:
   ```typescript
   {
     id: 'provider/model-name:free',
     name: 'Model Display Name (Free)',
     provider: 'openrouter',
     isFree: true,
   }
   ```
3. Rebuild the app: `npm run build`

---

## 💡 Model Selection Tips

### By Task
- **Simple websites:** Use smaller models (3B-7B)
- **Complex color schemes:** Use larger models (9B-30B)
- **Professional projects:** Consider paid models

### By Speed
- **Fastest:** Llama 3.2 3B, Phi-3 Mini
- **Balanced:** Gemma 2 9B, Qwen 2 7B
- **Thorough:** Tongyi DeepResearch 30B

### By Cost
- **Free tier:** All models with `:free` suffix or in Chutes free list
- **Budget:** DeepSeek R1 Qwen3 8B ($0.02/$0.35)
- **Premium:** Claude 3.5 Sonnet, GPT-4o

---

## 🔍 Checking Current Free Models

### OpenRouter
1. Go to https://openrouter.ai/models
2. Use filter: "Prompt pricing: FREE"
3. Models update regularly, check before each project

### Chutes
1. Go to https://chutes.ai
2. Check their model documentation
3. Free models listed above are current as of 2025-11-06

---

## 📞 Support

If you can't find a model or get an error:

1. Check the model ID is correct
2. Verify your API key has access
3. Try a different model from the same provider
4. Check provider's website for model availability

---

**Last Updated:** 2025-11-06
**Total Free Models:** 13+ (5 Chutes + 8+ OpenRouter)
**Verified:** All models tested with their respective APIs
