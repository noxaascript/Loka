export const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg-0:#e8eaef;
  --bg-1:#f0f1f5;
  --bg-2:rgba(255,255,255,.55);
  --bg-3:rgba(255,255,255,.35);
  --border-1:rgba(0,0,0,.08);
  --border-2:rgba(0,0,0,.15);
  --glass-border:rgba(255,255,255,.9);
  --glass-bg:rgba(255,255,255,.55);
  --glass-bg-hi:rgba(255,255,255,.75);
  --text-1:#0a0a0f;
  --text-2:#3f3f4a;
  --text-3:#7a7a85;
  --accent:#8b5cf6;
  --accent-2:#ec4899;
  --accent-hi:#7c3aed;
  --accent-lo:rgba(139,92,246,.10);
  --ok:#059669;--ok-bg:rgba(5,150,105,.14);
  --warn:#d97706;--warn-bg:rgba(217,119,6,.14);
  --err:#dc2626;--err-bg:rgba(220,38,38,.12);
  --info:#2563eb;--info-bg:rgba(37,99,235,.12);
  --shadow-sm:0 2px 8px rgba(60,70,100,.08);
  --shadow-md:0 8px 32px rgba(60,70,100,.12);
  --shadow-lg:0 24px 64px rgba(60,70,100,.18);
  --glass-shadow:0 8px 32px rgba(60,70,100,.10);
  --r-sm:10px;--r:16px;--r-lg:24px;
  --sb:220px;
  --blur:blur(24px) saturate(180%);
  color-scheme:light;
}
[data-theme="dark"]{
  --bg-0:#0a0612;
  --bg-1:rgba(255,255,255,.04);
  --bg-2:rgba(255,255,255,.06);
  --bg-3:rgba(255,255,255,.03);
  --border-1:rgba(255,255,255,.08);
  --border-2:rgba(255,255,255,.16);
  --glass-border:rgba(255,255,255,.10);
  --glass-bg:rgba(255,255,255,.05);
  --glass-bg-hi:rgba(255,255,255,.08);
  --text-1:#f5f3ff;
  --text-2:#a5a0b8;
  --text-3:#6d6880;
  --accent:#a78bfa;
  --accent-2:#f472b6;
  --accent-hi:#c4b5fd;
  --accent-lo:rgba(167,139,250,.16);
  --ok:#34d399;--ok-bg:rgba(52,211,153,.14);
  --warn:#fbbf24;--warn-bg:rgba(251,191,36,.14);
  --err:#f87171;--err-bg:rgba(248,113,113,.14);
  --info:#60a5fa;--info-bg:rgba(96,165,250,.14);
  --shadow-sm:0 2px 8px rgba(0,0,0,.3);
  --shadow-md:0 8px 32px rgba(0,0,0,.4);
  --shadow-lg:0 24px 64px rgba(0,0,0,.6);
  --glass-shadow:0 8px 32px rgba(0,0,0,.4);
  color-scheme:dark;
}
html,body{height:100%;overflow-x:hidden}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",system-ui,sans-serif;
  font-size:13.5px;line-height:1.55;color:var(--text-1);
  background:var(--bg-0);
  background-image:linear-gradient(180deg,#eef0f4 0%,#e2e5eb 100%);
  background-attachment:fixed;
  min-height:100vh;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  position:relative;overflow-x:hidden;
}
[data-theme="dark"] body{
  background-image:none;
  background:var(--bg-0);
}
/* ANIMATED GRADIENT BLOBS */
body::before,
body::after{
  content:'';position:fixed;pointer-events:none;z-index:0;
  border-radius:50%;filter:blur(80px);opacity:.55;
  animation:float 20s ease-in-out infinite;
}
body::before{
  width:520px;height:520px;
  background:radial-gradient(circle,rgba(139,92,246,.35) 0%,transparent 70%);
  top:-180px;left:-100px;
  animation-delay:0s;
}
body::after{
  width:600px;height:600px;
  background:radial-gradient(circle,rgba(236,72,153,.30) 0%,transparent 70%);
  bottom:-200px;right:-150px;
  animation-delay:-10s;
}
[data-theme="dark"] body::before{opacity:.35;background:radial-gradient(circle,#7c3aed 0%,transparent 70%)}
[data-theme="dark"] body::after{opacity:.30;background:radial-gradient(circle,#db2777 0%,transparent 70%)}
.blob-3{
  position:fixed;pointer-events:none;z-index:0;
  width:450px;height:450px;border-radius:50%;
  background:radial-gradient(circle,rgba(59,130,246,.28) 0%,transparent 70%);
  filter:blur(90px);opacity:.4;
  top:40%;left:50%;
  animation:float 25s ease-in-out infinite;
  animation-delay:-5s;
}
[data-theme="dark"] .blob-3{opacity:.25}
@keyframes float{
  0%,100%{transform:translate(0,0) scale(1)}
  33%{transform:translate(80px,-60px) scale(1.1)}
  66%{transform:translate(-60px,40px) scale(.95)}
}
/* SIDEBAR - GLASS */
aside{
  width:var(--sb);
  background:var(--glass-bg);
  backdrop-filter:var(--blur);
  -webkit-backdrop-filter:var(--blur);
  border-right:1px solid var(--glass-border);
  position:fixed;top:0;left:0;bottom:0;
  padding:1rem 0 .85rem;display:flex;flex-direction:column;z-index:40;
  transition:transform .3s cubic-bezier(.4,0,.2,1);
  transition:transform .35s cubic-bezier(.4,0,.2,1),box-shadow .35s ease;
  box-shadow:var(--glass-shadow);
}
aside .brand{
  padding:0 .9rem 1rem;margin-bottom:.5rem;
  display:flex;flex-direction:column;align-items:center;gap:.5rem;
  border-bottom:1px solid var(--border-1);
}
aside .brand-logo{
  width:100%;max-width:80px;height:auto;object-fit:contain;display:block;
  margin:0 auto;
}
.version-pill{
  font-size:.52rem;
  color:var(--text-3);
  padding:.22rem .5rem;
  border-radius:6px;
  background:var(--glass-bg);
  border:1px solid var(--border-1);
  font-family:ui-monospace,Menlo,monospace;
  letter-spacing:-.02em;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:100%;
  text-align:center;
  line-height:1.3;
  cursor:help;
}
.update-badge{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:.35rem;
  padding:.42rem .7rem;
  border-radius:8px;
  font-size:.68rem;
  font-weight:600;
  color:#fff;
  text-decoration:none;
  background:linear-gradient(135deg,#f59e0b,#ef4444);
  box-shadow:0 4px 12px rgba(245,158,11,.35);
  animation:pulseUpdate 2s ease-in-out infinite;
  transition:all .15s;
  white-space:nowrap;
  width:100%;
  max-width:160px;
}
.update-badge:hover{
  transform:translateY(-1px);
  box-shadow:0 6px 18px rgba(245,158,11,.5);
  text-decoration:none;
  color:#fff;
}
.update-badge:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.3)}
.update-badge:active{transform:scale(.97)}
@keyframes pulseUpdate{
  0%,100%{opacity:1}
  50%{opacity:.8}
}
@keyframes pulseGlow{
  0%,100%{box-shadow:0 4px 16px rgba(139,92,246,.4)}
  50%{box-shadow:0 4px 24px rgba(236,72,153,.5)}
}
aside nav{flex:1;display:flex;flex-direction:column;padding:.35rem .75rem;gap:2px;overflow-y:auto}
.section-label{
  font-size:.6rem;font-weight:800;color:var(--text-3);
  text-transform:uppercase;letter-spacing:.15em;
  padding:.9rem .8rem .35rem;user-select:none;
}
.nav-item{
  display:flex;align-items:center;gap:.8rem;
  padding:.65rem .85rem;border-radius:12px;
  font-size:.85rem;font-weight:500;color:var(--text-2);
  text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);
  white-space:nowrap;position:relative;overflow:hidden;
}
.nav-item:hover{
  background:var(--accent-lo);
  color:var(--text-1);
  transform:translateX(2px);
}
.nav-item.active{
  background:linear-gradient(135deg,rgba(139,92,246,.18),rgba(236,72,153,.12));
  color:var(--accent);
  font-weight:600;
  box-shadow:0 4px 16px rgba(139,92,246,.15),inset 0 1px 0 rgba(255,255,255,.4);
}
[data-theme="dark"] .nav-item.active{
  background:linear-gradient(135deg,rgba(167,139,250,.22),rgba(244,114,182,.14));
  box-shadow:0 4px 16px rgba(167,139,250,.2),inset 0 1px 0 rgba(255,255,255,.08);
}
.nav-item.active::before{
  content:'';position:absolute;left:0;top:20%;bottom:20%;
  width:3px;background:linear-gradient(180deg,var(--accent),var(--accent-2));
  border-radius:0 3px 3px 0;
}
.nav-icon{font-size:1.05rem;width:20px;text-align:center;flex-shrink:0;transition:transform .2s}
.nav-item:hover .nav-icon{transform:scale(1.15)}
aside .sidebar-foot{
  padding:.7rem .75rem 0;margin-top:.5rem;
  border-top:1px solid var(--border-1);
  display:flex;gap:.5rem;
}
.icon-btn{
  flex:1;
  background:var(--glass-bg);border:1px solid var(--border-1);
  color:var(--text-2);border-radius:10px;padding:.55rem;
  cursor:pointer;font-family:inherit;font-size:.8rem;font-weight:600;
  display:flex;align-items:center;justify-content:center;gap:.4rem;
  transition:all .2s;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
.icon-btn:hover{
  background:var(--glass-bg-hi);
  color:var(--text-1);
  border-color:var(--border-2);
  transform:translateY(-1px);
}
/* MAIN */
main{
  margin-left:var(--sb);transition:margin-left .35s cubic-bezier(.4,0,.2,1),
             padding-left .35s cubic-bezier(.4,0,.2,1);
  padding:2rem 2.5rem 3rem;
  max-width:1240px;min-width:0;position:relative;z-index:1;
}
.page-header{margin-bottom:1.75rem}
h1{
  font-size:1.6rem;font-weight:700;letter-spacing:-.03em;line-height:1.15;
  background:linear-gradient(135deg,var(--text-1) 0%,var(--accent) 100%);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
  padding-bottom:.15rem;
}
[data-theme="dark"] h1{
  background:linear-gradient(135deg,#f5f3ff 0%,var(--accent) 100%);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
}
h2{font-size:.68rem;font-weight:700;color:var(--text-3);
  text-transform:uppercase;letter-spacing:.12em;margin:2rem 0 .85rem}
h3{font-size:1rem;font-weight:600;color:var(--text-1);margin-bottom:.6rem;letter-spacing:-.01em}
a{color:var(--accent);text-decoration:none;transition:color .15s}
a:hover{color:var(--accent-2)}
p{margin-bottom:.7rem}
.muted{color:var(--text-2)}
.dim{color:var(--text-3)}
code{
  background:var(--glass-bg);padding:.18rem .5rem;border-radius:7px;
  color:var(--text-1);font-size:.82em;word-break:break-all;
  font-family:ui-monospace,"SF Mono",Menlo,monospace;
  border:1px solid var(--border-1);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
pre{
  background:var(--glass-bg);padding:1rem 1.15rem;border-radius:var(--r);
  overflow-x:auto;font-size:.78rem;color:var(--text-1);
  border:1px solid var(--border-1);line-height:1.7;
  font-family:ui-monospace,"SF Mono",Menlo,monospace;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
/* BUTTONS */
button,.btn{
  background:linear-gradient(135deg,var(--accent),var(--accent-2));
  color:#fff;border:1px solid transparent;
  padding:.6rem 1.15rem;border-radius:12px;
  font-family:inherit;font-size:.82rem;font-weight:600;
  cursor:pointer;transition:all .2s cubic-bezier(.4,0,.2,1);
  line-height:1.3;letter-spacing:-.005em;
  box-shadow:0 4px 16px rgba(139,92,246,.25);
  position:relative;overflow:hidden;
}
button::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,transparent 0%,rgba(255,255,255,.2) 50%,transparent 100%);
  transform:translateX(-100%);transition:transform .5s;
}
button:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(139,92,246,.35)}
button:hover::after{transform:translateX(100%)}
button:active{transform:translateY(0) scale(.98)}
button.ghost{
  background:var(--glass-bg);color:var(--text-1);
  border:1px solid var(--border-1);box-shadow:none;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
button.ghost::after{display:none}
button.ghost:hover{
  background:var(--glass-bg-hi);border-color:var(--border-2);
  box-shadow:0 4px 16px rgba(139,92,246,.12);
}
button.danger{
  background:linear-gradient(135deg,#ef4444,#dc2626);
  box-shadow:0 4px 16px rgba(239,68,68,.3);
}
button.danger:hover{box-shadow:0 8px 24px rgba(239,68,68,.4)}
button.sm{padding:.36rem .75rem;font-size:.74rem;border-radius:9px}
/* INPUTS */
input,select,textarea{
  background:var(--glass-bg);border:1px solid var(--border-1);color:var(--text-1);
  padding:.65rem .95rem;border-radius:12px;font-family:inherit;
  font-size:.85rem;width:100%;transition:all .2s;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
input:focus,select:focus,textarea:focus{
  outline:none;border-color:var(--accent);
  background:var(--glass-bg-hi);
  box-shadow:0 0 0 4px var(--accent-lo);
}
label{display:block;font-size:.72rem;font-weight:600;color:var(--text-2);
  text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem}
/* GLASS CARDS */
.card{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--glass-border);
  border-radius:var(--r);padding:1.35rem;
  transition:all .25s cubic-bezier(.4,0,.2,1);
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.5);
  position:relative;overflow:hidden;
}
[data-theme="dark"] .card{
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.06);
}
.card::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 50%);
  border-radius:var(--r);
}
.card:hover{
  transform:translateY(-2px);
  border-color:var(--border-2);
  box-shadow:0 16px 48px rgba(139,92,246,.2),inset 0 1px 0 rgba(255,255,255,.5);
}
[data-theme="dark"] .card:hover{
  box-shadow:0 16px 48px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);
}
.card h3{display:flex;align-items:center;gap:.55rem;margin-bottom:.85rem;position:relative}
.card .row{display:flex;justify-content:space-between;padding:.5rem 0;
  font-size:.82rem;border-bottom:1px solid var(--border-1);gap:.85rem;position:relative}
