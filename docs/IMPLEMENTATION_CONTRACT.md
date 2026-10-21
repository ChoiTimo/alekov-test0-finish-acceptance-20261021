# 보안 Agent 개발·확인 계약 v0.2

기준: 오너의 2026-10-12 목표 요청, 채널 675→676→677과 693의 경쟁·AI 피드백 정정, PLAN.md v0.2, 719/720의 경쟁·최종 확정·차수 제어 정책. 학생 연결 구현 수용은 채널 712→714를 따른다. 이 문서는 로컬 구현 계약이며 운영 개방·게시·점수표 확정이 아니다.

학생 동선은 ALEPH 단계 안내 → PC의 Workbench 작업 폴더에서 개발 → 앱 실행 → ALEPH 제출·해당 단계의 원문 판정 → 다음 단계다. CLCO는 AI 게이트 서버다. 기존 프로젝트를 보존해 이어 쓰거나, 3차를 끝내지 못했으면 4차 시작 틀로 새 폴더에서 출발한다. 시작한 프로젝트 하나를 22단계까지 사용한다. CLCO에 수업 단계·정답·점수표를 넣지 않으며 앱 실행에 Workbench 상시 실행을 요구하지 않는다.

## 학생 앱 HTTP 계약

응답은 `{ok:true,data:...,meta:{mode,checkedAt}}` 또는 `{ok:false,error:{code,message,retryable},meta:{mode,checkedAt}}`다. mode는 connected/demo/disconnected 중 하나다. demo는 예제 데이터이며 실제 연결 성취가 아니다. 기본 실행은 연결 없음을 표시한다.

| 메서드·주소 | 동작·입력 | 데이터 |
|---|---|---|
| GET /api/me | 기존 서버의 현재 로그인·기기 상태 | user:{id,label}, device:{id,label,status}, session:{id,status} |
| GET /api/apps | 현재 사용자에게 보이는 업무 앱 | [{id,name}] |
| POST /api/access | {appId}를 기존 서버에 전달 | appId, decision:allow/deny/challenge/unknown, reason, checkedAt |
| GET /api/events | 현재 사용자 범위의 접속·XDR 기록 | [{id,kind,at,appId,summary,evidence:[{id,text}],rules:[{id,text}],state,supportedActions}] |
| GET /api/devices, /api/sessions | 기존 서버 정보 | 현재 사용자에게 속한 목록 |
| POST /api/ai/explain | {eventId}; 서버가 사건 근거를 읽어서 전달 | 검증된 설명; AI 실패는 기존 접속·기록과 분리 |
| POST /api/ai/check | {}; 현재 앱 자격·권한과 모델 목록 확인 | 모델 점검 결과와 비밀 없는 도움정보; 생성 모델 호출 없음 |
| POST /api/ai/connect/start | {}; 앱 전용 연결 시작 | 연결 ID·확인 번호·승인 링크·기한·승인 대기 상태 |
| POST /api/ai/connect/finish | {connectionId}; 승인 확인 작업 접수 | 202 checking; 확인 작업은 HTTP 응답 종료 후에도 계속 |
| POST /api/ai/connect/status | {connectionId}; 현재 진행 조회 | 연결 완료·대기·실패·확인 불가 등 고정 상태 |
| POST /api/ai/connect/cancel | {connectionId}; 현재 진행 중단 | 승인 대기는 cancelled, 이미 발급됐을 수 있는 확인 중 취소는 unknown |
| GET /api/diagnostics | 비밀없는 연결 점검 | 서비스 상태·오류 코드·버전·시각 |

브라우저는 AI 열쇠·기존 서버 인증 비밀을 알지 못한다. 서버의 기존 사용자 인증 계약을 재사용하는 adapter가 준비되지 않으면 connected로 표시하지 않는다. 로컬 서버는 loopback만 사용한다. JSON 실패를 200 성공으로 바꾸지 않는다.

AI 연결은 기존 Workbench 로그인 승인 화면을 재사용하며 앱 전용 자격을 별도 보관함에 저장한다. 완성 앱은 같은 보관함의 자격으로 CLCO에 직접 요청한다. Workbench 자격 복사나 Workbench 상시 실행으로 대신하지 않는다. 연결 완료는 저장 확인과 현재 신원 검증 결과이며 단계 통과를 뜻하지 않는다. 연결 결과를 확인하지 못하면 자동 재발급·회수하지 않고 상태 확인을 안내한다.

