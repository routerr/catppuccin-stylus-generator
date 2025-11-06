# Catppuccin Stylus Generator - Project Plan

This document outlines the plan for creating a web application that generates Catppuccin-based Stylus themes for any given URL.

## 1. Project Overview

The application will take a URL as input and generate a packed JSON file containing a Stylus-importable web theme. The theme will be based on the Catppuccin color palette, allowing users to choose from the four official flavors (Latte, Frappé, Macchiato, Mocha) and various accent colors.

## 2. Core Features

-   **URL Input**: A simple input field for the user to enter the target website's URL.
-   **Theme Customization**: Dropdowns to select the Catppuccin flavor and an accent color.
-   **Web Scraper Integration**:
    -   Support for multiple scraping services: Browserbase, Exa Search, Firecrawl, and Brave Search.
    -   Users will provide their own API keys for the selected service.
-   **AI-Powered Theme Generation**:
    -   Integration with AI models from OpenRouter and Chutes to generate the `.less` theme from the scraped web content.
    -   Users will provide their own API keys and choose from a list of models, including at least one free option from each provider.
-   **Output**: A downloadable JSON file containing the generated theme.

## 3. Tech Stack

-   **Frontend**: React 19
-   **Build Tool**: Vite 6
-   **Deployment**: GitHub Pages
-   **Backend (Suggestions)**:
    -   **Serverless**: Vercel, Netlify, Cloudflare Workers (for handling API calls securely).
    -   **Self-Hosted**: Node.js with Express, or Python with FastAPI.

## 4. Development Plan

The development will be broken down into the following subtasks:

1.  **Project Setup**:
    -   Initialize a new React project using Vite.
    -   Clean up the default project template.
    -   Create this `GEMINI.md` file.

2.  **UI/UX Development**:
    -   Create the main `App` component.
    -   Design and implement components for:
        -   URL input.
        -   API key inputs for scraper and AI services.
        -   Dropdowns for selecting the theme, accent, scraper, and AI model.
        -   A "Generate" button.
        -   An area to display the generated theme and a "Download JSON" button.

3.  **State Management**:
    -   Use React hooks (`useState`, `useContext`, or a state management library if needed) to manage the application's state, including form inputs and API responses.

4.  **API Integration**:
    -   Create separate modules for the web scraping and AI services.
    -   Implement functions to make API calls to each supported service. These functions will handle API key authentication and data fetching.

5.  **Core Application Logic**:
    -   Implement the main workflow in the `App` component:
        1.  On "Generate" button click, validate the user inputs.
        2.  Call the selected web scraper API to fetch the content of the target URL.
        3.  Construct a prompt for the AI model, including the scraped content and theme parameters.
        4.  Call the selected AI model API to generate the `.less` theme.
        5.  Process the AI's response.
        6.  Package the generated theme into a JSON object.
        7.  Enable the download button for the JSON file.

6.  **Documentation**:
    -   Create a `MANUAL.md` file with detailed instructions on:
        -   Project setup (cloning, installing dependencies).
        -   Configuration (API keys).
        -   Running the development server.
        -   Building the application for production.
        -   Deploying the application to GitHub Pages.

## 5. File Structure (Initial)

```
/
|-- public/
|-- src/
|   |-- assets/
|   |-- components/
|   |   |-- Header.jsx
|   |   |-- Footer.jsx
|   |   |-- UrlInput.jsx
|   |   |-- Settings.jsx
|   |   |-- Output.jsx
|   |-- services/
|   |   |-- scraper.js
|   |   |-- ai.js
|   |-- App.jsx
|   |-- index.css
|   |-- main.jsx
|-- .gitignore
|-- GEMINI.md
|-- index.html
|-- package.json
|-- vite.config.js
```
