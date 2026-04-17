import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// Set API_BASE to your running FastAPI server.
// Falls back to mock data automatically when the server is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000"; // ← change to your deployed URL

async function api(method, path, body, token) {
  try {
    const res = await fetch(`${API_BASE}${path}${token ? `?session_token=${token}` : ""}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    if (e.message?.includes("401") || e.message?.includes("403")) throw e;
    console.warn(`[API] ${method} ${path} →`, e.message);
    return null;
  }
}

const API = {
  login:           (provider, id_token)           => api("POST", "/auth/login",  { provider, id_token }),
  checkUsername:   (u)                             => api("GET",  `/auth/username/check/${u}`),
  setUsername:     (username, token)               => api("POST", "/auth/username", { username }, token),
  getRankings:     (uid, token)                    => api("GET",  `/users/${uid}/rankings`, null, token),
  addRanking:      (uid, movie_id, score, token)   => api("POST", `/users/${uid}/rankings`, { movie_id, score }, token),
  recordPairwise:  (uid, winner_id, loser_id, tok) => api("POST", `/users/${uid}/pairwise`, { winner_id, loser_id }, tok),
  getFeed:         (uid, token)                    => api("GET",  `/users/${uid}/feed`, null, token),
  follow:          (uid, followee_id, token)       => api("POST", `/users/${uid}/follow`, { followee_id }, token),
  unfollow:        (uid, fid, token)               => api("DELETE",`/users/${uid}/follow/${fid}`, null, token),
  getWatchlist:    (uid, token)                    => api("GET",  `/users/${uid}/watchlist`, null, token),
  addWatchlist:    (uid, movie_id, token)          => api("POST", `/users/${uid}/watchlist`, { movie_id }, token),
  removeWatchlist: (uid, movie_id, token)          => api("DELETE",`/users/${uid}/watchlist/${movie_id}`, null, token),
  topMovies:       ()                              => api("GET",  "/movies/top"),
  movieStats:      (movie_id)                      => api("GET",  `/movies/${movie_id}/stats`),
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA  (fallback when API is offline)
// ─────────────────────────────────────────────────────────────────────────────

const TMDB = "https://image.tmdb.org/t/p";
const W = {
  bg:"#0f0f13", card:"#1a1a22", border:"#2c2c3a",
  text:"#ededf2", dim:"#6e6e82",
  accent:"#ff3b3b", accentDim:"#ff3b3b28",
  green:"#10b981", greenDim:"#10b98122",
  gold:"#eab308", goldDim:"#eab30822",
  blue:"#3b82f6", blueDim:"#3b82f622",
  purple:"#a855f7", purpleDim:"#a855f722",
  orange:"#f97316", orangeDim:"#f9731622",
};

const MOVIES = [
  { id:"m-001", title:"Interstellar", release_year:2014, runtime_minutes:169, content_rating:"PG-13",
    synopsis:"A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    original_language:"en", is_international:false,
    poster_url:`${TMDB}/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdrop_url:`${TMDB}/w1280/xJHokMbljXjADYdit5fK1DVfjko.jpg`,
    genres:[{name:"Sci-Fi"},{name:"Drama"},{name:"Adventure"}],
    directors:[{name:"Christopher Nolan"}],
    cast:[{name:"Matthew McConaughey",character_name:"Cooper"},{name:"Anne Hathaway",character_name:"Brand"},{name:"Jessica Chastain",character_name:"Murph"}],
    trailers:[{title:"Official Trailer",video_key:"zSWdZVtXT7E",is_primary:true}],
    keywords:["space","wormhole","nasa","black hole","time travel"],
    imdb_rating:8.7, rotten_tomatoes_score:73, global_elo_score:1952, global_rank:1,
    avg_user_rating:9.2, user_rating_count:3241, review_count:47, trending_rank:3,
    watchlist_count:1247, seen_count:8934, is_highlighted:true },
  { id:"m-002", title:"Parasite", original_title:"기생충", release_year:2019, runtime_minutes:132, content_rating:"R",
    synopsis:"Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    original_language:"ko", is_international:true,
    poster_url:`${TMDB}/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
    backdrop_url:`${TMDB}/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg`,
    genres:[{name:"Thriller"},{name:"Drama"},{name:"Comedy"}],
    directors:[{name:"Bong Joon-ho"}],
    cast:[{name:"Song Kang-ho",character_name:"Ki-taek"},{name:"Choi Woo-shik",character_name:"Ki-woo"}],
    trailers:[{title:"Official Trailer",video_key:"SEUXfv87Wpk",is_primary:true}],
    keywords:["class differences","wealth","dark comedy","seoul"],
    imdb_rating:8.5, rotten_tomatoes_score:98, global_elo_score:1845, global_rank:3,
    avg_user_rating:9.0, user_rating_count:2890, review_count:62, trending_rank:8 },
  { id:"m-003", title:"The Dark Knight", release_year:2008, runtime_minutes:152, content_rating:"PG-13",
    synopsis:"Batman raises the stakes in his war on crime, facing the Joker, a criminal mastermind who plunges Gotham into anarchy.",
    original_language:"en", is_international:false,
    poster_url:`${TMDB}/w500/qJ2tW6WMUDux911BTUgMe1YRr.jpg`,
    genres:[{name:"Action"},{name:"Crime"},{name:"Drama"}],
    directors:[{name:"Christopher Nolan"}],
    cast:[{name:"Christian Bale",character_name:"Batman"},{name:"Heath Ledger",character_name:"Joker"}],
    trailers:[{title:"Official Trailer",video_key:"EXeTwQWrcwY",is_primary:true}],
    imdb_rating:9.0, global_elo_score:1823, global_rank:4, avg_user_rating:9.1, trending_rank:12 },
  { id:"m-004", title:"Whiplash", release_year:2014, runtime_minutes:107, content_rating:"R",
    synopsis:"A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing.",
    original_language:"en", is_international:false,
    poster_url:`${TMDB}/w500/oPxnRhyAEBhPIT5uXGb02JMbuz.jpg`,
    genres:[{name:"Drama"},{name:"Music"}],
    directors:[{name:"Damien Chazelle"}],
    cast:[{name:"Miles Teller",character_name:"Andrew"},{name:"J.K. Simmons",character_name:"Fletcher"}],
    imdb_rating:8.5, global_elo_score:1768, global_rank:8, avg_user_rating:8.9, trending_rank:15 },
  { id:"m-005", title:"RRR", original_title:"RRR", release_year:2022, runtime_minutes:187,
    synopsis:"A fictitious story about two legendary revolutionaries and their journey away from home before they began fighting for their country in the 1920s.",
    original_language:"te", is_international:true,
    poster_url:`${TMDB}/w500/nEufeZYpKOlqp3fkDJKVECVpfjn.jpg`,
    genres:[{name:"Action"},{name:"Drama"}],
    directors:[{name:"S.S. Rajamouli"}],
    cast:[{name:"N.T. Rama Rao Jr.",character_name:"Bheem"},{name:"Ram Charan",character_name:"Ram"}],
    imdb_rating:7.8, global_elo_score:1689, global_rank:14, avg_user_rating:8.4, trending_rank:20 },
];

const UPCOMING = [
  { id:"u-001", title:"The Mummy", release_year:2026, release_date:"2026-05-15", days_until_release:43,
    synopsis:"A new chapter in the legendary franchise. An ancient terror is unleashed when an expedition unearths something that should have stayed buried.",
    poster_url:`${TMDB}/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg`,
    genres:[{name:"Horror"},{name:"Adventure"}], directors:[{name:"Lee Cronin"}], cast:[{name:"TBA",character_name:"Lead"}],
    anticipation_score:720, is_must_see:true, must_see_reason:"From the director of Evil Dead Rise", watchlist_count:342 },
  { id:"u-002", title:"Werwulf", release_year:2026, release_date:"2026-12-25", days_until_release:267,
    synopsis:"Robert Eggers returns to folk horror territory with a sweeping werewolf epic set in medieval Europe.",
    genres:[{name:"Horror"},{name:"Thriller"}], directors:[{name:"Robert Eggers"}], cast:[{name:"TBA",character_name:"Lead"}],
    anticipation_score:890, is_must_see:true, must_see_reason:"Robert Eggers' werewolf epic", watchlist_count:512 },
  { id:"u-003", title:"Resident Evil", release_year:2026, release_date:"2026-08-14", days_until_release:134,
    synopsis:"A new cinematic take on the iconic survival horror franchise from the director who brought us Barbarian.",
    genres:[{name:"Horror"},{name:"Action"},{name:"Sci-Fi"}], directors:[{name:"Zach Cregger"}], cast:[{name:"TBA",character_name:"Lead"}],
    anticipation_score:810, is_must_see:true, must_see_reason:"From the Barbarian director", watchlist_count:289 },
  { id:"u-004", title:"Scary Movie 6", release_year:2026, release_date:"2026-07-04", days_until_release:93,
    synopsis:"The Wayans brothers reunite for the long-awaited sixth installment of the beloved parody franchise.",
    genres:[{name:"Comedy"},{name:"Horror"}], directors:[{name:"Keenen Ivory Wayans"}], cast:[{name:"TBA",character_name:"Lead"}],
    anticipation_score:540, is_must_see:true, must_see_reason:"Wayans brothers return", watchlist_count:198 },
  { id:"u-005", title:"Blade", release_year:2026, release_date:"2026-09-20", days_until_release:162,
    synopsis:"Marvel's Daywalker returns in a gritty new MCU solo outing.",
    genres:[{name:"Action"},{name:"Sci-Fi"},{name:"Horror"}], directors:[{name:"Yann Demange"}],
    cast:[{name:"Mahershala Ali",character_name:"Blade"}],
    anticipation_score:870, is_must_see:true, must_see_reason:"Mahershala Ali as Blade", watchlist_count:678 },
  { id:"u-006", title:"28 Years Later", release_year:2026, release_date:"2026-06-20", days_until_release:70,
    synopsis:"Danny Boyle returns to the world that defined a generation of horror.",
    genres:[{name:"Horror"},{name:"Thriller"},{name:"Drama"}], directors:[{name:"Danny Boyle"}],
    cast:[{name:"Jodie Comer",character_name:"Lead"},{name:"Aaron Taylor-Johnson",character_name:"Lead"}],
    anticipation_score:950, is_must_see:true, must_see_reason:"Danny Boyle returns to 28 Days Later", watchlist_count:891 },
  { id:"u-007", title:"Sinners", release_year:2026, release_date:"2026-04-18", days_until_release:7,
    synopsis:"Ryan Coogler's blues-soaked supernatural thriller set in 1930s Mississippi.",
    genres:[{name:"Horror"},{name:"Drama"},{name:"Thriller"}], directors:[{name:"Ryan Coogler"}],
    cast:[{name:"Michael B. Jordan",character_name:"Twins"},{name:"Hailee Steinfeld",character_name:"Mary"}],
    anticipation_score:990, is_must_see:true, must_see_reason:"Ryan Coogler + Michael B. Jordan", watchlist_count:1203 },
  { id:"u-008", title:"Final Destination: Bloodlines", release_year:2026, release_date:"2026-05-16", days_until_release:35,
    synopsis:"Death's design returns. A new group of survivors cheat death — and then it starts collecting.",
    genres:[{name:"Horror"},{name:"Thriller"}], directors:[{name:"Zach Lipovsky"}], cast:[{name:"Kaitlyn Santa Juana",character_name:"Lead"}],
    anticipation_score:730, is_must_see:true, must_see_reason:"The franchise is back", watchlist_count:445 },
  { id:"u-009", title:"F1", release_year:2026, release_date:"2026-06-27", days_until_release:77,
    synopsis:"Brad Pitt plays a retired F1 driver who returns to race alongside a rookie.",
    genres:[{name:"Drama"},{name:"Action"}], directors:[{name:"Joseph Kosinski"}],
    cast:[{name:"Brad Pitt",character_name:"Sonny Hayes"},{name:"Damson Idris",character_name:"Joshua Pierce"}],
    anticipation_score:840, is_must_see:true, must_see_reason:"Brad Pitt + real F1 footage", watchlist_count:567 },
  { id:"u-010", title:"Mission: Impossible 8", release_year:2026, release_date:"2026-05-23", days_until_release:42,
    synopsis:"Ethan Hunt faces his most dangerous mission yet in the final chapter of the beloved franchise.",
    genres:[{name:"Action"},{name:"Thriller"}], directors:[{name:"Christopher McQuarrie"}],
    cast:[{name:"Tom Cruise",character_name:"Ethan Hunt"}],
    anticipation_score:920, is_must_see:true, must_see_reason:"Tom Cruise's final Mission", watchlist_count:1102 },
];

const ALL_GENRES = ["All","Horror","Action","Drama","Comedy","Sci-Fi","Thriller"];

const MOCK_FEED = [
  {id:"f-001",type:"rating",user:"@maya",avatar:"M",action:"rated",movie_title:"Interstellar",movie_id:"m-001",rating:9.5,time:"2m",likes:12,liked:false},
  {id:"f-002",type:"review",user:"@josh",avatar:"J",action:"reviewed",movie_title:"Parasite",movie_id:"m-002",preview:"Bong Joon-ho crafted something that transcends genre. The tonal shifts are masterful...",rating:9.0,time:"18m",likes:34,liked:false},
  {id:"f-003",type:"ranking",user:"@lina",avatar:"L",action:"updated rankings",preview:"New #1: The Dark Knight → dethroned Interstellar",time:"1h",likes:8,liked:false},
  {id:"f-004",type:"save",user:"@carlos",avatar:"C",action:"saved",movie_title:"RRR",movie_id:"m-005",time:"2h",likes:3,liked:false},
  {id:"f-005",type:"streak",user:"@maya",avatar:"M",action:"hit a 12-week streak 🔥",time:"3h",likes:45,liked:false},
];

const MOCK_FRIENDS = [
  {id:"u-maya",username:"maya",avatar:"M",is_following:false},
  {id:"u-josh",username:"josh",avatar:"J",is_following:true},
  {id:"u-lina",username:"lina",avatar:"L",is_following:false},
  {id:"u-carlos",username:"carlos",avatar:"C",is_following:true},
];

const TAKEN_USERNAMES = new Set([
  "jasonk","maya","josh","lina","carlos","cinephile99","filmfreak","reeltalks","admin","rated","movies","film"
]);

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Poster = ({ url, w=85, h=120, radius=10 }) => (
  <div style={{width:w,height:h,borderRadius:radius,overflow:"hidden",flexShrink:0,background:W.card,border:`1px solid ${W.border}`}}>
    {url && <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>}
  </div>
);

const Btn = ({ children, accent, full, small, onClick }) => (
  <div onClick={onClick} style={{background:accent?W.accent:"transparent",border:accent?"none":`1px solid ${W.border}`,color:accent?"#fff":W.dim,borderRadius:12,padding:small?"6px 14px":"12px 20px",fontSize:small?10:12,fontWeight:700,textAlign:"center",width:full?"100%":"auto",fontFamily:"monospace",cursor:"pointer"}}>{children}</div>
);

const NavBar = ({ active, onNav }) => (
  <div style={{height:58,background:"#09090c",borderTop:`1px solid ${W.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",flexShrink:0}}>
    {[{key:"home",icon:"⌂",label:"Home"},{key:"upcoming",icon:"◈",label:"Soon"},{key:"search",icon:"⌕",label:"Search"},{key:"leaderboard",icon:"◆",label:"Board"},{key:"profile",icon:"●",label:"Me"}].map(item=>(
      <div key={item.key} onClick={()=>onNav(item.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}>
        <span style={{fontSize:18,color:item.key===active?W.accent:W.dim}}>{item.icon}</span>
        <span style={{fontSize:8,fontFamily:"monospace",color:item.key===active?W.accent:W.dim,fontWeight:item.key===active?700:400}}>{item.label}</span>
      </div>
    ))}
  </div>
);

const ScreenWithNav = ({ children, active, onNav }) => (
  <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>{children}</div>
    <NavBar active={active} onNav={onNav}/>
  </div>
);

const Badge = ({ color, children }) => (
  <span style={{padding:"2px 7px",borderRadius:4,fontSize:7,fontWeight:900,fontFamily:"monospace",
    background:color==="red"?W.accentDim:color==="gold"?W.goldDim:color==="green"?W.greenDim:color==="blue"?W.blueDim:color==="orange"?W.orangeDim:W.purpleDim,
    color:color==="red"?W.accent:color==="gold"?W.gold:color==="green"?W.green:color==="blue"?W.blue:color==="orange"?W.orange:W.purple,
    border:`1px solid ${color==="red"?W.accent+"33":color==="gold"?W.gold+"33":color==="green"?W.green+"33":color==="blue"?W.blue+"33":color==="orange"?W.orange+"33":W.purple+"33"}`}}>{children}</span>
);

const Dots = () => {
  const [d,setD]=useState("");
  useEffect(()=>{const i=setInterval(()=>setD(p=>p.length>=3?"":p+"."),400);return()=>clearInterval(i);},[]);
  return <span style={{color:W.dim,fontFamily:"monospace",fontSize:11}}>Loading{d}</span>;
};

const calcElo = (wElo,lElo,k=32) => {
  const exp=1/(1+Math.pow(10,(lElo-wElo)/400));
  return [Math.round(wElo+k*(1-exp)),Math.round(lElo+k*(0-(1-exp)))];
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const LoginScreen = ({ onLogin }) => (
  <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 28px"}}>
    <div style={{textAlign:"center",marginBottom:40}}>
      <div style={{fontSize:42,fontWeight:900,color:W.accent,fontFamily:"monospace",letterSpacing:-2}}>RATED</div>
      <div style={{fontSize:10,color:W.dim,marginTop:8,fontFamily:"monospace",letterSpacing:3}}>YOUR TASTE. RANKED.</div>
    </div>
    <div onClick={()=>onLogin("apple")} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#fff",borderRadius:12,padding:"13px 20px",cursor:"pointer",marginBottom:10}}>
      <span style={{fontSize:18,color:"#000"}}></span>
      <span style={{fontSize:13,fontWeight:600,color:"#000"}}>Continue with Apple</span>
    </div>
    <div onClick={()=>onLogin("google")} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"13px 20px",cursor:"pointer"}}>
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      <span style={{fontSize:13,fontWeight:600,color:W.text}}>Continue with Google</span>
    </div>
    <div style={{textAlign:"center",marginTop:28}}>
      <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",lineHeight:1.6}}>By continuing you agree to Rated's <span style={{color:W.accent}}>Terms</span> & <span style={{color:W.accent}}>Privacy</span></div>
      <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:14,letterSpacing:1}}>NO PASSWORD NEEDED</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// USERNAME SCREEN — checks server for availability, falls back to local set
// ─────────────────────────────────────────────────────────────────────────────

const UsernameScreen = ({ provider, session, onComplete }) => {
  const [value,setValue]=useState("");
  const [touched,setTouched]=useState(false);
  const [checking,setChecking]=useState(false);
  const [serverAvailable,setServerAvailable]=useState(null);
  const [confirmed,setConfirmed]=useState(false);
  const [error,setError]=useState("");
  const timerRef=useRef(null);

  const localError = () => {
    if (!value) return null;
    if (value.length < 3) return "At least 3 characters";
    if (value.length > 20) return "Max 20 characters";
    if (!/^[a-z0-9_]+$/.test(value)) return "Only lowercase letters, numbers, and _";
    if (TAKEN_USERNAMES.has(value)) return "Username already taken";
    return null;
  };

  const handleChange = (e) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"");
    setValue(raw); setTouched(true); setServerAvailable(null); setError("");
    clearTimeout(timerRef.current);
    if (raw.length >= 3) {
      setChecking(true);
      timerRef.current = setTimeout(async () => {
        const localErr = localError();
        if (localErr) { setChecking(false); return; }
        const res = await API.checkUsername(raw);
        setServerAvailable(res ? res.available : !TAKEN_USERNAMES.has(raw));
        setChecking(false);
      }, 500);
    } else { setChecking(false); }
  };

  const localErr = touched ? localError() : null;
  const isAvailable = !localErr && serverAvailable === true && !checking;
  const showError = localErr || (touched && serverAvailable === false && !checking);
  const errorMsg = localErr || (serverAvailable === false ? "Username already taken" : "");

  const handleSubmit = async () => {
    if (!isAvailable) return;
    if (session) {
      try { await API.setUsername(value, session); }
      catch(e) { setError(e.message || "Could not claim username"); return; }
    }
    TAKEN_USERNAMES.add(value);
    setConfirmed(true);
    setTimeout(() => onComplete(value), 900);
  };

  if (confirmed) return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:12}}>
      <div style={{fontSize:48}}>🎬</div>
      <div style={{fontSize:22,fontWeight:900,color:W.accent,fontFamily:"monospace"}}>@{value}</div>
      <div style={{fontSize:12,color:W.dim,fontFamily:"monospace"}}>Welcome to RATED</div>
    </div>
  );

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 28px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:28,fontWeight:900,color:W.accent,fontFamily:"monospace",letterSpacing:-1,marginBottom:16}}>RATED</div>
        <div style={{width:52,height:52,borderRadius:"50%",background:W.card,border:`2px solid ${W.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px"}}>👤</div>
        <div style={{fontSize:15,fontWeight:800,color:W.text,fontFamily:"monospace"}}>Create your username</div>
        <div style={{fontSize:10,color:W.dim,fontFamily:"monospace",marginTop:8,lineHeight:1.6}}>Signed in with {provider==="apple"?"Apple":"Google"}.<br/>Pick a unique username to get started.</div>
      </div>
      <div style={{position:"relative",marginBottom:8}}>
        <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:13,color:W.dim,fontFamily:"monospace",pointerEvents:"none"}}>@</div>
        <input value={value} onChange={handleChange} onBlur={()=>setTouched(true)} placeholder="yourname" maxLength={20} autoFocus
          style={{width:"100%",background:W.card,border:`1.5px solid ${showError?W.accent:isAvailable?W.green:W.border}`,borderRadius:12,padding:"13px 42px 13px 30px",fontSize:14,color:W.text,fontFamily:"monospace",outline:"none",letterSpacing:0.5,transition:"border-color 0.15s",boxSizing:"border-box"}}/>
        <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:14}}>
          {checking&&<span style={{color:W.dim,fontSize:11,fontFamily:"monospace"}}>...</span>}
          {!checking&&isAvailable&&<span style={{color:W.green}}>✓</span>}
          {!checking&&showError&&value.length>0&&<span style={{color:W.accent}}>✗</span>}
        </div>
      </div>
      <div style={{minHeight:18,marginBottom:16,paddingLeft:2}}>
        {!checking&&showError&&<div style={{fontSize:10,color:W.accent,fontFamily:"monospace"}}>{errorMsg}</div>}
        {!checking&&isAvailable&&<div style={{fontSize:10,color:W.green,fontFamily:"monospace"}}>@{value} is available ✓</div>}
        {!touched&&<div style={{fontSize:10,color:W.dim,fontFamily:"monospace"}}>3–20 chars · letters, numbers, _ only</div>}
        {error&&<div style={{fontSize:10,color:W.accent,fontFamily:"monospace"}}>{error}</div>}
      </div>
      {!checking&&errorMsg==="Username already taken"&&value.length>=3&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginBottom:6}}>TRY ONE OF THESE</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[`${value}_`,`${value}1`,`${value}42`,`the_${value}`].filter(s=>!TAKEN_USERNAMES.has(s)&&s.length<=20).slice(0,4).map(s=>(
              <div key={s} onClick={()=>{setValue(s);setTouched(true);setChecking(true);setServerAvailable(null);setTimeout(async()=>{const r=await API.checkUsername(s);setServerAvailable(r?r.available:true);setChecking(false);},400);}}
                style={{padding:"5px 12px",borderRadius:10,background:W.card,border:`1px solid ${W.border}`,fontSize:10,fontFamily:"monospace",color:W.dim,cursor:"pointer"}}>@{s}</div>
            ))}
          </div>
        </div>
      )}
      <div onClick={handleSubmit} style={{background:isAvailable?W.accent:W.card,border:isAvailable?"none":`1px solid ${W.border}`,color:isAvailable?"#fff":W.dim,borderRadius:12,padding:"13px",textAlign:"center",fontSize:13,fontWeight:700,fontFamily:"monospace",cursor:isAvailable?"pointer":"default",opacity:isAvailable?1:0.5,transition:"all 0.15s"}}>
        CLAIM @{value||"username"} →
      </div>
      <div style={{textAlign:"center",marginTop:14,fontSize:9,color:W.dim,fontFamily:"monospace",lineHeight:1.6}}>Your username is public · You can change it once every 30 days</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const HomeScreen = ({ onNav, onSelectMovie, session, userId }) => {
  const [loaded,setLoaded]=useState(false);
  const [feedItems,setFeedItems]=useState(MOCK_FEED);
  const [likes,setLikes]=useState({});
  const [following,setFollowing]=useState(()=>{const m={};MOCK_FRIENDS.forEach(u=>{m[u.id]=u.is_following;});return m;});
  const [saved,setSaved]=useState(new Set(["m-001","m-002","m-005"]));

  useEffect(()=>{
    const load = async () => {
      if (userId && session) {
        const apiFeed = await API.getFeed(userId, session);
        if (apiFeed && apiFeed.length > 0) {
          setFeedItems(apiFeed.map(r=>({
            id:`api-${r.movie.movie_id}-${r.ranked_at}`,
            type:"rating", user:`@${r.user.name}`,
            avatar:r.user.name[0].toUpperCase(),
            action:"rated", movie_title:r.movie.title,
            movie_id:r.movie.movie_id, rating:r.score,
            time:"just now", likes:0, liked:false,
          })));
        }
      }
      setLoaded(true);
    };
    setTimeout(load, 500);
  },[userId, session]);

  const toggleSave=id=>setSaved(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleFollow=async(friend)=>{
    const isNow=!following[friend.id];
    setFollowing(p=>({...p,[friend.id]:isNow}));
    if (userId&&session) isNow?await API.follow(userId,friend.id,session):await API.unfollow(userId,friend.id,session);
  };
  const highlights=MOVIES.filter(m=>m.is_highlighted||m.trending_rank<=5).slice(0,4);
  if(!loaded) return <ScreenWithNav active="home" onNav={onNav}><div style={{height:400,display:"flex",alignItems:"center",justifyContent:"center"}}><Dots/></div></ScreenWithNav>;

  return (
    <ScreenWithNav active="home" onNav={onNav}>
      <div style={{padding:"6px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:18,fontWeight:900,color:W.accent,fontFamily:"monospace",letterSpacing:-1}}>RATED</div>
        <div style={{display:"flex",gap:3,alignItems:"center",background:W.goldDim,border:`1px solid ${W.gold}44`,borderRadius:20,padding:"3px 10px"}}>
          <span>🔥</span><span style={{fontSize:10,fontWeight:800,color:W.gold,fontFamily:"monospace"}}>7</span>
        </div>
      </div>
      <div style={{padding:"10px 22px 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{fontSize:11,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1.5}}>HIGHLIGHTS</div>
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
          {highlights.map(m=>(
            <div key={m.id} style={{flexShrink:0,width:105}}>
              <div style={{position:"relative",cursor:"pointer"}} onClick={()=>onSelectMovie(m)}>
                <Poster url={m.poster_url} w={105} h={148} radius={12}/>
                {m.trending_rank<=3&&<div style={{position:"absolute",top:6,left:6,background:W.accent,color:"#fff",fontSize:7,fontWeight:900,padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>#{m.trending_rank}</div>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:W.text,fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.title}</div>
                  <div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{m.release_year}</div>
                </div>
                <div onClick={e=>{e.stopPropagation();toggleSave(m.id);}} style={{cursor:"pointer",fontSize:14,flexShrink:0,marginLeft:4}}>
                  <span style={{color:saved.has(m.id)?W.blue:W.dim}}>{saved.has(m.id)?"◆":"◇"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1.5}}>ACTIVITY</div>
        {feedItems.map(item=>{
          const isLiked=likes[item.id]??item.liked;
          const likeCount=(item.likes||0)+(likes[item.id]&&!item.liked?1:0)-(!likes[item.id]&&item.liked?1:0);
          const friend=MOCK_FRIENDS.find(u=>`@${u.username}`===item.user);
          const isFollowing=friend?following[friend.id]:false;
          return (
            <div key={item.id} style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:W.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace",flexShrink:0}}>{item.avatar}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:11,fontWeight:700,color:W.accent,fontFamily:"monospace"}}>{item.user}</span>
                    {friend&&<div onClick={()=>toggleFollow(friend)} style={{cursor:"pointer",padding:"1px 8px",borderRadius:10,fontSize:8,fontWeight:700,fontFamily:"monospace",background:isFollowing?W.accentDim:"transparent",border:`1px solid ${isFollowing?W.accent:W.border}`,color:isFollowing?W.accent:W.dim}}>{isFollowing?"FOLLOWING":"+ FOLLOW"}</div>}
                  </div>
                  <div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{item.time} ago</div>
                </div>
              </div>
              <div style={{fontSize:11,color:W.text,fontFamily:"monospace",lineHeight:1.5,marginBottom:6}}>
                {item.type==="rating"&&<span>{item.action} <span style={{color:W.gold,fontWeight:700}}>{item.movie_title}</span> <span style={{color:W.gold}}>★ {item.rating}/10</span></span>}
                {item.type==="review"&&<div><span>{item.action} <span style={{color:W.gold,fontWeight:700}}>{item.movie_title}</span></span><div style={{fontSize:10,color:W.dim,marginTop:4,fontStyle:"italic"}}>"{item.preview?.slice(0,90)}..."</div></div>}
                {item.type==="ranking"&&<div><span>{item.action}</span><div style={{fontSize:10,color:W.dim,marginTop:2}}>{item.preview}</div></div>}
                {item.type==="save"&&<span>saved <span style={{color:W.blue,fontWeight:700}}>{item.movie_title}</span> to watch later 🎬</span>}
                {item.type==="streak"&&<span>{item.action}</span>}
              </div>
              <div style={{display:"flex",gap:14,alignItems:"center",paddingTop:6,borderTop:`1px solid ${W.border}`}}>
                <div onClick={()=>setLikes(p=>({...p,[item.id]:!p[item.id]}))} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                  <span style={{fontSize:14,color:isLiked?W.accent:W.dim}}>{isLiked?"♥":"♡"}</span>
                  <span style={{fontSize:10,color:isLiked?W.accent:W.dim,fontFamily:"monospace",fontWeight:isLiked?700:400}}>{likeCount}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                  <span style={{fontSize:12,color:W.dim}}>💬</span>
                  <span style={{fontSize:10,color:W.dim,fontFamily:"monospace"}}>Reply</span>
                </div>
                {item.movie_id&&<div onClick={()=>toggleSave(item.movie_id)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",marginLeft:"auto"}}>
                  <span style={{fontSize:13,color:saved.has(item.movie_id)?W.blue:W.dim}}>{saved.has(item.movie_id)?"◆":"◇"}</span>
                  <span style={{fontSize:10,color:saved.has(item.movie_id)?W.blue:W.dim,fontFamily:"monospace"}}>{saved.has(item.movie_id)?"Saved":"Save"}</span>
                </div>}
              </div>
            </div>
          );
        })}
      </div>
    </ScreenWithNav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

const ReviewModal = ({ movie, onClose }) => {
  const [text,setText]=useState("");
  const [rating,setRating]=useState(0);
  const [hover,setHover]=useState(0);
  const [submitted,setSubmitted]=useState(false);
  const submit=()=>{if(!rating||!text.trim())return;setSubmitted(true);setTimeout(onClose,1200);};
  return (
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)",zIndex:50,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{background:W.bg,borderRadius:"20px 20px 0 0",padding:"20px 22px 32px",display:"flex",flexDirection:"column",gap:14}}>
        {submitted?<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>✓</div><div style={{fontSize:14,fontWeight:900,color:W.green,fontFamily:"monospace"}}>Review Posted!</div></div>:<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:900,color:W.text,fontFamily:"monospace"}}>✎ WRITE REVIEW</div>
            <div onClick={onClose} style={{fontSize:18,color:W.dim,cursor:"pointer"}}>✕</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <Poster url={movie.poster_url} w={40} h={56} radius={6}/>
            <div><div style={{fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace"}}>{movie.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{movie.release_year} · {movie.directors?.[0]?.name}</div></div>
          </div>
          <div>
            <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginBottom:6,letterSpacing:1}}>YOUR RATING</div>
            <div style={{display:"flex",gap:3}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <div key={n} onClick={()=>setRating(n)} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
                  style={{flex:1,textAlign:"center",padding:"5px 0",borderRadius:6,fontSize:10,fontWeight:900,fontFamily:"monospace",cursor:"pointer",background:(hover||rating)>=n?W.goldDim:W.card,border:`1px solid ${(hover||rating)>=n?W.gold:W.border}`,color:(hover||rating)>=n?W.gold:W.dim}}>{n}</div>
              ))}
            </div>
            {rating>0&&<div style={{fontSize:9,color:W.gold,fontFamily:"monospace",marginTop:4,textAlign:"center"}}>★ {rating}/10</div>}
          </div>
          <div>
            <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginBottom:6,letterSpacing:1}}>YOUR REVIEW</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What did you think? Be honest..."
              style={{width:"100%",minHeight:80,background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"10px 14px",fontSize:11,fontFamily:"monospace",outline:"none",resize:"none",lineHeight:1.6}}/>
            <div style={{fontSize:8,color:W.dim,fontFamily:"monospace",textAlign:"right",marginTop:3}}>{text.length}/500</div>
          </div>
          <div onClick={submit} style={{background:rating&&text.trim()?W.accent:W.card,border:`1px solid ${rating&&text.trim()?W.accent:W.border}`,color:rating&&text.trim()?"#fff":W.dim,borderRadius:12,padding:"12px",fontSize:12,fontWeight:700,textAlign:"center",fontFamily:"monospace",cursor:rating&&text.trim()?"pointer":"default"}}>POST REVIEW</div>
        </>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOVIE DETAIL SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const MovieDetailScreen = ({ movie, onBack, onRank, isUpcoming, watchlist, onToggleWatchlist }) => {
  const [loaded,setLoaded]=useState(false);
  const [saved,setSaved]=useState(false);
  const [showReview,setShowReview]=useState(false);
  useEffect(()=>{setLoaded(false);setShowReview(false);setSaved(["m-001","m-002","m-005"].includes(movie?.id));setTimeout(()=>setLoaded(true),300);},[movie?.id]);
  if(!movie) return null;
  if(!loaded) return <div style={{height:400,display:"flex",alignItems:"center",justifyContent:"center"}}><Dots/></div>;
  const m=movie;
  const trailer=m.trailers?.find(t=>t.is_primary)||m.trailers?.[0];
  const inWatchlist=watchlist?watchlist.has(m.id):false;
  return (
    <div style={{position:"relative"}}>
      {showReview&&<ReviewModal movie={m} onClose={()=>setShowReview(false)}/>}
      <div style={{position:"relative",height:180,background:`linear-gradient(180deg,#1a1a28,${W.bg})`,overflow:"hidden"}}>
        {m.backdrop_url&&<img src={m.backdrop_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.3}} onError={e=>e.target.style.display="none"}/>}
        <div style={{position:"absolute",top:10,left:16,fontSize:11,color:W.dim,fontFamily:"monospace",cursor:"pointer"}} onClick={onBack}>← Back</div>
        {trailer&&trailer.video_key&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:44,height:44,background:`${W.accent}cc`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>▶</div>
          <span style={{fontSize:9,color:"#fff",fontFamily:"monospace",fontWeight:600,textShadow:"0 1px 6px rgba(0,0,0,0.8)"}}>PLAY TRAILER</span>
        </div>}
        <div style={{position:"absolute",bottom:-40,left:22}}><Poster url={m.poster_url} w={72} h={100} radius={10}/></div>
      </div>
      <div style={{padding:"48px 22px 28px",display:"flex",flexDirection:"column",gap:8}}>
        <div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:18,fontWeight:900,color:W.text,fontFamily:"monospace",letterSpacing:-0.5}}>{m.title}</span>
            {m.is_international&&<Badge color="purple">{m.original_language?.toUpperCase()}</Badge>}
            {isUpcoming&&<Badge color="orange">UPCOMING</Badge>}
          </div>
          {m.original_title&&m.original_title!==m.title&&<div style={{fontSize:10,color:W.dim,fontFamily:"monospace",fontStyle:"italic"}}>{m.original_title}</div>}
          <div style={{fontSize:10,color:W.dim,fontFamily:"monospace",marginTop:3}}>
            {m.release_year}{m.runtime_minutes?` · ${Math.floor(m.runtime_minutes/60)}h ${m.runtime_minutes%60}m`:""}{m.content_rating?` · ${m.content_rating}`:""}
            {m.directors?.[0]?.name&&` · ${m.directors[0].name}`}
          </div>
          {isUpcoming&&m.release_date&&<div style={{fontSize:10,color:W.accent,fontFamily:"monospace",fontWeight:700,marginTop:4}}>📅 {m.release_date} · {m.days_until_release}d away</div>}
          {isUpcoming&&m.must_see_reason&&<div style={{fontSize:10,color:W.gold,fontFamily:"monospace",marginTop:3}}>{m.must_see_reason}</div>}
        </div>
        {!isUpcoming&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {m.global_rank&&<div style={{background:W.accentDim,border:`1px solid ${W.accent}33`,borderRadius:10,padding:"6px 12px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:W.accent,fontFamily:"monospace"}}>#{m.global_rank}</div><div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>RATED</div></div>}
          {m.imdb_rating&&<div style={{background:W.goldDim,border:`1px solid ${W.gold}33`,borderRadius:10,padding:"6px 12px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:W.gold,fontFamily:"monospace"}}>{m.imdb_rating}</div><div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>IMDb</div></div>}
          {m.rotten_tomatoes_score&&<div style={{background:W.greenDim,border:`1px solid ${W.green}33`,borderRadius:10,padding:"6px 12px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:W.green,fontFamily:"monospace"}}>{m.rotten_tomatoes_score}%</div><div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>RT</div></div>}
          {m.global_elo_score&&<div style={{background:W.blueDim,border:`1px solid ${W.blue}33`,borderRadius:10,padding:"6px 12px",textAlign:"center",flex:1}}><div style={{fontSize:16,fontWeight:900,color:W.blue,fontFamily:"monospace"}}>{m.global_elo_score}</div><div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>ELO</div></div>}
        </div>}
        {isUpcoming&&m.anticipation_score&&<div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1}}>ANTICIPATION</span><span style={{fontSize:9,color:W.gold,fontFamily:"monospace",fontWeight:700}}>{m.anticipation_score}/1000</span></div>
          <div style={{height:4,background:W.border,borderRadius:2}}><div style={{height:"100%",background:`linear-gradient(90deg,${W.gold},${W.accent})`,borderRadius:2,width:`${m.anticipation_score/10}%`}}/></div>
          <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:6}}>👀 {m.watchlist_count?.toLocaleString()} watching</div>
        </div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {m.genres?.map(g=><span key={g.name} style={{padding:"3px 10px",borderRadius:16,fontSize:9,fontFamily:"monospace",fontWeight:600,background:W.card,border:`1px solid ${W.border}`,color:W.dim}}>{g.name}</span>)}
        </div>
        <div style={{fontSize:11,color:W.dim,fontFamily:"monospace",lineHeight:1.6}}>
          {m.synopsis?.slice(0,200)}{m.synopsis?.length>200&&<span style={{color:W.accent,fontWeight:600}}> read more</span>}
        </div>
        {isUpcoming?(
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:2}} onClick={()=>onToggleWatchlist&&onToggleWatchlist(m.id)}>
              <div style={{background:inWatchlist?W.blueDim:W.accent,border:inWatchlist?`1px solid ${W.blue}`:"none",color:inWatchlist?W.blue:"#fff",borderRadius:12,padding:"9px 14px",fontSize:10,fontWeight:700,textAlign:"center",fontFamily:"monospace",cursor:"pointer"}}>{inWatchlist?"◆ IN WATCHLIST":"+ ADD TO WATCHLIST"}</div>
            </div>
            <div style={{flex:1}}><Btn full small>🔔 NOTIFY</Btn></div>
          </div>
        ):(
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:1}} onClick={()=>onRank&&onRank(m)}><Btn accent full small>⚡ RANK</Btn></div>
            <div style={{flex:1}} onClick={()=>setSaved(!saved)}>
              <div style={{background:saved?W.blueDim:"transparent",border:`1px solid ${saved?W.blue:W.border}`,color:saved?W.blue:W.dim,borderRadius:12,padding:"6px 14px",fontSize:10,fontWeight:700,textAlign:"center",fontFamily:"monospace",cursor:"pointer"}}>{saved?"◆ SAVED":"◇ SAVE"}</div>
            </div>
            <div style={{flex:1}} onClick={()=>setShowReview(true)}><Btn full small>✎ REVIEW</Btn></div>
          </div>
        )}
        {m.cast?.length>0&&m.cast[0].name!=="TBA"&&<>
          <div style={{fontSize:10,fontWeight:700,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:4}}>CAST</div>
          <div style={{display:"flex",gap:10,overflowX:"auto"}}>
            {m.cast.slice(0,5).map((c,i)=>(
              <div key={i} style={{textAlign:"center",flexShrink:0}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:W.card,border:`1px solid ${W.border}`,margin:"0 auto 3px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>
                <div style={{fontSize:9,fontWeight:700,color:W.text,fontFamily:"monospace",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name.split(" ").pop()}</div>
                <div style={{fontSize:8,color:W.dim,fontFamily:"monospace"}}>{c.character_name}</div>
              </div>
            ))}
          </div>
        </>}
        {!isUpcoming&&<div style={{display:"flex",gap:8,marginTop:4}}>
          {[{n:m.user_rating_count||0,l:"Ratings"},{n:m.review_count||0,l:"Reviews"},{n:m.watchlist_count||0,l:"Watchlisted"},{n:m.seen_count||0,l:"Seen"}].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:"center",background:W.card,borderRadius:8,padding:"6px 4px",border:`1px solid ${W.border}`}}>
              <div style={{fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>{s.n>999?`${(s.n/1000).toFixed(1)}k`:s.n}</div>
              <div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>{s.l}</div>
            </div>
          ))}
        </div>}
        {m.keywords&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
          {m.keywords.slice(0,6).map(k=><span key={k} style={{padding:"2px 8px",borderRadius:10,fontSize:8,fontFamily:"monospace",background:W.card,border:`1px solid ${W.border}`,color:W.dim}}>#{k}</span>)}
        </div>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UPCOMING SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const UpcomingScreen = ({ onNav, onSelectUpcoming, watchlist, onToggleWatchlist }) => {
  const [genre,setGenre]=useState("All");
  const filtered=[...UPCOMING].filter(u=>genre==="All"||u.genres.some(g=>g.name===genre)).sort((a,b)=>a.days_until_release-b.days_until_release);
  return (
    <ScreenWithNav active="upcoming" onNav={onNav}>
      <div style={{padding:"8px 22px 6px",fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>◈ UPCOMING · MUST SEE</div>
      <div style={{display:"flex",gap:6,padding:"0 22px 10px",overflowX:"auto"}}>
        {ALL_GENRES.map(g=>(
          <span key={g} onClick={()=>setGenre(g)} style={{flexShrink:0,padding:"4px 12px",borderRadius:16,fontSize:9,fontFamily:"monospace",fontWeight:600,cursor:"pointer",background:genre===g?W.accentDim:W.card,border:`1px solid ${genre===g?W.accent:W.border}`,color:genre===g?W.accent:W.dim}}>{g}</span>
        ))}
      </div>
      <div style={{padding:"0 22px 16px",display:"flex",flexDirection:"column",gap:10}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:W.dim,fontFamily:"monospace",fontSize:11}}>No upcoming {genre} films</div>}
        {filtered.map(u=>(
          <div key={u.id} style={{background:W.card,border:`1px solid ${u.is_must_see?W.accent+"33":W.border}`,borderRadius:14,padding:14}}>
            <div style={{display:"flex",gap:12,cursor:"pointer"}} onClick={()=>onSelectUpcoming(u)}>
              <Poster url={u.poster_url} w={56} h={78} radius={8}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>{u.title}</span>
                  {u.is_must_see&&<Badge color="red">MUST SEE</Badge>}
                </div>
                <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:2}}>{u.directors?.[0]?.name} · {u.genres?.map(g=>g.name).join(", ")}</div>
                <div style={{fontSize:10,color:W.gold,fontFamily:"monospace",marginTop:4}}>{u.must_see_reason}</div>
                <div style={{display:"flex",gap:10,marginTop:6}}>
                  <div style={{fontSize:10,color:W.dim,fontFamily:"monospace"}}>📅 {u.release_date}</div>
                  <div style={{fontSize:10,color:W.accent,fontFamily:"monospace",fontWeight:700}}>{u.days_until_release}d away</div>
                </div>
                <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:3}}>👀 {u.watchlist_count?.toLocaleString()} watching · 📊 {u.anticipation_score} hype</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <div style={{flex:1}} onClick={()=>onToggleWatchlist(u.id)}>
                <div style={{background:watchlist.has(u.id)?W.blueDim:W.accent,border:watchlist.has(u.id)?`1px solid ${W.blue}`:"none",color:watchlist.has(u.id)?W.blue:"#fff",borderRadius:10,padding:"7px 0",fontSize:9,fontWeight:700,textAlign:"center",fontFamily:"monospace",cursor:"pointer"}}>{watchlist.has(u.id)?"◆ IN WATCHLIST":"+ WATCHLIST"}</div>
              </div>
              <div style={{flex:1}}><Btn full small>🔔 NOTIFY ME</Btn></div>
            </div>
          </div>
        ))}
      </div>
    </ScreenWithNav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const LeaderboardScreen = ({ onNav, onSelectMovie }) => {
  const [tab,setTab]=useState("global");
  const GLOBAL=[
    {rank:1,user:"@cinephile99",avatar:"C",movies_rated:847,streak:34,badge:"💎"},
    {rank:2,user:"@filmfreak",avatar:"F",movies_rated:612,streak:21,badge:"🏆"},
    {rank:3,user:"@maya",avatar:"M",movies_rated:489,streak:12,badge:"🏆"},
    {rank:4,user:"@reeltalks",avatar:"R",movies_rated:356,streak:8,badge:"🔥"},
    {rank:5,user:"@jasonk",avatar:"J",movies_rated:89,streak:7,badge:"🔥",isYou:true},
    {rank:6,user:"@josh",avatar:"J",movies_rated:76,streak:4,badge:""},
    {rank:7,user:"@lina",avatar:"L",movies_rated:63,streak:3,badge:""},
    {rank:8,user:"@carlos",avatar:"C",movies_rated:41,streak:1,badge:""},
  ];
  const FM=[
    {rank:1,title:"Interstellar",movie_id:"m-001",avg_rating:9.4,rated_by:["@maya","@josh"],rated_count:3},
    {rank:2,title:"Parasite",movie_id:"m-002",avg_rating:9.1,rated_by:["@maya","@carlos"],rated_count:2},
    {rank:3,title:"The Dark Knight",movie_id:"m-003",avg_rating:8.8,rated_by:["@josh","@lina"],rated_count:3},
    {rank:4,title:"Whiplash",movie_id:"m-004",avg_rating:8.7,rated_by:["@maya"],rated_count:1},
    {rank:5,title:"RRR",movie_id:"m-005",avg_rating:8.4,rated_by:["@carlos","@lina"],rated_count:2},
  ];
  return (
    <ScreenWithNav active="leaderboard" onNav={onNav}>
      <div style={{padding:"8px 22px 6px",fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>◆ LEADERBOARD</div>
      <div style={{display:"flex",margin:"0 22px",borderBottom:`1px solid ${W.border}`}}>
        {[{key:"global",label:"Most Rated"},{key:"friends",label:"Friends' Picks"}].map(t=>(
          <div key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,textAlign:"center",padding:"8px 0",fontSize:10,fontFamily:"monospace",fontWeight:600,color:tab===t.key?W.accent:W.dim,borderBottom:`2px solid ${tab===t.key?W.accent:"transparent"}`,cursor:"pointer"}}>{t.label}</div>
        ))}
      </div>
      <div style={{padding:"10px 22px 16px",display:"flex",flexDirection:"column",gap:6}}>
        {tab==="global"&&GLOBAL.map(u=>(
          <div key={u.rank} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:u.isYou?W.accentDim:u.rank<=3?`${W.gold}08`:W.card,borderRadius:10,border:`1px solid ${u.isYou?W.accent+"33":u.rank<=3?W.gold+"22":W.border}`}}>
            <span style={{width:20,fontSize:u.rank<=3?14:11,fontWeight:900,color:W.dim,fontFamily:"monospace",textAlign:"center"}}>{u.rank<=3?["🥇","🥈","🥉"][u.rank-1]:u.rank}</span>
            <div style={{width:30,height:30,borderRadius:"50%",background:W.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace"}}>{u.avatar}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:700,color:u.isYou?W.accent:W.text,fontFamily:"monospace"}}>{u.user}</span>
                {u.isYou&&<span style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>(you)</span>}
                {u.badge&&<span>{u.badge}</span>}
              </div>
              <div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{u.streak>0&&`🔥 ${u.streak}w streak`}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:900,color:W.gold,fontFamily:"monospace"}}>{u.movies_rated}</div>
              <div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>FILMS</div>
            </div>
          </div>
        ))}
        {tab==="friends"&&FM.map(m=>{
          const movie=MOVIES.find(c=>c.id===m.movie_id);
          return (
            <div key={m.rank} onClick={()=>movie&&onSelectMovie(movie)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:m.rank<=3?`${W.accent}08`:W.card,borderRadius:10,border:`1px solid ${m.rank<=3?W.accent+"22":W.border}`,cursor:"pointer"}}>
              <span style={{width:20,fontSize:m.rank<=3?14:11,fontWeight:900,color:W.dim,fontFamily:"monospace",textAlign:"center"}}>{m.rank<=3?["🥇","🥈","🥉"][m.rank-1]:m.rank}</span>
              <Poster url={movie?.poster_url} w={32} h={44} radius={6}/>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:W.text,fontFamily:"monospace"}}>{m.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:2}}>Rated by {m.rated_by.slice(0,2).join(", ")}{m.rated_count>2&&` +${m.rated_count-2} more`}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:900,color:W.gold,fontFamily:"monospace"}}>★ {m.avg_rating}</div><div style={{fontSize:7,color:W.dim,fontFamily:"monospace"}}>AVG</div></div>
            </div>
          );
        })}
      </div>
    </ScreenWithNav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const SearchScreen = ({ onNav, onSelectMovie }) => {
  const [query,setQuery]=useState("");
  const results=query.length>1?MOVIES.filter(m=>m.title.toLowerCase().includes(query.toLowerCase())):[];
  return (
    <ScreenWithNav active="search" onNav={onNav}>
      <div style={{padding:"8px 22px 6px"}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="⌕ Search movies, directors..."
          style={{width:"100%",background:W.card,border:`1px solid ${W.border}`,borderRadius:12,padding:"11px 16px",fontSize:12,color:W.text,fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}/>
      </div>
      <div style={{padding:"0 22px 16px"}}>
        {results.map(m=>(
          <div key={m.id} onClick={()=>onSelectMovie(m)} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${W.border}`,cursor:"pointer"}}>
            <Poster url={m.poster_url} w={36} h={50} radius={6}/>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace"}}>{m.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{m.release_year} · {m.directors?.[0]?.name}</div></div>
            <div style={{fontSize:10,fontWeight:800,color:W.gold,fontFamily:"monospace"}}>#{m.global_rank||"—"}</div>
          </div>
        ))}
        {query.length<=1&&<>
          <div style={{fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:8}}>TRENDING</div>
          {[...MOVIES].sort((a,b)=>(a.trending_rank||99)-(b.trending_rank||99)).slice(0,5).map(m=>(
            <div key={m.id} onClick={()=>onSelectMovie(m)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${W.border}`,cursor:"pointer"}}>
              <span style={{fontSize:11,color:W.dim}}>🔥</span>
              <span style={{fontSize:12,color:W.text,fontFamily:"monospace",flex:1}}>{m.title}</span>
              {m.is_international&&<Badge color="purple">{m.original_language}</Badge>}
              <span style={{fontSize:10,color:W.dim}}>→</span>
            </div>
          ))}
          <div style={{fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginTop:12}}>BROWSE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
            {["🎭 Drama","🚀 Sci-Fi","😱 Horror","😂 Comedy","💥 Action","🌏 International"].map(c=>(
              <span key={c} style={{padding:"7px 14px",borderRadius:10,fontSize:10,fontFamily:"monospace",fontWeight:600,background:W.card,border:`1px solid ${W.border}`,color:W.dim}}>{c}</span>
            ))}
          </div>
        </>}
      </div>
    </ScreenWithNav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const ProfileScreen = ({ onNav, onSelectMovie, rankedIds, eloScores, watchlist, onSelectUpcoming, username, session, userId }) => {
  const [tab,setTab]=useState("rankings");
  const [apiRankings,setApiRankings]=useState(null);
  const savedMovies=MOVIES.filter(m=>["m-001","m-002","m-005"].includes(m.id));
  const watchlistMovies=UPCOMING.filter(u=>watchlist.has(u.id));
  const totalSaved=savedMovies.length+watchlistMovies.length;

  useEffect(()=>{
    if(tab==="rankings"&&userId&&session){
      API.getRankings(userId,session).then(data=>{if(data)setApiRankings(data);});
    }
  },[tab,userId,session]);

  const allRankings=apiRankings
    ?apiRankings.map(r=>MOVIES.find(m=>m.id===r.movie.movie_id)).filter(Boolean)
    :rankedIds.map(id=>MOVIES.find(m=>m.id===id)).filter(Boolean);

  return (
    <ScreenWithNav active="profile" onNav={onNav}>
      <div style={{padding:"8px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>MY PROFILE</span>
        <span style={{fontSize:14}}>⚙</span>
      </div>
      <div style={{padding:"0 22px",display:"flex",gap:14,alignItems:"center"}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:W.card,border:`2px solid ${W.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>👤</div>
        <div>
          <div style={{fontSize:15,fontWeight:900,color:W.text,fontFamily:"monospace"}}>@{username}</div>
          <div style={{display:"flex",gap:4,alignItems:"center",marginTop:2}}><span>🔥</span><span style={{fontSize:10,fontWeight:700,color:W.gold,fontFamily:"monospace"}}>7-week streak</span></div>
        </div>
      </div>
      <div style={{display:"flex",padding:"14px 22px"}}>
        {[{n:allRankings.length,l:"Ranked"},{n:totalSaved,l:"Saved"},{n:34,l:"Following"},{n:128,l:"Followers"}].map((s,i)=>(
          <div key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:900,color:i===0?W.accent:W.text,fontFamily:"monospace"}}>{s.n}</div>
            <div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${W.border}`,margin:"0 22px"}}>
        {["rankings","saved","reviews"].map(t=>(
          <div key={t} onClick={()=>setTab(t)} style={{flex:1,textAlign:"center",padding:"8px 0",fontSize:9,fontFamily:"monospace",fontWeight:600,color:tab===t?W.accent:W.dim,borderBottom:`2px solid ${tab===t?W.accent:"transparent"}`,cursor:"pointer",textTransform:"capitalize"}}>{t}</div>
        ))}
      </div>
      <div style={{padding:"10px 22px 16px",display:"flex",flexDirection:"column",gap:5}}>
        {tab==="rankings"&&<>
          <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1}}>YOUR RANKINGS · {allRankings.length} films</div>
          {allRankings.length===0&&<div style={{textAlign:"center",padding:"28px 0"}}><div style={{fontSize:32,marginBottom:8}}>🎬</div><div style={{fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace"}}>No rankings yet</div><div style={{fontSize:10,color:W.dim,fontFamily:"monospace",marginTop:6,lineHeight:1.6}}>Open any movie and tap ⚡ RANK</div></div>}
          {allRankings.map((m,i)=>(
            <div key={m.id} onClick={()=>onSelectMovie(m)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:i===0?W.goldDim:W.card,borderRadius:10,border:`1px solid ${i===0?W.gold+"44":W.border}`,cursor:"pointer"}}>
              <span style={{fontSize:i<3?13:11,fontWeight:900,color:W.dim,fontFamily:"monospace",width:18,textAlign:"center",flexShrink:0}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</span>
              <Poster url={m.poster_url} w={28} h={38} radius={4}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:W.text,fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{m.release_year}</div></div>
              <span style={{fontSize:9,color:W.blue,fontFamily:"monospace",fontWeight:700,flexShrink:0}}>
                {apiRankings?`★ ${apiRankings.find(r=>r.movie.movie_id===m.id)?.score||"—"}`:eloScores[m.id]||1500}
              </span>
            </div>
          ))}
        </>}
        {tab==="saved"&&<>
          <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1}}>MOVIES TO WATCH · {totalSaved} saved</div>
          {totalSaved===0&&<div style={{textAlign:"center",padding:"28px 0"}}><div style={{fontSize:32,marginBottom:8}}>◇</div><div style={{fontSize:12,fontWeight:700,color:W.text,fontFamily:"monospace"}}>Nothing saved yet</div></div>}
          {savedMovies.map(m=>(
            <div key={m.id} onClick={()=>onSelectMovie(m)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:W.card,borderRadius:10,border:`1px solid ${W.blue}22`,cursor:"pointer"}}>
              <Poster url={m.poster_url} w={36} h={50} radius={6}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:W.text,fontFamily:"monospace"}}>{m.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{m.release_year} · {m.directors?.[0]?.name}</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:12,color:W.blue}}>◆</div><div style={{fontSize:7,color:W.blue,fontFamily:"monospace"}}>SAVED</div></div>
            </div>
          ))}
          {watchlistMovies.map(u=>(
            <div key={u.id} onClick={()=>onSelectUpcoming(u)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:W.card,borderRadius:10,border:`1px solid ${W.accent}22`,cursor:"pointer"}}>
              <Poster url={u.poster_url} w={36} h={50} radius={6}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:W.text,fontFamily:"monospace"}}>{u.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{u.release_date} · {u.days_until_release}d away</div><div style={{fontSize:9,color:W.gold,fontFamily:"monospace",marginTop:2}}>{u.must_see_reason}</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:12,color:W.accent}}>◈</div><div style={{fontSize:7,color:W.accent,fontFamily:"monospace"}}>SOON</div></div>
            </div>
          ))}
        </>}
        {tab==="reviews"&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:11,color:W.dim,fontFamily:"monospace"}}>23 reviews written</div></div>}
      </div>
    </ScreenWithNav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RANK SCREEN — sends pairwise results + final score to backend
