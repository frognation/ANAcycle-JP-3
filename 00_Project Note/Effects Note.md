# RD-06 Effects Note (컨트롤 설명서) / RD-06 Effects Note (Controls Guide)

이 문서는 RD-06 페이지의 각 탭(Effect / Brush / Image / Title)에서 제공되는 컨트롤들이 **무엇을 바꾸는지**, 그리고 어떤 값 조합에서 **밸런스가 깨져 화면이 전체 회색/흰색/검정색으로 덮이는지(=붕괴/고정점으로 수렴)**를 이해하기 위한 참고 노트입니다.

This note explains **what each control changes** in the RD-06 page tabs (Effect / Brush / Image / Title), and which parameter combinations can **break the balance and make the whole screen converge to a flat gray/white/black** (i.e., collapse into a fixed point).

> 용어 / Terminology
> - **Seed(시드) / Seed**: 시뮬레이션이 시작할 때 참조하는 입력 이미지(그레이스케일 + (선택)인버트 + (선택)오토레벨 + (선택)비네트 + 타이틀 오버레이)
>   - The input image used at simulation start (grayscale + optional invert + optional auto-levels + optional vignette + title overlay).
> - **RD(Reaction-Diffusion) / RD (Reaction-Diffusion)**: A/B 두 성분이 확산+반응하는 시스템. 화면은 보통 B 성분 기반으로 스타일 렌더링.
>   - A system where two components (A/B) diffuse and react; rendering is typically based on the B component.
> - **붕괴(수렴/클램프) / Collapse (convergence / clamp)**: 파라미터가 너무 강해져 패턴 대신 균일한 색(전부 검정/회색/흰색)으로 고정되는 상태
>   - When parameters become too strong and the result gets stuck at a uniform color (all black/gray/white) instead of patterns.

---

## Image 탭 (입력 이미지 처리) / Image Tab (Input Image Processing)

이 탭은 “이미지에 무엇을 먼저 적용한 뒤, 그 결과로 이펙트가 진행될지”를 제어합니다.

This tab controls what gets applied to the image first, and which processed result is then used to drive the effect.

- **Invert Image**
  - 시드 이미지를 흑↔백 반전합니다.
  - 결과적으로 RD가 목표로 삼는 targetB가 바뀌어 패턴의 전체 톤/구성이 크게 달라집니다.
  - _EN: Inverts the seed image (black ↔ white)._ 
  - _EN: This changes the RD target (targetB), which can significantly shift overall tone and composition._

- **Vignette (On/Off)**
  - 시드 이미지에 비네트를 **먼저 bake**합니다(오버레이가 아니라 시드 픽셀 자체가 어두워짐).
  - RD는 이 “비네트가 먹은 이미지”를 보고 패턴을 생성합니다.
  - _EN: Bakes the vignette into the seed first (not an overlay; the seed pixels themselves get darker)._ 
  - _EN: RD generates patterns based on this vignetted seed image._

- **Vignette strength (0~1)**
  - 0: 비네트 없음
  - 1: 가장자리 감쇠가 강함(가장자리쪽은 훨씬 어두운 시드)
  - 강도가 너무 높으면, 가장자리 시드가 과도하게 어두워져 targetB가 특정 값으로 치우치고
    패턴이 가장자리에서 죽거나(균일화) 중앙만 남는 형태가 될 수 있습니다.
  - _EN: 0 = no vignette._
  - _EN: 1 = strong edge falloff (edges become much darker in the seed)._
  - _EN: If too strong, edge pixels get overly dark, targetB becomes biased, and patterns may die at the edges (uniform) leaving only the center._

- **Auto Levels (On/Off)**
  - 시드의 밝기 범위를 자동으로 확장/정규화해서 **회색이 뭉개지는 문제를 줄이고**, 콘트라스트를 확보합니다.
  - _EN: Automatically expands/normalizes the seed brightness range to reduce “mushy gray” and recover contrast._

- **Auto-level strength (0~1)**
  - 0: 오토레벨 효과 없음
  - 1: 오토레벨 완전 적용
  - 너무 강하게(1.0) 계속 쓰면 이미지가 과도하게 대비가 커지고(특히 노이즈/그레인이 있는 원본에서)
    시드가 ‘너무 딱딱한’ 흑백으로 변해 RD가 특정 고정점으로 빠질 때가 있습니다.
  - _EN: 0 = no auto-levels effect._
  - _EN: 1 = full auto-levels applied._
  - _EN: If kept too strong (1.0), contrast can become excessive (especially with noisy/grainy inputs); the seed becomes overly hard black/white and RD may fall into a fixed point._

