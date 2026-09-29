export type Driver = {
  id: string;
  name: string;
  country: string;
  age: number;
  pace: number;
  consistency: number;
  wetSkill: number;
  contract: number;
  specialty: string;
  accent: string;
};

export type Track = {
  id: string;
  name: string;
  location: string;
  laps: number;
  type: "Street" | "Technical" | "High speed";
  weather: "Dry" | "Mixed" | "Rain";
  focus: "pace" | "aero" | "reliability";
};

export type RaceStrategy = {
  pace: "conservative" | "balanced" | "attack";
  tire: "soft" | "medium" | "hard";
  pitStops: 0 | 1 | 2;
};

export type RaceFinisher = {
  id: string;
  name: string;
  team: string;
  position: number;
  points: number;
  isPlayer: boolean;
};

export type RaceResult = {
  round: number;
  track: Track;
  finishers: RaceFinisher[];
  fastestLap: string;
  prizeMoney: number;
  strategy: RaceStrategy;
  headline: string;
};

export type RaceResolution = {
  cash: number;
  round: number;
  driverPoints: Record<string, number>;
  constructorPoints: number;
  history: RaceResult[];
  randomSeed: number;
};

export type PendingRace = {
  startedAt: number;
  durationMs: number;
  result: RaceResult;
  resolution: RaceResolution;
  snapshots: string[][];
};

export type RaceProgress = {
  elapsedMs: number;
  remainingMs: number;
  fraction: number;
  lap: number;
  snapshotIndex: number;
  positions: string[];
  previousPositions: string[];
};

export type CarStats = {
  pace: number;
  aero: number;
  reliability: number;
};

export type F1Team = {
  id: string;
  name: string;
  shortName: string;
  base: string;
  accent: string;
  secondary: string;
};

export type GameState = {
  teamName: string;
  selectedTeamId: string | null;
  cash: number;
  drivers: string[];
  car: CarStats;
  round: number;
  driverPoints: Record<string, number>;
  constructorPoints: number;
  history: RaceResult[];
  randomSeed: number;
  pendingRace: PendingRace | null;
};

export type ActionResult = {
  state: GameState;
  error?: string;
};

export const SAVE_KEY = "formula-team-manager-save-v1";
export const STARTING_CASH = 8_500_000;
export const SEASON_LENGTH = 8;
export const RACE_DURATION_MS = 60_000;
const RACE_SNAPSHOT_COUNT = 61;

export const CURRENT_F1_TEAMS: F1Team[] = [
  { id: "mclaren", name: "McLaren", shortName: "MCL", base: "Woking, United Kingdom", accent: "#ff8000", secondary: "#111820" },
  { id: "mercedes", name: "Mercedes", shortName: "MER", base: "Brackley, United Kingdom", accent: "#00a19b", secondary: "#101820" },
  { id: "red-bull-racing", name: "Red Bull Racing", shortName: "RBR", base: "Milton Keynes, United Kingdom", accent: "#3671c6", secondary: "#e10600" },
  { id: "ferrari", name: "Ferrari", shortName: "FER", base: "Maranello, Italy", accent: "#e8002d", secondary: "#fff4e8" },
  { id: "williams", name: "Williams", shortName: "WIL", base: "Grove, United Kingdom", accent: "#00a0de", secondary: "#101820" },
  { id: "racing-bulls", name: "Racing Bulls", shortName: "VCARB", base: "Faenza, Italy", accent: "#6692ff", secondary: "#f3f5f7" },
  { id: "aston-martin", name: "Aston Martin", shortName: "AMR", base: "Silverstone, United Kingdom", accent: "#00665e", secondary: "#d9c58a" },
  { id: "haas", name: "Haas F1 Team", shortName: "HAA", base: "Kannapolis, United States", accent: "#e6002d", secondary: "#202329" },
  { id: "audi", name: "Audi", shortName: "AUD", base: "Hinwil, Switzerland", accent: "#bb0a30", secondary: "#d2d5d8" },
  { id: "alpine", name: "Alpine", shortName: "ALP", base: "Enstone, United Kingdom", accent: "#0093cc", secondary: "#ef4b91" },
  { id: "cadillac", name: "Cadillac", shortName: "CAD", base: "Fishers, United States", accent: "#273746", secondary: "#c7ad7f" },
];

