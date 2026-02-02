/**
 * Domain Parser for Bulk Import
 *
 * Parses domains from various text formats:
 * - One domain per line
 * - With/without https://
 * - With/without www
 * - Validates domain format
 * - Deduplicates results
 */

export interface ParsedDomains {
  valid: string[];
  invalid: { input: string; reason: string }[];
}

// Basic domain validation regex
// Matches: example.com, sub.example.com, example.co.uk, etc.
const DOMAIN_REGEX = /^(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

// Common TLDs for validation (subset)
const VALID_TLDS = new Set([
  "com", "net", "org", "io", "co", "ai", "app", "dev", "tech",
  "biz", "info", "me", "us", "uk", "de", "fr", "es", "it", "nl",
  "be", "ch", "at", "au", "ca", "jp", "cn", "kr", "in", "br",
  "mx", "ru", "pl", "se", "no", "dk", "fi", "pt", "gr", "cz",
  "ro", "hu", "ie", "nz", "za", "sg", "hk", "tw", "id", "th",
  "vn", "ph", "my", "edu", "gov", "mil", "travel", "rentals",
  "properties", "vacation", "holiday", "haus", "casa", "xyz",
  "club", "online", "site", "website", "blog", "shop", "store",
]);

/**
 * Normalizes a raw domain input:
 * - Removes protocol (http://, https://)
 * - Removes www prefix
 * - Removes trailing paths
 * - Trims whitespace
 * - Lowercases
 */
function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remove protocol
  domain = domain.replace(/^(https?:\/\/)/i, "");

  // Remove www prefix
  domain = domain.replace(/^www\./i, "");

  // Remove trailing path, query, hash
  domain = domain.split("/")[0].split("?")[0].split("#")[0];

  // Remove port number
  domain = domain.split(":")[0];

  return domain.trim();
}

/**
 * Validates a normalized domain
 */
function validateDomain(domain: string): { valid: boolean; reason?: string } {
  // Check for empty
  if (!domain) {
    return { valid: false, reason: "Empty domain" };
  }

  // Check length
  if (domain.length > 253) {
    return { valid: false, reason: "Domain too long (max 253 characters)" };
  }

  // Check minimum length (at least x.xx)
  if (domain.length < 4) {
    return { valid: false, reason: "Domain too short" };
  }

  // Check for invalid characters
  if (!/^[a-z0-9.-]+$/.test(domain)) {
    return { valid: false, reason: "Invalid characters in domain" };
  }

  // Check format with regex
  if (!DOMAIN_REGEX.test(domain)) {
    return { valid: false, reason: "Invalid domain format" };
  }

  // Check each label (part between dots)
  const labels = domain.split(".");
  for (const label of labels) {
    if (label.length > 63) {
      return { valid: false, reason: "Label too long (max 63 characters)" };
    }
    if (label.startsWith("-") || label.endsWith("-")) {
      return { valid: false, reason: "Labels cannot start or end with hyphen" };
    }
  }

  // Validate TLD (last part)
  const tld = labels[labels.length - 1];
  if (tld.length < 2) {
    return { valid: false, reason: "Invalid TLD" };
  }

  // TLD must be letters only
  if (!/^[a-z]+$/.test(tld)) {
    return { valid: false, reason: "TLD must be letters only" };
  }

  return { valid: true };
}

/**
 * Parses domains from text input
 *
 * Handles:
 * - One domain per line
 * - Comma-separated domains
 * - Domains with protocols (http/https)
 * - Domains with www prefix
 *
 * @param input Raw text input containing domains
 * @returns Object with valid and invalid domains
 */
export function parseDomains(input: string): ParsedDomains {
  const valid: string[] = [];
  const invalid: { input: string; reason: string }[] = [];
  const seen = new Set<string>();

  // Split by newlines and commas
  const lines = input
    .split(/[\n,]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  for (const line of lines) {
    // Skip comments
    if (line.startsWith("#") || line.startsWith("//")) {
      continue;
    }

    const normalized = normalizeDomain(line);

    // Skip empty after normalization
    if (!normalized) {
      invalid.push({ input: line, reason: "Empty after normalization" });
      continue;
    }

    // Skip duplicates
    if (seen.has(normalized)) {
      continue; // Silent skip for duplicates
    }

    // Validate
    const validation = validateDomain(normalized);
    if (validation.valid) {
      seen.add(normalized);
      valid.push(normalized);
    } else {
      invalid.push({ input: line, reason: validation.reason || "Invalid domain" });
    }
  }

  return { valid, invalid };
}

/**
 * Parses a single domain and returns normalized form or null
 */
export function parseSingleDomain(input: string): string | null {
  const normalized = normalizeDomain(input);
  const validation = validateDomain(normalized);
  return validation.valid ? normalized : null;
}

/**
 * Quick check if a string looks like a domain
 * (For preview purposes - not full validation)
 */
export function looksLikeDomain(input: string): boolean {
  const normalized = normalizeDomain(input);
  return normalized.includes(".") && normalized.length >= 4;
}
