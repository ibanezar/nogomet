# nogomet
Prevozi otrok na nogomet

Spletna stran za dogovarjanje o prevozih na treninge (Rečica ob Savinji → Mozirje,
ponedeljek in četrtek). Starši se vpišejo za vožnjo tja/nazaj, vpis vidijo vsi.

## Kako deluje

- `public/index.html` – stran (statični HTML/CSS/JS).
- `src/worker.js` – Cloudflare Worker, ki postreže stran in ponuja API
  (`GET/POST /api/week`, `GET/POST/DELETE /api/location`) za shranjevanje
  urnika in žive lokacije v Workers KV, tako da vsi starši vidijo iste vpise.
- `src/auth.js` – preprosta PIN zaščita: brez pravilnega PIN-a stran ni
  dostopna (glej spodaj).
- `wrangler.toml` – konfiguracija Workerja, že povezana z obstoječim KV
  imenskim prostorom `nogomet-prevozi-WEEKS`.

## Postavitev (deploy)

Potreben je Cloudflare račun z dostopom do zgoraj omenjenega KV imenskega
prostora.

```bash
npm install
npx wrangler login      # enkratna prijava v Cloudflare račun
npx wrangler deploy
```

### Nastavi PIN za dostop

Stran je zasebna – brez PIN-a se prikaže samo prijavni obrazec (in stran ni
indeksirana v Googlu, `noindex`). PIN nastaviš kot Cloudflare secret:

```bash
npx wrangler secret put ACCESS_PIN
```

Vnesi želen PIN/geslo (priporočeno vsaj 6 znakov, ni omejitve samo na
številke). Po nastavitvi secret-a znova poženi `npx wrangler deploy`, da
se sprememba upošteva. Če `ACCESS_PIN` ni nastavljen, je stran dostopna
brez PIN-a (privzeto obnašanje v lokalnem razvoju).

Po uspešni postavitvi Wrangler izpiše URL Workerja (npr.
`https://nogomet-prevozi.<subdomain>.workers.dev`), kjer je stran dostopna.

## Lokalni razvoj

```bash
npx wrangler dev
```
