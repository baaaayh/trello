# Realtime Collaborative Kanban Board (Trello Clone)

Drag & Drop 기반 실시간 협업 보드  
Optimistic UI · Realtime Sync · Activity Log

---

## Project Overview

Trello를 참고하여 구현한 실시간 협업 보드입니다.

다음과 같은 문제를 고민하며 구현했습니다.

- Drag & Drop 환경에서의 상태 관리 복잡도
- 네트워크 지연 상황에서의 UX 저하 문제
- 카드 단위 변경 이력 관리 설계
- Realtime 환경에서의 데이터 동기화 흐름 이해

---

## Tech Stack

### Frontend

- React
- dnd-kit
- TanStack Query
- Zustand
- Tailwind CSS

### Backend

- Supabase (Database / Auth)

### Realtime

- Supabase Realtime (WebSocket 기반 구독)

### Runtime & Deployment

- Vite
- Vercel

---

## Architecture

### 1. 상태 구조 (정규화 설계)

Drag & Drop 성능과 유지보수성을 고려하여  
카드 데이터를 id 기반으로 정규화했습니다.

```js
{
  containers: {
    inbox: [cardId, cardId],
    listId: [cardId, cardId]
  },
  cardsById: {
    cardId: { ...cardData }
  },
  containerOrder: [...],
  listMetaById: {...}
}
```

#### 설계 의도

- 카드 접근 O(1) 유지
- 이동 시 최소 범위만 변경
- 리렌더링 범위 최소화
- 리스트와 카드 관심사 분리

---

### 2. Drag & Drop 구조

dnd-kit을 활용하여 카드 이동을 구현했습니다.

초기 구현 단계에서는 복잡한 분기와 충돌 처리가 발생했으며,  
AI를 이용헤 구조를 구성한 뒤
동작 원리를 이해하며 상태 변경 로직을 정리했습니다.

현재는 다음 케이스를 분리하여 처리합니다.

- LIST 순서 변경
- LIST ↔ LIST 이동
- LIST 내부 순서 변경
- LIST → INBOX 이동
- INBOX → LIST 이동
- INBOX 내부 순서 변경

DnD 로직은 `useBoardDnd` 커스텀 훅으로 분리하여  
UI 레이어와 상태 변경 책임을 구분했습니다.

---

### 3. 데이터 흐름

```
Supabase (Server)
        ↓
TanStack Query (Server State)
        ↓
로컬 정규화 상태
        ↓
View (Board / Inbox / List / Card)
```

TanStack Query를 서버 상태 관리 레이어로 사용하고,  
로컬 상태는 UI 반응성을 위해 관리합니다.

---

## Optimistic Update Strategy

TanStack Query의 `onMutate`를 활용하여 다음과 같이 처리합니다.

1. 기존 상태 스냅샷 저장
2. UI 즉시 반영
3. 요청 실패 시 롤백
4. 요청 완료 후 invalidate

Drag & Drop 이동 시 네트워크 지연으로 인한 UX 저하를 줄이는 데 목적이 있습니다.

---

## Realtime Synchronization

Supabase Realtime을 활용하여 카드 및 리스트 변경 이벤트를 구독합니다.

- 변경 이벤트 수신 시 관련 Query invalidate
- 서버 상태를 다시 fetch하여 동기화

현재는 Realtime 이벤트 수신 시  
직접 상태 병합이나 충돌 해결 로직은 구현되어 있지 않으며,  
invalidate 기반 재동기화 전략을 사용합니다.

---

## Activity Log

카드 단위 변경 이력을 기록하는 로그 시스템을 설계했습니다.

### 저장 액션 유형

- created
- transfer
- update
- complete
- archive

Activity와 Comment를 분리 테이블로 정규화했으며,  
프론트엔드에서 병합하여 타임라인 형태로 렌더링합니다.

---

## Troubleshooting

### 1. State와 Query 로직 분리

초기 구현에서는 Drag & Drop 이벤트 내부에서  
`queryClient.setQueryData`를 직접 수정하는 방식으로 처리했습니다.

하지만 `onDragOver` 단계에서 분기 로직이 과도하게 증가했고,  
서버 상태와 UI 인터랙션 로직이 강하게 결합되는 문제가 발생했습니다.

#### 문제점

- 분기 로직 증가로 가독성 저하
- 불변성 관리 복잡성 증가
- 디버깅 난이도 상승
- 인터랙션 단계에서 서버 상태를 직접 변경하는 구조적 부담

#### 해결

- Drag & Drop 인터랙션은 로컬 정규화 상태에서만 처리
- Drop 시점에만 mutation 실행
- Realtime 이벤트 수신 시 invalidate 기반 재동기화

이를 통해 UI 반응성과 서버 상태 관리의 책임을 분리했습니다.

---

## Troubleshooting

### DnD 로직 복잡도 증가 문제

초기에는 DnD 이벤트 내부에서 `queryClient.setQueryData`를 직접 수정하는 방식으로 구현했습니다.

하지만 서버에서 받아온 중첩 구조(lists → cards)를 그대로 수정해야 했기 때문에,
이동 로직마다 Query 데이터를 펼쳐 반복문으로 탐색한 뒤
일치하는 데이터를 찾아 수정하고 다시 반환해야 했습니다.

이 과정에서 코드 복잡도가 급격히 증가했습니다.

#### 문제점

- 중첩된 Query 데이터를 직접 순회하며 수정해야 하는 구조
- 카드 이동 시 여러 배열을 탐색해야 하는 반복문 증가
- 불변성 유지를 위한 깊은 복사 로직 추가
- 수정 범위 추적이 어려워 디버깅 난이도 상승
- 서버 상태와 UI 인터랙션 로직이 강하게 결합

#### 해결

- Drag & Drop 인터랙션은 로컬 정규화 상태에서만 처리
- 카드 데이터를 id 기반으로 정규화하여 O(1) 접근 구조로 변경
- `containerId` 계산 로직을 별도 함수로 분리
- DnD 타입을 명확히 정의하고 early return 처리
- Drop 시점에만 mutation 실행 후 invalidate 기반 재동기화

이를 통해 이동 로직을 단순 배열 조작 수준으로 축소했고,
서버 상태와 UI 상태의 책임을 분리하여 코드 가독성과 안정성을 개선했습니다.
