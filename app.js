(() => {
  'use strict';

  let page = document.body.dataset.page || 'dashboard';
  const ACCOUNT_KEY = 'dr221_accounts_v4';
  const SESSION_KEY = 'dr221_session_v4';
  const PREF_KEY = 'dr221_prefs_v6';
  const MATERIAL_META_KEY = 'dr221_materials_meta_v4';
  const TEACHER_KEY = 'dr221_teachers_v10';
  const CHAT_KEY = 'dr221_chat_v4';
  const SITE_KEY = 'dr221_site_v4';
  const SEMINAR_KEY = 'dr221_seminars_v4';
  const SCHEDULE_KEY = 'dr221_schedule_v4';
  const SUBJECT_COVERS_KEY = 'dr221_subject_covers_v4';
  const UPLOAD_TOKEN_KEY = 'dr221_upload_token_v4';
  const NAV_GLIDE_KEY = 'dr221_nav_glide_v9';
  const DOCK_GLIDE_KEY = 'dr221_dock_glide_v9';
  const SUPABASE_URL = 'https://wiqxxlxjyncwuxvcygbw.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_a_NoVSlKZ6Jv7tOfaO8whw_kdOWQmal';
  const ALERT_KEY = 'dr221_alert_v8';
  const DISMISSED_ALERT_KEY = 'dr221_dismissed_alert_v8';
  const RECAP_KEY = 'dr221_recaps_v8';
  const QA_KEY = 'dr221_qa_v8';
  const POLL_KEY = 'dr221_polls_v8';
  const REQUEST_KEY = 'dr221_requests_v8';

  // Fixed Admin handle & linked Google email
  const ADMIN_PRIMARY_HANDLE = '3mar_r';
  const ADMIN_EMAIL = 'oytyfyayyy@gmail.com';
  const isAdminHandle = (raw) => String(raw || '').trim() === '3mar_r';
  const isAdminEmail = (raw) => String(raw || '').trim().toLowerCase() === ADMIN_EMAIL;

  // Zero-Dependency Direct Supabase REST & Storage Engine (v18 Bulletproof Cloud)
  const SupaCloud = {
    lastError: '',
    lastStorageError: '',

    buildHeaders(extra = {}, includeAuthBearer = false) {
      const h = { apikey: SUPABASE_KEY, ...extra };
      if (includeAuthBearer || SUPABASE_KEY.startsWith('eyJ')) {
        h.Authorization = `Bearer ${SUPABASE_KEY}`;
      }
      return h;
    },

    async req(path, options = {}) {
      const url = `${SUPABASE_URL}${path}`;
      const extraHeaders = options.headers || {};
      const run = (withBearer) => fetch(url, {
        ...options,
        cache: 'no-store',
        headers: this.buildHeaders(extraHeaders, withBearer)
      });

      // Try standard apikey-only first for sb_publishable_, or with Bearer for JWT keys
      let res = await run(SUPABASE_KEY.startsWith('eyJ'));
      // Supabase Storage & some endpoints return 400/401/403 when Authorization header differs — smart retry!
      if (!res.ok && (res.status === 400 || res.status === 401 || res.status === 403)) {
        const retry = await run(!SUPABASE_KEY.startsWith('eyJ'));
        if (retry.ok) res = retry;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        this.lastError = `HTTP ${res.status}${txt ? `: ${txt.slice(0, 180)}` : ''}`;
      } else {
        this.lastError = '';
      }
      return res;
    },

    async select(table, query = '') {
      const res = await this.req(`/rest/v1/${table}?${query}`, {
        method: 'GET',
        headers: { accept: 'application/json' }
      });
      if (!res.ok) return { data: null, error: this.lastError };
      return { data: await res.json().catch(() => []), error: null };
    },

    async insert(table, row) {
      const res = await this.req(`/rest/v1/${table}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', prefer: 'return=representation' },
        body: JSON.stringify(row)
      });
      if (!res.ok) return { data: null, error: this.lastError };
      return { data: await res.json().catch(() => null), error: null };
    },

    async upsert(table, row, onConflict = 'key') {
      const res = await this.req(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(row)
      });
      return { ok: res.ok, error: res.ok ? null : this.lastError };
    },

    async updateEq(table, col, val, patch) {
      const res = await this.req(`/rest/v1/${table}?${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', prefer: 'return=minimal' },
        body: JSON.stringify(patch)
      });
      return { ok: res.ok, error: res.ok ? null : this.lastError };
    },

    async deleteEq(table, col, val) {
      const res = await this.req(`/rest/v1/${table}?${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`, {
        method: 'DELETE'
      });
      return { ok: res.ok, error: res.ok ? null : this.lastError };
    },

    async uploadFile(bucket, storagePath, file) {
      const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
      const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;
      const contentType = file.type || 'application/octet-stream';
      const errors = [];

      // Try 4 compatible combinations (with/without Bearer × raw binary / FormData)
      // because Supabase Storage handles sb_publishable_ differently across project configs
      const attempts = [
        () => fetch(url, {
          method: 'POST',
          cache: 'no-store',
          headers: this.buildHeaders({ 'content-type': contentType, 'cache-control': '3600', 'x-upsert': 'true' }, true),
          body: file
        }),
        () => fetch(url, {
          method: 'POST',
          cache: 'no-store',
          headers: this.buildHeaders({ 'content-type': contentType, 'cache-control': '3600', 'x-upsert': 'false' }, false),
          body: file
        }),
        () => {
          const fd = new FormData();
          fd.append('cacheControl', '3600');
          fd.append('', file, file.name || 'file');
          return fetch(url, {
            method: 'POST',
            cache: 'no-store',
            headers: this.buildHeaders({ 'x-upsert': 'true' }, true),
            body: fd
          });
        },
        () => {
          const fd = new FormData();
          fd.append('cacheControl', '3600');
          fd.append('', file, file.name || 'file');
          return fetch(url, {
            method: 'POST',
            cache: 'no-store',
            headers: this.buildHeaders({ 'x-upsert': 'false' }, false),
            body: fd
          });
        }
      ];

      for (const runAttempt of attempts) {
        try {
          const res = await runAttempt();
          if (res.ok) {
            this.lastStorageError = '';
            return {
              publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`,
              error: null
            };
          }
          const txt = await res.text().catch(() => '');
          errors.push(`HTTP ${res.status}: ${txt.slice(0, 120)}`);
        } catch (err) {
          errors.push(String(err?.message || err));
        }
      }

      this.lastStorageError = errors[0] || 'Storage upload failed';
      return { publicUrl: '', error: this.lastStorageError };
    },

    async removeFile(bucket, storagePath) {
      if (!storagePath) return { ok: true };
      const res = await this.req(`/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prefixes: [storagePath] })
      });
      return { ok: res.ok };
    },

    async testFullHealth() {
      const db = await this.select('materials', 'select=id&limit=1');
      if (db.error) {
        return { ok: false, dbOk: false, storageOk: false, message: `DB Error: ${db.error}` };
      }
      const probeFile = new File(['ok'], 'healthcheck.txt', { type: 'text/plain' });
      const probePath = `_health/ping-${Date.now()}.txt`;
      const up = await this.uploadFile('materials', probePath, probeFile);
      if (up.publicUrl) {
        await this.removeFile('materials', probePath).catch(() => {});
        return { ok: true, dbOk: true, storageOk: true, message: 'Database + Storage 100% Connected!' };
      }
      return {
        ok: true,
        dbOk: true,
        storageOk: false,
        message: `DB Connected ✓ · Storage Blocked (${up.error}) — Auto DB Cloud Fallback Active (up to 6 MB)`
      };
    }
  };

  const LEADER_FLAIR_OPTIONS = ['👑', '⭐', '🛡️', '⚡', '🩺', '🔥', '💎'];
  const STUDENT_FLAIR_OPTIONS = ['🩺', '🧠', '🧬', '📚', '⚡', '🔥', '🎯', '☕', '✨', '🎓'];
  const USER_STATUS_OPTIONS = [
    { id: 'online', label: 'Online', cls: '' },
    { id: 'studying', label: 'Studying', cls: 'studying' },
    { id: 'lab', label: 'In Lab', cls: 'lab' },
    { id: 'busy', label: 'Exam Mode', cls: 'busy' }
  ];
  const WIDE_BANNER_PRESETS = [
    { id: 'med-blue', name: 'Clinical Pulse', url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80' },
    { id: 'anatomy-dark', name: 'Dark Lab', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=80' },
    { id: 'micro-glow', name: 'Microscope', url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1400&q=80' },
    { id: 'aurora-mesh', name: 'Emerald Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1400&q=80' },
    { id: 'silver-arch', name: 'Minimalist Slate', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1400&q=80' },
    { id: 'night-sky', name: 'Deep Horizon', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1400&q=80' }
  ];
  const GOALS_KEY = 'dr221_study_goals_v17';

  function getUserGoals() {
    return read(GOALS_KEY, [
      { id: 'g1', text: 'Review Thorax & Cranial Nerves Anatomy', done: false },
      { id: 'g2', text: 'Prepare Biochemistry Lab Notes', done: true }
    ]);
  }
  function saveUserGoals(list) { write(GOALS_KEY, list); }

  function playSoftPing() {
    try {
      if (getPrefs().soundEffects === false) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }

  function findAccountByUser(usernameOrName) {
    const q = String(usernameOrName || '').trim().toLowerCase();
    if (!q) return null;
    return accounts.find((a) => a.username.toLowerCase() === q || a.name.toLowerCase() === q) || null;
  }

  function getUserFlair(user) {
    if (!user) return '';
    if (isAdminHandle(user.username) || user.role === 'admin') return user.flair || '👑';
    return user.flair || '🩺';
  }

  function flairHtml(user, showLeaderPill = false) {
    const isLead = user && (isAdminHandle(user.username) || user.role === 'admin');
    const badge = getUserFlair(user);
    if (isLead && showLeaderPill) {
      return `<span class="leader-badge-pill">${esc(badge)} Leader</span>`;
    }
    return badge ? `<span class="user-flair-badge" title="${isLead ? 'Group 221 Leader' : 'Member Icon'}">${esc(badge)}</span>` : '';
  }

  function flairForUsername(username) {
    const u = findAccountByUser(username);
    if (u) return flairHtml(u, isAdminHandle(u.username));
    if (isAdminHandle(username)) return '<span class="leader-badge-pill">👑 Leader</span>';
    return '';
  }

  function smallAvatarHtml(usernameOrName, fallbackName = 'ST') {
    const u = findAccountByUser(usernameOrName);
    const label = u?.avatar || String(fallbackName || 'ST').split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';
    const ring = u?.ringColor ? `style="border-color:${esc(u.ringColor)}"` : '';
    if (u?.avatarImage) {
      return `<span class="tg-msg-avatar" ${ring}><img src="${esc(u.avatarImage)}" alt="${esc(u.name)}"></span>`;
    }
    return `<span class="tg-msg-avatar" ${ring}>${esc(label)}</span>`;
  }

  const defaultAccounts = [
    {
      username: '3mar_r',
      role: 'admin',
      name: 'Mohamed Omar Tarek',
      email: 'oytyfyayyy@gmail.com',
      group: 'Group 221 A',
      studentId: 'MED-221A-01',
      bio: 'Group 221 Leader · Human Medicine Year 2 · Group 221 A',
      avatar: 'MO',
      flair: '👑',
      status: 'online',
      ringColor: '#f59e0b',
      avatarImage: '',
      coverImage: ''
    },
    {
      username: 'maya',
      role: 'student',
      name: 'Maya Hassan',
      email: 'maya@med221.edu',
      group: 'Group 221 A',
      studentId: 'MED-221A-08',
      bio: 'Second-year medical student · Group 221 A',
      avatar: 'MH',
      avatarImage: '',
      coverImage: ''
    },
    {
      username: 'kareem',
      role: 'student',
      name: 'Kareem Adel',
      email: 'kareem@med221.edu',
      group: 'Group 221 A',
      studentId: 'MED-221A-12',
      bio: 'Anatomy & Physiology study group',
      avatar: 'KA',
      avatarImage: '',
      coverImage: ''
    },
    {
      username: 'lina',
      role: 'student',
      name: 'Lina Mansour',
      email: 'lina@med221.edu',
      group: 'Group 221 B',
      studentId: 'MED-221B-05',
      bio: 'Human Medicine · Group 221 B',
      avatar: 'LM',
      avatarImage: '',
      coverImage: ''
    },
    {
      username: 'youssef',
      role: 'student',
      name: 'Youssef Nabil',
      email: 'youssef@med221.edu',
      group: 'Group 221 B',
      studentId: 'MED-221B-19',
      bio: 'Biochemistry & Histology lab partner',
      avatar: 'YN',
      avatarImage: '',
      coverImage: ''
    }
  ];

  // Realistic Domain-Specific Medical Photography for all 12 subjects (with local SVG fallback)
  const baseCourses = [
    {
      id: 'anatomy',
      name: 'Anatomy',
      short: 'AN',
      semester: 'Semesters 1 & 2',
      desc: 'Regional anatomy, topographical landmarks, osteology, myology, and practical dissection labs.',
      progress: 76,
      icon: 'layers',
      image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/anatomy.svg'
    },
    {
      id: 'histology',
      name: 'Histology & Embryology',
      short: 'HE',
      semester: 'Semester 1',
      desc: 'Microscopic tissue structure, cytology slides, organogenesis, and embryological development.',
      progress: 70,
      icon: 'microscope',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/histology.svg'
    },
    {
      id: 'biochemistry',
      name: 'Biochemistry',
      short: 'BC',
      semester: 'Semesters 1 & 2',
      desc: 'Enzymology, metabolic pathways, molecular bioenergetics, and clinical laboratory diagnostics.',
      progress: 64,
      icon: 'atom',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/biochemistry.svg'
    },
    {
      id: 'physiology',
      name: 'Normal Physiology',
      short: 'NP',
      semester: 'Semesters 1 & 2',
      desc: 'Cardiovascular, respiratory, neuroendocrine systems integration, and functional mechanisms.',
      progress: 82,
      icon: 'activity',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/physiology.svg'
    },
    {
      id: 'microbiology',
      name: 'Microbiology & Virology',
      short: 'MV',
      semester: 'Semesters 1 & 2',
      desc: 'Bacteriology, virology, aseptic lab safety, staining protocols, and infectious pathogenesis.',
      progress: 59,
      icon: 'bug',
      image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/microbiology.svg'
    },
    {
      id: 'hygiene',
      name: 'Hygiene',
      short: 'HY',
      semester: 'Semesters 1 & 2',
      desc: 'Preventive medicine, environmental health standards, nutrition hygiene, and sanitation.',
      progress: 54,
      icon: 'shield',
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/hygiene.svg'
    },
    {
      id: 'deontology',
      name: 'Medical Deontology',
      short: 'MD',
      semester: 'Semester 1',
      desc: 'Bioethics, clinical communication, patient rights, and physician professional responsibility.',
      progress: 48,
      icon: 'heart',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/deontology.svg'
    },
    {
      id: 'psychology',
      name: 'Psychiatry & Psychology',
      short: 'PP',
      semester: 'Semesters 1 & 2',
      desc: 'Clinical psychology, cognitive processes, stress adaptation, and patient empathy.',
      progress: 42,
      icon: 'brain',
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/psychology.svg'
    },
    {
      id: 'russian',
      name: 'Russian for Physicians',
      short: 'RU',
      semester: 'Semesters 1 & 2',
      desc: 'Clinical terminology, patient history taking, and hospital communication in Russian.',
      progress: 52,
      icon: 'message',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/russian.svg'
    },
    {
      id: 'sport',
      name: 'Physical Education',
      short: 'PE',
      semester: 'Semesters 1 & 2',
      desc: 'Physical conditioning, kinesiology practice, and athletic modules in Building 1.',
      progress: 74,
      icon: 'zap',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/sport.svg'
    },
    {
      id: 'immunology',
      name: 'Immunology',
      short: 'IM',
      semester: 'Semester 2',
      desc: 'Innate & adaptive immunity, cytokines, hypersensitivity, and clinical immunopathology.',
      progress: 15,
      icon: 'shield',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/immunology.svg'
    },
    {
      id: 'surgery',
      name: 'General Surgery',
      short: 'GS',
      semester: 'Semester 2',
      desc: 'Asepsis, surgical instruments, wound healing, and foundational operative principles.',
      progress: 10,
      icon: 'scalpel',
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      fallback: 'assets/subjects/surgery.svg'
    }
  ];

  const defaultSchedule = {
    1: {
      Monday: [
        ['8:30 AM', 'Biochemistry Lab', 'Building 13', 'Group 221 B only'],
        ['1:50 PM', 'Microbiology Lab', 'Building 13', '']
      ],
      Tuesday: [
        ['8:30 AM', 'Histology Lab', 'Building 11', ''],
        ['1:50 PM', 'Sport', 'Building 1', ''],
        ['3:30 PM', 'Histology Lecture', 'Building 1 · Room 406', '']
      ],
      Wednesday: [
        ['8:30 AM', 'Physiology Lecture', 'Building 1 · Room 406', ''],
        ['10:15 AM', 'Biochemistry Lecture', 'Building 1 · Room 406', ''],
        ['12:05 PM', 'Hygiene Lab', 'Building 3 · Room 310', ''],
        ['1:50 PM', 'Russian Language Lab', 'Building 25 · Room 414', '']
      ],
      Thursday: [
        ['8:30 AM', 'Anatomy Lab', 'Building 11', ''],
        ['1:50 PM', 'Microbiology Lecture', 'Building 1 · Room 406', ''],
        ['3:30 PM', 'Hygiene Lecture', 'Building 1 · Room 406', ''],
        ['5:10 PM', 'Deontology Lab', 'Building 8', '']
      ],
      Friday: [
        ['8:30 AM', 'Physiology Lab', 'Building 8', ''],
        ['1:50 PM', 'Biochemistry Lab', 'Building 13', 'Group 221 A only']
      ],
      Saturday: [
        ['1:50 PM', 'Russian Language Lecture', 'Building 1 · Room 408', '']
      ]
    },
    2: {
      Monday: [
        ['8:30 AM', 'Biochemistry Lab', 'Building 13', 'Group 221 B only'],
        ['1:50 PM', 'Microbiology Lab', 'Building 13', '']
      ],
      Tuesday: [
        ['8:30 AM', 'Histology Lab', 'Building 11', ''],
        ['1:50 PM', 'Sport', 'Building 1', ''],
        ['3:30 PM', 'Anatomy Lecture', 'Building 1 · Room 406', '']
      ],
      Wednesday: [
        ['8:30 AM', 'Physiology Lecture', 'Building 1 · Room 406', ''],
        ['10:15 AM', 'Biochemistry Lecture', 'Building 1 · Room 406', ''],
        ['12:05 PM', 'Hygiene Lab', 'Building 3 · Room 310', ''],
        ['1:50 PM', 'Russian Language Lab', 'Building 25 · Room 414', ''],
        ['3:30 PM', 'Psychology Lab', 'Building 3 · Room 205', '']
      ],
      Thursday: [
        ['8:30 AM', 'Anatomy Lab', 'Building 11', ''],
        ['1:50 PM', 'Deontology Lecture', 'Building 1 · Room 406', ''],
        ['3:30 PM', 'Hygiene Lecture', 'Building 1 · Room 406', ''],
        ['5:10 PM', 'Deontology Lab', 'Building 8', '']
      ],
      Friday: [
        ['8:30 AM', 'Physiology Lab', 'Building 8', ''],
        ['1:50 PM', 'Biochemistry Lab', 'Building 13', 'Group 221 A only']
      ],
      Saturday: [
        ['1:50 PM', 'Russian Language Lecture', 'Building 1 · Room 408', '']
      ]
    }
  };

  const fontCatalog = [
    { id: 'aura', name: 'Aura Sans', label: 'Clean System Display', family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Plus Jakarta Sans', 'Cairo', system-ui, sans-serif", sample: 'Human Medicine · Year 2' },
    { id: 'jakarta', name: 'Plus Jakarta Sans', label: 'Balanced Modern Sans', family: "'Plus Jakarta Sans', 'Cairo', system-ui, sans-serif", sample: 'Anatomy & Clinical Labs' },
    { id: 'cairo', name: 'Cairo', label: 'Crisp Arabic & English', family: "'Cairo', 'Plus Jakarta Sans', sans-serif", sample: 'Group 221 Workspace', arabic: true }
  ];

  const themeCatalog = [
    { id: 'oled-black', name: 'OLED Black', desc: 'True pitch-black #000000 & crystal glass', swatch: 'linear-gradient(135deg, #000000, #16161c)', dark: true },
    { id: 'frosted-light', name: 'Frosted Silver', desc: 'Cool silver-grey daylight so glass stands out', swatch: 'linear-gradient(135deg, #dce3ee, #b8c4d6)', dark: false },
    { id: 'emerald', name: 'Emerald Clinical', desc: 'Calm surgical forest green & crystal glass', swatch: 'linear-gradient(135deg, #091c17, #174539)', dark: true }
  ];

  const accentPresets = [
    { name: 'Royal Blue', c1: '#2563eb', c2: '#4f46e5' },
    { name: 'Clinical Emerald', c1: '#059669', c2: '#047857' },
    { name: 'Deep Violet', c1: '#7c3aed', c2: '#6d28d9' },
    { name: 'Ocean Teal', c1: '#0891b2', c2: '#0e7490' },
    { name: 'Warm Amber', c1: '#d97706', c2: '#b45309' },
    { name: 'Crimson Rose', c1: '#e11d48', c2: '#be123c' }
  ];

  const wallpaperPresets = [
    { name: 'Clean Ambient Gradient (Fastest)', url: '' }
  ];

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShort = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT' };
  const teacherSubjects = ['Anatomy', 'Biochemistry', 'Hygiene', 'Histology', 'Deontology', 'Microbiology', 'Physiology', 'Psychology', 'Russian Language', 'Sport'];
  const seminarTopics = [
    { id: 'cardio', title: 'Cardiovascular Physiology', subject: 'Normal Physiology', desc: 'Specialist video sessions on cardiac output, hemodynamics, and ECG interpretation.', icon: 'activity' },
    { id: 'thorax', title: 'Topographic Anatomy of the Thorax', subject: 'Anatomy', desc: '3D anatomical walkthroughs of mediastinal structures, pleura, and clinical landmarks.', icon: 'layers' },
    { id: 'micro-lab', title: 'Microbiology Lab & Staining', subject: 'Microbiology & Virology', desc: 'Step-by-step Gram staining, culture media, and biosafety protocols.', icon: 'bug' },
    { id: 'clinical', title: 'Clinical Deontology & Communication', subject: 'Medical Deontology', desc: 'Patient-centered communication, medical ethics, and clinical case scenarios.', icon: 'heart' }
  ];

  const iconPaths = {
    grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v16M8 7h8M8 11h8"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>',
    video: '<rect x="3" y="5" width="13" height="14" rx="2.5"/><path d="m16 10 5-3v10l-5-3z"/>',
    message: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-4-.9L4 20l1.9-3.2A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3z"/>',
    spark: '<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"/>',
    shield: '<path d="M12 3 20 6v5c0 5.2-3.2 8.5-8 10-4.8-1.5-8-4.8-8-10V6z"/><path d="m8 12 2.7 2.7L16 9.5"/>',
    activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
    atom: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="8" ry="3.5"/><ellipse cx="12" cy="12" rx="8" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8" ry="3.5" transform="rotate(120 12 12)"/>',
    microscope: '<path d="M6 21h12M9 17h8M12 3h3v5h-3zM9 8h8v3H9zM12 11v6M7 12a5 5 0 0 0 5 5h5"/>',
    heart: '<path d="M20.8 8.8c0 5.4-8.8 10.7-8.8 10.7S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7z"/>',
    bug: '<path d="M9 8h6v6a3 3 0 0 1-6 0zM12 5v3M8 5l2 3M16 5l-2 3M6 11H3M21 11h-3M7 15l-3 2M17 15l3 2"/>',
    brain: '<path d="M9.5 5.5A3.5 3.5 0 0 0 6 9c0 .4 0 .8.2 1.1A3.8 3.8 0 0 0 7 17.5h2.5V21M14.5 5.5A3.5 3.5 0 0 1 18 9c0 .4 0 .8-.2 1.1a3.8 3.8 0 0 1-.8 7.4h-2.5V21M12 5v16"/>',
    zap: '<path d="m13 2-9 12h7l-1 8 9-12h-7z"/>',
    scalpel: '<path d="m14 4 6 6M4 20l7.5-7.5M15 3l6 6M11.5 12.5l-3-3 3.5-3.5 3 3z"/>',
    edit: '<path d="m4 16-.7 4.7L8 20l11.3-11.3-4-4z"/>',
    eye: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="2.5"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-4 4-3-3-6 6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-15-6.7L3 8m0-5v5h5M3 12a9 9 0 0 0 15 6.7l3-2.7m0 5v-5h-5"/>',
    logout: '<path d="M10 5H5v14h5M15 8l4 4-4 4M19 12H9"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 5V5L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 3.6"/><path d="M12 17h.01"/>',
    thumbsUp: '<path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4-7a2 2 0 0 1 3 1.7V10h4.3a2 2 0 0 1 2 2.3l-1.1 6A2 2 0 0 1 17.2 20H7"/>',
    pin: '<path d="m12 17 5-5-5-5-5 5 5 5z"/><path d="M12 17v5"/>',
    poll: '<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 18h.01"/>'
  };

  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.spark}</svg>`;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (_) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } };

  // ==========================================================================
  // Accounts & Passwordless Role-Based Authentication
  // ==========================================================================
  let schedule = read(SCHEDULE_KEY, defaultSchedule);
  let accounts = (() => {
    const saved = read(ACCOUNT_KEY, null);
    if (!Array.isArray(saved) || !saved.length) {
      write(ACCOUNT_KEY, defaultAccounts);
      return defaultAccounts.map((a) => ({ ...a }));
    }
    // Migrate admin handle to fixed `3mar_r` & bind ADMIN_EMAIL cleanly (remove any duplicate student row with ADMIN_EMAIL)
    let migrated = false;
    const cleaned = [];
    saved.forEach((a) => {
      if (!a) return;
      if (a.username === '3mAr_R221' || a.username === '3mar_rr' || a.role === 'admin' || isAdminHandle(a.username)) {
        if (a.username !== '3mar_r') { a.username = '3mar_r'; migrated = true; }
        if (!a.email || a.email === 'omar.tarek@med221.edu') { a.email = ADMIN_EMAIL; migrated = true; }
        a.role = 'admin';
        if (!cleaned.some((x) => isAdminHandle(x.username))) cleaned.push(a);
        return;
      }
      if (isAdminEmail(a.email)) {
        migrated = true;
        return;
      }
      cleaned.push(a);
    });
    if (!cleaned.some((x) => isAdminHandle(x.username))) {
      cleaned.unshift({ ...defaultAccounts[0] });
      migrated = true;
    }
    if (migrated) write(ACCOUNT_KEY, cleaned);
    return cleaned;
  })();

  let session = (() => {
    try {
      const s = localStorage.getItem(SESSION_KEY) || '';
      if (s === '3mAr_R221' || s === '3mar_rr') {
        localStorage.setItem(SESSION_KEY, '3mar_r');
        return '3mar_r';
      }
      return s;
    } catch (_) { return ''; }
  })();
  let current = accounts.find((a) => a.username === session) || accounts.find((a) => a.username.toLowerCase() === session.toLowerCase()) || null;
  if (!current && session && (isAdminEmail(session) || session.toLowerCase().includes('oytyfyayyy'))) {
    current = accounts.find((a) => isAdminHandle(a.username)) || null;
    if (current) {
      session = current.username;
      try { localStorage.setItem(SESSION_KEY, session); } catch (_) {}
    }
  }
  const isAdmin = () => Boolean(current && (isAdminHandle(current.username) || isAdminEmail(current.email)));

  function activateLeaderAccount({ provider = '', avatarImage = '', name = '' } = {}) {
    let adminAcc = accounts.find((a) => isAdminHandle(a.username));
    if (!adminAcc) {
      adminAcc = { ...defaultAccounts[0] };
      accounts.unshift(adminAcc);
    }
    adminAcc.username = '3mar_r';
    adminAcc.role = 'admin';
    adminAcc.email = ADMIN_EMAIL;
    if (provider) adminAcc.provider = provider;
    if (avatarImage && !adminAcc.avatarImage) adminAcc.avatarImage = avatarImage;
    if (name && !adminAcc.name) adminAcc.name = name;
    accounts = accounts.filter((a) => isAdminHandle(a.username) || !isAdminEmail(a.email));
    write(ACCOUNT_KEY, accounts);
    activateAccountSession(adminAcc);
    if (typeof HubSync !== 'undefined') HubSync.push('account_register', { account: adminAcc });
    return adminAcc;
  }

  async function hashPassword(raw) {
    const str = `dr221::${String(raw || '')}`;
    try {
      if (window.crypto?.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (_) {}
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return `fb_${(h >>> 0).toString(16)}`;
  }

  function activateAccountSession(user) {
    session = user.username;
    current = user;
    try { localStorage.setItem(SESSION_KEY, session); } catch (_) {}
    return user;
  }

  function signInWithName(rawInput, selectedGroup = 'Group 221 A') {
    const clean = String(rawInput || '').trim();
    if (!clean) return null;
    if (isAdminHandle(clean)) {
      let adminAcc = accounts.find((a) => isAdminHandle(a.username));
      if (!adminAcc) { adminAcc = { ...defaultAccounts[0] }; accounts.unshift(adminAcc); }
      adminAcc.username = '3mar_r';
      adminAcc.role = 'admin';
      write(ACCOUNT_KEY, accounts);
      return activateAccountSession(adminAcc);
    }
    const slug = clean.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '_').replace(/^_|_$/g, '') || `student_${Date.now()}`;
    let user = accounts.find((a) => a.username.toLowerCase() === slug || a.name.toLowerCase() === clean.toLowerCase());
    if (!user) {
      const initials = clean.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';
      user = {
        username: slug, role: 'student', name: clean, email: '', pwHash: '', provider: 'email',
        group: selectedGroup || 'Group 221 A', studentId: `MED-221-${Math.floor(10 + Math.random() * 89)}`,
        bio: `Human Medicine Year 2 · ${selectedGroup || 'Group 221 A'}`, avatar: initials, flair: '🩺', status: 'online', avatarImage: '', coverImage: ''
      };
      accounts.push(user);
      write(ACCOUNT_KEY, accounts);
    }
    activateAccountSession(user);
    if (typeof HubSync !== 'undefined') HubSync.push('account_register', { account: user });
    return user;
  }

  async function loginAccount(identifier, password = '') {
    const clean = String(identifier || '').trim();
    const pass = String(password || '');
    if (!clean) return { ok: false, error: isAr() ? 'أدخل البريد الإلكتروني أو اسم المستخدم.' : 'Please enter your email or username.' };

    if (isAdminHandle(clean) || isAdminEmail(clean)) {
      let adminAcc = accounts.find((a) => isAdminHandle(a.username));
      if (!adminAcc) { adminAcc = { ...defaultAccounts[0] }; accounts.unshift(adminAcc); }
      if (adminAcc.pwHash && pass) {
        const h = await hashPassword(pass);
        if (h !== adminAcc.pwHash) return { ok: false, error: isAr() ? 'كلمة المرور غير صحيحة.' : 'Incorrect password.' };
      }
      return { ok: true, user: activateLeaderAccount() };
    }

    if (typeof HubSync !== 'undefined') await HubSync.pullKV().catch(() => {});

    const q = clean.toLowerCase().replace(/^@/, '');
    const found = accounts.find((a) =>
      (a.email && a.email.toLowerCase() === q) || a.username.toLowerCase() === q || a.name.toLowerCase() === q
    );
    if (!found) {
      return { ok: false, error: isAr() ? 'الحساب غير موجود — انتقل إلى Sign Up لإنشاء حساب جديد.' : 'Account not found. Switch to Sign Up to create an account.' };
    }
    if (found.pwHash) {
      if (!pass) return { ok: false, error: isAr() ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.' };
      if ((await hashPassword(pass)) !== found.pwHash) return { ok: false, error: isAr() ? 'كلمة المرور غير صحيحة.' : 'Incorrect password.' };
    }
    return { ok: true, user: activateAccountSession(found) };
  }

  async function signUpAccount({ name, email, password, group = 'Group 221 A', provider = 'email', avatarImage = '', handleOverride = '' }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const pass = String(password || '');

    if (!cleanName) return { ok: false, error: isAr() ? 'يرجى إدخال الاسم الكامل.' : 'Please enter your full name.' };
    if (isAdminEmail(cleanEmail)) {
      if (provider !== 'email') {
        return { ok: true, user: activateLeaderAccount({ provider, avatarImage, name: cleanName }) };
      }
      return { ok: false, error: isAr() ? 'هذا البريد مرتبط بالفعل — استخدم Log In أو الدخول عبر Google.' : 'This email is already linked — please use Log In or Google Sign-In.' };
    }
    if (isAdminHandle(cleanName) || isAdminHandle(cleanEmail) || isAdminHandle(handleOverride)) {
      return { ok: false, error: isAr() ? 'هذا الاسم محجوز، اختر اسماً آخر.' : 'This username is reserved.' };
    }
    if (provider === 'email' && (!cleanEmail || !cleanEmail.includes('@'))) {
      return { ok: false, error: isAr() ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email.' };
    }
    if (provider === 'email' && pass.length < 6) {
      return { ok: false, error: isAr() ? 'كلمة المرور 6 أحرف على الأقل.' : 'Password must be at least 6 characters.' };
    }

    if (typeof HubSync !== 'undefined') await HubSync.pullKV().catch(() => {});

    const existing = accounts.find((a) =>
      (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail) ||
      (handleOverride && a.username.toLowerCase() === handleOverride.toLowerCase())
    );
    if (existing) {
      if (provider !== 'email') {
        existing.provider = provider;
        if (cleanName) existing.name = cleanName;
        if (avatarImage) existing.avatarImage = avatarImage;
        write(ACCOUNT_KEY, accounts);
        if (typeof HubSync !== 'undefined') await HubSync.push('account_register', { account: existing });
        return { ok: true, user: activateAccountSession(existing) };
      }
      return { ok: false, error: isAr() ? 'البريد مسجل بالفعل — استخدم Log In.' : 'Email already registered. Please use Log In.' };
    }

    let baseSlug = (handleOverride || cleanName).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9\u0600-\u06FF]+/g, '_').replace(/^_|_$/g, '');
    if (!baseSlug) baseSlug = cleanEmail.split('@')[0].replace(/[^a-z0-9_]+/g, '_') || `student_${Date.now()}`;
    let slug = baseSlug;
    let suffix = 2;
    while (accounts.some((a) => a.username.toLowerCase() === slug.toLowerCase()) || isAdminHandle(slug)) {
      slug = `${baseSlug}_${suffix++}`;
    }

    const initials = cleanName.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';
    const pwHash = pass ? await hashPassword(pass) : '';
    const user = {
      username: slug, role: 'student', name: cleanName, email: cleanEmail, pwHash, provider,
      group: group || 'Group 221 A', studentId: `MED-221-${Math.floor(10 + Math.random() * 89)}`,
      bio: `Human Medicine Year 2 · ${group || 'Group 221 A'}`, avatar: initials, flair: '🩺', status: 'online',
      avatarImage: avatarImage || '', coverImage: ''
    };
    accounts.push(user);
    write(ACCOUNT_KEY, accounts);
    activateAccountSession(user);
    if (typeof HubSync !== 'undefined') await HubSync.push('account_register', { account: user });
    return { ok: true, user };
  }

  async function checkSupabaseOAuthProviders() {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_KEY },
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.external || null;
    } catch (_) {
      return null;
    }
  }

  async function handleOAuthReturnIfPresent() {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (search.includes('error_description=') || hash.includes('error_description=')) {
      const p = new URLSearchParams((hash || search).replace(/^[#?]/, ''));
      const errDesc = p.get('error_description') || p.get('error') || 'OAuth sign-in cancelled.';
      try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
      setTimeout(() => notify(errDesc), 200);
      return false;
    }
    if (!hash.includes('access_token=')) return false;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    if (!accessToken) return false;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
      });
      if (!res.ok) return false;
      const u = await res.json();
      const email = u?.email || '';
      const meta = u?.user_metadata || {};
      const fullName = meta.full_name || meta.name || email.split('@')[0] || 'Student';
      const avatar = meta.avatar_url || meta.picture || '';
      const rawProv = u?.app_metadata?.provider || 'google';
      const provider = rawProv === 'azure' ? 'microsoft' : rawProv;
      if (isAdminEmail(email)) {
        activateLeaderAccount({ provider, avatarImage: avatar });
        try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
        window.location.href = 'dashboard.html';
        return true;
      }
      const result = await signUpAccount({
        name: fullName,
        email: email || `${fullName}@dr221.edu`,
        password: '',
        group: 'Group 221 A',
        provider,
        avatarImage: avatar
      });
      if (result.ok) {
        try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
        window.location.href = 'dashboard.html';
        return true;
      }
    } catch (_) {}
    return false;
  }

  function signOut() {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    session = '';
    current = null;
    window.location.href = 'login.html';
  }

  function getCourses() {
    const customCovers = read(SUBJECT_COVERS_KEY, {});
    return baseCourses.map((c) => ({
      ...c,
      image: customCovers[c.id] || c.image
    }));
  }

  function getSiteConfig() {
    return {
      name: 'Dr. 221',
      tagline: 'Human Medicine · Year 2',
      ...read(SITE_KEY, {})
    };
  }

  function getPrefs() {
    return {
      lang: 'en',
      theme: 'oled-black',
      font: 'aura',
      accent: '#2563eb',
      accent2: '#4f46e5',
      glassBlur: 20,
      glassAlpha: 0.76,
      radius: 22,
      scale: 1,
      contentWidth: 1460,
      density: 'comfortable',
      soundEffects: true,
      motion: true,
      wallpaper: '',
      weekParityFlip: false,
      groupFilter: 'all',
      aiApiKey: '',
      ...read(PREF_KEY, {})
    };
  }

  function parseHex(hex) {
    const clean = String(hex || '').replace('#', '').trim();
    if (clean.length === 3) {
      return {
        r: parseInt(clean[0] + clean[0], 16),
        g: parseInt(clean[1] + clean[1], 16),
        b: parseInt(clean[2] + clean[2], 16)
      };
    }
    if (clean.length !== 6) return { r: 37, g: 99, b: 235 };
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function relativeLuminance({ r, g, b }) {
    const norm = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
  }

  function adjustHex({ r, g, b }, factor) {
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
    const toHex = (n) => clamp(n).toString(16).padStart(2, '0');
    if (factor >= 0) {
      return `#${toHex(r + (255 - r) * factor)}${toHex(g + (255 - g) * factor)}${toHex(b + (255 - b) * factor)}`;
    }
    const f = 1 + factor;
    return `#${toHex(r * f)}${toHex(g * f)}${toHex(b * f)}`;
  }

  function applyPreferences() {
    const p = getPrefs();
    const root = document.documentElement;
    const themeObj = themeCatalog.find((t) => t.id === p.theme) || themeCatalog[0];
    root.dataset.theme = themeObj.id;
    const _mc = $('meta[name="theme-color"]'); if (_mc) _mc.setAttribute('content', themeObj.dark ? '#000000' : '#edf2f8');
    root.dataset.motion = p.motion === false ? 'off' : 'on';
    root.dataset.density = p.density || 'comfortable';

    const activeLang = p.lang === 'ar' ? 'ar' : 'en';
    root.lang = activeLang;
    root.dir = 'ltr';

    const fontObj = fontCatalog.find((f) => f.id === p.font) || fontCatalog[0];
    const effectiveFontFamily = activeLang === 'ar' && !fontObj.arabic
      ? `'Cairo', 'IBM Plex Sans Arabic', 'Tajawal', ${fontObj.family}`
      : fontObj.family;
    root.style.setProperty('--font-family', effectiveFontFamily);

    const accentHex = p.accent || '#2563eb';
    const rgb = parseHex(accentHex);
    const lum = relativeLuminance(rgb);
    const onAccent = lum > 0.44 ? '#0f172a' : '#ffffff';
    let accentInk = accentHex;
    if (!themeObj.dark && lum > 0.34) {
      accentInk = adjustHex(rgb, -0.36);
    } else if (themeObj.dark && lum < 0.22) {
      accentInk = adjustHex(rgb, 0.48);
    }

    root.style.setProperty('--accent', accentHex);
    root.style.setProperty('--accent-2', p.accent2 || accentHex);
    root.style.setProperty('--on-accent', onAccent);
    root.style.setProperty('--accent-ink', accentInk);
    root.style.setProperty('--accent-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${themeObj.dark ? 0.20 : 0.12})`);
    root.style.setProperty('--glass-blur', `${p.glassBlur ?? 18}px`);
    root.style.setProperty('--glass-alpha', String(p.glassAlpha ?? 0.85));
    root.style.setProperty('--radius', `${p.radius ?? 22}px`);
    root.style.setProperty('--ui-scale', String(p.scale || 1));
    root.style.setProperty('--content-max', `${p.contentWidth || 1460}px`);
    root.style.setProperty('--wallpaper-url', p.wallpaper ? `url("${p.wallpaper}")` : 'none');
  }

  function updatePreferences(next) {
    const merged = { ...getPrefs(), ...next };
    write(PREF_KEY, merged);
    applyPreferences();
    return merged;
  }


  // ==========================================================================
  // Telegram-Style Circular Expanding Theme Transition (60fps View Transitions)
  // ==========================================================================
  const themeBgColors = {
    'oled-black': '#000000',
    'frosted-light': '#cfd7e3',
    'emerald': '#081814'
  };

  function switchThemeWithRipple(nextThemeId, triggerEvent = null, onApplied = null) {
    const tObj = themeCatalog.find((t) => t.id === nextThemeId) || themeCatalog[0];
    let x = window.innerWidth - 72;
    let y = 34;

    if (triggerEvent) {
      if (typeof triggerEvent.clientX === 'number' && (triggerEvent.clientX > 0 || triggerEvent.clientY > 0)) {
        x = triggerEvent.clientX;
        y = triggerEvent.clientY;
      } else if (triggerEvent.currentTarget?.getBoundingClientRect) {
        const rect = triggerEvent.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const applyNow = () => {
      updatePreferences({ theme: tObj.id });
      const metaTheme = $('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', themeBgColors[tObj.id] || '#000000');
      if ($('#themeQuickBtn')) {
        $('#themeQuickBtn').innerHTML = icon(tObj.dark ? 'sun' : 'moon');
        $('#themeQuickBtn').classList.remove('theme-spin');
        void $('#themeQuickBtn').offsetWidth;
        $('#themeQuickBtn').classList.add('theme-spin');
      }
      if (typeof onApplied === 'function') onApplied(tObj);
    };

    const motionOff = getPrefs().motion === false || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (motionOff) {
      applyNow();
      return;
    }

    // Native View Transitions API (True Telegram expanding circular clip-path over live DOM!)
    if (typeof document.startViewTransition === 'function') {
      try {
        const vt = document.startViewTransition(() => {
          applyNow();
        });
        vt.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
              ]
            },
            {
              duration: 560,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)'
            }
          );
        }).catch(() => {});
        return;
      } catch (_) {}
    }

    // Smooth GPU Circular Wave Fallback (for browsers without View Transitions API)
    const wave = document.createElement('div');
    wave.className = 'theme-ripple-wave';
    const dia = endRadius * 2.1;
    wave.style.width = `${dia}px`;
    wave.style.height = `${dia}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.background = themeBgColors[tObj.id] || '#000000';
    document.body.appendChild(wave);
    void wave.offsetWidth;
    wave.style.transform = 'translate(-50%, -50%) scale(1)';
    setTimeout(() => {
      applyNow();
      wave.style.opacity = '0';
      setTimeout(() => wave.remove(), 260);
    }, 340);
  }

  function notify(msg) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__dr221Toast);
    window.__dr221Toast = setTimeout(() => toast.classList.remove('show'), msg && (msg.includes('✕') || msg.includes('Error') || msg.includes('فشل')) ? 6500 : 3200);
  }


  // ==========================================================================
  // v11 Complete Bilingual Localization Engine (Arabic RTL + English LTR)
  // ==========================================================================
  const isAr = () => getPrefs().lang === 'ar';

  const AR_EXACT = {
    'Academic Workspace': 'المساحة الدراسية',
    'Overview': 'الرئيسية',
    'Live Schedule': 'الجدول المباشر',
    'My Courses': 'المواد الدراسية',
    'Study Database': 'قاعدة الملفات',
    'Student Q&A': 'سؤال وجواب',
    'Seminars': 'الندوات والفيديو',
    'Student Chat': 'محادثة الطلاب',
    'Personal': 'شخصي',
    'My Profile': 'الملف الشخصي',
    'Settings': 'الإعدادات',
    'Admin Console': 'لوحة الإدارة',
    'Administrator': 'المشرف',
    'Admin': 'مشرف',
    'Student': 'طالب',
    'Home': 'الرئيسية',
    'Schedule': 'الجدول',
    'Database': 'الملفات',
    'Q&A': 'أسئلة',
    'Chat': 'الشات',
    'Install App': 'تثبيت التطبيق',
    'Full Schedule': 'الجدول الكامل',
    'Upload Materials': 'رفع ملفات',
    'Study Library': 'مكتبة الملفات',
    'Ask Dr. 221 AI': 'اسأل المساعد الذكي',
    'Focused Medical Study.': 'مذاكرة طبية مركزة.',
    'Clear & Organized.': 'واضحة ومنظمة.',
    'Active Week': 'الأسبوع الحالي',
    'Database Files': 'ملفات المكتبة',
    'Core Subjects': 'المواد الأساسية',
    'Account Role': 'نوع الحساب',
    'Admin Write': 'صلاحية نشر وتعديل',
    'Student Read-Only': 'قراءة وتحميل فقط',
    'Daily Student Recap': 'ملخص اليوم الدراسي',
    'What We Covered Today': 'إيه اللي اتاخد النهارده؟',
    'Quick summary of lectures, practical lab prep, and upcoming quizzes for Group 221 A & B.': 'ملخص سريع لما تم شرحه في المحاضرات والمعامل والمطلوب للمعمل القادم لجروب 221 A و B.',
    'Ask Classmates (Q&A)': 'اسأل زمايلك',
    'Post Daily Recap': 'إضافة ملخص اليوم',
    'Today & Upcoming Classes': 'محاضرات اليوم والقادمة',
    'Full timetable': 'الجدول بالكامل',
    'Quick Subject Folders': 'مجلدات المواد السريعة',
    'Jump straight into your course materials': 'ادخل مباشرة على ملفات كل مادة',
    'All 12 folders': 'كل الـ 12 مادة',
    'Real-Time Calendar Sync': 'مزامنة تلقائية مع التاريخ',
    'Class Schedule': 'الجدول الدراسي',
    'Automatically tracks the current calendar date, switches Week 1 / Week 2 every Monday, and highlights live classes.': 'يتابع تاريخ اليوم تلقائياً، ويبدّل بين الأسبوع 1 والأسبوع 2 كل إثنين، ويحدد المحاضرة الحالية مباشرة.',
    'Today': 'اليوم',
    'Copy Today': 'نسخ جدول اليوم',
    'Sync Calendar (.ics)': 'مزامنة التقويم (.ics)',
    'Full Week': 'الأسبوع بالكامل',
    'Edit Classes': 'تعديل المحاضرات',
    'Last Week': 'الأسبوع الماضي',
    'This Week': 'هذا الأسبوع',
    'Next Week': 'الأسبوع القادم',
    'All Group 221': 'كل جروب 221',
    'Group 221 A': 'جروب 221 A',
    'Group 221 B': 'جروب 221 B',
    'Assign Teachers': 'تعديل أسماء الدكاترة',
    'Year 2 Curriculum': 'منهج السنة الثانية',
    'All 12 Subjects': 'كل الـ 12 مادة',
    'In Progress': 'قيد الدراسة',
    'Semester 2': 'الترم الثاني',
    'Open Files': 'فتح الملفات',
    'Administrator Database Controls': 'إدارة قاعدة الملفات',
    'Student Read-Only Library': 'مكتبة الملفات (للقراءة والتحميل)',
    'Backup DB': 'نسخة احتياطية',
    '+ Upload Files': '+ رفع ملفات',
    'Read-Only Student Access': 'صلاحية طالب (قراءة وتحميل)',
    'All 12 Subject Folders': 'كل مجلدات المواد (12 مادة)',
    'All Folders': 'كل المجلدات',
    'Direct Upload': 'رفع مباشر',
    'Admin Direct Upload': 'رفع مباشر من المشرف',
    'Add Files to Subject': 'إضافة ملفات للمادة',
    '1. Choose Subject Folder': '1. اختر مجلد المادة',
    '2. Material Category': '2. تصنيف الملف',
    '3. Short Note (Optional)': '3. ملاحظة مختصرة (اختياري)',
    'Click or Drag & Drop Files Here': 'اضغط أو اسحب الملفات وأفلتها هنا',
    'Supports PDF, PPTX, DOCX, Images, Videos, ZIP': 'يدعم PDF، العروض، Word، الصور، الفيديو، وZIP',
    'Storage Engine': 'حجم التخزين',
    'Contribute to Group 221': 'ساهم مع جروب 221',
    'Send a File to Admin': 'ابعت ملف للمشرف',
    'Choose File(s) to Send': 'اختر ملف لإرساله',
    'Sent safely for Admin approval': 'يُرسل للمشرف للمراجعة والنشر باسمك',
    'Missing Something?': 'ملف ناقص؟',
    'Request a Missing File': 'اطلب ملف ناقص',
    'Subject Folder': 'مجلد المادة',
    'Subject': 'المادة',
    'What file do you need?': 'ما هو الملف المطلوب؟',
    'Send Request': 'إرسال الطلب',
    'Open': 'فتح',
    'Download': 'تحميل',
    'Open in New Tab': 'فتح في تبويب جديد',
    'Classmate Knowledge Board': 'منتدى أسئلة الدفعة',
    'Ask a Question': 'اطرح سؤالاً',
    'Ask Classmates': 'اسأل زمايلك',
    'Question Title': 'عنوان السؤال',
    'Extra Details (Optional)': 'تفاصيل إضافية (اختياري)',
    'Post Question': 'نشر السؤال',
    'Reply': 'رد',
    'Cancel': 'إلغاء',
    'Pinned': 'مثبّت',
    'Clinical & Video Tracks': 'مسارات الفيديو والندوات',
    'Upload Video to Track': 'رفع فيديو للمسار',
    'Watch': 'مشاهدة',
    'Group 221 Network': 'شبكة جروب 221',
    'Group Channels & Private Chat Oversight': 'قنوات الجروب ومتابعة الشات الخاص',
    'Channels': 'القنوات',
    'Group 221 · A': 'جروب 221 · A',
    'Group 221 · B': 'جروب 221 · B',
    'Private Chat (1-to-1)': 'محادثة خاصة (1-to-1)',
    'Group Polls': 'تصويتات الجروب',
    'Select Classmate': 'اختر زميلاً',
    'Admin Oversight · Private Chats': 'متابعة المشرف · الشات الخاص',
    'Send': 'إرسال',
    'New Poll': 'تصويت جديد',
    'Create Quick Poll': 'إنشاء تصويت سريع',
    'Publish Poll': 'نشر التصويت',
    'Academic Identity': 'الهوية الأكاديمية',
    'Change Cover': 'تغيير الغلاف',
    'Personal Details': 'البيانات الشخصية',
    'Display Name': 'الاسم الظاهر',
    'Study Group': 'المجموعة الدراسية',
    'Student ID': 'الرقم الجامعي',
    'Email': 'البريد الإلكتروني',
    'Bio': 'نبذة عنك',
    'Save Personal Profile': 'حفظ الملف الشخصي',
    'Academic Summary': 'الملخص الأكاديمي',
    'Faculty': 'الكلية',
    'Human Medicine': 'الطب البشري',
    'Academic Year': 'السنة الدراسية',
    'Year 2 (2026)': 'السنة الثانية (2026)',
    'Subgroup': 'المجموعة الفرعية',
    'Role': 'الصلاحية',
    'Personalization': 'التخصيص والمظهر',
    'Appearance & Glass': 'المظهر والزجاج',
    'Typography & Layout': 'اللغة والخطوط والتخطيط',
    'Photos': 'الصور',
    'Photos & Subject Covers': 'الصور وأغلفة المواد',
    'Schedule Sync': 'مزامنة الجدول',
    'AI & Database': 'الذكاء الاصطناعي والملفات',
    'Appearance, Glass Opacity & Colors': 'المظهر وشفافية الزجاج والألوان',
    'Theme Palette': 'الثيمات والألوان',
    'Accent Highlight Color': 'لون التمييز الأساسي',
    'Card Opacity (Transparency Control)': 'شفافية البطاقات',
    'Backdrop Blur Strength': 'قوة التمويه الزجاجي',
    'Background Wallpaper': 'خلفية الموقع',
    'Upload Custom Wallpaper': 'رفع خلفية مخصصة',
    'Remove Wallpaper': 'حذف الخلفية',
    'Typography & Layout': 'اللغة والخطوط والتخطيط',
    'Active Font Preview': 'معاينة الخط الحالي',
    'Choose Font Family': 'اختر نوع الخط',
    'Interface Text & UI Scale': 'حجم النصوص والواجهة',
    'Card Corner Roundness': 'استدارة حواف البطاقات',
    'Workspace Width': 'عرض مساحة العمل',
    'Glass Lens & Spring Motion': 'حركة العدسة الزجاجية والأنيميشن',
    'Automatic Schedule Synchronization': 'المزامنة التلقائية للجدول',
    'Current Synced Week': 'الأسبوع الدراسي الحالي',
    'Flip Week 1 / Week 2 Parity': 'تبديل ترتيب الأسبوع 1 / 2',
    'Default Group Filter': 'فلتر المجموعة الافتراضي',
    'Export Synced Week to Phone/Google Calendar (.ics)': 'تصدير الجدول لتقويم الهاتف وجوجل (.ics)',
    'AI Copilot & Study Database': 'المساعد الذكي وقاعدة الملفات',
    'Total Study Files': 'إجمالي الملفات',
    'Local IndexedDB Size': 'مساحة التخزين المحلي',
    'Save': 'حفظ',
    'Save Key': 'حفظ المفتاح',
    'Export Full Backup (.json)': 'تصدير نسخة احتياطية (.json)',
    'Restore Backup (.json)': 'استعادة نسخة احتياطية (.json)',
    'Administrator Control Center': 'مركز تحكم المشرف',
    'Live Broadcast': 'تنبيه عاجل مباشر',
    'Urgent Alert Banner': 'شريط التنبيهات العاجلة',
    'Alert Title': 'عنوان التنبيه',
    'Alert Type': 'مستوى التنبيه',
    'Broadcast Message': 'نص التنبيه',
    'Publish Live Banner': 'نشر التنبيه للجميع',
    'Clear Active Banner': 'إزالة التنبيه',
    'Site Branding & Quick Links': 'هوية الموقع وروابط سريعة',
    'Save Branding': 'حفظ الهوية',
    'Student Contributions': 'مساهمات الطلاب',
    'Pending File Submissions': 'ملفات بانتظار الموافقة',
    'Missing Materials': 'ملفات مطلوبة',
    'Student File Requests': 'طلبات ملفات الطلاب',
    'Approve': 'موافقة ونشر',
    'Fulfilled': 'تم التنفيذ',
    'Done': 'مكتمل',
    'Sign In': 'تسجيل الدخول',
    'Log In': 'تسجيل الدخول',
    "Today's Classes": 'محاضرات اليوم',
    'Latest Study Files': 'أحدث الملفات المرفوعة',
    'Tap any recent cloud file to open immediately': 'اضغط على أي ملف لفتحه مباشرة',
    'Clear Local': 'مسح المحلي',
    'Post Recap': 'إضافة ملخص',
    'Study Files': 'ملفات المذاكرة',
    'Group Chat': 'محادثة الجروب',
    'Sign Up': 'إنشاء حساب',
    'Create Account': 'إنشاء حساب جديد',
    'Email or Username': 'البريد الإلكتروني أو اسم المستخدم',
    'Password': 'كلمة المرور',
    'Full Name': 'الاسم الكامل',
    'Email': 'البريد الإلكتروني',
    'Group': 'المجموعة',
    'Or continue with': 'أو المتابعة عبر',
    'Instant Workspace Access': 'دخول فوري بدون كلمة مرور',
    'Your Name or Handle': 'اسمك أو اسم المستخدم',
    'Academic Subgroup': 'المجموعة الدراسية',
    'Enter Workspace': 'دخول إلى المنصة',
    'Your Academic Workspace, Ready Instantly.': 'مساحتك الدراسية لجروب 221 جاهزة فوراً.',
    'Enter your name below to access live synchronized schedules, all 12 medical subjects, study materials, and Group 221 student chat — no password required.': 'اكتب اسمك بالأسفل للدخول مباشرة إلى الجدول المتزامن، جميع المواد الـ 12، قاعدة الملفات، وشات طلاب جروب 221 بدون كلمة مرور.',
    'Students have read-only access to published files.': 'للطلاب صلاحية القراءة والتحميل وإرسال المساهمات.',
    'Protected': 'محمي',
    'Dr. 221 AI Copilot': 'مساعد د. 221 الذكي',
    'Bilingual Medical & Schedule Assistant': 'مساعد طبي ودراسي بالعربية والإنجليزية',
    'Next class': 'المحاضرة القادمة',
    'Quiz me (MCQ)': 'اختبرني بسؤال طبي',
    'Cardiac cycle': 'الدورة القلبية',
    'Database Viewer': 'عارض الملفات',
    'Save Timetable': 'حفظ الجدول',
    'Add Class': 'إضافة حصة',
    'Save Teachers': 'حفظ أسماء الدكاترة',
    'Publish Recap': 'نشر الملخص',
    'No classes scheduled for this day.': 'لا توجد محاضرات مجدولة في هذا اليوم.',
    'Medical Subjects': 'مادة طبية',
    'Library Files': 'ملفات المكتبة',
    'Synced Schedule': 'الجدول المتزامن',
    'Site Permission': 'الصلاحية',
    'Registered Users': 'المستخدمون المسجلون',
    'Private Threads': 'محادثات خاصة',
    'Live Timetable': 'الجدول المباشر',
    '12 Subjects': '12 مادة دراسية',
    'Group 221 Chat': 'شات جروب 221',
    'Dr. 221 AI': 'الذكاء الاصطناعي',
    'Anatomy': 'التشريح · Anatomy',
    'Histology & Embryology': 'الهستولوجي · Histology',
    'Biochemistry': 'الكيمياء الحيوية · Biochemistry',
    'Normal Physiology': 'الفسيولوجي · Physiology',
    'Microbiology & Virology': 'الميكروبيولوجي · Microbiology',
    'Hygiene': 'الصحة العامة · Hygiene',
    'Medical Deontology': 'أخلاقيات الطب · Deontology',
    'Psychiatry & Psychology': 'علم النفس الطبي · Psychology',
    'Russian for Physicians': 'اللغة الروسية · Russian',
    'Physical Education': 'التربية الرياضية · Sport',
    'Immunology': 'المناعة · Immunology',
    'General Surgery': 'الجراحة العامة · Surgery'
  };

  const AR_PLACEHOLDERS = {
    'Search subjects...': 'ابحث في المواد...',
    'Search Anatomy, Histology, Physiology...': 'ابحث عن Anatomy أو Histology أو Physiology...',
    'Search files...': 'ابحث في الملفات...',
    'Search questions or topics...': 'ابحث في الأسئلة أو المواضيع...',
    'Write a message...': 'اكتب رسالتك هنا...',
    'Ask any medical or schedule question...': 'اسأل أي سؤال طبي أو عن الجدول...',
    'Write an answer to help your classmate...': 'اكتب إجابتك لمساعدة زميلك...',
    'e.g. Kareem Adel': 'مثال: كريم عادل',
    'e.g. Cranial nerves summary or Week 2 lab': 'مثال: ملخص الأعصاب القحفية أو معمل الأسبوع 2',
    'e.g. Week 2 Physiology lecture slides': 'مثال: سلايدات محاضرة الفسيولوجي الأسبوع 2',
    'e.g. Histology lab slides photos': 'مثال: صور شرائح معمل الهستولوجي'
  };

  const AR_DAYS = {
    Monday: 'الإثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    Friday: 'الجمعة',
    Saturday: 'السبت'
  };

  const AR_DAY_SHORT = {
    Monday: 'إثن',
    Tuesday: 'ثلا',
    Wednesday: 'أرب',
    Thursday: 'خمي',
    Friday: 'جمع',
    Saturday: 'سبت'
  };

  function trDay(name) {
    return isAr() ? (AR_DAYS[name] || name) : name;
  }

  function trDayShort(name) {
    return isAr() ? (AR_DAY_SHORT[name] || dayShort[name]) : (dayShort[name] || name);
  }

  function translateTextValue(str) {
    if (!isAr() || !str) return str;
    const trimmed = str.trim();
    if (!trimmed) return str;
    if (AR_EXACT[trimmed]) return str.replace(trimmed, AR_EXACT[trimmed]);

    // Pattern-based dynamic Arabic translations
    let out = trimmed;
    if (/^Welcome back,\s*(.+)$/.test(out)) return out.replace(/^Welcome back,\s*(.+)$/, 'أهلاً بعودتك، $1');
    if (/^Academic Week (\d+)$/.test(out)) return out.replace(/^Academic Week (\d+)$/, 'الأسبوع الدراسي $1');
    if (/^Week (\d+)$/.test(out)) return out.replace(/^Week (\d+)$/, 'الأسبوع $1');
    if (/^Focus (\d+:\d+)$/.test(out)) return out.replace(/^Focus (\d+:\d+)$/, 'تركيز $1');
    if (/^Focusing · (\d+:\d+)$/.test(out)) return out.replace(/^Focusing · (\d+:\d+)$/, 'جاري التركيز · $1');
    if (/^Week (\d+) · (\d+)\/(\d+) Today$/.test(out)) return out.replace(/^Week (\d+) · (\d+)\/(\d+) Today$/, 'الأسبوع $1 · $2/$3 اليوم');
    if (/^Study Database \((\d+)\)$/.test(out)) return out.replace(/^Study Database \((\d+)\)$/, 'قاعدة الملفات ($1)');
    if (/^(\d+) files?$/.test(out)) return out.replace(/^(\d+) files?$/, '$1 ملف');
    if (/^Next in ([^:]+): (.+)$/.test(out)) return out.replace(/^Next in ([^:]+): (.+)$/, 'التالي بعد $1: $2');
    if (/^Live: (.+) · (\d+)m left$/.test(out)) return out.replace(/^Live: (.+) · (\d+)m left$/, 'الآن: $1 · متبقي $2 د');
    return str;
  }

  function localizeDom(root = document.body) {
    if (!root) return;
    const arMode = isAr();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      const parentTag = parent?.tagName;
      if (!parentTag || parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'TEXTAREA') continue;
      if (parent.closest('.chat-messages, .ai-messages, .dr-select-native')) continue;
      if (arMode) {
        if (!node.__enOrig) node.__enOrig = node.nodeValue;
        const mapped = translateTextValue(node.__enOrig);
        if (mapped !== node.nodeValue) node.nodeValue = mapped;
      } else if (node.__enOrig && node.nodeValue !== node.__enOrig) {
        node.nodeValue = node.__enOrig;
      }
    }
    $$('input[placeholder], textarea[placeholder]', root).forEach((el) => {
      if (!el.dataset.phEn) el.dataset.phEn = el.getAttribute('placeholder') || '';
      if (arMode) {
        const ph = el.dataset.phEn;
        if (ph && AR_PLACEHOLDERS[ph]) el.setAttribute('placeholder', AR_PLACEHOLDERS[ph]);
      } else if (el.dataset.phEn) {
        el.setAttribute('placeholder', el.dataset.phEn);
      }
    });
    if ($('#langQuickBtn')) $('#langQuickBtn').textContent = arMode ? 'EN' : 'عربي';
    if ($('#loginLangBtn')) $('#loginLangBtn').textContent = arMode ? 'EN' : 'عربي';
  }

  function toggleSiteLanguage() {
    const nextLang = isAr() ? 'en' : 'ar';
    const nextUpdates = { lang: nextLang };
    if (nextLang === 'ar') nextUpdates.font = 'cairo';
    document.body.classList.remove('lang-morphing');
    void document.body.offsetWidth;
    document.body.classList.add('lang-morphing');
    updatePreferences(nextUpdates);
    localizeDom();
    if ($('#scheduleBoard')) renderSchedule();
    if ($('#dashboardScheduleList')) renderDashboard();
    if ($('#materialLibraryRoot')) renderMaterials();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    clearTimeout(window.__langMorphTimer);
    window.__langMorphTimer = setTimeout(() => document.body.classList.remove('lang-morphing'), 360);
    notify(nextLang === 'ar' ? 'تم التبديل إلى العربية بسلاسة' : 'Switched smoothly to English');
  }

  // ==========================================================================
  // Interactive Glassy Oval Lens Controllers (Tabs, Toggles & Left Sidebar)
  // ==========================================================================
  function enhanceCustomSelects(root = document) {
    $$('select', root).forEach((sel) => {
      if (sel.dataset.drEnhanced === '1') {
        syncCustomSelectDisplay(sel);
        return;
      }
      sel.dataset.drEnhanced = '1';
      sel.classList.add('dr-select-native');

      const wrapper = document.createElement('div');
      wrapper.className = 'dr-select';
      if (sel.style.width) wrapper.style.width = sel.style.width;
      if (sel.style.maxWidth) wrapper.style.maxWidth = sel.style.maxWidth;

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'dr-select-trigger';

      const menu = document.createElement('div');
      menu.className = 'dr-select-menu';
      menu.setAttribute('role', 'listbox');

      sel.parentNode.insertBefore(wrapper, sel);
      wrapper.appendChild(sel);
      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);

      const rebuildOptions = () => {
        const opts = Array.from(sel.options);
        const currentOpt = opts[sel.selectedIndex] || opts[0];
        trigger.innerHTML = `<span>${esc(currentOpt ? currentOpt.textContent : 'Select')}</span><span class="dr-chevron">${icon('chevronDown')}</span>`;
        menu.innerHTML = opts.map((opt, idx) => `
          <button type="button" class="dr-select-option ${idx === sel.selectedIndex ? 'selected' : ''}" data-opt-idx="${idx}">
            <span>${esc(opt.textContent)}</span>
            <span class="opt-check">${icon('check')}</span>
          </button>
        `).join('');

        $$('.dr-select-option', menu).forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = Number(btn.dataset.optIdx);
            sel.selectedIndex = idx;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            rebuildOptions();
            wrapper.classList.remove('open');
          });
        });
      };

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = wrapper.classList.contains('open');
        $$('.dr-select.open').forEach((other) => other.classList.remove('open'));
        if (!wasOpen) {
          rebuildOptions();
          wrapper.classList.add('open');
        }
      });

      sel.addEventListener('change', rebuildOptions);
      rebuildOptions();
    });
  }


  // ==========================================================================
  // Refractive Crystal Glass Range Sliders (Matches Blue Glass Capsule Slider)
  // ==========================================================================
  function enhanceCrystalSliders(root = document) {
    $$('input[type="range"]', root).forEach((inp) => {
      if (inp.dataset.crystalSlider === '1') {
        syncCrystalSlider(inp);
        return;
      }
      inp.dataset.crystalSlider = '1';
      inp.classList.add('crystal-slider-input');

      const wrap = document.createElement('div');
      wrap.className = 'crystal-slider-wrap';

      const track = document.createElement('div');
      track.className = 'crystal-slider-track';
      const fill = document.createElement('div');
      fill.className = 'crystal-slider-fill';
      track.appendChild(fill);

      const thumb = document.createElement('div');
      thumb.className = 'crystal-slider-thumb';

      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(track);
      wrap.appendChild(inp);
      wrap.appendChild(thumb);

      const sync = () => syncCrystalSlider(inp);
      inp.addEventListener('input', sync);
      inp.addEventListener('change', sync);
      sync();
    });
  }

  function syncCrystalSlider(inp) {
    const wrap = inp.closest('.crystal-slider-wrap');
    if (!wrap) return;
    const min = parseFloat(inp.min || '0');
    const max = parseFloat(inp.max || '100');
    const val = parseFloat(inp.value || '0');
    const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 50;
    wrap.style.setProperty('--slider-pct', `${pct.toFixed(2)}%`);
  }

  function syncCustomSelectDisplay(sel) {
    const wrapper = sel.closest('.dr-select');
    if (!wrapper) return;
    const opts = Array.from(sel.options);
    const currentOpt = opts[sel.selectedIndex] || opts[0];
    const trigger = $('.dr-select-trigger', wrapper);
    if (trigger && currentOpt) {
      trigger.innerHTML = `<span>${esc(currentOpt.textContent)}</span><span class="dr-chevron">${icon('chevronDown')}</span>`;
    }
  }

  document.addEventListener('click', () => {
    $$('.dr-select.open').forEach((el) => el.classList.remove('open'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.dr-select.open').forEach((el) => el.classList.remove('open'));
    }
  });

  // Unified Precision Optical Glass Lens Engine (Zero Text Overlap, ResizeObserver + Font-Ready Sync)
  function triggerLensSheen(pill) {
    if (!pill) return;
    pill.classList.remove('lens-sheen');
    void pill.offsetWidth;
    pill.classList.add('lens-sheen');
  }

  function positionLensExact(pill, targetEl, stretchAxis = 'none') {
    if (!pill || !targetEl) return;
    const x = targetEl.offsetLeft;
    const y = targetEl.offsetTop;
    const w = targetEl.offsetWidth;
    const h = targetEl.offsetHeight;
    if (w <= 0 || h <= 0) return;

    pill.style.width = `${w}px`;
    pill.style.height = `${h}px`;
    pill.style.opacity = '1';

    if (stretchAxis === 'x') {
      pill.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(1.08) scaleY(0.95)`;
      triggerLensSheen(pill);
      clearTimeout(pill.__settleTimer);
      pill.__settleTimer = setTimeout(() => {
        pill.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
      }, 200);
    } else if (stretchAxis === 'y') {
      pill.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(0.97) scaleY(1.06)`;
      triggerLensSheen(pill);
      clearTimeout(pill.__settleTimer);
      pill.__settleTimer = setTimeout(() => {
        pill.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.025)`;
      }, 200);
    } else {
      pill.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.025)`;
    }
  }

  function observeLayoutChanges(container, callback) {
    if (!container || container.__lensObserved) return;
    container.__lensObserved = true;
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => requestAnimationFrame(callback));
      ro.observe(container);
    }
    window.addEventListener('resize', () => requestAnimationFrame(callback));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(callback));
    }
  }

  // Left Sidebar Optical Glass Lens (Zero Reload Double-Replay)
  function initSidebarGlide() {
    const nav = $('.sidebar-nav');
    if (!nav) return;

    let pill = $('.nav-glide-pill', nav);
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'crystal-lens nav-glide-pill';
      nav.appendChild(pill);
    }

    let hoveredLink = null;
    const syncPos = (animate = false) => {
      const activeLink = $('.nav-link.active', nav);
      const target = hoveredLink || activeLink;
      if (!target) {
        pill.style.opacity = '0';
        return;
      }
      positionLensExact(pill, target, animate ? 'y' : 'none');
    };

    window.__syncSidebarLens = (animate = true) => {
      hoveredLink = null;
      syncPos(animate);
    };

    requestAnimationFrame(() => syncPos(false));

    $$('.nav-link', nav).forEach((link) => {
      link.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: none)').matches) return;
        hoveredLink = link;
        positionLensExact(pill, link, 'y');
      });
    });

    nav.addEventListener('mouseleave', () => {
      hoveredLink = null;
      syncPos(true);
    });

    observeLayoutChanges(nav, () => syncPos(false));
  }

  // Mobile Bottom Dock Smooth Capsule Glide (Native iOS/One UI feel — Zero Reload Flicker)
  function initMobileDockGlide() {
    const dock = $('.mobile-dock');
    if (!dock) return;

    let lens = $('.dock-crystal-lens', dock);
    if (!lens) {
      lens = document.createElement('div');
      lens.className = 'dock-crystal-lens';
      dock.appendChild(lens);
    }

    const moveDockLens = (targetEl, animate = false) => {
      if (!targetEl || targetEl.offsetWidth <= 0 || targetEl.offsetHeight <= 0) {
        lens.style.opacity = '0';
        return;
      }
      const x = targetEl.offsetLeft;
      const y = targetEl.offsetTop;
      const w = targetEl.offsetWidth;
      const h = targetEl.offsetHeight;

      if (!animate) {
        lens.style.transition = 'none';
      }
      lens.style.width = `${w}px`;
      lens.style.height = `${h}px`;
      lens.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      lens.style.opacity = '1';
      if (!animate) {
        void lens.offsetWidth;
        lens.style.transition = '';
      }
    };

    window.__syncMobileDockLens = (animate = true) => {
      const cur = $('a.active', dock);
      moveDockLens(cur, animate);
    };

    requestAnimationFrame(() => moveDockLens($('a.active', dock), false));

    observeLayoutChanges(dock, () => {
      moveDockLens($('a.active', dock), false);
    });
  }

  function setupVerticalGlide(container, buttonSelector, pillClass) {
    if (!container) return () => {};
    if (container.__glideUpdate) {
      container.__glideUpdate(true);
      return container.__glideUpdate;
    }
    let pill = $(`.${pillClass}`, container);
    if (!pill) {
      pill = document.createElement('div');
      pill.className = `crystal-lens ${pillClass}`;
      container.appendChild(pill);
    }
    let hoveredBtn = null;
    const update = (animate = false) => {
      const target = hoveredBtn || $(`${buttonSelector}.active`, container);
      if (!target) {
        pill.style.opacity = '0';
        return;
      }
      positionLensExact(pill, target, animate ? 'y' : 'none');
    };
    $$(buttonSelector, container).forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        hoveredBtn = btn;
        positionLensExact(pill, btn, 'y');
      });
    });
    container.addEventListener('mouseleave', () => {
      hoveredBtn = null;
      const active = $(`${buttonSelector}.active`, container);
      if (active) positionLensExact(pill, active, 'y');
    });
    container.__glideUpdate = (animate = false) => {
      hoveredBtn = null;
      update(animate);
    };
    requestAnimationFrame(() => update(false));
    observeLayoutChanges(container, () => update(false));
    return container.__glideUpdate;
  }

  function setupHorizontalGlide(container, buttonSelector) {
    if (!container) return () => {};
    if (container.__glideUpdate) {
      container.__glideUpdate(true);
      return container.__glideUpdate;
    }
    container.classList.add('glide-chip-group');
    let pill = $('.glide-chip-pill', container);
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'crystal-lens glide-chip-pill';
      container.appendChild(pill);
    }
    const update = (animate = false) => {
      const active = $(`${buttonSelector}.active`, container);
      if (!active) {
        pill.style.opacity = '0';
        return;
      }
      positionLensExact(pill, active, animate ? 'x' : 'none');
    };
    container.__glideUpdate = update;
    requestAnimationFrame(() => update(false));
    observeLayoutChanges(container, () => update(false));
    return update;
  }

  // ==========================================================================
  // Real-Time Automatic Schedule Synchronization Engine
  // ==========================================================================
  const ScheduleSync = {
    getMonday(dateObj = new Date()) {
      const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    },

    getAcademicWeekForMonday(mondayDate) {
      const anchor = new Date(2026, 9, 19);
      anchor.setHours(0, 0, 0, 0);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const diffWeeks = Math.round((mondayDate.getTime() - anchor.getTime()) / msPerWeek);
      const isEven = Math.abs(diffWeeks) % 2 === 0;
      let weekNum = isEven ? 2 : 1;
      if (getPrefs().weekParityFlip) {
        weekNum = weekNum === 1 ? 2 : 1;
      }
      return weekNum;
    },

    getWeekDates(weekOffset = 0) {
      const baseMonday = this.getMonday(new Date());
      baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
      const academicWeek = this.getAcademicWeekForMonday(baseMonday);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = {};
      const fullDates = {};
      dayNames.forEach((name, idx) => {
        const dt = new Date(baseMonday);
        dt.setDate(baseMonday.getDate() + idx);
        days[name] = `${dt.getDate()} ${months[dt.getMonth()]}`;
        fullDates[name] = dt;
      });
      const sat = fullDates.Saturday;
      const rangeLabel = `${baseMonday.getDate()} ${months[baseMonday.getMonth()]} – ${sat.getDate()} ${months[sat.getMonth()]} ${sat.getFullYear()}`;
      return { monday: baseMonday, academicWeek, days, fullDates, rangeLabel };
    },

    todayName() {
      const idx = new Date().getDay();
      if (idx === 0) return 'Monday';
      return dayNames[idx - 1] || 'Monday';
    },

    isSameDate(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    },

    parseMinutes(timeStr) {
      const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!match) return 8 * 60 + 30;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const mer = (match[3] || '').toUpperCase();
      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    },

    getLiveStatus() {
      const now = new Date();
      const info = this.getWeekDates(0);
      const realDayIdx = now.getDay();
      const todayDayName = realDayIdx === 0 ? null : dayNames[realDayIdx - 1];
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const groupPref = getPrefs().groupFilter || 'all';

      const filterByGroup = (entries) => entries.filter((e) => {
        const note = (e[3] || '').toLowerCase();
        if (groupPref === 'a' && note.includes('221 b')) return false;
        if (groupPref === 'b' && note.includes('221 a')) return false;
        return true;
      });

      let todayTotal = 0;
      let todayDone = 0;

      if (todayDayName) {
        const todaysClasses = filterByGroup(schedule[info.academicWeek]?.[todayDayName] || []);
        todayTotal = todaysClasses.length;
        for (const cls of todaysClasses) {
          const start = this.parseMinutes(cls[0]);
          const end = start + 95;
          if (nowMins > end) todayDone++;
        }

        for (const cls of todaysClasses) {
          const start = this.parseMinutes(cls[0]);
          const end = start + 95;
          if (nowMins >= start && nowMins <= end) {
            return {
              state: 'live',
              label: `Live Now · ${cls[1]} (${cls[2]})`,
              short: `Live: ${cls[1]} · ${end - nowMins}m left`,
              detail: `${cls[0]} · Ends in ${end - nowMins} min`,
              entry: cls,
              week: info.academicWeek,
              day: todayDayName,
              todayDone,
              todayTotal
            };
          }
          if (nowMins < start) {
            const diff = start - nowMins;
            const hrs = Math.floor(diff / 60);
            const mins = diff % 60;
            const eta = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
            return {
              state: 'upcoming',
              label: `Next in ${eta} · ${cls[1]} (${cls[0]})`,
              short: `Next in ${eta}: ${cls[1]}`,
              detail: `${todayDayName} at ${cls[0]} · ${cls[2]}`,
              entry: cls,
              week: info.academicWeek,
              day: todayDayName,
              todayDone,
              todayTotal
            };
          }
        }
      }

      const startOffset = realDayIdx === 0 ? 0 : realDayIdx;
      for (let i = 0; i < 6; i++) {
        const checkIdx = (startOffset + i) % 6;
        const dName = dayNames[checkIdx];
        const targetOffset = (realDayIdx !== 0 && startOffset + i >= 6) ? 1 : 0;
        const wInfo = this.getWeekDates(targetOffset);
        const list = filterByGroup(schedule[wInfo.academicWeek]?.[dName] || []);
        if (list.length) {
          return {
            state: 'nextday',
            label: `Next · ${dName} ${list[0][0]} · ${list[0][1]}`,
            short: `${dName} ${list[0][0]}: ${list[0][1]}`,
            detail: `${wInfo.days[dName]} · ${list[0][2]}`,
            entry: list[0],
            week: wInfo.academicWeek,
            day: dName,
            todayDone,
            todayTotal
          };
        }
      }
      return { state: 'free', label: 'No upcoming classes', short: 'All caught up', detail: '', entry: null, week: info.academicWeek, day: 'Monday', todayDone: 0, todayTotal: 0 };
    },

    exportICS(weekOffset = 0) {
      const info = this.getWeekDates(weekOffset);
      const weekData = schedule[info.academicWeek] || {};
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Dr221 Medical Platform//Live Schedule//EN',
        'CALSCALE:GREGORIAN'
      ];
      const pad = (n) => String(n).padStart(2, '0');
      const fmtDate = (dt, mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(h)}${pad(m)}00`;
      };

      dayNames.forEach((day) => {
        const dt = info.fullDates[day];
        const classes = weekData[day] || [];
        classes.forEach((cls, idx) => {
          const startMins = this.parseMinutes(cls[0]);
          const endMins = startMins + 95;
          lines.push('BEGIN:VEVENT');
          lines.push(`UID:dr221-${dt.getFullYear()}${dt.getMonth() + 1}${dt.getDate()}-${idx}@med221.edu`);
          lines.push(`DTSTART:${fmtDate(dt, startMins)}`);
          lines.push(`DTEND:${fmtDate(dt, endMins)}`);
          lines.push(`SUMMARY:${cls[1]}${cls[3] ? ` (${cls[3]})` : ''}`);
          lines.push(`LOCATION:${cls[2]}`);
          lines.push(`DESCRIPTION:Academic Week ${info.academicWeek} · Teacher: ${teacherFor(cls[1], cls[3])}`);
          lines.push('END:VEVENT');
        });
      });

      lines.push('END:VCALENDAR');
      const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dr221-Week${info.academicWeek}-${info.days.Monday.replace(/\s+/g, '')}.ics`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify(`Exported Week ${info.academicWeek} (${info.rangeLabel}) calendar file!`);
    }
  };

  let weekOffset = 0;
  let selectedDay = ScheduleSync.todayName();
  let fullWeekView = false;

  // ==========================================================================
  // Dual-Layer Study Database (IndexedDB Binary Blobs + Netlify Blobs Cloud)
  // ==========================================================================
  const Dr221DB = {
    dbName: 'dr221_study_database_v4',
    storeName: 'blobs',

    open() {
      return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    async putBlob(id, file) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).put({
          id,
          blob: file,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size
        });
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      });
    },

    async getBlob(id) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const req = tx.objectStore(this.storeName).get(id);
        req.onsuccess = () => { db.close(); resolve(req.result?.blob || null); };
        req.onerror = () => { db.close(); reject(req.error); };
      });
    },

    async deleteBlob(id) {
      try {
        const db = await this.open();
        await new Promise((resolve) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          tx.objectStore(this.storeName).delete(id);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
        });
      } catch (_) {}
    },

    async getStats() {
      const localList = getLocalMaterialMeta();
      const totalBytes = localList.reduce((acc, m) => acc + (Number(m.sizeBytes) || 0), 0);
      return {
        count: getAllMaterials().length,
        localCount: localList.length,
        cloudCount: remoteMaterials.length,
        totalBytes,
        totalLabel: formatBytes(totalBytes)
      };
    }
  };

  let remoteMaterials = [];
  let cloudConnected = false;

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getLocalMaterialMeta() {
    const saved = read(MATERIAL_META_KEY, []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveLocalMaterialMeta(list) {
    return write(MATERIAL_META_KEY, list);
  }

  function getAllMaterials() {
    const local = getLocalMaterialMeta();
    const remoteKeys = new Set(remoteMaterials.map((r) => `${(r.subjectId || '').toLowerCase()}::${(r.name || '').trim().toLowerCase()}`));
    const filteredLocal = local.filter((l) => {
      if (!l || !l.id) return false;
      const k = `${(l.subjectId || '').toLowerCase()}::${(l.name || '').trim().toLowerCase()}`;
      return !remoteKeys.has(k);
    });
    const merged = [...remoteMaterials, ...filteredLocal];
    const seen = new Set();
    return merged.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  async function clearAllLocalMaterialCache() {
    const local = getLocalMaterialMeta();
    for (const item of local) {
      await Dr221DB.deleteBlob(item.id).catch(() => {});
    }
    saveLocalMaterialMeta([]);
    updateLiveMaterialCounters();
    if ($('#materialLibraryRoot')) renderMaterials();
    notify(isAr() ? 'تم مسح الملفات المحلية المكررة من هذا الجهاز.' : 'Cleared local-only cached files from this device.');
  }

  function getUploadToken() {
    try { return localStorage.getItem(UPLOAD_TOKEN_KEY) || ''; } catch (_) { return ''; }
  }

  function saveUploadToken(val) {
    try { localStorage.setItem(UPLOAD_TOKEN_KEY, val.trim()); } catch (_) {}
  }

  function safeStoragePath(subjectId, id, filename) {
    const extMatch = String(filename || '').match(/\.([a-zA-Z0-9]{1,10})$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
    const base = String(filename || 'file').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'file';
    const cleanSubj = String(subjectId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanId = String(id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
    return `${cleanSubj}/${cleanId}-${base}${ext}`;
  }

  function mapSupabaseMaterialRow(row) {
    return {
      id: row.id,
      name: row.name,
      subjectId: row.subject_id,
      subject: row.subject,
      category: row.category || 'Lecture',
      description: row.description || '',
      status: row.status || 'published',
      type: row.file_type || 'FILE',
      mimeType: row.mime_type || 'application/octet-stream',
      sizeBytes: Number(row.size_bytes) || 0,
      size: row.size_label || formatBytes(row.size_bytes),
      addedBy: row.added_by || 'Administrator',
      uploadedAt: row.created_at || '',
      url: row.file_url || '',
      storagePath: row.storage_path || '',
      storageMode: 'supabase'
    };
  }

  function updateLiveMaterialCounters() {
    const pubCount = getPublishedMaterials().length;
    const navBadge = $('.sidebar-nav a[href="materials.html"] .nav-badge');
    if (navBadge) navBadge.textContent = String(pubCount);
    const statCount = $('#dashboardStats .stat-card:nth-child(2) strong');
    if (statCount) statCount.textContent = String(pubCount);
    const heroBtn = $('.hero-actions a[href="materials.html"]');
    if (heroBtn) {
      heroBtn.innerHTML = `${icon('database')} ${isAr() ? `قاعدة الملفات (${pubCount})` : `Study Database (${pubCount})`}`;
    }
  }

  async function syncRemoteMaterials() {
    try {
      const { data, error } = await SupaCloud.select('materials', 'select=*&order=created_at.desc');
      if (!error && Array.isArray(data)) {
        remoteMaterials = data.map(mapSupabaseMaterialRow);
        cloudConnected = true;
        updateLiveMaterialCounters();
        if ($('#materialLibraryRoot')) renderMaterials();
        if ($('#dashboardScheduleList')) renderDashboard();
        if ($('#courseGrid')) renderCourses($('#courseSearch')?.value || '');
        if ($('#adminPendingFilesList')) renderAdminQueues();
    if (window.__dr221RefreshSeminars) window.__dr221RefreshSeminars();
        return true;
      }
      cloudConnected = false;
    } catch (err) {
      cloudConnected = false;
      SupaCloud.lastError = String(err?.message || err);
    }
    if ($('#dbStatusBadge')) {
      $('#dbStatusBadge').textContent = isAr()
        ? 'محلي فقط (تعذر الاتصال بـ Supabase)'
        : 'Offline Local Mode (Cloud Unreachable)';
    }
    return false;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  function setUploadDiag(msg, tone = 'info') {
    const box = $('#uploadCloudDiag');
    if (!box) return;
    box.style.display = msg ? 'block' : 'none';
    box.textContent = msg || '';
    box.style.color = tone === 'ok' ? 'var(--green)' : tone === 'err' ? 'var(--red)' : 'var(--muted)';
    box.style.borderColor = tone === 'ok' ? 'rgba(52,199,89,0.35)' : tone === 'err' ? 'rgba(255,69,58,0.4)' : 'var(--line)';
  }

  async function uploadMaterialSet(files, subjectId, category = 'Lecture', description = '', status = 'published') {
    if (!files || !files.length) return { uploadedCount: 0, cloudCount: 0, lastErr: '' };
    const courses = getCourses();
    const course = courses.find((c) => c.id === subjectId) || courses[0];
    let cloudCount = 0;
    let lastErr = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const prefix = status === 'pending' ? 'pend' : 'mat';
      const id = `${prefix}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const ext = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'FILE';
      const sizeLabel = formatBytes(file.size);
      const addedBy = current?.name || (status === 'pending' ? 'Student' : 'Mohamed Omar Tarek');
      let uploadedToCloud = false;

      try {
        const storagePath = safeStoragePath(course.id, id, file.name);
        let finalUrl = '';
        let savedStoragePath = '';

        // Tier 1: Direct Supabase Storage upload (supports large files up to 50 MB)
        const up = await SupaCloud.uploadFile('materials', storagePath, file);
        if (!up.error && up.publicUrl) {
          finalUrl = up.publicUrl;
          savedStoragePath = storagePath;
        } else {
          // Tier 2: Automatic Postgres Cloud Fallback (stores data URL in public.materials so phones ALWAYS see it!)
          const isImg = (file.type || '').startsWith('image/');
          if (isImg) {
            finalUrl = await readImageAsDataUrl(file, 1600);
          } else if (file.size <= 6 * 1024 * 1024) {
            finalUrl = await readFileAsDataUrl(file);
          } else {
            throw new Error(`Storage failed (${up.error}) & file > 6 MB`);
          }
        }

        const row = {
          id,
          name: file.name,
          subject_id: course.id,
          subject: course.name,
          category,
          description,
          status,
          file_type: ext,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          size_label: sizeLabel,
          added_by: addedBy,
          file_url: finalUrl,
          storage_path: savedStoragePath
        };

        const ins = await SupaCloud.insert('materials', row);
        if (ins.error) throw new Error(ins.error);

        const instantPreview = (file.type || '').startsWith('image/') ? (finalUrl.startsWith('data:') ? finalUrl : URL.createObjectURL(file)) : '';
        remoteMaterials = [{ ...mapSupabaseMaterialRow({ ...row, created_at: new Date().toISOString() }), thumbUrl: instantPreview || finalUrl }, ...remoteMaterials];
        cloudConnected = true;
        uploadedToCloud = true;
        cloudCount++;
      } catch (err) {
        lastErr = String(err?.message || err);
        console.error('Supabase upload error:', lastErr);
      }

      if (!uploadedToCloud) {
        await Dr221DB.putBlob(id, file);
        const entry = {
          id,
          name: file.name,
          subjectId: course.id,
          subject: course.name,
          category,
          description,
          status,
          type: ext,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          size: sizeLabel,
          addedBy,
          uploadedAt: new Date().toISOString(),
          storageMode: 'local'
        };
        saveLocalMaterialMeta([entry, ...getLocalMaterialMeta()]);
      }
    }

    updateLiveMaterialCounters();
    return { uploadedCount: files.length, cloudCount, course, lastErr };
  }

  async function uploadFilesToDatabase(files, subjectId, category = 'Lecture', description = '') {
    if (!isAdmin()) {
      notify(isAr() ? 'صلاحية قراءة فقط: القائد فقط يمكنه رفع الملفات.' : 'Read-only access: only Leader (3mar_r) can upload files.');
      return;
    }
    if (!files || !files.length) return;
    setUploadDiag(isAr() ? `جاري رفع ${files.length} ملف إلى سحابة Supabase...` : `Uploading ${files.length} file(s) to Supabase Cloud...`, 'info');
    notify(isAr() ? `جاري رفع ${files.length} ملف إلى Supabase...` : `Uploading ${files.length} file(s) to Supabase Cloud...`);
    const { uploadedCount, cloudCount, course, lastErr } = await uploadMaterialSet(files, subjectId, category, description, 'published');
    if (cloudCount > 0) {
      const okMsg = isAr()
        ? `✓ تم رفع ${cloudCount} ملف في ${course.name} على السحابة — ظاهر الآن على الموبايل ولكل الطلاب!`
        : `✓ Uploaded ${cloudCount} file(s) to ${course.name} on Supabase Cloud — visible on all phones now!`;
      setUploadDiag(okMsg, 'ok');
      notify(okMsg);
    } else if (uploadedCount > 0) {
      const errMsg = isAr()
        ? `✕ فشل الرفع للسحابة وحُفظ محلياً فقط (${lastErr || 'تحقق من الإنترنت'})`
        : `✕ Cloud upload failed — saved locally only (${lastErr || 'check network/RLS'})`;
      setUploadDiag(errMsg, 'err');
      notify(errMsg);
    }
  }

  async function syncLocalMaterialsToCloud() {
    if (!isAdmin()) return;
    const localList = getLocalMaterialMeta();
    if (!localList.length) {
      notify(isAr() ? 'لا توجد ملفات محلية بحاجة للرفع.' : 'No local-only files waiting to sync.');
      return;
    }
    let pushed = 0;
    const remaining = [];
    for (const item of localList) {
      const blob = await Dr221DB.getBlob(item.id);
      if (!blob) continue;
      const file = new File([blob], item.name, { type: item.mimeType || 'application/octet-stream' });
      const res = await uploadMaterialSet([file], item.subjectId, item.category || 'Lecture', item.description || '', item.status || 'published');
      if (res.cloudCount > 0) {
        await Dr221DB.deleteBlob(item.id);
        pushed++;
      } else {
        remaining.push(item);
      }
    }
    saveLocalMaterialMeta(remaining);
    if ($('#materialLibraryRoot')) renderMaterials();
    notify(pushed > 0
      ? (isAr() ? `تم رفع ${pushed} ملف محلي إلى سحابة Supabase!` : `Synced ${pushed} local file(s) to Supabase Cloud!`)
      : (isAr() ? `فشل الرفع السحابي: ${SupaCloud.lastError || 'خطأ غير معروف'}` : `Cloud sync failed: ${SupaCloud.lastError || 'unknown error'}`));
  }

  async function renameMaterialItem(id, newName) {
    if (!isAdmin() || !newName) return false;
    const cleanName = newName.trim();
    if (!cleanName) return false;

    if (remoteMaterials.some((m) => m.id === id)) {
      const res = await SupaCloud.updateEq('materials', 'id', id, { name: cleanName });
      if (res.ok) {
        remoteMaterials = remoteMaterials.map((m) => (m.id === id ? { ...m, name: cleanName } : m));
        notify(isAr() ? 'تم تعديل اسم الملف على السحابة!' : 'File renamed on Supabase Cloud!');
        return true;
      }
    }

    const localList = getLocalMaterialMeta();
    const target = localList.find((x) => x.id === id);
    if (target) {
      target.name = cleanName;
      saveLocalMaterialMeta(localList);
      notify(isAr() ? 'تم تعديل اسم الملف!' : 'File renamed!');
      return true;
    }
    return false;
  }

  async function deleteMaterialItem(id) {
    const isLocalOnly = !remoteMaterials.some((m) => m.id === id) && getLocalMaterialMeta().some((m) => m.id === id);
    if (!isAdmin() && !isLocalOnly) {
      notify(isAr() ? 'صلاحية قراءة فقط: القائد فقط يمكنه حذف ملفات السحابة.' : 'Read-only access: only Leader can delete cloud files.');
      return false;
    }
    const remoteItem = remoteMaterials.find((m) => m.id === id);
    if (remoteItem) {
      if (remoteItem.storagePath) await SupaCloud.removeFile('materials', remoteItem.storagePath);
      const res = await SupaCloud.deleteEq('materials', 'id', id);
      if (res.ok) {
        remoteMaterials = remoteMaterials.filter((m) => m.id !== id);
        updateLiveMaterialCounters();
        notify(isAr() ? 'تم حذف الملف من Supabase.' : 'File deleted from Supabase Cloud.');
        return true;
      }
    }
    const nextLocal = getLocalMaterialMeta().filter((m) => m.id !== id);
    saveLocalMaterialMeta(nextLocal);
    await Dr221DB.deleteBlob(id);
    updateLiveMaterialCounters();
    notify(isAr() ? 'تم حذف الملف من قاعدة البيانات.' : 'File removed from Study Database.');
    return true;
  }

  async function openMaterialPreview(id) {
    const item = getAllMaterials().find((m) => m.id === id);
    if (!item) return;

    let fileUrl = item.url || '';
    let revokeLater = false;
    if (!fileUrl) {
      const blob = await Dr221DB.getBlob(item.id);
      if (!blob) {
        notify('File data not found in local database.');
        return;
      }
      fileUrl = URL.createObjectURL(blob);
      revokeLater = true;
    } else if (fileUrl.startsWith('data:')) {
      try {
        const blob = await (await fetch(fileUrl)).blob();
        fileUrl = URL.createObjectURL(blob);
        revokeLater = true;
      } catch (_) {}
    }

    const mime = (item.mimeType || '').toLowerCase();
    const ext = (item.type || '').toLowerCase();
    let stageHtml = '';

    if (mime.includes('pdf') || ext === 'pdf') {
      stageHtml = `<iframe src="${fileUrl}" title="${esc(item.name)}"></iframe>`;
    } else if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      stageHtml = `<img src="${fileUrl}" alt="${esc(item.name)}">`;
    } else if (mime.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) {
      stageHtml = `<video src="${fileUrl}" controls autoplay playsinline></video>`;
    } else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      stageHtml = `<audio src="${fileUrl}" controls style="width:90%"></audio>`;
    } else {
      stageHtml = `<div style="padding:32px;text-align:center">
        <div class="stat-icon" style="margin:0 auto 12px;width:54px;height:54px">${icon('file')}</div>
        <strong>${esc(item.name)}</strong>
        <p class="muted" style="font-size:.76rem;margin:6px 0 16px">${esc(item.type)} · ${esc(item.size)} · Ready to download</p>
        <a class="btn btn-primary" href="${fileUrl}" download="${esc(item.name)}">${icon('download')} Download File</a>
      </div>`;
    }

    const modal = $('#filePreviewModal');
    if (!modal) return;
    $('#previewFileTitle').textContent = item.name;
    $('#previewFileMeta').textContent = `${item.subject} · ${item.category || 'Material'} · ${item.size} · Added by ${item.addedBy}`;
    $('#previewStage').innerHTML = stageHtml;
    $('#previewDownloadBtn').href = fileUrl;
    $('#previewDownloadBtn').download = item.name;
    $('#previewNewTabBtn').href = fileUrl;
    openModal('filePreviewModal', () => {
      if (revokeLater) URL.revokeObjectURL(fileUrl);
    });
  }

  // ==========================================================================
  // Teachers, Seminars, Chat Helpers (With Private 1-to-1 + Admin Oversight)
  // ==========================================================================
  const defaultTeachers = {
    'Anatomy': { a: 'Parshin', b: 'Parshin' },
    'Biochemistry': { a: 'Elena', b: 'Irina' },
    'Hygiene': { a: 'Oksana', b: 'Oksana' },
    'Histology': { a: 'Balashov', b: 'Ekaterina' },
    'Deontology': { a: 'Olga', b: 'Olga' },
    'Microbiology': { a: 'Kostina', b: 'Vitaly' },
    'Physiology': { a: 'Oksana', b: 'Oksana' },
    'Psychology': { a: 'Natalia', b: 'Natalia' },
    'Russian Language': { a: 'Alina', b: 'Alina' },
    'Sport': { a: 'Olga', b: 'Olga' }
  };

  function normalizeTeacherEntry(val, fallback) {
    if (val && typeof val === 'object') {
      const a = String(val.a || '').trim();
      const b = String(val.b || '').trim();
      if (a || b) return { a: a || b, b: b || a };
    }
    if (typeof val === 'string' && val.trim()) {
      const s = val.trim();
      return { a: s, b: s };
    }
    return fallback ? { ...fallback } : { a: '', b: '' };
  }

  function getTeachers() {
    const saved = read(TEACHER_KEY, {});
    const merged = {};
    teacherSubjects.forEach((subj) => {
      merged[subj] = normalizeTeacherEntry(saved?.[subj], defaultTeachers[subj]);
    });
    Object.keys(saved || {}).forEach((k) => {
      if (!merged[k]) merged[k] = normalizeTeacherEntry(saved[k], null);
    });
    return merged;
  }

  function saveTeachers(t) { write(TEACHER_KEY, t); }

  function resolveTeacherSubjectKey(subject) {
    const clean = String(subject || '').replace(/\s+(Lecture|Lab)$/i, '').trim();
    const low = clean.toLowerCase();
    if (low.includes('anatomy')) return 'Anatomy';
    if (low.includes('biochem')) return 'Biochemistry';
    if (low.includes('hygiene')) return 'Hygiene';
    if (low.includes('histolog')) return 'Histology';
    if (low.includes('deontolog')) return 'Deontology';
    if (low.includes('microbiolog')) return 'Microbiology';
    if (low.includes('physiolog')) return 'Physiology';
    if (low.includes('psych')) return 'Psychology';
    if (low.includes('russian')) return 'Russian Language';
    if (low.includes('sport') || low.includes('physical education')) return 'Sport';
    return clean;
  }

  function teacherFor(subject, note = '', forcedGroup = '') {
    const key = resolveTeacherSubjectKey(subject);
    const entry = getTeachers()[key];
    if (!entry || (!entry.a && !entry.b)) return 'Faculty Staff';

    const noteLow = String(note || '').toLowerCase();
    let grp = String(forcedGroup || '').toLowerCase();
    if (!grp) {
      if (noteLow.includes('221 a')) grp = 'a';
      else if (noteLow.includes('221 b')) grp = 'b';
      else grp = (getPrefs().groupFilter || 'all').toLowerCase();
    }

    if (grp === 'a') return entry.a || entry.b || 'Faculty Staff';
    if (grp === 'b') return entry.b || entry.a || 'Faculty Staff';
    if (entry.a && entry.b && entry.a.toLowerCase() !== entry.b.toLowerCase()) {
      return `A: ${entry.a} · B: ${entry.b}`;
    }
    return entry.a || entry.b || 'Faculty Staff';
  }

  function getSeminarVideos() {
    const saved = read(SEMINAR_KEY, []);
    return Array.isArray(saved) ? saved : [];
  }
  function saveSeminarVideos(list) { return write(SEMINAR_KEY, list); }

  const defaultRooms = {
    public_ab: [
      { id: 'pub-1', name: 'Mohamed Omar Tarek', username: '3mar_r', text: 'Welcome @all to the Group 221 Public Channel (A & B)! Share announcements, lab notes, and exam reminders here.', time: '09:00' }
    ],
    group221a: [
      { name: 'Mohamed Omar Tarek', username: '3mar_r', text: 'Synced the Week 2 schedule — Anatomy lecture is Tuesday 3:30 PM in Building 1 Room 406.', time: '09:12' },
      { name: 'Maya Hassan', username: 'maya', text: 'Uploaded the Thorax & Histology notes into the Study Database!', time: '09:16' }
    ],
    group221b: [
      { name: 'Lina Mansour', username: 'lina', text: 'Biochemistry Lab for Group 221 B is Monday 8:30 AM in Building 13.', time: '10:05' }
    ],
    'private:kareem:maya': [
      { name: 'Maya Hassan', username: 'maya', text: 'Hey Kareem, did you finish the Histology epithelial tissue slides?', time: '14:10' },
      { name: 'Kareem Adel', username: 'kareem', text: 'Yes! Reviewing pseudostratified ciliated columnar epithelium right now before lab.', time: '14:14' }
    ],
    'private:lina:youssef': [
      { name: 'Youssef Nabil', username: 'youssef', text: 'Lina, are we meeting at Building 13 at 8:20 AM for Biochem?', time: '18:30' },
      { name: 'Lina Mansour', username: 'lina', text: 'Yes, I already prepared the enzyme kinetics protocol.', time: '18:34' }
    ]
  };
  function getRooms() { return { ...defaultRooms, ...read(CHAT_KEY, {}) }; }

  // ==========================================================================
  // Powerful Bilingual Medical & Academic AI Copilot (Dr221AI)
  // ==========================================================================

  // ==========================================================================
  // v8 Cloud Hub Sync Engine (Netlify Blobs /api/sync + Offline Local Fallback)
  // ==========================================================================
  const defaultRecaps = [
    {
      id: 'recap-init-1',
      date: new Date().toISOString().slice(0, 10),
      subjectId: 'anatomy',
      subject: 'Anatomy',
      group: 'All Group 221',
      covered: 'Reviewed thoracic wall landmarks, intercostal spaces, and mediastinal divisions in Building 11.',
      nextPrep: 'Bring thorax atlas & review coronary artery branches for next practical.',
      quizNote: 'Short practical spotter next Thursday',
      addedBy: 'Mohamed Omar Tarek'
    },
    {
      id: 'recap-init-2',
      date: new Date().toISOString().slice(0, 10),
      subjectId: 'biochemistry',
      subject: 'Biochemistry',
      group: 'Group 221 A',
      covered: 'Enzyme kinetics, Michaelis-Menten equation, and competitive vs. non-competitive inhibition.',
      nextPrep: 'Complete Lab Protocol #4 before Friday 1:50 PM (Building 13).',
      quizNote: '',
      addedBy: 'Mohamed Omar Tarek'
    }
  ];

  const defaultQA = [
    {
      id: 'qa-init-1',
      subjectId: 'anatomy',
      subject: 'Anatomy',
      title: 'Which pages are included in the upcoming Thorax colloquium?',
      body: 'Does it include only the heart & pericardium or also the posterior mediastinum?',
      author: 'Kareem Adel',
      authorGroup: 'Group 221 A',
      createdAt: 'Today · 10:15',
      pinned: true,
      answers: [
        {
          id: 'ans-init-1',
          text: 'Heart, pericardium, great vessels, and thoracic duct/esophagus in the posterior mediastinum. Check the uploaded summary in Study Database -> Anatomy.',
          author: 'Mohamed Omar Tarek',
          authorGroup: 'Administrator',
          createdAt: 'Today · 10:22',
          votes: 5,
          voters: ['maya', 'kareem', 'lina', 'youssef', '3mar_r'],
          verified: true
        }
      ]
    },
    {
      id: 'qa-init-2',
      subjectId: 'biochemistry',
      subject: 'Biochemistry',
      title: 'Quick difference between competitive and non-competitive enzyme inhibition?',
      body: 'I always mix up which one changes Km vs Vmax.',
      author: 'Maya Hassan',
      authorGroup: 'Group 221 A',
      createdAt: 'Yesterday',
      pinned: false,
      answers: [
        {
          id: 'ans-init-2',
          text: 'Competitive increases apparent Km (Vmax stays the same). Non-competitive decreases Vmax (Km stays the same).',
          author: 'Lina Mansour',
          authorGroup: 'Group 221 B',
          createdAt: 'Yesterday',
          votes: 3,
          voters: ['maya', 'kareem', 'youssef'],
          verified: false
        }
      ]
    }
  ];

  const defaultPolls = [
    {
      id: 'poll-init-1',
      question: 'Best time for our Group 221 Anatomy & Histology revision call?',
      channel: 'Group 221',
      author: 'Mohamed Omar Tarek',
      createdAt: 'Today',
      closed: false,
      options: [
        { id: 'opt-1', text: 'Saturday · 7:00 PM', voters: ['maya', 'kareem'] },
        { id: 'opt-2', text: 'Sunday · 4:00 PM', voters: ['lina', 'youssef', '3mar_r'] },
        { id: 'opt-3', text: 'Sunday · 8:30 PM', voters: [] }
      ]
    }
  ];

  const defaultRequests = [
    {
      id: 'req-init-1',
      subjectId: 'histology',
      subject: 'Histology & Embryology',
      title: 'High-res labeled slides for Epithelial & Connective tissue',
      details: 'Need labeled images for next Tuesday lab in Building 11.',
      requestedBy: 'Maya Hassan',
      group: 'Group 221 A',
      status: 'open',
      createdAt: 'Today'
    }
  ];

  function getBroadcastAlert() { return read(ALERT_KEY, null); }
  function saveBroadcastAlert(a) { write(ALERT_KEY, a); }
  function getRecaps() { const v = read(RECAP_KEY, null); return Array.isArray(v) ? v : defaultRecaps; }
  function saveRecaps(list) { write(RECAP_KEY, list); }
  function getQA() { const v = read(QA_KEY, null); return Array.isArray(v) ? v : defaultQA; }
  function saveQA(list) { write(QA_KEY, list); }
  function getPolls() { const v = read(POLL_KEY, null); return Array.isArray(v) ? v : defaultPolls; }
  function savePolls(list) { write(POLL_KEY, list); }
  function getFileRequests() { const v = read(REQUEST_KEY, null); return Array.isArray(v) ? v : defaultRequests; }
  function saveFileRequests(list) { write(REQUEST_KEY, list); }

  let hubCloudConnected = false;
  let lastHubSignature = '';

  let lastKvSig = '';
  let lastChatSig = '';

  const HubSync = {
    applyKVMap(kvMap) {
      if (!kvMap || typeof kvMap !== 'object') return;
      if (kvMap.schedule && typeof kvMap.schedule === 'object') {
        schedule = kvMap.schedule;
        write(SCHEDULE_KEY, schedule);
      }
      if (kvMap.teachers && typeof kvMap.teachers === 'object' && Object.keys(kvMap.teachers).length) {
        saveTeachers({ ...getTeachers(), ...kvMap.teachers });
      }
      if (kvMap.site && typeof kvMap.site === 'object') {
        write(SITE_KEY, kvMap.site);
      }
      if ('alert' in kvMap) {
        saveBroadcastAlert(kvMap.alert);
      }
      if (Array.isArray(kvMap.recaps)) {
        saveRecaps(kvMap.recaps);
      }
      if (Array.isArray(kvMap.qa)) {
        saveQA(kvMap.qa);
      }
      if (Array.isArray(kvMap.polls)) {
        savePolls(kvMap.polls);
      }
      if (Array.isArray(kvMap.requests)) {
        saveFileRequests(kvMap.requests);
      }
      if (Array.isArray(kvMap.seminars)) {
        saveSeminarVideos(kvMap.seminars);
      }
      if (Array.isArray(kvMap.accounts) && kvMap.accounts.length) {
        const merged = [...accounts];
        kvMap.accounts.forEach((ra) => {
          if (!ra?.username || ra.username === '3mAr_R221' || ra.username === '3mar_rr' || (!isAdminHandle(ra.username) && isAdminEmail(ra.email))) return;
          const idx = merged.findIndex((a) => a.username.toLowerCase() === ra.username.toLowerCase());
          if (idx === -1) {
            merged.push({
              ...ra,
              role: isAdminHandle(ra.username) ? 'admin' : 'student',
              email: ra.email || '',
              pwHash: ra.pwHash || '',
              provider: ra.provider || 'email',
              bio: `Human Medicine Year 2 · ${ra.group || 'Group 221 A'}`,
              avatarImage: ra.avatarImage || '',
              coverImage: ''
            });
          } else {
            merged[idx] = {
              ...merged[idx],
              name: ra.name || merged[idx].name,
              email: ra.email || merged[idx].email || '',
              pwHash: ra.pwHash || merged[idx].pwHash || '',
              provider: ra.provider || merged[idx].provider || 'email',
              avatarImage: merged[idx].avatarImage || ra.avatarImage || '',
              flair: ra.flair || merged[idx].flair
            };
          }
        });
        accounts = merged;
        write(ACCOUNT_KEY, accounts);
      }
    },

    async pullKV() {
      try {
        const { data, error } = await SupaCloud.select('hub_kv', 'select=key,value,updated_at');
        if (error || !Array.isArray(data)) return false;
        hubCloudConnected = true;
        const sig = data.map((r) => `${r.key}:${r.updated_at}`).sort().join('|');
        if (sig === lastKvSig) return true;
        lastKvSig = sig;
        const kvMap = {};
        data.forEach((row) => { kvMap[row.key] = row.value; });
        this.applyKVMap(kvMap);
        refreshLiveViews();
        return true;
      } catch (_) {
        return false;
      }
    },

    async pullChat() {
      try {
        const { data, error } = await SupaCloud.select('chat_messages', 'select=*&order=created_at.asc&limit=350');
        if (error || !Array.isArray(data)) return false;
        hubCloudConnected = true;
        const sig = `${data.length}:${data[data.length - 1]?.id || ''}`;
        if (sig === lastChatSig) return true;
        lastChatSig = sig;
        if (data.length > 0) {
          const grouped = {};
          data.forEach((row) => {
            const room = row.room || 'group221a';
            if (!grouped[room]) grouped[room] = [];
            grouped[room].push({
              id: row.id,
              name: row.name,
              username: row.username,
              text: row.text,
              time: row.time_label || ''
            });
          });
          write(CHAT_KEY, { ...defaultRooms, ...grouped });
          if (window.__dr221RefreshChat) window.__dr221RefreshChat();
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    async pull() {
      const [okKv, okChat] = await Promise.all([this.pullKV(), this.pullChat()]);
      return okKv || okChat;
    },

    async upsertKV(key, value) {
      const res = await SupaCloud.upsert('hub_kv', { key, value, updated_at: new Date().toISOString() }, 'key');
      if (res.ok) hubCloudConnected = true;
      return res.ok;
    },

    async push(action, payload = {}) {
      try {
        if (action === 'chat_send' && payload.message) {
          const m = payload.message;
          const res = await SupaCloud.insert('chat_messages', {
            id: m.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            room: String(payload.room || 'group221a'),
            username: String(m.username || 'student'),
            name: String(m.name || 'Student'),
            text: String(m.text || ''),
            time_label: String(m.time || '')
          });
          return !res.error;
        }
        if (action === 'chat_delete' && payload.messageId) {
          const res = await SupaCloud.deleteEq('chat_messages', 'id', payload.messageId);
          return res.ok;
        }
        if (action === 'schedule_save') return this.upsertKV('schedule', payload.schedule || schedule);
        if (action === 'teachers_save') return this.upsertKV('teachers', payload.teachers || getTeachers());
        if (action === 'site_save') return this.upsertKV('site', payload.site || getSiteConfig());
        if (action === 'alert_set') return this.upsertKV('alert', payload.alert ?? null);
        if (action === 'recap_add' || action === 'recap_delete') return this.upsertKV('recaps', getRecaps());
        if (action.startsWith('qa_')) return this.upsertKV('qa', getQA());
        if (action.startsWith('poll_')) return this.upsertKV('polls', getPolls());
        if (action.startsWith('request_')) return this.upsertKV('requests', getFileRequests());
        if (action === 'seminars_save') return this.upsertKV('seminars', getSeminarVideos());
        if (action === 'account_register') {
          const publicAccounts = accounts.map((a) => ({
            username: a.username,
            role: isAdminHandle(a.username) ? 'admin' : 'student',
            name: a.name,
            email: a.email || '',
            pwHash: a.pwHash || '',
            provider: a.provider || 'email',
            group: a.group || 'Group 221 A',
            studentId: a.studentId || '',
            avatar: a.avatar || 'ST',
            avatarImage: (a.avatarImage && a.avatarImage.startsWith('http')) ? a.avatarImage : '',
            flair: a.flair || (isAdminHandle(a.username) ? '👑' : '🩺'),
            status: a.status || 'online',
            ringColor: a.ringColor || ''
          }));
          return this.upsertKV('accounts', publicAccounts);
        }
      } catch (err) {
        console.error('HubSync push error:', err);
      }
      return false;
    },

    subscribeRealtime() {
      let tick = 0;
      setInterval(() => {
        if (document.hidden) return;
        tick++;
        if (page === 'chat') this.pullChat();
        else if (page === 'materials' && tick % 2 === 0) syncRemoteMaterials();
        else if (tick % 4 === 0) this.pullKV();
      }, 8000);
    }
  };

  function refreshLiveViews() {
    renderBroadcastBanner();
    if ($('#dashboardScheduleList')) renderDashboard();
    if ($('#dashboardRecapList')) renderDailyRecaps();
    if ($('#scheduleBoard')) renderSchedule();
    if ($('#qaListContainer')) renderQAList();
    if (window.__dr221RefreshChat) window.__dr221RefreshChat();
    if ($('#adminPendingFilesList')) renderAdminQueues();
    if (window.__dr221RefreshSeminars) window.__dr221RefreshSeminars();
    if (isAr()) localizeDom();
  }

  function getPublishedMaterials() {
    return getAllMaterials().filter((m) => (m.status || 'published') === 'published');
  }

  function getPendingMaterials() {
    return getAllMaterials().filter((m) => m.status === 'pending');
  }

  async function submitPendingFileToAdmin(files, subjectId, category = 'Lecture', description = '') {
    if (!files || !files.length) return;
    notify(isAr() ? 'جاري إرسال الملف للمشرف...' : 'Sending file(s) to Administrator review queue...');
    const { uploadedCount, cloudCount, lastErr } = await uploadMaterialSet(files, subjectId, category, description, 'pending');
    if (cloudCount > 0) {
      notify(isAr()
        ? `تم إرسال ${cloudCount} ملف لقائمة انتظار المشرف بنجاح!`
        : `Sent ${cloudCount} file(s) to Administrator on Supabase for approval!`);
    } else if (uploadedCount > 0) {
      notify(isAr()
        ? `حُفظ محلياً بانتظار المراجعة (${lastErr || 'بدون اتصال'})`
        : `Saved locally for review (${lastErr || 'offline'})`);
    }
  }

  async function approvePendingMaterial(id) {
    if (!isAdmin()) return;
    if (remoteMaterials.some((m) => m.id === id)) {
      const res = await SupaCloud.updateEq('materials', 'id', id, { status: 'published' });
      if (res.ok) {
        remoteMaterials = remoteMaterials.map((m) => (m.id === id ? { ...m, status: 'published' } : m));
        updateLiveMaterialCounters();
        notify(isAr() ? 'تمت الموافقة ونشر الملف للجميع على Supabase!' : 'Student file approved and published to Study Database!');
        return;
      }
    }
    const localList = getLocalMaterialMeta();
    const target = localList.find((m) => m.id === id);
    if (target) {
      target.status = 'published';
      saveLocalMaterialMeta(localList);
      updateLiveMaterialCounters();
      notify(isAr() ? 'تمت الموافقة ونشر الملف!' : 'Student file approved and published!');
    }
  }

  // Copy Direct Share Link / Schedule Text Helper
  async function copyToClipboard(text, successMsg) {
    try {
      await navigator.clipboard.writeText(text);
      notify(successMsg);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      notify(successMsg);
    }
  }

  function shareMaterialLink(item) {
    const base = window.location.protocol.startsWith('http')
      ? new URL('materials.html', window.location.href).href
      : 'materials.html';
    const url = `${base}?subject=${encodeURIComponent(item.subjectId)}&file=${encodeURIComponent(item.id)}`;
    copyToClipboard(url, `Direct link copied for "${item.name}"!`);
  }

  function shareTodayScheduleText() {
    const info = ScheduleSync.getWeekDates(0);
    const day = ScheduleSync.todayName();
    const classes = schedule[info.academicWeek]?.[day] || [];
    const lines = [
      `📅 Dr. 221 · ${day}, ${info.days[day]} (Week ${info.academicWeek})`,
      ...classes.map((c) => `• ${c[0]} — ${c[1]} (${c[2]}) · ${teacherFor(c[1], c[3])}${c[3] ? ` [${c[3]}]` : ''}`)
    ];
    if (!classes.length) lines.push('• No classes today!');
    copyToClipboard(lines.join('\n'), 'Today\'s schedule copied — ready to paste in WhatsApp/Telegram!');
  }

  // PWA Service Worker & Install App Prompt
  let deferredInstallPrompt = null;
  function initPWA() {
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => { if (k !== 'dr221-pwa-v26') caches.delete(k).catch(() => {}); });
      }).catch(() => {});
    }
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').then((reg) => { try { reg.update(); } catch (_) {} }).catch(() => {});
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = $('#installAppBtn');
      if (btn) btn.classList.add('visible');
    });
  }

  function renderBroadcastBanner() {
    const slot = $('#broadcastSlot');
    if (!slot) return;
    const alertObj = getBroadcastAlert();
    let dismissedId = '';
    try { dismissedId = localStorage.getItem(DISMISSED_ALERT_KEY) || ''; } catch (_) {}
    if (!alertObj || !alertObj.message || alertObj.id === dismissedId) {
      slot.innerHTML = '';
      return;
    }
    const lvl = ['urgent', 'info', 'success'].includes(alertObj.level) ? alertObj.level : 'warning';
    slot.innerHTML = `
      <div class="broadcast-banner level-${lvl}">
        <div class="broadcast-main">
          <span class="broadcast-badge">${icon('megaphone')} ${esc(alertObj.title || 'Group 221 Notice')}</span>
          <div class="broadcast-text">
            <strong>${esc(alertObj.message)}</strong>
            <p>Posted by ${esc(alertObj.by || 'Administrator')} · ${esc(alertObj.time || 'Live')}</p>
          </div>
        </div>
        <button type="button" class="btn btn-icon btn-ghost" id="dismissBroadcastBtn" title="Dismiss notice">${icon('close')}</button>
      </div>
    `;
    $('#dismissBroadcastBtn')?.addEventListener('click', () => {
      try { localStorage.setItem(DISMISSED_ALERT_KEY, alertObj.id); } catch (_) {}
      slot.innerHTML = '';
    });
  }

  const Dr221AI = {
    pendingQuiz: null,

    quizBank: [
      {
        subject: 'Anatomy',
        qEn: 'Which nerve passes through the foramen rotundum of the sphenoid bone?',
        aEn: 'Maxillary nerve (CN V2)',
        opts: ['A) Ophthalmic nerve (CN V1)', 'B) Maxillary nerve (CN V2)', 'C) Mandibular nerve (CN V3)', 'D) Facial nerve (CN VII)'],
        ans: 'B',
        expEn: 'CN V1 passes through the superior orbital fissure, CN V2 through foramen rotundum, and CN V3 through foramen ovale (Mnemonic: Standing Room Only = S-R-O).'
      },
      {
        subject: 'Normal Physiology',
        qEn: 'During which phase of the cardiac cycle do the semilunar (aortic and pulmonary) valves open?',
        aEn: 'Ventricular ejection phase',
        opts: ['A) Isovolumetric contraction', 'B) Rapid ventricular ejection', 'C) Isovolumetric relaxation', 'D) Atrial systole'],
        ans: 'B',
        expEn: 'When left ventricular pressure exceeds aortic diastolic pressure (~80 mmHg), the aortic valve opens and rapid ventricular ejection begins.'
      },
      {
        subject: 'Biochemistry',
        qEn: 'Which enzyme is the primary rate-limiting step of glycolysis?',
        aEn: 'Phosphofructokinase-1 (PFK-1)',
        opts: ['A) Hexokinase', 'B) Phosphofructokinase-1 (PFK-1)', 'C) Pyruvate kinase', 'D) Aldolase'],
        ans: 'B',
        expEn: 'PFK-1 converts fructose-6-phosphate to fructose-1,6-bisphosphate. It is stimulated by AMP and fructose-2,6-bisphosphate, and inhibited by ATP and citrate.'
      },
      {
        subject: 'Histology & Embryology',
        qEn: 'Which type of epithelium lines the trachea and most of the upper respiratory tract?',
        aEn: 'Pseudostratified ciliated columnar epithelium with goblet cells',
        opts: ['A) Simple squamous epithelium', 'B) Stratified squamous non-keratinized', 'C) Pseudostratified ciliated columnar epithelium', 'D) Transitional epithelium (urothelium)'],
        ans: 'C',
        expEn: 'Respiratory epithelium is pseudostratified ciliated columnar with mucus-secreting goblet cells that trap and clear inhaled particles via the mucociliary escalator.'
      },
      {
        subject: 'Immunology',
        qEn: 'Which immunoglobulin is the ONLY antibody class capable of crossing the human placenta?',
        aEn: 'IgG',
        opts: ['A) IgA', 'B) IgM', 'C) IgE', 'D) IgG'],
        ans: 'D',
        expEn: 'IgG crosses the placenta via FcRn receptors, providing passive immunity to the newborn during the first months of life.'
      }
    ],

    knowledgeTopics: [
      {
        keys: ['cranial', 'nerve', 'foramen', 'skull', 'brachial', 'plexus', 'heart', 'coronary', 'thorax', 'mediastinum', 'anatomy', 'أناتومي', 'تشريح', 'عصب', 'أعصاب'],
        title: 'Anatomy High-Yield Summary',
        body: `• **Cranial Nerve Foramina (S-R-O)**: Superior orbital fissure (CN III, IV, V1, VI) → Foramen Rotundum (CN V2) → Foramen Ovale (CN V3).\n• **Brachial Plexus (C5–T1)**: Roots → Trunks → Divisions → Cords → Branches (**R**emember **T**o **D**rink **C**old **B**eer). Musculocutaneous (C5–C7), Axillary (C5–C6), Radial (C5–T1), Median (C5–T1), Ulnar (C8–T1).\n• **Coronary Circulation**: Left Anterior Descending (LAD) supplies the anterior 2/3 of the interventricular septum and apex; Right Coronary Artery (RCA) supplies the SA/AV nodes in 80–85% of people.`
      },
      {
        keys: ['cardiac', 'ecg', 'ekg', 'starling', 'pressure', 'action potential', 'gfr', 'renal', 'kidney', 'lung', 'respiratory', 'physiology', 'فسيولوجي', 'وظائف', 'القلب', 'ضغط'],
        title: 'Normal Physiology Core Mechanisms',
        body: `• **Cardiac Output (CO)**: $CO = HR \\times SV$. Stroke Volume depends on Preload (Frank-Starling law: greater end-diastolic volume stretches sarcomeres for stronger contraction), Afterload, and Contractility.\n• **Cardiac Cycle**: 1) Atrial systole (a-wave) → 2) Isovolumetric contraction (S1 heart sound: mitral/tricuspid closure) → 3) Ventricular ejection → 4) Isovolumetric relaxation (S2 heart sound: aortic/pulmonary closure) → 5) Ventricular filling.\n• **Renal GFR**: Driven by glomerular capillary hydrostatic pressure ($P_{GC} \\approx 60\\text{ mmHg}$) opposed by Bowman's capsule pressure and plasma oncotic pressure.`
      },
      {
        keys: ['glycolysis', 'krebs', 'tca', 'atp', 'enzyme', 'michaelis', 'urea', 'dna', 'rna', 'protein', 'metabolism', 'biochemistry', 'بايو', 'كيمياء', 'إنزيم'],
        title: 'Biochemistry Metabolic Pathways',
        body: `• **Glycolysis (Cytoplasm)**: Glucose → 2 Pyruvate + 2 ATP (net) + 2 NADH. Rate-limiting enzyme: **PFK-1**.\n• **TCA / Krebs Cycle (Mitochondrial Matrix)**: Acetyl-CoA yields 3 NADH, 1 FADH2, 1 GTP, and 2 CO2 per turn. Rate-limiting: **Isocitrate dehydrogenase**.\n• **Enzyme Kinetics**: $V_0 = \\frac{V_{max}[S]}{K_m + [S]}$. Competitive inhibitors increase apparent $K_m$ without changing $V_{max}$; non-competitive inhibitors decrease $V_{max}$ with unchanged $K_m$.`
      },
      {
        keys: ['epithelium', 'epithelial', 'connective', 'tissue', 'cell', 'mitosis', 'embryo', 'ectoderm', 'mesoderm', 'endoderm', 'histology', 'هستولوجي', 'أنسجة', 'خلية'],
        title: 'Histology & Embryology Essentials',
        body: `• **Epithelial Classification**: Simple squamous (alveoli, endothelium), Simple cuboidal (kidney tubules, thyroid follicles), Simple columnar (GI tract), Pseudostratified ciliated columnar (trachea), Stratified squamous (epidermis/esophagus), Urothelium (urinary bladder).\n• **Embryonic Germ Layers**: **Ectoderm** → CNS/PNS, epidermis; **Mesoderm** → muscle, bone, cardiovascular, urogenital; **Endoderm** → epithelial lining of GI & respiratory tracts.`
      },
      {
        keys: ['gram', 'bacteria', 'virus', 'staining', 'autoclave', 'sterilization', 'antibiotic', 'microbiology', 'ميكرو', 'بكتيريا', 'فيروس'],
        title: 'Microbiology & Virology Notes',
        body: `• **Gram Staining**: Crystal violet → Iodine mordant → Alcohol decolorizer → Safranin counterstain. **Gram-positive** retains purple (thick peptidoglycan + teichoic acid); **Gram-negative** stains pink/red (thin peptidoglycan + outer LPS membrane).\n• **Autoclave Sterilization**: Steam under pressure at **121°C (15 psi) for 15–20 minutes** destroys all bacteria, viruses, fungi, and heat-resistant endospores.`
      },
      {
        keys: ['immune', 'antibody', 'igg', 'iga', 'igm', 'ige', 'mhc', 'hypersensitivity', 'cytokine', 'immunology', 'مناعة'],
        title: 'Immunology High-Yield',
        body: `• **Immunoglobulins**: **IgM** (first responder, pentamer, fixes complement), **IgG** (most abundant, crosses placenta), **IgA** (secretory dimer in mucosa/breast milk), **IgE** (mast cell allergy & helminths).\n• **MHC Presentation**: **MHC Class I** (all nucleated cells) presents endogenous antigens to **CD8+ cytotoxic T cells**; **MHC Class II** (APCs: dendritic cells, macrophages, B cells) presents exogenous antigens to **CD4+ helper T cells**.`
      },
      {
        keys: ['surgery', 'asepsis', 'antisepsis', 'wound', 'suture', 'shock', 'جراحة'],
        title: 'General Surgery Principles',
        body: `• **Wound Healing Phases**: 1) Hemostasis & Inflammation (0–3 days, neutrophils then macrophages) → 2) Proliferation (days 3–21, fibroblasts, angiogenesis, Type III collagen) → 3) Remodeling/Maturation (weeks to months, Type I collagen replaces Type III).\n• **Asepsis vs. Antisepsis**: Asepsis prevents microorganisms from entering sterile tissues; antisepsis eliminates pathogens on living skin/mucosa (chlorhexidine, povidone-iodine).`
      }
    ],

    async respond(userMsg) {
      const raw = String(userMsg || '').trim();
      const q = raw.toLowerCase();
      const isArabic = /[\u0600-\u06FF]/.test(raw);
      const customKey = getPrefs().aiApiKey;

      // 0. Optional live Gemini/OpenAI cloud proxy (/api/ai) or direct Admin key
      if (!customKey && window.location.protocol.startsWith('http')) {
        try {
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              prompt: raw,
              system: `You are Dr. 221 AI, a friendly medical tutor for Year 2 Human Medicine students (Group 221). Reply in the user's language (Arabic or English).`
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.ok && data.reply) return data.reply;
          }
        } catch (_) {}
      }
      if (customKey && (customKey.startsWith('AIza') || customKey.startsWith('AQ.'))) {
        try {
          const isVertex = customKey.startsWith('AQ.');
          const url = isVertex
            ? `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(customKey)}`
            : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(customKey)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: raw }] }]
            })
          });
          if (res.ok) {
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
            if (reply) return reply;
          }
        } catch (_) {}
      }
      if (customKey && customKey.startsWith('sk-')) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${customKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are Dr. 221 AI, an academic medical tutor for Year 2 Human Medicine students.' },
                { role: 'user', content: raw }
              ]
            })
          });
          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return reply;
          }
        } catch (_) {}
      }

      // 1. Check if answering an active Quiz question
      if (this.pendingQuiz) {
        const cleanAns = raw.toUpperCase().replace(/[^A-D]/g, '');
        if (['A', 'B', 'C', 'D'].includes(cleanAns)) {
          const qObj = this.pendingQuiz;
          this.pendingQuiz = null;
          const correct = cleanAns === qObj.ans;
          if (isArabic) {
            return correct
              ? `إجابة صحيحة! (${qObj.ans})\n\n${qObj.expEn}\n\nاكتب "سؤال تاني" لو حابب نكمل تدريب.`
              : `الإجابة الصحيحة هي (${qObj.ans}) — ${qObj.aEn}.\n\nالتفسير: ${qObj.expEn}\n\nاكتب "سؤال تاني" لسؤال جديد.`;
          }
          return correct
            ? `Correct! (${qObj.ans}) — ${qObj.aEn}.\n\n${qObj.expEn}\n\nSay "Quiz me again" for another question!`
            : `Not quite — the right answer is ${qObj.ans}) ${qObj.aEn}.\n\nExplanation: ${qObj.expEn}\n\nSay "Quiz me again" to try another!`;
        }
      }

      // 2. Quiz / Exam Question Generator
      if (/(quiz|mcq|test me|question|exam|اختبر|سؤال|امتحان|اسألني)/.test(q)) {
        const matchedSubj = this.quizBank.find((item) => q.includes(item.subject.toLowerCase().split(' ')[0]));
        const pick = matchedSubj || this.quizBank[Math.floor(Math.random() * this.quizBank.length)];
        this.pendingQuiz = pick;
        return `**${pick.subject} Clinical Question:**\n${pick.qEn}\n\n${pick.opts.join('\n')}\n\n${isArabic ? 'اكتب حرف الإجابة (A أو B أو C أو D):' : 'Reply with A, B, C, or D to check your answer!'}`;
      }

      // 2.5 Doctors / Professors Lookup (Group 221 A & B)
      if (/(doctor|professor|teacher|who teaches|دكتور|دكاترة|دكاتره|مدرس|أستاذ|استاذ)/.test(q)) {
        const tMap = getTeachers();
        const subjectMatchers = [
          { key: 'Anatomy', pats: ['anatomy', 'اناتومي', 'أناتومي', 'تشريح'] },
          { key: 'Biochemistry', pats: ['biochem', 'بايو', 'كيمياء'] },
          { key: 'Hygiene', pats: ['hygiene', 'هايجين', 'صحة', 'صحه'] },
          { key: 'Histology', pats: ['histolog', 'هستو', 'أنسجة', 'انسجة', 'انسجه'] },
          { key: 'Deontology', pats: ['deontolog', 'ديونتولوجي', 'أخلاقيات', 'اخلاقيات'] },
          { key: 'Microbiology', pats: ['microbiolog', 'ميكرو'] },
          { key: 'Physiology', pats: ['physiolog', 'فسيو', 'وظائف'] },
          { key: 'Psychology', pats: ['psych', 'نفس', 'سايكو'] },
          { key: 'Russian Language', pats: ['russian', 'روسي', 'روسى'] },
          { key: 'Sport', pats: ['sport', 'رياضة', 'رياضه'] }
        ];
        const hit = subjectMatchers.find((m) => m.pats.some((p) => q.includes(p)));
        if (hit) {
          const d = tMap[hit.key];
          if (d && d.a !== d.b) {
            return isArabic
              ? `دكاترة مادة **${hit.key}**:\n• **Group 221 A**: د. ${d.a}\n• **Group 221 B**: د. ${d.b}`
              : `**${hit.key}** Doctors:\n• **Group 221 A**: ${d.a}\n• **Group 221 B**: ${d.b}`;
          }
          return isArabic
            ? `دكتور مادة **${hit.key}** لجروب 221 (A و B): **${d?.a || 'غير محدد'}**`
            : `**${hit.key}** Doctor (Group 221 A & B): **${d?.a || 'Faculty Staff'}**`;
        }
        const allLines = teacherSubjects.map((s) => {
          const d = tMap[s];
          return d.a === d.b ? `• **${s}**: ${d.a}` : `• **${s}**: A (${d.a}) · B (${d.b})`;
        }).join('\n');
        return isArabic
          ? `قائمة دكاترة السنة الثانية (Group 221):\n\n${allLines}`
          : `**Year 2 Doctors (Group 221 A & B):**\n\n${allLines}`;
      }

      // 3. Live Schedule Queries (Today, Tomorrow, Specific Day, Next Class, Current Week)
      const weekInfo = ScheduleSync.getWeekDates(0);
      const live = ScheduleSync.getLiveStatus();
      const dayMap = {
        monday: 'Monday', 'الاثنين': 'Monday', 'الاتنين': 'Monday',
        tuesday: 'Tuesday', 'الثلاثاء': 'Tuesday', 'التلات': 'Tuesday',
        wednesday: 'Wednesday', 'الأربعاء': 'Wednesday', 'الاربع': 'Wednesday',
        thursday: 'Thursday', 'الخميس': 'Thursday',
        friday: 'Friday', 'الجمعة': 'Friday', 'الجمعه': 'Friday',
        saturday: 'Saturday', 'السبت': 'Saturday'
      };
      for (const [kw, dName] of Object.entries(dayMap)) {
        if (q.includes(kw)) {
          const classes = schedule[weekInfo.academicWeek]?.[dName] || [];
          const listStr = classes.length
            ? classes.map((c) => `• ${c[0]} — **${c[1]}** (${c[2]})${c[3] ? ` [${c[3]}]` : ''}`).join('\n')
            : 'No classes scheduled.';
          return isArabic
            ? `جدول يوم **${dName}** (${weekInfo.days[dName]} · الأسبوع الدراسي ${weekInfo.academicWeek}):\n\n${listStr}`
            : `**${dName}** (${weekInfo.days[dName]} · Week ${weekInfo.academicWeek}) Schedule:\n\n${listStr}`;
        }
      }

      if (/(next|class|lecture|lab|schedule|timetable|today|week|جدول|محاضرة|معاد|النهارده|الأسبوع|الاسبوع)/.test(q)) {
        const today = ScheduleSync.todayName();
        const todayList = (schedule[weekInfo.academicWeek]?.[today] || [])
          .map((c) => `• ${c[0]} — ${c[1]} (${c[2]})`).join('\n') || 'No classes today.';
        return isArabic
          ? `حالة الجدول المباشرة الآن:\n• **${live.label}**\n• نحن حالياً في **الأسبوع الدراسي ${weekInfo.academicWeek}** (${weekInfo.rangeLabel}).\n\nمحاضرات اليوم (${today}):\n${todayList}`
          : `**Live Schedule Status:**\n• ${live.label}\n• Current parity: **Academic Week ${weekInfo.academicWeek}** (${weekInfo.rangeLabel})\n\n**Today (${today}):**\n${todayList}`;
      }

      // 4. Study Database & Uploaded Files Query
      if (/(file|database|material|pdf|upload|library|ملف|ملفات|مكتبة|مذكرات|مادة)/.test(q)) {
        const mats = getPublishedMaterials();
        const courses = getCourses();
        const matchedCourse = courses.find((c) => q.includes(c.id) || q.includes(c.name.toLowerCase()));
        if (matchedCourse) {
          const subFiles = mats.filter((m) => m.subjectId === matchedCourse.id);
          if (!subFiles.length) {
            return isArabic
              ? `مجلد **${matchedCourse.name}** لا يحتوي على ملفات مرفوعة حالياً. يمكن للأدمن (3mar_r) رفع الملفات من صفحة Study Database.`
              : `**${matchedCourse.name}** currently has 0 uploaded files. The Administrator can upload PDFs and slides in Study Database.`;
          }
          return `**${matchedCourse.name}** (${subFiles.length} files):\n` + subFiles.map((f) => `• ${f.name} (${f.size})`).join('\n');
        }
        return isArabic
          ? `تحتوي قاعدة البيانات حالياً على **${mats.length} ملف** موزعة على 12 مادة دراسية. افتح **Study Database** من القائمة الجانبية لتصفح أو معاينة أي ملف.`
          : `Your Study Database currently holds **${mats.length} file(s)** across all 12 Year 2 subjects. Open **Study Database** to browse or preview documents.`;
      }

      // 5. Medical Curriculum Knowledge Match (Full Native Arabic + English Terminology)
      const arabicSummaries = {
        'Anatomy High-Yield Summary': `**ملخص التشريح (Anatomy) — أهم النقاط:**\n\n• **ثقوب الأعصاب القحفية (Cranial Nerve Foramina - S.R.O):**\n  - الشق الحجاجي العلوي (Superior Orbital Fissure): الأعصاب III و IV و V1 و VI.\n  - الثقب المدور (Foramen Rotundum): العصب الفكي العلوي (CN V2).\n  - الثقب البيضاوي (Foramen Ovale): العصب الفكي السفلي (CN V3).\n• **الضفيرة العضدية (Brachial Plexus C5–T1):** الجذور (Roots) ← الجذوع (Trunks) ← الانقسامات (Divisions) ← الحبال (Cords) ← الفروع (Branches).\n• **الشرايين التاجية (Coronary Circulation):** الشريان الأمامي النازل (LAD) يغذي الثلثين الأماميين للحاجز بين البطينين وقمة القلب، بينما يغذي الشريان التاجي الأيمن (RCA) العقدتين SA و AV في أغلب الناس.`,
        'Normal Physiology Core Mechanisms': `**ملخص الفسيولوجي (Normal Physiology) — الآليات الأساسية:**\n\n• **الناتج القلبي (Cardiac Output):** $CO = HR \times SV$. يعتمد حجم الضربة (Stroke Volume) على الحمل القبلي (Preload - قانون فرانك ستارلينج)، الحمل البعدي (Afterload)، والانقباضية (Contractility).\n• **الدورة القلبية (Cardiac Cycle):**\n  1. انقباض الأذينين (Atrial Systole).\n  2. الانقباض متساوي الحجم (Isovolumetric Contraction) — الصوت القلبي الأول S1 بانغلاق الصمام الميترالي وثلاثي الشرفات.\n  3. قذف الدم البطيني (Ventricular Ejection).\n  4. الارتخاء متساوي الحجم (Isovolumetric Relaxation) — الصوت الثاني S2 بانغلاق الأورطي والرئوي.\n• **الترشيح الكبيبي (GFR):** يتحكم فيه الضغط الهيدروستاتيكي الشعري الكبيبي (~60 mmHg) مقابل ضغط محفظة بومان والضغط الأسموزي الغروي.`,
        'Biochemistry Metabolic Pathways': `**ملخص الكيمياء الحيوية (Biochemistry):**\n\n• **تحلل الجلوكوز (Glycolysis):** يحدث في السيتوبلازم ويحوّل الجلوكوز إلى 2 Pyruvate + صافي 2 ATP + 2 NADH. الإنزيم المحدد للسرعة هو **PFK-1**.\n• **دورة كريبس (TCA Cycle):** تحدث في الميتوكوندريا وتعطي لكل جزيء Acetyl-CoA: 3 NADH و 1 FADH2 و 1 GTP. الإنزيم المنظم الأساسي: **Isocitrate Dehydrogenase**.\n• **حركية الإنزيمات (Enzyme Kinetics):** التثبيط التنافسي (Competitive) يرفع $K_m$ الظاهري مع ثبات $V_{max}$، بينما غير التنافسي (Non-competitive) يخفض $V_{max}$ مع ثبات $K_m$.`,
        'Histology & Embryology Essentials': `**ملخص الهستولوجي والأجنة (Histology & Embryology):**\n\n• **أنواع النسيج الطلائي (Epithelium):** حرشفي بسيط (الحويصلات الهوائية والأوعية)، مكعب بسيط (أنابيب الكلى والغدة الدرقية)، عمودي بسيط (الجهاز الهضمي)، عمودي مهدب كاذب التطبق مع خلايا كأسية (القصبة الهوائية)، وطلائي انتقالي (المثانة البولية).\n• **الطبقات الجنينية الثلاث:** الأديم الظاهر (Ectoderm) للجهاز العصبي والبشرة، الأديم المتوسط (Mesoderm) للعضلات والعظام والقلب والأوعية، والأديم الباطن (Endoderm) لبطانة الجهاز الهضمي والتنفسي.`,
        'Microbiology & Virology Notes': `**ملخص الميكروبيولوجي (Microbiology):**\n\n• **صبغة جرام (Gram Stain):** Crystal Violet ← Iodine ← Alcohol ← Safranin. البكتيريا موجبة الجرام تحتفظ باللون البنفسجي (جدار Peptidoglycan سميك)، بينما سالبة الجرام تظهر وردية/حمراء (طبقة رقيقة + غشاء خارجي LPS).\n• **التعقيم بالأوتوكلاف (Autoclave):** بخار تحت ضغط عند **121°C لمدة 15–20 دقيقة** يقضي على البكتيريا والفيروسات والأبواغ المقاومة للحرارة (Endospores).`,
        'Immunology High-Yield': `**ملخص المناعة (Immunology):**\n\n• **الأجسام المضادة:** **IgM** أول مستجيب (خماسي)، **IgG** الأكثر وفرة والوحيد الذي يعبر المشيمة، **IgA** يحمي الأغشية المخاطية، و **IgE** يرتبط بالحساسية والديدان.\n• **معقد التوافق النسيجي (MHC):** الفئة الأولى (MHC I) على كل الخلايا ذات النواة وتعرض المستضدات لخلايا **CD8+**، بينما الفئة الثانية (MHC II) على الخلايا العارضة للمستضد (APCs) وتعرض لخلايا **CD4+**.`,
        'General Surgery Principles': `**ملخص الجراحة العامة (General Surgery):**\n\n• **مراحل التئام الجروح:** 1) الإرقاء والالتهاب (0–3 أيام) ← 2) التكاثر وبناء الكولاجين النوع الثالث (3–21 يوماً) ← 3) إعادة التشكيل واستبداله بالكولاجين النوع الأول.\n• **التطهير مقابل التعقيم (Asepsis vs Antisepsis):** الـ Asepsis يمنع وصول الميكروبات للأنسجة المعقمة، بينما الـ Antisepsis يقتل الميكروبات على الجلد والأنسجة الحية.`
      };

      for (const topic of this.knowledgeTopics) {
        if (topic.keys.some((k) => q.includes(k))) {
          if (isArabic || isAr()) {
            return `${arabicSummaries[topic.title] || topic.body}\n\nاكتب "اختبرني" لعمل سؤال MCQ طبي، أو اسألني عن أي جزئية بالتفصيل!`;
          }
          return `**${topic.title}**\n\n${topic.body}\n\nAsk me to explain any mechanism in detail, or type "Quiz me" for a clinical MCQ!`;
        }
      }

      // 6. Intelligent General Academic Copilot Response
      return isArabic
        ? `أهلاً دكتور ${current?.name?.split(' ')[0] || 'محمد'}! أقدر أساعدك في:\n• **شرح المواد الطبية**: اسألني عن أي موضوع في Anatomy, Physiology, Biochemistry, Histology, Microbiology, Immunology أو Surgery.\n• **الجدول المباشر**: اسأل عن جدول أي يوم (مثلاً: "جدول يوم الخميس") أو المحاضرة القادمة.\n• **اختبارات سريعة**: اكتب "اختبرني" لعمل سؤال MCQ طبي مع الشرح.\n• **ملفات المواد**: اسأل عن الملفات المرفوعة في أي مادة.`
        : `I'm your **Dr. 221 Medical & Study Copilot**! You can ask me:\n• **Medical Explanations**: Ask about cranial nerves, cardiac cycle, glycolysis, epithelial tissues, Gram staining, MHC, or wound healing.\n• **Live Schedule**: Ask "What classes do I have on Thursday?" or "What is my next class?"\n• **Clinical Quizzes**: Type "Quiz me" for an instant Year 2 MCQ with explanation.\n• **Study Database**: Ask about files in Anatomy, Histology, or any subject.`;
    }
  };

  // ==========================================================================
  // Interactive Pomodoro Focus Timer Pill (Top Header)
  // ==========================================================================
  let focusSeconds = 25 * 60;
  let focusRunning = false;
  let focusInterval = null;

  function formatTimer(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function toggleFocusTimer() {
    const pill = $('#focusTimerPill');
    const label = $('#focusTimerText');
    if (focusRunning) {
      focusRunning = false;
      clearInterval(focusInterval);
      if (pill) pill.classList.remove('timer-running');
      if (label) label.textContent = `Focus ${formatTimer(focusSeconds)}`;
      notify('Study timer paused.');
    } else {
      focusRunning = true;
      if (pill) pill.classList.add('timer-running');
      notify('25-minute study session started!');
      focusInterval = setInterval(() => {
        focusSeconds--;
        if (focusSeconds <= 0) {
          clearInterval(focusInterval);
          focusRunning = false;
          focusSeconds = 25 * 60;
          if (pill) pill.classList.remove('timer-running');
          if (label) label.textContent = 'Focus 25:00';
          notify('Study block complete! Take a 5-minute break.');
          return;
        }
        if (label) label.textContent = `Focusing · ${formatTimer(focusSeconds)}`;
      }, 1000);
    }
  }

  // ==========================================================================
  // Global Shell & Passwordless Login Screen
  // ==========================================================================
  function mountBackdrop() {
    if (!$('.ambient-backdrop')) {
      document.body.insertAdjacentHTML('afterbegin', `
        <div class="ambient-backdrop" aria-hidden="true"><div class="ambient-wallpaper"></div></div>
      `);
    }
  }

  function avatarMarkup(user, large = false) {
    const initials = esc(user?.avatar || user?.name?.slice(0, 2).toUpperCase() || 'DR');
    const inner = user?.avatarImage
      ? `<img src="${esc(user.avatarImage)}" alt="Avatar">`
      : initials;
    return `<span class="${large ? 'profile-avatar' : 'avatar'}">${inner}${large ? `<span class="avatar-edit" title="Change photo">${icon('edit')}</span>` : ''}</span>`;
  }

  function navLink(href, label, iconName, active, badge = '') {
    const pg = String(href || '').replace(/\.html.*$/i, '');
    return `<a class="nav-link ${active ? 'active' : ''}" href="${href}" data-nav-page="${pg}">${icon(iconName)}<span>${label}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ''}</a>`;
  }

  function renderLoginPage() {
    const site = getSiteConfig();
    document.title = `Sign In · ${site.name}`;

    const googleSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>';
    const microsoftSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="9.5" height="9.5" rx="1.2" fill="#F25022"/><rect x="12.5" y="2" width="9.5" height="9.5" rx="1.2" fill="#7FBA00"/><rect x="2" y="12.5" width="9.5" height="9.5" rx="1.2" fill="#00A4EF"/><rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1.2" fill="#FFB900"/></svg>';
    const telegramSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#229ED9"/><path fill="#ffffff" d="M16.95 7.45c.18-.75-.27-1.05-.78-.85L6.56 10.3c-.65.26-.64.63-.11.8l2.46.77 5.71-3.6c.27-.18.51-.08.31.1l-4.62 4.18-.18 2.55c.26 0 .37-.12.51-.26l1.24-1.2 2.57 1.9c.47.26.81.13.93-.44l1.57-7.65z"/></svg>';
    const facebookSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1877F2"/><path fill="#ffffff" d="M15.12 12.95l.36-2.36h-2.26V9.06c0-.65.32-1.28 1.33-1.28h1.03V5.77s-.94-.16-1.83-.16c-1.87 0-3.09 1.13-3.09 3.18v1.8H8.59v2.36h2.07v5.71c.42.07.85.1 1.29.1s.87-.03 1.27-.1v-5.71h1.9z"/></svg>';

    document.body.innerHTML = `
      <main class="auth-page minimal-auth">
        <section class="auth-single-card">
          <div class="auth-brand-top">
            <a class="sidebar-brand" href="index.html" style="padding:0">
              <span class="brand-mark">${icon('activity')}</span>
              <div>${esc(site.name)}<small>${esc(site.tagline)}</small></div>
            </a>
            <button type="button" class="lang-toggle-btn" id="loginLangBtn">${isAr() ? 'EN' : 'عربي'}</button>
          </div>

          <div class="auth-mode-tabs" id="authModeTabs">
            <button type="button" class="auth-mode-btn active" data-auth-mode="login">Log In</button>
            <button type="button" class="auth-mode-btn" data-auth-mode="signup">Sign Up</button>
          </div>

          <div id="authErrorBox" class="auth-error-msg" style="margin-bottom:12px"></div>

          <form id="loginAccountForm" style="display:grid;gap:13px">
            <div class="form-field">
              <label for="loginIdentifier">Email or Username</label>
              <input class="input" id="loginIdentifier" placeholder="name@example.com or username" autocomplete="username" required autofocus>
            </div>

            <div class="form-field">
              <label for="loginPassword">Password</label>
              <div class="auth-pass-wrap">
                <input class="input" id="loginPassword" type="password" placeholder="Enter password" autocomplete="current-password">
                <button type="button" class="auth-pass-eye" data-toggle-pass="loginPassword" aria-label="Show password">${icon('eye')}</button>
              </div>
            </div>

            <button class="btn btn-primary" type="submit" id="loginSubmitBtn" style="height:45px;margin-top:2px">
              Log In ${icon('arrow')}
            </button>
          </form>

          <form id="signUpAccountForm" style="display:none;gap:12px">
            <div class="form-field">
              <label for="signupName">Full Name</label>
              <input class="input" id="signupName" placeholder="e.g. Kareem Adel" autocomplete="name" required>
            </div>

            <div class="form-field">
              <label for="signupEmail">Email</label>
              <input class="input" id="signupEmail" type="email" placeholder="name@example.com" autocomplete="email" required>
            </div>

            <div class="form-field">
              <label for="signupPassword">Password</label>
              <div class="auth-pass-wrap">
                <input class="input" id="signupPassword" type="password" placeholder="At least 6 characters" autocomplete="new-password" minlength="6" required>
                <button type="button" class="auth-pass-eye" data-toggle-pass="signupPassword" aria-label="Show password">${icon('eye')}</button>
              </div>
            </div>

            <div class="form-field">
              <label for="signupGroup">Group</label>
              <select class="select" id="signupGroup">
                <option value="Group 221 A">Group 221 · A</option>
                <option value="Group 221 B">Group 221 · B</option>
              </select>
            </div>

            <button class="btn btn-primary" type="submit" id="signupSubmitBtn" style="height:45px;margin-top:2px">
              Create Account ${icon('arrow')}
            </button>
          </form>

          <div class="auth-divider"><span>Or continue with</span></div>

          <div class="social-auth-grid">
            <button type="button" class="social-auth-btn" data-social-provider="google">
              ${googleSvg}<span>Google</span>
            </button>
            <button type="button" class="social-auth-btn" data-social-provider="microsoft">
              ${microsoftSvg}<span>Microsoft</span>
            </button>
            <button type="button" class="social-auth-btn" data-social-provider="telegram">
              ${telegramSvg}<span>Telegram</span>
            </button>
            <button type="button" class="social-auth-btn" data-social-provider="facebook">
              ${facebookSvg}<span>Facebook</span>
            </button>
          </div>

          <div id="tgLiveWidgetHost" class="tg-widget-host"></div>

          <div class="auth-footer-credit">
            <span class="auth-cloud-pill">● Supabase Cloud</span>
            <span>Powered by <strong style="color:var(--ink)">Omar Tarek</strong></span>
          </div>
        </section>
      </main>
      <div class="toast" id="toast" role="status"></div>
    `;

    mountBackdrop();
    enhanceCustomSelects();
    localizeDom();

    HubSync.pullKV().catch(() => {});
    handleOAuthReturnIfPresent();

    const updateModeGlide = setupHorizontalGlide($('#authModeTabs'), '[data-auth-mode]');
    const errBox = $('#authErrorBox');
    const showAuthErr = (msg) => {
      if (!errBox) return;
      errBox.textContent = msg || '';
      errBox.classList.toggle('show', Boolean(msg));
    };

    const setMode = (mode) => {
      showAuthErr('');
      $$('[data-auth-mode]').forEach((b) => b.classList.toggle('active', b.dataset.authMode === mode));
      $('#loginAccountForm').style.display = mode === 'login' ? 'grid' : 'none';
      $('#signUpAccountForm').style.display = mode === 'signup' ? 'grid' : 'none';
      updateModeGlide(true);
    };

    $$('[data-auth-mode]').forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.authMode)));

    $$('[data-toggle-pass]').forEach((btn) => btn.addEventListener('click', () => {
      const inp = $(`#${btn.dataset.togglePass}`);
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
    }));

    $('#loginLangBtn')?.addEventListener('click', () => {
      toggleSiteLanguage();
      requestAnimationFrame(() => updateModeGlide(false));
    });

    $('#loginAccountForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      showAuthErr('');
      const submitBtn = $('#loginSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;
      const res = await loginAccount($('#loginIdentifier').value, $('#loginPassword').value);
      if (submitBtn) submitBtn.disabled = false;
      if (!res.ok) { showAuthErr(res.error); return; }
      window.location.href = 'dashboard.html';
    });

    $('#signUpAccountForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      showAuthErr('');
      const submitBtn = $('#signupSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;
      const res = await signUpAccount({
        name: $('#signupName').value,
        email: $('#signupEmail').value,
        password: $('#signupPassword').value,
        group: $('#signupGroup').value,
        provider: 'email'
      });
      if (submitBtn) submitBtn.disabled = false;
      if (!res.ok) { showAuthErr(res.error); return; }
      window.location.href = 'dashboard.html';
    });

    window.__dr221OnTelegramAuth = async (tgUser) => {
      if (!tgUser || !tgUser.id) {
        showAuthErr('Telegram sign-in failed.');
        return;
      }
      let verifiedUser = null;
      try {
        const res = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(tgUser)
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data.user) verifiedUser = data.user;
        }
      } catch (_) {}

      if (!verifiedUser && tgUser.hash) {
        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || tgUser.username || `Telegram_${tgUser.id}`;
        verifiedUser = {
          username: tgUser.username || `tg_${tgUser.id}`,
          name: fullName,
          avatarImage: tgUser.photo_url || ''
        };
      }

      if (verifiedUser) {
        const r = await signUpAccount({
          name: verifiedUser.name,
          email: `${verifiedUser.username}@telegram.dr221`,
          handleOverride: verifiedUser.username,
          password: '',
          group: 'Group 221 A',
          provider: 'telegram',
          avatarImage: verifiedUser.avatarImage || ''
        });
        if (r.ok) {
          window.location.href = 'dashboard.html';
          return;
        }
      }
      showAuthErr(isAr() ? 'تعذر إكمال الدخول عبر تليجرام.' : 'Could not complete Telegram sign-in.');
    };

    const oauthConfig = {
      google: { label: 'Google', externalKey: 'google', provider: 'google', extra: '&prompt=select_account' },
      microsoft: { label: 'Microsoft', externalKey: 'azure', provider: 'azure', extra: '&scopes=openid%20email%20profile&prompt=select_account' },
      facebook: { label: 'Facebook', externalKey: 'facebook', provider: 'facebook', extra: '&scopes=email,public_profile' }
    };

    $$('[data-social-provider]').forEach((btn) => btn.addEventListener('click', async () => {
      const prov = btn.dataset.socialProvider;
      showAuthErr('');

      if (prov === 'telegram') {
        const tgHost = $('#tgLiveWidgetHost');
        await HubSync.pullKV().catch(() => {});
        let botUsername = String(getSiteConfig().telegramBotUsername || '').replace(/^@/, '').trim();
        if (!botUsername) {
          try {
            const cfgRes = await fetch('/api/telegram-auth', { cache: 'no-store' });
            const cfg = cfgRes.ok ? await cfgRes.json() : {};
            if (cfg?.configured && cfg.botUsername) botUsername = cfg.botUsername;
          } catch (_) {}
        }
        if (botUsername && tgHost) {
          tgHost.innerHTML = '';
          tgHost.style.display = 'flex';
          const sc = document.createElement('script');
          sc.async = true;
          sc.src = 'https://telegram.org/js/telegram-widget.js?22';
          sc.setAttribute('data-telegram-login', botUsername);
          sc.setAttribute('data-size', 'large');
          sc.setAttribute('data-radius', '14');
          sc.setAttribute('data-onauth', '__dr221OnTelegramAuth(user)');
          sc.setAttribute('data-request-access', 'write');
          tgHost.appendChild(sc);
          return;
        }
        showAuthErr(isAr()
          ? 'لتشغيل Telegram: أنشئ بوت مجاني من @BotFather، اربطه بالدومين (/setdomain → 3martk.github.io)، ثم احفظ اسم البوت في Settings ← AI & Database.'
          : 'To enable Telegram Login: create a bot via @BotFather, run /setdomain (3martk.github.io), then save the Bot Username in Settings → AI & Database.');
        return;
      }

      const cfg = oauthConfig[prov];
      if (!cfg) return;

      const enabled = await checkSupabaseOAuthProviders();
      if (enabled && enabled[cfg.externalKey] === false) {
        showAuthErr(isAr()
          ? `الدخول عبر ${cfg.label} غير مفعّل بعد في Supabase — فعّله من Authentication → Providers → ${cfg.label === 'Microsoft' ? 'Azure' : cfg.label}.`
          : `${cfg.label} OAuth is not enabled in Supabase yet — enable it in Authentication → Providers → ${cfg.label === 'Microsoft' ? 'Azure' : cfg.label}.`);
        return;
      }

      const redirectTo = new URL('login.html', window.location.href).href;
      window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${cfg.provider}&redirect_to=${encodeURIComponent(redirectTo)}${cfg.extra}`;
    }));
  }

  function renderShell(content) {
    const site = getSiteConfig();
    const live = ScheduleSync.getLiveStatus();
    const allMats = getPublishedMaterials();
    const qaCount = getQA().length;
    const pendingCount = getPendingMaterials().length + getFileRequests().filter((r) => r.status === 'open').length;
    const adminUser = isAdmin();
    const titles = {
      dashboard: 'Overview',
      schedule: 'Live Schedule',
      courses: 'My Courses',
      materials: 'Study Database',
      qa: 'Student Q&A',
      seminars: 'Seminars',
      chat: 'Student Chat',
      profile: 'My Profile',
      settings: 'Settings',
      admin: 'Admin Console'
    };
    const pageTitle = titles[page] || 'Overview';
    document.title = `${pageTitle} · ${site.name}`;
    const isDarkTheme = (themeCatalog.find((t) => t.id === getPrefs().theme) || themeCatalog[0]).dark;

    document.body.innerHTML = `
      <div class="app-shell">

        <div class="main-shell">
          <header class="topbar">
            <div class="topbar-bar">
              <button class="btn btn-icon btn-ghost mobile-menu" id="mobileMenu" aria-label="Menu">${icon('menu')}</button>
              <div class="topbar-title">
                <span>${esc(site.name)} · ${adminUser ? 'Leader' : 'Student'}</span>
                <strong id="topbarPageTitle">${pageTitle}</strong>
              </div>

              <!-- Smart Live Status Pills Strip -->
              <div class="live-pills-strip">
                <a class="smart-pill accent-pill" href="schedule.html" title="${esc(live.detail)}">
                  <span class="live-dot"></span>
                  <span>${esc(live.short)}</span>
                </a>
                <a class="smart-pill" href="schedule.html" title="Current Academic Week">
                  ${icon('calendar')}
                  <span>Week ${live.week} · ${live.todayDone}/${live.todayTotal} Today</span>
                </a>
                <button type="button" class="smart-pill" id="focusTimerPill" title="Click to Start/Pause 25-min Study Timer">
                  ${icon('clock')}
                  <span id="focusTimerText">Focus 25:00</span>
                </button>
              </div>

              <form class="topbar-search" id="globalSearchForm">
                <span>${icon('search')}</span>
                <input class="input" id="globalSearch" placeholder="Search subjects..." autocomplete="off">
              </form>

              <div class="topbar-actions">
                <button type="button" class="smart-pill install-app-pill" id="installAppBtn" title="Install Dr. 221 as Mobile App">${icon('smartphone')}<span>Install App</span></button>
                <button type="button" class="lang-toggle-btn" id="langQuickBtn" title="Switch Language / تغيير اللغة">${isAr() ? 'EN' : 'عربي'}</button>
                <button class="btn btn-icon btn-ghost" id="themeQuickBtn" title="Switch Light / Dark Theme">${icon(isDarkTheme ? 'sun' : 'moon')}</button>
                <a class="topbar-profile" href="profile.html" title="My Profile">
                  ${avatarMarkup(current)}
                  <span class="topbar-profile-name">${esc(current?.name?.split(' ')[0] || 'User')} ${flairHtml(current, false)}</span>
                </a>
                <button class="btn btn-icon btn-ghost" id="topbarLogoutBtn" title="Sign Out">${icon('logout')}</button>
              </div>
            </div>
          </header>

          <a class="mobile-live-strip" href="schedule.html" id="mobileLiveStrip">
            <div class="mobile-live-strip-left">
              <span class="live-dot"></span>
              <span>${esc(live.short)}</span>
            </div>
            <span class="mobile-live-strip-week">W${live.week} · ${live.todayDone}/${live.todayTotal}</span>
          </a>
          <main class="page-content" id="mainPageContent"><div id="broadcastSlot"></div>${content}</main>
        </div>
      </div>

      <nav class="mobile-dock" aria-label="Quick navigation">
        <a href="dashboard.html" data-nav-page="dashboard" class="${page === 'dashboard' ? 'active' : ''}">${icon('grid')}<span>Home</span></a>
        <a href="schedule.html" data-nav-page="schedule" class="${page === 'schedule' ? 'active' : ''}">${icon('calendar')}<span>Schedule</span></a>
        <a href="materials.html" data-nav-page="materials" class="${page === 'materials' ? 'active' : ''}">${icon('database')}<span>Database</span></a>
        <a href="qa.html" data-nav-page="qa" class="${page === 'qa' ? 'active' : ''}">${icon('help')}<span>Q&amp;A</span></a>
        <a href="chat.html" data-nav-page="chat" class="${page === 'chat' ? 'active' : ''}">${icon('message')}<span>Chat</span></a>
      </nav>

        <aside class="sidebar" id="sidebar">
          <a class="sidebar-brand" href="dashboard.html">
            <span class="brand-mark">${icon('activity')}</span>
            <div>${esc(site.name)}<small>${esc(site.tagline)}</small></div>
          </a>
          <nav class="sidebar-nav">
            <div class="nav-label">Academic Workspace</div>
            ${navLink('dashboard.html', 'Overview', 'grid', page === 'dashboard')}
            ${navLink('schedule.html', 'Live Schedule', 'calendar', page === 'schedule', `W${live.week}`)}
            ${navLink('courses.html', 'My Courses', 'book', page === 'courses', '12')}
            ${navLink('materials.html', 'Study Database', 'database', page === 'materials', String(allMats.length))}
            ${navLink('qa.html', 'Student Q&A', 'help', page === 'qa', String(qaCount))}
            ${navLink('seminars.html', 'Seminars', 'video', page === 'seminars')}
            ${navLink('chat.html', 'Student Chat', 'message', page === 'chat')}
            <div class="nav-label">Personal</div>
            ${navLink('profile.html', 'My Profile', 'user', page === 'profile')}
            ${navLink('settings.html', 'Settings', 'settings', page === 'settings')}
            ${adminUser ? navLink('admin.html', 'Admin Console', 'shield', page === 'admin', pendingCount ? String(pendingCount) : '') : ''}
          </nav>
          <div class="sidebar-spacer"></div>
          <div class="sidebar-user-box">
            <a class="sidebar-user-link" href="profile.html">
              ${avatarMarkup(current)}
              <div style="min-width:0">
                <strong>${esc(current?.name || 'Student')} ${flairHtml(current, false)}</strong>
                <small>${adminUser ? 'Leader 👑' : esc(current?.group || 'Group 221 A')}</small>
              </div>
            </a>
            <button class="btn btn-icon btn-ghost" id="sidebarLogoutBtn" title="Switch Account / Sign Out">${icon('logout')}</button>
          </div>
        </aside>

        <div class="drawer-overlay" id="drawerOverlay"></div>

      <div class="modal-backdrop" id="filePreviewModal">
        <div class="modal-box">
          <div class="modal-head">
            <div>
              <span class="eyebrow">Database Viewer</span>
              <h2 id="previewFileTitle">Document</h2>
              <p id="previewFileMeta"></p>
            </div>
            <button class="btn btn-icon btn-ghost" data-close-modal="filePreviewModal">${icon('close')}</button>
          </div>
          <div class="preview-stage" id="previewStage"></div>
          <div class="modal-actions">
            <a class="btn btn-secondary" id="previewNewTabBtn" target="_blank" rel="noopener">Open in New Tab</a>
            <a class="btn btn-primary" id="previewDownloadBtn" download>${icon('download')} Download</a>
          </div>
        </div>
      </div>



      <div class="toast" id="toast" role="status"></div>
    `;
  }

  function headingHtml(eyebrow, title, subtitle, actions = '') {
    return `<div class="page-heading">
      <div>
        <span class="eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
      ${actions ? `<div class="heading-actions">${actions}</div>` : ''}
    </div>`;
  }

  // ==========================================================================
  // Page Templates
  // ==========================================================================
  function dashboardTemplate() {
    const now = new Date();
    const weekInfo = ScheduleSync.getWeekDates(0);
    const live = ScheduleSync.getLiveStatus();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
    const mats = getPublishedMaterials();
    const qaCount = getQA().length;
    const adminUser = isAdmin();

    return `<section class="page-view">
      <!-- 1. Live Now / Next Class Smart Card -->
      <section class="ov-live-card">
        <div style="min-width:0">
          <div class="ov-live-meta">
            <span class="pill ${live.state === 'live' ? 'success' : 'blue'}"><span class="live-dot" style="width:7px;height:7px;margin-right:4px"></span>${esc(live.label)}</span>
            <span class="pill">Week ${weekInfo.academicWeek}</span>
            <span class="muted" style="font-size:.7rem;font-weight:600">${esc(dateStr)}</span>
          </div>
          <h2 class="ov-live-title">${esc(live.short)}</h2>
          <p class="ov-live-sub">${esc(live.detail || `Academic Week ${weekInfo.academicWeek} · ${weekInfo.rangeLabel}`)}</p>
        </div>
        <div class="ov-live-actions">
          <a class="btn btn-primary btn-sm" href="schedule.html">${icon('calendar')} Live Schedule</a>
          <a class="btn btn-secondary btn-sm" id="ovHeroDbBtn" href="materials.html">${icon('database')} Database (${mats.length})</a>
        </div>
      </section>

      <!-- 2. Essential 1-Tap Shortcuts -->
      <div class="ov-quick-shortcuts">
        <a class="ov-shortcut-btn" href="schedule.html">
          <span class="ov-shortcut-icon">${icon('calendar')}</span>
          <div><strong>Schedule</strong><small>Week ${weekInfo.academicWeek} · ${live.todayDone}/${live.todayTotal} done</small></div>
        </a>
        <a class="ov-shortcut-btn" href="materials.html">
          <span class="ov-shortcut-icon">${icon('database')}</span>
          <div><strong>Study Files</strong><small id="ovShortcutFiles">${mats.length} files</small></div>
        </a>
        <a class="ov-shortcut-btn" href="chat.html">
          <span class="ov-shortcut-icon">${icon('message')}</span>
          <div><strong>Group Chat</strong><small>Public A &amp; B</small></div>
        </a>
        <a class="ov-shortcut-btn" href="qa.html">
          <span class="ov-shortcut-icon">${icon('help')}</span>
          <div><strong>Student Q&amp;A</strong><small>${qaCount} questions</small></div>
        </a>
      </div>

      <!-- 3. Today's Classes + Latest Cloud Study Files -->
      <div class="dashboard-grid">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Today's Classes</h2>
              <p>${esc(ScheduleSync.todayName())} · Academic Week ${weekInfo.academicWeek}</p>
            </div>
            <a class="panel-link" href="schedule.html">Full week ${icon('arrow')}</a>
          </div>
          <div class="schedule-mini" id="dashboardScheduleList"></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Latest Study Files</h2>
              <p>Tap any recent cloud file to open immediately</p>
            </div>
            <a class="panel-link" href="materials.html">${adminUser ? 'Upload / Manage' : 'All files'} ${icon('arrow')}</a>
          </div>
          <div class="schedule-mini" id="dashboardRecentFiles"></div>
        </section>
      </div>

      <!-- 4. Today's Recap & Announcements -->
      <section class="panel" style="margin-top:16px">
        <div class="panel-head">
          <div>
            <h2>What We Covered Today</h2>
            <p>Lectures, lab prep, and exam reminders for Group 221 A &amp; B</p>
          </div>
          ${adminUser ? `<button type="button" class="btn btn-primary btn-sm" id="openRecapModalBtn">${icon('plus')} Post Recap</button>` : ''}
        </div>
        <div class="recap-list" id="dashboardRecapList"></div>
      </section>

      ${adminUser ? `
      <div class="modal-backdrop" id="recapModal">
        <div class="modal-box">
          <div class="modal-head">
            <div><span class="eyebrow">Daily Student Recap</span><h2>Post Today's Summary</h2><p>Share what was covered in today's lectures or labs.</p></div>
            <button class="btn btn-icon btn-ghost" data-close-modal="recapModal">${icon('close')}</button>
          </div>
          <form id="recapForm" class="form-grid" style="margin-top:14px">
            <div class="form-field">
              <label>Subject</label>
              <select class="select" id="recapSubject">${getCourses().map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
            </div>
            <div class="form-field">
              <label>Target Group</label>
              <select class="select" id="recapGroup">
                <option value="Group 221 A & B">Group 221 A &amp; B</option>
                <option value="Group 221 A">Group 221 A</option>
                <option value="Group 221 B">Group 221 B</option>
              </select>
            </div>
            <div class="form-field full">
              <label>What was covered today?</label>
              <textarea class="textarea" id="recapSummary" required placeholder="e.g. Finished cranial nerves VII–XII, quiz next Tuesday..."></textarea>
            </div>
            <div class="form-field full">
              <label>Next Deadline / Reminder (Optional)</label>
              <input class="input" id="recapDeadline" placeholder="e.g. Lab notebook due Friday">
            </div>
            <div class="modal-actions full">
              <button type="button" class="btn btn-secondary" data-close-modal="recapModal">Cancel</button>
              <button type="submit" class="btn btn-primary">${icon('check')} Publish Recap</button>
            </div>
          </form>
        </div>
      </div>
      ` : ''}
    </section>`;
  }

  function scheduleTemplate() {
    const adminUser = isAdmin();
    return `<section class="page-view">
      ${headingHtml(
        'Real-Time Calendar Sync',
        'Class Schedule',
        'Automatically tracks the current calendar date, switches Week 1 / Week 2 every Monday, and highlights live classes.',
        `<button class="btn btn-secondary btn-sm" id="jumpTodayBtn">${icon('refresh')} Today</button>
         <button class="btn btn-secondary btn-sm" id="shareScheduleBtn">${icon('share')} Copy Today</button>
         <button class="btn btn-secondary btn-sm" id="exportIcsBtn">${icon('download')} Sync Calendar (.ics)</button>
         <button class="btn btn-secondary btn-sm" id="fullWeekButton">${icon('calendar')} Full Week</button>
         ${adminUser ? `<button class="btn btn-primary btn-sm" id="editScheduleModalBtn">${icon('edit')} Edit Classes</button>` : ''}`
      )}

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 id="scheduleTitle">Loading live schedule...</h2>
            <p id="scheduleNote"></p>
          </div>
          <div class="week-nav-bar">
            <button class="btn btn-secondary btn-icon" id="prevWeekBtn" title="Previous Week">${icon('chevronLeft')}</button>
            <div class="week-tabs" id="weekTabsGroup">
              <button class="week-tab" data-week-offset="-1">Last Week</button>
              <button class="week-tab active" data-week-offset="0">This Week</button>
              <button class="week-tab" data-week-offset="1">Next Week</button>
            </div>
            <button class="btn btn-secondary btn-icon" id="nextWeekBtn" title="Next Week">${icon('chevron')}</button>
          </div>
        </div>

        <div class="filter-bar" style="margin-bottom:8px">
          <div class="glide-chip-group" id="groupFilterTabs">
            <button class="filter-chip ${getPrefs().groupFilter === 'all' ? 'active' : ''}" data-group-filter="all">All Group 221</button>
            <button class="filter-chip ${getPrefs().groupFilter === 'a' ? 'active' : ''}" data-group-filter="a">Group 221 A</button>
            <button class="filter-chip ${getPrefs().groupFilter === 'b' ? 'active' : ''}" data-group-filter="b">Group 221 B</button>
          </div>
          ${adminUser ? `<button class="btn btn-ghost btn-sm" id="editTeachersButton" style="margin-left:auto">${icon('user')} Assign Teachers</button>` : ''}
        </div>

        <div class="day-strip" id="dayStrip"></div>
        <div class="schedule-board" id="scheduleBoard"></div>
      </section>

      <div class="modal-backdrop" id="scheduleEditModal">
        <div class="modal-box">
          <div class="modal-head">
            <div><span class="eyebrow">Admin Timetable Editor</span><h2>Edit Recurring Classes</h2><p>Changes automatically apply to all future synced weeks.</p></div>
            <button class="btn btn-icon btn-ghost" data-close-modal="scheduleEditModal">${icon('close')}</button>
          </div>
          <div class="form-grid" style="margin-top:14px">
            <div class="form-field"><label>Academic Week Parity</label><select class="select" id="modalEditWeek"><option value="1">Week 1</option><option value="2">Week 2</option></select></div>
            <div class="form-field"><label>Day of Week</label><select class="select" id="modalEditDay">${dayNames.map((d) => `<option value="${d}">${d}</option>`).join('')}</select></div>
          </div>
          <div id="modalScheduleRows" style="display:grid;gap:10px;margin-top:14px"></div>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="modalAddClassBtn" type="button">${icon('plus')} Add Class</button>
            <button class="btn btn-primary" id="modalSaveClassBtn" type="button">${icon('check')} Save Timetable</button>
          </div>
        </div>
      </div>

      <div class="modal-backdrop" id="teacherModal">
        <div class="modal-box">
          <div class="modal-head">
            <div><span class="eyebrow">Admin Faculty</span><h2>Assign Teachers</h2><p>Displayed automatically beside every lecture and lab.</p></div>
            <button class="btn btn-icon btn-ghost" data-close-modal="teacherModal">${icon('close')}</button>
          </div>
          <form id="teacherForm" style="margin-top:14px">
            <div class="form-grid" id="teacherFields"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" data-close-modal="teacherModal">Cancel</button>
              <button class="btn btn-primary" type="submit">${icon('check')} Save Teachers</button>
            </div>
          </form>
        </div>
      </div>
    </section>`;
  }

  function coursesTemplate() {
    return `<section class="page-view">
      ${headingHtml(
        'Year 2 Curriculum',
        'My Courses',
        'All 12 subjects of Human Medicine with realistic clinical & laboratory photography, progress tracking, and study files.'
      )}
      <div class="filter-bar">
        <div class="glide-chip-group" id="courseFilterTabs">
          <button class="filter-chip active" data-course-filter="all">All 12 Subjects</button>
          <button class="filter-chip" data-course-filter="active">In Progress</button>
          <button class="filter-chip" data-course-filter="semester2">Semester 2</button>
        </div>
        <input class="input" id="courseSearch" placeholder="Search Anatomy, Histology, Physiology...">
      </div>
      <div class="course-grid" id="courseGrid"></div>
    </section>`;
  }

  function materialsTemplate() {
    const courses = getCourses();
    const adminUser = isAdmin();
    return `<section class="page-view" id="materialLibraryRoot">
      ${headingHtml(
        adminUser ? 'Administrator Database Controls' : 'Student Read-Only Library',
        'Study Database',
        adminUser
          ? 'Upload, organize, rename, or remove PDFs, lecture slides, histology images, and notes across all 12 subjects.'
          : 'Browse, preview, and download official lecture notes and practical guides published by your administrator.',
        adminUser
          ? `<button class="btn btn-secondary btn-sm" id="exportDbBackupBtn">${icon('download')} Backup DB</button>
             <button class="btn btn-primary btn-sm" id="quickUploadTrigger">${icon('upload')} + Upload Files</button>`
          : `<span class="pill success">${icon('lock')} Read-Only Student Access</span>`
      )}

      <div class="database-layout">
        <section class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow" id="dbStatusBadge">Database Ready</span>
              <h2 id="materialViewTitle">All 12 Subject Folders</h2>
              <p id="materialCount">Select Anatomy, Histology, or any subject to view files.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <input class="input" id="materialSearchInput" placeholder="Search files..." style="width:180px;height:38px;font-size:.73rem;border-radius:999px">
              <button type="button" class="btn btn-secondary btn-sm" id="refreshCloudFilesBtn" title="Refresh Cloud Files">${icon('refresh')} Sync</button>
              <button class="btn btn-secondary btn-sm" id="backToFolders" style="display:none">${icon('chevronLeft')} All Folders</button>
            </div>
          </div>

          <div class="subject-folder-grid" id="subjectFolders"></div>

          <div id="materialFolderView" style="display:none">
            <div class="material-folder-header">
              <span class="folder-large-icon" id="materialFolderIcon"></span>
              <div style="flex:1;min-width:0">
                <h3 id="materialFolderTitle">Anatomy</h3>
                <p id="materialFolderSubtitle">0 files</p>
              </div>
              <div style="display:flex;gap:6px;flex:none">
                <button type="button" class="btn btn-secondary btn-sm active" data-mat-view="grid" title="Grid View">${icon('grid')}</button>
                <button type="button" class="btn btn-ghost btn-sm" data-mat-view="list" title="List View">${icon('menu')}</button>
              </div>
            </div>
            <div id="materialList"></div>
          </div>
        </section>

        ${adminUser ? `
        <section class="panel upload-panel">
          <div>
            <span class="eyebrow">Admin Direct Upload</span>
            <h2 style="margin:6px 0 4px;font-size:1.05rem">Add Files to Subject</h2>
            <p class="muted" style="font-size:.7rem;margin:0">Only Administrator (${esc(current.username)}) can upload or modify files.</p>
          </div>

          <div class="form-field">
            <label for="uploadSubject">1. Choose Subject Folder</label>
            <select class="select" id="uploadSubject">
              ${courses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
            </select>
          </div>

          <div class="form-field">
            <label for="uploadCategory">2. Material Category</label>
            <select class="select" id="uploadCategory">
              <option value="Lecture">Lecture Slides / PDF</option>
              <option value="Lab Guide">Practical / Lab Guide</option>
              <option value="Atlas & Slides">Atlas / Histology Slides</option>
              <option value="Exam Prep">Exam Questions & Answers</option>
              <option value="Personal Notes">Official Study Notes</option>
            </select>
          </div>

          <div class="form-field">
            <label for="uploadNote">3. Short Note (Optional)</label>
            <input class="input" id="uploadNote" placeholder="e.g. Cranial nerves summary or Week 2 lab" style="border-radius:999px">
          </div>

          <label class="drop-zone" id="materialDropZone" for="materialFiles">
            ${icon('upload')}
            <strong style="display:block;color:var(--ink);font-size:.78rem">Click or Drag & Drop Files Here</strong>
            <span>Supports PDF, PPTX, DOCX, Images, Videos, ZIP</span>
            <input class="file-input" id="materialFiles" type="file" multiple>
          </label>

          <div id="uploadCloudDiag" style="display:none;padding:9px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);font-size:.69rem;line-height:1.45;font-weight:700"></div>

          <div class="info-row" style="padding:8px 0 0;border:0">
            <span>Storage Engine</span>
            <strong id="dbStorageMeter" style="color:var(--accent-ink)">Calculating...</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-secondary btn-sm" id="matTestCloudBtn" style="flex:1">${icon('refresh')} Test Cloud</button>
            <button type="button" class="btn btn-secondary btn-sm" id="matPushLocalBtn" style="flex:1">${icon('upload')} Push Local</button>
            <button type="button" class="btn btn-danger btn-sm" id="matClearLocalBtn" style="flex:1">${icon('close')} Clear Local</button>
          </div>
        </section>
        ` : `
        <div style="display:grid;gap:16px">
          <section class="panel upload-panel" style="border-style:solid;border-color:var(--line-strong)">
            <div>
              <span class="eyebrow">Contribute to Group 221</span>
              <h2 style="margin:6px 0 4px;font-size:1.02rem">Send a File to Admin</h2>
              <p class="muted" style="font-size:.7rem;margin:0">Have notes, slides, or lab photos? Send them to the Administrator's review queue — once approved, they publish here with your name!</p>
            </div>
            <div class="form-field">
              <label for="studentSubmitSubject">Subject Folder</label>
              <select class="select" id="studentSubmitSubject">
                ${courses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label for="studentSubmitNote">Short Note (Optional)</label>
              <input class="input" id="studentSubmitNote" placeholder="e.g. Histology lab slides photos" style="border-radius:999px">
            </div>
            <label class="drop-zone" for="studentSubmitFiles" style="padding:18px 14px">
              ${icon('upload')}
              <strong style="display:block;color:var(--ink);font-size:.76rem">Choose File(s) to Send</strong>
              <span>Sent safely for Admin approval</span>
              <input class="file-input" id="studentSubmitFiles" type="file" multiple>
            </label>
          </section>

          <section class="panel">
            <div>
              <span class="eyebrow">Missing Something?</span>
              <h2 style="margin:6px 0 4px;font-size:1.02rem">Request a Missing File</h2>
              <p class="muted" style="font-size:.7rem;margin:0 0 12px">Ask for a specific lecture PDF, lab guide, or exam file.</p>
            </div>
            <form id="fileRequestForm" style="display:grid;gap:10px">
              <div class="form-field">
                <label for="reqSubject">Subject</label>
                <select class="select" id="reqSubject">${courses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
              </div>
              <div class="form-field">
                <label for="reqTitle">What file do you need?</label>
                <input class="input" id="reqTitle" required placeholder="e.g. Week 2 Physiology lecture slides">
              </div>
              <button type="submit" class="btn btn-primary btn-sm">${icon('megaphone')} Send Request</button>
            </form>
            <div id="studentOpenRequests" style="display:grid;gap:8px;margin-top:14px"></div>
          </section>
        </div>
        `}
      </div>
    </section>`;
  }


  let activeQaSubject = 'all';
  let activeQaStatus = 'all';

  function qaTemplate() {
    const courses = getCourses();
    return `<section class="page-view">
      ${headingHtml(
        'Classmate Knowledge Board',
        'Student Q&A',
        'Ask medical questions, vote on the best explanations, and browse Leader-verified answers.',
        `<button type="button" class="btn btn-primary" id="openAskQaBtn">${icon('plus')} Ask a Question</button>`
      )}

      <div class="qa-hero-stats" id="qaHeroStats">
        <div class="qa-mini-stat"><span>Total Questions</span><strong id="qaStatTotal">0</strong></div>
        <div class="qa-mini-stat"><span>Solved &amp; Verified</span><strong id="qaStatSolved" style="color:var(--green)">0</strong></div>
        <div class="qa-mini-stat"><span>Needs Answer</span><strong id="qaStatOpen" style="color:var(--accent-ink)">0</strong></div>
      </div>

      <div class="qa-toolbar">
        <div class="qa-status-pills">
          <button type="button" class="qa-pill-btn active" data-qa-status="all">All</button>
          <button type="button" class="qa-pill-btn" data-qa-status="open">Open</button>
          <button type="button" class="qa-pill-btn" data-qa-status="solved">✓ Solved</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select class="select" id="qaSubjectFilter" style="width:185px">
            <option value="all">All 12 Subjects</option>
            ${courses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
          </select>
          <input class="input" id="qaSearchInput" placeholder="Search questions..." style="width:210px;height:38px;border-radius:999px;font-size:.75rem">
        </div>
      </div>

      <div class="qa-grid" id="qaListContainer" style="display:grid;gap:14px"></div>

      <div class="modal-backdrop" id="askQaModal">
        <div class="modal-box">
          <div class="modal-head">
            <div><span class="eyebrow">Group 221 Q&amp;A</span><h2>Ask Classmates</h2><p>Pick a subject so everyone can find and answer your question.</p></div>
            <button class="btn btn-icon btn-ghost" data-close-modal="askQaModal">${icon('close')}</button>
          </div>
          <form id="askQaForm" class="form-grid" style="margin-top:14px">
            <div class="form-field full">
              <label>Subject</label>
              <select class="select" id="qaNewSubject">${courses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
            </div>
            <div class="form-field full">
              <label>Question Title</label>
              <input class="input" id="qaNewTitle" required placeholder="e.g. Which pages are in Thursday's Anatomy colloquium?">
            </div>
            <div class="form-field full">
              <label>Details (Optional)</label>
              <textarea class="textarea" id="qaNewBody" placeholder="Add context, page numbers, or what part is confusing..."></textarea>
            </div>
            <div class="modal-actions full" style="margin-top:6px">
              <button type="button" class="btn btn-secondary" data-close-modal="askQaModal">Cancel</button>
              <button type="submit" class="btn btn-primary">${icon('check')} Post Question</button>
            </div>
          </form>
        </div>
      </div>
    </section>`;
  }

  function renderQAList() {
    const box = $('#qaListContainer');
    if (!box) return;
    const term = ($('#qaSearchInput')?.value || '').trim().toLowerCase();
    const adminUser = isAdmin();
    const allQs = getQA();

    const solvedCount = allQs.filter((q) => (q.answers || []).some((a) => a.verified)).length;
    const openCount = allQs.filter((q) => !(q.answers || []).length).length;
    if ($('#qaStatTotal')) $('#qaStatTotal').textContent = String(allQs.length);
    if ($('#qaStatSolved')) $('#qaStatSolved').textContent = String(solvedCount);
    if ($('#qaStatOpen')) $('#qaStatOpen').textContent = String(openCount);

    const list = allQs
      .filter((q) => (activeQaSubject === 'all' || q.subjectId === activeQaSubject))
      .filter((q) => {
        const isSolved = (q.answers || []).some((a) => a.verified);
        if (activeQaStatus === 'solved') return isSolved;
        if (activeQaStatus === 'open') return !isSolved;
        return true;
      })
      .filter((q) => !term || `${q.title} ${q.body} ${q.subject} ${q.author}`.toLowerCase().includes(term))
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

    if (!list.length) {
      box.innerHTML = `<div class="panel empty">${icon('help')}<strong>No matching questions</strong><span>Try switching filters or ask a new question above.</span></div>`;
      return;
    }

    box.innerHTML = list.map((q) => {
      const answers = [...(q.answers || [])].sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)) || (b.votes || 0) - (a.votes || 0));
      const isSolved = answers.some((a) => a.verified);

      return `
        <article class="qa-thread-card ${isSolved ? 'solved' : ''}">
          <div class="qa-thread-head">
            <div class="qa-author-row">
              ${smallAvatarHtml(q.author, q.author)}
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <strong style="font-size:.8rem">${esc(q.author)} ${flairForUsername(q.author)}</strong>
                  <small class="muted" style="font-size:.66rem">· ${esc(q.authorGroup || 'Group 221')} · ${esc(q.createdAt || '')}</small>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">
                  <span class="pill blue">${esc(q.subject)}</span>
                  ${isSolved ? `<span class="pill success">✓ Solved</span>` : `<span class="pill">Open</span>`}
                  ${q.pinned ? `<span class="pill amber">Pinned</span>` : ''}
                  <span class="muted" style="font-size:.66rem">${answers.length} answer${answers.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
            ${adminUser ? `
              <div style="display:flex;gap:5px;flex:none">
                <button type="button" class="btn btn-secondary btn-sm" data-qa-pin="${esc(q.id)}">${q.pinned ? 'Unpin' : 'Pin'}</button>
                <button type="button" class="btn btn-danger btn-sm" data-qa-del="${esc(q.id)}" title="Delete">${icon('close')}</button>
              </div>
            ` : ''}
          </div>

          <h3 class="qa-thread-title">${esc(q.title)}</h3>
          ${q.body ? `<p class="qa-thread-body">${esc(q.body)}</p>` : ''}

          ${answers.length ? `
          <div class="qa-answers-stack">
            ${answers.map((a) => {
              const voted = (a.voters || []).includes(current?.username);
              return `
                <div class="qa-answer-box ${a.verified ? 'verified' : ''}">
                  <div class="qa-vote-col">
                    <button type="button" class="qa-upvote-btn ${voted ? 'voted' : ''}" data-qa-vote="${esc(q.id)}::${esc(a.id)}" title="Helpful">
                      ▲<span>${a.votes || 0}</span>
                    </button>
                  </div>
                  <div style="min-width:0">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:5px">
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;max-width:100%">
                        ${smallAvatarHtml(a.author, a.author)}
                        <strong style="font-size:.76rem">${esc(a.author)} ${flairForUsername(a.author)}</strong>
                        <small class="muted" style="font-size:.64rem">${esc(a.createdAt || '')}</small>
                        ${a.verified ? `<span class="pill success" style="padding:2px 8px;font-size:.6rem">✓ Verified by Leader</span>` : ''}
                      </div>
                      ${adminUser ? `<button type="button" class="btn btn-ghost btn-sm" data-qa-verify="${esc(q.id)}::${esc(a.id)}">${a.verified ? 'Unverify' : 'Verify ✓'}</button>` : ''}
                    </div>
                    <p style="margin:0;font-size:.8rem;line-height:1.55">${esc(a.text)}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          ` : ''}

          <form class="qa-reply-composer" data-qa-reply="${esc(q.id)}">
            <input class="input" placeholder="Write a helpful answer..." required style="border-radius:999px;height:38px;font-size:.75rem">
            <button type="submit" class="btn btn-primary btn-sm">Reply</button>
          </form>
        </article>
      `;
    }).join('');

    $$('[data-qa-reply]', box).forEach((form) => form.addEventListener('submit', (e) => {
      e.preventDefault();
      const qId = form.dataset.qaReply;
      const inp = $('input', form);
      const text = inp.value.trim();
      if (!text) return;
      const all = getQA();
      const target = all.find((x) => x.id === qId);
      if (!target) return;
      const answer = {
        id: `ans-${Date.now()}`,
        author: current?.name || 'Student',
        authorRole: isAdmin() ? 'Leader' : (current?.group || 'Student'),
        text,
        votes: 1,
        voters: [current?.username || 'student'],
        verified: isAdmin(),
        createdAt: 'Just now'
      };
      target.answers = [...(target.answers || []), answer];
      saveQA(all);
      HubSync.push('qa_answer', { questionId: qId, answer });
      playSoftPing();
      renderQAList();
      notify('Answer posted!');
    }));

    $$('[data-qa-vote]', box).forEach((b) => b.addEventListener('click', () => {
      const [qId, aId] = b.dataset.qaVote.split('::');
      const all = getQA();
      const q = all.find((x) => x.id === qId);
      const a = q?.answers?.find((x) => x.id === aId);
      if (!a) return;
      const u = current?.username || 'student';
      a.voters = a.voters || [];
      if (a.voters.includes(u)) a.voters = a.voters.filter((x) => x !== u);
      else a.voters.push(u);
      a.votes = a.voters.length;
      saveQA(all);
      HubSync.push('qa_vote', { questionId: qId, answerId: aId, username: u });
      renderQAList();
    }));

    if (adminUser) {
      $$('[data-qa-verify]', box).forEach((b) => b.addEventListener('click', () => {
        const [qId, aId] = b.dataset.qaVerify.split('::');
        const all = getQA();
        const q = all.find((x) => x.id === qId);
        const a = q?.answers?.find((x) => x.id === aId);
        if (!a) return;
        a.verified = !a.verified;
        saveQA(all);
        HubSync.push('qa_verify', { questionId: qId, answerId: aId });
        renderQAList();
        notify(a.verified ? 'Answer verified by Leader!' : 'Verification removed.');
      }));
      $$('[data-qa-pin]', box).forEach((b) => b.addEventListener('click', () => {
        const qId = b.dataset.qaPin;
        const all = getQA();
        const q = all.find((x) => x.id === qId);
        if (!q) return;
        q.pinned = !q.pinned;
        saveQA(all);
        HubSync.push('qa_pin', { questionId: qId });
        renderQAList();
      }));
      $$('[data-qa-del]', box).forEach((b) => b.addEventListener('click', () => {
        const qId = b.dataset.qaDel;
        saveQA(getQA().filter((x) => x.id !== qId));
        HubSync.push('qa_delete', { questionId: qId });
        renderQAList();
        notify('Question removed.');
      }));
    }
  }

  function bindQA() {
    if (!$('#qaListContainer')) return;
    $$('[data-qa-status]').forEach((btn) => btn.addEventListener('click', () => {
      activeQaStatus = btn.dataset.qaStatus;
      $$('[data-qa-status]').forEach((b) => b.classList.toggle('active', b === btn));
      renderQAList();
    }));
    $('#qaSubjectFilter')?.addEventListener('change', (e) => {
      activeQaSubject = e.target.value;
      renderQAList();
    });
    $('#qaSearchInput')?.addEventListener('input', renderQAList);
    $('#openAskQaBtn')?.addEventListener('click', () => openModal('askQaModal'));
    $('#askQaForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const subjId = $('#qaNewSubject').value;
      const c = getCourses().find((x) => x.id === subjId);
      const q = {
        id: `qa-${Date.now()}`,
        subjectId: subjId,
        subject: c?.name || 'General',
        title: $('#qaNewTitle').value.trim(),
        body: $('#qaNewBody').value.trim(),
        author: current?.name || 'Student',
        authorGroup: isAdmin() ? 'Leader' : (current?.group || 'Group 221'),
        createdAt: 'Just now',
        pinned: false,
        answers: []
      };
      if (!q.title) return;
      saveQA([q, ...getQA()]);
      HubSync.push('qa_ask', { question: q });
      $('#askQaForm').reset();
      closeModal('askQaModal');
      playSoftPing();
      renderQAList();
      notify('Question posted to Student Q&A!');
    });
    renderQAList();
  }

  function seminarsTemplate() {
    const adminUser = isAdmin();
    return `<section class="page-view">
      ${headingHtml(
        'Clinical & Video Tracks',
        'Seminars',
        adminUser
          ? 'Upload and manage specialist medical video lectures and lab demonstrations.'
          : 'Watch specialist medical video lectures and lab demonstrations published by your administrator.',
        `<a class="btn btn-secondary" href="materials.html">${icon('database')} Study Database</a>`
      )}
      <div class="seminar-grid" id="seminarGrid"></div>
      ${adminUser ? `
      <section class="panel" style="margin-top:18px">
        <div class="panel-head">
          <div><span class="eyebrow">Admin Video Publisher</span><h2>Upload Video to Track</h2><p>Stored safely in your database for student playback.</p></div>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label for="seminarSelect">Target Seminar Track</label>
            <select class="select" id="seminarSelect">${seminarTopics.map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select>
          </div>
          <label class="drop-zone" for="seminarVideoFiles" style="padding:16px">
            ${icon('video')}
            <strong style="display:block;color:var(--ink);font-size:.76rem">Select Video File (MP4 / WebM / MOV)</strong>
            <input class="file-input" id="seminarVideoFiles" type="file" multiple accept="video/*">
          </label>
        </div>
      </section>
      ` : ''}
    </section>`;
  }

  function chatTemplate() {
    const adminUser = isAdmin();
    const classmates = accounts.filter((a) => a.username !== current.username);
    const recipients = classmates.map((a) => `<option value="${esc(a.username)}">${esc(a.name)} (${esc(a.group)})</option>`).join('');

    return `<section class="page-view">
      ${headingHtml(
        adminUser ? 'Group Channels & Leader Oversight' : 'Group 221 Network',
        'Student Chat',
        'Public Group A & B chat, dedicated subgroup rooms, private messaging, and live @mentions.'
      )}
      <section class="panel chat-layout">
        <aside class="chat-rooms">
          <div class="nav-label" style="padding:0 8px 8px">Channels</div>
          <div class="chat-room-list" id="chatRoomList">
            <button class="room-button active" data-room="public_ab"><span class="room-dot" style="background:var(--green)"></span>Public · Group A &amp; B</button>
            <button class="room-button" data-room="group221a"><span class="room-dot"></span>Group 221 · A</button>
            <button class="room-button" data-room="group221b"><span class="room-dot"></span>Group 221 · B</button>
            <button class="room-button" data-room="private"><span class="room-dot" style="background:var(--accent)"></span>Private Chat (1-to-1)</button>
            <button class="room-button" data-room="polls"><span class="room-dot" style="background:var(--yellow)"></span>Group Polls</button>
          </div>

          <div id="privatePicker" style="display:none;margin-top:14px">
            <label style="font-size:.66rem;color:var(--muted);display:block;margin-bottom:6px;font-weight:700">Select Classmate</label>
            <select class="select" id="privateRecipient">${recipients || '<option value="maya">Maya Hassan</option>'}</select>
          </div>

          ${adminUser ? `
          <div style="margin-top:20px;padding-top:14px;border-top:1px solid var(--line)">
            <div class="nav-label" style="padding:0 4px 8px;color:var(--accent-ink)">Leader Oversight · Private</div>
            <div id="adminAuditList"></div>
          </div>
          ` : ''}
        </aside>

        <div class="chat-main">
          <div class="chat-head">
            <div><strong id="chatTitle">Public · Group A &amp; B</strong><small class="muted" id="chatSubtitle">All Group 221 students · Type @ to mention someone or @all</small></div>
            <span class="pill success" id="chatStatusBadge">● Online</span>
          </div>
          <div class="chat-messages" id="chatMessages"></div>
          <div class="polls-board" id="chatPollsBoard" style="display:none"></div>

          <div class="mention-popup" id="mentionPopup"></div>
          <div class="chat-reply-bar" id="chatReplyBar">
            <div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              <strong id="replyPreviewAuthor" style="color:var(--accent-ink)"></strong>: <span id="replyPreviewText" class="muted"></span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="cancelReplyBtn">${icon('close')}</button>
          </div>

          <form class="chat-form" id="chatForm">
            <button type="button" class="btn btn-secondary btn-icon" id="quickMentionBtn" title="Mention @all or member" style="flex:none;font-weight:800;font-size:.85rem">@</button>
            <input class="input" id="chatInput" placeholder="Message... type @all or @name to mention" autocomplete="off" required style="border-radius:999px">
            <button class="btn btn-primary" type="submit">Send ${icon('arrow')}</button>
          </form>
        </div>
      </section>

      <div class="modal-backdrop" id="createPollModal">
        <div class="modal-box">
          <div class="modal-head">
            <div><span class="eyebrow">Group 221 Vote</span><h2>Create Quick Poll</h2><p>Let classmates vote on study times, revision topics, or group plans.</p></div>
            <button class="btn btn-icon btn-ghost" data-close-modal="createPollModal">${icon('close')}</button>
          </div>
          <form id="createPollForm" class="form-grid" style="margin-top:14px">
            <div class="form-field full"><label>Poll Question</label><input class="input" id="pollQuestionInput" required placeholder="e.g. Best time for Anatomy revision session?"></div>
            <div class="form-field"><label>Option 1</label><input class="input" id="pollOpt1" required placeholder="Option A"></div>
            <div class="form-field"><label>Option 2</label><input class="input" id="pollOpt2" required placeholder="Option B"></div>
            <div class="form-field"><label>Option 3 (Optional)</label><input class="input" id="pollOpt3" placeholder="Option C"></div>
            <div class="form-field"><label>Option 4 (Optional)</label><input class="input" id="pollOpt4" placeholder="Option D"></div>
            <div class="modal-actions full" style="margin-top:6px">
              <button type="button" class="btn btn-secondary" data-close-modal="createPollModal">Cancel</button>
              <button type="submit" class="btn btn-primary">${icon('check')} Publish Poll</button>
            </div>
          </form>
        </div>
      </div>
    </section>`;
  }

  function profileTemplate() {
    const coverUrl = current?.coverImage || WIDE_BANNER_PRESETS[0].url;
    const coverStyle = `style="background-image:url('${esc(coverUrl)}')"`;
    const mats = getPublishedMaterials();
    const adminUser = isAdmin();
    const flairList = adminUser ? LEADER_FLAIR_OPTIONS : STUDENT_FLAIR_OPTIONS;
    const curFlair = getUserFlair(current);
    const curStatus = USER_STATUS_OPTIONS.find((s) => s.id === (current?.status || 'online')) || USER_STATUS_OPTIONS[0];
    const ringStyle = current?.ringColor ? `style="border-color:${esc(current.ringColor)}"` : '';

    return `<section class="page-view">
      ${headingHtml(
        'Academic Identity',
        'My Profile',
        'Personalize your profile photo, wide banner, name icon, live status, and study checklist.',
        `<label class="btn btn-secondary btn-sm" style="cursor:pointer">${icon('image')} Upload Banner<input class="file-input" id="profileCoverInput" type="file" accept="image/*"></label>
         <a class="btn btn-primary btn-sm" href="settings.html">${icon('settings')} Settings</a>`
      )}

      <section class="profile-cover" ${coverStyle}>
        <div class="profile-identity">
          <label for="profileAvatarInput" style="cursor:pointer;position:relative">
            <span class="profile-avatar" ${ringStyle}>
              ${current?.avatarImage ? `<img src="${esc(current.avatarImage)}" alt="Avatar">` : esc(current?.avatar || 'ST')}
              <span class="avatar-edit" title="Change photo">${icon('edit')}</span>
            </span>
            <input class="file-input" id="profileAvatarInput" type="file" accept="image/*">
          </label>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
              <span class="pill success">${icon('check')} ${adminUser ? 'Group 221 Leader' : 'Human Medicine · Year 2'}</span>
              <span class="pill"><span class="status-dot-live ${esc(curStatus.cls)}"></span>${esc(curStatus.label)}</span>
            </div>
            <h1>${esc(current?.name || 'Student')} ${flairHtml(current, true)}</h1>
            <p>${esc(current?.group || 'Group 221 A')} · ID: ${esc(current?.studentId || 'MED-221')}${current?.bio ? ` · ${esc(current.bio)}` : ''}</p>
          </div>
        </div>
      </section>

      <div class="profile-stats">
        <div class="profile-stat"><strong>12</strong><span>Medical Subjects</span></div>
        <div class="profile-stat"><strong>${mats.length}</strong><span>Library Files</span></div>
        <div class="profile-stat"><strong>Week ${ScheduleSync.getWeekDates(0).academicWeek}</strong><span>Synced Schedule</span></div>
        <div class="profile-stat"><strong>${adminUser ? 'Leader' : 'Student'}</strong><span>Role</span></div>
      </div>

      <div class="profile-grid">
        <section class="panel">
          <div class="panel-head"><div><h2>Personal Details</h2><p>Edit your display name, group, status, avatar ring, and bio.</p></div></div>
          <form id="profileForm" class="form-grid">
            <div class="form-field"><label>Display Name</label><input class="input" id="profileName" required value="${esc(current?.name || '')}"></div>
            <div class="form-field"><label>Study Group</label><input class="input" id="profileGroup" value="${esc(current?.group || 'Group 221 A')}"></div>
            <div class="form-field">
              <label>Live Status</label>
              <select class="select" id="profileStatus">
                ${USER_STATUS_OPTIONS.map((s) => `<option value="${s.id}" ${(current?.status || 'online') === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field"><label>Student ID</label><input class="input" id="profileStudentId" value="${esc(current?.studentId || '')}"></div>
            <div class="form-field"><label>Email</label><input class="input" id="profileEmail" type="email" value="${esc(current?.email || '')}" placeholder="name@example.com"></div>
            <div class="form-field"><label>New Password (Optional)</label><input class="input" id="profileNewPassword" type="password" placeholder="Leave blank to keep current"></div>
            <div class="form-field full"><label>Bio</label><textarea class="textarea" id="profileBio" style="min-height:76px">${esc(current?.bio || '')}</textarea></div>
            <div class="full" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:8px">
                <label style="font-size:.72rem;font-weight:700;color:var(--muted)">Avatar Ring</label>
                <input type="color" id="profileRingColor" value="${esc(current?.ringColor || '#3b82f6')}" style="width:34px;height:34px;border:0;background:transparent;cursor:pointer">
              </div>
              <button class="btn btn-primary" type="submit">${icon('check')} Save Profile</button>
            </div>
          </form>
        </section>

        <div style="display:grid;gap:18px">
          <section class="panel">
            <div class="panel-head"><div><h2>Name Icon &amp; Wide Banner</h2><p>Choose an icon displayed next to your name across Chat &amp; Q&amp;A, plus a wide cover banner.</p></div></div>

            <div class="form-field">
              <label>${adminUser ? 'Leader Icon (Shown next to your name)' : 'Profile Icon (Shown next to your name)'}</label>
              <div class="flair-picker-grid">
                ${flairList.map((emoji) => `
                  <button type="button" class="flair-choice-btn ${curFlair === emoji ? 'selected' : ''}" data-flair-pick="${esc(emoji)}">${esc(emoji)}</button>
                `).join('')}
              </div>
            </div>

            <div class="form-field" style="margin-top:16px">
              <label>Wide Cover Banner</label>
              <div class="banner-presets-grid">
                ${WIDE_BANNER_PRESETS.map((b) => `
                  <button type="button" class="banner-preset-btn ${coverUrl === b.url ? 'selected' : ''}" data-banner-pick="${esc(b.url)}" style="background-image:url('${esc(b.url)}')">
                    <span>${esc(b.name)}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><div><h2>Personal Study Checklist</h2><p>Quick lightweight daily goals</p></div></div>
            <div id="profileGoalsList" style="display:grid;gap:8px;margin-bottom:10px"></div>
            <form id="addGoalForm" style="display:flex;gap:8px">
              <input class="input" id="newGoalInput" placeholder="Add a study task..." style="border-radius:999px;height:38px;font-size:.74rem" required>
              <button type="submit" class="btn btn-primary btn-sm">${icon('plus')} Add</button>
            </form>
          </section>
        </div>
      </div>
    </section>`;
  }

  function settingsTemplate() {
    const p = getPrefs();
    const courses = getCourses();
    const activeFontObj = fontCatalog.find((f) => f.id === p.font) || fontCatalog[0];
    const adminUser = isAdmin();

    return `<section class="page-view">
      ${headingHtml(
        'Personalization',
        'Settings',
        'Customize themes, card transparency, accent colors, typography, AI copilot settings, and database backups.'
      )}

      <div class="settings-layout">
        <nav class="settings-nav panel" id="settingsNavList" style="padding:12px">
          <button class="active" data-settings-tab="glass">${icon('spark')} Appearance & Glass</button>
          <button data-settings-tab="typography">${icon('edit')} Typography & Layout</button>
          <button data-settings-tab="media">${icon('image')} Photos${adminUser ? ' & Subject Covers' : ''}</button>
          <button data-settings-tab="schedule">${icon('calendar')} Schedule Sync</button>
          ${adminUser ? `<button data-settings-tab="database">${icon('database')} AI & Database</button>` : ''}
        </nav>

        <div>
          <section class="panel settings-section active" data-settings-section="glass">
            <div class="panel-head"><div><h2>Appearance, Glass Opacity & Colors</h2><p>Every theme and color preset is contrast-calibrated for crisp readability.</p></div></div>

            <div class="form-field">
              <label>Theme Palette</label>
              <div class="theme-grid-cards">
                ${themeCatalog.map((t) => `
                  <button type="button" class="theme-card-btn ${p.theme === t.id ? 'selected' : ''}" data-theme-pick="${t.id}">
                    <span class="theme-swatch-preview" style="background:${t.swatch}"></span>
                    <strong style="font-size:.78rem">${esc(t.name)}</strong>
                    <small class="muted" style="font-size:.63rem">${esc(t.desc)}</small>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="setting-row" style="margin-top:16px">
              <div><strong>Accent Highlight Color</strong><p>Automatically adjusts button & lens contrast.</p></div>
              <div class="accent-swatches">
                ${accentPresets.map((a) => `
                  <button type="button" class="accent-dot ${p.accent === a.c1 ? 'selected' : ''}" data-accent-c1="${a.c1}" data-accent-c2="${a.c2}" style="background:${a.c1}" title="${a.name}"></button>
                `).join('')}
                <input type="color" id="customAccentInput" value="${esc(p.accent || '#2563eb')}" title="Pick Custom Color" style="width:34px;height:34px;border:0;background:transparent;cursor:pointer">
              </div>
            </div>

            <div class="setting-row">
              <div><strong>Card Opacity (Transparency Control)</strong><p>Adjust panel frosting opacity (${Math.round((p.glassAlpha ?? 0.85) * 100)}%).</p></div>
              <div class="range-row" style="width:220px">
                <input type="range" id="glassAlphaRange" min="0.45" max="0.98" step="0.03" value="${p.glassAlpha ?? 0.85}">
                <span class="range-value" id="glassAlphaVal">${Math.round((p.glassAlpha ?? 0.85) * 100)}%</span>
              </div>
            </div>

            <div class="setting-row">
              <div><strong>Backdrop Blur Strength</strong><p>Adjust frosted glass blur (${p.glassBlur ?? 18}px).</p></div>
              <div class="range-row" style="width:220px">
                <input type="range" id="glassBlurRange" min="0" max="36" step="2" value="${p.glassBlur ?? 18}">
                <span class="range-value" id="glassBlurVal">${p.glassBlur ?? 18}px</span>
              </div>
            </div>

            <div class="form-field" style="margin-top:16px">
              <label>Background Wallpaper</label>
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                <select class="select" id="wallpaperPresetSelect" style="max-width:270px">
                  ${wallpaperPresets.map((w) => `<option value="${esc(w.url)}" ${p.wallpaper === w.url ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}
                </select>
                <label class="btn btn-secondary btn-sm" style="cursor:pointer">
                  ${icon('image')} Upload Custom Wallpaper
                  <input class="file-input" id="customWallpaperInput" type="file" accept="image/*">
                </label>
                ${p.wallpaper ? `<button type="button" class="btn btn-danger btn-sm" id="clearWallpaperBtn">Remove Wallpaper</button>` : ''}
              </div>
            </div>
          </section>

          <section class="panel settings-section" data-settings-section="typography">
            <div class="panel-head"><div><h2>Typography & Layout</h2><p>Preview and switch the site font family, text scale, and corner roundness.</p></div></div>

            <div class="setting-row" style="padding-top:0;margin-bottom:14px">
              <div>
                <strong>${isAr() ? 'لغة الواجهة (العربية / الإنجليزية)' : 'Interface Language (Arabic / English)'}</strong>
                <p>${isAr() ? 'تبديل كامل للواجهة واتجاه الصفحة (RTL / LTR) والخطوط العربية.' : 'Switch full UI language, RTL layout direction, and Arabic font tuning.'}</p>
              </div>
              <div class="glide-chip-group" id="langSettingsGroup">
                <button type="button" class="filter-chip ${!isAr() ? 'active' : ''}" data-lang-pick="en">English</button>
                <button type="button" class="filter-chip ${isAr() ? 'active' : ''}" data-lang-pick="ar">العربية</button>
              </div>
            </div>

            <div class="font-preview-banner" id="fontPreviewBanner" title="Click to expand preview">
              <div>
                <span class="eyebrow">Active Font Preview</span>
                <h3 id="fontBannerTitle">${esc(activeFontObj.name)} — ${esc(activeFontObj.sample)}</h3>
                <p id="fontBannerDesc">Clean, balanced medical typography engineered for effortless lecture reading and rapid schedule scanning.</p>
              </div>
              <span class="pill blue" id="fontBannerPill">${esc(activeFontObj.label)}</span>
            </div>

            <div class="form-field">
              <label>Choose Font Family</label>
              <div class="font-grid-cards">
                ${fontCatalog.map((f) => `
                  <button type="button" class="font-card-btn ${p.font === f.id ? 'selected' : ''}" data-font-pick="${f.id}" style="font-family:${f.family}">
                    <strong>${esc(f.name)}</strong>
                    <div style="font-size:.76rem;color:var(--accent-ink);margin-bottom:3px">${esc(f.sample)}</div>
                    <small>${esc(f.label)}</small>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="setting-row" style="margin-top:16px">
              <div><strong>Interface Text & UI Scale</strong><p>Zoom controls and typography (${Math.round((p.scale || 1) * 100)}%).</p></div>
              <div class="range-row" style="width:220px">
                <input type="range" id="uiScaleRange" min="0.88" max="1.15" step="0.02" value="${p.scale || 1}">
                <span class="range-value" id="uiScaleVal">${Math.round((p.scale || 1) * 100)}%</span>
              </div>
            </div>

            <div class="setting-row">
              <div><strong>Card Corner Roundness</strong><p>Adjust corner curvature (${p.radius ?? 22}px).</p></div>
              <div class="range-row" style="width:220px">
                <input type="range" id="radiusRange" min="10" max="32" step="2" value="${p.radius ?? 22}">
                <span class="range-value" id="radiusVal">${p.radius ?? 22}px</span>
              </div>
            </div>

            <div class="setting-row">
              <div><strong>Workspace Width</strong><p>Maximum container width on desktop monitors.</p></div>
              <select class="select" id="contentWidthSelect" style="width:190px">
                <option value="1200" ${p.contentWidth === 1200 ? 'selected' : ''}>Compact (1200px)</option>
                <option value="1460" ${!p.contentWidth || p.contentWidth === 1460 ? 'selected' : ''}>Standard (1460px)</option>
                <option value="1760" ${p.contentWidth === 1760 ? 'selected' : ''}>Wide (1760px)</option>
              </select>
            </div>

            <div class="setting-row">
              <div><strong>Glass Lens &amp; Spring Motion</strong><p>Enable translucent sliding lens animations and optical zoom.</p></div>
              <button class="toggle ${p.motion !== false ? 'on' : ''}" id="toggleMotion"></button>
            </div>

            <div class="setting-row">
              <div><strong>Compact Layout Density</strong><p>Tighter card spacing to display more classes and files on screen.</p></div>
              <button class="toggle ${p.density === 'compact' ? 'on' : ''}" id="toggleDensity"></button>
            </div>

            <div class="setting-row">
              <div><strong>Soft Chat &amp; Reply Sounds</strong><p>Subtle audio cue when sending messages or posting answers.</p></div>
              <button class="toggle ${p.soundEffects !== false ? 'on' : ''}" id="toggleSounds"></button>
            </div>

            <div class="setting-row" style="border-bottom:0">
              <div><strong>Reset Appearance</strong><p>Restore default iPhone glass blur, opacity, and colors.</p></div>
              <button type="button" class="btn btn-secondary btn-sm" id="resetAppearanceBtn">${icon('refresh')} Reset Defaults</button>
            </div>
          </section>

          <section class="panel settings-section" data-settings-section="media">
            <div class="panel-head"><div><h2>Profile Photos${adminUser ? ' & Subject Covers' : ''}</h2><p>Personalize your profile picture and banner.</p></div></div>

            <div class="grid grid-2">
              <div class="panel" style="padding:16px">
                <strong>Profile Avatar</strong>
                <p class="muted" style="font-size:.68rem;margin:4px 0 12px">Shown in top bar, sidebar, chat, and profile.</p>
                <div style="display:flex;align-items:center;gap:12px">
                  ${avatarMarkup(current)}
                  <label class="btn btn-secondary btn-sm" style="cursor:pointer">${icon('image')} Upload Avatar<input class="file-input" id="settingsAvatarInput" type="file" accept="image/*"></label>
                </div>
              </div>

              <div class="panel" style="padding:16px">
                <strong>Profile Cover Photo</strong>
                <p class="muted" style="font-size:.68rem;margin:4px 0 12px">Banner displayed at the top of My Profile.</p>
                <label class="btn btn-secondary btn-sm" style="cursor:pointer">${icon('image')} Upload Cover<input class="file-input" id="settingsCoverInput" type="file" accept="image/*"></label>
              </div>
            </div>

            ${adminUser ? `
            <div style="margin-top:18px">
              <strong style="display:block;margin-bottom:10px;font-size:.82rem">Admin: Customize Subject Cover Photography</strong>
              <div class="grid grid-3">
                ${courses.map((c) => `
                  <div class="panel" style="padding:12px">
                    <img src="${esc(c.image)}" onerror="this.onerror=null;this.src='${esc(c.fallback)}'" alt="${esc(c.name)}" style="width:100%;height:78px;object-fit:cover;border-radius:11px;margin-bottom:8px">
                    <strong style="display:block;font-size:.74rem;margin-bottom:6px">${esc(c.name)}</strong>
                    <div style="display:flex;gap:6px">
                      <label class="btn btn-secondary btn-sm" style="flex:1;cursor:pointer">Change<input class="file-input" data-subject-cover-input="${c.id}" type="file" accept="image/*"></label>
                      <button type="button" class="btn btn-ghost btn-sm" data-subject-cover-reset="${c.id}">Reset</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </section>

          <section class="panel settings-section" data-settings-section="schedule">
            <div class="panel-head"><div><h2>Automatic Schedule Synchronization</h2><p>Configure real-time date sync, week parity calibration, and group filtering.</p></div></div>

            <div class="setting-row">
              <div><strong>Current Synced Week</strong><p>Today (${new Date().toLocaleDateString('en-GB')}) is automatically mapped to <b>Academic Week ${ScheduleSync.getWeekDates(0).academicWeek}</b>.</p></div>
              <span class="pill success">● Auto-Synced</span>
            </div>

            ${adminUser ? `
            <div class="setting-row">
              <div><strong>Flip Week 1 / Week 2 Parity</strong><p>Toggle if your university shifts alternating weeks.</p></div>
              <button class="toggle ${p.weekParityFlip ? 'on' : ''}" id="toggleWeekParity"></button>
            </div>
            ` : ''}

            <div class="setting-row">
              <div><strong>Default Group Filter</strong><p>Filter Group 221 A vs Group 221 B labs automatically.</p></div>
              <select class="select" id="defaultGroupSelect" style="width:190px">
                <option value="all" ${p.groupFilter === 'all' ? 'selected' : ''}>All Group 221</option>
                <option value="a" ${p.groupFilter === 'a' ? 'selected' : ''}>Group 221 A</option>
                <option value="b" ${p.groupFilter === 'b' ? 'selected' : ''}>Group 221 B</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-primary" id="settingsExportIcsBtn">${icon('download')} Export Synced Week to Phone/Google Calendar (.ics)</button>
            </div>
          </section>

          ${adminUser ? `
          <section class="panel settings-section" data-settings-section="database">
            <div class="panel-head"><div><h2>Supabase Cloud &amp; AI Copilot</h2><p>Check live Supabase connection, push any local files to cloud, and manage backups.</p></div></div>

            <div class="info-row"><span>Supabase Cloud Status</span><strong id="settingsCloudStatus" style="color:var(--accent-ink)">${cloudConnected ? '● Connected (Live)' : 'Checking...'}</strong></div>
            <div class="info-row"><span>Total Study Files</span><strong id="settingsDbCount">...</strong></div>
            <div class="info-row"><span>Local IndexedDB Size</span><strong id="settingsDbSize">...</strong></div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
              <button type="button" class="btn btn-primary btn-sm" id="testSupabaseBtn">${icon('refresh')} Test Supabase Cloud</button>
              <button type="button" class="btn btn-secondary btn-sm" id="syncLocalToCloudBtn">${icon('upload')} Push Local Files to Cloud</button>
            </div>

            <div class="form-field" style="margin-top:16px">
              <label for="settingsTgBotInput">Telegram Login Bot Username (GitHub Pages Ready)</label>
              <div style="display:flex;gap:8px">
                <input class="input" id="settingsTgBotInput" value="${esc(getSiteConfig().telegramBotUsername || '')}" placeholder="e.g. Dr221LoginBot (without @)">
                <button type="button" class="btn btn-secondary" id="saveTgBotBtn">Save</button>
              </div>
            </div>

            <div class="form-field" style="margin-top:14px">
              <label for="settingsAiKeyInput">Optional Gemini / OpenAI API Key</label>
              <div style="display:flex;gap:8px">
                <input class="input" id="settingsAiKeyInput" type="password" value="${esc(p.aiApiKey || '')}" placeholder="Built-in Medical AI is active by default">
                <button type="button" class="btn btn-secondary" id="saveAiKeyBtn">Save</button>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" id="settingsBackupBtn">${icon('download')} Export Full Backup (.json)</button>
              <label class="btn btn-primary" style="cursor:pointer">${icon('upload')} Restore Backup (.json)<input class="file-input" id="settingsRestoreInput" type="file" accept=".json"></label>
            </div>
          </section>
          ` : ''}
        </div>
      </div>
    </section>`;
  }

  function adminTemplate() {
    if (!isAdmin()) {
      return `<section class="page-view">
        ${headingHtml('Restricted Area', 'Admin Console', 'Only the platform administrator can access this console.', '<a class="btn btn-primary" href="login.html">Switch Account</a>')}
        <section class="panel"><div class="empty">${icon('lock')} You are currently signed in as a student (read-only mode).</div></section>
      </section>`;
    }

    const site = getSiteConfig();
    const rooms = getRooms();
    const privateKeys = Object.keys(rooms).filter((k) => k.startsWith('private:'));

    return `<section class="page-view">
      ${headingHtml('Administrator Control Center', 'Admin Console', `Signed in as ${esc(current.name)} (${esc(current.username)}) — Full platform control active.`)}

      <div class="grid grid-4" style="margin-bottom:18px">
        <div class="stat-card"><div class="stat-top"><span>Registered Users</span><span class="stat-icon">${icon('user')}</span></div><strong>${accounts.length}</strong><small>Active student & admin profiles</small></div>
        <div class="stat-card"><div class="stat-top"><span>Private Threads</span><span class="stat-icon">${icon('message')}</span></div><strong>${privateKeys.length}</strong><small><a href="chat.html" style="color:var(--accent-ink)">Monitor in Chat →</a></small></div>
        <div class="stat-card"><div class="stat-top"><span>Database Files</span><span class="stat-icon">${icon('database')}</span></div><strong>${getAllMaterials().length}</strong><small><a href="materials.html" style="color:var(--accent-ink)">Manage Files →</a></small></div>
        <div class="stat-card"><div class="stat-top"><span>Active Week</span><span class="stat-icon">${icon('calendar')}</span></div><strong>Week ${ScheduleSync.getWeekDates(0).academicWeek}</strong><small><a href="schedule.html" style="color:var(--accent-ink)">Edit Classes →</a></small></div>
      </div>

      <div class="grid grid-2" style="margin-bottom:18px">
        <!-- Urgent Broadcast Banner Control -->
        <section class="panel">
          <div class="panel-head"><div><span class="eyebrow">Live Broadcast</span><h2>Urgent Alert Banner</h2><p>Instantly appears at the top of every page for all Group 221 students.</p></div></div>
          <form id="adminAlertForm" class="form-grid">
            <div class="form-field">
              <label>Alert Title</label>
              <input class="input" id="adminAlertTitle" value="${esc(getBroadcastAlert()?.title || 'Urgent Update')}" placeholder="e.g. Room Change">
            </div>
            <div class="form-field">
              <label>Alert Type</label>
              <select class="select" id="adminAlertLevel">
                <option value="urgent">Urgent (Red)</option>
                <option value="warning" selected>Notice (Amber)</option>
                <option value="info">Info (Blue)</option>
                <option value="success">Good News (Green)</option>
              </select>
            </div>
            <div class="form-field full">
              <label>Broadcast Message</label>
              <input class="input" id="adminAlertMsg" value="${esc(getBroadcastAlert()?.message || '')}" placeholder="e.g. Biochemistry lab moved to Building 13 Room 204 today!" required>
            </div>
            <div class="full" style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" type="submit">${icon('megaphone')} Publish Live Banner</button>
              <button class="btn btn-danger" type="button" id="adminClearAlertBtn">Clear Active Banner</button>
            </div>
          </form>
        </section>

        <!-- Site Branding -->
        <section class="panel">
          <div class="panel-head"><div><span class="eyebrow">Platform Identity</span><h2>Site Branding & Quick Links</h2><p>Update title and tagline or jump to protected tools.</p></div></div>
          <form id="adminSiteForm" class="form-grid">
            <div class="form-field"><label>Platform Name</label><input class="input" id="adminSiteName" value="${esc(site.name)}"></div>
            <div class="form-field"><label>Tagline</label><input class="input" id="adminSiteTagline" value="${esc(site.tagline)}"></div>
            <div class="full" style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" type="submit">${icon('check')} Save Branding</button>
              <a class="btn btn-secondary" href="chat.html">${icon('eye')} Private Chats (${privateKeys.length})</a>
              <a class="btn btn-secondary" href="schedule.html">${icon('calendar')} Timetable</a>
            </div>
          </form>
        </section>
      </div>

      <div class="grid grid-2">
        <!-- Pending Student File Submissions -->
        <section class="panel">
          <div class="panel-head"><div><span class="eyebrow">Student Contributions</span><h2>Pending File Submissions</h2><p>Review files sent by students — approve to publish directly into the subject folder.</p></div></div>
          <div id="adminPendingFilesList" style="display:grid;gap:10px"></div>
        </section>

        <!-- Student File Requests -->
        <section class="panel">
          <div class="panel-head"><div><span class="eyebrow">Missing Materials</span><h2>Student File Requests</h2><p>Files requested by classmates in Study Database.</p></div></div>
          <div id="adminRequestsList" style="display:grid;gap:10px"></div>
        </section>
      </div>
    </section>`;
  }

  function pageTemplate() {
    const map = {
      dashboard: dashboardTemplate,
      schedule: scheduleTemplate,
      courses: coursesTemplate,
      materials: materialsTemplate,
      qa: qaTemplate,
      seminars: seminarsTemplate,
      chat: chatTemplate,
      profile: profileTemplate,
      settings: settingsTemplate,
      admin: adminTemplate
    };
    return (map[page] || dashboardTemplate)();
  }

  // ==========================================================================
  // Page Renderers & Event Binders
  // ==========================================================================

  function renderDailyRecaps() {
    const el = $('#dashboardRecapList');
    if (!el) return;
    const recaps = getRecaps();
    const adminUser = isAdmin();
    if (!recaps.length) {
      el.innerHTML = '<div class="empty" style="min-height:95px">No daily recaps posted yet.</div>';
      return;
    }
    el.innerHTML = recaps.slice(0, 4).map((r) => `
      <article class="recap-item">
        <div class="recap-top">
          <div class="recap-tags">
            <span class="pill blue">${esc(r.subject)}</span>
            <span class="pill">${esc(r.group || 'All Group 221')}</span>
            <span class="muted" style="font-size:.66rem">${esc(r.date || 'Today')}</span>
          </div>
          ${adminUser ? `<button type="button" class="btn btn-ghost btn-sm" data-del-recap="${esc(r.id)}" title="Delete recap">${icon('close')}</button>` : ''}
        </div>
        <p class="recap-body">${esc(r.covered)}</p>
        ${(r.nextPrep || r.quizNote) ? `
          <div class="recap-footer-pills">
            ${r.nextPrep ? `<span class="recap-note-chip">${icon('book')} Next: ${esc(r.nextPrep)}</span>` : ''}
            ${r.quizNote ? `<span class="recap-note-chip quiz">${icon('megaphone')} ${esc(r.quizNote)}</span>` : ''}
          </div>
        ` : ''}
      </article>
    `).join('');

    if (adminUser) {
      $$('[data-del-recap]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.delRecap;
        saveRecaps(getRecaps().filter((x) => x.id !== id));
        HubSync.push('recap_delete', { id });
        renderDailyRecaps();
        notify('Daily recap removed.');
      }));
    }
  }

  function renderDashboard() {
    const listEl = $('#dashboardScheduleList');
    if (!listEl) return;
    const weekInfo = ScheduleSync.getWeekDates(0);
    const today = ScheduleSync.todayName();
    const entries = schedule[weekInfo.academicWeek]?.[today] || [];
    listEl.innerHTML = entries.length
      ? entries.map((e) => `
          <a class="schedule-row" href="schedule.html">
            <time>${esc(e[0])}</time>
            <i></i>
            <div>
              <strong>${esc(e[1])}</strong>
              <span>${esc(e[2])} · Dr. ${esc(teacherFor(e[1], e[3]))}</span>
            </div>
            <em>${esc(e[3] || `${today} · ${weekInfo.days[today]}`)}</em>
          </a>
        `).join('')
      : `<div class="empty">No classes scheduled for ${today}. Enjoy your study block!</div>`;

    const recentEl = $('#dashboardRecentFiles');
    const allMats = getPublishedMaterials();
    if ($('#ovShortcutFiles')) $('#ovShortcutFiles').textContent = `${allMats.length} files`;
    if ($('#ovHeroDbBtn')) $('#ovHeroDbBtn').innerHTML = `${icon('database')} ${isAr() ? `قاعدة الملفات (${allMats.length})` : `Database (${allMats.length})`}`;
    if (recentEl) {
      const recent = allMats.slice(0, 5);
      recentEl.innerHTML = recent.length
        ? recent.map((m) => {
            const isImg = isImageMaterial(m);
            const pdfAttr = (!isImg && isPdfMaterial(m)) ? ` data-pdf-thumb="${esc(m.id)}"` : '';
            return `
              <div class="ov-recent-file-row" data-ov-open="${esc(m.id)}">
                <div class="ov-recent-thumb"${pdfAttr}>
                  ${isImg && m.url ? `<img src="${esc(m.url)}" alt="">` : icon('file')}
                </div>
                <div style="min-width:0;flex:1">
                  <strong style="display:block;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}</strong>
                  <span style="display:block;font-size:.66rem;color:var(--muted)">${esc(m.subject)} · ${esc(m.type)} · ${esc(m.size)}</span>
                </div>
                <span class="pill ${m.storageMode === 'supabase' ? 'success' : 'amber'}" style="font-size:.6rem">${m.storageMode === 'supabase' ? '☁' : 'Local'}</span>
              </div>
            `;
          }).join('')
        : `<div class="empty">No files uploaded yet.</div>`;

      $$('[data-ov-open]', recentEl).forEach((row) => row.addEventListener('click', () => openMaterialPreview(row.dataset.ovOpen)));
      hydrateLocalThumbnails(recentEl);
    }
    renderDailyRecaps();

    if (!$('#recapForm')?.dataset.bound) {
      if ($('#recapForm')) $('#recapForm').dataset.bound = '1';
      $('#openRecapModalBtn')?.addEventListener('click', () => openModal('recapModal'));
      $('#recapForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin()) return;
        const subjId = $('#recapSubject').value;
        const c = getCourses().find((x) => x.id === subjId);
        const recap = {
          id: `recap-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          subjectId: subjId,
          subject: c?.name || 'General',
          group: $('#recapGroup').value,
          covered: $('#recapCovered').value.trim(),
          nextPrep: $('#recapPrep').value.trim(),
          quizNote: $('#recapQuiz').value.trim(),
          addedBy: current?.name || 'Administrator'
        };
        if (!recap.covered) return;
        saveRecaps([recap, ...getRecaps()]);
        HubSync.push('recap_add', { recap });
        $('#recapForm').reset();
        closeModal('recapModal');
        renderDailyRecaps();
        notify('Daily recap published to all students!');
      });
    }
  }

  function renderSchedule() {
    if (!$('#scheduleBoard')) return;
    const info = ScheduleSync.getWeekDates(weekOffset);
    const live = ScheduleSync.getLiveStatus();
    const now = new Date();
    const groupFilter = getPrefs().groupFilter || 'all';

    $$('[data-week-offset]').forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.weekOffset) === weekOffset);
    });
    setupHorizontalGlide($('#weekTabsGroup'), '[data-week-offset]');

    const weekBadge = weekOffset === 0 ? 'Current Week (Live)' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `${weekOffset > 0 ? `+${weekOffset}` : weekOffset} Weeks`;
    $('#scheduleTitle').textContent = fullWeekView
      ? (isAr() ? `الأسبوع ${info.academicWeek} بالكامل · ${info.rangeLabel}` : `Full Week ${info.academicWeek} · ${info.rangeLabel}`)
      : (isAr() ? `${trDay(selectedDay)}، ${info.days[selectedDay]} · الأسبوع الدراسي ${info.academicWeek}` : `${selectedDay}, ${info.days[selectedDay]} · Academic Week ${info.academicWeek}`);
    $('#scheduleNote').textContent = isAr()
      ? `${info.rangeLabel} · يتبدّل تلقائياً بين الأسبوع 1 والأسبوع 2 كل يوم إثنين.`
      : `${weekBadge} · ${info.rangeLabel} · Automatically alternating Week 1 / Week 2 every Monday.`;
    $('#fullWeekButton').classList.toggle('btn-primary', fullWeekView);
    $('#fullWeekButton').classList.toggle('btn-secondary', !fullWeekView);

    $('#dayStrip').innerHTML = dayNames.map((day) => {
      const isToday = ScheduleSync.isSameDate(info.fullDates[day], now);
      return `
        <button type="button" class="day-tab ${day === selectedDay && !fullWeekView ? 'active' : ''}" data-day="${day}">
          ${isToday ? `<span class="day-today-tag">${isAr() ? 'اليوم' : 'TODAY'}</span>` : ''}
          <span>${trDayShort(day)}</span>
          <strong>${info.days[day].split(' ')[0]}</strong>
          <em>${info.days[day].split(' ')[1]}</em>
        </button>
      `;
    }).join('');

    const filterEntries = (list) => (list || []).filter((e) => {
      const note = (e[3] || '').toLowerCase();
      if (groupFilter === 'a' && note.includes('221 b')) return false;
      if (groupFilter === 'b' && note.includes('221 a')) return false;
      return true;
    });

    const renderCard = (entry, dayName) => {
      const isLiveCard = live.state === 'live' && weekOffset === 0 && live.day === dayName && live.entry?.[0] === entry[0] && live.entry?.[1] === entry[1];
      return `
        <article class="schedule-card ${isLiveCard ? 'is-live' : ''}">
          <time>${esc(entry[0])}</time>
          <span class="event-bar"></span>
          <div>
            <strong>${esc(entry[1])} ${isLiveCard ? '<span class="pill success" style="margin-left:6px">● LIVE NOW</span>' : ''}</strong>
            <div class="event-meta">
              <span>${icon('location')} ${esc(entry[2])}</span>
              <span>${icon('user')} ${esc(teacherFor(entry[1], entry[3]))}</span>
            </div>
            ${entry[3] ? `<div class="event-note">${esc(entry[3])}</div>` : ''}
          </div>
          <span class="teacher">${isAr() ? `الأسبوع ${info.academicWeek}` : `Week ${info.academicWeek}`}</span>
        </article>
      `;
    };

    const board = $('#scheduleBoard');
    if (fullWeekView) {
      board.innerHTML = dayNames.map((day) => {
        const items = filterEntries(schedule[info.academicWeek]?.[day]);
        return `
          <div class="schedule-full-label">${trDay(day)} · ${info.days[day]} ${ScheduleSync.isSameDate(info.fullDates[day], now) ? (isAr() ? '(اليوم)' : '(Today)') : ''}</div>
          ${items.length ? items.map((e) => renderCard(e, day)).join('') : '<div class="empty" style="min-height:74px">No classes for selected group.</div>'}
        `;
      }).join('');
    } else {
      const items = filterEntries(schedule[info.academicWeek]?.[selectedDay]);
      board.innerHTML = items.length
        ? items.map((e) => renderCard(e, selectedDay)).join('')
        : `<div class="empty">No classes scheduled on ${selectedDay} (${info.days[selectedDay]}) for this group filter.</div>`;
    }

    $$('.day-tab').forEach((btn) => btn.addEventListener('click', () => {
      selectedDay = btn.dataset.day;
      fullWeekView = false;
      renderSchedule();
    }));
  }

  function bindSchedule() {
    if (!$('#scheduleBoard')) return;
    const updateGroupGlide = setupHorizontalGlide($('#groupFilterTabs'), '[data-group-filter]');

    $$('[data-week-offset]').forEach((btn) => btn.addEventListener('click', () => {
      weekOffset = Number(btn.dataset.weekOffset);
      renderSchedule();
    }));
    $('#prevWeekBtn')?.addEventListener('click', () => { weekOffset -= 1; renderSchedule(); });
    $('#nextWeekBtn')?.addEventListener('click', () => { weekOffset += 1; renderSchedule(); });
    $('#jumpTodayBtn')?.addEventListener('click', () => {
      weekOffset = 0;
      selectedDay = ScheduleSync.todayName();
      fullWeekView = false;
      renderSchedule();
      notify('Jumped to today\'s live schedule!');
    });
    $('#shareScheduleBtn')?.addEventListener('click', shareTodayScheduleText);
    $('#exportIcsBtn')?.addEventListener('click', () => ScheduleSync.exportICS(weekOffset));
    $('#fullWeekButton')?.addEventListener('click', () => { fullWeekView = !fullWeekView; renderSchedule(); });

    $$('[data-group-filter]').forEach((btn) => btn.addEventListener('click', () => {
      updatePreferences({ groupFilter: btn.dataset.groupFilter });
      $$('[data-group-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      updateGroupGlide(true);
      renderSchedule();
    }));

    if (!isAdmin()) {
      renderSchedule();
      return;
    }

    const renderModalRows = () => {
      const w = Number($('#modalEditWeek').value);
      const d = $('#modalEditDay').value;
      const rows = schedule[w]?.[d] || [];
      $('#modalScheduleRows').innerHTML = rows.map((r, idx) => `
        <div class="panel" style="padding:12px;display:grid;grid-template-columns:110px 1fr 1fr 130px 36px;gap:8px;align-items:center" data-edit-row="${idx}">
          <input class="input" data-f="time" value="${esc(r[0])}" placeholder="8:30 AM">
          <input class="input" data-f="subj" value="${esc(r[1])}" placeholder="Subject">
          <input class="input" data-f="loc" value="${esc(r[2])}" placeholder="Building / Room">
          <input class="input" data-f="note" value="${esc(r[3])}" placeholder="Group note">
          <button type="button" class="btn btn-danger btn-icon" data-del-row="${idx}">${icon('close')}</button>
        </div>
      `).join('');
      $$('[data-del-row]').forEach((b) => b.addEventListener('click', () => {
        schedule[w][d].splice(Number(b.dataset.delRow), 1);
        renderModalRows();
      }));
    };

    $('#editScheduleModalBtn')?.addEventListener('click', () => {
      $('#modalEditWeek').value = String(ScheduleSync.getWeekDates(weekOffset).academicWeek);
      $('#modalEditDay').value = selectedDay;
      syncCustomSelectDisplay($('#modalEditWeek'));
      syncCustomSelectDisplay($('#modalEditDay'));
      renderModalRows();
      openModal('scheduleEditModal');
    });
    $('#modalEditWeek')?.addEventListener('change', renderModalRows);
    $('#modalEditDay')?.addEventListener('change', renderModalRows);
    $('#modalAddClassBtn')?.addEventListener('click', () => {
      const w = Number($('#modalEditWeek').value);
      const d = $('#modalEditDay').value;
      schedule[w][d].push(['8:30 AM', 'New Class', 'Building 1', '']);
      renderModalRows();
    });
    $('#modalSaveClassBtn')?.addEventListener('click', () => {
      const w = Number($('#modalEditWeek').value);
      const d = $('#modalEditDay').value;
      schedule[w][d] = $$('[data-edit-row]').map((row) => [
        row.querySelector('[data-f="time"]').value.trim(),
        row.querySelector('[data-f="subj"]').value.trim(),
        row.querySelector('[data-f="loc"]').value.trim(),
        row.querySelector('[data-f="note"]').value.trim()
      ]).filter((arr) => arr[0] && arr[1]);
      write(SCHEDULE_KEY, schedule);
      HubSync.push('schedule_save', { schedule });
      closeModal('scheduleEditModal');
      renderSchedule();
      notify('Timetable updated across all future synced weeks!');
    });

    $('#editTeachersButton')?.addEventListener('click', () => {
      const teachers = getTeachers();
      $('#teacherFields').innerHTML = teacherSubjects.map((s) => {
        const entry = teachers[s] || { a: '', b: '' };
        return `
          <div class="form-field full" style="padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface-2)">
            <label style="color:var(--ink);margin-bottom:4px">${esc(s)}</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input class="input" data-t-subj="${esc(s)}" data-t-grp="a" value="${esc(entry.a || '')}" placeholder="Group 221 A Doctor">
              <input class="input" data-t-subj="${esc(s)}" data-t-grp="b" value="${esc(entry.b || '')}" placeholder="Group 221 B Doctor">
            </div>
          </div>
        `;
      }).join('');
      openModal('teacherModal');
    });
    $('#teacherForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const next = { ...getTeachers() };
      teacherSubjects.forEach((s) => {
        const aInp = $(`[data-t-subj="${s}"][data-t-grp="a"]`);
        const bInp = $(`[data-t-subj="${s}"][data-t-grp="b"]`);
        if (aInp || bInp) {
          const aVal = aInp ? aInp.value.trim() : '';
          const bVal = bInp ? bInp.value.trim() : '';
          next[s] = { a: aVal || bVal, b: bVal || aVal };
        }
      });
      saveTeachers(next);
      HubSync.push('teachers_save', { teachers: next });
      closeModal('teacherModal');
      renderSchedule();
      notify('Doctor names saved for Group 221 A & B!');
    });

    renderSchedule();
  }

  function renderCourses(query = '') {
    const grid = $('#courseGrid');
    if (!grid) return;
    const filter = $('.filter-chip.active')?.dataset.courseFilter || 'all';
    const term = query.trim().toLowerCase();
    const allMats = getPublishedMaterials();
    const qaCount = getQA().length;
    const pendingCount = getPendingMaterials().length + getFileRequests().filter((r) => r.status === 'open').length;
    const visible = getCourses().filter((c) => {
      const matchTerm = !term || `${c.name} ${c.desc}`.toLowerCase().includes(term);
      const matchFilter = filter === 'all' || (filter === 'active' && c.progress > 20) || (filter === 'semester2' && c.semester.includes('2'));
      return matchTerm && matchFilter;
    });

    grid.innerHTML = visible.length ? visible.map((c) => {
      const fileCount = allMats.filter((m) => m.subjectId === c.id).length;
      return `
        <article class="course-card">
          <div class="course-card-top">
            <div class="course-art"><img src="${esc(c.image)}" onerror="this.onerror=null;this.src='${esc(c.fallback)}'" alt="${esc(c.name)}" loading="lazy"></div>
            <span class="course-icon">${icon(c.icon)}</span>
            <span class="pill blue">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
          </div>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.desc)}</p>
          <div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:.7rem;color:var(--accent-ink);font-weight:700">
            ${icon('user')} <span>${esc(teacherFor(c.name, '', 'all'))}</span>
          </div>
          <div class="progress-line"><span>${esc(c.semester)}</span><strong>${c.progress}%</strong></div>
          <div class="progress-track"><span style="width:${c.progress}%"></span></div>
          <div class="card-footer">
            <small>${esc(c.short)} · Year 2</small>
            <a class="btn btn-primary btn-sm" href="materials.html?subject=${c.id}">${icon('folder')} Open Files</a>
          </div>
        </article>
      `;
    }).join('') : '<div class="empty" style="grid-column:1/-1">No subject matches your search.</div>';
  }

  function bindCourses() {
    if (!$('#courseGrid')) return;
    const updateCourseGlide = setupHorizontalGlide($('#courseFilterTabs'), '[data-course-filter]');
    const q = new URLSearchParams(window.location.search).get('q') || '';
    $('#courseSearch').value = q;
    $('#courseSearch').addEventListener('input', (e) => renderCourses(e.target.value));
    $$('[data-course-filter]').forEach((btn) => btn.addEventListener('click', () => {
      $$('[data-course-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      updateCourseGlide(true);
      renderCourses($('#courseSearch').value);
    }));
    renderCourses(q);
  }

  let activeMaterialSubject = 'all';

  async function renderMaterials() {
    if (!$('#materialLibraryRoot')) return;
    const courses = getCourses();
    const all = getPublishedMaterials();
    const searchTerm = ($('#materialSearchInput')?.value || '').trim().toLowerCase();
    const foldersEl = $('#subjectFolders');
    const folderViewEl = $('#materialFolderView');
    const backBtn = $('#backToFolders');

    const stats = await Dr221DB.getStats();
    const cloudCountNow = remoteMaterials.length;
    if ($('#dbStorageMeter')) {
      $('#dbStorageMeter').textContent = cloudCountNow > 0
        ? `${cloudCountNow} Cloud · ${stats.count} Local (${stats.totalLabel})`
        : `${stats.count} files (${stats.totalLabel})`;
    }
    if ($('#dbStatusBadge')) {
      $('#dbStatusBadge').textContent = cloudConnected ? (isAr() ? 'متصل بـ Supabase سحابياً · مباشر' : 'Supabase Cloud Connected · Live') : (isAr() ? 'قاعدة البيانات المحلية جاهزة' : 'Study Database Ready');
    }

    if (searchTerm) {
      foldersEl.style.display = 'none';
      folderViewEl.style.display = 'block';
      backBtn.style.display = 'inline-flex';
      const filtered = all.filter((m) => `${m.name} ${m.subject} ${m.category || ''} ${m.description || ''}`.toLowerCase().includes(searchTerm));
      $('#materialViewTitle').textContent = `Search: "${searchTerm}"`;
      $('#materialCount').textContent = `${filtered.length} matching file(s)`;
      $('#materialFolderTitle').textContent = 'Search Results';
      $('#materialFolderSubtitle').textContent = 'Across all 12 subjects';
      renderMaterialRows(filtered);
      return;
    }

    if (activeMaterialSubject === 'all') {
      foldersEl.style.display = 'grid';
      folderViewEl.style.display = 'none';
      backBtn.style.display = 'none';
      $('#materialViewTitle').textContent = 'All 12 Subject Folders';
      $('#materialCount').textContent = `${all.length} total file${all.length === 1 ? '' : 's'} stored across Anatomy, Histology & all courses`;
      foldersEl.innerHTML = courses.map((c) => {
        const count = all.filter((m) => m.subjectId === c.id).length;
        return `
          <button type="button" class="subject-folder" data-open-subject="${c.id}">
            <span class="folder-art"><img src="${esc(c.image)}" onerror="this.onerror=null;this.src='${esc(c.fallback)}'" alt="${esc(c.name)}"></span>
            <span class="folder-copy">
              <strong>${esc(c.name)}</strong>
              <small>${esc(c.semester)}</small>
            </span>
            <span class="folder-count">${count}<small>files</small></span>
            <span class="folder-arrow">${icon('chevron')}</span>
          </button>
        `;
      }).join('');

      $$('[data-open-subject]').forEach((btn) => btn.addEventListener('click', () => {
        activeMaterialSubject = btn.dataset.openSubject;
        if ($('#uploadSubject')) {
          $('#uploadSubject').value = activeMaterialSubject;
          syncCustomSelectDisplay($('#uploadSubject'));
        }
        renderMaterials();
      }));
      return;
    }

    const course = courses.find((c) => c.id === activeMaterialSubject) || courses[0];
    const items = all.filter((m) => m.subjectId === course.id);
    if ($('#uploadSubject')) {
      $('#uploadSubject').value = course.id;
      syncCustomSelectDisplay($('#uploadSubject'));
    }
    foldersEl.style.display = 'none';
    folderViewEl.style.display = 'block';
    backBtn.style.display = 'inline-flex';
    $('#materialViewTitle').textContent = course.name;
    $('#materialCount').textContent = `${items.length} file${items.length === 1 ? '' : 's'} in ${course.name}`;
    $('#materialFolderIcon').innerHTML = `<img src="${esc(course.image)}" onerror="this.onerror=null;this.src='${esc(course.fallback)}'" alt="${esc(course.name)}">`;
    $('#materialFolderTitle').textContent = course.name;
    $('#materialFolderSubtitle').textContent = `${course.semester} · ${items.length} file(s)`;
    renderMaterialRows(items);
  }

  let matViewMode = 'grid';

  function isImageMaterial(m) {
    const mime = String(m.mimeType || '').toLowerCase();
    const ext = String(m.type || '').toLowerCase();
    const nameExt = String(m.name || '').split('.').pop().toLowerCase();
    const urlPath = String(m.url || '').split('?')[0].toLowerCase();
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic'];
    return mime.startsWith('image/') || imgExts.includes(ext) || imgExts.includes(nameExt) || imgExts.some((e) => urlPath.endsWith(`.${e}`));
  }

  function fileExtVisual(m) {
    const ext = String(m.type || '').toLowerCase();
    const mime = String(m.mimeType || '').toLowerCase();
    if (ext === 'pdf' || mime.includes('pdf')) return { cls: 'ext-pdf', ic: 'book' };
    if (['ppt', 'pptx'].includes(ext)) return { cls: 'ext-ppt', ic: 'layers' };
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) return { cls: 'ext-vid', ic: 'video' };
    if (['zip', 'rar', '7z'].includes(ext)) return { cls: 'ext-zip', ic: 'folder' };
    return { cls: 'ext-doc', ic: 'file' };
  }

  // Automatic PDF First-Page Cover Thumbnail Engine (Cached in IndexedDB for 0ms repeat load)
  const PdfThumbEngine = {
    dbName: 'dr221_pdf_thumbs_v1',
    storeName: 'thumbs',
    memCache: new Map(),
    libPromise: null,
    queue: [],
    activeCount: 0,
    maxConcurrent: 2,

    openDB() {
      return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) return reject(new Error('No IDB'));
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    async getCached(id) {
      if (this.memCache.has(id)) return this.memCache.get(id);
      try {
        const db = await this.openDB();
        const dataUrl = await new Promise((resolve) => {
          const tx = db.transaction(this.storeName, 'readonly');
          const req = tx.objectStore(this.storeName).get(id);
          req.onsuccess = () => { db.close(); resolve(req.result?.dataUrl || null); };
          req.onerror = () => { db.close(); resolve(null); };
        });
        if (dataUrl) this.memCache.set(id, dataUrl);
        return dataUrl;
      } catch (_) {
        return null;
      }
    },

    async setCached(id, dataUrl) {
      this.memCache.set(id, dataUrl);
      try {
        const db = await this.openDB();
        await new Promise((resolve) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          tx.objectStore(this.storeName).put({ id, dataUrl, ts: Date.now() });
          tx.oncomplete = () => { db.close(); resolve(true); };
          tx.onerror = () => { db.close(); resolve(false); };
        });
      } catch (_) {}
    },

    loadPdfJs() {
      if (window.pdfjsLib) {
        if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        return Promise.resolve(window.pdfjsLib);
      }
      if (this.libPromise) return this.libPromise;
      this.libPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.async = true;
        s.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('pdfjsLib unavailable'));
          }
        };
        s.onerror = () => {
          this.libPromise = null;
          reject(new Error('Failed to load pdf.js'));
        };
        document.head.appendChild(s);
      });
      return this.libPromise;
    },

    async renderFirstPage(item) {
      const pdfjs = await this.loadPdfJs();
      let source = null;
      if (item.url && /^https?:\/\//i.test(item.url)) {
        source = { url: item.url, withCredentials: false };
      } else {
        const blob = await Dr221DB.getBlob(item.id);
        if (!blob) return null;
        source = { data: await blob.arrayBuffer() };
      }
      const loadingTask = pdfjs.getDocument(source);
      const pdf = await loadingTask.promise;
      const pageObj = await pdf.getPage(1);
      const baseVp = pageObj.getViewport({ scale: 1 });
      const targetWidth = 340;
      const scale = Math.min(1.5, Math.max(0.25, targetWidth / (baseVp.width || 600)));
      const viewport = pageObj.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pageObj.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
      try { await pdf.destroy(); } catch (_) {}
      return dataUrl;
    },

    applyThumbToElements(id, dataUrl) {
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/["\\]/g, '\\$&');
      $$(`[data-pdf-thumb="${safeId}"]`).forEach((host) => {
        if (!host || host.dataset.thumbDone === '1') return;
        host.dataset.thumbDone = '1';
        let img = $('img.pdf-thumb-img', host);
        if (!img) {
          img = document.createElement('img');
          img.className = 'pdf-thumb-img';
          img.alt = '';
          host.insertBefore(img, host.firstChild);
        }
        img.onload = () => {
          img.classList.add('loaded');
          const fallback = $('.file-ext-cover, svg', host);
          if (fallback && (host.classList.contains('ov-recent-thumb') || host.classList.contains('material-icon'))) {
            fallback.style.display = 'none';
          }
        };
        img.src = dataUrl;
      });
    },

    enqueue(item) {
      if (!item || !item.id) return;
      if (this.memCache.has(item.id)) {
        this.applyThumbToElements(item.id, this.memCache.get(item.id));
        return;
      }
      this.getCached(item.id).then((cached) => {
        if (cached) {
          this.applyThumbToElements(item.id, cached);
          return;
        }
        if (this.queue.some((q) => q.id === item.id)) return;
        this.queue.push(item);
        this.pump();
      });
    },

    pump() {
      while (this.activeCount < this.maxConcurrent && this.queue.length) {
        const item = this.queue.shift();
        this.activeCount++;
        this.renderFirstPage(item)
          .then((dataUrl) => {
            if (dataUrl) {
              this.setCached(item.id, dataUrl);
              this.applyThumbToElements(item.id, dataUrl);
            }
          })
          .catch(() => {})
          .finally(() => {
            this.activeCount--;
            this.pump();
          });
      }
    }
  };

  function isPdfMaterial(m) {
    const ext = String(m?.type || '').toUpperCase();
    const mime = String(m?.mimeType || '').toLowerCase();
    const name = String(m?.name || '').toLowerCase();
    return ext === 'PDF' || mime.includes('pdf') || name.endsWith('.pdf');
  }

  async function hydrateLocalThumbnails(root = document) {
    const imgs = $$('img[data-blob-thumb]', root);
    for (const img of imgs) {
      const id = img.dataset.blobThumb;
      if (!id || img.dataset.loaded === '1') continue;
      img.dataset.loaded = '1';
      try {
        const blob = await Dr221DB.getBlob(id);
        if (blob) img.src = URL.createObjectURL(blob);
      } catch (_) {}
    }

    const pdfHosts = $$('[data-pdf-thumb]', root);
    if (pdfHosts.length) {
      const all = getAllMaterials();
      const seen = new Set();
      pdfHosts.forEach((host) => {
        const id = host.dataset.pdfThumb;
        if (!id || seen.has(id)) return;
        seen.add(id);
        const item = all.find((x) => x.id === id);
        if (item) PdfThumbEngine.enqueue(item);
      });
    }
  }

  function renderMaterialRows(items) {
    const listEl = $('#materialList');
    const adminUser = isAdmin();
    if (!items.length) {
      listEl.className = '';
      listEl.innerHTML = `<div class="empty">
        ${icon('folder')}
        <strong>No files published here yet</strong>
        <span>${adminUser ? 'Use the upload panel on the right to add PDFs, slides, or images.' : 'Your administrator has not uploaded files to this folder yet.'}</span>
      </div>`;
      return;
    }

    if (matViewMode === 'grid') {
      listEl.className = 'material-grid-view';
      listEl.innerHTML = items.map((m) => {
        const isImg = isImageMaterial(m);
        const vis = fileExtVisual(m);
        const thumbSrc = m.thumbUrl || (isImg ? m.url : '');
        const thumbInner = thumbSrc
          ? `<img src="${esc(thumbSrc)}" alt="${esc(m.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="file-ext-cover ${vis.cls}" style="display:none">${icon(vis.ic)}<span class="file-ext-badge">${esc(m.type || 'FILE')}</span></div>`
          : (isImg
              ? `<img data-blob-thumb="${esc(m.id)}" alt="${esc(m.name)}">`
              : `<div class="file-ext-cover ${vis.cls}">${icon(vis.ic)}<span class="file-ext-badge">${esc(m.type || 'FILE')}</span></div>`);

        const pdfAttr = (!thumbSrc && !isImg && isPdfMaterial(m)) ? ` data-pdf-thumb="${esc(m.id)}"` : '';
        return `
          <article class="material-file-card">
            <div class="material-thumb" data-mat-preview="${esc(m.id)}"${pdfAttr}>
              ${thumbInner}
              <span class="thumb-cat-pill">${esc(m.category || 'Lecture')}</span>
            </div>
            <div class="material-card-body">
              <strong title="${esc(m.name)}">${esc(m.name)}</strong>
              <div class="material-card-meta">
                <span>${esc(m.type)} · ${esc(m.size)}</span>
                <span style="color:${m.storageMode === 'supabase' ? 'var(--green)' : 'var(--yellow)'};font-weight:700">${m.storageMode === 'supabase' ? '☁ Cloud' : '⚠ Local Only'}</span>
              </div>
              <div class="material-card-actions">
                <button type="button" class="btn btn-primary btn-sm" data-mat-preview="${esc(m.id)}">${icon('eye')} Open</button>
                <button type="button" class="btn btn-secondary btn-sm" data-mat-share="${esc(m.id)}" title="Copy Link">${icon('share')}</button>
                ${adminUser ? `<button type="button" class="btn btn-secondary btn-sm" data-mat-rename="${esc(m.id)}" title="Rename">${icon('edit')}</button>` : ''}
                ${(adminUser || m.storageMode === 'local') ? `<button type="button" class="btn btn-danger btn-sm" data-mat-delete="${esc(m.id)}" title="Delete">${icon('close')}</button>` : ''}
              </div>
            </div>
          </article>
        `;
      }).join('');
      hydrateLocalThumbnails(listEl);
    } else {
      listEl.className = 'material-list';
      listEl.innerHTML = items.map((m) => {
        const isImg = isImageMaterial(m);
        const pdfAttr = (!isImg && isPdfMaterial(m)) ? ` data-pdf-thumb="${esc(m.id)}"` : '';
        return `
          <div class="material-row">
            <span class="material-icon" style="overflow:hidden;padding:0;position:relative"${pdfAttr}>
              ${isImg && m.url ? `<img src="${esc(m.url)}" style="width:100%;height:100%;object-fit:cover" alt="">` : icon('file')}
            </span>
            <div style="min-width:0;flex:1">
              <strong>${esc(m.name)}</strong>
              <span>${esc(m.subject)} · ${esc(m.category || 'Lecture')} · ${esc(m.type)} · ${esc(m.size)}${m.description ? ` · ${esc(m.description)}` : ''}</span>
            </div>
            <div class="material-action">
              <button type="button" class="btn btn-primary btn-sm" data-mat-preview="${esc(m.id)}">${icon('eye')} Open</button>
              <button type="button" class="btn btn-secondary btn-sm" data-mat-share="${esc(m.id)}" title="Copy Direct Share Link">${icon('share')}</button>
              ${adminUser ? `<button type="button" class="btn btn-secondary btn-sm" data-mat-rename="${esc(m.id)}" title="Rename">${icon('edit')}</button>` : ''}
              ${(adminUser || m.storageMode === 'local') ? `<button type="button" class="btn btn-danger btn-sm" data-mat-delete="${esc(m.id)}" title="Delete">${icon('close')}</button>` : ''}
            </div>
          </div>
        `;
      }).join('');
      hydrateLocalThumbnails(listEl);
    }

    $$('[data-mat-preview]', listEl).forEach((b) => b.addEventListener('click', () => openMaterialPreview(b.dataset.matPreview)));
    $$('[data-mat-share]', listEl).forEach((b) => b.addEventListener('click', () => {
      const item = getAllMaterials().find((x) => x.id === b.dataset.matShare);
      if (item) shareMaterialLink(item);
    }));
    if (adminUser) {
      $$('[data-mat-rename]', listEl).forEach((b) => b.addEventListener('click', async () => {
        const id = b.dataset.matRename;
        const item = getAllMaterials().find((x) => x.id === id);
        if (!item) return;
        const next = prompt(isAr() ? 'اكتب اسم الملف الجديد:' : 'Enter new file name:', item.name);
        if (next && next.trim()) {
          await renameMaterialItem(id, next.trim());
          renderMaterials();
        }
      }));
    }
    $$('[data-mat-delete]', listEl).forEach((b) => b.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = b.dataset.matDelete;
      if (!confirm(isAr() ? 'هل تريد حذف هذا الملف نهائياً؟' : 'Delete this file permanently?')) return;
      await deleteMaterialItem(id);
      renderMaterials();
    }));
  }

  function bindMaterials() {
    if (!$('#materialLibraryRoot')) return;
    const paramSubj = new URLSearchParams(window.location.search).get('subject');
    if (paramSubj && getCourses().some((c) => c.id === paramSubj)) {
      activeMaterialSubject = paramSubj;
    }

    $('#backToFolders')?.addEventListener('click', () => {
      activeMaterialSubject = 'all';
      if ($('#materialSearchInput')) $('#materialSearchInput').value = '';
      renderMaterials();
    });

    $('#materialSearchInput')?.addEventListener('input', () => renderMaterials());
    $('#refreshCloudFilesBtn')?.addEventListener('click', async () => {
      const ok = await syncRemoteMaterials();
      notify(ok
        ? (isAr() ? `تم تحديث السحابة (${remoteMaterials.length} ملف)` : `Cloud synced (${remoteMaterials.length} file(s))`)
        : (isAr() ? `تعذر الاتصال بالسحابة: ${SupaCloud.lastError}` : `Cloud error: ${SupaCloud.lastError}`));
    });
    $('#matTestCloudBtn')?.addEventListener('click', async () => {
      setUploadDiag('Testing Supabase Database + Storage...', 'info');
      const r = await SupaCloud.testFullHealth();
      setUploadDiag(r.message, r.dbOk ? 'ok' : 'err');
      notify(r.message);
    });
    $('#matPushLocalBtn')?.addEventListener('click', async () => {
      setUploadDiag('Pushing local-only files to Supabase Cloud...', 'info');
      await syncLocalMaterialsToCloud();
    });
    $('#matClearLocalBtn')?.addEventListener('click', async () => {
      if (!confirm(isAr() ? 'مسح الملفات المحفوظة محلياً على هذا الجهاز فقط؟ (ملفات السحابة لن تتأثر)' : 'Clear local-only cached files on this device? (Cloud files will NOT be affected)')) return;
      await clearAllLocalMaterialCache();
    });
    $$('[data-mat-view]').forEach((btn) => btn.addEventListener('click', () => {
      matViewMode = btn.dataset.matView;
      $$('[data-mat-view]').forEach((b) => {
        b.classList.toggle('btn-secondary', b === btn);
        b.classList.toggle('btn-ghost', b !== btn);
      });
      renderMaterials();
    }));

    if (isAdmin()) {
      $('#quickUploadTrigger')?.addEventListener('click', () => $('#materialFiles')?.click());

      const handleFiles = async (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        const subj = $('#uploadSubject').value;
        const cat = $('#uploadCategory').value;
        const note = $('#uploadNote').value.trim();
        await uploadFilesToDatabase(files, subj, cat, note);
        $('#uploadNote').value = '';
        activeMaterialSubject = subj;
        renderMaterials();
      };

      $('#materialFiles')?.addEventListener('change', async (e) => {
        await handleFiles(e.target.files);
        e.target.value = '';
      });

      const dz = $('#materialDropZone');
      if (dz) {
        ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
        ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dragover'); }));
        dz.addEventListener('drop', (e) => handleFiles(e.dataTransfer?.files));
      }

      $('#exportDbBackupBtn')?.addEventListener('click', exportDatabaseBackup);
    }

    const renderOpenRequests = () => {
      const box = $('#studentOpenRequests');
      if (!box) return;
      const openReqs = getFileRequests().filter((r) => r.status === 'open').slice(0, 5);
      box.innerHTML = openReqs.length
        ? `<div class="nav-label" style="padding:4px 0 2px">Open Classmate Requests (${openReqs.length})</div>` +
          openReqs.map((r) => `<div class="request-row"><div><strong>${esc(r.title)}</strong><small>${esc(r.subject)} · by ${esc(r.requestedBy)}</small></div><span class="pill amber">Open</span></div>`).join('')
        : '';
    };

    $('#studentSubmitFiles')?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const subj = $('#studentSubmitSubject').value;
      const note = $('#studentSubmitNote').value.trim();
      await submitPendingFileToAdmin(files, subj, 'Student Contribution', note);
      $('#studentSubmitNote').value = '';
      e.target.value = '';
    });

    $('#fileRequestForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const subjId = $('#reqSubject').value;
      const c = getCourses().find((x) => x.id === subjId);
      const title = $('#reqTitle').value.trim();
      if (!title) return;
      const req = {
        id: `req-${Date.now()}`,
        subjectId: subjId,
        subject: c?.name || 'General',
        title,
        details: '',
        requestedBy: current?.name || 'Student',
        group: current?.group || 'Group 221 A',
        status: 'open',
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      };
      saveFileRequests([req, ...getFileRequests()]);
      HubSync.push('request_add', { request: req });
      $('#reqTitle').value = '';
      renderOpenRequests();
      notify('File request sent to Administrator!');
    });

    renderOpenRequests();
    syncRemoteMaterials().then(() => {
      const sharedFileId = new URLSearchParams(window.location.search).get('file');
      if (sharedFileId) openMaterialPreview(sharedFileId);
    });
    renderMaterials();
  }

  async function exportDatabaseBackup() {
    const payload = {
      version: 4,
      exportedAt: new Date().toISOString(),
      preferences: getPrefs(),
      schedule,
      teachers: getTeachers(),
      materialsMeta: getLocalMaterialMeta(),
      subjectCovers: read(SUBJECT_COVERS_KEY, {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dr221-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    notify('Database & Settings backup downloaded!');
  }

  function bindSeminars() {
    const grid = $('#seminarGrid');
    if (!grid) return;
    const adminUser = isAdmin();

    const render = () => {
      const vids = getSeminarVideos();
      grid.innerHTML = seminarTopics.map((t) => {
        const list = vids.filter((v) => v.seminarId === t.id);
        return `
          <article class="seminar-card">
            <div class="seminar-card-top">
              <span class="seminar-icon">${icon(t.icon)}</span>
              <span class="pill blue">${esc(t.subject)}</span>
            </div>
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.desc)}</p>
            <div class="seminar-video-list">
              ${list.length ? list.map((v) => `
                <div class="seminar-video-row">
                  <span class="material-icon" style="width:34px;height:34px">${icon('video')}</span>
                  <div><strong>${esc(v.name)}</strong><small>${esc(v.size)}${v.url ? ' · ☁ Cloud' : ''}</small></div>
                  <button type="button" class="btn btn-primary btn-sm" data-sem-play="${esc(v.id)}">Watch</button>
                  ${adminUser ? `<button type="button" class="btn btn-danger btn-sm" data-sem-del="${esc(v.id)}">${icon('close')}</button>` : ''}
                </div>
              `).join('') : '<div class="empty" style="min-height:86px;padding:12px">No videos published in this track yet.</div>'}
            </div>
          </article>
        `;
      }).join('');

      $$('[data-sem-play]', grid).forEach((b) => b.addEventListener('click', async () => {
        const v = getSeminarVideos().find((x) => x.id === b.dataset.semPlay);
        if (!v) return;
        let url = v.url || '';
        let revoke = false;
        if (!url) {
          const blob = await Dr221DB.getBlob(v.id);
          if (!blob) return notify('Video file not found.');
          url = URL.createObjectURL(blob);
          revoke = true;
        }
        $('#previewFileTitle').textContent = v.name;
        $('#previewFileMeta').textContent = `Seminar Video · ${v.size}`;
        $('#previewStage').innerHTML = `<video src="${url}" controls autoplay playsinline></video>`;
        $('#previewDownloadBtn').href = url;
        $('#previewDownloadBtn').download = v.name;
        $('#previewNewTabBtn').href = url;
        openModal('filePreviewModal', () => { if (revoke) URL.revokeObjectURL(url); });
      }));

      if (adminUser) {
        $$('[data-sem-del]', grid).forEach((b) => b.addEventListener('click', async () => {
          const id = b.dataset.semDel;
          const target = getSeminarVideos().find((x) => x.id === id);
          if (target?.storagePath) await SupaCloud.removeFile('materials', target.storagePath);
          saveSeminarVideos(getSeminarVideos().filter((x) => x.id !== id));
          await Dr221DB.deleteBlob(id);
          HubSync.push('seminars_save');
          render();
          notify('Seminar video removed.');
        }));
      }
    };

    window.__dr221RefreshSeminars = render;

    if (adminUser) {
      $('#seminarVideoFiles')?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        const seminarId = $('#seminarSelect').value;
        if (!files.length) return;
        notify(isAr() ? 'جاري رفع الفيديو إلى السحابة...' : 'Uploading seminar video to Supabase Cloud...');
        let cloudOk = 0;
        for (const f of files) {
          const id = `sem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const storagePath = safeStoragePath('seminars', id, f.name);
          const up = await SupaCloud.uploadFile('materials', storagePath, f);
          if (!up.error && up.publicUrl) {
            saveSeminarVideos([{ id, name: f.name, seminarId, size: formatBytes(f.size), url: up.publicUrl, storagePath }, ...getSeminarVideos()]);
            cloudOk++;
          } else {
            await Dr221DB.putBlob(id, f);
            saveSeminarVideos([{ id, name: f.name, seminarId, size: formatBytes(f.size) }, ...getSeminarVideos()]);
          }
        }
        e.target.value = '';
        await HubSync.push('seminars_save');
        render();
        notify(cloudOk > 0 ? 'Seminar video published to Supabase Cloud!' : 'Seminar video saved locally.');
      });
    }

    render();
  }

  // ==========================================================================
  // Student Chat (Group 221 A/B + Private 1-to-1 + Admin Oversight Monitor)
  // ==========================================================================
  function bindChat() {
    if (!$('#chatMessages')) return;
    let activeMode = 'public_ab';
    let recipient = accounts.find((a) => a.username !== current.username)?.username || 'maya';
    let auditThreadKey = '';
    let pendingReply = null;
    const adminUser = isAdmin();

    const updateRoomGlide = setupVerticalGlide($('#chatRoomList'), '[data-room]', 'room-glide-pill');

    const activeRoomKey = () => {
      if (activeMode === 'audit' && auditThreadKey) return auditThreadKey;
      if (activeMode !== 'private') return activeMode;
      const pair = [current.username.toLowerCase(), recipient.toLowerCase()].sort();
      return `private:${pair[0]}:${pair[1]}`;
    };

    const userDisplayName = (uname) => {
      const found = accounts.find((a) => a.username.toLowerCase() === String(uname).toLowerCase());
      return found ? found.name : uname;
    };

    const formatMessageText = (rawText) => {
      let safe = esc(rawText);
      safe = safe.replace(/@all\b/gi, '<span class="mention-tag mention-all">@all</span>');
      safe = safe.replace(/@([A-Za-z0-9_\u0600-\u06FF]+)/g, (match, handle) => {
        if (handle.toLowerCase() === 'all') return match;
        return `<span class="mention-tag">@${handle}</span>`;
      });
      return safe;
    };

    const isMentionForMe = (text) => {
      const t = String(text || '').toLowerCase();
      const firstName = String(current?.name || '').split(' ')[0].toLowerCase();
      return t.includes('@all') || (current?.username && t.includes(`@${current.username.toLowerCase()}`)) || (firstName && t.includes(`@${firstName}`));
    };

    const setReplyTarget = (msg) => {
      pendingReply = msg ? { author: msg.name, text: msg.text } : null;
      const bar = $('#chatReplyBar');
      if (!bar) return;
      if (pendingReply) {
        $('#replyPreviewAuthor').textContent = `Replying to ${pendingReply.author}`;
        $('#replyPreviewText').textContent = pendingReply.text.slice(0, 72);
        bar.classList.add('show');
        $('#chatInput')?.focus();
      } else {
        bar.classList.remove('show');
      }
    };

    $('#cancelReplyBtn')?.addEventListener('click', () => setReplyTarget(null));

    const mentionPopup = $('#mentionPopup');
    const chatInput = $('#chatInput');
    const closeMentionPopup = () => mentionPopup?.classList.remove('open');

    const openMentionPopup = (filter = '') => {
      if (!mentionPopup) return;
      const q = filter.toLowerCase();
      const list = [
        { handle: 'all', name: 'Everyone (@all)', sub: 'Mention all Group 221 A & B members', isAll: true },
        ...accounts.map((a) => ({
          handle: a.username,
          name: a.name,
          sub: isAdminHandle(a.username) ? 'Leader 👑' : (a.group || 'Group 221'),
          user: a
        }))
      ].filter((item) => !q || item.handle.toLowerCase().includes(q) || item.name.toLowerCase().includes(q));

      if (!list.length) {
        closeMentionPopup();
        return;
      }

      mentionPopup.innerHTML = list.map((item) => `
        <button type="button" class="mention-item" data-pick-mention="${esc(item.handle)}">
          ${item.isAll
            ? '<span class="tg-msg-avatar" style="background:linear-gradient(135deg,#f59e0b,#ea580c)">@</span>'
            : smallAvatarHtml(item.user?.username, item.name)}
          <div style="min-width:0">
            <strong>${esc(item.name)} ${item.user ? flairHtml(item.user, false) : ''}</strong>
            <small>@${esc(item.handle)} · ${esc(item.sub)}</small>
          </div>
        </button>
      `).join('');
      mentionPopup.classList.add('open');

      $$('[data-pick-mention]', mentionPopup).forEach((btn) => btn.addEventListener('click', () => {
        const handle = btn.dataset.pickMention;
        const val = chatInput.value;
        const replaced = val.replace(/@([A-Za-z0-9_\u0600-\u06FF]*)$/, `@${handle} `);
        chatInput.value = replaced === val ? `${val}${val && !val.endsWith(' ') ? ' ' : ''}@${handle} ` : replaced;
        closeMentionPopup();
        chatInput.focus();
      }));
    };

    chatInput?.addEventListener('input', () => {
      const m = chatInput.value.match(/(?:^|\s)@([A-Za-z0-9_\u0600-\u06FF]*)$/);
      if (m) openMentionPopup(m[1] || '');
      else closeMentionPopup();
    });

    $('#quickMentionBtn')?.addEventListener('click', () => {
      if (mentionPopup?.classList.contains('open')) {
        closeMentionPopup();
      } else {
        if (!/(?:^|\s)@$/.test(chatInput.value)) {
          chatInput.value = `${chatInput.value}${chatInput.value && !chatInput.value.endsWith(' ') ? ' ' : ''}@`;
        }
        openMentionPopup('');
        chatInput.focus();
      }
    });

    if (window.__dr221MentionDocClick) {
      document.removeEventListener('click', window.__dr221MentionDocClick);
    }
    window.__dr221MentionDocClick = (e) => {
      if (!e.target.closest('#mentionPopup') && !e.target.closest('#quickMentionBtn') && e.target !== chatInput) {
        closeMentionPopup();
      }
    };
    document.addEventListener('click', window.__dr221MentionDocClick);

    const renderAdminAuditList = () => {
      if (!adminUser || !$('#adminAuditList')) return;
      const rooms = getRooms();
      const privateKeys = Object.keys(rooms).filter((k) => k.startsWith('private:'));
      if (!privateKeys.length) {
        $('#adminAuditList').innerHTML = '<small class="muted">No private conversations yet.</small>';
        return;
      }
      $('#adminAuditList').innerHTML = privateKeys.map((k) => {
        const parts = k.split(':');
        const u1 = userDisplayName(parts[1] || 'Student 1');
        const u2 = userDisplayName(parts[2] || 'Student 2');
        const msgs = rooms[k] || [];
        const last = msgs[msgs.length - 1];
        return `
          <button type="button" class="audit-thread-btn ${activeMode === 'audit' && auditThreadKey === k ? 'active' : ''}" data-audit-key="${esc(k)}">
            <strong>${esc(u1)} ↔ ${esc(u2)}</strong>
            <small>${msgs.length} msg${msgs.length === 1 ? '' : 's'}${last ? ` · "${esc(last.text)}"` : ''}</small>
          </button>
        `;
      }).join('');

      $$('[data-audit-key]').forEach((btn) => btn.addEventListener('click', () => {
        activeMode = 'audit';
        auditThreadKey = btn.dataset.auditKey;
        render();
      }));
    };

    const render = () => {
      const rooms = getRooms();
      const key = activeRoomKey();

      const pollsBoard = $('#chatPollsBoard');
      const msgsBox = $('#chatMessages');
      const chatForm = $('#chatForm');

      if (activeMode === 'polls') {
        $('#chatTitle').textContent = 'Group 221 Quick Polls';
        $('#chatSubtitle').textContent = 'Vote live on revision times, sessions, and group decisions';
        $('#chatStatusBadge').className = 'pill amber';
        $('#chatStatusBadge').innerHTML = `<button type="button" class="btn btn-primary btn-sm" id="openCreatePollBtn" style="min-height:26px;padding:0 10px">${icon('plus')} New Poll</button>`;
        $('#privatePicker').style.display = 'none';
        msgsBox.style.display = 'none';
        chatForm.style.display = 'none';
        setReplyTarget(null);
        pollsBoard.style.display = 'grid';

        const polls = getPolls();
        pollsBoard.innerHTML = polls.length ? polls.map((p) => {
          const totalVotes = (p.options || []).reduce((acc, o) => acc + (o.voters || []).length, 0);
          return `
            <article class="poll-card">
              <div class="poll-card-head">
                <div>
                  <h4>${esc(p.question)}</h4>
                  <small class="muted">By ${esc(p.author)} · ${totalVotes} vote${totalVotes === 1 ? '' : 's'} ${p.closed ? '· Closed' : ''}</small>
                </div>
                ${adminUser ? `
                  <div style="display:flex;gap:5px">
                    <button type="button" class="btn btn-secondary btn-sm" data-poll-close="${esc(p.id)}">${p.closed ? 'Reopen' : 'Close'}</button>
                    <button type="button" class="btn btn-danger btn-sm" data-poll-del="${esc(p.id)}">${icon('close')}</button>
                  </div>
                ` : ''}
              </div>
              <div class="poll-options">
                ${(p.options || []).map((o) => {
                  const count = (o.voters || []).length;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  const voted = (o.voters || []).includes(current?.username);
                  return `
                    <button type="button" class="poll-opt-btn ${voted ? 'voted' : ''}" data-poll-vote="${esc(p.id)}::${esc(o.id)}" ${p.closed ? 'disabled' : ''}>
                      <div class="poll-opt-bar" style="width:${pct}%"></div>
                      <span>${voted ? '✓ ' : ''}${esc(o.text)}</span>
                      <span>${pct}% (${count})</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </article>
          `;
        }).join('') : '<div class="empty">No polls yet. Click "New Poll" above to create one!</div>';

        $('#openCreatePollBtn')?.addEventListener('click', () => openModal('createPollModal'));
        $$('[data-poll-vote]').forEach((b) => b.addEventListener('click', () => {
          const [pollId, optId] = b.dataset.pollVote.split('::');
          const listAll = getPolls();
          const poll = listAll.find((x) => x.id === pollId);
          if (!poll || poll.closed) return;
          const u = current?.username || 'student';
          poll.options.forEach((o) => {
            o.voters = (o.voters || []).filter((v) => v !== u);
            if (o.id === optId) o.voters.push(u);
          });
          savePolls(listAll);
          HubSync.push('poll_vote', { pollId, optionId: optId, username: u });
          render();
        }));
        if (adminUser) {
          $$('[data-poll-close]').forEach((b) => b.addEventListener('click', () => {
            const pollId = b.dataset.pollClose;
            const listAll = getPolls();
            const p = listAll.find((x) => x.id === pollId);
            if (!p) return;
            p.closed = !p.closed;
            savePolls(listAll);
            HubSync.push('poll_close', { pollId });
            render();
          }));
          $$('[data-poll-del]').forEach((b) => b.addEventListener('click', () => {
            const pollId = b.dataset.pollDel;
            savePolls(getPolls().filter((x) => x.id !== pollId));
            HubSync.push('poll_delete', { pollId });
            render();
          }));
        }
        $$('[data-room]').forEach((b) => b.classList.toggle('active', b.dataset.room === activeMode));
        updateRoomGlide(true);
        return;
      }

      pollsBoard.style.display = 'none';
      msgsBox.style.display = 'flex';
      chatForm.style.display = 'flex';

      if (activeMode === 'audit') {
        const parts = key.split(':');
        const u1 = userDisplayName(parts[1] || 'Student 1');
        const u2 = userDisplayName(parts[2] || 'Student 2');
        $('#chatTitle').textContent = `Private Monitor: ${u1} ↔ ${u2}`;
        $('#chatSubtitle').textContent = 'Leader Oversight View';
        $('#chatStatusBadge').className = 'pill amber';
        $('#chatStatusBadge').textContent = 'Leader Oversight';
        $('#privatePicker').style.display = 'none';
      } else if (activeMode === 'private') {
        const targetUser = accounts.find((a) => a.username === recipient);
        $('#chatTitle').textContent = `Private · ${targetUser ? targetUser.name : recipient}`;
        $('#chatSubtitle').textContent = `Direct 1-to-1 chat (${targetUser?.group || 'Student'})`;
        $('#chatStatusBadge').className = 'pill blue';
        $('#chatStatusBadge').textContent = 'Private';
        $('#privatePicker').style.display = 'block';
      } else {
        const titles = {
          public_ab: 'Public · Group A & B',
          group221a: 'Group 221 · A',
          group221b: 'Group 221 · B'
        };
        const subs = {
          public_ab: 'All Group 221 A & B students · Use @all or @name to mention',
          group221a: 'Subgroup 221 A channel · Use @ to mention',
          group221b: 'Subgroup 221 B channel · Use @ to mention'
        };
        $('#chatTitle').textContent = titles[activeMode] || 'Public · Group A & B';
        $('#chatSubtitle').textContent = subs[activeMode] || 'Active channel';
        $('#chatStatusBadge').className = 'pill success';
        $('#chatStatusBadge').textContent = '● Online';
        $('#privatePicker').style.display = 'none';
      }

      const msgs = rooms[key] || [];
      msgsBox.innerHTML = msgs.length
        ? msgs.map((m, idx) => {
            const mine = m.username.toLowerCase() === current.username.toLowerCase();
            const hit = !mine && isMentionForMe(m.text);
            return `
              <div class="tg-msg-row ${mine ? 'mine' : ''} ${hit ? 'mention-hit' : ''}">
                ${smallAvatarHtml(m.username, m.name)}
                <div class="tg-bubble">
                  <div class="tg-sender-line">
                    <span>${esc(m.name)}</span>
                    ${flairForUsername(m.username)}
                  </div>
                  ${m.replyTo ? `
                    <div class="tg-reply-quote">
                      <strong>${esc(m.replyTo.author)}</strong>
                      <span>${esc(m.replyTo.text)}</span>
                    </div>
                  ` : ''}
                  <p class="tg-msg-text" dir="auto">${formatMessageText(m.text)}</p>
                  <div class="tg-msg-foot">
                    <div class="tg-msg-actions">
                      <button type="button" class="tg-action-btn" data-reply-msg="${idx}" title="Reply">↩</button>
                      <button type="button" class="tg-action-btn" data-copy-msg="${idx}" title="Copy">⧉</button>
                      ${adminUser ? `<button type="button" class="tg-action-btn" data-del-msg="${idx}" title="Delete">✕</button>` : ''}
                    </div>
                    <span>${esc(m.time)}</span>
                    ${mine ? '<span>✓✓</span>' : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')
        : '<div class="empty">No messages yet. Say hello or type @all to reach everyone!</div>';

      msgsBox.scrollTop = msgsBox.scrollHeight;
      $$('[data-room]').forEach((b) => b.classList.toggle('active', b.dataset.room === activeMode));
      updateRoomGlide(true);
      renderAdminAuditList();
    };

    $$('[data-room]').forEach((b) => b.addEventListener('click', () => {
      activeMode = b.dataset.room;
      setReplyTarget(null);
      render();
    }));

    $('#privateRecipient')?.addEventListener('change', (e) => {
      recipient = e.target.value;
      render();
    });

    $('#chatMessages').addEventListener('click', (e) => {
      const rooms = getRooms();
      const k = activeRoomKey();
      const list = rooms[k] || [];

      const repBtn = e.target.closest('[data-reply-msg]');
      if (repBtn) {
        const m = list[Number(repBtn.dataset.replyMsg)];
        if (m) setReplyTarget(m);
        return;
      }

      const cpBtn = e.target.closest('[data-copy-msg]');
      if (cpBtn) {
        const m = list[Number(cpBtn.dataset.copyMsg)];
        if (m) copyToClipboard(m.text, 'Message copied!');
        return;
      }

      const delBtn = e.target.closest('[data-del-msg]');
      if (delBtn && adminUser) {
        const delIdx = Number(delBtn.dataset.delMsg);
        const removed = list[delIdx];
        list.splice(delIdx, 1);
        rooms[k] = list;
        write(CHAT_KEY, rooms);
        HubSync.push('chat_delete', { room: k, index: delIdx, messageId: removed?.id || '' });
        render();
        notify('Message deleted by Leader.');
      }
    });

    $('#chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      const rooms = getRooms();
      const k = activeRoomKey();
      rooms[k] = rooms[k] || [];
      const newMsg = {
        id: `m-${Date.now()}`,
        name: current.name,
        username: current.username,
        text,
        replyTo: pendingReply ? { author: pendingReply.author, text: pendingReply.text.slice(0, 90) } : null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      rooms[k].push(newMsg);
      write(CHAT_KEY, rooms);
      HubSync.push('chat_send', { room: k, message: newMsg });
      chatInput.value = '';
      setReplyTarget(null);
      closeMentionPopup();
      playSoftPing();
      render();
    });

    $('#createPollForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#pollQuestionInput').value.trim();
      const opts = [$('#pollOpt1').value, $('#pollOpt2').value, $('#pollOpt3').value, $('#pollOpt4').value]
        .map((s) => s.trim()).filter(Boolean)
        .map((text, idx) => ({ id: `opt-${Date.now()}-${idx}`, text, voters: [] }));
      if (!q || opts.length < 2) return;
      const poll = {
        id: `poll-${Date.now()}`,
        question: q,
        channel: 'Group 221',
        author: current?.name || 'Student',
        createdAt: 'Just now',
        closed: false,
        options: opts
      };
      savePolls([poll, ...getPolls()]);
      HubSync.push('poll_create', { poll });
      $('#createPollForm').reset();
      closeModal('createPollModal');
      activeMode = 'polls';
      render();
      notify('Poll published to Group 221!');
    });

    window.__dr221RefreshChat = render;
    render();
  }

  function saveUserProfile(updates) {
    Object.assign(current, updates);
    accounts = accounts.map((a) => (a.username === session ? current : a));
    session = current.username;
    write(ACCOUNT_KEY, accounts);
    try { localStorage.setItem(SESSION_KEY, session); } catch (_) {}
  }

  function readImageAsDataUrl(file, maxDim = 1200) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(reader.result);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function bindProfile() {
    if (!$('#profileForm')) return;
    $('#profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const updates = {
        name: $('#profileName').value.trim() || current.name,
        group: $('#profileGroup').value.trim(),
        status: $('#profileStatus')?.value || 'online',
        studentId: $('#profileStudentId').value.trim(),
        email: $('#profileEmail')?.value.trim().toLowerCase() || current.email || '',
        bio: $('#profileBio').value.trim(),
        ringColor: $('#profileRingColor')?.value || ''
      };
      const newPw = ($('#profileNewPassword')?.value || '').trim();
      if (newPw) {
        if (newPw.length < 6) return notify('Password must be at least 6 characters.');
        updates.pwHash = await hashPassword(newPw);
      }
      saveUserProfile(updates);
      await HubSync.push('account_register', { account: current });
      notify('Profile saved!');
      setTimeout(() => window.location.reload(), 320);
    });

    $$('[data-flair-pick]').forEach((btn) => btn.addEventListener('click', () => {
      const emoji = btn.dataset.flairPick;
      saveUserProfile({ flair: emoji });
      HubSync.push('account_register', { account: current });
      $$('[data-flair-pick]').forEach((b) => b.classList.toggle('selected', b === btn));
      notify(`Icon updated to ${emoji}`);
      setTimeout(() => window.location.reload(), 260);
    }));

    $$('[data-banner-pick]').forEach((btn) => btn.addEventListener('click', () => {
      saveUserProfile({ coverImage: btn.dataset.bannerPick });
      notify('Wide banner updated!');
      setTimeout(() => window.location.reload(), 260);
    }));

    $('#profileAvatarInput')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await readImageAsDataUrl(f, 512);
      saveUserProfile({ avatarImage: dataUrl });
      notify('Profile photo updated!');
      setTimeout(() => window.location.reload(), 320);
    });

    $('#profileCoverInput')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await readImageAsDataUrl(f, 1500);
      saveUserProfile({ coverImage: dataUrl });
      notify('Wide cover banner updated!');
      setTimeout(() => window.location.reload(), 320);
    });

    const renderGoals = () => {
      const box = $('#profileGoalsList');
      if (!box) return;
      const goals = getUserGoals();
      box.innerHTML = goals.length ? goals.map((g) => `
        <div class="request-row" style="padding:8px 12px">
          <label style="display:flex;align-items:center;gap:9px;cursor:pointer;flex:1;font-size:.75rem;text-decoration:${g.done ? 'line-through' : 'none'};opacity:${g.done ? '.58' : '1'}">
            <input type="checkbox" data-goal-toggle="${esc(g.id)}" ${g.done ? 'checked' : ''} style="accent-color:var(--accent)">
            <span>${esc(g.text)}</span>
          </label>
          <button type="button" class="btn btn-ghost btn-sm" data-goal-del="${esc(g.id)}">${icon('close')}</button>
        </div>
      `).join('') : '<small class="muted">No study tasks yet.</small>';

      $$('[data-goal-toggle]', box).forEach((cb) => cb.addEventListener('change', () => {
        const list = getUserGoals();
        const item = list.find((x) => x.id === cb.dataset.goalToggle);
        if (item) { item.done = cb.checked; saveUserGoals(list); renderGoals(); }
      }));
      $$('[data-goal-del]', box).forEach((b) => b.addEventListener('click', () => {
        saveUserGoals(getUserGoals().filter((x) => x.id !== b.dataset.goalDel));
        renderGoals();
      }));
    };

    $('#addGoalForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = $('#newGoalInput').value.trim();
      if (!txt) return;
      saveUserGoals([{ id: `g-${Date.now()}`, text: txt, done: false }, ...getUserGoals()]);
      $('#newGoalInput').value = '';
      renderGoals();
    });
    renderGoals();
  }

  async function bindSettings() {
    if (!$('[data-settings-tab]')) return;
    const updateSettingsGlide = setupVerticalGlide($('#settingsNavList'), '[data-settings-tab]', 'settings-glide-pill');

    $$('[data-settings-tab]').forEach((btn) => btn.addEventListener('click', () => {
      $$('[data-settings-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('[data-settings-section]').forEach((sec) => sec.classList.toggle('active', sec.dataset.settingsSection === btn.dataset.settingsTab));
      enhanceCrystalSliders();
      updateSettingsGlide(true);
    }));

    $$('[data-theme-pick]').forEach((btn) => btn.addEventListener('click', (e) => {
      const tObj = themeCatalog.find((t) => t.id === btn.dataset.themePick) || themeCatalog[0];
      switchThemeWithRipple(tObj.id, e, () => {
        $$('[data-theme-pick]').forEach((b) => b.classList.toggle('selected', b === btn));
        notify(`Theme changed to ${tObj.name}`);
      });
    }));

    $$('[data-accent-c1]').forEach((btn) => btn.addEventListener('click', () => {
      updatePreferences({ accent: btn.dataset.accentC1, accent2: btn.dataset.accentC2 });
      $$('[data-accent-c1]').forEach((b) => b.classList.toggle('selected', b === btn));
      if ($('#customAccentInput')) $('#customAccentInput').value = btn.dataset.accentC1;
      notify('Accent color updated!');
    }));

    $('#customAccentInput')?.addEventListener('input', (e) => {
      updatePreferences({ accent: e.target.value, accent2: e.target.value });
      $$('[data-accent-c1]').forEach((b) => b.classList.remove('selected'));
    });

    $('#glassAlphaRange')?.addEventListener('input', (e) => {
      $('#glassAlphaVal').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
      updatePreferences({ glassAlpha: Number(e.target.value) });
    });

    $('#glassBlurRange')?.addEventListener('input', (e) => {
      $('#glassBlurVal').textContent = `${e.target.value}px`;
      updatePreferences({ glassBlur: Number(e.target.value) });
    });

    $('#wallpaperPresetSelect')?.addEventListener('change', (e) => {
      updatePreferences({ wallpaper: e.target.value });
      notify('Background wallpaper updated!');
    });

    $('#customWallpaperInput')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await readImageAsDataUrl(f, 1600);
      updatePreferences({ wallpaper: dataUrl });
      notify('Custom wallpaper applied!');
      setTimeout(() => window.location.reload(), 380);
    });

    $('#clearWallpaperBtn')?.addEventListener('click', () => {
      updatePreferences({ wallpaper: '' });
      notify('Wallpaper removed.');
      setTimeout(() => window.location.reload(), 300);
    });

    const updateLangGlide = setupHorizontalGlide($('#langSettingsGroup'), '[data-lang-pick]');
    $$('[data-lang-pick]').forEach((btn) => btn.addEventListener('click', () => {
      const targetLang = btn.dataset.langPick;
      if ((targetLang === 'ar') === isAr()) return;
      $$('[data-lang-pick]').forEach((b) => b.classList.toggle('active', b === btn));
      updateLangGlide(true);
      toggleSiteLanguage();
    }));

    $('#fontPreviewBanner')?.addEventListener('click', () => {
      $('#fontPreviewBanner').classList.toggle('expanded');
    });

    $$('[data-font-pick]').forEach((btn) => btn.addEventListener('click', () => {
      const fObj = fontCatalog.find((f) => f.id === btn.dataset.fontPick) || fontCatalog[0];
      updatePreferences({ font: fObj.id });
      $$('[data-font-pick]').forEach((b) => b.classList.toggle('selected', b === btn));
      if ($('#fontBannerTitle')) $('#fontBannerTitle').textContent = `${fObj.name} — ${fObj.sample}`;
      if ($('#fontBannerPill')) $('#fontBannerPill').textContent = fObj.label;
      if ($('#fontPreviewBanner')) $('#fontPreviewBanner').classList.add('expanded');
      requestAnimationFrame(() => updateSettingsGlide(false));
      notify(`Font changed to ${fObj.name}`);
    }));

    $('#uiScaleRange')?.addEventListener('input', (e) => {
      $('#uiScaleVal').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
      updatePreferences({ scale: Number(e.target.value) });
    });

    $('#radiusRange')?.addEventListener('input', (e) => {
      $('#radiusVal').textContent = `${e.target.value}px`;
      updatePreferences({ radius: Number(e.target.value) });
    });

    $('#contentWidthSelect')?.addEventListener('change', (e) => {
      updatePreferences({ contentWidth: Number(e.target.value) });
    });

    $('#toggleMotion')?.addEventListener('click', () => {
      const next = !(getPrefs().motion !== false);
      updatePreferences({ motion: next });
      $('#toggleMotion').classList.toggle('on', next);
    });

    $('#toggleDensity')?.addEventListener('click', () => {
      const next = getPrefs().density !== 'compact';
      updatePreferences({ density: next ? 'compact' : 'comfortable' });
      $('#toggleDensity').classList.toggle('on', next);
      notify(next ? 'Compact layout enabled.' : 'Comfortable layout restored.');
    });

    $('#toggleSounds')?.addEventListener('click', () => {
      const next = getPrefs().soundEffects === false;
      updatePreferences({ soundEffects: next });
      $('#toggleSounds').classList.toggle('on', next);
      if (next) playSoftPing();
      notify(next ? 'Soft sounds enabled.' : 'Sounds muted.');
    });

    $('#resetAppearanceBtn')?.addEventListener('click', () => {
      updatePreferences({ theme: 'oled-black', accent: '#2563eb', accent2: '#4f46e5', glassBlur: 20, glassAlpha: 0.76, radius: 22, scale: 1, density: 'comfortable', motion: true, wallpaper: '' });
      notify('Default iPhone glass appearance restored!');
      setTimeout(() => window.location.reload(), 300);
    });

    $('#settingsAvatarInput')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await readImageAsDataUrl(f, 512);
      saveUserProfile({ avatarImage: dataUrl });
      notify('Profile avatar updated!');
      setTimeout(() => window.location.reload(), 380);
    });

    $('#settingsCoverInput')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await readImageAsDataUrl(f, 1400);
      saveUserProfile({ coverImage: dataUrl });
      notify('Cover photo updated!');
    });

    if (isAdmin()) {
      $$('[data-subject-cover-input]').forEach((inp) => inp.addEventListener('change', async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const id = inp.dataset.subjectCoverInput;
        const dataUrl = await readImageAsDataUrl(f, 800);
        const covers = read(SUBJECT_COVERS_KEY, {});
        covers[id] = dataUrl;
        write(SUBJECT_COVERS_KEY, covers);
        notify('Subject cover updated!');
        setTimeout(() => window.location.reload(), 380);
      }));

      $$('[data-subject-cover-reset]').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.dataset.subjectCoverReset;
        const covers = read(SUBJECT_COVERS_KEY, {});
        delete covers[id];
        write(SUBJECT_COVERS_KEY, covers);
        notify('Subject cover reset to default.');
        setTimeout(() => window.location.reload(), 300);
      }));
    }

    $('#toggleWeekParity')?.addEventListener('click', () => {
      const next = !getPrefs().weekParityFlip;
      updatePreferences({ weekParityFlip: next });
      $('#toggleWeekParity').classList.toggle('on', next);
      notify(`Academic week parity switched to Week ${ScheduleSync.getWeekDates(0).academicWeek}`);
    });

    $('#defaultGroupSelect')?.addEventListener('change', (e) => {
      updatePreferences({ groupFilter: e.target.value });
      notify('Default group filter saved!');
    });

    $('#settingsExportIcsBtn')?.addEventListener('click', () => ScheduleSync.exportICS(0));

    const stats = await Dr221DB.getStats();
    if ($('#settingsDbCount')) $('#settingsDbCount').textContent = `${stats.count} files`;
    if ($('#settingsDbSize')) $('#settingsDbSize').textContent = stats.totalLabel;

    $('#saveTgBotBtn')?.addEventListener('click', async () => {
      const bot = ($('#settingsTgBotInput')?.value || '').trim().replace(/^@/, '');
      const nextSite = { ...getSiteConfig(), telegramBotUsername: bot };
      write(SITE_KEY, nextSite);
      await HubSync.push('site_save', { site: nextSite });
      notify(bot ? `Telegram Login Bot (@${bot}) saved to Cloud!` : 'Telegram Login Bot cleared.');
    });

    $('#saveAiKeyBtn')?.addEventListener('click', () => {
      updatePreferences({ aiApiKey: $('#settingsAiKeyInput').value.trim() });
      notify('AI API key saved!');
    });

    $('#saveUploadTokenBtn')?.addEventListener('click', () => {
      saveUploadToken($('#settingsUploadToken').value);
      notify('Cloud upload token saved!');
    });

    $('#settingsBackupBtn')?.addEventListener('click', exportDatabaseBackup);
    $('#testSupabaseBtn')?.addEventListener('click', async () => {
      const res = await SupaCloud.testFullHealth();
      await syncRemoteMaterials();
      if ($('#settingsCloudStatus')) {
        $('#settingsCloudStatus').textContent = res.dbOk
          ? `● ${res.message} (${remoteMaterials.length} files)`
          : `✕ ${res.message}`;
      }
      notify(res.message);
    });
    $('#syncLocalToCloudBtn')?.addEventListener('click', syncLocalMaterialsToCloud);
    $('#settingsRestoreInput')?.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        if (data.preferences) write(PREF_KEY, data.preferences);
        if (data.schedule) write(SCHEDULE_KEY, data.schedule);
        if (data.teachers) write(TEACHER_KEY, data.teachers);
        if (data.subjectCovers) write(SUBJECT_COVERS_KEY, data.subjectCovers);
        notify('Backup restored successfully!');
        setTimeout(() => window.location.reload(), 450);
      } catch (_) {
        notify('Invalid backup JSON file.');
      }
    });
  }

  function renderAdminQueues() {
    const pendBox = $('#adminPendingFilesList');
    if (pendBox) {
      const pending = getPendingMaterials();
      pendBox.innerHTML = pending.length ? pending.map((m) => `
        <div class="request-row">
          <div style="min-width:0;flex:1">
            <strong>${esc(m.name)}</strong>
            <small>${esc(m.subject)} · ${esc(m.size)} · Sent by ${esc(m.addedBy)}${m.description ? ` · "${esc(m.description)}"` : ''}</small>
          </div>
          <div style="display:flex;gap:6px;flex:none">
            <button type="button" class="btn btn-secondary btn-sm" data-pend-preview="${esc(m.id)}">${icon('eye')}</button>
            <button type="button" class="btn btn-primary btn-sm" data-pend-approve="${esc(m.id)}">${icon('check')} Approve</button>
            <button type="button" class="btn btn-danger btn-sm" data-pend-reject="${esc(m.id)}">${icon('close')}</button>
          </div>
        </div>
      `).join('') : '<div class="empty" style="min-height:110px">No pending student file submissions.</div>';

      $$('[data-pend-preview]').forEach((b) => b.addEventListener('click', () => openMaterialPreview(b.dataset.pendPreview)));
      $$('[data-pend-approve]').forEach((b) => b.addEventListener('click', async () => {
        await approvePendingMaterial(b.dataset.pendApprove);
        renderAdminQueues();
      }));
      $$('[data-pend-reject]').forEach((b) => b.addEventListener('click', async () => {
        await deleteMaterialItem(b.dataset.pendReject);
        renderAdminQueues();
      }));
    }

    const reqBox = $('#adminRequestsList');
    if (reqBox) {
      const reqs = getFileRequests();
      reqBox.innerHTML = reqs.length ? reqs.map((r) => `
        <div class="request-row">
          <div style="min-width:0;flex:1">
            <strong>${esc(r.title)}</strong>
            <small>${esc(r.subject)} · Requested by ${esc(r.requestedBy)} (${esc(r.group || '221')}) · ${esc(r.createdAt || '')}</small>
          </div>
          <div style="display:flex;gap:6px;flex:none;align-items:center">
            ${r.status === 'fulfilled'
              ? '<span class="pill success">Done</span>'
              : `<button type="button" class="btn btn-primary btn-sm" data-req-done="${esc(r.id)}">${icon('check')} Fulfilled</button>`}
            <button type="button" class="btn btn-danger btn-sm" data-req-del="${esc(r.id)}">${icon('close')}</button>
          </div>
        </div>
      `).join('') : '<div class="empty" style="min-height:110px">No file requests from students right now.</div>';

      $$('[data-req-done]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.reqDone;
        const list = getFileRequests();
        const r = list.find((x) => x.id === id);
        if (r) r.status = 'fulfilled';
        saveFileRequests(list);
        HubSync.push('request_status', { id, status: 'fulfilled' });
        renderAdminQueues();
        notify('Request marked as fulfilled!');
      }));
      $$('[data-req-del]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.reqDel;
        saveFileRequests(getFileRequests().filter((x) => x.id !== id));
        HubSync.push('request_delete', { id });
        renderAdminQueues();
      }));
    }
  }

  function bindAdmin() {
    $('#adminSiteForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!isAdmin()) return;
      const site = {
        name: $('#adminSiteName').value.trim() || 'Dr. 221',
        tagline: $('#adminSiteTagline').value.trim() || 'Human Medicine · Year 2'
      };
      write(SITE_KEY, site);
      HubSync.push('site_save', { site });
      notify('Site branding updated!');
      setTimeout(() => window.location.reload(), 380);
    });

    $('#adminAlertForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!isAdmin()) return;
      const alertObj = {
        id: `alert-${Date.now()}`,
        title: $('#adminAlertTitle').value.trim() || 'Urgent Update',
        level: $('#adminAlertLevel').value || 'warning',
        message: $('#adminAlertMsg').value.trim(),
        by: current?.name || 'Administrator',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      if (!alertObj.message) return;
      saveBroadcastAlert(alertObj);
      try { localStorage.removeItem(DISMISSED_ALERT_KEY); } catch (_) {}
      HubSync.push('alert_set', { alert: alertObj });
      renderBroadcastBanner();
      notify('Live broadcast alert published to all students!');
    });

    $('#adminClearAlertBtn')?.addEventListener('click', () => {
      if (!isAdmin()) return;
      saveBroadcastAlert(null);
      HubSync.push('alert_set', { alert: null });
      renderBroadcastBanner();
      if ($('#adminAlertMsg')) $('#adminAlertMsg').value = '';
      notify('Broadcast banner cleared.');
    });

    renderAdminQueues();
  }

  let modalCloseCallback = null;
  function openModal(id, onClose = null) {
    modalCloseCallback = onClose;
    const m = $(`#${id}`);
    if (m) {
      m.classList.add('open');
      enhanceCustomSelects(m);
    }
  }
  function closeModal(id) {
    const m = $(`#${id}`);
    if (m) m.classList.remove('open');
    if (typeof modalCloseCallback === 'function') {
      modalCloseCallback();
      modalCloseCallback = null;
    }
  }

  function bindCommon() {
    const setDrawerOpen = (open) => {
      $('#sidebar')?.classList.toggle('open', open);
      $('#drawerOverlay')?.classList.toggle('open', open);
      document.body.classList.toggle('drawer-open', open);
    };
    window.__closeMobileDrawer = () => setDrawerOpen(false);
    $('#mobileMenu')?.addEventListener('click', () => {
      setDrawerOpen(!$('#sidebar')?.classList.contains('open'));
    });
    $('#drawerOverlay')?.addEventListener('click', () => setDrawerOpen(false));

    $('#langQuickBtn')?.addEventListener('click', toggleSiteLanguage);
    $('#sidebarLogoutBtn')?.addEventListener('click', signOut);
    $('#topbarLogoutBtn')?.addEventListener('click', signOut);
    $('#focusTimerPill')?.addEventListener('click', toggleFocusTimer);
    $('#installAppBtn')?.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') notify('Dr. 221 App installed!');
        deferredInstallPrompt = null;
        $('#installAppBtn')?.classList.remove('visible');
      } else {
        notify('To install on phone: tap Browser Menu -> "Add to Home Screen".');
      }
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-close-modal]');
      if (btn) closeModal(btn.dataset.closeModal);
      if (e.target.classList.contains('modal-backdrop')) closeModal(e.target.id);
    });

    $('#themeQuickBtn')?.addEventListener('click', (e) => {
      const isDark = (themeCatalog.find((t) => t.id === getPrefs().theme) || themeCatalog[0]).dark;
      const next = isDark ? 'frosted-light' : 'oled-black';
      switchThemeWithRipple(next, e, (tObj) => {
        notify(`Switched to ${tObj.name}`);
      });
    });

    $('#globalSearchForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#globalSearch').value.trim();
      if (q) navigateToPage(`courses.html?q=${encodeURIComponent(q)}`);
    });

    $('#aiFab')?.addEventListener('click', () => $('#aiDrawer').classList.toggle('open'));
    $('#heroOpenAiBtn')?.addEventListener('click', () => $('#aiDrawer').classList.add('open'));
    $('#aiClose')?.addEventListener('click', () => $('#aiDrawer').classList.remove('open'));

    const askAi = async (promptText) => {
      const box = $('#aiMessages');
      box.insertAdjacentHTML('beforeend', `<div class="ai-message mine">${esc(promptText)}</div>`);
      box.scrollTop = box.scrollHeight;
      const reply = await Dr221AI.respond(promptText);
      box.insertAdjacentHTML('beforeend', `<div class="ai-message">${esc(reply)}</div>`);
      box.scrollTop = box.scrollHeight;
    };

    $$('[data-ai-prompt]').forEach((b) => b.addEventListener('click', () => askAi(b.dataset.aiPrompt)));
    $('#aiForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#aiInput').value.trim();
      if (!v) return;
      $('#aiInput').value = '';
      askAi(v);
    });
  }

  // ==========================================================================
  // Instant Zero-Reload SPA Navigation Engine (v25 Native App Feel)
  // ==========================================================================
  const SPA_PAGES = {
    dashboard: { title: 'Overview', bind: () => renderDashboard() },
    schedule: { title: 'Live Schedule', bind: () => bindSchedule() },
    courses: { title: 'My Courses', bind: () => bindCourses() },
    materials: { title: 'Study Database', bind: () => bindMaterials() },
    qa: { title: 'Student Q&A', bind: () => bindQA() },
    seminars: { title: 'Seminars', bind: () => bindSeminars() },
    chat: { title: 'Student Chat', bind: () => bindChat() },
    profile: { title: 'My Profile', bind: () => bindProfile() },
    settings: { title: 'Settings', bind: () => bindSettings() },
    admin: { title: 'Admin Console', bind: () => bindAdmin() }
  };

  function resolveSpaPage(href) {
    if (!href) return null;
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      const file = (url.pathname.split('/').pop() || '').toLowerCase();
      const name = file.replace(/\.html$/, '');
      if (!SPA_PAGES[name]) return null;
      return { name, url };
    } catch (_) {
      return null;
    }
  }

  function bindCurrentPageView(fullLocale = false) {
    const entry = SPA_PAGES[page] || SPA_PAGES.dashboard;
    entry.bind();
    enhanceCustomSelects();
    enhanceCrystalSliders();
    renderBroadcastBanner();
    if (isAr()) localizeDom(fullLocale ? document.body : ($('#mainPageContent') || document.body));
  }

  function navigateToPage(href, push = true) {
    const resolved = resolveSpaPage(href);
    if (!resolved) {
      window.location.href = href;
      return false;
    }
    const targetPage = resolved.name;
    const targetUrl = resolved.url;

    // Close mobile drawers & modals immediately
    $('#sidebar')?.classList.remove('open');
    $('#drawerOverlay')?.classList.remove('open');
    document.body.classList.remove('drawer-open');
    $('#aiDrawer')?.classList.remove('open');
    $$('.modal-backdrop.open').forEach((m) => m.classList.remove('open'));

    const sameRoute = targetPage === page && targetUrl.search === window.location.search;
    if (sameRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    page = targetPage;
    document.body.dataset.page = targetPage;

    if (push) {
      try {
        history.pushState({ page: targetPage }, '', targetUrl.pathname + targetUrl.search + targetUrl.hash);
      } catch (_) {}
    }

    // Update titles
    const site = getSiteConfig();
    const rawTitle = SPA_PAGES[targetPage].title;
    document.title = `${rawTitle} · ${site.name}`;
    const topTitleEl = $('#topbarPageTitle');
    if (topTitleEl) topTitleEl.textContent = isAr() ? translateTextValue(rawTitle) : rawTitle;

    // Update active states & smoothly glide mobile dock + sidebar pills ONCE (zero reload!)
    $$('.sidebar-nav .nav-link').forEach((el) => el.classList.toggle('active', el.dataset.navPage === targetPage));
    $$('.mobile-dock a').forEach((el) => el.classList.toggle('active', el.dataset.navPage === targetPage));
    if (typeof window.__syncMobileDockLens === 'function') window.__syncMobileDockLens(true);
    if (typeof window.__syncSidebarLens === 'function') window.__syncSidebarLens(true);

    // Reset material folder when entering Study Database without ?subject=
    if (targetPage === 'materials' && !new URLSearchParams(targetUrl.search).get('subject')) {
      activeMaterialSubject = 'all';
    }

    // Swap main view instantly with subtle native fade
    const mainEl = $('#mainPageContent');
    if (mainEl) {
      mainEl.classList.remove('page-swap-in');
      mainEl.innerHTML = `<div id="broadcastSlot"></div>${pageTemplate()}`;
      void mainEl.offsetWidth;
      mainEl.classList.add('page-swap-in');
    }

    window.scrollTo(0, 0);
    bindCurrentPageView();

    // Refresh live cloud data softly in background without blocking UI
    if (targetPage === 'chat') HubSync.pullChat();
    else if (targetPage === 'materials') syncRemoteMaterials();

    return true;
  }

  function bindSpaNavigation() {
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      if (anchor.hasAttribute('download') || anchor.getAttribute('target') === '_blank') return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      const resolved = resolveSpaPage(href);
      if (!resolved) return;
      e.preventDefault();
      navigateToPage(href, true);
    });

    window.addEventListener('popstate', () => {
      navigateToPage(window.location.href, false);
    });
  }

  // ==========================================================================
  // Boot Sequence
  // ==========================================================================
  applyPreferences();

  if (window.location.hash && window.location.hash.includes('access_token=')) {
    handleOAuthReturnIfPresent();
  }

  if (page === 'login' || !current) {
    renderLoginPage();
    return;
  }

  renderShell(pageTemplate());
  mountBackdrop();
  initSidebarGlide();
  initMobileDockGlide();
  bindCommon();
  bindSpaNavigation();
  initPWA();
  syncRemoteMaterials();
  HubSync.pull();
  HubSync.subscribeRealtime();

  bindCurrentPageView(true);
  if (isAr()) {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
})();
