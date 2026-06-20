import { useState, useEffect, useRef, useCallback } from "react";

const DARK = {
  bg:"#08111A",card:"#0E1C28",cardL:"#132233",border:"#1A2E42",borderL:"#243D55",
  green:"#00C46A",greenD:"#009E55",gold:"#F0C040",goldD:"#C49A20",
  red:"#E05050",redL:"#FF7070",blue:"#4A90D8",blueL:"#6AAAF0",
  purple:"#8B6FE8",orange:"#E87840",teal:"#20A8A8",
  white:"#EEF4F0",muted:"#6A8A9A",mutedL:"#8AAABA",
};
const LIGHT = {
  bg:"#F9FAF9",card:"#FFFFFF",cardL:"#F3F5F3",border:"#E2E8E2",borderL:"#D4DDD4",
  green:"#1A7A42",greenD:"#115C30",gold:"#8A6800",goldD:"#6A5000",
  red:"#B82828",redL:"#D84848",blue:"#1E5096",blueL:"#3A70B6",
  purple:"#5030A0",orange:"#B04A10",teal:"#0E6868",
  white:"#111811",muted:"#5A7A5A",mutedL:"#3A5A3A",
};
// Global theme - toggled by App
let C = {...DARK};
// Theme context  allows instant global theme without resetting component state
const ThemeCtx = React.createContext(true);
const useTheme = () => React.useContext(ThemeCtx);

const applyTheme = (dark) => {
  Object.assign(C, dark ? DARK : LIGHT);
  document.body.style.background = C.bg;
  document.body.style.color = C.white;
};
const setTheme = applyTheme;

