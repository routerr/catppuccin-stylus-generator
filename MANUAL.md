# Catppuccin Stylus Generator - Manual

This document provides instructions on how to set up, run, and deploy the Catppuccin Stylus Generator application.

## 1. Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd catppuccin-stylus-generator
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## 2. Configuration

To use the application, you need to provide your own API keys for the web scraper and AI services.

### 2.1. Web Scraper Services

The application supports the following scraper services: Browserbase, Exa Search, Firecrawl, and Brave Search.

You need to implement the API call for the service you want to use in `src/services/scraper.js`.

```javascript
// src/services/scraper.js

export const scrapeUrl = async (scraper, url, apiKey) => {
  console.log(`Scraping ${url} with ${scraper}`);

  // TODO: Implement the API call for your chosen scraper service.
  // Example for Browserbase:
  if (scraper === 'Browserbase') {
    const response = await fetch('https://api.browserbase.com/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    return data.html;
  }

  // Return dummy data for now
  return `<html><body><h1>Scraped content of ${url}</h1></body></html>`;
};
```

### 2.2. AI Services

The application supports OpenRouter and Chutes for AI theme generation.

You need to implement the API call for the service you want to use in `src/services/ai.js`.

```javascript
// src/services/ai.js

export const generateTheme = async (aiService, prompt, apiKey, model) => {
  console.log(`Generating theme with ${aiService} and model ${model}`);

  // TODO: Implement the API call for your chosen AI service.
  // Example for OpenRouter:
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
    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Return dummy data for now
  return `/* Generated .less theme */\n@background: #1e1e2e;\n@foreground: #cdd6f4;\n`;
};
```

Also, you should populate the AI model list in `src/components/Settings.jsx` based on the selected AI service.

## 3. Running the Application

To run the application in development mode, use the following command:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`.

## 4. Building for Production

To build the application for production, use the following command:

```bash
npm run build
```

This will create a `dist` directory with the production-ready files.

## 5. Deployment

The application is designed to be deployed on GitHub Pages.

1.  **Set the `homepage` field in `package.json`**:

    ```json
    "homepage": "https://<your-github-username>.github.io/<your-repository-name>",
    ```

2.  **Install `gh-pages`**:

    ```bash
    npm install gh-pages --save-dev
    ```

3.  **Add a `deploy` script to `package.json`**:

    ```json
    "scripts": {
      // ...
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist"
    }
    ```

4.  **Deploy the application**:

    ```bash
    npm run deploy
    ```

This will build the application and deploy it to your GitHub Pages site.