**붕괴(전체 회색/흰색/검정색)와 관련된 Image 탭 원인 / Image-tab causes of collapse (flat gray/white/black)**
- Auto-level strength를 높게 + Invert 조합에서 시드가 거의 0/1로 양자화처럼 보이면
  RD가 targetB에 강하게 잠기면서 패턴 다양성이 줄어듭니다.
- Vignette strength가 너무 높으면 가장자리가 과도하게 죽어(균일), 화면이 ‘테두리 고정’처럼 보일 수 있습니다.

_EN:_
- With high auto-level strength + invert, if the seed looks almost quantized to 0/1, RD can lock onto targetB and lose pattern variety.
- If vignette strength is too high, edges can become overly uniform, making the screen look “edge-fixed.”

---

## Effect 탭 (시뮬레이션/렌더링) / Effect Tab (Simulation / Rendering)

### Preset
- **Preset(F/K 조합)**
  - RD의 대표 조합들. 같은 이미지라도 패턴 타입(점, 웜, 미로)이 완전히 달라집니다.
  - _EN: A set of representative RD parameter pairs. Even with the same image, the pattern type (spots, worms, maze) can change completely._

### Simulation
- **F (Feed rate)**
  - A를 “공급”하는 정도(시스템에 새 물질이 들어오는 느낌).
  - 일반적으로 F가 커지면 패턴이 더 촘촘/단순화되거나 특정 고정점으로 수렴할 수 있습니다.
  - _EN: How much A is “fed” into the system (like adding new material)._
  - _EN: Increasing F often makes patterns denser/simpler, and can push the system toward a fixed point._

- **K (Kill rate)**
  - B를 “제거”하는 정도.
  - K가 커지면 B가 쉽게 사라져 패턴이 약해지거나(밋밋), 반대로 특정 영역만 남는 식으로 수렴할 수 있습니다.
  - _EN: How much B is “killed/removed.”_
  - _EN: Higher K can make patterns fade (B disappears easily), or converge into only certain regions remaining._

- **dA / dB (Diffusion)**
  - 확산 계수. 높을수록 번짐/평균화가 강해집니다.
  - dA/dB가 너무 크면 패턴이 매끈해지다가 결국 균일(회색/단색)로 수렴하기 쉽습니다.
  - _EN: Diffusion coefficients; higher values increase blurring/averaging._
  - _EN: If too large, patterns get smooth and can converge to uniform (gray/solid) states._

- **dt (timestep)**
  - 한 번 업데이트의 스텝 크기.
  - 너무 크면 수치적으로 불안정해져 클램프(0~1)로 몰리며 화면이 한 톤으로 덮일 수 있습니다.
  - _EN: Step size per update._
  - _EN: If too large, the simulation can become numerically unstable, clamp to 0–1, and cover the screen with a single tone._

- **Steps (stepsPerFrame)**
  - 프레임당 시뮬레이션 반복 횟수.
  - dt × steps 가 사실상 “시간 진행 속도”라서, 둘 중 하나가 과하면 패턴이 너무 빨리 고정점으로 들어갑니다.
  - _EN: Number of simulation iterations per frame._
  - _EN: Since `dt × steps` is effectively the “time speed,” too much of either can push the system into a fixed point too quickly._

### Seed pattern
- **Bias X/Y**
  - 라플라시안 샘플 가중치를 약간 비틀어 방향성을 만듭니다.
  - 값이 과하면 한쪽 방향으로 흐르는/쏠리는 느낌이 강해지며, 패턴 균형이 깨질 수 있습니다.
  - _EN: Slightly skews Laplacian sampling weights to introduce directionality._
  - _EN: If too strong, flow/bias can dominate and the pattern balance may break._

