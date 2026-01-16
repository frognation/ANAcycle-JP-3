# RD-06 체크리스트 (운영 문서) / RD-06 Checklist (Ops Doc)

이 문서는 RD-06 단일 페이지(루트 index) 기준으로 기능/UX 요구사항을 체크하고, 변경 내역을 계속 관리하기 위한 체크리스트입니다.

This checklist tracks feature/UX requirements for the RD-06 single page (root index) and is used to continuously manage change history.

## 기능 체크리스트 / Feature Checklist

- [x] 3. 브러쉬가 가만히 있으면 깜빡이고, 움직일땐 안깜빡이는데, 항상 안깜빡이게 바꿔줘
  - 메모: pointermove 미세 흔들림(트랙패드/센서)로 브러쉬 적용이 토글되며 깜빡임이 생길 수 있어, 이동 데드존 기준을 추가해서 해결.
  - EN: The brush was flickering when idle (and not flickering when moving); change it so it never flickers.
  - EN note: Small pointermove jitter (trackpad/sensor noise) can toggle brush application; solved by adding a movement dead-zone threshold.

- [x] 4. 브러쉬 내부가 투명하게 보이고 다만 브러쉬로 화면위에서 움직일때 패턴을 흐트러뜨리는 효과는 그대로 유지해줘
  - 메모: 원형으로 “찍히는” 느낌이 남으면, 브러쉬 영향도를 노이즈로 분산/약화하는 방식으로 개선.
  - EN: Make the brush interior visually transparent, while keeping the disturbance effect when moving over the screen.
  - EN note: If a circular “stamp” feeling remains, improve by dispersing/weakening brush influence using noise.

- [x] 6. Set as Default 를 누르면 내가 지금 설정한 값대로 디폴트 코드가 변경되게 해줘
  - 메모: localStorage 저장은 되어도, 초기 UI 바인딩이 HTML 기본값으로 RD/COLORS를 다시 덮어쓰면 체감상 "안됨"이 됨. 초기 입력값을 RD/COLORS에서 먼저 세팅한 뒤 바인딩 필요.
  - EN: When pressing Set as Default, update default code values to the current settings.
  - EN note: Even if saved to localStorage, the initial UI binding can overwrite RD/COLORS with HTML defaults, making it feel broken. Initialize inputs from RD/COLORS first, then bind.

- [x] 9. 디스플레이 탭에서 컬러 두개 선택하는데 아래에 인버트 컬러 버튼 넣어서 블랙/화이트 값을 서로 반전
  - EN: In the display tab (two color pickers), add an “Invert Colors” button to swap black/white values.

- [x] 10. 처음 로딩할 때 효과가 나올 때까지 너무 오래 걸리는데, 그동안 타이틀 글자만 먼저 효과가 적용된 채로 나오게
  - 메모: 초기 로딩 병목은 (1) 이미지 전체 프리로드, (2) warm start 동기 루프(메인스레드 블로킹) 가능성. 해결 방향: lazy-load + warm start를 프레임 분할.
  - EN: Startup takes too long before the effect appears; show the title text with the effect applied first while loading.
  - EN note: Likely bottlenecks are (1) preloading the full image, (2) a synchronous warm-start loop blocking the main thread. Direction: lazy-load + split warm-start across frames.

---

## 이미지 컨트롤(추가) / Image Controls (Added)

- [x] 비네트(Vignette) 토글이 실제로 화면에 적용되게(레이어/블렌드 정합성)
  - EN: Make the vignette toggle actually affect the final output (layer/blend consistency).
- [x] Show Original을 눌렀을 때, 비네트/오토레벨(및 인버트)이 적용된 “오리지널 이미지 상태”가 보이게
  - 메모: 배경용 처리 캔버스(bgCanvas)를 “오리지널 뷰”로 사용해서 처리 결과를 그대로 보여줌.
  - EN: When pressing Show Original, show the “original image state” with vignette/auto-levels (and invert) applied.
  - EN note: Use the processed background canvas (bgCanvas) as the “original view” to show the processed result directly.

- [x] 비네트 강도 조절 슬라이더 추가
  - EN: Add vignette strength slider.
- [x] 오토레벨 강도 조절 슬라이더 추가
  - EN: Add auto-level strength slider.
- [x] 비네트가 이펙트 위 오버레이가 아니라, 이미지에 먼저 적용된 뒤 그 결과로 이펙트가 진행되게
  - 메모: seedCanvas/bgCanvas 렌더 단계에서 비네트를 픽셀로 bake 해서 sourceTexture에 반영.
  - EN: Apply vignette to the image first (baked), not as an overlay over the effect; the effect should use that processed result.
  - EN note: Bake vignette into pixels at the seedCanvas/bgCanvas render stage and feed it into sourceTexture.

---

## 타이틀 컨트롤(추가) / Title Controls (Added)

- [x] 타이틀 위치 선택(센터/탑/버텀)
  - 탑/버텀 여백: 화면 높이의 5%
  - Set as Default/Save JSON에도 저장되게
  - EN: Add title position selector (center/top/bottom).
  - EN note: Top/bottom margin = 5% of screen height.
  - EN note: Persist in Set as Default / Save JSON.

---

## 문서화(추가) / Documentation (Added)

- [x] 각 탭/항목 역할 및 붕괴 케이스 설명 문서 작성(Effects Note)
  - EN: Write docs describing each tab/item role and “collapse” cases (Effects Note).

---

## 브러쉬 개선(다음 단계) / Brush Improvements (Next)

- [x] 브러쉬를 더 “점구름”처럼(원형 스탬프 느낌 감소) 개선
  - EN: Improve brush to feel more like a “point cloud” (reduce circular stamp feel).

---

## 완료된 항목 / Completed Items

- [x] 5. 좌측 탭 1~5 항목 제거(관련 코드/파일 포함)
  - EN: Remove left tab items 1–5 (including related code/files).
- [x] 2. 마우스 포인터 표시
  - EN: Show mouse pointer.
- [x] 1. 브러쉬 주변 하얀 스트로크 표시 제거
  - EN: Remove white stroke around the brush.
- [x] 7. Show Original 누르면 멈추는 버그 수정(오버레이 방식)
  - EN: Fix bug where pressing Show Original stops (overlay approach).

---

## 최적화 및 속도 관련(논의용) / Optimization & Performance (For Discussion)

- [ ] 용량을 낮추고 웹에서 끊김없이 하기 위한 최적화 방법 / 품질 유지 속도 향상 / 품질 일부 손해로 속도 향상 등
  - 후보 아이디어(나중에 논의 후 실행):
    - 이미지 lazy-load, decoding 최적화, 필요 시 압축(webp/avif)
    - warm start 및 reseed를 requestAnimationFrame로 분할(메인 스레드 블로킹 제거)
    - stepsPerFrame 동적 조절(프레임 드랍 시 자동 감소)
    - simScale(해상도) 프리셋 제공(품질↔속도)
  - EN: Optimization approaches to reduce size and run smoothly on the web: keep quality while speeding up, or trade some quality for speed.
  - EN ideas (discuss first, implement later):
    - Lazy-load images, optimize decoding, compress if needed (webp/avif)
    - Split warm start and reseed across requestAnimationFrame (avoid main-thread blocking)
    - Dynamically adjust stepsPerFrame (auto-reduce on frame drops)
    - Provide simScale (resolution) presets (quality ↔ speed)
