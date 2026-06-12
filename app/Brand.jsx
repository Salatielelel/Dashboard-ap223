/* Ap. 223 — Brand atoms: Icon, Logo, Avatar, Modal, Switch + date utils */
(function () {
  var React = window.React;
  var h = React.createElement;

  // ---- Lucide path data (inlined; no CDN DOM-mutation) ----
  var ICONS = {
    "calendar": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    "calendar-check": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    "shirt": '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    "wind": '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
    "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    "trash": '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "pencil": '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "sparkles": '<path d="M9.94 14.06A2 2 0 0 0 8.5 12.6l-6.1-1.6a.5.5 0 0 1 0-.96L8.5 8.44A2 2 0 0 0 9.94 7L11.5.9a.5.5 0 0 1 .96 0L14.06 7a2 2 0 0 0 1.44 1.44l6.1 1.58a.5.5 0 0 1 0 .96l-6.1 1.58a2 2 0 0 0-1.44 1.44L12.46 19.6a.5.5 0 0 1-.96 0z"/>',
    "hourglass": '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
    "ban": '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    "send": '<path d="M14.54 21.69a.5.5 0 0 0 .93-.02l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.02.94l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
    "corner-down-right": '<polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
    "rotate": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "flag": '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'
  };

  function Icon(props) {
    var name = props.name;
    var size = props.size || 20;
    return h("svg", {
      width: size, height: size, viewBox: "0 0 24 24",
      fill: name === "heart" && props.fill ? "currentColor" : "none",
      stroke: "currentColor", strokeWidth: props.strokeWidth || 1.75,
      strokeLinecap: "round", strokeLinejoin: "round",
      className: props.className,
      style: props.style,
      dangerouslySetInnerHTML: { __html: ICONS[name] || "" }
    });
  }

  // ---- Logo ----
  function Logo(props) {
    var num = props.size || 30;
    var ap = props.apSize || Math.round(num * 0.46);
    return h("div", { className: "logo" + (props.ondark ? " logo--ondark" : ""), style: props.style },
      props.hideAp ? null : h("div", { className: "logo-ap", style: { fontSize: ap } }, "AP."),
      h("div", { className: "logo-num", style: { fontSize: num } },
        h("span", { className: "l-back" }, "223"),
        h("span", { className: "l-mid" }, "223"),
        h("span", { className: "l-front" }, "223")
      )
    );
  }

  // ---- Avatar ----
  function Avatar(props) {
    var p = props.person;
    var size = props.size || 34;
    if (!p) return h("div", { className: "avatar", style: { width: size, height: size, background: "var(--m1-cream-2)" } });
    var label = (props.full ? p.name : (p.name[0])).toUpperCase();
    if (props.full) label = p.name;
    return h("div", {
      className: "avatar", title: p.name,
      style: {
        width: size, height: size, background: p.color, color: p.ink,
        fontSize: props.full ? Math.max(11, size * 0.34) : size * 0.46,
        padding: props.full ? "0 12px" : 0, width: props.full ? "auto" : size,
        textTransform: "uppercase", borderRadius: props.full ? 999 : "50%"
      }
    }, label);
  }

  // ---- Modal ----
  function Modal(props) {
    if (!props.open) return null;
    return h("div", {
      className: "scrim",
      onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose && props.onClose(); }
    }, h("div", { className: "sheet" },
      h("div", { className: "sheet-head" },
        h("div", { className: "sheet-title" }, props.title),
        h("button", { className: "iconbtn", onClick: props.onClose, "aria-label": "Fechar" }, h(Icon, { name: "x" }))
      ),
      props.children
    ));
  }

  // ---- Switch ----
  function Switch(props) {
    return h("div", {
      className: "switch" + (props.checked ? " on" : ""), role: "switch",
      "aria-checked": props.checked, tabIndex: 0,
      onClick: function () { props.onChange(!props.checked); },
      onKeyDown: function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); props.onChange(!props.checked); } }
    }, h("span", { className: "track" }, h("span", { className: "knob" })), props.label ? h("span", null, props.label) : null);
  }

  // ---- date / time utilities ----
  var DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var DIAS_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  var Fmt = {
    dm: function (d) { d = new Date(d); return d.getDate() + "/" + (d.getMonth() + 1); },
    dmShort: function (d) { d = new Date(d); return d.getDate() + " " + MESES[d.getMonth()]; },
    weekdayShort: function (d) { return DIAS[new Date(d).getDay()]; },
    weekdayLong: function (d) { return DIAS_LONG[new Date(d).getDay()]; },
    time: function (d) { d = new Date(d); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); },
    dayMonth: function (d) { d = new Date(d); return d.getDate() + " de " + ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][d.getMonth()]; },
    full: function (d) { d = new Date(d); return DIAS[d.getDay()] + ", " + d.getDate() + "/" + (d.getMonth() + 1) + " " + Fmt.time(d); },
    dur: function (ms) {
      if (ms < 0) ms = 0;
      var totalMin = Math.round(ms / 60000);
      var dys = Math.floor(totalMin / 1440); totalMin -= dys * 1440;
      var hrs = Math.floor(totalMin / 60); var min = totalMin - hrs * 60;
      var parts = [];
      if (dys) parts.push(dys + "d");
      if (hrs) parts.push(hrs + "h");
      if (min || (!dys && !hrs)) parts.push(min + "min");
      return parts.join(" ");
    }
  };

  // datetime-local <-> ms helpers (local timezone)
  Fmt.toInputValue = function (ms) {
    var d = new Date(ms);
    var pad = function (n) { return ("0" + n).slice(-2); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  };
  Fmt.fromInputValue = function (v) { return v ? new Date(v).getTime() : null; };

  window.Brand = { Icon: Icon, Logo: Logo, Avatar: Avatar, Modal: Modal, Switch: Switch, Fmt: Fmt };
})();
