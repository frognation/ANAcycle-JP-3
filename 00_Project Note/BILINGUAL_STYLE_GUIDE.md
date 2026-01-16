# Project Notes Bilingual Style Guide / 프로젝트 노트 한/영 병기 규칙

이 폴더의 문서들은 **한국어(원문) + 영어(번역)**를 함께 유지합니다.

Documents in this folder are maintained in **Korean (source) + English (translation)**.

---

## 기본 원칙 / Core Rules

1) 한국어를 먼저 씁니다.

Write Korean first.

2) 바로 아래 줄(또는 같은 항목의 다음 줄)에 영어를 씁니다.

Put the English translation immediately below (or the next line within the same item).

3) 의미를 바꾸지 말고, 용어는 일관되게 유지합니다.

Do not change meaning; keep terminology consistent.

4) 기술 용어/변수명은 가능한 원문 그대로 유지하고, 필요하면 설명을 영어로 보강합니다.

Keep technical terms/variable names as-is when possible, and add English clarification when needed.

---

## 권장 포맷 / Recommended Formatting

### 제목/헤더 / Titles & Headings

- 권장: `한글 헤더 / English Heading`
- 또는: 한글 헤더 다음 줄에 영어 헤더(같은 레벨)

Recommended: `Korean Heading / English Heading`,
or put the English heading on the next line with the same heading level.

### 본문 문단 / Body Paragraphs

- 한국어 문단
- 영어 문단(바로 아래)

Korean paragraph first, then the English paragraph right after.

### 리스트 / Lists

- 원문 체크/항목은 그대로 유지
- 같은 항목 아래에 `EN:` 서브 불릿으로 번역 추가

Keep the original list item intact, then add an `EN:` sub-bullet under it.

예시 / Example:

- 기능 설명(한글)
  - EN: Feature description (English)

### 블록 인용(용어/주의) / Blockquotes (Terminology / Notes)

- `> 한글 / English` 형태로 라인마다 병기 권장

Prefer bilingual per line: `> Korean / English`.

---

## 번역 톤 / Translation Tone

- 짧고 정확하게(기술 문서 톤)
- 과한 의역보다 용어 대응을 우선
- “붕괴/수렴/클램프”처럼 프로젝트 고유 용어는 괄호로 영어를 고정

Keep it concise and technical. Prefer consistent term mapping over creative paraphrasing. For project-specific terms, keep a fixed English mapping in parentheses.

---

## 변경 시 체크 / Change Checklist

- [ ] 한글 내용이 빠지지 않았는가?
- [ ] 영어가 바로 옆(또는 바로 아래)에 붙어 있는가?
- [ ] 숫자/범위/변수명(예: `dt`, `stepsPerFrame`, `targetB`)이 원문과 동일한가?
- [ ] 새로 추가한 용어가 있으면 용어 섹션에 반영했는가?

- [ ] Is any Korean content missing?
- [ ] Is the English placed immediately next to/below?
- [ ] Are numbers/ranges/variable names identical to the source?
- [ ] If new terminology was introduced, did you update the terminology section?
