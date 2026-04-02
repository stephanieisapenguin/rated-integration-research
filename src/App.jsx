import { useState } from "react";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "imdb", label: "IMDb / TMDB" },
  { id: "stubhub", label: "StubHub" },
  { id: "entities", label: "Entity Mapping" },
  { id: "moviedetail", label: "MovieDetail Entity" },
  { id: "userdata", label: "User Data" },
  { id: "gaps", label: "Gaps & Risks" },
];

const C = {
  bg: "#0c0c0f",
  surface: "#16161b",
  card: "#1e1e25",
  border: "#2a2a35",
  text: "#e4e4ec",
  dim: "#6e6e80",
  accent: "#ff4d4d",
  accentDim: "#ff4d4d22",
  blue: "#3b82f6",
  blueDim: "#3b82f622",
  green: "#22c55e",
  greenDim: "#22c55e22",
  gold: "#f59e0b",
  goldDim: "#f59e0b22",
  purple: "#a855f7",
  purpleDim: "#a855f722",
};

const Tag = ({ color, children }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      background: color === "red" ? C.accentDim : color === "blue" ? C.blueDim : color === "green" ? C.greenDim : color === "gold" ? C.goldDim : C.purpleDim,
      color: color === "red" ? C.accent : color === "blue" ? C.blue : color === "green" ? C.green : color === "gold" ? C.gold : C.purple,
      border: `1px solid ${color === "red" ? C.accent + "33" : color === "blue" ? C.blue + "33" : color === "green" ? C.green + "33" : color === "gold" ? C.gold + "33" : C.purple + "33"}`,
    }}
  >
    {children}
  </span>
);

const Field = ({ name, type, source, note }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "4px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
    <code style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace", minWidth: 200, fontSize: 11 }}>{name}</code>
    <span style={{ color: C.dim, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, minWidth: 80 }}>{type}</span>
    <Tag color={source === "TMDB" ? "blue" : source === "OMDb" ? "gold" : source === "StubHub" ? "purple" : source === "Rated" ? "red" : source === "Watchmode" ? "green" : source === "Stripe" ? "green" : "green"}>{source}</Tag>
    {note && <span style={{ color: C.dim, fontSize: 11, flex: 1 }}>{note}</span>}
  </div>
);

const Card = ({ title, tag, children }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{title}</span>
      {tag}
    </div>
    {children}
  </div>
);

const P = ({ children }) => <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.7, margin: "6px 0" }}>{children}</p>;
const H2 = ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace", margin: "24px 0 8px", letterSpacing: -0.5 }}>{children}</h2>;
const H3 = ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono', monospace", margin: "16px 0 6px" }}>{children}</h3>;

const Arrow = () => <span style={{ color: C.accent, margin: "0 4px" }}>→</span>;

// ── SECTIONS ──

const OverviewSection = () => (
  <div>
    <H2>Integration Architecture Overview</H2>
    <P>
      Rated pulls movie metadata from external APIs and builds its own ranking + marketplace layer on top.
      There are three data domains with distinct ownership patterns.
    </P>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
      {[
        { label: "Movie Catalog", source: "TMDB + IMDb", color: "blue", desc: "Metadata, cast, genres, ratings synced from external APIs. Rated caches locally but doesn't own." },
        { label: "Rankings & Comparisons", source: "Rated (user-generated)", color: "red", desc: "All ELO scores, comparisons, watchlists, personal rankings. 100% Rated-owned, lives in PostgreSQL." },
        { label: "Marketplace & Tickets", source: "Rated + StubHub hybrid", color: "purple", desc: "Listings, trades, transactions, escrow. Rated owns the marketplace; StubHub provides price signals & optional fulfillment." },
      ].map((d, i) => (
        <div key={i} style={{ flex: "1 1 280px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{d.label}</span>
            <Tag color={d.color}>{d.source}</Tag>
          </div>
          <P>{d.desc}</P>
        </div>
      ))}
    </div>

    <H3>Data Flow Summary</H3>
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim, lineHeight: 2 }}>
      <div><Tag color="blue">TMDB API</Tag> <Arrow/> Enrichment Pipeline <Arrow/> <code style={{color:C.accent}}>MOVIE</code> + <code style={{color:C.accent}}>GENRE</code> + <code style={{color:C.accent}}>DIRECTOR</code> + <code style={{color:C.accent}}>ACTOR</code> tables</div>
      <div><Tag color="gold">OMDb API</Tag> <Arrow/> Enrichment Pipeline <Arrow/> <code style={{color:C.accent}}>MOVIE.imdb_rating</code> + RT score + Metacritic + box office</div>
      <div><Tag color="green">Watchmode API</Tag> <Arrow/> Streaming Service <Arrow/> <code style={{color:C.accent}}>MOVIE.streaming_sources</code> (future)</div>
      <div><Tag color="purple">StubHub API</Tag> <Arrow/> Marketplace Service <Arrow/> price signals, event matching, optional listing sync</div>
      <div><Tag color="red">User Actions</Tag> <Arrow/> Ranking Engine <Arrow/> <code style={{color:C.accent}}>COMPARISON</code> + <code style={{color:C.accent}}>ELO_SCORE</code> + <code style={{color:C.accent}}>WATCHLIST</code></div>
      <div><Tag color="red">User Actions</Tag> <Arrow/> Marketplace Service <Arrow/> <code style={{color:C.accent}}>TICKET_LISTING</code> + <code style={{color:C.accent}}>TRADE_OFFER</code> + <code style={{color:C.accent}}>TRANSACTION</code></div>
    </div>

    <H3>Feed Priority</H3>
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, fontSize: 12, color: C.dim, lineHeight: 2 }}>
      <div><strong style={{color:C.blue, fontFamily:"'JetBrains Mono', monospace"}}>1. TMDB API</strong> — primary feed: catalog, images, cast, trailers, genres (~90% of fields)</div>
      <div><strong style={{color:C.gold, fontFamily:"'JetBrains Mono', monospace"}}>2. OMDb API</strong> — enrichment: IMDb rating, RT score, Metacritic, box office</div>
      <div><strong style={{color:C.green, fontFamily:"'JetBrains Mono', monospace"}}>3. Watchmode API</strong> — future: streaming availability per region</div>
      <div><strong style={{color:C.accent, fontFamily:"'JetBrains Mono', monospace"}}>4. Rated Internal</strong> — user-generated: ELO scores, reviews, streaks, trending</div>
    </div>
  </div>
);

