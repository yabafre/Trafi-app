---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: completed
inputDocuments:
  - '_bmad-output/analysis/brainstorming-session-2026-01-08.md'
date: 2026-01-09
author: Alex
---

# Product Brief: trafi-app

## Executive Summary

**Trafi** is an open-source e-commerce platform for developers that combines headless commerce flexibility with built-in profit automation. Unlike traditional headless solutions that deliver technical freedom but leave merchants struggling with conversion, Trafi provides a closed-loop system: instrumentation → diagnosis → action → statistical proof → automatic rollback.

**Core thesis:** Building modern headless commerce imposes integration, operations, and growth complexity that developers and small teams underestimate—then pay dearly in maintenance burden and lost conversions. Trafi attacks this at the root by standardizing integration patterns and embedding conversion optimization directly into the platform.

**Target:** Independent merchants and SMBs without dedicated growth teams, suffering from rising customer acquisition costs and the hidden "post-launch tax" of headless architecture.

**Positioning:** *"The open-source Shopify alternative for developers—with built-in profit automation."*

---

## Core Vision

### Problem Statement

Building modern headless e-commerce imposes a hidden complexity tax that developers and small teams consistently underestimate. What begins as "technical freedom" becomes an ongoing burden of integration maintenance, operational complexity, and conversion optimization that most teams lack the expertise or bandwidth to handle properly.

### Problem Impact

**For Developers:**
- **Integration sprawl**: Connecting payment providers, email services, analytics, and CMS creates an exponentially complex dependency graph
- **Post-launch maintenance**: Microservices upgrades, fragile checkout flows, and performance/SEO stability demand constant attention
- **Checkout fragility**: Unexpected fees, missing payment methods, forced account creation, and lengthy flows translate directly to abandonment and "it doesn't convert" support tickets

**For Indie/SMB Merchants:**
- "Technically modern" stores that convert poorly, making every acquisition euro harder to recoup
- Headless complexity perceived as 2-3x more costly than headed alternatives (Shopify) without clear business payoff
- The fundamental opportunity cost: stores remain perpetual engineering projects instead of becoming profit machines

### Why Existing Solutions Fall Short

Current headless platforms give developers the freedom to implement, but not the integrated system to transform that freedom into measurable business results. They solve the "build" problem while ignoring the "grow" problem:

| Solution | What It Provides | What It Lacks |
|----------|------------------|---------------|
| **Medusa/Saleor** | Headless flexibility, open-source | Profit automation, conversion tooling |
| **Shopify** | Conversion optimization, ecosystem | Developer flexibility, self-hosting |
| **Composable stacks** | Ultimate customization | Coordination cost, integrated instrumentation |

The gap: no platform delivers **headless developer experience + closed-loop profit automation** as a unified product.

### Proposed Solution

Trafi provides a complete e-commerce platform built on a **monorepo architecture** (NestJS API + Next.js Dashboard) with **forkable storefront templates** and a **type-safe SDK/CLI** that serves as a "productive bridge" between backend and frontend.

The core innovation is the **Trafi Profit Engine**—an integrated system that:
1. **Instruments** the entire customer journey automatically
2. **Diagnoses** conversion drop-offs and profit leaks
3. **Proposes actions** via feature flags and playbooks (merchant approves)
4. **Measures** statistical impact with confidence intervals
5. **Rolls back** automatically if metrics decline

**The "aha" moment:** `npx create-trafi-app` delivers a functional store with a Profit Engine dashboard that immediately shows: "Here's your checkout drop-off, here are 2 high-impact actions, and here's the proof/rollback if performance drops."

### Key Differentiators

| Differentiator | Description |
|----------------|-------------|
| **Closed-loop profit automation** | Not just analytics—instrumentation → diagnosis → action → proof → rollback |
| **SDK as productive bridge** | Type-safe integration patterns that keep ecosystem coherent as API evolves |
| **Opinionated simplicity** | Works out-of-box (Linear-style), customizable when needed |
| **"Autopilot proposes, merchant approves"** | Inverted flow reduces friction while maintaining control |
| **First-Party Ledger** | Privacy-first data collection with exportable mini-CDP (no vendor lock-in) |
| **5-minute store** | From `create-trafi-app` to functional, instrumented store in 5 minutes |

