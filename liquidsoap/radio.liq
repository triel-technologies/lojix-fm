# LoJix FM — Autonomous AI Radio Engine

log.level := 3
log.file := true
log.file.path := "/var/log/liquidsoap/radio.log"

settings.server.socket := true
settings.server.socket.path := "/tmp/liquidsoap.sock"

# Icecast output settings
icecast_host = getenv("ICECAST_HOST")
icecast_port = int_of_string(getenv("ICECAST_PORT"))
icecast_pass = getenv("ICECAST_PASSWORD")

def normalize_source(s) =
  s = normalize(s, target=-14., window=0.1)
  s = amplify(1., override="liq_amp", s)
  s
end

# SOURCE 6: Emergency fallback
fallback_track = single("/music/fallback/ambient_loop.mp3")
fallback_track = normalize_source(fallback_track)

# SOURCE 5: AutoDJ
autodj = playlist(
  mode="randomize",
  reload=3600,
  reload_mode="watch",
  "/music/autodj"
)
autodj = normalize_source(autodj)

# SOURCE 4: AI Announcer
announcer_queue = request.queue(id="announcer_queue")
announcer = normalize_source(announcer_queue)

# SOURCE 3: Spotify Connect (librespot pipe)
spotify = pipe(
  restart=true,
  restart_on_error=true,
  buffer=0.2,
  max=10.0,
  command="/usr/bin/cat /tmp/spotify_audio"
)
spotify = audio_to_stereo(spotify)
spotify = normalize_source(spotify)

# SOURCE 2: Manual interrupt queue
manual_queue = request.queue(id="manual_queue")
manual_interrupt = normalize_source(manual_queue)

# SOURCE 1: Live DJ (Icecast relay from OBS/BUTT)
live_dj = input.harbor(
  "/live",
  id="live_input",
  port=8001,
  password=icecast_pass,
  max=10.0,
  buffer=2.0,
  on_connect=(fun(~headers, ~uri, ~protocol, _) ->
    log("Live DJ connected: #{uri}")
  ),
  on_disconnect=(fun(_) ->
    log("Live DJ disconnected")
  )
)
live_dj = normalize_source(live_dj)

def on_silence(~id) =
  log("SILENCE DETECTED on source: #{id}")
  file.write("/tmp/lojix_silence", "#{id}")
end

song_count = ref(0)
last_announcer_time = ref(0.0)

def should_insert_announcer() =
  current_time = time()
  time_since_last = current_time -. !last_announcer_time
  (!song_count mod 3 == 0 and !song_count > 0) or time_since_last > 900.0
end

def crossfade_custom(a, b)
  add(normalize=false, [
    sequence([
      fade.out(duration=3.0, a),
    ]),
    sequence([
      blank(duration=0.0),
      fade.in(duration=2.0, b),
    ])
  ])
end

autodj_with_announcer = fallback(
  track_sensitive=false,
  [
    announcer,
    autodj,
  ]
)

main_source = fallback(
  track_sensitive=true,
  transitions=[
    crossfade_custom,
    crossfade_custom,
    crossfade_custom,
    crossfade_custom,
  ],
  [
    live_dj,
    manual_interrupt,
    spotify,
    autodj_with_announcer,
    fallback_track,
  ]
)

main_source = on_blank(
  duration=10.0,
  on_silence,
  main_source
)

main_source = on_track(
  fun(m) ->
    begin
      title = m["title"]
      artist = m["artist"]
      log("Now playing: #{artist} - #{title}")
      song_count := !song_count + 1
      file.write("/tmp/lojix_nowplaying", "#{artist}|||#{title}|||#{m["album"]}")
    end,
  main_source
)

# HQ 320kbps
output.icecast(
  %mp3(bitrate=320, samplerate=44100, stereo=true),
  host=icecast_host,
  port=icecast_port,
  password=icecast_pass,
  mount="/hq.mp3",
  name="LoJix FM HQ",
  genre="Synthwave Cyberpunk",
  url="https://lojix.my.id",
  description="LoJix FM — AI Autonomous Radio | 320kbps",
  main_source
)

# Standard 128kbps
output.icecast(
  %mp3(bitrate=128, samplerate=44100, stereo=true),
  host=icecast_host,
  port=icecast_port,
  password=icecast_pass,
  mount="/live.mp3",
  name="LoJix FM",
  main_source
)

# Mobile 64kbps
mobile_source = audio_to_stereo(resample(ratio=0.5, main_source))
output.icecast(
  %mp3(bitrate=64, samplerate=22050, stereo=false),
  host=icecast_host,
  port=icecast_port,
  password=icecast_pass,
  mount="/mobile.mp3",
  name="LoJix FM Mobile",
  mobile_source
)

server.telnet(
  port=1234,
  bind_addr="0.0.0.0"
)
