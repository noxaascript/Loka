export const CSS = `
*,*::before,*::after{box-sizing:border-box}
*{margin:0;padding:0}

/* ============================================================
   TOKENS — "SIGNAL ROOM"
   Loka is a routing node that forks one request across many
   providers. The UI is the raised floor of that node: a slim
   instrument rail, live telemetry, numbered scopes, target-frame
   panels, and a blueprint grid. Dark = the ops screen (obsidian +
   phosphor cyan); light = the same room on drafting paper.
   Ember stays on the brand mark and "live/hot" states only.
   ============================================================ */
:root{
  /* brand (ember) — reserved for the glyph & live states */
  --ember:#e2540c; --ember-2:#f97316; --amber:#f59e0b; --live:#c2410c;

  /* system accent (phosphor cyan → blue) */
  --accent:#0e7490; --accent-2:#0f86a3; --accent-hi:#155e75;
  --accent-lo:rgba(14,116,144,.10);
  --accent-grad:linear-gradient(135deg,#0891b2,#0e7490);

  --bg:#f2eee4;
  --grid-line:rgba(46,52,72,.055);
  --glow-a:rgba(14,116,144,.10);
  --glow-b:rgba(245,158,11,.10);

  --surface:rgba(255,253,247,.80);
  --surface-hi:rgba(255,253,248,.96);
  --surface-sunken:rgba(38,44,64,.045);
  --surface-plate:linear-gradient(180deg,#fffdf7,#ece6da);

  --line:rgba(30,36,52,.12);
  --line-2:rgba(30,36,52,.24);

  --ink:#1b2232;
  --ink-2:#545e70;
  --ink-3:#8d96a5;

  --corner:rgba(14,116,144,.36);

  --ok:#15803d;      --ok-bg:rgba(21,128,61,.11);
  --warn:#b45309;    --warn-bg:rgba(180,83,9,.13);
  --err:#b91c1c;     --err-bg:rgba(185,28,28,.10);
  --info:#1d4ed8;    --info-bg:rgba(29,78,216,.10);

  --r-xs:7px; --r-sm:10px; --r:14px; --r-lg:20px; --r-xl:26px;
  --rail:64px; --sb:216px;
  --blur:blur(18px) saturate(150%);
  --blur-lg:blur(26px) saturate(160%);

  --sh-1:0 1px 2px rgba(44,38,28,.07),0 1px 3px rgba(44,38,28,.05);
  --sh-2:0 4px 12px rgba(44,38,28,.09),0 2px 4px rgba(44,38,28,.05);
  --sh-3:0 16px 44px rgba(44,38,28,.16);
  --sh-accent:0 6px 20px rgba(14,116,144,.26);

  --t-fast:130ms cubic-bezier(.4,0,.2,1);
  --t:220ms cubic-bezier(.4,0,.2,1);

  --mono:ui-monospace,"SF Mono","JetBrains Mono","Cascadia Code",Menlo,Consolas,monospace;
  --sans:"Inter","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;

  color-scheme:light;
}

[data-theme="dark"]{
  --live:#fb923c;

  --accent:#22d3ee; --accent-2:#67e8f9; --accent-hi:#a5f3fc;
  --accent-lo:rgba(34,211,238,.12);
  --accent-grad:linear-gradient(135deg,#22d3ee,#0ea5e9);

  --bg:#0a0e13;
  --grid-line:rgba(148,163,184,.06);
  --glow-a:rgba(34,211,238,.08);
  --glow-b:rgba(251,146,60,.06);

  --surface:rgba(255,255,255,.045);
  --surface-hi:rgba(255,255,255,.085);
  --surface-sunken:rgba(0,0,0,.30);
  --surface-plate:linear-gradient(180deg,#151b24,#0d1117);

  --line:rgba(148,163,184,.15);
  --line-2:rgba(148,163,184,.28);

  --ink:#e2e8f0;
  --ink-2:#94a2b8;
  --ink-3:#64748b;

  --corner:rgba(34,211,238,.48);

  --ok:#4ade80;      --ok-bg:rgba(74,222,128,.14);
  --warn:#fbbf24;    --warn-bg:rgba(251,191,36,.15);
  --err:#f87171;     --err-bg:rgba(248,113,113,.14);
  --info:#7db4ff;    --info-bg:rgba(125,180,255,.14);

  --sh-1:0 1px 2px rgba(0,0,0,.40);
  --sh-2:0 4px 14px rgba(0,0,0,.46);
  --sh-3:0 18px 50px rgba(0,0,0,.58);
  --sh-accent:0 6px 22px rgba(34,211,238,.25);

  color-scheme:dark;
}

/* ============================================================
   BASE CANVAS — blueprint grid + signal glow
   ============================================================ */
html{height:100%;-webkit-text-size-adjust:100%}
body{
  min-height:100%;
  font-family:var(--sans);
  font-size:13.5px;
  line-height:1.55;
  color:var(--ink);
  background:var(--bg);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  font-feature-settings:"cv11","ss01","kern","liga";
  overflow-x:hidden;
}
[data-theme="dark"] body{background:var(--bg)}

.ambient{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(1000px 620px at 84% -10%,var(--glow-a),transparent 58%),
    radial-gradient(820px 560px at 4% 108%,var(--glow-b),transparent 58%),
    linear-gradient(var(--grid-line) 1px,transparent 1px),
    linear-gradient(90deg,var(--grid-line) 1px,transparent 1px);
  background-size:auto,auto,34px 34px,34px 34px;
}

::selection{background:rgba(34,211,238,.26)}

h1{
  font-size:1.5rem;font-weight:640;letter-spacing:-.03em;line-height:1.2;
  color:var(--ink);
}
h2{
  font-family:var(--mono);font-size:.68rem;font-weight:600;color:var(--ink-3);
  text-transform:uppercase;letter-spacing:.13em;
  margin:2.25rem 0 .9rem;
}
h3{font-size:.98rem;font-weight:600;color:var(--ink);letter-spacing:-.01em}
p{margin-bottom:.7rem}
a{color:var(--accent);text-decoration:none;transition:color var(--t-fast)}
a:hover{color:var(--accent-2)}
.muted{color:var(--ink-2)}
.dim{color:var(--ink-3)}

code{
  font-family:var(--mono);font-size:.82em;
  background:var(--surface-sunken);border:1px solid var(--line);
  padding:.15rem .45rem;border-radius:var(--r-xs);
  color:var(--ink);word-break:break-all;
}
pre{
  font-family:var(--mono);font-size:.78rem;line-height:1.65;
  background:var(--surface);border:1px solid var(--line);
  border-radius:var(--r);padding:1rem 1.15rem;
  overflow-x:auto;color:var(--ink);
  white-space:pre-wrap;word-break:break-word;
}

:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:var(--r-xs)}

*{scrollbar-width:thin;scrollbar-color:rgba(120,140,160,.45) transparent}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:rgba(120,140,160,.35);border-radius:99px;border:2px solid transparent;background-clip:content-box}
::-webkit-scrollbar-thumb:hover{background:rgba(120,140,160,.6);border:2px solid transparent;background-clip:content-box}

/* ============================================================
   INSTRUMENT RAIL
   A 64px port-strip with the brand glyph, numbered nav targets and
   the theme switch. Expand to 216px ("scan" state) via the chevron
   straddling its right edge. On mobile it becomes a drawer.
   ============================================================ */
aside{
  position:fixed;inset:0 auto 0 0;z-index:40;
  width:var(--rail);
  display:flex;flex-direction:column;
  padding:.6rem 0 .7rem;
  background:var(--surface);
  backdrop-filter:var(--blur-lg);-webkit-backdrop-filter:var(--blur-lg);
  border-right:1px solid var(--line);
  box-shadow:var(--sh-2);
  transition:width .28s cubic-bezier(.4,0,.2,1),transform .28s cubic-bezier(.4,0,.2,1);
  will-change:width,transform;
  overflow:hidden;
}
body.rail-open aside{width:var(--sb)}

.brand{
  display:flex;flex-direction:column;align-items:center;gap:.5rem;
  padding:.4rem .6rem .95rem;margin-bottom:.4rem;
  border-bottom:1px solid var(--line);
}
.brand-glyph{display:flex;align-items:center;justify-content:center;border-radius:9px;transition:transform var(--t-fast)}
.brand-glyph:hover{transform:scale(1.05)}
.brand-glyph:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.brand-name{
  font-size:1.18rem;font-weight:680;letter-spacing:-.035em;
  color:var(--ink);line-height:1;
}
.version-pill{
  font-family:var(--mono);font-size:.56rem;letter-spacing:-.02em;
  color:var(--ink-3);background:var(--surface-sunken);
  border:1px solid var(--line);border-radius:var(--r-xs);
  padding:.18rem .45rem;cursor:help;max-width:100%;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.update-badge{
  display:none;align-items:center;justify-content:center;gap:.35rem;
  width:100%;padding:.4rem .6rem;
  font-family:var(--mono);font-size:.62rem;font-weight:600;letter-spacing:.04em;
  text-transform:uppercase;color:#fff;border:1px solid transparent;border-radius:var(--r-sm);
  background:linear-gradient(135deg,#f59e0b,#ef4444);
  box-shadow:0 4px 14px rgba(245,158,11,.32);
  cursor:pointer;white-space:nowrap;
  transition:transform var(--t-fast),box-shadow var(--t-fast);
}
.update-badge:hover{transform:translateY(-1px);box-shadow:0 7px 20px rgba(245,158,11,.42)}
.update-badge .ui-icon{flex-shrink:0}

/* collapsed rail shows only glyphs + icons */
body:not(.rail-open) .brand-name,
body:not(.rail-open) .version-pill,
body:not(.rail-open) .section-label,
body:not(.rail-open) .nav-label,
body:not(.rail-open) .nav-idx{display:none}

aside nav{flex:1;display:flex;flex-direction:column;gap:2px;padding:.35rem .45rem;overflow-y:auto}
.section-label{
  font-family:var(--mono);font-size:.6rem;font-weight:600;color:var(--ink-3);
  text-transform:uppercase;letter-spacing:.14em;
  padding:.85rem .55rem .25rem;user-select:none;
}
.nav-item{
  display:flex;align-items:center;gap:.65rem;
  padding:.55rem .55rem;border-radius:9px;
  font-size:.85rem;font-weight:500;color:var(--ink-2);
  position:relative;white-space:nowrap;
  transition:background var(--t-fast),color var(--t-fast);
}
body:not(.rail-open) .nav-item{justify-content:center;padding:.62rem 0}
.nav-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.nav-icon{
  display:inline-flex;align-items:center;justify-content:center;
  width:20px;flex-shrink:0;color:var(--ink-3);
  transition:color var(--t-fast),transform var(--t-fast);
}
.nav-idx{margin-left:auto;font-family:var(--mono);font-size:.6rem;letter-spacing:.04em;color:var(--ink-3)!important}
.nav-item:hover{background:var(--surface-sunken);color:var(--ink)}
.nav-item:hover .nav-icon{color:var(--accent);transform:scale(1.08)}
.nav-item.active{
  color:var(--accent);font-weight:600;
  background:var(--accent-lo);
}
.nav-item.active .nav-icon{color:var(--accent)}
.nav-item.active .nav-idx{color:var(--accent)!important}
.nav-item.active::before{
  content:'';position:absolute;left:-.45rem;top:16%;bottom:16%;width:3px;
  border-radius:0 3px 3px 0;background:var(--accent);
}

aside .sidebar-foot{
  display:flex;flex-direction:column;gap:.35rem;
  padding:.55rem .45rem 0;margin-top:.35rem;border-top:1px solid var(--line);
}
.icon-btn{
  width:100%;display:flex;align-items:center;justify-content:center;
  padding:.5rem;border-radius:9px;cursor:pointer;
  background:var(--surface-sunken);border:1px solid var(--line);
  color:var(--ink-2);font-family:var(--sans);font-size:.8rem;font-weight:600;
  transition:background var(--t-fast),color var(--t-fast),border-color var(--t-fast);
}
.icon-btn:hover{background:var(--surface-hi);color:var(--ink);border-color:var(--line-2)}
.theme-icon{display:inline-flex}

/* chevron straddling the rail's right edge */
#railToggle{
  position:fixed;top:14px;left:var(--rail);z-index:45;
  width:26px;height:26px;display:flex;align-items:center;justify-content:center;
  padding:0;border-radius:50%;cursor:pointer;
  color:var(--ink-2);background:var(--surface-hi);border:1px solid var(--line-2);
  box-shadow:var(--sh-2);font-size:.95rem;line-height:1;
  transform:translateX(-50%);
  transition:left .28s cubic-bezier(.4,0,.2,1),color var(--t-fast),background var(--t-fast);
}
#railToggle span{display:inline-block;transition:transform .28s cubic-bezier(.4,0,.2,1)}
#railToggle:hover{color:var(--accent);background:var(--surface-hi)}
body.rail-open #railToggle{left:var(--sb)}
body.rail-open #railToggle span{transform:rotate(180deg)}

/* ============================================================
   PAGE
   ============================================================ */
main{
  margin-left:var(--rail);position:relative;z-index:1;
  padding:1.45rem 2.2rem 3rem;
  max-width:1280px;min-width:0;
  transition:margin-left .28s cubic-bezier(.4,0,.2,1);
}
body.rail-open main{margin-left:var(--sb)}

.page-header{margin-bottom:1.25rem}
.page-eyebrow{
  display:flex;align-items:center;gap:.5rem;
  font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-3);
  margin-bottom:.35rem;
}
.page-eyebrow .eb-slang{color:var(--accent);font-weight:600}
.page-subtitle{color:var(--ink-3);font-size:.82rem;margin:.25rem 0 0}

/* ============================================================
   TELEMETRY TICKER  — live readout strip
   ============================================================ */
.ticker{
  display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;
  margin:0 0 1.35rem;padding:.55rem .95rem;
  font-family:var(--mono);font-size:.72rem;letter-spacing:.02em;
  color:var(--ink-2);background:var(--surface);
  border:1px solid var(--line);border-radius:var(--r-sm);box-shadow:var(--sh-1);
}
.ticker b{color:var(--accent);font-weight:600;font-variant-numeric:tabular-nums}
.ticker .hot{color:var(--live)}
.ticker .sep{color:var(--line-2);user-select:none}
.ticker .cursor{
  display:inline-block;width:8px;height:14px;flex-shrink:0;
  background:var(--accent);box-shadow:0 0 9px var(--accent);
  animation:blink 1.15s steps(2,start) infinite;
}
@keyframes blink{to{visibility:hidden}}

/* ============================================================
   LAYOUT PRIMITIVES
   ============================================================ */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.8rem}
.toolbar{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin:1.1rem 0}
.toolbar .spacer{flex:1;min-width:0}

/* ============================================================
   TARGET-FRAME PANELS
   Corner brackets mark data panels like the crosshairs of the
   routing scope. Card / stat / url-box / tables / modals share it.
   ============================================================ */
.card,.stat,.url-box,.tcard,.ccard,.clicard,.empty{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:var(--r);
  box-shadow:var(--sh-1);
}
.card,.stat,.url-box,.tcard,.modal,.cfg-modal,.loka-dialog,.table-wrap{
  position:relative;
}
.card::before,.stat::before,.tcard::before,.table-wrap::before{
  content:'';position:absolute;top:7px;left:7px;width:11px;height:11px;
  border-top:1.5px solid var(--corner);border-left:1.5px solid var(--corner);
  border-top-left-radius:2px;pointer-events:none;
}
.card::after,.stat::after,.tcard::after,.table-wrap::after{
  content:'';position:absolute;bottom:7px;right:7px;width:11px;height:11px;
  border-bottom:1.5px solid var(--corner);border-right:1.5px solid var(--corner);
  border-bottom-right-radius:2px;pointer-events:none;
}

.card{padding:1.25rem;transition:box-shadow var(--t),border-color var(--t),transform var(--t)}
.card:hover{box-shadow:var(--sh-3);border-color:var(--line-2)}
.card h3{display:flex;align-items:center;gap:.5rem;margin-bottom:.8rem}

.stat{
  padding:1.05rem 1.1rem;overflow:hidden;
  transition:box-shadow var(--t),border-color var(--t),transform var(--t);
}
.stat:hover{transform:translateY(-1px);box-shadow:var(--sh-2);border-color:var(--line-2)}
.stat .label{
  display:block;color:var(--ink-3);font-family:var(--mono);font-size:.62rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.11em;
}
/* telemetry numerals */
.stat .value{
  display:block;margin-top:.34rem;
  font-family:var(--mono);font-size:1.5rem;font-weight:600;letter-spacing:-.04em;line-height:1.15;
  color:var(--ink);font-variant-numeric:tabular-nums;
}
.stat .sub{display:block;margin-top:.28rem;color:var(--ink-3);font-size:.72rem;font-family:var(--mono)}

.row,.mrow,.clirow{
  display:flex;align-items:baseline;justify-content:space-between;gap:.85rem;
  padding:.45rem 0;border-bottom:1px solid var(--line);font-size:.82rem;
}
.row:last-child,.mrow:last-child,.clirow:last-child{border-bottom:none}
.row>span:first-child,.mrow span:first-child,.clirow span:first-child{color:var(--ink-2);flex-shrink:0}
.row>span:last-child,.mrow span:last-child,.clirow span:last-child{
  text-align:right;word-break:break-all;min-width:0;
}

.url-box{
  display:flex;align-items:center;gap:.9rem;
  padding:.8rem 1.05rem;margin-bottom:.65rem;
  transition:border-color var(--t-fast),box-shadow var(--t-fast);
}
.url-box:hover{border-color:var(--line-2);box-shadow:var(--sh-2)}
.url-box code{flex:1;background:none;border:none;padding:0;font-size:.85rem}
.url-box .label{
  color:var(--ink-3);font-family:var(--mono);font-size:.62rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.1em;
  min-width:88px;flex-shrink:0;
}
.tcard{padding:1.15rem;margin-top:.75rem}
.theader{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}

.empty{
  margin-top:.8rem;padding:2.6rem 1.5rem;text-align:center;
  color:var(--ink-3);font-size:.85rem;
  border-style:dashed;background:var(--surface-sunken);
}
.empty.big{grid-column:1/-1;padding:3rem 1.5rem}

.section-h{
  display:flex;align-items:center;gap:.7rem;
  margin:1.9rem 0 .85rem;
  font-family:var(--mono);font-size:.66rem;font-weight:600;color:var(--ink-3);
  text-transform:uppercase;letter-spacing:.13em;
}
.section-h::before{content:'::';color:var(--accent);font-weight:600}
.section-h::after{content:'';flex:1;height:1px;background:var(--line)}

/* ============================================================
   BUTTONS — mono, uppercase, hard-edged
   ============================================================ */
button,.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.4rem;
  padding:.5rem .95rem;border-radius:9px;
  font-family:var(--mono);font-size:.74rem;font-weight:600;letter-spacing:.06em;
  text-transform:uppercase;line-height:1.35;white-space:nowrap;
  color:#fff;border:1px solid transparent;
  background:var(--accent-grad);
  cursor:pointer;position:relative;
  box-shadow:var(--sh-accent);
  transition:transform var(--t-fast),box-shadow var(--t-fast),filter var(--t-fast);
}
button:hover{transform:translateY(-1px);filter:brightness(1.05)}
button:active{transform:translateY(0) scale(.985)}
button:disabled{opacity:.5;pointer-events:none;box-shadow:none}
button.ghost{
  background:var(--surface);color:var(--ink);
  border-color:var(--line-2);box-shadow:var(--sh-1);
}
button.ghost:hover{background:var(--surface-hi);color:var(--ink);box-shadow:var(--sh-2)}
button.danger{background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 6px 20px rgba(220,38,38,.28)}
button.danger.ghost{background:var(--surface);color:var(--err);border-color:var(--line-2);box-shadow:var(--sh-1)}
button.danger.ghost:hover{background:var(--err-bg);border-color:var(--err);color:var(--err)}
button.primary{background:var(--accent-grad)}
button.sm{padding:.3rem .66rem;font-size:.68rem;border-radius:7px}
button.tiny{padding:.2rem .5rem;font-size:.62rem;border-radius:6px}

/* ============================================================
   INPUTS
   ============================================================ */
input,select,textarea{
  width:100%;padding:.55rem .8rem;
  font-family:var(--sans);font-size:.845rem;color:var(--ink);
  background:var(--surface);border:1px solid var(--line-2);
  border-radius:9px;
  transition:border-color var(--t-fast),box-shadow var(--t-fast),background var(--t-fast);
}
input:focus,select:focus,textarea:focus{
  outline:none;border-color:var(--accent);
  box-shadow:0 0 0 3.5px var(--accent-lo);
}
input::placeholder,textarea::placeholder{color:var(--ink-3)}
label{
  display:block;margin-bottom:.3rem;
  font-family:var(--mono);font-size:.64rem;font-weight:600;color:var(--ink-2);
  text-transform:uppercase;letter-spacing:.08em;
}

/* ============================================================
   PILLS + BADGES
   ============================================================ */
.pill{
  display:inline-flex;align-items:center;gap:.25rem;
  padding:.15rem .5rem;border-radius:6px;
  font-family:var(--mono);font-size:.62rem;font-weight:600;letter-spacing:.03em;
  text-transform:uppercase;line-height:1.6;white-space:nowrap;border:1px solid transparent;
}
.pill.ok{background:var(--ok-bg);color:var(--ok);border-color:rgba(22,163,74,.24)}
.pill.warn{background:var(--warn-bg);color:var(--warn);border-color:rgba(245,158,11,.26)}
.pill.err{background:var(--err-bg);color:var(--err);border-color:rgba(239,68,68,.24)}
.pill.info{background:var(--info-bg);color:var(--info);border-color:rgba(96,165,250,.24)}
.pill.dim,.pill.tag{
  background:var(--surface-sunken);color:var(--ink-3);border-color:var(--line);
}
.badge-exists{
  margin-left:auto;padding:.1rem .45rem;border-radius:6px;
  font-family:var(--mono);font-size:.58rem;font-weight:600;
  background:var(--warn-bg);color:var(--warn);
}

/* ============================================================
   TABLES
   ============================================================ */
.table-wrap{
  margin-top:.7rem;overflow-x:auto;
  background:var(--surface);border:1px solid var(--line);
  border-radius:var(--r);box-shadow:var(--sh-1);
}
table{width:100%;border-collapse:collapse;min-width:520px}
th,td{padding:.62rem .85rem;border-bottom:1px solid var(--line);vertical-align:middle;font-size:.815rem;text-align:left}
th{
  font-family:var(--mono);color:var(--ink-3);font-size:.62rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;
  background:var(--surface-sunken);
}
tbody tr:last-child td{border-bottom:none}
tbody tr{transition:background var(--t-fast)}
tbody tr:hover td{background:var(--accent-lo)}

/* ============================================================
   LOGO PLATE — keeps near-black brand SVGs legible in dark mode
   ============================================================ */
.pcard-logo,.provider-img,.clilogo,.logo-plate{
  background:var(--surface-plate);
  border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(44,38,28,.08);
}
.pcard-logo,.provider-img,.logo-plate{
  display:inline-flex;align-items:center;justify-content:center;
  border-radius:9px;flex-shrink:0;
}
.provider-img{padding:3px}

/* ============================================================
   PROVIDER CARDS
   ============================================================ */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:.8rem;margin-top:.9rem}
.pcard{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;
  min-height:142px;padding:1rem .7rem;cursor:pointer;
  font-family:var(--sans);color:var(--ink);text-align:center;
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r);
  box-shadow:var(--sh-1);
  transition:transform var(--t-fast),border-color var(--t-fast),box-shadow var(--t-fast);
}
.pcard:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:var(--sh-2)}
.pcard-logo{width:52px;height:52px;padding:4px;margin-bottom:.1rem}
.pcard-logo img{width:100%;height:100%;object-fit:contain;display:block}
.pcard-name{font-size:.83rem;font-weight:620;color:var(--ink);line-height:1.25;word-break:break-word}
.pcard-type{font-size:.6rem;color:var(--ink-3);text-transform:uppercase;letter-spacing:.09em;font-family:var(--mono)}

/* ============================================================
   PROVIDER GROUPS (model picker)
   ============================================================ */
.prov-group{
  margin-bottom:.6rem;overflow:hidden;
  background:var(--surface-sunken);
  border:1px solid var(--line);border-radius:9px;
}
.prov-head{
  display:flex;align-items:center;gap:.5rem;
  padding:.5rem .75rem;cursor:pointer;user-select:none;
  background:var(--surface);border-bottom:1px solid var(--line);
  transition:background var(--t-fast);
}
.prov-head:hover{background:var(--surface-hi)}
.prov-head .arrow{
  display:inline-block;width:10px;font-size:.58rem;color:var(--ink-3);
  transition:transform var(--t-fast);
}
.prov-group.collapsed .arrow{transform:rotate(-90deg)}
.prov-group.collapsed .prov-body{display:none}
.prov-name{font-size:.79rem;font-weight:580;color:var(--ink)}
.prov-count{margin-left:auto;font-size:.69rem;color:var(--ink-3);font-variant-numeric:tabular-nums;font-family:var(--mono)}
.prov-body{padding:.28rem}
.model-row{
  display:flex;align-items:center;gap:.5rem;
  padding:.4rem .6rem;border-radius:6px;
  font-size:.775rem;cursor:pointer;
  transition:background var(--t-fast);
}
.model-row:hover{background:var(--surface)}
.model-row.selected{background:var(--accent-lo)}
.model-row.disabled{opacity:.42;cursor:not-allowed}
.model-row input[type="checkbox"]{width:auto;margin:0;accent-color:var(--accent)}
.model-row code{
  flex:1;min-width:0;background:none;border:none;padding:0;
  font-size:.755rem;color:var(--ink);
}
.no-result{padding:1.8rem 1rem;text-align:center;color:var(--ink-3);font-size:.8rem}

/* ============================================================
   COMBOS
   ============================================================ */
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:.9rem;margin-top:.9rem}
.ccard{
  display:flex;flex-direction:column;gap:.65rem;
  padding:1.05rem;
  transition:transform var(--t-fast),border-color var(--t-fast),box-shadow var(--t-fast);
}
.ccard:hover{transform:translateY(-1px);border-color:var(--line-2);box-shadow:var(--sh-2)}
.ctitle{margin:0;font-size:.93rem;font-weight:600;color:var(--ink);letter-spacing:-.012em}
.cmeta{font-family:var(--mono);font-size:.68rem;color:var(--ink-3)}
.clist{display:flex;flex-direction:column;gap:.28rem}
.citem{
  display:flex;align-items:center;gap:.5rem;
  padding:.4rem .55rem;border-radius:7px;
  background:var(--surface-sunken);border:1px solid var(--line);
  transition:border-color var(--t-fast);
}
.citem:hover{border-color:var(--line-2)}
.cnum{
  min-width:18px;padding:.05rem .3rem;text-align:center;
  font-size:.66rem;color:var(--ink-3);font-family:var(--mono);
  background:var(--surface);border:1px solid var(--line);border-radius:5px;
}
.cpill{font-size:.58rem !important;padding:.12rem .45rem !important;font-weight:600 !important}
.cmodel{
  flex:1;min-width:0;background:none;border:none;padding:0;
  font-family:var(--mono);font-size:.755rem;color:var(--ink);word-break:break-all;
}
.cactions{display:flex;gap:.35rem;flex-wrap:wrap;align-items:center;margin-top:.15rem}
.cbtn{
  padding:.34rem .68rem;border-radius:7px;cursor:pointer;
  font-family:var(--mono);font-size:.68rem;font-weight:600;letter-spacing:.05em;
  text-transform:uppercase;color:var(--ink-2);
  background:var(--surface);border:1px solid var(--line-2);box-shadow:var(--sh-1);
  transition:border-color var(--t-fast),color var(--t-fast),background var(--t-fast);
}
.cbtn:hover{border-color:var(--accent);color:var(--accent)}
.cbtn.primary{background:var(--accent-grad);color:#fff;border-color:transparent;box-shadow:var(--sh-accent)}
.cbtn.primary:hover{color:#fff}
.cbtn.danger{background:var(--surface);color:var(--err);border-color:var(--line-2)}
.cbtn.danger:hover{background:var(--err-bg);border-color:var(--err);color:var(--err)}
.cdel{padding:.02rem .45rem;font-size:.9rem;line-height:1.3;color:var(--ink-3);box-shadow:none}
.cdel:hover{background:var(--err-bg);border-color:var(--err);color:var(--err)}
.cempty{padding:.65rem;text-align:center;color:var(--ink-3);font-size:.78rem}
.picker-foot{display:flex;align-items:center;gap:.5rem;padding-top:.8rem;border-top:1px solid var(--line)}
.picker-foot #pickerCount{flex:1;font-size:.75rem;font-family:var(--mono)}
.cli-fb{font-size:.74rem;color:var(--ink-2);line-height:1.45;overflow-wrap:anywhere}

/* ============================================================
   CLI TOOLS
   ============================================================ */
.cligrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:.9rem;margin-top:.9rem}
.clicard{padding:1.05rem}
.clicard.missing{border-style:dashed;background:var(--surface-sunken)}
.cliheader{display:flex;align-items:flex-start;gap:.7rem;margin-bottom:.7rem}
.clilogo{
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  width:40px;height:40px;border-radius:9px;
  color:#fff;font-weight:700;font-size:1.1rem;
}
.cliname{font-size:.93rem;font-weight:600;color:var(--ink);margin-bottom:.1rem}
.clidesc{font-size:.72rem;line-height:1.4;color:var(--ink-2)}
.clipath{
  margin-top:.28rem;font-family:var(--mono);font-size:.69rem;
  color:var(--ink-3);word-break:break-all;
}
.clibody{padding-top:.45rem;margin-bottom:.7rem;border-top:1px solid var(--line)}
.cliactions{display:flex;gap:.45rem;flex-wrap:wrap}
.installbox{padding:.8rem;margin-top:.45rem;border-radius:9px;background:var(--surface-sunken);border:1px solid var(--line)}
.installbox .label{
  margin-bottom:.35rem;font-size:.64rem;color:var(--ink-3);
  text-transform:uppercase;letter-spacing:.09em;font-family:var(--mono);font-weight:600;
}
.installbox pre{
  margin:0 0 .45rem;padding:.5rem .65rem;font-size:.71rem;
  border-radius:7px;white-space:pre-wrap;word-break:break-all;
}
.installbox .copybtn{
  padding:.26rem .6rem;font-size:.68rem;border-radius:6px;cursor:pointer;
  font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em;
  background:var(--surface);border:1px solid var(--line-2);color:var(--ink-2);
  box-shadow:var(--sh-1);
}
.installbox .copybtn:hover{border-color:var(--accent);color:var(--accent)}
.installbox a{font-size:.71rem}

/* ============================================================
   CONFIG MODAL
   ============================================================ */
.cfg-overlay,.overlay,.loka-dialog-overlay{
  position:fixed;inset:0;z-index:200;
  display:flex;align-items:center;justify-content:center;padding:1.25rem;
  background:rgba(10,14,20,.5);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  animation:fadeIn .18s ease;
}
[data-theme="dark"] .cfg-overlay,
[data-theme="dark"] .overlay,
[data-theme="dark"] .loka-dialog-overlay{background:rgba(0,0,0,.7)}
.cfg-modal,.modal{
  position:relative;width:100%;max-width:560px;max-height:90vh;
  overflow-y:auto;padding:1.5rem;
  background:var(--surface-hi);
  backdrop-filter:var(--blur-lg);-webkit-backdrop-filter:var(--blur-lg);
  border:1px solid var(--line-2);border-radius:var(--r-lg);
  box-shadow:var(--sh-3);
  animation:slideUp .24s cubic-bezier(.4,0,.2,1);
}
.cfg-modal{max-width:480px}
.cfg-close,.mclose{
  position:absolute;top:.8rem;right:.8rem;z-index:2;
  display:flex;align-items:center;justify-content:center;
  width:30px;height:30px;padding:0;cursor:pointer;
  color:var(--ink-3);background:var(--surface-sunken);
  border:1px solid var(--line);border-radius:7px;
  box-shadow:none;font-size:1rem;
  transition:color var(--t-fast),border-color var(--t-fast),transform var(--t-fast);
}
.cfg-close:hover,.mclose:hover{color:var(--ink);border-color:var(--line-2);transform:rotate(90deg)}
.cfg-section{margin-bottom:1rem}
.cfg-section select{width:100%}
.cfg-preview{
  margin:1rem 0;padding:.7rem;
  font-family:var(--mono);font-size:.71rem;line-height:1.55;
  color:var(--ink-2);background:var(--surface-sunken);
  border:1px solid var(--line);border-radius:9px;
  white-space:pre-wrap;word-break:break-all;
}
.cfg-actions{display:flex;gap:.5rem;justify-content:flex-end}
.cfg-actions button{min-width:100px}

.mh{
  display:flex;align-items:center;gap:.5rem;
  margin:1.3rem 0 .5rem;
  font-family:var(--mono);font-size:.66rem;font-weight:600;color:var(--ink-3);
  text-transform:uppercase;letter-spacing:.11em;
}
.mh:first-child{margin-top:0}
.mh::before{content:'';width:12px;height:2px;border-radius:2px;background:var(--accent-grad)}
.btns{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.4rem}
.btns button{flex:1;min-width:110px}

/* ============================================================
   MODAL ROWS / KEYS
   ============================================================ */
.keyslist{margin:.5rem 0}
.mrow2,.keyrow{
  display:flex;align-items:center;gap:.45rem;
  margin:.28rem 0;padding:.34rem .5rem;
  background:var(--surface-sunken);
  border:1px solid var(--line);border-radius:7px;
}
.mrow2 code,.keyrow code{
  flex:1;min-width:0;padding:0;background:none;border:none;
  font-size:.75rem;color:var(--ink);word-break:break-all;user-select:all;
}
.mres{font-size:.69rem;color:var(--ink-2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.testbtn{
  padding:.24rem .6rem;font-size:.68rem;font-weight:600;cursor:pointer;
  color:var(--ink-2);background:var(--surface);
  border:1px solid var(--line-2);border-radius:6px;box-shadow:var(--sh-1);
  flex-shrink:0;font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em;
  transition:color var(--t-fast),border-color var(--t-fast);
}
.testbtn:hover{color:var(--accent);border-color:var(--accent)}
.keydel{
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  width:24px;height:24px;padding:0;border-radius:6px;cursor:pointer;
  font-size:.72rem;font-family:var(--sans);color:var(--ink-3);
  background:transparent;border:1px solid var(--line);box-shadow:none;
  transition:color var(--t-fast),background var(--t-fast),border-color var(--t-fast);
}
.keydel:hover{background:var(--err-bg);border-color:var(--err);color:var(--err)}

/* ============================================================
   PROGRESS BAR — token share meters on the Usage page
   ============================================================ */
.bar{
  height:6px;margin-top:.35rem;overflow:hidden;
  background:var(--surface-sunken);
  border:1px solid var(--line);border-radius:99px;
}
.bar>div{height:100%;border-radius:99px;background:var(--accent-grad)}

/* ============================================================
   DIALOG
   ============================================================ */
.loka-dialog-overlay{z-index:500}
.loka-dialog{
  width:100%;max-width:420px;
  padding:1.6rem 1.6rem 1.35rem;
  background:var(--surface-hi);
  backdrop-filter:var(--blur-lg);-webkit-backdrop-filter:var(--blur-lg);
  border:1px solid var(--line-2);border-radius:var(--r-xl);
  box-shadow:var(--sh-3);
  animation:slideUp .22s cubic-bezier(.4,0,.2,1);
}
.loka-dialog-icon{
  display:flex;align-items:center;justify-content:center;
  width:44px;height:44px;margin-bottom:.9rem;
  font-size:1.3rem;border-radius:9px;
  background:var(--accent-lo);
  border:1px solid var(--line);
}
.loka-dialog-icon.warn{background:var(--warn-bg);border-color:rgba(245,158,11,.32)}
.loka-dialog-icon.err{background:var(--err-bg);border-color:rgba(239,68,68,.32)}
.loka-dialog h3{font-size:1.02rem;margin-bottom:.4rem}
.loka-dialog p{font-size:.84rem;line-height:1.5;color:var(--ink-2);margin-bottom:1.2rem}
.loka-dialog input{margin-bottom:1.2rem}
.loka-dialog-actions{display:flex;gap:.55rem;justify-content:flex-end}
.loka-dialog-actions button{min-width:88px}

/* ============================================================
   TOAST
   ============================================================ */
.toast{
  position:fixed;left:1.4rem;right:1.4rem;bottom:1.4rem;z-index:600;
  display:none;max-width:380px;margin-left:auto;
  padding:.8rem 1.15rem;
  font-size:.82rem;font-weight:600;color:#fff;
  background:var(--accent-grad);
  border:1px solid rgba(255,255,255,.2);border-radius:var(--r);
  box-shadow:var(--sh-3);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
.toast.show{display:block;animation:slideUp .24s cubic-bezier(.4,0,.2,1)}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{
  from{opacity:0;transform:translateY(14px) scale(.97)}
  to{opacity:1;transform:none}
}

/* ============================================================
   MOBILE DRAWER + OVERLAY
   ============================================================ */
.menu-toggle{
  position:fixed;top:.7rem;left:.7rem;z-index:60;display:none;
  width:38px;height:38px;padding:0;cursor:pointer;
  align-items:center;justify-content:center;
  color:var(--ink);
  background:var(--surface);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--line-2);border-radius:9px;
  box-shadow:var(--sh-2);
  transition:transform var(--t-fast),box-shadow var(--t-fast);
}
.menu-toggle:hover{box-shadow:var(--sh-3)}
.menu-toggle:active{transform:scale(.95)}
.sidebar-overlay{
  position:fixed;inset:0;z-index:35;
  opacity:0;pointer-events:none;
  background:rgba(10,14,20,.5);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  transition:opacity .28s ease;
}
.sidebar-overlay.show{opacity:1;pointer-events:auto}
[data-theme="dark"] .sidebar-overlay{background:rgba(0,0,0,.65)}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media(max-width:900px){
  #railToggle{display:none}
  aside{transform:translateX(-100%);width:var(--sb)}
  body.rail-open aside{transform:translateX(0)}
  /* in the drawer, expanded rail content is always visible */
  body:not(.rail-open) .brand-name,
  body:not(.rail-open) .version-pill,
  body:not(.rail-open) .section-label,
  body:not(.rail-open) .nav-label,
  body:not(.rail-open) .nav-idx{display:initial}
  body:not(.rail-open) .nav-item{justify-content:flex-start;padding:.55rem .55rem}
  .menu-toggle{display:flex}
  main{margin-left:0;padding:1.15rem 1rem 2.5rem 3.9rem}
  body.rail-open main{margin-left:0;padding-left:1rem}
  .ticker{gap:.7rem;font-size:.68rem}
  h1{font-size:1.28rem}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .pgrid{grid-template-columns:repeat(2,1fr)}
  .grid,.cgrid,.cligrid{grid-template-columns:1fr}
  table{min-width:420px}
  th,td{padding:.5rem .65rem;font-size:.76rem}
  .loka-dialog,.modal,.cfg-modal{padding:1.35rem;max-height:94vh}
}
@media(max-width:480px){
  main{padding:.85rem .75rem 2rem}
  .card,.stat{padding:.95rem}
  .stat .value{font-size:1.3rem}
  .stats-grid,.pgrid{grid-template-columns:repeat(2,1fr)}
  button{padding:.46rem .82rem;font-size:.68rem}
  .toast{left:.75rem;right:.75rem;bottom:.75rem}
  .url-box{flex-direction:column;align-items:flex-start;gap:.3rem}
  .url-box .label{min-width:0}
  .ticker .hide-sm{display:none}
}

@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
}

@media print{
  aside,.menu-toggle,.sidebar-overlay,.toast,#railToggle{display:none !important}
  main{margin-left:0;max-width:none}
  .ambient{display:none}
}
`;