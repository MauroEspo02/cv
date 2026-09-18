# Sito di Mauro Esposito — con pannello admin

Portfolio personale (HTML/CSS/JS, con miniature 3D via Three.js) con un backend
Express che espone i contenuti tramite API e un pannello `/admin` per
modificarli senza toccare il codice.

## Come funziona

- `public/index.html` — il sito pubblico. All'apertura carica i contenuti da
  `GET /api/content` e li disegna (bio, progetti, lavori, esperienze,
  formazione, competenze, link). Design, animazioni e miniature 3D sono
  invariati rispetto alla versione originale: cambia solo l'origine dei testi.
- `data/content.json` — tutti i contenuti modificabili, in italiano e inglese.
  È il file che il pannello admin legge e riscrive.
- `server/` — il backend Express: API pubblica, login admin, API di modifica.
- `public/admin/` — il pannello di amministrazione (pagina di login +
  dashboard con un form per ogni sezione).

## Avviare il progetto in locale

Serve Node.js 18 o superiore.

```sh
npm install
cp .env.example .env
```

Apri `.env` e imposta:
- `ADMIN_PASSWORD` — la password per accedere a `/admin`.
- `SESSION_SECRET` — una stringa lunga e casuale (il comando per generarla è
  nel commento dentro `.env.example`).

Poi avvia il server:

```sh
npm run dev
```

- Sito pubblico: http://localhost:3000
- Pannello admin: http://localhost:3000/admin

## Modificare i contenuti

Tutto quello che cambia spesso (bio, progetti, lavori, esperienze, formazione,
competenze, strumenti, link, il testo animato in home) si modifica da
`/admin`, senza toccare il codice. Ogni sezione ha un pulsante "Salva sezione"
indipendente.

Per cambiare invece design, animazioni, font o la struttura HTML, si modifica
`public/index.html` (CSS in `<style>`, logica in `<script>` in fondo al file).

Le icone disponibili per link e strumenti sono un set fisso definito nel
codice (in `server/validate.js` e in `public/admin/admin.js`); il pannello le
propone come menu a tendina. Lo stesso vale per le "forme" 3D dei progetti
(`jar`, `stage`, `passport`, `generic`): sono modelli scritti a mano in
`public/index.html`. Aggiungerne uno nuovo richiede una piccola modifica al
codice, non solo al contenuto.

## Un limite da tenere presente per la pubblicazione online

`data/content.json` è un file sul disco del server. Le modifiche fatte da
`/admin` scrivono su quel file, non tornano automaticamente su GitHub. Per
funzionare in produzione, il sito va ospitato su una piattaforma con disco
persistente (una VPS, un container con volume, ecc.): su una piattaforma
"serverless" pura le modifiche fatte dal pannello rischiano di sparire al
prossimo deploy. Ne parliamo insieme quando arriviamo alla pubblicazione.

## Sicurezza

- Cambia `ADMIN_PASSWORD` prima di mettere il sito online: quella
  nell'esempio è solo per lo sviluppo in locale.
- Il login ha un limite di tentativi (10 ogni 15 minuti per indirizzo IP).
- `/admin` non richiede altro che la password: è pensato per un solo
  amministratore (te). Non condividere la password.
