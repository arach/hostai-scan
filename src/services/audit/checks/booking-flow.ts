// Booking Flow Analysis
// Detects booking engines, CTAs, and estimates friction in the booking process

export interface BookingFlowAnalysis {
  hasBookingCTA: boolean;
  ctaText: string | null;
  ctaLocation: "above-fold" | "below-fold" | "none";
  bookingEngine: BookingEngine | null;
  hasDatePicker: boolean;
  hasGuestSelector: boolean;
  hasPriceCalculator: boolean;
  hasInstantBook: boolean;
  estimatedClicksToBook: number;
  frictionScore: number; // 0-100, higher = more friction
  recommendations: string[];
}

export interface BookingEngine {
  name: string;
  type: "embedded" | "redirect" | "native";
  confidence: number;
}

// Known booking engines and their signatures
const BOOKING_ENGINES: Array<{
  name: string;
  patterns: RegExp[];
  type: "embedded" | "redirect" | "native";
}> = [
  {
    name: "Lodgify",
    patterns: [/lodgify\.com/i, /lodgify-widget/i, /data-lodgify/i],
    type: "embedded",
  },
  {
    name: "Hospitable (formerly Smartbnb)",
    patterns: [/hospitable\.com/i, /smartbnb/i],
    type: "redirect",
  },
  {
    name: "Guesty",
    patterns: [/guesty\.com/i, /guestybooking/i, /guesty-widget/i],
    type: "embedded",
  },
  {
    name: "OwnerRez",
    patterns: [/ownerrez\.com/i, /ownerreservations/i, /\.ownerrez\./i],
    type: "embedded",
  },
  {
    name: "Hostaway",
    patterns: [/hostaway\.com/i, /hostaway-booking/i],
    type: "embedded",
  },
  {
    name: "Cloudbeds",
    patterns: [/cloudbeds\.com/i, /cloudbeds-widget/i, /myfrontdesk/i],
    type: "embedded",
  },
  {
    name: "Hostfully",
    patterns: [/hostfully\.com/i, /hostfully-widget/i],
    type: "embedded",
  },
  {
    name: "Escapia",
    patterns: [/escapia\.com/i, /vrconnection/i],
    type: "redirect",
  },
  {
    name: "Streamline",
    patterns: [/streamlinevrs\.com/i, /streamline-widget/i],
    type: "embedded",
  },
  {
    name: "Booking.com Widget",
    patterns: [/booking\.com\/widget/i, /bookingwidget/i],
    type: "embedded",
  },
  {
    name: "Airbnb Embed",
    patterns: [/airbnb\.com\/embeddable/i, /airbnb-embed/i],
    type: "redirect",
  },
  {
    name: "VRBO/Expedia",
    patterns: [/vrbo\.com/i, /expedia\.com.*vacation/i],
    type: "redirect",
  },
  {
    name: "Beds24",
    patterns: [/beds24\.com/i, /beds24-booking/i],
    type: "embedded",
  },
  {
    name: "Checkfront",
    patterns: [/checkfront\.com/i, /checkfront-widget/i],
    type: "embedded",
  },
  {
    name: "FareHarbor",
    patterns: [/fareharbor\.com/i, /fh-widget/i],
    type: "embedded",
  },
];

// CTA patterns with priority (higher = better)
const CTA_PATTERNS: Array<{ pattern: RegExp; priority: number; text: string }> = [
  { pattern: /book\s*now/i, priority: 100, text: "Book Now" },
  { pattern: /reserve\s*now/i, priority: 95, text: "Reserve Now" },
  { pattern: /book\s*your\s*stay/i, priority: 90, text: "Book Your Stay" },
  { pattern: /check\s*availability/i, priority: 85, text: "Check Availability" },
  { pattern: /instant\s*book/i, priority: 100, text: "Instant Book" },
  { pattern: /book\s*this/i, priority: 80, text: "Book This" },
  { pattern: /reserve/i, priority: 70, text: "Reserve" },
  { pattern: /book\s*online/i, priority: 75, text: "Book Online" },
  { pattern: /get\s*quote/i, priority: 60, text: "Get Quote" },
  { pattern: /request\s*booking/i, priority: 65, text: "Request Booking" },
  { pattern: /inquire/i, priority: 50, text: "Inquire" },
  { pattern: /contact\s*us/i, priority: 30, text: "Contact Us" },
];

