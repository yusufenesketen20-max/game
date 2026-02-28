import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { nanoid } from 'nanoid';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

// Store active players and matches
const players = new Map<string, { ws: WebSocket; id: string; name: string }>();
const matches = new Map<string, { player1: string; player2: string; state: any }>();

wss.on('connection', (ws) => {
  const playerId = nanoid(6).toUpperCase();
  players.set(playerId, { ws, id: playerId, name: `Player ${playerId}` });

  // Send initial ID to player
  ws.send(JSON.stringify({ type: 'INIT', id: playerId }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'INVITE': {
          const targetId = message.targetId.toUpperCase();
          const target = players.get(targetId);
          if (target && targetId !== playerId) {
            target.ws.send(JSON.stringify({ type: 'INVITE_RECEIVED', fromId: playerId }));
          } else {
            ws.send(JSON.stringify({ type: 'INVITE_ERROR', message: 'Player not found' }));
          }
          break;
        }

        case 'ACCEPT_INVITE': {
          const fromId = message.fromId;
          const fromPlayer = players.get(fromId);
          if (fromPlayer) {
            const matchId = `${fromId}-${playerId}`;
            matches.set(matchId, { player1: fromId, player2: playerId, state: {} });
            
            const matchStart = { type: 'MATCH_START', matchId, role: 'player1', opponentId: playerId };
            fromPlayer.ws.send(JSON.stringify(matchStart));
            
            ws.send(JSON.stringify({ type: 'MATCH_START', matchId, role: 'player2', opponentId: fromId }));
          }
          break;
        }

        case 'GAME_STATE': {
          const { matchId, state } = message;
          const match = matches.get(matchId);
          if (match) {
            const opponentId = match.player1 === playerId ? match.player2 : match.player1;
            const opponent = players.get(opponentId);
            if (opponent) {
              opponent.ws.send(JSON.stringify({ type: 'OPPONENT_STATE', state }));
            }
          }
          break;
        }
        
        case 'GOAL': {
          const { matchId, scorer } = message;
          const match = matches.get(matchId);
          if (match) {
            const opponentId = match.player1 === playerId ? match.player2 : match.player1;
            const opponent = players.get(opponentId);
            if (opponent) {
              opponent.ws.send(JSON.stringify({ type: 'GOAL_SCORED', scorer }));
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error('WS Error:', e);
    }
  });

  ws.on('close', () => {
    players.delete(playerId);
    // Clean up matches involving this player
    for (const [matchId, match] of matches.entries()) {
      if (match.player1 === playerId || match.player2 === playerId) {
        const opponentId = match.player1 === playerId ? match.player2 : match.player1;
        const opponent = players.get(opponentId);
        if (opponent) {
          opponent.ws.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
        }
        matches.delete(matchId);
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