- **Warm start**
  - **무엇인가?**
    - reseed(시드 갱신) 직후, 화면이 “빈/검정” 상태에서 천천히 올라오길 기다리지 않고 **시뮬레이션 스텝을 미리 여러 번 실행**해서 패턴을 빠르게 형성합니다.
    - _EN: After reseed, it runs extra simulation iterations so patterns appear sooner instead of slowly forming from a blank/black state._
  - **언제 실행되나?**
    - 보통 “처음 로딩 직후 / 이미지 변경 / Reseed” 같은 이벤트에만 실행됩니다.
    - 평상시(steady-state) 프레임에는 직접 영향을 주지 않습니다(단, warm start 중에는 그 시간만큼 CPU/GPU가 더 사용됨).
    - _EN: Typically runs only right after startup / image change / reseed events._
  - **UX/성능에 미치는 영향**
    - 값이 클수록 “패턴이 빨리 보이는” 대신, reseed 직후 **잠깐의 지연(버벅임)** 이 커질 수 있습니다.
    - 특히 저사양/모바일에서는 warm start가 “로딩이 느린 것처럼” 느껴지는 가장 큰 원인이 될 수 있습니다.
    - _EN: Higher values make patterns show up faster, but increase short-term stutter after reseed. On low-end/mobile, it can be the main cause of perceived slowness._
  - **권장 설정(웹 UX 기준, 제안)**
    - 기본값은 “중간 정도”가 안전합니다: 예) **120~240**
      - 첫 인상(검정 화면 시간)을 줄이면서도, reseed 때 UI가 완전히 멈추는 느낌을 줄입니다.
    - 저사양을 우선하면: **0~120**
    - 데스크톱/고사양을 우선하면: **240~480**
    - _EN: A moderate default (e.g., 120–240) is usually safest for web UX; lower values for low-end devices, higher for desktop/high-end._
  - **주의(“붕괴”와의 관계)**
    - Warm start는 “붕괴 자체”를 직접 만들기보다는, 이미 붕괴로 가는 파라미터 조합일 때 **그 상태에 더 빨리 도달**하게 만들어 체감상 “갑자기 회색/흰색이 됨”을 강화할 수 있습니다.
    - 붕괴가 잦다면, 문제 해결/디버깅 시에는 warm start를 **일시적으로 낮추거나 0으로** 두는 것이 안전합니다.
    - _EN: Warm start doesn’t usually cause collapse by itself, but it can reach a collapsing fixed point faster. When debugging collapse, temporarily lower it or set to 0._
  - **구현 메모(참고)**
    - warm start는 한 번에 전부 돌리면 메인 스레드가 막힐 수 있어, 여러 프레임으로 **분할 실행**(requestAnimationFrame로 yield)하는 방식이 UX에 유리합니다.
    - _EN: Splitting warm start across frames (yielding via requestAnimationFrame) avoids blocking the main thread and improves UX._

- **Source strength**
  - 시드(sourceTexture)가 시뮬레이션을 “얼마나 강하게 끌어당길지”를 정합니다.
  - 매우 중요: 값이 너무 크면 B가 targetB로 과하게 고정되어 화면이 쉽게 단색/단조로 수렴합니다.
  - _EN: How strongly the seed (sourceTexture) “pulls” the simulation._
  - _EN: Critical: if too high, B locks onto targetB and the screen easily converges to a flat/monotone state._

- **Sim scale**
  - 시뮬레이션 해상도 스케일. 낮추면 빠르지만 디테일이 줄고, 패턴이 뭉개져 한 톤으로 보일 수 있습니다.
  - _EN: Simulation resolution scale. Lower is faster but loses detail; patterns can blur into a single tone._

### Display
- **Style**
  - 결과(B 등)를 어떤 색맵으로 보여줄지.
  - _EN: Which colormap/style to use for displaying the result (B, etc.)._

- (Style 7) **Threshold / DuoTone colors / Invert Colors**
  - Threshold가 높으면 두 톤이 단단해져 “검/흰”으로 확 갈라집니다.
  - Threshold가 너무 극단이면 화면이 거의 검정/흰색으로만 보일 수 있습니다(표현 방식 문제이지 시뮬레이션 자체 붕괴와는 다를 수 있음).
  - _EN: Higher threshold hardens the two-tone split (strong black/white separation)._
  - _EN: If extreme, the screen may look almost purely black/white (this can be a display choice rather than a true simulation collapse)._

**붕괴와 관련된 Effect 탭 원인(체크리스트) / Effect-tab causes of collapse (checklist)**
- 화면이 전체 회색/흰색/검정색으로 덮일 때, 보통 우선순위는:
  1) **Source strength 과함**
  2) **dt × steps 과함(수치적 과진행)**
  3) dA/dB 과함(평균화)
  4) F/K가 패턴 영역 밖(고정점 영역)

_EN: When the screen turns into flat gray/white/black, the usual priority order is:_
1) Source strength too high
2) `dt × steps` too high (numerical over-advancing)
3) dA/dB too high (over-averaging)
4) F/K outside the pattern region (fixed-point region)

복구 요령 / Recovery tips:
- Reseed
- Source strength 낮추기
- dt 낮추기 또는 Steps 낮추기
- Preset로 돌아가기

_EN:_
- Reseed
- Reduce source strength
- Reduce dt or reduce steps
- Go back to a known preset

---

## Brush 탭 (보이지 않게 ‘교란’만 크게) / Brush Tab (Keep it Invisible, Keep the Disturbance)

