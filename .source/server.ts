// @ts-nocheck
import * as __fd_glob_17 from "../content/docs/specs/analytics-tracking.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/scoring/index.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/scoring/extending.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/rules/trust.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/rules/seo.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/rules/security.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/rules/performance.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/rules/index.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/rules/conversion.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/rules/content.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/rules-reference.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/all-rules.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/agents.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/specs/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/scoring/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/rules/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "rules/meta.json": __fd_glob_1, "scoring/meta.json": __fd_glob_2, "specs/meta.json": __fd_glob_3, }, {"agents.mdx": __fd_glob_4, "all-rules.mdx": __fd_glob_5, "index.mdx": __fd_glob_6, "rules-reference.mdx": __fd_glob_7, "rules/content.mdx": __fd_glob_8, "rules/conversion.mdx": __fd_glob_9, "rules/index.mdx": __fd_glob_10, "rules/performance.mdx": __fd_glob_11, "rules/security.mdx": __fd_glob_12, "rules/seo.mdx": __fd_glob_13, "rules/trust.mdx": __fd_glob_14, "scoring/extending.mdx": __fd_glob_15, "scoring/index.mdx": __fd_glob_16, "specs/analytics-tracking.mdx": __fd_glob_17, });