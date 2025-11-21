import { AlertCircle, RefreshCw } from "lucide-react";
import { InputSelector } from "./components/InputSelector";
import { APIKeyConfig } from "./components/APIKeyConfig";
import { ServiceSelector } from "./components/ServiceSelector";
import { DeepAnalysisControls } from "./components/DeepAnalysisControls";
import { ThemePreview } from "./components/ThemePreview";
import { ThinkingProcess } from "./components/ThinkingProcess";
import type { CrawlerResult } from "./types/theme";
import { fetchWebsiteContent } from "./services/fetcher";
import { analyzeWebsiteColors } from "./services/ai";
import { createUserStylePackage } from "./services/generators";
import { runDeepAnalysisPipeline } from "./services/deep-analysis";
import { convertToThemePackage } from "./services/deep-analysis/bridge";
import { MHTMLParser } from "./utils/mhtml-parser";
import {
  parseWebpageDirectory,
  groupCSSClassesByPurpose,
} from "./utils/directory-parser";
import { useVersion } from "./hooks/useVersion";
import { useAppStore } from "./store/useAppStore";
import catppuccinLogo from "/catppuccin.png";

function App() {
  const version = useVersion();

  // Store hooks
  const {
    aiProvider,
    aiModel,
    aiKey,
    discoveredOllamaModels,
    setAIProvider,
    setAIModel,
    setAIKey,
    setDiscoveredOllamaModels,
  } = useAppStore();

  const {
    enableDeepAnalysis,
    flavor,
    accent,
    useV3Generator,
    enableCascadingGradients,
    gradientCoverage,
    setEnableDeepAnalysis,
    setFlavor,
    setAccent,
    setUseV3Generator,
    setEnableCascadingGradients,
    setGradientCoverage,
  } = useAppStore();

  const {
    isProcessing,
    error,
    thinkingSteps,
    setIsProcessing,
    setError,
    setProgress,
    setThinkingSteps,
    updateThinkingStep,
    resetUI,
  } = useAppStore();

  const {
    themePackage,
    lastCrawlerResult,
    lastSource,
    lastAIConfig,
    lastUploadedFileName,
    lastUploadedDirPath,
    hasCompleted,
    setThemePackage,
    setLastCrawlerResult,
    setLastSource,
    setLastAIConfig,
    setLastUrl,
    setLastUploadedFileName,
    setLastUploadedDirPath,
    setHasCompleted,
  } = useAppStore();

  const aiChangedSinceLast = !!(
    lastAIConfig &&
    (lastAIConfig.provider !== aiProvider ||
      lastAIConfig.model !== aiModel ||
      lastAIConfig.apiKey !== aiKey)
  );
  const canRegenerate = hasCompleted && aiChangedSinceLast;

  const handleReset = () => {
    resetUI();
    setThemePackage(null);
  };

  const handleGenerate = async (url: string) => {
    if (aiProvider !== "ollama" && !aiKey) {
      setError("Please provide your AI API key");
      return;
    }

    setIsProcessing(true);
    setError("");
    setProgress("Starting...");
    setThemePackage(null);
    setHasCompleted(false);
    setLastUrl(url);
    setLastUploadedFileName("");
    setLastUploadedDirPath("");

    try {
      // Fast regenerate: use cached content if available
      if (canRegenerate && lastCrawlerResult && lastSource === "direct-fetch") {
        // Skip fetching, use cached content
        setThinkingSteps([
          {
            id: "analyze",
            title: "AI Color Analysis",
            description: "Re-analyzing color scheme with new AI config",
            status: "in_progress",
          },
          {
            id: "map",
            title: "Mapping to Catppuccin",
            description: "Mapping colors to Catppuccin palette",
            status: "pending",
          },
          {
            id: "generate",
            title: "Generating Themes",
            description: "Creating Stylus, LESS, and CSS themes",
            status: "pending",
          },
        ]);
        setProgress("Using cached content for fast regeneration...");
        await processContent(lastCrawlerResult, "direct-fetch");
        return;
      }

      // Normal generation: fetch from URL
      setThinkingSteps([
        {
          id: "fetch",
          title: "Fetching Website",
          description: "Downloading website content and extracting colors",
          status: "in_progress",
        },
        {
          id: "analyze",
          title: "AI Color Analysis",
          description: "Analyzing color scheme with AI",
          status: "pending",
        },
        {
          id: "map",
          title: "Mapping to Catppuccin",
          description: "Mapping colors to Catppuccin palette",
          status: "pending",
        },
        {
          id: "generate",
          title: "Generating Themes",
          description: "Creating Stylus, LESS, and CSS themes",
          status: "pending",
        },
      ]);

      // Step 1: Fetch website content directly
      setProgress("Fetching website content...");
      const fetchResult = await fetchWebsiteContent(url);

      if (fetchResult.error) {
        updateThinkingStep("fetch", {
          status: "error",
          details: fetchResult.error,
        });
        throw new Error(`Failed to fetch website: ${fetchResult.error}`);
      }

      updateThinkingStep("fetch", {
        status: "completed",
        details: `Found ${fetchResult.colors.length} colors from ${fetchResult.title}`,
      });

      // Convert to crawler-compatible format
      const crawlerResult: CrawlerResult = {
        url: fetchResult.url,
        title: fetchResult.title,
        content: fetchResult.html,
        html: fetchResult.html,
        colors: fetchResult.colors,
      };

      setLastCrawlerResult(crawlerResult);
      setLastSource("direct-fetch");
      await processContent(crawlerResult, "direct-fetch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProgress("");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (aiProvider !== "ollama" && !aiKey) {
      setError("Please provide your AI API key");
      return;
    }

    setIsProcessing(true);
    setError("");
    setProgress("Starting...");
    setThemePackage(null);
    setHasCompleted(false);
    setLastUrl(null);
    setLastUploadedDirPath("");

    try {
      // Check if this is the same file as last time
      const isSameFile = file.name === lastUploadedFileName;

      // Fast regenerate: use cached content if available AND same file
      if (
        canRegenerate &&
        lastCrawlerResult &&
        lastSource === "mhtml-upload" &&
        isSameFile
      ) {
        // Skip parsing, use cached content
        setThinkingSteps([
          {
            id: "analyze",
            title: "AI Color Analysis",
            description: "Re-analyzing color scheme with new AI config",
            status: "in_progress",
          },
          {
            id: "map",
            title: "Mapping to Catppuccin",
            description: "Mapping colors to Catppuccin palette",
            status: "pending",
          },
          {
            id: "generate",
            title: "Generating Themes",
            description: "Creating Stylus, LESS, and CSS themes",
            status: "pending",
          },
        ]);
        setProgress("Using cached content for fast regeneration...");
        await processContent(lastCrawlerResult, "mhtml-upload");
        return;
      }

      // Normal generation: parse MHTML file
      setThinkingSteps([
        {
          id: "parse",
          title: "Parsing MHTML File",
          description: "Extracting website content from file",
          status: "in_progress",
        },
        {
          id: "analyze",
          title: "AI Color Analysis",
          description: "Analyzing color scheme with AI",
          status: "pending",
        },
        {
          id: "map",
          title: "Mapping to Catppuccin",
          description: "Mapping colors to Catppuccin palette",
          status: "pending",
        },
        {
          id: "generate",
          title: "Generating Themes",
          description: "Creating Stylus, LESS, and CSS themes",
          status: "pending",
        },
      ]);

      // Step 1: Parse MHTML file
      setProgress("Parsing MHTML file...");
      const crawlerResult = await MHTMLParser.parseFile(file);

      updateThinkingStep("parse", {
        status: "completed",
        details: `Parsed ${file.name} - Found ${crawlerResult.colors.length} colors`,
      });

      setLastCrawlerResult(crawlerResult);
      setLastSource("mhtml-upload");
      setLastUploadedFileName(file.name);
      await processContent(crawlerResult, "mhtml-upload");
    } catch (err) {
      const currentStep = thinkingSteps.find((s) => s.status === "in_progress");
      if (currentStep) {
        updateThinkingStep(currentStep.id, {
          status: "error",
          details: err instanceof Error ? err.message : "Parse failed",
        });
      }
      setError(err instanceof Error ? err.message : "An error occurred");
      setProgress("");
      setIsProcessing(false);
    }
  };

  const handleDirectoryUpload = async (files: FileList) => {
    if (aiProvider !== "ollama" && !aiKey) {
      setError("Please provide your AI API key");
      return;
    }

    setIsProcessing(true);
    setError("");
    setProgress("Starting...");
    setThemePackage(null);
    setHasCompleted(false);
    setLastUrl(null);
    setLastUploadedFileName("");

    try {
      // Check if this is the same directory as last time
      const dirPath = files[0]?.webkitRelativePath?.split("/")[0] || "";
      const isSameDirectory = dirPath === lastUploadedDirPath && dirPath !== "";

      // Fast regenerate: use cached content if available AND same directory
      if (
        canRegenerate &&
        lastCrawlerResult &&
        lastSource === "directory-upload" &&
        isSameDirectory
      ) {
        // Skip parsing, use cached content
        setThinkingSteps([
          {
            id: "analyze",
            title: "AI Color & Class Mapping",
            description: "Re-analyzing colors with new AI config",
            status: "in_progress",
          },
          {
            id: "map",
            title: "Mapping to Catppuccin",
            description: "Creating detailed color mappings",
            status: "pending",
          },
          {
            id: "generate",
            title: "Generating Enhanced Theme",
            description: "Creating theme with class-specific rules",
            status: "pending",
          },
        ]);
        setProgress("Using cached content for fast regeneration...");
        await processContent(lastCrawlerResult, "directory-upload");
        return;
      }

      // Normal generation: parse directory
      setThinkingSteps([
        {
          id: "parse",
          title: "Analyzing Directory",
          description: "Parsing HTML and CSS files from directory",
          status: "in_progress",
        },
        {
          id: "css-analyze",
          title: "CSS Class Analysis",
          description: "Identifying CSS classes and their usage",
          status: "pending",
        },
        {
          id: "analyze",
          title: "AI Color & Class Mapping",
          description:
            "Analyzing colors and generating class-specific mappings",
          status: "pending",
        },
        {
          id: "map",
          title: "Mapping to Catppuccin",
          description: "Creating detailed color and class mappings",
          status: "pending",
        },
        {
          id: "generate",
          title: "Generating Enhanced Theme",
          description: "Creating theme with class-specific rules",
          status: "pending",
        },
      ]);

      // Step 1: Parse directory
      setProgress("Analyzing webpage directory...");
      const analysis = await parseWebpageDirectory(files);

      updateThinkingStep("parse", {
        status: "completed",
        details: `Found ${analysis.colors.length} colors, ${analysis.cssClasses.length} CSS classes`,
      });

      // Step 2: Group CSS classes
      updateThinkingStep("css-analyze", { status: "in_progress" });
      setProgress("Analyzing CSS classes...");

      const groupedClasses = groupCSSClassesByPurpose(analysis.cssClasses);
      const totalClasses = Object.values(groupedClasses).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      updateThinkingStep("css-analyze", {
        status: "completed",
        details: `Categorized ${totalClasses} classes: ${groupedClasses.buttons.length} buttons, ${groupedClasses.links.length} links, ${groupedClasses.backgrounds.length} backgrounds`,
      });

      // Convert to CrawlerResult format with enhanced data
      const crawlerResult: CrawlerResult & { cssAnalysis?: any } = {
        url: "local-directory",
        title: analysis.title,
        content: analysis.html,
        html: analysis.html,
        colors: analysis.colors || [],
        cssAnalysis: {
          classes: analysis.cssClasses,
          grouped: groupedClasses,
          inlineStyles: analysis.inlineStyles,
          linkedStyles: analysis.linkedStyles,
          structure: analysis.structure,
        },
      };

      setLastCrawlerResult(crawlerResult);
      setLastSource("directory-upload");
      setLastUploadedDirPath(dirPath);
      await processContent(crawlerResult, "directory-upload");
    } catch (err) {
      const currentStep = thinkingSteps.find((s) => s.status === "in_progress");
      if (currentStep) {
        updateThinkingStep(currentStep.id, {
          status: "error",
          details: err instanceof Error ? err.message : "Parse failed",
        });
      }
      setError(err instanceof Error ? err.message : "An error occurred");
      setProgress("");
      setIsProcessing(false);
    }
  };

  const processContent = async (
    crawlerResult: CrawlerResult,
    source: string
  ) => {
    try {
      // Check if deep analysis is enabled
      if (enableDeepAnalysis) {
        // === DEEP ANALYSIS PIPELINE ===

        // Step 2: Deep Analysis
        updateThinkingStep("analyze", {
          status: "in_progress",
          description:
            "Deep website analysis with CSS variables, SVGs, and design system detection",
        });
        setProgress("Running deep analysis...");

        const result = await runDeepAnalysisPipeline({
          url: crawlerResult.url,
          flavor,
          mainAccent: accent,
          mapper: {
            provider: aiProvider,
            apiKey: aiProvider !== "ollama" ? aiKey : undefined,
            model: aiModel,
            enableVariableMapping: true,
            enableSVGMapping: true,
            enableSelectorMapping: true,
            useAIForVariables: true,
            useAIForSVGs: true,
            useAIForSelectors: true,
          },
          useV3Generator,
          userstyleV3: useV3Generator
            ? {
                defaultFlavor: flavor,
                defaultAccent: accent,
                enableCascadingGradients,
                gradientCoverage,
              }
            : undefined,
        });

        updateThinkingStep("analyze", {
          status: "completed",
          details: `Analyzed ${result.analysis.cssVariables.length} CSS variables, ${result.analysis.svgs.length} SVGs, and ${result.analysis.selectorGroups.length} selector groups`,
        });

        // Step 3: AI Mapping
        updateThinkingStep("map", {
          status: "in_progress",
          description: "AI-powered precision mapping to Catppuccin colors",
        });

        // Small delay to show the step
        await new Promise((resolve) => setTimeout(resolve, 300));

        updateThinkingStep("map", {
          status: "completed",
          details: `Mapped ${result.mappings.stats.mappedVariables} variables, ${result.mappings.stats.processedSVGs} SVGs, ${result.mappings.stats.mappedSelectors} selectors`,
        });

        // Step 4: Generate theme
        updateThinkingStep("generate", {
          status: "in_progress",
          description: "Generating priority-layered LESS theme",
        });
        setProgress("Generating masterpiece theme...");

        // Convert to ThemePackage format
        const pkg = convertToThemePackage(result, source as any, aiModel);

        // Calculate total coverage as average
        const totalCoverage = Math.round(
          (result.userstyle.coverage.variableCoverage +
            result.userstyle.coverage.svgCoverage +
            result.userstyle.coverage.selectorCoverage) /
            3
        );

        updateThinkingStep("generate", {
          status: "completed",
          details: `Generated ${flavor} theme with ${totalCoverage}% average coverage`,
        });

        setThemePackage(pkg);
        setLastAIConfig({
          provider: aiProvider,
          model: aiModel,
          apiKey: aiKey,
        });
        setHasCompleted(true);
        setProgress("");
      } else {
        // === GENERIC ANALYSIS (OLD SYSTEM) ===

        // Step 2: Analyze colors with AI
        updateThinkingStep("analyze", { status: "in_progress" });
        setProgress("Analyzing colors with AI...");

        const { analysis, mappings } = await analyzeWebsiteColors(
          crawlerResult,
          {
            provider: aiProvider,
            apiKey: aiKey,
            model: aiModel,
          }
        );

        updateThinkingStep("analyze", {
          status: "completed",
          details: `Identified ${mappings.length} color mappings using ${aiProvider}/${aiModel}`,
        });

        // Step 3: Map colors
        updateThinkingStep("map", {
          status: "in_progress",
          description: "Creating semantic color mappings for UI elements",
        });

        // Small delay to show the step
        await new Promise((resolve) => setTimeout(resolve, 300));

        updateThinkingStep("map", {
          status: "completed",
          details: `Mapped colors for buttons, text, backgrounds, and more`,
        });

        // Step 4: Generate UserStyle theme
        updateThinkingStep("generate", { status: "in_progress" });
        setProgress("Generating UserStyle theme...");

        const pkg = createUserStylePackage(
          crawlerResult.url,
          mappings,
          analysis.accentColors,
          source as any,
          aiModel,
          (crawlerResult as any).cssAnalysis
        );

        updateThinkingStep("generate", {
          status: "completed",
          details: "Generated themes for Latte, Frappé, Macchiato, and Mocha",
        });

        setThemePackage(pkg);
        setLastAIConfig({
          provider: aiProvider,
          model: aiModel,
          apiKey: aiKey,
        });
        setHasCompleted(true);
        setProgress("");
      }
    } catch (err) {
      // Mark current step as error
      const currentStep = thinkingSteps.find((s) => s.status === "in_progress");
      if (currentStep) {
        updateThinkingStep(currentStep.id, {
          status: "error",
          details: err instanceof Error ? err.message : "Processing failed",
        });
      }
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctp-base via-ctp-mantle to-ctp-crust text-ctp-text">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          {/* Catppuccin Icon */}
          <div className="flex justify-center mb-6">
            <img
              src={catppuccinLogo}
              alt="Catppuccin"
              onError={(e) => {
                console.error("Image failed to load:", e);
                // Cast to HTMLImageElement and set fallback
                if (e.currentTarget instanceof HTMLImageElement) {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%2345475a'/%3E%3Ccircle cx='50' cy='50' r='40' fill='%23cba6f7'/%3E%3Cpath d='M30,30 L70,30 L70,70 L30,70 Z' fill='%23cba6f7'/%3E%3Cpath d='M40,40 L60,40 L60,60 L40,60 Z' fill='%23f5e0dc'/%3E%3C/svg%3E";
                }
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg shadow-ctp-accent/50 hover:shadow-ctp-accent/70 transition-all duration-300 hover:scale-110"
            />
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-ctp-accent to-ctp-bi-accent bg-clip-text text-transparent">
            Catppuccin Theme Generator
          </h1>
          <p className="text-ctp-subtext0 text-lg">
            Analyze any website and generate beautiful Catppuccin themes in
            Stylus, LESS, and CSS
          </p>
          <p className="text-ctp-green text-sm mt-2">
            ✨ Generated and powered by advanced AI models for accurate color
            analysis! ✨
          </p>
          <a
            href="https://github.com/catppuccin/catppuccin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-ctp-lavender hover:text-ctp-mauve underline transition-colors"
          >
            Learn more about Catppuccin
          </a>
          <a
            href="https://github.com/openstyles/stylus"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-sm text-ctp-lavender hover:text-ctp-mauve underline transition-colors"
          >
            Learn more about Stylus
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <h2 className="text-2xl font-bold mb-6 text-ctp-accent">
                AI Configuration
              </h2>

              <ServiceSelector
                aiProvider={aiProvider}
                onAIProviderChange={setAIProvider}
                aiModel={aiModel}
                onAIModelChange={setAIModel}
                ollamaModels={discoveredOllamaModels}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <APIKeyConfig
                aiProvider={aiProvider}
                onKeyChange={setAIKey}
                onPickModel={setAIModel}
                onModelsDiscovered={setDiscoveredOllamaModels}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <h2 className="text-2xl font-bold mb-6 text-ctp-accent">
                Theme Options
              </h2>
              <DeepAnalysisControls
                enabled={enableDeepAnalysis}
                flavor={flavor}
                accent={accent}
                onEnabledChange={setEnableDeepAnalysis}
                onFlavorChange={setFlavor}
                onAccentChange={setAccent}
                disabled={isProcessing}
                useV3Generator={useV3Generator}
                onUseV3GeneratorChange={setUseV3Generator}
                enableCascadingGradients={enableCascadingGradients}
                onEnableCascadingGradientsChange={setEnableCascadingGradients}
                gradientCoverage={gradientCoverage}
                onGradientCoverageChange={setGradientCoverage}
              />
            </div>

            <div className="bg-ctp-surface0/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-ctp-surface2">
              <h2 className="text-2xl font-bold mb-6 text-ctp-accent">
                Generate Theme
              </h2>

              <InputSelector
                onURLSubmit={handleGenerate}
                onFileSelect={handleFileUpload}
                onDirectorySelect={handleDirectoryUpload}
                disabled={isProcessing}
                canRegenerate={canRegenerate}
              />
            </div>
          </div>

          {/* Right Column - Preview & Thinking Process */}
          <div className="space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="bg-ctp-red/20 border-2 border-ctp-red rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-ctp-red flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ctp-red mb-1">
                      Error
                    </h3>
                    <p className="text-ctp-text text-sm mb-3">{error}</p>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 bg-ctp-red hover:bg-ctp-red/80 rounded-lg transition-colors text-ctp-base font-medium"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset and Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Thinking Process Display */}
            {(isProcessing || thinkingSteps.length > 0) && (
              <ThinkingProcess steps={thinkingSteps} onReset={handleReset} />
            )}

            {!isProcessing && !error && (
              <ThemePreview themePackage={themePackage} />
            )}
          </div>
        </div>

        <footer className="text-center text-ctp-overlay0 text-sm mt-12 pb-8">
          <p className="mb-2">
            Made with Catppuccin |
            <a
              href="https://github.com/catppuccin/catppuccin"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hover:text-ctp-lavender transition-colors"
            >
              GitHub
            </a>
          </p>
          <p className="text-ctp-overlay1 text-xs mb-3">
            Generated by Github Copilot, Claude Code, Roo Code, OpenAI Codex,
            Gemini Code assistant
            <br />
            Models: Claude Opus 4.1, Claude Sonnet 4.5, MiniMax M2, GPT 4.1, GPT
            5, GPT 5 Codex, DeepSeek R1 0528 Qwen 3, Gemini 2.5 Pro
          </p>

          {/* Version Banner */}
          {version && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ctp-accent/10 to-ctp-bi-accent/10 rounded-lg border border-ctp-accent/20">
              <div className="flex items-center gap-2">
                <span className="text-ctp-accent font-mono font-semibold">
                  v{version.version}
                </span>
                <span className="text-ctp-overlay1">•</span>
                <span className="text-ctp-overlay0 text-xs">
                  {version.commitHash}
                </span>
                {version.branchName !== "main" && (
                  <>
                    <span className="text-ctp-overlay1">•</span>
                    <span className="text-ctp-yellow text-xs">
                      {version.branchName}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

export default App;
