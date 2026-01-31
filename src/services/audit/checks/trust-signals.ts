// Trust Signal Analysis
// Detects reviews, ratings, badges, and credibility indicators

export interface TrustSignalAnalysis {
  overallTrustScore: number; // 0-100

  // Reviews
  hasReviews: boolean;
  reviewSource: ReviewSource | null;
  reviewCount: number | null;
  averageRating: number | null;
  ratingOutOf: number; // Usually 5 or 10

  // Trust badges
  trustBadges: TrustBadge[];
  hasSecurityBadges: boolean;
  hasIndustryBadges: boolean;

  // Contact & transparency
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasPhysicalAddress: boolean;
  hasSocialProfiles: SocialProfile[];
  hasAboutPage: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;

  // Social proof
  hasTestimonials: boolean;
  hasGuestPhotos: boolean;
  hasPressLogos: boolean;

  recommendations: string[];
}

export interface ReviewSource {
  name: string;
  type: "google" | "airbnb" | "vrbo" | "tripadvisor" | "trustpilot" | "custom" | "aggregate";
  isVerified: boolean;
}

export interface TrustBadge {
  name: string;
  category: "security" | "industry" | "payment" | "verification";
}

export interface SocialProfile {
  platform: string;
  detected: boolean;
}

// Review platform patterns
const REVIEW_SOURCES: Array<{
  name: string;
  type: ReviewSource["type"];
  patterns: RegExp[];
  ratingPattern?: RegExp;
  countPattern?: RegExp;
}> = [
  {
    name: "Google Reviews",
    type: "google",
    patterns: [/google.*review/i, /g-review/i, /googleplacesreviews/i],
    ratingPattern: /(\d+\.?\d*)\s*(?:out of 5|\/5|stars?)/i,
    countPattern: /(\d+)\s*(?:google\s*)?reviews?/i,
  },
  {
    name: "Airbnb",
    type: "airbnb",
    patterns: [/airbnb.*review/i, /superhost/i],
    ratingPattern: /(\d+\.?\d*)\s*(?:rating|stars?)/i,
  },
  {
    name: "VRBO",
    type: "vrbo",
    patterns: [/vrbo.*review/i, /premier\s*host/i],
  },
  {
    name: "TripAdvisor",
    type: "tripadvisor",
    patterns: [/tripadvisor/i, /trip\s*advisor/i],
    ratingPattern: /(\d+\.?\d*)\s*(?:of 5|bubbles?)/i,
  },
  {
    name: "Trustpilot",
    type: "trustpilot",
    patterns: [/trustpilot/i, /trustscore/i],
    ratingPattern: /trustscore[:\s]*(\d+\.?\d*)/i,
  },
];

// Trust badge patterns
const TRUST_BADGES: Array<{
  name: string;
  category: TrustBadge["category"];
  patterns: RegExp[];
}> = [
  // Security
  { name: "SSL/Secure", category: "security", patterns: [/ssl\s*secure/i, /256.?bit/i] },
  { name: "McAfee Secure", category: "security", patterns: [/mcafee\s*secure/i] },
  { name: "Norton Secured", category: "security", patterns: [/norton\s*secured/i] },
  { name: "DigiCert", category: "security", patterns: [/digicert/i] },

  // Industry
  { name: "Superhost", category: "industry", patterns: [/superhost/i] },
  { name: "Premier Host", category: "industry", patterns: [/premier\s*host/i] },
  { name: "Verified Host", category: "industry", patterns: [/verified\s*host/i] },
  { name: "VRMA Member", category: "industry", patterns: [/vrma/i, /vacation\s*rental\s*management\s*association/i] },
  { name: "BBB Accredited", category: "industry", patterns: [/bbb/i, /better\s*business\s*bureau/i] },
  { name: "AAA Approved", category: "industry", patterns: [/aaa\s*approved/i] },

  // Payment
  { name: "Visa/Mastercard", category: "payment", patterns: [/visa.*mastercard/i, /we\s*accept.*card/i] },
  { name: "PayPal", category: "payment", patterns: [/paypal/i] },
  { name: "Stripe", category: "payment", patterns: [/powered\s*by\s*stripe/i] },

  // Verification
  { name: "ID Verified", category: "verification", patterns: [/id\s*verif/i, /identity\s*verif/i] },
  { name: "Background Check", category: "verification", patterns: [/background\s*check/i] },
];

const SOCIAL_PLATFORMS = [
  { platform: "Facebook", patterns: [/facebook\.com/i, /fb\.com/i] },
  { platform: "Instagram", patterns: [/instagram\.com/i, /instagr\.am/i] },
  { platform: "Twitter/X", patterns: [/twitter\.com/i, /x\.com\/(?!share)/i] },
  { platform: "YouTube", patterns: [/youtube\.com/i, /youtu\.be/i] },
  { platform: "Pinterest", patterns: [/pinterest\.com/i] },
  { platform: "LinkedIn", patterns: [/linkedin\.com/i] },
  { platform: "TikTok", patterns: [/tiktok\.com/i] },
];

