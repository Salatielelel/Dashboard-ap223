/* Ap. 223 — Aba 1: Escala de limpeza */
(function () {
  var React = window.React;
  var h = React.createElement;
  var B = window.Brand;
  var Icon = B.Icon, Avatar = B.Avatar, Fmt = B.Fmt, Modal = B.Modal;
  var useState = React.useState;

  function rangeLabel(rg) { return "Sáb " + Fmt.dm(rg.start) + " — Sex " + Fmt.dm(rg.end); }

  // ---- Editor: ajustar quem é responsável por cada semana ----
  function ScheduleEditor(props) {
    var S = window.Store, now = Date.now(), cur = S.weekIndexFor(now);
    var weeks = []; for (var i = 0; i < 8; i++) weeks.push(cur + i);
    return h("div", null,
      h("p", { className: "muted", style: { fontSize: 14, marginBottom: 16, lineHeight: 1.5 } },
        "Trocou a vez com alguém ou vai pular uma semana? Escolha quem lava em cada semana. Pra uma troca, é só ajustar as duas semanas."),
      h("div", { className: "stack" }, weeks.map(function (wi) {
        var r = S.resolveWeek(wi), rg = S.weekRange(wi);
        return h("div", { key: wi, className: "card-soft", style: { padding: "12px 14px" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" } },
            h("div", null,
              h("div", { style: { fontWeight: 700, fontSize: 14, fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.02em" } }, wi === cur ? "Esta semana" : rangeLabel(rg)),
              wi === cur ? h("div", { className: "muted", style: { fontSize: 12 } }, rangeLabel(rg)) : null
            ),
            r.overridden ? h("button", { className: "btn btn-ghost btn-sm", onClick: function () { S.setCleanOverride(wi, null); } }, h(Icon, { name: "rotate", size: 13 }), "Padrão") : null
          ),
          h("div", { className: "seg", style: { flexWrap: "wrap", display: "flex" } },
            S.PEOPLE.map(function (p) {
              var on = !r.skipped && r.person && r.person.id === p.id;
              return h("button", { key: p.id, className: on ? "on" : "", onClick: function () { S.setCleanOverride(wi, p.id === r.base.id ? null : p.id); } },
                h(Avatar, { person: p, size: 18 }), p.name);
            }),
            h("button", { className: r.skipped ? "on" : "", onClick: function () { S.setCleanOverride(wi, "none"); } }, h(Icon, { name: "ban", size: 13 }), "Pular")
          )
        );
      }))
    );
  }

  function Limpeza(props) {
    var me = props.me;
    var S = window.Store;
    var now = Date.now();
    var curWeek = S.weekIndexFor(now);
    var se = useState(false); var editOpen = se[0], setEdit = se[1];

    function row(wi) {
      var res = S.resolveWeek(wi);
      return { wi: wi, res: res, rg: S.weekRange(wi), done: S.isCleanDone(wi), mine: res.person && res.person.id === me };
    }

    var cur = row(curWeek);
    var upcoming = [];
    for (var i = 1; i <= 8; i++) upcoming.push(row(curWeek + i));

    var endOfWeek = new Date(cur.rg.end); endOfWeek.setHours(23, 59, 59, 999);
    var daysLeft = Math.max(0, Math.ceil((endOfWeek.getTime() - now) / 86400000));

    var order = S.CLEAN_ORDER.map(function (id) { return S.person(id); });
    var skipped = cur.res.skipped;
    var heroP = cur.res.person;
    var heroBg = skipped ? "var(--bg-surface)" : heroP.color;
    var heroInk = skipped ? "var(--fg-1)" : heroP.ink;

    return h("div", { className: "fade-up" },
      h("div", { className: "page-head", style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" } },
        h("div", null,
          h("div", { className: "eyebrow" }, h(Icon, { name: "calendar", size: 14 }), "Escala da casa"),
          h("h1", { className: "page-title" }, "Faxina da semana"),
          h("p", { className: "page-sub" }, "Toda semana é a vez de uma pessoa lavar a casa. A virada é no sábado. Trocou ou pulou? Dá pra ajustar.")
        ),
        h("button", { className: "btn btn-ghost", onClick: function () { setEdit(true); } }, h(Icon, { name: "pencil", size: 15 }), "Ajustar escala")
      ),

      // rotation legend
      h("div", { className: "card pad", style: { marginBottom: 16 } },
        h("div", { className: "eyebrow", style: { marginBottom: 12 } }, h(Icon, { name: "rotate", size: 13 }), "Ordem do rodízio"),
        h("div", { className: "row", style: { flexWrap: "wrap", rowGap: 8 } },
          order.map(function (p, idx) {
            return h(React.Fragment, { key: p.id },
              h("div", { className: "row", style: { gap: 8 } }, h(Avatar, { person: p, size: 30 }), h("span", { style: { fontWeight: 600 } }, p.name)),
              idx < order.length - 1 ? h(Icon, { name: "arrow-right", size: 16, className: "muted" }) : h(Icon, { name: "rotate", size: 15, className: "muted", style: { opacity: 0.5 } })
            );
          })
        )
      ),

      // current week hero
      h("div", { className: "card", style: { marginBottom: 22, overflow: "hidden", background: heroBg, color: heroInk, border: skipped ? "1px solid var(--border-1)" : "none" } },
        h("div", { style: { padding: 22 } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 } },
            h("div", null,
              h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                h("div", { style: { fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.12em", fontSize: 12, opacity: 0.85 } }, "Esta semana"),
                cur.res.overridden && !skipped ? h("span", { className: "pill", style: { background: "rgba(0,0,0,0.16)", color: heroInk, border: "none" } }, "Ajustada") : null
              ),
              h("div", { style: { fontFamily: "var(--font-display)", fontStyle: "italic", textTransform: "uppercase", fontWeight: 900, fontSize: "clamp(36px,8.5vw,64px)", lineHeight: 0.95, marginTop: 6 } }, skipped ? "Ninguém" : heroP.name),
              h("div", { style: { marginTop: 8, fontWeight: 500, opacity: 0.92 } }, rangeLabel(cur.rg))
            ),
            skipped ? h("div", { className: "avatar", style: { width: 72, height: 72, background: "var(--m1-cream-2)", color: "var(--fg-3)" } }, h(Icon, { name: "ban", size: 30 })) : h(Avatar, { person: heroP, size: 72 })
          ),
          skipped
            ? h("div", { style: { marginTop: 16, fontWeight: 500, fontSize: 14, color: "var(--fg-2)" } }, "Semana pulada — ninguém escalado. Ajuste se mudar de ideia.")
            : h("div", { style: { display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap", alignItems: "center" } },
                (cur.mine && !cur.done) ? h("span", { className: "pill", style: { background: "rgba(0,0,0,0.16)", color: heroInk, border: "none" } }, h(Icon, { name: "sparkles", size: 12 }), "É a sua vez!") : null,
                cur.done
                  ? h("span", { className: "pill", style: { background: "#fff", color: "var(--ok-green)", border: "none" } }, h(Icon, { name: "check", size: 13 }), "Faxina feita")
                  : h("div", { style: { fontWeight: 500, opacity: 0.92, fontSize: 14 } }, daysLeft <= 1 ? "Vira no fim de semana" : "Faltam " + daysLeft + " dias pra virar"),
                h("button", {
                  className: "btn btn-sm", style: { marginLeft: "auto", background: cur.done ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)", color: cur.done ? heroInk : "#1a1a1a" },
                  onClick: function () { S.setCleanDone(cur.wi, !cur.done); }
                }, h(Icon, { name: cur.done ? "rotate" : "check", size: 15 }), cur.done ? "Desmarcar" : "Marcar feita")
              )
        )
      ),

      // upcoming list
      h("div", { className: "eyebrow", style: { marginBottom: 12 } }, h(Icon, { name: "calendar-check", size: 13 }), "Próximas semanas"),
      h("div", { className: "card", style: { overflow: "hidden" } },
        upcoming.map(function (w, idx) {
          var sk = w.res.skipped;
          return h("div", { key: w.wi, style: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderTop: idx ? "1px solid var(--border-1)" : "none", background: (w.mine && !sk) ? "var(--m1-yellow-100)" : "transparent" } },
            sk ? h("div", { className: "avatar", style: { width: 38, height: 38, background: "var(--m1-cream-2)", color: "var(--fg-3)" } }, h(Icon, { name: "ban", size: 17 })) : h(Avatar, { person: w.res.person, size: 38 }),
            h("div", { style: { flex: 1, minWidth: 0 } },
              h("div", { style: { fontWeight: 600, fontSize: 15.5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
                sk ? h("span", { className: "muted" }, "Pulada") : w.res.person.name,
                w.mine && !sk ? h("span", { className: "pill pill-dark" }, "Você") : null,
                w.res.overridden && !sk ? h("span", { className: "pill" }, "Ajustada") : null
              ),
              h("div", { className: "muted", style: { fontSize: 13 } }, rangeLabel(w.rg))
            ),
            w.done ? h("span", { className: "pill pill-feita" }, h(Icon, { name: "check", size: 12 }), "Feita") : h("span", { className: "muted", style: { fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "0.06em" } }, idx === 0 ? "PRÓXIMA" : "")
          );
        })
      ),

      h(Modal, { open: editOpen, onClose: function () { setEdit(false); }, title: "Ajustar escala" },
        editOpen ? h(ScheduleEditor, { me: me }) : null)
    );
  }

  window.Limpeza = Limpeza;
})();
