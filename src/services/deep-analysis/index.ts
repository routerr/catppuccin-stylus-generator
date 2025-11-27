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
import type { UserstyleV4Config } from "../generators/userstyle-v4";
import type { DeepMapperConfig } from "../ai/deep-mapper";
import { fetchWithDeepAnalysis } from "../fetcher-v2";
import { mapWithDeepAnalysis } from "../ai/deep-mapper";
import { generateUserstyleV2 } from "../generators/userstyle-v2";
import { generateUserstyleV3 } from "../generators/userstyle-v3";
import { generateUserstyleV4 } from "../generators/userstyle-v4";

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

export type UserstyleV4Overrides = Partial<
  Pick<UserstyleV4Config, "defaultFlavor" | "defaultAccent">
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
  /**
   * Use V4 generator for "Master Piece" quality themes
   * @default false
   */
  useV4Generator?: boolean;
  userstyleV4?: UserstyleV4Overrides;
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
    useV4Generator,
    userstyleV4,
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

  if (useV4Generator) {
    // Use V4 generator (Master Piece)
    const v4Config: UserstyleV4Config = {
      url,
      defaultFlavor: userstyleV4?.defaultFlavor ?? flavor,
      defaultAccent: userstyleV4?.defaultAccent ?? mainAccent,
    };
    generated = generateUserstyleV4(analysis, mappings, v4Config);
  } else if (useV3Generator) {
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