호스트에서 현재 활성 엔진·검증된 AI 신원 매핑·동일 앱 보관함과 명시적 활성 설정을 연결해야 한다. 기본 실행에서는 이 기능을 켜지 않으며 네 연결 경로가 준비되지 않았다는 안내를 반환한다. 실제 로그인·프로젝트 등록·앱 승인 원천은 아직 운영 연결 전이다. 공개 입력의 연결 ID와 승인 링크는 서버 권한을 대신하지 않는다.

## 담당·제출

Claude는 학생 화면·연결 관리자·프롬프트와 교재·실행 도구를 채널 705의 파일 배정에 따라 구현하며, 723의 후속 8묶음에 따라 전체 리뷰·대기 상태 수정·교재 정합성·경쟁 표시·마스터 화면·최종 실행 안내를 이어간다. Codex는 서버·권한·평가 계약을 정하고 담당 파일을 분리해 통합과 독립 검수를 맡는다. 새 그림은 오너 지시에 따라 Higgsfield MCP의 GPT Image 2.5로 제작한다. 로컬 구현 수용은 운영 배포나 DB 변경 권한을 뜻하지 않는다.

13~22 프롬프트에는 목적, 같은 프로젝트 보존, 제공/학생 구현 구분, 위 API와 실패 처리, 스스로 확인할 행동, 수정·되돌리기, 제출·공개 기준을 모두 적는다. 새 공식 R4 v0.6의 13~20 접수는 기존 필수 AI 원문 판정을 따르며, 기존 v0.5 결과에는 소급 적용하지 않는다. 21·22의 승인된 접수는 별도 source-review-21-22-v1로 같은 commit의 문서·실행 코드·설정·잠금 파일을 대조한다. actualExecutionVerified는 false이고, 22단계 재현 기록은 student_statement다. 원문 판정을 실행·시연 성공 인증으로 바꾸지 않는다. 점수·순위 산식을 새로 정하거나 기존 성취·감사 이력을 바꾸지 않는다.

공식 과제 문서의 21·22단계에 남은 native v0.5 자동 확인·실행 안내는 현재 원문 검토 profile이 코드를 실제 실행했다는 뜻이 아니다. 해당 단계의 학생 활동 목표는 유지하며, 서버의 검토 방식과 학생이 직접 수행한 재현 기록을 구분한다.

경쟁은 전체 1~22단계의 통과와 최초 통과한 서버 접수 시각을 기준으로 집계한다. 반 전체 달성률이 같으면 그 달성률에 먼저 도달한 반이 앞선다. 채널 719에 따라 정시/늦음·onTime/withLate·늦은 통과 구분은 집계와 순위에서 제거한다. 기존 1~3차의 원래 접수·성취·감사 기록은 보존하되 이 새 경쟁에 지각 구분을 다시 넣지 않는다. 4차 이후 권장 기한은 제출 차단·감점·지각 배지가 아니다.

채널 720에 따라 마지막 차수 뒤 반 평가와 순위를 한 번만 최종 확정한다. 그 전의 집계는 현재 진도와 잠정 순위로 표시한다. 정확한 집계 시각·집계 이후 개인 진행 인정 기간·MCP 가산 및 공식 운영 적용은 미확정이며 안내문에서 임의 확정하지 않는다. 현재 13~22 후보 projection과 로컬 검수 결과는 전체 경쟁의 공식 게시를 뜻하지 않는다.

4차 13~16, 5차 17~20, 6차 21~22에는 반 전체 개방·복원·한국시간 예약을 대응시킨다. 새 앱 학습 개방 제어를 연결하며 legacy wave4/final이나 R6.1 product D1~D4를 이 단계의 개방으로 대체하지 않는다. 현재 이 방향은 Codex의 통합 계약이며 서버 제어·운영 적용은 미완성이다. 복원은 원래 접수와 성취 기록을 보존해야 하고, 화면만 복원됐다고 표시하지 않는다. 기존 prototype의 고정 정책 파일은 실제 마스터 개방·복원·예약 원천을 대신하지 않는다.