브러쉬는 원형으로 “칠하는” 방식이 아니라, 원 내부에서 노이즈 기반으로 **듬성듬성 영향 픽셀을 고른 뒤(B/A를 살짝 흔듦)** 패턴을 불안정하게 만드는 구조입니다.

The brush doesn’t “paint a solid circle.” Instead, inside the radius it uses noise to select sparse pixels and slightly perturbs A/B, making the pattern unstable.

- **Radius**
  - 브러쉬 영향 반경.
  - 커질수록 넓은 면적이 교란되지만, 너무 크면 ‘전체를 흔드는 느낌’으로 제어가 어려울 수 있습니다.
  - _EN: Brush influence radius._
  - _EN: Larger affects a wider area, but too large can feel like shaking the whole screen and becomes harder to control._

- **Edge (Feather)**
  - 원 경계를 부드럽게 하는 페이드.
  - 값을 올리면 “동그란 도장 자국”이 줄고 더 자연스럽게 교란됩니다.
  - _EN: Fade/feather on the circle boundary._
  - _EN: Higher values reduce the “round stamp” look and make disturbance feel more natural._

- **Power**
  - 최종 영향(influence) 증폭.
  - 교란 강도 체감이 커지지만, 과하면 패턴을 한쪽으로 밀어버려 단색 고정점으로 빨려 들어갈 수 있습니다.
  - _EN: Amplifies final influence._
  - _EN: Makes disturbance feel stronger, but too high can push patterns into a flat-color fixed point._

- **Noise**
  - 노이즈 샘플 스케일(점 분포의 크기).
  - 낮으면 큰 얼룩 덩어리, 높으면 촘촘한 미세 점.
  - _EN: Noise sampling scale (size of the speckle distribution)._
  - _EN: Lower = larger blotches; higher = dense fine speckles._

- **Speckle**
  - “영향 픽셀을 얼마나 드물게 만들지(마스킹 강도)”에 가장 가까운 값.
  - 높이면 영향 픽셀이 줄어들어 브러쉬가 ‘보이지 않게’ 됩니다.
  - _EN: Closest to “how sparse the affected pixels are” (masking strength)._
  - _EN: Higher = fewer affected pixels, making the brush more invisible._

- **Delta**
  - B/A를 실제로 흔드는 변화량 스케일.
  - 교란이 부족하면 Delta를 올리되, Power까지 같이 올리면 과해질 수 있어 우선순위는 Delta → Power 순을 추천.
  - _EN: The actual magnitude of A/B perturbation._
  - _EN: If disturbance is insufficient, increase Delta first. Increasing Power together can overshoot, so prefer Delta → Power._

**“투명하지만 교란은 크게” 추천 튜닝 출발점 / Suggested starting point for “invisible but strong disturbance”**
- Edge: 0.65 ~ 0.85
- Speckle: 0.65 ~ 0.90 (투명하게 만드는 핵심)
- Delta: 0.08 ~ 0.18 (교란량)
- Power: 1.0 ~ 1.8 (필요할 때만)
- Noise: 1.2 ~ 3.0 (미세 교란) / 0.5 ~ 1.0 (큰 덩어리 교란)

_EN notes:_
- Speckle is the key to invisibility.
- Delta controls disturbance amount.
- Increase Power only when needed.
- Noise: higher for fine disturbance; lower for larger blobs.

브러쉬가 “원형으로 보인다”면 / If the brush still looks circular:
- Speckle을 올리고
- Edge를 올리고
- Power를 너무 올리지 말고 Delta 중심으로 조절

_EN:_
- Increase Speckle
- Increase Edge
- Avoid pushing Power too high; tune mainly with Delta

---

## Title 탭 / Title Tab

- **Text / Show**
  - 텍스트 변경 및 표시 여부.
  - _EN: Change the text and toggle visibility._

- **Position (Center / Top / Bottom)**
  - Top/Bottom의 경우 화면 높이의 5% 지점 기준으로 배치.
  - _EN: For Top/Bottom, position is anchored at 5% of screen height._

- **Size %**
  - 화면의 짧은 변 기준 비율로 폰트 크기 설정.
  - _EN: Font size as a percentage of the shorter screen dimension._

- **Color / Stroke / Shadow**
  - 타이틀 렌더링 스타일.
  - _EN: Title rendering style._

타이틀은 또한 “브러쉬 영향 방지 마스크”로도 사용됩니다(타이틀 영역에 브러쉬가 잘 안 먹도록).

The title is also used as a “brush-blocking mask,” so the brush affects the title area less.