const FONTS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`;
const GCSS=`
${FONTS}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body,#root{height:100%;background:#F9FAF9;}
body{font-family:'DM Sans',sans-serif;color:#111811;transition:background .3s,color .3s;}
input,button,select,textarea{font-family:'DM Sans',sans-serif;color:#EEF4F0;}
input::placeholder,textarea::placeholder{color:#6A8A9A;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:#1A2E42;border-radius:2px;}
.mono{font-family:'DM Mono',monospace;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ping{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.2);opacity:0}}
@keyframes popBtn{0%{transform:scale(1)}35%{transform:scale(.93)}100%{transform:scale(1)}}
.fu{animation:fadeUp .22s ease both;}
@media(min-width:640px){
  .tablet-cols{display:grid!important;grid-template-columns:1fr 1fr;gap:14px;}
  .tablet-full{grid-column:span 2;}
  .app-shell{max-width:900px!important;}
  .sidebar{width:260px;flex-shrink:0;border-right:1px solid #E2E8E2;overflow-y:auto;}
  .main-content{flex:1;overflow-y:auto;}
}
`;

const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const pct=(a,b)=>(a+b===0?0:Math.round(a/(a+b)*100));
const avg=arr=>arr.length===0?"--":(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
const clamp=(v,mn,mx)=>Math.min(mx,Math.max(mn,v));
const isInj=p=>p&&(p.status==="Lesionado"||p.status==="Lesionada");

// SVG icon set -- no emojis
const Icon=({name,size=16,color="currentColor"})=>{
  const icons={
    home:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    chat:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    plus:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    calendar:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    user:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    target:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    zap:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    x:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    arrow:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    net:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M2 12h20M4 6h16M4 18h16"/></svg>,
    brain:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 017 4.5v1A2.5 2.5 0 014.5 8a2.5 2.5 0 010 5A2.5 2.5 0 017 15.5v1A2.5 2.5 0 009.5 19h5a2.5 2.5 0 002.5-2.5v-1a2.5 2.5 0 002.5-2.5 2.5 2.5 0 000-5A2.5 2.5 0 0017 5.5v-1A2.5 2.5 0 0014.5 2z"/></svg>,
    heart:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    drop:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
    trophy:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4a2 2 0 000 4c0 3.31 2.69 6 6 6h0a6 6 0 006-6 2 2 0 000-4h-3"/><line x1="7" y1="4" x2="17" y2="4"/></svg>,
    clock:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    check:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    edit:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    replay:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
    live:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" fill={color}/><path d="M6.3 6.3a8 8 0 000 11.4M17.7 6.3a8 8 0 010 11.4"/></svg>,
    send:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    pin:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    tennis:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M6 12a6 6 0 006 6M6 12a6 6 0 016-6"/></svg>,
  };
  return icons[name]||<span style={{fontSize:size*0.7,color}}>[{name}]</span>;
};

// --- BOSSI LOGO SVG ---
function BossiLogo({size=48,color,animated=false,dark=true}){
  const col = color||(dark?"#E8EEE8":"#111111");

  // Three strokes, sequential animation:
  // S1: diagonal spine  enters top-right, sweeps elegantly to bottom-left
  // S2: upper B bump  tight teardrop loop from top of spine
  // S3: lower B sweep  wide generous curve rightward, pointed tip, flows left into T crossbar

  // Fine ink paths  like a Pentel Sign Pen or Kuretake brush
  const spine    = "M51 7 C49 13 45 27 39 45 C33 61 25 77 18 95 C15 103 13 109 11 115";
  const loopTop  = "M41 15 C45 6 68 7 66 20 C64 31 48 37 41 40";
  const loopBotT = "M41 40 C44 40 71 44 70 59 C69 73 47 75 33 72 C22 70 7 73 2 75";

  // Animation: draw each stroke with dashoffset trick
  const DUR = [0.65, 0.60, 1.05];
  const DEL = [0, DUR[0], DUR[0]+DUR[1]];
  const LEN = [155, 108, 285];

  const anim = (i) => animated ? {
    strokeDasharray: LEN[i],
    strokeDashoffset: LEN[i],
    style: {
      animation: `inkS${i} ${DUR[i]}s cubic-bezier(0.3,0,0.2,1) ${DEL[i]}s forwards`,
    }
  } : {style:{}};

  return(
    <svg width={size} height={size*1.42}
      viewBox="0 0 70 118" fill="none"
      strokeLinecap="round" strokeLinejoin="round">
      {animated&&<style>{
        `@keyframes inkS0{to{stroke-dashoffset:0}}` +
        `@keyframes inkS1{to{stroke-dashoffset:0}}` +
        `@keyframes inkS2{to{stroke-dashoffset:0}}`
      }</style>}

      {/* S1  spine: thin entry, naturally slightly thicker through mid */}
      <path d={spine} stroke={col} strokeWidth="1.0" {...anim(0)}/>
      <path d={spine} stroke={col} strokeWidth="1.8" opacity="0.18"
        {...anim(0)} style={{...anim(0).style}}/>

      {/* S2  upper B loop: delicate thin stroke */}
      <path d={loopTop} stroke={col} strokeWidth="0.9" {...anim(1)}/>
      <path d={loopTop} stroke={col} strokeWidth="1.6" opacity="0.15"
        {...anim(1)} style={{...anim(1).style}}/>

      {/* S3  lower B + T crossbar: slightly bolder at the belly */}
      <path d={loopBotT} stroke={col} strokeWidth="0.95" {...anim(2)}/>
      <path d={loopBotT} stroke={col} strokeWidth="2.2" opacity="0.14"
        {...anim(2)} style={{...anim(2).style}}/>
    </svg>
  );
}

// --- ATOMS ---
function Pill({children,color=C.green,sm}){
  return <span style={{background:color+"1A",color,border:`1px solid ${color}33`,
    borderRadius:4,padding:sm?"1px 7px":"2px 10px",fontSize:sm?10:11,fontWeight:600,
    letterSpacing:.3,whiteSpace:"nowrap",display:"inline-block"}}>{children}</span>;
}
function Bar({v,max,color,h=5}){
  const w=max===0?0:clamp(v/max*100,0,100);
  return <div style={{background:C.border,borderRadius:4,height:h,overflow:"hidden"}}>
    <div style={{width:`${w}%`,background:color,height:"100%",borderRadius:4,transition:"width .4s ease"}}/>
  </div>;
}
function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{background:C.card,borderRadius:14,padding:14,
    border:`1px solid ${C.border}`,cursor:onClick?"pointer":undefined,...style}}>{children}</div>;
}
function Tag({children}){
  return <p style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.2,marginBottom:8}}>{children}</p>;
}
function Avatar({initials,size=36,color=C.green}){
  return <div style={{width:size,height:size,borderRadius:size/2,background:color+"22",
    border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:size*0.33,fontWeight:700,color,flexShrink:0}}>{initials}</div>;
}
function StatBox({label,value,color=C.white,sub}){
  return <div style={{background:C.bg,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
    <p style={{fontSize:9,color:C.muted,marginBottom:3}}>{label}</p>
    <p className="mono" style={{fontSize:19,fontWeight:700,color}}>{value}</p>
    {sub&&<p style={{fontSize:9,color:C.muted,marginTop:2}}>{sub}</p>}
  </div>;
}
function Inp({label,value,onChange,placeholder,type="text",half}){
  return <div style={{marginBottom:10,flex:half?"1":undefined}}>
    {label&&<p style={{fontSize:11,color:C.muted,marginBottom:5}}>{label}</p>}
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
      style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,
        borderRadius:9,padding:"10px 12px",color:C.white,fontSize:13,outline:"none"}}/>
  </div>;
}
function Chips({label,value,onChange,opts}){
  return <div style={{marginBottom:12}}>
    {label&&<p style={{fontSize:11,color:C.muted,marginBottom:6}}>{label}</p>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {opts.map(o=><button key={o} onClick={()=>onChange(o)}
        style={{padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer",
          border:`1px solid ${value===o?C.green:C.border}`,
          background:value===o?C.green+"18":C.bg,
          color:value===o?C.green:C.mutedL,fontWeight:value===o?700:400}}>{o}</button>)}
    </div>
  </div>;
}

// --- SCALE 1-4 / 1-5 ---
const SC4=["#E05050","#E87840","#4A90D8","#00C46A"];
const SC5=["#E05050","#E87840","#F0C040","#4A90D8","#00C46A"];
function Scale({label,icon,value,onChange,max=4,descriptions=[],compact}){
  const cols=max===5?SC5:SC4;
  return <div style={{marginBottom:compact?0:4}}>
    {!compact&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
      <span style={{fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
        {icon&&<Icon name={icon} size={14} color={C.mutedL}/>} {label}
      </span>
      {value>0&&<Pill color={cols[value-1]} sm>{value}/{max}</Pill>}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:`repeat(${max},1fr)`,gap:4}}>
      {Array.from({length:max},(_,i)=>i+1).map(n=>{
        const col=cols[n-1];const on=value===n;
        return <button key={n} onClick={()=>onChange(on?0:n)}
          style={{padding:compact?"7px 2px":"9px 2px",borderRadius:8,
            border:`1px solid ${on?col:C.border}`,background:on?col+"22":C.bg,
            color:on?col:C.muted,cursor:"pointer",fontSize:11,fontWeight:on?700:400,
            transition:"all .13s",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
          <span>{n}</span>
          {descriptions[n-1]&&!compact&&<span style={{fontSize:8,color:on?col:C.muted,textAlign:"center",lineHeight:1.1}}>
            {descriptions[n-1]}</span>}
        </button>;
      })}
    </div>
  </div>;
}

// --- COUNT BUTTON ---
function CB({label,sub,value,color,flash,onTap,onUndo}){
  return <button onClick={onTap} onContextMenu={e=>{e.preventDefault();onUndo&&onUndo();}}
    style={{padding:"13px 10px",borderRadius:12,
      border:`1.5px solid ${flash?color:color+"33"}`,
      background:flash?color+"28":color+"0D",cursor:"pointer",textAlign:"left",
      transition:"border .1s,background .1s",
      transform:flash?"scale(.95)":"scale(1)",userSelect:"none"}}>
    <p style={{fontSize:10,color:C.muted,marginBottom:2,lineHeight:1.3}}>{label}</p>
    {sub&&<p style={{fontSize:9,color:color+"99",marginBottom:3}}>{sub}</p>}
    <p className="mono" style={{fontSize:26,fontWeight:700,color,lineHeight:1}}>{value}</p>
    <p style={{fontSize:8,color:C.muted,marginTop:3}}>mant. = deshacer</p>
  </button>;
}

// --- EMOTIONS ---
const EMOTIONS=[
  {k:"zona",l:"En zona",icon:"target"},
  {k:"motiv",l:"Motivado",icon:"zap"},
  {k:"suelto",l:"Suelto",icon:"heart"},
  {k:"neutro",l:"Neutro",icon:"user"},
  {k:"tenso",l:"Tenso",icon:"brain"},
  {k:"frustrado",l:"Frustrado",icon:"x"},
  {k:"nervioso",l:"Nervioso",icon:"drop"},
  {k:"desconect",l:"Desconectado",icon:"clock"},
  {k:"fuego",l:"Muy activado",icon:"zap"},
];
const emoticonFor=k=>({zona:"*",motiv:"^",suelto:"~",neutro:".",tenso:"!",frustrado:"x",nervioso:"?",desconect:"...",fuego:"!"})[k]||".";

// Session type label map for HomeScreen
const SESSION_TYPES_MAP={
  technical:"Tecnica",physical:"Fisico",tactical:"Tactica",
  match:"Partido entreno",serve:"Saque especifico",
  recovery:"Recuperacion",group:"Clase grupal",
  games:"Juegos",custom:"Personalizado",
};

// --- SEED DATA ---
function mkSet(overrides={}){
  return {
    serve1In:0,serve1Fault:0,serve1T:0,serve1Wide:0,
    serve2In:0,serve2DF:0,serve2T:0,serve2Wide:0,ace:0,
    wFhSpace:0,wFhAngle:0,wFhSpecial:0,wFhPass:0,
    wBhSpace:0,wBhAngle:0,wBhSpecial:0,wBhPass:0,
    errFhNet:0,errFhOut:0,errBhNet:0,errBhOut:0,
    rivalWinner:0,rivalError:0,
    netApproach:0,netWon:0,netLost:0,
    decisionOk:0,decisionBad:0,resetRitual:0,
    fatigueLevel:0,feelingBall:0,feelingRigidity:0,feelingActivation:0,
    hydration:0,emotionCoach:"",
    feelingPlayer:0,techFhCoach:0,techBhCoach:0,techServeCoach:0,
    rallyEntries:[],currentBalls:0,gameNum:1,custom:{},
    ...overrides
  };
}

const Q_MATCHES=[
  {id:"qm1",playerId:"p3",rival:"Ivan Roca",date:"2026-06-08",surface:"Dura",tournament:"Club Invitacional",round:"SF",result:"W",score:"6-4 7-5",
    sets:[mkSet({serve1In:22,serve1Fault:6,serve2In:8,serve2DF:1,ace:4,serve1T:14,serve1Wide:8,wFhSpace:5,wFhAngle:3,wFhSpecial:2,wFhPass:1,wBhSpace:2,wBhAngle:2,wBhSpecial:1,wBhPass:0,errFhNet:2,errFhOut:1,errBhNet:1,errBhOut:2,rivalWinner:5,rivalError:9,netApproach:8,netWon:6,decisionOk:11,decisionBad:2,fatigueLevel:2,feelingBall:4,feelingRigidity:1,feelingActivation:3,hydration:3,emotionCoach:"zona",feelingPlayer:4,techFhCoach:4,techBhCoach:3,techServeCoach:4,gameNum:10}),
     mkSet({serve1In:20,serve1Fault:7,serve2In:6,serve2DF:0,ace:3,serve1T:12,serve1Wide:8,wFhSpace:4,wFhAngle:4,wFhSpecial:1,wFhPass:2,wBhSpace:3,wBhAngle:1,wBhSpecial:0,wBhPass:1,errFhNet:1,errFhOut:2,errBhNet:2,errBhOut:1,rivalWinner:4,rivalError:11,netApproach:10,netWon:8,decisionOk:12,decisionBad:1,fatigueLevel:3,feelingBall:3,feelingRigidity:2,feelingActivation:3,hydration:2,emotionCoach:"motiv",feelingPlayer:3,techFhCoach:4,techBhCoach:4,techServeCoach:4,gameNum:12})]},
  {id:"qm2",playerId:"p3",rival:"Marc Blanes",date:"2026-05-25",surface:"Tierra",tournament:"Regional Open",round:"F",result:"L",score:"4-6 6-7",
    sets:[mkSet({serve1In:18,serve1Fault:10,serve2In:7,serve2DF:2,ace:2,serve1T:10,serve1Wide:8,wFhSpace:3,wFhAngle:2,wFhSpecial:1,wFhPass:0,wBhSpace:1,wBhAngle:1,wBhSpecial:0,wBhPass:0,errFhNet:4,errFhOut:3,errBhNet:3,errBhOut:2,rivalWinner:9,rivalError:5,netApproach:5,netWon:3,decisionOk:7,decisionBad:5,fatigueLevel:3,feelingBall:2,feelingRigidity:2,feelingActivation:2,hydration:2,emotionCoach:"tenso",feelingPlayer:2,techFhCoach:2,techBhCoach:3,techServeCoach:3,gameNum:10}),
     mkSet({serve1In:17,serve1Fault:10,serve2In:8,serve2DF:3,ace:1,serve1T:9,serve1Wide:8,wFhSpace:2,wFhAngle:1,wFhSpecial:0,wFhPass:1,wBhSpace:2,wBhAngle:0,wBhSpecial:1,wBhPass:0,errFhNet:5,errFhOut:3,errBhNet:4,errBhOut:2,rivalWinner:10,rivalError:4,netApproach:4,netWon:2,decisionOk:6,decisionBad:6,fatigueLevel:4,feelingBall:2,feelingRigidity:3,feelingActivation:4,hydration:1,emotionCoach:"frustrado",feelingPlayer:2,techFhCoach:2,techBhCoach:2,techServeCoach:2,gameNum:13})]},
  {id:"qm3",playerId:"p3",rival:"Pedro Valls",date:"2026-05-10",surface:"Tierra",tournament:"Regional Open",round:"SF",result:"W",score:"7-5 6-3",
    sets:[mkSet({serve1In:21,serve1Fault:7,serve2In:9,serve2DF:1,ace:3,serve1T:13,serve1Wide:8,wFhSpace:5,wFhAngle:3,wFhSpecial:2,wFhPass:1,wBhSpace:2,wBhAngle:2,wBhSpecial:1,wBhPass:0,errFhNet:2,errFhOut:2,errBhNet:2,errBhOut:1,rivalWinner:7,rivalError:8,netApproach:7,netWon:5,decisionOk:10,decisionBad:3,fatigueLevel:2,feelingBall:3,feelingRigidity:1,feelingActivation:3,hydration:3,emotionCoach:"zona",feelingPlayer:4,techFhCoach:3,techBhCoach:4,techServeCoach:4,gameNum:12}),
     mkSet({serve1In:23,serve1Fault:4,serve2In:6,serve2DF:0,ace:4,serve1T:14,serve1Wide:9,wFhSpace:6,wFhAngle:2,wFhSpecial:2,wFhPass:1,wBhSpace:3,wBhAngle:2,wBhSpecial:0,wBhPass:0,errFhNet:1,errFhOut:1,errBhNet:1,errBhOut:0,rivalWinner:5,rivalError:12,netApproach:9,netWon:7,decisionOk:13,decisionBad:1,fatigueLevel:2,feelingBall:4,feelingRigidity:1,feelingActivation:3,hydration:3,emotionCoach:"motiv",feelingPlayer:4,techFhCoach:4,techBhCoach:4,techServeCoach:5,gameNum:9})]},
  {id:"qm4",playerId:"p3",rival:"Alex Torres",date:"2026-04-18",surface:"Dura",tournament:"Copa Primavera",round:"QF",result:"W",score:"6-2 6-4",
    sets:[mkSet({serve1In:24,serve1Fault:5,serve2In:7,serve2DF:1,ace:5,serve1T:15,serve1Wide:9,wFhSpace:7,wFhAngle:4,wFhSpecial:2,wFhPass:2,wBhSpace:3,wBhAngle:2,wBhSpecial:1,wBhPass:1,errFhNet:1,errFhOut:1,errBhNet:1,errBhOut:1,rivalWinner:4,rivalError:13,netApproach:11,netWon:9,decisionOk:14,decisionBad:1,fatigueLevel:1,feelingBall:4,feelingRigidity:1,feelingActivation:3,hydration:3,emotionCoach:"zona",feelingPlayer:5,techFhCoach:4,techBhCoach:4,techServeCoach:4,gameNum:8}),
     mkSet({serve1In:22,serve1Fault:6,serve2In:8,serve2DF:0,ace:4,serve1T:13,serve1Wide:9,wFhSpace:5,wFhAngle:4,wFhSpecial:2,wFhPass:1,wBhSpace:4,wBhAngle:2,wBhSpecial:1,wBhPass:0,errFhNet:1,errFhOut:2,errBhNet:1,errBhOut:1,rivalWinner:3,rivalError:14,netApproach:10,netWon:9,decisionOk:13,decisionBad:2,fatigueLevel:2,feelingBall:4,feelingRigidity:1,feelingActivation:2,hydration:3,emotionCoach:"suelto",feelingPlayer:5,techFhCoach:4,techBhCoach:4,techServeCoach:4,gameNum:10})]},
];

const SEED_PLAYERS=[
  {id:"p1",name:"Marcos Ruiz",age:16,hand:"Diestro",backhand:"2 manos",racket:"Babolat Pure Aero",hoursWeek:12,yearsPlaying:6,type:"Competicion",status:"Activo",phase:"Competicion",since:"Sep 2023",winRate:62,weight:68,height:178,avatar:"MR",
    objectives:[{id:"o1",stat:"serve1Pct",label:"1er Saque > 70%",target:70,current:58,unit:"%",done:false,deadline:"2026-08-01"},{id:"o2",stat:"netWonPct",label:"Ganar > 65% puntos en red",target:65,current:51,unit:"%",done:false,deadline:"2026-07-15"}]},
  {id:"p2",name:"Sofia Martin",age:14,hand:"Diestra",backhand:"1 mano",racket:"Wilson Blade 98",hoursWeek:8,yearsPlaying:4,type:"Competicion",status:"Lesionada",phase:"Pretemporada",since:"Ene 2024",winRate:55,weight:54,height:164,avatar:"SM",
    objectives:[{id:"o3",stat:"ueCount",label:"< 15 ENF por partido",target:15,current:22,unit:"",done:false,deadline:"2026-09-01"}]},
  {id:"p3",name:"Quique Navarro",age:27,hand:"Diestro",backhand:"2 manos",racket:"Head Extreme MP",hoursWeek:16,yearsPlaying:14,type:"Competicion",status:"Activo",phase:"Competicion",since:"Mar 2022",winRate:71,weight:80,height:185,avatar:"QN",
    objectives:[{id:"o4",stat:"serve1Pct",label:"1er Saque > 75%",target:75,current:69,unit:"%",done:false,deadline:"2026-09-01"},{id:"o5",stat:"netWonPct",label:"80% efectividad en red",target:80,current:74,unit:"%",done:false,deadline:"2026-08-15"}]},
  {id:"p4",name:"Tito Ferrer",age:18,hand:"Diestro",backhand:"2 manos",racket:"Wilson Ultra 100",hoursWeek:10,yearsPlaying:13,type:"Competicion",status:"Activo",phase:"Competicion",since:"Jun 2025",winRate:58,weight:74,height:182,avatar:"TF",
    objectives:[{id:"o6",stat:"ueCount",label:"Reducir ENF < 18/partido",target:18,current:24,unit:"",done:false,deadline:"2026-10-01"}]},
  {id:"p5",name:"Marta Soler",age:23,hand:"Diestra",backhand:"2 manos",racket:"Babolat Pure Drive",hoursWeek:14,yearsPlaying:15,type:"Competicion",status:"Activo",phase:"Competicion",since:"Nov 2023",winRate:66,weight:61,height:170,avatar:"MS",
    objectives:[{id:"o7",stat:"serve1Pct",label:"1er Saque > 65%",target:65,current:60,unit:"%",done:false,deadline:"2026-08-01"},{id:"o8",stat:"decisionPct",label:"Decisiones correctas > 75%",target:75,current:68,unit:"%",done:false,deadline:"2026-09-15"}]},
];

const SEED_MATCHES=[
  {id:"m1",playerId:"p1",rival:"Carlos Perez",date:"2026-06-10",surface:"Tierra",tournament:"Open Provincia",round:"SF",result:"W",score:"6-3 7-5",
    sets:[mkSet({serve1In:18,serve1Fault:8,serve2In:6,serve2DF:1,ace:2,serve1T:10,serve1Wide:8,wFhSpace:4,wFhAngle:2,wFhSpecial:1,wFhPass:1,wBhSpace:2,wBhAngle:1,wBhSpecial:0,wBhPass:1,errFhNet:3,errFhOut:2,errBhNet:2,errBhOut:1,rivalWinner:6,rivalError:8,netApproach:7,netWon:5,fatigueLevel:2,feelingBall:3,feelingRigidity:1,feelingActivation:3,hydration:3,emotionCoach:"zona",decisionOk:8,decisionBad:2,resetRitual:1,feelingPlayer:4,techFhCoach:3,techBhCoach:3,techServeCoach:4,gameNum:7}),
     mkSet({serve1In:20,serve1Fault:6,serve2In:5,serve2DF:0,ace:3,serve1T:12,serve1Wide:8,wFhSpace:5,wFhAngle:3,wFhSpecial:2,wFhPass:0,wBhSpace:1,wBhAngle:2,wBhSpecial:1,wBhPass:1,errFhNet:2,errFhOut:1,errBhNet:3,errBhOut:0,rivalWinner:5,rivalError:10,netApproach:9,netWon:7,fatigueLevel:3,feelingBall:3,feelingRigidity:2,feelingActivation:3,hydration:2,emotionCoach:"motiv",decisionOk:10,decisionBad:1,resetRitual:2,feelingPlayer:3,techFhCoach:4,techBhCoach:3,techServeCoach:4,gameNum:12})]},
  {id:"m2",playerId:"p1",rival:"Diego Font",date:"2026-06-07",surface:"Tierra",tournament:"Open Provincia",round:"QF",result:"W",score:"6-4 6-3",
    sets:[mkSet({serve1In:16,serve1Fault:10,serve2In:8,serve2DF:2,ace:1,serve1T:8,serve1Wide:8,wFhSpace:3,wFhAngle:1,wFhSpecial:0,wFhPass:2,wBhSpace:2,wBhAngle:0,wBhSpecial:1,wBhPass:0,errFhNet:4,errFhOut:3,errBhNet:3,errBhOut:2,rivalWinner:8,rivalError:6,netApproach:5,netWon:3,fatigueLevel:2,feelingBall:2,feelingRigidity:1,feelingActivation:2,hydration:3,emotionCoach:"neutro",decisionOk:6,decisionBad:4,resetRitual:0,feelingPlayer:3,techFhCoach:3,techBhCoach:2,techServeCoach:3,gameNum:9}),
     mkSet({serve1In:19,serve1Fault:7,serve2In:6,serve2DF:1,ace:2,serve1T:10,serve1Wide:9,wFhSpace:4,wFhAngle:2,wFhSpecial:1,wFhPass:1,wBhSpace:2,wBhAngle:1,wBhSpecial:0,wBhPass:0,errFhNet:2,errFhOut:2,errBhNet:2,errBhOut:1,rivalWinner:5,rivalError:9,netApproach:6,netWon:4,fatigueLevel:2,feelingBall:3,feelingRigidity:2,feelingActivation:3,hydration:3,emotionCoach:"suelto",decisionOk:9,decisionBad:2,resetRitual:1,feelingPlayer:4,techFhCoach:4,techBhCoach:3,techServeCoach:4,gameNum:9})]},
  ...Q_MATCHES,
];

const SEED_CHATS=[
  {id:"c1",playerId:"p1",name:"Marcos Ruiz",avatar:"MR",messages:[
    {from:"player",text:"Buenos dias entrenador, listo para hoy",time:"09:15"},
    {from:"coach",text:"Perfecto Marcos, enfocate en el saque hoy",time:"09:22"},
    {from:"player",text:"Entendido! Trabajamos la T?",time:"09:25"},
    {from:"coach",text:"Si, y tambien el approach despues del 2do saque",time:"09:26"},
  ]},
  {id:"c2",playerId:"p2",name:"Sofia Martin",avatar:"SM",messages:[
    {from:"player",text:"Cuando es el proximo entrenamiento?",time:"Ayer"},
    {from:"coach",text:"El miercoles a las 10. Como va la recuperacion?",time:"Ayer"},
    {from:"player",text:"Mejor, el fisio dice que en 2 semanas puedo volver",time:"Ayer"},
  ]},
  {id:"c3",playerId:"p3",name:"Quique Navarro",avatar:"QN",messages:[
    {from:"player",text:"Muy buen partido hoy jefe",time:"Jun 8"},
    {from:"coach",text:"Solido Quique. El saque estuvo perfecto",time:"Jun 8"},
  ]},
];

// --- SUMMARY HELPER ---
function getSummary(sets){
  const tot=f=>sets.reduce((a,s)=>a+(s[f]||0),0);
  const s1in=tot("serve1In"),s1f=tot("serve1Fault");
  const w=tot("wFhSpace")+tot("wFhAngle")+tot("wFhSpecial")+tot("wFhPass")+tot("wBhSpace")+tot("wBhAngle")+tot("wBhSpecial")+tot("wBhPass");
  const e=tot("errFhNet")+tot("errFhOut")+tot("errBhNet")+tot("errBhOut");
  const na=tot("netApproach"),nw=tot("netWon");
  const dok=tot("decisionOk"),dko=tot("decisionBad");
  const rallies=sets.flatMap(s=>(s.rallyEntries||[]).flatMap(e=>e.balls||[]));
  return{serve1Pct:pct(s1in,s1in+s1f),ace:tot("ace"),df:tot("serve2DF"),winners:w,ue:e,
    netPct:pct(nw,na),netApproach:na,decisionPct:pct(dok,dok+dko),
    feelingBall:sets.map(s=>s.feelingBall).filter(Boolean),
    fatigues:sets.map(s=>s.fatigueLevel).filter(Boolean),
    rallyAvg:rallies.length?parseFloat(avg(rallies)):null,
    emotion:sets.map(s=>s.emotionCoach).filter(Boolean).pop()||""};
}

// --- SCOREBOARD ---
function ScoreBoard({score,onScore,playerName,rivalName}){
  const{sets,currentSet,game,point,serving}=score;
  const PTS=["0","15","30","40","Ad"];
  return <Card style={{marginBottom:10}}>
    <Tag>MARCADOR</Tag>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:10}}>
      {[{name:playerName,key:"player"},{name:rivalName,key:"rival"}].map((p,i)=>(
        <div key={p.key} style={{textAlign:i===0?"left":"right"}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:4}}>{p.name}</p>
          <div style={{display:"flex",gap:4,justifyContent:i===0?"flex-start":"flex-end"}}>
            {sets.map((s,si)=><span key={si} className="mono" style={{fontSize:18,fontWeight:700,
              color:si===currentSet?C.green:C.mutedL}}>{p.key==="player"?s.p:s.r}</span>)}
          </div>
          <p className="mono" style={{fontSize:13,color:C.mutedL,marginTop:2}}>
            {PTS[p.key==="player"?point.p:point.r]}</p>
        </div>
      ))}
      <div style={{textAlign:"center"}}>
        <p className="mono" style={{fontSize:11,color:C.muted}}>J.</p>
        <p className="mono" style={{fontSize:22,fontWeight:700,color:C.gold}}>{game.p}-{game.r}</p>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <button onClick={()=>onScore("player")} style={{padding:"10px",borderRadius:9,border:"none",
        background:C.green,color:C.bg,cursor:"pointer",fontWeight:700,fontSize:13}}>
        Punto {playerName.split(" ")[0]}
      </button>
      <button onClick={()=>onScore("rival")} style={{padding:"10px",borderRadius:9,border:"none",
        background:C.red,color:C.white,cursor:"pointer",fontWeight:700,fontSize:13}}>
        Punto {rivalName.split(" ")[0]}
      </button>
    </div>
    <p style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:6}}>
      Saque: {serving==="player"?playerName:rivalName}
    </p>
  </Card>;
}

// --- MATCH RECORDING (LIVE) ---
const MATCH_TABS=[
  {id:"score",icon:"trophy",label:"Marcador"},
  {id:"serve",icon:"target",label:"Saque"},
  {id:"winners",icon:"zap",label:"Winners"},
  {id:"errors",icon:"x",label:"Errores"},
  {id:"net",icon:"net",label:"Red"},
  {id:"mental",icon:"brain",label:"Mental"},
  {id:"state",icon:"drop",label:"Estado"},
  {id:"emotion",icon:"heart",label:"Emoc."},
];

// --- SERVE MODAL ---
function ServeModal({type,onConfirm,onCancel}){
  const[dir,setDir]=useState(""); // "" | "T" | "W"
  const[ace,setAce]=useState(false);
  const isFirst=type==="s1";
  return(
    <div style={{position:"absolute",inset:0,background:"rgba(8,17,26,0.88)",
      display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:"20px 20px 32px",
        width:"100%",maxWidth:480,border:"1px solid "+C.border}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
        <p style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:4}}>
          {isFirst?"1er Saque - Dentro":"2do Saque - Dentro"}
        </p>
        <p style={{fontSize:11,color:C.muted,marginBottom:16}}>Direccion del saque</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {[["T","A la T",C.blue],["W","Abierto",C.purple],["","Sin especificar",C.muted]].map(([k,l,col])=>(
            <button key={k} onClick={()=>setDir(k)}
              style={{padding:"12px 6px",borderRadius:10,border:"1px solid "+(dir===k?col:C.border),
                background:dir===k?col+"22":C.bg,cursor:"pointer",textAlign:"center"}}>
              <p style={{fontSize:12,fontWeight:dir===k?700:400,color:dir===k?col:C.muted}}>{l}</p>
            </button>
          ))}
        </div>
        {isFirst&&(
          <button onClick={()=>setAce(a=>!a)}
            style={{width:"100%",padding:"11px",borderRadius:10,marginBottom:16,
              border:"1px solid "+(ace?C.gold:C.border),
              background:ace?C.gold+"18":C.bg,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Icon name="zap" size={16} color={ace?C.gold:C.muted}/>
            <span style={{fontSize:13,fontWeight:ace?700:400,color:ace?C.gold:C.muted}}>
              {ace?"ACE confirmado":"Fue ACE?"}
            </span>
          </button>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:8}}>
          <button onClick={onCancel}
            style={{padding:"13px",borderRadius:12,border:"1px solid "+C.border,
              background:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
            Cancelar
          </button>
          <button onClick={()=>onConfirm({type,dir,ace})}
            style={{padding:"13px",borderRadius:12,border:"none",
              background:"linear-gradient(135deg,"+C.green+","+C.greenD+")",
              color:C.bg,fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Registrar saque
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchRecording({config,onSave,onCancel}){
  const{playerName,rivalName,hydEvery=4}=config;
  const[timer,setTimer]=useState(0);
  const[running,setRunning]=useState(true);
  const[tab,setTab]=useState("score");
  const[setsData,setSetsData]=useState([mkSet()]);
  const[currentSet,setCurrentSet]=useState(0);
  const[flash,setFlash]=useState({});
  const[score,setScore]=useState({sets:[{p:0,r:0}],currentSet:0,game:{p:0,r:0},point:{p:0,r:0},serving:"player"});
  const[serveModal,setServeModal]=useState(null); // null | {type:"s1"|"s2"}

  useEffect(()=>{if(!running)return;const id=setInterval(()=>setTimer(t=>t+1),1000);return()=>clearInterval(id);},[running]);

  const D=setsData[currentSet];
  const setD=(field,val)=>setSetsData(p=>{const n=[...p];n[currentSet]={...n[currentSet],[field]:val};return n;});
  const upd=useCallback((f,amt=1)=>{
    setSetsData(p=>{const n=[...p];n[currentSet]={...n[currentSet],[f]:n[currentSet][f]+amt};return n;});
    setFlash(f2=>({...f2,[f]:true}));setTimeout(()=>setFlash(f2=>({...f2,[f]:false})),220);
  },[currentSet]);
  const undo=useCallback(f=>{
    setSetsData(p=>{const n=[...p];if(n[currentSet][f]>0)n[currentSet]={...n[currentSet],[f]:n[currentSet][f]-1};return n;});
  },[currentSet]);

  const handleScore=who=>{
    setScore(prev=>{
      const opp=who==="player"?"rival":"player";
      let pt={...prev.point},gm={...prev.game};
      let sets=[...prev.sets.map(s=>({...s}))];
      let cs=prev.currentSet,serving=prev.serving;
      pt[who]++;
      const deuce=pt.p>=3&&pt.r>=3;
      if(deuce&&pt[who]-pt[opp]>=2){gm[who]++;pt={p:0,r:0};}
      else if(!deuce&&pt[who]>=4){gm[who]++;pt={p:0,r:0};}
      if(gm[who]>=6&&gm[who]-gm[opp]>=2){
        sets[cs][who==="player"?"p":"r"]++;
        if(cs+1<5){sets.push({p:0,r:0});cs++;}
        gm={p:0,r:0};serving=serving==="player"?"rival":"player";
      }
      return{...prev,point:pt,game:gm,sets,currentSet:cs,serving};
    });
  };

  const addRally=()=>{
    if(D.currentBalls<=0)return;
    setSetsData(p=>{
      const n=[...p];const cur=n[currentSet];
      const entries=[...cur.rallyEntries];
      const idx=entries.findIndex(e=>e.game===cur.gameNum);
      if(idx>=0)entries[idx]={...entries[idx],balls:[...entries[idx].balls,cur.currentBalls]};
      else entries.push({game:cur.gameNum,balls:[cur.currentBalls]});
      n[currentSet]={...cur,rallyEntries:entries,currentBalls:0};
      return n;
    });
  };

  // Serve "in" handler - opens direction modal
  const handleServeIn=(type)=>setServeModal({type});
  const handleServeFault=(type)=>{
    if(type==="s1")upd("serve1Fault");
    else upd("serve2DF");
  };
  const confirmServe=({type,dir,ace})=>{
    if(type==="s1"){
      upd("serve1In");
      if(dir==="T")upd("serve1T");
      else if(dir==="W")upd("serve1Wide");
      if(ace)upd("ace");
    } else {
      upd("serve2In");
      if(dir==="T")upd("serve2T");
      else if(dir==="W")upd("serve2Wide");
    }
    setServeModal(null);
  };

  const totalW=D.wFhSpace+D.wFhAngle+D.wFhSpecial+D.wFhPass+D.wBhSpace+D.wBhAngle+D.wBhSpecial+D.wBhPass;
  const totalE=D.errFhNet+D.errFhOut+D.errBhNet+D.errBhOut;
  const s1tot=D.serve1In+D.serve1Fault;
  const CBtn=(f,lbl,sub,col)=><CB label={lbl} sub={sub} value={D[f]} color={col} flash={flash[f]} onTap={()=>upd(f)} onUndo={()=>undo(f)}/>;

  // Active tabs from config
  const activeTabs=config.activeTabs||["score","serve","winners","errors","net","mental","state","emotion"];
  const visibleTabs=MATCH_TABS.filter(t=>activeTabs.includes(t.id));

  return <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative"}}>
    {/* Serve direction modal */}
    {serveModal&&<ServeModal
      type={serveModal.type}
      onConfirm={confirmServe}
      onCancel={()=>setServeModal(null)}/>}
    {/* Top bar */}
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"10px 12px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative"}}>
            {running&&<div style={{position:"absolute",inset:-2,borderRadius:"50%",background:C.red,animation:"ping 1.1s infinite",opacity:.3}}/>}
            <div style={{width:8,height:8,borderRadius:"50%",background:running?C.red:C.muted}}/>
          </div>
          <span className="mono" style={{fontSize:17,fontWeight:500,letterSpacing:2}}>{fmt(timer)}</span>
          <Pill color={C.green} sm>Set {currentSet+1}</Pill>
          <Pill color={C.muted} sm>J.{D.gameNum}</Pill>
        </div>
        <div style={{display:"flex",gap:5}}>
          <button onClick={()=>setRunning(r=>!r)} style={{padding:"5px 9px",borderRadius:7,
            border:`1px solid ${C.border}`,background:"none",color:C.white,cursor:"pointer",fontSize:12}}>
            {running?"II":">"}
          </button>
          <button onClick={()=>onSave(setsData)} style={{padding:"5px 12px",borderRadius:7,
            border:"none",background:C.green,color:C.bg,cursor:"pointer",fontSize:12,fontWeight:700}}>
            Guardar
          </button>
          <button onClick={onCancel} style={{padding:"5px 9px",borderRadius:7,
            border:`1px solid ${C.border}`,background:"none",color:C.muted,cursor:"pointer",fontSize:12}}>
            <Icon name="x" size={13} color={C.muted}/>
          </button>
        </div>
      </div>
      <div style={{display:"flex",gap:4}}>
        {[[`${pct(D.serve1In,s1tot)}%`,"1er Srv",C.green],[totalW,"Wnrs",C.gold],[totalE,"ENF",C.red],
          [`${pct(D.netWon,D.netApproach)}%`,"Red",C.teal],[`${D.decisionOk}/${D.decisionOk+D.decisionBad}`,"Dec",C.blue]
        ].map(([v,l,col])=>(
          <div key={l} style={{flex:1,background:C.bg,borderRadius:6,padding:"4px 2px",textAlign:"center"}}>
            <p className="mono" style={{fontSize:12,fontWeight:700,color:col}}>{v}</p>
            <p style={{fontSize:8,color:C.muted}}>{l}</p>
          </div>
        ))}
      </div>
    </div>
    {/* Tabs */}
    <div style={{display:"flex",overflowX:"auto",background:C.bg,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
      {visibleTabs.map(t=>{
        const on=tab===t.id;
        return <button key={t.id} onClick={()=>setTab(t.id)}
          style={{flexShrink:0,padding:"8px 9px",border:"none",cursor:"pointer",background:"none",
            color:on?C.green:C.muted,borderBottom:`2px solid ${on?C.green:"transparent"}`,
            fontSize:10,fontWeight:on?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:52}}>
          <Icon name={t.icon} size={14} color={on?C.green:C.muted}/>
          <span>{t.label}</span>
        </button>;
      })}
    </div>
    {/* Content */}
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 12px 0"}}>
      {tab==="score"&&<>
        <ScoreBoard score={score} onScore={handleScore} playerName={playerName} rivalName={rivalName}/>
        <Card style={{marginBottom:10}}>
          <Tag>GOLPES EN ESTE PUNTO</Tag>
          <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginBottom:10}}>
            <button onClick={()=>setD("currentBalls",Math.max(0,D.currentBalls-1))}
              style={{width:38,height:38,borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:20,cursor:"pointer",fontWeight:700}}>-</button>
            <p className="mono" style={{fontSize:44,fontWeight:700,color:C.purple,minWidth:60,textAlign:"center"}}>{D.currentBalls}</p>
            <button onClick={()=>setD("currentBalls",D.currentBalls+1)}
              style={{width:38,height:38,borderRadius:9,border:`1px solid ${C.purple}`,background:C.purple+"22",color:C.purple,fontSize:20,cursor:"pointer",fontWeight:700}}>+</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addRally} style={{flex:2,padding:"9px",borderRadius:8,border:"none",background:C.purple,color:C.white,cursor:"pointer",fontWeight:600,fontSize:12}}>
              Registrar punto
            </button>
            <button onClick={()=>setD("gameNum",D.gameNum+1)} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.mutedL,cursor:"pointer",fontSize:11}}>
              Juego +1
            </button>
          </div>
          {D.rallyEntries.length>0&&<div style={{marginTop:10}}>
            {D.rallyEntries.map(e=>(
              <div key={e.game} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderTop:`1px solid ${C.border}`}}>
                <span style={{fontSize:10,color:C.muted,minWidth:46}}>Juego {e.game}</span>
                <div style={{flex:1}}><Bar v={parseFloat(avg(e.balls))} max={15} color={C.purple} h={4}/></div>
                <span className="mono" style={{fontSize:12,color:C.purple,fontWeight:700}}>{avg(e.balls)} g.</span>
              </div>
            ))}
          </div>}
        </Card>
        <div style={{display:"flex",gap:6,paddingBottom:8}}>
          {setsData.map((_,i)=>(
            <button key={i} onClick={()=>setCurrentSet(i)}
              style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${currentSet===i?C.green:C.border}`,background:currentSet===i?C.green+"18":C.bg,color:currentSet===i?C.green:C.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>Set {i+1}</button>
          ))}
          {setsData.length<5&&<button onClick={()=>{setSetsData(p=>[...p,mkSet()]);setCurrentSet(setsData.length);}}
            style={{padding:"6px 12px",borderRadius:8,border:`1px dashed ${C.border}`,background:"none",color:C.muted,cursor:"pointer",fontSize:11}}>+ Set</button>}
        </div>
      </>}

      {tab==="serve"&&<>
        <Card style={{marginBottom:10}}>
          <Tag>PRIMER SAQUE</Tag>
          <p style={{fontSize:10,color:C.muted,marginBottom:8}}>Toca "Dentro" para registrar direccion y si fue ACE</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <button onClick={()=>handleServeIn("s1")}
              style={{padding:"16px 10px",borderRadius:12,border:"1.5px solid "+C.green,
                background:C.green+"15",cursor:"pointer",textAlign:"left"}}>
              <p style={{fontSize:11,color:C.muted,marginBottom:4}}>Dentro</p>
              <p className="mono" style={{fontSize:28,fontWeight:700,color:C.green}}>{D.serve1In}</p>
              <p style={{fontSize:8,color:C.green,marginTop:2}}>toca para registrar</p>
            </button>
            <button onClick={()=>handleServeFault("s1")} onContextMenu={e=>{e.preventDefault();undo("serve1Fault");}}
              style={{padding:"16px 10px",borderRadius:12,border:"1.5px solid "+C.red+"44",
                background:C.red+"0D",cursor:"pointer",textAlign:"left",userSelect:"none"}}>
              <p style={{fontSize:11,color:C.muted,marginBottom:4}}>Falta</p>
              <p className="mono" style={{fontSize:28,fontWeight:700,color:C.red}}>{D.serve1Fault}</p>
              <p style={{fontSize:8,color:C.muted,marginTop:2}}>mant. = deshacer</p>
            </button>
          </div>
          <div style={{background:C.bg,borderRadius:10,padding:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,color:C.muted}}>1er Saque %</span>
              <span className="mono" style={{fontSize:14,fontWeight:700,color:C.green}}>{pct(D.serve1In,D.serve1In+D.serve1Fault)}%</span>
            </div>
            <div style={{display:"flex",gap:8,fontSize:11,color:C.muted}}>
              <span>T: <b style={{color:C.blue}}>{D.serve1T}</b></span>
              <span>Abierto: <b style={{color:C.purple}}>{D.serve1Wide}</b></span>
              <span>ACE: <b style={{color:C.gold}}>{D.ace}</b></span>
            </div>
          </div>
        </Card>
        <Card style={{marginBottom:10}}>
          <Tag>SEGUNDO SAQUE</Tag>
          <p style={{fontSize:10,color:C.muted,marginBottom:8}}>Toca "Dentro" para registrar direccion</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <button onClick={()=>handleServeIn("s2")}
              style={{padding:"16px 10px",borderRadius:12,border:"1.5px solid "+C.green,
                background:C.green+"15",cursor:"pointer",textAlign:"left"}}>
              <p style={{fontSize:11,color:C.muted,marginBottom:4}}>Dentro</p>
              <p className="mono" style={{fontSize:28,fontWeight:700,color:C.green}}>{D.serve2In}</p>
              <p style={{fontSize:8,color:C.green,marginTop:2}}>toca para registrar</p>
            </button>
            <button onClick={()=>handleServeFault("s2")} onContextMenu={e=>{e.preventDefault();undo("serve2DF");}}
              style={{padding:"16px 10px",borderRadius:12,border:"1.5px solid "+C.red+"44",
                background:C.red+"0D",cursor:"pointer",textAlign:"left",userSelect:"none"}}>
              <p style={{fontSize:11,color:C.muted,marginBottom:4}}>Doble Falta</p>
              <p className="mono" style={{fontSize:28,fontWeight:700,color:C.red}}>{D.serve2DF}</p>
              <p style={{fontSize:8,color:C.muted,marginTop:2}}>mant. = deshacer</p>
            </button>
          </div>
          <div style={{background:C.bg,borderRadius:10,padding:10}}>
            <div style={{display:"flex",gap:8,fontSize:11,color:C.muted}}>
              <span>T: <b style={{color:C.blue}}>{D.serve2T}</b></span>
              <span>Abierto: <b style={{color:C.purple}}>{D.serve2Wide}</b></span>
            </div>
          </div>
        </Card>
        <Card><Tag>SAQUE RIVAL</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CBtn("rivalWinner","Winner rival","",C.orange)}
            {CBtn("rivalError","Error rival","no forzado",C.mutedL)}
          </div>
        </Card>
      </>}

      {tab==="winners"&&<>
        <Card style={{marginBottom:10}}>
          <Tag>WINNERS DERECHA (FH)</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CBtn("wFhSpace","Hueco libre","FH",C.gold)}
            {CBtn("wFhAngle","Angulo","FH",C.orange)}
            {CBtn("wFhSpecial","Dejada / Especial","FH",C.purple)}
            {CBtn("wFhPass","Passing Shot","FH",C.blue)}
          </div>
        </Card>
        <Card><Tag>WINNERS REVES (BH)</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CBtn("wBhSpace","Hueco libre","BH",C.teal)}
            {CBtn("wBhAngle","Angulo","BH",C.green)}
            {CBtn("wBhSpecial","Dejada / Especial","BH",C.purple)}
            {CBtn("wBhPass","Passing Shot","BH",C.blue)}
          </div>
        </Card>
      </>}

      {tab==="errors"&&<>
        <Card style={{marginBottom:10}}>
          <Tag>ERRORES NO FORZADOS - DERECHA</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CBtn("errFhNet","Red","FH",C.red)}
            {CBtn("errFhOut","Fuera / Largo","FH",C.orange)}
          </div>
        </Card>
        <Card><Tag>ERRORES NO FORZADOS - REVES</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CBtn("errBhNet","Red","BH",C.red)}
            {CBtn("errBhOut","Fuera / Largo","BH",C.orange)}
          </div>
        </Card>
      </>}

      {tab==="net"&&<>
        <Card style={{marginBottom:10}}>
          <Tag>SUBIDAS A LA RED</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {CBtn("netApproach","Approach","subida",C.teal)}
            {CBtn("netWon","Ganado","en red",C.green)}
            {CBtn("netLost","Perdido","en red",C.red)}
          </div>
          {D.netApproach>0&&<div style={{background:C.bg,borderRadius:10,padding:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,color:C.muted}}>Efectividad en red</span>
              <span className="mono" style={{fontSize:15,fontWeight:700,color:C.teal}}>{pct(D.netWon,D.netApproach)}%</span>
            </div>
            <Bar v={D.netWon} max={D.netApproach} color={C.teal} h={6}/>
          </div>}
        </Card>
        <Card><Tag>TOMA DE DECISIONES</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {CBtn("decisionOk","Correcta","tactica",C.green)}
            {CBtn("decisionBad","Incorrecta","tactica",C.red)}
          </div>
          {(D.decisionOk+D.decisionBad)>0&&<div style={{background:C.bg,borderRadius:8,padding:8}}>
            <Bar v={D.decisionOk} max={D.decisionOk+D.decisionBad} color={C.green} h={5}/>
            <p style={{fontSize:10,color:C.muted,marginTop:4}}>{pct(D.decisionOk,D.decisionOk+D.decisionBad)}% decisiones correctas</p>
          </div>}
        </Card>
      </>}

      {tab==="mental"&&<>
        <Card style={{marginBottom:10}}>
          <Tag>RESET MENTAL</Tag>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <button onClick={()=>upd("resetRitual")}
              style={{width:48,height:48,borderRadius:10,border:`1px solid ${C.purple}`,background:C.purple+"18",color:C.purple,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="replay" size={22} color={C.purple}/>
            </button>
            <div>
              <p className="mono" style={{fontSize:30,fontWeight:700,color:C.purple}}>{D.resetRitual}</p>
              <p style={{fontSize:11,color:C.muted}}>rituales registrados</p>
            </div>
          </div>
        </Card>
        <Card style={{marginBottom:10}}>
          <Tag>FEELING DEL JUGADOR (1-5)</Tag>
          <Scale label="Feeling" icon="heart" value={D.feelingPlayer} onChange={v=>setD("feelingPlayer",v)} max={5} descriptions={["Muy mal","Mal","Regular","Bien","Excelente"]}/>
        </Card>
        <Card><Tag>EVALUACION TECNICA - ENTRENADOR</Tag>
          <div style={{marginBottom:12}}>
            <p style={{fontSize:12,fontWeight:600,marginBottom:6,color:C.white}}>Derecha</p>
            <Scale label="" icon="" value={D.techFhCoach} onChange={v=>setD("techFhCoach",v)} max={4} compact/>
          </div>
          <div style={{marginBottom:12}}>
            <p style={{fontSize:12,fontWeight:600,marginBottom:6,color:C.white}}>Reves</p>
            <Scale label="" icon="" value={D.techBhCoach} onChange={v=>setD("techBhCoach",v)} max={4} compact/>
          </div>
          <div>
            <p style={{fontSize:12,fontWeight:600,marginBottom:6,color:C.white}}>Saque</p>
            <Scale label="" icon="" value={D.techServeCoach} onChange={v=>setD("techServeCoach",v)} max={4} compact/>
          </div>
        </Card>
      </>}

      {tab==="state"&&<>
        <Card style={{marginBottom:10}}>
          <Tag>FATIGA (segun jugador)</Tag>
          <Scale label="Nivel de fatiga" icon="drop" value={D.fatigueLevel} onChange={v=>setD("fatigueLevel",v)} descriptions={["Fresco","Algo cansado","Muy cansado","Al limite"]}/>
        </Card>
        <Card style={{marginBottom:10}}>
          <Tag>FEELING Y SENSACIONES</Tag>
          <div style={{marginBottom:12}}><Scale label="Feeling con la bola" icon="tennis" value={D.feelingBall} onChange={v=>setD("feelingBall",v)} descriptions={["Muy malo","Regular","Bueno","Excelente"]}/></div>
          <div style={{height:1,background:C.border,margin:"10px 0"}}/>
          <div style={{marginBottom:12}}><Scale label="Rigidez muscular" icon="brain" value={D.feelingRigidity} onChange={v=>setD("feelingRigidity",v)} descriptions={["Sin rigidez","Leve","Notable","Rigido"]}/></div>
          <div style={{height:1,background:C.border,margin:"10px 0"}}/>
          <Scale label="Activacion SNS" icon="zap" value={D.feelingActivation} onChange={v=>setD("feelingActivation",v)} descriptions={["Muy bajo","Normal","Elevado","Muy alto"]}/>
        </Card>
        <Card>
          <Tag>HIDRATACION</Tag>
          <Scale label="Estado de hidratacion" icon="drop" value={D.hydration} onChange={v=>setD("hydration",v)} descriptions={["Deshidratado","Bajo","Correcto","Optimo"]}/>
        </Card>
      </>}

      {tab==="emotion"&&<Card>
        <Tag>PERCEPCION DEL ENTRENADOR</Tag>
        <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Como ves a tu jugador en este momento?</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {EMOTIONS.map(({k,l,icon})=>{
            const on=D.emotionCoach===k;
            return <button key={k} onClick={()=>setD("emotionCoach",on?"":k)}
              style={{padding:"10px 4px",borderRadius:10,border:`1px solid ${on?C.gold:C.border}`,
                background:on?C.gold+"18":C.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .13s"}}>
              <Icon name={icon} size={18} color={on?C.gold:C.muted}/>
              <span style={{fontSize:9,color:on?C.gold:C.muted,fontWeight:on?700:400,textAlign:"center"}}>{l}</span>
            </button>;
          })}
        </div>
        {D.emotionCoach&&<div style={{marginTop:12,padding:"8px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.gold}33`,textAlign:"center"}}>
          <span style={{fontSize:13,color:C.gold}}>Estado: {EMOTIONS.find(e=>e.k===D.emotionCoach)?.l||D.emotionCoach}</span>
        </div>}
      </Card>}
      <div style={{height:16}}/>
    </div>
  </div>;
}

// --- POST MATCH RECORDING ---
function PostMatchRecording({config,onSave,onCancel}){
  const{playerName,rivalName}=config;
  const[score,setScore]=useState("");
  const[surface,setSurface]=useState(config.surface||"Tierra");
  const[result,setResult]=useState("W");
  const[serve1,setServe1]=useState(0);
  const[aces,setAces]=useState(0);
  const[doubleFaults,setDoubleFaults]=useState(0);
  const[winners,setWinners]=useState(0);
  const[ue,setUe]=useState(0);
  const[netWon,setNetWon]=useState(0);
  const[netTotal,setNetTotal]=useState(0);
  const[decisionFeel,setDecisionFeel]=useState(0);
  const[fatigue,setFatigue]=useState(0);
  const[feelingBall,setFeelingBall]=useState(0);
  const[emotion,setEmotion]=useState("");
  const[objAchieved,setObjAchieved]=useState(0);
  const[notes,setNotes]=useState("");

  const handleSave=()=>{
    const synth=mkSet({
      serve1In:Math.round((serve1/100)*20),serve1Fault:Math.round(((100-serve1)/100)*20),
      ace:aces,serve2DF:doubleFaults,
      wFhSpace:Math.round(winners*0.4),wFhAngle:Math.round(winners*0.2),wBhSpace:Math.round(winners*0.3),wBhAngle:Math.round(winners*0.1),
      errFhNet:Math.round(ue*0.3),errFhOut:Math.round(ue*0.3),errBhNet:Math.round(ue*0.2),errBhOut:Math.round(ue*0.2),
      netApproach:netTotal,netWon,
      decisionOk:Math.round((decisionFeel/4)*10),decisionBad:Math.round(((4-decisionFeel)/4)*10),
      fatigueLevel:fatigue,feelingBall,emotionCoach:emotion,
      gameNum:12,
    });
    onSave([synth],{score,result,isPost:true,notes,objAchieved});
  };

  return <div style={{height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
    <div style={{padding:"16px 14px 80px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
          <Icon name="arrow" size={20} color={C.muted}/>
        </button>
        <div>
          <h2 style={{fontSize:18,fontWeight:700}}>Registro post-partido</h2>
          <p style={{fontSize:11,color:C.muted}}>{playerName} vs {rivalName}</p>
        </div>
      </div>

      <Card style={{marginBottom:12}}>
        <Tag>RESULTADO</Tag>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[["W","Victoria",C.green],["L","Derrota",C.red]].map(([k,l,col])=>(
            <button key={k} onClick={()=>setResult(k)}
              style={{flex:1,padding:"10px",borderRadius:9,border:`1px solid ${result===k?col:C.border}`,
                background:result===k?col+"18":C.bg,color:result===k?col:C.mutedL,cursor:"pointer",fontWeight:result===k?700:400,fontSize:13}}>
              {l}
            </button>
          ))}
        </div>
        <Inp label="Marcador (ej: 6-3 7-5)" value={score} onChange={setScore} placeholder="6-3 7-5"/>
      </Card>

      <Card style={{marginBottom:12}}>
        <Tag>SAQUE (por sensacion)</Tag>
        <p style={{fontSize:11,color:C.muted,marginBottom:6}}>% aproximado de 1er saque</p>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <input type="range" min={0} max={100} value={serve1} onChange={e=>setServe1(Number(e.target.value))}
            style={{flex:1,accentColor:C.green}}/>
          <span className="mono" style={{fontSize:18,fontWeight:700,color:C.green,minWidth:44}}>{serve1}%</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div>
            <p style={{fontSize:10,color:C.muted,marginBottom:4}}>ACEs</p>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>setAces(a=>Math.max(0,a-1))} style={{width:30,height:30,borderRadius:7,border:`1px solid ${C.border}`,background:C.bg,color:C.white,cursor:"pointer",fontSize:16}}>-</button>
              <span className="mono" style={{fontSize:20,fontWeight:700,color:C.gold,flex:1,textAlign:"center"}}>{aces}</span>
              <button onClick={()=>setAces(a=>a+1)} style={{width:30,height:30,borderRadius:7,border:`1px solid ${C.gold}`,background:C.gold+"18",color:C.gold,cursor:"pointer",fontSize:16}}>+</button>
            </div>
          </div>
          <div>
            <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Dobles Faltas</p>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>setDoubleFaults(a=>Math.max(0,a-1))} style={{width:30,height:30,borderRadius:7,border:`1px solid ${C.border}`,background:C.bg,color:C.white,cursor:"pointer",fontSize:16}}>-</button>
              <span className="mono" style={{fontSize:20,fontWeight:700,color:C.red,flex:1,textAlign:"center"}}>{doubleFaults}</span>
              <button onClick={()=>setDoubleFaults(a=>a+1)} style={{width:30,height:30,borderRadius:7,border:`1px solid ${C.red}`,background:C.red+"18",color:C.red,cursor:"pointer",fontSize:16}}>+</button>
            </div>
          </div>
        </div>
      </Card>

      <Card style={{marginBottom:12}}>
        <Tag>GOLPES (aproximado)</Tag>
        {[["Winners totales",winners,setWinners,C.gold],["Errores no forzados",ue,setUe,C.red]].map(([l,v,set,col])=>(
          <div key={l} style={{marginBottom:12}}>
            <p style={{fontSize:11,color:C.muted,marginBottom:6}}>{l}</p>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>set(a=>Math.max(0,a-1))} style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,cursor:"pointer",fontSize:18}}>-</button>
              <span className="mono" style={{fontSize:28,fontWeight:700,color:col,flex:1,textAlign:"center"}}>{v}</span>
              <button onClick={()=>set(a=>a+1)} style={{width:34,height:34,borderRadius:8,border:`1px solid ${col}`,background:col+"18",color:col,cursor:"pointer",fontSize:18}}>+</button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{marginBottom:12}}>
        <Tag>RED (si recuerdas)</Tag>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Subidas totales",netTotal,setNetTotal,C.teal],["Puntos ganados",netWon,setNetWon,C.green]].map(([l,v,set,col])=>(
            <div key={l}>
              <p style={{fontSize:10,color:C.muted,marginBottom:4}}>{l}</p>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <button onClick={()=>set(a=>Math.max(0,a-1))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:C.bg,color:C.white,cursor:"pointer",fontSize:14}}>-</button>
                <span className="mono" style={{fontSize:20,fontWeight:700,color:col,flex:1,textAlign:"center"}}>{v}</span>
                <button onClick={()=>set(a=>a+1)} style={{width:28,height:28,borderRadius:6,border:`1px solid ${col}`,background:col+"18",color:col,cursor:"pointer",fontSize:14}}>+</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{marginBottom:12}}>
        <Tag>SENSACIONES</Tag>
        <div style={{marginBottom:12}}>
          <Scale label="Toma de decisiones" icon="brain" value={decisionFeel} onChange={setDecisionFeel} descriptions={["Muy mala","Regular","Buena","Excelente"]}/>
        </div>
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <div style={{marginBottom:12}}>
          <Scale label="Fatiga al final" icon="drop" value={fatigue} onChange={setFatigue} descriptions={["Fresco","Cansado","Muy cansado","Agotado"]}/>
        </div>
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <Scale label="Feeling con la bola" icon="tennis" value={feelingBall} onChange={setFeelingBall} descriptions={["Muy malo","Regular","Bueno","Excelente"]}/>
      </Card>

      <Card style={{marginBottom:12}}>
        <Tag>CUMPLIMIENTO DE OBJETIVOS</Tag>
        <Scale label="Objetivos conseguidos hoy" icon="check" value={objAchieved} onChange={setObjAchieved} max={4} descriptions={["Ninguno","Alguno","Mayoria","Todos"]}/>
      </Card>

      <Card style={{marginBottom:12}}>
        <Tag>ESTADO EMOCIONAL</Tag>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {EMOTIONS.map(({k,l,icon})=>{
            const on=emotion===k;
            return <button key={k} onClick={()=>setEmotion(on?"":k)}
              style={{padding:"8px 4px",borderRadius:9,border:`1px solid ${on?C.gold:C.border}`,
                background:on?C.gold+"18":C.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <Icon name={icon} size={16} color={on?C.gold:C.muted}/>
              <span style={{fontSize:9,color:on?C.gold:C.muted,fontWeight:on?700:400,textAlign:"center"}}>{l}</span>
            </button>;
          })}
        </div>
      </Card>

      <Card style={{marginBottom:20}}>
        <Tag>NOTAS (opcional)</Tag>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Algo que quieras recordar de este partido..."
          rows={3} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,
            padding:"10px",color:C.white,fontSize:13,outline:"none",resize:"none",lineHeight:1.5}}/>
      </Card>

      <button onClick={handleSave} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
        background:`linear-gradient(135deg,${C.blue},${C.purple})`,color:C.white,fontSize:15,fontWeight:700,cursor:"pointer"}}>
        Guardar partido
      </button>
    </div>
  </div>;
}

// --- MATCH TYPE CHOOSER ---
function MatchTypeChooser({onChoose,onCancel}){
  return <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 24px"}}>
    <button onClick={onCancel} style={{position:"absolute",top:16,left:16,background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
      <Icon name="arrow" size={20} color={C.muted}/>
    </button>
    <div style={{textAlign:"center",marginBottom:32}}>
      <Icon name="tennis" size={40} color={C.green}/>
      <h2 style={{fontSize:22,fontWeight:700,marginTop:12,marginBottom:6}}>Nuevo Partido</h2>
      <p style={{fontSize:13,color:C.muted}}>Elige el tipo de registro</p>
    </div>
    <button onClick={()=>onChoose("live")}
      style={{padding:"20px 16px",borderRadius:14,border:`1px solid ${C.green}`,background:C.green+"12",
        cursor:"pointer",textAlign:"left",marginBottom:12,width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:C.green+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="live" size={22} color={C.green}/>
        </div>
        <div>
          <p style={{fontWeight:700,fontSize:15,color:C.green}}>Partido en directo</p>
          <p style={{fontSize:12,color:C.muted,marginTop:2}}>Registro completo a tiempo real durante el partido</p>
        </div>
      </div>
    </button>
    <button onClick={()=>onChoose("post")}
      style={{padding:"20px 16px",borderRadius:14,border:`1px solid ${C.blue}`,background:C.blue+"12",
        cursor:"pointer",textAlign:"left",width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:C.blue+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="replay" size={22} color={C.blue}/>
        </div>
        <div>
          <p style={{fontWeight:700,fontSize:15,color:C.blue}}>Registrar partido pasado</p>
          <p style={{fontSize:12,color:C.muted,marginTop:2}}>Stats resumidas y por sensaciones, sin tiempo real</p>
        </div>
      </div>
    </button>
  </div>;
}


// --- EVAL SELECTOR STEP ---
function EvalSelector({onConfirm,onBack,evalProfiles=[],onSaveProfile}){
  const ALL=[
    {id:"score",icon:"trophy",label:"Marcador",desc:"Puntuacion, golpes por punto"},
    {id:"serve",icon:"target",label:"Saque",desc:"1er y 2do saque, ACEs, dobles faltas"},
    {id:"winners",icon:"zap",label:"Winners",desc:"Winners FH y BH por tipo"},
    {id:"errors",icon:"x",label:"Errores",desc:"Errores no forzados FH y BH"},
    {id:"net",icon:"net",label:"Red y Decisiones",desc:"Approaches, puntos en red, tactica"},
    {id:"mental",icon:"brain",label:"Mental",desc:"Reset, feeling jugador, tecnica"},
    {id:"state",icon:"drop",label:"Estado fisico",desc:"Fatiga, SNS, hidratacion"},
    {id:"emotion",icon:"heart",label:"Emocional",desc:"Estado emocional percibido"},
  ];
  const[selected,setSelected]=useState(ALL.map(t=>t.id)); // all on by default
  const[saved,setSaved]=useState([]); // saved profiles
  const[profileName,setProfileName]=useState("");

  const toggle=id=>setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const selectAll=()=>setSelected(ALL.map(t=>t.id));
  const selectMin=()=>setSelected(["score","serve"]);

  return <div style={{height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
    <div style={{padding:"16px 14px 80px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
          <Icon name="arrow" size={20} color={C.muted}/>
        </button>
        <div>
          <h2 style={{fontSize:19,fontWeight:700,color:C.white}}>Que evaluar hoy?</h2>
          <p style={{fontSize:11,color:C.muted}}>Selecciona los bloques que quieres medir</p>
        </div>
      </div>

      {/* Saved profiles */}
      {evalProfiles.length>0&&<>
        <p style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,marginBottom:6}}>PERFILES GUARDADOS</p>
        <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
          {evalProfiles.map(p=>(
            <button key={p.id} onClick={()=>setSelected(p.tabs)}
              style={{flexShrink:0,padding:"6px 12px",borderRadius:8,fontSize:11,cursor:"pointer",
                border:"1px solid "+C.gold+"44",background:C.gold+"10",color:C.gold,fontWeight:600}}>
              {p.name}
            </button>
          ))}
        </div>
      </>}
      {/* Quick presets */}
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        <button onClick={selectAll} style={{flex:1,padding:"7px",borderRadius:8,fontSize:10,cursor:"pointer",
          border:"1px solid "+C.green,background:C.green+"12",color:C.green,fontWeight:600}}>
          Todo
        </button>
        <button onClick={selectMin} style={{flex:1,padding:"7px",borderRadius:8,fontSize:10,cursor:"pointer",
          border:"1px solid "+C.blue,background:C.blue+"12",color:C.blue,fontWeight:600}}>
          Solo saque
        </button>
        <button onClick={()=>setSelected(["score","winners","errors","net"])}
          style={{flex:1,padding:"7px",borderRadius:8,fontSize:10,cursor:"pointer",
            border:"1px solid "+C.purple,background:C.purple+"12",color:C.purple,fontWeight:600}}>
          Juego base
        </button>
      </div>
      {/* Save profile */}
      {selected.length>0&&onSaveProfile&&(
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <input id="profileNameInput" placeholder="Guardar como perfil..."
            style={{flex:1,background:C.bg,border:"1px solid "+C.border,borderRadius:8,
              padding:"7px 10px",color:C.white,fontSize:12,outline:"none"}}/>
          <button onClick={()=>{
            const inp=document.getElementById("profileNameInput");
            if(inp&&inp.value.trim()){
              onSaveProfile({id:"ep_"+Date.now(),name:inp.value.trim(),tabs:selected});
              inp.value="";
            }
          }} style={{padding:"7px 12px",borderRadius:8,border:"none",
            background:C.gold,color:C.bg,cursor:"pointer",fontWeight:700,fontSize:11}}>
            Guardar
          </button>
        </div>
      )}

      {/* Block selector */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {ALL.map(t=>{
          const on=selected.includes(t.id);
          return <button key={t.id} onClick={()=>toggle(t.id)}
            style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
              borderRadius:12,border:"1px solid "+(on?C.green:C.border),
              background:on?C.green+"0E":C.card,cursor:"pointer",textAlign:"left",
              transition:"all .15s"}}>
            <div style={{width:38,height:38,borderRadius:10,flexShrink:0,
              background:on?C.green+"22":C.bg,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name={t.icon} size={18} color={on?C.green:C.muted}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:on?700:500,color:on?C.white:C.mutedL}}>{t.label}</p>
              <p style={{fontSize:10,color:C.muted,marginTop:1}}>{t.desc}</p>
            </div>
            <div style={{width:22,height:22,borderRadius:11,border:"1.5px solid "+(on?C.green:C.border),
              background:on?C.green:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {on&&<Icon name="check" size={12} color={C.bg}/>}
            </div>
          </button>;
        })}
      </div>

      <p style={{fontSize:10,color:C.muted,textAlign:"center",marginBottom:16}}>
        {selected.length} de {ALL.length} bloques seleccionados
      </p>

      <button onClick={()=>onConfirm(selected)}
        disabled={selected.length===0}
        style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
          background:selected.length>0?"linear-gradient(135deg,"+C.green+","+C.greenD+")":C.border,
          color:selected.length>0?C.bg:C.muted,fontSize:15,fontWeight:700,
          cursor:selected.length>0?"pointer":"default"}}>
        Iniciar partido con {selected.length} bloque{selected.length!==1?"s":""}
      </button>
    </div>
  </div>;
}

// --- NEW MATCH SETUP ---
function NewMatchSetup({players,onStart,onCancel,matchType}){
  const[playerId,setPlayerId]=useState(players[0]?.id||"");
  const[rival,setRival]=useState("");
  const[surface,setSurface]=useState("Tierra");
  const[tournament,setTournament]=useState("");
  const[round,setRound]=useState("R32");
  const[hydEvery,setHydEvery]=useState(4);
  const SURFACES=["Tierra","Dura","Hierba","Indoor"];
  const ROUNDS=["R128","R64","R32","R16","QF","SF","F"];
  const isLive=matchType==="live";

  return <div style={{height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
    <div style={{padding:"16px 14px 80px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
          <Icon name="arrow" size={20} color={C.muted}/>
        </button>
        <div>
          <h2 style={{fontSize:19,fontWeight:700}}>{isLive?"Partido en directo":"Partido pasado"}</h2>
          <p style={{fontSize:11,color:C.muted}}>{isLive?"Configuracion previa al partido":"Datos del partido"}</p>
        </div>
      </div>
      <Card style={{marginBottom:12}}>
        <Tag>JUGADOR</Tag>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {players.map(p=>(
            <button key={p.id} onClick={()=>setPlayerId(p.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px",
                borderRadius:10,border:`1px solid ${playerId===p.id?C.green:C.border}`,
                background:playerId===p.id?C.green+"12":C.bg,cursor:"pointer",textAlign:"left"}}>
              <Avatar initials={p.avatar} size={30} color={isInj(p)?C.red:C.green}/>
              <div style={{flex:1}}>
                <p style={{fontWeight:600,fontSize:13,color:C.white}}>{p.name}</p>
                <p style={{fontSize:10,color:C.muted}}>{p.type} - {p.status}</p>
              </div>
              {playerId===p.id&&<Icon name="check" size={16} color={C.green}/>}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>RIVAL</Tag>
        <input value={rival} onChange={e=>setRival(e.target.value)} placeholder="Nombre del rival"
          style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,
            padding:"10px",color:C.white,fontSize:14,outline:"none"}}/>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>SUPERFICIE</Tag>
        <div style={{display:"flex",gap:6}}>
          {SURFACES.map(s=>(
            <button key={s} onClick={()=>setSurface(s)}
              style={{flex:1,padding:"9px 4px",borderRadius:8,
                border:`1px solid ${surface===s?C.gold:C.border}`,
                background:surface===s?C.gold+"18":C.bg,color:surface===s?C.gold:C.mutedL,
                cursor:"pointer",fontSize:11,fontWeight:surface===s?700:400}}>
              {s}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>TORNEO Y RONDA</Tag>
        <input value={tournament} onChange={e=>setTournament(e.target.value)} placeholder="Nombre del torneo (opcional)"
          style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,
            padding:"10px",color:C.white,fontSize:14,outline:"none",marginBottom:8}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {ROUNDS.map(r=>(
            <button key={r} onClick={()=>setRound(r)}
              style={{padding:"6px 10px",borderRadius:7,
                border:`1px solid ${round===r?C.blue:C.border}`,
                background:round===r?C.blue+"18":C.bg,color:round===r?C.blue:C.mutedL,
                cursor:"pointer",fontSize:11,fontWeight:round===r?700:400}}>
              {r}
            </button>
          ))}
        </div>
      </Card>
      {isLive&&<Card style={{marginBottom:20}}>
        <Tag>AVISO HIDRATACION</Tag>
        <div style={{display:"flex",gap:6}}>
          {[2,3,4,6].map(n=>(
            <button key={n} onClick={()=>setHydEvery(n)}
              style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${hydEvery===n?C.teal:C.border}`,
                background:hydEvery===n?C.teal+"18":C.bg,color:hydEvery===n?C.teal:C.mutedL,
                cursor:"pointer",fontSize:11,fontWeight:hydEvery===n?700:400}}>
              c/{n}j
            </button>
          ))}
        </div>
      </Card>}
      <button onClick={()=>{
        const player=players.find(p=>p.id===playerId);
        onStart({playerName:player?.name||"Jugador",rivalName:rival||"Rival",
          surface,tournament,round,hydEvery,playerId});
      }} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",
        background:isLive?`linear-gradient(135deg,${C.green},${C.greenD})`:`linear-gradient(135deg,${C.blue},${C.purple})`,
        color:C.white,fontSize:15,fontWeight:700,cursor:"pointer"}}>
        {isLive?"Iniciar partido":"Continuar"}
      </button>
    </div>
  </div>;
}

// --- MINI LINE CHART ---
function LineChart({data,color,height=56,unit=""}){
  if(!data||data.length<2)return null;
  const W=280,H=height;
  const mn=Math.min(...data),mx=Math.max(...data);
  const range=mx-mn||1;
  const pad=8;
  const xs=data.map((_,i)=>pad+(i/(data.length-1))*(W-pad*2));
  const ys=data.map(v=>H-pad-(v-mn)/range*(H-pad*2));
  const linePath="M"+xs.map((x,i)=>x+","+ys[i]).join("L");
  const areaPath="M"+xs[0]+","+H+"L"+xs.map((x,i)=>x+","+ys[i]).join("L")+"L"+xs[xs.length-1]+","+H+"Z";
  const gid="g"+color.replace("#","");
  return(
    <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height,display:"block"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={"url(#"+gid+")"}/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {xs.map((x,i)=>(
        <circle key={i} cx={x} cy={ys[i]} r={i===data.length-1?4:2.5}
          fill={i===data.length-1?color:"#0E1C28"} stroke={color} strokeWidth="1.5"/>
      ))}
      <text x={xs[0]} y={ys[0]-6} fill={color} fontSize="9" textAnchor="middle" opacity="0.7">{data[0]}{unit}</text>
      <text x={xs[xs.length-1]} y={ys[ys.length-1]-6} fill={color} fontSize="10" textAnchor="middle" fontWeight="700">{data[data.length-1]}{unit}</text>
    </svg>
  );
}

// --- HOME SCREEN ---
const HOME_METRICS=[
  {key:"serve1Pct",label:"1er Saque",unit:"%",color:"#00C46A"},
  {key:"winners",label:"Winners",unit:"",color:"#F0C040"},
  {key:"ue",label:"ENF",unit:"",color:"#E05050"},
  {key:"netPct",label:"Red",unit:"%",color:"#20A8A8"},
  {key:"decisionPct",label:"Decisiones",unit:"%",color:"#4A90D8"},
  {key:"ace",label:"ACEs",unit:"",color:"#8B6FE8"},
];

function HomeScreen({matches,players,tournaments,sessions,challenges,groups,isPlayerMode,myPlayerId,onExportPDF}){
  const _theme=useTheme(); // re-render on theme change
  const[selectedPlayer,setSelectedPlayer]=useState(players[0]?.id||null);
  const[showPicker,setShowPicker]=useState(false);
  const[activeMetric,setActiveMetric]=useState("serve1Pct");
  useEffect(()=>{if(isPlayerMode&&myPlayerId)setSelectedPlayer(myPlayerId);},[isPlayerMode,myPlayerId]);
  const[viewMode,setViewMode]=useState("partidos");
  const[selectedTournament,setSelectedTournament]=useState(null);

  const player=players.find(p=>p.id===selectedPlayer);
  const allPlayerMatches=matches.filter(m=>m.playerId===selectedPlayer);
  const playerMatches=allPlayerMatches.slice(0,8);
  const lastMatch=playerMatches[0];
  const lastSummary=lastMatch?getSummary(lastMatch.sets):null;

  useEffect(()=>{if(!player&&players.length>0)setSelectedPlayer(players[0].id);},[players]);

  const tournamentNames=[...new Set(allPlayerMatches.map(m=>m.tournament).filter(Boolean))];
  const tourneyMatches=selectedTournament?allPlayerMatches.filter(m=>m.tournament===selectedTournament):playerMatches;
  const displayMatches=viewMode==="torneo"?tourneyMatches:playerMatches;
  const chronoMatches=[...displayMatches].reverse();
  const metric=HOME_METRICS.find(m=>m.key===activeMetric)||HOME_METRICS[0];
  const chartData=chronoMatches.map(m=>getSummary(m.sets)[activeMetric]);

  // Win streak
  const winStreak=(()=>{
    let streak=0;
    for(const m of allPlayerMatches){
      if(m.result==="W")streak++;
      else break;
    }
    return streak;
  })();

  // Training stats for this player
  const playerSessions=(sessions||[]).filter(s=>
    (s.playerId===selectedPlayer)||
    (s.targetType==="group"&&(groups||[]).find(g=>g.id===s.groupId)?.playerIds?.includes(selectedPlayer))
  );
  const doneSessions=playerSessions.filter(s=>s.isDone||!s.isPlanned);
  const totalTrainingMin=doneSessions.reduce((a,s)=>a+(s.duration||0),0);
  const lastSession=doneSessions.sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const activeChallenges=(challenges||[]).filter(ch=>!ch.completed&&(
    ch.playerId===selectedPlayer||
    (ch.targetType==="group"&&(groups||[]).find(g=>g.id===ch.groupId)?.playerIds?.includes(selectedPlayer))
  ));

  const objEvolution=(obj)=>chronoMatches.map(m=>{
    const s=getSummary(m.sets);
    if(obj.stat==="serve1Pct")return s.serve1Pct;
    if(obj.stat==="netWonPct")return s.netPct;
    if(obj.stat==="ueCount")return s.ue;
    if(obj.stat==="winnerCount")return s.winners;
    if(obj.stat==="decisionPct")return s.decisionPct;
    return obj.current;
  });

  const tournamentStats=tournamentNames.map(t=>{
    const tms=allPlayerMatches.filter(m=>m.tournament===t);
    const wins=tms.filter(m=>m.result==="W").length;
    const sums=tms.map(m=>getSummary(m.sets));
    return{name:t,matches:tms.length,wins,
      serve1:Math.round(sums.reduce((a,s)=>a+s.serve1Pct,0)/Math.max(sums.length,1)),
      winners:Math.round(sums.reduce((a,s)=>a+s.winners,0)/Math.max(sums.length,1)),
      ue:Math.round(sums.reduce((a,s)=>a+s.ue,0)/Math.max(sums.length,1))};
  });

  return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
    {/* Player selector dropdown */}
    <div style={{marginBottom:14}}>
      <button onClick={()=>{if(!isPlayerMode)setShowPicker(s=>!s);}}
        style={{width:"100%",background:C.card,border:"1px solid "+(showPicker?C.green:C.border),
          borderRadius:12,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {player
            ?<><Avatar initials={player.avatar} size={30} color={isInj(player)?C.red:C.green}/>
                <div style={{textAlign:"left"}}>
                  <p style={{fontSize:13,fontWeight:700,color:C.white}}>{player.name}</p>
                  <p style={{fontSize:10,color:C.muted}}>{player.status} - {player.type}</p>
                </div></>
            :<p style={{fontSize:13,color:C.muted}}>Selecciona un atleta</p>}
        </div>
        <Icon name={showPicker?"x":"user"} size={14} color={C.muted}/>
      </button>
      {showPicker&&players.length>0&&(
        <div style={{background:C.card,border:"1px solid "+C.green,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
          {players.map(p=>(
            <button key={p.id} onClick={()=>{setSelectedPlayer(p.id);setShowPicker(false);setSelectedTournament(null);}}
              style={{width:"100%",padding:"10px 14px",border:"none",borderTop:"1px solid "+C.border,
                background:selectedPlayer===p.id?C.green+"12":C.card,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
              <Avatar initials={p.avatar} size={26} color={isInj(p)?C.red:C.green}/>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:600,color:selectedPlayer===p.id?C.green:C.white}}>{p.name}</p>
                <p style={{fontSize:10,color:C.muted}}>{p.status} - {p.winRate}% WR</p>
              </div>
              {selectedPlayer===p.id&&<Icon name="check" size={14} color={C.green}/>}
            </button>
          ))}
        </div>
      )}
    </div>

    {player&&<>
      {/* Banner */}
      <Card style={{marginBottom:12,background:isInj(player)?C.red+"0D":C.green+"07",
        border:"1px solid "+(isInj(player)?C.red+"44":C.green+"2A")}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Avatar initials={player.avatar} size={42} color={isInj(player)?C.red:C.green}/>
            <div>
              <p style={{fontWeight:700,fontSize:15,color:C.white}}>{player.name}</p>
              <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                <Pill color={isInj(player)?C.red:C.green} sm>{player.status}</Pill>
                <Pill color={C.muted} sm>{player.phase}</Pill>
                <Pill color={C.gold} sm>{player.type}</Pill>
              </div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <p className="mono" style={{fontSize:22,fontWeight:700,color:C.green}}>{player.winRate}%</p>
            <p style={{fontSize:9,color:C.muted}}>Win Rate</p>
            <p className="mono" style={{fontSize:11,color:C.muted,marginTop:1}}>
              {allPlayerMatches.filter(m=>m.result==="W").length}V - {allPlayerMatches.filter(m=>m.result==="L").length}D
            </p>
          </div>
        </div>
      </Card>

      {/* Objectives with line chart evolution */}
      {player.objectives.filter(o=>!o.done).length>0&&(
        <Card style={{marginBottom:12}}>
          <Tag>OBJETIVOS Y EVOLUCION</Tag>
          {player.objectives.filter(o=>!o.done).map((obj,oi)=>{
            const prog=clamp((obj.current/obj.target)*100,0,100);
            const col=prog>=80?C.green:prog>=50?C.gold:C.red;
            const evol=objEvolution(obj);
            const improving=evol.length>=2&&(obj.stat==="ueCount"?evol[evol.length-1]<=evol[evol.length-2]:evol[evol.length-1]>=evol[evol.length-2]);
            return <div key={obj.id} style={{marginBottom:oi<player.objectives.filter(o=>!o.done).length-1?16:0,
              paddingBottom:oi<player.objectives.filter(o=>!o.done).length-1?16:0,
              borderBottom:oi<player.objectives.filter(o=>!o.done).length-1?"1px solid "+C.border:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{flex:1,paddingRight:8}}>
                  <p style={{fontSize:13,fontWeight:600,color:C.white}}>{obj.label}</p>
                  {obj.deadline&&<p style={{fontSize:9,color:C.muted,marginTop:1}}>hasta {obj.deadline}</p>}
                </div>
                <div style={{textAlign:"right"}}>
                  <p className="mono" style={{fontSize:13,color:col,fontWeight:700}}>{obj.current}{obj.unit}/{obj.target}{obj.unit}</p>
                  {evol.length>=2&&<p style={{fontSize:9,color:improving?C.green:C.red,marginTop:1}}>
                    {improving?"mejorando ^":"bajando v"}
                  </p>}
                </div>
              </div>
              <Bar v={obj.current} max={obj.target} color={col} h={5}/>
              <p style={{fontSize:9,color:C.muted,marginTop:3}}>{Math.round(prog)}% completado</p>
              {evol.length>=2&&(
                <div style={{marginTop:8}}>
                  <LineChart data={evol} color={col} height={44} unit={obj.unit}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                    <span style={{fontSize:8,color:C.muted}}>Primer partido</span>
                    <span style={{fontSize:8,color:C.muted}}>Ultimo partido</span>
                  </div>
                </div>
              )}
            </div>;
          })}
        </Card>
      )}

      {/* Last match */}
      {lastMatch&&lastSummary&&(
        <Card style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <Tag>ULTIMO PARTIDO</Tag>
              <p style={{fontWeight:700,fontSize:14,color:C.white}}>{lastMatch.rival}</p>
              <p style={{fontSize:11,color:C.muted}}>{lastMatch.date} - {lastMatch.tournament} - {lastMatch.round}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <Pill color={lastMatch.result==="W"?C.green:C.red}>{lastMatch.result==="W"?"Victoria":"Derrota"}</Pill>
              <p className="mono" style={{fontSize:13,color:C.mutedL,marginTop:4}}>{lastMatch.score}</p>
              {lastMatch.isPost&&<div style={{marginTop:3}}><Pill color={C.blue} sm>post</Pill></div>}
              {onExportPDF&&<button onClick={()=>onExportPDF(lastMatch)}
                style={{marginTop:6,padding:"3px 8px",borderRadius:6,border:"1px solid "+C.purple+"44",
                  background:C.purple+"12",color:C.purple,cursor:"pointer",fontSize:10,fontWeight:600}}>
                PDF
              </button>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
            <StatBox label="1er Saque" value={lastSummary.serve1Pct+"%"} color={C.green}/>
            <StatBox label="Winners" value={lastSummary.winners} color={C.gold}/>
            <StatBox label="ENF" value={lastSummary.ue} color={C.red}/>
            <StatBox label="Red" value={lastSummary.netPct+"%"} color={C.teal}/>
            <StatBox label="Decisiones" value={lastSummary.decisionPct+"%"} color={C.blue}/>
            <StatBox label="ACEs" value={lastSummary.ace} color={C.purple}/>
          </div>
          {lastSummary.emotion&&<div style={{padding:"6px 10px",background:C.bg,borderRadius:8,
            border:"1px solid "+C.gold+"22",display:"flex",alignItems:"center",gap:8}}>
            <Icon name={EMOTIONS.find(e=>e.k===lastSummary.emotion)?.icon||"heart"} size={13} color={C.gold}/>
            <span style={{fontSize:11,color:C.mutedL}}>Estado: <b style={{color:C.gold}}>{EMOTIONS.find(e=>e.k===lastSummary.emotion)?.l||lastSummary.emotion}</b></span>
          </div>}
        </Card>
      )}

      {/* Evolution chart */}
      {playerMatches.length>1&&(
        <Card style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <Tag>EVOLUCION</Tag>
            <div style={{display:"flex",background:C.bg,borderRadius:8,padding:2,gap:2}}>
              {[["partidos","Partidos"],["torneo","Torneos"]].map(([k,l])=>(
                <button key={k} onClick={()=>{setViewMode(k);setSelectedTournament(null);}}
                  style={{padding:"4px 9px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,
                    fontWeight:viewMode===k?700:400,background:viewMode===k?C.card:"transparent",
                    color:viewMode===k?C.white:C.muted}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {viewMode==="torneo"&&tournamentNames.length>1&&(
            <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
              <button onClick={()=>setSelectedTournament(null)}
                style={{flexShrink:0,padding:"4px 9px",borderRadius:6,fontSize:10,cursor:"pointer",
                  border:"1px solid "+(!selectedTournament?C.green:C.border),
                  background:!selectedTournament?C.green+"18":C.bg,
                  color:!selectedTournament?C.green:C.muted,fontWeight:!selectedTournament?700:400}}>
                Todos
              </button>
              {tournamentNames.map(t=>(
                <button key={t} onClick={()=>setSelectedTournament(t)}
                  style={{flexShrink:0,padding:"4px 9px",borderRadius:6,fontSize:10,cursor:"pointer",
                    border:"1px solid "+(selectedTournament===t?C.blue:C.border),
                    background:selectedTournament===t?C.blue+"18":C.bg,
                    color:selectedTournament===t?C.blue:C.muted,fontWeight:selectedTournament===t?700:400}}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
            {HOME_METRICS.map(m=>(
              <button key={m.key} onClick={()=>setActiveMetric(m.key)}
                style={{flexShrink:0,padding:"5px 9px",borderRadius:7,fontSize:10,cursor:"pointer",
                  fontWeight:activeMetric===m.key?700:400,
                  border:"1px solid "+(activeMetric===m.key?m.color:C.border),
                  background:activeMetric===m.key?m.color+"18":C.bg,
                  color:activeMetric===m.key?m.color:C.muted}}>
                {m.label}
              </button>
            ))}
          </div>
          {chartData.length>=2?(
            <>
              <LineChart data={chartData} color={metric.color} height={72} unit={metric.unit}/>
              <div style={{display:"flex",marginTop:4}}>
                {chronoMatches.map((m)=>(
                  <div key={m.id} style={{flex:1,textAlign:"center"}}>
                    <p style={{fontSize:7,color:m.result==="W"?C.green:C.red,fontWeight:700}}>{m.result}</p>
                    <p style={{fontSize:7,color:C.muted}}>{m.rival.split(" ")[0].slice(0,5)}</p>
                  </div>
                ))}
              </div>
              {chartData.length>=2&&(()=>{
                const diff=chartData[chartData.length-1]-chartData[0];
                const improving=metric.key==="ue"?diff<0:diff>0;
                const pctChange=Math.abs(Math.round((diff/Math.max(chartData[0],1))*100));
                return <div style={{marginTop:10,padding:"6px 10px",background:C.bg,borderRadius:8,
                  display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:C.muted}}>Tendencia general</span>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <Icon name={improving?"zap":"drop"} size={12} color={improving?C.green:C.red}/>
                    <span style={{fontSize:12,fontWeight:700,color:improving?C.green:C.red}}>
                      {improving?"+":"-"}{pctChange}%
                    </span>
                  </div>
                </div>;
              })()}
            </>
          ):<p style={{fontSize:12,color:C.muted,textAlign:"center",padding:"12px 0"}}>Necesitas al menos 2 partidos</p>}
        </Card>
      )}

      {/* Tournament comparison -- side by side */}
      {tournamentStats.length>1&&(()=>{
        const[compareA,setCompareA]=useState(tournamentStats[0]?.name||"");
        const[compareB,setCompareB]=useState(tournamentStats[1]?.name||"");
        const tA=tournamentStats.find(t=>t.name===compareA);
        const tB=tournamentStats.find(t=>t.name===compareB);
        const METRICS=[
          {l:"W/D",a:tA?tA.wins+"V/"+(tA.matches-tA.wins)+"D":"--",b:tB?tB.wins+"V/"+(tB.matches-tB.wins)+"D":"--",betterA:tA&&tB&&tA.wins/tA.matches>tB.wins/tB.matches},
          {l:"1er Saque",a:(tA?.serve1||0)+"%",b:(tB?.serve1||0)+"%",betterA:tA&&tB&&tA.serve1>tB.serve1},
          {l:"Winners",a:tA?.winners||0,b:tB?.winners||0,betterA:tA&&tB&&tA.winners>tB.winners},
          {l:"ENF",a:tA?.ue||0,b:tB?.ue||0,betterA:tA&&tB&&tA.ue<tB.ue},
        ];
        return <Card style={{marginBottom:12}}>
          <Tag>COMPARATIVA TORNEOS</Tag>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            <select value={compareA} onChange={e=>setCompareA(e.target.value)}
              style={{flex:1,background:C.bg,border:"1px solid "+C.green,borderRadius:8,
                padding:"6px 8px",color:C.white,fontSize:11,outline:"none",colorScheme:"dark"}}>
              {tournamentStats.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <span style={{color:C.muted,fontSize:12,alignSelf:"center"}}>vs</span>
            <select value={compareB} onChange={e=>setCompareB(e.target.value)}
              style={{flex:1,background:C.bg,border:"1px solid "+C.blue,borderRadius:8,
                padding:"6px 8px",color:C.white,fontSize:11,outline:"none",colorScheme:"dark"}}>
              {tournamentStats.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          {METRICS.map(({l,a,b,betterA})=>(
            <div key={l} style={{display:"flex",alignItems:"center",padding:"7px 0",
              borderBottom:"1px solid "+C.border}}>
              <span className="mono" style={{minWidth:60,fontSize:13,fontWeight:700,
                color:betterA?C.green:C.red}}>{a}</span>
              <span style={{flex:1,fontSize:11,color:C.muted,textAlign:"center"}}>{l}</span>
              <span className="mono" style={{minWidth:60,fontSize:13,fontWeight:700,
                textAlign:"right",color:!betterA?C.green:C.red}}>{b}</span>
            </div>
          ))}
        </Card>;
      })()}

      {/* Emotional/fatigue timeline */}
      {playerMatches.length>0&&(
        <Card>
          <Tag>ESTADO POR PARTIDO</Tag>
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
            {[...playerMatches].reverse().map((m)=>{
              const s=getSummary(m.sets);
              const avgFat=s.fatigues.length?Math.round(s.fatigues.reduce((a,b)=>a+b,0)/s.fatigues.length):0;
              const emo=EMOTIONS.find(e=>e.k===s.emotion);
              return <div key={m.id} style={{flexShrink:0,background:C.bg,borderRadius:10,
                padding:"8px 5px",minWidth:64,textAlign:"center",
                border:"1px solid "+(m.result==="W"?C.green+"33":C.red+"33")}}>
                <Pill color={m.result==="W"?C.green:C.red} sm>{m.result==="W"?"V":"D"}</Pill>
                <p style={{fontSize:8,color:C.muted,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:56}}>{m.rival.split(" ")[0]}</p>
                {avgFat>0&&<div style={{marginTop:4,display:"flex",justifyContent:"center"}}>
                  <Icon name={avgFat<=1?"heart":avgFat===2?"clock":avgFat===3?"brain":"drop"} size={12} color={SC4[avgFat-1]}/>
                </div>}
                {emo&&<div style={{marginTop:3,display:"flex",justifyContent:"center"}}>
                  <Icon name={emo.icon} size={12} color={C.gold}/>
                </div>}
              </div>;
            })}
          </div>
        </Card>
      )}
    </>}
  </div>;
}
// --- CHAT SCREEN ---
const SURFACE_COLORS={"Tierra":C.orange,"Dura":C.blue,"Hierba":C.green,"Indoor":C.muted};

function ChatScreen({players,chats,onSendMessage,isPro,onUpgrade,matches,isPlayerMode}){
  const[activeChat,setActiveChat]=useState(null);
  const[msg,setMsg]=useState("");
  const[showAttach,setShowAttach]=useState(false);
  const messagesEndRef=useRef(null);
  const chat=chats.find(c=>c.id===activeChat);
  const player=chat?players.find(p=>p.id===chat.playerId):null;
  const playerMatches=player?matches.filter(m=>m.playerId===player.id):[];
  const lastMatch=playerMatches[0];

  useEffect(()=>{
    setTimeout(()=>messagesEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
  },[activeChat,chats]);

  const send=()=>{
    if(!msg.trim())return;
    onSendMessage(activeChat,msg.trim());
    setMsg("");
  };

  const sendStatSnippet=(match)=>{
    if(!match)return;
    const s=getSummary(match.sets);
    const txt="Stats "+match.date+" vs "+match.rival+": 1er saque "+s.serve1Pct+"%, "+s.winners+" winners, "+s.ue+" ENF, red "+s.netPct+"%. Resultado: "+match.result+".";
    onSendMessage(activeChat,txt);
    setShowAttach(false);
  };

  const sendObjSnippet=()=>{
    if(!player)return;
    const objs=player.objectives.filter(o=>!o.done);
    if(objs.length===0){onSendMessage(activeChat,"Sin objetivos activos actualmente.");setShowAttach(false);return;}
    const txt="Objetivos actuales: "+objs.map(o=>o.label+" ("+Math.round(o.current/o.target*100)+"%)").join(", ")+".";
    onSendMessage(activeChat,txt);
    setShowAttach(false);
  };

  // -- CONVERSATION VIEW --
  if(activeChat&&chat){
    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{background:C.card,borderBottom:"1px solid "+C.border,
        padding:"10px 14px",flexShrink:0,display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>{setActiveChat(null);setShowAttach(false);}}
          style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
          <Icon name="arrow" size={18} color={C.muted}/>
        </button>
        <Avatar initials={chat.avatar} size={34} color={C.blue}/>
        <div style={{flex:1}}>
          <p style={{fontWeight:700,fontSize:14,color:C.white}}>{chat.name}</p>
          {player&&<p style={{fontSize:9,color:isInj(player)?C.red:C.green}}>
            {player.status} - {player.type}
          </p>}
        </div>
        {player&&lastMatch&&(
          <div style={{textAlign:"right"}}>
            <Pill color={lastMatch.result==="W"?C.green:C.red} sm>
              {lastMatch.result==="W"?"V":"D"} {lastMatch.score}
            </Pill>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 14px"}}>
        {chat.messages.map((m,i)=>{
          const mine=m.from==="coach";
          const isStats=m.text.startsWith("Stats ");
          const isObj=m.text.startsWith("Objetivos ");
          return <div key={i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:8}}>
            {!mine&&<Avatar initials={chat.avatar} size={26} color={C.blue} style={{marginRight:6,flexShrink:0}}/>}
            <div style={{maxWidth:"78%"}}>
              <div style={{padding:"9px 12px",
                borderRadius:mine?"14px 14px 2px 14px":"14px 14px 14px 2px",
                background:isStats||isObj?C.green+"14":mine?C.green+"1E":C.card,
                border:"1px solid "+(isStats||isObj?C.green+"44":mine?C.green+"33":C.border)}}>
                {(isStats||isObj)&&(
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                    <Icon name={isStats?"trophy":"target"} size={11} color={C.green}/>
                    <span style={{fontSize:9,color:C.green,fontWeight:700,letterSpacing:.5}}>
                      {isStats?"STATS":"OBJETIVOS"}
                    </span>
                  </div>
                )}
                <p style={{fontSize:13,color:C.white,lineHeight:1.45}}>{m.text}</p>
                <div style={{display:"flex",alignItems:"center",justifyContent:mine?"flex-end":"flex-start",gap:4,marginTop:4}}>
                  <p style={{fontSize:9,color:C.muted}}>{m.time}</p>
                  {mine&&<Icon name="check" size={10} color={m.read?C.blue:C.muted}/>}
                </div>
              </div>
            </div>
          </div>;
        })}
        <div ref={messagesEndRef}/>
      </div>

      {/* Attach panel */}
      {showAttach&&(
        <div style={{background:C.cardL,borderTop:"1px solid "+C.border,padding:"10px 14px",flexShrink:0}}>
          <p style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>ADJUNTAR</p>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {playerMatches.slice(0,4).map(m=>{
              const s=getSummary(m.sets);
              return <button key={m.id} onClick={()=>sendStatSnippet(m)}
                style={{flexShrink:0,padding:"8px 10px",borderRadius:10,
                  border:"1px solid "+C.border,background:C.card,cursor:"pointer",textAlign:"left",minWidth:120}}>
                <div style={{display:"flex",gap:4,marginBottom:3}}>
                  <Pill color={m.result==="W"?C.green:C.red} sm>{m.result==="W"?"V":"D"}</Pill>
                  <span style={{fontSize:9,color:C.muted}}>{m.date}</span>
                </div>
                <p style={{fontSize:11,color:C.white,fontWeight:600}}>{m.rival}</p>
                <p style={{fontSize:9,color:C.muted,marginTop:2}}>{s.serve1Pct}% srv - {s.winners}w</p>
              </button>;
            })}
            <button onClick={sendObjSnippet}
              style={{flexShrink:0,padding:"8px 10px",borderRadius:10,
                border:"1px solid "+C.blue,background:C.blue+"12",cursor:"pointer",textAlign:"left",minWidth:100}}>
              <Icon name="target" size={14} color={C.blue}/>
              <p style={{fontSize:11,color:C.blue,fontWeight:600,marginTop:4}}>Objetivos</p>
              <p style={{fontSize:9,color:C.muted,marginTop:2}}>compartir progreso</p>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{padding:"8px 14px 10px",borderTop:"1px solid "+C.border,
        background:C.card,flexShrink:0,display:"flex",gap:8,alignItems:"flex-end"}}>
        <button onClick={()=>setShowAttach(a=>!a)}
          style={{width:36,height:36,borderRadius:10,border:"1px solid "+(showAttach?C.green:C.border),
            background:showAttach?C.green+"18":"none",color:showAttach?C.green:C.muted,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="trophy" size={16} color={showAttach?C.green:C.muted}/>
        </button>
        <input value={msg} onChange={e=>setMsg(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&msg.trim())send();}}
          placeholder="Escribe un mensaje..."
          style={{flex:1,background:C.bg,border:"1px solid "+C.border,borderRadius:18,
            padding:"9px 14px",color:C.white,fontSize:13,outline:"none",minHeight:36}}/>
        <button onClick={send}
          style={{width:36,height:36,borderRadius:18,border:"none",
            background:msg.trim()?C.green:C.border,
            cursor:msg.trim()?"pointer":"default",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            transition:"background .15s"}}>
          <Icon name="send" size={15} color={msg.trim()?C.bg:C.muted}/>
        </button>
      </div>
    </div>;
  }

  // -- CONVERSATION LIST --
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <div style={{overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:C.white}}>{isPlayerMode?"Mi entrenador":"Mensajes"}</h2>
        {!isPro&&<button onClick={onUpgrade}
          style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+C.gold+"44",
            background:C.gold+"12",color:C.gold,cursor:"pointer",fontSize:10,fontWeight:700}}>
          PRO para chatear
        </button>}
      </div>

      {chats.length===0&&(
        <div style={{textAlign:"center",padding:"40px 0"}}>
          <Icon name="chat" size={36} color={C.muted}/>
          <p style={{color:C.muted,fontSize:13,marginTop:12}}>No hay conversaciones</p>
          <p style={{color:C.muted,fontSize:11,marginTop:4}}>Se crean al registrar un atleta</p>
        </div>
      )}

      {(isPlayerMode?chats.slice(0,1):chats).map(ch=>{
        const last=ch.messages[ch.messages.length-1];
        const unread=ch.messages.filter(m=>m.from==="player"&&!m.read).length;
        const pl=players.find(p=>p.id===ch.playerId);
        const pm=pl?matches.filter(m=>m.playerId===pl.id):[];
        return <div key={ch.id} onClick={()=>{if(!isPro){onUpgrade();return;}setActiveChat(ch.id);}}
          style={{display:"flex",alignItems:"center",gap:10,padding:"12px",
            borderRadius:12,border:"1px solid "+(unread>0?C.blue+"44":C.border),
            background:unread>0?C.blue+"08":C.card,cursor:"pointer",marginBottom:8,
            transition:"all .15s"}}>
          <div style={{position:"relative"}}>
            <Avatar initials={ch.avatar} size={44} color={pl&&isInj(pl)?C.red:C.blue}/>
            {unread>0&&<div style={{position:"absolute",top:-2,right:-2,width:18,height:18,
              borderRadius:9,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",
              border:"2px solid "+C.bg}}>
              <span style={{fontSize:9,fontWeight:700,color:C.white}}>{unread}</span>
            </div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <p style={{fontWeight:unread>0?700:600,fontSize:14,color:C.white}}>{ch.name}</p>
              <p style={{fontSize:10,color:C.muted,flexShrink:0,marginLeft:8}}>{last?.time||""}</p>
            </div>
            <p style={{fontSize:12,color:unread>0?C.mutedL:C.muted,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {last?.from==="coach"?"Tu: ":""}{last?.text||""}
            </p>
            {pl&&pm.length>0&&(
              <div style={{display:"flex",gap:4,marginTop:4}}>
                <Pill color={pm[0].result==="W"?C.green:C.red} sm>
                  {pm[0].result==="W"?"V":"D"} {pm[0].score}
                </Pill>
                <Pill color={C.muted} sm>{pm.length} partidos</Pill>
              </div>
            )}
          </div>
          {!isPro&&<Icon name="trophy" size={14} color={C.gold}/>}
        </div>;
      })}

      {/* Group chat placeholder */}
      {isPro&&chats.length>0&&(
        <div style={{marginTop:8,padding:"11px 14px",borderRadius:12,
          border:"1px dashed "+C.border,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:44,height:44,borderRadius:22,background:C.purple+"18",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="user" size={20} color={C.purple}/>
          </div>
          <div>
            <p style={{fontSize:13,fontWeight:600,color:C.mutedL}}>Grupo de equipo</p>
            <p style={{fontSize:10,color:C.muted}}>Proxima version</p>
          </div>
        </div>
      )}
    </div>
  </div>;
}
// --- SEED TOURNAMENTS ---
const SEED_TOURNAMENTS=[
  {id:"t1",name:"Open Provincia",city:"Valencia",country:"Espana",type:"Provincial",surface:"Tierra",
   dateStart:"2026-06-07",dateEnd:"2026-06-13",playerId:"p1",roundStart:"R32",roundReached:"SF",color:"#F0C040",notes:""},
  {id:"t2",name:"Club Invitacional",city:"Barcelona",country:"Espana",type:"Club",surface:"Dura",
   dateStart:"2026-06-05",dateEnd:"2026-06-10",playerId:"p3",roundStart:"R16",roundReached:"SF",color:"#00C46A",notes:""},
  {id:"t3",name:"ITF J30 Murcia",city:"Murcia",country:"Espana",type:"ITF Junior",surface:"Tierra",
   dateStart:"2026-06-20",dateEnd:"2026-06-27",playerId:"p1",roundStart:"R32",roundReached:"",color:"#4A90D8",notes:"Primer ITF del ano"},
  {id:"t4",name:"Regional Open",city:"Malaga",country:"Espana",type:"Regional",surface:"Tierra",
   dateStart:"2026-06-22",dateEnd:"2026-06-28",playerId:"p3",roundStart:"QF",roundReached:"",color:"#20A8A8",notes:""},
  {id:"t5",name:"Nacional Sub-16",city:"Madrid",country:"Espana",type:"Nacional",surface:"Dura",
   dateStart:"2026-07-01",dateEnd:"2026-07-08",playerId:"p2",roundStart:"R16",roundReached:"",color:"#8B6FE8",notes:"Objetivo: llegar a QF"},
  {id:"t6",name:"Copa Primavera",city:"Alicante",country:"Espana",type:"Club",surface:"Hierba",
   dateStart:"2026-04-15",dateEnd:"2026-04-20",playerId:"p3",roundStart:"R32",roundReached:"QF",color:"#E87840",notes:""},
];

const TOURNAMENT_TYPES=["ATP","Challenger","ITF Junior","ITF Senior","Provincial","Regional","Nacional","Club","Benefico","Otro"];
const ROUNDS_ALL=["R128","R64","R32","R16","QF","SF","F","Campeon"];
const TYPE_COLORS={"ATP":"#F0C040","Challenger":"#E87840","ITF Junior":"#4A90D8","ITF Senior":"#6AAAF0",
  "Provincial":"#F0C040","Regional":"#20A8A8","Nacional":"#8B6FE8","Club":"#00C46A","Benefico":"#E05050","Otro":"#6A8A9A"};

// --- CALENDAR SCREEN ---
function CalendarScreen({players,matches,tournaments,onAddTournament,onEditTournament,onDeleteTournament,isPlayerMode,myPlayerId}){
  const _theme=useTheme(); // re-render on theme change
  const[view,setView]=useState("list"); // list|month|detail|new|edit
  const[selectedId,setSelectedId]=useState(null);
  const[filterPlayer,setFilterPlayer]=useState("all");
  const[viewMonth,setViewMonth]=useState(new Date(2026,5,1)); // June 2026
  const[confirmDelT,setConfirmDelT]=useState(false);
  const t=tournaments.find(x=>x.id===selectedId);

  // Form state
  const emptyForm={name:"",city:"",country:"Espana",type:"Provincial",surface:"Tierra",dateStart:"",dateEnd:"",
    playerId:players[0]?.id||"",roundStart:"R32",roundReached:"",color:"#00C46A",notes:""};
  const[form,setForm]=useState(emptyForm);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const today=new Date(2026,5,13); // June 13 2026
  const sorted=[...tournaments].sort((a,b)=>new Date(a.dateStart)-new Date(b.dateStart));
  const sortedFiltered=isPlayerMode?sorted.filter(t=>t.playerId===myPlayerId):sorted;
  const filtered=filterPlayer==="all"?sortedFiltered:sortedFiltered.filter(t=>t.playerId===filterPlayer);
  const upcoming=filtered.filter(t=>new Date(t.dateEnd)>=today);
  const past=filtered.filter(t=>new Date(t.dateEnd)<today);

  const playerFor=id=>players.find(p=>p.id===id);
  const matchesFor=id=>matches.filter(m=>m.tournament===tournaments.find(t=>t.id===id)?.name&&m.playerId===tournaments.find(t=>t.id===id)?.playerId);

  const isActive=t=>{
    const s=new Date(t.dateStart),e=new Date(t.dateEnd);
    return today>=s&&today<=e;
  };
  const isUpcoming=t=>new Date(t.dateStart)>today;
  const isPast=t=>new Date(t.dateEnd)<today;

  const daysUntil=t=>{
    const diff=new Date(t.dateStart)-today;
    const d=Math.ceil(diff/(1000*60*60*24));
    return d;
  };

  // Month view helpers
  const getDaysInMonth=(year,month)=>new Date(year,month+1,0).getDate();
  const getFirstDayOfMonth=(year,month)=>new Date(year,month,1).getDay();
  const monthTournaments=tournaments.filter(t=>{
    const s=new Date(t.dateStart),e=new Date(t.dateEnd);
    return(s.getMonth()===viewMonth.getMonth()&&s.getFullYear()===viewMonth.getFullYear())||
           (e.getMonth()===viewMonth.getMonth()&&e.getFullYear()===viewMonth.getFullYear());
  });
  const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS=["D","L","M","X","J","V","S"];

  const TournamentCard=({t,onClick})=>{
    const pl=playerFor(t.playerId);
    const active=isActive(t);
    const upcoming=isUpcoming(t);
    const days=daysUntil(t);
    return <Card style={{marginBottom:8,cursor:"pointer",borderLeft:"3px solid "+t.color,
      background:active?t.color+"0D":C.card}} onClick={onClick}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div style={{flex:1,paddingRight:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            {active&&<div style={{width:6,height:6,borderRadius:3,background:C.green,
              boxShadow:"0 0 6px "+C.green,flexShrink:0}}/>}
            <p style={{fontWeight:700,fontSize:13,color:C.white}}>{t.name}</p>
          </div>
          <p style={{fontSize:10,color:C.muted,display:"flex",alignItems:"center",gap:4}}>
            <Icon name="pin" size={9} color={C.muted}/> {t.city}, {t.country}
          </p>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <Pill color={t.color} sm>{t.type}</Pill>
          {active&&<p style={{fontSize:9,color:C.green,fontWeight:700,marginTop:3}}>EN CURSO</p>}
          {upcoming&&days<=7&&<p style={{fontSize:9,color:C.gold,fontWeight:700,marginTop:3}}>en {days}d</p>}
          {isPast(t)&&t.roundReached&&<p style={{fontSize:9,color:C.muted,marginTop:3}}>{t.roundReached}</p>}
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        {pl&&<div style={{display:"flex",alignItems:"center",gap:4}}>
          <Avatar initials={pl.avatar} size={16} color={isInj(pl)?C.red:C.green}/>
          <span style={{fontSize:10,color:C.mutedL}}>{pl.name}</span>
        </div>}
        <span style={{fontSize:10,color:C.muted}}>{t.dateStart} - {t.dateEnd}</span>
        {t.surface&&<Pill color={t.surface==="Tierra"?C.orange:t.surface==="Dura"?C.blue:t.surface==="Hierba"?C.green:C.muted} sm>{t.surface}</Pill>}
        <Pill color={C.muted} sm>{t.roundStart}</Pill>
      </div>
    </Card>;
  };

  // --- NEW/EDIT FORM ---
  if(view==="new"||view==="edit"){
    const isEdit=view==="edit";
    return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"16px 14px 80px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={()=>setView(isEdit?"detail":"list")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
          <Icon name="arrow" size={20} color={C.muted}/>
        </button>
        <h2 style={{fontSize:19,fontWeight:700,color:C.white}}>{isEdit?"Editar torneo":"Nuevo torneo"}</h2>
      </div>
      <Card style={{marginBottom:12}}>
        <Tag>DATOS DEL TORNEO</Tag>
        <div style={{marginBottom:10}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Nombre del torneo</p>
          <input value={form.name} onChange={e=>F("name",e.target.value)} placeholder="Ej: Open Provincia Valencia"
            style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
              padding:"10px",color:C.white,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Ciudad</p>
            <input value={form.city} onChange={e=>F("city",e.target.value)} placeholder="Valencia"
              style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                padding:"10px",color:C.white,fontSize:13,outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Pais</p>
            <input value={form.country} onChange={e=>F("country",e.target.value)} placeholder="Espana"
              style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                padding:"10px",color:C.white,fontSize:13,outline:"none"}}/>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:6}}>Tipo de torneo</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {TOURNAMENT_TYPES.map(tp=>(
              <button key={tp} onClick={()=>{F("type",tp);F("color",TYPE_COLORS[tp]||C.muted);}}
                style={{padding:"5px 10px",borderRadius:7,fontSize:11,cursor:"pointer",
                  border:"1px solid "+(form.type===tp?(TYPE_COLORS[tp]||C.green):C.border),
                  background:form.type===tp?(TYPE_COLORS[tp]||C.green)+"18":C.bg,
                  color:form.type===tp?(TYPE_COLORS[tp]||C.green):C.muted,
                  fontWeight:form.type===tp?700:400}}>
                {tp}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>SUPERFICIE</Tag>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Tierra","Dura","Hierba","Indoor"].map(s=>(
            <button key={s} onClick={()=>F("surface",s)}
              style={{padding:"7px 14px",borderRadius:8,fontSize:11,cursor:"pointer",
                border:"1px solid "+(form.surface===s?C.gold:C.border),
                background:form.surface===s?C.gold+"18":C.bg,
                color:form.surface===s?C.gold:C.muted,fontWeight:form.surface===s?700:400}}>
              {s}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>FECHAS</Tag>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Inicio</p>
            <input type="date" value={form.dateStart} onChange={e=>F("dateStart",e.target.value)}
              style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                padding:"10px",color:C.white,fontSize:13,outline:"none",colorScheme:"dark"}}/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Fin</p>
            <input type="date" value={form.dateEnd} onChange={e=>F("dateEnd",e.target.value)}
              style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                padding:"10px",color:C.white,fontSize:13,outline:"none",colorScheme:"dark"}}/>
          </div>
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>JUGADOR</Tag>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {players.map(pl=>(
            <button key={pl.id} onClick={()=>F("playerId",pl.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",
                borderRadius:10,border:"1px solid "+(form.playerId===pl.id?C.green:C.border),
                background:form.playerId===pl.id?C.green+"12":C.bg,cursor:"pointer",textAlign:"left"}}>
              <Avatar initials={pl.avatar} size={26} color={isInj(pl)?C.red:C.green}/>
              <span style={{fontSize:12,fontWeight:600,color:form.playerId===pl.id?C.green:C.white}}>{pl.name}</span>
              {form.playerId===pl.id&&<Icon name="check" size={13} color={C.green}/>}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Tag>RONDAS</Tag>
        <div style={{marginBottom:10}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:6}}>Fase de inicio</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {ROUNDS_ALL.slice(0,7).map(r=>(
              <button key={r} onClick={()=>F("roundStart",r)}
                style={{padding:"5px 10px",borderRadius:7,fontSize:11,cursor:"pointer",
                  border:"1px solid "+(form.roundStart===r?C.blue:C.border),
                  background:form.roundStart===r?C.blue+"18":C.bg,
                  color:form.roundStart===r?C.blue:C.muted,fontWeight:form.roundStart===r?700:400}}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{fontSize:11,color:C.muted,marginBottom:6}}>Fase alcanzada (si ya termino)</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <button onClick={()=>F("roundReached","")}
              style={{padding:"5px 10px",borderRadius:7,fontSize:11,cursor:"pointer",
                border:"1px solid "+(form.roundReached===""?C.border:C.border),
                background:C.bg,color:C.muted}}>
              Sin resultado
            </button>
            {ROUNDS_ALL.map(r=>(
              <button key={r} onClick={()=>F("roundReached",r)}
                style={{padding:"5px 10px",borderRadius:7,fontSize:11,cursor:"pointer",
                  border:"1px solid "+(form.roundReached===r?C.green:C.border),
                  background:form.roundReached===r?C.green+"18":C.bg,
                  color:form.roundReached===r?C.green:C.muted,fontWeight:form.roundReached===r?700:400}}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card style={{marginBottom:20}}>
        <Tag>NOTAS (opcional)</Tag>
        <textarea value={form.notes} onChange={e=>F("notes",e.target.value)}
          placeholder="Objetivos, contexto, condiciones..." rows={2}
          style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
            padding:"10px",color:C.white,fontSize:13,outline:"none",resize:"none"}}/>
      </Card>
      <button onClick={()=>{
        if(!form.name.trim()||!form.dateStart)return;
        const data={...form,id:isEdit?t.id:"t_"+Date.now()};
        if(isEdit)onEditTournament(data); else onAddTournament(data);
        setView(isEdit?"detail":"list");
      }} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
        background:"linear-gradient(135deg,"+C.green+","+C.greenD+")",
        color:C.bg,fontSize:15,fontWeight:700,cursor:"pointer"}}>
        {isEdit?"Guardar cambios":"Agregar torneo"}
      </button>
    </div>;
  }

  // --- DETAIL VIEW ---
  if(view==="detail"&&t){
    const pl=playerFor(t.playerId);
    const tm=matchesFor(t.id);
    const active=isActive(t);
    const days=daysUntil(t);
    return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={()=>{setView("list");setConfirmDelT(false);}} style={{display:"flex",alignItems:"center",gap:6,
          background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
          <Icon name="arrow" size={16} color={C.muted}/> Torneos
        </button>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setForm({...t});setView("edit");}}
            style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+C.border,
              background:"none",color:C.mutedL,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:4}}>
            <Icon name="edit" size={12} color={C.mutedL}/>
          </button>
          {!confirmDelT
            ?<button onClick={()=>setConfirmDelT(true)} style={{padding:"5px 10px",borderRadius:7,
                border:"1px solid "+C.red+"44",background:"none",color:C.red,cursor:"pointer",fontSize:12}}>
                <Icon name="trash" size={12} color={C.red}/>
              </button>
            :<button onClick={()=>{onDeleteTournament(t.id);setView("list");setConfirmDelT(false);}} style={{padding:"5px 10px",
                borderRadius:7,border:"none",background:C.red,color:C.white,cursor:"pointer",fontSize:12,fontWeight:700}}>
                Confirmar
              </button>}
        </div>
      </div>

      <Card style={{marginBottom:12,borderLeft:"4px solid "+t.color,background:active?t.color+"0D":C.card}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              {active&&<div style={{width:7,height:7,borderRadius:4,background:C.green,boxShadow:"0 0 6px "+C.green}}/>}
              <h2 style={{fontSize:17,fontWeight:700,color:C.white}}>{t.name}</h2>
            </div>
            <p style={{fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:4}}>
              <Icon name="pin" size={10} color={C.muted}/> {t.city}, {t.country}
            </p>
          </div>
          <Pill color={t.color}>{t.type}</Pill>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Inicio",t.dateStart],["Fin",t.dateEnd],
            ["Superficie",t.surface||"--"],["Fase inicio",t.roundStart],
            ["Fase alcanzada",t.roundReached||"En curso"],["",""]
          ].filter(([k])=>k).map(([k,v])=>(
            <div key={k} style={{background:C.bg,borderRadius:8,padding:"8px"}}>
              <p style={{fontSize:9,color:C.muted,marginBottom:2}}>{k}</p>
              <p style={{fontSize:12,fontWeight:600,color:C.white}}>{v}</p>
            </div>
          ))}
        </div>
        {active&&<div style={{marginTop:10,padding:"6px 10px",background:C.green+"12",borderRadius:8,
          border:"1px solid "+C.green+"33",textAlign:"center"}}>
          <p style={{fontSize:12,color:C.green,fontWeight:700}}>Torneo en curso ahora mismo</p>
        </div>}
        {isUpcoming(t)&&<div style={{marginTop:10,padding:"6px 10px",background:C.gold+"12",borderRadius:8,
          border:"1px solid "+C.gold+"33",textAlign:"center"}}>
          <p style={{fontSize:12,color:C.gold,fontWeight:700}}>Empieza en {days} dias</p>
        </div>}
      </Card>

      {pl&&<Card style={{marginBottom:12}}>
        <Tag>JUGADOR</Tag>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar initials={pl.avatar} size={36} color={isInj(pl)?C.red:C.green}/>
          <div>
            <p style={{fontWeight:600,fontSize:13,color:C.white}}>{pl.name}</p>
            <div style={{display:"flex",gap:4,marginTop:2}}>
              <Pill color={isInj(pl)?C.red:C.green} sm>{pl.status}</Pill>
              <Pill color={C.gold} sm>{pl.winRate}% WR</Pill>
            </div>
          </div>
        </div>
      </Card>}

      {t.notes&&<Card style={{marginBottom:12}}>
        <Tag>NOTAS</Tag>
        <p style={{fontSize:13,color:C.mutedL,lineHeight:1.5}}>{t.notes}</p>
      </Card>}

      <Card>
        <Tag>PARTIDOS EN ESTE TORNEO</Tag>
        {tm.length===0?<p style={{fontSize:12,color:C.muted,textAlign:"center",padding:"12px 0"}}>
          Sin partidos registrados en este torneo todavia
        </p>:tm.map(m=>{
          const s=getSummary(m.sets);
          return <div key={m.id} style={{padding:"8px 0",borderBottom:"1px solid "+C.border,
            display:"flex",alignItems:"center",gap:10}}>
            <Pill color={m.result==="W"?C.green:C.red} sm>{m.result==="W"?"V":"D"}</Pill>
            <div style={{flex:1}}>
              <p style={{fontSize:12,fontWeight:600,color:C.white}}>{m.rival}</p>
              <p style={{fontSize:9,color:C.muted}}>{m.date} - {m.round}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p className="mono" style={{fontSize:11,color:C.mutedL}}>{m.score}</p>
              <p style={{fontSize:9,color:C.muted}}>{s.serve1Pct}%srv {s.winners}w</p>
            </div>
          </div>;
        })}
      </Card>
    </div>;
  }

  // --- MONTH VIEW ---
  if(view==="month"){
    const year=viewMonth.getFullYear();
    const month=viewMonth.getMonth();
    const daysInMonth=getDaysInMonth(year,month);
    const firstDay=getFirstDayOfMonth(year,month);
    const cells=[];
    for(let i=0;i<firstDay;i++)cells.push(null);
    for(let d=1;d<=daysInMonth;d++)cells.push(d);
    const todayDay=today.getMonth()===month&&today.getFullYear()===year?today.getDate():null;

    const getTourneyForDay=(day)=>monthTournaments.filter(t=>{
      const s=new Date(t.dateStart),e=new Date(t.dateEnd);
      const cur=new Date(year,month,day);
      return cur>=s&&cur<=e;
    });

    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"12px 14px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>setViewMonth(new Date(year,month-1,1))}
            style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:"4px 8px",fontSize:18}}>
            {"<"}
          </button>
          <p style={{fontWeight:700,fontSize:15,color:C.white}}>{MONTHS[month]} {year}</p>
          <button onClick={()=>setViewMonth(new Date(year,month+1,1))}
            style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:"4px 8px",fontSize:18}}>
            {">"}
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
          {DAYS.map(d=><p key={d} style={{textAlign:"center",fontSize:9,color:C.muted,fontWeight:600,padding:"4px 0"}}>{d}</p>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:12}}>
          {cells.map((day,i)=>{
            if(!day)return <div key={"e"+i}/>;
            const dayTourneys=getTourneyForDay(day);
            const isToday=day===todayDay;
            return <div key={day} style={{minHeight:38,borderRadius:6,padding:"3px",
              background:isToday?C.green+"18":dayTourneys.length?C.card:"transparent",
              border:isToday?"1px solid "+C.green+"44":"1px solid transparent"}}>
              <p style={{textAlign:"center",fontSize:10,fontWeight:isToday?700:400,
                color:isToday?C.green:C.mutedL,marginBottom:2}}>{day}</p>
              {dayTourneys.slice(0,2).map(t=>(
                <div key={t.id} onClick={()=>{setSelectedId(t.id);setView("detail");}}
                  style={{height:4,borderRadius:2,background:t.color,marginBottom:1,cursor:"pointer"}}/>
              ))}
            </div>;
          })}
        </div>
      </div>
      {/* Tournament list below calendar */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 14px 24px"}}>
        <Tag>TORNEOS EN {MONTHS[month].toUpperCase()}</Tag>
        {monthTournaments.length===0?<p style={{color:C.muted,fontSize:12,textAlign:"center",padding:"16px 0"}}>Sin torneos este mes</p>
          :monthTournaments.map(t=><TournamentCard key={t.id} t={t} onClick={()=>{setSelectedId(t.id);setView("detail");}}/>)}
      </div>
    </div>;
  }

  // --- LIST VIEW ---
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    {/* Toolbar */}
    <div style={{padding:"10px 14px",flexShrink:0}}>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        <div style={{display:"flex",background:C.card,borderRadius:9,padding:2,flex:1}}>
          {[["list","Lista"],["month","Mes"]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)}
              style={{flex:1,padding:"6px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,
                fontWeight:view===k?700:400,background:view===k?C.bg:"transparent",
                color:view===k?C.white:C.muted}}>
              {l}
            </button>
          ))}
        </div>
        {!isPlayerMode&&<button onClick={()=>{setForm(emptyForm);setView("new");}}
          style={{padding:"6px 14px",borderRadius:9,border:"none",background:C.green,
            color:C.bg,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:5}}>
          <Icon name="plus" size={14} color={C.bg}/> Torneo
        </button>}
      </div>
      {/* Player filter */}
      {!isPlayerMode&&<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
        <button onClick={()=>setFilterPlayer("all")}
          style={{flexShrink:0,padding:"4px 10px",borderRadius:7,fontSize:10,cursor:"pointer",
            border:"1px solid "+(filterPlayer==="all"?C.green:C.border),
            background:filterPlayer==="all"?C.green+"18":C.bg,
            color:filterPlayer==="all"?C.green:C.muted,fontWeight:filterPlayer==="all"?700:400}}>
          Todos
        </button>
        {players.map(pl=>(
          <button key={pl.id} onClick={()=>setFilterPlayer(filterPlayer===pl.id?"all":pl.id)}
            style={{flexShrink:0,padding:"4px 10px",borderRadius:7,fontSize:10,cursor:"pointer",
              border:"1px solid "+(filterPlayer===pl.id?C.blue:C.border),
              background:filterPlayer===pl.id?C.blue+"18":C.bg,
              color:filterPlayer===pl.id?C.blue:C.muted,fontWeight:filterPlayer===pl.id?700:400}}>
            {pl.name.split(" ")[0]}
          </button>
        ))}
      </div>}
    </div>

    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 14px 24px"}}>
      {upcoming.length>0&&<>
        <Tag>PROXIMOS ({upcoming.length})</Tag>
        {upcoming.map(t=><TournamentCard key={t.id} t={t} onClick={()=>{setSelectedId(t.id);setView("detail");}}/>)}
      </>}
      {past.length>0&&<>
        <div style={{height:1,background:C.border,margin:"12px 0 10px"}}/>
        <Tag>ANTERIORES ({past.length})</Tag>
        {past.map(t=><TournamentCard key={t.id} t={t} onClick={()=>{setSelectedId(t.id);setView("detail");}}/>)}
      </>}
      {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}>
        <Icon name="calendar" size={36} color={C.muted}/>
        <p style={{color:C.muted,fontSize:13,marginTop:12}}>Sin torneos registrados</p>
        <button onClick={()=>{setForm(emptyForm);setView("new");}}
          style={{marginTop:12,padding:"9px 20px",borderRadius:9,border:"1px solid "+C.green,
            background:C.green+"12",color:C.green,cursor:"pointer",fontWeight:600,fontSize:13}}>
          Agregar primero
        </button>
      </div>}
    </div>
  </div>;
}
// --- ATHLETE FORM ---
function NewAthleteForm({onSave,onCancel,initial}){
  const today=new Date().toISOString().slice(0,7);
  const[form,setForm]=useState(initial||{name:"",age:"",hand:"Diestro",backhand:"2 manos",racket:"",hoursWeek:"",yearsPlaying:"",type:"Competicion",status:"Activo",phase:"Competicion",weight:"",height:"",winRate:"50"});
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));
  const initials=(form.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const valid=form.name.trim().length>1;
  return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"16px 14px 80px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
        <Icon name="arrow" size={20} color={C.muted}/>
      </button>
      <h2 style={{fontSize:19,fontWeight:700,color:C.white}}>{initial?"Editar atleta":"Nuevo atleta"}</h2>
    </div>
    <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
      <Avatar initials={initials||"?"} size={64} color={isInj(form)?C.red:C.green}/>
    </div>
    <Card style={{marginBottom:12}}>
      <Tag>DATOS PERSONALES</Tag>
      <Inp label="Nombre completo" value={form.name} onChange={v=>F("name",v)} placeholder="Ej: Carlos Garcia"/>
      <div style={{display:"flex",gap:10}}>
        <Inp label="Edad" value={form.age} onChange={v=>F("age",v)} placeholder="16" type="number" half/>
        <Inp label="Peso (kg)" value={form.weight} onChange={v=>F("weight",v)} placeholder="68" type="number" half/>
        <Inp label="Altura (cm)" value={form.height} onChange={v=>F("height",v)} placeholder="178" type="number" half/>
      </div>
      <Inp label="Win Rate (%)" value={form.winRate} onChange={v=>F("winRate",v)} placeholder="50" type="number"/>
    </Card>
    <Card style={{marginBottom:12}}>
      <Tag>PERFIL TECNICO</Tag>
      <Chips label="Lateralidad" value={form.hand} onChange={v=>F("hand",v)} opts={["Diestro","Zurdo"]}/>
      <Chips label="Reves" value={form.backhand} onChange={v=>F("backhand",v)} opts={["1 mano","2 manos"]}/>
      <Inp label="Modelo de raqueta" value={form.racket} onChange={v=>F("racket",v)} placeholder="Ej: Babolat Pure Aero"/>
      <div style={{display:"flex",gap:10}}>
        <Inp label="Horas/semana" value={form.hoursWeek} onChange={v=>F("hoursWeek",v)} placeholder="10" type="number" half/>
        <Inp label="Anos jugando" value={form.yearsPlaying} onChange={v=>F("yearsPlaying",v)} placeholder="5" type="number" half/>
      </div>
    </Card>
    <Card style={{marginBottom:12}}>
      <Tag>TIPO Y ESTADO</Tag>
      <Chips label="Tipo" value={form.type} onChange={v=>F("type",v)} opts={["Competicion","Ocio"]}/>
      <Chips label="Estado" value={form.status} onChange={v=>F("status",v)} opts={["Activo","Lesionado","Lesionada"]}/>
      <Chips label="Fase" value={form.phase} onChange={v=>F("phase",v)} opts={["Competicion","Pretemporada","Vacaciones"]}/>
    </Card>
    <button onClick={()=>{
      if(!valid)return;
      const name=form.name.trim();
      const av=name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
      onSave({...form,id:initial?.id||"p_"+Date.now(),avatar:av,since:initial?.since||today,
        age:parseInt(form.age)||0,weight:parseFloat(form.weight)||0,height:parseFloat(form.height)||0,
        hoursWeek:parseFloat(form.hoursWeek)||0,yearsPlaying:parseInt(form.yearsPlaying)||0,
        winRate:parseInt(form.winRate)||50,objectives:initial?.objectives||[]});
    }} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
      background:valid?`linear-gradient(135deg,${C.green},${C.greenD})`:C.border,
      color:valid?C.bg:C.muted,fontSize:15,fontWeight:700,cursor:valid?"pointer":"default"}}>
      {initial?"Guardar cambios":"Registrar atleta"}
    </button>
  </div>;
}

// --- ADD OBJECTIVE FORM ---
function AddObjectiveForm({onSave,onCancel}){
  const STAT_OPTS=[{k:"serve1Pct",l:"% 1er Saque"},{k:"netWonPct",l:"% Puntos en red"},{k:"ueCount",l:"ENF por partido"},{k:"winnerCount",l:"Winners por partido"},{k:"decisionPct",l:"% Decisiones correctas"},{k:"custom",l:"Objetivo libre"}];
  const[stat,setStat]=useState("serve1Pct");
  const[label,setLabel]=useState("");
  const[target,setTarget]=useState("");
  const[current,setCurrent]=useState("");
  const[unit,setUnit]=useState("%");
  const[deadline,setDeadline]=useState("");
  const valid=label.trim()&&target&&current;
  return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"16px 14px 60px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
        <Icon name="arrow" size={20} color={C.muted}/>
      </button>
      <h2 style={{fontSize:19,fontWeight:700,color:C.white}}>Nuevo objetivo</h2>
    </div>
    <Card style={{marginBottom:12}}>
      <Tag>TIPO DE METRICA</Tag>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {STAT_OPTS.map(s=>(
          <button key={s.k} onClick={()=>setStat(s.k)}
            style={{padding:"10px 12px",borderRadius:9,textAlign:"left",cursor:"pointer",
              border:`1px solid ${stat===s.k?C.green:C.border}`,
              background:stat===s.k?C.green+"14":C.bg,
              color:stat===s.k?C.green:C.mutedL,fontWeight:stat===s.k?700:400,fontSize:13}}>
            {s.l}
          </button>
        ))}
      </div>
    </Card>
    <Card style={{marginBottom:12}}>
      <Tag>DETALLE</Tag>
      <Inp label="Descripcion" value={label} onChange={setLabel} placeholder="Ej: Subir 1er saque al 70%"/>
      <div style={{display:"flex",gap:8}}>
        <Inp label="Valor actual" value={current} onChange={setCurrent} placeholder="0" half/>
        <Inp label="Objetivo" value={target} onChange={setTarget} placeholder="0" half/>
        <Inp label="Unidad" value={unit} onChange={setUnit} placeholder="%" half/>
      </div>
      <div>
        <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Fecha limite (opcional)</p>
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
          style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,
            padding:"10px",color:C.white,fontSize:13,outline:"none",colorScheme:"dark"}}/>
      </div>
    </Card>
    <button onClick={()=>{if(!valid)return;onSave({id:"o_"+Date.now(),stat,label,target:parseFloat(target),current:parseFloat(current),unit,deadline,done:false});}}
      style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
        background:valid?`linear-gradient(135deg,${C.blue},${C.purple})`:C.border,
        color:valid?C.white:C.muted,fontSize:15,fontWeight:700,cursor:valid?"pointer":"default"}}>
      Guardar objetivo
    </button>
  </div>;
}

// --- PROFILE SCREEN ---
function ProfileScreen({players,onAddPlayer,onEditPlayer,onDeletePlayer,matches,groups,onSaveGroups,isPlayerMode,myPlayerId,sessions,challenges}){
  const _theme=useTheme(); // re-render on theme change
  const[view,setView]=useState("list"); // list|detail|new|edit|addObj|stats|settings
  const[selectedId,setSelectedId]=useState(null);
  const[confirmDelete,setConfirmDelete]=useState(false);
  const[compareId,setCompareId]=useState(null);
  const[coachName,setCoachName]=useState("Mi Entrenador");
  const[editingCoach,setEditingCoach]=useState(false);
  const p=players.find(x=>x.id===selectedId);
  const compareP=players.find(x=>x.id===compareId);

  if(view==="new") return <NewAthleteForm onSave={data=>{onAddPlayer(data);setView("list");}} onCancel={()=>setView("list")}/>;
  if(view==="edit"&&p) return <NewAthleteForm initial={p} onSave={data=>{onEditPlayer(data);setView("detail");}} onCancel={()=>setView("detail")}/>;
  if(view==="addObj"&&p) return <AddObjectiveForm onSave={obj=>{onEditPlayer({...p,objectives:[...p.objectives,obj]});setView("detail");}} onCancel={()=>setView("detail")}/>;

  // --- STATS VIEW ---
  if(view==="stats"&&p){
    const pm=matches.filter(m=>m.playerId===p.id);
    const allSets=pm.flatMap(m=>m.sets);
    const tot=f=>allSets.reduce((a,s)=>a+(s[f]||0),0);
    const wins=pm.filter(m=>m.result==="W").length;
    const totalW=tot("wFhSpace")+tot("wFhAngle")+tot("wFhSpecial")+tot("wFhPass")+tot("wBhSpace")+tot("wBhAngle")+tot("wBhSpecial")+tot("wBhPass");
    const totalE=tot("errFhNet")+tot("errFhOut")+tot("errBhNet")+tot("errBhOut");
    const s1in=tot("serve1In"),s1f=tot("serve1Fault");
    const na=tot("netApproach"),nw=tot("netWon");
    const dok=tot("decisionOk"),dkb=tot("decisionBad");
    const avgFeel=allSets.filter(s=>s.feelingBall>0);
    const avgFeelVal=avgFeel.length?((avgFeel.reduce((a,s)=>a+s.feelingBall,0))/avgFeel.length).toFixed(1):"--";
    const surfaces=[...new Set(pm.map(m=>m.surface))];

    // Compare player data if selected
    const pm2=compareP?matches.filter(m=>m.playerId===compareP.id):[];
    const allSets2=pm2.flatMap(m=>m.sets);
    const tot2=f=>allSets2.reduce((a,s)=>a+(s[f]||0),0);
    const wins2=pm2.filter(m=>m.result==="W").length;
    const totalW2=tot2("wFhSpace")+tot2("wFhAngle")+tot2("wFhSpecial")+tot2("wFhPass")+tot2("wBhSpace")+tot2("wBhAngle")+tot2("wBhSpecial")+tot2("wBhPass");
    const totalE2=tot2("errFhNet")+tot2("errFhOut")+tot2("errBhNet")+tot2("errBhOut");
    const s1in2=tot2("serve1In"),s1f2=tot2("serve1Fault");
    const na2=tot2("netApproach"),nw2=tot2("netWon");

    const CompRow=({label,v1,v2,unit="",higherIsBetter=true})=>{
      const better=higherIsBetter?v1>=v2:v1<=v2;
      return <div style={{display:"flex",alignItems:"center",padding:"7px 0",borderBottom:"1px solid "+C.border}}>
        <span className="mono" style={{minWidth:52,fontSize:13,fontWeight:700,
          color:compareP?(better?C.green:C.red):C.white}}>{v1}{unit}</span>
        <span style={{flex:1,fontSize:11,color:C.muted,textAlign:"center"}}>{label}</span>
        {compareP&&<span className="mono" style={{minWidth:52,fontSize:13,fontWeight:700,
          color:!better?C.green:C.red,textAlign:"right"}}>{v2}{unit}</span>}
      </div>;
    };

    return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={()=>setView("detail")} style={{display:"flex",alignItems:"center",gap:6,
          background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
          <Icon name="arrow" size={16} color={C.muted}/> Ficha
        </button>
        <p style={{fontSize:13,fontWeight:700,color:C.white}}>Stats globales</p>
        <div style={{width:60}}/>
      </div>

      {/* Header comparison */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:compareP?12:0}}>
          <Avatar initials={p.avatar} size={36} color={isInj(p)?C.red:C.green}/>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:14,color:C.white}}>{p.name}</p>
            <p style={{fontSize:10,color:C.muted}}>{pm.length} partidos registrados</p>
          </div>
          {compareP&&<>
            <div style={{width:1,height:36,background:C.border}}/>
            <div style={{flex:1,textAlign:"right"}}>
              <p style={{fontWeight:700,fontSize:14,color:C.blue}}>{compareP.name}</p>
              <p style={{fontSize:10,color:C.muted}}>{pm2.length} partidos</p>
            </div>
            <Avatar initials={compareP.avatar} size={36} color={C.blue}/>
          </>}
        </div>
        {/* Compare selector */}
        <div style={{marginTop:10}}>
          <p style={{fontSize:10,color:C.muted,marginBottom:6}}>Comparar con:</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <button onClick={()=>setCompareId(null)}
              style={{padding:"4px 10px",borderRadius:7,fontSize:10,cursor:"pointer",
                border:"1px solid "+(!compareId?C.green:C.border),
                background:!compareId?C.green+"18":C.bg,color:!compareId?C.green:C.muted,fontWeight:!compareId?700:400}}>
              Solo {p.name.split(" ")[0]}
            </button>
            {players.filter(x=>x.id!==p.id).map(x=>(
              <button key={x.id} onClick={()=>setCompareId(compareId===x.id?null:x.id)}
                style={{padding:"4px 10px",borderRadius:7,fontSize:10,cursor:"pointer",
                  border:"1px solid "+(compareId===x.id?C.blue:C.border),
                  background:compareId===x.id?C.blue+"18":C.bg,
                  color:compareId===x.id?C.blue:C.muted,fontWeight:compareId===x.id?700:400}}>
                {x.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {pm.length===0?<p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>
        Sin partidos registrados todavia
      </p>:<>
        <Card style={{marginBottom:12}}>
          <Tag>STATS MEDIAS GLOBALES</Tag>
          {compareP&&<div style={{display:"flex",marginBottom:8}}>
            <span style={{minWidth:52,fontSize:9,color:C.green,fontWeight:700}}>{p.name.split(" ")[0]}</span>
            <span style={{flex:1}}/>
            <span style={{minWidth:52,fontSize:9,color:C.blue,fontWeight:700,textAlign:"right"}}>{compareP.name.split(" ")[0]}</span>
          </div>}
          <CompRow label="Win Rate" v1={wins} v2={wins2} unit={"V/"+pm.length} higherIsBetter={true}/>
          <CompRow label="1er Saque %" v1={pct(s1in,s1in+s1f)} v2={pct(s1in2,s1in2+s1f2)} unit="%" higherIsBetter={true}/>
          <CompRow label="Winners / partido" v1={pm.length?Math.round(totalW/pm.length):0} v2={pm2.length?Math.round(totalW2/pm2.length):0} higherIsBetter={true}/>
          <CompRow label="ENF / partido" v1={pm.length?Math.round(totalE/pm.length):0} v2={pm2.length?Math.round(totalE2/pm2.length):0} higherIsBetter={false}/>
          <CompRow label="Efectividad red %" v1={pct(nw,na)} v2={pct(nw2,na2)} unit="%" higherIsBetter={true}/>
          <CompRow label="Decisiones %" v1={pct(dok,dok+dkb)} v2={pct(tot2("decisionOk"),tot2("decisionOk")+tot2("decisionBad"))} unit="%" higherIsBetter={true}/>
        </Card>

        {/* Match history */}
        <Card style={{marginBottom:12}}>
          <Tag>HISTORIAL DE PARTIDOS</Tag>
          {pm.length===0&&<p style={{color:C.muted,fontSize:12}}>Sin partidos</p>}
          {pm.map(m=>{
            const s=getSummary(m.sets);
            return <div key={m.id} style={{padding:"8px 0",borderBottom:"1px solid "+C.border,
              display:"flex",alignItems:"center",gap:10}}>
              <Pill color={m.result==="W"?C.green:C.red} sm>{m.result==="W"?"V":"D"}</Pill>
              <div style={{flex:1}}>
                <p style={{fontSize:12,fontWeight:600,color:C.white}}>{m.rival}</p>
                <p style={{fontSize:9,color:C.muted}}>{m.date} - {m.tournament} - {m.round}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p className="mono" style={{fontSize:11,color:C.mutedL}}>{m.score}</p>
                <div style={{display:"flex",gap:4,marginTop:2,justifyContent:"flex-end"}}>
                  <span style={{fontSize:9,color:C.green}}>{s.serve1Pct}%srv</span>
                  <span style={{fontSize:9,color:C.gold}}>{s.winners}w</span>
                  <span style={{fontSize:9,color:C.red}}>{s.ue}e</span>
                </div>
              </div>
            </div>;
          })}
        </Card>

        {/* Surface stats */}
        {surfaces.length>1&&<Card>
          <Tag>POR SUPERFICIE</Tag>
          {surfaces.map(surf=>{
            const sm=pm.filter(m=>m.surface===surf);
            const sw=sm.filter(m=>m.result==="W").length;
            const ss=sm.flatMap(m=>m.sets);
            const ss1in=ss.reduce((a,s)=>a+(s.serve1In||0),0);
            const ss1f=ss.reduce((a,s)=>a+(s.serve1Fault||0),0);
            return <div key={surf} style={{display:"flex",alignItems:"center",gap:10,
              padding:"8px 0",borderBottom:"1px solid "+C.border}}>
              <div style={{width:8,height:8,borderRadius:4,background:surf==="Tierra"?C.orange:surf==="Dura"?C.blue:surf==="Hierba"?C.green:C.muted,flexShrink:0}}/>
              <span style={{fontSize:12,color:C.white,minWidth:60,fontWeight:600}}>{surf}</span>
              <span style={{fontSize:11,color:C.muted}}>{sw}V/{sm.length-sw}D</span>
              <div style={{flex:1}}/>
              <span style={{fontSize:11,color:C.green}}>{pct(ss1in,ss1in+ss1f)}% srv</span>
            </div>;
          })}
        </Card>}
      </>}
    </div>;
  }

  // --- DETAIL VIEW ---
  if(view==="detail"&&p){
    const pm=matches.filter(m=>m.playerId===p.id);
    return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={()=>{setView("list");setConfirmDelete(false);}}
          style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
          <Icon name="arrow" size={16} color={C.muted}/> Atletas
        </button>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setView("stats")} style={{padding:"5px 10px",borderRadius:7,
            border:"1px solid "+C.teal,background:"none",color:C.teal,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:4}}>
            <Icon name="trophy" size={12} color={C.teal}/> Stats
          </button>
          <button onClick={()=>setView("edit")} style={{padding:"5px 10px",borderRadius:7,
            border:"1px solid "+C.border,background:"none",color:C.mutedL,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:4}}>
            <Icon name="edit" size={12} color={C.mutedL}/>
          </button>
          {!confirmDelete
            ?<button onClick={()=>setConfirmDelete(true)} style={{padding:"5px 10px",borderRadius:7,
                border:"1px solid "+C.red+"44",background:"none",color:C.red,cursor:"pointer",fontSize:12}}>
                <Icon name="trash" size={12} color={C.red}/>
              </button>
            :<button onClick={()=>{onDeletePlayer(p.id);setView("list");}} style={{padding:"5px 10px",borderRadius:7,
                border:"none",background:C.red,color:C.white,cursor:"pointer",fontSize:12,fontWeight:700}}>
                Confirmar
              </button>}
        </div>
      </div>

      {/* Player card */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <Avatar initials={p.avatar} size={54} color={isInj(p)?C.red:C.green}/>
          <div>
            <h2 style={{fontSize:17,fontWeight:700,color:C.white}}>{p.name}</h2>
            <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
              <Pill color={isInj(p)?C.red:C.green} sm>{p.status}</Pill>
              <Pill color={C.muted} sm>{p.phase}</Pill>
              <Pill color={C.gold} sm>{p.type}</Pill>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          {[["Edad",p.age+" anos"],["Lateralidad",p.hand],["Reves",p.backhand],
            ["Raqueta",p.racket||"--"],["Horas/sem",p.hoursWeek+"h"],["Jugando",p.yearsPlaying+" anos"],
            ["Peso",p.weight+"kg"],["Altura",p.height+"cm"],["Desde",p.since],["Win Rate",p.winRate+"%"]
          ].map(([k,v])=>(
            <div key={k} style={{background:C.bg,borderRadius:8,padding:"8px"}}>
              <p style={{fontSize:9,color:C.muted,marginBottom:2}}>{k}</p>
              <p style={{fontSize:12,fontWeight:600,color:C.white}}>{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick stats banner */}
      {pm.length>0&&<Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Tag>RESUMEN GLOBAL</Tag>
          <button onClick={()=>setView("stats")} style={{fontSize:11,color:C.teal,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>
            Ver todo >
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          <StatBox label="Partidos" value={pm.length} color={C.white}/>
          <StatBox label="Victorias" value={pm.filter(m=>m.result==="W").length} color={C.green}/>
          <StatBox label="Win Rate" value={p.winRate+"%"} color={C.gold}/>
          <StatBox label="Desde" value={p.since} color={C.muted}/>
        </div>
      </Card>}

      {/* Objectives */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <Tag>OBJETIVOS</Tag>
          <button onClick={()=>setView("addObj")} style={{padding:"4px 10px",borderRadius:7,
            border:"1px solid "+C.blue,background:"none",color:C.blue,cursor:"pointer",fontSize:11,fontWeight:600,marginBottom:8}}>
            + Anadir
          </button>
        </div>
        {p.objectives.length===0&&<div style={{textAlign:"center",padding:"12px 0"}}>
          <p style={{color:C.muted,fontSize:12,marginBottom:8}}>Sin objetivos</p>
          <button onClick={()=>setView("addObj")} style={{padding:"8px 16px",borderRadius:8,
            border:"1px solid "+C.blue,background:C.blue+"14",color:C.blue,cursor:"pointer",fontSize:12,fontWeight:600}}>
            Crear primer objetivo
          </button>
        </div>}
        {p.objectives.map((o,oi)=>{
          const prog=clamp((o.current/o.target)*100,0,100);
          const col=prog>=80?C.green:prog>=50?C.gold:C.red;
          return <div key={o.id} style={{marginBottom:14,paddingBottom:14,
            borderBottom:oi<p.objectives.length-1?"1px solid "+C.border:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600,flex:1,paddingRight:8,color:C.white}}>{o.label}</span>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <Pill color={col} sm>{Math.round(prog)}%</Pill>
                <button onClick={()=>{const up={...p,objectives:p.objectives.filter(x=>x.id!==o.id)};onEditPlayer(up);}}
                  style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:"2px",display:"flex"}}>
                  <Icon name="x" size={13} color={C.muted}/>
                </button>
              </div>
            </div>
            <Bar v={o.current} max={o.target} color={col} h={6}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:10,color:C.muted}}>Actual: {o.current}{o.unit}</span>
              <span style={{fontSize:10,color:col}}>Meta: {o.target}{o.unit}</span>
            </div>
            {o.deadline&&<p style={{fontSize:9,color:C.muted,marginTop:2}}>Hasta: {o.deadline}</p>}
          </div>;
        })}
      </Card>
    </div>;
  }

  // --- SETTINGS VIEW ---
  if(view==="settings"){
    const LINKS=[
      {label:"Politica de privacidad",icon:"arrow"},
      {label:"Terminos y condiciones",icon:"arrow"},
      {label:"Contacto y soporte",icon:"arrow"},
      {label:"Valorar la app",icon:"arrow"},
    ];
    return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={()=>setView("list")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
          <Icon name="arrow" size={20} color={C.muted}/>
        </button>
        <h2 style={{fontSize:19,fontWeight:700,color:C.white}}>Configuracion</h2>
      </div>

      {/* Coach profile */}
      <Card style={{marginBottom:12}}>
        <Tag>MI CUENTA</Tag>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:52,height:52,borderRadius:26,background:C.green+"22",border:"2px solid "+C.green+"44",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="user" size={24} color={C.green}/>
          </div>
          <div style={{flex:1}}>
            {editingCoach
              ?<input value={coachName} onChange={e=>setCoachName(e.target.value)}
                  onBlur={()=>setEditingCoach(false)} autoFocus
                  style={{background:C.bg,border:"1px solid "+C.green,borderRadius:8,padding:"6px 10px",
                    color:C.white,fontSize:14,fontWeight:600,outline:"none",width:"100%"}}/>
              :<p style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:2}}>{coachName}</p>}
            <p style={{fontSize:11,color:C.muted}}>Entrenador</p>
          </div>
          <button onClick={()=>setEditingCoach(true)} style={{background:"none",border:"none",cursor:"pointer"}}>
            <Icon name="edit" size={16} color={C.muted}/>
          </button>
        </div>
        <div style={{background:C.bg,borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontSize:11,color:C.muted}}>Plan actual</p>
            <p style={{fontSize:14,fontWeight:700,color:C.gold}}>BossiTennis PRO</p>
          </div>
          <Pill color={C.gold}>Activo</Pill>
        </div>
      </Card>

      {/* Plan limits */}
      <Card style={{marginBottom:12}}>
        <Tag>USO DEL PLAN</Tag>
        {[
          {label:"Atletas activos",used:players.length,max:20,color:C.green},
          {label:"Partidos este mes",used:6,max:999,color:C.blue},
          {label:"Exportaciones PDF",used:2,max:999,color:C.purple},
        ].map(({label,used,max,color})=>(
          <div key={label} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,color:C.white}}>{label}</span>
              <span className="mono" style={{fontSize:12,color,fontWeight:700}}>
                {used}{max<999?"/"+max:""}  {max<999&&used/max>0.8?"(limite proximo)":""}
              </span>
            </div>
            {max<999&&<Bar v={used} max={max} color={color} h={5}/>}
          </div>
        ))}
      </Card>

      {/* Preferences */}
      <Card style={{marginBottom:12}}>
        <Tag>PREFERENCIAS</Tag>
        {[["Idioma","Espanol"],["Zona horaria","Europe/Madrid"],["Hidratacion por defecto","c/4 juegos"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"9px 0",borderBottom:"1px solid "+C.border}}>
            <span style={{fontSize:13,color:C.white}}>{k}</span>
            <span style={{fontSize:12,color:C.muted}}>{v}</span>
          </div>
        ))}
      </Card>

      {/* Links */}
      <Card style={{marginBottom:12}}>
        <Tag>INFORMACION</Tag>
        {LINKS.map(({label,icon})=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 0",borderBottom:"1px solid "+C.border,cursor:"pointer"}}>
            <span style={{fontSize:13,color:C.white}}>{label}</span>
            <Icon name={icon} size={14} color={C.muted}/>
          </div>
        ))}
        <div style={{padding:"8px 0",textAlign:"center"}}>
          <p style={{fontSize:10,color:C.muted}}>BossiTennis v1.0.0 - Build 2026.06</p>
        </div>
      </Card>

      {/* Logout */}
      <button style={{width:"100%",padding:"13px",borderRadius:12,border:"1px solid "+C.red+"44",
        background:C.red+"0D",color:C.red,cursor:"pointer",fontWeight:600,fontSize:14,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Icon name="x" size={16} color={C.red}/> Cerrar sesion
      </button>
    </div>;
  }

  // --- LIST VIEW ---
  return <div style={{overflowY:"auto",height:"100%",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
    {/* Coach header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:C.white}}>Mi Perfil</h2>
        <p style={{fontSize:11,color:C.muted,marginTop:2}}>{coachName} - Entrenador</p>
      </div>
      <button onClick={()=>setView("settings")}
        style={{width:38,height:38,borderRadius:10,background:C.card,border:"1px solid "+C.border,
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="edit" size={16} color={C.muted}/>
      </button>
    </div>

    {/* Plan badge */}
    <div style={{background:C.gold+"0D",border:"1px solid "+C.gold+"33",borderRadius:12,
      padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Icon name="trophy" size={16} color={C.gold}/>
        <span style={{fontSize:13,fontWeight:700,color:C.gold}}>BossiTennis PRO</span>
      </div>
      <div style={{display:"flex",gap:10}}>
        <div style={{textAlign:"center"}}>
          <p className="mono" style={{fontSize:16,fontWeight:700,color:C.white}}>{players.length}</p>
          <p style={{fontSize:8,color:C.muted}}>atletas</p>
        </div>
        <div style={{textAlign:"center"}}>
          <p className="mono" style={{fontSize:16,fontWeight:700,color:C.white}}>{matches.length}</p>
          <p style={{fontSize:8,color:C.muted}}>partidos</p>
        </div>
      </div>
    </div>

    {/* Add athlete */}
    {!isPlayerMode&&<button onClick={()=>setView("new")}
      style={{width:"100%",padding:"13px",borderRadius:12,border:"1px dashed "+C.green,
        background:C.green+"08",color:C.green,cursor:"pointer",fontWeight:600,fontSize:14,
        marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      <Icon name="plus" size={16} color={C.green}/> Registrar nuevo atleta
    </button>}
    {isPlayerMode&&(groups||[]).filter(g=>g.playerIds&&g.playerIds.includes(myPlayerId)).map(g=>(
      <Card key={g.id} style={{marginBottom:10,borderLeft:"3px solid "+g.color}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:18,background:g.color+"22",
            border:"1px solid "+g.color+"44",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="user" size={16} color={g.color}/>
          </div>
          <div>
            <p style={{fontWeight:700,fontSize:13,color:C.white}}>{g.name}</p>
            <p style={{fontSize:10,color:C.muted}}>Grupo - {g.playerIds.length} jugadores</p>
            {g.description&&<p style={{fontSize:10,color:C.muted}}>{g.description}</p>}
          </div>
        </div>
      </Card>
    ))}

    {isPlayerMode&&(()=>{
      const myUpcoming=(sessions||[]).filter(s=>s.isPlanned&&!s.isDone&&(
        s.playerId===myPlayerId||
        (s.targetType==="group"&&(groups||[]).find(g=>g.id===s.groupId)?.playerIds?.includes(myPlayerId))
      )).sort((a,b)=>new Date(a.date)-new Date(b.date));
      const myActiveChallenges=(challenges||[]).filter(ch=>!ch.completed&&(
        ch.playerId===myPlayerId||
        (ch.targetType==="group"&&(groups||[]).find(g=>g.id===ch.groupId)?.playerIds?.includes(myPlayerId))
      ));
      const myDoneSessions=(sessions||[]).filter(s=>(s.isDone||!s.isPlanned)&&(
        s.playerId===myPlayerId||
        (s.targetType==="group"&&(groups||[]).find(g=>g.id===s.groupId)?.playerIds?.includes(myPlayerId))
      ));
      const myMatches=matches.filter(m=>m.playerId===myPlayerId);
      const myObjectives=(players.find(p=>p.id===myPlayerId)?.objectives||[]).filter(o=>!o.done);
      const today=new Date(2026,5,13);

      return <>
        {/* Proxima sesion destacada */}
        {myUpcoming[0]&&(()=>{
          const next=myUpcoming[0];
          const sType=SESSION_TYPES_MAP[next.type]||next.type;
          const days=Math.ceil((new Date(next.date)-today)/(1000*60*60*24));
          return <Card style={{marginBottom:12,background:C.purple+"0D",border:"1px solid "+C.purple+"33"}}>
            <Tag>PROXIMA SESION</Tag>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:C.white}}>{sType}</p>
                <p style={{fontSize:11,color:C.muted,marginTop:2}}>{next.date} - {next.duration}min</p>
              </div>
              <Pill color={days<=0?C.green:days<=2?C.gold:C.muted}>
                {days<=0?"Hoy":"en "+days+"d"}
              </Pill>
            </div>
            {next.goals&&<p style={{fontSize:11,color:C.mutedL,marginTop:8,fontStyle:"italic"}}>
              "{next.goals}"
            </p>}
          </Card>;
        })()}

        {/* Quick stats row */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 8px",
            border:"1px solid "+C.border,textAlign:"center"}}>
            <p className="mono" style={{fontSize:18,fontWeight:700,color:C.green}}>{myMatches.length}</p>
            <p style={{fontSize:9,color:C.muted}}>partidos</p>
          </div>
          <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 8px",
            border:"1px solid "+C.border,textAlign:"center"}}>
            <p className="mono" style={{fontSize:18,fontWeight:700,color:C.purple}}>{myDoneSessions.length}</p>
            <p style={{fontSize:9,color:C.muted}}>sesiones</p>
          </div>
          <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 8px",
            border:"1px solid "+C.border,textAlign:"center"}}>
            <p className="mono" style={{fontSize:18,fontWeight:700,color:C.gold}}>{myActiveChallenges.length}</p>
            <p style={{fontSize:9,color:C.muted}}>retos</p>
          </div>
          <div style={{flex:1,background:C.card,borderRadius:10,padding:"10px 8px",
            border:"1px solid "+C.border,textAlign:"center"}}>
            <p className="mono" style={{fontSize:18,fontWeight:700,color:C.blue}}>{myObjectives.length}</p>
            <p style={{fontSize:9,color:C.muted}}>objetivos</p>
          </div>
        </div>

        {/* Calendario de entrenamientos */}
        <Card style={{marginBottom:12}}>
          <Tag>MIS PROXIMOS ENTRENAMIENTOS</Tag>
          {myUpcoming.length===0&&<p style={{fontSize:12,color:C.muted,textAlign:"center",padding:"12px 0"}}>
            Sin entrenamientos planificados
          </p>}
          {myUpcoming.slice(0,5).map(s=>{
            const sType=SESSION_TYPES.find(t=>t.id===s.type);
            const days=Math.ceil((new Date(s.date)-today)/(1000*60*60*24));
            const isGroup=s.targetType==="group";
            const grp=isGroup?(groups||[]).find(g=>g.id===s.groupId):null;
            return <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,
              padding:"8px 0",borderBottom:"1px solid "+C.border}}>
              <div style={{width:8,height:8,borderRadius:4,background:sType?.color||C.purple,flexShrink:0}}/>
              <div style={{flex:1}}>
                <p style={{fontSize:12,fontWeight:600,color:C.white}}>{sType?.label||s.type}</p>
                <p style={{fontSize:9,color:C.muted}}>{s.date} - {s.duration}min{isGroup&&grp?" - "+grp.name:""}</p>
              </div>
              <Pill color={days<=0?C.green:days<=2?C.gold:C.muted} sm>
                {days<=0?"Hoy":"en "+days+"d"}
              </Pill>
            </div>;
          })}
        </Card>

        {/* Retos activos */}
        {myActiveChallenges.length>0&&<Card style={{marginBottom:12}}>
          <Tag>MIS RETOS ACTIVOS</Tag>
          {myActiveChallenges.slice(0,4).map(ch=>{
            const cat=CHALLENGE_CATS.find(c=>c.id===ch.category);
            const prog=ch.targetReps>0?Math.round((ch.bestHits/ch.targetReps)*100):0;
            return <div key={ch.id} style={{padding:"8px 0",borderBottom:"1px solid "+C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:600,color:C.white}}>{ch.name}</span>
                <span style={{fontSize:11,color:cat?.color||C.green,fontWeight:700}}>
                  {ch.bestHits}/{ch.targetReps}
                </span>
              </div>
              <Bar v={ch.bestHits} max={ch.targetReps} color={cat?.color||C.green} h={5}/>
            </div>;
          })}
        </Card>}

        {/* Objetivos de partido */}
        {myObjectives.length>0&&<Card style={{marginBottom:12}}>
          <Tag>MIS OBJETIVOS DE PARTIDO</Tag>
          {myObjectives.map(obj=>{
            const prog=clamp((obj.current/obj.target)*100,0,100);
            const col=prog>=80?C.green:prog>=50?C.gold:C.red;
            return <div key={obj.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600,color:C.white}}>{obj.label}</span>
                <span style={{fontSize:11,color:col,fontWeight:700}}>{Math.round(prog)}%</span>
              </div>
              <Bar v={obj.current} max={obj.target} color={col} h={5}/>
            </div>;
          })}
        </Card>}
      </>;
    })()}

    {!isPlayerMode&&<Tag>MIS ATLETAS ({players.length})</Tag>}
    {!isPlayerMode&&players.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}>
      <Icon name="user" size={36} color={C.muted}/>
      <p style={{color:C.muted,fontSize:13,marginTop:12}}>No tienes atletas todavia</p>
    </div>}
    {!isPlayerMode&&players.map(pl=>{
      const pm=matches.filter(m=>m.playerId===pl.id);
      return <Card key={pl.id} style={{marginBottom:8,cursor:"pointer"}}
        onClick={()=>{setSelectedId(pl.id);setView("detail");setConfirmDelete(false);setCompareId(null);}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar initials={pl.avatar} size={42} color={isInj(pl)?C.red:C.green}/>
          <div style={{flex:1}}>
            <p style={{fontWeight:600,fontSize:14,color:C.white}}>{pl.name}</p>
            <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
              <Pill color={isInj(pl)?C.red:C.green} sm>{pl.status}</Pill>
              <Pill color={C.muted} sm>{pl.type}</Pill>
              <Pill color={C.gold} sm>{pl.winRate}% WR</Pill>
              {pm.length>0&&<Pill color={C.teal} sm>{pm.length} partidos</Pill>}
              {pl.objectives.length>0&&<Pill color={C.blue} sm>{pl.objectives.length} obj.</Pill>}
            </div>
          </div>
          <Icon name="arrow" size={16} color={C.muted}/>
        </div>
      </Card>;
    })}

    {/* Settings shortcut */}
    <div style={{height:1,background:C.border,margin:"16px 0"}}/>
    <button onClick={()=>setView("settings")}
      style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid "+C.border,
        background:C.card,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
      <div style={{width:34,height:34,borderRadius:9,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="edit" size={16} color={C.muted}/>
      </div>
      <div>
        <p style={{fontSize:13,fontWeight:600,color:C.white}}>Configuracion</p>
        <p style={{fontSize:10,color:C.muted}}>Cuenta, plan, preferencias, privacidad</p>
      </div>
      <Icon name="arrow" size={14} color={C.muted} style={{marginLeft:"auto"}}/>
    </button>
  </div>;
}
// --- BOTTOM NAV ---


// --- WEEKLY PLAN TABLE ---
function WeeklyPlanTable({sessions,players,groups,onMarkDone,onDelete,onNewSession,isPlayerMode,myPlayerId}){
  const today = new Date(2026,5,13);
  const[weekOffset,setWeekOffset]=useState(0);

  // Get week start (Monday)
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()-today.getDay()+1+weekOffset*7);
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart);
    d.setDate(weekStart.getDate()+i);
    return d;
  });
  const DAY_LABELS=["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
  const fmt=d=>`${d.getDate()}/${d.getMonth()+1}`;
  const fmtISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const getSessionsForDay=(dateStr)=>sessions.filter(s=>
    s.isPlanned&&!s.isDone&&s.date===dateStr
  );

  const allPlanned=sessions.filter(s=>s.isPlanned&&!s.isDone);
  const thisWeekSessions=allPlanned.filter(s=>{
    const d=new Date(s.date);
    return d>=days[0]&&d<=days[6];
  });

  return <div style={{marginBottom:12}}>
    {/* Week navigation */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      marginBottom:10,padding:"0 2px"}}>
      <button onClick={()=>setWeekOffset(w=>w-1)}
        style={{background:"none",border:"1px solid "+C.border,borderRadius:7,
          padding:"5px 10px",color:C.muted,cursor:"pointer",fontSize:12}}>
        {"<"}
      </button>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:12,fontWeight:700,color:C.white}}>
          {fmt(days[0])} - {fmt(days[6])}
        </p>
        <p style={{fontSize:9,color:C.muted}}>{thisWeekSessions.length} sesiones planificadas</p>
      </div>
      <button onClick={()=>setWeekOffset(w=>w+1)}
        style={{background:"none",border:"1px solid "+C.border,borderRadius:7,
          padding:"5px 10px",color:C.muted,cursor:"pointer",fontSize:12}}>
        {">"}
      </button>
    </div>

    {/* Day columns */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
      {days.map((day,di)=>{
        const dateStr=fmtISO(day);
        const daySessions=getSessionsForDay(dateStr);
        const isToday=dateStr===fmtISO(today);
        const isPast=day<today;
        return <div key={di} style={{minHeight:80}}>
          {/* Day header */}
          <div style={{textAlign:"center",padding:"4px 2px",
            borderRadius:"6px 6px 0 0",marginBottom:3,
            background:isToday?C.green+"18":C.card,
            border:"1px solid "+(isToday?C.green:C.border)}}>
            <p style={{fontSize:9,fontWeight:700,color:isToday?C.green:C.muted}}>
              {DAY_LABELS[di]}
            </p>
            <p style={{fontSize:8,color:isToday?C.green:C.muted}}>{fmt(day)}</p>
          </div>
          {/* Sessions */}
          {daySessions.map(s=>{
            const sType=SESSION_TYPES.find(t=>t.id===s.type);
            const col=sType?.color||C.purple;
            const targetLabel=s.targetType==="group"
              ?(groups.find(g=>g.id===s.groupId)?.name||"Grupo").split(" ")[0]
              :(players.find(p=>p.id===s.playerId)?.name||"?").split(" ")[0];
            return <div key={s.id}
              style={{background:col+"15",border:"1px solid "+col+"44",borderRadius:5,
                padding:"4px 4px",marginBottom:3,cursor:"pointer",position:"relative"}}
              onClick={()=>{}}>
              <p style={{fontSize:8,fontWeight:700,color:col,lineHeight:1.2,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {sType?.label||s.type}
              </p>
              <p style={{fontSize:7,color:C.muted,lineHeight:1.2}}>{targetLabel}</p>
              <p style={{fontSize:7,color:C.muted}}>{s.duration}m</p>
              {!isPlayerMode&&<div style={{display:"flex",gap:2,marginTop:3}}>
                <button onClick={e=>{e.stopPropagation();onMarkDone(s.id);}}
                  style={{flex:1,padding:"2px",borderRadius:3,border:"none",
                    background:C.green+"22",color:C.green,cursor:"pointer",fontSize:7,fontWeight:700}}>
                  OK
                </button>
                <button onClick={e=>{e.stopPropagation();onDelete(s.id);}}
                  style={{padding:"2px 3px",borderRadius:3,border:"none",
                    background:C.red+"18",color:C.red,cursor:"pointer",fontSize:7}}>
                  x
                </button>
              </div>}
            </div>;
          })}
          {/* Add button */}
          {!isPlayerMode&&!isPast&&(
            <button onClick={()=>{onNewSession&&onNewSession(dateStr);}}
              style={{width:"100%",padding:"3px",borderRadius:5,border:"1px dashed "+C.border,
                background:"none",color:C.muted,cursor:"pointer",fontSize:10,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              +
            </button>
          )}
        </div>;
      })}
    </div>

    {/* Summary below */}
    {thisWeekSessions.length>0&&(
      <div style={{marginTop:8,padding:"8px 10px",background:C.card,borderRadius:8,
        border:"1px solid "+C.border}}>
        <p style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:.8,marginBottom:5}}>
          ESTA SEMANA
        </p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {players.filter(p=>thisWeekSessions.some(s=>s.playerId===p.id)).map(p=>{
            const ps=thisWeekSessions.filter(s=>s.playerId===p.id);
            const totalMin=ps.reduce((a,s)=>a+s.duration,0);
            return <div key={p.id} style={{display:"flex",alignItems:"center",gap:5}}>
              <Avatar initials={p.avatar} size={16} color={C.green}/>
              <span style={{fontSize:10,color:C.white}}>{p.name.split(" ")[0]}</span>
              <span style={{fontSize:10,color:C.muted}}>{ps.length} ses. / {totalMin}min</span>
            </div>;
          })}
          {groups.filter(g=>thisWeekSessions.some(s=>s.groupId===g.id)).map(g=>{
            const gs=thisWeekSessions.filter(s=>s.groupId===g.id);
            return <div key={g.id} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:16,height:16,borderRadius:8,background:g.color+"33",
                border:"1px solid "+g.color+"66"}}/>
              <span style={{fontSize:10,color:C.white}}>{g.name.split(" ")[0]}</span>
              <span style={{fontSize:10,color:C.muted}}>{gs.length} ses.</span>
            </div>;
          })}
        </div>
      </div>
    )}
  </div>;
}

// --- TRAINING SCREEN ---
const CHALLENGE_CATS=[
  {id:"serve",label:"Saque",icon:"target",color:"#00C46A"},
  {id:"rally",label:"Peloteo",icon:"replay",color:"#4A90D8"},
  {id:"net",label:"Red",icon:"net",color:"#20A8A8"},
  {id:"technical",label:"Tecnica",icon:"zap",color:"#8B6FE8"},
  {id:"physical",label:"Fisico",icon:"drop",color:"#E87840"},
  {id:"custom",label:"Libre",icon:"edit",color:"#F0C040"},
];
const SESSION_TYPES=[
  {id:"technical",label:"Tecnica",color:"#8B6FE8"},
  {id:"physical",label:"Fisico",color:"#E87840"},
  {id:"tactical",label:"Tactica",color:"#4A90D8"},
  {id:"match",label:"Partido entreno",color:"#00C46A"},
  {id:"serve",label:"Saque especifico",color:"#F0C040"},
  {id:"recovery",label:"Recuperacion",color:"#20A8A8"},
  {id:"group",label:"Clase grupal",color:"#E05050"},
  {id:"games",label:"Juegos",color:"#E05080"},
  {id:"custom",label:"Personalizado",color:"#6A8A9A"},
];
const INTENSITY=[
  {v:1,l:"Suave",col:"#20A8A8"},
  {v:2,l:"Moderada",col:"#4A90D8"},
  {v:3,l:"Alta",col:"#F0C040"},
  {v:4,l:"Maxima",col:"#E05050"},
];


// --- TARGET SELECTOR (top-level, stable identity to avoid input focus loss) ---
function TargetSel({form,setF,players,groups}){
  return <Card style={{marginBottom:10}}>
    <Tag>DESTINATARIO</Tag>
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      {[["player","Jugador individual",C.green],["group","Grupo / Clase",C.purple]].map(([k,l,col])=>(
        <button key={k} onClick={()=>setF("targetType",k)}
          style={{flex:1,padding:"8px",borderRadius:8,fontSize:12,cursor:"pointer",
            border:"1px solid "+(form.targetType===k?col:C.border),
            background:form.targetType===k?col+"18":C.bg,
            color:form.targetType===k?col:C.muted,fontWeight:form.targetType===k?700:400}}>
          {l}
        </button>
      ))}
    </div>
    {form.targetType==="player"?(
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {players.map(p=>(
          <button key={p.id} onClick={()=>setF("playerId",p.id)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
              borderRadius:9,border:"1px solid "+(form.playerId===p.id?C.green:C.border),
              background:form.playerId===p.id?C.green+"12":C.bg,cursor:"pointer",textAlign:"left"}}>
            <Avatar initials={p.avatar} size={22} color={isInj(p)?C.red:C.green}/>
            <span style={{fontSize:12,color:form.playerId===p.id?C.green:C.white,
              fontWeight:form.playerId===p.id?700:400}}>{p.name}</span>
            {form.playerId===p.id&&<Icon name="check" size={12} color={C.green}/>}
          </button>
        ))}
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {groups.length===0&&<p style={{fontSize:11,color:C.muted,textAlign:"center",padding:"8px 0"}}>
          Sin grupos creados. Ve a la pestana Grupos.
        </p>}
        {groups.map(g=>(
          <button key={g.id} onClick={()=>setF("groupId",g.id)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
              borderRadius:9,border:"1px solid "+(form.groupId===g.id?g.color:C.border),
              background:form.groupId===g.id?g.color+"12":C.bg,cursor:"pointer",textAlign:"left"}}>
            <div style={{width:22,height:22,borderRadius:11,background:g.color+"22",
              border:"1px solid "+g.color+"44",display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0}}>
              <Icon name="user" size={12} color={g.color}/>
            </div>
            <div style={{flex:1}}>
              <span style={{fontSize:12,color:form.groupId===g.id?g.color:C.white,
                fontWeight:form.groupId===g.id?700:400}}>{g.name}</span>
              <span style={{fontSize:10,color:C.muted,marginLeft:6}}>
                {g.playerIds.length} jugadores
              </span>
            </div>
            {form.groupId===g.id&&<Icon name="check" size={12} color={g.color}/>}
          </button>
        ))}
      </div>
    )}
  </Card>;
}

// --- SESSION FORM (top-level, stable identity to avoid input focus loss) ---
function SessionForm({isPlanned,onSave,onBack,form,setF,players,groups}){
  return <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 14px 80px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
        <Icon name="arrow" size={20} color={C.muted}/>
      </button>
      <h2 style={{fontSize:18,fontWeight:700,color:C.white}}>
        {isPlanned?"Planificar sesion":"Registrar sesion"}
      </h2>
    </div>
    <TargetSel form={form} setF={setF} players={players} groups={groups}/>
    <Card style={{marginBottom:10}}>
      <Tag>FECHA</Tag>
      <input type="date" value={form.date} onChange={e=>setF("date",e.target.value)}
        style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
          padding:"10px",color:C.white,fontSize:13,outline:"none",colorScheme:"dark"}}/>
    </Card>
    <Card style={{marginBottom:10}}>
      <Tag>TIPO DE SESION</Tag>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
        {SESSION_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setF("type",t.id)}
            style={{padding:"6px 11px",borderRadius:8,fontSize:11,cursor:"pointer",
              border:"1px solid "+(form.type===t.id?t.color:C.border),
              background:form.type===t.id?t.color+"18":C.bg,
              color:form.type===t.id?t.color:C.muted,fontWeight:form.type===t.id?700:400}}>
            {t.label}
          </button>
        ))}
      </div>
      {form.type==="custom"&&(
        <input value={form.customTypeName||""} onChange={e=>setF("customTypeName",e.target.value)}
          placeholder="Nombre del tipo de sesion (ej: Juegos, Tecnificacion...)"
          style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
            padding:"9px 12px",color:C.white,fontSize:12,outline:"none"}}/>
      )}
    </Card>
    <Card style={{marginBottom:10}}>
      <Tag>DURACION E INTENSIDAD</Tag>
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {[30,45,60,90,120].map(d=>(
          <button key={d} onClick={()=>setF("duration",d)}
            style={{flex:1,padding:"7px 2px",borderRadius:7,fontSize:10,cursor:"pointer",
              border:"1px solid "+(form.duration===d?C.blue:C.border),
              background:form.duration===d?C.blue+"18":C.bg,
              color:form.duration===d?C.blue:C.muted,fontWeight:form.duration===d?700:400}}>
            {d}m
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        {INTENSITY.map(iv=>(
          <button key={iv.v} onClick={()=>setF("intensity",iv.v)}
            style={{flex:1,padding:"8px 2px",borderRadius:8,fontSize:9,cursor:"pointer",
              border:"1px solid "+(form.intensity===iv.v?iv.col:C.border),
              background:form.intensity===iv.v?iv.col+"22":C.bg,
              color:form.intensity===iv.v?iv.col:C.muted,fontWeight:form.intensity===iv.v?700:400,
              display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
            <span style={{fontSize:13,fontWeight:700}}>{iv.v}</span>
            <span>{iv.l}</span>
          </button>
        ))}
      </div>
    </Card>
    <Card style={{marginBottom:10}}>
      <Tag>CONTENIDO</Tag>
      {[["warmup","Calentamiento","10min carrera suave + movilidad...",2],
        ["mainBlock","Bloque principal","Ejercicios, series, repeticiones...",3],
        ["goals","Objetivos de la sesion","Lo que quieres conseguir hoy...",2],
        ["notes",isPlanned?"Notas previas":"Notas y observaciones",isPlanned?"Preparacion, material...":"Como fue, que mejorar...",2]
      ].map(([k,l,ph,rows])=>(
        <div key={k} style={{marginBottom:8}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:4}}>{l}</p>
          <textarea value={form[k]} onChange={e=>setF(k,e.target.value)}
            placeholder={ph} rows={rows}
            style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
              padding:"10px",color:C.white,fontSize:12,outline:"none",resize:"none",lineHeight:1.5}}/>
        </div>
      ))}
    </Card>
    {!isPlanned&&<Card style={{marginBottom:14}}>
      <Tag>VALORACION</Tag>
      <div style={{display:"flex",gap:6}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>setF("rating",n)}
            style={{flex:1,padding:"10px 2px",borderRadius:8,
              border:"1px solid "+(form.rating>=n?C.gold:C.border),
              background:form.rating>=n?C.gold+"18":C.bg,cursor:"pointer",
              fontSize:18,textAlign:"center",color:form.rating>=n?C.gold:C.muted}}>
            {form.rating>=n?"*":"o"}
          </button>
        ))}
      </div>
    </Card>}
    <button onClick={()=>onSave()} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
      background:isPlanned?"linear-gradient(135deg,"+C.purple+","+C.blue+")":"linear-gradient(135deg,"+C.blue+","+C.teal+")",
      color:C.white,fontSize:15,fontWeight:700,cursor:"pointer"}}>
      {isPlanned?"Guardar plan":"Guardar sesion"}
    </button>
  </div>;
}

function TrainingScreen({players,challenges,onSaveChallenges,sessions,onSaveSessions,groups,onSaveGroups,isPlayerMode,myPlayerId}){
  const _theme=useTheme(); // re-render on theme change
  const[tab,setTab]=useState("challenges");
  const[selectedPlayer,setSelectedPlayer]=useState(isPlayerMode?myPlayerId:players[0]?.id||null);
  useEffect(()=>{if(isPlayerMode&&myPlayerId)setSelectedPlayer(myPlayerId);},[isPlayerMode,myPlayerId]);
  const[view,setView]=useState("list");
  const[activeChallenge,setActiveChallenge]=useState(null);
  const[selectedSession,setSelectedSession]=useState(null);
  const[attempts,setAttempts]=useState({hits:0,total:0});
  const[planView,setPlanView]=useState("list"); // list | table

  // Challenge form
  const[chForm,setChForm]=useState({
    name:"",category:"serve",targetReps:10,targetHits:8,
    description:"",playerId:"",groupId:"",targetType:"player",
  });

  // Session form
  const emptySession={
    date:new Date().toISOString().slice(0,10),
    targetType:"player",playerId:players[0]?.id||"",groupId:"",
    type:"technical",duration:60,intensity:2,
    warmup:"",mainBlock:"",notes:"",rating:0,
    isPlanned:false,isDone:false,goals:"",
  };
  const[sForm,setSForm]=useState({...emptySession});

  // Group form
  const[gForm,setGForm]=useState({name:"",playerIds:[],color:"#8B6FE8",description:""});
  const[showNewGroup,setShowNewGroup]=useState(false);
  const[selectedGroupId,setSelectedGroupId]=useState(null);
  const[editingGroup,setEditingGroup]=useState(false);

  const CF=(k,v)=>setChForm(p=>({...p,[k]:v}));
  const SF=(k,v)=>setSForm(p=>({...p,[k]:v}));

  const playerChallenges=challenges.filter(ch=>
    ch.playerId===selectedPlayer||
    (ch.groupId&&groups.find(g=>g.id===ch.groupId)?.playerIds?.includes(selectedPlayer))
  );

  const getTargetLabel=(s)=>{
    if(s.targetType==="group"){
      const g=groups.find(x=>x.id===s.groupId);
      return g?g.name:"Grupo";
    }
    const p=players.find(x=>x.id===s.playerId);
    return p?p.name:"Jugador";
  };

  const getTargetColor=(s)=>{
    if(s.targetType==="group"){
      const g=groups.find(x=>x.id===s.groupId);
      return g?.color||C.purple;
    }
    return C.green;
  };

  // Record attempt in active challenge
  const recordHit=(hit)=>{
    const newTotal=attempts.total+1;
    const newHits=hit?attempts.hits+1:attempts.hits;
    setAttempts({hits:newHits,total:newTotal});
    if(newTotal>=activeChallenge.targetReps){
      const success=newHits>=activeChallenge.targetHits;
      const updated=challenges.map(ch=>ch.id===activeChallenge.id?{
        ...ch,
        attempts:[...ch.attempts,{
          date:new Date().toISOString().slice(0,10),
          hits:newHits,total:newTotal,success,
        }],
        bestHits:Math.max(ch.bestHits||0,newHits),
        completed:ch.completed||success,
        completedDate:success&&!ch.completed?new Date().toISOString().slice(0,10):ch.completedDate,
      }:ch);
      onSaveChallenges(updated);
      if(success){
        // Show completion feedback
        setTimeout(()=>alert("Reto completado! " + activeChallenge.name),100);
      }
      setView("list");setActiveChallenge(null);setAttempts({hits:0,total:0});
    }
  };

  // -- TAB BAR --
  const TabBar=()=>(
    <div style={{display:"flex",background:C.card,borderBottom:"1px solid "+C.border,flexShrink:0}}>
      {[["challenges","zap","Retos"],["sessions","clock","Sesiones"],["planning","target","Planning"],...(isPlayerMode?[]:[["groups","user","Grupos"]])].map(([k,icon,l])=>{
        const on=tab===k;
        return <button key={k} onClick={()=>{setTab(k);setView("list");}}
          style={{flex:1,padding:"9px 2px",border:"none",background:"none",cursor:"pointer",
            color:on?C.green:C.muted,borderBottom:"2px solid "+(on?C.green:"transparent"),
            fontSize:9,fontWeight:on?700:400,display:"flex",flexDirection:"column",
            alignItems:"center",gap:2}}>
          <Icon name={icon} size={13} color={on?C.green:C.muted}/>
          <span>{l}</span>
        </button>;
      })}
    </div>
  );

  // -- PLAYER SELECTOR --
  const PlayerSel=()=>(
    isPlayerMode?null:
    <div style={{display:"flex",gap:5,padding:"8px 12px",overflowX:"auto",
      borderBottom:"1px solid "+C.border,flexShrink:0,alignItems:"center"}}>
      <span style={{fontSize:9,color:C.muted,flexShrink:0}}>Atleta:</span>
      {players.map(p=>(
        <button key={p.id} onClick={()=>setSelectedPlayer(p.id)}
          style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,
            padding:"4px 9px",borderRadius:14,cursor:"pointer",
            border:"1px solid "+(selectedPlayer===p.id?C.green:C.border),
            background:selectedPlayer===p.id?C.green+"12":C.card}}>
          <Avatar initials={p.avatar} size={16} color={isInj(p)?C.red:C.green}/>
          <span style={{fontSize:10,color:selectedPlayer===p.id?C.green:C.muted,
            fontWeight:selectedPlayer===p.id?700:400}}>{p.name.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );


  //  GROUPS TAB 
  if(tab==="groups"){
    const GROUP_COLORS=["#8B6FE8","#00C46A","#4A90D8","#E87840","#F0C040","#20A8A8","#E05050"];

    // Group detail/edit view
    if(view==="group_detail"&&selectedGroupId){
      const g=groups.find(x=>x.id===selectedGroupId);
      if(!g)return null;
      const gPlayers=players.filter(p=>g.playerIds.includes(p.id));
      const gSessions=sessions.filter(s=>s.groupId===g.id);
      const gChallenges=challenges.filter(ch=>ch.groupId===g.id);
      return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <TabBar/>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 14px 24px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <button onClick={()=>{setView("list");setSelectedGroupId(null);setEditingGroup(false);}}
              style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",
                color:C.muted,cursor:"pointer",fontSize:13}}>
              <Icon name="arrow" size={15} color={C.muted}/> Grupos
            </button>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>{
                setGForm({name:g.name,description:g.description||"",color:g.color,playerIds:[...g.playerIds]});
                setEditingGroup(true);
              }} style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+C.border,
                background:"none",color:C.mutedL,cursor:"pointer",fontSize:11,
                display:"flex",alignItems:"center",gap:4}}>
                <Icon name="edit" size={12} color={C.mutedL}/> Editar
              </button>
              <button onClick={()=>{onSaveGroups(groups.filter(x=>x.id!==g.id));setView("list");setSelectedGroupId(null);}}
                style={{background:"none",border:"none",cursor:"pointer"}}>
                <Icon name="trash" size={14} color={C.red}/>
              </button>
            </div>
          </div>

          {editingGroup?(
            <Card style={{marginBottom:12,border:"1px solid "+C.purple+"44"}}>
              <Tag>EDITAR GRUPO</Tag>
              <input value={gForm.name} onChange={e=>setGForm(p=>({...p,name:e.target.value}))}
                placeholder="Nombre del grupo"
                style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                  padding:"10px",color:C.white,fontSize:13,outline:"none",marginBottom:10}}/>
              <input value={gForm.description} onChange={e=>setGForm(p=>({...p,description:e.target.value}))}
                placeholder="Descripcion opcional"
                style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                  padding:"10px",color:C.white,fontSize:12,outline:"none",marginBottom:10}}/>
              <p style={{fontSize:11,color:C.muted,marginBottom:6}}>Color del grupo</p>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {GROUP_COLORS.map(col=>(
                  <button key={col} onClick={()=>setGForm(p=>({...p,color:col}))}
                    style={{width:28,height:28,borderRadius:14,background:col,cursor:"pointer",
                      border:gForm.color===col?"3px solid "+C.white:"2px solid transparent"}}/>
                ))}
              </div>
              <p style={{fontSize:11,color:C.muted,marginBottom:8}}>Integrantes</p>
              <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
                {players.map(p=>{
                  const inGroup=gForm.playerIds.includes(p.id);
                  return <button key={p.id} onClick={()=>setGForm(prev=>({...prev,
                    playerIds:inGroup?prev.playerIds.filter(x=>x!==p.id):[...prev.playerIds,p.id]
                  }))}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                      borderRadius:9,border:"1px solid "+(inGroup?gForm.color:C.border),
                      background:inGroup?gForm.color+"14":C.bg,cursor:"pointer",textAlign:"left"}}>
                    <Avatar initials={p.avatar} size={24} color={isInj(p)?C.red:C.green}/>
                    <span style={{fontSize:12,color:inGroup?gForm.color:C.white,flex:1,
                      fontWeight:inGroup?700:400}}>{p.name}</span>
                    {inGroup&&<Icon name="check" size={13} color={gForm.color}/>}
                  </button>;
                })}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setEditingGroup(false)}
                  style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid "+C.border,
                    background:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
                  Cancelar
                </button>
                <button onClick={()=>{
                  if(!gForm.name.trim()||gForm.playerIds.length===0)return;
                  onSaveGroups(groups.map(x=>x.id===g.id?{...x,...gForm}:x));
                  setEditingGroup(false);
                }} style={{flex:2,padding:"11px",borderRadius:10,border:"none",
                  background:"linear-gradient(135deg,"+C.purple+","+C.blue+")",
                  color:C.white,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  Guardar cambios
                </button>
              </div>
            </Card>
          ):(<>
            <Card style={{marginBottom:12,borderLeft:"3px solid "+g.color}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:44,height:44,borderRadius:22,background:g.color+"22",
                  border:"1px solid "+g.color+"44",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon name="user" size={20} color={g.color}/>
                </div>
                <div>
                  <p style={{fontWeight:700,fontSize:16,color:C.white}}>{g.name}</p>
                  {g.description&&<p style={{fontSize:11,color:C.muted,marginTop:2}}>{g.description}</p>}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <Pill color={g.color}>{g.playerIds.length} jugadores</Pill>
                <Pill color={C.blue} sm>{gSessions.length} sesiones</Pill>
                <Pill color={C.purple} sm>{gChallenges.length} retos</Pill>
              </div>
            </Card>

            <Card style={{marginBottom:12}}>
              <Tag>INTEGRANTES</Tag>
              {gPlayers.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,
                  padding:"7px 0",borderBottom:"1px solid "+C.border}}>
                  <Avatar initials={p.avatar} size={28} color={isInj(p)?C.red:C.green}/>
                  <div style={{flex:1}}>
                    <p style={{fontSize:12,fontWeight:600,color:C.white}}>{p.name}</p>
                    <p style={{fontSize:9,color:C.muted}}>{p.status} - {p.winRate}% WR</p>
                  </div>
                </div>
              ))}
            </Card>

            {gSessions.length>0&&<Card style={{marginBottom:12}}>
              <Tag>SESIONES DEL GRUPO</Tag>
              {gSessions.slice(0,5).map(s=>{
                const sType=SESSION_TYPES.find(t=>t.id===s.type);
                return <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,
                  padding:"6px 0",borderBottom:"1px solid "+C.border}}>
                  <div style={{width:6,height:6,borderRadius:3,background:sType?.color||C.purple}}/>
                  <span style={{fontSize:11,color:C.white,flex:1}}>{sType?.label||s.type}</span>
                  <span style={{fontSize:10,color:C.muted}}>{s.date}</span>
                </div>;
              })}
            </Card>}
          </>)}
        </div>
      </div>;
    }

    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 14px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <Tag>MIS GRUPOS ({groups.length})</Tag>
          <button onClick={()=>setShowNewGroup(g=>!g)}
            style={{padding:"5px 12px",borderRadius:8,border:"none",background:C.purple,
              color:C.white,cursor:"pointer",fontSize:12,fontWeight:700,marginBottom:8,
              display:"flex",alignItems:"center",gap:5}}>
            <Icon name="plus" size={13} color={C.white}/> {showNewGroup?"Cancelar":"Nuevo grupo"}
          </button>
        </div>

        {showNewGroup&&(
          <Card style={{marginBottom:12,border:"1px solid "+C.purple+"44"}} className="fadein">
            <Tag>NUEVO GRUPO</Tag>
            <input value={gForm.name} onChange={e=>setGForm(p=>({...p,name:e.target.value}))}
              placeholder="Nombre del grupo (ej: Grupo Avanzado Manana)"
              style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                padding:"10px",color:C.white,fontSize:13,outline:"none",marginBottom:10}}/>
            <input value={gForm.description} onChange={e=>setGForm(p=>({...p,description:e.target.value}))}
              placeholder="Descripcion opcional"
              style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
                padding:"10px",color:C.white,fontSize:12,outline:"none",marginBottom:10}}/>
            <p style={{fontSize:11,color:C.muted,marginBottom:6}}>Color del grupo</p>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {GROUP_COLORS.map(col=>(
                <button key={col} onClick={()=>setGForm(p=>({...p,color:col}))}
                  style={{width:28,height:28,borderRadius:14,background:col,cursor:"pointer",
                    border:gForm.color===col?"3px solid "+C.white:"2px solid transparent"}}/>
              ))}
            </div>
            <p style={{fontSize:11,color:C.muted,marginBottom:8}}>Seleccionar atletas</p>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
              {players.map(p=>{
                const inGroup=gForm.playerIds.includes(p.id);
                return <button key={p.id} onClick={()=>setGForm(prev=>({...prev,
                  playerIds:inGroup?prev.playerIds.filter(x=>x!==p.id):[...prev.playerIds,p.id]
                }))}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                    borderRadius:9,border:"1px solid "+(inGroup?gForm.color:C.border),
                    background:inGroup?gForm.color+"14":C.bg,cursor:"pointer",textAlign:"left"}}>
                  <Avatar initials={p.avatar} size={24} color={isInj(p)?C.red:C.green}/>
                  <span style={{fontSize:12,color:inGroup?gForm.color:C.white,flex:1,
                    fontWeight:inGroup?700:400}}>{p.name}</span>
                  {inGroup&&<Icon name="check" size={13} color={gForm.color}/>}
                </button>;
              })}
            </div>
            <button onClick={()=>{
              if(!gForm.name.trim()||gForm.playerIds.length===0)return;
              onSaveGroups([...groups,{id:"g_"+Date.now(),...gForm}]);
              setGForm({name:"",playerIds:[],color:"#8B6FE8",description:""});
              setShowNewGroup(false);
            }} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",
              background:"linear-gradient(135deg,"+C.purple+","+C.blue+")",
              color:C.white,fontSize:14,fontWeight:700,cursor:"pointer"}}>
              Crear grupo
            </button>
          </Card>
        )}

        {groups.length===0&&!showNewGroup&&(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <Icon name="user" size={36} color={C.muted}/>
            <p style={{color:C.muted,fontSize:13,marginTop:12}}>Sin grupos creados</p>
            <p style={{color:C.muted,fontSize:11,marginTop:4,lineHeight:1.5}}>
              Crea grupos para disenar sesiones colectivas y asignar retos a varios jugadores a la vez
            </p>
          </div>
        )}

        {groups.map(g=>{
          const gPlayers=players.filter(p=>g.playerIds.includes(p.id));
          const gSessions=sessions.filter(s=>s.groupId===g.id);
          return <Card key={g.id} style={{marginBottom:10,borderLeft:"3px solid "+g.color,cursor:"pointer"}}
            onClick={()=>{setSelectedGroupId(g.id);setView("group_detail");setEditingGroup(false);}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:C.white}}>{g.name}</p>
                {g.description&&<p style={{fontSize:10,color:C.muted,marginTop:2}}>{g.description}</p>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Pill color={g.color} sm>{g.playerIds.length} jugadores</Pill>
                <Icon name="arrow" size={13} color={C.muted}/>
              </div>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
              {gPlayers.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,
                  padding:"3px 8px",borderRadius:10,background:C.bg,
                  border:"1px solid "+C.border}}>
                  <Avatar initials={p.avatar} size={14} color={C.green}/>
                  <span style={{fontSize:10,color:C.mutedL}}>{p.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <Pill color={C.blue} sm>{gSessions.length} sesiones</Pill>
              <Pill color={C.purple} sm>{challenges.filter(ch=>ch.groupId===g.id).length} retos</Pill>
            </div>
          </Card>;
        })}
      </div>
    </div>;
  }

  //  CHALLENGES 
  if(tab==="challenges"){
    if(view==="active"&&activeChallenge){
      const pct_done=Math.round((attempts.total/activeChallenge.targetReps)*100);
      const col=attempts.hits/Math.max(attempts.total,1)>=activeChallenge.targetHits/activeChallenge.targetReps?C.green:C.orange;
      return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        <TabBar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <p style={{fontSize:12,color:C.muted,marginBottom:4}}>
            {activeChallenge.targetType==="group"
              ?groups.find(g=>g.id===activeChallenge.groupId)?.name||"Grupo"
              :players.find(p=>p.id===activeChallenge.playerId)?.name||"Jugador"}
          </p>
          <h2 style={{fontSize:17,fontWeight:700,color:C.white,textAlign:"center",marginBottom:4}}>
            {activeChallenge.name}
          </h2>
          {activeChallenge.description&&<p style={{fontSize:11,color:C.muted,marginBottom:20,textAlign:"center"}}>
            {activeChallenge.description}
          </p>}
          <div style={{position:"relative",width:156,height:156,marginBottom:24}}>
            <svg width={156} height={156} viewBox="0 0 156 156">
              <circle cx={78} cy={78} r={68} fill="none" stroke={C.border} strokeWidth={8}/>
              <circle cx={78} cy={78} r={68} fill="none" stroke={col} strokeWidth={8}
                strokeDasharray={427} strokeDashoffset={427*(1-pct_done/100)}
                strokeLinecap="round" transform="rotate(-90 78 78)"
                style={{transition:"stroke-dashoffset .3s ease"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center"}}>
              <p className="mono" style={{fontSize:34,fontWeight:700,color:col}}>{attempts.hits}</p>
              <p style={{fontSize:10,color:C.muted}}>de {activeChallenge.targetHits} aciertos</p>
              <p style={{fontSize:9,color:C.muted,marginTop:2}}>{attempts.total}/{activeChallenge.targetReps} intentos</p>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%",maxWidth:280}}>
            <button onClick={()=>recordHit(true)}
              style={{padding:"22px 10px",borderRadius:16,border:"none",
                background:"linear-gradient(135deg,"+C.green+","+C.greenD+")",
                color:C.bg,cursor:"pointer",fontWeight:700,fontSize:18,
                boxShadow:"0 4px 20px "+C.green+"44"}}>
              DENTRO
            </button>
            <button onClick={()=>recordHit(false)}
              style={{padding:"22px 10px",borderRadius:16,border:"1.5px solid "+C.red+"44",
                background:C.red+"12",color:C.red,cursor:"pointer",fontWeight:700,fontSize:18}}>
              FALLO
            </button>
          </div>
          <button onClick={()=>{setView("list");setActiveChallenge(null);setAttempts({hits:0,total:0});}}
            style={{marginTop:20,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>
            Cancelar
          </button>
        </div>
      </div>;
    }

    if(view==="new_challenge") return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 14px 80px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <button onClick={()=>setView("list")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
            <Icon name="arrow" size={20} color={C.muted}/>
          </button>
          <h2 style={{fontSize:18,fontWeight:700,color:C.white}}>Nuevo reto</h2>
        </div>
        <TargetSel form={chForm} setF={CF} players={players} groups={groups}/>
        <Card style={{marginBottom:10}}>
          <Tag>CATEGORIA</Tag>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {CHALLENGE_CATS.map(cat=>(
              <button key={cat.id} onClick={()=>CF("category",cat.id)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",
                  borderRadius:8,fontSize:11,cursor:"pointer",
                  border:"1px solid "+(chForm.category===cat.id?cat.color:C.border),
                  background:chForm.category===cat.id?cat.color+"18":C.bg,
                  color:chForm.category===cat.id?cat.color:C.muted,
                  fontWeight:chForm.category===cat.id?700:400}}>
                <Icon name={cat.icon} size={11} color={chForm.category===cat.id?cat.color:C.muted}/>
                {cat.label}
              </button>
            ))}
          </div>
        </Card>
        <Card style={{marginBottom:10}}>
          <Tag>NOMBRE Y DESCRIPCION</Tag>
          <input value={chForm.name} onChange={e=>CF("name",e.target.value)}
            placeholder="Ej: 8/10 primeros saques a la T"
            style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
              padding:"10px",color:C.white,fontSize:13,outline:"none",marginBottom:8}}/>
          <input value={chForm.description} onChange={e=>CF("description",e.target.value)}
            placeholder="Descripcion del reto (opcional)"
            style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:9,
              padding:"10px",color:C.white,fontSize:12,outline:"none"}}/>
        </Card>
        <Card style={{marginBottom:16}}>
          <Tag>OBJETIVO</Tag>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["targetReps","Total intentos",C.white],["targetHits","Aciertos necesarios",C.green]].map(([k,l,col])=>(
              <div key={k}>
                <p style={{fontSize:11,color:C.muted,marginBottom:5}}>{l}</p>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button onClick={()=>CF(k,Math.max(1,chForm[k]-1))}
                    style={{width:30,height:30,borderRadius:7,border:"1px solid "+C.border,
                      background:C.bg,color:C.white,cursor:"pointer",fontSize:16}}>-</button>
                  <span className="mono" style={{fontSize:22,fontWeight:700,color:col,
                    flex:1,textAlign:"center"}}>{chForm[k]}</span>
                  <button onClick={()=>CF(k,k==="targetHits"?Math.min(chForm.targetReps,chForm[k]+1):chForm[k]+1)}
                    style={{width:30,height:30,borderRadius:7,border:"1px solid "+C.green,
                      background:C.green+"18",color:C.green,cursor:"pointer",fontSize:16}}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"7px 12px",background:C.bg,borderRadius:8,textAlign:"center"}}>
            <span style={{fontSize:12,color:C.muted}}>Objetivo: </span>
            <span style={{fontSize:13,fontWeight:700,color:C.green}}>
              {chForm.targetHits}/{chForm.targetReps} ({Math.round(chForm.targetHits/Math.max(chForm.targetReps,1)*100)}%)
            </span>
          </div>
        </Card>
        <button onClick={()=>{
          if(!chForm.name.trim()) return;
          if(chForm.targetType==="player"&&!chForm.playerId) return;
          if(chForm.targetType==="group"&&!chForm.groupId) return;
          onSaveChallenges([...challenges,{
            id:"ch_"+Date.now(),...chForm,
            attempts:[],bestHits:0,completed:false,
            createdDate:new Date().toISOString().slice(0,10),completedDate:null,
          }]);
          setChForm({name:"",category:"serve",targetReps:10,targetHits:8,description:"",playerId:"",groupId:"",targetType:"player"});
          setView("list");
        }} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
          background:"linear-gradient(135deg,"+C.green+","+C.greenD+")",
          color:C.bg,fontSize:15,fontWeight:700,cursor:"pointer"}}>
          Crear reto
        </button>
      </div>
    </div>;

    const active_chs=challenges.filter(ch=>!ch.completed&&(
      ch.playerId===selectedPlayer||
      (ch.targetType==="group"&&groups.find(g=>g.id===ch.groupId)?.playerIds?.includes(selectedPlayer))
    ));
    const done_chs=challenges.filter(ch=>ch.completed&&(
      ch.playerId===selectedPlayer||
      (ch.targetType==="group"&&groups.find(g=>g.id===ch.groupId)?.playerIds?.includes(selectedPlayer))
    ));

    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/><PlayerSel/>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 14px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <Tag>RETOS ACTIVOS ({active_chs.length})</Tag>
          {!isPlayerMode&&<button onClick={()=>{setChForm(f=>({...f,playerId:selectedPlayer||"",targetType:"player"}));setView("new_challenge");}}
            style={{padding:"5px 12px",borderRadius:8,border:"none",background:C.green,
              color:C.bg,cursor:"pointer",fontSize:12,fontWeight:700,marginBottom:8,
              display:"flex",alignItems:"center",gap:5}}>
            <Icon name="plus" size={13} color={C.bg}/> Nuevo
          </button>}
        </div>
        {active_chs.length===0&&<div style={{textAlign:"center",padding:"20px 0",marginBottom:10}}>
          <Icon name="zap" size={28} color={C.muted}/>
          <p style={{color:C.muted,fontSize:12,marginTop:8}}>Sin retos activos para este jugador</p>
        </div>}
        {active_chs.map(ch=>{
          const cat=CHALLENGE_CATS.find(x=>x.id===ch.category);
          const bestPct=ch.targetReps>0?Math.round((ch.bestHits/ch.targetReps)*100):0;
          const targetPct=Math.round(ch.targetHits/ch.targetReps*100);
          const isGroup=ch.targetType==="group";
          const grp=isGroup?groups.find(g=>g.id===ch.groupId):null;
          return <Card key={ch.id} style={{marginBottom:8,borderLeft:"3px solid "+(cat?.color||C.green)}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1,paddingRight:8}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                  <Icon name={cat?.icon||"zap"} size={12} color={cat?.color||C.green}/>
                  <p style={{fontWeight:700,fontSize:13,color:C.white}}>{ch.name}</p>
                </div>
                {isGroup&&grp&&<Pill color={grp.color} sm>{grp.name}</Pill>}
                {ch.description&&<p style={{fontSize:10,color:C.muted,marginTop:2}}>{ch.description}</p>}
              </div>
              <Pill color={cat?.color||C.green} sm>{cat?.label||"Reto"}</Pill>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <Bar v={ch.bestHits} max={ch.targetReps} color={bestPct>=targetPct?C.green:C.gold} h={5}/>
              </div>
              <span className="mono" style={{fontSize:11,color:C.mutedL}}>Mejor: {ch.bestHits}/{ch.targetReps}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:8}}>
                <span style={{fontSize:10,color:C.muted}}>Meta: <b style={{color:C.green}}>{ch.targetHits}/{ch.targetReps}</b></span>
                <span style={{fontSize:10,color:C.muted}}>x{ch.attempts.length}</span>
              </div>
              <button onClick={()=>{setActiveChallenge(ch);setAttempts({hits:0,total:0});setView("active");}}
                style={{padding:"6px 14px",borderRadius:8,border:"none",
                  background:cat?.color||C.green,color:C.bg,cursor:"pointer",fontWeight:700,fontSize:12}}>
                Iniciar
              </button>
            </div>
          </Card>;
        })}
        {done_chs.length>0&&<>
          <div style={{height:1,background:C.border,margin:"10px 0 8px"}}/>
          <Tag>COMPLETADOS ({done_chs.length})</Tag>
          {done_chs.map(ch=>(
            <Card key={ch.id} style={{marginBottom:6,opacity:0.75}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Icon name="check" size={15} color={C.green}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:12,fontWeight:600,color:C.white}}>{ch.name}</p>
                  <p style={{fontSize:9,color:C.muted}}>Completado {ch.completedDate} - Record: {ch.bestHits}/{ch.targetReps}</p>
                </div>
                <Pill color={C.green} sm>Logrado</Pill>
              </div>
            </Card>
          ))}
        </>}
      </div>
    </div>;
  }

  //  SESSIONS + PLANNING 


  const saveSession=(isPlanned)=>{
    if(!sForm.date)return;
    if(sForm.targetType==="player"&&!sForm.playerId)return;
    if(sForm.targetType==="group"&&!sForm.groupId)return;
    const newS={id:"s_"+Date.now(),...sForm,isPlanned,isDone:!isPlanned};
    onSaveSessions([...sessions,newS]);
    setSForm({...emptySession});
    setView("list");
  };

  // Session detail view
  if((tab==="sessions"||tab==="planning")&&view==="session_detail"&&selectedSession){
    const s=sessions.find(x=>x.id===selectedSession);
    if(!s)return null;
    const sType=SESSION_TYPES.find(t=>t.id===s.type);
    const intObj=INTENSITY.find(i=>i.v===s.intensity);
    const isGroup=s.targetType==="group";
    const grp=isGroup?groups.find(g=>g.id===s.groupId):null;
    const pl=!isGroup?players.find(p=>p.id===s.playerId):null;
    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={()=>setView("list")} style={{display:"flex",alignItems:"center",gap:5,
            background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
            <Icon name="arrow" size={15} color={C.muted}/>
            {s.isPlanned?"Planning":"Sesiones"}
          </button>
          <div style={{display:"flex",gap:8}}>
            {s.isPlanned&&!s.isDone&&<button onClick={()=>{
              onSaveSessions(sessions.map(x=>x.id===s.id?{...x,isDone:true}:x));
              setView("list");
            }} style={{padding:"5px 10px",borderRadius:7,border:"none",
              background:C.green,color:C.bg,cursor:"pointer",fontSize:11,fontWeight:700}}>
              Realizada
            </button>}
            <button onClick={()=>{onSaveSessions(sessions.filter(x=>x.id!==s.id));setView("list");}}
              style={{background:"none",border:"none",cursor:"pointer"}}>
              <Icon name="trash" size={15} color={C.red}/>
            </button>
          </div>
        </div>
        <Card style={{marginBottom:10,borderLeft:"3px solid "+(sType?.color||C.blue)}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div>
              <p style={{fontSize:11,color:C.muted}}>{s.date}</p>
              <p style={{fontWeight:700,fontSize:15,color:C.white,marginTop:2}}>{sType?.label||s.type}</p>
              {isGroup&&grp&&<Pill color={grp.color} sm>{grp.name}</Pill>}
              {pl&&<div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                <Avatar initials={pl.avatar} size={16} color={C.green}/>
                <span style={{fontSize:11,color:C.mutedL}}>{pl.name}</span>
              </div>}
            </div>
            <div style={{textAlign:"right"}}>
              <p className="mono" style={{fontSize:18,fontWeight:700,color:sType?.color||C.blue}}>{s.duration}min</p>
              {intObj&&<Pill color={intObj.col} sm>{intObj.l}</Pill>}
              {s.isPlanned&&<div style={{marginTop:4}}>
                <Pill color={s.isDone?C.green:C.gold} sm>{s.isDone?"Realizada":"Planificada"}</Pill>
              </div>}
            </div>
          </div>
          {s.rating>0&&<div style={{display:"flex",gap:2}}>
            {[1,2,3,4,5].map(n=>(
              <span key={n} style={{fontSize:15,color:n<=s.rating?C.gold:C.border}}>{n<=s.rating?"*":"o"}</span>
            ))}
          </div>}
        </Card>
        {s.goals&&<Card style={{marginBottom:8,border:"1px solid "+C.green+"33"}}>
          <Tag>OBJETIVOS</Tag>
          <p style={{fontSize:13,color:C.mutedL,lineHeight:1.5}}>{s.goals}</p>
        </Card>}
        {s.warmup&&<Card style={{marginBottom:8}}>
          <Tag>CALENTAMIENTO</Tag>
          <p style={{fontSize:13,color:C.mutedL,lineHeight:1.5}}>{s.warmup}</p>
        </Card>}
        {s.mainBlock&&<Card style={{marginBottom:8}}>
          <Tag>BLOQUE PRINCIPAL</Tag>
          <p style={{fontSize:13,color:C.mutedL,lineHeight:1.5}}>{s.mainBlock}</p>
        </Card>}
        {s.notes&&<Card>
          <Tag>NOTAS</Tag>
          <p style={{fontSize:13,color:C.mutedL,lineHeight:1.5}}>{s.notes}</p>
        </Card>}
      </div>
    </div>;
  }

  if(tab==="sessions"){
    if(view==="new_session") return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/><SessionForm isPlanned={false} onSave={()=>saveSession(false)} onBack={()=>setView("list")} form={sForm} setF={SF} players={players} groups={groups}/>
    </div>;

    const playerSessions=sessions.filter(s=>!s.isPlanned&&(
      s.playerId===selectedPlayer||
      (s.targetType==="group"&&groups.find(g=>g.id===s.groupId)?.playerIds?.includes(selectedPlayer))
    )).sort((a,b)=>new Date(b.date)-new Date(a.date));

    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/><PlayerSel/>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 14px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <Tag>HISTORIAL ({playerSessions.length})</Tag>
          {!isPlayerMode&&<button onClick={()=>{setSForm({...emptySession,playerId:selectedPlayer||"",targetType:"player"});setView("new_session");}}
            style={{padding:"5px 12px",borderRadius:8,border:"none",background:C.blue,
              color:C.white,cursor:"pointer",fontSize:12,fontWeight:700,marginBottom:8,
              display:"flex",alignItems:"center",gap:5}}>
            <Icon name="plus" size={13} color={C.white}/> Registrar
          </button>}
        </div>
        {playerSessions.length===0&&<div style={{textAlign:"center",padding:"24px 0"}}>
          <Icon name="clock" size={30} color={C.muted}/>
          <p style={{color:C.muted,fontSize:12,marginTop:8}}>Sin sesiones registradas</p>
        </div>}
        {playerSessions.map(s=>{
          const sType=SESSION_TYPES.find(t=>t.id===s.type);
          const intObj=INTENSITY.find(i=>i.v===s.intensity);
          const isGroup=s.targetType==="group";
          const grp=isGroup?groups.find(g=>g.id===s.groupId):null;
          return <Card key={s.id} style={{marginBottom:8,cursor:"pointer",
            borderLeft:"3px solid "+(sType?.color||C.blue)}}
            onClick={()=>{setSelectedSession(s.id);setView("session_detail");}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{fontWeight:600,fontSize:13,color:C.white}}>{sType?.label||s.type}</p>
                <p style={{fontSize:10,color:C.muted,marginTop:1}}>{s.date} - {s.duration}min</p>
                {isGroup&&grp&&<Pill color={grp.color} sm>{grp.name}</Pill>}
                {s.rating>0&&<div style={{display:"flex",gap:1,marginTop:3}}>
                  {[1,2,3,4,5].map(n=>(<span key={n} style={{fontSize:10,color:n<=s.rating?C.gold:C.border}}>{n<=s.rating?"*":"o"}</span>))}
                </div>}
              </div>
              <div style={{textAlign:"right"}}>
                {intObj&&<Pill color={intObj.col} sm>{intObj.l}</Pill>}
              </div>
            </div>
          </Card>;
        })}
      </div>
    </div>;
  }

  if(tab==="planning"){
    if(view==="new_session") return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/><SessionForm isPlanned={true} onSave={()=>saveSession(true)} onBack={()=>setView("list")} form={sForm} setF={SF} players={players} groups={groups}/>
    </div>;

    const allPlanned=sessions.filter(s=>s.isPlanned&&!s.isDone&&(
      s.playerId===selectedPlayer||
      (s.targetType==="group"&&groups.find(g=>g.id===s.groupId)?.playerIds?.includes(selectedPlayer))
    )).sort((a,b)=>new Date(a.date)-new Date(b.date));

    const donePlanned=sessions.filter(s=>s.isPlanned&&s.isDone&&(
      s.playerId===selectedPlayer||
      (s.targetType==="group"&&groups.find(g=>g.id===s.groupId)?.playerIds?.includes(selectedPlayer))
    )).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

    const todayDate=new Date(2026,5,13);

    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <TabBar/><PlayerSel/>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 14px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <Tag>PROXIMAS SESIONES ({allPlanned.length})</Tag>
          {!isPlayerMode&&<button onClick={()=>{setSForm({...emptySession,playerId:selectedPlayer||"",targetType:"player",isPlanned:true});setView("new_session");}}
            style={{padding:"5px 12px",borderRadius:8,border:"none",background:C.purple,
              color:C.white,cursor:"pointer",fontSize:12,fontWeight:700,marginBottom:8,
              display:"flex",alignItems:"center",gap:5}}>
            <Icon name="plus" size={13} color={C.white}/> Planificar
          </button>}
        </div>
        {allPlanned.length===0&&<div style={{textAlign:"center",padding:"20px 0"}}>
          <Icon name="target" size={30} color={C.muted}/>
          <p style={{color:C.muted,fontSize:12,marginTop:8}}>Sin sesiones planificadas</p>
        </div>}
        {allPlanned.map(s=>{
          const sType=SESSION_TYPES.find(t=>t.id===s.type);
          const isGroup=s.targetType==="group";
          const grp=isGroup?groups.find(g=>g.id===s.groupId):null;
          const pl=!isGroup?players.find(p=>p.id===s.playerId):null;
          const dDiff=Math.ceil((new Date(s.date)-todayDate)/(1000*60*60*24));
          return <Card key={s.id} style={{marginBottom:8,cursor:"pointer",
            borderLeft:"3px solid "+(sType?.color||C.purple)}}
            onClick={()=>{setSelectedSession(s.id);setView("session_detail");}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <p style={{fontWeight:700,fontSize:13,color:C.white}}>{sType?.label||s.type}</p>
                <p style={{fontSize:10,color:C.muted,marginTop:1}}>{s.date} - {s.duration}min</p>
                {isGroup&&grp&&<div style={{marginTop:3}}><Pill color={grp.color} sm>{grp.name}</Pill></div>}
                {pl&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
                  <Avatar initials={pl.avatar} size={14} color={C.green}/>
                  <span style={{fontSize:10,color:C.mutedL}}>{pl.name}</span>
                </div>}
              </div>
              <div style={{textAlign:"right"}}>
                {dDiff>0?<Pill color={dDiff<=2?C.red:C.gold} sm>en {dDiff}d</Pill>
                  :dDiff===0?<Pill color={C.green} sm>Hoy</Pill>
                  :<Pill color={C.muted} sm>Pasada</Pill>}
              </div>
            </div>
            {s.goals&&<p style={{fontSize:10,color:C.muted,fontStyle:"italic",
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{s.goals}"</p>}
            <div style={{display:"flex",gap:6,marginTop:8}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>onSaveSessions(sessions.map(x=>x.id===s.id?{...x,isDone:true}:x))}
                style={{flex:1,padding:"6px",borderRadius:7,border:"none",
                  background:C.green,color:C.bg,cursor:"pointer",fontWeight:600,fontSize:11}}>
                Realizada
              </button>
              <button onClick={()=>onSaveSessions(sessions.filter(x=>x.id!==s.id))}
                style={{padding:"6px 10px",borderRadius:7,border:"1px solid "+C.red+"44",
                  background:"none",color:C.red,cursor:"pointer",fontSize:11}}>
                Borrar
              </button>
            </div>
          </Card>;
        })}
        {donePlanned.length>0&&<>
          <div style={{height:1,background:C.border,margin:"10px 0 8px"}}/>
          <Tag>REALIZADAS RECIENTEMENTE</Tag>
          {donePlanned.map(s=>{
            const sType=SESSION_TYPES.find(t=>t.id===s.type);
            return <Card key={s.id} style={{marginBottom:6,opacity:0.7,cursor:"pointer"}}
              onClick={()=>{setSelectedSession(s.id);setView("session_detail");}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Icon name="check" size={14} color={C.green}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:12,fontWeight:600,color:C.white}}>{sType?.label||s.type}</p>
                  <p style={{fontSize:9,color:C.muted}}>{s.date} - {s.duration}min</p>
                </div>
                <Pill color={C.green} sm>Realizada</Pill>
              </div>
            </Card>;
          })}
        </>}
      </div>
    </div>;
  }

  return null;
}


const NAV=[
  {id:"home",icon:"home",label:"Inicio"},
  {id:"training",icon:"zap",label:"Entreno"},
  {id:"new",icon:"plus",label:"Partido",center:true},
  {id:"calendar",icon:"calendar",label:"Agenda"},
  {id:"profile",icon:"user",label:"Perfil"},
];
function BottomNav({active,onChange,isPlayerMode}){
  return <div style={{display:"flex",background:C.card,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
    {NAV.map(n=>{
      const on=active===n.id;
      if(n.center) return <button key={n.id} onClick={()=>onChange(n.id)}
        style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          border:"none",background:"none",cursor:"pointer",padding:"6px 0"}}>
        <div style={{width:46,height:46,borderRadius:23,background:`linear-gradient(135deg,${C.green},${C.greenD})`,
          display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 14px ${C.green}44`,marginBottom:2}}>
          <Icon name={n.icon} size={20} color={C.bg}/>
        </div>
      </button>;
      return <button key={n.id} onClick={()=>onChange(n.id)}
        style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          border:"none",background:"none",cursor:"pointer",padding:"10px 0",
          color:on?C.green:C.muted,transition:"color .15s"}}>
        <Icon name={n.icon} size={19} color={on?C.green:C.muted}/>
        <span style={{fontSize:9,fontWeight:on?700:400,marginTop:3}}>{n.label}</span>
      </button>;
    })}
  </div>;
}

// --- PLAN CONFIG ---
const PLANS={
  free:{
    name:"Free",maxPlayers:2,maxMatches:3,maxObjectives:2,
    features:["2 atletas","3 partidos de prueba","2 objetivos por atleta","Stats basicas"],
    locked:["Historial completo","Evolucion y graficas","Comparativa torneos","Modo Padre","Exportacion PDF","Chat","Calendario","Stats avanzadas"],
  },
  pro:{
    name:"Pro",maxPlayers:999,maxMatches:999,maxObjectives:999,price:"9.99",
    features:["Atletas ilimitados","Partidos ilimitados","Objetivos ilimitados","Stats completas y graficas","Modo Padre (read-only)","Chat con jugadores","Calendario de torneos","Exportacion PDF"],
    locked:[],
  },
  parent:{
    name:"Padre",maxPlayers:0,maxMatches:0,maxObjectives:0,
    features:["Vista de su hijo/a","Stats del ultimo partido","Objetivos actuales","Estado emocional","Read-only sin edicion"],
    locked:["Registro de partidos","Chat","Perfil completo","Configuracion"],
  },
};

// --- PAYWALL SCREEN ---
function PaywallScreen({feature,onClose,onUpgrade}){
  return <div style={{position:"absolute",inset:0,background:"rgba(8,17,26,0.95)",
    display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",
    padding:"24px",zIndex:100}}>
    <div style={{width:56,height:56,borderRadius:28,background:C.gold+"22",
      border:"2px solid "+C.gold+"44",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
      <Icon name="trophy" size={26} color={C.gold}/>
    </div>
    <h2 style={{fontSize:20,fontWeight:700,color:C.white,marginBottom:8,textAlign:"center"}}>
      Funcion exclusiva PRO
    </h2>
    <p style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:24,lineHeight:1.6}}>
      {feature||"Esta funcion"} esta disponible en el plan Pro. Desbloquea todo el potencial de BossiTennis.
    </p>
    <div style={{background:C.card,borderRadius:14,padding:16,width:"100%",marginBottom:20,
      border:"1px solid "+C.gold+"33"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:C.white}}>BossiTennis PRO</span>
        <div style={{textAlign:"right"}}>
          <span className="mono" style={{fontSize:22,fontWeight:700,color:C.gold}}>9.99</span>
          <span style={{fontSize:11,color:C.muted}}>/mes</span>
        </div>
      </div>
      {PLANS.pro.features.map(f=>(
        <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <Icon name="check" size={13} color={C.green}/>
          <span style={{fontSize:12,color:C.mutedL}}>{f}</span>
        </div>
      ))}
    </div>
    <button onClick={onUpgrade} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
      background:"linear-gradient(135deg,"+C.gold+","+C.goldD+")",
      color:C.bg,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10}}>
      Activar PRO
    </button>
    <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,
      cursor:"pointer",fontSize:13,padding:"8px"}}>
      Volver atras
    </button>
  </div>;
}

// --- ONBOARDING / LOGIN SCREEN ---

// --- FIRST-TIME TUTORIAL ---
function TutorialOverlay({role,onFinish}){
  const[step,setStep]=useState(0);

  const STEPS_COACH=[
    {icon:"plus",color:C.green,title:"Registra partidos",
     desc:"Toca el boton central para registrar un partido en vivo o uno que ya jugaste. Elige solo las stats que te interesan medir."},
    {icon:"home",color:C.blue,title:"Sigue la evolucion",
     desc:"En Inicio veras graficas de progreso, objetivos y comparativas entre torneos de cada uno de tus atletas."},
    {icon:"zap",color:C.purple,title:"Entrena con retos",
     desc:"Crea retos medibles para tus sesiones y planifica entrenamientos individuales o por grupos."},
  ];
  const STEPS_PLAYER=[
    {icon:"home",color:C.green,title:"Tus estadisticas",
     desc:"Aqui veras el resumen de tus partidos, tu evolucion y tus objetivos marcados por tu entrenador."},
    {icon:"chat",color:C.blue,title:"Habla con tu entrenador",
     desc:"Usa el chat para recibir feedback, stats y mensajes directamente de tu entrenador."},
    {icon:"zap",color:C.purple,title:"Tus retos y sesiones",
     desc:"Consulta los retos de entrenamiento y sesiones que tu entrenador ha planificado para ti."},
  ];
  const STEPS_PARENT=[
    {icon:"home",color:C.green,title:"Sigue a tu hijo/a",
     desc:"Veras sus ultimos resultados, objetivos y estado, todo en modo lectura."},
    {icon:"check",color:C.blue,title:"Estado y progreso",
     desc:"Estado emocional, fatiga y evolucion deportiva sin tener que estar en la pista."},
  ];

  const STEPS = role==="player"?STEPS_PLAYER:role==="parent"?STEPS_PARENT:STEPS_COACH;
  const s = STEPS[step];
  const isLast = step===STEPS.length-1;

  return <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",
    display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200}}>
    <div style={{background:C.card,borderRadius:"22px 22px 0 0",padding:"28px 24px 32px",
      width:"100%",maxWidth:480}} className="fadein">
      <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 22px"}}/>

      <div style={{width:56,height:56,borderRadius:16,background:s.color+"18",
        display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
        <Icon name={s.icon} size={26} color={s.color}/>
      </div>

      <h3 style={{fontSize:19,fontWeight:700,color:C.white,marginBottom:8}}>{s.title}</h3>
      <p style={{fontSize:14,color:C.mutedL,lineHeight:1.6,marginBottom:24}}>{s.desc}</p>

      <div style={{display:"flex",gap:6,marginBottom:20,justifyContent:"center"}}>
        {STEPS.map((_,i)=>(
          <div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,
            background:i===step?s.color:C.border,transition:"all .25s"}}/>
        ))}
      </div>

      <div style={{display:"flex",gap:10}}>
        {step>0&&<button onClick={()=>setStep(s=>s-1)}
          style={{padding:"13px 18px",borderRadius:12,border:"1px solid "+C.border,
            background:"none",color:C.muted,cursor:"pointer",fontSize:13}}>
          Atras
        </button>}
        <button onClick={()=>isLast?onFinish():setStep(s=>s+1)}
          style={{flex:1,padding:"13px",borderRadius:12,border:"none",
            background:s.color,color:C.bg,cursor:"pointer",fontWeight:700,fontSize:14}}>
          {isLast?"Empezar":"Siguiente"}
        </button>
      </div>
      <button onClick={onFinish}
        style={{width:"100%",textAlign:"center",background:"none",border:"none",
          color:C.muted,cursor:"pointer",fontSize:12,marginTop:14}}>
        Saltar tutorial
      </button>
    </div>
  </div>;
}

function OnboardingScreen({onLogin,isDark,onToggleTheme}){
  const[step,setStep]=useState("splash"); // splash|role|login|register
  const[role,setRole]=useState(""); // coach|parent|player
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[playerCode,setPlayerCode]=useState("");
  const[isLogin,setIsLogin]=useState(true);

  if(step==="splash") return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",
      alignItems:"center",padding:"32px 24px",background:C.bg}}>
      <div style={{marginBottom:16,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <BossiLogo size={80} animated={true} dark={isDark}/>
      </div>
      <h1 style={{fontSize:32,fontWeight:700,color:C.green,letterSpacing:"-1px",marginBottom:8}}>BossiTennis</h1>
      <p style={{fontSize:14,color:C.muted,textAlign:"center",marginBottom:48,lineHeight:1.6}}>
        Analisis profesional de tenis, sin camara, sin complicaciones
      </p>
      <button onClick={()=>setStep("role")} style={{width:"100%",padding:"16px",borderRadius:14,
        border:"none",background:"linear-gradient(135deg,"+C.green+","+C.greenD+")",
        color:C.bg,fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12,
        boxShadow:"0 4px 24px "+C.green+"44"}}>
        Empezar
      </button>
      <p style={{fontSize:11,color:C.muted,textAlign:"center",marginBottom:12}}>
        Ya tengo cuenta - <span onClick={()=>setStep("login")} style={{color:C.green,cursor:"pointer",fontWeight:600}}>Iniciar sesion</span>
      </p>
      {onToggleTheme&&<button onClick={onToggleTheme}
        style={{background:"none",border:"1px solid "+C.border,borderRadius:8,
          padding:"6px 14px",color:C.muted,cursor:"pointer",fontSize:11,margin:"0 auto",display:"block"}}>
        {isDark?"Modo claro":"Modo oscuro"}
      </button>}
    </div>
  );

  if(step==="role") return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"24px"}}>
      <button onClick={()=>setStep("splash")} style={{background:"none",border:"none",color:C.muted,
        cursor:"pointer",marginBottom:24,alignSelf:"flex-start"}}>
        <Icon name="arrow" size={20} color={C.muted}/>
      </button>
      <h2 style={{fontSize:24,fontWeight:700,color:C.white,marginBottom:8}}>Quien eres?</h2>
      <p style={{fontSize:13,color:C.muted,marginBottom:32}}>Selecciona tu rol para personalizar la experiencia</p>
      {[
        {k:"coach",icon:"trophy",title:"Entrenador",desc:"Registro de partidos, stats completas, gestion de atletas",color:C.green,plan:"Prueba gratis 1 mes"},
        {k:"parent",icon:"user",title:"Padre / Madre",desc:"Sigue el progreso de tu hijo/a en tiempo real",color:C.blue,plan:"Gratis con codigo"},
        {k:"player",icon:"tennis",title:"Jugador",desc:"Ve tus stats, objetivos y mensajes de tu entrenador",color:C.purple,plan:"Gratis con invitacion"},
      ].map(({k,icon,title,desc,color,plan})=>(
        <button key={k} onClick={()=>{setRole(k);setStep("login");}}
          style={{width:"100%",padding:"16px",borderRadius:14,marginBottom:10,
            border:"1px solid "+(role===k?color:C.border),
            background:role===k?color+"14":C.card,cursor:"pointer",textAlign:"left",
            display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:color+"18",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name={icon} size={22} color={color}/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:2}}>{title}</p>
            <p style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{desc}</p>
          </div>
          <Pill color={color} sm>{plan}</Pill>
        </button>
      ))}
    </div>
  );

  if(step==="login"||step==="register") return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"24px"}}>
      <button onClick={()=>setStep("role")} style={{background:"none",border:"none",color:C.muted,
        cursor:"pointer",marginBottom:24,alignSelf:"flex-start"}}>
        <Icon name="arrow" size={20} color={C.muted}/>
      </button>
      <div style={{display:"flex",gap:0,background:C.card,borderRadius:10,padding:3,marginBottom:24}}>
        {[["login","Iniciar sesion"],["register","Registrarse"]].map(([k,l])=>(
          <button key={k} onClick={()=>setStep(k)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",
            cursor:"pointer",fontSize:12,fontWeight:step===k?700:400,
            background:step===k?C.bg:"transparent",color:step===k?C.white:C.muted}}>
            {l}
          </button>
        ))}
      </div>
      {step==="register"&&(
        <div style={{marginBottom:12}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Nombre completo</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"
            style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,
              padding:"12px",color:C.white,fontSize:13,outline:"none"}}/>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Email</p>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" type="email"
          style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,
            padding:"12px",color:C.white,fontSize:13,outline:"none"}}/>
      </div>
      {role==="parent"?(
        <div style={{marginBottom:24}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Codigo del jugador</p>
          <input value={playerCode} onChange={e=>setPlayerCode(e.target.value)} placeholder="Codigo de 6 digitos"
            style={{width:"100%",background:C.card,border:"1px solid "+C.blue,borderRadius:9,
              padding:"12px",color:C.white,fontSize:13,outline:"none"}}/>
          <p style={{fontSize:10,color:C.muted,marginTop:5}}>El entrenador o jugador te proporciona este codigo</p>
        </div>
      ):(
        <div style={{marginBottom:24}}>
          <p style={{fontSize:11,color:C.muted,marginBottom:5}}>Contrasena</p>
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Minimo 8 caracteres" type="password"
            style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,
              padding:"12px",color:C.white,fontSize:13,outline:"none"}}/>
        </div>
      )}
      <button onClick={()=>onLogin(role||"coach")}
        style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
          background:"linear-gradient(135deg,"+C.green+","+C.greenD+")",
          color:C.bg,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:16}}>
        {step==="login"?"Entrar":"Crear cuenta"}
      </button>
      {role==="coach"&&step==="register"&&(
        <p style={{fontSize:11,color:C.muted,textAlign:"center",lineHeight:1.6}}>
          Plan gratuito: hasta 2 atletas, 3 partidos de prueba. Actualiza a PRO por 9.99/mes para todo sin limites.
        </p>
      )}
    </div>
  );

  return null;
}

