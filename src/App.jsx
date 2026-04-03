import { useState, useEffect, useCallback } from "react";
import {
  hasApiKey,
  fetchTrending,
  fetchUpcoming,
  fetchMovieDetail,
  searchMovies,
  mapMovie,
} from "./api/tmdb";

// ═══════════════════════════════════════════════════
// FALLBACK DATA (used when no TMDB API key is set)
// ═══════════════════════════════════════════════════

const TMDB_IMG = "https://image.tmdb.org/t/p";

const FALLBACK_CATALOG = [
  {
    id: "m-001", tmdb_id: 157336, imdb_id: "tt0816692", slug: "interstellar-2014",
    title: "Interstellar", release_year: 2014, runtime_minutes: 169, content_rating: "PG-13",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    original_language: "en", origin_countries: ["US","GB"], is_international: false,
    poster_url: `${TMDB_IMG}/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdrop_url: `${TMDB_IMG}/w1280/xJHokMbljXjADYdit5fK1DVfjko.jpg`,
    genres: [{name:"Sci-Fi",slug:"sci-fi"},{name:"Drama",slug:"drama"},{name:"Adventure",slug:"adventure"}],
    directors: [{name:"Christopher Nolan",tmdb_person_id:525}],
    cast: [{name:"Matthew McConaughey",character_name:"Cooper",cast_order:0},{name:"Anne Hathaway",character_name:"Brand",cast_order:1},{name:"Jessica Chastain",character_name:"Murph",cast_order:2}],
    trailers: [{title:"Official Trailer",video_key:"zSWdZVtXT7E",video_type:"Trailer",is_primary:true}],
    keywords: ["space","wormhole","nasa","black hole","time travel"],
    imdb_rating: 8.7, rotten_tomatoes_score: 73, metacritic_score: 74,
    box_office_worldwide: 701729206, budget: 165000000,
    global_elo_score: 1952, global_rank: 1, comparison_count: 14832, win_rate: 0.78,
    avg_user_rating: 9.2, user_rating_count: 3241, review_count: 47,
    trending_score: 892, trending_rank: 3, is_highlighted: true,
    watchlist_count: 1247, seen_count: 8934,
  },
  {
    id: "m-002", tmdb_id: 496243, imdb_id: "tt6751668", slug: "parasite-2019",
    title: "Parasite", original_title: "기생충",
    release_year: 2019, runtime_minutes: 132, content_rating: "R",
    synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    original_language: "ko", origin_countries: ["KR"], is_international: true,
    poster_url: `${TMDB_IMG}/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
    backdrop_url: `${TMDB_IMG}/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg`,
    genres: [{name:"Thriller",slug:"thriller"},{name:"Drama",slug:"drama"},{name:"Comedy",slug:"comedy"}],
    directors: [{name:"Bong Joon-ho",tmdb_person_id:21684}],
    cast: [{name:"Song Kang-ho",character_name:"Ki-taek",cast_order:0},{name:"Choi Woo-shik",character_name:"Ki-woo",cast_order:1}],
    trailers: [{title:"Official Trailer",video_key:"SEUXfv87Wpk",video_type:"Trailer",is_primary:true}],
    keywords: ["class differences","wealth","dark comedy","seoul"],
    imdb_rating: 8.5, rotten_tomatoes_score: 98, metacritic_score: 96,
    box_office_worldwide: 266093946,
    global_elo_score: 1845, global_rank: 3, comparison_count: 11204, win_rate: 0.74,
    avg_user_rating: 9.0, user_rating_count: 2890, review_count: 62,
    trending_score: 445, trending_rank: 8, is_highlighted: false,
    watchlist_count: 932, seen_count: 6201,
  },
  {
    id: "m-003", tmdb_id: 155, imdb_id: "tt0468569", slug: "the-dark-knight-2008",
    title: "The Dark Knight", release_year: 2008, runtime_minutes: 152, content_rating: "PG-13",
    synopsis: "Batman raises the stakes in his war on crime, facing the Joker, a criminal mastermind who plunges Gotham into anarchy.",
    original_language: "en", origin_countries: ["US","GB"], is_international: false,
    poster_url: `${TMDB_IMG}/w500/qJ2tW6WMUDux911BTUgMe1YRr.jpg`,
    genres: [{name:"Action",slug:"action"},{name:"Crime",slug:"crime"},{name:"Drama",slug:"drama"}],
    directors: [{name:"Christopher Nolan",tmdb_person_id:525}],
    cast: [{name:"Christian Bale",character_name:"Batman",cast_order:0},{name:"Heath Ledger",character_name:"Joker",cast_order:1}],
    trailers: [{title:"Official Trailer",video_key:"EXeTwQWrcwY",video_type:"Trailer",is_primary:true}],
    imdb_rating: 9.0, global_elo_score: 1823, global_rank: 4,
    avg_user_rating: 9.1, user_rating_count: 4100, trending_score: 320, trending_rank: 12,
    watchlist_count: 890, seen_count: 9200,
  },
  {
    id: "m-004", tmdb_id: 244786, slug: "whiplash-2014",
    title: "Whiplash", release_year: 2014, runtime_minutes: 107, content_rating: "R",
    synopsis: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing.",
    original_language: "en", is_international: false,
    poster_url: `${TMDB_IMG}/w500/oPxnRhyAEBhPIT5uXGb02JMbuz.jpg`,
    genres: [{name:"Drama",slug:"drama"},{name:"Music",slug:"music"}],
    directors: [{name:"Damien Chazelle",tmdb_person_id:136495}],
    cast: [{name:"Miles Teller",character_name:"Andrew",cast_order:0},{name:"J.K. Simmons",character_name:"Fletcher",cast_order:1}],
    imdb_rating: 8.5, global_elo_score: 1768, global_rank: 8,
    avg_user_rating: 8.9, user_rating_count: 2100, trending_score: 210,
    watchlist_count: 430, seen_count: 3800,
  },
  {
    id: "m-005", tmdb_id: 614933, slug: "rrr-2022",
    title: "RRR", release_year: 2022, runtime_minutes: 187,
    synopsis: "A fictitious story about two legendary revolutionaries and their journey away from home before they began fighting for their country in the 1920s.",
    original_language: "te", origin_countries: ["IN"], is_international: true,
    poster_url: `${TMDB_IMG}/w500/nEufeZYpKOlqp3fkDJKVECVpfjn.jpg`,
    genres: [{name:"Action",slug:"action"},{name:"Drama",slug:"drama"}],
    directors: [{name:"S.S. Rajamouli",tmdb_person_id:84636}],
    cast: [{name:"N.T. Rama Rao Jr.",character_name:"Bheem",cast_order:0},{name:"Ram Charan",character_name:"Ram",cast_order:1}],
    imdb_rating: 7.8, global_elo_score: 1689, global_rank: 14,
    avg_user_rating: 8.4, user_rating_count: 1600, trending_score: 180,
    watchlist_count: 340, seen_count: 2900,
  },
];

