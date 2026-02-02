# Scoring DSL Design Document

**Version:** 1.0
**Date:** February 1, 2026
**Status:** Design

---

## 1. Overview

### 1.1 Problem Statement

The current GetHost.AI scoring system requires TypeScript expertise to create or modify rules. Each rule is a pure function like:

```typescript
export function mobileLcpSlow(a: NormalizedAudit): Finding | null {
  const lcp = a.perf?.byStrategy.mobile?.metrics.lcpMs;
  if (!lcp) return null;
  if (lcp <= 3000) return null;
  // ... complex logic
}
```

This creates friction for:
- Domain experts who understand STR conversion but do not write TypeScript
- Dev agents (like Claude Code) that work better with declarative configurations
- Sales/product teams who need to adjust scoring weights per campaign
- Rapid iteration on rules without deployment cycles

### 1.2 Goals

1. **Declarative rule definitions** - Config files (YAML/JSON) for bulk rule management
2. **Human-readable DSL** - Natural syntax for non-developers to author rules
3. **Runtime flexibility** - Per-audit overrides without code changes
4. **Admin UI ready** - Structure that maps cleanly to form-based editing
5. **Determinism preserved** - Same input produces same output (no randomness)

### 1.3 Non-Goals

- Replacing TypeScript entirely (complex rules remain in code)
- AI/LLM-based rule generation (rules must be deterministic)
- Real-time rule editing during audit execution

---

## 2. DSL Syntax Design

### 2.1 Core Philosophy

The DSL should feel like writing English sentences about scoring conditions. Inspired by SQL-like readability but simpler.

### 2.2 Basic Syntax

```
rule <id>
  when <condition>
  then <action>
  [with <modifiers>]
```

### 2.3 Condition Expressions

**Comparison operators**: `<`, `>`, `<=`, `>=`, `==`, `!=`
**Logical operators**: `and`, `or`, `not`
**Membership**: `in`, `not in`
**Existence**: `exists`, `missing`
**Numeric**: `between X and Y`

**Field access** uses dot notation matching the `NormalizedAudit` structure:

```
perf.mobile.lcpMs           # Performance metric
crawl.booking.clickDepth    # Booking path depth
security.tls.hasHttps       # Boolean field
trust.reviews.count         # Review count
```

### 2.4 Concrete Examples

**Performance Rule - Slow Mobile LCP**
```yaml
rule performance.mobile_lcp_slow:
  when: perf.mobile.lcpMs > 3000
  then:
    severity: major
    impact: 0.70
    penalty: 18
    title: "Mobile loads slowly (LCP over 3s)"
    evidence: "Mobile LCP: {perf.mobile.lcpMs}ms"
    fix: "Compress images, defer scripts, remove blocking resources"
  with:
    escalate_to_blocker: perf.mobile.lcpMs > 5000
    escalated_impact: 0.90
```

**Conversion Rule - Missing CTA**
```yaml
rule conversion.missing_primary_cta:
  when: |
    page.kind == "home"
    and page.strategy == "mobile"
    and not any(cta in page.detectedCTAs where cta.isPrimary and cta.position == "above_fold")
  then:
    severity: blocker
    impact: 0.95
    confidence: 0.75
    title: "Primary booking CTA not visible above fold on mobile"
    evidence: "Detected CTAs: {page.detectedCTAs | join(', ')}"
    fix: "Add prominent 'Book Now' or 'Check Availability' button above the fold"
```

**Trust Rule - Missing Reviews**
```yaml
rule trust.missing_reviews:
  when: trust.reviews.onSite.present == false
  then:
    severity: major
    impact: 0.70
    title: "No reviews visible on site"
    fix: "Display guest reviews prominently"
  tags: [trust, social_proof]
  effort: medium
```

**Conditional Severity (Escalation)**
```yaml
rule performance.cls_poor:
  when: perf.mobile.cls > 0.10
  then:
    severity: major
    impact: 0.55
    title: "Layout shifts on mobile (CLS > 0.10)"
  escalate:
    when: perf.mobile.cls > 0.25
    to:
      severity: blocker
      impact: 0.75
```

