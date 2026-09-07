# Security

How PDFFlow is designed, what it protects against, and what still needs doing
before it faces the public internet.

---

## Install these files

| File in this folder | Goes to | What it does |
| --- | --- | --- |
| `next.config.mjs` | project root, **replace** | Security headers + CSP. Keeps the existing `canvas: false` webpack alias. |
| `render.ts` | `src/lib/pdf/render.ts`, **replace** | Hardens PDF.js against malicious documents. |
| `SECURITY.md` | project root, new file | This document. |

Then restart the dev server. Verify the headers are live:

```bash
curl -sI http://localhost:3000 | grep -i -E "content-security|x-frame|referrer|permissions"
```

All four should appear. If the site renders but the browser console shows CSP
violations, read "Tuning the CSP" below rather than deleting the policy.

---

## The threat model

The design choice that matters most: **for browser-based tools there is no
upload endpoint and no storage.** Files are read into the page, edited with
`pdf-lib`, and handed back as a download.

This removes the attack surface that most online PDF services carry — server-side
parsing of hostile files, cross-tenant data leakage, and exposed storage buckets.
There is no server-held copy of anyone's document to steal, because it was never
sent.

What that does **not** remove is described next.

---

## The one real risk that survives: PDF.js

A PDF is untrusted input, and it is parsed in the visitor's browser. PDF.js has
had serious vulnerabilities — most notably **CVE-2024-4367**, where a crafted
font could execute arbitrary JavaScript in the page. That is a full
cross-site-scripting primitive delivered by a document.

The replacement `render.ts` sets `isEvalSupported: false`, which closes that
specific class of bug, along with `enableXfa: false` and options that stop a
document initiating network requests.

**This is not a substitute for staying current.** Check for PDF.js advisories and
update `pdfjs-dist` promptly:

```bash
npm audit
npm outdated pdfjs-dist
```

The CSP is the second layer here: even if a parser bug executed, `connect-src`
and `default-src 'self'` prevent the result being sent anywhere.

---

## What the headers do

- **Content-Security-Policy** — restricts where code, styles, images and network
  connections may come from. The main defence against injected scripts.
- **X-Frame-Options: DENY** and **frame-ancestors 'none'** — the app cannot be
  embedded in an iframe, so it cannot be clickjacked.
- **X-Content-Type-Options: nosniff** — the browser will not reinterpret a file
  as a different type.
- **Referrer-Policy** — the full URL is not leaked to other origins.
- **Permissions-Policy** — camera, microphone, geolocation and payment APIs are
  switched off; the app never uses them.
- **Strict-Transport-Security** — forces HTTPS for two years. Production only,
  because sending it from `localhost` would pin your machine to HTTPS on port 3000
  and break local development in a way that is annoying to undo.
- **Cross-Origin-Opener-Policy** — isolates the browsing context from popups.

### Tuning the CSP

The policy allows `'unsafe-inline'` for scripts, which weakens it. Next.js
injects an inline hydration bootstrap, and removing the allowance requires
per-request nonces via middleware. If you want strict CSP, add a `middleware.ts`
that generates a nonce, and pass it through `next/script`. Until then the policy
is meaningfully useful but not maximal — be honest with yourself about that.

`'unsafe-eval'` is development only. It is absent from production builds.

If you connect a conversion backend, set `NEXT_PUBLIC_PDF_API_URL` **before**
building. The config reads it and adds that origin to `connect-src`
automatically; otherwise the browser will block the request.

---

## Before you deploy

- [ ] `npm install && npm run build` succeeds. Code that has never compiled
      cannot be called secure.
- [ ] `npm audit` shows no high or critical advisories.
- [ ] Headers verified with the `curl` command above, on the deployed URL.
- [ ] HTTPS enforced. Vercel, Netlify and Cloudflare Pages do this by default.
- [ ] "Log in" and "Get started" copy removed or disabled — **authentication is
      not implemented.** There are no accounts, so there is nothing to breach,
      but do not imply otherwise to visitors.
- [ ] Pricing page does not collect payment. There is no payment processor
      wired up. Never take card details without one.
- [ ] `/privacy` reviewed against what you actually deploy.

---

## If you connect a backend

Setting `NEXT_PUBLIC_PDF_API_URL` changes the risk profile completely. Files
begin leaving the user's device, and you inherit everything the current design
avoids. At minimum, the service needs:

- Request size limits and processing timeouts.
- Rate limiting per IP and per account.
- Parsing in a sandbox — a container or subprocess without network access,
  because the conversion tools will be parsing hostile documents server-side.
- Immediate deletion after the job finishes, with a real retention policy.
- Authentication, if the tools are not public.

**Update `/privacy` in the same change.** Its current claims — that documents are
never transmitted — are accurate today and become false the moment a backend is
connected. Shipping the backend without revising that page would be a false
statement to your users about their data.

---

## Reporting a vulnerability

Email `hello@pdfflow.app`. Please do not open a public issue for a security
problem before it is fixed.

---

## Scope of this document

This was written by reasoning about the code, not by running a scanner or a
penetration test against a live deployment. It is a solid baseline, not a
security audit. If you are handling other people's confidential documents
commercially, commission a real one.