export const DRIVERS: Driver[] = [
  {
    id: "leo-ventura",
    name: "Leo Ventura",
    country: "Brazil",
    age: 24,
    pace: 93,
    consistency: 75,
    wetSkill: 78,
    contract: 5_100_000,
    specialty: "Raw speed",
    accent: "#f07152",
  },
  {
    id: "elise-moreau",
    name: "Elise Moreau",
    country: "France",
    age: 27,
    pace: 88,
    consistency: 92,
    wetSkill: 91,
    contract: 4_600_000,
    specialty: "Rain specialist",
    accent: "#e9ba6b",
  },
  {
    id: "tomas-ibarra",
    name: "Tomás Ibarra",
    country: "Argentina",
    age: 22,
    pace: 86,
    consistency: 80,
    wetSkill: 72,
    contract: 3_800_000,
    specialty: "Late braking",
    accent: "#79acaa",
  },
  {
    id: "nina-sato",
    name: "Nina Sato",
    country: "Japan",
    age: 25,
    pace: 83,
    consistency: 91,
    wetSkill: 84,
    contract: 3_400_000,
    specialty: "Tire care",
    accent: "#bf8db6",
  },
  {
    id: "owen-clarke",
    name: "Owen Clarke",
    country: "United Kingdom",
    age: 20,
    pace: 81,
    consistency: 76,
    wetSkill: 79,
    contract: 2_700_000,
    specialty: "Rookie pace",
    accent: "#8db27f",
  },
  {
    id: "marco-bellini",
    name: "Marco Bellini",
    country: "Italy",
    age: 31,
    pace: 78,
    consistency: 89,
    wetSkill: 82,
    contract: 2_200_000,
    specialty: "Race craft",
    accent: "#c89c68",
  },
  {
    id: "sara-lind",
    name: "Sara Lind",
    country: "Sweden",
    age: 23,
    pace: 75,
    consistency: 82,
    wetSkill: 86,
    contract: 1_600_000,
    specialty: "Wet weather",
    accent: "#85a9ca",
  },
];

export const TRACKS: Track[] = [
  { id: "coastal-run", name: "Coastal Run", location: "Port Azure", laps: 54, type: "Street", weather: "Dry", focus: "reliability" },
  { id: "redstone", name: "Redstone Park", location: "Monterosa", laps: 62, type: "High speed", weather: "Dry", focus: "pace" },
  { id: "old-quarter", name: "Old Quarter Circuit", location: "Bellacittà", laps: 48, type: "Street", weather: "Mixed", focus: "aero" },
  { id: "pine-valley", name: "Pine Valley", location: "Kaltenwald", laps: 59, type: "Technical", weather: "Rain", focus: "reliability" },
  { id: "sunport", name: "Sunport International", location: "Santa Marina", laps: 66, type: "High speed", weather: "Dry", focus: "pace" },
  { id: "harbor-lights", name: "Harbor Lights", location: "New Avalon", laps: 51, type: "Street", weather: "Mixed", focus: "aero" },
  { id: "north-loop", name: "North Loop", location: "Vintervik", laps: 57, type: "Technical", weather: "Rain", focus: "reliability" },
  { id: "grand-final", name: "Grand Final", location: "Crown City", laps: 64, type: "High speed", weather: "Dry", focus: "pace" },
];

export const UPGRADES: { id: keyof CarStats; name: string; detail: string; cost: number; gain: number }[] = [
  { id: "pace", name: "Power unit", detail: "Higher top speed and acceleration", cost: 1_800_000, gain: 5 },
  { id: "aero", name: "Aero package", detail: "More grip through fast corners", cost: 1_500_000, gain: 5 },
  { id: "reliability", name: "Reliability", detail: "Fewer mechanical failures", cost: 1_200_000, gain: 6 },
];

const RIVALS = [
  { team: "Northstar Racing", drivers: ["A. Petrov", "M. Vale"], rating: 87 },
  { team: "Solstice GP", drivers: ["I. Costa", "H. Park"], rating: 83 },
  { team: "Titan Motorsport", drivers: ["R. Voss", "E. Okafor"], rating: 80 },
  { team: "Asterion", drivers: ["D. Weber", "L. Morgan"], rating: 77 },
];
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export function createNewGame(teamName = "Your Team"): GameState {
  return {
    teamName: teamName.trim().slice(0, 24) || "Your Team",
    selectedTeamId: null,
    cash: STARTING_CASH,
    drivers: [],
    car: { pace: 64, aero: 62, reliability: 68 },
    round: 0,
    driverPoints: {},
    constructorPoints: 0,
    history: [],
    randomSeed: Math.floor(Math.random() * 2_000_000_000) || 1,
    pendingRace: null,
  };
}

