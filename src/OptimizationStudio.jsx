import React,{useMemo,useState} from 'react'
import {Activity,ArrowUpRight,Bookmark,BookOpen,CheckCircle2,ChevronRight,Cpu,Gamepad2,HardDrive,Info,Layers,Network,Search,ShieldCheck,SlidersHorizontal,TriangleAlert,Undo2} from 'lucide-react'
import {OPTIMIZATIONS,PROFILES,getBottlenecks,sortOptimizations} from './optimizationCatalog.mjs'
import NetworkQualityPanel from './NetworkQualityPanel.jsx'
import V6OptimizerPanel from './V6OptimizerPanel.jsx'
import V6GameSession from './V6GameSession.jsx'
import V6NetworkPathPanel from './V6NetworkPathPanel.jsx'

const CATEGORIES=['All','Gaming','Windows','Storage','Network']
const FILTERS={Gaming:Gamepad2,Windows:Cpu,Storage:HardDrive,Network:Network}
const KEY='pc-doctor-optimization-preferences-v1'
const valid=new Set(OPTIMIZATIONS.map(x=>x.id))
function restore(){
  try{
    const p=JSON.parse(window.localStorage.getItem(KEY)||'{}')
    return {
      profile:PROFILES.some(x=>x.id===p.profile)?p.profile:'balanced',
      favorites:Array.isArray(p.favorites)?p.favorites.filter(id=>valid.has(id)).slice(0,30):[]
    }
  }catch{return {profile:'balanced',favorites:[]}}
}
function store(p){
  try{window.localStorage.setItem(KEY,JSON.stringify({profile:p.profile,favorites:p.favorites}))}catch{}
}
function labelRisk(risk){return risk==='Moderate'?'Review carefully':'Low-risk guidance'}
function Feature({item,isFav,onFavorite,onOpen,busy,desktop}){
  const Icon=FILTERS[item.category]||SlidersHorizontal
  return <article className="opt-card">
    <div className="opt-card-head">
      <div className="opt-icon"><Icon size={20}/></div>
      <div className="opt-tags"><span>{item.category}</span><span className={'opt-risk '+(item.risk==='Moderate'?'moderate':'')}>{labelRisk(item.risk)}</span></div>
      <button type="button" className={'opt-bookmark '+(isFav?'chosen':'')} onClick={()=>onFavorite(item.id)} aria-label={(isFav?'Remove':'Save')+' '+item.title+' as favorite'} title="Save to favorites"><Bookmark size={17} fill={isFav?'currentColor':'none'}/></button>
    </div>
    <h3>{item.title}</h3>
    <p>{item.summary}</p>
    <details><summary>What it does & how to restore</summary><div className="opt-details">
      <p>{item.detail}</p><p><strong>Recovery:</strong> {item.undo}</p>
      <p><strong>Evidence:</strong> {item.evidence}</p>
      {item.windows11&&<p><strong>Availability:</strong> Windows 11 on supported versions/hardware.</p>}
      <a href={item.source} target="_blank" rel="noopener noreferrer">Official reference <ArrowUpRight size={14}/></a>
    </div></details>
    <button className="opt-open" type="button" disabled={busy||(!desktop&&item.kind==='guided')}
      onClick={()=>onOpen(item)}>
      {item.kind==='confirmed'?'Review confirmation in Fix & Gaming':'Open Windows settings'}
      <ChevronRight size={16}/>
    </button>
  </article>
}
export default function OptimizationStudio({data,demo,onNavigate}){
  const [prefs,setPrefs]=useState(restore)
  const [filter,setFilter]=useState('All')
  const [search,setSearch]=useState('')
  const [favoritesOnly,setFavoritesOnly]=useState(false)
  const [profileOnly,setProfileOnly]=useState(false)
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('')
  const desktop=!demo&&!!window.doctor?.openSettings
  const bottlenecks=useMemo(()=>getBottlenecks(data),[data])
  const profile=PROFILES.find(x=>x.id===prefs.profile)||PROFILES[0]
  const entries=useMemo(()=>{
    const q=search.trim().toLowerCase().slice(0,120)
    const all=OPTIMIZATIONS.filter(x=>
      (filter==='All'||x.category===filter)&&
      (!favoritesOnly||prefs.favorites.includes(x.id))&&
      (!profileOnly||profile.ids.includes(x.id))&&
      (!q||[x.title,x.summary,x.category,x.keywords].join(' ').toLowerCase().includes(q))
    )
    return sortOptimizations(all,data)
  },[search,filter,favoritesOnly,profileOnly,profile,prefs.favorites,data])
  function saveProfile(id){
    const p={...prefs,profile:id}
    setPrefs(p);store(p);setProfileOnly(true)
    setNotice('Profile selected. This changes only the on-screen recommendations, not Windows settings.')
  }
  function toggleFavorite(id){
    const favorites=prefs.favorites.includes(id)?prefs.favorites.filter(x=>x!==id):[...prefs.favorites,id].slice(-30)
    const p={...prefs,favorites};setPrefs(p);store(p)
  }
  async function openItem(item){
    if(item.kind==='confirmed'){
      onNavigate('fixes')
      return
    }
    if(!desktop){setNotice('Open Windows settings requires the desktop app. The browser version is only a preview.');return}
    setBusy(true);setNotice('')
    try{
      const response=await window.doctor.openSettings(item.action)
      setNotice(response?.ok?'Windows Settings opened. You decide whether to apply any change.':response?.error||'Could not open settings; the option may not exist on this Windows build.')
    }catch{setNotice('Windows did not open this settings page.')}
    finally{setBusy(false)}
  }
  return <div className="optimization-studio">
    <section className="opt-hero">
      <div><p className="eyebrow">PC DOCTOR / OPTIMIZATION STUDIO</p>
        <h2>Diagnose first. Optimize with control.</h2>
        <p>Explore curated Windows performance options similar in scope to gaming optimizers, but with documented effects, privacy, restoration guidance and no fake FPS claims.</p>
        <div className="opt-hero-trust"><span><ShieldCheck size={16}/> No hidden scripts</span><span><Undo2 size={16}/> Restore guidance</span><span><Activity size={16}/> Scan-grounded priorities</span></div>
      </div>
      <div className="opt-hero-number"><strong>{OPTIMIZATIONS.length}</strong><span>reviewed options</span></div>
    </section>
    {demo&&<p className="demo-warning"><TriangleAlert size={16}/> Browser preview: settings actions are disabled. Windows installation is required.</p>}
    <section className="panel opt-section">
      <div className="opt-section-heading"><div><p className="eyebrow">FROM YOUR LAST SCAN</p><h2>Problems to address before tweaks</h2></div>
      <button type="button" className="opt-secondary" onClick={()=>onNavigate('dashboard')}>Open diagnosis <ArrowUpRight size={15}/></button></div>
      <div className="opt-bottlenecks">{bottlenecks.map((x,i)=><div key={i} className={'opt-bottleneck '+x.severity}><div className="opt-priority-icon">{x.severity==='good'?<CheckCircle2 size={20}/>:x.severity==='high'?<TriangleAlert size={20}/>:<Info size={20}/>}</div>
        <div><strong>{x.title}</strong><p>{x.detail}</p></div>
      </div>)}</div>
    </section>
    <section className="panel opt-section">
      <div className="opt-section-heading"><div><p className="eyebrow">SAVE A LOCAL PROFILE</p><h2>Gaming and PC presets</h2></div><span className="opt-footnote">Recommendations only, not automatic tuning</span></div>
      <div className="opt-presets">{PROFILES.map(x=><button type="button" key={x.id} onClick={()=>saveProfile(x.id)} aria-pressed={prefs.profile===x.id} className={'opt-preset '+(prefs.profile===x.id?'active':'')}>
        <Layers size={18}/><strong>{x.name}</strong><small>{x.subtitle}</small><span>{x.ids.length} relevant options</span>
      </button>)}</div>
      <div className="opt-profile-actions"><button type="button" onClick={()=>setProfileOnly(!profileOnly)} aria-pressed={profileOnly}>
        {profileOnly?'Show all options':'Show '+profile.name+' only'}
      </button><span>Profiles and favorites remain in this local app/browser profile, not in the cloud.</span></div>
    </section>
    <V6OptimizerPanel demo={demo} onNavigate={onNavigate}/>
    <section className="panel opt-section">
      <div className="opt-section-heading"><div><p className="eyebrow">EVIDENCE-LINKED CATALOG</p><h2>Choose the improvement that matches your problem</h2></div><span className="opt-count">{entries.length} options</span></div>
      <div className="opt-search"><Search size={18}/><input value={search} maxLength={120} onChange={e=>setSearch(e.target.value)} placeholder="Search FPS, RAM, storage, graphics, startup, Wi-Fi…" aria-label="Search optimization options"/></div>
      <div className="opt-filterbar" aria-label="Optimization categories">{CATEGORIES.map(category=><button key={category} type="button" className={category===filter?'chosen':''} onClick={()=>setFilter(category)} aria-pressed={category===filter}>{category}</button>)}
      <button type="button" className={favoritesOnly?'chosen':''} aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(!favoritesOnly)}><Bookmark size={15}/> Favorites</button></div>
      {entries.length?<div className="opt-grid">{entries.map(item=><Feature key={item.id} item={item} isFav={prefs.favorites.includes(item.id)} onFavorite={toggleFavorite} onOpen={openItem} busy={busy} desktop={desktop}/>)}</div>
      :<div className="opt-empty"><Search size={23}/><strong>No options match those filters.</strong><button type="button" onClick={()=>{setFilter('All');setSearch('');setFavoritesOnly(false);setProfileOnly(false)}}>Clear filters</button></div>}
      {notice&&<p className="opt-feedback" role="status">{notice}</p>}
    </section>
    <V6GameSession demo={demo} onNavigate={onNavigate}/>
    {filter==='Network'&&<><V6NetworkPathPanel demo={demo}/><NetworkQualityPanel demo={demo}/></>}
    <section className="panel opt-section opt-safety"><BookOpen size={22}/><div><h3>What this optimizer will not do</h3>
      <p>No automatic disabling of Microsoft Defender, memory-integrity/VBS protections, anti-cheat services or Windows updates. No speculative HPET/timer registry patches, forced process termination, deletion of user files, or claims of guaranteed performance improvement. A risky "optimization" is not a feature simply because a competitor offers it.</p>
      <button type="button" onClick={()=>onNavigate('history')}>Compare CPU and game frame-time measurements <ArrowUpRight size={15}/></button>
    </div></section>
  </div>
}
