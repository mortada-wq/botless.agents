/* global React */
const { useState, useEffect, useRef } = React;

function Topbar() {
  return (
    <header style={{position:'sticky',top:0,zIndex:30,height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',background:'rgba(15,17,23,0.78)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <img src="../../assets/logo-mark.svg" style={{width:22,height:22}} alt="" />
        <img src="../../assets/logo-wordmark.svg" style={{height:18}} alt="botless" />
        <span style={{fontFamily:'JetBrains Mono',fontSize:11,letterSpacing:'0.12em',color:'#5A6273',marginLeft:8}}>STUDIO</span>
      </div>
      <nav style={{display:'flex',alignItems:'center',gap:24}}>
        <a style={{color:'#F5F7FA',fontSize:13}}>Floor</a>
        <a style={{color:'#8A93A4',fontSize:13}}>Marketplace</a>
        <a style={{color:'#8A93A4',fontSize:13}}>Embed</a>
        <div style={{width:1,height:20,background:'rgba(255,255,255,0.08)'}}/>
        <button style={{background:'#0A9396',color:'#fff',border:0,borderRadius:10,padding:'8px 14px',fontSize:13,fontWeight:500,boxShadow:'0 0 0 1px rgba(10,147,150,0.32),0 0 24px -6px rgba(10,147,150,0.5)'}}>+ New agent</button>
        <div style={{width:30,height:30,borderRadius:99,background:'#1C222C',border:'1px solid rgba(255,255,255,0.08)',display:'grid',placeItems:'center',color:'#94D2BD',fontSize:12,fontWeight:600}}>M</div>
      </nav>
    </header>
  );
}

function StatusPill({status}) {
  const map = {
    ready:    {bg:'rgba(43,166,151,0.12)', bd:'rgba(43,166,151,0.35)', fg:'#94D2BD', dot:'#2BA697', label:'READY'},
    rigging:  {bg:'rgba(232,179,65,0.12)', bd:'rgba(232,179,65,0.35)', fg:'#E8B341', dot:'#E8B341', label:'RIGGING'},
    syncing:  {bg:'rgba(94,157,242,0.12)', bd:'rgba(94,157,242,0.35)', fg:'#5E9DF2', dot:'#5E9DF2', label:'SYNCING'},
    offline:  {bg:'rgba(255,255,255,0.04)', bd:'rgba(255,255,255,0.08)', fg:'#8A93A4', dot:'#5A6273', label:'OFFLINE'},
  };
  const s = map[status] || map.ready;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 8px',borderRadius:99,background:s.bg,border:'1px solid '+s.bd,color:s.fg,fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.12em',fontWeight:600}}>
      <span style={{width:5,height:5,borderRadius:99,background:s.dot,boxShadow:status==='offline'?'none':`0 0 6px ${s.dot}`}}/>
      {s.label}
    </span>
  );
}