function isPendingRace(value: unknown): value is PendingRace {
  if (!value || typeof value !== "object") return false;
  const pending = value as Partial<PendingRace>;
  if (
    !Number.isFinite(pending.startedAt) ||
    pending.durationMs !== RACE_DURATION_MS ||
    !Array.isArray(pending.snapshots) ||
    pending.snapshots.length !== RACE_SNAPSHOT_COUNT ||
    !pending.snapshots.every((snapshot) => Array.isArray(snapshot) && snapshot.every((id) => typeof id === "string")) ||
    !pending.result ||
    !Array.isArray(pending.result.finishers) ||
    !pending.result.track ||
    !pending.resolution
  ) return false;
  const resolution = pending.resolution;
  return Number.isFinite(resolution.cash) &&
    Number.isFinite(resolution.round) &&
    Number.isFinite(resolution.constructorPoints) &&
    Number.isFinite(resolution.randomSeed) &&
    Array.isArray(resolution.history) &&
    !!resolution.driverPoints &&
    typeof resolution.driverPoints === "object";
}

export function loadGame(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GameState;
      if (
        typeof parsed.teamName === "string" &&
        Number.isFinite(parsed.cash) &&
        Array.isArray(parsed.drivers) &&
        parsed.car &&
        Number.isFinite(parsed.round) &&
        Array.isArray(parsed.history)
      ) {
        const teamId = CURRENT_F1_TEAMS.some((team) => team.id === parsed.selectedTeamId)
          ? parsed.selectedTeamId
          : null;
        return {
          ...parsed,
          selectedTeamId: teamId,
          pendingRace: isPendingRace(parsed.pendingRace) ? parsed.pendingRace : null,
        };
      }
    }
  } catch {
    // A corrupt local save should not prevent starting a new season.
  }
  return createNewGame();
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function getDriver(id: string): Driver | undefined {
  return DRIVERS.find((driver) => driver.id === id);
}

export function getF1Team(id: string | null | undefined): F1Team | undefined {
  return id ? CURRENT_F1_TEAMS.find((team) => team.id === id) : undefined;
}

export function selectF1Team(state: GameState, teamId: string): ActionResult {
  const team = getF1Team(teamId);
  if (!team) return { state, error: "That F1 team is not available." };
  if (state.pendingRace) return { state, error: "Finish the live race before changing teams." };
  if (state.round > 0) return { state, error: "Your team is locked once the season has started. Start a new season to choose again." };
  return {
    state: {
      ...state,
      selectedTeamId: team.id,
      teamName: team.name,
    },
  };
}

export function currentTrack(state: GameState): Track | undefined {
  return TRACKS[state.round];
}

function driverRating(driver: Driver, state: GameState, track?: Track): number {
  const racecraft = driver.pace * 0.58 + driver.consistency * 0.24 + driver.wetSkill * 0.18;
  const carScore = track?.focus === "pace"
    ? state.car.pace
    : track?.focus === "aero"
      ? state.car.aero
      : state.car.reliability;
  const circuitFit = track?.type === "Street"
    ? (driver.consistency - 75) * 0.055
    : track?.type === "Technical"
      ? (driver.wetSkill - 75) * 0.045
      : (driver.pace - 75) * 0.04;
  const weatherFit = track?.weather === "Rain"
    ? (driver.wetSkill - 75) * 0.09
    : track?.weather === "Mixed"
      ? (driver.wetSkill - 75) * 0.035
      : 0;
  return racecraft + (carScore - 65) * 0.19 + circuitFit + weatherFit;
}

