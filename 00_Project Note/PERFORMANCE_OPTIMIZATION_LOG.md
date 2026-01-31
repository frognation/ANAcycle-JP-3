# 성능 최적화 로그 / Performance Optimization Log

이 문서는 RD-06 웹 실행 성능(로딩/프레임)을 개선하기 위한 **계획, 실행내역, 디버깅 기록**을 누적 관리합니다.
This document accumulates **plans, execution notes, and debugging logs** to improve RD-06 web runtime performance (loading/frame smoothness).

---

## 용어 / Terminology

- `DPR`: 디바이스 픽셀 비율(레티나 배율) / Device Pixel Ratio (retina scale)
- `stepsPerFrame`: 프레임당 시뮬레이션 반복 횟수 / Simulation iterations per rendered frame
- `simScale`: 시뮬레이션 해상도 비율(화면 대비) / Simulation resolution scale (relative to viewport)
- `manifest.json`: 이미지 목록 파일 / Image listing file

---

## 2026-01-30

### 목표 / Goals

- 웹에서 초기 로딩(이미지/설정) 체감 속도 개선
  - EN: Improve perceived initial loading time (images/settings).
- 애니메이션 프레임 드랍을 줄이고 더 스무스하게 유지
  - EN: Reduce frame drops and keep animation smoother.
- 큰 화면/레티나 환경에서도 버벅임 없이 동작
  - EN: Avoid stalls on large displays / retina DPR.

### 관찰(원인 추정) / Observations (Likely Bottlenecks)

- `stepsPerFrame` 값이 높으면(GPU RT ping-pong 반복) 프레임이 급격히 느려짐
  - EN: High `stepsPerFrame` can tank FPS due to many GPU ping-pong iterations.
- 레티나에서 `renderer.setPixelRatio(window.devicePixelRatio)` 그대로면 드로잉 버퍼 픽셀 수가 커짐
  - EN: Using full DPR increases render buffer pixels significantly.
- `imageAutoLevels`/`imageVignette`는 캔버스 픽셀 루프(`getImageData`)라 해상도에 비례해 CPU가 급증
  - EN: AutoLevels/Vignette run CPU pixel loops and scale with resolution.
- 프로덕션에서도 `cache: 'no-store'` + `?t=Date.now()`면 캐시가 항상 무효화되어 로딩이 느려짐
  - EN: Disabling cache + cache-busting in production makes loading consistently slower.

### 계획 / Plan

- DPR 클램프 적용(예: 최대 2)
  - EN: Clamp DPR (e.g., max 2).
- 프로덕션에서 `manifest.json`은 캐시 허용(개발 환경만 bust/no-store)
  - EN: Allow caching of `manifest.json` in production (dev keeps bust/no-store).
- 프레임 타임 기반으로 `stepsPerFrame`을 자동으로 줄이는 적응형(Adaptive) 성능 모드
  - EN: Add adaptive steps that reduce sim iterations when frame time is high.
- 대형 화면에서 시뮬레이션 RT 픽셀 수를 상한으로 캡(면적 기반)
  - EN: Cap simulation render target pixel count (area-based) on huge screens.
- `imageAutoLevels`/`imageVignette`는 저해상도 버퍼에서 처리 후 업스케일
  - EN: Process AutoLevels/Vignette on a smaller buffer then upscale.
- (선택) 원본 이미지 자체를 downscale한 `_img_web/`를 생성해서 네트워크+디코딩 비용 감소
  - EN: (Optional) Generate downscaled `_img_web/` to reduce network+decode cost.

### 실행 내역 / Execution Notes

