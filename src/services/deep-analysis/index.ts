import type { AccentColor, CatppuccinFlavor } from "../../types/catppuccin";
import type {
  DeepAnalysisResult,
  DeepAnalysisConfig,
  MappingResult,
  GeneratedTheme,
} from "../../types/deep-analysis";
import type { AIProvider } from "../../types/theme";
import type { UserstyleV2Config } from "../generators/userstyle-v2";
import type { UserstyleV3Config } from "../generators/userstyle-v3";
import type { DeepMapperConfig } from "../ai/deep-mapper";
import { fetchWithDeepAnalysis } from "../fetcher-v2";
import { mapWithDeepAnalysis } from "../ai/deep-mapper";
import { generateUserstyleV2 } from "../generators/userstyle-v2";
import { generateUserstyleV3 } from "../generators/userstyle-v3";

export type DeepAnalysisFeatureToggle = Partial<
  Pick<
    DeepMapperConfig,
    | "enableVariableMapping"
    | "enableSVGMapping"
    | "enableSelectorMapping"
    | "useAIForVariables"
    | "useAIForSVGs"
    | "useAIForSelectors"
    | "maxSelectors"
    | "debug"
  >
>;

export interface DeepAnalysisMapperOptions extends DeepAnalysisFeatureToggle {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export type UserstyleV2Overrides = Partial<
  Pick<UserstyleV2Config, "includeComments" | "version">
>;

export type UserstyleV3Overrides = Partial<
  Pick<
    UserstyleV3Config,
    | "defaultFlavor"
    | "defaultAccent"
    | "includeComments"
    | "version"
    | "enableCascadingGradients"
    | "gradientCoverage"
  >
>;

export interface DeepAnalysisPipelineOptions {
  url: string;
  content?: string; // Optional raw HTML content (for uploads)
  flavor: CatppuccinFlavor;
  mainAccent: AccentColor;
  fetchConfig?: Partial<DeepAnalysisConfig>;
  mapper: DeepAnalysisMapperOptions;
  userstyle?: UserstyleV2Overrides;
  /**
   * Use V3 generator for dynamic multi-flavor support with cascading gradients
   * @default false (uses V2 for backwards compatibility)
   */
  useV3Generator?: boolean;
  userstyleV3?: UserstyleV3Overrides;
}

export interface DeepAnalysisPipelineResult {
  analysis: DeepAnalysisResult;
  mappings: MappingResult;
  userstyle: GeneratedTheme;
}

export async function runDeepAnalysisPipeline(
  options: DeepAnalysisPipelineOptions
): Promise<DeepAnalysisPipelineResult> {
  const {
    url,
    content,
    flavor,
    mainAccent,
    fetchConfig,
    mapper,
    userstyle,
    useV3Generator,
    userstyleV3,
  } = options;

  const analysis = await fetchWithDeepAnalysis(url, fetchConfig, content);

  const { provider, apiKey, model, ...overrides } = mapper;
  const mapperConfig: DeepMapperConfig = {
    provider,
    apiKey,
    model,
    flavor,
    mainAccent,
    enableVariableMapping: true,
    enableSVGMapping: true,
    enableSelectorMapping: true,
    useAIForVariables: true,
    useAIForSVGs: true,
    useAIForSelectors: true,
    ...overrides,
  };

  const mappings = await mapWithDeepAnalysis(analysis, mapperConfig);

  let generated: GeneratedTheme;

  if (useV3Generator) {
    // Use V3 generator with dynamic multi-flavor support
    const v3Config: UserstyleV3Config = {
      url,
      defaultFlavor: userstyleV3?.defaultFlavor ?? flavor,
      defaultAccent: userstyleV3?.defaultAccent ?? mainAccent,
      includeComments: userstyleV3?.includeComments ?? true,
      version: userstyleV3?.version ?? "v3-dynamic",
      enableCascadingGradients: userstyleV3?.enableCascadingGradients ?? true,
      gradientCoverage: userstyleV3?.gradientCoverage ?? "comprehensive",
    };

    generated = generateUserstyleV3(analysis, mappings, v3Config);
  } else {
    // Use V2 generator for backwards compatibility
    const userstyleConfig: UserstyleV2Config = {
      url,
      flavor,
      mainAccent,
      includeComments: userstyle?.includeComments ?? true,
      version: userstyle?.version,
    };

    generated = generateUserstyleV2(analysis, mappings, userstyleConfig);
  }

  return {
    analysis,
    mappings,
    userstyle: generated,
  };
}
