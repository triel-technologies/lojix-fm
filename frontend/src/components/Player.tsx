"use client"
import { useEffect, useRef, useState } from 'react'
import useWebSocket from '../lib/useWebSocket'

export default function Player() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [quality, setQuality] = useState<'mobile'|'live'|'hq'>('live')
  const [nowPlaying, setNowPlaying] = useState<any>(null)

  const streamUrls = {
    mobile: process.env.NEXT_PUBLIC_STREAM_URL?.replace('/live', '/mobile') || '/mobile',
    live: process.env.NEXT_PUBLIC_STREAM_URL || '/live',
    hq: process.env.NEXT_PUBLIC_STREAM_URL?.replace('/live', '/hq') || '/hq',
  }

  useWebSocket({
    onSongChanged: (d:any)=> setNowPlaying(d),
    onListenerUpdate: (d:any)=> setNowPlaying((p:any)=> p? {...p, listeners: d.count}: p),
    onSourceChanged: (d:any)=> setNowPlaying((p:any)=> p? {...p, source: d.source}: p),
  })

  useEffect(()=>{
    fetch('/api/now-playing').then(r=>r.json()).then(setNowPlaying).catch(()=>{})
  },[])

  function toggle(){
    if(!audioRef.current) return
    if(playing){
      audioRef.current.pause()
      audioRef.current.src = ''
    } else {
      audioRef.current.src = streamUrls[quality]
      audioRef.current.load()
      audioRef.current.play().catch(()=>{})
    }
    setPlaying(!playing)
  }

  return (
    <div style={{background:'#030308',color:'#fff',minHeight:'100vh',padding:20}}>
      <h1 style={{fontFamily:'Orbitron,monospace'}}>LOJIX FM</h1>
      <div>
        <div>{nowPlaying?.title || '—'}</div>
        <div>{nowPlaying?.artist || ''}</div>
      </div>
      <div style={{marginTop:12}}>
        <button onClick={toggle}>{playing? 'Pause':'Play'}</button>
        <select value={quality} onChange={(e)=> setQuality(e.target.value as any)}>
          <option value="mobile">64K</option>
          <option value="live">128K</option>
          <option value="hq">320K</option>
        </select>
      </div>
      <audio ref={audioRef} onError={()=> setPlaying(false)} />
    </div>
  )
}
