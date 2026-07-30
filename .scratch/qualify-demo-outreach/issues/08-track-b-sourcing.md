Type: research
Status: resolved

## Question

What data source or method can find Track B's actual target businesses in Brazil — larger, operationally complex, multi-location or higher-revenue businesses (chains, car dealerships, real estate agencies, insurance brokers, equipment dealers) — given the current Overpass/OpenStreetMap sourcing is built for "local business near X, category Y" and has no signal for company size, location count, or operational complexity?

## Context

Surfaced during ticket 04 (Track B targeting). Track A's sourcing (Overpass import, see `backend/app/scrapers.py`) works well for its own target (any no-website local business) but has no way to filter for "bigger/more complex operation," which is Track B's actual qualifying signal.

Candidate directions worth investigating against primary sources:
- Brazil's public company registry (Receita Federal / CNPJ data) — filterable by company size classification (porte), possibly by number of registered establishments (multi-location signal)
- Google Places (New) data already planned for Track A enrichment — does its business data expose signals like multiple location results under one brand, review-count-as-scale-proxy, or price-level, that could double as a Track B scale filter without a second integration
- Whether a manually curated seed list (chains/dealerships Gabriel already knows of locally) is more practical than automated sourcing for Track B's initial low-volume, high-touch approach, given Track B is discovery-call-first and doesn't need volume the way Track A does

## Answer

**Short version: don't build a Track B sourcing pipeline yet. Use a manually curated seed list. Neither candidate data source cleanly solves "find operationally complex Brazilian businesses" as a queryable filter, and Track B's own shape (low-volume, discovery-call-first, high-touch) doesn't need one.**

### 1. Receita Federal CNPJ open data — has the right fields, but it's a bulk-ETL project, not a free API

Brazil's CNPJ registry is published as free, public, no-API-key bulk files at Receita Federal's own file server (`arquivos.receitafederal.gov.br`, mirrored at [dados.gov.br's CNPJ dataset listing](https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj)) and documented in Receita's official field layout PDF, ["Novo Layout para os Dados Abertos do CNPJ"](https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf) (fetched and read directly for this research). Confirmed from that primary source:

- **`EMPRESAS` table has a `PORTE DA EMPRESA` field** with codes `00 – Não Informado`, `01 – Micro Empresa`, `03 – Empresa de Pequeno Porte`, `05 – Demais`. This is a real, queryable size classification — but it's derived from Simples Nacional/EPP revenue-threshold eligibility, not an actual revenue figure. `05 – Demais` is a catch-all for "not micro/small," so it can't distinguish a mid-size regional dealership from a national chain; it's only useful as a coarse include/exclude filter, not a ranking signal.
- **`ESTABELECIMENTOS` table has `IDENTIFICADOR MATRIZ/FILIAL`** (`1 – Matriz`, `2 – Filial`). This is the genuine multi-location signal: group establishment records by the 8-digit `CNPJ BÁSICO` (the company root shared by all its branches) and count `FILIAL` rows to get a real branch count per company — exactly what "chain with multiple locations" needs.
- The same `ESTABELECIMENTOS` table also carries `CNAE FISCAL PRINCIPAL` (economic activity code), address, and municípios/UF — so in principle you could filter directly for target verticals (e.g. CNAE 45.xx for vehicle dealers, 68.xx for real estate, 66.22-3 for insurance brokers) crossed with `porte=05` and `filial count > 1`.

**Accessibility reality check for a solo dev:** this is not a REST API you query on demand. It's monthly bulk CSV/ZIP dumps of the entire national registry (tens of GB decompressed — a well-known community ETL, [aphonsoar/Receita_Federal_do_Brasil_-_Dados_Publicos_CNPJ](https://github.com/aphonsoar/Receita_Federal_do_Brasil_-_Dados_Publicos_CNPJ), cited ~17GB decompressed back in 2021 and larger now), meant to be downloaded and loaded into a local database (Postgres/DuckDB) before you can join `Empresas` + `Estabelecimentos` and filter. It's genuinely free and open, but it's a multi-day data-engineering task (download, decompress, load, join, index), not a quick integration — and it returns a national dump you'd still need to geographically/vertically filter yourself. Third-party wrappers (ReceitaWS, BrasilAPI, Minha Receita, Casa dos Dados) expose this same data as single-CNPJ lookups, which is good for *enriching a CNPJ you already have* but none of the free tiers offer a "search/filter across the whole registry" endpoint — that capability only exists once you hold the bulk data yourself (or pay a commercial list-building service like Casa dos Dados/Speedio/Econodata, which already did this ETL).

### 2. Google Places API (New) — no chain/multi-location field, and the closest proxies sit behind pricier SKUs

Checked the official Places API (New) docs ([Place Data Fields](https://developers.google.com/maps/documentation/places/web-service/data-fields), [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search), [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)) against what `backend/app/enrichment.py` already integrates (Text Search → `places.id`, then Details with a minimal field mask of `nationalPhoneNumber,websiteUri` — deliberately kept on the cheap Essentials SKU per that file's own comment):

- **No field exposes "this is a chain" or "this brand has N locations."** Text Search *can* return multiple results and paginate (`nextPageToken`, up to 60 results across pages) — so searching a brand name nationally would surface multiple branches if they're all indexed on Google — but there's no structured field for it; you'd have to search per brand name and count/dedupe results yourself, which only works if you already know the brand name (i.e., it enriches a seed list, it doesn't discover one).
- `businessStatus` (OPERATIONAL/CLOSED_TEMPORARILY/CLOSED_PERMANENTLY) is on the **Pro** SKU tier, not Essentials.
- `rating`, `userRatingCount`, `priceLevel` — the fields that could act as loose "scale" proxies — all sit on the **Enterprise** SKU tier ($20–35/1000 requests depending on endpoint), a step up from what the app currently pays for. Review count is a weak proxy for size/complexity anyway (correlates more with foot traffic/consumer visibility than with number of locations or back-office complexity).
- Net: Places (New) is good for *enriching* a known lead (which the app already plans) but has nothing that functions as a discovery-time "is this business big/complex" filter without adding cost and still not answering the actual question.

### 3. Recommendation: manual seed list, not automated sourcing

Given Track B is explicitly low-volume and discovery-call-first (per ticket 04 and the context here) rather than the volume play Track A is:

- **A manually curated seed list is the practical choice for launch.** Gabriel's own local knowledge of car dealerships, real estate agencies, insurance brokers, and equipment dealers in his target metro areas will out-qualify anything either data source can filter for, because "operationally complex enough to need custom software" is a judgment call neither `porte`/`filial`-count nor Places fields actually capture — they're both proxies for size, not for "this business would benefit from AI-automation consulting." A human who already knows which dealership group has three lots and a clunky Excel-based CRM is strictly better signal than any registry query.
- **If/when Track B needs to scale past what personal knowledge covers**, the CNPJ bulk-data route (CNAE + porte=05 + filial-count>1, geographically filtered) is the one with real signal, but it's worth deferring until there's evidence the manual list is the bottleneck — it's a multi-day ETL investment for a track that, by design, doesn't need volume yet.
- **Google Places (New) stays useful as the enrichment step it's already planned for** (pulling phone/website/address once a seed name is chosen) — just not as the sourcing/discovery mechanism for Track B.

## Comments

Created 2026-07-29, `/research` subagent dispatched same day.
