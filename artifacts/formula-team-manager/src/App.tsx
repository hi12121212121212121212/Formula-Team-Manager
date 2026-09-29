import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Activity, Award, Banknote, Check, ChevronRight, CircleAlert, Flag, MapPin,
  Medal, RotateCcw, Save, ShieldCheck, Sparkles, Trophy, Users, Wrench, Zap,
} from 'lucide-react';
import {
  buyUpgrade, createNewGame, CURRENT_F1_TEAMS, currentTrack, DRIVERS, estimatedWinChance,
  finishRace, getDriver, getF1Team, getRaceProgress, hireDriver, loadGame, saveGame, selectF1Team,
  startRace, TRACKS, UPGRADES,
  type CarStats, type Driver, type F1Team, type GameState, type PendingRace, type RaceResult, type RaceStrategy, type Track,
} from './game';

type View = 'team-select' | 'overview' | 'market' | 'garage' | 'race' | 'standings';
const NAV: { id: View; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Pit wall', icon: Activity },
  { id: 'market', label: 'Driver market', icon: Users },
  { id: 'garage', label: 'Car development', icon: Wrench },
  { id: 'race', label: 'Race strategy', icon: Flag },
  { id: 'standings', label: 'Championship', icon: Trophy },
];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money = (amount: number) => currency.format(amount);
const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const formatRaceClock = (milliseconds: number) => {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

function entryView(game: GameState): View {
  if (game.pendingRace) return 'race';
  if (game.round === 0 && !game.selectedTeamId) return 'team-select';
  return game.drivers.length < 2 ? 'market' : 'overview';
}

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame());
  const [view, setView] = useState<View>(() => entryView(game));
  const [strategy, setStrategy] = useState<RaceStrategy>({ pace: 'balanced', tire: 'medium', pitStops: 1 });
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const track = currentTrack(game);
  const signedDrivers = game.drivers.map(getDriver).filter((driver): driver is Driver => Boolean(driver));
  const latest = game.history[game.history.length - 1];
  const selectedTeam = getF1Team(game.selectedTeamId);
  const shellStyle = {
    '--team-accent': selectedTeam?.accent ?? '#d84934',
    '--team-secondary': selectedTeam?.secondary ?? '#e9ba6b',
  } as CSSProperties;

  function commit(next: GameState) {
    setGame(next);
    setError('');
    setNotice('');
    try { saveGame(next); } catch { setError('Changes are active, but this browser could not save them locally.'); }
  }
  function hire(id: string) {
    const action = hireDriver(game, id);
    if (action.error) { setError(action.error); setNotice(''); return; }
    commit(action.state);
    setNotice(`${getDriver(id)?.name ?? 'Driver'} is on the roster.`);
  }
  function chooseTeam(id: string) {
    const action = selectF1Team(game, id);
    if (action.error) { setError(action.error); setNotice(''); return; }
    commit(action.state);
    setView(action.state.drivers.length < 2 ? 'market' : 'overview');
    setNotice(`${getF1Team(id)?.name ?? 'F1 team'} selected for your season.`);
  }
  function upgrade(id: keyof CarStats) {
    const action = buyUpgrade(game, id);
    if (action.error) { setError(action.error); setNotice(''); return; }
    commit(action.state);
    setNotice(`${UPGRADES.find((item) => item.id === id)?.name ?? 'Upgrade'} installed.`);
  }
  function race() {
    const action = startRace(game, strategy);
    if (action.error) { setError(action.error); setNotice(''); return; }
    commit(action.state);
    setView('race');
    setNotice('The race is live. Follow the changing positions while the 60-second clock runs.');
  }
  function rename(name: string) { commit({ ...game, teamName: name.slice(0, 24) }); }
  function save() {
    try { saveGame(game); setError(''); setNotice('Season saved on this device.'); }
    catch { setError('Could not save to this browser. Check local storage permissions and try again.'); setNotice(''); }
  }
  function load() {
    if (game.pendingRace) return;
    try {
      const saved = loadGame();
      setGame(saved);
      setView(entryView(saved));
      setError('');
      setNotice('Local season loaded.');
    } catch { setError('Could not load the local season.'); setNotice(''); }
  }
  function newSeason() {
    if (game.pendingRace) { setError('Finish the live race before starting a new season.'); setNotice(''); return; }
    if (!window.confirm('Start a new season? This replaces the saved season on this device.')) return;
    commit(createNewGame());
    setStrategy({ pace: 'balanced', tire: 'medium', pitStops: 1 });
    setView('team-select');
    setNotice('New season opened. Choose an F1 team to get started.');
  }
  useEffect(() => {
    if (!game.pendingRace) return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 250);
    const focusTimer = window.setTimeout(() => {
      document.getElementById('live-race-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(focusTimer);
    };
  }, [game.pendingRace?.startedAt]);
  useEffect(() => {
    if (!game.pendingRace || clockNow - game.pendingRace.startedAt < game.pendingRace.durationMs) return;
    const action = finishRace(game, clockNow);
    if (action.error || !action.result) return;
    commit(action.state);
    setNotice('Race classified. Prize money and championship points added.');
  }, [clockNow, game.pendingRace]);
  const headings: Record<View, string> = {
    'team-select': 'Choose your F1 team.',
    overview: game.drivers.length < 2 ? 'A team starts here.' : 'The work before Sunday.',
    market: game.drivers.length === 2 ? 'Your seats are filled.' : 'Find your two drivers.',
    garage: 'Build a faster answer.',
    race: track ? `Race ${String(game.round + 1).padStart(2, '0')} / ${track.location}` : 'Season classified.',
    standings: 'Every point has a price.',
  };
  const labels: Record<View, string> = {
    'team-select': 'THE 2026 GRID',
    overview: 'THE PIT WALL', market: 'BUILD THE LINEUP', garage: 'DEVELOPMENT BAY',
    race: 'RACE CONTROL', standings: 'SEASON SCOREBOARD',
  };
  return (
    <div className="game-shell" style={shellStyle}>
      <div className="race-topline" />
      <div className="app-frame">
        <aside className="sidebar">
          <div className="brand-lockup">
            <div className="brand-mark"><span>FT</span><i /></div>
            <div><div className="brand-title">FORMULA / TEAM</div><div className="brand-subtitle">MANAGER · SEASON 01</div></div>
          </div>
          <div className="sidebar-season"><div className="side-kicker">YOUR F1 TEAM</div><div className="sidebar-team-line"><span className="sidebar-team-mark">{selectedTeam?.shortName ?? 'FT'}</span><div className="side-team">{selectedTeam ? game.teamName : 'Choose a team'}</div></div>
            <div className="season-progress"><div className="progress-track"><span style={{ width: `${game.round / 8 * 100}%` }} /></div><span>{String(game.round).padStart(2, '0')} <em>/ 08</em></span></div>
          </div>
          <nav className="main-nav" aria-label="Game sections"><div className="side-kicker nav-kicker">OPERATIONS</div>
            {NAV.map(({ id, label, icon: Icon }) => <button type="button" key={id} disabled={Boolean(game.pendingRace) && id !== 'race'} onClick={() => { setView(id); setError(''); setNotice(''); }} className={`nav-item ${view === id ? 'is-active' : ''}`} data-testid={`nav-${id}`} aria-current={view === id ? 'page' : undefined}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === 'market' && game.drivers.length < 2 && <b className="nav-count">{2 - game.drivers.length}</b>}{id === 'race' && game.drivers.length === 2 && <span className="nav-dot" />}
            </button>)}
          </nav>
          <div className="sidebar-bottom"><div className="save-status"><span className="save-led" /><span>LOCAL SEASON SAVE</span></div><div className="sidebar-note">Every decision spends from the same budget. Make the next one count.</div></div>
        </aside>
        <main className="main-column">
          <header className="topbar">
            <div className="mobile-brand"><div className="brand-mark small"><span>FT</span><i /></div><span>FORMULA / TEAM</span></div>
            <div className="topbar-title"><span className="eyebrow">{labels[view]}</span><h1>{headings[view]}</h1></div>
            <div className="topbar-actions"><div className="round-indicator"><span className="round-label">ROUND</span><strong className="mono">{String(Math.min(game.round + (track ? 1 : 0), 8)).padStart(2, '0')}<small> / 08</small></strong></div>
              <button className="icon-action button-motion" onClick={load} disabled={Boolean(game.pendingRace)} title={game.pendingRace ? 'Loading is unavailable during a live race' : 'Load local season'} aria-label="Load local season" data-testid="button-load"><RotateCcw size={16} /></button>
              <button className="save-button button-motion" onClick={save} data-testid="button-save"><Save size={15} /><span>Save season</span></button>
            </div>
          </header>
          <section className="live-strip" aria-label="Live season status">
            <LiveStat icon={<Banknote size={16} />} label="AVAILABLE CASH" value={money(game.cash)} testId="text-cash" />
            <div className="strip-rule" />
            <LiveStat icon={<Trophy size={16} />} label="CONSTRUCTOR POINTS" value={<>{game.constructorPoints}<small> PTS</small></>} testId="text-points" />
            <div className="strip-rule" />
            <LiveStat icon={<Flag size={16} />} label={track ? `NEXT UP · ROUND ${game.round + 1}` : 'SEASON STATUS'} value={track?.name ?? 'Season complete'} testId="text-round-track" />
            <div className="strip-season-mark"><span>FTM</span><i>·</i> 2025</div>
          </section>
          {(error || notice) && <div className={`feedback-banner ${error ? 'feedback-error' : 'feedback-success'}`} role={error ? 'alert' : 'status'} data-testid={error ? 'status-error' : 'status-notice'}>
            {error ? <CircleAlert size={17} /> : <Check size={17} />}<span>{error || notice}</span><button aria-label="Dismiss message" onClick={() => { setError(''); setNotice(''); }}>×</button>
          </div>}
          <div className="workspace-content">
            {view === 'team-select' && <TeamSelect selectedTeamId={game.selectedTeamId} onChoose={chooseTeam} />}
            {view === 'overview' && <Overview game={game} track={track} drivers={signedDrivers} latest={latest} navigate={setView} />}
            {view === 'market' && <Market game={game} drivers={signedDrivers} onHire={hire} navigate={setView} />}
            {view === 'garage' && <Garage game={game} drivers={signedDrivers} selectedTeam={selectedTeam} onUpgrade={upgrade} onRename={rename} onNewSeason={newSeason} onChooseTeam={() => setView('team-select')} />}
            {view === 'race' && <RaceDesk game={game} track={track} strategy={strategy} latest={latest} now={clockNow} setStrategy={setStrategy} onRace={race} navigate={setView} />}
            {view === 'standings' && <Standings game={game} navigate={setView} />}
          </div>
          <footer className="app-footer"><span>FORMULA TEAM MANAGER <i>·</i> SINGLE-SEAT OPERATIONS</span><button type="button" onClick={newSeason} disabled={Boolean(game.pendingRace)} data-testid="button-new-season">New season <ChevronRight size={14} /></button></footer>
        </main>
      </div>
      {!track && view === 'race' && <div className="season-finish-ribbon">THE SEASON IS CLASSIFIED</div>}
    </div>
  );
}

