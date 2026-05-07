import { useEffect } from 'react'
import { io } from 'socket.io-client'

export default function useWebSocket(handlers: any) {
  useEffect(()=>{
    try{
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || '/ws', { transports: ['websocket'] })
      socket.on('song_changed', (d:any)=> handlers.onSongChanged?.(d))
      socket.on('listener_update', (d:any)=> handlers.onListenerUpdate?.(d))
      socket.on('source_changed', (d:any)=> handlers.onSourceChanged?.(d))
      return ()=> { socket.disconnect() }
    }catch(e){ }
  }, [])
}