export function analyzeTrustSignals(html: string): TrustSignalAnalysis {
  const recommendations: string[] = [];

  // Analyze reviews
  const reviewAnalysis = analyzeReviews(html);

  // Detect trust badges
  const trustBadges = detectTrustBadges(html);
  const hasSecurityBadges = trustBadges.some((b) => b.category === "security");
  const hasIndustryBadges = trustBadges.some((b) => b.category === "industry");

  // Analyze contact info
  const contactAnalysis = analyzeContactInfo(html);

  // Detect social profiles
  const socialProfiles = detectSocialProfiles(html);

  // Detect social proof elements
  const hasTestimonials = /testimonial/i.test(html) || /guest\s*(said|says|wrote)/i.test(html);
  const hasGuestPhotos = /guest\s*photo/i.test(html) || /photo.*review/i.test(html);
  const hasPressLogos = /as\s*seen\s*(in|on)/i.test(html) || /featured\s*(in|on)/i.test(html);

  // Check for legal pages (usually in footer links)
  const hasPrivacyPolicy = /privacy\s*policy/i.test(html) || /privacy-policy/i.test(html);
  const hasTermsOfService = /terms\s*(of\s*service|&\s*conditions)/i.test(html);
  const hasAboutPage = /about\s*us/i.test(html) || /our\s*story/i.test(html);

  // Calculate overall trust score
  const overallTrustScore = calculateTrustScore({
    hasReviews: reviewAnalysis.hasReviews,
    averageRating: reviewAnalysis.averageRating,
    reviewCount: reviewAnalysis.reviewCount,
    trustBadges,
    contactAnalysis,
    socialProfiles,
    hasTestimonials,
    hasPrivacyPolicy,
    hasTermsOfService,
  });

  // Generate recommendations
  if (!reviewAnalysis.hasReviews) {
    recommendations.push(
      "Add guest reviews to your site - 93% of travelers read reviews before booking"
    );
  } else if (reviewAnalysis.reviewCount && reviewAnalysis.reviewCount < 10) {
    recommendations.push(
      `You have ${reviewAnalysis.reviewCount} reviews - encourage more guests to leave feedback`
    );
  }

  if (!reviewAnalysis.source?.isVerified) {
    recommendations.push(
      "Display verified reviews from Google, Airbnb, or VRBO to build credibility"
    );
  }

  if (!contactAnalysis.hasPhoneNumber) {
    recommendations.push(
      "Add a visible phone number - guests want to know they can reach you"
    );
  }

  if (!contactAnalysis.hasPhysicalAddress) {
    recommendations.push(
      "Show your general location or business address for transparency"
    );
  }

  if (socialProfiles.filter((p) => p.detected).length === 0) {
    recommendations.push(
      "Link to your social media profiles to show you're an active, real business"
    );
  }

  if (!hasSecurityBadges && !hasIndustryBadges) {
    recommendations.push(
      "Add trust badges (Superhost, verified host, secure payment) to reduce booking anxiety"
    );
  }

  if (!hasPrivacyPolicy) {
    recommendations.push(
      "Add a privacy policy link - it's legally required and builds trust"
    );
  }

  if (reviewAnalysis.averageRating && reviewAnalysis.averageRating >= 4.5) {
    // This is actually good - highlight it
    recommendations.push(
      `Great ${reviewAnalysis.averageRating} rating! Feature this prominently in your hero section`
    );
  }

  return {
    overallTrustScore,
    hasReviews: reviewAnalysis.hasReviews,
    reviewSource: reviewAnalysis.source,
    reviewCount: reviewAnalysis.reviewCount,
    averageRating: reviewAnalysis.averageRating,
    ratingOutOf: 5,
    trustBadges,
    hasSecurityBadges,
    hasIndustryBadges,
    hasPhoneNumber: contactAnalysis.hasPhoneNumber,
    hasEmailAddress: contactAnalysis.hasEmailAddress,
    hasPhysicalAddress: contactAnalysis.hasPhysicalAddress,
    hasSocialProfiles: socialProfiles,
    hasAboutPage,
    hasPrivacyPolicy,
    hasTermsOfService,
    hasTestimonials,
    hasGuestPhotos,
    hasPressLogos,
    recommendations,
  };
}