// --- PARENT MODE SCREEN ---
function ParentModeScreen({players,matches,isDark,onToggleTheme,onLogout}){
  const[selectedPlayer,setSelectedPlayer]=useState(players[0]?.id||null);
  const player=players.find(p=>p.id===selectedPlayer);
  const playerMatches=matches.filter(m=>m.playerId===selectedPlayer);
  const lastMatch=playerMatches[0];
  const lastSummary=lastMatch?getSummary(lastMatch.sets):null;

  return <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    {/* Header */}
    <div style={{background:C.card,borderBottom:"1px solid "+C.border,padding:"12px 16px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name="tennis" size={18} color={C.blue}/>
          <span style={{fontSize:16,fontWeight:700,color:C.blue}}>BossiTennis</span>
        </div>
        <Pill color={C.blue} sm>Modo Padre</Pill>
      </div>
    </div>

    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px 14px 24px"}}>
      {/* Player selector */}
      {players.length>1&&(
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
          {players.map(p=>(
            <button key={p.id} onClick={()=>setSelectedPlayer(p.id)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"6px 12px",
                borderRadius:20,border:"1px solid "+(selectedPlayer===p.id?C.blue:C.border),
                background:selectedPlayer===p.id?C.blue+"14":C.card,cursor:"pointer"}}>
              <Avatar initials={p.avatar} size={20} color={C.blue}/>
              <span style={{fontSize:11,fontWeight:selectedPlayer===p.id?700:400,
                color:selectedPlayer===p.id?C.blue:C.mutedL}}>{p.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}

      {player&&<>
        {/* Player status banner */}
        <Card style={{marginBottom:12,background:isInj(player)?C.red+"0D":C.blue+"08",
          border:"1px solid "+(isInj(player)?C.red+"44":C.blue+"33")}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Avatar initials={player.avatar} size={48} color={isInj(player)?C.red:C.blue}/>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:16,color:C.white,marginBottom:4}}>{player.name}</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <Pill color={isInj(player)?C.red:C.green} sm>{player.status}</Pill>
                <Pill color={C.muted} sm>{player.phase}</Pill>
                <Pill color={C.gold} sm>{player.winRate}% WR</Pill>
              </div>
            </div>
          </div>
          {isInj(player)&&<div style={{marginTop:10,padding:"6px 10px",background:C.red+"12",
            borderRadius:8,border:"1px solid "+C.red+"33",textAlign:"center"}}>
            <p style={{fontSize:12,color:C.red,fontWeight:600}}>Tu hijo/a esta lesionado/a actualmente</p>
          </div>}
        </Card>

        {/* Objectives -- read only */}
        {player.objectives.filter(o=>!o.done).length>0&&(
          <Card style={{marginBottom:12}}>
            <Tag>OBJETIVOS ACTUALES</Tag>
            {player.objectives.filter(o=>!o.done).map(obj=>{
              const prog=clamp((obj.current/obj.target)*100,0,100);
              const col=prog>=80?C.green:prog>=50?C.gold:C.red;
              return <div key={obj.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.white}}>{obj.label}</span>
                  <span className="mono" style={{fontSize:11,color:col,fontWeight:700}}>{Math.round(prog)}%</span>
                </div>
                <Bar v={obj.current} max={obj.target} color={col} h={6}/>
                <p style={{fontSize:9,color:C.muted,marginTop:3}}>
                  {obj.current}{obj.unit} de {obj.target}{obj.unit}
                  {obj.deadline?" - hasta "+obj.deadline:""}
                </p>
              </div>;
            })}
          </Card>
        )}

        {/* Last match -- read only */}
        {lastMatch&&lastSummary&&(
          <Card style={{marginBottom:12}}>
            <Tag>ULTIMO PARTIDO</Tag>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:C.white}}>{lastMatch.rival}</p>
                <p style={{fontSize:11,color:C.muted}}>{lastMatch.date} - {lastMatch.round}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <Pill color={lastMatch.result==="W"?C.green:C.red}>
                  {lastMatch.result==="W"?"Victoria":"Derrota"}
                </Pill>
                <p className="mono" style={{fontSize:13,color:C.mutedL,marginTop:4}}>{lastMatch.score}</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
              <StatBox label="1er Saque" value={lastSummary.serve1Pct+"%"} color={C.green}/>
              <StatBox label="Winners" value={lastSummary.winners} color={C.gold}/>
              <StatBox label="Errores" value={lastSummary.ue} color={C.red}/>
            </div>
            {lastSummary.emotion&&(
              <div style={{padding:"6px 10px",background:C.bg,borderRadius:8,
                border:"1px solid "+C.gold+"22",display:"flex",alignItems:"center",gap:8}}>
                <Icon name={EMOTIONS.find(e=>e.k===lastSummary.emotion)?.icon||"heart"} size={13} color={C.gold}/>
                <span style={{fontSize:11,color:C.mutedL}}>
                  Estado percibido: <b style={{color:C.gold}}>{EMOTIONS.find(e=>e.k===lastSummary.emotion)?.l||lastSummary.emotion}</b>
                </span>
              </div>
            )}
          </Card>
        )}

        {/* Match history read-only */}
        {playerMatches.length>1&&(
          <Card style={{marginBottom:12}}>
            <Tag>ULTIMOS PARTIDOS</Tag>
            {playerMatches.slice(0,5).map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,
                padding:"7px 0",borderBottom:"1px solid "+C.border}}>
                <Pill color={m.result==="W"?C.green:C.red} sm>{m.result==="W"?"V":"D"}</Pill>
                <div style={{flex:1}}>
                  <p style={{fontSize:12,fontWeight:600,color:C.white}}>{m.rival}</p>
                  <p style={{fontSize:9,color:C.muted}}>{m.date} - {m.round}</p>
                </div>
                <p className="mono" style={{fontSize:11,color:C.mutedL}}>{m.score}</p>
              </div>
            ))}
          </Card>
        )}

        {/* Read-only notice */}
        <div style={{background:C.blue+"0A",border:"1px solid "+C.blue+"22",borderRadius:12,
          padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <Icon name="user" size={16} color={C.blue}/>
          <p style={{fontSize:11,color:C.mutedL,lineHeight:1.5}}>
            Modo lectura. Solo puedes ver la informacion de tu hijo/a. Contacta con el entrenador para cambios.
          </p>
        </div>
      </>}
    </div>

    {/* Minimal bottom bar */}
    <div style={{background:C.card,borderTop:"1px solid "+C.border,padding:"10px 16px",
      flexShrink:0,display:"flex",justifyContent:"center"}}>
      <p style={{fontSize:11,color:C.muted}}>BossiTennis - Modo Padre - Solo lectura</p>
    </div>
  </div>;
}

