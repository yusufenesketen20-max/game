import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Pause, Move, Users, UserPlus, Copy, Check, Box, Gem, ShoppingBag, Zap } from 'lucide-react';
import ThreeDView from './ThreeDView';

interface Vector {
  x: number;
  y: number;
}

interface Entity {
  pos: Vector;
  vel: Vector;
  radius: number;
  color: string;
  mass: number;
}

const PITCH_WIDTH = 1200;
const PITCH_HEIGHT = 800;
const GOAL_SIZE = 180;
const FRICTION = 0.985;
const BALL_FRICTION = 0.992;
const PLAYER_SPEED = 0.45;
const PLAYER_MAX_SPEED = 6;
const BOUNCE = 0.6;

interface PlayerStats {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number;
  value: number;
  nationality?: string;
  club?: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
  secondaryColor: string;
  speed: number;
  mass: number;
  players: PlayerStats[];
  budget: number;
  isUCL?: boolean;
}

const ALL_TEAMS: Team[] = [
  { 
    id: 'gs', name: 'Galatasaray', color: '#A90432', secondaryColor: '#FDB912', speed: 0.55, mass: 1.4, budget: 50000000,
    players: [
      { id: 'gs1', name: 'Muslera', position: 'GK', rating: 85, value: 5000000, nationality: 'Uruguay', club: 'Galatasaray' },
      { id: 'gs2', name: 'Icardi', position: 'FWD', rating: 88, value: 20000000, nationality: 'Argentina', club: 'Galatasaray' },
      { id: 'gs3', name: 'Torreira', position: 'MID', rating: 84, value: 15000000, nationality: 'Uruguay', club: 'Galatasaray' },
      { id: 'gs4', name: 'Baris Alper', position: 'FWD', rating: 82, value: 12000000, nationality: 'Turkey', club: 'Galatasaray' },
      { id: 'gs5', name: 'Nelsson', position: 'DEF', rating: 83, value: 10000000, nationality: 'Denmark', club: 'Galatasaray' },
    ]
  },
  { 
    id: 'fb', name: 'Fenerbahçe', color: '#002E5D', secondaryColor: '#FFED00', speed: 0.56, mass: 1.3, budget: 55000000,
    players: [
      { id: 'fb1', name: 'Livakovic', position: 'GK', rating: 84, value: 8000000, nationality: 'Croatia', club: 'Fenerbahçe' },
      { id: 'fb2', name: 'Dzeko', position: 'FWD', rating: 86, value: 5000000, nationality: 'Bosnia', club: 'Fenerbahçe' },
      { id: 'fb3', name: 'Tadic', position: 'MID', rating: 85, value: 10000000, nationality: 'Serbia', club: 'Fenerbahçe' },
      { id: 'fb4', name: 'Fred', position: 'MID', rating: 84, value: 15000000, nationality: 'Brazil', club: 'Fenerbahçe' },
      { id: 'fb5', name: 'Szymanski', position: 'MID', rating: 83, value: 18000000, nationality: 'Poland', club: 'Fenerbahçe' },
    ]
  },
  { 
    id: 'bjk', name: 'Beşiktaş', color: '#000000', secondaryColor: '#FFFFFF', speed: 0.53, mass: 1.5, budget: 40000000,
    players: [
      { id: 'bjk1', name: 'Gunok', position: 'GK', rating: 82, value: 3000000, nationality: 'Turkey', club: 'Beşiktaş' },
      { id: 'bjk2', name: 'Immobile', position: 'FWD', rating: 85, value: 12000000, nationality: 'Italy', club: 'Beşiktaş' },
      { id: 'bjk3', name: 'Gedson', position: 'MID', rating: 83, value: 18000000, nationality: 'Portugal', club: 'Beşiktaş' },
      { id: 'bjk4', name: 'Rafa Silva', position: 'MID', rating: 86, value: 15000000, nationality: 'Portugal', club: 'Beşiktaş' },
      { id: 'bjk5', name: 'Paulista', position: 'DEF', rating: 82, value: 5000000, nationality: 'Brazil', club: 'Beşiktaş' },
    ]
  },
  { 
    id: 'rm', name: 'Real Madrid', color: '#FFFFFF', secondaryColor: '#FEBE10', speed: 0.62, mass: 1.2, budget: 200000000,
    players: [
      { id: 'rm1', name: 'Courtois', position: 'GK', rating: 90, value: 45000000, nationality: 'Belgium', club: 'Real Madrid' },
      { id: 'rm2', name: 'Mbappe', position: 'FWD', rating: 91, value: 180000000, nationality: 'France', club: 'Real Madrid' },
      { id: 'rm3', name: 'Vinicius Jr', position: 'FWD', rating: 90, value: 150000000, nationality: 'Brazil', club: 'Real Madrid' },
      { id: 'rm4', name: 'Bellingham', position: 'MID', rating: 88, value: 120000000, nationality: 'England', club: 'Real Madrid' },
      { id: 'rm5', name: 'Valverde', position: 'MID', rating: 87, value: 100000000, nationality: 'Uruguay', club: 'Real Madrid' },
    ]
  },
  { 
    id: 'mc', name: 'Man City', color: '#6CABDD', secondaryColor: '#FFFFFF', speed: 0.60, mass: 1.3, budget: 180000000,
    players: [
      { id: 'mc1', name: 'Ederson', position: 'GK', rating: 88, value: 40000000, nationality: 'Brazil', club: 'Man City' },
      { id: 'mc2', name: 'Haaland', position: 'FWD', rating: 91, value: 170000000, nationality: 'Norway', club: 'Man City' },
      { id: 'mc3', name: 'De Bruyne', position: 'MID', rating: 90, value: 80000000, nationality: 'Belgium', club: 'Man City' },
      { id: 'mc4', name: 'Rodri', position: 'MID', rating: 91, value: 110000000, nationality: 'Spain', club: 'Man City' },
      { id: 'mc5', name: 'Foden', position: 'FWD', rating: 88, value: 120000000, nationality: 'England', club: 'Man City' },
    ]
  },
  { 
    id: 'bm', name: 'Bayern Munich', color: '#DC052D', secondaryColor: '#FFFFFF', speed: 0.58, mass: 1.4, budget: 150000000,
    players: [
      { id: 'bm1', name: 'Neuer', position: 'GK', rating: 87, value: 5000000, nationality: 'Germany', club: 'Bayern Munich' },
      { id: 'bm2', name: 'Kane', position: 'FWD', rating: 90, value: 100000000, nationality: 'England', club: 'Bayern Munich' },
      { id: 'bm3', name: 'Musiala', position: 'MID', rating: 87, value: 110000000, nationality: 'Germany', club: 'Bayern Munich' },
      { id: 'bm4', name: 'Sane', position: 'FWD', rating: 85, value: 70000000, nationality: 'Germany', club: 'Bayern Munich' },
      { id: 'bm5', name: 'Kimmich', position: 'MID', rating: 86, value: 60000000, nationality: 'Germany', club: 'Bayern Munich' },
    ]
  },
  { 
    id: 'liv', name: 'Liverpool', color: '#C8102E', secondaryColor: '#F6EB61', speed: 0.59, mass: 1.3, budget: 140000000,
    players: [
      { id: 'liv1', name: 'Alisson', position: 'GK', rating: 89, value: 55000000, nationality: 'Brazil', club: 'Liverpool' },
      { id: 'liv2', name: 'Salah', position: 'FWD', rating: 89, value: 90000000, nationality: 'Egypt', club: 'Liverpool' },
      { id: 'liv3', name: 'Van Dijk', position: 'DEF', rating: 89, value: 60000000, nationality: 'Netherlands', club: 'Liverpool' },
      { id: 'liv4', name: 'Mac Allister', position: 'MID', rating: 86, value: 75000000, nationality: 'Argentina', club: 'Liverpool' },
      { id: 'liv5', name: 'Diaz', position: 'FWD', rating: 86, value: 80000000, nationality: 'Colombia', club: 'Liverpool' },
    ]
  },
  { 
    id: 'ts', name: 'Trabzonspor', color: '#6B0033', secondaryColor: '#0099CC', speed: 0.52, mass: 1.6, budget: 30000000,
    players: [
      { id: 'ts1', name: 'Cakir', position: 'GK', rating: 83, value: 7000000, nationality: 'Turkey', club: 'Trabzonspor' },
      { id: 'ts2', name: 'Visca', position: 'FWD', rating: 81, value: 4000000, nationality: 'Bosnia', club: 'Trabzonspor' },
      { id: 'ts3', name: 'Mendy', position: 'MID', rating: 80, value: 10000000, nationality: 'France', club: 'Trabzonspor' },
      { id: 'ts4', name: 'Nwakaeme', position: 'FWD', rating: 82, value: 3000000, nationality: 'Nigeria', club: 'Trabzonspor' },
    ]
  },
  { 
    id: 'ibfk', name: 'Başakşehir', color: '#004A99', secondaryColor: '#FF6600', speed: 0.51, mass: 1.5, budget: 25000000,
    players: [
      { id: 'ibfk1', name: 'Sengezer', position: 'GK', rating: 79, value: 2000000, nationality: 'Turkey', club: 'Başakşehir' },
      { id: 'ibfk2', name: 'Piatek', position: 'FWD', rating: 81, value: 8000000, nationality: 'Poland', club: 'Başakşehir' },
      { id: 'ibfk3', name: 'Turuc', position: 'MID', rating: 78, value: 3000000, nationality: 'Turkey', club: 'Başakşehir' },
    ]
  }
];

