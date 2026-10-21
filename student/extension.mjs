// TimoAleph 시험0 오너 계정용 참고 구현 후보입니다. 일반 학생의 성취물도, 제공 시작 틀의 기본값도 아닙니다.
// 13~20단계 표시 함수만 구현합니다. 제공 화면(public/app.js)이 넘겨 준 자료만 쓰며 요청을 보내지 않습니다.
// 모든 글자는 textContent 로만 넣습니다(innerHTML 등 사용 안 함). 자동 재시도·타이머·저장소 사용이 없습니다.

const SECRET = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|on-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|secret|비밀번호|토큰)\s*[:=]\s*\S+)/i;
const SAFE_CODE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;
// 값이 없으면 '값 없음', 비밀처럼 보이거나 글자가 아닌 값은 '표시하지 않음'으로만 씁니다.
const shown = (value) => value === undefined || value === null ? '값 없음'
  : (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') && !SECRET.test(String(value)) ? String(value) : '표시하지 않음';
const codeOf = (error) => (error && typeof error.code === 'string' && SAFE_CODE.test(error.code) ? error.code : 'UNKNOWN_ERROR');
const messageOf = (error) => (error && typeof error.message === 'string' && error.message ? shown(error.message) : '서버가 오류 내용을 알려 주지 않았습니다');

// 연결 방식 안내. 다른 칸의 판정 문장과 섞여도 오해가 없도록 '실패'·'오류'·'허용' 낱말을 쓰지 않습니다.
const MODE_TEXT = {
  connected: '연결됨(connected)',
  demo: '예제 자료(demo) · 실제 연결 아님',
  disconnected: '연결 없음(disconnected)',
  unknown: '연결 상태를 알 수 없음(unknown)',
};
const DEVICE = { compliant: '정상', noncompliant: '점검 필요', unknown: '확인 불가' };
const SESSION = { active: '사용 중', expired: '만료', revoked: '취소', unknown: '확인 불가' };
const ACCESS = { allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' };
const KIND = { access: '접속 기록', xdr: 'XDR 경보' };

function node(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'text') element.textContent = String(value);
    else if (name === 'onclick') element.addEventListener('click', value);
    else if (name === 'onchange') element.addEventListener('change', value);
    else if (name === 'disabled') element.disabled = true;
    else element.setAttribute(name, String(value));
  }
  for (const child of children) if (child) element.append(child);
  return element;
}
const line = (text, attributes = {}) => node('p', { ...attributes, text });
const labelled = (map, value) => `${Object.hasOwn(map, value) ? map[value] : '확인 불가'}(${shown(value)})`;
const modeLine = (mode) => (Object.hasOwn(MODE_TEXT, mode) ? line(`연결 방식: ${MODE_TEXT[mode]}`) : null);
const attentionDevice = (status) => status !== 'compliant';
const attentionSession = (status) => status !== 'active';