---

## Target Users

### Primary Users

#### Persona 1: Technical Builder (Dev Freelance / Agency / Startup Tech Lead)

**Profile:** "Thomas" — Développeur fullstack freelance ou Tech Lead en agence/startup, 3-10 ans d'expérience, spécialisé React/Node.js. Évalue régulièrement des solutions e-commerce pour ses clients ou ses projets internes.

**Context & Motivation:**
- Cherche une stack moderne qui s'intègre naturellement à son workflow (TypeScript, monorepo, Prisma)
- Veut livrer du "clé en main" rapidement sans sacrifier la qualité technique
- Refuse les solutions "boîte noire" où il perd le contrôle

**Current Pain:**
- Medusa/Saleor : setup complexe, documentation fragmentée, trop de config avant d'avoir quelque chose qui marche
- Shopify : pas de contrôle, vendor lock-in, impossible de self-host
- Solutions custom : temps de dev explosif, maintenance lourde

**What Makes Trafi Win:**
- SDK type-safe + CLI qui accélère le setup
- Documentation complète et exemples prêts à l'emploi
- Système de customisation clair pour étendre les features métier
- Propriété totale : peut déployer sur n'importe quel VPS
- Argument commercial : "Je te livre une boutique avec Profit Engine intégré"

**Success Metric:** Livrer un projet e-commerce complet en 2-3 semaines au lieu de 2-3 mois, avec un client qui ne rappelle pas pour des bugs checkout.

---

#### Persona 2: Business Operator (Merchant — Independent to Mid-Market)

**Tier A: Independent / Small SMB**

**Profile:** "Sophie" — Créatrice de marque D2C, gère sa boutique seule ou avec 1-2 personnes. CA 100K-2M€. Actuellement sur Shopify ou WooCommerce.

**Trigger:** Frustration avec les frais Shopify (2-3% + apps payantes), veut plus de contrôle sur ses données clients et sa marge.

---

**Tier B: Established SMB**

**Profile:** "Marc" — E-commerce Manager d'une PME mode/lifestyle, équipe de 5-15 personnes, CA 2-10M€. Stack actuelle : PrestaShop vieillissant ou Shopify Plus.

**Trigger:** Limites de la plateforme actuelle (performance, intégrations custom), coût croissant des solutions enterprise, besoin de features CRO sans embaucher un growth team.

---

**Tier C: Mid-Market**

**Profile:** "Nadia" — Directrice E-commerce d'une entreprise établie, CA 20-50M€, équipe de 15-40 personnes. Stack : Magento legacy, Salesforce Commerce, ou Shopify Plus sous-utilisé.

**Trigger:** Veut réduire la dépendance à une équipe merchandising/marketing coûteuse, cherche l'automatisation intelligente (Profit Engine), refuse le vendor lock-in des solutions enterprise.

---

**Common Merchant Motivations:**
- Outils Profit Engine qui remplacent une équipe growth
- Liberté de commencer en Cloud Managed puis migrer en self-hosted
- Data ownership : First-Party Ledger exportable, pas de lock-in
- ROI visible : dashboard qui prouve l'impact des optimisations

**Success Metric:** Voir le taux de conversion checkout augmenter de 15-30% dans les 90 premiers jours, sans embaucher.

### Secondary Users

| User | Role | Interaction with Trafi |
|------|------|------------------------|
| **Agency Account Manager** | Gère la relation client post-livraison | Utilise le dashboard Profit Engine pour démontrer la valeur |
| **Marketing/Growth Freelance** | Conseille le marchand sur l'acquisition | Exploite First-Party Ledger et Conversion Autopilot |
| **CFO / Finance** | Valide les investissements tech | Reçoit les rapports ROI du Profit Engine |

### User Journey

