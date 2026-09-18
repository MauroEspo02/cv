# Sito di Mauro Esposito — con pannello admin

Portfolio personale (HTML/CSS/JS, con miniature 3D via Three.js) con un
backend che gira su **Cloudflare Pages** (funzioni + database D1) ed espone i
contenuti tramite API, più un pannello `/admin` per modificarli senza toccare
il codice.

## Come funziona

- `public/index.html` — il sito pubblico. All'apertura carica i contenuti da
  `GET /api/content` e li disegna (bio, progetti, lavori, esperienze,
  formazione, competenze, link). Design, animazioni e miniature 3D sono
  invariati rispetto alla versione originale: cambia solo l'origine dei testi.
- `functions/` — il backend: funzioni Cloudflare Pages (API pubblica, login
  admin, API di modifica). Ogni file corrisponde a un indirizzo (es.
  `functions/api/content.js` risponde su `/api/content`).
- Il database **D1** di Cloudflare contiene tutti i contenuti modificabili
  (una riga per sezione: bio, progetti, lavori, ecc.), in italiano e inglese.
  È quello che il pannello admin legge e riscrive — **una volta pubblicato
  online, le modifiche fatte da `/admin` sono permanenti e non spariscono
  ai deploy successivi**.
- `data/content.json` + `migrations/0002_seed.sql` — il contenuto "di
  partenza" con cui si popola il database la prima volta. Dopo il primo
  avvio, il database diventa la versione vera e propria; questo file resta
  solo come riferimento/backup.
- `public/admin/` — il pannello di amministrazione (pagina di login +
  dashboard con un form per ogni sezione).

## Avviare il progetto in locale

Serve Node.js 18 o superiore.

```sh
npm install
cp .dev.vars.example .dev.vars
```

Apri `.dev.vars` e imposta:
- `ADMIN_PASSWORD` — la password per accedere a `/admin`.
- `SESSION_SECRET` — una stringa lunga e casuale (il comando per generarla è
  nel commento dentro `.dev.vars.example`).

La prima volta, crea e popola il database locale (simulato sul tuo computer,
separato da quello vero online):

```sh
npm run db:migrate:local
```

Poi avvia il sito:

```sh
npm run dev
```

- Sito pubblico: l'indirizzo mostrato nel terminale (di solito
  http://localhost:8788)
- Pannello admin: stesso indirizzo + `/admin`

## Pubblicare online su Cloudflare (con il tuo dominio)

Questi passaggi si fanno una volta sola, dalla dashboard di Cloudflare
(cloudflare.com, gratuita). Non serve alcun altro hosting: il tuo dominio,
il sito e il database vivono tutti su Cloudflare.

**1. Crea il database online**

Nella dashboard Cloudflare: `Storage & Databases` → `D1 SQL Database` →
`Create` → chiamalo `cv-db`. Dopo la creazione, apri la scheda `Console` del
database e incolla il contenuto di `migrations/0001_init.sql`, esegui, poi
fai lo stesso con `migrations/0002_seed.sql`. Questo crea le tabelle e le
riempie con i contenuti attuali del sito.

**2. Collega il repository GitHub**

`Workers & Pages` → `Create` → scheda `Pages` → `Connect to Git` → scegli il
repository `cv`. Nelle impostazioni di build:
- Comando di build: lascialo vuoto
- Cartella di output: `public`

**3. Collega il database al sito**

Nel progetto Pages appena creato: `Settings` → `Bindings` → `Add` →
`D1 database` → scegli `cv-db` e come nome del binding scrivi esattamente
`DB` (maiuscolo, deve corrispondere a `wrangler.toml`).

**4. Imposta la password**

Sempre in `Settings` → `Variables and Secrets` → aggiungi due segreti:
- `ADMIN_PASSWORD` — la password che vuoi usare per `/admin`
- `SESSION_SECRET` — una stringa lunga a caso (puoi generarla con lo stesso
  comando indicato in `.dev.vars.example`)

**5. Ripubblica** (dalla scheda `Deployments`, "Retry deployment") così il
sito riparte con database e password collegati.

**6. Collega il tuo dominio**

Nel progetto Pages: `Custom domains` → `Set up a custom domain` → segui le
istruzioni (se il dominio è già su Cloudflare è quasi automatico).

Da questo momento, ogni volta che io aggiorno il codice su GitHub, il sito
si ripubblica da solo in automatico.

## Modificare i contenuti

Una volta online, modifica tutto direttamente da `/admin` (bio, progetti,
lavori, esperienze, formazione, competenze, strumenti, link, testo animato
in home) — le modifiche sono subito vere e permanenti, non serve più
passare da me. Ogni sezione ha un pulsante "Salva sezione" indipendente.

Per cambiare invece design, animazioni, font o la struttura HTML, serve
modificare il codice (`public/index.html`) — per quello continua pure a
chiedere a me.

Le icone disponibili per link e strumenti sono un set fisso definito nel
codice (in `functions/_lib/validate.js` e in `public/admin/admin.js`); il
pannello le propone come menu a tendina. Lo stesso vale per le "forme" 3D dei
progetti (`jar`, `stage`, `passport`, `generic`): sono modelli scritti a mano
in `public/index.html`. Aggiungerne uno nuovo richiede una piccola modifica
al codice, non solo al contenuto.

## Sicurezza

- Cambia `ADMIN_PASSWORD` prima di mettere il sito online: quella
  nell'esempio è solo per lo sviluppo in locale.
- Il login ha un limite di tentativi (10 ogni 15 minuti per indirizzo IP).
- `/admin` non richiede altro che la password: è pensato per un solo
  amministratore (te). Non condividere la password.
