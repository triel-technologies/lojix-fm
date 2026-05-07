import time, os, subprocess, requests

STREAM_URL = os.environ.get("STREAM_URL", "http://icecast:8000/live.mp3")
THRESHOLD = int(os.environ.get("SILENCE_THRESHOLD_SECONDS", "15"))
WEBHOOK = os.environ.get("ALERT_WEBHOOK", "")

def check_stream_audio():
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-i", STREAM_URL,
                "-t", "3",
                "-af", "volumedetect",
                "-f", "null", "-"
            ],
            capture_output=True, text=True, timeout=15
        )
        output = result.stderr
        if "mean_volume" in output:
            for line in output.splitlines():
                if "mean_volume" in line:
                    db = float(line.split(":")[1].strip().replace(" dB", ""))
                    return db > -70.0
        return True
    except Exception as e:
        print(f"Error checking stream: {e}")
        return False

def alert_discord(message):
    if not WEBHOOK:
        return
    try:
        requests.post(WEBHOOK, json={"content": f"🚨 LoJix FM Watchdog: {message}"}, timeout=5)
    except Exception:
        pass

def restart_liquidsoap():
    print("Attempting to restart Liquidsoap...")
    subprocess.run(["docker", "restart", "lojix-liquidsoap"], timeout=30)

silence_count = 0

while True:
    is_audio = check_stream_audio()
    if not is_audio:
        silence_count += 1
        print(f"Silence detected ({silence_count * 5}s)")
        if silence_count * 5 >= THRESHOLD:
            alert_discord(f"Silence detected for {silence_count * 5}s! Attempting recovery...")
            restart_liquidsoap()
            silence_count = 0
    else:
        silence_count = 0
    time.sleep(5)
