// src/utils/packageManager.js
// Omega Package Installer
// Supports: npm packages via CDN (unpkg/jsDelivr), custom .js files

const PKG_STORAGE_KEY = "omega_packages";
const PKG_CACHE_PREFIX = "omega_pkg_cache_";

// ── Known safe packages whitelist (optional — set to null to allow all) ──
// null = allow any package from CDN
export const PACKAGE_WHITELIST = null;

// ── CDN providers ─────────────────────────────────────────
export const CDN_PROVIDERS = {
  unpkg: (name, version) =>
    `https://unpkg.com/${name}${version ? "@" + version : ""}/dist/index.min.js`,
  jsdelivr: (name, version) =>
    `https://cdn.jsdelivr.net/npm/${name}${version ? "@" + version : ""}/dist/index.min.js`,
  esm: (name, version) =>
    `https://esm.sh/${name}${version ? "@" + version : ""}`,
};

// Common packages — known good CDN URLs
const KNOWN_PACKAGES = {
  lodash: { unpkg: "https://unpkg.com/lodash@4/lodash.min.js", global: "_" },
  axios: {
    unpkg: "https://unpkg.com/axios/dist/axios.min.js",
    global: "axios",
  },
  dayjs: { unpkg: "https://unpkg.com/dayjs/dayjs.min.js", global: "dayjs" },
  marked: { unpkg: "https://unpkg.com/marked/marked.min.js", global: "marked" },
  "fuse.js": {
    unpkg: "https://unpkg.com/fuse.js/dist/fuse.min.js",
    global: "Fuse",
  },
  dompurify: {
    unpkg: "https://unpkg.com/dompurify/dist/purify.min.js",
    global: "DOMPurify",
  },
  "chart.js": {
    unpkg: "https://unpkg.com/chart.js/dist/chart.umd.min.js",
    global: "Chart",
  },
  uuid: {
    jsdelivr: "https://cdn.jsdelivr.net/npm/uuid/dist/umd/uuidv4.min.js",
    global: "uuidv4",
  },
};

