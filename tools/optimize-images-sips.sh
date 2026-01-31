#!/usr/bin/env bash
set -euo pipefail

# 이미지 리사이즈(다운스케일)로 초기 로딩/디코딩/CPU 작업을 줄입니다.
# Reduce initial download/decode/CPU cost by generating downscaled images.

# 사용법 / Usage:
# 1) repo 루트에서 실행 / Run from repo root:
#    bash tools/optimize-images-sips.sh 1600
# 2) 결과는 `_img_web/`에 생성되고, `manifest.json`도 같이 생성됩니다.
#    Output is written to `_img_web/` along with `manifest.json`.

MAX_DIM="${1:-1600}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/_img"
DST_DIR="$ROOT_DIR/_img_web"

if ! command -v sips >/dev/null 2>&1; then
  echo "ERROR: sips not found (macOS built-in tool)." >&2
  exit 1
fi

mkdir -p "$DST_DIR"

shopt -s nullglob
FILES=("$SRC_DIR"/*)

count=0
for f in "${FILES[@]}"; do
  base="$(basename "$f")"
  lower="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    *.jpg|*.jpeg|*.png|*.webp|*.gif|*.bmp|*.avif)
      # -Z keeps aspect ratio and sets max pixel dimension.
      sips -Z "$MAX_DIM" "$f" --out "$DST_DIR/$base" >/dev/null
      count=$((count + 1))
      ;;
    *)
      ;;
  esac
done

python3 - <<'PY'
import json, os

dst = os.path.join(os.getcwd(), "_img_web")
imgs = [f for f in os.listdir(dst) if f.lower().endswith((".jpg",".jpeg",".png",".webp",".gif",".bmp",".avif"))]
imgs.sort(key=lambda s: s.lower())
with open(os.path.join(dst, "manifest.json"), "w", encoding="utf-8") as fp:
  json.dump({"images": imgs}, fp, indent=2, ensure_ascii=False)
print(f"Wrote _img_web/manifest.json with {len(imgs)} images")
PY

echo "Done. Optimized images: $count (max dim: $MAX_DIM)"