채널716의 운영 집계 규칙을 따른다. 시험반을 제외할 때는 test-0 한 이름 대신 test- 접두사를 기준으로 식별한다. 시험1반은 AI 게이트 전용이며 방어전·출결·학습·순위 참여 명단에 추가하지 않는다. 기존 방어전의 명시적 시험0반 참여 예외와 승인된 Timo 검사 동선은 보존한다. 실제 경쟁 원천과 공식 집계는 이 분류·예외를 대조한 뒤 연결해야 하며, 후보 모듈의 로컬 실행을 운영 명단 필터 적용으로 인정하지 않는다.

## 마무리 단계 꾸밈 계약 (student/appearance.json, 로컬 소스 후보)

학생이 선택해 직접 만드는 `student/appearance.json`(schema `alekov.student-appearance.v1`)과 그 파일이 고른 같은 출처 그림 최대 2개(`student/assets/brand-icon.png`, `student/assets/start-picture.png` 또는 `.webp`)로 앱 이름·화면 아이콘·첫 화면 그림·색 테마(accent·background·surface)·학생 영역 카드 배치(`default`·`student-first`·`compact`)만 정한다. 파일이 없으면 기존 화면 그대로다. 시작 틀은 예시 꾸밈 파일을 `student/`에 넣지 않으며 예시는 문서에만 있다.

| 메서드·주소 | 데이터 |
|---|---|
| GET /student/appearance.json | 정규화 DTO `alekov.student-appearance.view.v1`: state(absent/applied/invalid), appName, icon, startPicture, dashboardPreset, 보정된 palette, problem(code·file·field·message) |
| GET /student/appearance.css | 검증·보정된 `--accent`·`--accent-soft`·`--bg`·`--surface` 선언만. 꾸밈이 없거나 잘못되면 주석만 |
| GET /student/assets/{brand-icon.png, start-picture.png, start-picture.webp} | 유효한 꾸밈이 고른 그림만. 그 밖의 student 파일·목록·업로드 route는 없음 |

- 검증기는 `src/student-appearance.mjs` 하나이며 서버 route·설치형 UI projection·`package-app`이 같은 규칙을 쓴다. 고정 키·문자열·hex6 색·고정 preset만 받고 HTML·CSS·JS·selector·URL·data URI·SVG·절대/상위 경로와 권한·진도·native·AI·모델·manifest 출처 필드를 거절한다. 같은 키 중복·모르는 키·잘못된 형식은 코드와 항목 이름으로 알린다.
- 꾸밈은 표시 데이터이며 권한·판정·승인의 입력이 아니다. 상태 의미 색(allow·deny·challenge·unknown·focus·student)은 고정이고, 대비 보정은 도구 가독성용 순수 계산이며 통과 조건이 아니다.
- HTTP·meta CSP 원문은 바꾸지 않는다. 화면은 textContent·DOM API로만 적용하고, 배치는 같은 메뉴 안 DOM 순서만 바꾼다(보이는 순서 = 읽기·탭 순서, 삭제·숨김·비활성·탭 간 이동 없음). 꾸밈 오류는 짧은 안내 뒤 기존 화면이며 로그인·AI·조치·확인 불가 경로를 막지 않는다.
- 설치형 projection은 원 appRoot의 꾸밈 원본 byte를 같은 검증기로 읽어 student origin·SHA로 복사하고, 링크·교체·검증 뒤 변경은 거절하며, 정리는 자기 사본만 지운다. 포장은 기존 student 파일 목록·SHA로만 결속하고 새 manifest 필드나 승인 기록을 만들지 않는다. 명시 `--app-name`·`--iconPath`가 꾸밈과 다르면 파일·이유를 알리고 멈춘다.
- 이 계약은 로컬 소스 후보다. 학생 배포 판(시작 틀 판 올림·updater)·실제 PC 관측·독립 검수는 별도이며 13~22 판정과 마무리 판정 기준(F1~F6·Q)을 바꾸지 않는다.

## 검수 경계

로컬 합성 사용자·HTTP fixture·PC 브라우저는 구현 증거다. 실제 시험 계정의 ALEPH→PC Workbench 작업→앱 실행→제출 전 과정, 운영 열쇠, 유료 모델, 배포·점수 반영은 별도 증거가 필요하다. 이전 R6.1의 D1~D4·41종 평가·기간 차단은 이 새 흐름에 연결하지 않는다.