const TRANSFER_POOL: PlayerStats[] = [
  { id: 'tr1', name: 'Kylian Mbappe', position: 'FWD', rating: 91, value: 150000000, nationality: 'France', club: 'Real Madrid' },
  { id: 'tr2', name: 'Erling Haaland', position: 'FWD', rating: 91, value: 160000000, nationality: 'Norway', club: 'Man City' },
  { id: 'tr3', name: 'Jude Bellingham', position: 'MID', rating: 88, value: 120000000, nationality: 'England', club: 'Real Madrid' },
  { id: 'tr4', name: 'Kevin De Bruyne', position: 'MID', rating: 90, value: 80000000, nationality: 'Belgium', club: 'Man City' },
  { id: 'tr5', name: 'Virgil van Dijk', position: 'DEF', rating: 89, value: 60000000, nationality: 'Netherlands', club: 'Liverpool' },
  { id: 'tr6', name: 'Alisson Becker', position: 'GK', rating: 89, value: 55000000, nationality: 'Brazil', club: 'Liverpool' },
  { id: 'tr7', name: 'Arda Guler', position: 'MID', rating: 80, value: 45000000, nationality: 'Turkey', club: 'Real Madrid' },
  { id: 'tr8', name: 'Kenan Yildiz', position: 'FWD', rating: 79, value: 35000000, nationality: 'Turkey', club: 'Juventus' },
  { id: 'tr9', name: 'Hakan Calhanoglu', position: 'MID', rating: 86, value: 40000000, nationality: 'Turkey', club: 'Inter' },
  { id: 'tr10', name: 'Ferdi Kadioglu', position: 'DEF', rating: 82, value: 30000000, nationality: 'Turkey', club: 'Brighton' },
  { id: 'tr11', name: 'Mohamed Salah', position: 'FWD', rating: 89, value: 90000000, nationality: 'Egypt', club: 'Liverpool' },
  { id: 'tr12', name: 'Vinicius Jr', position: 'FWD', rating: 90, value: 140000000, nationality: 'Brazil', club: 'Real Madrid' },
  { id: 'tr13', name: 'Rodri', position: 'MID', rating: 91, value: 110000000, nationality: 'Spain', club: 'Man City' },
  { id: 'tr14', name: 'Harry Kane', position: 'FWD', rating: 90, value: 100000000, nationality: 'England', club: 'Bayern Munich' },
  { id: 'tr15', name: 'Bukayo Saka', position: 'FWD', rating: 87, value: 120000000, nationality: 'England', club: 'Arsenal' },
];

const UCL_TEAMS: Team[] = [
  { 
    id: 'rm', name: 'Real Madrid', color: '#FFFFFF', secondaryColor: '#FEBE10', speed: 0.65, mass: 1.2, budget: 500000000, isUCL: true,
    players: [
      { id: 'rm1', name: 'Courtois', position: 'GK', rating: 90, value: 50000000, nationality: 'Belgium', club: 'Real Madrid' },
      { id: 'rm2', name: 'Mbappe', position: 'FWD', rating: 91, value: 180000000, nationality: 'France', club: 'Real Madrid' },
      { id: 'rm3', name: 'Vinicius Jr', position: 'FWD', rating: 90, value: 150000000, nationality: 'Brazil', club: 'Real Madrid' },
      { id: 'rm4', name: 'Bellingham', position: 'MID', rating: 89, value: 120000000, nationality: 'England', club: 'Real Madrid' },
      { id: 'rm5', name: 'Valverde', position: 'MID', rating: 88, value: 100000000, nationality: 'Uruguay', club: 'Real Madrid' },
    ]
  },
  { 
    id: 'mc', name: 'Man City', color: '#6CABDD', secondaryColor: '#FFFFFF', speed: 0.64, mass: 1.3, budget: 600000000, isUCL: true,
    players: [
      { id: 'mc1', name: 'Ederson', position: 'GK', rating: 88, value: 40000000, nationality: 'Brazil', club: 'Man City' },
      { id: 'mc2', name: 'Haaland', position: 'FWD', rating: 91, value: 200000000, nationality: 'Norway', club: 'Man City' },
      { id: 'mc3', name: 'De Bruyne', position: 'MID', rating: 90, value: 80000000, nationality: 'Belgium', club: 'Man City' },
      { id: 'mc4', name: 'Rodri', position: 'MID', rating: 91, value: 110000000, nationality: 'Spain', club: 'Man City' },
      { id: 'mc5', name: 'Foden', position: 'FWD', rating: 88, value: 130000000, nationality: 'England', club: 'Man City' },
    ]
  },
  { 
    id: 'bayern', name: 'Bayern Munich', color: '#DC052D', secondaryColor: '#FFFFFF', speed: 0.62, mass: 1.4, budget: 400000000, isUCL: true,
    players: [
      { id: 'bm1', name: 'Neuer', position: 'GK', rating: 87, value: 10000000, nationality: 'Germany', club: 'Bayern Munich' },
      { id: 'bm2', name: 'Kane', position: 'FWD', rating: 90, value: 100000000, nationality: 'England', club: 'Bayern Munich' },
      { id: 'bm3', name: 'Musiala', position: 'MID', rating: 88, value: 120000000, nationality: 'Germany', club: 'Bayern Munich' },
      { id: 'bm4', name: 'Sane', position: 'FWD', rating: 85, value: 70000000, nationality: 'Germany', club: 'Bayern Munich' },
      { id: 'bm5', name: 'Kimmich', position: 'MID', rating: 86, value: 60000000, nationality: 'Germany', club: 'Bayern Munich' },
    ]
  },
  { 
    id: 'barca', name: 'Barcelona', color: '#004D98', secondaryColor: '#A50044', speed: 0.60, mass: 1.1, budget: 350000000, isUCL: true,
    players: [
      { id: 'bc1', name: 'Ter Stegen', position: 'GK', rating: 88, value: 30000000, nationality: 'Germany', club: 'Barcelona' },
      { id: 'bc2', name: 'Lewandowski', position: 'FWD', rating: 88, value: 20000000, nationality: 'Poland', club: 'Barcelona' },
      { id: 'bc3', name: 'Yamal', position: 'FWD', rating: 84, value: 120000000, nationality: 'Spain', club: 'Barcelona' },
      { id: 'bc4', name: 'Pedri', position: 'MID', rating: 86, value: 80000000, nationality: 'Spain', club: 'Barcelona' },
      { id: 'bc5', name: 'Gavi', position: 'MID', rating: 83, value: 90000000, nationality: 'Spain', club: 'Barcelona' },
    ]
  },
  { 
    id: 'liv', name: 'Liverpool', color: '#C8102E', secondaryColor: '#F6EB61', speed: 0.63, mass: 1.3, budget: 450000000, isUCL: true,
    players: [
      { id: 'l1', name: 'Alisson', position: 'GK', rating: 89, value: 45000000, nationality: 'Brazil', club: 'Liverpool' },
      { id: 'l2', name: 'Salah', position: 'FWD', rating: 89, value: 60000000, nationality: 'Egypt', club: 'Liverpool' },
      { id: 'l3', name: 'Van Dijk', position: 'DEF', rating: 89, value: 40000000, nationality: 'Netherlands', club: 'Liverpool' },
      { id: 'l4', name: 'Trent', position: 'DEF', rating: 86, value: 70000000, nationality: 'England', club: 'Liverpool' },
      { id: 'l5', name: 'Mac Allister', position: 'MID', rating: 86, value: 75000000, nationality: 'Argentina', club: 'Liverpool' },
    ]
  },
  { 
    id: 'psg', name: 'PSG', color: '#004170', secondaryColor: '#DA291C', speed: 0.61, mass: 1.2, budget: 700000000, isUCL: true,
    players: [
      { id: 'p1', name: 'Donnarumma', position: 'GK', rating: 87, value: 40000000, nationality: 'Italy', club: 'PSG' },
      { id: 'p2', name: 'Dembele', position: 'FWD', rating: 86, value: 60000000, nationality: 'France', club: 'PSG' },
      { id: 'p3', name: 'Hakimi', position: 'DEF', rating: 84, value: 65000000, nationality: 'Morocco', club: 'PSG' },
      { id: 'p4', name: 'Barcola', position: 'FWD', rating: 82, value: 50000000, nationality: 'France', club: 'PSG' },
      { id: 'p5', name: 'Vitinha', position: 'MID', rating: 85, value: 55000000, nationality: 'Portugal', club: 'PSG' },
    ]
  },
  { 
    id: 'inter', name: 'Inter Milan', color: '#0066B2', secondaryColor: '#000000', speed: 0.62, mass: 1.4, budget: 300000000, isUCL: true,
    players: [
      { id: 'i1', name: 'Sommer', position: 'GK', rating: 86, value: 5000000, nationality: 'Switzerland', club: 'Inter' },
      { id: 'i2', name: 'Lautaro', position: 'FWD', rating: 89, value: 110000000, nationality: 'Argentina', club: 'Inter' },
      { id: 'i3', name: 'Barella', position: 'MID', rating: 87, value: 80000000, nationality: 'Italy', club: 'Inter' },
      { id: 'i4', name: 'Calhanoglu', position: 'MID', rating: 86, value: 45000000, nationality: 'Turkey', club: 'Inter' },
      { id: 'i5', name: 'Bastoni', position: 'DEF', rating: 87, value: 70000000, nationality: 'Italy', club: 'Inter' },
    ]
  },
  { 
    id: 'ars', name: 'Arsenal', color: '#EF0107', secondaryColor: '#FFFFFF', speed: 0.63, mass: 1.2, budget: 380000000, isUCL: true,
    players: [
      { id: 'a1', name: 'Raya', position: 'GK', rating: 85, value: 35000000, nationality: 'Spain', club: 'Arsenal' },
      { id: 'a2', name: 'Saka', position: 'FWD', rating: 88, value: 140000000, nationality: 'England', club: 'Arsenal' },
      { id: 'a3', name: 'Odegaard', position: 'MID', rating: 89, value: 110000000, nationality: 'Norway', club: 'Arsenal' },
      { id: 'a4', name: 'Rice', position: 'MID', rating: 87, value: 120000000, nationality: 'England', club: 'Arsenal' },
      { id: 'a5', name: 'Saliba', position: 'DEF', rating: 88, value: 80000000, nationality: 'France', club: 'Arsenal' },
    ]
  },
  { 
    id: 'bvb', name: 'Dortmund', color: '#FDE100', secondaryColor: '#000000', speed: 0.61, mass: 1.3, budget: 250000000, isUCL: true,
    players: [
      { id: 'd1', name: 'Kobel', position: 'GK', rating: 86, value: 40000000, nationality: 'Switzerland', club: 'Dortmund' },
      { id: 'd2', name: 'Guirassy', position: 'FWD', rating: 84, value: 40000000, nationality: 'Guinea', club: 'Dortmund' },
      { id: 'd3', name: 'Brandt', position: 'MID', rating: 84, value: 40000000, nationality: 'Germany', club: 'Dortmund' },
      { id: 'd4', name: 'Sabitzer', position: 'MID', rating: 82, value: 20000000, nationality: 'Austria', club: 'Dortmund' },
      { id: 'd5', name: 'Schlotterbeck', position: 'DEF', rating: 83, value: 40000000, nationality: 'Germany', club: 'Dortmund' },
    ]
  }
];

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'goal' | 'gameover' | 'lobby' | 'career_hub' | 'transfer_market' | 'one_vs_one_setup' | 'squad_management' | 'store' | 'ucl_menu';

