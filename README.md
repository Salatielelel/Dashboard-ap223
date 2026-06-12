# Ap. 223 — Site de organização do apartamento

App interno usado por **3 moradores** (Salatiel, Amanda, Luis) para organizar a casa.
Três abas: **Faxina** (escala de limpeza), **Varal** (reserva dos dois varais) e **Fórum** (mural de recados).

> Este repositório é um **app funcional** (não é só um mock): ele roda hoje abrindo o `index.html`.
> A única coisa que falta para uso real entre os 3 celulares é **sincronização entre dispositivos** —
> hoje os dados ficam salvos localmente em cada aparelho (`localStorage`). A seção
> **[“Colocar online com sincronização”](#colocar-online-com-sincronização)** explica exatamente o que trocar.

---

## Como rodar localmente

Não há build. São arquivos estáticos (HTML/CSS/JS) + React via CDN. Basta servir a pasta:

```bash
# qualquer servidor estático serve. Exemplos:
npx serve .
# ou
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Abrir o `index.html` direto pelo `file://` também funciona,
mas alguns navegadores bloqueiam fontes locais — prefira servir via HTTP.

---

## Stack / arquitetura

- **React 18.3.1 (UMD, via unpkg)** carregado por `<script>` no `index.html`.
- **Sem JSX e sem build step.** Os arquivos `app/*.jsx` são JavaScript comum que usa
  `React.createElement` (apelidado de `h`). A extensão `.jsx` é só nome — são carregados como
  `<script>` normais, **não precisam de Babel**.
- Cada arquivo é um IIFE que publica seus componentes em `window` (ex.: `window.Limpeza`,
  `window.Varal`, `window.Forum`, `window.Store`, `window.Brand`).
- **Estado** centralizado em `app/store.js` (`window.Store`) com persistência em `localStorage`
  e um pub/sub que re-renderiza o app. Sincroniza entre abas do mesmo navegador via evento `storage`.
- **Estilo**: tokens/variáveis CSS herdados do design system Mais1.Café
  (`styles/colors_and_type.css`), com override para um tema **minimalista cinza/branco/preto**
  no topo de `app/app.css`. Fontes da família **Grift** (headlines em peso Black/900).
- **Ícones**: paths do Lucide embutidos inline em `app/Brand.jsx` (sem dependência de rede).

### Estrutura de arquivos

```
index.html                     # carrega React, CSS e os scripts da app
styles/
  colors_and_type.css          # tokens do design system (cores, espaçamento, sombras)
  fonts/                        # Grift (.ttf) + LEMON MILK (usada só no logo "223")
app/
  app.css                      # tema minimalista (override de tokens) + estilos da app
  store.js                     # ESTADO + REGRAS + PERSISTÊNCIA  ← ponto de integração do backend
  Brand.jsx                    # logo "223", avatares, ícones, modal, switch, utils de data
  App.jsx                      # shell: login por PIN + navegação (abas / bottom nav)
  Limpeza.jsx                  # Aba 1 — escala de faxina
  Varal.jsx                    # Aba 2 — reserva de varal + calendário do mês
  Forum.jsx                    # Aba 3 — fórum
```

---

## Modelo de dados (`localStorage`)

Duas chaves:

- `ap223:session` → string com o id da pessoa logada **neste aparelho** (`"salatiel" | "luis" | "amanda"`), ou `""`.
- `ap223:v1` → JSON com todo o estado compartilhado:

```jsonc
{
  "pins":   { "salatiel": "1234", "luis": "0000", "amanda": "9999" }, // PIN de 4 dígitos por pessoa
  "cleanDone": { "-1": true, "0": true },                            // { [weekIndex]: true } faxinas marcadas como feitas
  "cleanOverrides": { "3": "luis", "5": "none" },                    // ajustes manuais: { [weekIndex]: personId | "none" (pulada) }
  "reservations": [
    {
      "id": "abc123",
      "varal": "esq",            // "esq" | "dir"
      "userId": "salatiel",
      "start": 1781000000000,    // epoch ms
      "end":   1781086400000,    // epoch ms
      "createdAt": 1780999999999
    }
  ],
  "posts": [
    {
      "id": "p1",
      "cat": "reclamacao",       // "reclamacao" | "sugestao" | "comentario"
      "title": "Louça na pia",
      "body": "Texto...",
      "authorId": "amanda",      // null quando anônimo
      "anon": false,
      "createdAt": 1780000000000,
      "likes": ["luis"],         // array de userIds
      "resolved": false,
      "comments": [
        { "id": "c1", "body": "ok", "authorId": "luis", "anon": false, "createdAt": 1780000000001 }
      ]
    }
  ]
}
```

### Constantes de domínio (em `app/store.js`)

- `PEOPLE` — os 3 moradores e suas cores:
  - Salatiel → **verde** `#1F9D57` (texto branco)
  - Luis → **azul** `#2563EB` (texto branco)
  - Amanda → **amarelo** `#FFA400` (texto preto)
- `VARAIS` — `{ esq: "Varal da Esquerda", dir: "Varal da Direita" }`
- `CATEGORIES` — Reclamação (vermelho), Sugestão (amarelo), Comentário (preto)

---

## Regras de negócio

### Faxina (rodízio semanal)
- Ordem fixa: **Salatiel → Luis → Amanda**, repetindo (`CLEAN_ORDER`).
- A semana **vira no sábado**. Âncora: **13/06/2026 = Salatiel** (`CLEAN_ANCHOR`).
- `weekIndexFor(date)` = `floor((inícioDoDia(date) − âncora) / 7 dias)`. Funciona pra trás e pra frente.
- `personForWeek(weekIndex)` usa `((weekIndex % 3) + 3) % 3` sobre `CLEAN_ORDER`.
- Cada semana pode ser marcada como **feita** (tag verde) — só visual/acompanhamento.
- **Ajustes manuais** (`cleanOverrides`): dá pra reatribuir quem lava em qualquer semana (trocas
  entre pessoas) ou **pular** uma semana (`"none"`), pelo botão "Ajustar escala". `resolveWeek(i)`
  resolve override → senão usa o rodízio padrão; "Voltar ao padrão" remove o override daquela semana.
  **Pular desloca o rodízio**: cada semana pulada empurra as semanas seguintes uma posição pra frente
  (`shiftedPersonForWeek` desconta `skipsBefore(i)` do índice). Reatribuir uma pessoa NÃO desloca — só fixa aquela semana.

### Varal (reservas)
- Dois varais independentes.
- Duração **máxima de 48h** por reserva (`MAX_DURATION`).
- Antecedência **máxima de 2 semanas** (`MAX_AHEAD = 14 dias`).
- **Sem sobreposição** no mesmo varal — `validateReservation()` detecta conflito e o formulário
  mostra a reserva conflitante e bloqueia o envio. Ao **editar**, ignora a própria reserva.
- Cada um pode **editar** e **cancelar** as próprias reservas.
- A tela mostra: calendário do mês (visual, 2 faixas por dia — cima = Esquerda, baixo = Direita,
  preenchidas **proporcionalmente à hora** dentro de cada dia), faixa de 7 dias por varal,
  reserva ativa com **contagem regressiva** (“Libera em…”), próximas e histórico.

### Fórum
- Categorias: Reclamação / Sugestão / Comentário.
- Post pode ser **anônimo** (decidido no momento de publicar; quando anônimo, `authorId` vira `null`).
- Curtir (toggle por usuário), comentar (também pode ser anônimo) e marcar como **resolvido**.
- Só o autor (de post não-anônimo) pode apagar o próprio post.

---

## API do Store (`window.Store`)

A UI **nunca** mexe no `localStorage` direto — só chama métodos do Store, que persistem e emitem update.
Principais:

```
subscribe(fn) → unsub          // re-render on change
getState()                     // estado bruto
person(id)
getSession() / setSession(id)
hasPin(id) / setPin(id,pin) / checkPin(id,pin)
weekIndexFor(date) / personForWeek(i) / weekRange(i)
setCleanDone(i,bool) / isCleanDone(i)
reservationsFor(varalId) / allReservations()
validateReservation(varalId,start,end,ignoreId?)
addReservation(varalId,userId,start,end)
updateReservation(id,varalId,start,end)
cancelReservation(id)
addPost(p) / deletePost(id) / toggleLike(postId,userId) / toggleResolved(postId) / addComment(postId,c)
```

---

## Colocar online com sincronização

**Todo o ponto de integração está em `app/store.js`.** A persistência hoje é:

```js
function load()    { /* lê localStorage 'ap223:v1' */ }
function persist() { /* grava localStorage 'ap223:v1' */ }
function commit()  { persist(); emit(); }   // chamado por toda mutação
```

Para sincronizar entre os 3 dispositivos, substitua essa camada por um backend em tempo real.
Recomendação (mais simples, plano grátis dá e sobra para 3 pessoas): **Firebase Realtime Database**
ou **Supabase**. Passos sugeridos para o desenvolvedor:

1. Criar o projeto no provedor e obter as credenciais (config do Firebase ou URL+anon key do Supabase).
2. No `load()`: ler o documento/linha único que guarda o objeto de estado (mesmo formato do JSON acima).
3. No `commit()`: **escrever** o estado no backend (em vez de, ou além de, `localStorage`).
4. Assinar mudanças remotas (onValue / realtime subscription) e, ao chegar update, atualizar o
   `state` local e chamar `emit()` — exatamente como o listener de `storage` já faz hoje
   (`window.addEventListener("storage", …)`). Pode manter `localStorage` como cache offline.
5. **Concorrência**: como são só 3 pessoas e ações pequenas, escrever o objeto inteiro funciona;
   para evitar “last write wins” em arrays (reservas/posts), o ideal é modelar reservas e posts
   como coleções/listas no banco e dar push/patch por item em vez de regravar o objeto todo.

> A UI inteira reage ao `emit()` do Store, então **nenhum componente precisa mudar** — só a
> implementação de `load`/`persist`/`commit` e a assinatura de updates remotos.

### Autenticação / PIN (importante)
O PIN de 4 dígitos hoje é só uma trava leve **local** (guardada em `localStorage`), não é segurança real.
Se o app for ficar exposto na internet, mova a identidade para a autenticação do backend
(ex.: Firebase Auth / Supabase Auth) e use as regras de segurança do provedor para proteger os dados.
Para uso só entre os 3, com link não divulgado, o esquema atual de PIN já resolve o dia a dia.

### Deploy
Sendo arquivos estáticos, sobe em qualquer host: Vercel, Netlify, GitHub Pages, Cloudflare Pages,
Firebase Hosting, ou um Nginx no seu servidor apontando para a pasta. As fontes (`styles/fonts/`)
e o CSS precisam ir junto. React vem da CDN (unpkg) — se quiser 100% offline/local, baixe os
3 scripts do React e referencie localmente no `index.html`.

---

## Assets / fontes
- **Grift** (`styles/fonts/Grift-*.ttf`) — fonte principal (headlines no peso Black/900, corpo no Regular).
- **LEMON MILK** — usada **somente** no logo “223” (mantém a cara de adesivo de pista).
- Ícones: Lucide (paths inline em `app/Brand.jsx`).
- O “223” é desenhado em CSS (texto com contorno duplo), não é imagem.
