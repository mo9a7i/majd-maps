/**
 * Fetch all cell towers in Saudi Arabia from CellMapper and export them
 * as a majd-maps Project JSON (markers + shapes).
 *
 * Usage:  pnpm getTowers
 *
 * Output: towers.json  (Project-compatible, drop it into the app's Import JSON)
 */

import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE = "https://api.cellmapper.net/v6";
const OUTPUT = path.resolve(process.cwd(), "towers.json");

/** Bounding box — format: minLng, minLat, maxLng, maxLat */
const SA_BOUNDS = {
  minLat: 25.742075,
  maxLat: 26.134481,
  minLng: 49.206047,
  maxLng: 50.079803,
};

/** Grid tile size in degrees — set large enough to cover the whole bbox in one tile */
const TILE_DEG = 2;

/** RATs to query per provider */
const RATS = ["LTE", "NR", "UMTS", "GSM"] as const;
type RAT = (typeof RATS)[number];

/** Color per provider name (fuzzy match) */
const PROVIDER_COLORS: [RegExp, string][] = [
  [/stc|al.?jawal/i, "#3b82f6"], // blue
  [/mobily/i, "#22c55e"],         // green
  [/zain/i, "#ef4444"],           // red
  [/roam/i, "#a855f7"],           // purple
];
const DEFAULT_COLOR = "#6b7280"; // gray

/** Delay between requests to be polite (ms) */
const DEFAULT_DELAY_MS = 800;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Provider {
  countryID: number;
  providerID: number;
  providerName: string;
  visible: boolean;
}

interface Tower {
  RAT: string;
  RATSubType: string;
  siteID: string;
  regionID: string;
  latitude: number;
  longitude: number;
  visible: boolean;
  firstseendate: number;
  lastseendate: number;
  channels: number[];
  bandwidths: number[];
  bandNumbers: number[];
  estimatedBandData: unknown[];
  towerMover: number;
  bandwidthData: boolean;
  frequencyData: boolean;
  cells: Record<string, unknown>;
  towerAttributes: Record<string, unknown>;
}

interface CellMapperResponse<T> {
  license: string;
  statusCode: string;
  responseData: T;
}

/** Saudi Arabia providers — sourced from getAllNetworks (MCC=420) */
const SA_PROVIDERS: Provider[] = [
  { countryID: 420, providerID: 1,   providerName: "Al Jawal (STC)", visible: true },
  { countryID: 420, providerID: 3,   providerName: "Mobily",         visible: true },
  { countryID: 420, providerID: 4,   providerName: "Zain SA",        visible: true },
  { countryID: 420, providerID: 69,  providerName: "Roam",           visible: true },
  { countryID: 420, providerID: 9,   providerName: "420-9",          visible: true },
  { countryID: 420, providerID: 212, providerName: "Provider 212",   visible: true },
];

interface Marker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color: string;
}