// ─────────────────────────────────────────────────────────────────────────────

const RankScreen = ({ newMovie, rankedIds, eloScores, onComplete, onCancel, session, userId }) => {
  const [lo,setLo]=useState(0);
  const [hi,setHi]=useState(rankedIds.length);
  const [localElo,setLocalElo]=useState({...eloScores,[newMovie.id]:1500});
  const [result,setResult]=useState(null);
  const [insertPos,setInsertPos]=useState(null);
  const [done,setDone]=useState(false);
  useEffect(()=>{if(rankedIds.length===0){setInsertPos(0);setDone(true);}},[]);

  const midIdx=Math.floor((lo+hi)/2);
  const opponentId=rankedIds[midIdx];
  const opponent=MOVIES.find(m=>m.id===opponentId);

  const pick=async(winnerId)=>{
    const loserId=winnerId===newMovie.id?opponentId:newMovie.id;
    const [newW,newL]=calcElo(localElo[winnerId]||1500,localElo[loserId]||1500);
    setLocalElo(p=>({...p,[winnerId]:newW,[loserId]:newL}));
    const nextLo=winnerId===newMovie.id?lo:midIdx+1;
    const nextHi=winnerId===newMovie.id?midIdx:hi;
    setResult({chosenId:winnerId,otherId:loserId,nextLo,nextHi});
    if(userId&&session) await API.recordPairwise(userId,winnerId,loserId,session);
  };

  const advance=()=>{
    const {nextLo,nextHi}=result;
    setResult(null);
    if(nextLo>=nextHi){setInsertPos(nextLo);setDone(true);}
    else{setLo(nextLo);setHi(nextHi);}
  };

  const handleSave=async(localEloFinal,finalIds)=>{
    if(userId&&session){
      const score=Math.min(10,Math.max(1,Math.round((localEloFinal[newMovie.id]-1400)/20)));
      await API.addRanking(userId,newMovie.id,score,session);
    }
    onComplete(localEloFinal,finalIds);
  };

  if(done&&insertPos!==null){
    const finalIds=[...rankedIds];
    finalIds.splice(insertPos,0,newMovie.id);
    const ranked=finalIds.map(id=>MOVIES.find(m=>m.id===id)).filter(Boolean);
    return (
      <div style={{height:"100%",overflowY:"auto"}}>
        <div style={{padding:"8px 22px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>⚡ RANKED!</span>
          <div onClick={onCancel} style={{fontSize:11,color:W.dim,fontFamily:"monospace",cursor:"pointer"}}>✕</div>
        </div>
        <div style={{padding:"0 22px 20px"}}>
          <div style={{textAlign:"center",padding:"14px 0 10px"}}><div style={{fontSize:28}}>🏆</div><div style={{fontSize:13,fontWeight:900,color:W.gold,fontFamily:"monospace",marginTop:6}}>{newMovie.title} added!</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:3}}>Landed at #{insertPos+1}</div></div>
          <div style={{fontSize:9,color:W.dim,fontFamily:"monospace",letterSpacing:1,marginBottom:8}}>YOUR UPDATED RANKINGS</div>
          {ranked.map((m,i)=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:5,borderRadius:10,border:`1px solid ${m.id===newMovie.id?W.accent+"66":W.border}`,background:m.id===newMovie.id?W.accentDim:i===0?W.goldDim:W.card}}>
              <span style={{fontSize:i<3?13:10,width:20,textAlign:"center",fontFamily:"monospace",fontWeight:900,color:W.dim,flexShrink:0}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</span>
              <Poster url={m.poster_url} w={28} h={38} radius={4}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:m.id===newMovie.id?W.accent:W.text,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div></div>
              {m.id===newMovie.id&&<Badge color="red">NEW</Badge>}
              <div style={{fontSize:9,color:W.blue,fontFamily:"monospace",fontWeight:700,flexShrink:0}}>{localElo[m.id]||1500}</div>
            </div>
          ))}
          <div onClick={()=>handleSave(localElo,finalIds)} style={{marginTop:10,background:W.accent,borderRadius:12,padding:"13px",textAlign:"center",fontSize:12,fontWeight:900,color:"#fff",fontFamily:"monospace",cursor:"pointer"}}>SAVE TO PROFILE →</div>
        </div>
      </div>
    );
  }

  if(!opponent) return null;
  const chosen=result?MOVIES.find(m=>m.id===result.chosenId):null;
  const other=result?MOVIES.find(m=>m.id===result.otherId):null;
  const totalComps=Math.max(1,Math.ceil(Math.log2(rankedIds.length+1)));

  return (
    <div style={{height:"100%",overflowY:"auto"}}>
      <div style={{padding:"8px 22px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:800,color:W.text,fontFamily:"monospace"}}>⚡ RANK IT</span>
        <div onClick={onCancel} style={{fontSize:11,color:W.dim,fontFamily:"monospace",cursor:"pointer"}}>✕ Cancel</div>
      </div>
      <div style={{padding:"0 22px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:`linear-gradient(135deg,${W.accent}10,${W.accent}04)`,border:`1px solid ${W.accent}33`,borderRadius:14,padding:"10px 14px",display:"flex",gap:12,alignItems:"center"}}>
          <Poster url={newMovie.poster_url} w={40} h={56} radius={6}/>
          <div><div style={{fontSize:8,color:W.accent,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>PLACING IN YOUR LIST</div><div style={{fontSize:13,fontWeight:900,color:W.text,fontFamily:"monospace",marginTop:2}}>{newMovie.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace"}}>{newMovie.release_year} · {newMovie.directors?.[0]?.name}</div></div>
        </div>
        <div style={{textAlign:"center"}}><div style={{fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1}}>WHICH DO YOU PREFER?</div><div style={{fontSize:8,color:W.dim,fontFamily:"monospace",marginTop:2}}>~{totalComps} comparisons · {hi-lo} remaining</div></div>
        {!result?(
          <div style={{display:"flex",gap:10}}>
            {[newMovie,opponent].map(m=>(
              <div key={m.id} onClick={()=>pick(m.id)} style={{flex:1,background:W.card,border:`1px solid ${W.border}`,borderRadius:16,padding:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <Poster url={m.poster_url} w={100} h={140} radius={10}/>
                <div style={{textAlign:"center"}}><div style={{fontSize:11,fontWeight:800,color:W.text,fontFamily:"monospace",lineHeight:1.3}}>{m.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:2}}>{m.release_year}</div>{m.id!==newMovie.id&&<div style={{fontSize:8,color:W.blue,fontFamily:"monospace",marginTop:3,fontWeight:700}}>#{rankedIds.indexOf(m.id)+1} in your list</div>}{m.id===newMovie.id&&<div style={{fontSize:8,color:W.accent,fontFamily:"monospace",marginTop:3,fontWeight:700}}>NEW</div>}</div>
                <div style={{background:W.accentDim,border:`1px solid ${W.accent}44`,borderRadius:10,padding:"7px 0",width:"100%",textAlign:"center",fontSize:10,fontWeight:900,color:W.accent,fontFamily:"monospace"}}>THIS ONE ▶</div>
              </div>
            ))}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{background:W.greenDim,border:`1px solid ${W.green}44`,borderRadius:14,padding:14,display:"flex",gap:12,alignItems:"center"}}><Poster url={chosen.poster_url} w={48} h={66} radius={8}/><div><div style={{fontSize:8,color:W.green,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>✓ YOU PREFERRED</div><div style={{fontSize:13,fontWeight:900,color:W.text,fontFamily:"monospace",marginTop:2}}>{chosen.title}</div><div style={{fontSize:9,color:W.dim,fontFamily:"monospace",marginTop:2}}>Narrowing down further…</div></div></div>
            <div style={{background:W.card,border:`1px solid ${W.border}`,borderRadius:14,padding:14,display:"flex",gap:12,alignItems:"center",opacity:0.6}}><Poster url={other.poster_url} w={48} h={66} radius={8}/><div><div style={{fontSize:8,color:W.dim,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>✗ NOT THIS TIME</div><div style={{fontSize:13,fontWeight:900,color:W.text,fontFamily:"monospace",marginTop:2}}>{other.title}</div></div></div>
            <div onClick={advance} style={{background:W.accent,borderRadius:12,padding:"13px",textAlign:"center",fontSize:12,fontWeight:900,color:"#fff",fontFamily:"monospace",cursor:"pointer"}}>{result.nextLo>=result.nextHi?"FINISH RANKING →":"NEXT COMPARISON →"}</div>
          </div>
        )}
        {!result&&rankedIds.length>0&&<div style={{marginTop:4}}><div style={{height:3,background:W.border,borderRadius:2}}><div style={{height:"100%",background:W.accent,borderRadius:2,width:`${Math.max(5,100-((hi-lo)/Math.max(rankedIds.length,1)*100))}%`,transition:"width 0.3s"}}/></div></div>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [authState,setAuthState]=useState("logged-out");
  const [loginProvider,setLoginProvider]=useState(null);
  const [session,setSession]=useState(null);
  const [userId,setUserId]=useState(null);
  const [username,setUsername]=useState("");
  const [screen,setScreen]=useState("home");
  const [selectedMovie,setSelectedMovie]=useState(null);
  const [selectedUpcoming,setSelectedUpcoming]=useState(null);
  const [rankMovie,setRankMovie]=useState(null);
  const [rankedIds,setRankedIds]=useState([]);
  const [eloScores,setEloScores]=useState({});
  const [watchlist,setWatchlist]=useState(new Set());

  const onNav=useCallback(s=>{setScreen(s);setSelectedMovie(null);setSelectedUpcoming(null);setRankMovie(null);},[]);
  const onSelectMovie=useCallback(m=>{setSelectedMovie(m);setSelectedUpcoming(null);setScreen("detail");},[]);
  const onSelectUpcoming=useCallback(u=>{setSelectedUpcoming(u);setSelectedMovie(null);setScreen("upcoming-detail");},[]);
  const onBack=useCallback(()=>{setScreen("home");setSelectedMovie(null);setSelectedUpcoming(null);},[]);
  const onBackToUpcoming=useCallback(()=>{setScreen("upcoming");setSelectedUpcoming(null);},[]);
  const onRank=useCallback(m=>{setRankMovie(m);setScreen("rank");},[]);
  const onRankComplete=useCallback((elo,ids)=>{setEloScores(elo);setRankedIds(ids);setRankMovie(null);setScreen("profile");},[]);
  const onRankCancel=useCallback(()=>{setRankMovie(null);setScreen(selectedMovie?"detail":"home");},[selectedMovie]);

  const onToggleWatchlist=useCallback(async(id)=>{
    const has=watchlist.has(id);
    setWatchlist(p=>{const n=new Set(p);has?n.delete(id):n.add(id);return n;});
    if(userId&&session) has?await API.removeWatchlist(userId,id,session):await API.addWatchlist(userId,id,session);
  },[userId,session,watchlist]);

  const handleLogin=async(provider)=>{
    setLoginProvider(provider);
    const stub=provider==="apple"?"sub_apple|Apple User|user@icloud.com":"sub_google|Google User|user@gmail.com";
    const res=await API.login(provider,stub);
    if(res){
      setSession(res.session_token);
      setUserId(res.user.user_id);
      if(!res.needs_username&&res.username){setUsername(res.username);setAuthState("logged-in");return;}
    }
    setAuthState("choosing-username");
  };

  const handleUsernameComplete=(u)=>{setUsername(u);setAuthState("logged-in");};

  useEffect(()=>{
    if(authState==="logged-in"&&userId&&session){
      API.getWatchlist(userId,session).then(data=>{if(data?.movie_ids)setWatchlist(new Set(data.movie_ids));});
    }
  },[authState,userId,session]);

  const activeNav=()=>{if(["detail","rank"].includes(screen))return"home";if(screen==="upcoming-detail")return"upcoming";return screen;};
  const navLabel=()=>{if(authState==="logged-out")return"Sign In";if(authState==="choosing-username")return"Create Username";if(screen==="detail")return selectedMovie?.title||"Detail";if(screen==="upcoming-detail")return selectedUpcoming?.title||"Upcoming";if(screen==="rank")return"Ranking";return screen;};

  const content=()=>{
    if(authState==="logged-out") return <LoginScreen onLogin={handleLogin}/>;
    if(authState==="choosing-username") return <UsernameScreen provider={loginProvider} session={session} onComplete={handleUsernameComplete}/>;
    if(screen==="home") return <HomeScreen onNav={onNav} onSelectMovie={onSelectMovie} session={session} userId={userId}/>;
    if(screen==="detail") return <div style={{display:"flex",flexDirection:"column",height:"100%"}}><div style={{flex:1,overflowY:"auto"}}><MovieDetailScreen movie={selectedMovie} onBack={onBack} onRank={onRank} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist}/></div></div>;
    if(screen==="upcoming") return <UpcomingScreen onNav={onNav} onSelectUpcoming={onSelectUpcoming} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist}/>;
    if(screen==="upcoming-detail") return <div style={{display:"flex",flexDirection:"column",height:"100%"}}><div style={{flex:1,overflowY:"auto"}}><MovieDetailScreen movie={selectedUpcoming} onBack={onBackToUpcoming} isUpcoming={true} watchlist={watchlist} onToggleWatchlist={onToggleWatchlist}/></div></div>;
    if(screen==="leaderboard") return <LeaderboardScreen onNav={onNav} onSelectMovie={onSelectMovie}/>;
    if(screen==="search") return <SearchScreen onNav={onNav} onSelectMovie={onSelectMovie}/>;
    if(screen==="profile") return <ProfileScreen onNav={onNav} onSelectMovie={onSelectMovie} rankedIds={rankedIds} eloScores={eloScores} watchlist={watchlist} onSelectUpcoming={onSelectUpcoming} username={username} session={session} userId={userId}/>;
    if(screen==="rank"&&rankMovie){
      if(rankedIds.includes(rankMovie.id)){setTimeout(()=>{setScreen("detail");setRankMovie(null);},0);return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><div style={{fontSize:24}}>✓</div><div style={{fontSize:11,color:W.green,fontFamily:"monospace"}}>Already ranked!</div></div>;}
      return <RankScreen newMovie={rankMovie} rankedIds={rankedIds} eloScores={eloScores} onComplete={onRankComplete} onCancel={onRankCancel} session={session} userId={userId}/>;
    }
    return <HomeScreen onNav={onNav} onSelectMovie={onSelectMovie} session={session} userId={userId}/>;
  };

  return (
    <div style={{minHeight:"100vh",background:"#08080b",padding:"20px 12px 40px",fontFamily:"system-ui"}}>
      <div style={{textAlign:"center",marginBottom:16}}>
        <h1 style={{fontSize:26,fontWeight:900,color:W.accent,fontFamily:"monospace",letterSpacing:-1,margin:0,textShadow:`0 0 30px ${W.accent}33`}}>RATED</h1>
        <p style={{fontSize:9,color:W.dim,fontFamily:"monospace",margin:"4px 0 0",letterSpacing:3}}>DATA-DRIVEN PROTOTYPE · ENTITY → UI</p>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginBottom:20,maxWidth:560,margin:"0 auto 20px"}}>
        {authState==="logged-in"
          ?Object.entries({home:"Home",upcoming:"Upcoming",search:"Search",leaderboard:"Board",profile:"Profile"}).map(([k,v])=>(
              <button key={k} onClick={()=>onNav(k)} style={{padding:"5px 11px",borderRadius:8,fontSize:9,fontFamily:"monospace",fontWeight:700,cursor:"pointer",border:`1px solid ${activeNav()===k?W.accent:W.border}`,background:activeNav()===k?W.accentDim:"transparent",color:activeNav()===k?W.accent:W.dim}}>{v}</button>
            ))
          :<button onClick={()=>setAuthState("logged-out")} style={{padding:"5px 11px",borderRadius:8,fontSize:9,fontFamily:"monospace",fontWeight:700,cursor:"pointer",border:`1px solid ${W.accent}`,background:W.accentDim,color:W.accent}}>← Login</button>
        }
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{width:320,height:640,background:W.bg,borderRadius:36,border:`2.5px solid ${W.border}`,overflow:"hidden",position:"relative",boxShadow:"0 24px 80px rgba(0,0,0,0.6)",display:"flex",flexDirection:"column"}}>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:100,height:26,background:"#000",borderRadius:"0 0 18px 18px",zIndex:10}}/>
            <div style={{height:44,display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 24px 4px",fontSize:11,color:W.dim,fontFamily:"monospace",flexShrink:0}}>
              <span style={{fontWeight:600}}>9:41</span><span>●●● ▐██▌</span>
            </div>
            <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>{content()}</div>
          </div>
          <span style={{fontSize:10,color:W.dim,fontFamily:"monospace",letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>{navLabel()}</span>
        </div>
      </div>
      <div style={{maxWidth:500,margin:"16px auto 0",textAlign:"center"}}>
        <p style={{fontSize:9,color:W.dim,fontFamily:"monospace",lineHeight:1.6}}>Apple ID & Google only · No passwords · Import watch history from 8 platforms</p>
      </div>
    </div>
  );
}
