#!/usr/bin/env bash
#
# Generate a curated set of test videos for the Vidat decoder pipeline (V3).
#
# Covers: containers {mp4, mov, mkv, webm, ts} x codecs {h264, hevc, vp9, vp8, av1}
#         x {CFR, VFR} + edge cases (B-frames, large GOP, odd dimensions, moov
#         placement, higher resolution) + expected-failure samples (AVI/DivX,
#         MPEG-4 Part 2 in mp4) to verify friendly error handling.
#
# Each frame has its frame number / timestamp burned in so frame alignment
# (especially for VFR) can be verified visually.
#
# Output videos go to a tmp dir (gitignored); this script is committed.
# Override the location with: OUT_DIR=/some/path ./scripts/generate-test-videos.sh
#
# Requires: ffmpeg with libx264, libx265, libvpx, libvpx-vp9, libsvtav1.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/tmp/test-videos}"
TMP_DIR="$OUT_DIR/.parts"

DUR="${DUR:-4}"
FPS="${FPS:-30}"
SIZE="${SIZE:-320x240}"

# This ffmpeg build has no drawtext (no libfreetype), so we use the `testsrc`
# source, which renders a running timecode + frame counter into the pattern
# natively. That is enough to verify frame alignment (esp. for VFR) by eye.

mkdir -p "$OUT_DIR" "$TMP_DIR"
echo "Output dir: $OUT_DIR"
echo

# A CFR source filterchain.
src_cfr() {
  echo "testsrc=size=${SIZE}:rate=${FPS}:duration=${DUR},format=yuv420p"
}

# gen <outfile> <ffmpeg video output args...>
# Generates a CFR clip in the container implied by the outfile extension.
gen() {
  local out="$1"; shift
  echo ">> $out"
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "$(src_cfr)" \
    "$@" "$OUT_DIR/$out"
}

# gen_vfr <outfile> <ffmpeg video output args...>
# Builds a genuinely variable-frame-rate clip by concatenating two segments
# encoded at different frame rates (30fps then 8fps) and copying with
# passthrough timestamps.
gen_vfr() {
  local out="$1"; shift
  local ext="${out##*.}"
  echo ">> $out (VFR)"
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "testsrc=size=${SIZE}:rate=30:duration=2,format=yuv420p" \
    "$@" "$TMP_DIR/a.$ext"
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "testsrc=size=${SIZE}:rate=8:duration=2,format=yuv420p" \
    "$@" "$TMP_DIR/b.$ext"
  printf "file '%s'\nfile '%s'\n" "$TMP_DIR/a.$ext" "$TMP_DIR/b.$ext" > "$TMP_DIR/list.txt"
  ffmpeg -hide_banner -loglevel error -y \
    -f concat -safe 0 -i "$TMP_DIR/list.txt" \
    -c copy -fps_mode passthrough "$OUT_DIR/$out"
}

# ---- Encoder presets -------------------------------------------------------
H264=(-c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 28)
HEVC=(-c:v libx265 -pix_fmt yuv420p -preset veryfast -crf 30 -tag:v hvc1)
AV1=(-c:v libsvtav1 -pix_fmt yuv420p -preset 9 -crf 40)
VP9=(-c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf 40 -deadline good -cpu-used 5)
VP8=(-c:v libvpx -pix_fmt yuv420p -b:v 1M -deadline good -cpu-used 5)
MPEG4=(-c:v mpeg4 -pix_fmt yuv420p -q:v 5)

# ============================ MAIN MATRIX ===================================

# --- mp4 ---
gen mp4_h264_cfr.mp4              "${H264[@]}" -movflags +faststart          # moov at front
gen mp4_h264_moov_end.mp4        "${H264[@]}"                               # moov at end (probe-from-tail)
gen mp4_h264_bframes_gop250.mp4  "${H264[@]}" -bf 3 -g 250 -keyint_min 250 -movflags +faststart
gen mp4_hevc_cfr.mp4             "${HEVC[@]}" -movflags +faststart
gen mp4_av1_cfr.mp4              "${AV1[@]}"  -movflags +faststart

# --- mov ---
gen mov_h264_cfr.mov             "${H264[@]}"

# --- mkv ---
gen mkv_h264_cfr.mkv             "${H264[@]}"
gen mkv_vp9_cfr.mkv              "${VP9[@]}"

# --- webm ---
gen webm_vp9_cfr.webm            "${VP9[@]}"
gen webm_vp8_cfr.webm            "${VP8[@]}"
gen webm_av1_cfr.webm            "${AV1[@]}"

# --- mpeg-ts ---
gen ts_h264_cfr.ts               "${H264[@]}"

# --- edge cases ---
SIZE=642x358 gen mp4_h264_odd_dims.mp4  "${H264[@]}" -movflags +faststart   # non-multiple-of-16 dims
SIZE=1280x720 gen mp4_h264_720p.mp4     "${H264[@]}" -movflags +faststart   # higher res (perf)

# --- VFR ---
gen_vfr mp4_h264_vfr.mp4         "${H264[@]}"
gen_vfr mkv_vp9_vfr.mkv          "${VP9[@]}"

# --- expected-failure samples (verify friendly error, not infinite spinner) ---
gen avi_mpeg4_divx.avi           "${MPEG4[@]}"                              # container unsupported by Mediabunny
gen mp4_mpeg4part2.mp4           "${MPEG4[@]}" -movflags +faststart        # codec unsupported by WebCodecs

# ============================================================================
rm -rf "$TMP_DIR"

echo
echo "=== Generated files ==="
for f in "$OUT_DIR"/*.{mp4,mov,mkv,webm,ts,avi}; do
  [ -f "$f" ] || continue
  read -r codec rate <<<"$(ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,avg_frame_rate -of default=nw=1:nk=1 "$f" | tr '\n' ' ')"
  size="$(du -h "$f" | cut -f1)"
  printf "  %-30s %-8s fps=%-12s %s\n" "$(basename "$f")" "$codec" "$rate" "$size"
done