const FALLBACK_UPCOMING = [
  {
    id: "u-001", title: "The Mummy", release_year: 2026, release_date: "2026-05-15",
    days_until_release: 43, poster_url: `${TMDB_IMG}/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg`,
    genres: [{name:"Horror",slug:"horror"}], directors: [{name:"Lee Cronin"}],
    anticipation_score: 720, is_must_see: true, must_see_reason: "From the director of Evil Dead Rise",
    watchlist_count: 342,
  },
  {
    id: "u-002", title: "Werwulf", release_year: 2026, release_date: "2026-12-25",
    days_until_release: 267,
    genres: [{name:"Horror",slug:"horror"}], directors: [{name:"Robert Eggers"}],
    anticipation_score: 890, is_must_see: true, must_see_reason: "Robert Eggers' werewolf epic",
    watchlist_count: 512,
  },
];

const FEED_ITEMS = [
  { id:"f-001", type:"rating", user:"@maya", avatar:"M", action:"rated", movie_title:"Interstellar", movie_id:"m-001", rating:9.5, time:"2m", likes:12, liked:false },
  { id:"f-002", type:"review", user:"@josh", avatar:"J", action:"reviewed", movie_title:"Parasite", movie_id:"m-002", preview:"Bong Joon-ho crafted something that transcends genre. The tonal shifts are masterful...", rating:9.0, time:"18m", likes:34, liked:false },
  { id:"f-003", type:"ranking", user:"@lina", avatar:"L", action:"updated rankings", preview:"New #1: The Dark Knight → dethroned Interstellar", time:"1h", likes:8, liked:false },
  { id:"f-004", type:"save", user:"@carlos", avatar:"C", action:"saved", movie_title:"RRR", movie_id:"m-005", time:"2h", likes:3, liked:false },
  { id:"f-005", type:"streak", user:"@maya", avatar:"M", action:"hit a 12-week streak 🔥", time:"3h", likes:45, liked:false },
];

const FRIEND_USERS = [
  { id:"u-maya", username:"maya", avatar:"M", followers:342, is_following:false },
  { id:"u-josh", username:"josh", avatar:"J", followers:128, is_following:true },
  { id:"u-lina", username:"lina", avatar:"L", followers:89, is_following:false },
  { id:"u-carlos", username:"carlos", avatar:"C", followers:56, is_following:true },
];

const USER = {
  username: "jasonk", current_streak_weeks: 7, longest_streak_weeks: 7,
  rated_count: 89, review_count: 23, following: 34, followers: 128,
  saved_movies: ["m-001", "m-002", "m-005"],
};

// ═══════════════════════════════════════════════════
// UI CONSTANTS
// ═══════════════════════════════════════════════════

const W = {
  bg: "#0f0f13", card: "#1a1a22", card2: "#222230", border: "#2c2c3a",
  text: "#ededf2", dim: "#6e6e82",
  accent: "#ff3b3b", accentDim: "#ff3b3b28",
  green: "#10b981", greenDim: "#10b98122",
  gold: "#eab308", goldDim: "#eab30822",
  blue: "#3b82f6", blueDim: "#3b82f622",
  purple: "#a855f7", purpleDim: "#a855f722",
  orange: "#f97316", orangeDim: "#f9731622",
};

// ═══════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════

