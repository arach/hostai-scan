# AI-Powered Visual Feedback for GetHost.AI

**Date:** 2026-02-01
**Status:** Proposal
**Author:** Engineering

---

## 1. The Opportunity

### What Quantitative Scoring Misses

Our current deterministic scoring engine (see `docs/SPEC.md`) excels at measuring:

- Performance metrics (LCP, CLS, INP via PageSpeed Insights)
- Technical signals (HTTPS, sitemap, schema markup)
- Conversion elements (CTA detection, click depth, form fields)

However, quantitative rules cannot assess:

- **Visual hierarchy**: Is the booking CTA visually dominant, or lost in clutter?
- **Aesthetic quality**: Does the site look professional or dated?
- **Trust perception**: Do photos feel authentic? Does design inspire confidence?
- **Brand coherence**: Is there visual consistency across pages?
- **Emotional response**: Would a guest feel excited to stay here?

A site can pass every technical check yet still feel "off" in ways that hurt conversion.

### How AI Vision Complements Data-Driven Metrics

Vision models can provide:

1. **Qualitative assessment** of design quality, typography, and whitespace
2. **Subjective trust signals** (professional photography vs. phone snapshots)
3. **Comparative analysis** ("This hero image is less compelling than typical STR sites")
4. **Pattern recognition** for common UX anti-patterns (cluttered headers, hidden CTAs)
5. **Guest perspective simulation** ("As a potential guest, I would feel...")

This creates a complementary layer: data-driven rules find measurable issues; vision AI surfaces perception issues.

### Value Proposition for STR Websites

Short-term rental is a **visual purchase**. Guests are booking a place to sleep in a stranger's property. Trust is paramount. Key STR-specific visual signals include:

- **Photo quality**: Professional vs. amateur, lighting, staging
- **Property presentation**: Does it match the listing description?
- **Local authenticity**: Do images convey the destination experience?
- **Competitive positioning**: How does this visually compare to Airbnb listings?

An AI vision layer could identify: "Your hero image shows an empty room. Top-performing STR sites lead with lifestyle shots showing guests enjoying the space."

---

## 2. Technical Approach

### Screenshot Capture

We already use Puppeteer/Playwright via Browserbase for session recording and crawling. Screenshot capture is trivial:

```typescript
// Already in our stack
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle' });
const screenshot = await page.screenshot({
  type: 'png',
  fullPage: false // Above-fold only for efficiency
});
```

**Recommended captures per audit:**

| Page | Mobile | Desktop |
|------|--------|---------|
| Home | Yes | Yes |
| Property | Yes | Yes |
| Booking | Yes | No |

Total: 5 screenshots per audit (above-fold, ~100-200KB each).

### Vision Model Comparison

| Model | Input Cost | Output Cost | Latency | Notes |
|-------|------------|-------------|---------|-------|
| **Gemini 2.0 Flash** | $0.10/M tokens | $0.40/M tokens | ~1-2s | 560 tokens/image fixed. Best price. Free tier available. |
| **GPT-4o** | $2.50/M tokens | $10.00/M tokens | ~2-3s | 85-1100 tokens/image. More expensive but strong reasoning. |
| **GPT-4o-mini** | $0.15/M tokens | $0.60/M tokens | ~1-2s | Good balance of cost and capability. |
| **Claude Sonnet 4.5** | $3.00/M tokens | $15.00/M tokens | ~2-3s | Strong analysis. Batch API available at 50% discount. |

**Recommendation:** Start with **Gemini 2.0 Flash** for cost efficiency. At 560 tokens per image plus ~500 tokens for prompt/response, each image analysis costs roughly $0.0006. For 5 screenshots, that is approximately **$0.003 per audit** for visual AI.

### Prompt Engineering for Consistent Output

Structured prompts are essential for actionable, consistent feedback. Example:

```typescript
const VISUAL_AUDIT_PROMPT = `
You are a UX expert evaluating a vacation rental website screenshot.
Analyze this ${viewport} screenshot of the ${pageType} page.

Provide structured feedback in the following categories:

1. VISUAL_HIERARCHY (score 1-5)
   - Is the primary CTA immediately visible?
   - What draws the eye first?
   - Any competing elements?