// --- PDF EXPORT HELPER ---
function exportToPDF(match, player){
  const s = getSummary(match.sets);
  const setRows = match.sets.map((st,i)=>{
    const s1in=st.serve1In||0, s1f=st.serve1Fault||0;
    const w=(st.wFhSpace||0)+(st.wFhAngle||0)+(st.wFhSpecial||0)+(st.wFhPass||0)+
            (st.wBhSpace||0)+(st.wBhAngle||0)+(st.wBhSpecial||0)+(st.wBhPass||0);
    const e=(st.errFhNet||0)+(st.errFhOut||0)+(st.errBhNet||0)+(st.errBhOut||0);
    return `Set ${i+1}: Saque ${pct(s1in,s1in+s1f)}% | Winners ${w} | ENF ${e} | Fatiga ${st.fatigueLevel||"-"}/4 | Feeling ${st.feelingBall||"-"}/4`;
  });

  const emo = match.sets.map(st=>st.emotionCoach).filter(Boolean).pop()||"--";
  const emoDef = EMOTIONS.find(e=>e.k===emo);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>BossiTennis - Informe de Partido</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f9f8;color:#1a2a1a;padding:32px;}
  .header{background:linear-gradient(135deg,#1a6a3a,#0e4a28);color:white;padding:28px 32px;border-radius:12px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;}
  .logo{font-size:26px;font-weight:800;letter-spacing:-1px;}
  .logo span{opacity:.7;font-weight:400;font-size:13px;display:block;margin-top:2px;}
  .result-badge{padding:8px 18px;border-radius:20px;font-weight:700;font-size:15px;background:${match.result==="W"?"rgba(0,200,100,.25)":"rgba(220,50,50,.25)"};color:${match.result==="W"?"#90ffcc":"#ffaaaa"};}
  .score{font-size:22px;font-weight:800;color:white;margin-top:4px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
  .card{background:white;border-radius:10px;padding:18px;box-shadow:0 1px 6px rgba(0,0,0,.07);}
  .card h3{font-size:10px;color:#6a8a6a;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px;}
  .stat-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f0f4f0;}
  .stat-row:last-child{border-bottom:none;}
  .stat-label{font-size:12px;color:#4a6a4a;}
  .stat-val{font-size:14px;font-weight:700;color:#1a4a2a;font-family:monospace;}
  .stat-val.good{color:#1a7a3a;}
  .stat-val.bad{color:#c03030;}
  .full{grid-column:span 2;}
  .set-row{background:#f5f9f5;border-radius:7px;padding:10px 14px;margin-bottom:6px;font-size:12px;color:#3a5a3a;}
  .footer{text-align:center;margin-top:24px;font-size:10px;color:#8aaa8a;}
  .bar-bg{background:#e8f0e8;border-radius:3px;height:5px;margin-top:4px;}
  .bar-fill{height:5px;border-radius:3px;background:#1a7a3a;}
  .info-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
  .info-box{background:white;border-radius:8px;padding:12px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);}
  .info-box .val{font-size:22px;font-weight:800;color:#1a4a2a;font-family:monospace;}
  .info-box .lbl{font-size:9px;color:#6a8a6a;text-transform:uppercase;letter-spacing:.8px;margin-top:2px;}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">BossiTennis<span>Informe de Partido</span></div>
    <div style="margin-top:8px;font-size:12px;opacity:.8">${player?.name||"--"} vs ${match.rival}</div>
    <div style="font-size:11px;opacity:.6;margin-top:2px">${match.date} &bull; ${match.tournament} &bull; ${match.round} &bull; ${match.surface||"--"}</div>
  </div>
  <div style="text-align:right">
    <div class="result-badge">${match.result==="W"?"VICTORIA":"DERROTA"}</div>
    <div class="score">${match.score}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-box"><div class="val" style="color:${s.serve1Pct>=60?"#1a7a3a":"#c03030"}">${s.serve1Pct}%</div><div class="lbl">1er Saque</div></div>
  <div class="info-box"><div class="val" style="color:#a07010">${s.winners}</div><div class="lbl">Winners</div></div>
  <div class="info-box"><div class="val" style="color:#c03030">${s.ue}</div><div class="lbl">Err. NF</div></div>
  <div class="info-box"><div class="val" style="color:#127878">${s.netPct}%</div><div class="lbl">Efectiv. Red</div></div>
</div>

<div class="grid">
  <div class="card">
    <h3>Saque</h3>
    ${[["1er Saque",s.serve1Pct+"%",s.serve1Pct>=60],["ACEs",s.ace,true],["Dobles Faltas",s.df,s.df===0],["A la T",match.sets.reduce((a,st)=>a+(st.serve1T||0),0)+"",true],["Abierto",match.sets.reduce((a,st)=>a+(st.serve1Wide||0),0)+"",true]].map(([l,v,good])=>`
    <div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val ${good?"good":"bad"}">${v}</span></div>`).join("")}
  </div>
  <div class="card">
    <h3>Golpes</h3>
    ${[["Winners totales",s.winners,true],["ENF totales",s.ue,s.ue<=10],["FH winners",match.sets.reduce((a,st)=>a+(st.wFhSpace||0)+(st.wFhAngle||0)+(st.wFhSpecial||0)+(st.wFhPass||0),0)+"",true],["BH winners",match.sets.reduce((a,st)=>a+(st.wBhSpace||0)+(st.wBhAngle||0)+(st.wBhSpecial||0)+(st.wBhPass||0),0)+"",true],["Ratio W/ENF",s.ue>0?(s.winners/s.ue).toFixed(1):"oo",true]].map(([l,v,good])=>`
    <div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val ${good?"good":"bad"}">${v}</span></div>`).join("")}
  </div>
  <div class="card">
    <h3>Red y Decisiones</h3>
    ${[["Subidas a la red",s.netApproach+"",true],["Efectividad red",s.netPct+"%",s.netPct>=60],["Decisiones correctas",s.decisionPct+"%",s.decisionPct>=65],["Resets mentales",match.sets.reduce((a,st)=>a+(st.resetRitual||0),0)+"",true]].map(([l,v,good])=>`
    <div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val ${good?"good":"bad"}">${v}</span></div>`).join("")}
  </div>
  <div class="card">
    <h3>Estado y Sensaciones</h3>
    ${[["Feeling bola",match.sets.map(st=>st.feelingBall||0).filter(Boolean).length?((match.sets.reduce((a,st)=>a+(st.feelingBall||0),0)/match.sets.filter(st=>st.feelingBall).length).toFixed(1)+"/4"):"--",true],["Fatiga final",(match.sets[match.sets.length-1]?.fatigueLevel||0)+"/4",false],["Activacion SNS",(match.sets[match.sets.length-1]?.feelingActivation||0)+"/4",true],["Estado percibido",emoDef?.l||emo||"--",true]].map(([l,v])=>`
    <div class="stat-row"><span class="stat-label">${l}</span><span class="stat-val">${v}</span></div>`).join("")}
  </div>
</div>

<div class="card full" style="margin-bottom:20px">
  <h3>Desglose por Set</h3>
  ${setRows.map(r=>`<div class="set-row">${r}</div>`).join("")}
  ${s.rallyAvg?`<div class="set-row">Media de golpes por punto: <b>${s.rallyAvg}</b></div>`:""}
</div>

<div class="footer">
  Generado por BossiTennis &bull; ${new Date().toLocaleDateString("es")}
</div>
</body>
</html>`;

  const blob = new Blob([html],{type:"text/html"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "BossiTennis_"+( player?.name||"jugador").replace(/ /g,"_")+"_"+match.date+".html";
  a.click();
  URL.revokeObjectURL(url);
}


// --- STORAGE KEYS ---
const SK={
  players:"bt_players",
  matches:"bt_matches",
  chats:"bt_chats",
  tournaments:"bt_tournaments",
  evalProfiles:"bt_evalProfiles",
  isDark:"bt_isDark",
  plan:"bt_plan",
  appMode:"bt_appMode",
  challenges:"bt_challenges",
  sessions:"bt_sessions",
  groups:"bt_groups",
};

// --- STORAGE HELPERS (localStorage -- persiste entre sesiones en el mismo navegador) ---
function loadData(key,fallback){
  try{
    const v=localStorage.getItem(key);
    if(v!=null)return JSON.parse(v);
  }catch(e){}
  return fallback;
}

function saveData(key,value){
  try{
    localStorage.setItem(key,JSON.stringify(value));
  }catch(e){console.error("Storage error:",e);}
}

// --- ROOT APP ---
export default function App(){
  const[loaded,setLoaded]=useState(false);
  const[saveIndicator,setSaveIndicator]=useState(false);
  const[isDark,setIsDark]=useState(false);
  const[showTutorial,setShowTutorial]=useState(false);
  const[tutorialRole,setTutorialRole]=useState("coach");
  const[appMode,setAppMode]=useState("splash");
  const[plan,setPlan]=useState("pro");
  const[screen,setScreen]=useState("home");
  const[players,setPlayers]=useState(SEED_PLAYERS);
  const[matches,setMatches]=useState(SEED_MATCHES);
  const[chats,setChats]=useState(SEED_CHATS);
  const[tournaments,setTournaments]=useState(SEED_TOURNAMENTS);
  const[matchConfig,setMatchConfig]=useState(null);
  const[matchType,setMatchType]=useState(null);
  const[paywall,setPaywall]=useState(null);
  const[evalProfiles,setEvalProfiles]=useState([
    {id:"ep1",name:"Partido completo",tabs:["score","serve","winners","errors","net","mental","state","emotion"]},
    {id:"ep2",name:"Solo saque",tabs:["score","serve"]},
    {id:"ep3",name:"Juego base",tabs:["score","winners","errors","net"]},
  ]);
  const[challenges,setChallenges]=useState([]);
  const[sessions,setSessions]=useState([]);
  const[groups,setGroups]=useState([]);

    // -- LOAD from storage on mount (synchronous localStorage) --
  useEffect(()=>{
    // Clear stale appMode so user always sees role selector
    try{localStorage.removeItem(SK.appMode);}catch(e){}
    // Check if first-time tutorial has been seen
    try{
      const seen=localStorage.getItem("bt_tutorial_seen");
      if(!seen) window._btTutorialPending=true;
    }catch(e){}
    try{
      const savedPlayers=loadData(SK.players,null);
      const savedMatches=loadData(SK.matches,null);
      const savedChats=loadData(SK.chats,null);
      const savedTournaments=loadData(SK.tournaments,null);
      const savedProfiles=loadData(SK.evalProfiles,null);
      const savedDark=loadData(SK.isDark,null);
      const savedPlan=loadData(SK.plan,null);
      const savedMode=loadData(SK.appMode,null);

      if(savedPlayers&&Array.isArray(savedPlayers)&&savedPlayers.length>0)setPlayers(savedPlayers);
      if(savedMatches&&Array.isArray(savedMatches))setMatches(savedMatches);
      if(savedChats&&Array.isArray(savedChats)&&savedChats.length>0)setChats(savedChats);
      if(savedTournaments&&Array.isArray(savedTournaments)&&savedTournaments.length>0)setTournaments(savedTournaments);
      if(savedProfiles&&Array.isArray(savedProfiles)&&savedProfiles.length>0)setEvalProfiles(savedProfiles);
      const savedChallenges=loadData(SK.challenges,null);
      const savedSessions=loadData(SK.sessions,null);
      if(savedChallenges&&Array.isArray(savedChallenges))setChallenges(savedChallenges);
      if(savedSessions&&Array.isArray(savedSessions))setSessions(savedSessions);
      const savedGroups=loadData(SK.groups,null);
      if(savedGroups&&Array.isArray(savedGroups))setGroups(savedGroups);
      if(savedDark!==null&&typeof savedDark==="boolean")setIsDark(savedDark);
      if(savedPlan&&typeof savedPlan==="string")setPlan(savedPlan);
      if(savedMode&&savedMode!=="splash"&&typeof savedMode==="string")setAppMode(savedMode);
    }catch(e){console.error("Load error:",e);}
    finally{setLoaded(true);}
  },[]);
  // -- SAVE to storage whenever data changes --
  const flashSave=()=>{setSaveIndicator(true);setTimeout(()=>setSaveIndicator(false),1400);};

  useEffect(()=>{if(loaded){saveData(SK.players,players);flashSave();}},[players]);
  useEffect(()=>{if(loaded){saveData(SK.matches,matches);flashSave();}},[matches]);
  useEffect(()=>{if(loaded)saveData(SK.chats,chats);},[chats]);
  useEffect(()=>{if(loaded)saveData(SK.tournaments,tournaments);},[tournaments]);
  useEffect(()=>{if(loaded)saveData(SK.evalProfiles,evalProfiles);},[evalProfiles]);
  useEffect(()=>{if(loaded)saveData(SK.challenges,challenges);},[challenges]);
  useEffect(()=>{if(loaded)saveData(SK.sessions,sessions);},[sessions]);
  useEffect(()=>{if(loaded)saveData(SK.groups,groups);},[groups]);
  useEffect(()=>{saveData(SK.isDark,isDark);},[isDark]);
  useEffect(()=>{if(loaded)saveData(SK.plan,plan);},[plan]);
  // appMode not persisted -- user picks role on every open
  // useEffect(()=>{if(loaded&&appMode!=="splash")saveData(SK.appMode,appMode);},[appMode]);
  // Apply theme
  useEffect(()=>{
    setTheme(isDark);
    document.body.style.background=isDark?"#08111A":"#F5F7F5";
    document.body.style.color=isDark?"#EEF4F0":"#1A2A1A";
  },[isDark]);

  const MAIN=["home","training","chat","calendar","profile"];
  const isPro=plan==="pro";
  const isPlayerMode=appMode==="player";
  const myPlayerId=isPlayerMode?players[0]?.id:null;

  const gate=(feature,cb)=>{
    if(isPro){cb();return;}
    if(feature==="players"&&players.length>=2){setPaywall("Mas de 2 atletas");return;}
    if(feature==="matches"&&matches.length>=3){setPaywall("Mas de 3 partidos");return;}
    cb();
  };

  const handleLogin=(role)=>{
    const mode=role==="parent"?"parent":role==="player"?"player":"coach";
    setAppMode(mode);
    setPlan(role==="coach"?"free":"pro");
    setTutorialRole(mode);
    if(window._btTutorialPending){
      setShowTutorial(true);
    }
  };

  const finishTutorial=()=>{
    setShowTutorial(false);
    try{localStorage.setItem("bt_tutorial_seen","1");}catch(e){}
    window._btTutorialPending=false;
  };

  // -- LOADING SCREEN --
  if(!loaded) return <>
    <style>{GCSS}</style>
    <div style={{height:"100dvh",maxWidth:480,margin:"0 auto",display:"flex",
      flexDirection:"column",alignItems:"center",justifyContent:"center",
      background:"#08111A",gap:20}}>
      <BossiLogo size={64} color="#00C46A" animated={true} dark={true}/>
      <p style={{color:"#6A8A9A",fontSize:13,letterSpacing:.5}}>Cargando tus datos...</p>
    </div>
  </>;

  // -- SPLASH --
  if(appMode==="splash") return <>
    <style>{GCSS}</style>
    <div style={{height:"100dvh",maxWidth:480,margin:"0 auto",background:C.bg}}>
      <OnboardingScreen onLogin={handleLogin} isDark={isDark} onToggleTheme={()=>setIsDark(d=>!d)}/>
    </div>
  </>;

  // -- PARENT --
  if(appMode==="parent") return <>
    <style>{GCSS}</style>
    <div style={{height:"100dvh",maxWidth:480,margin:"0 auto",overflow:"hidden",
      display:"flex",flexDirection:"column",background:C.bg,position:"relative"}}>
      {showTutorial&&<TutorialOverlay role="parent" onFinish={finishTutorial}/>}
      <ParentModeScreen players={players} matches={matches}
        isDark={isDark} onToggleTheme={()=>setIsDark(d=>!d)}
        onLogout={()=>setAppMode("splash")}/>
    </div>
  </>;

  const handleNav=id=>{
    if(id==="new"){
      if(isPlayerMode)return;
      gate("matches",()=>setScreen("match_type"));
      return;
    }
    setScreen(id);
  };

  const handleMatchSave=(setsData,extra={})=>{
    if(!matchConfig)return;
    const newMatch={
      id:"m_"+Date.now(),playerId:matchConfig.playerId,rival:matchConfig.rivalName,
      date:new Date().toISOString().slice(0,10),surface:matchConfig.surface,
      tournament:matchConfig.tournament||"Partido",round:matchConfig.round,
      result:extra.result||"?",score:extra.score||"--",
      isPost:extra.isPost||false,sets:setsData,
    };
    setMatches(p=>[newMatch,...p]);
    const ms=getSummary(setsData);
    setPlayers(prev=>prev.map(pl=>{
      if(pl.id!==matchConfig.playerId)return pl;
      const updatedObjs=pl.objectives.map(obj=>{
        let newCurrent=obj.current;
        if(obj.stat==="serve1Pct")newCurrent=ms.serve1Pct;
        else if(obj.stat==="netWonPct")newCurrent=ms.netPct;
        else if(obj.stat==="ueCount")newCurrent=ms.ue;
        else if(obj.stat==="winnerCount")newCurrent=ms.winners;
        else if(obj.stat==="decisionPct")newCurrent=ms.decisionPct;
        const recentMatches=[newMatch,...matches].filter(m=>m.playerId===pl.id).slice(0,2);
        if(recentMatches.length>=2&&!obj.done){
          const vals=recentMatches.map(m=>{
            const ms2=getSummary(m.sets);
            if(obj.stat==="serve1Pct")return ms2.serve1Pct;
            if(obj.stat==="netWonPct")return ms2.netPct;
            if(obj.stat==="ueCount")return ms2.ue;
            if(obj.stat==="winnerCount")return ms2.winners;
            if(obj.stat==="decisionPct")return ms2.decisionPct;
            return obj.current;
          });
          const allMet=obj.stat==="ueCount"?vals.every(v=>v<=obj.target):vals.every(v=>v>=obj.target);
          if(allMet)return{...obj,current:newCurrent,done:true,completedDate:new Date().toISOString().slice(0,10)};
        }
        return{...obj,current:newCurrent};
      });
      return{...pl,objectives:updatedObjs};
    }));
    setMatchConfig(null);setMatchType(null);
    setScreen("home");
  };

  const handleAddPlayer=data=>{
    gate("players",()=>{
      setPlayers(p=>[...p,data]);
      setChats(ch=>[...ch,{id:"chat_"+data.id,playerId:data.id,
        name:data.name,avatar:data.avatar,
        messages:[{from:"coach",text:"Bienvenido/a al equipo, "+data.name.split(" ")[0]+"!",time:"Ahora",read:false}]}]);
    });
  };
  const handleEditPlayer=data=>setPlayers(p=>p.map(x=>x.id===data.id?data:x));
  const handleDeletePlayer=id=>{
    setPlayers(p=>p.filter(x=>x.id!==id));
    setMatches(m=>m.filter(x=>x.playerId!==id));
    setChats(ch=>ch.filter(x=>x.playerId!==id));
  };
  const handleSendMessage=(chatId,text)=>{
    if(!isPro){setPaywall("Chat con jugadores");return;}
    setChats(prev=>prev.map(ch=>ch.id===chatId
      ?{...ch,messages:[...ch.messages,{from:"coach",text,time:new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}),read:false}]}
      :ch));
  };

  const ThemeBtn=()=>(
    <button onClick={()=>setIsDark(d=>!d)}
      style={{width:34,height:34,borderRadius:10,border:"1px solid "+C.border,
        background:C.card,cursor:"pointer",display:"flex",alignItems:"center",
        justifyContent:"center",flexShrink:0,transition:"all .3s"}}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke={C.muted} strokeWidth="2" strokeLinecap="round">
        {isDark
          ?<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
          :<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>}
      </svg>
    </button>
  );

  const activeNav=MAIN.includes(screen)?screen:null;

  return <>
    <style>{GCSS}</style>
    <ThemeCtx.Provider value={isDark}>
    <div className="app-shell" style={{height:"100dvh",display:"flex",flexDirection:"column",maxWidth:480,
      margin:"0 auto",overflow:"hidden",position:"relative",
      background:C.bg,transition:"background .3s,color .3s"}}>

      {paywall&&<PaywallScreen feature={paywall}
        onClose={()=>setPaywall(null)}
        onUpgrade={()=>{setPlan("pro");setPaywall(null);}}/>}

      {showTutorial&&<TutorialOverlay role={tutorialRole} onFinish={finishTutorial}/>}

      {saveIndicator&&(
        <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",
          background:C.green+"EE",color:C.bg,padding:"4px 14px",borderRadius:20,
          fontSize:11,fontWeight:700,zIndex:99,pointerEvents:"none",
          animation:"fadeUp .3s ease"}}>
          Guardado
        </div>
      )}

      {MAIN.includes(screen)&&(
        <div style={{background:C.card,borderBottom:"1px solid "+C.border,
          padding:"10px 14px",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <BossiLogo size={26} animated={false} dark={isDark}/>
            <span style={{fontSize:16,fontWeight:700,color:C.green,letterSpacing:"-0.3px"}}>
              BossiTennis
            </span>
            {isPlayerMode&&<Pill color={C.purple} sm>Jugador</Pill>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setScreen("chat")}
              style={{width:34,height:34,borderRadius:10,border:"1px solid "+(screen==="chat"?C.blue:C.border),
                background:screen==="chat"?C.blue+"18":C.card,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="chat" size={15} color={screen==="chat"?C.blue:C.muted}/>
            </button>
            <ThemeBtn/>
            {!isPro&&<button onClick={()=>setPaywall("BossiTennis Pro")}
              style={{padding:"4px 10px",borderRadius:7,
                border:"1px solid "+C.gold+"44",background:C.gold+"12",
                color:C.gold,cursor:"pointer",fontSize:11,fontWeight:700}}>
              PRO
            </button>}
            {isPro&&!isPlayerMode&&<Pill color={C.gold} sm>PRO</Pill>}
          </div>
        </div>
      )}

      <div style={{flex:1,overflow:"hidden",position:"relative",display:"flex",
        flexDirection:"column",background:C.bg}}>
        {screen==="home"&&<HomeScreen matches={matches} players={players}
          tournaments={tournaments} sessions={sessions} challenges={challenges} groups={groups}
          isPlayerMode={isPlayerMode} myPlayerId={myPlayerId}
          onExportPDF={(match)=>exportToPDF(match,players.find(p=>p.id===match.playerId))}/>}
        {screen==="training"&&<TrainingScreen players={players}
          challenges={challenges} onSaveChallenges={setChallenges}
          sessions={sessions} onSaveSessions={setSessions}
          groups={groups} onSaveGroups={setGroups}
          isPlayerMode={isPlayerMode} myPlayerId={myPlayerId}/>}
        {screen==="chat"&&<ChatScreen players={players} chats={chats} matches={matches}
          onSendMessage={handleSendMessage} isPro={isPro}
          onUpgrade={()=>setPaywall("Chat con jugadores")}
          isPlayerMode={isPlayerMode}/>}
        {screen==="calendar"&&<CalendarScreen players={players} matches={matches}
          tournaments={tournaments} isPlayerMode={isPlayerMode} myPlayerId={myPlayerId}
          onAddTournament={t=>setTournaments(p=>[...p,t])}
          onEditTournament={t=>setTournaments(p=>p.map(x=>x.id===t.id?t:x))}
          onDeleteTournament={id=>setTournaments(p=>p.filter(x=>x.id!==id))}/>}
        {screen==="profile"&&<ProfileScreen players={players} matches={matches}
          plan={plan} isPlayerMode={isPlayerMode} myPlayerId={myPlayerId} groups={groups}
          onSaveGroups={setGroups}
          sessions={sessions} challenges={challenges}
          onAddPlayer={handleAddPlayer} onEditPlayer={handleEditPlayer}
          onDeletePlayer={handleDeletePlayer}
          onUpgrade={()=>setPaywall("BossiTennis Pro")}
          onLogout={()=>setAppMode("splash")}
          isDark={isDark} onToggleTheme={()=>setIsDark(d=>!d)}
          evalProfiles={evalProfiles}
          onSaveEvalProfile={p=>setEvalProfiles(prev=>[...prev,p])}
          onDeleteEvalProfile={id=>setEvalProfiles(prev=>prev.filter(x=>x.id!==id))}/>}
        {screen==="match_type"&&<MatchTypeChooser
          onChoose={type=>{setMatchType(type);setScreen("new_setup");}}
          onCancel={()=>setScreen("home")}/>}
        {screen==="new_setup"&&<NewMatchSetup players={players} matchType={matchType}
          onStart={cfg=>{setMatchConfig(cfg);
            setScreen(matchType==="live"?"eval_select":"post_recording");}}
          onCancel={()=>setScreen("match_type")}/>}
        {screen==="eval_select"&&<EvalSelector
          evalProfiles={evalProfiles}
          onSaveProfile={p=>setEvalProfiles(prev=>[...prev,p])}
          onConfirm={tabs=>{
            setMatchConfig(cfg=>({...cfg,activeTabs:tabs}));
            setScreen("recording");
          }}
          onBack={()=>setScreen("new_setup")}/>}
        {screen==="recording"&&matchConfig&&<MatchRecording config={matchConfig}
          onSave={handleMatchSave}
          onCancel={()=>{setMatchConfig(null);setMatchType(null);setScreen("home");}}/>}
        {screen==="post_recording"&&matchConfig&&<PostMatchRecording config={matchConfig}
          onSave={handleMatchSave}
          onCancel={()=>{setMatchConfig(null);setMatchType(null);setScreen("home");}}/>}
      </div>

      {MAIN.includes(screen)&&(
        <BottomNav active={activeNav} onChange={handleNav} isPlayerMode={isPlayerMode}/>
      )}
      {["new_setup","recording","post_recording","eval_select"].includes(screen)&&(
        <div style={{background:C.card,borderTop:"1px solid "+C.border,
          padding:"7px 14px",flexShrink:0,
          display:"flex",justifyContent:"center",alignItems:"center",gap:6}}>
          <Icon name={matchType==="post"?"replay":"live"} size={12} color={C.muted}/>
          <p style={{fontSize:11,color:C.muted}}>
            {screen==="new_setup"?"Configuracion del partido":
             screen==="eval_select"?"Seleccion de parametros":
             screen==="post_recording"?"Registro post-partido":"Partido en curso"}
          </p>
        </div>
      )}
    </div>
    </ThemeCtx.Provider>
  </>;
}
export default App;