**Developer Journey:**
1. **Discovery:** Recherche "headless e-commerce TypeScript" ou "Shopify alternative open-source"
2. **Evaluation:** `npx create-trafi-app --demo`, explore la doc, vérifie la DX
3. **Adoption:** Premier projet client, utilise le template Next.js
4. **Expansion:** Customise, contribue, recommande à d'autres devs
5. **Advocacy:** Devient référent Trafi dans sa communauté

**Merchant Journey:**
1. **Discovery:** Recommandation du dev/agence OU recherche "alternative Shopify sans commission"
2. **Onboarding:** Démarre en Cloud Managed (5 minutes), importe son catalogue
3. **Value Moment:** Voit le premier diagnostic Profit Engine avec actions concrètes
4. **Growth:** Active Conversion Autopilot, observe les gains de conversion
5. **Maturity:** Optionnellement migre en self-hosted pour contrôle total

**Decision Flow:**
```
CTO/Tech Lead évalue → Recommande avec arguments DX + ownership
                    → Marchand valide sur ROI Profit Engine + no lock-in
                    → Adoption (Cloud Managed ou Self-Hosted)
```

---

## Success Metrics

### User Success Metrics

#### Developer Success (Thomas)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time-to-first-store (demo)** | 5-10 minutes | Time from `npx create-trafi-app` to functional demo with seed products + checkout sandbox |
| **Time-to-prod (configured)** | 1 day | Store with real catalog + payments + shipping configured |
| **Time-to-prod (custom)** | 1-2 weeks | Production-ready store with custom design + SEO + business rules |
| **Project time reduction** | 3 months → 3-4 weeks | Compared to custom stack or Medusa for standard headless commerce |
| **Maintenance reduction** | -50% | Monthly post-go-live support hours and checkout incidents |
| **SDK reuse rate** | 30% of devs | Developers using SDK on 2nd project or template |
| **Module/hook activation** | 10-15% of devs | Developers activating at least 1 custom module or hook |

#### Merchant Success (Profit Engine)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Conversion lift (MVP)** | +10-20% relative | Uplift on targeted segment within 30-60 days |
| **Time-to-value: Diagnostic** | Day 1 | First actionable insight (e.g., payment step drop-off) |
| **Time-to-value: Action** | Week 1 | First proposed optimization action |
| **Time-to-value: Proof** | Month 1 | First statistical proof or invalidation with auto-rollback |
| **Actions approved/month** | 2-4 per active store | PMF signal for Autopilot engagement |
| **High-impact acceptance rate** | ≥30% | Suggestions marked "High impact / Low risk" that get approved |
| **ROI visibility** | Delta € + hours saved | Attributable incremental revenue vs baseline + time savings |

**North Star Metric:** *Profit per visitor* or *Gross margin per session* — not conversion alone, to avoid optimizations that increase sales but destroy margin.

### Business Objectives

#### 6 Months Post-MVP (Traction Proof)

| Category | Metric | Target |
|----------|--------|--------|
| **Dev Adoption** | Stores created (CLI) | 1,000-3,000 |
| **Dev Activation** | Active stores (≥1 order/week or >1k sessions/month) | 200-500 |
| **Merchant Traction** | Stores with Profit Engine activated | 50-100 |
| **Value Proof** | Stores with measured uplift + auto-rollback | 20-40 |
| **Monetization** | Cloud Managed paying customers | 20-50 |
| **Revenue** | MRR | 5k-20k € |
| **Volume** | Cumulative GMV | 0.5-3M € |

#### 18 Months (Real Business)

| Category | Metric | Target |
|----------|--------|--------|
| **Revenue** | MRR | 50k-150k € |
| **Growth** | MoM MRR growth | 10-20% |
| **Customers** | Paying merchants | 300-1,000 |
| **Retention** | Monthly churn | <5% (ideally 2-3.5%) |
| **Unit Economics** | LTV:CAC | 3-5:1 |
| **Volume** | Cumulative GMV | 25-100M € |
| **Attach Rate** | Profit Engine usage (% active stores) | 30-50% |

### Key Performance Indicators

#### Leading Indicators (Predict Success)