2. TRUST_SIGNALS (score 1-5)
   - Does the design look professional?
   - Are photos high quality?
   - Is there visual social proof?

3. BRAND_QUALITY (score 1-5)
   - Is the design modern or dated?
   - Typography and color consistency?
   - Mobile optimization apparent?

4. STR_SPECIFIC (score 1-5)
   - Do images convey the experience?
   - Is pricing/availability visible?
   - Cancellation/booking clarity?

For each category, provide:
- Score (1-5)
- One-sentence observation
- One actionable recommendation

Respond in valid JSON matching this schema:
{
  "visualHierarchy": { "score": number, "observation": string, "recommendation": string },
  "trustSignals": { "score": number, "observation": string, "recommendation": string },
  "brandQuality": { "score": number, "observation": string, "recommendation": string },
  "strSpecific": { "score": number, "observation": string, "recommendation": string },
  "overallImpression": string,
  "topIssue": string
}
`;
```

### Structured Output vs. Free-Form Analysis

| Approach | Pros | Cons |
|----------|------|------|
| **Structured JSON** | Consistent, parseable, integrates with scoring | May miss nuanced observations |
| **Free-form** | Richer insights, more natural | Hard to aggregate, inconsistent |
| **Hybrid** | Best of both | More tokens, higher cost |

**Recommendation:** Use structured JSON with an additional `additionalNotes` field for free-form observations.

---

## 3. Integration Points

### Where in the Audit Flow

```
[Crawl Collector]
    ↓ captures screenshots
[PSI Collector]
    ↓ performance metrics
[Trust Collector]
    ↓
[Visual AI Collector] ← NEW
    ↓ parallel with scoring
[Scoring Engine]
    ↓ incorporates visual findings
[Report Generator]
```

Visual AI runs **after screenshots are captured** but **before final scoring**. It can run in parallel with other collectors.

### Presenting AI Feedback Alongside Quantitative Scores

**Option A: Separate Section**
```
┌─────────────────────────────────────┐
│ Overall Score: 67/100               │
│ ─────────────────────────────────── │
│ Conversion: 58  Performance: 72     │
│ Trust: 65       SEO: 81             │
├─────────────────────────────────────┤
│ 🎨 AI Design Review                 │
│ ─────────────────────────────────── │
│ Visual Hierarchy: ⭐⭐⭐☆☆           │
│ "The booking CTA competes with      │
│  navigation for attention..."       │
└─────────────────────────────────────┘
```

**Option B: Integrated Findings**
Add visual findings to the findings array with a distinct tag:

```typescript
interface Finding {
  id: string;
  title: string;
  category: ScoreCategory;
  severity: Severity;
  // ...
  tags: string[];  // Add "ai-visual" tag
  aiGenerated?: boolean;  // Flag for transparency
}
```

**Recommendation:** Start with Option A (separate section) to maintain transparency about AI-generated vs. deterministic findings. Users should know which insights came from AI.

### Caching and Storage

| Artifact | Storage | TTL | Size |
|----------|---------|-----|------|
| Screenshots | S3/CDN | 90 days | ~200KB each |
| AI responses | Database | Permanent | ~2KB JSON |
| Raw prompt/response | Logs | 30 days | ~5KB |

**Caching strategy:**
- Cache AI responses by screenshot hash
- Re-use responses if same page re-audited within 7 days
- Store alongside existing `AuditArtifacts` in `NormalizedAudit`

```typescript
interface AuditArtifacts {
  screenshots: Screenshot[];
  sessionReplays: SessionReplay[];
  lighthouse: LighthouseArtifacts[];
  visualAI?: VisualAIResult[];  // NEW
}

interface VisualAIResult {
  pageKind: "home" | "property" | "booking";
  strategy: "mobile" | "desktop";
  screenshotHash: string;
  model: string;
  generatedAt: string;
  result: VisualAIAnalysis;
  latencyMs: number;
}
```

---

## 4. Risks and Considerations

### Cost Per Audit

| Scenario | Screenshots | AI Cost | Total Visual AI |
|----------|-------------|---------|-----------------|
| Minimal (Gemini Flash) | 5 | $0.003 | $0.003 |
| Standard (GPT-4o-mini) | 5 | $0.008 | $0.008 |
| Premium (GPT-4o) | 5 | $0.025 | $0.025 |
| Premium (Claude Sonnet) | 5 | $0.030 | $0.030 |