function WardSidebar({agents, activeId, onSelect}) {
  return (
    <aside style={{width:260,flexShrink:0,borderRight:'1px solid rgba(255,255,255,0.06)',background:'#0F1117',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'18px 18px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:'JetBrains Mono',fontSize:11,letterSpacing:'0.12em',color:'#8A93A4',fontWeight:600}}>WARD · {agents.length}</span>
        <span style={{color:'#5A6273',fontSize:11}}>filter</span>
      </div>
      <div style={{padding:'0 10px',display:'flex',flexDirection:'column',gap:6,overflowY:'auto'}}>
        {agents.map(a => {
          const active = a.id === activeId;
          return (
            <button key={a.id} onClick={() => onSelect(a.id)} style={{textAlign:'left',background:active?'rgba(10,147,150,0.10)':'transparent',border:active?'1px solid rgba(10,147,150,0.32)':'1px solid transparent',borderRadius:10,padding:'10px 12px',display:'flex',gap:10,alignItems:'center',cursor:'pointer',transition:'all 200ms cubic-bezier(0.4,0,0.2,1)'}}>
              <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(180deg,#1C222C,#0A0A0B)',border:'1px solid rgba(255,255,255,0.08)',display:'grid',placeItems:'center',fontFamily:'Inter',fontWeight:600,color:active?'#94D2BD':'#C4CAD4',fontSize:14}}>{a.name[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                  <div style={{color:'#F5F7FA',fontSize:13,fontWeight:active?600:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.name}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
                  <StatusPill status={a.status}/>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{padding:14,marginTop:'auto',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <button style={{width:'100%',background:'#161B22',border:'1px solid rgba(255,255,255,0.08)',color:'#F5F7FA',borderRadius:10,padding:'10px',fontSize:13,fontWeight:500}}>+ Admit new agent</button>
      </div>
    </aside>
  );
}

function OperatingTable({agent, state, onState}) {
  const states = ['idle','listening','talking','thinking','excited'];
  return (
    <section style={{flex:1,minWidth:0,padding:24,display:'flex',flexDirection:'column',gap:16,backgroundColor:'#0A0A0B',backgroundImage:'linear-gradient(to right, rgba(10,147,150,0.05) 1px, transparent 1px),linear-gradient(to bottom, rgba(10,147,150,0.05) 1px, transparent 1px),linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',backgroundSize:'20px 20px,20px 20px,100px 100px,100px 100px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:11,letterSpacing:'0.12em',color:'#8A93A4',fontWeight:600}}>OPERATING TABLE · {agent.id.toUpperCase()}</div>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:'-0.02em',marginTop:4}}>{agent.name}</h1>
        </div>
        <StatusPill status={agent.status}/>
      </div>
      <div style={{flex:1,position:'relative',background:'rgba(15,17,23,0.78)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:28,boxShadow:'0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -24px rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(60% 50% at 50% 0%, rgba(10,147,150,0.10), transparent 70%)',pointerEvents:'none'}}/>
        <div style={{width:240,height:240,borderRadius:99,background:'linear-gradient(180deg,#1C222C,#0A0A0B)',border:'1px solid rgba(255,255,255,0.12)',display:'grid',placeItems:'center',position:'relative',animation:state==='idle'?'breathe 4s ease-in-out infinite':state==='thinking'?'breathe 3s ease-in-out infinite':'none',boxShadow:state==='talking'?'0 0 0 0 rgba(10,147,150,0.45)':'none'}}>
          <div style={{fontSize:80,fontWeight:300,color:'#94D2BD',letterSpacing:'-0.04em'}}>{agent.name[0]}</div>
          {state==='thinking' && <div style={{position:'absolute',top:'-8%',left:'50%',transform:'translateX(-50%)',display:'flex',gap:6}}>
            <span style={{width:7,height:7,borderRadius:99,background:'#0A9396',animation:'dot 1.3s infinite'}}/>
            <span style={{width:7,height:7,borderRadius:99,background:'#0A9396',animation:'dot 1.3s 0.18s infinite'}}/>
            <span style={{width:7,height:7,borderRadius:99,background:'#0A9396',animation:'dot 1.3s 0.36s infinite'}}/>
          </div>}
        </div>
        <div style={{position:'absolute',top:16,left:16,fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.12em',color:'#5A6273'}}>STAGE.GLB</div>
        <div style={{position:'absolute',bottom:16,right:16,fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.12em',color:'#5A6273'}}>STATE: {state.toUpperCase()}</div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {states.map(s => (
          <button key={s} onClick={()=>onState(s)} style={{background:s===state?'rgba(10,147,150,0.16)':'#161B22',border:'1px solid '+(s===state?'#0A9396':'rgba(255,255,255,0.08)'),color:s===state?'#94D2BD':'#C4CAD4',borderRadius:10,padding:'8px 14px',fontSize:12,fontFamily:'JetBrains Mono',letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>{s}</button>
        ))}
      </div>
    </section>
  );
}

function VitalsPanel({agent}) {
  const [tab, setTab] = useState('vitals');
  return (
    <aside style={{width:340,flexShrink:0,borderLeft:'1px solid rgba(255,255,255,0.06)',background:'#0F1117',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',padding:'14px 14px 0',gap:6}}>
        {['vitals','personality','knowledge'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?'#161B22':'transparent',border:'1px solid '+(tab===t?'rgba(255,255,255,0.08)':'transparent'),color:tab===t?'#F5F7FA':'#8A93A4',borderRadius:8,padding:'8px',fontSize:12,fontFamily:'JetBrains Mono',letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>{t}</button>
        ))}
      </div>
      <div style={{padding:18,display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>
        {tab === 'vitals' && <>
          <Vital label="Confidence" value={0.92} color="#0A9396"/>
          <Vital label="Personality match" value={0.78} color="#94D2BD"/>
          <Vital label="Knowledge coverage" value={0.64} color="#5E9DF2"/>
          <Vital label="Memory used" value={0.31} color="#E8B341"/>
          <div style={{marginTop:6,padding:14,background:'#161B22',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.12em',color:'#8A93A4',fontWeight:600,marginBottom:6}}>RIG OUTPUT</div>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'#C4CAD4',lineHeight:1.7}}>
              joints: <span style={{color:'#94D2BD'}}>14</span><br/>
              face_anchor: <span style={{color:'#94D2BD'}}>centroid</span><br/>
              .glb size: <span style={{color:'#94D2BD'}}>3.2 mb</span><br/>
              latency: <span style={{color:'#94D2BD'}}>92ms</span>
            </div>
          </div>
        </>}
        {tab === 'personality' && <>
          <PersonalityRow label="Friendly" value={0.7}/>
          <PersonalityRow label="Professional" value={0.4}/>
          <PersonalityRow label="Witty" value={0.55}/>
          <PersonalityRow label="Concise" value={0.85}/>
          <div style={{padding:14,background:'#161B22',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.12em',color:'#8A93A4',fontWeight:600,marginBottom:8}}>WELCOME LINE</div>
            <div style={{color:'#F5F7FA',fontSize:13,lineHeight:1.5}}>"Hi — I'm {agent.name}. Want me to show you how I work?"</div>
          </div>
        </>}
        {tab === 'knowledge' && <>
          {[
            {n:'manual_v3.pdf', s:'ready', size:'1.2 mb'},
            {n:'faq.md', s:'ready', size:'8 kb'},
            {n:'spec_sheet.pdf', s:'syncing', size:'412 kb'},
          ].map(f => (
            <div key={f.n} style={{display:'flex',alignItems:'center',gap:10,padding:10,background:'#161B22',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8}}>
              <div style={{width:28,height:28,borderRadius:6,background:'#232A36',display:'grid',placeItems:'center',color:'#8A93A4',fontFamily:'JetBrains Mono',fontSize:10}}>PDF</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:'#F5F7FA',fontSize:13,fontFamily:'JetBrains Mono',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.n}</div>
                <div style={{color:'#5A6273',fontSize:11,fontFamily:'JetBrains Mono'}}>{f.size}</div>
              </div>
              <StatusPill status={f.s}/>
            </div>
          ))}
        </>}
      </div>
    </aside>
  );
}

function Vital({label, value, color}) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontSize:13,color:'#C4CAD4'}}>{label}</span>
        <span style={{fontFamily:'JetBrains Mono',fontSize:12,color:color}}>{value.toFixed(2)}</span>
      </div>
      <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
        <div style={{width:`${value*100}%`,height:'100%',background:`linear-gradient(90deg, #005F73, ${color})`,boxShadow:`0 0 8px ${color}`}}/>
      </div>
    </div>
  );
}

function PersonalityRow({label, value}) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontSize:13,color:'#C4CAD4'}}>{label}</span>
        <span style={{fontFamily:'JetBrains Mono',fontSize:12,color:'#8A93A4'}}>{Math.round(value*100)}%</span>
      </div>
      <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:99,position:'relative'}}>
        <div style={{position:'absolute',left:0,top:-4,bottom:-4,width:value*100+'%',background:'linear-gradient(90deg, transparent, rgba(10,147,150,0.16))'}}/>
        <div style={{position:'absolute',left:`calc(${value*100}% - 6px)`,top:-4,width:12,height:12,borderRadius:99,background:'#0A9396',boxShadow:'0 0 12px #0A9396'}}/>
      </div>
    </div>
  );
}

function Composer({onSend, busy}) {
  const [text, setText] = useState('');
  return (
    <form onSubmit={e=>{e.preventDefault(); if(!text.trim())return; onSend(text); setText('');}} style={{padding:'14px 24px',borderTop:'1px solid rgba(255,255,255,0.06)',background:'#0F1117'}}>
      <div style={{display:'flex',gap:10,alignItems:'center',background:'#161B22',border:'1px solid '+(busy?'#0A9396':'rgba(255,255,255,0.08)'),borderRadius:14,padding:'10px 14px',boxShadow:busy?'0 0 0 2px rgba(10,147,150,0.20), 0 0 24px -6px rgba(10,147,150,0.4)':'none',transition:'all 320ms cubic-bezier(0.4,0,0.2,1)'}}>
        <span style={{fontFamily:'JetBrains Mono',fontSize:11,letterSpacing:'0.12em',color:busy?'#94D2BD':'#5A6273'}}>{busy?'HEALING':'SUTURE'}</span>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Test the agent — type a customer question…" style={{flex:1,background:'transparent',border:0,outline:0,color:'#F5F7FA',fontSize:14,fontFamily:'Inter'}}/>
        <button type="submit" style={{background:'#0A9396',color:'#fff',border:0,borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:500,cursor:'pointer'}}>Send</button>
      </div>
    </form>
  );
}

function StatusBar({state, agent}) {
  return (
    <footer style={{height:28,padding:'0 18px',borderTop:'1px solid rgba(255,255,255,0.06)',background:'#0A0A0B',display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'JetBrains Mono',fontSize:10,letterSpacing:'0.12em',color:'#5A6273'}}>
      <span>BOTLESS.STUDIO · v0.4.1</span>
      <span>{agent.id} · STATE:{state.toUpperCase()} · 92ms · OK</span>
    </footer>
  );
}

window.Topbar = Topbar;
window.WardSidebar = WardSidebar;
window.OperatingTable = OperatingTable;
window.VitalsPanel = VitalsPanel;
window.Composer = Composer;
window.StatusBar = StatusBar;
window.StatusPill = StatusPill;