const Phone = ({ children, label }) => (
  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
    <div style={{ width:320,height:640,background:W.bg,borderRadius:36,border:`2.5px solid ${W.border}`,overflow:"hidden",position:"relative",boxShadow:`0 24px 80px rgba(0,0,0,0.6)` }}>
      <div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:100,height:26,background:"#000",borderRadius:"0 0 18px 18px",zIndex:10 }} />
      <div style={{ height:44,display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 24px 4px",fontSize:11,color:W.dim,fontFamily:"monospace" }}>
        <span style={{fontWeight:600}}>9:41</span><span>●●● ▐██▌</span>
      </div>
      <div style={{ height:596,overflowY:"auto",overflowX:"hidden" }}>{children}</div>
    </div>
    <span style={{ fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1.5,textTransform:"uppercase",fontWeight:600 }}>{label}</span>
  </div>
);

const Poster = ({ url, w = 85, h = 120, radius = 10 }) => (
  <div style={{ width:w,height:h,borderRadius:radius,overflow:"hidden",flexShrink:0,background:W.card,border:`1px solid ${W.border}` }}>
    {url ? <img src={url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} /> : null}
  </div>
);

const Btn = ({ children, accent, full, small, onClick }) => (
  <div onClick={onClick} style={{ background:accent?W.accent:"transparent",border:accent?"none":`1px solid ${W.border}`,color:accent?"#fff":W.dim,borderRadius:12,padding:small?"6px 14px":"12px 20px",fontSize:small?10:12,fontWeight:700,textAlign:"center",width:full?"100%":"auto",fontFamily:"monospace",letterSpacing:0.5,cursor:"pointer" }}>{children}</div>
);

const NavBar = ({ active, onNav }) => (
  <div style={{ position:"absolute",bottom:0,left:0,right:0,height:58,background:"#09090c",borderTop:`1px solid ${W.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",zIndex:5 }}>
    {[{key:"home",icon:"⌂",label:"Home"},{key:"upcoming",icon:"◈",label:"Soon"},{key:"streak",icon:"🔥",label:"Streak"},{key:"search",icon:"⌕",label:"Search"},{key:"profile",icon:"●",label:"Me"}].map(item => (
      <div key={item.key} onClick={() => onNav(item.key)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer" }}>
        <span style={{ fontSize:18,color:item.key===active?W.accent:W.dim }}>{item.icon}</span>
        <span style={{ fontSize:8,fontFamily:"monospace",color:item.key===active?W.accent:W.dim,fontWeight:item.key===active?700:400 }}>{item.label}</span>
      </div>
    ))}
  </div>
);

const Badge = ({ color, children }) => (
  <span style={{ padding:"2px 7px",borderRadius:4,fontSize:7,fontWeight:900,fontFamily:"monospace",letterSpacing:0.5,background:color==="red"?W.accentDim:color==="gold"?W.goldDim:color==="green"?W.greenDim:color==="blue"?W.blueDim:color==="orange"?W.orangeDim:W.purpleDim,color:color==="red"?W.accent:color==="gold"?W.gold:color==="green"?W.green:color==="blue"?W.blue:color==="orange"?W.orange:W.purple,border:`1px solid ${color==="red"?W.accent+"33":color==="gold"?W.gold+"33":color==="green"?W.green+"33":color==="blue"?W.blue+"33":color==="orange"?W.orange+"33":W.purple+"33"}` }}>{children}</span>
);

const LoadingDots = () => {
  const [dots, setDots] = useState("");
  useEffect(() => { const i = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400); return () => clearInterval(i); }, []);
  return <span style={{ color:W.dim,fontFamily:"monospace",fontSize:11 }}>Loading{dots}</span>;
};

const Spinner = () => (
  <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}><LoadingDots /></div>
);

// ═══════════════════════════════════════════════════
// API KEY BANNER (shown inside phone when no key)
// ═══════════════════════════════════════════════════

const ApiKeyBanner = () => (
  <div style={{ margin:"6px 10px",padding:"8px 12px",background:W.orangeDim,border:`1px solid ${W.orange}44`,borderRadius:10 }}>
    <div style={{ fontSize:9,fontWeight:800,color:W.orange,fontFamily:"monospace",letterSpacing:0.5 }}>⚡ DEMO MODE — SAMPLE DATA</div>
    <div style={{ fontSize:8,color:W.dim,fontFamily:"monospace",lineHeight:1.5,marginTop:3 }}>
      Set VITE_TMDB_API_KEY to load live data
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════

const HomeScreen = ({ onNav, onSelectMovie }) => {
  const [catalog, setCatalog] = useState(null);
  const [feedLikes, setFeedLikes] = useState({});
  const [following, setFollowing] = useState(() => {
    const m = {}; FRIEND_USERS.forEach(u => { m[u.id] = u.is_following; }); return m;
  });
  const [savedMovies, setSavedMovies] = useState(new Set(USER.saved_movies));
  const liveData = hasApiKey();

  useEffect(() => {
    if (liveData) {
      fetchTrending().then(data => setCatalog(data || FALLBACK_CATALOG));
    } else {
      setTimeout(() => setCatalog(FALLBACK_CATALOG), 500);
    }
  }, [liveData]);

  const toggleLike = (id) => setFeedLikes(p => ({ ...p, [id]: !p[id] }));
  const toggleFollow = (uid) => setFollowing(p => ({ ...p, [uid]: !p[uid] }));
  const toggleSave = (mid) => setSavedMovies(p => { const n = new Set(p); n.has(mid) ? n.delete(mid) : n.add(mid); return n; });

  if (!catalog) return <Spinner />;

  const highlights = catalog.filter(m => m.is_highlighted || (m.trending_rank && m.trending_rank <= 5) || m.tmdb_popularity > 80).slice(0, 4);
  const showHighlights = highlights.length > 0 ? highlights : catalog.slice(0, 4);

  return (
    <div style={{ position:"relative",height:"100%" }}>
      {!liveData && <ApiKeyBanner />}
      <div style={{ padding:"4px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontSize:18,fontWeight:900,color:W.accent,fontFamily:"monospace",letterSpacing:-1 }}>RATED</div>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          {liveData && <Badge color="green">LIVE</Badge>}
          <div style={{ display:"flex",gap:3,alignItems:"center",background:W.goldDim,border:`1px solid ${W.gold}44`,borderRadius:20,padding:"3px 10px" }}>
            <span style={{ fontSize:12 }}>🔥</span>
            <span style={{ fontSize:10,fontWeight:800,color:W.gold,fontFamily:"monospace" }}>{USER.current_streak_weeks}</span>
          </div>
        </div>
      </div>
      <div style={{ padding:"8px 22px 70px",display:"flex",flexDirection:"column",gap:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1.5 }}>
          {liveData ? "🔴 TRENDING THIS WEEK" : "HIGHLIGHTS"}
        </div>
        <div style={{ display:"flex",gap:10,overflowX:"auto",paddingBottom:4 }}>
          {showHighlights.map((m, idx) => (
            <div key={m.id} style={{ flexShrink:0,width:105 }}>
              <div style={{ position:"relative",cursor:"pointer" }} onClick={() => onSelectMovie(m)}>
                <Poster url={m.poster_url} w={105} h={148} radius={12} />
                {idx < 3 && (
                  <div style={{ position:"absolute",top:6,left:6,background:W.accent,color:"#fff",fontSize:7,fontWeight:900,padding:"2px 6px",borderRadius:4,fontFamily:"monospace" }}>#{idx + 1}</div>
                )}
                {m.is_international && (
                  <div style={{ position:"absolute",top:6,right:6,background:W.purpleDim,border:`1px solid ${W.purple}44`,borderRadius:4,padding:"1px 4px",fontSize:7,fontWeight:700,color:W.purple,fontFamily:"monospace" }}>
                    {m.original_language?.toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5 }}>
                <div style={{ minWidth:0,flex:1 }}>
                  <div style={{ fontSize:10,fontWeight:700,color:W.text,fontFamily:"monospace",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.title}</div>
                  <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace" }}>{m.release_year}</div>
                </div>
                <div onClick={(e) => { e.stopPropagation(); toggleSave(m.id); }} style={{ cursor:"pointer",fontSize:14,flexShrink:0,marginLeft:4 }}>
                  {savedMovies.has(m.id) ? <span style={{color:W.blue}}>◆</span> : <span style={{color:W.dim}}>◇</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize:11,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1.5 }}>ACTIVITY</div>
        {FEED_ITEMS.map(item => {
          const isLiked = feedLikes[item.id] ?? item.liked;
          const likeCount = (item.likes || 0) + (feedLikes[item.id] && !item.liked ? 1 : 0) - (!feedLikes[item.id] && item.liked ? 1 : 0);
          const friendUser = FRIEND_USERS.find(u => `@${u.username}` === item.user);
          const isFollowing = friendUser ? following[friendUser.id] : false;
          return (
            <div key={item.id} style={{ background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <div style={{ width:30,height:30,borderRadius:"50%",background:W.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace",flexShrink:0 }}>{item.avatar}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:W.accent,fontFamily:"monospace" }}>{item.user}</span>
                    {friendUser && (
                      <div onClick={() => toggleFollow(friendUser.id)} style={{ cursor:"pointer",padding:"1px 8px",borderRadius:10,fontSize:8,fontWeight:700,fontFamily:"monospace",background:isFollowing?W.accentDim:"transparent",border:`1px solid ${isFollowing?W.accent:W.border}`,color:isFollowing?W.accent:W.dim }}>
                        {isFollowing ? "FOLLOWING" : "+ FOLLOW"}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace" }}>{item.time} ago</div>
                </div>
              </div>
              <div style={{ fontSize:11,color:W.text,fontFamily:"monospace",lineHeight:1.5,marginBottom:6 }}>
                {item.type === "rating" && <span>{item.action} <span style={{color:W.gold,fontWeight:700}}>{item.movie_title}</span> <span style={{color:W.gold}}>★ {item.rating}/10</span></span>}
                {item.type === "review" && <div><span>{item.action} <span style={{color:W.gold,fontWeight:700}}>{item.movie_title}</span> <span style={{color:W.gold}}>★ {item.rating}/10</span></span><div style={{ fontSize:10,color:W.dim,marginTop:4,fontStyle:"italic",lineHeight:1.5 }}>"{item.preview?.slice(0, 100)}..."</div></div>}
                {item.type === "ranking" && <div><span>{item.action}</span><div style={{ fontSize:10,color:W.dim,marginTop:2 }}>{item.preview}</div></div>}
                {item.type === "save" && <span>saved <span style={{color:W.blue,fontWeight:700}}>{item.movie_title}</span> to watch later 🎬</span>}
                {item.type === "streak" && <span>{item.action}</span>}
              </div>
              <div style={{ display:"flex",gap:14,alignItems:"center",paddingTop:6,borderTop:`1px solid ${W.border}` }}>
                <div onClick={() => toggleLike(item.id)} style={{ display:"flex",alignItems:"center",gap:4,cursor:"pointer" }}>
                  <span style={{ fontSize:14,color:isLiked?W.accent:W.dim }}>{isLiked ? "♥" : "♡"}</span>
                  <span style={{ fontSize:10,color:isLiked?W.accent:W.dim,fontFamily:"monospace",fontWeight:isLiked?700:400 }}>{likeCount}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:4,cursor:"pointer" }}>
                  <span style={{ fontSize:12,color:W.dim }}>💬</span>
                  <span style={{ fontSize:10,color:W.dim,fontFamily:"monospace" }}>Reply</span>
                </div>
                {item.movie_id && (
                  <div onClick={() => toggleSave(item.movie_id)} style={{ display:"flex",alignItems:"center",gap:4,cursor:"pointer",marginLeft:"auto" }}>
                    <span style={{ fontSize:13,color:savedMovies.has(item.movie_id)?W.blue:W.dim }}>{savedMovies.has(item.movie_id) ? "◆" : "◇"}</span>
                    <span style={{ fontSize:10,color:savedMovies.has(item.movie_id)?W.blue:W.dim,fontFamily:"monospace",fontWeight:savedMovies.has(item.movie_id)?700:400 }}>{savedMovies.has(item.movie_id) ? "Saved" : "Save"}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {savedMovies.size > 0 && (
          <>
            <div style={{ fontSize:11,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1.5 }}>YOUR SAVED · {savedMovies.size} FILMS</div>
            <div style={{ display:"flex",gap:8,overflowX:"auto" }}>
              {catalog.filter(m => savedMovies.has(m.id)).map(m => (
                <div key={m.id} style={{ flexShrink:0,cursor:"pointer",position:"relative" }} onClick={() => onSelectMovie(m)}>
                  <Poster url={m.poster_url} w={60} h={84} radius={8} />
                  <div style={{ position:"absolute",top:3,right:3,width:14,height:14,background:W.blue,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff" }}>◆</div>
                  <div style={{ fontSize:8,color:W.dim,fontFamily:"monospace",marginTop:2,textAlign:"center",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.title}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <NavBar active="home" onNav={onNav} />
    </div>
  );
};

const MovieDetailScreen = ({ movie, onBack }) => {
  const [detail, setDetail] = useState(null);
  const [saved, setSaved] = useState(false);
  const liveData = hasApiKey();

  useEffect(() => {
    if (!movie) return;
    setSaved(USER.saved_movies.includes(movie.id));
    setDetail(null);
    if (liveData && movie.tmdb_id) {
      fetchMovieDetail(movie.tmdb_id).then(d => setDetail(d || movie));
    } else {
      setTimeout(() => setDetail(movie), 300);
    }
  }, [movie?.id, liveData]);

  if (!movie) return null;
  if (!detail) return <Spinner />;

  const m = detail;
  const primaryTrailer = m.trailers?.find(t => t.is_primary) || m.trailers?.[0];

  return (
    <div style={{ position:"relative",height:"100%" }}>
      <div style={{ position:"relative",height:180,background:`linear-gradient(180deg, #1a1a28, ${W.bg})`,overflow:"hidden" }}>
        {m.backdrop_url && <img src={m.backdrop_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",opacity:0.3 }} onError={e=>{e.target.style.display="none"}} />}
        <div style={{ position:"absolute",top:10,left:16,fontSize:11,color:W.dim,fontFamily:"monospace",cursor:"pointer" }} onClick={onBack}>← Back</div>
        {primaryTrailer && (
          <a href={`https://youtube.com/watch?v=${primaryTrailer.video_key}`} target="_blank" rel="noreferrer" style={{ textDecoration:"none",position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
            <div style={{ width:44,height:44,background:`${W.accent}cc`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",boxShadow:`0 0 20px ${W.accent}44` }}>▶</div>
            <span style={{ fontSize:9,color:"#fff",fontFamily:"monospace",fontWeight:600,textShadow:"0 1px 6px rgba(0,0,0,0.8)" }}>PLAY TRAILER</span>
          </a>
        )}
        <div style={{ position:"absolute",bottom:-40,left:22 }}><Poster url={m.poster_url} w={72} h={100} radius={10} /></div>
      </div>

      <div style={{ padding:"48px 22px 20px",display:"flex",flexDirection:"column",gap:8 }}>
        <div>
          <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
            <span style={{ fontSize:18,fontWeight:900,color:W.text,fontFamily:"monospace",letterSpacing:-0.5 }}>{m.title}</span>
            {m.is_international && <Badge color="purple">{m.original_language?.toUpperCase()}</Badge>}
            {liveData && <Badge color="green">LIVE</Badge>}
          </div>
          {m.original_title && m.original_title !== m.title && (
            <div style={{ fontSize:10,color:W.dim,fontFamily:"monospace",fontStyle:"italic" }}>{m.original_title}</div>
          )}
          <div style={{ fontSize:10,color:W.dim,fontFamily:"monospace",marginTop:3 }}>
            {m.release_year} · {m.directors?.[0]?.name} · {m.runtime_minutes ? `${Math.floor(m.runtime_minutes/60)}h ${m.runtime_minutes%60}m` : ""} · {m.content_rating || "NR"}
          </div>
        </div>

        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {m.global_rank && <div style={{ background:W.accentDim,border:`1px solid ${W.accent}33`,borderRadius:10,padding:"6px 12px",textAlign:"center" }}><div style={{ fontSize:16,fontWeight:900,color:W.accent,fontFamily:"monospace" }}>#{m.global_rank}</div><div style={{ fontSize:7,color:W.dim,fontFamily:"monospace" }}>RATED</div></div>}
          {m.imdb_rating && <div style={{ background:W.goldDim,border:`1px solid ${W.gold}33`,borderRadius:10,padding:"6px 12px",textAlign:"center" }}><div style={{ fontSize:16,fontWeight:900,color:W.gold,fontFamily:"monospace" }}>{m.imdb_rating}</div><div style={{ fontSize:7,color:W.dim,fontFamily:"monospace" }}>IMDb</div></div>}
          {m.avg_user_rating && !m.imdb_rating && <div style={{ background:W.goldDim,border:`1px solid ${W.gold}33`,borderRadius:10,padding:"6px 12px",textAlign:"center" }}><div style={{ fontSize:16,fontWeight:900,color:W.gold,fontFamily:"monospace" }}>{m.avg_user_rating?.toFixed(1)}</div><div style={{ fontSize:7,color:W.dim,fontFamily:"monospace" }}>TMDB</div></div>}
          {m.rotten_tomatoes_score && <div style={{ background:W.greenDim,border:`1px solid ${W.green}33`,borderRadius:10,padding:"6px 12px",textAlign:"center" }}><div style={{ fontSize:16,fontWeight:900,color:W.green,fontFamily:"monospace" }}>{m.rotten_tomatoes_score}%</div><div style={{ fontSize:7,color:W.dim,fontFamily:"monospace" }}>RT</div></div>}
          <div style={{ background:W.blueDim,border:`1px solid ${W.blue}33`,borderRadius:10,padding:"6px 12px",textAlign:"center",flex:1 }}><div style={{ fontSize:16,fontWeight:900,color:W.blue,fontFamily:"monospace" }}>{m.global_elo_score}</div><div style={{ fontSize:7,color:W.dim,fontFamily:"monospace" }}>ELO</div></div>
        </div>

        <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
          {m.genres?.map(g => <span key={g.slug||g.name} style={{ padding:"3px 10px",borderRadius:16,fontSize:9,fontFamily:"monospace",fontWeight:600,background:W.card,border:`1px solid ${W.border}`,color:W.dim }}>{g.name}</span>)}
        </div>

        {m.synopsis && (
          <div style={{ fontSize:11,color:W.dim,fontFamily:"monospace",lineHeight:1.6 }}>
            {m.synopsis.slice(0, 200)}{m.synopsis.length > 200 && <span style={{ color:W.accent,fontWeight:600 }}> read more</span>}
          </div>
        )}

        {m.tagline && (
          <div style={{ fontSize:10,color:W.accent,fontFamily:"monospace",fontStyle:"italic",borderLeft:`2px solid ${W.accent}`,paddingLeft:8 }}>"{m.tagline}"</div>
        )}

        <div style={{ display:"flex",gap:6 }}>
          <div style={{ flex:1 }}><Btn accent full small>★ RATE</Btn></div>
          <div style={{ flex:1 }} onClick={() => setSaved(!saved)}>
            <div style={{ background:saved?W.blueDim:"transparent",border:`1px solid ${saved?W.blue:W.border}`,color:saved?W.blue:W.dim,borderRadius:12,padding:"6px 14px",fontSize:10,fontWeight:700,textAlign:"center",fontFamily:"monospace",cursor:"pointer" }}>
              {saved ? "◆ SAVED" : "◇ SAVE"}
            </div>
          </div>
          <div style={{ flex:1 }}><Btn full small>✎ REVIEW</Btn></div>
        </div>

        {m.cast && m.cast.length > 0 && (
          <>
            <div style={{ fontSize:10,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:4 }}>CAST</div>
            <div style={{ display:"flex",gap:10,overflowX:"auto" }}>
              {m.cast.slice(0, 5).map((c, i) => (
                <div key={i} style={{ textAlign:"center",flexShrink:0 }}>
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.name} style={{ width:40,height:40,borderRadius:"50%",objectFit:"cover",border:`1px solid ${W.border}`,display:"block",margin:"0 auto 3px" }} onError={e => { e.target.style.display="none"; }} />
                  ) : (
                    <div style={{ width:40,height:40,borderRadius:"50%",background:W.card,border:`1px solid ${W.border}`,margin:"0 auto 3px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>👤</div>
                  )}
                  <div style={{ fontSize:9,fontWeight:700,color:W.text,fontFamily:"monospace",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name.split(" ").pop()}</div>
                  <div style={{ fontSize:8,color:W.dim,fontFamily:"monospace" }}>{c.character_name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {m.trailers && m.trailers.length > 0 && (
          <>
            <div style={{ fontSize:10,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:4 }}>TRAILERS</div>
            <div style={{ display:"flex",gap:8,overflowX:"auto" }}>
              {m.trailers.slice(0, 4).map((t, i) => (
                <a key={i} href={`https://youtube.com/watch?v=${t.video_key}`} target="_blank" rel="noreferrer" style={{ textDecoration:"none",position:"relative",flexShrink:0 }}>
                  <div style={{ width:140,height:78,borderRadius:10,overflow:"hidden",background:`linear-gradient(135deg,#1c1c2c,#2a2a3a)` }}>
                    <img src={`https://img.youtube.com/vi/${t.video_key}/hqdefault.jpg`} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",opacity:0.7 }} onError={e=>{e.target.style.display="none"}} />
                  </div>
                  <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:22,height:22,background:`${W.accent}cc`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>▶</div>
                  <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:3,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
                </a>
              ))}
            </div>
          </>
        )}

        <div style={{ display:"flex",gap:8,marginTop:4 }}>
          {[
            {n:m.user_rating_count||0,l:"Ratings"},{n:m.review_count||0,l:"Reviews"},{n:m.watchlist_count||0,l:"Watchlisted"},{n:m.seen_count||0,l:"Seen"}
          ].map((s,i) => (
            <div key={i} style={{ flex:1,textAlign:"center",background:W.card,borderRadius:8,padding:"6px 4px",border:`1px solid ${W.border}` }}>
              <div style={{ fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace" }}>{s.n > 999 ? `${(s.n/1000).toFixed(1)}k` : s.n}</div>
              <div style={{ fontSize:7,color:W.dim,fontFamily:"monospace" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {m.keywords && m.keywords.length > 0 && (
          <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginTop:2 }}>
            {m.keywords.slice(0, 8).map(k => <span key={k} style={{ padding:"2px 8px",borderRadius:10,fontSize:8,fontFamily:"monospace",background:W.card,border:`1px solid ${W.border}`,color:W.dim }}>#{k}</span>)}
          </div>
        )}

        {(m.box_office_worldwide || m.budget) && (
          <div style={{ display:"flex",gap:8,marginTop:4,fontSize:9,fontFamily:"monospace",color:W.dim }}>
            {m.budget > 0 && <span>💰 Budget: <span style={{color:W.text}}>${(m.budget/1e6).toFixed(0)}M</span></span>}
            {m.box_office_worldwide > 0 && <span>🎬 WW Gross: <span style={{color:W.green}}>${(m.box_office_worldwide/1e6).toFixed(0)}M</span></span>}
          </div>
        )}
      </div>
    </div>
  );
};

const UpcomingScreen = ({ onNav }) => {
  const [upcoming, setUpcoming] = useState(null);
  const [filter, setFilter] = useState("All");
  const liveData = hasApiKey();

  useEffect(() => {
    if (liveData) {
      fetchUpcoming().then(data => setUpcoming(data?.length ? data : FALLBACK_UPCOMING));
    } else {
      setTimeout(() => setUpcoming(FALLBACK_UPCOMING), 400);
    }
  }, [liveData]);

  if (!upcoming) return (
    <div style={{ position:"relative",height:"100%" }}>
      <div style={{ padding:"8px 22px 6px",fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace" }}>◈ UPCOMING · MUST SEE</div>
      <Spinner />
      <NavBar active="upcoming" onNav={onNav} />
    </div>
  );

  const genres = ["All", ...new Set(upcoming.flatMap(u => u.genres?.map(g => g.name) || []))].slice(0, 5);
  const filtered = filter === "All" ? upcoming : upcoming.filter(u => u.genres?.some(g => g.name === filter));

  return (
    <div style={{ position:"relative",height:"100%" }}>
      <div style={{ padding:"8px 22px 4px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace" }}>◈ UPCOMING · MUST SEE</span>
        {liveData && <Badge color="green">LIVE</Badge>}
      </div>
      {!liveData && <ApiKeyBanner />}
      <div style={{ display:"flex",gap:6,padding:"0 22px 8px",overflowX:"auto" }}>
        {genres.map((t,i) => (
          <span key={t} onClick={() => setFilter(t)} style={{ cursor:"pointer",padding:"4px 12px",borderRadius:16,fontSize:9,fontFamily:"monospace",fontWeight:600,flexShrink:0,background:filter===t?W.accentDim:W.card,border:`1px solid ${filter===t?W.accent:W.border}`,color:filter===t?W.accent:W.dim }}>{t}</span>
        ))}
      </div>
      <div style={{ padding:"0 22px 70px",display:"flex",flexDirection:"column",gap:10 }}>
        {filtered.sort((a,b) => (a.days_until_release||999) - (b.days_until_release||999)).map(u => (
          <div key={u.id} style={{ background:W.card,border:`1px solid ${u.is_must_see?W.accent+"33":W.border}`,borderRadius:14,padding:14 }}>
            <div style={{ display:"flex",gap:12 }}>
              <Poster url={u.poster_url} w={56} h={78} radius={8} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                  <span style={{ fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace" }}>{u.title}</span>
                  {u.is_must_see && <Badge color="red">MUST SEE</Badge>}
                </div>
                <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:2 }}>{u.directors?.[0]?.name} · {u.genres?.slice(0,2).map(g=>g.name).join(", ")}</div>
                {u.must_see_reason && <div style={{ fontSize:10,color:W.gold,fontFamily:"monospace",marginTop:4,lineHeight:1.4 }}>{u.must_see_reason.slice(0,80)}</div>}
                <div style={{ display:"flex",gap:10,marginTop:6 }}>
                  <div style={{ fontSize:10,color:W.dim,fontFamily:"monospace" }}>📅 {u.release_date}</div>
                  {u.days_until_release != null && <div style={{ fontSize:10,color:u.days_until_release < 30 ? W.accent : W.dim,fontFamily:"monospace",fontWeight:700 }}>{u.days_until_release}d away</div>}
                </div>
                <div style={{ display:"flex",gap:8,marginTop:6,fontSize:9,color:W.dim,fontFamily:"monospace" }}>
                  <span>👀 {u.watchlist_count} watching</span>
                  {u.tmdb_popularity && <span>📊 {Math.round(u.tmdb_popularity)} pop</span>}
                </div>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,marginTop:10 }}>
              <div style={{ flex:1 }}><Btn accent full small>+ WATCHLIST</Btn></div>
              <div style={{ flex:1 }}><Btn full small>🔔 NOTIFY ME</Btn></div>
            </div>
          </div>
        ))}
      </div>
      <NavBar active="upcoming" onNav={onNav} />
    </div>
  );
};

const SearchScreen = ({ onNav, onSelectMovie }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const liveData = hasApiKey();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      if (liveData) {
        const data = await searchMovies(query);
        setResults(data || FALLBACK_CATALOG.filter(m => m.title.toLowerCase().includes(query.toLowerCase())));
      } else {
        setResults(FALLBACK_CATALOG.filter(m => m.title.toLowerCase().includes(query.toLowerCase())));
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, liveData]);

  const noResults = query.length > 2 && results.length === 0 && !searching;

  return (
    <div style={{ position:"relative",height:"100%" }}>
      <div style={{ padding:"8px 22px 6px" }}>
        <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:6 }}>
          {liveData && <Badge color="green">TMDB LIVE</Badge>}
        </div>
        <input value={query} onChange={e => { setQuery(e.target.value); setShowCustomForm(false); }}
          placeholder="⌕ Search movies, directors..."
          style={{ width:"100%",background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"11px 16px",fontSize:12,color:W.text,fontFamily:"monospace",outline:"none",boxSizing:"border-box" }}
        />
      </div>

      <div style={{ padding:"0 22px 70px" }}>
        {searching && <div style={{ textAlign:"center",padding:"12px 0" }}><LoadingDots /></div>}

        {results.map(m => (
          <div key={m.id} onClick={() => onSelectMovie(m)} style={{ display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${W.border}`,cursor:"pointer" }}>
            <Poster url={m.poster_url} w={36} h={50} radius={6} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace" }}>{m.title}</div>
              <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace" }}>{m.release_year}{m.directors?.[0]?.name ? ` · ${m.directors[0].name}` : ""} {m.is_international ? `· 🌏 ${m.original_language}` : ""}</div>
            </div>
            {m.avg_user_rating && <div style={{ fontSize:10,fontWeight:800,color:W.gold,fontFamily:"monospace" }}>★{m.avg_user_rating?.toFixed(1)}</div>}
          </div>
        ))}

        {noResults && !showCustomForm && (
          <div style={{ textAlign:"center",padding:"24px 0" }}>
            <div style={{ fontSize:24,marginBottom:8 }}>🔍</div>
            <div style={{ fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace" }}>No results for "{query}"</div>
            <div style={{ fontSize:10,color:W.dim,fontFamily:"monospace",marginTop:4,lineHeight:1.5 }}>Can't find it? Add it to your personal rankings.</div>
            <div style={{ marginTop:12 }} onClick={() => { setShowCustomForm(true); setCustomTitle(query); }}><Btn accent>+ ADD TO MY LIST</Btn></div>
            <div style={{ fontSize:8,color:W.dim,fontFamily:"monospace",marginTop:6 }}>Private to your profile only</div>
          </div>
        )}

        {showCustomForm && (
          <div style={{ padding:"12px 0",display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ fontSize:12,fontWeight:700,color:W.accent,fontFamily:"monospace" }}>ADD CUSTOM MOVIE</div>
            <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace",background:W.card,border:`1px solid ${W.border}`,borderRadius:8,padding:8 }}>
              🔒 Only visible in YOUR personal rankings.
            </div>
            <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Movie title *"
              style={{ background:W.card,border:`1px solid ${W.border}`,borderRadius:10,padding:"11px 14px",fontSize:11,color:W.text,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box" }} />
            {["Year","Director (optional)","Where did you watch it?"].map(f => (
              <div key={f} style={{ background:W.card,border:`1px solid ${W.border}`,borderRadius:10,padding:"11px 14px",fontSize:11,color:W.dim,fontFamily:"monospace" }}>{f}</div>
            ))}
            <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
              {["Action","Comedy","Drama","Horror","Sci-Fi","Thriller","Romance","Doc","Int'l"].map(g => (
                <span key={g} style={{ padding:"4px 10px",borderRadius:16,fontSize:9,fontFamily:"monospace",fontWeight:600,background:W.card,border:`1px solid ${W.border}`,color:W.dim,cursor:"pointer" }}>{g}</span>
              ))}
            </div>
            <Btn accent full>SAVE TO MY RANKINGS</Btn>
            <div style={{ textAlign:"center",fontSize:8,color:W.dim,fontFamily:"monospace" }}>Max 50 custom movies · Private only</div>
          </div>
        )}

        {query.length <= 1 && !showCustomForm && (
          <>
            <div style={{ fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:8 }}>
              {liveData ? "🔴 TRENDING ON TMDB" : "TRENDING"}
            </div>
            {FALLBACK_CATALOG.sort((a,b) => (a.trending_rank||99) - (b.trending_rank||99)).slice(0, 5).map(m => (
              <div key={m.id} onClick={() => onSelectMovie(m)} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${W.border}`,cursor:"pointer" }}>
                <span style={{ fontSize:11,color:W.dim }}>🔥</span>
                <span style={{ fontSize:12,color:W.text,fontFamily:"monospace",flex:1 }}>{m.title}</span>
                {m.is_international && <Badge color="purple">{m.original_language}</Badge>}
                <span style={{ fontSize:10,color:W.dim }}>→</span>
              </div>
            ))}
            <div style={{ fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:12 }}>BROWSE</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:4 }}>
              {["🎭 Drama","🚀 Sci-Fi","😱 Horror","😂 Comedy","💥 Action","🌏 International","🎬 Nolan","🏆 Oscars"].map(c => (
                <span key={c} style={{ padding:"7px 14px",borderRadius:10,fontSize:10,fontFamily:"monospace",fontWeight:600,background:W.card,border:`1px solid ${W.border}`,color:W.dim,cursor:"pointer" }}>{c}</span>
              ))}
            </div>
          </>
        )}
      </div>
      <NavBar active="search" onNav={onNav} />
    </div>
  );
};

const ProfileScreen = ({ onNav, onSelectMovie }) => {
  const [tab, setTab] = useState("rankings");
  const [savedSet] = useState(new Set(USER.saved_movies));
  const savedMovies = FALLBACK_CATALOG.filter(m => savedSet.has(m.id));
  const allRankings = FALLBACK_CATALOG.sort((a, b) => (b.global_elo_score || 0) - (a.global_elo_score || 0));

  return (
    <div style={{ position:"relative",height:"100%" }}>
      <div style={{ padding:"8px 22px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace" }}>MY PROFILE</span>
        <span style={{ fontSize:14 }}>⚙</span>
      </div>
      <div style={{ padding:"0 22px",display:"flex",gap:14,alignItems:"center" }}>
        <div style={{ width:54,height:54,borderRadius:"50%",background:W.card,border:`2px solid ${W.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>👤</div>
        <div>
          <div style={{ fontSize:15,fontWeight:900,color:W.text,fontFamily:"monospace" }}>@{USER.username}</div>
          <div style={{ display:"flex",gap:4,alignItems:"center",marginTop:2 }}>
            <span style={{ fontSize:12 }}>🔥</span>
            <span style={{ fontSize:10,fontWeight:700,color:W.gold,fontFamily:"monospace" }}>{USER.current_streak_weeks}-week streak</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex",padding:"14px 22px" }}>
        {[{n:USER.rated_count,l:"Rated"},{n:savedMovies.length,l:"Saved"},{n:USER.following,l:"Following"},{n:USER.followers,l:"Followers"}].map((s,i) => (
          <div key={i} style={{ flex:1,textAlign:"center" }}>
            <div style={{ fontSize:16,fontWeight:900,color:i===1?W.blue:W.text,fontFamily:"monospace" }}>{s.n}</div>
            <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace" }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex",borderBottom:`1px solid ${W.border}`,margin:"0 22px" }}>
        {["rankings","saved","reviews","notes"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex:1,textAlign:"center",padding:"8px 0",fontSize:10,fontFamily:"monospace",fontWeight:600,color:tab===t?W.accent:W.dim,borderBottom:`2px solid ${tab===t?W.accent:"transparent"}`,cursor:"pointer",textTransform:"capitalize" }}>{t}</div>
        ))}
      </div>
      <div style={{ padding:"10px 22px 70px",display:"flex",flexDirection:"column",gap:5 }}>
        {tab === "rankings" && <>
          <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1 }}>YOUR PERSONAL RANKINGS · {allRankings.length} films</div>
          {allRankings.slice(0, 6).map((m, i) => (
            <div key={m.id} onClick={() => onSelectMovie(m)} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:W.card,borderRadius:10,border:`1px solid ${W.border}`,cursor:"pointer" }}>
              <span style={{ fontSize:11,fontWeight:900,color:W.accent,fontFamily:"monospace",width:18 }}>{i + 1}</span>
              <Poster url={m.poster_url} w={28} h={38} radius={4} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:11,color:W.text,fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.title}</div>
                <div style={{ fontSize:8,color:W.dim,fontFamily:"monospace" }}>{m.release_year}</div>
              </div>
              <span style={{ fontSize:10,color:W.gold,fontFamily:"monospace" }}>★{m.avg_user_rating || "—"}</span>
            </div>
          ))}
        </>}
        {tab === "saved" && <>
          <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1 }}>MOVIES TO WATCH · {savedMovies.length} saved</div>
          {savedMovies.length === 0 ? (
            <div style={{ textAlign:"center",padding:"20px 0" }}>
              <div style={{ fontSize:24,marginBottom:6 }}>◇</div>
              <div style={{ fontSize:11,color:W.dim,fontFamily:"monospace" }}>No saved movies yet</div>
            </div>
          ) : savedMovies.map(m => (
            <div key={m.id} onClick={() => onSelectMovie(m)} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:W.card,borderRadius:10,border:`1px solid ${W.blue}22`,cursor:"pointer" }}>
              <Poster url={m.poster_url} w={36} h={50} radius={6} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:11,fontWeight:700,color:W.text,fontFamily:"monospace" }}>{m.title}</div>
                <div style={{ fontSize:9,color:W.dim,fontFamily:"monospace" }}>{m.release_year} · {m.directors?.[0]?.name}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:12,color:W.blue }}>◆</div>
                <div style={{ fontSize:7,color:W.blue,fontFamily:"monospace" }}>SAVED</div>
              </div>
            </div>
          ))}
        </>}
        {tab === "reviews" && <div style={{ textAlign:"center",padding:"20px 0" }}><div style={{ fontSize:11,color:W.dim,fontFamily:"monospace" }}>{USER.review_count} reviews written</div></div>}
        {tab === "notes" && <div style={{ textAlign:"center",padding:"20px 0" }}><div style={{ fontSize:11,color:W.dim,fontFamily:"monospace" }}>Private notes on your films</div></div>}
      </div>
      <NavBar active="profile" onNav={onNav} />
    </div>
  );
};

const StreakScreen = ({ onNav }) => {
  const weeks = Array.from({length:8}, (_,i) => ({
    week: `W${i+1}`, done: i < 7, count: [5,7,4,6,3,8,2,1][i], current: i === 7
  }));
  return (
    <div style={{ position:"relative",height:"100%" }}>
      <div style={{ padding:"8px 22px 6px",fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace" }}>🔥 WEEKLY STREAK</div>
      <div style={{ padding:"0 22px",display:"flex",flexDirection:"column",gap:12 }}>
        <div style={{ textAlign:"center",padding:"16px 0 8px" }}>
          <div style={{ fontSize:52,fontWeight:900,color:W.gold,fontFamily:"monospace",lineHeight:1,textShadow:`0 0 40px ${W.gold}33` }}>7</div>
          <div style={{ fontSize:11,color:W.dim,fontFamily:"monospace",letterSpacing:2,marginTop:4 }}>WEEK STREAK</div>
        </div>
        <div style={{ display:"flex",gap:4,justifyContent:"center" }}>
          {weeks.map((w,i) => (
            <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,width:32 }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:w.current?W.accentDim:w.done?W.goldDim:W.card,border:`2px solid ${w.current?W.accent:w.done?W.gold:W.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:w.done&&!w.current?12:10,color:w.current?W.accent:w.done?W.gold:W.dim,fontWeight:800,fontFamily:"monospace" }}>
                {w.done&&!w.current?"✓":w.count}
              </div>
              <span style={{ fontSize:8,color:w.current?W.accent:W.dim,fontFamily:"monospace",fontWeight:w.current?700:400 }}>{w.week}</span>
            </div>
          ))}
        </div>
        <div style={{ background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:14 }}>
          <div style={{ fontSize:11,fontWeight:700,color:W.text,fontFamily:"monospace",marginBottom:8 }}>How Streaks Work</div>
          {[["⭐","Rate 3+ movies per week"],["📝","1 review = 2 ratings"],["🔥","Resets Monday 12am"],["🏆","10 weeks → Gold Badge"],["💎","52 weeks → Diamond"]].map(([icon,text],i) => (
            <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"4px 0" }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={{ fontSize:10,color:W.dim,fontFamily:"monospace" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
      <NavBar active="streak" onNav={onNav} />
    </div>
  );
};

// ═══════════════════════════════════════════════════
// API KEY INFO PANEL (shown outside the phone)
// ═══════════════════════════════════════════════════

const ApiKeyInfo = () => {
  const live = hasApiKey();
  return (
    <div style={{ maxWidth:500,margin:"16px auto 0",fontFamily:"monospace",fontSize:11 }}>
      <div style={{ background:"#1a1a22",border:`1px solid ${live ? "#10b98144" : "#f9731644"}`,borderRadius:12,padding:"14px 16px" }}>
        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:10 }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:live?"#10b981":"#f97316",boxShadow:`0 0 8px ${live?"#10b981":"#f97316"}` }} />
          <span style={{ fontWeight:800,color:live?"#10b981":"#f97316",letterSpacing:0.5 }}>
            {live ? "TMDB API — LIVE DATA CONNECTED" : "TMDB API — DEMO MODE (sample data)"}
          </span>
        </div>
        {!live && (
          <div style={{ color:"#6e6e82",lineHeight:1.8 }}>
            <div style={{ color:"#ededf2",fontWeight:700,marginBottom:6 }}>To enable live movie data:</div>
            <div>1. Sign up free at <span style={{color:"#3b82f6"}}>themoviedb.org/signup</span></div>
            <div>2. Go to <span style={{color:"#3b82f6"}}>Settings → API</span> → copy your <span style={{color:"#eab308"}}>Read Access Token</span></div>
            <div>3. Create <span style={{color:"#ff3b3b"}}>.env.local</span> in the project root:</div>
            <div style={{ background:"#0f0f13",border:"1px solid #2c2c3a",borderRadius:8,padding:"8px 10px",margin:"8px 0",color:"#10b981" }}>
              VITE_TMDB_API_KEY=eyJhbGci...your_token_here
            </div>
            <div>4. Restart dev server — live data loads automatically</div>
            <div style={{ marginTop:8,paddingTop:8,borderTop:"1px solid #2c2c3a",color:"#6e6e82" }}>
              For Netlify: Site settings → Environment variables → Add <span style={{color:"#ff3b3b"}}>VITE_TMDB_API_KEY</span>
            </div>
            <div style={{ marginTop:4,color:"#6e6e82" }}>
              TMDB API is <span style={{color:"#10b981",fontWeight:700}}>free</span> — 40 req/10s on read access token, no credit card required.
            </div>
          </div>
        )}
        {live && (
          <div style={{ color:"#6e6e82",lineHeight:1.8,fontSize:10 }}>
            <div>Trending this week · Upcoming releases · Full movie details</div>
            <div>Cast photos · Trailers (YouTube) · Keywords · Box office</div>
            <div style={{ marginTop:4,color:"#10b98188" }}>OMDb enrichment (IMDb ratings, RT scores) requires separate key → omdbapi.com</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════

export default function RatedDataDriven() {
  const [screen, setScreen] = useState("home");
  const [selectedMovie, setSelectedMovie] = useState(null);

  const onNav = useCallback((s) => { setScreen(s); setSelectedMovie(null); }, []);
  const onSelectMovie = useCallback((m) => { setSelectedMovie(m); setScreen("detail"); }, []);
  const onBack = useCallback(() => { setScreen("home"); setSelectedMovie(null); }, []);

  const screenMap = {
    home: <HomeScreen onNav={onNav} onSelectMovie={onSelectMovie} />,
    detail: <MovieDetailScreen movie={selectedMovie} onBack={onBack} />,
    upcoming: <UpcomingScreen onNav={onNav} />,
    search: <SearchScreen onNav={onNav} onSelectMovie={onSelectMovie} />,
    profile: <ProfileScreen onNav={onNav} onSelectMovie={onSelectMovie} />,
    streak: <StreakScreen onNav={onNav} />,
  };

  return (
    <div style={{ minHeight:"100vh",background:"#08080b",padding:"20px 12px 40px",fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center",marginBottom:16 }}>
        <h1 style={{ fontSize:26,fontWeight:900,color:W.accent,fontFamily:"monospace",letterSpacing:-1,margin:0,textShadow:`0 0 30px ${W.accent}33` }}>RATED</h1>
        <p style={{ fontSize:9,color:W.dim,fontFamily:"monospace",margin:"4px 0 0",letterSpacing:3 }}>
          {hasApiKey() ? "LIVE TMDB DATA · ENTITY → UI" : "DATA-DRIVEN PROTOTYPE · ENTITY → UI"}
        </p>
      </div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginBottom:20,maxWidth:500,margin:"0 auto 20px" }}>
        {Object.entries({home:"Home",upcoming:"Upcoming",search:"Search",profile:"Profile",streak:"Streak"}).map(([k,v]) => (
          <button key={k} onClick={() => onNav(k)} style={{ padding:"5px 11px",borderRadius:8,fontSize:9,fontFamily:"monospace",fontWeight:700,cursor:"pointer",border:`1px solid ${screen===k||(screen==="detail"&&k==="home")?W.accent:W.border}`,background:screen===k||(screen==="detail"&&k==="home")?W.accentDim:"transparent",color:screen===k||(screen==="detail"&&k==="home")?W.accent:W.dim }}>{v}</button>
        ))}
      </div>
      <div style={{ display:"flex",justifyContent:"center" }}>
        <Phone label={screen === "detail" ? selectedMovie?.title || "Detail" : screen}>
          {screenMap[screen] || <HomeScreen onNav={onNav} onSelectMovie={onSelectMovie} />}
        </Phone>
      </div>
      <ApiKeyInfo />
    </div>
  );
}