export function analyzeBookingFlow(html: string): BookingFlowAnalysis {
  const lowerHtml = html.toLowerCase();
  const recommendations: string[] = [];

  // Detect booking engine
  const bookingEngine = detectBookingEngine(html);

  // Find CTAs
  const ctaAnalysis = analyzeCTAs(html);

  // Detect booking UI elements
  const hasDatePicker = detectDatePicker(html);
  const hasGuestSelector = detectGuestSelector(html);
  const hasPriceCalculator = detectPriceCalculator(html);
  const hasInstantBook =
    /instant\s*book/i.test(html) || /book\s*instantly/i.test(html);

  // Estimate clicks to book based on what's present
  let estimatedClicks = estimateClicksToBook({
    hasBookingCTA: ctaAnalysis.hasBookingCTA,
    bookingEngine,
    hasDatePicker,
    hasGuestSelector,
    hasPriceCalculator,
    hasInstantBook,
  });

  // Calculate friction score (0 = no friction, 100 = maximum friction)
  let frictionScore = calculateFrictionScore({
    hasBookingCTA: ctaAnalysis.hasBookingCTA,
    ctaLocation: ctaAnalysis.ctaLocation,
    bookingEngine,
    hasDatePicker,
    hasInstantBook,
    estimatedClicks,
  });

  // Generate recommendations
  if (!ctaAnalysis.hasBookingCTA) {
    recommendations.push(
      "Add a prominent 'Book Now' button - visitors can't book if they can't find how"
    );
  } else if (ctaAnalysis.ctaLocation === "below-fold") {
    recommendations.push(
      "Move your booking CTA above the fold - don't make visitors scroll to book"
    );
  }

  if (!bookingEngine) {
    recommendations.push(
      "Consider adding an integrated booking widget to capture direct bookings"
    );
  } else if (bookingEngine.type === "redirect") {
    recommendations.push(
      `Your booking redirects to ${bookingEngine.name} - consider an embedded widget to keep guests on your site`
    );
  }

  if (!hasDatePicker) {
    recommendations.push(
      "Add a visible date picker - let guests check availability immediately"
    );
  }

  if (!hasInstantBook && bookingEngine) {
    recommendations.push(
      "Enable instant booking if possible - inquiry-based bookings have higher abandonment"
    );
  }

  if (estimatedClicks > 3) {
    recommendations.push(
      `Reduce booking steps - currently ~${estimatedClicks} clicks, aim for 3 or fewer`
    );
  }

  return {
    hasBookingCTA: ctaAnalysis.hasBookingCTA,
    ctaText: ctaAnalysis.ctaText,
    ctaLocation: ctaAnalysis.ctaLocation,
    bookingEngine,
    hasDatePicker,
    hasGuestSelector,
    hasPriceCalculator,
    hasInstantBook,
    estimatedClicksToBook: estimatedClicks,
    frictionScore,
    recommendations,
  };
}

function detectBookingEngine(html: string): BookingEngine | null {
  for (const engine of BOOKING_ENGINES) {
    for (const pattern of engine.patterns) {
      if (pattern.test(html)) {
        return {
          name: engine.name,
          type: engine.type,
          confidence: 0.9,
        };
      }
    }
  }

  // Check for generic booking form patterns
  if (
    /<form[^>]*booking/i.test(html) ||
    /<form[^>]*reservation/i.test(html)
  ) {
    return {
      name: "Custom Booking Form",
      type: "native",
      confidence: 0.6,
    };
  }

  return null;
}