interface Project {
  version: string;
  markers: Marker[];
  shapes: [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function colorFor(providerName: string): string {
  for (const [re, color] of PROVIDER_COLORS) {
    if (re.test(providerName)) return color;
  }
  return DEFAULT_COLOR;
}

function buildLabel(tower: Tower, providerName: string, rat: RAT): string {
  const parts: string[] = [
    `[${providerName}]`,
    `RAT: ${rat}`,
    `siteID: ${tower.siteID}`,
  ];
  if (tower.bandNumbers?.length) parts.push(`Bands: ${tower.bandNumbers.join(", ")}`);
  if (tower.channels?.length) parts.push(`Channels: ${tower.channels.join(", ")}`);
  if (tower.bandwidths?.length) parts.push(`BWs: ${tower.bandwidths.join(", ")} MHz`);
  if (tower.firstseendate) {
    parts.push(`First seen: ${new Date(tower.firstseendate * 1000).toISOString().slice(0, 10)}`);
  }
  if (tower.lastseendate) {
    parts.push(`Last seen: ${new Date(tower.lastseendate * 1000).toISOString().slice(0, 10)}`);
  }
  return parts.join(" | ");
}

/** Parse rate-limit headers and return the ms to wait before next request */
function parseRateHeaders(headers: Headers): number {
  // Standard headers
  const retryAfter = headers.get("Retry-After");
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");
  if (remaining === "0" && reset) {
    const resetMs = parseInt(reset, 10) * 1000;
    const waitMs = resetMs - Date.now();
    if (waitMs > 0) return waitMs;
  }

  return 0;
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function getTowersForTile(
  mcc: number,
  mnc: number,
  rat: RAT,
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  retries = 3
): Promise<Tower[]> {
  const url =
    `${BASE}/getTowers?MCC=${mcc}&MNC=${mnc}&RAT=${rat}` +
    `&boundsNELatitude=${neLat}&boundsNELongitude=${neLng}` +
    `&boundsSWLatitude=${swLat}&boundsSWLongitude=${swLng}` +
    `&filterFrequency=false&showOnlyMine=false&showUnverifiedOnly=false&showENDCOnly=false` +
    `&cache=${Date.now()}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url);

    // Check for rate limit via HTTP status
    if (res.status === 429) {
      const wait = parseRateHeaders(res.headers) || 30_000;
      console.warn(`  ⏳ Rate limited (429). Waiting ${(wait / 1000).toFixed(1)}s...`);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      console.warn(`  ⚠️  HTTP ${res.status} for MCC=${mcc} MNC=${mnc} RAT=${rat}. Skipping tile.`);
      return [];
    }

    // Check rate limit headers even on 200
    const waitFromHeaders = parseRateHeaders(res.headers);

    const json = (await res.json()) as CellMapperResponse<Tower[] | string>;

    if (json.statusCode === "NEED_RECAPTCHA") {
      const wait = 60_000;
      console.warn(`  🔒 RECAPTCHA triggered. Waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }

    if (json.statusCode !== "OKAY") {
      console.warn(`  ⚠️  statusCode=${json.statusCode}. Skipping.`);
      return [];
    }

    // Honour any remaining rate-limit headers
    if (waitFromHeaders > 0) {
      console.log(`  ⏳ Rate header: waiting ${(waitFromHeaders / 1000).toFixed(1)}s...`);
      await sleep(waitFromHeaders);
    }

    return Array.isArray(json.responseData) ? (json.responseData as Tower[]) : [];
  }

  console.warn(`  ❌ Exhausted retries for tile. Skipping.`);
  return [];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const saProviders = SA_PROVIDERS;

  console.log(`\n🇸🇦 Saudi Arabia providers (${saProviders.length}):`);
  saProviders.forEach((p) =>
    console.log(`   MCC=${p.countryID}  MNC=${p.providerID}  ${p.providerName}`)
  );

  // Build grid tiles
  const tiles: [number, number, number, number][] = [];
  for (let lat = SA_BOUNDS.minLat; lat < SA_BOUNDS.maxLat; lat += TILE_DEG) {
    for (let lng = SA_BOUNDS.minLng; lng < SA_BOUNDS.maxLng; lng += TILE_DEG) {
      tiles.push([lat, lng, Math.min(lat + TILE_DEG, SA_BOUNDS.maxLat), Math.min(lng + TILE_DEG, SA_BOUNDS.maxLng)]);
    }
  }
  console.log(`\n🗺  Grid: ${tiles.length} tiles × ${RATS.length} RATs × ${saProviders.length} providers`);

  const seen = new Set<string>(); // deduplicate by siteID+RAT+MNC
  const markers: Marker[] = [];

  for (const provider of saProviders) {
    const color = colorFor(provider.providerName);
    console.log(`\n▶ ${provider.providerName} (MNC=${provider.providerID})`);

    for (const rat of RATS) {
      let tileCount = 0;
      let newTowers = 0;

      for (const [swLat, swLng, neLat, neLng] of tiles) {
        const towers = await getTowersForTile(
          provider.countryID,
          provider.providerID,
          rat,
          swLat, swLng, neLat, neLng
        );

        for (const t of towers) {
          const key = `${provider.providerID}:${rat}:${t.siteID}`;
          if (seen.has(key)) continue;
          seen.add(key);

          markers.push({
            id: randomUUID(),
            lat: t.latitude,
            lng: t.longitude,
            label: buildLabel(t, provider.providerName, rat),
            color,
          });
          newTowers++;
        }

        tileCount++;
        process.stdout.write(`\r   ${rat} — tile ${tileCount}/${tiles.length}  (+${newTowers} towers)   `);
        await sleep(DEFAULT_DELAY_MS);
      }

      console.log(`\n   ✓ ${rat}: ${newTowers} towers`);
    }
  }

  const project: Project = {
    version: "1.0.0",
    markers,
    shapes: [],
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(project, null, 2), "utf-8");
  console.log(`\n✅ Done! ${markers.length} total towers → ${OUTPUT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