const FORMATIONS = {
  HOME: [
    { x: 60, y: 400 }, // GK
    { x: 250, y: 150 }, { x: 250, y: 320 }, { x: 250, y: 480 }, { x: 250, y: 650 }, // DEF
    { x: 500, y: 200 }, { x: 500, y: 400 }, { x: 500, y: 600 }, // MID
    { x: 850, y: 200 }, { x: 850, y: 400 }, { x: 850, y: 600 }, // FWD
  ],
  AWAY: [
    { x: 1140, y: 400 }, // GK
    { x: 950, y: 150 }, { x: 950, y: 320 }, { x: 950, y: 480 }, { x: 950, y: 650 }, // DEF
    { x: 700, y: 200 }, { x: 700, y: 400 }, { x: 700, y: 600 }, // MID
    { x: 350, y: 200 }, { x: 350, y: 400 }, { x: 350, y: 600 }, // FWD
  ]
};

const NATION_FLAGS: Record<string, string> = {
  'Turkey': '🇹🇷', 'France': '🇫🇷', 'Norway': '🇳🇴', 'England': '🇬🇧', 'Belgium': '🇧🇪',
  'Netherlands': '🇳🇱', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Uruguay': '🇺🇾', 'Denmark': '🇩🇰',
  'Croatia': '🇭🇷', 'Bosnia': '🇧🇦', 'Serbia': '🇷🇸', 'Poland': '🇵🇱', 'Italy': '🇮🇹',
  'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'Senegal': '🇸🇳', 'Chad': '🇹🇩', 'Cameroon': '🇨🇲',
  'Paraguay': '🇵🇾', 'Sweden': '🇸🇪', 'Nigeria': '🇳🇬', 'Egypt': '🇪🇬', 'Spain': '🇪🇸',
  'Germany': '🇩🇪'
};

