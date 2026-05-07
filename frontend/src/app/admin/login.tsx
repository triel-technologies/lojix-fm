"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin(){
  const [u,setU]=useState('')
  const [p,setP]=useState('')
  const [err,setErr]=useState('')
  const router = useRouter()

  async function submit(e:any){
    e.preventDefault()
    try{
      const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})})
      if(!res.ok) throw new Error('Auth failed')
      const data = await res.json()
      localStorage.setItem('lojix_token', data.access_token)
      router.push('/admin/dashboard')
    }catch(e:any){ setErr(e.message || 'Error') }
  }

  return (
    <div style={{padding:20}}>
      <h2>Admin Login</h2>
      <form onSubmit={submit}>
        <div><input value={u} onChange={e=>setU(e.target.value)} placeholder="username"/></div>
        <div><input value={p} onChange={e=>setP(e.target.value)} type="password" placeholder="password"/></div>
        <div><button type="submit">Login</button></div>
      </form>
      {err && <div style={{color:'red'}}>{err}</div>}
    </div>
  )
}
