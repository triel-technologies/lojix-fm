"use client"
import { useState } from 'react'

export default function AdminUpload(){
  const [file,setFile]=useState<File | null>(null)
  const [msg,setMsg]=useState('')

  async function submit(e:any){
    e.preventDefault()
    if(!file) return setMsg('Choose a file')
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('lojix_token')
    const res = await fetch('/api/audio/upload',{method:'POST',body:fd, headers: token ? { Authorization: `Bearer ${token}` } : {}})
    if(res.ok) setMsg('Uploaded')
    else setMsg('Upload failed')
  }

  return (
    <div style={{padding:20}}>
      <h2>Upload Track</h2>
      <form onSubmit={submit}>
        <input type="file" accept="audio/*" onChange={e=> setFile(e.target.files?.[0]||null)} />
        <div><button type="submit">Upload</button></div>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  )
}