At 1,000 audits/month with Gemini Flash: **~$3/month** for visual AI.

This is negligible compared to Browserbase session costs and other infrastructure.

### Latency Impact

| Model | Per Image | 5 Images (Parallel) | 5 Images (Sequential) |
|-------|-----------|---------------------|------------------------|
| Gemini Flash | 1-2s | 2-3s | 5-10s |
| GPT-4o-mini | 1-2s | 2-3s | 5-10s |
| GPT-4o | 2-3s | 3-4s | 10-15s |

**Mitigation:**
- Run visual AI in parallel with other collectors
- Process images concurrently (Promise.all)
- Use fastest model (Gemini Flash) for speed-critical paths
- Consider async processing with webhook notification

### Consistency and Reliability

**Concern:** Same screenshot may yield different feedback on repeated runs.

**Mitigations:**
1. Temperature 0 or low temperature for deterministic output
2. Structured JSON schema forces consistent structure
3. Score buckets (1-5) reduce variance vs. continuous scores
4. Cache responses by screenshot hash
5. Run 2-3 times and take consensus for high-stakes audits

**Testing needed:** Run same screenshot 10x and measure variance in scores and recommendations.

### Hallucination and Bad Advice

**Concern:** AI may confidently state incorrect observations or give harmful advice.

**Mitigations:**
1. Frame as "AI observations" not "findings" — lower authority
2. Never let AI findings override deterministic rules
3. AI cannot create "blocker" severity findings
4. Human review for first 100 audits
5. Include disclaimer: "AI-generated insights require human verification"
6. Avoid specific claims about competitors or industry benchmarks

**Example safeguard:**
```typescript
function sanitizeAIFindings(findings: AIFinding[]): Finding[] {
  return findings.map(f => ({
    ...f,
    severity: f.severity === 'blocker' ? 'major' : f.severity, // Downgrade blockers
    tags: [...f.tags, 'ai-generated'],
    aiGenerated: true,
  }));
}
```

---

## 5. Recommendation

### Should We Build This?

**Yes, but as a Phase 3 enhancement.**

The cost is negligible (<$0.01/audit), the technical integration is straightforward, and the value proposition for STR sites is strong. Visual quality is a core differentiator for vacation rentals.

However, we should:
1. Complete the deterministic scoring engine first (Phase 1-2)
2. Establish baseline accuracy of quantitative rules
3. Then layer on AI visual feedback as an enhancement

### When?

**Phase 3**, after:
- Core scoring engine is production-ready
- Collectors are stable and tested
- Report UI is designed

### MVP Scope

**MVP (1 week):**
- Single model (Gemini 2.0 Flash)
- 3 screenshots: home (mobile), home (desktop), property (mobile)
- Structured JSON output only
- Separate "AI Design Review" section in report
- No integration with scoring weights

**Full Vision (additional 2 weeks):**
- Model fallback (Gemini -> GPT-4o-mini)
- All 5 screenshot types
- Hybrid structured + free-form output
- Optional AI findings in main findings list
- A/B testing framework for AI prompt optimization
- Confidence calibration based on historical accuracy

### Success Metrics

1. **Usefulness:** >70% of users rate AI insights as "helpful" in post-audit survey
2. **Accuracy:** <10% of AI observations flagged as incorrect by human review
3. **Consistency:** <20% variance in scores for same screenshot over 10 runs
4. **Performance:** <3s additional latency for parallel visual AI processing

---

## Appendix: Type Definitions

```typescript
interface VisualAIAnalysis {
  visualHierarchy: CategoryScore;
  trustSignals: CategoryScore;
  brandQuality: CategoryScore;
  strSpecific: CategoryScore;
  overallImpression: string;
  topIssue: string;
  additionalNotes?: string;
}

interface CategoryScore {
  score: 1 | 2 | 3 | 4 | 5;
  observation: string;
  recommendation: string;
}

interface VisualAICollectorConfig {
  model: 'gemini-2.0-flash' | 'gpt-4o-mini' | 'gpt-4o' | 'claude-sonnet-4.5';
  fallbackModel?: string;
  temperature: number;
  maxRetries: number;
  timeoutMs: number;
  cacheTTLDays: number;
}
```