export function estimatedWinChance(driverId: string, state: GameState): number {
  const driver = getDriver(driverId);
  if (!driver) return 0;
  const score = driverRating(driver, state, currentTrack(state));
  const field = [
    ...RIVALS.flatMap((rival) => [
      rival.rating + 1,
      rival.rating - 1,
    ]),
    ...state.drivers.filter((id) => id !== driverId).map((id) => {
      const teammate = getDriver(id);
      return teammate ? driverRating(teammate, state, currentTrack(state)) : 60;
    }),
  ];
  const weights = [score, ...field].map((rating) => Math.exp(rating / 15));
  return Math.max(1, Math.round((weights[0] / weights.reduce((sum, value) => sum + value, 0)) * 100));
}

export function hireDriver(state: GameState, driverId: string): ActionResult {
  if (state.pendingRace) return { state, error: "Finish the live race before changing drivers." };
  const driver = getDriver(driverId);
  if (!driver) return { state, error: "That driver is no longer available." };
  if (state.drivers.includes(driverId)) return { state, error: "That driver is already signed." };
  if (state.drivers.length >= 2) return { state, error: "Both race seats are already filled." };
  if (state.cash < driver.contract) return { state, error: "Not enough cash to cover this driver's season contract." };
  return {
    state: {
      ...state,
      cash: state.cash - driver.contract,
      drivers: [...state.drivers, driverId],
    },
  };
}

export function buyUpgrade(state: GameState, upgradeId: keyof CarStats): ActionResult {
  if (state.pendingRace) return { state, error: "Finish the live race before developing the car." };
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade) return { state, error: "That upgrade is unavailable." };
  if (state.cash < upgrade.cost) return { state, error: "Not enough cash for this upgrade." };
  if (state.car[upgrade.id] >= 95) return { state, error: "This component is already at its development limit." };
  return {
    state: {
      ...state,
      cash: state.cash - upgrade.cost,
      car: { ...state.car, [upgrade.id]: Math.min(95, state.car[upgrade.id] + upgrade.gain) },
    },
  };
}

