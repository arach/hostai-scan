# Photo Analysis

**Status:** Planned
**Category:** Content / Trust
**Trigger:** Standard (count) / On-demand (quality)

---

## Overview

Evaluate property photos on STR websites. Photos are the primary selling point for vacation rentals—guests book based on visuals. This analysis has two tiers:

1. **Standard (always run):** Photo count and basic metadata
2. **Premium (on-demand):** AI-powered quality assessment

---

## Tier 1: Photo Count & Metadata (Standard)

Run on every audit. No AI costs.

### What to Detect

| Signal | Why It Matters |
|--------|----------------|
| Photo count per property | <10 photos is a red flag for STR |
| Gallery exists | Some sites hide photos or have broken galleries |
| Hero image present | First impression, above-fold impact |
| Photo dimensions | Low-res images hurt trust |
| Alt text presence | Accessibility + SEO signal |
| Lazy loading | Performance consideration |

### Detection Approach

```typescript
const photoMetadata = await page.evaluate(() => {
  // Find gallery container (common patterns)
  const gallerySelectors = [
    '[class*="gallery"]',
    '[class*="photo"]',
    '[class*="image-carousel"]',
    '[class*="slider"]',
    '[data-gallery]',
  ];

  const images = Array.from(document.querySelectorAll('img'));

  // Filter to property photos (exclude icons, logos, UI elements)
  const propertyPhotos = images.filter(img => {
    const dominated = img.naturalWidth > 200 && img.naturalHeight > 200;
    const notIcon = !img.src.includes('icon') && !img.src.includes('logo');
    return dominated && notIcon;
  });

  return {
    totalImages: images.length,
    propertyPhotos: propertyPhotos.length,
    heroImage: propertyPhotos[0] ? {
      src: propertyPhotos[0].src,
      width: propertyPhotos[0].naturalWidth,
      height: propertyPhotos[0].naturalHeight,
      hasAlt: !!propertyPhotos[0].alt,
    } : null,
    hasGallery: gallerySelectors.some(s => document.querySelector(s)),
    lazyLoaded: propertyPhotos.filter(img =>
      img.loading === 'lazy' || img.dataset.src
    ).length,
  };
});
```

### Output Schema (Standard)

```typescript
interface PhotoMetadata {
  propertyPhotoCount: number;
  hasGallery: boolean;
  hasHeroImage: boolean;
  heroImageDimensions: { width: number; height: number } | null;
  lowResCount: number;      // images < 800px wide
  missingAltCount: number;
  lazyLoadedCount: number;
  inventory: PhotoInventoryItem[];
}

interface PhotoInventoryItem {
  index: number;
  url: string;
  thumbnailUrl?: string;    // smaller version if available
  width: number;
  height: number;
  aspectRatio: string;      // "16:9", "4:3", "1:1", etc.
  fileSize?: number;        // bytes, if detectable
  format: "jpg" | "png" | "webp" | "avif" | "unknown";
  alt: string | null;
  isHero: boolean;
  isLowRes: boolean;        // < 800px wide
  lazyLoaded: boolean;
  sourceLocation: "gallery" | "hero" | "inline" | "lightbox";
}
```

### Photo Inventory Collection

Collect all property photos into a structured inventory:

```typescript
async function collectPhotoInventory(page: Page): Promise<PhotoInventoryItem[]> {
  const inventory: PhotoInventoryItem[] = [];

  // 1. Get all candidate images
  const images = await page.$$eval('img', imgs => imgs.map(img => ({
    src: img.src,
    width: img.naturalWidth,
    height: img.naturalHeight,
    alt: img.alt,
    loading: img.loading,
    inGallery: !!img.closest('[class*="gallery"], [class*="carousel"], [class*="slider"]'),
  })));

  // 2. Filter to property photos (not icons, logos, UI)
  const propertyPhotos = images.filter(img =>
    img.width > 200 &&
    img.height > 200 &&
    !img.src.includes('icon') &&
    !img.src.includes('logo') &&
    !img.src.includes('avatar')
  );

  // 3. Build inventory
  propertyPhotos.forEach((img, index) => {
    inventory.push({
      index,
      url: img.src,
      width: img.width,
      height: img.height,
      aspectRatio: getAspectRatio(img.width, img.height),
      format: getImageFormat(img.src),
      alt: img.alt || null,
      isHero: index === 0,
      isLowRes: img.width < 800,
      lazyLoaded: img.loading === 'lazy',
      sourceLocation: img.inGallery ? 'gallery' : 'inline',
    });
  });

  return inventory;
}

function getAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  if (Math.abs(ratio - 16/9) < 0.1) return "16:9";
  if (Math.abs(ratio - 4/3) < 0.1) return "4:3";
  if (Math.abs(ratio - 3/2) < 0.1) return "3:2";
  if (Math.abs(ratio - 1) < 0.1) return "1:1";
  return `${w}:${h}`;
}
```

### Inventory Storage

Store inventory as audit artifact for:
- Admin review of collected photos
- Input to premium AI analysis
- Historical comparison (did they add photos?)

```typescript
interface AuditArtifacts {
  screenshots: Screenshot[];
  photoInventory: PhotoInventoryItem[];  // NEW
  // ...
}
```

### Scoring (Standard)

| Condition | Severity | Penalty |
|-----------|----------|---------|
| No photos detected | Blocker | +35 |
| < 5 photos | Major | +15 |
| 5-9 photos | Minor | +5 |
| No hero image above fold | Major | +10 |
| Hero image < 800px wide | Minor | +5 |
| > 50% low-res images | Minor | +5 |

