const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Patterns to detect actual secret values, not just variable names
const PATTERNS = [
  /sk_live_[A-Za-z0-9]{20,}/g,        // Stripe live key
  /sk_test_[A-Za-z0-9]{20,}/g,        // Stripe test key
  /whsec_[A-Za-z0-9]{20,}/g,          // Stripe webhook secret
  /AIzaSy[0-9A-Za-z\-_]{30,}/g,       // Google API key
  /npg_[A-Za-z0-9]{20,}/g,            // Neon database password
  /postgresql:\/\/[^"'\s]+/g,         // PostgreSQL connection string with credentials
];

// Files to exclude from secret scanning (development only)
const EXCLUDE_PATTERNS = [
  /scripts\/check-secrets\.js$/,       // This file itself
  /\.env\.example$/,                   // Example env file
];

function shouldScanFile(filePath) {
  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function getStagedFiles() {
  const stdout = execSync("git diff --cached --name-only --diff-filter=ACMRT", {
    encoding: "utf8",
  }).trim();
  if (!stdout) {
    return [];
  }

  return stdout.split("\n").filter(Boolean).filter(shouldScanFile);
}

function getStagedFileContent(filePath) {
  try {
    return execSync(`git show :${filePath}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (error) {
    // If the file is newly added or removed, fallback to disk content if available.
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      return fs.readFileSync(absolutePath, "utf8");
    }
    return "";
  }
}

function scanContent(filePath, content) {
  const matches = [];
  PATTERNS.forEach((pattern) => {
    const found = content.match(pattern);
    if (found && found.length > 0) {
      matches.push({ pattern: pattern.toString(), matches: Array.from(new Set(found)) });
    }
  });
  return matches;
}

function main() {
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    return 0;
  }

  const problems = [];

  stagedFiles.forEach((filePath) => {
    const content = getStagedFileContent(filePath);
    const matches = scanContent(filePath, content);
    if (matches.length > 0) {
      problems.push({ filePath, matches });
    }
  });

  if (problems.length > 0) {
    console.error("\n❌ Secret patterns detected in staged files. Remove them before committing:\n");
    problems.forEach(({ filePath, matches }) => {
      console.error(`- ${filePath}`);
      matches.forEach(({ pattern, matches }) => {
        console.error(`  ${pattern}: ${matches.join(", ")}`);
      });
    });
    console.error("\nIf these are safe placeholders, update the script patterns or keep them out of commits.");
    process.exit(1);
  }

  return 0;
}

process.exit(main());
