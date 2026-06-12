/* ============================================================
   Ap. 223 — Store
   Estado sincronizado via Supabase (tabela ap223_state, linha 1).
   localStorage mantido como cache offline/imediato.
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://tnwmjrtosepnqzxeyuvb.supabase.co";
  var SUPABASE_KEY = "sb_publishable_kosdlmfYL8inkU8KL4JAzA_SaYHGpNJ";

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ---- People (fixed roster) ----------------------------------
  var PEOPLE = [
    { id: "salatiel", name: "Salatiel", short: "Sala",   color: "#1F9D57", ink: "#FFFFFF" },
    { id: "luis",     name: "Luis",     short: "Luis",   color: "#2563EB", ink: "#FFFFFF" },
    { id: "amanda",   name: "Amanda",   short: "Amanda", color: "#FFA400", ink: "#1A1A1A" }
  ];

  var CLEAN_ORDER  = ["salatiel", "luis", "amanda"];
  var CLEAN_ANCHOR = new Date(2026, 5, 13, 0, 0, 0, 0); // 13 jun 2026

  var VARAIS = [
    { id: "esq", name: "Varal da Esquerda" },
    { id: "dir", name: "Varal da Direita"  }
  ];

  var CATEGORIES = [
    { id: "reclamacao", name: "Reclamação", icon: "alert-triangle", color: "#D7263D" },
    { id: "sugestao",   name: "Sugestão",   icon: "lightbulb",      color: "#FFA400" },
    { id: "comentario", name: "Comentário", icon: "message-circle", color: "#1A1A1A" }
  ];

  var LOCAL_KEY = "ap223:v1";

  function defaultState() {
    return {
      pins: {},
      cleanDone: {},
      cleanOverrides: {},
      reservations: [],
      posts: []
    };
  }

  // ---- estado inicial vem do localStorage (imediato) ----------
  var state = loadLocal();

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { return defaultState(); }
  }

  function persistLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---- pub/sub -----------------------------------------------
  var subs = [];
  function subscribe(fn) {
    subs.push(fn);
    return function () { subs = subs.filter(function (s) { return s !== fn; }); };
  }
  function emit() { subs.forEach(function (fn) { try { fn(state); } catch (e) {} }); }

  // ---- Supabase sync -----------------------------------------
  function applyRemote(data) {
    if (!data || typeof data !== "object") return;
    state = Object.assign(defaultState(), data);
    persistLocal();
    emit();
  }

  // grava no Supabase (fire-and-forget, sem bloquear a UI)
  function persistRemote() {
    sb.from("ap223_state")
      .upsert({ id: 1, data: state, updated_at: new Date().toISOString() })
      .then(function (res) {
        if (res.error) console.warn("[Store] Supabase write error:", res.error.message);
      });
  }

  function commit() {
    persistLocal();
    persistRemote();
    emit();
  }

  // busca estado atual do servidor ao abrir o app
  sb.from("ap223_state")
    .select("data")
    .eq("id", 1)
    .single()
    .then(function (res) {
      if (res.error) { console.warn("[Store] Supabase fetch error:", res.error.message); return; }
      if (res.data && res.data.data) applyRemote(res.data.data);
    });

  // escuta mudanças em tempo real (outros dispositivos)
  sb.channel("ap223_state_changes")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ap223_state" },
      function (payload) {
        if (payload.new && payload.new.data) applyRemote(payload.new.data);
      })
    .subscribe();

  // cross-tab sync (mesmo navegador)
  window.addEventListener("storage", function (e) {
    if (e.key === LOCAL_KEY) { state = loadLocal(); emit(); }
  });

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---- session -----------------------------------------------
  var SKEY = "ap223:session";
  function getSession()       { try { return localStorage.getItem(SKEY); } catch (e) { return null; } }
  function setSession(id)     { if (id) localStorage.setItem(SKEY, id); else localStorage.removeItem(SKEY); emit(); }

  // ---- PIN ---------------------------------------------------
  function hasPin(id)         { return !!state.pins[id]; }
  function setPin(id, pin)    { state.pins[id] = String(pin); commit(); }
  function checkPin(id, pin)  { return state.pins[id] === String(pin); }

  // ---- limpeza -----------------------------------------------
  function startOfDay(d)      { var x = new Date(d); x.setHours(0,0,0,0); return x; }
  function weekIndexFor(date) {
    return Math.floor((startOfDay(date).getTime() - CLEAN_ANCHOR.getTime()) / (7 * 86400000));
  }
  function skipsBefore(wi) {
    var n = 0;
    for (var k in state.cleanOverrides) {
      if (state.cleanOverrides[k] === "none" && Number(k) < wi) n++;
    }
    return n;
  }
  function shiftedPersonForWeek(wi) {
    var i = (((wi - skipsBefore(wi)) % 3) + 3) % 3;
    return PEOPLE.find(function (p) { return p.id === CLEAN_ORDER[i]; });
  }
  function personForWeek(wi) {
    var i = ((wi % 3) + 3) % 3;
    return PEOPLE.find(function (p) { return p.id === CLEAN_ORDER[i]; });
  }
  function weekRange(wi) {
    var start = new Date(CLEAN_ANCHOR.getTime() + wi * 7 * 86400000);
    return { start: start, end: new Date(start.getTime() + 6 * 86400000) };
  }
  function setCleanDone(wi, done)    { if (done) state.cleanDone[wi] = true; else delete state.cleanDone[wi]; commit(); }
  function isCleanDone(wi)           { return !!state.cleanDone[wi]; }
  function setCleanOverride(wi, val) {
    if (val === null || val === undefined) delete state.cleanOverrides[wi];
    else state.cleanOverrides[wi] = val;
    commit();
  }
  function resolveWeek(wi) {
    var base = shiftedPersonForWeek(wi);
    var ov   = state.cleanOverrides[wi];
    if (ov === "none") return { person: null,              skipped: true,  overridden: true,  base: base };
    if (ov)            return { person: person(ov) || base, skipped: false, overridden: true,  base: base };
    return                    { person: base,               skipped: false, overridden: false, base: base };
  }

  // ---- reservas ----------------------------------------------
  var H            = 3600000;
  var MAX_DURATION = 48 * H;
  var MAX_AHEAD    = 14 * 86400000;

  function reservationsFor(varalId) {
    return state.reservations.filter(function (r) { return r.varal === varalId; })
      .sort(function (a, b) { return a.start - b.start; });
  }
  function overlaps(varalId, start, end, ignoreId) {
    return state.reservations.filter(function (r) {
      if (r.varal !== varalId) return false;
      if (ignoreId && r.id === ignoreId) return false;
      return start < r.end && end > r.start;
    });
  }
  function validateReservation(varalId, start, end, ignoreId) {
    var now = Date.now();
    if (!(end > start))                      return { ok: false, msg: "O fim precisa ser depois do início." };
    if (end - start > MAX_DURATION + 60000)  return { ok: false, msg: "Reserva máxima de 48h." };
    if (start > now + MAX_AHEAD)             return { ok: false, msg: "Só dá pra reservar até 2 semanas pra frente." };
    if (end <= now)                          return { ok: false, msg: "Essa reserva já passou." };
    var conf = overlaps(varalId, start, end, ignoreId);
    if (conf.length)                         return { ok: false, msg: "Conflito de horário com outra reserva.", conflicts: conf };
    return { ok: true };
  }
  function addReservation(varalId, userId, start, end) {
    var v = validateReservation(varalId, start, end);
    if (!v.ok) return v;
    var r = { id: uid(), varal: varalId, userId: userId, start: start, end: end, createdAt: Date.now() };
    state.reservations.push(r);
    commit();
    return { ok: true, reservation: r };
  }
  function updateReservation(id, varalId, start, end) {
    var v = validateReservation(varalId, start, end, id);
    if (!v.ok) return v;
    var r = state.reservations.find(function (x) { return x.id === id; });
    if (!r) return { ok: false, msg: "Reserva não encontrada." };
    r.varal = varalId; r.start = start; r.end = end;
    commit();
    return { ok: true, reservation: r };
  }
  function cancelReservation(id) {
    state.reservations = state.reservations.filter(function (r) { return r.id !== id; });
    commit();
  }

  // ---- fórum -------------------------------------------------
  function addPost(p) {
    var post = {
      id: uid(), cat: p.cat,
      title: (p.title || "").trim(), body: (p.body || "").trim(),
      authorId: p.anon ? null : p.authorId, anon: !!p.anon,
      createdAt: Date.now(), likes: [], resolved: false, comments: []
    };
    state.posts.unshift(post);
    commit();
    return post;
  }
  function deletePost(id)          { state.posts = state.posts.filter(function (p) { return p.id !== id; }); commit(); }
  function toggleLike(postId, uid) {
    var p = state.posts.find(function (x) { return x.id === postId; });
    if (!p) return;
    var i = p.likes.indexOf(uid);
    if (i >= 0) p.likes.splice(i, 1); else p.likes.push(uid);
    commit();
  }
  function toggleResolved(postId) {
    var p = state.posts.find(function (x) { return x.id === postId; });
    if (!p) return;
    p.resolved = !p.resolved;
    commit();
  }
  function addComment(postId, c) {
    var p = state.posts.find(function (x) { return x.id === postId; });
    if (!p) return;
    p.comments.push({ id: uid(), body: (c.body || "").trim(), authorId: c.anon ? null : c.authorId, anon: !!c.anon, createdAt: Date.now() });
    commit();
  }

  function person(id) { return PEOPLE.find(function (p) { return p.id === id; }) || null; }

  window.Store = {
    PEOPLE: PEOPLE, VARAIS: VARAIS, CATEGORIES: CATEGORIES,
    CLEAN_ORDER: CLEAN_ORDER, MAX_DURATION: MAX_DURATION,
    getState:    function () { return state; },
    subscribe:   subscribe,
    person:      person,
    getSession:  getSession, setSession: setSession,
    hasPin:      hasPin,     setPin:     setPin,     checkPin:   checkPin,
    weekIndexFor: weekIndexFor, personForWeek: personForWeek, weekRange: weekRange,
    setCleanDone: setCleanDone, isCleanDone: isCleanDone,
    setCleanOverride: setCleanOverride, resolveWeek: resolveWeek,
    reservationsFor: reservationsFor, overlaps: overlaps,
    validateReservation: validateReservation, addReservation: addReservation,
    updateReservation: updateReservation, cancelReservation: cancelReservation,
    allReservations: function () { return state.reservations.slice(); },
    addPost: addPost, deletePost: deletePost, toggleLike: toggleLike,
    toggleResolved: toggleResolved, addComment: addComment
  };
})();