// ── Parse @requires from plugin manifest ─────────────────
export function parseRequires(code) {
  // Supports:
  //   @requires axios
  //   @requires lodash@4.17.21
  //   @requires my-lib.js (custom file)
  const block = code.match(/\/\*\*\s*@omega-plugin([\s\S]*?)\*\//)?.[1] || "";
  const lines = block.split("\n").filter((l) => l.includes("@requires"));
  return lines
    .map((line) => {
      const raw = line.replace(/.*@requires\s+/, "").trim();
      // Check if custom .js file
      if (raw.endsWith(".js")) {
        return { name: raw, version: null, type: "custom", raw };
      }
      // Parse name@version
      const atIdx = raw.indexOf("@", 1); // skip scoped packages like @scope/pkg
      if (atIdx > 0) {
        return {
          name: raw.slice(0, atIdx),
          version: raw.slice(atIdx + 1),
          type: "npm",
          raw,
        };
      }
      return { name: raw, version: null, type: "npm", raw };
    })
    .filter((p) => p.name);
}

// ── Load package storage ──────────────────────────────────
export function getInstalledPackages() {
  try {
    return JSON.parse(localStorage.getItem(PKG_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePackages(pkgs) {
  localStorage.setItem(PKG_STORAGE_KEY, JSON.stringify(pkgs));
}

export function isPackageInstalled(name, version) {
  const pkgs = getInstalledPackages();
  const pkg = pkgs[name];
  if (!pkg) return false;
  if (version && pkg.version !== version) return false;
  return true;
}

// ── Fetch & cache package code ────────────────────────────
async function fetchPackageCode(url) {
  const cacheKey = PKG_CACHE_PREFIX + btoa(url).slice(0, 40);
  // Check localStorage cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const code = await res.text();

  // Cache it (max ~2MB per package)
  if (code.length < 2 * 1024 * 1024) {
    try {
      localStorage.setItem(cacheKey, code);
    } catch {
      /* storage full */
    }
  }
  return code;
}

// ── Resolve CDN URL for a package ────────────────────────
function resolvePackageUrl(name, version) {
  // Check known packages first
  const known = KNOWN_PACKAGES[name.toLowerCase()];
  if (known) {
    return { url: known.unpkg || known.jsdelivr, global: known.global };
  }
  // Fallback to unpkg
  const url = version
    ? `https://unpkg.com/${name}@${version}`
    : `https://unpkg.com/${name}`;
  return { url, global: null };
}

// ── Install a single package ──────────────────────────────
export async function installPackage({
  name,
  version,
  type,
  customCode,
  customUrl,
}) {
  const pkgs = getInstalledPackages();

  if (type === "custom") {
    // Custom .js file — code passed directly
    if (!customCode && !customUrl)
      throw new Error("Custom package requires code or URL");
    const code = customCode || (await fetchPackageCode(customUrl));
    pkgs[name] = {
      name,
      version: "0.0.0",
      type: "custom",
      code,
      installedAt: Date.now(),
    };
    savePackages(pkgs);
    return { name, code };
  }

  // npm / CDN package
  const { url, global: globalName } = resolvePackageUrl(name, version);
  const code = await fetchPackageCode(url);
  const resolvedVersion = version || "latest";

  pkgs[name] = {
    name,
    version: resolvedVersion,
    type: "npm",
    url,
    globalName: globalName || name,
    code,
    installedAt: Date.now(),
  };
  savePackages(pkgs);
  return { name, version: resolvedVersion, code, globalName };
}

// ── Uninstall package ─────────────────────────────────────
export function uninstallPackage(name) {
  const pkgs = getInstalledPackages();
  const cacheKey =
    PKG_CACHE_PREFIX +
    (pkgs[name]?.url ? btoa(pkgs[name].url).slice(0, 40) : "");
  delete pkgs[name];
  savePackages(pkgs);
  try {
    localStorage.removeItem(cacheKey);
  } catch {}
}

// ── Load packages into sandbox context ────────────────────
export function loadPackagesIntoContext(packageNames) {
  const pkgs = getInstalledPackages();
  const context = {};

  for (const name of packageNames) {
    const pkg = pkgs[name];
    if (!pkg?.code) continue;
    try {
      // Execute package code in a mini sandbox, capture globals
      const before = Object.keys(window).length;
      // eslint-disable-next-line no-new-func
      const factory = new Function("module", "exports", "require", pkg.code);
      const mod = { exports: {} };
      const exp = {};

      try {
        factory(mod, exp, (r) => {
          // basic require shim — return already-loaded package
          return context[r] || window[r] || {};
        });
      } catch {}

      // Try module.exports first, then window global
      const globalName = pkg.globalName || name;
      context[name] =
        mod.exports && Object.keys(mod.exports).length > 0
          ? mod.exports
          : window[globalName] || {};
      context[globalName] = context[name];
    } catch (err) {
      console.warn(`[OPI] Failed to load package ${name}:`, err);
    }
  }
  return context;
}

// ── Check which requires are missing ─────────────────────
export function getMissingPackages(requires) {
  return requires.filter(
    (r) => r.type !== "custom" && !isPackageInstalled(r.name, r.version),
  );
}

// ── Get package info from npm registry ───────────────────
export async function fetchPackageInfo(name) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    return {
      name: data.name,
      version: data.version,
      description: data.description,
      homepage: data.homepage,
      license: data.license,
    };
  } catch {
    return { name, version: "unknown", description: "" };
  }
}

// ── Format bytes ──────────────────────────────────────────
export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Get total cache size ──────────────────────────────────
export function getPackageCacheSize() {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PKG_CACHE_PREFIX)) {
      total += (localStorage.getItem(key) || "").length;
    }
  }
  return total;
}

export function clearPackageCache() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PKG_CACHE_PREFIX)) localStorage.removeItem(key);
  }
}