function analyzeCTAs(html: string): {
  hasBookingCTA: boolean;
  ctaText: string | null;
  ctaLocation: "above-fold" | "below-fold" | "none";
} {
  let bestMatch: { text: string; priority: number; position: number } | null = null;

  for (const cta of CTA_PATTERNS) {
    const match = html.match(cta.pattern);
    if (match) {
      const position = match.index || 0;
      if (!bestMatch || cta.priority > bestMatch.priority) {
        bestMatch = { text: cta.text, priority: cta.priority, position };
      }
    }
  }

  if (!bestMatch) {
    return { hasBookingCTA: false, ctaText: null, ctaLocation: "none" };
  }

  // Estimate if CTA is above fold (roughly first 20% of HTML)
  const foldThreshold = html.length * 0.2;
  const ctaLocation: "above-fold" | "below-fold" =
    bestMatch.position < foldThreshold ? "above-fold" : "below-fold";

  return {
    hasBookingCTA: true,
    ctaText: bestMatch.text,
    ctaLocation,
  };
}

function detectDatePicker(html: string): boolean {
  const patterns = [
    /date-?picker/i,
    /datepicker/i,
    /calendar-?widget/i,
    /check-?in.*date/i,
    /arrival.*date/i,
    /type=["']date["']/i,
    /flatpickr/i,
    /pikaday/i,
    /air-?datepicker/i,
    /react-?dates/i,
    /input.*check.?in/i,
  ];

  return patterns.some((p) => p.test(html));
}

function detectGuestSelector(html: string): boolean {
  const patterns = [
    /guest.*selector/i,
    /number.*guests/i,
    /how.*many.*guests/i,
    /adults.*children/i,
    /occupancy/i,
    /select.*guests/i,
    /guest.*count/i,
  ];

  return patterns.some((p) => p.test(html));
}

function detectPriceCalculator(html: string): boolean {
  const patterns = [
    /price.*calculator/i,
    /total.*price/i,
    /\$\d+.*\/.*night/i,
    /per.*night/i,
    /nightly.*rate/i,
    /price.*breakdown/i,
    /cleaning.*fee/i,
    /service.*fee/i,
  ];

  return patterns.some((p) => p.test(html));
}

function estimateClicksToBook(analysis: {
  hasBookingCTA: boolean;
  bookingEngine: BookingEngine | null;
  hasDatePicker: boolean;
  hasGuestSelector: boolean;
  hasPriceCalculator: boolean;
  hasInstantBook: boolean;
}): number {
  // Best case: instant book with inline form = 2-3 clicks
  // Worst case: contact form -> email -> back and forth = 10+ clicks

  if (!analysis.hasBookingCTA) {
    return 10; // Have to search for how to book
  }

  let clicks = 1; // Initial CTA click

  if (analysis.bookingEngine?.type === "redirect") {
    clicks += 1; // Redirect adds a step
  }

  if (!analysis.hasDatePicker) {
    clicks += 2; // Manual date entry or calendar popup
  } else {
    clicks += 1; // Date picker interaction
  }

  if (!analysis.hasGuestSelector) {
    clicks += 1; // May need to specify guests
  }

  if (!analysis.hasInstantBook) {
    clicks += 2; // Inquiry flow: submit + wait + confirm
  }

  clicks += 2; // Payment/confirmation steps

  return Math.min(clicks, 10);
}

function calculateFrictionScore(analysis: {
  hasBookingCTA: boolean;
  ctaLocation: "above-fold" | "below-fold" | "none";
  bookingEngine: BookingEngine | null;
  hasDatePicker: boolean;
  hasInstantBook: boolean;
  estimatedClicks: number;
}): number {
  let friction = 0;

  // No CTA = major friction
  if (!analysis.hasBookingCTA) {
    friction += 40;
  } else if (analysis.ctaLocation === "below-fold") {
    friction += 15;
  }

  // No booking engine = friction
  if (!analysis.bookingEngine) {
    friction += 25;
  } else if (analysis.bookingEngine.type === "redirect") {
    friction += 10;
  }

  // No date picker = friction
  if (!analysis.hasDatePicker) {
    friction += 10;
  }

  // No instant book = friction
  if (!analysis.hasInstantBook) {
    friction += 15;
  }

  // High click count = friction
  if (analysis.estimatedClicks > 5) {
    friction += 15;
  } else if (analysis.estimatedClicks > 3) {
    friction += 5;
  }

  return Math.min(friction, 100);
}
