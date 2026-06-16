import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // mammoth (used by /api/extract-doc) relies on Node-specific deps; keep it out
  // of the bundler so the route uses native Node require instead of bundling it.
  serverExternalPackages: ["mammoth"],
};

export default withNextIntl(nextConfig);