| KPI | Signal |
|-----|--------|
| CLI installs / week | Developer awareness & interest |
| Demo → Active store conversion | Onboarding effectiveness |
| Time to first Profit Engine action | Value discovery speed |
| Suggestion acceptance rate | Autopilot trust & relevance |

#### Lagging Indicators (Prove Success)

| KPI | Signal |
|-----|--------|
| Net Revenue Retention (NRR) | Expansion vs churn |
| Profit Engine attach rate | Core value prop validation |
| Developer contribution rate | Ecosystem health |
| Marketplace GMV | Flywheel activation |

### Revenue Model

#### Pricing Tiers

| Tier | Includes | Target |
|------|----------|--------|
| **Self-Host (Free)** | Core commerce + SDK/CLI + templates | Dev adoption, PLG funnel |
| **Cloud Managed** | Hosting + backups + scaling + monitoring + security | Merchants wanting ops simplicity |
| **Cloud + Profit Engine (Premium)** | Conversion Autopilot + First-Party Ledger + uplift reporting | Merchants wanting outcome value |

#### Revenue Streams

| Stream | Model | Priority |
|--------|-------|----------|
| **Store subscription** | Monthly per store | MVP (primary) |
| **Profit Engine add-on** | Premium tier upgrade | MVP (expansion MRR) |
| **Trafi Builder Marketplace** | Templates + components (purchase or subscription) | Post-MVP |
| **Module Marketplace** | Dev-created modules with commission (15-30%) | Post-MVP |
| **Enterprise support/SLAs** | Custom contracts | Post-PMF |

#### Flywheel Logic

```
Devs build modules → Marketplace grows → Merchants buy
                                       ↓
                   Devs earn commission ← More devs contribute
```

---

## MVP Scope

### Core Features

#### Commerce Cores (9 modules)

| Core | Scope MVP | Folder |
|------|-----------|--------|
| **Product** | Catalogue, variantes, catégories, médias | `cores/product` |
| **Customer** | Comptes, adresses, auth B2C, profil | `cores/customer` |
| **Cart** | Panier persistant, calcul totaux, rules | `cores/cart` |
| **Checkout** | Flow multi-step, guest checkout, validation | `cores/checkout` |
| **Payment** | Stripe integration, webhooks, refunds | `cores/payment` |
| **Order** | Création, statuts, historique, events | `cores/order` |
| **Inventory + Fulfillment** | Stock simple (1 location), shipping zones, tarifs | `cores/inventory` |
| **Tax** | VAT Europe, règles par zone, calcul checkout | `cores/tax` |
| **User Access** | Admin users, RBAC, API keys, sessions | `cores/user-access` |

#### Trafi Jobs Module (P0)

**Objectif:** Centraliser la gestion des tâches async (BullMQ) dans une UI intégrée au dashboard, sans dépendance tierce.

| Composant | Description |
|-----------|-------------|
| **Queues** | Vue d'ensemble BullMQ, statuts, actions (pause/resume/clean) |
| **Tasks** | Définitions de tâches, config (timeout, attempts, priority), handlers NestJS |
| **Runs** | Historique d'exécution, filtres, payload/result/logs, retry/remove |
| **Batches** | Groupes logiques de jobs, exécution unique ou récurrente |
| **Schedules** | Cron jobs (repeatable), config cron, prochaine exécution, historique |
| **Tests** | Sandbox UI pour tester une tâche manuellement avec payload custom |
| **API Keys** | Tokens pour appel externe, scopes (run:taskX), expiration, logs |
| **Alerts** | Alertes échecs répétés, email/Slack webhook, historique |
| **Environments** | Variables globales injectées (ConfigService), scope global ou par queue/task |

**Features techniques:**
- Live status via WebSocket
- Event hooks à l'exécution (log externe, métriques)
- Export JSON/CSV des runs
- Accès admin-only, protection CSRF, audit log

#### Conversion Autopilot (MVP)