function TeamSelect({ selectedTeamId, onChoose }: { selectedTeamId: string | null; onChoose: (id: string) => void }) {
  return <div className="team-select-layout">
    <section className="team-select-hero panel rise-in">
      <div className="team-select-copy">
        <span className="eyebrow">FORMULA 1 / 2026 CONSTRUCTORS</span>
        <h2>Pick your<br /><em>paddock.</em></h2>
        <p>Take charge of one of the eleven teams on this season's grid. Your team choice sets your constructor identity; driver contracts, starting budget, and the race simulation stay the same.</p>
      </div>
      <div className="team-grid-stamp"><span>11</span><small>TEAMS<br />ON THE GRID</small></div>
    </section>
    <div className="team-select-heading"><div><span className="eyebrow">THE 2026 GRID</span><h3>Choose a constructor</h3></div><span className="team-select-count">11 TEAMS · ONE SEASON</span></div>
    <div className="f1-team-grid">
      {CURRENT_F1_TEAMS.map((team, index) => {
        const chosen = selectedTeamId === team.id;
        return <button
          type="button"
          className={`f1-team-card panel rise-in ${chosen ? 'is-chosen' : ''}`}
          key={team.id}
          style={{ '--team-accent': team.accent, '--team-secondary': team.secondary } as CSSProperties}
          onClick={() => onChoose(team.id)}
          aria-pressed={chosen}
          data-testid={`button-choose-team-${team.id}`}
        >
          <span className="f1-team-card-top"><span className="f1-team-monogram">{team.shortName}</span><span className="f1-team-index">{String(index + 1).padStart(2, '0')}</span></span>
          <strong>{team.name}</strong>
          <span className="f1-team-base"><MapPin size={12} /> {team.base}</span>
          <span className="f1-team-card-action">{chosen ? 'CURRENT TEAM' : 'TAKE THE SEAT'}<ChevronRight size={14} /></span>
        </button>;
      })}
    </div>
  </div>;
}

