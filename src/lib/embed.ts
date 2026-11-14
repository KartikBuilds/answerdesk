import path from "node:path";
import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// The embedding model ships with the app (Apache-2.0, ~23 MB), so search needs no API key and no network.
env.allowRemoteModels = false;
env.localModelPath = path.join(/* turbopackIgnore: true */ process.cwd(), "models");

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIMS = 384;

let extractor: Promise<FeatureExtractionPipeline> | undefined;

export async function embed(texts: string[]): Promise<number[][]> {
  extractor ??= pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "q8" }) as Promise<FeatureExtractionPipeline>;
  const out = await (await extractor)(texts, { pooling: "mean", normalize: true });
  return out.tolist() as number[][];
}
