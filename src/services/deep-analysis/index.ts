import type { AccentColor, CatppuccinFlavor } from '../../types/catppuccin';
import type {
  DeepAnalysisResult,
  DeepAnalysisConfig,
  MappingResult,
  GeneratedTheme,
} from '../../types/deep-analysis';
import type { AIProvider } from '../../types/theme';
import type { UserstyleV2Config } from '../generators/userstyle-v2';
import type { DeepMapperConfig } from '../ai/deep-mapper';
import { fetchWithDeepAnalysis } from '../fetcher-v2';
import { mapWithDeepAnalysis } from '../ai/deep-mapper';
import { generateUserstyleV2 } from '../generators/userstyle-v2';

export type DeepAnalysisFeatureToggle = Partial<
  Pick<
    DeepMapperConfig,
    | 'enableVariableMapping'
    | 'enableSVGMapping'
    | 'enableSelectorMapping'
    | 'useAIForVariables'
    | 'useAIForSVGs'
    | 'useAIForSelectors'
    | 'maxSelectors'
    | 'debug'
  >
>;

export interface DeepAnalysisMapperOptions extends DeepAnalysisFeatureToggle {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export type UserstyleV2Overrides = Partial<
  Pick<UserstyleV2Config, 'includeComments' | 'version'>
>;

export interface DeepAnalysisPipelineOptions {
  url: string;
  flavor: CatppuccinFlavor;
  mainAccent: AccentColor;
  fetchConfig?: Partial<DeepAnalysisConfig>;
  mapper: DeepAnalysisMapperOptions;
  userstyle?: UserstyleV2Overrides;
}

export interface DeepAnalysisPipelineResult {
  analysis: DeepAnalysisResult;
  mappings: MappingResult;
  userstyle: GeneratedTheme;
}

export async function runDeepAnalysisPipeline(
  options: DeepAnalysisPipelineOptions,
): Promise<DeepAnalysisPipelineResult> {
  const { url, flavor, mainAccent, fetchConfig, mapper, userstyle } = options;

  const analysis = await fetchWithDeepAnalysis(url, fetchConfig);

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

  const userstyleConfig: UserstyleV2Config = {
    url,
    flavor,
    mainAccent,
    includeComments: userstyle?.includeComments ?? true,
    version: userstyle?.version,
  };

  const generated = generateUserstyleV2(analysis, mappings, userstyleConfig);

  return {
    analysis,
    mappings,
    userstyle: generated,
  };
}
