#!/usr/bin/env bash
# แปลงสื่อสำหรับเว็บ docs/ : วิดีโอบทส่งท้าย (mp4 + mp3 + poster) และภาพครู 3 มิติ (portrait.jpg)
# ใช้:  tools/make_media.sh "<path to .mov>" "<path to portrait .jpg>"
set -euo pipefail
FF="${FFMPEG:-$(ls /c/Users/*/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_*/ffmpeg-*/bin/ffmpeg.exe 2>/dev/null | head -1)}"
[ -x "$FF" ] || FF=ffmpeg
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/assets/media"; IMG="$ROOT/docs/assets/img"
mkdir -p "$OUT" "$IMG/thumbs"

MOV="${1:-}"; PORTRAIT="${2:-}"

if [ -n "$MOV" ] && [ -f "$MOV" ]; then
  echo "== video: $MOV"
  # H.264 1080p (สูงสุด) ปิดเสียงในไฟล์วิดีโอ — เสียงแยกเป็น mp3 เพื่อใช้เป็นดนตรีพื้นหลังทั้งเว็บ
  "$FF" -y -hide_banner -loglevel error -i "$MOV" \
    -vf "scale='min(1920,iw)':-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.1 \
    -movflags +faststart -an "$OUT/finale.mp4"
  "$FF" -y -hide_banner -loglevel error -i "$MOV" -vn -c:a libmp3lame -b:a 160k -ar 44100 -af "afade=t=in:d=1.5" "$OUT/finale.mp3"
  "$FF" -y -hide_banner -loglevel error -ss 1.5 -i "$MOV" -frames:v 1 -vf "scale='min(1600,iw)':-2" -q:v 3 "$OUT/finale-poster.jpg"
  ls -la "$OUT"
fi

if [ -n "$PORTRAIT" ] && [ -f "$PORTRAIT" ]; then
  echo "== portrait: $PORTRAIT"
  "$FF" -y -hide_banner -loglevel error -i "$PORTRAIT" -vf "scale=1200:-2:flags=lanczos" -q:v 5 "$IMG/portrait.jpg"
  "$FF" -y -hide_banner -loglevel error -i "$PORTRAIT" -vf "scale=480:-2:flags=lanczos" -q:v 6 "$IMG/thumbs/portrait.jpg"
  ls -la "$IMG/portrait.jpg" "$IMG/thumbs/portrait.jpg"
fi

# วิดีโอป๊อปอัพตอนเข้าเว็บ (มีเสียงในไฟล์) : tools/make_media.sh "" "" "<intro .mov>"
INTRO="${3:-}"
if [ -n "$INTRO" ] && [ -f "$INTRO" ]; then
  echo "== intro: $INTRO"
  "$FF" -y -hide_banner -loglevel error -i "$INTRO" \
    -vf "scale='min(1280,iw)':-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.0 \
    -c:a aac -b:a 128k -ar 44100 -movflags +faststart "$OUT/intro.mp4"
  "$FF" -y -hide_banner -loglevel error -ss 1 -i "$INTRO" -frames:v 1 -vf "scale=1280:-2" -q:v 4 "$OUT/intro-poster.jpg"
  ls -la "$OUT/intro.mp4" "$OUT/intro-poster.jpg"
fi