.card .row:last-child{border-bottom:none}
.card .row>span:first-child{color:var(--text-2);flex-shrink:0}
.card .row>span:last-child{text-align:right;word-break:break-all;min-width:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;margin-top:.85rem}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.85rem}
.stat{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--glass-border);
  border-radius:var(--r);padding:1.25rem;
  transition:all .25s;
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.5);
  position:relative;overflow:hidden;
}
[data-theme="dark"] .stat{
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.06);
}
.stat::before{
  content:'';position:absolute;top:0;right:0;width:80px;height:80px;
  background:radial-gradient(circle,var(--accent-lo),transparent 70%);
  border-radius:50%;transform:translate(30%,-30%);
}
.stat:hover{transform:translateY(-2px);border-color:var(--border-2)}
.stat .label{color:var(--text-2);font-size:.7rem;text-transform:uppercase;
  letter-spacing:.08em;font-weight:700;position:relative}
.stat .value{
  font-size:1.85rem;font-weight:800;margin-top:.4rem;
  letter-spacing:-.04em;line-height:1.05;position:relative;
  background:linear-gradient(135deg,var(--accent),var(--accent-2));
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
}
.stat .sub{color:var(--text-3);font-size:.72rem;margin-top:.3rem;position:relative}
/* PILLS */
.pill{display:inline-block;padding:.22rem .65rem;
  border-radius:8px;font-size:.68rem;font-weight:600;white-space:nowrap;line-height:1.6;
  letter-spacing:.01em;backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
.pill.ok{background:var(--ok-bg);color:var(--ok);border:1px solid rgba(16,185,129,.2)}
.pill.warn{background:var(--warn-bg);color:var(--warn);border:1px solid rgba(245,158,11,.2)}
.pill.err{background:var(--err-bg);color:var(--err);border:1px solid rgba(239,68,68,.2)}
.pill.info{background:var(--info-bg);color:var(--info);border:1px solid rgba(59,130,246,.2)}
.pill.tag{background:var(--glass-bg);color:var(--text-2);font-weight:500;border:1px solid var(--border-1)}
.pill.dim{background:var(--glass-bg);color:var(--text-3);border:1px solid var(--border-1)}
/* PROVIDER CARDS  LIQUID GLASS */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-top:.85rem}
.pcard{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  color:var(--text-1);
  border:1px solid var(--glass-border);
  border-radius:var(--r);
  padding:1.25rem .85rem;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:.6rem;
  font-family:inherit;min-height:155px;justify-content:center;
  transition:all .3s cubic-bezier(.4,0,.2,1);
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.5);
  position:relative;overflow:hidden;
}
[data-theme="dark"] .pcard{
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.06);
}
.pcard::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(139,92,246,0) 0%,rgba(236,72,153,0) 100%);
  opacity:0;transition:opacity .3s;
}
.pcard:hover{
  transform:translateY(-4px) scale(1.02);
  border-color:var(--accent);
  box-shadow:0 20px 48px rgba(139,92,246,.3),inset 0 1px 0 rgba(255,255,255,.6);
}
.pcard:hover::before{
  background:linear-gradient(135deg,rgba(139,92,246,.08) 0%,rgba(236,72,153,.05) 100%);
  opacity:1;
}
.pcard-logo{
  display:flex;align-items:center;justify-content:center;
  height:52px;margin-bottom:.15rem;position:relative;z-index:1;
  transition:transform .3s;
}
.pcard:hover .pcard-logo{transform:scale(1.1) rotate(-3deg)}
.pcard-logo img{width:44px;height:44px;object-fit:contain}
.pcard-name{font-size:.85rem;font-weight:700;text-align:center;line-height:1.25;
  word-break:break-word;color:var(--text-1);position:relative;z-index:1;
  letter-spacing:-.01em}
