import React,{useState} from 'react'
import {Bot,Check,RefreshCcw,ShieldCheck,TriangleAlert} from 'lucide-react'

// User explicitly chooses a model and consents to each type of data sent locally.
export default function LocalModelPanel({scan,demo}){
  const [available,setAvailable]=useState([])
  const [model,setModel]=useState('')
  const [question,setQuestion]=useState('')
  const [consent,setConsent]=useState(false)
  const [answer,setAnswer]=useState('')
  const [note,setNote]=useState('No connection attempted. The local AI is optional.')
  const [busy,setBusy]=useState(false)
  const supported=!demo&&!!window.doctor?.listLocalModels&&!!window.doctor?.askLocalModel

  async function discover(){
    if(!supported)return
    setBusy(true);setNote('Checking only 127.0.0.1:11434 on this computer…')
    try{
      const r=await window.doctor.listLocalModels()
      if(!r.ok){setAvailable([]);setModel('');setNote(r.error||'Local model unavailable.')}
      else{
        setAvailable(r.models||[])
        setModel(r.models?.[0]||'')
        setNote(r.models?.length?'Local models detected. No question sent yet.':'Ollama is running but has no installed models.')
      }
    }catch{setNote('Could not contact local Ollama.')}
    finally{setBusy(false)}
  }
  async function ask(){
    if(!supported||busy||!model||question.trim().length<3||!consent)return
    setBusy(true);setAnswer('');setNote('Generating on your installed local model; no cloud API is used by PC Doctor.')
    try{
      const r=await window.doctor.askLocalModel({model,question:question.trim(),scan})
      if(r.ok){setAnswer(r.answer);setNote('Local model output: verify recommendations. PC Doctor never executes generated instructions.')}
      else setNote(r.error||'No response')
    }catch{setNote('Local generation failed or timed out.')}
    finally{setBusy(false)}
  }
  return <section className="panel pro-panel">
    <div className="pro-title"><Bot size={21}/><div><p className="eyebrow">OPTIONAL LOCAL AI</p><h2>Run an installed Ollama model</h2></div></div>
    <p>Use a separately installed local model for more flexible questions. This app does not bundle, download, train, or automatically start a model. PC Doctor contacts only the local Ollama service at <code>127.0.0.1:11434</code>.</p>
    {demo ? <p className="pro-alert">The browser demo cannot access your installed Windows models. Use the desktop executable.</p> :
    <>
      <div className="pro-actions">
        <button type="button" disabled={busy} onClick={discover}><RefreshCcw size={16}/> Check installed models</button>
        <select aria-label="Installed local model" value={model} onChange={e=>setModel(e.target.value)} disabled={busy||!available.length}>
          {!available.length&&<option value="">No model selected</option>}
          {available.map(x=><option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <label className="pro-field">Question for the selected local model
        <textarea rows={3} maxLength={800} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Why might my computer freeze while gaming?"/>
      </label>
      <label className="pro-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
        I approve sending this question and a numeric-only, redacted scan summary to the selected model on my computer.
      </label>
      <button type="button" className="pro-primary" onClick={ask} disabled={!supported||busy||!consent||!model||question.trim().length<3}>
        <Bot size={16}/>{busy?'Working…':'Ask local AI'}
      </button>
      <p className="pro-status" role="status">{note}</p>
      {!!answer&&<div className="pro-response"><h3>Local model answer</h3><p>{answer}</p></div>}
    </>}
    <p className="pro-note"><ShieldCheck size={15}/> Third-party models may hallucinate or suggest unsafe repairs. No generated command is executed. Ollama must already be installed and configured. For low-memory laptops, choose a realistically small model.</p>
  </section>
}