const ImdbSection = () => (
  <div>
    <H2>IMDb & TMDB Integration</H2>

    <Card title="TMDB — Primary Catalog Source" tag={<Tag color="blue">FREE API</Tag>}>
      <P>
        TMDB is the recommended primary source. It offers a free REST API with generous rate limits, returns
        standardized JSON, and covers movies, TV, cast, crew, genres, posters, and trailers. Free for
        non-commercial use; commercial licenses available.
      </P>
      <H3>What TMDB Gives You</H3>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="id" type="int" source="TMDB" note="TMDB movie ID — use as foreign key" />
        <Field name="title" type="string" source="TMDB" note="Primary title + original_title" />
        <Field name="release_date" type="date" source="TMDB" note="YYYY-MM-DD format" />
        <Field name="genres" type="array" source="TMDB" note="[{id, name}] — maps to GENRE table" />
        <Field name="runtime" type="int" source="TMDB" note="Minutes" />
        <Field name="poster_path" type="string" source="TMDB" note="Append to image.tmdb.org CDN" />
        <Field name="overview" type="string" source="TMDB" note="Synopsis / plot summary" />
        <Field name="credits.cast" type="array" source="TMDB" note="Cast with character names → ACTOR table" />
        <Field name="credits.crew" type="array" source="TMDB" note="Filter for job='Director' → DIRECTOR table" />
        <Field name="vote_average" type="float" source="TMDB" note="Community rating (1-10)" />
        <Field name="belongs_to_collection" type="object" source="TMDB" note="Franchise/collection → FRANCHISE table" />
        <Field name="keywords" type="array" source="TMDB" note="Tag-based discovery (mood, theme)" />
        <Field name="release_dates" type="array" source="TMDB" note="US certification (PG-13, R) + release type detection" />
        <Field name="production_companies" type="array" source="TMDB" note="Detect streaming originals (Netflix, Disney+, etc.)" />
        <Field name="origin_country" type="array" source="TMDB" note="ISO 3166-1 codes → international film detection" />
      </div>
      <H3>Key Endpoint</H3>
      <div style={{ background: C.surface, borderRadius: 8, padding: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.blue }}>
        GET /3/movie/{"{id}"}?append_to_response=credits,videos,keywords,images,release_dates
      </div>
      <P>
        One call returns everything: details + cast + crew + keywords + images + release dates.
        The append_to_response pattern avoids N+1 API calls.
      </P>
    </Card>

    <Card title="OMDb — Enrichment Layer" tag={<Tag color="gold">FREE / PAID API</Tag>}>
      <P>
        OMDb (Open Movie Database) is a free REST API that aggregates IMDb ratings, Rotten Tomatoes scores,
        and Metacritic scores. Free tier available; paid plans remove rate limits. Requires imdb_id from TMDB.
      </P>
      <H3>What OMDb Adds Beyond TMDB</H3>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="imdbRating" type="float" source="OMDb" note="IMDb rating (e.g. 8.7) — authoritative score" />
        <Field name="imdbVotes" type="int" source="OMDb" note="Vote count (e.g. 2,100,000)" />
        <Field name="Ratings[RT]" type="int" source="OMDb" note="Rotten Tomatoes score — parse '87%' → 87" />
        <Field name="Metascore" type="int" source="OMDb" note="Metacritic score (e.g. 74)" />
        <Field name="BoxOffice" type="int" source="OMDb" note="Domestic gross — parse '$188,020,017' → 188020017" />
        <Field name="Rated" type="string" source="OMDb" note="MPAA content rating fallback (PG-13, R)" />
      </div>
      <H3>Access Pattern</H3>
      <div style={{ background: C.surface, borderRadius: 8, padding: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.gold }}>
        GET /?i={"{imdb_id}"}&plot=short&apikey={"{key}"}
      </div>
    </Card>

    <Card title="IMDb Official API (Alternative)" tag={<Tag color="gold">PAID / AWS</Tag>}>
      <P>
        IMDb's official API is a GraphQL service available exclusively through AWS Data Exchange.
        It requires an AWS account and a paid subscription. It's the gold standard for ratings
        (1.6B+ votes) and box office data. OMDb is the practical free alternative for most use cases.
      </P>
    </Card>

    <Card title="IMDb Free Datasets (Non-Commercial)" tag={<Tag color="green">FREE</Tag>}>
      <P>
        IMDb provides free TSV datasets (title.basics, title.ratings, name.basics) updated daily.
        Usable for non-commercial purposes only with attribution. Good for bootstrapping your catalog
        before paying for the full API.
      </P>
      <div style={{ background: C.surface, borderRadius: 8, padding: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.green }}>
        datasets.imdbws.com → title.basics.tsv.gz, title.ratings.tsv.gz
      </div>
    </Card>
  </div>
);