export function runRace(state: GameState, strategy: RaceStrategy): { state: GameState; result?: RaceResult; error?: string } {
  if (state.pendingRace) return { state, error: "A race is already in progress." };
  const track = currentTrack(state);
  if (!track) return { state, error: "The season is already complete." };
  if (state.drivers.length < 2) return { state, error: "Sign two drivers before starting the race." };

  let seed = state.randomSeed || 1;
  const random = () => {
    seed = (seed * 48271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };

  const playerEntries = state.drivers.map((id) => {
    const driver = getDriver(id)!;
    const rating = driverRating(driver, state, track);
    const consistency = (driver.consistency - 75) * 0.13;
    const tireEffect = strategy.tire === "soft" ? 2 : strategy.tire === "hard" ? -1.5 : 0;
    const paceEffect = strategy.pace === "attack" ? 3.5 : strategy.pace === "conservative" ? -2.5 : 0;
    const stopEffect = strategy.pitStops === 0 ? (strategy.tire === "hard" ? 1.5 : -3.5) : strategy.pitStops === 2 ? -1.5 : 0;
    const risk = strategy.pace === "attack" ? 2.7 : strategy.pace === "conservative" ? -0.8 : 0;
    const failureChance = Math.max(0.015, (100 - state.car.reliability) / 700 + risk / 100);
    const failed = random() < failureChance;
    const wobble = (random() + random() + random() - 1.5) * 12;
    return {
      id: driver.id,
      name: driver.name,
      team: state.teamName,
      score: rating + consistency + tireEffect + paceEffect + stopEffect + wobble - (failed ? 34 : 0),
      isPlayer: true,
      failed,
    };
  });

  const rivalEntries = RIVALS.flatMap((rival) =>
    rival.drivers.map((name, index) => ({
      id: `${track.id}-${rival.team}-${index}`,
      name,
      team: rival.team,
      score: rival.rating + (random() - 0.5) * 18,
      isPlayer: false,
      failed: false,
    })),
  );

  const allEntries = [...playerEntries, ...rivalEntries].sort((a, b) => b.score - a.score);
  const finishers: RaceFinisher[] = allEntries.map((entry, index) => ({
    id: entry.id,
    name: entry.name,
    team: entry.team,
    position: index + 1,
    points: POINTS[index] ?? 0,
    isPlayer: entry.isPlayer,
  }));
  const teamPoints = finishers.filter((finisher) => finisher.isPlayer).reduce((sum, finisher) => sum + finisher.points, 0);
  const prizeMoney = 350_000 + teamPoints * 42_000;
  const leadDriver = finishers.find((finisher) => finisher.isPlayer);
  const headline = playerEntries.some((entry) => entry.failed)
    ? "A mechanical issue changed the team's race."
    : leadDriver?.position === 1
      ? "A huge result. Your team takes the win."
      : leadDriver && leadDriver.position <= 3
        ? "A podium finish puts the team in the spotlight."
        : leadDriver && leadDriver.points > 0
          ? "A solid points finish keeps the season moving."
          : "A tough Sunday. Time to regroup for the next round.";
  const fastestLap = allEntries[Math.floor(random() * 6)]?.name ?? "A. Petrov";
  const result: RaceResult = {
    round: state.round + 1,
    track,
    finishers,
    fastestLap,
    prizeMoney,
    strategy,
    headline,
  };
  const driverPoints = { ...state.driverPoints };
  for (const finisher of finishers.filter((item) => item.isPlayer)) {
    driverPoints[finisher.id] = (driverPoints[finisher.id] ?? 0) + finisher.points;
  }
  return {
    state: {
      ...state,
      cash: state.cash + prizeMoney,
      round: state.round + 1,
      driverPoints,
      constructorPoints: state.constructorPoints + teamPoints,
      history: [...state.history, result],
      randomSeed: seed,
      pendingRace: null,
    },
    result,
  };
}

function createRaceSnapshots(finishers: RaceFinisher[], initialSeed: number): string[][] {
  let seed = (Math.abs(Math.floor(initialSeed)) % 2_147_483_646) + 1;
  const random = () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  return Array.from({ length: RACE_SNAPSHOT_COUNT }, (_, tick) => {
    const remaining = 1 - tick / (RACE_SNAPSHOT_COUNT - 1);
    return finishers
      .map((finisher, index) => ({
        id: finisher.id,
        pace: -index * 6 + (random() - 0.5) * 34 * remaining + Math.sin(tick * 0.83 + index * 1.71) * 5 * remaining,
      }))
      .sort((a, b) => b.pace - a.pace)
      .map((entry) => entry.id);
  });
}

export function startRace(state: GameState, strategy: RaceStrategy, startedAt = Date.now()): ActionResult {
  const outcome = runRace(state, strategy);
  if (outcome.error || !outcome.result) return { state, error: outcome.error ?? "Could not start the race." };
  const { result } = outcome;
  return {
    state: {
      ...state,
      pendingRace: {
        startedAt,
        durationMs: RACE_DURATION_MS,
        result,
        snapshots: createRaceSnapshots(result.finishers, state.randomSeed),
        resolution: {
          cash: outcome.state.cash,
          round: outcome.state.round,
          driverPoints: outcome.state.driverPoints,
          constructorPoints: outcome.state.constructorPoints,
          history: outcome.state.history,
          randomSeed: outcome.state.randomSeed,
        },
      },
    },
  };
}

export function getRaceProgress(pendingRace: PendingRace, now = Date.now()): RaceProgress {
  const elapsedMs = Math.max(0, Math.min(pendingRace.durationMs, now - pendingRace.startedAt));
  const fraction = elapsedMs / pendingRace.durationMs;
  const snapshotIndex = Math.min(
    pendingRace.snapshots.length - 1,
    Math.floor(fraction * (pendingRace.snapshots.length - 1)),
  );
  return {
    elapsedMs,
    remainingMs: pendingRace.durationMs - elapsedMs,
    fraction,
    lap: Math.floor(fraction * pendingRace.result.track.laps),
    snapshotIndex,
    positions: pendingRace.snapshots[snapshotIndex] ?? [],
    previousPositions: pendingRace.snapshots[Math.max(0, snapshotIndex - 1)] ?? [],
  };
}

export function finishRace(state: GameState, now = Date.now()): { state: GameState; result?: RaceResult; error?: string } {
  const pendingRace = state.pendingRace;
  if (!pendingRace) return { state, error: "There is no live race to finish." };
  if (now - pendingRace.startedAt < pendingRace.durationMs) {
    return { state, error: "The race is still in progress." };
  }
  return {
    state: {
      ...state,
      ...pendingRace.resolution,
      pendingRace: null,
    },
    result: pendingRace.result,
  };
}