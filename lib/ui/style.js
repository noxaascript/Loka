export const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#ffffff;
    --bg2:#f7f8fa;
    --bg3:#eef0f4;
    --border:#e1e4e8;
    --text:#1f2328;
    --muted:#656d76;
    --dim:#8b949e;
    --accent:#0969da;
    --accent2:#0550ae;
    --accent-light:#ddf4ff;
    --ok:#1a7f37;
    --warn:#9a6700;
    --err:#cf222e;
    --info:#0969da;
    --ok-bg:#dafbe1;
    --warn-bg:#fff8c5;
    --err-bg:#ffebe9;
    --info-bg:#ddf4ff;
    --shadow-sm:0 1px 0 rgba(27,31,36,.04);
    --shadow-md:0 3px 6px rgba(140,149,159,.15);
  }
  html{-webkit-text-size-adjust:100%}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
    background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;
    min-height:100vh;overflow-x:hidden;
  }
  /* Layout: sidebar + main */
  .app{display:flex;min-height:100vh}

  aside{
    width:240px;flex-shrink:0;background:var(--bg2);
    border-right:1px solid var(--border);
    padding:1rem 0;position:fixed;top:0;left:0;bottom:0;
    overflow-y:auto;z-index:40;transition:transform .2s ease;
    display:flex;flex-direction:column;
  }
  aside .brand{
    padding:0 1rem 1rem;border-bottom:1px solid var(--border);
    margin-bottom:.5rem;display:flex;align-items:center;gap:.6rem;
  }
  aside .brand h1{
    font-size:.95rem;color:var(--text);font-weight:600;line-height:1.2;
  }
  aside .brand small{color:var(--dim);font-size:.7rem;display:block}
  aside nav{flex:1;padding:.25rem 0}
  aside nav a{
    display:flex;align-items:center;padding:.55rem 1rem;color:var(--text);
    text-decoration:none;font-size:.875rem;font-weight:500;
    border-left:3px solid transparent;transition:all .1s;gap:.7rem;
  }
  aside nav a:hover{background:var(--bg3)}
  aside nav a.active{
    color:var(--accent);border-left-color:var(--accent);
    background:var(--accent-light);font-weight:600;
  }
  aside .hide-btn{
    margin:.5rem 1rem 0;padding:.5rem;background:transparent;
    border:1px solid var(--border);color:var(--muted);border-radius:6px;
    font-family:inherit;font-size:.8rem;font-weight:500;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:.4rem;
    transition:all .1s;
  }
  aside .hide-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--bg)}

  main{
    flex:1;margin-left:240px;padding:1.5rem 2rem 3rem;
    max-width:1200px;width:100%;min-width:0;
    transition:margin-left .2s ease;
  }
  body.sidebar-hidden aside{transform:translateX(-100%)}
  body.sidebar-hidden main{margin-left:0;padding-left:4.5rem}

  .menu-toggle{
    position:fixed;top:.75rem;left:.75rem;z-index:50;
    background:var(--bg);border:1px solid var(--border);color:var(--text);
    width:40px;height:40px;border-radius:8px;font-size:1.1rem;cursor:pointer;
    display:none;align-items:center;justify-content:center;padding:0;
    box-shadow:var(--shadow-sm);transition:all .1s;
  }
  .menu-toggle:hover{border-color:var(--accent);color:var(--accent)}
  body.sidebar-hidden .menu-toggle{display:flex}

  /* Typography */
  h1{font-size:1.4rem;margin-bottom:.25rem;font-weight:600;letter-spacing:-.01em}
  h2{
    font-size:.75rem;color:var(--muted);margin:1.75rem 0 .75rem;
    text-transform:uppercase;letter-spacing:.06em;font-weight:600;
  }
  h3{font-size:.95rem;margin-bottom:.5rem;font-weight:600}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  p{margin-bottom:.75rem}
  .muted{color:var(--muted)}
  .dim{color:var(--dim)}

  code{
    background:var(--bg3);padding:.15rem .4rem;border-radius:4px;
    color:var(--text);font-size:.85em;
    font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
    word-break:break-word;
    border:1px solid var(--border);
  }

  /* Tables — responsive */
  .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:.5rem}
  table{width:100%;border-collapse:collapse;min-width:500px}
  th,td{text-align:left;padding:.65rem .85rem;border-bottom:1px solid var(--border);
    vertical-align:middle;font-size:.85rem}
  th{color:var(--muted);font-weight:600;text-transform:uppercase;
    font-size:.7rem;letter-spacing:.05em;background:var(--bg2);
    white-space:nowrap}
  tbody tr:hover td{background:var(--bg2)}

  .pill{
    display:inline-block;padding:.15rem .55rem;border-radius:999px;
    font-size:.7rem;font-weight:600;white-space:nowrap;line-height:1.6;
  }
  .pill.ok{background:var(--ok-bg);color:var(--ok)}
  .pill.warn{background:var(--warn-bg);color:var(--warn)}
  .pill.err{background:var(--err-bg);color:var(--err)}
  .pill.info{background:var(--info-bg);color:var(--info)}
  .pill.tag{background:var(--bg3);color:var(--muted)}
  .pill.dim{background:var(--bg3);color:var(--dim)}

  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
    gap:1rem;margin-top:.75rem;
  }
  .card{
    background:var(--bg);border:1px solid var(--border);border-radius:8px;
    padding:1.1rem;transition:box-shadow .12s;
  }
  .card:hover{box-shadow:var(--shadow-md)}
  .card h3{
    display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;
    font-size:.95rem;color:var(--text);
  }
  .card .row{
    display:flex;justify-content:space-between;padding:.4rem 0;
    font-size:.85rem;border-bottom:1px solid var(--border);gap:1rem;
  }
  .card .row:last-child{border-bottom:none}
  .card .row > span:first-child{color:var(--muted);flex-shrink:0}
  .card .row > span:last-child{text-align:right;word-break:break-word;min-width:0}

  .stat{
    background:var(--bg);border:1px solid var(--border);border-radius:8px;
    padding:1.1rem;
  }
  .stat .label{
    color:var(--muted);font-size:.7rem;text-transform:uppercase;
    letter-spacing:.05em;font-weight:600;
  }
  .stat .value{font-size:1.5rem;color:var(--text);margin-top:.3rem;font-weight:600}
  .stat .sub{color:var(--dim);font-size:.75rem;margin-top:.2rem}

  .stats-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
    gap:.85rem;
  }

  /* Buttons */
  button,.btn{
    background:var(--accent);color:#fff;border:1px solid var(--accent);
    padding:.5rem 1rem;border-radius:6px;font-family:inherit;font-size:.85rem;
    font-weight:500;cursor:pointer;transition:all .1s;line-height:1.4;
  }
  button:hover,.btn:hover{background:var(--accent2);border-color:var(--accent2)}
  button.ghost{background:var(--bg);color:var(--text);border-color:var(--border)}
  button.ghost:hover{background:var(--bg2);border-color:var(--accent);color:var(--accent)}
  button.danger{background:var(--err);border-color:var(--err)}
  button.danger:hover{background:#a40e26;border-color:#a40e26}
  button.sm{padding:.3rem .65rem;font-size:.75rem}
  button:disabled{opacity:.5;cursor:not-allowed}

  /* Inputs */
  input,select,textarea{
    background:var(--bg);border:1px solid var(--border);color:var(--text);
    padding:.5rem .75rem;border-radius:6px;font-family:inherit;font-size:.85rem;
    width:100%;transition:border-color .1s;
  }
  input:focus,select:focus,textarea:focus{
    outline:none;border-color:var(--accent);
    box-shadow:0 0 0 3px rgba(9,105,218,.15)
  }
  label{
    display:block;margin-bottom:.3rem;color:var(--muted);
    font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600;
  }
  .field{margin-bottom:1rem}

  .bar{height:6px;background:var(--bg3);border-radius:999px;overflow:hidden;margin-top:.3rem}
  .bar > div{height:100%;background:var(--accent);transition:width .3s}

  pre{
    background:var(--bg2);padding:.9rem 1rem;border-radius:6px;
    overflow-x:auto;-webkit-overflow-scrolling:touch;
    font-size:.8rem;color:var(--text);border:1px solid var(--border);
    line-height:1.6;
    font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  }

  .toolbar{display:flex;gap:.5rem;margin:1rem 0;flex-wrap:wrap;align-items:center}
  .toolbar .spacer{flex:1;min-width:0}

  .empty{
    text-align:center;padding:2.5rem 1rem;color:var(--dim);
    border:1px dashed var(--border);border-radius:8px;margin-top:1rem;
    background:var(--bg2);
  }

  .toast{
    position:fixed;bottom:1.25rem;right:1.25rem;left:1.25rem;
    background:var(--text);color:#fff;padding:.85rem 1.2rem;border-radius:8px;
    font-size:.85rem;box-shadow:0 8px 24px rgba(140,149,159,.3);
    z-index:100;display:none;max-width:420px;margin-left:auto;
    font-weight:500;
  }
  .toast.show{display:block;animation:slideIn .2s ease}
  @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}

  .url-box{
    background:var(--bg);border:1px solid var(--border);border-radius:8px;
    padding:.75rem 1rem;display:flex;align-items:center;gap:.75rem;
    margin-bottom:.5rem;
  }
  .url-box:hover{border-color:var(--accent)}
  .url-box code{
    flex:1;background:none;padding:0;font-size:.85rem;color:var(--text);
    border:none;overflow:hidden;text-overflow:ellipsis;
  }
  .url-box .label{
    color:var(--muted);font-size:.7rem;text-transform:uppercase;
    min-width:75px;font-weight:600;letter-spacing:.04em;
  }

  /* Mobile */
  @media(max-width:900px){
    aside{
      width:100%;max-width:280px;
      transform:translateX(-100%);
      box-shadow:4px 0 20px rgba(140,149,159,.15);
    }
    body:not(.sidebar-hidden) aside{transform:translateX(0)}
    body.sidebar-hidden aside{transform:translateX(-100%)}
    main{margin-left:0;padding:1rem 1rem 3rem}
    body.sidebar-hidden main{padding-left:1rem}
    .menu-toggle{display:flex}
    body:not(.sidebar-hidden) .menu-toggle{display:none}
    h1{font-size:1.2rem}
    .stats-grid{grid-template-columns:repeat(2,1fr)}
    .grid{grid-template-columns:1fr}
    .url-box{flex-wrap:wrap;gap:.5rem}
    .url-box code{flex:1 1 100%;order:2}
    .url-box .label{min-width:auto}
    .url-box button{order:1;margin-left:auto}
    table{min-width:400px}
    th,td{padding:.55rem .65rem;font-size:.8rem}
  }
  @media(max-width:480px){
    main{padding:.75rem .75rem 2.5rem}
    h1{font-size:1.1rem}
    .card{padding:.9rem}
    .stat{padding:.9rem}
    .stat .value{font-size:1.3rem}
    button{padding:.45rem .85rem;font-size:.8rem}
    .toast{left:.75rem;right:.75rem;bottom:.75rem}
  }
`;
