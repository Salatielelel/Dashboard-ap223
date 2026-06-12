/* Ap. 223 — Aba 2: Reserva de varal */
(function () {
  var React = window.React;
  var h = React.createElement;
  var B = window.Brand;
  var Icon = B.Icon, Avatar = B.Avatar, Fmt = B.Fmt, Modal = B.Modal;
  var useState = React.useState, useEffect = React.useEffect;

  var H = 3600000, DAY = 86400000;
  var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  var DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function roundUp30(ms) { var step = 30 * 60000; return Math.ceil(ms / step) * step; }
  function sameDay(a, b) { return new Date(a).toDateString() === new Date(b).toDateString(); }

  // ---- Month calendar (view only) ----
  function MonthCalendar(props) {
    var S = window.Store, now = props.now;
    var off = useState(0); var monthOff = off[0], setOff = off[1];
    var base = new Date(); base.setHours(0, 0, 0, 0); base.setDate(1); base.setMonth(base.getMonth() + monthOff);
    var year = base.getFullYear(), month = base.getMonth();
    var firstDow = base.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var res = S.allReservations();

    var cells = [];
    for (var b = 0; b < firstDow; b++) cells.push(h("div", { key: "b" + b, className: "cal-cell blank" }));
    for (var d = 1; d <= daysInMonth; d++) {
      (function (day) {
        var ds = new Date(year, month, day).getTime(), de = ds + DAY;
        var dres = res.filter(function (x) { return x.start < de && x.end > ds; });
        var today = sameDay(now, ds);
        cells.push(h("div", { key: "d" + day, className: "cal-cell" + (today ? " today" : "") + (dres.length ? " has" : "") },
          h("span", { className: "cal-num" }, day),
          h("div", { className: "cal-lanes" }, S.VARAIS.map(function (v) {
            var segs = dres.filter(function (x) { return x.varal === v.id; });
            return h("div", { key: v.id, className: "cal-lane", title: v.name + (segs.length ? "" : " · livre") },
              segs.map(function (seg) {
                var p = S.person(seg.userId);
                var cs = Math.max(seg.start, ds), ce = Math.min(seg.end, de);
                var left = (cs - ds) / DAY * 100;
                var width = Math.max(3, (ce - cs) / DAY * 100);
                if (left + width > 100) left = 100 - width;
                return h("span", { key: seg.id, className: "cal-seg", style: { left: left + "%", width: width + "%", background: p ? p.color : "#999" }, title: (p ? p.name : "") + " · " + v.name + " · " + Fmt.time(seg.start) + "→" + Fmt.time(seg.end) });
              })
            );
          }))
        ));
      })(d);
    }

    return h("div", { className: "card pad", style: { marginBottom: 18 } },
      h("div", { className: "cal-head" },
        h("div", { className: "cal-title" }, MESES[month] + " " + year),
        h("div", { className: "cal-nav" },
          h("button", { className: "iconbtn", "aria-label": "Mês anterior", onClick: function () { setOff(monthOff - 1); } }, h(Icon, { name: "chevron-left", size: 18 })),
          monthOff !== 0 ? h("button", { className: "btn btn-ghost btn-sm", onClick: function () { setOff(0); } }, "Hoje") : null,
          h("button", { className: "iconbtn", "aria-label": "Próximo mês", onClick: function () { setOff(monthOff + 1); } }, h(Icon, { name: "chevron-right", size: 18 }))
        )
      ),
      h("div", { className: "cal-grid" }, DOW.map(function (w) { return h("div", { key: w, className: "cal-dow" }, w); })),
      h("div", { className: "cal-grid", style: { marginTop: 5 } }, cells),
      h("div", { className: "cal-legend" },
        S.PEOPLE.map(function (p) {
          return h("div", { key: p.id, className: "item" }, h("span", { className: "swatch", style: { background: p.color } }), p.name);
        }).concat([
          h("div", { key: "lanes", className: "item" },
            h("div", { className: "lanes-mini" }, h("span", null), h("span", null)),
            "Cima: Esquerda · Baixo: Direita")
        ])
      )
    );
  }

  function TimelineStrip(props) {
    var S = window.Store;
    var r0 = startOfToday(), r1 = r0 + 7 * DAY, total = r1 - r0;
    var now = props.now;
    var res = S.reservationsFor(props.varalId).filter(function (x) { return x.end > r0 && x.start < r1; });
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(r0 + i * DAY);
      days.push(h("div", { key: i, style: { flex: 1, borderLeft: i ? "1px solid var(--border-1)" : "none", paddingLeft: 4, fontSize: 10, color: "var(--fg-3)", fontWeight: 600 } },
        Fmt.weekdayShort(d), " ", new Date(r0 + i * DAY).getDate()));
    }
    var blocks = res.map(function (x) {
      var p = S.person(x.userId);
      var left = Math.max(0, (x.start - r0) / total) * 100;
      var right = Math.min(1, (x.end - r0) / total) * 100;
      var w = Math.max(1.2, right - left);
      var active = x.start <= now && now < x.end;
      return h("div", {
        key: x.id, title: (p ? p.name : "") + " · " + Fmt.full(x.start) + " → " + Fmt.full(x.end),
        style: {
          position: "absolute", left: left + "%", width: w + "%", top: 0, bottom: 0,
          background: p ? p.color : "#999", borderRadius: 5,
          boxShadow: active ? "0 0 0 2px var(--m1-ink)" : "inset 0 0 0 1px rgba(0,0,0,0.12)",
          opacity: x.end <= now ? 0.4 : 1
        }
      });
    });
    var nowLeft = (now - r0) / total * 100;
    var nowMarker = (now >= r0 && now <= r1) ? h("div", {
      style: { position: "absolute", left: nowLeft + "%", top: -3, bottom: -3, width: 2, background: "var(--m1-danger)", zIndex: 5, borderRadius: 2 }
    }, h("div", { style: { position: "absolute", top: -5, left: -3, width: 8, height: 8, borderRadius: "50%", background: "var(--m1-danger)" } })) : null;

    return h("div", null,
      h("div", { style: { position: "relative", height: 34, background: "var(--m1-cream-2)", borderRadius: 7, overflow: "visible", margin: "4px 0 6px" } }, blocks, nowMarker),
      h("div", { style: { display: "flex", height: 16 } }, days)
    );
  }

  function ResCard(props) {
    var S = window.Store, x = props.res, me = props.me, now = props.now;
    var p = S.person(x.userId);
    var active = x.start <= now && now < x.end;
    var mine = x.userId === me;
    return h("div", { className: "card-soft", style: { padding: 14, display: "flex", gap: 12, alignItems: "center" } },
      h(Avatar, { person: p, size: 40 }),
      h("div", { style: { flex: 1, minWidth: 0 } },
        h("div", { style: { fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
          p ? p.name : "—",
          active ? h("span", { className: "pill pill-danger" }, h(Icon, { name: "clock", size: 11 }), "Em uso") : (mine ? h("span", { className: "pill pill-dark" }, "Sua") : null)
        ),
        h("div", { className: "muted", style: { fontSize: 13, marginTop: 2 } },
          Fmt.weekdayShort(x.start) + " " + Fmt.dm(x.start) + " " + Fmt.time(x.start) + " → " + Fmt.weekdayShort(x.end) + " " + Fmt.dm(x.end) + " " + Fmt.time(x.end)),
        active ? h("div", { style: { fontSize: 13, marginTop: 4, fontWeight: 700, color: "var(--ok-green)" } }, h(Icon, { name: "hourglass", size: 12, style: { verticalAlign: "-2px", marginRight: 4 } }), "Libera em " + Fmt.dur(x.end - now))
          : h("div", { style: { fontSize: 12.5, marginTop: 4 }, className: "muted" }, "Começa em " + Fmt.dur(x.start - now) + " · dura " + Fmt.dur(x.end - x.start))
      ),
      mine ? h("div", { style: { display: "flex", gap: 4, flex: "none" } },
        h("button", { className: "iconbtn", title: "Editar reserva", onClick: function () { props.onEdit(x); } }, h(Icon, { name: "pencil", size: 15 })),
        h("button", { className: "iconbtn", title: "Cancelar reserva", onClick: function () { if (confirm("Cancelar esta reserva?")) S.cancelReservation(x.id); } }, h(Icon, { name: "trash", size: 15 }))
      ) : null
    );
  }

  function VaralColumn(props) {
    var S = window.Store, v = props.varal, me = props.me, now = props.now;
    var all = S.reservationsFor(v.id);
    var active = all.filter(function (x) { return x.start <= now && now < x.end; });
    var upcoming = all.filter(function (x) { return x.start > now; });
    var free = active.length === 0;
    return h("div", { className: "card pad", style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
        h("div", { style: { fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" } }, v.name),
        free ? h("span", { className: "pill pill-ok" }, h(Icon, { name: "check", size: 12 }), "Livre agora")
             : h("span", { className: "pill pill-danger" }, h(Icon, { name: "clock", size: 12 }), "Ocupado")
      ),
      h(TimelineStrip, { varalId: v.id, now: now }),
      h("div", { className: "stack", style: { marginTop: 12 } },
        active.map(function (x) { return h(ResCard, { key: x.id, res: x, me: me, now: now, onEdit: props.onEdit }); }),
        upcoming.length === 0 && active.length === 0
          ? h("div", { className: "muted", style: { fontSize: 13.5, padding: "8px 2px" } }, "Nenhuma reserva. Bora pendurar roupa?")
          : null,
        upcoming.length ? h("div", { className: "eyebrow", style: { marginTop: 4, marginBottom: 2 } }, "Próximas") : null,
        upcoming.map(function (x) { return h(ResCard, { key: x.id, res: x, me: me, now: now, onEdit: props.onEdit }); })
      ),
      h("button", { className: "btn btn-ghost btn-sm", style: { marginTop: 14, alignSelf: "flex-start" }, onClick: function () { props.onReserve(v.id); } },
        h(Icon, { name: "plus", size: 15 }), "Reservar " + v.name.replace("Varal da ", ""))
    );
  }

  function ReservationForm(props) {
    var S = window.Store, me = props.me, editing = props.editing;
    var DUR = [{ h: 6, t: "6h" }, { h: 12, t: "12h" }, { h: 24, t: "24h (1 dia)" }, { h: 36, t: "36h" }, { h: 48, t: "48h (2 dias)" }];
    var initStart = editing ? editing.start : roundUp30(Date.now());
    var initDur = editing ? Math.max(1, Math.round((editing.end - editing.start) / H)) : 12;
    var st = useState(Fmt.toInputValue(initStart)); var startVal = st[0], setStart = st[1];
    var sd = useState(props.varalId || "esq"); var varalId = sd[0], setVaral = sd[1];
    var sh = useState(initDur); var durH = sh[0], setDur = sh[1];

    var startMs = Fmt.fromInputValue(startVal);
    var endMs = startMs != null ? startMs + durH * H : null;
    var check = startMs != null ? S.validateReservation(varalId, startMs, endMs, editing ? editing.id : null) : { ok: false, msg: "Escolha um horário." };
    var varal = S.VARAIS.find(function (x) { return x.id === varalId; });
    var minStart = Math.min(Date.now(), initStart);

    function submit() {
      var res = editing ? S.updateReservation(editing.id, varalId, startMs, endMs) : S.addReservation(varalId, me, startMs, endMs);
      if (res.ok) props.onClose();
    }

    return h("div", null,
      h("div", { className: "field" },
        h("label", null, "Qual varal?"),
        h("div", { className: "seg" }, S.VARAIS.map(function (v) {
          return h("button", { key: v.id, className: varalId === v.id ? "on on-dark" : "", onClick: function () { setVaral(v.id); } },
            h(Icon, { name: "shirt", size: 13 }), v.name.replace("Varal da ", ""));
        }))
      ),
      h("div", { className: "field" },
        h("label", null, "Começa quando?"),
        h("input", {
          className: "input", type: "datetime-local", value: startVal,
          min: Fmt.toInputValue(minStart), max: Fmt.toInputValue(Date.now() + 14 * DAY),
          onChange: function (e) { setStart(e.target.value); }
        })
      ),
      h("div", { className: "field" },
        h("label", null, "Por quanto tempo? (máx. 48h)"),
        h("div", { className: "seg", style: { display: "flex", flexWrap: "wrap" } }, DUR.map(function (d) {
          return h("button", { key: d.h, className: durH === d.h ? "on" : "", onClick: function () { setDur(d.h); } }, d.t);
        }))
      ),
      endMs != null ? h("div", {
        className: "card-soft", style: { padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }
      },
        h(Icon, { name: "clock", size: 16, className: "muted" }),
        h("div", { style: { fontSize: 14 } },
          h("strong", null, varal.name), " · ",
          Fmt.weekdayShort(startMs) + " " + Fmt.dm(startMs) + " " + Fmt.time(startMs),
          " → ",
          Fmt.weekdayShort(endMs) + " " + Fmt.dm(endMs) + " " + Fmt.time(endMs)
        )
      ) : null,
      !check.ok ? h("div", {
        className: "card-soft",
        style: { padding: "12px 14px", marginBottom: 14, background: "color-mix(in srgb, var(--m1-danger) 10%, white)", border: "1px solid color-mix(in srgb, var(--m1-danger) 30%, white)" }
      },
        h("div", { style: { display: "flex", gap: 9, alignItems: "flex-start", color: "#9c1326" } },
          h(Icon, { name: "alert-triangle", size: 16, style: { marginTop: 1, flex: "none" } }),
          h("div", { style: { fontSize: 13.5 } },
            h("strong", null, check.msg),
            check.conflicts ? check.conflicts.map(function (c) {
              var p = S.person(c.userId);
              return h("div", { key: c.id, style: { marginTop: 4 } }, "↳ " + (p ? p.name : "") + ": " + Fmt.weekdayShort(c.start) + " " + Fmt.time(c.start) + " → " + Fmt.weekdayShort(c.end) + " " + Fmt.time(c.end));
            }) : null
          )
        )
      ) : null,
      h("button", { className: "btn btn-primary btn-block", disabled: !check.ok, onClick: submit },
        h(Icon, { name: "check", size: 16 }), editing ? "Salvar alterações" : "Confirmar reserva")
    );
  }

  function Varal(props) {
    var S = window.Store, me = props.me;
    var t = useState(Date.now()); var now = t[0], setNow = t[1];
    var mo = useState(null); var modalData = mo[0], setModalData = mo[1];
    var sh = useState(false); var showHist = sh[0], setShowHist = sh[1];
    useEffect(function () {
      var id = setInterval(function () { setNow(Date.now()); }, 20000);
      return function () { clearInterval(id); };
    }, []);

    function openNew(id) { setModalData({ varalId: id, editing: null }); }
    function openEdit(res) { setModalData({ varalId: res.varal, editing: res }); }
    function close() { setModalData(null); }

    var past = S.allReservations().filter(function (x) { return x.end <= now; }).sort(function (a, b) { return b.end - a.end; }).slice(0, 12);

    return h("div", { className: "fade-up" },
      h("div", { className: "page-head", style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" } },
        h("div", null,
          h("div", { className: "eyebrow" }, h(Icon, { name: "wind", size: 14 }), "Dois varais · reserva de até 48h"),
          h("h1", { className: "page-title" }, "Fila do varal"),
          h("p", { className: "page-sub" }, "Reserve um varal por até 48h, com no máximo 2 semanas de antecedência. Dá pra ver o que tá ocupado e quanto falta pra liberar.")
        ),
        h("button", { className: "btn btn-dark", onClick: function () { openNew("esq"); } }, h(Icon, { name: "plus", size: 16 }), "Nova reserva")
      ),

      h(MonthCalendar, { now: now }),

      h("div", { className: "grid grid-2" },
        S.VARAIS.map(function (v) { return h(VaralColumn, { key: v.id, varal: v, me: me, now: now, onReserve: openNew, onEdit: openEdit }); })
      ),

      h("div", { style: { marginTop: 24 } },
        h("button", { className: "btn btn-ghost btn-sm", onClick: function () { setShowHist(!showHist); } },
          h(Icon, { name: "history", size: 15 }), showHist ? "Esconder histórico" : "Ver histórico de uso"),
        showHist ? h("div", { className: "card", style: { marginTop: 12, overflow: "hidden" } },
          past.length === 0 ? h("div", { className: "empty" }, h(Icon, { name: "history" }), h("div", null, "Sem histórico ainda.")) :
          past.map(function (x, idx) {
            var p = S.person(x.userId); var v = S.VARAIS.find(function (k) { return k.id === x.varal; });
            return h("div", { key: x.id, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: idx ? "1px solid var(--border-1)" : "none" } },
              h(Avatar, { person: p, size: 32 }),
              h("div", { style: { flex: 1, minWidth: 0 } },
                h("div", { style: { fontWeight: 600, fontSize: 14 } }, (p ? p.name : "—"), " · ", v ? v.name.replace("Varal da ", "Varal ") : ""),
                h("div", { className: "muted", style: { fontSize: 12.5 } }, Fmt.weekdayShort(x.start) + " " + Fmt.dm(x.start) + " " + Fmt.time(x.start) + " → " + Fmt.time(x.end))
              ),
              h("span", { className: "muted", style: { fontSize: 12 } }, Fmt.dur(x.end - x.start))
            );
          })
        ) : null
      ),

      h(Modal, { open: !!modalData, onClose: close, title: modalData && modalData.editing ? "Editar reserva" : "Nova reserva de varal" },
        modalData ? h(ReservationForm, { me: me, varalId: modalData.varalId, editing: modalData.editing, onClose: close }) : null
      )
    );
  }

  window.Varal = Varal;
})();
