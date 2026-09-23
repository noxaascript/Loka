#!/usr/bin/env node
// tools/changelog.mjs
// Generate CHANGELOG.md dari git commits

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const CHANGELOG = 'CHANGELOG.md';
const CATEGORIES = {
  feat:     { title: ' Features',       order: 1 },
  fix:      { title: ' Bug Fixes',      order: 2 },
  perf:     { title: ' Performance',    order: 3 },
  refactor: { title: '  Refactor',       order: 4 },
  docs:     { title: ' Documentation',  order: 5 },
  style:    { title: ' Styles',         order: 6 },
  test:     { title: ' Tests',          order: 7 },
  chore:    { title: ' Chores',         order: 8 },
  other:    { title: ' Other',          order: 99 }
};

function git(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function getLatestTag() {
  // Cari tag versi terakhir (format: v0.0.0-*)
  const tags = git('git tag --list "v0.0.0-*" --sort=-creatordate');
  if (!tags) return null;
  return tags.split('\n')[0];
}

function getCommits(sinceTag) {
  // Ambil commit sejak tag terakhir (atau semua kalau nggak ada tag)
  const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';
  const format = '%H|%s|%an|%ad';
  const raw = git(`git log ${range} --pretty=format:"${format}" --date=short`);
  
  if (!raw) return [];
  
  return raw.split('\n').map(line => {
    const [hash, subject, author, date] = line.split('|');
    return { hash: hash.slice(0, 7), subject, author, date };
  }).filter(c => c.subject && !c.subject.startsWith('chore: bump'));
}

function parseCommit(subject) {
  // Format: "type(scope): message" atau "type: message" atau cuma "message"
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (match) {
    return { type: match[1], scope: match[2] || null, message: match[3] };
  }
  return { type: 'other', scope: null, message: subject };
}

function groupCommits(commits) {
  const grouped = {};
  for (const c of commits) {
    const { type, scope, message } = parseCommit(c.subject);
    const cat = CATEGORIES[type] ? type : 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...c, message, scope, type });
  }
  return grouped;
}

function formatSection(catKey, items) {
  const cat = CATEGORIES[catKey];
  let out = `### ${cat.title}\n\n`;
  for (const item of items) {
    const scope = item.scope ? `**${item.scope}**: ` : '';
    out += `- ${scope}${item.message} ([${item.hash}](commit/${item.hash}))\n`;
  }
  return out + '\n';
}

function generateSection(version, date, commits) {
  if (!commits.length) return '';
  const grouped = groupCommits(commits);
  const sorted = Object.keys(grouped).sort((a, b) => 
    (CATEGORIES[a]?.order || 99) - (CATEGORIES[b]?.order || 99)
  );

  let section = `## ${version}  ${date}\n\n`;
  for (const cat of sorted) {
    section += formatSection(cat, grouped[cat]);
  }
  return section;
}

function loadExisting() {
  if (!existsSync(CHANGELOG)) {
    return `# Changelog

All notable changes to Loka are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/)  Version: \`0.0.0-beta.YYYYMMDD.hash\`

---

`;
  }
  return readFileSync(CHANGELOG, 'utf8');
}

function injectNewSection(existing, newSection) {
  // Sisipkan setelah header (setelah "---" pertama)
  const marker = '---\n\n';
  const idx = existing.indexOf(marker);
  if (idx === -1) {
    return existing + '\n' + newSection;
  }
  const header = existing.slice(0, idx + marker.length);
  const rest = existing.slice(idx + marker.length);
  return header + newSection + rest;
}

// === MAIN ===
const version = process.argv[2] || 'v0.0.0-unknown';
const date = new Date().toISOString().slice(0, 10);

const lastTag = getLatestTag();
console.log('[changelog] Last tag:', lastTag || '(none  full history)');

const commits = getCommits(lastTag);
console.log('[changelog] Commits since last tag:', commits.length);

if (!commits.length) {
  console.log('[changelog] Tidak ada commit baru. Skip.');
  process.exit(0);
}

const newSection = generateSection(version, date, commits);
const existing = loadExisting();
const updated = injectNewSection(existing, newSection);

writeFileSync(CHANGELOG, updated, 'utf8');
console.log('[changelog] Written:', CHANGELOG);
console.log('[changelog] Section preview:');
console.log(''.repeat(50));
console.log(newSection.slice(0, 800));
console.log(''.repeat(50));