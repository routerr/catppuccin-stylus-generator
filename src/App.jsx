import { useState, useEffect } from 'react';
import './App.css';
import UrlInput from './components/UrlInput';
import Settings from './components/Settings';
import Output from './components/Output';
import { scrapeUrl } from './services/scraper';
import { generateTheme } from './services/ai';

const catppuccinFlavors = ['Latte', 'Frappé', 'Macchiato', 'Mocha'];
const accentColors = ["Rosewater", "Flamingo", "Pink", "Mauve", "Red", "Maroon", "Peach", "Yellow", "Green", "Teal", "Blue", "Sapphire", "Sky", "Lavender", "Gray"];
const scraperServices = ['Browserbase', 'Exa Search', 'Firecrawl', 'Brave Search'];
const aiServices = ['OpenRouter', 'Chutes'];

function App() {
  const [url, setUrl] = useState('');
  const [flavor, setFlavor] = useState(catppuccinFlavors[0]);
  const [accent, setAccent] = useState(accentColors[0]);
  const [scraper, setScraper] = useState(scraperServices[0]);
  const [scraperApiKey, setScraperApiKey] = useState('');
  const [aiService, setAiService] = useState(aiServices[0]);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aiService === 'OpenRouter') {
      // setAiModel(openRouterModels.free[0]); // This is now handled in Settings.jsx
    } else {
      setAiModel('');
    }
  }, [aiService]);

  const handleGenerate = async () => {
    setLoading(true);
    setOutput('');
    try {
      const content = await scrapeUrl(scraper, url, scraperApiKey);
      const prompt = `Generate a Catppuccin ${flavor} theme with ${accent} accent for the following website content:\n\n${content}`;
      const theme = await generateTheme(aiService, prompt, aiApiKey, aiModel);
      setOutput(theme);
    } catch (error) {
      console.error(error);
      setOutput(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Catppuccin Stylus Generator</h1>
      </header>
      <main>
        <UrlInput url={url} setUrl={setUrl} />
        <Settings
          flavor={flavor}
          setFlavor={setFlavor}
          accent={accent}
          setAccent={setAccent}
          scraper={scraper}
          setScraper={setScraper}
          scraperApiKey={scraperApiKey}
          setScraperApiKey={setScraperApiKey}
          aiService={aiService}
          setAiService={setAiService}
          aiApiKey={aiApiKey}
          setAiApiKey={setAiApiKey}
          aiModel={aiModel}
          setAiModel={setAiModel}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
        <Output output={output} />
      </main>
      <footer className="App-footer">
        <p>Powered by Gemini</p>
      </footer>
    </div>
  );
}

export default App;
