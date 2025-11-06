import React, { useEffect } from 'react';
import { openRouterModels } from '../models';

const catppuccinFlavors = ['Latte', 'Frappé', 'Macchiato', 'Mocha'];
const accentColors = ["Rosewater", "Flamingo", "Pink", "Mauve", "Red", "Maroon", "Peach", "Yellow", "Green", "Teal", "Blue", "Sapphire", "Sky", "Lavender", "Gray"];
const scraperServices = ['Browserbase', 'Exa Search', 'Firecrawl', 'Brave Search'];
const aiServices = ['OpenRouter', 'Chutes'];

const Settings = ({
  flavor, setFlavor,
  accent, setAccent,
  scraper, setScraper,
  scraperApiKey, setScraperApiKey,
  aiService, setAiService,
  aiApiKey, setAiApiKey,
  aiModel, setAiModel
}) => {

  useEffect(() => {
    if (aiService === 'OpenRouter') {
      setAiModel(openRouterModels.free[0]);
    } else {
      setAiModel('');
    }
  }, [aiService, setAiModel]);

  return (
    <div className="settings-section">
      <h2>Settings</h2>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Catppuccin Flavor:</label>
          <select value={flavor} onChange={(e) => setFlavor(e.target.value)}>
            {catppuccinFlavors.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="setting-item">
          <label>Accent Color:</label>
          <select value={accent} onChange={(e) => setAccent(e.target.value)}>
            {accentColors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="setting-item">
          <label>Scraper Service:</label>
          <select value={scraper} onChange={(e) => setScraper(e.target.value)}>
            {scraperServices.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {scraper === 'Brave Search' && <p style={{color: 'orange'}}>Brave Search does not support direct URL scraping. Please choose another service.</p>}
        </div>
        <div className="setting-item">
          <label>Scraper API Key:</label>
          <input type="password" value={scraperApiKey} onChange={(e) => setScraperApiKey(e.target.value)} />
        </div>
        <div className="setting-item">
          <label>AI Service:</label>
          <select value={aiService} onChange={(e) => setAiService(e.target.value)}>
            {aiServices.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {aiService === 'Chutes' && <p style={{color: 'orange'}}>Chutes is a platform for building AI apps and does not provide a direct model API. Please use OpenRouter.</p>}
        </div>
        <div className="setting-item">
          <label>AI API Key:</label>
          <input type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} />
        </div>
        <div className="setting-item">
          <label>AI Model:</label>
          {aiService === 'OpenRouter' ? (
            <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
              <optgroup label="Free Models">
                {openRouterModels.free.map(m => <option key={m} value={m}>{m}</option>)}
              </optgroup>
              <optgroup label="Paid Models">
                {openRouterModels.paid.map(m => <option key={m} value={m}>{m}</option>)}
              </optgroup>
            </select>
          ) : (
            <input type="text" value={aiModel} onChange={(e) => setAiModel(e.target.value)} disabled />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
