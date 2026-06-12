/* Ap. 223 — Aba 3: Fórum da casa */
(function () {
  var React = window.React;
  var h = React.createElement;
  var B = window.Brand;
  var Icon = B.Icon, Avatar = B.Avatar, Fmt = B.Fmt, Modal = B.Modal, Switch = B.Switch;
  var useState = React.useState;

  function timeAgo(ms) {
    var s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return "agora";
    var m = Math.floor(s / 60); if (m < 60) return "há " + m + " min";
    var hr = Math.floor(m / 60); if (hr < 24) return "há " + hr + "h";
    var d = Math.floor(hr / 24); if (d < 7) return "há " + d + (d === 1 ? " dia" : " dias");
    return Fmt.dm(ms);
  }
  function cat(id) { return window.Store.CATEGORIES.find(function (c) { return c.id === id; }); }

  function CatPill(props) {
    var c = cat(props.id);
    var dark = props.id === "comentario";
    return h("span", {
      className: "pill", style: {
        background: props.id === "sugestao" ? "var(--m1-yellow)" : (dark ? "var(--m1-ink)" : "color-mix(in srgb, " + c.color + " 14%, white)"),
        color: props.id === "sugestao" ? "#000" : (dark ? "var(--m1-cream)" : c.color),
        border: "none"
      }
    }, h(Icon, { name: c.icon, size: 12 }), c.name);
  }

  function Author(props) {
    var S = window.Store;
    if (props.anon || !props.authorId) {
      return h("div", { className: "row", style: { gap: 8 } },
        h("div", { className: "avatar", style: { width: 30, height: 30, background: "var(--m1-cream-2)", color: "var(--fg-3)" } }, h(Icon, { name: "user", size: 15 })),
        h("span", { style: { fontWeight: 600, color: "var(--fg-2)" } }, "Anônimo"));
    }
    var p = S.person(props.authorId);
    return h("div", { className: "row", style: { gap: 8 } }, h(Avatar, { person: p, size: 30 }), h("span", { style: { fontWeight: 600 } }, p ? p.name : "—"));
  }

  function Composer(props) {
    // shared anon + text composer for comments
    var st = useState(""); var text = st[0], setText = st[1];
    var sa = useState(false); var anon = sa[0], setAnon = sa[1];
    function send() {
      if (!text.trim()) return;
      props.onSend(text, anon); setText(""); setAnon(false);
    }
    return h("div", { style: { marginTop: 12 } },
      h("div", { style: { display: "flex", gap: 8, alignItems: "flex-end" } },
        h("textarea", {
          className: "textarea", style: { minHeight: 44, flex: 1 }, placeholder: "Escreve um comentário...",
          value: text, onChange: function (e) { setText(e.target.value); }
        }),
        h("button", { className: "btn btn-dark btn-sm", style: { flex: "none", height: 44 }, onClick: send, disabled: !text.trim() }, h(Icon, { name: "send", size: 15 }))
      ),
      h("div", { style: { marginTop: 8 } }, h(Switch, { checked: anon, onChange: setAnon, label: "Comentar como anônimo" }))
    );
  }

  function PostCard(props) {
    var S = window.Store, post = props.post, me = props.me;
    var sc = useState(false); var open = sc[0], setOpen = sc[1];
    var liked = post.likes.indexOf(me) >= 0;
    var mine = !post.anon && post.authorId === me;

    return h("div", { className: "card pad", style: { opacity: post.resolved ? 0.82 : 1 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" } },
        h(Author, { anon: post.anon, authorId: post.authorId }),
        h("div", { className: "row", style: { gap: 8 } },
          post.resolved ? h("span", { className: "pill pill-ok" }, h(Icon, { name: "check", size: 12 }), "Resolvido") : null,
          h(CatPill, { id: post.cat }),
          h("span", { className: "muted", style: { fontSize: 12 } }, timeAgo(post.createdAt))
        )
      ),
      post.title ? h("h3", { style: { margin: "12px 0 4px", fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 18, letterSpacing: "0.01em", lineHeight: 1.1 } }, post.title) : null,
      post.body ? h("p", { style: { margin: post.title ? "0" : "12px 0 0", color: "var(--fg-2)", lineHeight: 1.55, whiteSpace: "pre-wrap" } }, post.body) : null,

      h("div", { className: "divider" }),
      h("div", { className: "row", style: { gap: 6, flexWrap: "wrap" } },
        h("button", {
          className: "btn btn-sm", style: { background: liked ? "var(--m1-ink)" : "var(--m1-cream-2)", color: liked ? "var(--m1-cream)" : "var(--fg-2)" },
          onClick: function () { S.toggleLike(post.id, me); }
        }, h(Icon, { name: "heart", size: 15, fill: liked }), post.likes.length || "Curtir"),
        h("button", { className: "btn btn-sm btn-ghost", onClick: function () { setOpen(!open); } },
          h(Icon, { name: "message-circle", size: 15 }), post.comments.length ? (post.comments.length + (post.comments.length === 1 ? " comentário" : " comentários")) : "Comentar"),
        h("button", {
          className: "btn btn-sm btn-ghost", style: post.resolved ? { color: "var(--m1-success)" } : null,
          onClick: function () { S.toggleResolved(post.id); }
        }, h(Icon, { name: "circle-check", size: 15 }), post.resolved ? "Reabrir" : "Resolver"),
        mine ? h("button", { className: "iconbtn", style: { marginLeft: "auto" }, title: "Apagar", onClick: function () { if (confirm("Apagar este post?")) S.deletePost(post.id); } }, h(Icon, { name: "trash", size: 15 })) : null
      ),

      open ? h("div", { style: { marginTop: 6 } },
        post.comments.length ? h("div", { className: "stack", style: { marginTop: 8 } }, post.comments.map(function (c) {
          return h("div", { key: c.id, className: "card-soft", style: { padding: "10px 12px" } },
            h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
              h(Author, { anon: c.anon, authorId: c.authorId }),
              h("span", { className: "muted", style: { fontSize: 11.5 } }, timeAgo(c.createdAt))
            ),
            h("div", { style: { fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" } }, c.body)
          );
        })) : null,
        h(Composer, { onSend: function (text, anon) { S.addComment(post.id, { body: text, authorId: me, anon: anon }); setOpen(true); } })
      ) : null
    );
  }

  function NewPost(props) {
    var S = window.Store, me = props.me;
    var sc = useState("comentario"); var c = sc[0], setC = sc[1];
    var stt = useState(""); var title = stt[0], setTitle = stt[1];
    var sb = useState(""); var body = sb[0], setBody = sb[1];
    var sa = useState(false); var anon = sa[0], setAnon = sa[1];
    var can = body.trim().length > 0 || title.trim().length > 0;
    function submit() {
      if (!can) return;
      S.addPost({ cat: c, title: title, body: body, authorId: me, anon: anon });
      props.onClose();
    }
    return h("div", null,
      h("div", { className: "field" },
        h("label", null, "Tipo"),
        h("div", { className: "seg" }, S.CATEGORIES.map(function (cc) {
          return h("button", { key: cc.id, className: c === cc.id ? "on on-dark" : "", onClick: function () { setC(cc.id); } }, h(Icon, { name: cc.icon, size: 13 }), cc.name);
        }))
      ),
      h("div", { className: "field" },
        h("label", null, "Título (opcional)"),
        h("input", { className: "input", placeholder: "Resumo em uma linha", value: title, onChange: function (e) { setTitle(e.target.value); }, maxLength: 80 })
      ),
      h("div", { className: "field" },
        h("label", null, "Mensagem"),
        h("textarea", { className: "textarea", placeholder: "Manda o que tá pensando...", value: body, onChange: function (e) { setBody(e.target.value); } })
      ),
      h("div", { className: "card-soft", style: { padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("div", null,
          h("div", { style: { fontWeight: 600, fontSize: 14 } }, anon ? "Vai postar anônimo" : "Vai postar como " + (S.person(me) ? S.person(me).name : "")),
          h("div", { className: "muted", style: { fontSize: 12.5 } }, "Você decide agora se aparece seu nome.")
        ),
        h(Switch, { checked: anon, onChange: setAnon, label: anon ? "Anônimo" : "" })
      ),
      h("button", { className: "btn btn-primary btn-block", disabled: !can, onClick: submit }, h(Icon, { name: "send", size: 15 }), "Publicar")
    );
  }

  function Forum(props) {
    var S = window.Store, me = props.me;
    var sf = useState("all"); var filter = sf[0], setFilter = sf[1];
    var sh = useState(false); var hideResolved = sh[0], setHide = sh[1];
    var so = useState(false); var modal = so[0], setModal = so[1];

    var posts = S.getState().posts.filter(function (p) {
      if (filter !== "all" && p.cat !== filter) return false;
      if (hideResolved && p.resolved) return false;
      return true;
    });

    return h("div", { className: "fade-up" },
      h("div", { className: "page-head", style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" } },
        h("div", null,
          h("div", { className: "eyebrow" }, h(Icon, { name: "message-square", size: 14 }), "Mural do Ap. 223"),
          h("h1", { className: "page-title" }, "Fórum da casa"),
          h("p", { className: "page-sub" }, "Reclamação, sugestão ou só um recado. Comente nos posts, curta e marque como resolvido. Pode ser com seu nome ou anônimo — você escolhe na hora.")
        ),
        h("button", { className: "btn btn-dark", onClick: function () { setModal(true); } }, h(Icon, { name: "plus", size: 16 }), "Novo post")
      ),

      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 } },
        h("div", { className: "seg" },
          h("button", { className: filter === "all" ? "on on-dark" : "", onClick: function () { setFilter("all"); } }, "Todos"),
          S.CATEGORIES.map(function (cc) {
            return h("button", { key: cc.id, className: filter === cc.id ? "on on-dark" : "", onClick: function () { setFilter(cc.id); } }, h(Icon, { name: cc.icon, size: 13 }), cc.name);
          })
        ),
        h(Switch, { checked: hideResolved, onChange: setHide, label: "Ocultar resolvidos" })
      ),

      posts.length === 0
        ? h("div", { className: "card pad" }, h("div", { className: "empty" }, h(Icon, { name: "message-square" }), h("div", { style: { fontWeight: 600, marginBottom: 4 } }, "Nada por aqui ainda."), h("div", null, "Tá esperando o quê pra mandar o primeiro recado?")))
        : h("div", { className: "stack" }, posts.map(function (p) { return h(PostCard, { key: p.id, post: p, me: me }); })),

      h(Modal, { open: modal, onClose: function () { setModal(false); }, title: "Novo post" },
        modal ? h(NewPost, { me: me, onClose: function () { setModal(false); } }) : null)
    );
  }

  window.Forum = Forum;
})();