function LiveStat({ icon, label, value, testId }: { icon: ReactNode; label: string; value: ReactNode; testId: string }) {
  return <div className="live-stat"><div className="stat-icon">{icon}</div><div><span className="stat-label">{label}</span><strong className="mono" data-testid={testId}>{value}</strong></div></div>;
}

function Overview({ game, track, drivers, latest, navigate }: { game: GameState; track?: Track; drivers: Driver[]; latest?: RaceResult; navigate: (view: View) => void }) {
  const progress = game.round / TRACKS.length * 100;
  return <div className="overview-layout">
    <div className="overview-main">
      <section className="hero-panel panel rise-in"><div className="hero-grid-lines" aria-hidden="true" /><div className="hero-content">
        <div className="hero-kicker"><span className="red-marker" /> TEAM BRIEFING <span className="hero-divider">/</span> {game.teamName}</div>
        <h2>{drivers.length < 2 ? <>Two seats.<br /><em>One season.</em></> : track ? <>The next call<br /><em>is yours.</em></> : <>The season<br /><em>is yours.</em></>}</h2>
        <p>{drivers.length < 2 ? 'Talent costs money. So does speed. Build a lineup with enough left in the account to give them a car worth driving.' : track ? `${track.name}, ${track.location}. ${track.laps} laps on a ${track.type.toLowerCase()} circuit. Your operation is ready when you are.` : 'Eight rounds run. The final numbers are in. See where your calls put the team.'}</p>
        <button className="button-primary button-motion" onClick={() => navigate(drivers.length < 2 ? 'market' : track ? 'race' : 'standings')} data-testid="button-primary-action">{drivers.length < 2 ? 'Open the driver market' : track ? 'Set race strategy' : 'Review final standings'}<ChevronRight size={17} /></button>
      </div>
      <div className="hero-visual" aria-hidden="true"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="track-schematic"><span /><span /><span /><span /></div><div className="hero-car"><div className="car-wing" /><div className="car-body" /><div className="car-nose" /><div className="car-wheel wheel-a" /><div className="car-wheel wheel-b" /><div className="car-wheel wheel-c" /><div className="car-wheel wheel-d" /></div><div className="visual-label label-top">CHASSIS / 01</div><div className="visual-label label-bottom">BUILT FOR THE LONG RUN</div><div className="visual-number">08</div></div>
      <div className="hero-footer"><span><span className="live-pulse" /> SEASON {game.round < 8 ? 'IN PROGRESS' : 'COMPLETE'}</span><span className="mono">ROUND {String(game.round).padStart(2, '0')} — 08</span></div></section>
      <div className="overview-lower">
        <section className="panel progress-panel rise-in"><div className="section-heading"><div><span className="eyebrow">SEASON AT A GLANCE</span><h3>The championship run</h3></div><span className="round-badge mono">{game.round}<i> / 8</i></span></div>
          <div className="season-track">{TRACKS.map((item, i) => <div className={`season-stop ${i < game.round ? 'is-raced' : ''} ${i === game.round ? 'is-upcoming' : ''}`} key={item.id} title={`${item.name} · ${item.location}`}><span className="stop-dot">{i < game.round ? <Check size={10} /> : String(i + 1).padStart(2, '0')}</span><span className="stop-name">{item.name}</span></div>)}<div className="season-progress-line"><span style={{ width: `${progress}%` }} /></div></div>
          <div className="progress-foot"><span>{game.round} ROUNDS CLASSIFIED</span><span>{8 - game.round} STILL TO RUN</span></div></section>
        <section className="panel roster-panel rise-in"><div className="section-heading compact"><div><span className="eyebrow">RACE SEATS</span><h3>Your lineup</h3></div><button className="text-link" onClick={() => navigate(drivers.length === 2 ? 'garage' : 'market')} data-testid="button-roster-manage">{drivers.length === 2 ? 'Manage' : 'Recruit'} <ChevronRight size={14} /></button></div>
          {drivers.length ? <div className="roster-mini-list">{drivers.map((driver, i) => <div className="roster-mini" key={driver.id}><DriverInitials driver={driver} /><div className="roster-mini-name"><strong>{driver.name}</strong><span>DRIVER {String(i + 1).padStart(2, '0')} · {driver.specialty}</span></div><span className="roster-mini-pace mono">{driver.pace}<small> PACE</small></span></div>)}{drivers.length < 2 && <div className="empty-seat"><span>+</span> One seat still open</div>}</div> : <div className="empty-roster"><Users size={18} /><span>No contracts signed yet.</span></div>}</section>
      </div>
    </div>
    <aside className="overview-rail">
      <section className="budget-card panel rise-in"><div className="rail-card-heading"><span className="eyebrow">THE WAR CHEST</span><Banknote size={17} /></div><div className="budget-number mono">{money(game.cash)}</div><div className="budget-caption">Available to invest</div><div className="budget-rule" /><div className="budget-breakdown"><span>Starting capital</span><strong className="mono">{money(8_500_000)}</strong></div><div className="budget-breakdown"><span>Constructor points</span><strong className="mono">{game.constructorPoints} pts</strong></div><button className="rail-action" onClick={() => navigate('garage')} data-testid="button-budget-development">Invest in the car <span>↗</span></button></section>
      <section className="next-race-card panel rise-in"><div className="rail-card-heading"><span className="eyebrow">{track ? `ROUND ${String(game.round + 1).padStart(2, '0')} / CIRCUIT FILE` : 'FINAL CLASSIFICATION'}</span><Flag size={16} /></div>
        {track ? <><div className="circuit-number">{String(game.round + 1).padStart(2, '0')}<span>— 08</span></div><h3>{track.name}</h3><div className="location-line"><MapPin size={13} /> {track.location}</div><div className="circuit-meta"><div><span>DISTANCE</span><strong>{track.laps} <small>LAPS</small></strong></div><div><span>LAYOUT</span><strong>{track.type}</strong></div></div><div className="focus-tag"><Zap size={12} /> CAR FOCUS <b>{titleCase(track.focus)}</b></div><button className="text-link full-link" onClick={() => navigate(drivers.length === 2 ? 'race' : 'market')} data-testid="button-next-race">{drivers.length === 2 ? 'Open race control' : 'Complete your lineup'} <ChevronRight size={14} /></button></> :
        <div className="final-race-note"><Award size={25} /><strong>Eight rounds in the books.</strong><span>See where the standings settled.</span><button className="text-link" onClick={() => navigate('standings')}>View championship <ChevronRight size={14} /></button></div>}</section>
      <section className="last-result panel rise-in"><div className="rail-card-heading"><span className="eyebrow">LATEST RESULT</span><Medal size={16} /></div>{latest ? <><div className="last-result-track">R{String(latest.round).padStart(2, '0')} <span>·</span> {latest.track.name}</div><p>{latest.headline}</p><div className="result-meta-line"><span>PRIZE MONEY</span><strong className="mono">{money(latest.prizeMoney)}</strong></div></> : <div className="no-result">The first chequered flag is still ahead.</div>}</section>
    </aside>
  </div>;
}

