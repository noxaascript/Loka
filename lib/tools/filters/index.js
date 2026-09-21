import { filterGitDiff } from './gitDiff.js';
import { filterGrep } from './grep.js';
import { filterLs } from './ls.js';
import { filterJson } from './json.js';

export const FILTERS = {
  'git-diff': (t, o) => filterGitDiff(t, o.maxDiffLines),
  'grep': (t, o) => filterGrep(t, o.maxGrepResults),
  'ls': (t, o) => filterLs(t),
  'json': (t, o) => filterJson(t)
};
