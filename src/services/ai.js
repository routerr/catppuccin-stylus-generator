export const generateTheme = async (aiService, prompt, apiKey, model) => {
  console.log(`Generating theme with ${aiService} and model ${model}`);

  try {
    if (aiService === 'OpenRouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);
      const data = await response.json();
      return data.choices[0].message.content;
    } else if (aiService === 'Chutes') {
      throw new Error('Chutes is a platform for building AI apps and does not provide a direct model API. Please use OpenRouter.');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }

  throw new Error('Invalid AI service selected');
};