function Market({ game, drivers, onHire, navigate }: { game: GameState; drivers: Driver[]; onHire: (id: string) => void; navigate: (view: View) => void }) {
  const seatsFull = game.drivers.length >= 2;
  return <div className="page-stack">
    <section className="market-intro panel rise-in"><div><span className="eyebrow">THE DRIVER MARKET / 07 AVAILABLE</span><h2>Speed is expensive.<br /><em>So is settling.</em></h2><p>Two contracts, one fixed budget. Choose a pairing that leaves enough room to develop the car.</p></div><div className="seats-block"><span className="eyebrow">RACE SEATS FILLED</span><div className="seat-count"><strong className="mono">{game.drivers.length}</strong><span>/ 2</span></div><div className="seat-ticks"><i className={game.drivers.length >= 1 ? 'filled' : ''} /><i className={game.drivers.length >= 2 ? 'filled' : ''} /></div><span className="seat-hint">{seatsFull ? 'Lineup confirmed' : `${2 - game.drivers.length} seat${game.drivers.length === 1 ? '' : 's'} to fill`}</span></div></section>
    {drivers.length > 0 && <section className="signed-banner"><div><Check size={16} /><strong>Signed to {game.teamName}</strong></div><div className="signed-names">{drivers.map((driver) => driver.name).join(' / ')}</div>{seatsFull && <button onClick={() => navigate('garage')} className="text-link" data-testid="button-market-next">Continue to development <ChevronRight size={14} /></button>}</section>}
    <div className="market-section-head"><div><span className="eyebrow">AVAILABLE CONTRACTS</span><h3>Seven ways to build a team</h3></div><span className="market-sort"><span className="sort-dot" /> WIN CHANCE AT NEXT ROUND</span></div>
    <div className="driver-market-grid">{DRIVERS.map((driver, i) => {
      const hired = game.drivers.includes(driver.id);
      const affordable = game.cash >= driver.contract;
      const chance = estimatedWinChance(driver.id, game);
      return <article className={`driver-card panel rise-in ${hired ? 'driver-hired' : ''}`} key={driver.id} data-testid={`card-driver-${driver.id}`}>
        <div className="driver-card-top"><DriverInitials driver={driver} large /><div className="driver-identity"><div className="driver-country">{driver.country} <span>·</span> AGE {driver.age}</div><h3>{driver.name}</h3><span className="driver-specialty">{driver.specialty}</span></div><span className="driver-number mono">{String(i + 1).padStart(2, '0')}</span></div>
        <div className="win-chance-row"><div className="chance-label"><span>EST. RACE WIN CHANCE</span><strong className="mono">{chance}<small>%</small></strong></div><div className="chance-bar"><span style={{ width: `${chance}%` }} /></div></div>
        <div className="driver-metrics"><Metric label="PACE" value={driver.pace} /><Metric label="CONSISTENCY" value={driver.consistency} /><Metric label="WET SKILL" value={driver.wetSkill} /></div>
        <div className="contract-row"><div><span>SEASON CONTRACT</span><strong className="mono">{money(driver.contract)}</strong></div><button type="button" className={`sign-button button-motion ${hired ? 'signed' : ''}`} disabled={hired || seatsFull || !affordable} onClick={() => onHire(driver.id)} data-testid={`button-hire-${driver.id}`}>{hired ? <><Check size={14} /> Signed</> : !affordable ? 'Short on cash' : seatsFull ? 'Seats full' : <>Sign <ChevronRight size={14} /></>}</button></div>
        {!affordable && !hired && <div className="unaffordable-note">Contract exceeds available cash</div>}
      </article>;
    })}</div>
    <div className="market-bottom-note"><ShieldCheck size={16} /><span>Contracts are deducted immediately. Win chances update with the car, circuit, weather, and your current lineup.</span></div>
  </div>;
}

