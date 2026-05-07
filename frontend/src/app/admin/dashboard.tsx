"use client"
import { useEffect, useState } from 'react'

export default function AdminDashboard(){
  const [status,setStatus]=useState<any>(null)

  useEffect(()=>{
    fetch('/api/status').then(r=>r.json()).then(setStatus).catch(()=>{})
  },[])

  return (
    <div style={{padding:20}}>
      <h2>Admin Dashboard</h2>
      <div>Station: {status?.station}</div>
      <div>Source: {status?.source}</div>
      <div>Listeners: {status?.listeners}</div>
      <div>Uptime: {Math.round(status?.uptime || 0)}s</div>
    </div>
  )
}