**STR benchmark:** Top-performing listings have 20-30+ photos covering:
- Exterior / entrance
- Living spaces
- Each bedroom
- Kitchen
- Bathrooms
- Outdoor areas / views
- Local area / amenities

---

## Tier 2: Photo Quality Assessment (Premium)

On-demand, AI-powered analysis. Triggered by:
- User clicks "Deep Analysis"
- Premium audit tier
- API flag `includePhotoQuality: true`

### What to Evaluate

| Aspect | What AI Looks For |
|--------|-------------------|
| **Lighting** | Natural light, well-lit rooms, no dark corners |
| **Composition** | Professional framing, straight lines, no clutter |
| **Staging** | Furniture arrangement, decor, lived-in vs sterile |
| **Resolution** | Sharp focus, no blur, appropriate size |
| **Consistency** | Same style across photos, cohesive set |
| **Authenticity** | Real photos vs stock, matches description |
| **Room coverage** | All key rooms represented |
| **Hero quality** | Is the lead image the most compelling? |

### AI Prompt

```typescript
const PHOTO_QUALITY_PROMPT = `
You are evaluating property photos for a vacation rental listing.

Analyze this set of ${photoCount} property photos and provide:

1. OVERALL_QUALITY (1-5)
   - Professional vs amateur
   - Would these photos make you want to book?

2. LIGHTING (1-5)
   - Natural light usage
   - Dark or overexposed areas

3. COMPOSITION (1-5)
   - Framing and angles
   - Clutter or distractions

4. STAGING (1-5)
   - Furniture and decor appeal
   - Cleanliness impression

5. ROOM_COVERAGE
   - List rooms/areas shown
   - Note any obvious gaps (no bedroom? no bathroom?)

6. HERO_IMAGE_ASSESSMENT
   - Is the first image the strongest?
   - What would be a better lead image?

7. TOP_ISSUES
   - List 1-3 specific improvements

Respond in JSON:
{
  "overallQuality": { "score": number, "summary": string },
  "lighting": { "score": number, "note": string },
  "composition": { "score": number, "note": string },
  "staging": { "score": number, "note": string },
  "roomsCovered": string[],
  "roomsMissing": string[],
  "heroAssessment": string,
  "topIssues": string[],
  "comparisonToTypicalSTR": string
}
`;
```

### Model Selection

| Model | Cost per Analysis | Best For |
|-------|-------------------|----------|
| Gemini 2.0 Flash | ~$0.005 | Cost-efficient, good enough |
| GPT-4o | ~$0.03 | Best quality assessment |
| Claude Sonnet | ~$0.04 | Detailed explanations |

**Recommendation:** Gemini Flash for standard, GPT-4o for premium reports.

### Output Schema (Premium)

```typescript
interface PhotoQualityAnalysis {
  // Scores (1-5)
  overallQuality: number;
  lighting: number;
  composition: number;
  staging: number;

  // Coverage
  roomsCovered: string[];
  roomsMissing: string[];
  coverageScore: number;  // % of expected rooms

  // Specific feedback
  heroAssessment: string;
  topIssues: string[];
  improvements: string[];

  // Comparison
  comparisonToTypicalSTR: "below" | "average" | "above";

  // Metadata
  photosAnalyzed: number;
  modelUsed: string;
  analysisTimestamp: string;
}
```

---

## Implementation Notes

### Finding Property Photos

Property photos are typically in:
- Main gallery/carousel on property page
- Lightbox/modal galleries
- Thumbnail grids that expand

**Exclude:**
- Site logos and icons
- UI elements (arrows, buttons)
- Map images
- Avatar/profile photos
- Stock photos in non-property sections

### Handling Galleries

```typescript
// Many galleries lazy-load or paginate
async function getAllGalleryPhotos(page: Page): Promise<string[]> {
  const photos: string[] = [];

  // Click through carousel if present
  const nextButton = await page.$('[class*="next"], [class*="arrow-right"]');
  if (nextButton) {
    let lastCount = 0;
    while (photos.length !== lastCount) {
      lastCount = photos.length;
      const newPhotos = await page.$$eval('img[class*="gallery"]', imgs =>
        imgs.map(img => img.src)
      );
      photos.push(...newPhotos.filter(p => !photos.includes(p)));
      await nextButton.click();
      await page.waitForTimeout(300);
    }
  }

  return photos;
}
```

### Multi-Property Sites

For sites with multiple listings:
- Analyze the **first/featured property** in standard audit
- Premium: option to analyze N properties or specific URLs

---

## API Integration

```typescript
// Standard audit - always included
const photoMetadata = await analyzePhotoMetadata(page);
audit.content.photos = photoMetadata;

// Premium - on demand
if (options.includePhotoQuality) {
  const photos = await getAllGalleryPhotos(page);
  const quality = await analyzePhotoQuality(photos, {
    model: 'gemini-2.0-flash',
    maxPhotos: 10,  // Analyze first 10 for cost
  });
  audit.content.photoQuality = quality;
}
```

---

## Cost Considerations

| Tier | When | Cost |
|------|------|------|
| Standard (metadata) | Every audit | $0 |
| Premium (AI quality) | On-demand | ~$0.005-0.04 |

For premium, limit to 10 photos max per analysis to control costs. Hero + 9 representative images is sufficient for quality assessment.

---

## Future Enhancements

1. **Photo comparison to competitors** - "Your photos vs top STR sites in area"
2. **Stock photo detection** - Flag if using generic stock images
3. **Seasonal appropriateness** - Summer photos in winter listing
4. **Photo-description match** - Does "ocean view" actually show ocean?
