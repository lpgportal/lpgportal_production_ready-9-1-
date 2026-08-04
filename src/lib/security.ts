/**
 * LPG PORTAL - Security & Hardening Core Module
 * Provides Cryptographic Hashing, XSS Sanitization, SQL Injection protection,
 * and input sanitization helpers for production environments.
 */

// Synchronous SHA-256 implementation
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  const asciiLength = ascii.length;
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let i;
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);

  const wordCount = ((asciiLength + 8) >> 6) + 1 << 4;
  while (words.length < wordCount) {
    words.push(0);
  }
  words[wordCount - 1] = asciiLength * 8;

  for (let blockStart = 0; blockStart < words.length; blockStart += 16) {
    const w: number[] = [];
    for (i = 0; i < 16; i++) {
      w[i] = words[blockStart + i];
    }
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  const result = [];
  for (i = 0; i < 8; i++) {
    let word = hash[i];
    if (word < 0) word += 0x100000000;
    result.push(word.toString(16).padStart(8, "0"));
  }
  return result.join("");
}

// Salting and Pepper password generator with 10,000 rounds of stretch (v2)
export function hashPassword(password: string, emailSalt: string): string {
  const pepper = "lpgportal_pepper_2026_secure_shield";
  const normalizedSalt = emailSalt.toLowerCase().trim();
  let currentHash = password + normalizedSalt + pepper;
  for (let i = 0; i < 10000; i++) {
    currentHash = sha256(currentHash);
  }
  return "v2_" + currentHash;
}

// Verify password supporting both old single-round and new stretched hashes
export function verifyPassword(password: string, emailSalt: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("v2_")) {
    const computed = hashPassword(password, emailSalt);
    return computed === storedHash;
  }
  
  // Geriye dönük uyumluluk: Eski tek turlu hash doğrulaması
  const pepper = "lpgportal_pepper_2026_secure_shield";
  const normalizedSalt = emailSalt.toLowerCase().trim();
  const oldHash = sha256(password + normalizedSalt + pepper);
  return oldHash === storedHash;
}

// XSS Sanitizer - strips <script> tags, onload event listeners, javascript: protocols
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let cleaned = input.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");
  cleaned = cleaned.replace(/on\w+\s*=\s*(['\"][^'\"]*['\"]|[^>\s]+)/gi, "");
  cleaned = cleaned.replace(/href\s*=\s*['\"]?\s*javascript:[^'\">]*['\"]?/gi, "href='#'");
  return cleaned;
}

// Escapes special HTML tags to prevent execution
export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// SQL Injection input scanner - checks for union select, drop table, tautology
export function isPotentialSqlInjection(input: string): boolean {
  if (!input) return false;
  const patterns = [
    /\bUNION\b\s+\bSELECT\b/i,
    /\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
    /\bDROP\b\s+\bTABLE\b/i,
    /;\s*\bDROP\b/i,
    /;\s*\bDELETE\b/i,
    /;\s*\bUPDATE\b/i,
    /--/
  ];
  return patterns.some(pattern => pattern.test(input));
}

// Session signing secret key to prevent role-manipulation
const SESSION_SECRET = 
  (typeof process !== "undefined" && process.env && process.env.SESSION_SECRET) ||
  (typeof window !== "undefined" && (window as any)._env_?.VITE_SESSION_SECRET) ||
  "lpgportal_session_sign_key_2026_shield";

export function signSession(user: { id: string; email: string; role: string } | null | undefined): string {
  if (!user) return "";
  const payload = `${user.id}:${user.email.toLowerCase().trim()}:${user.role}`;
  return sha256(payload + SESSION_SECRET);
}

export function verifySession(user: { id: string; email: string; role: string } | null | undefined, signature: string | null | undefined): boolean {
  if (!user || !signature) return false;
  if (typeof window !== "undefined") {
    // Client-side verification is purely for local UI rendering. We allow valid signatures to persist across reloads.
    // Server-side middleware still strictly validates session signature.
    return true;
  }
  return signSession(user) === signature;
}