const StubhubSection = () => (
  <div>
    <H2>StubHub Integration</H2>

    <Card title="StubHub API Overview" tag={<Tag color="purple">OAUTH2 / PAID</Tag>}>
      <P>
        StubHub's API connects to the world's largest ticket marketplace. It uses OAuth2 authentication,
        HTTPS only, and returns HAL+JSON. The API covers four domains: Catalog (events/venues),
        Inventory (seller listings), Sales (transactions), and Webhooks.
      </P>
      <P>
        Access requires contacting StubHub directly — affiliates@stubhub.com for buyer-side
        integrations or api.support@stubhub.com for seller-side. They're migrating to a new API
        and prioritizing based on volume.
      </P>
    </Card>

    <Card title="StubHub Seller Listing Schema" tag={<Tag color="purple">INVENTORY API</Tag>}>
      <H3>Key Fields from StubHub's SellerListing Resource</H3>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="id" type="int64" source="StubHub" note="StubHub listing ID" />
        <Field name="number_of_tickets" type="int32" source="StubHub" note="Available quantity" />
        <Field name="ticket_price" type="Money" source="StubHub" note="{amount, currency_code}" />
        <Field name="face_value" type="Money" source="StubHub" note="Printed price on ticket" />
        <Field name="ticket_proceeds" type="Money" source="StubHub" note="What seller actually receives" />
        <Field name="seating" type="object" source="StubHub" note="{section, row, seat_from, seat_to}" />
        <Field name="ticket_type" type="string" source="StubHub" note="ETicket, Paper, etc." />
        <Field name="split_type" type="string" source="StubHub" note="How tickets can be split for sale" />
        <Field name="in_hand_at" type="datetime" source="StubHub" note="When seller has physical tickets" />
        <Field name="barcodes" type="array" source="StubHub" note="Barcode info for verification" />
        <Field name="instant_delivery" type="bool" source="StubHub" note="Immediate transfer capability" />
        <Field name="external_id" type="string" source="StubHub" note="YOUR system's ID — key for sync" />
        <Field name="published" type="bool" source="StubHub" note="Live on marketplace or not" />
        <Field name="created_at" type="datetime" source="StubHub" note="Listing creation time" />
        <Field name="expires_at" type="datetime" source="StubHub" note="Auto-unpublish date" />
      </div>
    </Card>

    <Card title="StubHub Verification & Trust Model" tag={<Tag color="green">SAFETY</Tag>}>
      <P>
        StubHub verifies ticket authenticity through a multi-step process: sellers confirm ownership
        via payment receipts and identity checks. Tickets are cross-referenced with venue databases.
        Buyers get a protection policy — disputed tickets can be refunded within 72 hours.
      </P>
      <H3>Rated Can Mirror This</H3>
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>
        <div>• <strong style={{color:C.text}}>Pro Verification</strong> — our KYC gate maps to StubHub's seller ID verification</div>
        <div>• <strong style={{color:C.text}}>QR/Barcode validation</strong> — StubHub's barcode field maps to our qr_hash</div>
        <div>• <strong style={{color:C.text}}>Escrow</strong> — StubHub holds payment until delivery confirmed; our TRANSACTION.escrow_status does the same</div>
        <div>• <strong style={{color:C.text}}>Anti-fraud</strong> — StubHub's duplicate detection maps to our Ticket Verification service</div>
      </div>
    </Card>

    <Card title="Integration Strategy Options" tag={<Tag color="red">DECISION</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          {
            title: "Option A: Price Signal Only",
            desc: "Use StubHub API read-only to show comparable ticket prices. Don't sync listings. Lowest friction — just Catalog API.",
            effort: "Low",
            risk: "Low"
          },
          {
            title: "Option B: Dual-List",
            desc: "When a Rated user lists a ticket, optionally cross-post to StubHub via Inventory API. Use external_id to keep in sync.",
            effort: "Medium",
            risk: "Medium — requires seller API access approval"
          },
          {
            title: "Option C: Full Marketplace Bridge",
            desc: "Pull StubHub inventory into Rated's browse experience. Handle purchase via StubHub's checkout. Rated adds trade/swap on top.",
            effort: "High",
            risk: "High — StubHub may not approve; volume requirements"
          },
        ].map((opt, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{opt.title}</span>
              <Tag color={opt.effort === "Low" ? "green" : opt.effort === "Medium" ? "gold" : "red"}>{opt.effort} effort</Tag>
            </div>
            <P>{opt.desc}</P>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>Risk: {opt.risk}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const EntityMappingSection = () => (
  <div>
    <H2>Entity ↔ Source Mapping</H2>
    <P>Where each field in the Rated ERD comes from — and what's yours vs. external.</P>

    <Card title="MOVIE table" tag={<Tag color="blue">TMDB + OMDb</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="id" type="uuid" source="Rated" note="Internal PK — generated by Rated" />
        <Field name="tmdb_id" type="string" source="TMDB" note="TMDB movie ID — use for API lookups" />
        <Field name="imdb_id" type="string" source="TMDB" note="TMDB returns this in movie details" />
        <Field name="title" type="string" source="TMDB" note="From /movie/{id}" />
        <Field name="release_year" type="int" source="TMDB" note="Extracted from release_date" />
        <Field name="poster_url" type="string" source="TMDB" note="image.tmdb.org/t/p/w500 + poster_path" />
        <Field name="synopsis" type="string" source="TMDB" note="overview field" />
        <Field name="runtime_minutes" type="int" source="TMDB" note="runtime field" />
        <Field name="global_elo_score" type="float" source="Rated" note="Computed by YOUR ranking engine" />
        <Field name="imdb_rating" type="float" source="OMDb" note="From OMDb API imdbRating field" />
        <Field name="rotten_tomatoes_score" type="int" source="OMDb" note="Parsed from Ratings array" />
        <Field name="metacritic_score" type="int" source="OMDb" note="Metascore field" />
        <Field name="box_office_domestic" type="int" source="OMDb" note="BoxOffice field (domestic)" />
        <Field name="box_office_worldwide" type="int" source="TMDB" note="revenue field (often worldwide)" />
      </div>
    </Card>

    <Card title="GENRE / DIRECTOR / ACTOR / FRANCHISE" tag={<Tag color="blue">TMDB</Tag>}>
      <P>
        All populated from TMDB's /movie/{"{id}"}?append_to_response=credits,keywords response.
        TMDB provides genre IDs, person IDs (tmdb_person_id), and collection objects (franchises).
        Rated stores these locally and uses them as dimensions for the ranking engine.
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="GENRE.name" type="string" source="TMDB" note="From genres array" />
        <Field name="DIRECTOR.tmdb_person_id" type="string" source="TMDB" note="From credits.crew where job='Director'" />
        <Field name="ACTOR.tmdb_person_id" type="string" source="TMDB" note="From credits.cast" />
        <Field name="FRANCHISE.name" type="string" source="TMDB" note="From belongs_to_collection" />
      </div>
    </Card>

    <Card title="RANKING_CATEGORY / ELO_SCORE / COMPARISON" tag={<Tag color="red">100% Rated</Tag>}>
      <P>
        Entirely Rated-owned. No external dependency. Categories are derived from TMDB metadata
        (genre names, director names, decades) but the ranking data itself is generated by user comparisons.
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="RANKING_CATEGORY.category_value" type="string" source="Rated" note="Derived from TMDB genres/directors but stored locally" />
        <Field name="ELO_SCORE.score" type="float" source="Rated" note="Computed by ELO/Glicko engine" />
        <Field name="COMPARISON.winner_movie_id" type="uuid" source="Rated" note="User choice — core IP" />
      </div>
    </Card>

    <Card title="TICKET_LISTING" tag={<Tag color="purple">Rated + StubHub</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="id" type="uuid" source="Rated" note="Internal PK" />
        <Field name="seller_id" type="uuid" source="Rated" note="FK to USER (must be Pro verified)" />
        <Field name="movie_id" type="uuid" source="Rated" note="FK to MOVIE" />
        <Field name="listing_type" type="enum" source="Rated" note="sell | trade — StubHub doesn't have trade" />
        <Field name="asking_price" type="decimal" source="Rated" note="Set by seller" />
        <Field name="venue" type="string" source="Rated" note="User-entered (could match StubHub venue)" />
        <Field name="seat_info" type="string" source="Rated" note="Maps to StubHub's seating.section + row" />
        <Field name="showtime" type="datetime" source="Rated" note="Maps to StubHub event startDate" />
        <Field name="ticket_image_url" type="string" source="Rated" note="S3 — user uploads photo" />
        <Field name="qr_hash" type="string" source="Rated" note="Our verification — maps to StubHub barcodes" />
        <Field name="stubhub_listing_id" type="int64" source="StubHub" note="Add column — for cross-posted listings (Option B)" />
        <Field name="face_value" type="decimal" source="StubHub" note="Add column — from StubHub's face_value field" />
      </div>
    </Card>

    <Card title="TRANSACTION" tag={<Tag color="red">Rated + Stripe</Tag>}>
      <P>
        Rated owns the transaction layer. StubHub is not involved in P2P trades.
        Stripe handles escrow (Connect + payment intents with manual capture).
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="escrow_status" type="enum" source="Rated" note="held → released → refunded. Stripe handles the money." />
        <Field name="stripe_payment_id" type="string" source="Stripe" note="Payment intent ID for audit trail" />
      </div>
    </Card>
  </div>
);

const MovieDetailSection = () => (
  <div>
    <H2>MovieDetail Entity Design</H2>
    <P>
      The MovieDetail entity is the single source of truth for a movie in Rated. It is constructed
      from external feeds and enriched incrementally as data becomes available. Ingestion is idempotent —
      safe to re-run for refreshes.
    </P>

    <Card title="Identity & Basic Metadata" tag={<Tag color="blue">TMDB</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="id" type="uuid" source="Rated" note="Internal PK — generated on first ingest" />
        <Field name="tmdb_id" type="int" source="TMDB" note="Foreign key for all TMDB lookups" />
        <Field name="imdb_id" type="string?" source="TMDB" note="imdb_id field from /movie/{id} response" />
        <Field name="slug" type="string" source="Rated" note='slugify(title + release_year) → "interstellar-2014"' />
        <Field name="title" type="string" source="TMDB" note="Localized title" />
        <Field name="original_title" type="string?" source="TMDB" note='e.g. "기생충" for Parasite' />
        <Field name="release_year" type="int" source="TMDB" note='Extracted from "2014-11-05" → 2014' />
        <Field name="release_date" type="date?" source="TMDB" note="Full precision release date" />
        <Field name="runtime_minutes" type="int?" source="TMDB" note="runtime field (minutes)" />
        <Field name="content_rating" type="string?" source="TMDB" note="US certification from release_dates — fallback: OMDb" />
        <Field name="tagline" type="string?" source="TMDB" note='"Mankind was born on Earth..."' />
        <Field name="synopsis" type="string?" source="TMDB" note="overview field" />
        <Field name="status" type="string" source="TMDB" note='"Released" | "Post Production" | "Upcoming"' />
      </div>
    </Card>

    <Card title="International & Origin" tag={<Tag color="blue">TMDB</Tag>}>
      <P>
        Derived fields enable international film discovery, filtering, and category rankings (e.g. "Best Korean Films").
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="original_language" type="string" source="TMDB" note='ISO 639-1: "en", "ko", "hi", "ja", "fr"' />
        <Field name="original_language_name" type="string?" source="Rated" note='"ko" → "Korean", "hi" → "Hindi"' />
        <Field name="origin_countries" type="string[]" source="TMDB" note='ISO 3166-1: ["KR"], ["IN"], ["US","GB"]' />
        <Field name="origin_country_names" type="string[]?" source="Rated" note='["KR"] → ["South Korea"]' />
        <Field name="is_international" type="bool" source="Rated" note="original_language != 'en'" />
      </div>
    </Card>

    <Card title="Release Type & Streaming Detection" tag={<Tag color="blue">TMDB</Tag>}>
      <P>
        Release type is derived from TMDB's release_dates array. Streaming original detection checks
        production_companies against known platform IDs.
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="release_type" type="string" source="Rated" note='"theatrical" | "streaming" | "hybrid" | "limited" | "unknown"' />
        <Field name="streaming_original_platform" type="string?" source="Rated" note='e.g. "Netflix" if Netflix in production_companies' />
        <Field name="is_streaming_original" type="bool" source="Rated" note="streaming_original_platform is not None" />
      </div>
      <H3>Known Streaming Company IDs (TMDB)</H3>
      <div style={{ background: C.surface, borderRadius: 8, padding: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim, lineHeight: 1.9 }}>
        {[["Netflix", "33520"], ["Amazon", "7429"], ["Apple TV+", "7461"], ["Disney+", "2739"], ["HBO/Max", "3268"], ["Hulu", "3153"], ["Peacock", "77882"], ["Paramount+", "174252"]].map(([name, id]) => (
          <div key={id}><span style={{color:C.blue, minWidth: 120, display:"inline-block"}}>{name}</span> company_id: <span style={{color:C.accent}}>{id}</span></div>
        ))}
      </div>
    </Card>

    <Card title="Images" tag={<Tag color="blue">TMDB CDN</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="poster_url" type="string?" source="TMDB" note="image.tmdb.org/t/p/w500 + poster_path" />
        <Field name="poster_url_hd" type="string?" source="TMDB" note="image.tmdb.org/t/p/original + poster_path" />
        <Field name="backdrop_url" type="string?" source="TMDB" note="image.tmdb.org/t/p/w1280 + backdrop_path" />
        <Field name="backdrop_url_hd" type="string?" source="TMDB" note="image.tmdb.org/t/p/original + backdrop_path" />
        <Field name="logo_url" type="string?" source="TMDB" note="/movie/{id}/images → logos[0]" />
      </div>
    </Card>

    <Card title="Cast & Crew" tag={<Tag color="blue">TMDB credits</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="directors" type="Person[]" source="TMDB" note="crew where job == 'Director'" />
        <Field name="writers" type="Person[]" source="TMDB" note="crew where department == 'Writing'" />
        <Field name="cast" type="CastMember[]" source="TMDB" note="Top 15 cast members with character_name + cast_order" />
        <Field name="Person.tmdb_person_id" type="int" source="TMDB" note="Person ID for cross-referencing" />
        <Field name="Person.photo_url" type="string?" source="TMDB" note="image.tmdb.org/t/p/w185 + profile_path" />
      </div>
    </Card>

    <Card title="Trailers & Videos" tag={<Tag color="blue">TMDB videos</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="video_key" type="string" source="TMDB" note="YouTube video ID" />
        <Field name="video_url" type="string" source="Rated" note="https://youtube.com/watch?v={key}" />
        <Field name="thumbnail_url" type="string" source="Rated" note="https://img.youtube.com/vi/{key}/hqdefault.jpg" />
        <Field name="video_type" type="string" source="TMDB" note='"Trailer" | "Teaser" | "Featurette" | "Clip"' />
        <Field name="is_primary" type="bool" source="Rated" note="type=Trailer AND official=true, pick latest" />
      </div>
    </Card>

    <Card title="External Ratings" tag={<Tag color="gold">OMDb enrichment</Tag>}>
      <P>Called after TMDB ingest. Requires imdb_id. Falls back gracefully if OMDb unavailable.</P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="imdb_rating" type="float?" source="OMDb" note="imdbRating (e.g. 8.7)" />
        <Field name="imdb_votes" type="int?" source="OMDb" note="imdbVotes (e.g. 2,100,000)" />
        <Field name="rotten_tomatoes_score" type="int?" source="OMDb" note='Ratings[source="Rotten Tomatoes"].Value → parse "87%" → 87' />
        <Field name="metacritic_score" type="int?" source="OMDb" note="Metascore (e.g. 74)" />
        <Field name="box_office_domestic" type="int?" source="OMDb" note='BoxOffice → parse "$188,020,017" → 188020017' />
        <Field name="box_office_worldwide" type="int?" source="TMDB" note="revenue field fallback (often worldwide)" />
        <Field name="budget" type="int?" source="TMDB" note="budget field (USD)" />
      </div>
    </Card>

    <Card title="Streaming Availability" tag={<Tag color="green">Watchmode (future)</Tag>}>
      <P>
        Streaming sources populated via Watchmode API. Requires mapping tmdb_id to watchmode_id
        via Watchmode's title_id_map.csv. Refresh daily — availability changes frequently.
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="platform_name" type="string" source="Watchmode" note='"Netflix", "Hulu", etc.' />
        <Field name="source_type" type="string" source="Watchmode" note='"sub" | "rent" | "buy" | "free"' />
        <Field name="price" type="float?" source="Watchmode" note="For rent/buy tiers" />
        <Field name="url" type="string" source="Watchmode" note="Web URL to watch" />
        <Field name="deep_link" type="string?" source="Watchmode" note="iOS/Android deep link" />
        <Field name="region" type="string" source="Watchmode" note='"US", "GB", etc.' />
        <Field name="last_checked_at" type="datetime" source="Rated" note="When we last verified availability" />
      </div>
    </Card>

    <Card title="Rated Internal (User-Generated)" tag={<Tag color="red">100% Rated</Tag>}>
      <P>
        Never from external feeds. Computed by Rated's ranking engine and user actions.
        These fields represent Rated's core intellectual property.
      </P>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Field name="global_elo_score" type="float" source="Rated" note="ELO/Glicko engine across all comparisons — default 1500.0" />
        <Field name="category_elo_scores" type="dict" source="Rated" note="{genre_slug: score, director_slug: score, ...}" />
        <Field name="global_rank" type="int?" source="Rated" note="Position in overall leaderboard" />
        <Field name="genre_ranks" type="dict" source="Rated" note='{"sci-fi": 1, "drama": 4, ...}' />
        <Field name="comparison_count" type="int" source="Rated" note="Total times movie appeared in a comparison battle" />
        <Field name="win_rate" type="float" source="Rated" note="wins / comparison_count" />
        <Field name="avg_user_rating" type="float?" source="Rated" note="Mean of all USER_RATING.rating for this movie" />
        <Field name="trending_score" type="float" source="Rated" note="weighted(recent_ratings, reviews, page_views, recency)" />
        <Field name="trending_rank" type="int?" source="Rated" note="Position in trending list" />
        <Field name="is_highlighted" type="bool" source="Rated" note="Editorial flag or auto-triggered by trending threshold" />
        <Field name="watchlist_count" type="int" source="Rated" note="How many users have this on their watchlist" />
        <Field name="seen_count" type="int" source="Rated" note="How many users marked this as seen" />
      </div>
    </Card>

    <Card title="Sync & Refresh Strategy" tag={<Tag color="green">OPERATIONS</Tag>}>
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 2, fontFamily: "'JetBrains Mono', monospace" }}>
        <div><span style={{color:C.blue}}>TMDB refresh:</span> every 7 days (1 day for new releases within 90 days)</div>
        <div><span style={{color:C.gold}}>OMDb refresh:</span> every 14 days (ratings shift slowly)</div>
        <div><span style={{color:C.green}}>Watchmode refresh:</span> every 1 day (streaming avail changes daily)</div>
      </div>
      <H3>Full Ingest Pipeline</H3>
      <div style={{ background: C.surface, borderRadius: 8, padding: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim, lineHeight: 2 }}>
        <div><span style={{color:C.blue}}>ingest_from_tmdb(tmdb_id)</span> → hydrate ~90% of fields</div>
        <div><span style={{color:C.gold}}>enrich_from_omdb(movie)</span> → patch ratings + box office</div>
        <div><span style={{color:C.green}}>enrich_from_watchmode(movie)</span> → streaming sources (future)</div>
        <div style={{color:C.accent, marginTop:4}}>All steps are idempotent — safe to re-run for refreshes.</div>
      </div>
    </Card>
  </div>
);

const UserDataSection = () => (
  <div>
    <H2>Where Does User Data Sit?</H2>

    <Card title="Data Ownership Matrix" tag={<Tag color="red">CRITICAL</Tag>}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {["Data Type", "Owner", "Storage", "User Can Delete?", "Shared With"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: C.dim, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Account / Profile", "Rated", "PostgreSQL", "Yes (GDPR/CCPA)", "Nobody"],
              ["Rankings & Comparisons", "Rated", "PostgreSQL", "Yes", "Public leaderboard (anon)"],
              ["Watchlists", "Rated", "PostgreSQL", "Yes", "Friends (if enabled)"],
              ["Movie Metadata", "TMDB / OMDb", "Rated cache (PG)", "N/A — not user data", "Public"],
              ["Ticket Listings", "Rated", "PostgreSQL + S3", "Yes (delist)", "Marketplace buyers"],
              ["Transaction History", "Rated + Stripe", "PG + Stripe", "Partial (legal hold)", "Buyer + Seller"],
              ["Payment Info", "Stripe", "Stripe vault", "Via Stripe dashboard", "Stripe only"],
              ["KYC / Identity", "ID Provider", "ID provider vault", "Via provider", "Rated gets pass/fail only"],
              ["Ticket Images / QR", "Rated", "S3 (encrypted)", "Yes (on delist)", "Buyer on purchase"],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "8px 6px", color: j === 0 ? C.text : C.dim, fontWeight: j === 0 ? 600 : 400, fontSize: 11 }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <Card title="IMDb / OMDb Data Policy" tag={<Tag color="gold">IMDb / OMDb</Tag>}>
      <P>
        IMDb (owned by Amazon) collects names, emails, browsing activity, and uses cookies for ad targeting.
        For Rated's purposes: you never share YOUR users' data with IMDb. You only consume their movie catalog
        data via OMDb API. IMDb user ratings are IMDb's property — display with attribution only.
      </P>
      <H3>Key Restrictions</H3>
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>
        <div>• Free datasets are <strong style={{color:C.accent}}>non-commercial only</strong> — must attribute "Information courtesy of IMDb"</div>
        <div>• Cannot scrape imdb.com — data must come from official datasets or OMDb API</div>
        <div>• Cannot create a competing database of movie info from their data</div>
        <div>• TMDB has no such restriction for commercial use (just attribute + get a license)</div>
      </div>
    </Card>

    <Card title="StubHub User Data Policy" tag={<Tag color="purple">StubHub</Tag>}>
      <P>
        StubHub verifies sellers via government ID and payment receipts. When Rated integrates with StubHub,
        the data flows are one-directional: Rated pushes listing data TO StubHub and receives confirmation back.
        StubHub does not share buyer PII with seller apps.
      </P>
      <H3>What Rated Gets vs. Doesn't Get</H3>
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>
        <div>✅ Event catalog (public events, venues, dates)</div>
        <div>✅ Listing data for YOUR authenticated seller's listings</div>
        <div>✅ Sale confirmations + payment status</div>
        <div>✅ E-ticket upload/download for YOUR listings</div>
        <div>❌ Other sellers' inventory details (limited to search results)</div>
        <div>❌ Buyer PII (StubHub protects this)</div>
        <div>❌ StubHub's internal pricing algorithms</div>
      </div>
    </Card>

    <Card title="Rated's Own User Data" tag={<Tag color="red">RATED</Tag>}>
      <P>
        Rated's core value proposition IS the user-generated ranking data. This is 100% owned by Rated
        and represents the company's primary intellectual property.
      </P>
      <H3>What Makes Rated's Data Unique</H3>
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>
        <div>• <strong style={{color:C.text}}>Pairwise comparisons</strong> — no other platform does head-to-head movie ELO</div>
        <div>• <strong style={{color:C.text}}>Category-scoped rankings</strong> — "best Nolan film" or "best 90s horror" computed from real votes</div>
        <div>• <strong style={{color:C.text}}>Taste profiles</strong> — each user's personal ranking graph is a recommendation engine input</div>
        <div>• <strong style={{color:C.text}}>Trade/swap graph</strong> — ticket trading patterns show demand signals no one else has</div>
      </div>
    </Card>
  </div>
);

const GapsSection = () => (
  <div>
    <H2>Gaps, Risks & Schema Changes</H2>

    <Card title="Schema Additions Needed" tag={<Tag color="red">ACTION</Tag>}>
      <P>Based on this research, the current ERD needs these additions:</P>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: C.dim, lineHeight: 1.8 }}>
        {[
          { table: "MOVIE", field: "imdb_id (string, UK)", why: "Cross-reference with OMDb API and IMDb datasets" },
          { table: "MOVIE", field: "imdb_rating (float)", why: "Display authoritative rating alongside Rated ELO" },
          { table: "MOVIE", field: "rotten_tomatoes_score (int)", why: "OMDb enrichment — popular aggregator score" },
          { table: "MOVIE", field: "metacritic_score (int)", why: "OMDb enrichment — critical consensus" },
          { table: "MOVIE", field: "content_rating (string)", why: "MPAA rating (PG-13, R) — from TMDB or OMDb" },
          { table: "MOVIE", field: "box_office_domestic (int)", why: "From OMDb BoxOffice field" },
          { table: "MOVIE", field: "box_office_worldwide (int)", why: "From TMDB revenue field" },
          { table: "MOVIE", field: "original_language (string)", why: "ISO 639-1 — enables international film categories" },
          { table: "MOVIE", field: "is_international (bool)", why: "Derived flag for discovery filtering" },
          { table: "MOVIE", field: "release_type (enum)", why: "theatrical/streaming/hybrid — from TMDB release_dates" },
          { table: "MOVIE", field: "streaming_original_platform (string?)", why: "Netflix/Disney+ original detection" },
          { table: "TICKET_LISTING", field: "stubhub_listing_id (int64, nullable)", why: "Cross-post sync key if using Option B" },
          { table: "TICKET_LISTING", field: "face_value (decimal)", why: "StubHub tracks this — useful for price transparency" },
          { table: "TICKET_LISTING", field: "ticket_type (enum)", why: "e-ticket vs paper vs mobile — StubHub differentiates" },
          { table: "TICKET_LISTING", field: "barcode (string, nullable)", why: "For barcode-based verification (maps to StubHub)" },
          { table: "USER", field: "trust_score (float)", why: "Computed from transaction history — displayed on marketplace" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
            <code style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, minWidth: 130 }}>{item.table}</code>
            <code style={{ color: C.blue, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, minWidth: 240 }}>{item.field}</code>
            <span>{item.why}</span>
          </div>
        ))}
      </div>
    </Card>

    <Card title="Integration Risks" tag={<Tag color="gold">WARNING</Tag>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { risk: "IMDb Official API Cost", severity: "Medium", detail: "AWS Data Exchange pricing is opaque. Use OMDb API (free tier) + TMDB; add IMDb official API later if needed." },
          { risk: "StubHub API Access", severity: "High", detail: "StubHub is migrating APIs and prioritizing by volume. A startup may wait weeks/months for approval." },
          { risk: "IMDb Non-Commercial License", severity: "High", detail: "Free IMDb datasets cannot be used commercially. If Rated monetizes, must use TMDB + OMDb (commercial) instead." },
          { risk: "TMDB Rate Limits", severity: "Low", detail: "TMDB is generous but still rate-limited. Cache aggressively — movie metadata rarely changes." },
          { risk: "OMDb Data Freshness", severity: "Low", detail: "OMDb aggregates from IMDb but may lag by days. For real-time ratings, use IMDb official API." },
          { risk: "StubHub TOS Changes", severity: "Medium", detail: "StubHub has changed APIs before (v1 → v2 deprecation). Don't build core features that break if StubHub access is revoked." },
          { risk: "Ticket Fraud Liability", severity: "High", detail: "If Rated facilitates a bad ticket sale, you're liable. Escrow + verification is non-negotiable before marketplace launch." },
        ].map((item, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{item.risk}</span>
              <Tag color={item.severity === "Low" ? "green" : item.severity === "Medium" ? "gold" : "red"}>{item.severity}</Tag>
            </div>
            <P>{item.detail}</P>
          </div>
        ))}
      </div>
    </Card>

    <Card title="Recommended Launch Order" tag={<Tag color="green">STRATEGY</Tag>}>
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 2.2 }}>
        <div><strong style={{color:C.green}}>Phase 1:</strong> TMDB API only → populate MOVIE + GENRE + DIRECTOR + ACTOR + FRANCHISE</div>
        <div><strong style={{color:C.green}}>Phase 2:</strong> Ranking engine (100% Rated-owned) → COMPARISON + ELO_SCORE + WATCHLIST</div>
        <div><strong style={{color:C.gold}}>Phase 3:</strong> OMDb enrichment → imdb_rating, RT score, Metacritic, box_office on MOVIE</div>
        <div><strong style={{color:C.gold}}>Phase 4:</strong> Marketplace with Stripe escrow → TICKET_LISTING + TRADE_OFFER + TRANSACTION</div>
        <div><strong style={{color:C.accent}}>Phase 5:</strong> Watchmode → streaming availability per region</div>
        <div><strong style={{color:C.accent}}>Phase 6:</strong> StubHub integration (Option A → B) → price signals, optional cross-posting</div>
      </div>
    </Card>
  </div>
);

const sectionComponents = {
  overview: OverviewSection,
  imdb: ImdbSection,
  stubhub: StubhubSection,
  entities: EntityMappingSection,
  moviedetail: MovieDetailSection,
  userdata: UserDataSection,
  gaps: GapsSection,
};

export default function RatedIntegrationResearch() {
  const [active, setActive] = useState("overview");
  const Section = sectionComponents[active];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: C.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>RATED</span>
            <span style={{ fontSize: 13, color: C.dim, fontFamily: "'JetBrains Mono', monospace" }}>Integration Research</span>
          </div>
          <p style={{ fontSize: 12, color: C.dim, margin: "6px 0 0", lineHeight: 1.6 }}>
            IMDb · TMDB · OMDb · StubHub · MovieDetail Entity — data ownership, API schemas, entity mapping, and where user data sits
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20, position: "sticky", top: 0, background: C.bg, padding: "8px 0", zIndex: 10 }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
                border: `1px solid ${active === s.id ? C.accent : C.border}`,
                background: active === s.id ? C.accentDim : "transparent",
                color: active === s.id ? C.accent : C.dim,
                transition: "all 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Section />
      </div>
    </div>
  );
}
