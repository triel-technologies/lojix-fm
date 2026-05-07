FROM savonet/liquidsoap:main

USER root
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

COPY radio.liq /etc/liquidsoap/radio.liq

RUN mkdir -p /music/autodj /music/fallback /tts /var/log/liquidsoap

CMD ["liquidsoap", "/etc/liquidsoap/radio.liq"]
