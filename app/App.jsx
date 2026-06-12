/* Ap. 223 — App shell: identity (PIN) + nav */
(function () {
  var React = window.React, ReactDOM = window.ReactDOM;
  var h = React.createElement;
  var B = window.Brand;
  var Icon = B.Icon, Logo = B.Logo, Avatar = B.Avatar, Modal = B.Modal;
  var useState = React.useState, useEffect = React.useEffect;
  var S = window.Store;

  // ---------- PIN pad ----------
  function PinPad(props) {
    var v = props.value || "";
    function press(d) { if (v.length < 4) props.onChange(v + d); }
    function back() { props.onChange(v.slice(0, -1)); }
    useEffect(function () {
      function onKey(e) {
        if (e.key >= "0" && e.key <= "9") press(e.key);
        else if (e.key === "Backspace") back();
      }
      window.addEventListener("keydown", onKey);
      return function () { window.removeEventListener("keydown", onKey); };
    });
    var dots = [0, 1, 2, 3].map(function (i) {
      return h("div", { key: i, className: "pin-dot" + (i < v.length ? " filled" : "") + (props.error ? " err" : "") });
    });
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
    return h("div", { className: "pinpad" },
      h("div", { className: "pin-dots" }, dots),
      props.error ? h("div", { className: "pin-err" }, props.error) : null,
      h("div", { className: "keypad" }, keys.map(function (k, i) {
        if (k === "") return h("div", { key: i });
        if (k === "back") return h("button", { key: i, className: "key key-fn", onClick: back, "aria-label": "Apagar" }, h(Icon, { name: "x", size: 20 }));
        return h("button", { key: i, className: "key", onClick: function () { press(k); } }, k);
      }))
    );
  }

  // ---------- Login flow ----------
  function Login(props) {
    var sp = useState(null); var pid = sp[0], setPid = sp[1];
    var sv = useState(""); var pin = sv[0], setPin = sv[1];
    var sc = useState(""); var confirm = sc[0], setConfirm = sc[1];
    var se = useState(""); var err = se[0], setErr = se[1];
    var sstep = useState("set1"); var step = sstep[0], setStep = sstep[1];

    var person = pid ? S.person(pid) : null;
    var isNew = person ? !S.hasPin(person.id) : false;

    function choose(id) {
      setPid(id); setPin(""); setConfirm(""); setErr("");
      setStep(S.hasPin(id) ? "enter" : "set1");
    }
    function onChange(val) {
      setErr("");
      if (step === "enter") {
        setPin(val);
        if (val.length === 4) {
          if (S.checkPin(pid, val)) { S.setSession(pid); }
          else { setErr("PIN errado. Tenta de novo."); setTimeout(function () { setPin(""); }, 400); }
        }
      } else if (step === "set1") {
        setPin(val);
        if (val.length === 4) { setConfirm(""); setStep("set2"); }
      } else {
        setConfirm(val);
        if (val.length === 4) {
          if (val === pin) { S.setPin(pid, pin); S.setSession(pid); }
          else { setErr("Os PINs não bateram."); setTimeout(function () { setConfirm(""); setPin(""); setStep("set1"); }, 600); }
        }
      }
    }

    if (!person) {
      return h("div", { className: "login" },
        h("div", { className: "login-card fade-up" },
          h(Logo, { size: 56, style: { justifyContent: "center", marginBottom: 6 } }),
          h("div", { className: "login-tag" }, "Organização do apê"),
          h("h2", { className: "login-q" }, "Quem é você?"),
          h("div", { className: "who" }, S.PEOPLE.map(function (p) {
            return h("button", { key: p.id, className: "who-btn", onClick: function () { choose(p.id); } },
              h(Avatar, { person: p, size: 56 }),
              h("span", { className: "who-name" }, p.name),
              S.hasPin(p.id) ? h(Icon, { name: "lock", size: 13, className: "muted" }) : h("span", { className: "who-new" }, "criar PIN"));
          }))
        )
      );
    }

    var title = step === "enter" ? "Oi, " + person.name + "!" : (step === "set1" ? "Crie um PIN" : "Confirme o PIN");
    var sub = step === "enter" ? "Digite seu PIN de 4 dígitos" : (step === "set1" ? "Escolha 4 dígitos pra você" : "Digite de novo pra confirmar");
    var val = step === "set2" ? confirm : pin;
    return h("div", { className: "login" },
      h("div", { className: "login-card fade-up" },
        h("button", { className: "login-back", onClick: function () { setPid(null); } }, h(Icon, { name: "arrow-right", size: 16, style: { transform: "rotate(180deg)" } }), "Voltar"),
        h(Avatar, { person: person, size: 64, style: { margin: "0 auto" } }),
        h("h2", { className: "login-q", style: { marginTop: 14 } }, title),
        h("div", { className: "login-sub" }, sub),
        h(PinPad, { value: val, onChange: onChange, error: err })
      )
    );
  }

  // ---------- Account modal ----------
  function Account(props) {
    var me = props.me; var p = S.person(me);
    return h("div", null,
      h("div", { className: "row", style: { gap: 12, marginBottom: 16 } },
        h(Avatar, { person: p, size: 52 }),
        h("div", null,
          h("div", { style: { fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 20 } }, p.name),
          h("div", { className: "muted", style: { fontSize: 13 } }, "Logado neste aparelho"))
      ),
      h("div", { className: "card-soft", style: { padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" } },
        h(Icon, { name: "info", size: 16, className: "muted", style: { marginTop: 1, flex: "none" } }),
        h("div", { style: { fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 } }, "Por enquanto os dados ficam salvos neste aparelho. Pra sincronizar entre os celulares dos 3, dá pra ligar uma nuvem depois.")
      ),
      h("button", { className: "btn btn-ghost btn-block", onClick: function () { S.setSession(null); props.onClose(); } },
        h(Icon, { name: "log-out", size: 16 }), "Trocar de usuário")
    );
  }

  // ---------- App ----------
  var TABS = [
    { id: "limpeza", label: "Faxina", icon: "calendar" },
    { id: "varal", label: "Varal", icon: "wind" },
    { id: "forum", label: "Fórum", icon: "message-square" }
  ];

  function App() {
    var sver = useState(0); var setVer = sver[1];
    var stab = useState("limpeza"); var tab = stab[0], setTab = stab[1];
    var sacc = useState(false); var accOpen = sacc[0], setAcc = sacc[1];

    useEffect(function () {
      var unsub = S.subscribe(function () { setVer(function (n) { return n + 1; }); });
      return unsub;
    }, []);

    var me = S.getSession();
    if (!me) return h(Login, null);

    var p = S.person(me);
    var view = tab === "limpeza" ? h(window.Limpeza, { me: me })
      : tab === "varal" ? h(window.Varal, { me: me })
        : h(window.Forum, { me: me });

    return h("div", null,
      h("header", { className: "appbar" },
        h("div", { className: "appbar-inner" },
          h(Logo, { size: 28 }),
          h("div", { className: "spacer" }),
          h("nav", { className: "tabs tabs-wrap" }, TABS.map(function (t) {
            return h("button", { key: t.id, className: "tab" + (tab === t.id ? " active" : ""), onClick: function () { setTab(t.id); } },
              h(Icon, { name: t.icon, size: 16 }), t.label);
          })),
          h("button", { className: "userchip", onClick: function () { setAcc(true); } },
            h(Avatar, { person: p, size: 28 }),
            h("span", { className: "name" }, p.name),
            h(Icon, { name: "chevron-right", size: 15, style: { transform: "rotate(90deg)" } }))
        ),
        h("div", { className: "appbar-strip" })
      ),

      h("main", { className: "main" }, view),

      h("nav", { className: "botnav" }, TABS.map(function (t) {
        return h("button", { key: t.id, className: tab === t.id ? "active" : "", onClick: function () { setTab(t.id); } },
          h(Icon, { name: t.icon, size: 22 }), t.label);
      })),

      h(Modal, { open: accOpen, onClose: function () { setAcc(false); }, title: "Conta" },
        accOpen ? h(Account, { me: me, onClose: function () { setAcc(false); } }) : null)
    );
  }

  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(h(App, null));
})();