.pcard-type{font-size:.62rem;color:var(--text-3);text-transform:uppercase;
  letter-spacing:.1em;font-weight:700;position:relative;z-index:1}
.pcard .pill{position:relative;z-index:1}
/* MODAL */
.overlay{
  position:fixed;inset:0;background:rgba(20,10,40,.5);
  backdrop-filter:blur(12px) saturate(180%);
  -webkit-backdrop-filter:blur(12px) saturate(180%);
  z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;
  animation:fadeIn .25s ease;
}
[data-theme="dark"] .overlay{background:rgba(0,0,0,.7)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{
  from{transform:translateY(20px) scale(.96);opacity:0}
  to{transform:none;opacity:1}
}
.modal{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--glass-border);
  border-radius:var(--r-lg);max-width:580px;width:100%;max-height:90vh;
  overflow-y:auto;padding:1.75rem;position:relative;
  box-shadow:0 32px 80px rgba(139,92,246,.35),inset 0 1px 0 rgba(255,255,255,.5);
  animation:slideUp .3s cubic-bezier(.4,0,.2,1);
}
[data-theme="dark"] .modal{
  background:rgba(20,15,35,.85);
  box-shadow:0 32px 80px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06);
}
.modal::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--accent),transparent);
  opacity:.5;
}
.mclose{
  position:absolute;top:1rem;right:1rem;
  background:var(--glass-bg);
  border:1px solid var(--border-1);border-radius:10px;
  color:var(--text-2);font-size:1rem;cursor:pointer;
  width:32px;height:32px;display:flex;align-items:center;justify-content:center;
  padding:0;transition:all .2s;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
.mclose:hover{background:var(--glass-bg-hi);color:var(--text-1);border-color:var(--border-2);transform:rotate(90deg)}
.mh{
  font-size:.68rem;color:var(--accent);text-transform:uppercase;
  letter-spacing:.12em;margin:1.35rem 0 .55rem;font-weight:800;
  display:flex;align-items:center;gap:.5rem;
}
.mh::before{content:'';width:14px;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:2px}
.mh:first-child{margin-top:0}
.mrow{display:flex;justify-content:space-between;padding:.55rem 0;
  border-bottom:1px solid var(--border-1);font-size:.82rem;gap:.75rem}
.mrow:last-child{border-bottom:none}
.mrow span:first-child{color:var(--text-2);flex-shrink:0}
.mrow span:last-child{text-align:right;word-break:break-all;min-width:0}
.mrow2{display:flex;align-items:center;gap:.55rem;margin:.4rem 0;
  padding:.55rem .75rem;background:var(--glass-bg);border-radius:12px;
  border:1px solid var(--border-1);transition:all .15s;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
.mrow2:hover{border-color:var(--border-2);background:var(--glass-bg-hi)}
.mrow2 code{background:transparent;border:none;padding:0;font-size:.78rem;
  color:var(--text-1);flex:1;font-family:ui-monospace,monospace}
.mrow2 .testbtn{padding:.28rem .75rem;font-size:.72rem;
  background:var(--glass-bg);border:1px solid var(--border-1);color:var(--text-2);
  border-radius:8px;font-weight:600;box-shadow:none}
.mrow2 .testbtn::after{display:none}
.mrow2 .testbtn:hover{background:linear-gradient(135deg,var(--accent),var(--accent-2));border-color:transparent;color:#fff;transform:none}
.mrow2 .mres{font-size:.7rem;color:var(--text-2);flex-shrink:0;
  max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.keyslist{margin:.6rem 0}
.keyrow{display:flex;align-items:center;gap:.55rem;padding:.55rem .75rem;
  background:var(--glass-bg);border-radius:12px;margin:.3rem 0;
  border:1px solid var(--border-1);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
.keyrow code{background:transparent;border:none;padding:0;font-size:.75rem;
  color:var(--text-1);flex:1;font-family:ui-monospace,monospace}
.keyrow .keydel{
  padding:0;font-size:.85rem;
  background:transparent;border:1px solid var(--border-1);color:var(--err);
  width:26px;height:26px;display:flex;align-items:center;justify-content:center;
  border-radius:8px;line-height:1;box-shadow:none;
}
.keyrow .keydel::after{display:none}
.keyrow .keydel:hover{background:var(--err-bg);border-color:var(--err);transform:none}
.btns{display:flex;gap:.65rem;margin-top:1.5rem;flex-wrap:wrap}
.btns button{flex:1;min-width:120px}
/* URL BOX */
.url-box{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--glass-border);
  border-radius:var(--r);padding:.9rem 1.15rem;
  display:flex;align-items:center;gap:.95rem;margin-bottom:.7rem;
  transition:all .2s;
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.4);
}
[data-theme="dark"] .url-box{
  box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.06);
}
.url-box:hover{border-color:var(--border-2);transform:translateY(-1px)}
.url-box code{flex:1;background:none;padding:0;border:none;font-size:.85rem;
  color:var(--text-1);word-break:break-all;font-family:ui-monospace,monospace}
.url-box .label{color:var(--text-3);font-size:.68rem;text-transform:uppercase;
  font-weight:800;letter-spacing:.1em;min-width:90px;flex-shrink:0}
/* TABLES */
.table-wrap{
  overflow-x:auto;margin-top:.7rem;
  border:1px solid var(--glass-border);
  border-radius:var(--r);
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  box-shadow:var(--glass-shadow);
}
table{width:100%;border-collapse:collapse;min-width:500px}
th,td{text-align:left;padding:.75rem .95rem;border-bottom:1px solid var(--border-1);
  vertical-align:middle;font-size:.82rem}
th{color:var(--text-2);font-weight:700;text-transform:uppercase;
  font-size:.68rem;letter-spacing:.08em;white-space:nowrap;
  background:var(--glass-bg-hi)}
tbody tr:last-child td{border-bottom:none}
tbody tr{transition:background .15s}
tbody tr:hover td{background:var(--accent-lo)}
.toolbar{display:flex;gap:.65rem;margin:1.25rem 0;flex-wrap:wrap;align-items:center}
.toolbar .spacer{flex:1;min-width:0}
.empty{
  text-align:center;padding:3rem 1.5rem;color:var(--text-3);
  border:2px dashed var(--border-1);border-radius:var(--r);
  margin-top:.85rem;background:var(--glass-bg);font-size:.85rem;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
.toast{
  position:fixed;bottom:1.5rem;right:1.5rem;left:1.5rem;
  background:linear-gradient(135deg,rgba(139,92,246,.95),rgba(236,72,153,.95));
  color:#fff;
  padding:.9rem 1.35rem;border-radius:14px;
  font-size:.85rem;font-weight:600;
  border:1px solid rgba(255,255,255,.2);
  box-shadow:0 16px 48px rgba(139,92,246,.4);
  z-index:300;display:none;max-width:380px;margin-left:auto;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
}
.toast.show{display:block;animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
.section-h{
  font-size:.72rem;color:var(--text-3);text-transform:uppercase;
  letter-spacing:.12em;font-weight:800;margin:2rem 0 .9rem;
  display:flex;align-items:center;gap:.75rem;
}
.section-h::before{
  content:'';width:4px;height:16px;
  background:linear-gradient(180deg,var(--accent),var(--accent-2));
  border-radius:2px;
}
.section-h::after{content:'';flex:1;height:1px;
  background:linear-gradient(90deg,var(--border-1),transparent)}
.menu-toggle{
  position:fixed;top:.75rem;left:.75rem;z-index:50;
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--border-1);
  color:var(--text-1);width:42px;height:42px;border-radius:10px;
  font-size:1.2rem;cursor:pointer;
  display:flex;
  align-items:center;justify-content:center;padding:0;
  box-shadow:var(--shadow-sm);
  transition:all .15s;
}
.menu-toggle:hover{background:var(--glass-bg-hi);border-color:var(--border-2);transform:translateY(-1px)}
body.sidebar-hidden aside{transform:translateX(-100%)}
body.sidebar-hidden main{margin-left:0;padding-left:5rem}
body.sidebar-hidden .menu-toggle{display:flex}
.sidebar-overlay{
  position:fixed;
  inset:0;
  background:rgba(10,6,18,.5);
  backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);
  z-index:35;
  opacity:0;
  pointer-events:none;
  transition:opacity .3s ease;
}
.sidebar-overlay.show{
  opacity:1;
  pointer-events:auto;
}
[data-theme="dark"] .sidebar-overlay{
  background:rgba(0,0,0,.7);
}
@media(max-width:900px){
  body:not(.sidebar-hidden) .sidebar-overlay{display:block;}
}
@media(max-width:900px){
  aside{transform:translateX(-100%);box-shadow:4px 0 30px rgba(0,0,0,.4)}
  body:not(.sidebar-hidden) aside{transform:translateX(0)}
  main{margin-left:0;padding:1.25rem 1rem 2.5rem}
  body.sidebar-hidden main{padding-left:1rem}
  .menu-toggle{display:flex}
  body:not(.sidebar-hidden) .menu-toggle{display:none}
  h1{font-size:1.35rem}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .pgrid{grid-template-columns:repeat(2,1fr)}
  .grid{grid-template-columns:1fr}
  table{min-width:400px}
  th,td{padding:.6rem .75rem;font-size:.75rem}
  .modal{max-height:95vh;padding:1.35rem}
  body::before,body::after{filter:blur(50px)}
}
@media(max-width:480px){
  main{padding:.85rem .75rem 2rem}
  .card,.stat{padding:1rem}
  .stat .value{font-size:1.5rem}
  button{padding:.55rem .9rem;font-size:.78rem}
  .toast{left:.75rem;right:.75rem;bottom:.75rem}
}
/* THEME TRANSITION */
aside,main,.card,.pcard,.stat,.modal,.url-box,pre,code,input,select,textarea,table th,.nav-item,.icon-btn{
  transition-property:background-color,border-color,color,box-shadow;
  transition-duration:.3s;transition-timing-function:cubic-bezier(.4,0,.2,1);
}
/* ===== CUSTOM DIALOG ===== */
.loka-dialog-overlay{
  position:fixed;inset:0;background:rgba(20,10,40,.5);
  backdrop-filter:blur(14px) saturate(180%);
  -webkit-backdrop-filter:blur(14px) saturate(180%);
  z-index:500;display:flex;align-items:center;justify-content:center;padding:1.5rem;
  animation:fadeIn .2s ease;
}
[data-theme="dark"] .loka-dialog-overlay{background:rgba(0,0,0,.7)}
.loka-dialog{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--glass-border);
  border-radius:20px;max-width:420px;width:100%;
  padding:1.75rem 1.75rem 1.5rem;position:relative;
  box-shadow:0 32px 80px rgba(139,92,246,.35),inset 0 1px 0 rgba(255,255,255,.5);
  animation:slideUp .28s cubic-bezier(.4,0,.2,1);
}
[data-theme="dark"] .loka-dialog{
  background:rgba(20,15,35,.92);
  box-shadow:0 32px 80px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06);
}
.loka-dialog::before{
  content:'';position:absolute;top:0;left:20%;right:20%;height:1px;
  background:linear-gradient(90deg,transparent,var(--accent),transparent);
  opacity:.6;border-radius:1px;
}
.loka-dialog-icon{
  width:48px;height:48px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:1.4rem;margin-bottom:1rem;
  background:var(--accent-lo);
  border:1px solid var(--border-1);
}
.loka-dialog-icon.warn{background:var(--warn-bg);border-color:rgba(245,158,11,.3)}
.loka-dialog-icon.err{background:var(--err-bg);border-color:rgba(239,68,68,.3)}
.loka-dialog h3{
  font-size:1.05rem;font-weight:700;color:var(--text-1);
  margin-bottom:.5rem;letter-spacing:-.02em;
}
.loka-dialog p{
  font-size:.85rem;color:var(--text-2);line-height:1.5;margin-bottom:1.35rem;
}
.loka-dialog input{
  margin-bottom:1.35rem;
  background:var(--bg-2);
}
.loka-dialog-actions{
  display:flex;gap:.6rem;justify-content:flex-end;
}
.loka-dialog-actions button{
  min-width:90px;padding:.55rem 1.1rem;
  font-size:.82rem;font-weight:600;
}
/* ===== CUSTOM DIALOG ===== */
.loka-dialog-overlay{
  position:fixed;inset:0;background:rgba(20,10,40,.5);
  backdrop-filter:blur(14px) saturate(180%);
  -webkit-backdrop-filter:blur(14px) saturate(180%);
  z-index:500;display:flex;align-items:center;justify-content:center;padding:1.5rem;
  animation:fadeIn .2s ease;
}
[data-theme="dark"] .loka-dialog-overlay{background:rgba(0,0,0,.7)}
.loka-dialog{
  background:var(--glass-bg);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border:1px solid var(--glass-border);
  border-radius:20px;max-width:420px;width:100%;
  padding:1.75rem 1.75rem 1.5rem;position:relative;
  box-shadow:0 32px 80px rgba(139,92,246,.35),inset 0 1px 0 rgba(255,255,255,.5);
  animation:slideUp .28s cubic-bezier(.4,0,.2,1);
}
[data-theme="dark"] .loka-dialog{
  background:rgba(20,15,35,.92);
  box-shadow:0 32px 80px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06);
}
.loka-dialog::before{
  content:'';position:absolute;top:0;left:20%;right:20%;height:1px;
  background:linear-gradient(90deg,transparent,var(--accent),transparent);
  opacity:.6;border-radius:1px;
}
.loka-dialog-icon{
  width:48px;height:48px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:1.4rem;margin-bottom:1rem;
  background:var(--accent-lo);
  border:1px solid var(--border-1);
}
.loka-dialog-icon.warn{background:var(--warn-bg);border-color:rgba(245,158,11,.3)}
.loka-dialog-icon.err{background:var(--err-bg);border-color:rgba(239,68,68,.3)}
.loka-dialog h3{
  font-size:1.05rem;font-weight:700;color:var(--text-1);
  margin-bottom:.5rem;letter-spacing:-.02em;
}
.loka-dialog p{
  font-size:.85rem;color:var(--text-2);line-height:1.5;margin-bottom:1.35rem;
}
.loka-dialog input{
  margin-bottom:1.35rem;
  background:var(--bg-2);
}
.loka-dialog-actions{
  display:flex;gap:.6rem;justify-content:flex-end;
}
.loka-dialog-actions button{
  min-width:90px;padding:.55rem 1.1rem;
  font-size:.82rem;font-weight:600;
}
/* ===== SIDEBAR ANIMATION FORCE ===== */
aside {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: transform;
}
main {
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: margin-left, padding-left;
}
.sidebar-overlay {
  transition: opacity 0.35s ease !important;
}
.menu-toggle {
  transition: background 0.15s ease, transform 0.15s ease !important;
}
.menu-toggle:active {
  transform: scale(0.95) !important;
}
/* ===== API KEY ROW ===== */
.keyrow{
  display:flex;align-items:center;gap:.35rem;
  padding:.4rem .5rem;background:var(--glass-bg);
  border-radius:6px;margin:.3rem 0;
  border:1px solid var(--border-1);
}
.keyrow .keyval{
  flex:1;font-size:.72rem;
  font-family:ui-monospace,Menlo,monospace;
  padding:.15rem .4rem;background:transparent;border:none;
  color:var(--text-1);word-break:break-all;
  user-select:all;
}
.keyrow button{
  display:flex;align-items:center;justify-content:center;
  width:24px;height:24px;padding:0;
  border-radius:5px;font-size:.75rem;cursor:pointer;
  background:transparent;border:1px solid var(--border-1);
  color:var(--text-2);box-shadow:none;
  transition:all .15s;flex-shrink:0;
}
.keyrow .keyreveal:hover{background:var(--accent-lo);color:var(--accent);border-color:var(--accent)}
.keyrow .keycopy:hover{background:var(--info-bg);color:var(--info);border-color:var(--info)}
.keyrow .keydel:hover{background:var(--err-bg);color:var(--err);border-color:var(--err)}
/* ===== SMOOTH FONT OVERRIDE ===== */
body {
  font-family: "Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  font-weight: 400;
  letter-spacing: -0.006em;
  font-feature-settings: "cv11", "ss01", "kern", "liga";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
h1 { font-weight: 600; letter-spacing: -0.028em; }
h2 { font-weight: 600; letter-spacing: 0.1em; }
h3 { font-weight: 500; letter-spacing: -0.008em; }
button, .btn, input, select, textarea { font-weight: 450; letter-spacing: -0.004em; }
.nav-item { font-weight: 450; letter-spacing: -0.004em; }
.nav-item.active { font-weight: 550; }
code, pre, .cmodel, .keyval {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  letter-spacing: -0.01em;
  font-weight: 400;
}
.stat .value { font-weight: 650; letter-spacing: -0.03em; }
.pill, .badge-exists { font-weight: 500; letter-spacing: 0.005em; }
`;