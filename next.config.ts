import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The search model runs in the Node.js function and ships with it.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  outputFileTracingIncludes: {
    "/api/ask": ["./models/**/*", "./node_modules/onnxruntime-node/**/*", "./node_modules/onnxruntime-common/**/*"],
  },
  // GPU providers and other platforms are never used on the serverless CPU runtime.
  outputFileTracingExcludes: {
    "/api/ask": [
      "./node_modules/onnxruntime-node/bin/**/linux/x64/libonnxruntime_providers_cuda.so",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/libonnxruntime_providers_tensorrt.so",
      "./node_modules/onnxruntime-node/bin/**/darwin/**",
      "./node_modules/onnxruntime-node/bin/**/win32/**",
      "./node_modules/onnxruntime-node/bin/**/linux/arm64/**",
      "./node_modules/onnxruntime-web/**",
    ],
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
