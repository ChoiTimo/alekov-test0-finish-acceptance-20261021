# 한정 재현 검수의 실제 호출 절차

2026-10-23 05:55:47 UTC에 수행한 검수 helper의 동작을 공개 가능한 형태로 기록합니다. 실제 실행 파일은 검수자 증거 위치에 보관돼 있으며, 아래는 절대경로·비공개 결과 파일 저장 부분을 제외한 호출 순서입니다. **이 문서 추가 후 새 실행은 하지 않았습니다.**

1. 기존 시험0 폴더에서 `git rev-parse HEAD`, `git status --short`, `node --version`과 `package.json`을 읽었습니다. 실행 대상 코드 커밋은 d72bb6f964399e239ddf4bd83845b45b3e773d28, Node v24.19.0이었습니다.
2. `node --check student/extension.mjs`를 실행했고 종료 코드 0을 확인했습니다.
3. 실제 helper는 `src/server.mjs`의 `createOnServer`를 Node ESM으로 불러와 다음 순서로 실행했습니다. 상대 import로 표현했지만 실제 helper는 같은 기존 폴더의 파일 URL을 사용했습니다.

```js
import {createOnServer} from '../src/server.mjs';
const server = createOnServer({aiEnv: {}});
await new Promise((ok, no) => {
  server.once('error', no);
  server.listen(0, '127.0.0.1', ok);
});
const base = 'http://127.0.0.1:' + server.address().port;
for (const path of ['/', '/app.js', '/student/extension.mjs', '/api/diagnostics', '/api/me']) {
  const response = await fetch(base + path, {signal: AbortSignal.timeout(10000)});
  const body = await response.text();
  // helper는 status와 비밀 없는 error.code/engine.mode/시각만 증거에 기록했습니다.
}
server.closeAllConnections();
await new Promise(ok => server.close(ok));
```

4. 같은 `createOnServer({aiEnv:{}})`와 GET 5개를 다시 실행했습니다. 첫 번째 서버만 위 `close()` 완료를 관찰했습니다. 두 번째 서버는 Chrome 화면 읽기를 위해 유지했다가 탭과 실행 핸들을 종료했으며, 핸들 종료 코드 1이므로 정상 종료 성공으로 쓰지 않았습니다. 포트 번호는 OS가 지정한 임시 로컬 값이며 제출 설정에 고정하지 않습니다.
5. Chrome에서 두 번째 로컬 주소의 초기 화면만 읽었습니다. 실제 관찰 시각·상태는 `NEW_ENVIRONMENT_RECORD.md` 2절입니다. 계정 연결, AI 요청, OSV 조회, 조치 버튼을 누르지 않았습니다. 화면 캡처는 도구 시간 초과로 저장하지 못했으므로 이미지 증거가 있다고 주장하지 않습니다. 읽은 화면과 GET 메타데이터는 검수자 기록으로 보관했습니다.

기본 `createOnServer`는 engine.evidenceMode가 disconnected이고, `aiEnv:{}`는 AI 자격 환경을 주입하지 않습니다. 실제 native/SDP 설정·동작 권한·DB 경로는 전달하지 않았습니다. 따라서 실패 표시를 확인했을 뿐, 실제 원천 연결·AI·OSV·조치·새 환경 설치를 재현했다는 증거가 아닙니다. `npm start` 또는 PowerShell launcher 명령 자체의 실행 성공으로 확대하지 않습니다.