| Brique | Scope MVP |
|--------|-----------|
| **Checkout Doctor** | Instrumentation funnel, diagnostic drop-off, identification points de friction |
| **Recovery Engine** | Séquences emails panier abandonné (30-60 min window + relances) |
| **Profit Guardrails** | Règles simples marge/stock pour éviter optimisations destructrices |
| **Rollback partiel** | Auto-rollback uniquement pour actions réversibles (feature flags, séquences) |

**2 Playbooks MVP:**
1. **Playbook Checkout:** Frais/livraison visibles tôt + guest checkout + trust signals (via feature flags)
2. **Playbook Recovery:** Séquence abandons standardisée (email 1 @ 30-60 min, relances J+1, J+3)

#### Infra & DX

| Composant | Scope MVP |
|-----------|-----------|
| **CLI `create-trafi-app`** | Init projet, templates, config wizard, seed data |
| **SDK type-safe** | Endpoints critiques: product, cart, checkout, payment, order + events tracking |
| **Dashboard** | Essentials: catalogue, commandes, config (paiement/livraison/taxes), Jobs, Profit Engine basic |
| **Template Storefront** | Next.js uniquement (App Router, TypeScript, Tailwind) |
| **API** | tRPC (interne dashboard) + REST (externe SDK/intégrations) |

### Out of Scope for MVP

| Feature | Priorité | Rationale |
|---------|----------|-----------|
| **Trafi Builder** | v2 | Page builder = scope massif, risque MVP |
| **Marketplace modules** | v2 | Nécessite écosystème établi |
| **Agentic Checkout Gateway** | P2 | Prometteur mais difficile à prouver vite |
| **First-Party Ledger complet** | P1 | MVP garde juste events funnel pour Autopilot |
| **Trafi Score gamifié** | P1 | Nice-to-have, pas core value prop MVP |
| **Multi-warehouse** | P1 | 1 location suffit pour MVP |
| **Multi-region complexe** | P1 | Simplifier avec Tax + Currency de base |
| **Promotions avancées** | P1 | Surface de bugs énorme, risque élevé |
| **GraphQL API** | P1 | REST + tRPC suffisent pour MVP |
| **Templates multi-framework** | P1 | Next.js seul pour focus |

### MVP Success Criteria

#### Go/No-Go Gates

| Gate | Metric | Threshold |
|------|--------|-----------|
| **Dev Adoption** | Stores créés via CLI | ≥500 |
| **Dev Activation** | Stores actifs (≥1 order/week) | ≥100 |
| **Profit Engine Proof** | Stores avec uplift mesuré | ≥20 |
| **Monetization Signal** | Clients Cloud Managed payants | ≥10 |
| **Time-to-value** | Diagnostic Jour 1, Action Semaine 1 | Confirmé sur 80% des stores |

#### Validation Signals

- Devs réutilisent SDK sur 2ᵉ projet (≥20%)
- Marchands approuvent ≥2 actions Autopilot/mois
- NPS early adopters ≥40
- Taux de conversion lift ≥+10% sur segment ciblé

### Future Vision

#### P1 (Post-MVP, 3-6 mois)

| Feature | Description |
|---------|-------------|
| **First-Party Ledger** | Consent management, identity unification, activation connectors |
| **Trafi Score** | Score santé e-commerce gamifié dans dashboard |
| **Promotions** | Discounts, coupons, bundles, rules engine |
| **Multi-warehouse** | Gestion multi-locations, routing fulfillment |
| **GraphQL API** | Queries flexibles storefront |
| **Templates additionnels** | Remix, Astro |

#### P2 (6-12 mois)

| Feature | Description |
|---------|-------------|
| **Agentic Checkout Gateway** | API checkout optimisée pour agents IA |
| **Mode Démo Viral** | Simulation impact sur site existant avant migration |
| **Multi-region avancé** | Multi-currency, multi-tax, localization complète |

#### v2 (12+ mois)

| Feature | Description |
|---------|-------------|
| **Trafi Builder** | Page builder intégré avec preview live |
| **Module Marketplace** | Devs vendent leurs modules, commission 15-30% |
| **Enterprise features** | SSO, audit logs, SLAs custom, dedicated support |
