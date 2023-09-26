const roomId = document.querySelector('#room-id');
const homeButton = document.querySelector('#home-button');
const home = document.querySelector('.home');
const createRoomButton = document.querySelector('#create-room-button');
const joinRoomInput = document.querySelector('#join-room-input');
const joinRoomButton = document.querySelector('#join-room-button');
const header = document.querySelector('.header');
const blue = document.querySelector('.blue');
const blueScore = document.querySelector('#blue-score');
const blueMoves = document.querySelector('#blue-moves');
const red = document.querySelector('.red');
const redScore = document.querySelector('#red-score');
const redMoves = document.querySelector('#red-moves');
const turnPlayer = document.querySelector('#turn-player');
const board = document.querySelector('.board');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('#modal-close');
const modalHeaderText = document.querySelector('#modal-header-text');
const modalBodyBlue = document.querySelector('#modal-body-blue');
const modalBodyRed = document.querySelector('#modal-body-red');
const modalFooterHomeButton = document.querySelector('#modal-footer-home-button');
const errorModal = document.querySelector('.error-modal');
const errorModalClose = document.querySelector('#error-modal-close');
const errorModalText = document.querySelector('#error-modal-text');

// FUNCTIONS //

const joinRoom = () => {
  socket.send(JSON.stringify({
    request: 'join',
    roomID: +joinRoomInput.value
  }));
}

const goHome = () => {
  modal.style.display = 'none';
  homeButton.style.display = 'none';
  board.replaceChildren();
  header.style.display = 'none';
  home.style.display = 'block';
  roomId.textContent = 'Room ID: -';

  socket.send(JSON.stringify({
    request: 'home',
  }));
}

const handleClick = e => {
  socket.send(JSON.stringify({
    request: 'click',
    id: +e.target.id,
    bgColor: e.target.style.backgroundColor
  }));
}

const createBoard = array => {
  board.replaceChildren();

  for(let i = 0; i < array.length; i++) {
    let button = document.createElement('button');

    button.textContent = array[i].value;
    button.setAttribute('type', 'button');
    button.setAttribute('id', i);
    button.setAttribute('class', 'cell');
    button.setAttribute('title', array[i].value);
    button.addEventListener('click', e => handleClick(e));

    board.append(button);
  }
}

const updateBoard = updatedBoard => {
  for(let i = 0; i < updatedBoard.length; i++) {
    board.children[i].style.backgroundColor = updatedBoard[i].bgColor;

    if (updatedBoard[i].bgColor)
      board.children[i].style.color = 'white';
  }
}

// EVENT LISTENERS //

homeButton.addEventListener('click', goHome);
modalFooterHomeButton.addEventListener('click', goHome);
joinRoomButton.addEventListener('click', joinRoom);

createRoomButton.addEventListener('click', () => {
  socket.send(JSON.stringify({
    request: 'create'
  }));
});

joinRoomInput.addEventListener('keydown', e => {
  if(e.key === 'Enter')
    joinRoom();
});

modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
  homeButton.style.display = 'table';
});

errorModalClose.addEventListener('click', () => {
  errorModal.style.display = 'none';
});

window.addEventListener('click', e => {
  if(e.target === modal || e.target === errorModal) {
    e.target.style.display = 'none';
    
    if(e.target === modal)
      homeButton.style.display = 'table';
  }
});

// WEBSOCKET //

const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('close', () => {
  errorModal.style.display = 'block';
  errorModalText.textContent = 'connection closed';
});

socket.addEventListener('error', () => {
  errorModal.style.display = 'block';
  errorModalText.textContent = 'Error';
});

socket.addEventListener('message', e => {
  let msg = JSON.parse(e.data);

  if(msg.response === 'create' || msg.response === 'join') {
    createBoard(msg.board);

    roomId.textContent = `Room ID: ${msg.roomID}`;
    msg.response === 'create' ? blue.style.color = '#0000ff' : blue.style.color = '#000000';
    msg.response === 'create' ? red.style.color = '#000000' : red.style.color = '#ff0000';
    blueScore.textContent = 0;
    blueMoves.textContent = 8;
    redScore.textContent = 0;
    redMoves.textContent = 8;

    header.style.display = 'block';
    home.style.display = 'none';
  } else if(msg.response === 'update') {
    updateBoard(msg.board);

    document.querySelector(`#${msg.color}-score`).textContent = msg.score;
    document.querySelector(`#${msg.color}-moves`).textContent = msg.moves;

    document.querySelector(`#${msg.oppoColor}-score`).textContent = msg.oppoScore;
    turnPlayer.textContent = `${msg.turnPlayer[0].toUpperCase()}${msg.turnPlayer.slice(1)}`;

    if(msg.winner !== '-1') {
      modal.style.display = 'block';
      modalHeaderText.textContent = msg.winner;
      modalBodyBlue.textContent = `Blue: ${blueScore.textContent}`;
      modalBodyRed.textContent = `Red: ${redScore.textContent}`;
    }
  } else if(msg.response === 'error') {
    errorModal.style.display = 'block';
    errorModalText.textContent = msg.info;
    if(msg.displayHomeButton)
      homeButton.style.display = 'table';
  }
});