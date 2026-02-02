# Review Detection

**Status:** Planned
**Category:** Trust Signals

---

## Overview

Detect the presence, source, and quality of reviews on STR websites. Reviews are critical trust signals for vacation rental conversions—guests want social proof before booking a stranger's property.

## What to Detect

### 1. On-Site Reviews

Reviews displayed directly on the website.

| Signal | How to Detect |
|--------|---------------|
| Reviews section exists | Look for "reviews", "testimonials", "guest feedback" headings |
| Review count | Extract number from "X reviews" or count review cards |
| Average rating | Star ratings, numeric scores (4.8/5, 9.2/10) |
| Review recency | Date on most recent review |
| Review content | Are these full reviews or just star ratings? |
| Review source badge | "Google", "Airbnb", "VRBO" logos near reviews |

**Detection approach:**
```typescript
const onSiteReviews = await stagehand.extract({
  instruction: "Find the reviews or testimonials section and extract details",
  schema: z.object({
    hasReviewsSection: z.boolean(),
    reviewCount: z.number().nullable(),
    averageRating: z.number().nullable(),
    ratingScale: z.enum(["5", "10", "100"]).nullable(),
    mostRecentDate: z.string().nullable(),
    reviewSource: z.string().nullable(), // "Google", "Airbnb", "native", etc.
    sampleReviewText: z.string().nullable(),
  }),
});
```

### 2. Third-Party Review Badges

External review platform integrations displayed on site.

| Platform | What to Look For |
|----------|------------------|
| Google | Google Business rating widget, "Google Reviews" badge |
| Airbnb | "Superhost" badge, Airbnb rating display |
| VRBO | "Premier Host" badge, VRBO ratings |
| TripAdvisor | TripAdvisor widget, certificate of excellence |
| Yelp | Yelp rating badge |
| Trustpilot | Trustpilot widget/stars |

**Detection approach:**
```typescript
// Check for badge images and widgets
const badges = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const badgeKeywords = ['google', 'airbnb', 'vrbo', 'tripadvisor', 'superhost', 'trustpilot'];
  return imgs
    .filter(img => badgeKeywords.some(k =>
      (img.src + img.alt + img.className).toLowerCase().includes(k)
    ))
    .map(img => ({ src: img.src, alt: img.alt }));
});
```

### 3. Review Authenticity Signals

Indicators of whether reviews are genuine.

| Signal | Trust Level |
|--------|-------------|
| Verified guest badges | High |
| Review dates spread over time | High |
| Reviewer names/photos | Medium |
| Mix of positive and neutral reviews | Medium |
| All 5-star, no details | Low (suspicious) |
| No reviewer identification | Low |
| Reviews only from years ago | Low (stale) |

### 4. Missing Reviews (Red Flags)

| Absence | Implication |
|---------|-------------|
| No reviews section at all | Major trust gap |
| "0 reviews" displayed | New or unbooked property |
| Reviews section but empty | Broken integration or new |
| Only testimonials (no ratings) | Curated/cherry-picked |
| Reviews hidden behind click | Friction, possibly hiding bad reviews |

---

## Output Schema

```typescript
interface ReviewSignals {
  // Overall assessment
  hasReviews: boolean;
  reviewConfidence: "high" | "medium" | "low" | "none";

  // On-site reviews
  onSite: {
    present: boolean;
    count: number | null;
    averageRating: number | null;
    ratingOutOf: 5 | 10 | 100 | null;
    mostRecentDate: string | null;
    hasReviewerNames: boolean;
    hasReviewerPhotos: boolean;
    hasVerifiedBadges: boolean;
  };

  // Third-party presence
  thirdParty: {
    google: ThirdPartyReview | null;
    airbnb: ThirdPartyReview | null;
    vrbo: ThirdPartyReview | null;
    tripadvisor: ThirdPartyReview | null;
    other: ThirdPartyReview[];
  };

  // Trust assessment
  trustIndicators: string[];   // positive signals found
  trustConcerns: string[];     // red flags found
}

interface ThirdPartyReview {
  platform: string;
  badgeDetected: boolean;
  rating: number | null;
  reviewCount: number | null;
  badgeType: string | null;  // "Superhost", "Premier Host", etc.
}
```

---

## Scoring Impact

### Findings

| Condition | Severity | Category |
|-----------|----------|----------|
| No reviews anywhere | Major | Trust |
| Reviews present but no ratings | Minor | Trust |
| Only stale reviews (>1 year old) | Minor | Trust |
| Third-party badges present | Positive | Trust |
| Superhost/Premier Host badge | Positive | Trust |
| High rating (4.5+) with 10+ reviews | Positive | Trust |

### Score Modifiers

```typescript
// Trust category scoring
if (!hasReviews) penalty += 15;
if (hasReviews && reviewCount < 5) penalty += 5;
if (hasThirdPartyBadges) bonus += 5;
if (hasSuperhost || hasPremierHost) bonus += 10;
if (averageRating >= 4.5 && reviewCount >= 10) bonus += 5;
if (mostRecentReview > 12monthsAgo) penalty += 5;
```

---

## Implementation Notes

### Page Locations to Check

1. **Homepage** - Often shows aggregate rating or featured reviews
2. **Property pages** - Primary location for detailed reviews
3. **Footer** - Third-party badges often here
4. **Dedicated reviews page** - Some sites have /reviews or /testimonials

### Common Patterns

**WordPress + review plugins:**
- Look for `.review`, `.testimonial`, `.star-rating` classes
- Common plugins: Site Reviews, WP Customer Reviews

**Embedded widgets:**
- Google: `iframe[src*="google.com/maps"]` with reviews
- Elfsight: `elfsight-app-` widgets
- TripAdvisor: `iframe[src*="tripadvisor"]`

**Booking engine reviews:**
- Lodgify, Hostaway, Guesty often have built-in review displays
- Look for their specific widget patterns

### Edge Cases

1. **Reviews behind auth** - Can't access, note as limitation
2. **Infinite scroll reviews** - Count visible, note "X+ reviews"
3. **Reviews in multiple languages** - Detect primary language
4. **Fake review patterns** - Flag if all reviews are identical length/style

---

## API Alternatives

For deeper review data, consider external APIs:

| Source | Data Available | Cost |
|--------|----------------|------|
| Google Places API | Rating, review count, recent reviews | Free tier available |
| DataForSEO | Aggregated ratings from multiple sources | Included in current plan |

```typescript
// Google Places lookup (if we have business name)
const placeDetails = await googlePlaces.getDetails({
  query: `${businessName} ${city}`,
  fields: ['rating', 'user_ratings_total', 'reviews']
});
```

---

## Integration

Review detection runs as part of the crawl/trust collector:

```
[Crawl Page]
    ↓
[Extract Trust Signals]
    ├── Business identity (name, phone, address)
    ├── Review detection ← THIS
    └── Security badges
    ↓
[Trust Score Calculation]
```

Results populate `NormalizedAudit.trust.reviews` in the existing schema.