function Garage({ game, drivers, selectedTeam, onUpgrade, onRename, onNewSeason, onChooseTeam }: { game: GameState; drivers: Driver[]; selectedTeam?: F1Team; onUpgrade: (id: keyof CarStats) => void; onRename: (name: string) => void; onNewSeason: () => void; onChooseTeam: () => void }) {
  return <div className="garage-layout">
    <div className="garage-main">
      <section className="garage-hero panel rise-in"><div className="garage-hero-top"><span className="eyebrow">CHASSIS DEVELOPMENT / CURRENT SPEC</span><span className="spec-stamp mono">FTM—01 <span>·</span> R{String(game.round).padStart(2, '0')}</span></div>
        <div className="garage-car-art" aria-hidden="true"><div className="car-shadow" /><div className="garage-wheel gw1" /><div className="garage-wheel gw2" /><div className="garage-wing" /><div className="garage-nose" /><div className="garage-body"><span>{game.teamName.slice(0, 3).toUpperCase()}</span></div><div className="car-telemetry">AERO / LOAD <b>{game.car.aero}</b></div><div className="car-telemetry second">POWER / DEPLOY <b>{game.car.pace}</b></div></div>
        <div className="garage-stats"><CarBar label="POWER UNIT" value={game.car.pace} color="red" /><CarBar label="AERO PACKAGE" value={game.car.aero} color="green" /><CarBar label="RELIABILITY" value={game.car.reliability} color="gold" /></div>
      </section>
      <section className="upgrade-section rise-in"><div className="section-heading upgrade-title"><div><span className="eyebrow">ENGINEERING DEPARTMENT</span><h3>Development options</h3></div><span className="budget-pill"><Banknote size={14} /> {money(game.cash)} AVAILABLE</span></div>
        <div className="upgrade-list">{UPGRADES.map((item, i) => {
          const value = game.car[item.id];
          const canAfford = game.cash >= item.cost;
          return <article className="upgrade-row panel" key={item.id} data-testid={`upgrade-${item.id}`}>
            <div className={`upgrade-icon upgrade-icon-${item.id}`}>{i === 0 ? <Zap size={19} /> : i === 1 ? <Activity size={19} /> : <ShieldCheck size={19} />}</div>
            <div className="upgrade-info"><div className="upgrade-name">{item.name}<span className="upgrade-gain">+{item.gain}</span></div><p>{item.detail}</p></div>
            <div className="upgrade-level"><span>CURRENT</span><strong className="mono">{value}<small> / 95</small></strong></div>
            <div className="upgrade-cost"><span>ONE-TIME COST</span><strong className="mono">{money(item.cost)}</strong></div>
            <button type="button" className="upgrade-button button-motion" disabled={value >= 95 || !canAfford} onClick={() => onUpgrade(item.id)} data-testid={`button-upgrade-${item.id}`}>{value >= 95 ? 'At limit' : canAfford ? 'Develop' : 'Insufficient funds'}</button>
          </article>;
        })}</div>
        <p className="upgrade-footnote"><CircleAlert size={14} /> Each improvement is permanent for this season. Save a reserve for race weekend.</p>
      </section>
    </div>
    <aside className="garage-rail">
      <section className="panel team-settings rise-in"><span className="eyebrow">TEAM IDENTITY</span><h3>Put your name on it.</h3>{selectedTeam && <div className="current-f1-team"><span className="current-f1-mark">{selectedTeam.shortName}</span><span><b>{selectedTeam.name}</b><small>2026 F1 CONSTRUCTOR</small></span></div>}<label htmlFor="team-name">CONSTRUCTOR NAME</label><input id="team-name" value={game.teamName} maxLength={24} onChange={(event) => onRename(event.target.value)} placeholder="Your team name" data-testid="input-team-name" /><span className="input-hint">Up to 24 characters. Autosaved locally.</span><button type="button" className="change-team-button" onClick={onChooseTeam} disabled={game.round > 0} data-testid="button-change-f1-team">{game.round > 0 ? 'Team locked for this season' : 'Choose a different F1 team'}<ChevronRight size={13} /></button></section>
      <section className="panel drivers-garage-card rise-in"><div className="section-heading compact"><div><span className="eyebrow">DRIVER ROSTER</span><h3>Race seats</h3></div><Users size={16} /></div>
        {drivers.length ? drivers.map((driver, i) => <div className="garage-driver" key={driver.id}><DriverInitials driver={driver} /><div><strong>{driver.name}</strong><span>CAR {i + 1} · {driver.specialty}</span></div><span className="mono">{game.driverPoints[driver.id] ?? 0}<small> PTS</small></span></div>) : <div className="empty-roster garage-empty"><Users size={17} /><span>No drivers signed yet. Find them in Driver market.</span></div>}
        {drivers.length < 2 && <div className="missing-seat"><span>+</span><div><b>{2 - drivers.length} seat{drivers.length === 1 ? '' : 's'} unfilled</b><small>A full lineup is required to race.</small></div></div>}
      </section>
      <section className="panel garage-budget-note rise-in"><div className="budget-note-top"><span>SEASON BUDGET</span><Banknote size={15} /></div><strong className="mono">{money(game.cash)}</strong><p>Race prize money returns to this account. Contract and development costs do not.</p></section>
      <button type="button" className="new-season-button button-motion" onClick={onNewSeason} data-testid="button-garage-new-season"><RotateCcw size={14} /> Start a new season</button>
    </aside>
  </div>;
}

function LiveRace({ pendingRace, now, teamName }: { pendingRace: PendingRace; now: number; teamName: string }) {
  const progress = getRaceProgress(pendingRace, now);
  const finishers = new Map(pendingRace.result.finishers.map((finisher) => [finisher.id, finisher]));
  const liveEntries = progress.positions
    .map((id) => finishers.get(id))
    .filter((finisher): finisher is NonNullable<typeof finisher> => Boolean(finisher));
  const playerEntries = liveEntries.filter((finisher) => finisher.isPlayer);
  const track = pendingRace.result.track;

  return <div className="live-race-layout" id="live-race-view" data-testid="live-race-view">
    <section className="live-race-hero panel rise-in">
      <div className="live-race-hero-copy">
        <div className="live-race-overline"><span className="live-race-pulse" /> LIVE TIMING <i>·</i> ROUND {String(pendingRace.result.round).padStart(2, '0')}</div>
        <h2>{track.name}</h2>
        <div className="live-race-location"><MapPin size={13} /> {track.location} <i>·</i> {teamName}</div>
        <p>Your drivers are on track. Positions update throughout the 60-second race; the result and prize money are added at the chequered flag.</p>
      </div>
      <div className="live-race-clock" aria-live="polite">
        <span>TIME TO CLASSIFICATION</span>
        <strong className="mono">{formatRaceClock(progress.remainingMs)}</strong>
        <small>{progress.remainingMs > 0 ? 'RACE IN PROGRESS' : 'CLASSIFYING'}</small>
      </div>
    </section>

    <section className="live-race-progress panel">
      <div className="live-progress-heading"><span><Activity size={14} /> RACE CONTROL / LIVE FEED</span><span>UPDATES EVERY SECOND</span></div>
      <div className="live-progress-track" role="progressbar" aria-label="Race progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress.fraction * 100)}>
        <span style={{ width: `${progress.fraction * 100}%` }} />
      </div>
      <div className="live-progress-meta"><span>LAP <b>{progress.lap}</b> / {track.laps}</span><span>ELAPSED <b>{formatRaceClock(progress.elapsedMs)}</b></span><span>STRATEGY <b>{titleCase(pendingRace.result.strategy.pace)} · {titleCase(pendingRace.result.strategy.tire)} · {pendingRace.result.strategy.pitStops} stop{pendingRace.result.strategy.pitStops === 1 ? '' : 's'}</b></span></div>
    </section>

    <section className="live-driver-section" aria-label="Your drivers' live positions">
      <div className="live-section-heading"><div><span className="eyebrow">YOUR TEAM / ON TRACK</span><h3>Live driver positions</h3></div><span className="live-field-count">{liveEntries.length} CARS RUNNING</span></div>
      <div className="live-driver-cards">
        {playerEntries.map((entry) => {
          const driver = getDriver(entry.id);
          if (!driver) return null;
          return <article className="live-driver-card panel" key={entry.id} style={{ '--driver-accent': driver.accent } as CSSProperties}>
            <DriverInitials driver={driver} />
            <div className="live-driver-name"><span>YOUR DRIVER</span><strong>{driver.name}</strong><small>{teamName}</small></div>
            <div className="live-driver-position"><span>POSITION</span><strong className="mono">P{String(liveEntries.indexOf(entry) + 1).padStart(2, '0')}</strong></div>
          </article>;
        })}
      </div>
    </section>

    <section className="live-timing-panel panel">
      <div className="live-timing-heading"><div><span className="eyebrow">LIVE CLASSIFICATION</span><h3>Track positions</h3></div><span className="live-timing-round">R{String(pendingRace.result.round).padStart(2, '0')} <i>·</i> {track.laps} LAPS</span></div>
      <div className="live-timing-labels"><span>POS</span><span>DRIVER</span><span>TEAM</span><span>LAST CHANGE</span></div>
      <div className="live-timing-list" aria-label="Live race positions">
        {liveEntries.map((entry, index) => {
          const previousIndex = progress.previousPositions.indexOf(entry.id);
          const change = previousIndex < 0 ? 0 : previousIndex - index;
          const movement = progress.snapshotIndex === 0 ? 'GRID' : change > 0 ? `+${change}` : change < 0 ? String(change) : '—';
          return <div className={`live-timing-row ${entry.isPlayer ? 'is-player' : ''}`} key={entry.id} data-testid={`live-position-${entry.id}`} aria-label={`Position ${index + 1}: ${entry.name}, ${entry.team}${entry.isPlayer ? ', your driver' : ''}`}>
            <span className="live-timing-position mono">{String(index + 1).padStart(2, '0')}</span>
            <span className="live-timing-driver"><strong>{entry.name}</strong><small>{entry.isPlayer ? 'YOUR DRIVER' : entry.team}</small></span>
            <span className="live-timing-team">{entry.team}</span>
            <span className={`live-timing-movement ${change > 0 ? 'moved-up' : change < 0 ? 'moved-down' : ''}`}>{progress.snapshotIndex === 0 ? <span>GRID</span> : <><b>{movement}</b><small>{change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'HOLD'}</small></>}</span>
          </div>;
        })}
      </div>
      <div className="live-timing-foot"><span className="live-race-pulse" /> CLASSIFICATION IS FINAL WHEN THE CLOCK REACHES 00:00</div>
    </section>
  </div>;
}