export function createStudentView() {
  // 15·16단계 기록 칸의 화면 안 상태(걸러 보기·고른 상세). 새 자료가 오면 상세를 지웁니다.
  const events = { filters: { kind: 'all', app: 'all', access: 'all' }, selected: null, signature: null };

  return {
    // 13단계: 로그인 사용자·기기·세션.
    renderIdentity({ me, devices, sessions } = {}) {
      const root = node('section', { 'data-student-view': 'identity' });
      const mode = me?.mode ?? null;
      if (!me || me.status === 'loading') { root.append(line('신원 정보를 불러오는 중입니다'), modeLine(mode)); return root; }
      if (me.status !== 'ok') {
        // 이전 사용자 이름이 남지 않도록 자료 칸은 그리지 않습니다.
        root.append(line(`연결 실패: ${messageOf(me.error)}`), line(`신원을 확인할 수 없습니다(${codeOf(me.error)})`), modeLine(mode));
        return root;
      }
      const { user, device, session } = me.data;
      root.append(
        line(`사용자: ${shown(user.label)} (${shown(user.id)})`),
        line(`기기: ${shown(device.label)} · ${labelled(DEVICE, device.status)}${attentionDevice(device.status) ? ' · 주의 필요' : ''}`),
        line(`세션: ${shown(session.id)} · ${labelled(SESSION, session.status)}${attentionSession(session.status) ? ' · 주의 필요' : ''}`),
        devices?.status === 'error' ? line(`기기 목록 불러오기 실패: ${messageOf(devices.error)}`) : null,
        sessions?.status === 'error' ? line(`세션 목록 불러오기 실패: ${messageOf(sessions.error)}`) : null,
        modeLine(mode),
      );
      return root;
    },

    // 14단계: 업무 앱 접속 판정. unknown·요청 실패는 접속 가능으로 읽히지 않게 씁니다.
    renderDecision(resource = {}) {
      const root = node('section', { 'data-student-view': 'decision' });
      const appLine = resource.appId ? line(`업무 앱: ${shown(resource.appId)}`) : null;
      if (resource.status === 'idle' || !resource.status) { root.append(line('앱을 골라 접속을 요청하세요(idle)')); return root; }
      if (resource.status === 'loading') { root.append(line('판정 확인 중입니다'), appLine); return root; }
      if (resource.status !== 'ok') {
        root.append(line(`요청 실패: ${messageOf(resource.error)}`), line(`판정을 받지 못했습니다(${codeOf(resource.error)}). 거부 판정이 아닙니다.`), appLine, modeLine(resource.mode));
        return root;
      }
      const { decision, reason, checkedAt } = resource.data;
      const text = decision === 'allow' ? '허용(allow)'
        : decision === 'deny' ? '거부(deny)'
        : decision === 'challenge' ? '추가 확인 필요(challenge) · 이 화면은 확인 절차를 대신하지 않습니다'
        : decision === 'unknown' ? '확인 불가(unknown) · 서버가 판정을 내리지 못했습니다. 접속할 수 있다고 보지 마세요'
        : `확인 불가(unknown) · 알 수 없는 판정 값을 받았습니다: ${shown(decision)}`;
      root.append(line(`판정: ${text}`), line(`이유: ${shown(reason)}`), line(`확인 시각: ${shown(checkedAt)}`), appLine, modeLine(resource.mode));
      return root;
    },

    // 15단계(+16단계 미지원 조치 안내): 내 접속 기록과 저장된 XDR 경보.
    renderEvents(resource = {}) {
      const root = node('section', { 'data-student-view': 'events' });
      if (!resource.status || resource.status === 'loading') { root.append(line('기록을 불러오는 중입니다')); events.signature = null; events.selected = null; return root; }
      if (resource.status !== 'ok') {
        events.signature = null; events.selected = null;
        root.append(line(`기록 불러오기 실패: ${messageOf(resource.error)} (${codeOf(resource.error)})`), modeLine(resource.mode));
        return root;
      }
      const rows = Array.isArray(resource.data) ? [...resource.data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)) : [];
      const signature = JSON.stringify(rows);
      if (signature !== events.signature) { events.signature = signature; events.selected = null; }
      if (rows.length === 0) { root.append(line('표시할 기록이 없습니다'), modeLine(resource.mode)); return root; }

      const values = (pick) => [...new Set(rows.map(pick).filter((v) => typeof v === 'string'))];
      for (const [key, pick] of [['kind', (e) => e.kind], ['app', (e) => e.appId], ['access', (e) => e.state?.access]]) {
        if (events.filters[key] !== 'all' && !values(pick).includes(events.filters[key])) events.filters[key] = 'all';
      }
      const list = node('div', { 'data-student-events-list': '' });
      const select = (name, key, options) => {
        const box = node('select', { 'aria-label': name, onchange: (e) => { events.filters[key] = e.target.value; paint(); } },
          node('option', { value: 'all', text: '전체(all)' }), ...options.map((v) => node('option', { value: v, text: v })));
        box.value = events.filters[key];
        return node('label', {}, node('span', { text: `${name} ` }), box);
      };
      const detail = (event) => {
        const box = node('div', { 'data-student-event-detail': event.id },
          line(`상세 · 사건 ${shown(event.id)} · 앱 ${event.appId ? shown(event.appId) : '앱 ID 없음'}`),
          line('근거'), ...(event.evidence ?? []).map((r) => line(`${shown(r.id)} — ${shown(r.text)}`)),
          line('규칙'), ...(event.rules ?? []).map((r) => line(`${shown(r.id)} — ${shown(r.text)}`)),
          line(`접속: ${labelled(ACCESS, event.state?.access)}`),
          line(`세션: ${labelled(SESSION, event.state?.session)}`),
          line(`기기: ${labelled(DEVICE, event.state?.device)}`));
        // 16단계: 원천이 연결되지 않은 조치는 요청을 보내지 않는 비활성 안내 버튼만 둡니다. 비어 있으면 만들지 않습니다.
        const actions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        if (actions.length) {
          box.append(line('아래 조치는 아직 지원하지 않습니다(미지원). 조치 실행 연결은 준비 중이며 어떤 요청도 보내지 않습니다.'));
          for (const action of actions) box.append(node('button', { type: 'button', disabled: true, 'aria-label': `${action} 미지원`, text: `${action} 미지원` }));
        }
        return box;
      };
      const paint = () => {
        list.replaceChildren();
        const { kind, app, access } = events.filters;
        const visible = rows.filter((e) => (kind === 'all' || e.kind === kind) && (app === 'all' || e.appId === app) && (access === 'all' || e.state?.access === access));
        if (visible.length === 0) list.append(line('조건에 맞는 기록이 없습니다'));
        for (const event of visible) {
          list.append(node('div', { 'data-student-event-id': event.id },
            line(`${shown(event.id)} · ${shown(event.at)} · ${KIND[event.kind] ?? '종류 확인 불가'}(${shown(event.kind)}) · 앱 ${event.appId ? shown(event.appId) : '앱 ID 없음(앱을 확인할 수 없음)'}`),
            line(shown(event.summary)),
            node('button', { type: 'button', 'aria-label': `${event.id} 상세`, text: `${event.id} 상세`, onclick: () => { events.selected = events.selected === event.id ? null : event.id; paint(); } })));
          if (events.selected === event.id) list.append(detail(event));
        }
      };
      root.append(node('div', {}, select('기록 종류', 'kind', values((e) => e.kind)), select('업무 앱', 'app', values((e) => e.appId)), select('접속 상태', 'access', values((e) => e.state?.access))), list, modeLine(resource.mode));
      paint();
      return root;
    },

    // 16단계: 기기·세션·알림·도움정보. 다시 시도는 사용자가 직접 누릅니다.
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = node('section', { 'data-student-view': 'status' });
      const part = (title, resource, empty, draw, attention) => {
        if (!resource || resource.status === 'loading') return [line(`${title} 불러오는 중입니다`)];
        if (resource.status !== 'ok') {
          const code = codeOf(resource.error);
          return [line(`${title} 불러오기 실패: ${code} · ${messageOf(resource.error)}`),
            code.includes('TIMEOUT') ? line(`${title} 요청이 시간 안에 끝나지 않았습니다(시간 초과).`) : null,
            line('다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.')];
        }
        if (!Array.isArray(resource.data) || resource.data.length === 0) return [line(empty)];
        return resource.data.map((row) => line(`${draw(row)}${attention(row.status) ? ' · 주의 필요' : ''}`));
      };
      root.append(line('기기'), ...part('기기', devices, '등록된 기기가 없습니다', (d) => `${shown(d.label)} · ${labelled(DEVICE, d.status)}`, attentionDevice));
      root.append(line('세션(지금 검증된 연결 하나만 표시하며 지난 세션 목록이 아닙니다)'), ...part('세션', sessions, '현재 연결된 세션이 없습니다', (s) => `${shown(s.id)} · ${labelled(SESSION, s.status)}`, attentionSession));

      const notes = Array.isArray(notifications) ? notifications : [];
      root.append(line(notes.length ? `알림 ${notes.length}건` : '주의할 알림이 없습니다'));
      for (const n of notes) {
        const label = n.resource === 'devices' ? '기기(devices)' : n.resource === 'sessions' ? '세션(sessions)' : n.resource === 'events' ? '기록(events)' : shown(n.resource);
        root.append(line(`알림 · ${label} · ${SAFE_CODE.test(n.code ?? '') ? n.code : 'UNKNOWN'} · ${shown(n.message)} · 연결 상태를 확인한 뒤 필요하면 다시 불러오기를 직접 누르세요`));
      }

      let copyText = '';
      if (diagnostics?.status === 'ok' && diagnostics.data) {
        const d = diagnostics.data;
        const rows = [['requestId', d.requestId], ['component', d.component], ['version', d.version], ['checkedAt', d.checkedAt], ['engine.mode', d.engine?.mode], ['engine.code', d.engine?.code]];
        root.append(line('도움정보(도움 요청에 쓰도록 복사할 수 있는 정보입니다. 열쇠·토큰은 담지 않습니다)'));
        for (const [name, value] of rows) root.append(line(`${name}: ${shown(value)}`));
        copyText = rows.map(([name, value]) => `${name}: ${shown(value)}`).join('\n');
      } else if (diagnostics?.status === 'loading') root.append(line('도움정보를 불러오는 중입니다'));
      else if (diagnostics?.status === 'error') root.append(line(`도움정보 불러오기 실패: ${codeOf(diagnostics.error)} · ${messageOf(diagnostics.error)}`));
      else root.append(line('도움정보는 제공 화면의 도움정보 불러오기 버튼을 직접 누르면 표시됩니다. 표시된 뒤 복사해 도움 요청에 쓸 수 있습니다.'));
      const copyState = line('');
      root.append(node('button', { type: 'button', disabled: !copyText, text: '도움정보 복사', onclick: () => {
        // 사용자가 누를 때만, 위에 보인 안전한 값만 복사합니다.
        const manual = () => { copyState.textContent = '자동 복사를 사용할 수 없습니다. 위 값을 직접 선택해 복사하세요.'; };
        try { navigator.clipboard.writeText(copyText).then(() => { copyState.textContent = '도움정보를 복사했습니다.'; }, manual); } catch { manual(); }
      } }), copyState, modeLine(mode));
      return root;
    },

    // 20단계: 실제 설치 버전과 OSV 대조. 조회 실패·미조회는 취약점이 없다는 뜻이 아닙니다.
    renderVulnerabilities(resource = {}) {
      const root = node('section', { 'data-student-view': 'vulnerabilities' });
      if (!resource.status || resource.status === 'idle') { root.append(line('조회 전(idle) · 제공 화면의 설치 패키지 조회 버튼을 직접 누르세요')); return root; }
      if (resource.status === 'loading') { root.append(line('조회 중입니다')); return root; }
      if (resource.status !== 'ok') {
        const code = codeOf(resource.error);
        root.append(line(code.includes('CANCELLED') ? `조회를 취소했습니다(${code}). 이전 결과는 현재 결과가 아닙니다.` : `조회 실패: ${code} · ${messageOf(resource.error)}`), line('필요하면 직접 다시 조회하세요.'));
        return root;
      }
      const scan = resource.data ?? {};
      const lead = { complete: '모두 조회(complete)', partial: '일부 조회 실패(partial) · 일부 결과만 받았습니다', not_checked: '아직 조회 안 함(not_checked) · 승인된 공개 패키지가 없어 조회하지 않았습니다', not_configured: '조회 준비 미완료(not_configured) · 프로젝트 설정이 아직 없습니다', unverifiable: 'lock 파일 확인 불가(unverifiable)' }[scan.status] ?? `전체 상태 확인 불가(${shown(scan.status)})`;
      root.append(line(`전체 조회 상태: ${lead}`));
      if (scan.code) root.append(line(`코드: ${shown(scan.code)}`));
      if (scan.lockfileVersion !== undefined) root.append(line(`lockfileVersion: ${shown(scan.lockfileVersion)}`));
      if (scan.lockfileHash) root.append(line(`lockfileHash: ${shown(scan.lockfileHash)}`));
      if (scan.excluded && Number.isSafeInteger(scan.excluded.count)) root.append(line(`조회 제외: ${scan.excluded.count}건`));
      root.append(line(`조회 시각: ${shown(scan.checkedAt)}`));
      if (['not_checked', 'not_configured', 'unverifiable'].includes(scan.status)) root.append(line('이 상태는 취약점이 없다는 뜻이 아닙니다.'));
      for (const pkg of Array.isArray(scan.packages) ? scan.packages : []) {
        const findings = Array.isArray(pkg.vulnerabilities) ? pkg.vulnerabilities : [];
        const status = pkg.status === 'known_vulnerabilities' ? '알려진 항목 있음(known_vulnerabilities)'
          : pkg.status === 'none_found' ? '알려진 항목 없음(none_found) · 조회 시점 기준'
          : pkg.status === 'unverifiable' && findings.length ? '일부 확인·전체 조회 확인 불가(unverifiable)'
          : '조회 확인 불가(unverifiable)';
        root.append(node('div', { 'data-student-package-name': pkg.name, 'data-student-package-version': pkg.version },
          line(`${shown(pkg.name)} · 설치된 정확한 버전 ${shown(pkg.version)} · ${status}`),
          line(`출처 ${shown(pkg.source)} · 패키지 조회 시각 ${shown(pkg.checkedAt)}`),
          ...findings.map((f) => line(`취약점 ${shown(f.id)} · 수정 시각 ${shown(f.modified)}`))));
      }
      return root;
    },

    // 17단계: 수업용 AI 연결 점검. 모델 목록 응답은 사건 설명이 아닙니다.
    renderAiConnection(resource = {}) {
      const root = node('section', { 'data-student-view': 'ai-connection' });
      if (!resource.status || resource.status === 'idle') { root.append(line('AI 연결 점검 전(idle) · 점검은 제공 화면의 현재 API 연결 점검 버튼을 직접 누릅니다')); return root; }
      if (resource.status === 'loading') { root.append(line('AI 연결 점검 중입니다')); return root; }
      if (resource.status !== 'ok') {
        const code = codeOf(resource.error);
        const cause = /PROVISIONING|AUTHORIZATION_CHANGED|SUBJECT_SCOPE/.test(code) ? '앱 권한 준비 중이거나 권한을 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.'
          : /AUTH_REQUIRED/.test(code) ? '인증 실패입니다. 계정 연결을 다시 확인하고 담당자에게 확인하세요.'
          : /ACCESS_BLOCKED/.test(code) ? '접근 제한입니다. 이용 권한과 운영 중지 여부를 담당자에게 확인하세요.'
          : /BUDGET/.test(code) ? '반의 사용량이 소진됐습니다. 담당자에게 확인하세요.'
          : /LIMIT_REACHED/.test(code) ? '이용 한도에 도달했습니다. 담당자에게 확인하세요.'
          : /SESSION_CLOSED/.test(code) ? '지금은 AI 이용 시간이 아닙니다. 이용 시간을 확인하세요.'
          : /RATE_LIMITED/.test(code) ? '요청이 잠시 제한됐습니다. 잠시 뒤 직접 다시 점검하세요.'
          : /TIMEOUT/.test(code) ? '응답 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.'
          : /CANCELLED/.test(code) ? '점검을 취소했습니다. 이전 결과는 현재 결과가 아닙니다.'
          : /MODEL_LIST_EMPTY|MODEL_NOT_CONFIGURED/.test(code) ? '쓸 수 있는 AI 모델이 없습니다. 담당자에게 모델 허용 설정 확인을 요청하세요.'
          : /NETWORK/.test(code) ? '네트워크 연결을 확인한 뒤 직접 다시 점검하세요.'
          : 'AI 연결이나 응답을 확인할 수 없습니다.';
        root.append(line(`AI 연결 점검 결과를 받지 못했습니다: ${code} · ${messageOf(resource.error)}`), line(cause), line('다시 점검은 사용자가 버튼을 직접 누릅니다. 자동으로 다시 점검하지 않습니다.'));
        return root;
      }
      const d = resource.data;
      const kind = d.audienceAuthorization === 'verified' ? '앱 권한 확인 후 점검(verified)' : d.audienceAuthorization === 'test' ? '시험 연결 점검(test)' : `점검 종류 확인 불가(${shown(d.audienceAuthorization)})`;
      root.append(line(kind), line(`모델 수: ${shown(d.modelCount)}`), line(`점검 시각: ${shown(resource.checkedAt)}`),
        d.help?.code ? line(`안내 코드: ${shown(d.help.code)}`) : null,
        line(`연결만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다(explanationAccepted: ${resource.explanationAccepted === true})`));
      return root;
    },

    // 17·18단계: 고른 기록의 근거·규칙·상태와 이어진 AI 설명(참고용). 실행 버튼은 만들지 않습니다.
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = node('section', { 'data-student-view': 'explanation' });
      const failure = () => {
        const code = codeOf(explanation.error);
        root.append(...[line(`AI 설명 실패: ${code} · ${messageOf(explanation.error)}`),
          /INVALID_INPUT/.test(code) ? line('설명할 수 없습니다(근거 부족·입력 오류).') : null,
          /INVALID_OUTPUT|UNVERIFIED/.test(code) ? line('AI 설명의 근거·조치·형식을 확인할 수 없어 이 설명은 쓸 수 없습니다(확인 불가).') : null,
          line('기록은 그대로입니다. 과제 실패가 아닙니다.')].filter(Boolean));
        return root;
      };
      // 제공 화면은 설명에 쓸 수 없는 기록이면 event 없이 오류만 넘깁니다(public/app.js:993-1000).
      if (!event) { if (explanation?.status === 'error') return failure(); root.append(line('보안 기록에서 기록을 먼저 고르세요')); return root; }
      if (!explanation || explanation.status === 'idle') { root.append(line(`기록 ${shown(event.id)} · AI 설명 요청 전(idle) · 기록의 AI 설명 버튼을 직접 누르세요`)); return root; }
      if (explanation.status === 'loading') { root.append(line(`기록 ${shown(event.id)} · AI 설명 요청 중입니다`)); return root; }
      if (explanation.status !== 'ok') return failure();
      const x = explanation.data ?? {};
      const evidence = new Map((Array.isArray(event.evidence) ? event.evidence : []).map((r) => [r.id, r.text]));
      const cited = Array.isArray(x.evidenceIds) ? x.evidenceIds : [];
      if (x.executed !== false || x.requiresHumanConfirmation !== true) {
        root.append(line('AI가 이미 실행했다고 답했거나 사람 확인 조건이 없는 설명이라 쓸 수 없습니다(확인 불가).'));
        return root;
      }
      if (evidence.size === 0 || cited.length === 0 || !cited.every((id) => evidence.has(id))) {
        root.append(line('근거가 맞지 않아 이 설명은 쓸 수 없습니다(근거 불일치). 내용을 만들어 채우지 않습니다.'));
        return root;
      }
      root.setAttribute('data-student-explanation-event', event.id);
      const unknown = [['접속', event.state?.access], ['세션', event.state?.session], ['기기', event.state?.device]].filter(([, v]) => v === 'unknown');
      const proposals = Array.isArray(x.proposals) ? x.proposals : [];
      const actions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
      root.append(line(`사건 ${shown(event.id)}`), line('AI 설명(참고용)'), line(shown(x.summary)),
        line('인용한 근거'), ...cited.map((id) => line(`${shown(id)} — ${shown(evidence.get(id))}`)),
        line('규칙'), ...(Array.isArray(event.rules) ? event.rules : []).map((r) => line(`${shown(r.id)} — ${shown(r.text)}`)),
        line('확인할 수 없는 상태'), ...(unknown.length ? unknown.map(([name]) => line(`${name}: 확인 불가(unknown)`)) : [line('없음')]),
        line('조치 제안'),
        ...(proposals.length ? proposals.map((p) => line(`${shown(p.action)} · ${shown(p.reason)} · 근거 ${(Array.isArray(p.evidenceIds) ? p.evidenceIds : []).map(shown).join(', ')}`))
          : [line(actions.length ? 'AI가 제안한 조치가 없습니다.' : '원천이 지원하는 조치가 없어 제안이 없습니다(제안 없음이 맞는 상태입니다).')]),
        line('조치 제안은 사람이 확인해야 실행되며 아직 실행되지 않았습니다(requiresHumanConfirmation: true, executed: false).'),
        line(`설명 확인 시각: ${shown(checkedAt)}`));
      return root;
    },

    // 19단계: 제안·사람 확인·서버 전달(ACK)·원천 효과 관측·불명을 구분합니다. 버튼은 제공 화면 것만 씁니다.
    renderAction(state = {}) {
      const root = node('section', { 'data-student-view': 'action' });
      const s = state;
      if (s.event?.id) root.setAttribute('data-student-action-event', s.event.id);
      if (s.receipt?.requestId) root.setAttribute('data-student-action-request', s.receipt.requestId);
      const effect = s.status === 'succeeded' && s.observation?.effectApplied === true;
      const text = {
        idle: '아직 미실행(idle) · 조치 제안은 참고이며, 준비와 집행은 제공 화면 버튼으로만 합니다',
        loading: '원천에 확인하는 중(loading) · 결과는 아직 확인되지 않았습니다',
        prepared: '준비됨·미실행(prepared) · 대상과 확인 기한을 사람이 확인해야 합니다',
        executing: '서버에 전달 중(executing) · 결과는 아직 확인되지 않았습니다',
        pending: '서버 접수·처리 중(pending) · 서버가 받았다는 것(ACK)은 효과가 아닙니다. 결과는 아직 확인되지 않았습니다',
        denied: '거절(denied) · 원천이 이 조치를 받아들이지 않았습니다',
        failed: '실패(failed) · 원천이 이 조치를 처리하지 못했습니다',
        unknown: '결과 불명(unknown) · 효과가 있다고도, 효과가 없다고도 판단하지 마세요. 제공 화면에서 원천 결과만 재조회하세요',
        expired: '확인 기한 지남(expired) · 이번 준비로는 집행할 수 없습니다. 제공 화면에서 다시 준비하세요',
        error: '요청 처리 안 됨(error)',
      };
      const uncertain = s.status === 'unknown' || (s.status === 'succeeded' && !effect);
      const status = effect ? '효과 확인(succeeded) · 원천에서 관측한 결과입니다'
        : uncertain ? text.unknown
        : Object.hasOwn(text, s.status) ? text[s.status] : `상태 확인 불가(${shown(s.status)})`;
      root.append(line(status));
      if (s.event?.id) root.append(line(`사건 ${shown(s.event.id)} · 근거 ${(Array.isArray(s.event.evidence) ? s.event.evidence : []).map((e) => shown(e.id)).join(', ') || '없음'}`));
      if (s.actionId) root.append(line(`조치 ${shown(s.actionId)}`));
      if (s.target) root.append(line(`실제 대상 ${shown(s.target.id)} · 세대 ${shown(s.target.generation)}`));
      if (s.status === 'prepared' && s.confirmationExpiresAt) root.append(line(`확인 기한 ${shown(s.confirmationExpiresAt)}`));
      if (s.receipt) root.append(line(`요청 ${shown(s.receipt.requestId)} · 영수증 ${s.receipt.receiptId ? shown(s.receipt.receiptId) : '확인 불가'} · 버전 ${s.receipt.version ? shown(s.receipt.version) : '확인 불가'}`));
      if (effect) root.append(line(`관측 시각 ${shown(s.observation.observedAt)} · effectApplied: true`));
      // 결과 불명일 때는 판단을 흐릴 수 있는 제공 문구 대신 안전한 코드만 보여 줍니다.
      if (s.error) root.append(line(uncertain ? `오류 코드 ${codeOf(s.error)}` : `${codeOf(s.error)}: ${messageOf(s.error)}`));
      return root;
    },
  };
}
