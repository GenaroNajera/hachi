const { WebSocketServer } = require('ws');
const server = require('http').createServer();

const wss = new WebSocketServer({ server });

const players = {};
/*
{
  playerID: {
    roomID: string,
    color: string,
    score: number,
    moves: number
  }
}
*/

const rooms = {};
/*
{
  roomID: {
    board: [{ value: number, bgColor: string }],
    players: [ws, ws],
    turnPlayer: number,
    winner: boolean
  }
}
*/

const turnPlayer = ['blue', 'red'];
let idCounter = 0;
let roomidCounter = 0;

// FUNCTIONS //

function findRoom(player) {
  return rooms[players[player].roomID];
}

function findOpponent(player) {
  return players[findRoom(player).players.find(elem => elem.playerID !== player).playerID];
}

function findWinner(room) {
  let cond = rooms[room].players.every(elem => players[elem.playerID].moves === 0);
  let blueScore = players[rooms[room].players[0].playerID].score;
  let redScore = players[rooms[room].players[1].playerID].score;
  if(cond)
    rooms[room].winner = true;

  return cond ?
    blueScore > redScore ? 'Blue wins'
    : blueScore < redScore ? 'Red wins'
    : 'Draw'
    : '-1';
}

function removeFromRoom(player) {
  let index = findRoom(player.playerID).players.indexOf(player);
  findRoom(player.playerID).players.splice(index, 1);

  if(findRoom(player.playerID).players.length === 0)
    delete rooms[players[player.playerID].roomID];
}

function conquer(board, i, curPlayer, opponent) {
  board[i].bgColor = curPlayer.color;
  curPlayer.score += board[i].value;
  opponent.score -= board[i].value;


  if(i % 8 !== 0 && board[i - 1].bgColor === opponent.color)
    conquer(board, i - 1, curPlayer, opponent);

  if(Math.floor(i / 8) !== 0 && board[i - 8].bgColor === opponent.color)
    conquer(board, i - 8, curPlayer, opponent);

  if(i % 8 !== 7 && board[i + 1].bgColor === opponent.color)
    conquer(board, i + 1, curPlayer, opponent);

  if(Math.floor(i / 8) !== 7 && board[i + 8].bgColor === opponent.color)
    conquer(board, i + 8, curPlayer, opponent); 
}

// WEBSOCKETSERVER //

wss.on('connection', ws => {
  ws.playerID = idCounter++;
  players[ws.playerID] = {};

  ws.on('close', () => {
    if(players[ws.playerID].roomID !== undefined) {
      removeFromRoom(ws);

      if(findRoom(ws.playerID)) {
        findRoom(ws.playerID).winner = true;
        
        findRoom(ws.playerID).players[0].send(JSON.stringify({
          response: 'error',
          info: 'opponent disconnected',
          displayHomeButton: true
        }));
      }
    }

    delete players[ws.playerID];
  });

  ws.on('message', message => {
    let msg = JSON.parse(message);

    if(msg.request === 'create') {
      let roomID = roomidCounter++;
      let board = new Array(64).fill(0).map(() => {
        return {
          value: Math.floor(Math.random() * 100) + 1,
          bgColor: ''
        };
      });

      rooms[roomID] = {
        board,
        players: [ws],
        turnPlayer: 0
      };

      players[ws.playerID] = {
        roomID,
        color: 'blue',
        score: 0,
        moves: 8
      };

      ws.send(JSON.stringify({
        response: 'create',
        roomID,
        board
      }));
    }

    if(msg.request === 'join') {
      if(!rooms[msg.roomID] || rooms[msg.roomID].winner) {
        ws.send(JSON.stringify({
          response: 'error',
          info: 'room doesn\'t exist'
        }));
      } else if(rooms[msg.roomID].players.length === 2) {
        ws.send(JSON.stringify({
          response: 'error',
          info: 'cannot join, room is full'
        }));
      } else {
        rooms[msg.roomID].players.push(ws);

        players[ws.playerID] = {
          roomID: msg.roomID,
          color: 'red',
          score: 0,
          moves: 8
        };

        ws.send(JSON.stringify({
          response: 'join',
          roomID: msg.roomID,
          board: rooms[msg.roomID].board
        }));
      }
    }

    if(msg.request === 'home') {
      removeFromRoom(ws);

      players[ws.playerID].roomID = undefined;
    }

    if(msg.request === 'click') {
      if(findRoom(ws.playerID).players.length !== 2)
        return;

      if(players[ws.playerID].color !== turnPlayer[findRoom(ws.playerID).turnPlayer % 2])
        return;

      if(players[ws.playerID].moves <= 0)
        return;

      if(msg.bgColor === players[ws.playerID].color.toLowerCase())
        return;

      if(msg.bgColor === findOpponent(ws.playerID).color.toLowerCase())
        conquer(findRoom(ws.playerID).board, msg.id, players[ws.playerID], findOpponent(ws.playerID));
      else {
        players[ws.playerID].score += findRoom(ws.playerID).board[msg.id].value;
        findRoom(ws.playerID).board[msg.id].bgColor = players[ws.playerID].color;
      }

      players[ws.playerID].moves--;
      findRoom(ws.playerID).turnPlayer++;

      findRoom(ws.playerID).players.forEach(elem => {
        elem.send(JSON.stringify({
          response: 'update',
          board: findRoom(ws.playerID).board,
          color: players[ws.playerID].color,
          oppoColor: findOpponent(ws.playerID).color,
          score: players[ws.playerID].score,
          oppoScore: findOpponent(ws.playerID).score,
          moves: players[ws.playerID].moves,
          turnPlayer: turnPlayer[findRoom(ws.playerID).turnPlayer % 2],
          winner: findWinner(players[ws.playerID].roomID)
        }));
      });
    }
  });
});

server.listen(8080, () => {
  console.log('server listening on 8080');
});