function analyzeReviews(html: string): {
  hasReviews: boolean;
  source: ReviewSource | null;
  reviewCount: number | null;
  averageRating: number | null;
} {
  // Check for JSON-LD structured data first (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, "");
        const data = JSON.parse(jsonContent);

        if (data.aggregateRating) {
          return {
            hasReviews: true,
            source: {
              name: "Schema.org Aggregate",
              type: "aggregate",
              isVerified: true,
            },
            reviewCount: parseInt(data.aggregateRating.reviewCount) || null,
            averageRating: parseFloat(data.aggregateRating.ratingValue) || null,
          };
        }
      } catch {
        // Invalid JSON, continue
      }
    }
  }

  // Check for review platform patterns
  for (const source of REVIEW_SOURCES) {
    if (source.patterns.some((p) => p.test(html))) {
      let rating: number | null = null;
      let count: number | null = null;

      if (source.ratingPattern) {
        const ratingMatch = html.match(source.ratingPattern);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }
      }

      if (source.countPattern) {
        const countMatch = html.match(source.countPattern);
        if (countMatch) {
          count = parseInt(countMatch[1]);
        }
      }

      return {
        hasReviews: true,
        source: {
          name: source.name,
          type: source.type,
          isVerified: ["google", "airbnb", "vrbo", "tripadvisor"].includes(source.type),
        },
        reviewCount: count,
        averageRating: rating,
      };
    }
  }

  // Generic review detection
  const hasGenericReviews =
    /\d+\.?\d*\s*(out of 5|\/5|stars?)/i.test(html) ||
    /★{3,5}/i.test(html) ||
    /review/i.test(html);

  if (hasGenericReviews) {
    // Try to extract rating
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:out of 5|\/5)/i);
    const countMatch = html.match(/(\d+)\s*reviews?/i);

    return {
      hasReviews: true,
      source: {
        name: "Site Reviews",
        type: "custom",
        isVerified: false,
      },
      reviewCount: countMatch ? parseInt(countMatch[1]) : null,
      averageRating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    };
  }

  return {
    hasReviews: false,
    source: null,
    reviewCount: null,
    averageRating: null,
  };
}

function detectTrustBadges(html: string): TrustBadge[] {
  const badges: TrustBadge[] = [];

  for (const badge of TRUST_BADGES) {
    if (badge.patterns.some((p) => p.test(html))) {
      badges.push({
        name: badge.name,
        category: badge.category,
      });
    }
  }

  return badges;
}

function analyzeContactInfo(html: string): {
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasPhysicalAddress: boolean;
} {
  // Phone patterns (US format and international)
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // US: 123-456-7890
    /\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/, // US: (123) 456-7890
    /\b\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // US: +1-123-456-7890
    /\b\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/, // International
    /tel:/i, // tel: links
  ];

  // Email patterns
  const emailPatterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    /mailto:/i,
  ];

  // Address patterns
  const addressPatterns = [
    /\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)/i,
    /[A-Za-z]+,\s*[A-Z]{2}\s+\d{5}/i, // City, ST 12345
    /physical\s*address/i,
    /our\s*location/i,
  ];

  return {
    hasPhoneNumber: phonePatterns.some((p) => p.test(html)),
    hasEmailAddress: emailPatterns.some((p) => p.test(html)),
    hasPhysicalAddress: addressPatterns.some((p) => p.test(html)),
  };
}

function detectSocialProfiles(html: string): SocialProfile[] {
  return SOCIAL_PLATFORMS.map((platform) => ({
    platform: platform.platform,
    detected: platform.patterns.some((p) => p.test(html)),
  }));
}

function calculateTrustScore(analysis: {
  hasReviews: boolean;
  averageRating: number | null;
  reviewCount: number | null;
  trustBadges: TrustBadge[];
  contactAnalysis: { hasPhoneNumber: boolean; hasEmailAddress: boolean; hasPhysicalAddress: boolean };
  socialProfiles: SocialProfile[];
  hasTestimonials: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
}): number {
  let score = 0;

  // Reviews (up to 35 points)
  if (analysis.hasReviews) {
    score += 15;
    if (analysis.averageRating && analysis.averageRating >= 4.0) {
      score += 10;
    }
    if (analysis.reviewCount && analysis.reviewCount >= 10) {
      score += 10;
    }
  }

  // Trust badges (up to 20 points)
  score += Math.min(analysis.trustBadges.length * 5, 20);

  // Contact info (up to 20 points)
  if (analysis.contactAnalysis.hasPhoneNumber) score += 8;
  if (analysis.contactAnalysis.hasEmailAddress) score += 6;
  if (analysis.contactAnalysis.hasPhysicalAddress) score += 6;

  // Social presence (up to 10 points)
  const socialCount = analysis.socialProfiles.filter((p) => p.detected).length;
  score += Math.min(socialCount * 3, 10);

  // Testimonials (5 points)
  if (analysis.hasTestimonials) score += 5;

  // Legal pages (up to 10 points)
  if (analysis.hasPrivacyPolicy) score += 5;
  if (analysis.hasTermsOfService) score += 5;

  return Math.min(score, 100);
}