export default function FootballGame() {
  const [transferPlayer, setTransferPlayer] = useState<PlayerStats | null>(null);
  const [isOpeningPack, setIsOpeningPack] = useState(false);
  const [packRevealStep, setPackRevealStep] = useState(0);
  const [openedPackPlayer, setOpenedPackPlayer] = useState<PlayerStats | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameState, setGameState] = useState<GameState>('menu');
  const [lastScorer, setLastScorer] = useState<'player' | 'ai' | null>(null);
  const [outType, setOutType] = useState<'tac' | 'korner' | 'aut' | null>(null);
  const lastTouchTeam = useRef<'player' | 'ai' | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: PITCH_WIDTH, height: PITCH_HEIGHT });
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [cheatCode, setCheatCode] = useState('');
  
  const [selectedTeam, setSelectedTeam] = useState<Team>(ALL_TEAMS[0]);
  const [uclMode, setUclMode] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [previousState, setPreviousState] = useState<GameState>('menu');

  // Career Mode State
  const [careerData, setCareerData] = useState({
    myTeam: ALL_TEAMS[0],
    money: 10000000,
    diamonds: 100,
    week: 1,
    wins: 0,
    draws: 0,
    losses: 0,
    squad: [...ALL_TEAMS[0].players]
  });

  // Multiplayer State
  const [myId, setMyId] = useState<string>('');
  const [inviteId, setInviteId] = useState<string>('');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [role, setRole] = useState<'player1' | 'player2' | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isOneVsOne, setIsOneVsOne] = useState(false);
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [isAIPassive, setIsAIPassive] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const playerRef = useRef<Entity>({
    pos: { x: 200, y: PITCH_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    radius: 18,
    color: ALL_TEAMS[0].color,
    mass: ALL_TEAMS[0].mass
  });

  const teammatesRef = useRef<Entity[]>(Array.from({ length: 10 }, (_, i) => ({
    pos: { x: 300 + Math.random() * 200, y: Math.random() * PITCH_HEIGHT },
    vel: { x: 0, y: 0 },
    radius: 18,
    color: ALL_TEAMS[0].color,
    mass: 1.4
  })));

  const opponentsRef = useRef<Entity[]>(Array.from({ length: 11 }, (_, i) => ({
    pos: { x: 700 + Math.random() * 200, y: Math.random() * PITCH_HEIGHT },
    vel: { x: 0, y: 0 },
    radius: 18,
    color: '#ef4444',
    mass: 1.4
  })));

  const aiRef = useRef<Entity>({ // Keep for compatibility but we use opponentsRef now
    pos: { x: 600, y: PITCH_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    radius: 18,
    color: '#ef4444',
    mass: 1.5
  });

  const ballRef = useRef<Entity>({
    pos: { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    radius: 12,
    color: '#ffffff',
    mass: 1
  });

  const keys = useRef<{ [key: string]: boolean }>({});
  const joystickRef = useRef<Vector>({ x: 0, y: 0 });

  // WebSocket Setup
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'INIT':
          setMyId(message.id);
          break;
        case 'INVITE_RECEIVED':
          setPendingInvite(message.fromId);
          break;
        case 'MATCH_START':
          setMatchId(message.matchId);
          setRole(message.role);
          setIsMultiplayer(true);
          startGame();
          break;
        case 'OPPONENT_STATE':
          if (message.state) {
            const opponent = role === 'player1' ? aiRef.current : playerRef.current;
            opponent.pos = message.state.pos;
            opponent.vel = message.state.vel;
            if (role === 'player2' && message.state.ball) {
              ballRef.current.pos = message.state.ball.pos;
              ballRef.current.vel = message.state.ball.vel;
            }
          }
          break;
        case 'GOAL_SCORED':
          handleGoal(message.scorer === 'player1' ? 'player' : 'ai', true);
          break;
        case 'OPPONENT_DISCONNECTED':
          setGameState('menu');
          setIsMultiplayer(false);
          setMatchId(null);
          alert('Opponent disconnected');
          break;
        case 'INVITE_ERROR':
          alert(message.message);
          break;
      }
    };

    return () => ws.close();
  }, [role]);

  // Handle Resize & Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const scale = Math.min(1, containerWidth / PITCH_WIDTH);
        setCanvasSize({
          width: PITCH_WIDTH * scale,
          height: PITCH_HEIGHT * scale
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'KeyP') { // Changed from KeyR to KeyP to free up R for Through Ball
        setIsAdmin(prev => !prev);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetPositions = () => {
    playerRef.current.pos = { x: 200, y: PITCH_HEIGHT / 2 };
    playerRef.current.vel = { x: 0, y: 0 };
    
    if (isOneVsOne) {
      teammatesRef.current.forEach(tm => {
        tm.pos = { x: -1000, y: -1000 }; // Hide teammates
        tm.vel = { x: 0, y: 0 };
      });
      opponentsRef.current.forEach((op, i) => {
        if (i === 0) {
          op.pos = { x: PITCH_WIDTH - 200, y: PITCH_HEIGHT / 2 };
        } else {
          op.pos = { x: 2000, y: 2000 }; // Hide other opponents
        }
        op.vel = { x: 0, y: 0 };
      });
    } else {
      // Reset Teammates
      teammatesRef.current.forEach((tm, i) => {
        tm.pos = { ...FORMATIONS.HOME[i] };
        tm.vel = { x: 0, y: 0 };
      });

      // Reset Opponents
      opponentsRef.current.forEach((op, i) => {
        op.pos = { ...FORMATIONS.AWAY[i] };
        op.vel = { x: 0, y: 0 };
      });
    }

    ballRef.current.pos = { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2 };
    ballRef.current.vel = { x: 0, y: 0 };
  };

  const checkCollision = (e1: Entity, e2: Entity) => {
    const dx = e2.pos.x - e1.pos.x;
    const dy = e2.pos.y - e1.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = e1.radius + e2.radius;

    if (distance < minDistance) {
      if (e1 === ballRef.current || e2 === ballRef.current) {
        const other = e1 === ballRef.current ? e2 : e1;
        if (other === playerRef.current || teammatesRef.current.includes(other as Entity)) {
          lastTouchTeam.current = 'player';
        } else if (opponentsRef.current.includes(other as Entity)) {
          lastTouchTeam.current = 'ai';
        }
      }
      const overlap = minDistance - distance;
      const nx = dx / distance;
      const ny = dy / distance;
      
      const totalMass = e1.mass + e2.mass;
      const m1Ratio = e2.mass / totalMass;
      const m2Ratio = e1.mass / totalMass;

      e1.pos.x -= nx * overlap * m1Ratio;
      e1.pos.y -= ny * overlap * m1Ratio;
      e2.pos.x += nx * overlap * m2Ratio;
      e2.pos.y += ny * overlap * m2Ratio;

      const v1n = e1.vel.x * nx + e1.vel.y * ny;
      const v2n = e2.vel.x * nx + e2.vel.y * ny;

      const impulse = (2 * (v1n - v2n)) / totalMass;

      e1.vel.x -= impulse * e2.mass * nx;
      e1.vel.y -= impulse * e2.mass * ny;
      e2.vel.x += impulse * e1.mass * nx;
      e2.vel.y += impulse * e1.mass * ny;
    }
  };

  const update = () => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    const ball = ballRef.current;

    // Local Player Movement
    let pSpeed = selectedTeam.speed;
    if (isOneVsOne) pSpeed *= 2.5; // Very easy mode: super speed

    if (isManagerMode && !isOneVsOne) {
      // AI control for player in Manager Mode
      const dxBall = ball.pos.x - player.pos.x;
      const dyBall = ball.pos.y - player.pos.y;
      const distBall = Math.sqrt(dxBall * dxBall + dyBall * dyBall);
      if (distBall < 400) {
        player.vel.x += (dxBall / distBall) * pSpeed;
        player.vel.y += (dyBall / distBall) * pSpeed;
      } else {
        const dxHome = 200 - player.pos.x;
        const dyHome = (PITCH_HEIGHT / 2) - player.pos.y;
        player.vel.x += dxHome * 0.01;
        player.vel.y += dyHome * 0.01;
      }
    } else {
      if (keys.current['KeyW'] || keys.current['ArrowUp']) player.vel.y -= pSpeed;
      if (keys.current['KeyS'] || keys.current['ArrowDown']) player.vel.y += pSpeed;
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) player.vel.x -= pSpeed;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) player.vel.x += pSpeed;

      // Player Actions
      const dxBall = ball.pos.x - player.pos.x;
      const dyBall = ball.pos.y - player.pos.y;
      const distBall = Math.sqrt(dxBall * dxBall + dyBall * dyBall);
      const canAct = distBall < player.radius + ball.radius + 15;

      if (canAct) {
        // Şut (F)
        if (keys.current['KeyF']) {
          const targetX = PITCH_WIDTH;
          const targetY = PITCH_HEIGHT / 2;
          const dx = targetX - ball.pos.x;
          const dy = targetY - ball.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          ball.vel.x = (dx / dist) * 16;
          ball.vel.y = (dy / dist) * 16;
          lastTouchTeam.current = 'player';
          keys.current['KeyF'] = false;
        }
        // Pas (G)
        if (keys.current['KeyG']) {
          let nearestTm = null;
          let minDist = Infinity;
          teammatesRef.current.forEach(tm => {
            if (tm.pos.x > player.pos.x) {
              const d = Math.sqrt(Math.pow(tm.pos.x - player.pos.x, 2) + Math.pow(tm.pos.y - player.pos.y, 2));
              if (d < minDist) {
                minDist = d;
                nearestTm = tm;
              }
            }
          });
          
          const targetX = nearestTm ? nearestTm.pos.x : PITCH_WIDTH;
          const targetY = nearestTm ? nearestTm.pos.y : PITCH_HEIGHT / 2;
          const dx = targetX - ball.pos.x;
          const dy = targetY - ball.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          ball.vel.x = (dx / dist) * 11;
          ball.vel.y = (dy / dist) * 11;
          lastTouchTeam.current = 'player';
          keys.current['KeyG'] = false;
        }
        // Ara Pas (R)
        if (keys.current['KeyR']) {
          let nearestTm = null;
          let minDist = Infinity;
          teammatesRef.current.forEach(tm => {
            if (tm.pos.x > player.pos.x) {
              const d = Math.sqrt(Math.pow(tm.pos.x - player.pos.x, 2) + Math.pow(tm.pos.y - player.pos.y, 2));
              if (d < minDist) {
                minDist = d;
                nearestTm = tm;
              }
            }
          });
          
          const targetX = nearestTm ? nearestTm.pos.x + 130 : PITCH_WIDTH;
          const targetY = nearestTm ? nearestTm.pos.y : PITCH_HEIGHT / 2;
          const dx = targetX - ball.pos.x;
          const dy = targetY - ball.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          ball.vel.x = (dx / dist) * 13;
          ball.vel.y = (dy / dist) * 13;
          lastTouchTeam.current = 'player';
          keys.current['KeyR'] = false;
        }
        // Sert Şut (X)
        if (keys.current['KeyX']) {
          const targetX = PITCH_WIDTH;
          const targetY = PITCH_HEIGHT / 2 + (Math.random() - 0.5) * 80;
          const dx = targetX - ball.pos.x;
          const dy = targetY - ball.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          ball.vel.x = (dx / dist) * 24;
          ball.vel.y = (dy / dist) * 24;
          lastTouchTeam.current = 'player';
          keys.current['KeyX'] = false;
        }
      }

      // Joystick support for mobile
      if (isMobile) {
        player.vel.x += joystickRef.current.x * pSpeed;
        player.vel.y += joystickRef.current.y * pSpeed;
      }
    }

    // Teammate AI
    if (!isOneVsOne) {
      teammatesRef.current.forEach((tm, i) => {
        const home = FORMATIONS.HOME[i];
        const dxBall = ball.pos.x - tm.pos.x;
        const dyBall = ball.pos.y - tm.pos.y;
        const distBall = Math.sqrt(dxBall*dxBall + dyBall*dyBall);
        
        if (i === 0) { // GK Logic
          const targetY = Math.max(PITCH_HEIGHT/2 - GOAL_SIZE/2, Math.min(PITCH_HEIGHT/2 + GOAL_SIZE/2, ball.pos.y));
          tm.vel.y += (targetY - tm.pos.y) * 0.1;
          tm.vel.x += (60 - tm.pos.x) * 0.1;
        } else {
          // Only move to ball if it's in their half or very close
          const responsibilityZone = 250;
          if (distBall < responsibilityZone) {
            tm.vel.x += (dxBall / distBall) * 0.25;
            tm.vel.y += (dyBall / distBall) * 0.25;
            
            // Simple "Kick/Pass" logic
            if (distBall < tm.radius + ball.radius + 5) {
              const targetX = PITCH_WIDTH;
              const targetY = PITCH_HEIGHT / 2;
              const kickDx = targetX - ball.pos.x;
              const kickDy = targetY - ball.pos.y;
              const kickDist = Math.sqrt(kickDx*kickDx + kickDy*kickDy);
              ball.vel.x += (kickDx / kickDist) * 0.8;
              ball.vel.y += (kickDy / kickDist) * 0.8;
            }
          } else {
            // Return to formation
            const dxHome = home.x - tm.pos.x;
            const dyHome = home.y - tm.pos.y;
            const distHome = Math.sqrt(dxHome*dxHome + dyHome*dyHome);
            if (distHome > 10) {
              tm.vel.x += (dxHome / distHome) * 0.15;
              tm.vel.y += (dyHome / distHome) * 0.15;
            }
          }
        }
      });
    }

    // Opponent AI
    opponentsRef.current.forEach((op, i) => {
      if (isOneVsOne && i > 0) return; // Only 1 opponent in 1v1

      const home = FORMATIONS.AWAY[i];
      const dxBall = ball.pos.x - op.pos.x;
      const dyBall = ball.pos.y - op.pos.y;
      const distBall = Math.sqrt(dxBall*dxBall + dyBall*dyBall);
      
      let aiSpeed = 0.25;
      if (difficulty === 'hard') aiSpeed = 0.4;
      if (difficulty === 'easy') aiSpeed = 0.15;
      
      if (isOneVsOne) {
        if (difficulty === 'easy') aiSpeed = 0.05;
        else if (difficulty === 'medium') aiSpeed = 0.15;
        else aiSpeed = 0.3;
      }
      
      if (i === 0 && !isOneVsOne) { // GK Logic (only in 11v11)
        const targetY = Math.max(PITCH_HEIGHT/2 - GOAL_SIZE/2, Math.min(PITCH_HEIGHT/2 + GOAL_SIZE/2, ball.pos.y));
        op.vel.y += (targetY - op.pos.y) * 0.1;
        op.vel.x += (PITCH_WIDTH - 60 - op.pos.x) * 0.1;
      } else {
        const responsibilityZone = isAIPassive ? 100 : 300; // AI is less aggressive in passive mode
        if (distBall < responsibilityZone && !isAIPassive) {
          op.vel.x += (dxBall / distBall) * aiSpeed;
          op.vel.y += (dyBall / distBall) * aiSpeed;

          // Simple "Kick/Pass" logic
          if (distBall < op.radius + ball.radius + 5) {
            const targetX = 0;
            const targetY = PITCH_HEIGHT / 2;
            const kickDx = targetX - ball.pos.x;
            const kickDy = targetY - ball.pos.y;
            const kickDist = Math.sqrt(kickDx*kickDx + kickDy*kickDy);
            ball.vel.x += (kickDx / kickDist) * 0.8;
            ball.vel.y += (kickDy / kickDist) * 0.8;
          }
        } else {
          // Return to formation
          const dxHome = home.x - op.pos.x;
          const dyHome = home.y - op.pos.y;
          const distHome = Math.sqrt(dxHome*dxHome + dyHome*dyHome);
          if (distHome > 10) {
            op.vel.x += (dxHome / distHome) * 0.15;
            op.vel.y += (dyHome / distHome) * 0.15;
          }
        }
      }
    });

    // Apply Physics to all
    const allEntities = [player, ball, ...teammatesRef.current, ...opponentsRef.current];
    
    allEntities.forEach(e => {
      const friction = e === ball ? BALL_FRICTION : FRICTION;
      e.vel.x *= friction;
      e.vel.y *= friction;

      const speed = Math.sqrt(e.vel.x * e.vel.x + e.vel.y * e.vel.y);
      const max = e === ball ? 18 : PLAYER_MAX_SPEED;
      if (speed > max) {
        e.vel.x = (e.vel.x / speed) * max;
        e.vel.y = (e.vel.y / speed) * max;
      }

      e.pos.x += e.vel.x;
      e.pos.y += e.vel.y;

      // GK Hard Restriction
      if (e !== ball && e !== playerRef.current) {
        const isTeammateGK = teammatesRef.current[0] === e;
        const isOpponentGK = opponentsRef.current[0] === e;
        if (isTeammateGK) {
          e.pos.x = Math.max(20, Math.min(120, e.pos.x));
          e.pos.y = Math.max(PITCH_HEIGHT/2 - 150, Math.min(PITCH_HEIGHT/2 + 150, e.pos.y));
        }
        if (isOpponentGK) {
          e.pos.x = Math.max(PITCH_WIDTH - 120, Math.min(PITCH_WIDTH - 20, e.pos.x));
          e.pos.y = Math.max(PITCH_HEIGHT/2 - 150, Math.min(PITCH_HEIGHT/2 + 150, e.pos.y));
        }
      }

      // Ball Out of Bounds Logic
      if (e === ball) {
        // Reset AI passive mode if ball goes out again
        if (isAIPassive && (e.pos.y < 0 || e.pos.y > PITCH_HEIGHT || e.pos.x < 0 || e.pos.x > PITCH_WIDTH)) {
          setIsAIPassive(false);
        }

        // Long Sides (Taç)
        if (e.pos.y < 0 || e.pos.y > PITCH_HEIGHT) {
          handleOutOfBounds('tac');
          return;
        }

        // Short Sides (Goal Line)
        if (e.pos.x < 0) {
          if (Math.abs(e.pos.y - PITCH_HEIGHT/2) < GOAL_SIZE/2) {
            handleGoal('ai');
          } else {
            // Out of goal line (Player's side)
            if (lastTouchTeam.current === 'player') {
              handleOutOfBounds('korner'); // Defending team touched it -> Corner for AI
            } else {
              handleOutOfBounds('aut'); // Attacking team touched it -> Goal Kick for Player
            }
          }
          return;
        }
        if (e.pos.x > PITCH_WIDTH) {
          if (Math.abs(e.pos.y - PITCH_HEIGHT/2) < GOAL_SIZE/2) {
            handleGoal('player');
          } else {
            // Out of goal line (AI's side)
            if (lastTouchTeam.current === 'ai') {
              handleOutOfBounds('korner'); // Defending team touched it -> Corner for Player
            } else {
              handleOutOfBounds('aut'); // Attacking team touched it -> Goal Kick for AI
            }
          }
          return;
        }
      }

      // Wall Collisions for Players
      if (e !== ball) {
        if (e.pos.x < e.radius) e.pos.x = e.radius;
        if (e.pos.x > PITCH_WIDTH - e.radius) e.pos.x = PITCH_WIDTH - e.radius;
        if (e.pos.y < e.radius) e.pos.y = e.radius;
        if (e.pos.y > PITCH_HEIGHT - e.radius) e.pos.y = PITCH_HEIGHT - e.radius;
      }
    });

    // Collisions
    for (let i = 0; i < allEntities.length; i++) {
      for (let j = i + 1; j < allEntities.length; j++) {
        checkCollision(allEntities[i], allEntities[j]);
      }
    }
  };

  const handleGoal = (scorer: 'player' | 'ai', remote = false) => {
    const newScore = { ...score, [scorer]: score[scorer] + 1 };
    setScore(newScore);
    setLastScorer(scorer);
    setOutType(null);
    
    if (isMultiplayer && !remote) {
      wsRef.current?.send(JSON.stringify({ type: 'GOAL', matchId, scorer: role }));
    }

    if (newScore[scorer] >= 5) {
      setGameState('gameover');
    } else {
      setGameState('goal');
      setTimeout(() => {
        resetPositions();
        setGameState('playing');
      }, 2000);
    }
  };

  const handleOutOfBounds = (type: 'tac' | 'korner' | 'aut') => {
    setGameState('goal');
    setLastScorer(null);
    setOutType(type);
    
    // If it's a throw-in (tac) and AI knocked it out
    if (type === 'tac' && lastTouchTeam.current === 'ai') {
      setIsAIPassive(true);
    }

    setTimeout(() => {
      resetPositions(); // Simple reset for now
      setGameState('playing');
      setOutType(null);
    }, 1500);
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
    
    // Pitch
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Grass Stripes
    ctx.fillStyle = '#14532d';
    for (let i = 0; i < PITCH_WIDTH; i += 100) {
      if ((i / 100) % 2 === 0) ctx.fillRect(i, 0, 50, PITCH_HEIGHT);
    }

    // Markings
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, PITCH_WIDTH - 40, PITCH_HEIGHT - 40);
    
    // Center Line
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH / 2, 20);
    ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT - 20);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty Areas
    ctx.strokeRect(20, (PITCH_HEIGHT - 400) / 2, 150, 400);
    ctx.strokeRect(PITCH_WIDTH - 170, (PITCH_HEIGHT - 400) / 2, 150, 400);

    // Goals
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, (PITCH_HEIGHT - GOAL_SIZE) / 2, 20, GOAL_SIZE);
    ctx.fillRect(PITCH_WIDTH - 20, (PITCH_HEIGHT - GOAL_SIZE) / 2, 20, GOAL_SIZE);

    // Entities
    const allEntities = [
      { ...playerRef.current, isPlayer: true },
      ...teammatesRef.current.map(t => ({ ...t, isTeammate: true })),
      ...opponentsRef.current.map(o => ({ ...o, isOpponent: true })),
      ballRef.current
    ];

    allEntities.forEach(e => {
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.fill();
      
      // Shadow
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Player Indicator
      if ('isPlayer' in e) {
        ctx.beginPath();
        ctx.moveTo(e.pos.x, e.pos.y - 30);
        ctx.lineTo(e.pos.x - 10, e.pos.y - 45);
        ctx.lineTo(e.pos.x + 10, e.pos.y - 45);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      update();
      draw(ctx);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [gameState, draw, isMultiplayer, role, matchId]);

  const startGame = () => {
    setScore({ player: 0, ai: 0 });
    
    // Apply team stats
    playerRef.current.color = careerData.myTeam.color;
    playerRef.current.mass = careerData.myTeam.mass;

    // Calculate team average rating for speed boost
    const avgRating = careerData.squad.reduce((acc, p) => acc + p.rating, 0) / careerData.squad.length;
    const speedBoost = (avgRating - 80) * 0.005;
    playerRef.current.mass = careerData.myTeam.mass - (avgRating - 80) * 0.01;

    teammatesRef.current.forEach(tm => {
      tm.color = careerData.myTeam.color;
    });

    const opponentTeam = ALL_TEAMS.find(t => t.id !== careerData.myTeam.id) || ALL_TEAMS[1];
    opponentsRef.current.forEach(op => {
      op.color = opponentTeam.color;
    });
    
    resetPositions();
    setGameState('playing');
  };

  const openMarket = () => {
    setPreviousState(gameState);
    setGameState('transfer_market');
  };

  const openSquad = () => {
    setPreviousState(gameState);
    setGameState('squad_management');
  };

  const addCheatMoney = () => {
    setCareerData(prev => ({
      ...prev,
      money: prev.money + 100000000
    }));
  };

  const addCheatDiamonds = () => {
    setCareerData(prev => ({
      ...prev,
      diamonds: prev.diamonds + 1000
    }));
  };

  const buyPlayer = (player: PlayerStats) => {
    if (isAdmin || careerData.money >= player.value) {
      setCareerData(prev => ({
        ...prev,
        money: isAdmin ? prev.money : prev.money - player.value,
        squad: [...prev.squad, player]
      }));
      setTransferPlayer(player);
    } else {
      alert('Yetersiz bütçe!');
    }
  };

  const buyDiamonds = (amount: number, cost: number) => {
    if (careerData.money >= cost) {
      setCareerData(prev => ({
        ...prev,
        money: prev.money - cost,
        diamonds: prev.diamonds + amount
      }));
      alert(`${amount} Elmas satın alındı!`);
    } else {
      alert('Yetersiz bütçe!');
    }
  };

  const buyPack = (packType: 'bronze' | 'silver' | 'gold' | 'diamond') => {
    const costs = { bronze: 10, silver: 50, gold: 200, diamond: 500 };
    const cost = costs[packType];

    if (careerData.diamonds >= cost) {
      setCareerData(prev => ({
        ...prev,
        diamonds: prev.diamonds - cost
      }));

      // Random player logic based on pack
      let minRating = 70;
      let maxRating = 80;
      if (packType === 'silver') { minRating = 75; maxRating = 85; }
      if (packType === 'gold') { minRating = 82; maxRating = 90; }
      if (packType === 'diamond') { minRating = 86; maxRating = 95; }

      const filteredPool = TRANSFER_POOL.filter(p => p.rating >= minRating && p.rating <= maxRating);
      const randomPlayer = filteredPool[Math.floor(Math.random() * filteredPool.length)] || TRANSFER_POOL[0];
      
      // Start animation
      setOpenedPackPlayer(randomPlayer);
      setIsOpeningPack(true);
      setPackRevealStep(0);

      // Animation sequence
      const timeouts: number[] = [];
      timeouts.push(window.setTimeout(() => setPackRevealStep(1), 1500)); // Show Flag
      timeouts.push(window.setTimeout(() => setPackRevealStep(2), 3000)); // Show Club
      timeouts.push(window.setTimeout(() => setPackRevealStep(3), 4500)); // Show Position
      timeouts.push(window.setTimeout(() => {
        setPackRevealStep(4); // Show Player
        setCareerData(prev => ({
          ...prev,
          squad: [...prev.squad, { ...randomPlayer, id: `pack_${Date.now()}` }]
        }));
      }, 6000));

      (window as any)._packTimeouts = timeouts;
    } else {
      alert('Yetersiz elmas!');
    }
  };

  const skipPackAnimation = () => {
    if ((window as any)._packTimeouts) {
      (window as any)._packTimeouts.forEach((t: number) => clearTimeout(t));
    }
    setPackRevealStep(4);
    if (openedPackPlayer && !careerData.squad.some(p => p.name === openedPackPlayer.name && p.id.startsWith('pack_'))) {
       setCareerData(prev => ({
          ...prev,
          squad: [...prev.squad, { ...openedPackPlayer, id: `pack_${Date.now()}` }]
        }));
    }
  };

  const sellPlayer = (playerId: string) => {
    const player = careerData.squad.find(p => p.id === playerId);
    if (!player) return;
    if (careerData.squad.length <= 11) {
      alert('Kadroda en az 11 oyuncu bulunmalıdır!');
      return;
    }
    setCareerData(prev => ({
      ...prev,
      money: prev.money + player.value * 0.8, // 20% tax
      squad: prev.squad.filter(p => p.id !== playerId)
    }));
    alert(`${player.name} satıldı!`);
  };

  const finishMatch = () => {
    const isWin = score.player > score.ai;
    const isDraw = score.player === score.ai;
    
    let reward = 500000; // Base reward
    if (isWin) reward += 2000000;
    if (isDraw) reward += 500000;

    setCareerData(prev => ({
      ...prev,
      money: prev.money + reward,
      week: prev.week + 1,
      wins: prev.wins + (isWin ? 1 : 0),
      draws: prev.draws + (isDraw ? 1 : 0),
      losses: prev.losses + (!isWin && !isDraw ? 1 : 0),
    }));
    
    setGameState('career_hub');
  };

  const sendInvite = () => {
    if (!inviteId) return;
    wsRef.current?.send(JSON.stringify({ type: 'INVITE', targetId: inviteId }));
  };

  const acceptInvite = () => {
    if (!pendingInvite) return;
    wsRef.current?.send(JSON.stringify({ type: 'ACCEPT_INVITE', fromId: pendingInvite }));
    setPendingInvite(null);
  };

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Joystick Logic
  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== 'playing') return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;
    
    const normalizedDist = Math.min(1, dist / maxDist);
    const angle = Math.atan2(dy, dx);
    
    joystickRef.current = {
      x: Math.cos(angle) * normalizedDist,
      y: Math.sin(angle) * normalizedDist
    };
  };

  const stopJoystick = () => {
    joystickRef.current = { x: 0, y: 0 };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-2 md:p-4 overflow-hidden touch-none font-sans">
      {/* Career Stats Bar */}
      {gameState === 'career_hub' && (
        <div className="w-full max-w-5xl flex justify-between items-center mb-4 bg-neutral-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center" style={{ backgroundColor: careerData.myTeam.color }}>
              <span className="text-xs font-black">{careerData.myTeam.id.toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-lg font-black italic">{careerData.myTeam.name}</h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest">Hafta {careerData.week} | Süper Lig</p>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Bütçe</p>
              <p className="text-xl font-mono font-black text-emerald-400">{careerData.money.toLocaleString()} ₺</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Elmas</p>
              <p className="text-xl font-mono font-black text-blue-400 flex items-center gap-1 justify-end">
                <Gem size={16} /> {careerData.diamonds.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">G/B/M</p>
              <p className="text-xl font-mono font-black">{careerData.wins}/{careerData.draws}/{careerData.losses}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 md:mb-8 flex items-center gap-6 md:gap-12 relative">
        <button 
          onClick={() => setIs3D(!is3D)}
          className={`absolute -top-12 right-0 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-2 transition-all ${is3D ? 'bg-orange-600 text-white' : 'bg-neutral-800/50 text-neutral-400'}`}
        >
          <Box size={14} />
          {is3D ? '3D GÖRÜNÜM' : '2D GÖRÜNÜM'}
        </button>
        {isMobile && (
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className="absolute -top-12 left-0 px-4 py-2 bg-neutral-800/50 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10"
          >
            Panel {isAdmin ? 'Kapat' : 'Aç'}
          </button>
        )}
        <div className="text-center">
          <div className="text-[10px] md:text-sm uppercase tracking-widest text-blue-400 font-bold mb-1">
            {selectedTeam.name}
          </div>
          <div className="text-3xl md:text-6xl font-black font-mono">{score.player}</div>
        </div>
        <div className="text-2xl md:text-4xl font-light text-neutral-500">:</div>
        <div className="text-center">
          <div className="text-[10px] md:text-sm uppercase tracking-widest text-red-400 font-bold mb-1">
            Rakip
          </div>
          <div className="text-3xl md:text-6xl font-black font-mono">{score.ai}</div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full max-w-[1200px] aspect-[12/8] max-h-[70vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-neutral-800 bg-green-950">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-[100] flex flex-col gap-2">
            <div className="bg-blue-600/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-3">Admin Paneli</h4>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setIs3D(!is3D)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${is3D ? 'bg-orange-500' : 'bg-white/10'}`}
                >
                  3D MODU: {is3D ? 'AÇIK' : 'KAPALI'}
                </button>
                <button 
                  onClick={addCheatMoney}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all"
                >
                  +100M ₺ EKLE
                </button>
                <button 
                  onClick={addCheatDiamonds}
                  className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                >
                  +1000 ELMAS EKLE
                </button>
                <button 
                  onClick={() => setIsAdmin(false)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-[10px] font-bold transition-all"
                >
                  PANELİ KAPAT
                </button>
              </div>
            </div>
          </div>
        )}
        {is3D ? (
          <ThreeDView 
            playerRef={playerRef}
            ballRef={ballRef}
            teammatesRef={teammatesRef}
            opponentsRef={opponentsRef}
            pitchWidth={PITCH_WIDTH}
            pitchHeight={PITCH_HEIGHT}
            selectedTeam={selectedTeam}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={PITCH_WIDTH}
            height={PITCH_HEIGHT}
            className="w-full h-full object-contain"
          />
        )}

        {gameState === 'playing' && (
          <div className="absolute bottom-4 left-4 z-50 flex gap-2 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">F</kbd>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Şut</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">G</kbd>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Pas</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">R</kbd>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Ara Pas</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">X</kbd>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Sert Şut</span>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {gameState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-xl p-4 text-center overflow-y-auto"
            >
              <div className="mb-12">
                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white">SÜPER LİG <span className="text-blue-500">PRO</span></h1>
                <p className="text-neutral-500 uppercase tracking-[0.5em] text-xs mt-2">11v11 Futbol Simülasyonu</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl">
                {/* Team Selection */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-500">Takımını Seç</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setUclMode(false)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${!uclMode ? 'bg-white text-black' : 'bg-white/5 text-white/50'}`}
                      >
                        Süper Lig
                      </button>
                      <button 
                        onClick={() => setUclMode(true)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${uclMode ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50'}`}
                      >
                        UCL
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {(uclMode ? UCL_TEAMS : ALL_TEAMS).map(team => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${
                          selectedTeam.id === team.id 
                            ? 'border-white bg-white/10 scale-[1.05] shadow-2xl' 
                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full mb-2 flex items-center justify-center border-2 border-white/20" style={{ backgroundColor: team.color }}>
                          <span className="text-xs font-black">{team.id.toUpperCase()}</span>
                        </div>
                        <span className="font-black text-sm">{team.name}</span>
                        {team.isUCL && <span className="text-[8px] text-blue-400 font-bold uppercase mt-1">UCL</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-500 text-left">Oyun Modu</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2 mb-2">
                      {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                            difficulty === d 
                              ? 'bg-white text-black' 
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {d === 'easy' ? 'Kolay' : d === 'medium' ? 'Normal' : 'Zor'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setUclMode(true);
                        setGameState('ucl_menu');
                      }}
                      className="group relative overflow-hidden px-8 py-6 rounded-3xl bg-blue-900 hover:bg-blue-800 transition-all text-left border-2 border-blue-400/30"
                    >
                      <div className="relative z-10">
                        <h4 className="text-xl font-black italic flex items-center gap-2">
                          <Trophy size={20} className="text-blue-400" />
                          CHAMPIONS LEAGUE
                        </h4>
                        <p className="text-xs text-blue-100/70">Avrupa'nın en iyileriyle kapış!</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsOneVsOne(true);
                        startGame();
                      }}
                      className="group relative overflow-hidden px-8 py-6 rounded-3xl bg-orange-600 hover:bg-orange-500 transition-all text-left"
                    >
                      <div className="relative z-10">
                        <h4 className="text-xl font-black italic">1V1 MODU</h4>
                        <p className="text-xs text-orange-100/70">Tek rakibe karşı çok kolay kapışma!</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsOneVsOne(false);
                        setCareerData(prev => ({ ...prev, myTeam: selectedTeam, squad: [...selectedTeam.players] }));
                        setGameState('career_hub');
                      }}
                      className="group relative overflow-hidden px-8 py-6 rounded-3xl bg-emerald-600 hover:bg-emerald-500 transition-all text-left"
                    >
                      <div className="relative z-10">
                        <h4 className="text-xl font-black italic">KARİYER MODU</h4>
                        <p className="text-xs text-emerald-100/70">Takımını şampiyonluğa taşı, transfer yap!</p>
                      </div>
                      <div className="absolute right-[-20px] bottom-[-20px] opacity-20 group-hover:scale-110 transition-transform">
                        <Trophy size={120} />
                      </div>
                    </button>

                    <button
                      onClick={openMarket}
                      className="px-8 py-6 rounded-3xl bg-amber-600 hover:bg-amber-500 transition-all text-left"
                    >
                      <h4 className="text-xl font-black italic">TRANSFER MARKETİ</h4>
                      <p className="text-xs text-amber-100/70">Dünya yıldızlarını kadrona kat!</p>
                    </button>

                    <button
                      onClick={() => {
                        setIsManagerMode(!isManagerMode);
                      }}
                      className={`px-8 py-6 rounded-3xl transition-all text-left border-2 ${isManagerMode ? 'bg-purple-600 border-purple-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <h4 className="text-xl font-black italic">TEKNİK DİREKTÖR MODU</h4>
                      <p className="text-xs opacity-70">{isManagerMode ? 'AKTİF: Takımı kenardan yönetiyorsun!' : 'PASİF: Oyuncuyu sen kontrol ediyorsun.'}</p>
                    </button>

                    <button
                      onClick={() => setIs3D(!is3D)}
                      className={`px-8 py-6 rounded-3xl transition-all text-left border-2 ${is3D ? 'bg-orange-600 border-orange-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <h4 className="text-xl font-black italic">3D GÖRÜNÜM</h4>
                      <p className="text-xs opacity-70">{is3D ? 'AKTİF: Gerçekçi 3D saha ve oyuncular!' : 'PASİF: Klasik 2D kuşbakışı görünüm.'}</p>
                    </button>

                    <button
                      onClick={() => {
                        setPreviousState(gameState);
                        setGameState('store');
                      }}
                      className="px-8 py-6 rounded-3xl bg-purple-600 hover:bg-purple-500 transition-all text-left"
                    >
                      <h4 className="text-xl font-black italic">MAĞAZA</h4>
                      <p className="text-xs text-purple-100/70">Paket aç ve elmas al!</p>
                    </button>

                    <button
                      onClick={() => setGameState('lobby')}
                      className="px-8 py-6 rounded-3xl bg-blue-600 hover:bg-blue-500 transition-all text-left"
                    >
                      <h4 className="text-xl font-black italic">ONLINE MAÇ</h4>
                      <p className="text-xs text-blue-100/70">Gerçek oyunculara karşı 11v11 kapış!</p>
                    </button>
                  </div>

                  {/* Cheat Code Input */}
                  <div className="mt-8 flex flex-col gap-2">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-600 text-left">GİZLİ KOD</h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={cheatCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheatCode(val);
                          const upper = val.toUpperCase();
                          if (upper === 'ADMİN' || upper === 'ADMIN') {
                            setIsAdmin(true);
                            alert('ADMİN MODU AKTİF! Tüm oyuncular ücretsiz!');
                          }
                        }}
                        placeholder="Kodu girin..."
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-full"
                      />
                      {isAdmin && (
                        <div className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center">
                          AKTİF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'ucl_menu' && (
            <motion.div
              key="ucl_menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-950/95 flex flex-col items-center justify-center backdrop-blur-xl p-8 text-center overflow-y-auto"
            >
              <div className="mb-12">
                <Trophy size={80} className="text-blue-400 mx-auto mb-4" />
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">UCL <span className="text-blue-400">CHAMPIONS</span></h1>
                <p className="text-blue-300/60 uppercase tracking-[0.5em] text-xs mt-2">Avrupa Devleri Arenası</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl mb-12">
                {UCL_TEAMS.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all ${
                      selectedTeam.id === team.id 
                        ? 'border-blue-400 bg-blue-400/20 scale-[1.05] shadow-[0_0_30px_rgba(96,165,250,0.3)]' 
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center border-2 border-white/20 shadow-xl" style={{ backgroundColor: team.color }}>
                      <span className="text-sm font-black text-black">{team.id.toUpperCase()}</span>
                    </div>
                    <span className="font-black text-sm text-white">{team.name}</span>
                    <div className="mt-2 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${i < Math.floor(team.speed * 10) - 3 ? 'bg-blue-400' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setGameState('menu')}
                  className="px-12 py-5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all font-black text-xl"
                >
                  GERİ
                </button>
                <button
                  onClick={() => {
                    setCareerData(prev => ({ ...prev, myTeam: selectedTeam, squad: [...selectedTeam.players] }));
                    startGame();
                  }}
                  className="px-12 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all font-black text-xl shadow-2xl shadow-blue-500/20"
                >
                  MAÇA BAŞLA
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'career_hub' && (
            <motion.div
              key="career"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-neutral-950/95 flex flex-col p-8 backdrop-blur-2xl"
            >
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-4xl font-black italic mb-2">KARİYER MERKEZİ</h2>
                  <div className="flex gap-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase">Süper Lig</span>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase">Aktif Sezon</span>
                  </div>
                </div>
                <button onClick={() => setGameState('menu')} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <RotateCcw size={24} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-8 flex-1">
                {/* Squad List */}
                <div className="col-span-1 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-neutral-500 mb-6">Kadro ({careerData.squad.length})</h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {careerData.squad.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-[10px] font-bold">{p.position}</span>
                          <div>
                            <p className="text-sm font-bold">{p.name}</p>
                            <p className="text-[10px] text-neutral-500">Reyting: {p.rating}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-mono text-emerald-400">{(p.value / 1000000).toFixed(1)}M ₺</p>
                          <button 
                            onClick={() => sellPlayer(p.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-all"
                          >
                            Sat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Match & Actions */}
                <div className="col-span-2 space-y-8">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-100/70 mb-4">Sıradaki Maç</p>
                      <div className="flex items-center gap-12">
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 mb-3 mx-auto">
                            <span className="text-2xl font-black">{careerData.myTeam.id.toUpperCase()}</span>
                          </div>
                          <p className="font-black">{careerData.myTeam.name}</p>
                        </div>
                        <div className="text-4xl font-black italic text-white/50">VS</div>
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-black/20 flex items-center justify-center border-4 border-white/10 mb-3 mx-auto">
                            <span className="text-2xl font-black">FB</span>
                          </div>
                          <p className="font-black">Fenerbahçe</p>
                        </div>
                      </div>
                      <button 
                        onClick={startGame}
                        className="mt-8 w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                      >
                        MAÇA ÇIK
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={openSquad}
                      className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-left group"
                    >
                      <h4 className="text-2xl font-black italic mb-2">KADRO</h4>
                      <p className="text-xs text-neutral-500">Takım dizilişini ve oyuncularını yönet.</p>
                    </button>
                    <button 
                      onClick={openMarket}
                      className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-left group"
                    >
                      <h4 className="text-2xl font-black italic mb-2">TRANSFER</h4>
                      <p className="text-xs text-neutral-500">Yeni yıldızlar keşfet, kadronu güçlendir.</p>
                    </button>
                    <button 
                      onClick={() => {
                        setPreviousState(gameState);
                        setGameState('store');
                      }}
                      className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl border border-blue-500/30 hover:bg-white/10 transition-all text-left group relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <h4 className="text-2xl font-black italic mb-2">MAĞAZA</h4>
                        <p className="text-xs text-neutral-500">Paket aç, elmas satın al!</p>
                      </div>
                      <div className="absolute right-[-10px] bottom-[-10px] opacity-20 group-hover:scale-110 transition-transform">
                        <ShoppingBag size={80} />
                      </div>
                    </button>
                    <button className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-left">
                      <h4 className="text-2xl font-black italic mb-2">ANTRENMAN</h4>
                      <p className="text-xs text-neutral-500">Oyuncularının reytinglerini yükselt.</p>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md p-6"
            >
              <div className="w-full max-w-md bg-white/5 rounded-3xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black italic">ONLINE ARENA</h2>
                  <button onClick={() => setGameState('menu')} className="text-neutral-500 hover:text-white">İptal</button>
                </div>

                <div className="mb-8 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Senin ID</p>
                    <p className="text-2xl font-mono font-black">{myId}</p>
                  </div>
                  <button 
                    onClick={copyId}
                    className="p-3 bg-blue-500 rounded-xl hover:bg-blue-400 transition-colors"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2">Arkadaşını Davet Et</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Arkadaş ID gir"
                        value={inviteId}
                        onChange={(e) => setInviteId(e.target.value.toUpperCase())}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={sendInvite}
                        className="bg-blue-600 hover:bg-blue-500 px-6 rounded-xl font-bold transition-colors"
                      >
                        Davet Et
                      </button>
                    </div>
                  </div>

                  {pendingInvite && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-green-400">Davet Geldi: {pendingInvite}</p>
                      </div>
                      <button 
                        onClick={acceptInvite}
                        className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg font-bold text-sm"
                      >
                        Kabul Et
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'goal' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                key="goal"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="bg-white text-black px-12 py-6 rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.3)] transform -rotate-3 mb-8"
              >
                <h2 className="text-8xl font-black italic tracking-tighter">
                  {outType === 'tac' ? 'TAÇ!' : outType === 'korner' ? 'KORNER!' : outType === 'aut' ? 'AUT!' : 'DIŞARI!'}
                </h2>
                <p className="text-center font-bold text-2xl uppercase tracking-[0.3em] mt-2">
                  {outType ? 'OYUN DURDU' : (lastScorer === 'player' ? 'MÜKEMMEL GOL!' : 'RAKİP ATTI!')}
                </p>
              </motion.div>
              
              {!outType && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onClick={openMarket}
                  className="pointer-events-auto flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-8 py-4 rounded-2xl transition-all shadow-2xl text-xl font-black italic"
                >
                  <Users size={24} />
                  <span>ADAM SATIN AL</span>
                </motion.button>
              )}
            </div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md p-4 text-center"
            >
              <Trophy size={isMobile ? 60 : 120} className={score.player > score.ai ? 'text-yellow-400' : 'text-neutral-600'} />
              <h2 className="text-6xl md:text-8xl font-black mt-4 mb-2 italic">
                {score.player > score.ai ? 'ŞAMPİYON!' : 'MAĞLUBİYET'}
              </h2>
              <p className="text-neutral-400 mb-12 text-2xl">
                Maç Sonucu: {score.player} - {score.ai}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={finishMatch}
                  className="flex items-center gap-3 bg-white text-black px-12 py-5 rounded-full font-black text-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <RotateCcw size={24} /> DEVAM ET
                </button>
                <button
                  onClick={openMarket}
                  className="flex items-center gap-3 bg-amber-600 text-white px-12 py-5 rounded-full font-black text-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <Users size={24} /> ADAM SATIN AL
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'squad_management' && (
            <motion.div
              key="squad"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute inset-0 bg-neutral-950/98 flex flex-col p-8 backdrop-blur-3xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-black italic">KADRO YÖNETİMİ</h2>
                  <p className="text-neutral-400">Takımındaki tüm oyuncular ve detaylı istatistikler.</p>
                </div>
                <button 
                  onClick={() => setGameState(previousState)} 
                  className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold"
                >
                  Geri Dön
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-4">
                {careerData.squad.map((player, idx) => (
                  <div key={player.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between hover:border-purple-500/50 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center text-2xl font-black text-purple-400 border border-white/10">
                        {player.rating}
                      </div>
                      <div>
                        <h4 className="text-xl font-black">{player.name}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase">{player.position}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold uppercase">Formda</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-500 uppercase tracking-widest font-bold mb-1">Piyasa Değeri</p>
                      <p className="text-xl font-mono font-black text-emerald-400">{(player.value / 1000000).toFixed(1)}M ₺</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'transfer_market' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-neutral-950/98 flex flex-col p-8 backdrop-blur-3xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-black italic">TRANSFER MARKETİ</h2>
                  <p className="text-emerald-400 font-mono font-bold">Mevcut Bütçe: {careerData.money.toLocaleString()} ₺</p>
                  {isAdmin && <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1">Admin Modu Aktif - Tüm Oyuncular Ücretsiz</p>}
                </div>
                <button onClick={() => setGameState(previousState)} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold">Geri Dön</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-4">
                {TRANSFER_POOL.filter(tp => !careerData.squad.some(s => s.id === tp.id)).map(player => (
                  <div key={player.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 hover:border-blue-500/50 transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase mb-2 inline-block">{player.position}</span>
                        <h4 className="text-xl font-black">{player.name}</h4>
                        <p className="text-neutral-500 text-sm">Reyting: {player.rating}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-mono font-black text-emerald-400">{(player.value / 1000000).toFixed(1)}M ₺</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyPlayer(player)}
                      disabled={!isAdmin && careerData.money < player.value}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${
                        isAdmin || careerData.money >= player.value 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {isAdmin ? 'Ücretsiz Transfer' : (careerData.money >= player.value ? 'Transfer Et' : 'Yetersiz Bütçe')}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'store' && (
            <motion.div
              key="store"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-neutral-950/98 flex flex-col p-8 backdrop-blur-3xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-black italic">ELMAS MAĞAZASI</h2>
                  <div className="flex gap-4 mt-2">
                    <p className="text-emerald-400 font-mono font-bold">Bütçe: {careerData.money.toLocaleString()} ₺</p>
                    <p className="text-blue-400 font-mono font-bold flex items-center gap-1">
                      <Gem size={16} /> {careerData.diamonds.toLocaleString()} Elmas
                    </p>
                  </div>
                </div>
                <button onClick={() => setGameState(previousState)} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold">Geri Dön</button>
              </div>

              <div className="space-y-12">
                {/* Player Packs */}
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] font-black text-neutral-500 mb-6 flex items-center gap-2">
                    <ShoppingBag size={14} /> OYUNCU PAKETLERİ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { type: 'bronze', name: 'Bronz Paket', desc: '70-80 Reyting Oyuncu', cost: 10, color: 'from-orange-700 to-orange-900' },
                      { type: 'silver', name: 'Gümüş Paket', desc: '75-85 Reyting Oyuncu', cost: 50, color: 'from-neutral-400 to-neutral-600' },
                      { type: 'gold', name: 'Altın Paket', desc: '82-90 Reyting Oyuncu', cost: 200, color: 'from-yellow-500 to-yellow-700' },
                      { type: 'diamond', name: 'Elmas Paket', desc: '86-95 Reyting Oyuncu', cost: 500, color: 'from-blue-400 to-blue-600' },
                    ].map((pack) => (
                      <div key={pack.type} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col items-center text-center hover:border-white/20 transition-all group">
                        <div className={`w-24 h-32 bg-gradient-to-br ${pack.color} rounded-xl mb-4 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Zap size={40} className="text-white/50" />
                        </div>
                        <h4 className="text-xl font-black italic mb-1">{pack.name}</h4>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold mb-6">{pack.desc}</p>
                        <button 
                          onClick={() => buyPack(pack.type as any)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black flex items-center justify-center gap-2 transition-all"
                        >
                          <Gem size={14} /> {pack.cost}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Diamond Packs */}
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] font-black text-neutral-500 mb-6 flex items-center gap-2">
                    <Gem size={14} /> ELMAS SATIN AL
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { amount: 100, cost: 1000000, color: 'bg-blue-500/10' },
                      { amount: 500, cost: 4000000, color: 'bg-blue-500/20' },
                      { amount: 1000, cost: 7500000, color: 'bg-blue-500/30' },
                    ].map((pack) => (
                      <div key={pack.amount} className={`${pack.color} border border-blue-500/20 rounded-3xl p-8 flex justify-between items-center hover:border-blue-500/50 transition-all`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Gem className="text-blue-400" />
                            <h4 className="text-3xl font-black italic">{pack.amount}</h4>
                          </div>
                          <p className="text-xs text-blue-400/70 font-bold uppercase tracking-widest">ELMAS PAKETİ</p>
                        </div>
                        <button 
                          onClick={() => buyDiamonds(pack.amount, pack.cost)}
                          className="px-6 py-4 bg-white text-blue-900 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl"
                        >
                          {pack.cost.toLocaleString()} ₺
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 md:mt-8 flex gap-4 items-center w-full max-w-[1200px] justify-between px-4">
        <div className="flex gap-2">
          <button
            onClick={() => setGameState(gameState === 'playing' ? 'career_hub' : 'playing')}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
          >
            {gameState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
            <span>{gameState === 'playing' ? 'Durdur' : 'Devam Et'}</span>
          </button>
          
          {gameState === 'playing' && (
            <div className="flex gap-2">
              <button
                onClick={openSquad}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
              >
                <Users size={18} />
                <span>Kadro</span>
              </button>
              <button
                onClick={openMarket}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-4 py-3 rounded-xl transition-colors text-sm font-bold"
              >
                <UserPlus size={18} />
                <span>Adam Satın Al</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Joystick */}
        {isMobile && gameState === 'playing' && (
          <div 
            className="relative w-32 h-32 bg-white/5 rounded-full border-2 border-white/10 flex items-center justify-center touch-none"
            onTouchStart={handleJoystickMove}
            onTouchMove={handleJoystickMove}
            onTouchEnd={stopJoystick}
            onMouseDown={handleJoystickMove}
            onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e)}
            onMouseUp={stopJoystick}
            onMouseLeave={stopJoystick}
          >
            <motion.div 
              className="w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20"
              animate={{
                x: joystickRef.current.x * 40,
                y: joystickRef.current.y * 40
              }}
              transition={{ type: 'spring', damping: 12, stiffness: 250 }}
            >
              <Move size={20} className="text-white" />
            </motion.div>
          </div>
        )}
        {/* Pack Opening Animation */}
        <AnimatePresence>
          {isOpeningPack && openedPackPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden"
            >
              {/* Cinematic Background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
                
                {/* Dynamic Light Beams */}
                <motion.div 
                  animate={{ 
                    rotate: 360,
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] opacity-10"
                  style={{ background: 'conic-gradient(from 0deg, transparent, #3b82f6, transparent, #60a5fa, transparent, #3b82f6, transparent)' }}
                />

                {/* Particle Field */}
                <div className="absolute inset-0 opacity-30">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: '110%', x: `${Math.random() * 100}%`, opacity: 0 }}
                      animate={{ y: '-10%', opacity: [0, 1, 0] }}
                      transition={{ 
                        duration: 2 + Math.random() * 3, 
                        repeat: Infinity, 
                        delay: Math.random() * 5 
                      }}
                      className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
                    />
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
                {/* Skip Button */}
                {packRevealStep < 4 && (
                  <button 
                    onClick={skipPackAnimation}
                    className="absolute top-8 right-8 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black tracking-widest transition-all z-50"
                  >
                    GEÇ (SKIP)
                  </button>
                )}

                {/* Pack Reveal Container */}
                <div className="w-full h-[600px] relative flex flex-col items-center justify-center">
                  
                  {/* Step 0: Initial Glow/Pack */}
                  {packRevealStep === 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <motion.div 
                        animate={{ 
                          boxShadow: ["0 0 20px rgba(37,99,235,0.3)", "0 0 60px rgba(37,99,235,0.6)", "0 0 20px rgba(37,99,235,0.3)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-56 h-72 bg-gradient-to-br from-blue-600 via-indigo-900 to-black rounded-3xl flex items-center justify-center border-4 border-white/20 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
                        <Zap size={100} className="text-white/50 relative z-10" />
                      </motion.div>
                      <h2 className="mt-12 text-3xl font-black italic tracking-[0.3em] text-white animate-pulse">PAKET AÇILIYOR...</h2>
                    </motion.div>
                  )}

                  {/* Step 1: Flag (Nationality) */}
                  <AnimatePresence>
                    {packRevealStep === 1 && (
                      <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1.5 }}
                        exit={{ y: -100, opacity: 0, scale: 2 }}
                        className="absolute flex flex-col items-center"
                      >
                        <div className="text-8xl mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                          {NATION_FLAGS[openedPackPlayer.nationality || ''] || '🌍'}
                        </div>
                        <div className="px-8 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                          <span className="text-2xl font-black tracking-[0.2em] text-white uppercase italic">
                            {openedPackPlayer.nationality?.toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 2: Club (Team) */}
                  <AnimatePresence>
                    {packRevealStep === 2 && (
                      <motion.div
                        initial={{ x: -200, opacity: 0, rotate: -10 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        exit={{ x: 200, opacity: 0, rotate: 10 }}
                        className="absolute flex flex-col items-center"
                      >
                        <div className="w-32 h-32 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center border-4 border-white/20 mb-6 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                          <ShoppingBag size={64} className="text-white/50" />
                        </div>
                        <div className="px-10 py-5 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-3xl border-2 border-white/10 shadow-2xl">
                          <span className="text-4xl font-black italic text-white tracking-tight">
                            {openedPackPlayer.club?.toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 3: Position (Mevki) */}
                  <AnimatePresence>
                    {packRevealStep === 3 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 3, opacity: 0 }}
                        className="absolute flex flex-col items-center"
                      >
                        <div className="text-[12rem] font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                          {openedPackPlayer.position}
                        </div>
                        <div className="mt-4 px-12 py-2 bg-amber-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                          <span className="text-sm font-black tracking-[0.5em] text-black">POZİSYON</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 4: Final Reveal (Player Card) */}
                  {packRevealStep >= 4 && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                    >
                      {/* Card Glow Effect */}
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute w-96 h-[500px] bg-yellow-500/20 blur-[100px] rounded-full"
                      />

                      <div className="w-80 h-[480px] bg-gradient-to-b from-yellow-300 via-yellow-600 to-yellow-900 rounded-[3rem] p-1.5 border-4 border-yellow-200 shadow-[0_0_150px_rgba(234,179,8,0.4)] overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        
                        {/* Shimmer Effect */}
                        <motion.div 
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                        />

                        <div className="relative h-full flex flex-col items-center pt-10">
                          <div className="flex items-start justify-between w-full px-10 mb-2">
                            <div className="flex flex-col items-center">
                              <div className="text-7xl font-black italic text-white drop-shadow-2xl leading-none">{openedPackPlayer.rating}</div>
                              <div className="text-lg font-bold text-yellow-100 uppercase tracking-widest mt-1">{openedPackPlayer.position}</div>
                            </div>
                            <div className="text-4xl">{NATION_FLAGS[openedPackPlayer.nationality || ''] || '🌍'}</div>
                          </div>
                          
                          <div className="w-44 h-44 bg-gradient-to-b from-white/20 to-transparent rounded-full flex items-center justify-center border-4 border-white/20 mb-8 shadow-inner">
                            <Users size={96} className="text-white/40" />
                          </div>

                          <div className="w-full bg-black/40 backdrop-blur-md py-8 text-center border-y-2 border-yellow-400/30">
                            <h3 className="text-4xl font-black italic text-white tracking-tight drop-shadow-lg">{openedPackPlayer.name.toUpperCase()}</h3>
                          </div>

                          <div className="mt-auto mb-10 flex gap-3">
                            <div className="text-[11px] font-black text-yellow-100 uppercase tracking-widest bg-black/40 px-4 py-1.5 rounded-full border border-white/10">{openedPackPlayer.club}</div>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => {
                          setIsOpeningPack(false);
                          setOpenedPackPlayer(null);
                        }}
                        className="mt-14 px-16 py-5 bg-white text-blue-900 rounded-3xl font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-4 border-neutral-300"
                      >
                        KADROYA KAT
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transfer Screen */}
        <AnimatePresence>
          {transferPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 backdrop-blur-3xl"
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                className="max-w-md w-full bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(16,185,129,0.3)] border-4 border-white/20 relative overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,white_0%,transparent_70%)] animate-pulse" />
                </div>

                <div className="relative z-10">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 mb-8 mx-auto shadow-2xl">
                    <Trophy size={64} className="text-white" />
                  </div>
                  
                  <h2 className="text-sm uppercase tracking-[0.5em] font-black text-emerald-200 mb-2">YENİ TRANSFER!</h2>
                  <h3 className="text-5xl font-black italic text-white mb-6 leading-tight">{transferPlayer?.name?.toUpperCase()}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <p className="text-[10px] uppercase font-bold text-emerald-200/70 mb-1">Reyting</p>
                      <p className="text-3xl font-black">{transferPlayer?.rating}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <p className="text-[10px] uppercase font-bold text-emerald-200/70 mb-1">Pozisyon</p>
                      <p className="text-3xl font-black">{transferPlayer?.position}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTransferPlayer(null)}
                    className="w-full py-5 bg-white text-emerald-700 rounded-2xl font-black text-xl hover:scale-[1.05] active:scale-95 transition-all shadow-2xl"
                  >
                    KADROYA KAT
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