### 2.5 Advanced Patterns

**Compound Conditions**
```yaml
rule conversion.booking_friction_high:
  when: |
    crawl.bookingPath.clickDepth > 3
    and crawl.conversionElements.requiresAccountCreation == true
  then:
    severity: blocker
    impact: 0.85
    title: "High booking friction: too many steps + account required"
```

**Array/Collection Queries**
```yaml
rule conversion.no_cta_any_page:
  when: none(page in crawl.pages where page.detectedCTAs.length > 0)
  then:
    severity: blocker
    impact: 0.95
```

**Thresholds with Bands**
```yaml
rule performance.lcp_tiered:
  when: perf.mobile.lcpMs exists
  match:
    - when: perf.mobile.lcpMs between 2500 and 4000
      then: { severity: minor, impact: 0.40 }
    - when: perf.mobile.lcpMs between 4000 and 5000
      then: { severity: major, impact: 0.70 }
    - when: perf.mobile.lcpMs > 5000
      then: { severity: blocker, impact: 0.90 }
```

---

## 3. Configuration File Format

### 3.1 Rule Pack Structure

Rules are organized into "packs" for modularity:

```
rules/
  core/
    conversion.yaml
    performance.yaml
    trust.yaml
    seo.yaml
    security.yaml
    content.yaml
  overrides/
    campaign-q1-aggressive.yaml
    client-enterprise.yaml
  custom/
    luxury-properties.yaml
```

### 3.2 YAML Schema

```yaml
# rules/core/performance.yaml
version: "1.0"
pack: core.performance
description: "Core performance rules based on Web Vitals"

defaults:
  category: performance
  effort: medium
  confidence: 0.85

rules:
  - id: performance.mobile_lcp_slow
    when: perf.mobile.lcpMs > 3000
    then:
      severity: major
      impact: 0.70
      title: "Mobile loads slowly (LCP over 3s)"
      evidence: "Mobile LCP: {perf.mobile.lcpMs}ms"
      fix: "Compress/resize hero and gallery images, reduce render-blocking scripts"
    escalate:
      when: perf.mobile.lcpMs > 5000
      to: { severity: blocker, impact: 0.90 }
    tags: [mobile, speed, core_web_vitals]

  - id: performance.cls_poor
    when: perf.mobile.cls > 0.10
    then:
      severity: major
      impact: 0.55
      title: "Layout shifts on mobile (CLS > 0.10)"
      evidence: "Mobile CLS: {perf.mobile.cls | round(2)}"
      fix: "Reserve space for images/embeds, avoid late-loading banners"
    escalate:
      when: perf.mobile.cls > 0.25
      to: { severity: blocker, impact: 0.75 }
```

### 3.3 JSON Alternative

For programmatic generation or API-based rule management:

```json
{
  "version": "1.0",
  "pack": "core.performance",
  "rules": [
    {
      "id": "performance.mobile_lcp_slow",
      "condition": {
        "field": "perf.mobile.lcpMs",
        "operator": ">",
        "value": 3000
      },
      "finding": {
        "severity": "major",
        "impact": 0.70,
        "title": "Mobile loads slowly (LCP over 3s)",
        "evidence": ["Mobile LCP: {perf.mobile.lcpMs}ms"],
        "fix": "Compress images, defer scripts"
      },
      "escalation": {
        "condition": { "field": "perf.mobile.lcpMs", "operator": ">", "value": 5000 },
        "severity": "blocker",
        "impact": 0.90
      }
    }
  ]
}
```

---

## 4. Override System

### 4.1 Override Levels

Three levels of precedence (highest to lowest):

1. **Audit-level overrides** - Applied to a single audit run
2. **Campaign overrides** - Applied to all audits in a campaign
3. **Pack defaults** - Base rule definitions

### 4.2 Audit-Level Overrides

Passed in the `AuditRequest`:

```typescript
interface AuditRequest {
  auditId: string;
  domain: string;
  // ... existing fields

  ruleOverrides?: RuleOverride[];
}

interface RuleOverride {
  ruleId: string;
  action: "disable" | "modify";
  modifications?: {
    severity?: Severity;
    impact?: number;
    confidence?: number;
  };
}
```

**Example**: Disable a rule for a specific audit:
```json
{
  "ruleOverrides": [
    { "ruleId": "security.weak_tls", "action": "disable" },
    { "ruleId": "performance.mobile_lcp_slow", "action": "modify", "modifications": { "impact": 0.50 } }
  ]
}
```

### 4.3 Campaign Overrides

Stored in override packs:

```yaml
# rules/overrides/campaign-enterprise.yaml
version: "1.0"
pack: override.enterprise
description: "Relaxed thresholds for enterprise demo audits"

overrides:
  - ruleId: performance.mobile_lcp_slow
    modifications:
      # More lenient for enterprise (they have slower legacy sites)
      condition: perf.mobile.lcpMs > 4000  # was 3000
      impact: 0.50  # reduced from 0.70

  - ruleId: trust.missing_reviews
    action: disable  # Many enterprise sites don't show reviews publicly
```

### 4.4 Override Merge Strategy

```typescript
function resolveRule(
  baseRule: RuleDefinition,
  campaignOverride?: RuleOverride,
  auditOverride?: RuleOverride
): RuleDefinition | null {
  // Audit override takes precedence
  if (auditOverride?.action === "disable") return null;
  if (campaignOverride?.action === "disable" && !auditOverride) return null;

  // Merge modifications (audit > campaign > base)
  return {
    ...baseRule,
    ...campaignOverride?.modifications,
    ...auditOverride?.modifications,
  };
}
```

---

## 5. Parsing and Execution

### 5.1 Parser Architecture

```
YAML/JSON Config
      │
      ▼
┌─────────────────┐
│  Config Loader  │  Load and validate schema
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DSL Parser     │  Parse condition expressions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rule Compiler   │  Generate executable rule functions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rule[]          │  Array of (audit) => Finding | null
└─────────────────┘
```

### 5.2 Condition Parser

Use a simple expression parser (not a full programming language). Recommended approach:

**Option A: JSON Logic**
Use [json-logic-js](https://github.com/jwadhams/json-logic-js) for condition evaluation:

```json
{
  "and": [
    { ">": [{ "var": "perf.mobile.lcpMs" }, 3000] },
    { "==": [{ "var": "crawl.booking.crossDomain" }, true] }
  ]
}
```

**Option B: Custom Parser (Recommended)**
Simple recursive descent parser for the DSL syntax:

```typescript
// Parser output
interface ParsedCondition {
  type: "comparison" | "logical" | "exists" | "in";
  field?: string;
  operator?: string;
  value?: unknown;
  left?: ParsedCondition;
  right?: ParsedCondition;
}

// Example: "perf.mobile.lcpMs > 3000"
// Parses to:
{
  type: "comparison",
  field: "perf.mobile.lcpMs",
  operator: ">",
  value: 3000
}
```

### 5.3 Rule Compiler

Compiles parsed conditions into executable functions:

```typescript
function compileRule(def: RuleDefinition): Rule {
  const checkCondition = compileCondition(def.condition);
  const checkEscalation = def.escalation
    ? compileCondition(def.escalation.condition)
    : null;

  return (audit: NormalizedAudit): Finding | null => {
    if (!checkCondition(audit)) return null;

    // Check escalation
    const escalated = checkEscalation?.(audit);
    const finding = escalated ? def.escalation.finding : def.finding;

    // Interpolate evidence strings
    const evidence = finding.evidence.map(e =>
      interpolate(e, audit)
    );

    return {
      id: def.id,
      ...finding,
      evidence,
      penalty: computePenalty(finding.severity, finding.impact, finding.confidence),
    };
  };
}
```

### 5.4 Field Access

Safe nested field access with null handling:

```typescript
function getField(audit: NormalizedAudit, path: string): unknown {
  return path.split('.').reduce((obj, key) => {
    if (obj === null || obj === undefined) return undefined;

    // Handle special accessors
    if (key === 'mobile') return obj.byStrategy?.mobile;
    if (key === 'desktop') return obj.byStrategy?.desktop;

    return obj[key];
  }, audit as unknown);
}
```

### 5.5 Template Interpolation

For evidence strings:

```typescript
function interpolate(template: string, audit: NormalizedAudit): string {
  return template.replace(/\{([^}]+)\}/g, (_, expr) => {
    // Handle pipes: {value | round(2)}
    const [path, ...filters] = expr.split('|').map(s => s.trim());
    let value = getField(audit, path);

    for (const filter of filters) {
      value = applyFilter(value, filter);
    }

    return String(value ?? 'N/A');
  });
}

function applyFilter(value: unknown, filter: string): unknown {
  if (filter.startsWith('round(')) {
    const decimals = parseInt(filter.match(/\d+/)?.[0] ?? '0');
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  }
  if (filter === 'join') {
    return Array.isArray(value) ? value.join(', ') : value;
  }
  return value;
}
```

---

## 6. Integration with Existing Engine

### 6.1 Hybrid Rule Registry

Support both TypeScript rules and DSL rules:

```typescript
// src/scoring/registry.ts
import { Rule } from '../types';
import { TYPESCRIPT_RULES } from '../rules';
import { loadDSLRules } from './dsl-loader';

export async function buildRuleRegistry(
  options?: {
    campaignOverrides?: string;
    auditOverrides?: RuleOverride[];
  }
): Promise<Rule[]> {
  // Load DSL rules from config files
  const dslRules = await loadDSLRules({
    basePath: 'rules/core',
    overridePath: options?.campaignOverrides,
  });

  // Apply audit-level overrides
  const resolvedDSL = applyOverrides(dslRules, options?.auditOverrides);

  // Combine with TypeScript rules (TS rules can override DSL)
  return [
    ...resolvedDSL,
    ...TYPESCRIPT_RULES,
  ];
}
```

### 6.2 Modified Score Function

```typescript
export async function scoreAudit(
  audit: NormalizedAudit,
  options?: ScoringOptions
): Promise<ScoringOutput> {
  const rules = await buildRuleRegistry({
    campaignOverrides: options?.campaign?.overridePack,
    auditOverrides: audit.inputs.ruleOverrides,
  });

  // Existing scoring logic
  const findings = rules.map(r => r(audit)).filter(Boolean);
  // ... rest of scoring
}
```

### 6.3 Backward Compatibility

Existing TypeScript rules continue to work unchanged. The DSL is additive.

---

## 7. Admin UI Considerations

### 7.1 Rule Editor Data Model

The YAML structure maps directly to form fields:

| Field | UI Control |
|-------|------------|
| `id` | Text input (read-only for existing rules) |
| `when` | Code editor with syntax highlighting |
| `severity` | Dropdown (blocker/major/minor/trivial) |
| `impact` | Slider (0.0 - 1.0) |
| `confidence` | Slider (0.0 - 1.0) |
| `title` | Text input |
| `evidence` | Text area with variable picker |
| `fix` | Text area (markdown) |
| `effort` | Dropdown (low/medium/high) |
| `tags` | Tag input |

### 7.2 Condition Builder

For non-technical users, provide a visual query builder:

```
┌─────────────────────────────────────────────────┐
│ When...                                         │
│ ┌─────────────┐ ┌────┐ ┌──────────────────────┐│
│ │ Mobile LCP  │ │ >  │ │ 3000 ms              ││
│ └─────────────┘ └────┘ └──────────────────────┘│
│ [+ Add condition]                              │
├─────────────────────────────────────────────────┤
│ Then...                                         │
│ Severity: [Major ▼]  Impact: [====●=====] 0.70 │
│ Title: [Mobile loads slowly (LCP over 3s)    ] │
└─────────────────────────────────────────────────┘
```

### 7.3 Preview Mode

Before saving, show what the rule would produce for sample audits:

```
Preview against: azibistays.com (recent audit)
─────────────────────────────────────────────────
✓ Rule triggers
  Severity: major → blocker (escalated)
  Evidence: "Mobile LCP: 5234ms"
  Penalty: 31 points
```

---

## 8. Type Definitions

### 8.1 Core DSL Types

```typescript
// src/scoring/dsl/types.ts

export interface RuleDefinition {
  id: string;
  condition: ConditionExpression | string;
  finding: FindingTemplate;
  escalation?: {
    condition: ConditionExpression | string;
    finding: Partial<FindingTemplate>;
  };
  defaults?: {
    category?: ScoreCategory;
    effort?: Effort;
    confidence?: number;
  };
  tags?: string[];
  enabled?: boolean;
}

export interface FindingTemplate {
  severity: Severity;
  impact: number;
  confidence?: number;
  title: string;
  evidence: string[];  // Templates with {field} interpolation
  fix: string;
  effort?: Effort;
}

export interface ConditionExpression {
  type: "comparison" | "logical" | "exists" | "in" | "any" | "none" | "all";

  // For comparison
  field?: string;
  operator?: "<" | ">" | "<=" | ">=" | "==" | "!=";
  value?: unknown;

  // For logical
  op?: "and" | "or" | "not";
  conditions?: ConditionExpression[];

  // For collection queries
  collection?: string;
  predicate?: ConditionExpression;
}

export interface RulePack {
  version: string;
  pack: string;
  description?: string;
  defaults?: Partial<FindingTemplate>;
  rules: RuleDefinition[];
}

export interface RuleOverride {
  ruleId: string;
  action: "disable" | "modify";
  modifications?: {
    condition?: ConditionExpression | string;
    severity?: Severity;
    impact?: number;
    confidence?: number;
    enabled?: boolean;
  };
}

export interface ScoringOptions {
  campaign?: {
    id: string;
    overridePack?: string;
  };
  ruleOverrides?: RuleOverride[];
}
```

---

## 9. Migration Path

### 9.1 Phase 1: Infrastructure (Week 1-2)

1. Implement condition parser
2. Implement rule compiler
3. Create YAML loader with schema validation
4. Write unit tests for parser/compiler

### 9.2 Phase 2: Rule Migration (Week 3)

1. Convert existing TypeScript rules to YAML (keep TS as fallback)
2. Verify identical output with test suite
3. Document DSL syntax

### 9.3 Phase 3: Override System (Week 4)

1. Implement campaign overrides
2. Implement audit-level overrides
3. API endpoints for override management

### 9.4 Phase 4: Admin UI (Week 5-6)

1. Rule list view with search/filter
2. Rule editor form
3. Visual condition builder
4. Preview mode
5. Override management

---

## 10. Trade-offs and Decisions

### 10.1 Why YAML over JSON?

- More readable for multi-line strings (evidence, fix text)
- Comments supported (for documentation)
- Less visual noise
- JSON remains an option for programmatic generation

### 10.2 Why Custom DSL over JSON Logic?

- More readable: `perf.mobile.lcpMs > 3000` vs nested JSON
- Domain-specific: `any(cta in page.detectedCTAs where ...)`
- Error messages can reference original syntax
- Trade-off: More implementation work

### 10.3 Why Not Full Programming Language?

- Determinism requirement: rules must be pure
- Security: no arbitrary code execution
- Auditability: rules should be reviewable by non-developers
- Simplicity: most rules are simple threshold checks

### 10.4 Keeping TypeScript Rules

Complex rules with significant logic (like booking flow analysis) remain in TypeScript:
- Pattern matching across multiple pages
- Stateful analysis
- External API calls (for future rules)

The DSL handles 80% of rules; TypeScript handles the complex 20%.

---

## 11. Example Rule Pack

Complete example of `rules/core/conversion.yaml`:

```yaml
version: "1.0"
pack: core.conversion
description: "Conversion-focused rules for booking flow optimization"

defaults:
  category: conversion
  confidence: 0.75
  effort: medium

rules:
  - id: conversion.missing_primary_cta
    when: |
      page.kind in ["home", "property"]
      and page.strategy == "mobile"
      and not any(cta in page.detectedCTAs where
        cta.isPrimaryGuess == true
        and cta.positionHint == "above_fold"
        and cta.label matches "(book|reserve|availability)"
      )
    then:
      severity: blocker
      impact: 0.95
      title: "Primary booking CTA not visible above fold on mobile"
      evidence:
        - "Checked {page.kind} page on mobile"
        - "Detected CTAs: {page.detectedCTAs | pluck('label') | join(', ') | default('none')}"
      fix: "Add a single dominant CTA above the fold (e.g., 'Check availability') and consider a sticky booking bar on mobile."
    tags: [mobile, booking, critical]

  - id: conversion.no_sticky_cta_mobile
    when: crawl.conversionElements.hasPersistentBookingCTAOnMobile == false
    then:
      severity: major
      impact: 0.75
      confidence: 0.70
      title: "No persistent booking CTA on mobile"
      evidence:
        - "Booking CTA disappears when scrolling on mobile"
      fix: "Add a sticky booking bar that remains accessible while scrolling."
    tags: [mobile, booking]

  - id: conversion.click_depth_high
    when: crawl.bookingPath.clickDepthFromHome > 3
    then:
      severity: major
      impact: 0.75
      title: "Booking requires too many clicks from home"
      evidence:
        - "Click depth to booking: {crawl.bookingPath.clickDepthFromHome}"
      fix: "Reduce booking start to 3 clicks or fewer. Add direct availability CTA on homepage."
    escalate:
      when: crawl.bookingPath.clickDepthFromHome >= 5
      to:
        severity: blocker
        impact: 0.90
    tags: [booking, funnel]

  - id: conversion.missing_cancellation
    when: |
      not any(page in crawl.pages where
        page.kind in ["property", "booking"]
        and page.policies.hasCancellationPolicy == true
      )
    then:
      severity: major
      impact: 0.70
      title: "Cancellation policy not visible near booking"
      evidence:
        - "No cancellation policy detected on property/booking pages"
      fix: "Add a concise cancellation snippet near the primary CTA and link to full policy."
    effort: low
    tags: [booking, trust]

  - id: conversion.fees_not_visible_early
    when: crawl.conversionElements.showsFeesBeforeCheckout == false
    then:
      severity: major
      impact: 0.65
      confidence: 0.60
      title: "Fees/taxes not shown before checkout"
      evidence:
        - "Full pricing with fees appears only at checkout"
      fix: "Show total price including fees earlier in the booking flow—ideally at date selection."
    tags: [booking, pricing, transparency]

  - id: conversion.requires_account
    when: crawl.conversionElements.requiresAccountCreation == true
    then:
      severity: major
      impact: 0.60
      title: "Account creation required to book"
      evidence:
        - "Users must create an account before completing booking"
      fix: "Allow guest checkout without account creation, or make account creation optional."
    tags: [booking, friction]

  - id: conversion.no_instant_booking
    when: |
      crawl.conversionElements.supportsInstantBooking == false
      and crawl.conversionElements.hasInquiryFallback == true
    then:
      severity: minor
      impact: 0.40
      title: "No instant booking option (inquiry only)"
      evidence:
        - "Site requires inquiry/request to book rather than instant confirmation"
      fix: "Consider adding instant booking for some properties to capture spontaneous bookings."
    effort: high
    tags: [booking]
```

---

## 12. References

- [Rules Engine Design Patterns](https://www.nected.ai/us/blog-us/rules-engine-design-pattern) - Overview of rule engine patterns
- [Martin Fowler on Rules Engines](https://martinfowler.com/bliki/RulesEngine.html) - When to use rule engines
- [Custom DSL for Rules Engine using Lark](https://medium.com/@jeyabalajis/a-custom-dsl-for-rules-engine-using-lark-c8dd333d80c1) - Parser implementation
- [Rules Engine Pattern - DevIQ](https://deviq.com/design-patterns/rules-engine-pattern/) - Pattern overview
