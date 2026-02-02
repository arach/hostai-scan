// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"agents.mdx": () => import("../content/docs/agents.mdx?collection=docs"), "all-rules.mdx": () => import("../content/docs/all-rules.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "rules-reference.mdx": () => import("../content/docs/rules-reference.mdx?collection=docs"), "rules/content.mdx": () => import("../content/docs/rules/content.mdx?collection=docs"), "rules/conversion.mdx": () => import("../content/docs/rules/conversion.mdx?collection=docs"), "rules/index.mdx": () => import("../content/docs/rules/index.mdx?collection=docs"), "rules/performance.mdx": () => import("../content/docs/rules/performance.mdx?collection=docs"), "rules/security.mdx": () => import("../content/docs/rules/security.mdx?collection=docs"), "rules/seo.mdx": () => import("../content/docs/rules/seo.mdx?collection=docs"), "rules/trust.mdx": () => import("../content/docs/rules/trust.mdx?collection=docs"), "scoring/extending.mdx": () => import("../content/docs/scoring/extending.mdx?collection=docs"), "scoring/index.mdx": () => import("../content/docs/scoring/index.mdx?collection=docs"), "specs/analytics-tracking.mdx": () => import("../content/docs/specs/analytics-tracking.mdx?collection=docs"), }),
};
export default browserCollections;