function RaceDesk({ game, track, strategy, latest, now, setStrategy, onRace, navigate }: { game: GameState; track?: Track; strategy: RaceStrategy; latest?: RaceResult; now: number; setStrategy: (strategy: RaceStrategy) => void; onRace: () => void; navigate: (view: View) => void }) {
  if (game.pendingRace) return <LiveRace pendingRace={game.pendingRace} now={now} teamName={game.teamName} />;
  if (!track) return <SeasonComplete game={game} latest={latest} navigate={navigate} />;
  const ready = game.drivers.length === 2;
  const paceOptions = [{ value: 'conservative', label: 'Conserve', detail: 'Protect the car', symbol: '—' }, { value: 'balanced', label: 'Balanced', detail: 'Measured pace', symbol: '≈' }, { value: 'attack', label: 'Attack', detail: 'Push for position', symbol: '↗' }] as const;
  const tireOptions = [{ value: 'soft', label: 'Soft', code: 'S', detail: 'Highest grip · shorter life' }, { value: 'medium', label: 'Medium', code: 'M', detail: 'Balanced compound' }, { value: 'hard', label: 'Hard', code: 'H', detail: 'Longest life · lower grip' }] as const;
  return <div className="race-layout"><div className="race-main">
    <section className="race-circuit panel rise-in"><div className="circuit-copy"><span className="eyebrow">ROUND {String(game.round + 1).padStart(2, '0')} / CIRCUIT BRIEFING</span><h2>{track.name}</h2><div className="location-line"><MapPin size={14} /> {track.location}</div><p>{track.laps} laps on a {track.type.toLowerCase()} circuit. The setup emphasis is <b>{track.focus}</b> and the forecast is <b>{track.weather.toLowerCase()}</b>.</p><div className="brief-chips"><span>{track.type.toUpperCase()}</span><span>{track.weather.toUpperCase()} CONDITIONS</span><span>{track.laps} LAPS</span></div></div><CircuitDrawing track={track} /></section>
    {!ready && <div className="race-blocked panel" role="status"><div className="blocked-icon"><Users size={19} /></div><div><strong>The grid needs two drivers.</strong><span>Sign a complete lineup before race control can release the cars.</span></div><button className="text-link" onClick={() => navigate('market')} data-testid="button-fill-lineup">Go to market <ChevronRight size={14} /></button></div>}
    <section className={`strategy-panel panel rise-in ${!ready ? 'strategy-disabled' : ''}`}><div className="section-heading"><div><span className="eyebrow">RACE CONTROL / DECISION 01</span><h3>Sunday strategy</h3></div><span className="strategy-status"><i /> {ready ? 'READY TO DEPLOY' : 'AWAITING LINEUP'}</span></div>
      <fieldset disabled={!ready}>
        <div className="strategy-group"><div className="strategy-group-heading"><div><span className="strategy-index">01</span><strong>Race pace</strong></div><span>RISK / REWARD</span></div><div className="strategy-options">
          {paceOptions.map((option) => <button type="button" key={option.value} className={`strategy-option ${strategy.pace === option.value ? 'selected' : ''}`} onClick={() => setStrategy({ ...strategy, pace: option.value })} aria-pressed={strategy.pace === option.value} data-testid={`strategy-pace-${option.value}`}><span className="option-symbol">{option.symbol}</span><strong>{option.label}</strong><small>{option.detail}</small></button>)}
        </div><div className="pace-risk-hint"><Zap size={13} /> Attack pace adds speed but raises mechanical risk. Reliability is currently {game.car.reliability}/95.</div></div>
        <div className="strategy-group"><div className="strategy-group-heading"><div><span className="strategy-index">02</span><strong>Tire compound</strong></div><span>GRIP / LONGEVITY</span></div><div className="tire-options">
          {tireOptions.map((option) => <button type="button" key={option.value} className={`tire-option ${strategy.tire === option.value ? 'selected' : ''}`} onClick={() => setStrategy({ ...strategy, tire: option.value })} aria-pressed={strategy.tire === option.value} data-testid={`strategy-tire-${option.value}`}><span className={`tire-mark tire-${option.value}`}>{option.code}</span><span><strong>{option.label}</strong><small>{option.detail}</small></span>{strategy.tire === option.value && <Check size={15} />}</button>)}
        </div></div>
        <div className="strategy-group pit-group"><div className="strategy-group-heading"><div><span className="strategy-index">03</span><strong>Planned pit stops</strong></div><span>TIME IN THE BOX</span></div><div className="pit-options">{([0, 1, 2] as const).map((stops) => <button type="button" key={stops} onClick={() => setStrategy({ ...strategy, pitStops: stops })} className={`pit-option ${strategy.pitStops === stops ? 'selected' : ''}`} aria-pressed={strategy.pitStops === stops} data-testid={`strategy-stops-${stops}`}><span className="mono">{String(stops).padStart(2, '0')}</span><small>{stops === 0 ? 'No stop' : `${stops} stop${stops > 1 ? 's' : ''}`}</small></button>)}</div><div className="pit-note">A zero-stop run is more effective on a hard compound. Two stops trade track position for fresher tires.</div></div>
      </fieldset>
      <div className="race-submit-row"><div><span className="eyebrow">CONFIRM BEFORE GREEN</span><strong>{titleCase(strategy.pace)} · {titleCase(strategy.tire)} · {strategy.pitStops} stop{strategy.pitStops === 1 ? '' : 's'}</strong></div><button type="button" className="race-start-button button-motion" disabled={!ready} onClick={onRace} data-testid="button-start-race"><Flag size={16} /> {ready ? 'Start race' : 'Lineup required'} <ChevronRight size={15} /></button></div>
    </section>
  </div>
  <aside className="race-rail"><section className="panel race-team-card rise-in"><span className="eyebrow">GARAGE / THIS WEEKEND</span><h3>{game.teamName}</h3>{game.drivers.map((id, i) => { const driver = getDriver(id); return driver ? <div className="race-driver-line" key={id}><DriverInitials driver={driver} /><span><b>{driver.name}</b><small>CAR {i + 1} · PACE {driver.pace}</small></span><Activity size={15} /></div> : null; })}{!game.drivers.length && <div className="no-race-drivers">Driver seats are empty.</div>}<div className="car-race-summary"><span>CAR SPEC</span><div><b>PACE</b><strong className="mono">{game.car.pace}</strong><b>AERO</b><strong className="mono">{game.car.aero}</strong></div><div><b>RELIABILITY</b><strong className="mono">{game.car.reliability}</strong></div></div></section>
    <section className="panel race-weather-card rise-in"><div className="weather-glyph">{track.weather === 'Rain' ? <span className="rain-lines">///</span> : track.weather === 'Mixed' ? <Activity size={22} /> : <Sparkles size={21} />}</div><span className="eyebrow">CIRCUIT CONDITIONS</span><h3>{track.weather} forecast</h3><p>{track.weather === 'Rain' ? 'Wet skill will be put to work. A calm hand matters.' : track.weather === 'Mixed' ? 'Changeable conditions reward a versatile driver.' : 'Dry running. Pure pace is in focus.'}</p><div className="weather-focus"><span>CAR FOCUS</span><strong>{titleCase(track.focus)}</strong></div></section>
    <section className="panel prize-card rise-in"><span className="eyebrow">RACE FUND</span><div className="prize-formula mono">$350k <span>+</span> 42k <small>PER TEAM POINT</small></div><p>Prize money is paid after the classification.</p></section>
    {latest && <LatestResult result={latest} />}
  </aside></div>;
}

function Standings({ game, navigate }: { game: GameState; navigate: (view: View) => void }) {
  const teamTotals = new Map<string, number>();
  const drivers = new Map<string, { name: string; team: string; points: number; player: boolean }>();
  game.history.forEach((result) => result.finishers.forEach((finisher) => {
    teamTotals.set(finisher.team, (teamTotals.get(finisher.team) ?? 0) + finisher.points);
    const prev = drivers.get(finisher.name);
    drivers.set(finisher.name, { name: finisher.name, team: finisher.team, points: (prev?.points ?? 0) + finisher.points, player: finisher.isPlayer });
  }));
  if (game.history.length && !teamTotals.has(game.teamName)) teamTotals.set(game.teamName, game.constructorPoints);
  const teams = [...teamTotals].map(([name, points]) => ({ name, points, player: name === game.teamName })).sort((a, b) => b.points - a.points);
  const driverRows = [...drivers.values()].sort((a, b) => b.points - a.points);
  const playerRank = teams.findIndex((team) => team.player) + 1;
  const leadingPlayer = driverRows.find((driver) => driver.player);
  return <div className="standings-layout">
    <section className="championship-banner panel rise-in"><div className="championship-banner-copy"><span className="eyebrow">CONSTRUCTORS' CHAMPIONSHIP / 2025</span><h2>Nothing is decided<br /><em>until it's over.</em></h2><p>{game.round ? `${game.round} of 8 rounds classified. Every result now sits on the board.` : 'The season standings will take shape when the first race is classified.'}</p></div><div className="championship-stamp"><Trophy size={30} /><span>SEASON<br />POINTS</span></div><div className="championship-banner-stats"><div><span>YOUR POSITION</span><strong>{playerRank ? `P${String(playerRank).padStart(2, '0')}` : '—'}</strong></div><div><span>YOUR POINTS</span><strong>{game.constructorPoints}<small> PTS</small></strong></div><div><span>ROUNDS RUN</span><strong>{game.round}<small> / 08</small></strong></div></div></section>
    <div className="standings-grid"><StandingsTable title="Constructors" label="TEAM TABLE" empty="The grid has not taken the start." rows={teams.map((team, i) => <div className={`standings-row ${team.player ? 'player-row' : ''}`} key={team.name} data-testid={`standing-team-${i + 1}`}><span className="table-position mono">{String(i + 1).padStart(2, '0')}</span><span className={`team-crest ${team.player ? 'own-crest' : ''}`}>{team.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</span><span className="team-cell"><b>{team.name}</b>{team.player && <small>YOUR TEAM</small>}</span><span className="team-points mono">{team.points}</span></div>)} onNavigate={() => navigate('race')} />
      <StandingsTable title="Drivers" label="DRIVER TABLE" empty="No driver points recorded yet." rows={driverRows.slice(0, 10).map((driver, i) => <div className={`standings-row ${driver.player ? 'player-row' : ''}`} key={`${driver.name}-${driver.team}`} data-testid={`standing-driver-${i + 1}`}><span className="table-position mono">{String(i + 1).padStart(2, '0')}</span><span className="driver-standing-name"><b>{driver.name}</b><small>{driver.team}</small></span><span className="team-points mono">{driver.points}</span></div>)} onNavigate={() => navigate('race')} />
    </div>
    {leadingPlayer && <div className="player-driver-note"><Medal size={15} /><span>Best-placed team driver: <b>{leadingPlayer.name}</b> · {leadingPlayer.points} pts</span></div>}
    <section className="panel race-history-panel rise-in"><div className="table-heading"><div><span className="eyebrow">SEASON ARCHIVE</span><h3>Race by race</h3></div><span className="history-count mono">{game.history.length} / 8 CLASSIFIED</span></div>
      {game.history.length ? <div className="history-list">{game.history.map((result) => { const best = result.finishers.filter((item) => item.isPlayer).sort((a, b) => a.position - b.position)[0]; return <div className="history-row" key={`${result.round}-${result.track.id}`}><span className="history-round mono">R{String(result.round).padStart(2, '0')}</span><span className="history-track"><b>{result.track.name}</b><small>{result.track.location}</small></span><span className="history-result">{best ? `P${String(best.position).padStart(2, '0')} · ${best.name}` : 'No classified driver'}</span><span className="history-money mono">{money(result.prizeMoney)}</span></div>; })}</div> : <div className="archive-empty">Race reports appear here after the flag.</div>}
    </section>
  </div>;
}

function StandingsTable({ title, label, empty, rows, onNavigate }: { title: string; label: string; empty: string; rows: ReactNode[]; onNavigate: () => void }) {
  return <section className="panel standings-table-panel rise-in"><div className="table-heading"><div><span className="eyebrow">{label}</span><h3>{title}</h3></div><span className="table-unit">PTS</span></div>{rows.length ? <div className="standings-table">{rows}</div> : <div className="standings-empty"><div className="empty-flag"><Flag size={18} /></div><p>{empty}</p><button className="text-link" onClick={onNavigate}>Prepare for the first race <ChevronRight size={14} /></button></div>}{title === 'Constructors' && <div className="table-footnote">TEAM POINTS COMBINE BOTH DRIVER FINISHES EACH ROUND</div>}</section>;
}

function SeasonComplete({ game, latest, navigate }: { game: GameState; latest?: RaceResult; navigate: (view: View) => void }) {
  return <div className="season-complete-wrap"><section className="season-complete panel rise-in"><div className="complete-icon"><Trophy size={25} /></div><span className="eyebrow">FINAL CLASSIFICATION / ROUND 08</span><h2>That is the<br /><em>season.</em></h2><p>{latest?.headline ?? `${game.teamName} has completed the full championship.`}</p><div className="complete-stats"><div><span>CONSTRUCTOR POINTS</span><strong className="mono">{game.constructorPoints}</strong></div><div><span>FINAL PRIZE MONEY</span><strong className="mono">{money(latest?.prizeMoney ?? 0)}</strong></div><div><span>AVAILABLE CASH</span><strong className="mono">{money(game.cash)}</strong></div></div><button className="button-primary button-motion" onClick={() => navigate('standings')}>See final standings <ChevronRight size={16} /></button></section>{latest && <LatestResult result={latest} expanded />}</div>;
}

function LatestResult({ result, expanded = false }: { result: RaceResult; expanded?: boolean }) {
  const players = result.finishers.filter((item) => item.isPlayer).sort((a, b) => a.position - b.position);
  return <section className={`panel result-card rise-in ${expanded ? 'result-card-expanded' : ''}`}><div className="result-card-head"><span className="eyebrow">ROUND {String(result.round).padStart(2, '0')} / CLASSIFIED</span><Award size={17} /></div><h3>{result.headline}</h3><div className="result-track-name">{result.track.name}<span> · {result.track.location}</span></div><div className="result-finishers">{players.map((finisher) => <div className="finisher-row" key={finisher.id}><span className="finish-place mono">P{String(finisher.position).padStart(2, '0')}</span><b>{finisher.name}</b><span className="finish-points mono">+{finisher.points} PTS</span></div>)}</div><div className="result-detail"><span>FASTEST LAP</span><strong>{result.fastestLap}</strong></div><div className="result-detail"><span>RACE FUND</span><strong className="mono">{money(result.prizeMoney)}</strong></div><div className="result-strategy"><span>YOUR STRATEGY</span><b>{titleCase(result.strategy.pace)} / {titleCase(result.strategy.tire)} / {result.strategy.pitStops} stop{result.strategy.pitStops === 1 ? '' : 's'}</b></div></section>;
}

function DriverInitials({ driver, large = false }: { driver: Driver; large?: boolean }) {
  return <div className={`driver-initials ${large ? 'initials-large' : ''}`} style={{ '--driver-accent': driver.accent } as CSSProperties & { '--driver-accent': string }} aria-label={driver.name}>{driver.name.split(' ').map((part) => part[0]).join('')}</div>;
}
function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><div className="metric-bar"><i style={{ width: `${value}%` }} /></div><strong className="mono">{value}</strong></div>;
}
function CarBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className={`car-bar car-bar-${color}`}><div><span>{label}</span><strong className="mono">{value}<small> / 95</small></strong></div><div className="car-bar-track"><span className="meter-fill" style={{ width: `${value / 95 * 100}%` }} /></div></div>;
}
function CircuitDrawing({ track }: { track: Track }) {
  const paths: Record<string, string> = {
    'coastal-run': 'M34 58 C38 23 78 19 91 40 C104 61 130 62 145 43 C161 21 192 28 188 53 C184 78 148 78 130 68 C108 55 93 83 69 80 C46 78 29 83 34 58Z',
    redstone: 'M37 46 C39 23 62 21 70 39 L77 56 L104 31 C123 13 143 30 132 48 L114 75 L156 74 C180 74 183 99 156 99 L93 99 C76 99 73 87 83 72 L95 56 L68 72 C50 84 34 66 37 46Z',
    'old-quarter': 'M33 43 L67 37 L79 25 L111 30 L124 46 L159 40 L175 53 L169 77 L147 86 L119 76 L94 89 L62 79 L39 82 L28 61Z',
    'pine-valley': 'M34 69 C43 47 45 24 67 29 L91 35 C111 42 125 18 145 27 L173 41 L160 60 C151 76 136 67 124 59 C110 49 101 69 90 82 L61 88 C42 92 27 84 34 69Z',
    sunport: 'M35 34 L75 34 Q90 34 90 47 L90 67 Q90 80 105 80 L151 80 Q168 80 168 65 L168 44 Q168 29 149 29 L126 29',
    'harbor-lights': 'M37 41 C38 26 55 24 68 31 L89 42 C100 48 107 39 116 33 C133 22 153 32 150 48 L147 63 C144 78 163 80 174 69 C188 55 202 67 189 82 C173 101 143 96 133 82 L122 69 C112 57 100 61 88 72 C69 90 44 80 37 66Z',
    'north-loop': 'M38 56 C36 37 51 29 68 34 L90 40 C105 44 109 30 122 26 C144 20 157 40 145 56 L132 73 C122 86 104 79 96 69 C88 58 75 60 68 71 C56 88 34 77 38 56Z',
    'grand-final': 'M34 47 C35 30 54 29 65 39 L80 53 C91 64 101 48 110 38 C121 24 139 30 141 45 L143 61 C145 76 163 77 174 66 C188 51 204 66 191 81 C177 98 148 94 136 80 L121 64 C110 52 99 67 87 77 C70 92 48 80 43 67Z',
  };
  const path = paths[track.id] ?? paths['coastal-run'];
  return <div className="circuit-art"><div className="circuit-art-grid" /><svg viewBox="0 0 220 120" role="img" aria-label={`${track.name} circuit layout`}><path d={path} className="circuit-underlay" /><path d={path} className="circuit-path" /><circle cx="34" cy="58" r="5" className="circuit-start" /></svg><span className="circuit-art-caption">CIRCUIT MAP <i>/</i> NOT TO SCALE</span></div>;
}

export default App;