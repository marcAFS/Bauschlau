import { createHash, timingSafeEqual } from "crypto";

// Konstante Vergleichszeit unabhängig von der Eingabelänge, um Timing-Angriffe zu erschweren.
export function timingSafeEqualStr(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}