- 변경 파일 / Changed files
  - EN: Changed files
  - [particles/rd-06/rd-main.js](../particles/rd-06/rd-main.js)
    - DPR 클램프(`PERF.maxDpr`) 적용
      - EN: Apply DPR clamp (`PERF.maxDpr`).
    - `manifest.json` fetch: 프로덕션 캐시 허용, 개발만 bust/no-store
      - EN: Cache-friendly manifest fetch (dev-only bust/no-store).
    - `_img_web/` → `_img/` 순서로 이미지 소스 자동 선택
      - EN: Auto-select image source directory (`_img_web/` then `_img/`).
    - `stepsPerFrame` 적응형 멀티플라이어(프레임 타임 기반)
      - EN: Adaptive multiplier for effective steps per frame.
    - AutoLevels/Vignette 저해상도 처리(`PERF.postFxMaxDim`)
      - EN: Low-res CPU post-FX processing (`PERF.postFxMaxDim`).
    - `?perfdebug=1` 디버그 오버레이 추가
      - EN: Add perf debug overlay via `?perfdebug=1`.
  - [tools/optimize-images-sips.sh](../tools/optimize-images-sips.sh)
    - `_img_web/` 생성 + `manifest.json` 생성(맥OS `sips` 기반)
      - EN: Generate `_img_web/` + `manifest.json` (macOS `sips`).

### 디버깅 / Debugging

- 성능 오버레이 켜기
  - EN: Enable performance overlay
  - URL에 `?perfdebug=1` 추가
    - EN: Add `?perfdebug=1` to the URL.
- 체크 포인트
  - EN: Checkpoints
  - `fps`, `frame ms`가 안정적으로 유지되는지
    - EN: Confirm stable `fps` / `frame ms`.
  - `steps: ui=... eff=...`에서 eff가 드랍 시 자동 감소하는지
    - EN: Verify `eff` decreases when frames get slow.
  - `sim: WxH`가 큰 화면에서 과도하게 커지지 않는지
    - EN: Ensure sim RT size doesn’t explode on large screens.

### 이미지 다운스케일이 도움 될까? / Does downscaling background images help?

- 네, 매우 도움 됩니다(특히 **다운로드 용량 + 이미지 디코딩 비용**이 크게 줄어 체감 로딩이 빨라집니다).
  - EN: Yes—very helpful. It reduces **download size and image decode cost**, improving perceived load time.
- 이미 이펙트 적용/그레이스케일/리액션 디퓨전으로 변형되기 때문에 원본이 너무 클 필요가 없는 경우가 많습니다.
  - EN: Since images are transformed (grayscale/Reaction-Diffusion), very large originals are often unnecessary.
- 권장 워크플로우
  - EN: Recommended workflow
  - `bash tools/optimize-images-sips.sh 1600` 실행 → `_img_web/` 생성
    - EN: Run `bash tools/optimize-images-sips.sh 1600` → generates `_img_web/`.
  - 배포는 자동으로 `_img_web/`을 우선 사용합니다(없으면 `_img/` 사용).
    - EN: Deployment will prefer `_img_web/` automatically (falls back to `_img/`).

### 다음 작업 / Next Steps

- 기본 품질 프리셋(예: Mobile/Default/High) UI 제공 여부 결정
  - EN: Decide whether to expose quality presets (Mobile/Default/High).
- 이미지 포맷을 WebP/AVIF로 변환(가능하면)하여 추가 용량 절감
  - EN: Convert assets to WebP/AVIF (if desired) for further size reduction.

---

## 2026-01-31

### 디폴트 확정 / Default Lock-in

- 최신 설정 스냅샷 `20260131_001.json`의 값과 코드의 하드코딩 디폴트(`RD`/`COLORS`/`TITLE`)가 일치하는지 재검증
  - EN: Re-verified that `20260131_001.json` matches the code hardcoded defaults (`RD`/`COLORS`/`TITLE`).
- 커밋/배포 단계에서 `JSON Settings/20260131_001.*` 및 `_img_web/`를 리포지토리에 포함해(재현성/배포 안정성) 고정
  - EN: Include `JSON Settings/20260131_001.*` and `_img_web/` in git for reproducibility and stable deployments.

---

## 기록 규칙 / Logging Rule

- 새로운 시도/변경/버그 발견 시 위 날짜 섹션 아래에 항목을 추가합니다.
  - EN: When you try a change / find a bug, append entries under the relevant date.
- 재현 조건(URL 파라미터, 기기, 브라우저)과 결과(전/후 체감)까지 같이 기록합니다.
  - EN: Record repro conditions (URL params, device, browser) and observed results.
