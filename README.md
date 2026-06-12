# Ap. 223 — Organizador de Apartamento Compartilhado

App web para moradores de apartamento organizarem a rotina da casa. Desenvolvido para uso real entre 3 pessoas, com sincronização em tempo real entre dispositivos.

**→ [Ver app ao vivo](https://223.up.railway.app)**

---

## Funcionalidades

**Faxina** — Escala de limpeza semanal com rodízio automático entre os moradores. Permite marcar semanas como feitas, fazer trocas e pular semanas (com deslocamento automático do rodízio).

**Varal** — Reserva de dois varais independentes com calendário visual. Detecta conflitos de horário em tempo real, limita reservas a 48h e até 2 semanas de antecedência.

**Fórum** — Mural de recados com categorias (Reclamação, Sugestão, Comentário). Suporta curtidas, comentários, marcar como resolvido e posts anônimos.

---

## Stack

- **React 18** via CDN — sem build, sem bundler
- **JavaScript vanilla** com `React.createElement` (sem JSX compilado)
- **CSS customizado** com design system e fonte Grift
- **Supabase** — banco de dados e sincronização em tempo real
- **Railway** — hospedagem

---

## Como replicar para o seu apartamento

### 1. Clone o repositório

```bash
git clone https://github.com/Salatielelel/Dashboard-ap223.git
cd Dashboard-ap223
```

### 2. Crie um projeto no Supabase

Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito. No **SQL Editor**, rode:

```sql
create table ap223_state (
  id integer primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into ap223_state (id, data) values (1, '{}'::jsonb);

alter table ap223_state enable row level security;
create policy "allow all" on ap223_state for all using (true) with check (true);
alter publication supabase_realtime add table ap223_state;
```

### 3. Configure as credenciais

Em `app/store.js`, substitua as duas primeiras variáveis:

```js
var SUPABASE_URL = "https://SEU_PROJETO.supabase.co";
var SUPABASE_KEY = "sua_publishable_key";
```

Essas informações ficam em **Settings → API Keys** no painel do Supabase.

### 4. Ajuste os moradores

Ainda em `app/store.js`, edite o array `PEOPLE` com os nomes, cores e a constante `CLEAN_ANCHOR` com a data de início do rodízio:

```js
var PEOPLE = [
  { id: "morador1", name: "Nome 1", short: "N1", color: "#1F9D57", ink: "#FFFFFF" },
  { id: "morador2", name: "Nome 2", short: "N2", color: "#2563EB", ink: "#FFFFFF" },
  { id: "morador3", name: "Nome 3", short: "N3", color: "#FFA400", ink: "#1A1A1A" }
];

var CLEAN_ANCHOR = new Date(2026, 5, 13); // data em que morador1 começa
```

### 5. Hospede

Qualquer host de arquivos estáticos funciona. Para o Railway:

1. Suba o projeto para um repositório no GitHub
2. Conecte o repositório no [railway.app](https://railway.app)
3. O Railway detecta o `package.json` e faz o deploy automaticamente
4. Gere um domínio em **Settings → Networking → Generate Domain**

---

## Rodando localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000`.
