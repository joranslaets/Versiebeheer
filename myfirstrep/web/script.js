const dealerCards = document.getElementById('dealerCards');
const playerHandsContainer = document.getElementById('playerHands');
const dealerStatus = document.getElementById('dealerStatus');
const bankAmount = document.getElementById('bankAmount');
const betAmount = document.getElementById('betAmount');
const message = document.getElementById('message');
const hitButton = document.getElementById('hitButton');
const standButton = document.getElementById('standButton');
const doubleButton = document.getElementById('doubleButton');
const splitButton = document.getElementById('splitButton');
const newGameButton = document.getElementById('newGameButton');
const betChips = document.getElementById('betChips');

let deck = [];
let dealerHand = [];
let playerHands = [];
let currentHandIndex = 0;
let bank = 1000;
let bet = 100;
let gameOver = false;
let splitUsed = false;
let soundContext = null;
let jazzInterval = null;
let lastDraw = null;

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

newGameButton.addEventListener('click', startRound);
hitButton.addEventListener('click', playerHit);
standButton.addEventListener('click', playerStand);
doubleButton.addEventListener('click', playerDouble);
splitButton.addEventListener('click', playerSplit);
betChips.addEventListener('click', selectBet);
document.body.addEventListener('click', unlockAudio, { once: true });

initializeGame();

function initializeGame() {
  bank = 1000;
  setMessage('Klik op een inzetchip en begin aan de luxe tafel.', 'info');
  updateWallet();
  disableRoundButtons();
}

async function startRound() {
  if (bank < bet || bet === 0) {
    setMessage('Je hebt niet genoeg geld voor deze inzet.', 'lose');
    disableRoundButtons();
    return;
  }

  bank -= bet;
  updateWallet();
  deck = createDeck();
  playerHands = [createHand([], bet)];
  dealerHand = [];
  currentHandIndex = 0;
  gameOver = false;
  splitUsed = false;
  lastDraw = null;
  setMessage('De dealer deelt...');
  renderGame(false);

  await dealCardTo(playerHands[0], 'player', 0);
  await wait(220);
  await dealCardTo(dealerHand, 'dealer');
  await wait(220);
  await dealCardTo(playerHands[0], 'player', 0);
  await wait(220);
  await dealCardTo(dealerHand, 'dealer');

  setMessage('Speel hand 1.');
}

function selectBet(event) {
  const button = event.target.closest('.chip');
  if (!button || button.disabled) return;
  bet = Number(button.dataset.value);
  updateWallet();
  renderChipButtons();
  setMessage(`Inzet ingesteld op €${bet}. Klik Nieuw spel om te beginnen.`, 'info');
}

function createHand(cards, stake) {
  return {
    cards,
    bet: stake,
    stand: false,
    completed: false,
  };
}

function createDeck() {
  const cards = [];
  for (const suit of suits) {
    for (const value of values) {
      cards.push({ value, suit });
    }
  }
  return cards.sort(() => Math.random() - 0.5);
}

function drawCard() {
  if (deck.length === 0) {
    deck = createDeck();
  }
  return deck.pop();
}

async function dealCardTo(target, owner, handIndex = 0) {
  const card = drawCard();
  if (owner === 'player') {
    target.cards.push(card);
  } else {
    target.push(card);
  }
  lastDraw = { owner, handIndex, cardIndex: target.length - 1 };
  renderGame(false);
  playSound('deal');
  await wait(220);
}

function renderGame(revealDealer) {
  dealerCards.innerHTML = '';
  playerHandsContainer.innerHTML = '';

  dealerHand.forEach((card, index) => {
    const animate = lastDraw && lastDraw.owner === 'dealer' && lastDraw.cardIndex === index;
    const cardElement = createCardElement(card, revealDealer || index === 1, animate);
    dealerCards.appendChild(cardElement);
  });

  playerHands.forEach((hand, handIndex) => {
    const handElement = document.createElement('div');
    handElement.className = `player-hand${handIndex === currentHandIndex && !gameOver ? ' active' : ''}${hand.completed ? ' completed' : ''}`;

    const title = document.createElement('div');
    title.className = 'player-title';
    title.textContent = playerHands.length > 1 ? `Hand ${handIndex + 1}` : 'Jouw hand';

    const betLabel = document.createElement('span');
    betLabel.textContent = `${hand.bet}€`;
    title.appendChild(betLabel);
    handElement.appendChild(title);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards';

    hand.cards.forEach((card, cardIndex) => {
      const animate = lastDraw && lastDraw.owner === 'player' && lastDraw.handIndex === handIndex && lastDraw.cardIndex === cardIndex;
      cardsContainer.appendChild(createCardElement(card, true, animate));
    });

    handElement.appendChild(cardsContainer);

    const status = document.createElement('div');
    status.className = 'status';
    status.textContent = `Totaal: ${calculateHand(hand.cards)}${hand.stand ? ' • Stand' : ''}`;
    handElement.appendChild(status);

    playerHandsContainer.appendChild(handElement);
  });

  const dealerTotal = revealDealer ? calculateHand(dealerHand) : dealerHand.length > 1 ? `? + ${cardValue(dealerHand[1])}` : '?';
  dealerStatus.textContent = `Totaal: ${dealerTotal}`;

  updateWallet();
  renderChipButtons();
  updateControls();
}

function createCardElement(card, visible, animate = false) {
  const element = document.createElement('div');
  element.className = 'card' + (visible ? '' : ' hidden');
  if (animate) {
    element.classList.add('dealt');
  }

  if (visible) {
    const top = document.createElement('div');
    top.className = 'value';
    top.textContent = card.value;

    const suit = document.createElement('div');
    suit.className = 'suit';
    suit.textContent = card.suit;

    const bottom = document.createElement('div');
    bottom.className = 'bottom';
    bottom.textContent = card.value;

    element.appendChild(top);
    element.appendChild(suit);
    element.appendChild(bottom);
  } else {
    element.innerHTML = '<div class="value">?</div><div class="suit">?</div><div class="bottom">?</div>';
  }

  return element;
}

function cardValue(card) {
  if (card.value === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.value)) return 10;
  return Number(card.value);
}

function calculateHand(hand) {
  let total = 0;
  let aces = 0;

  hand.forEach(card => {
    if (card.value === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      total += 10;
    } else {
      total += Number(card.value);
    }
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function renderChipButtons() {
  const buttons = betChips.querySelectorAll('.chip');
  buttons.forEach(button => {
    const value = Number(button.dataset.value);
    button.disabled = bank < value;
    button.classList.toggle('disabled', bank < value);
    button.classList.toggle('active', bet === value);
  });
}

function updateWallet() {
  bankAmount.textContent = `€${bank}`;
  betAmount.textContent = `€${bet}`;
  if (bank < bet) {
    const buttons = Array.from(betChips.querySelectorAll('.chip'))
      .map(button => Number(button.dataset.value))
      .filter(value => value <= bank);
    if (buttons.length > 0) {
      bet = buttons[buttons.length - 1];
    } else {
      bet = 0;
    }
  }
  renderChipButtons();
}

function updateControls() {
  if (gameOver) {
    hitButton.disabled = true;
    standButton.disabled = true;
    doubleButton.disabled = true;
    splitButton.disabled = true;
    return;
  }

  const activeHand = playerHands[currentHandIndex];
  const canHit = activeHand && !activeHand.stand;
  const canDouble = canHit && activeHand.cards.length === 2 && bank >= bet;
  const canSplit = canHit && !splitUsed && activeHand.cards.length === 2 && canSplitHand(activeHand) && bank >= bet;

  hitButton.disabled = !canHit;
  standButton.disabled = !canHit;
  doubleButton.disabled = !canDouble;
  splitButton.disabled = !canSplit;
}

function disableRoundButtons() {
  hitButton.disabled = true;
  standButton.disabled = true;
  doubleButton.disabled = true;
  splitButton.disabled = true;
}

function canSplitHand(hand) {
  return hand.cards.length === 2 && hand.cards[0].value === hand.cards[1].value;
}

function playerHit() {
  if (gameOver) return;

  const hand = playerHands[currentHandIndex];
  hand.cards.push(drawCard());
  lastDraw = { owner: 'player', handIndex: currentHandIndex, cardIndex: hand.cards.length - 1 };
  playSound('hit');
  renderGame(false);

  if (calculateHand(hand.cards) > 21) {
    hand.completed = true;
    hand.stand = true;
    playSound('bust');
    endHand();
  }
}

function playerStand() {
  if (gameOver) return;

  const hand = playerHands[currentHandIndex];
  hand.stand = true;
  hand.completed = true;
  playSound('stand');
  endHand();
}

function playerDouble() {
  if (gameOver) return;

  const hand = playerHands[currentHandIndex];
  if (bank < bet || hand.cards.length !== 2) return;

  bank -= bet;
  hand.bet += bet;
  hand.cards.push(drawCard());
  lastDraw = { owner: 'player', handIndex: currentHandIndex, cardIndex: hand.cards.length - 1 };
  playSound('double');
  renderGame(false);

  hand.completed = true;
  hand.stand = true;
  if (calculateHand(hand.cards) > 21) {
    playSound('bust');
  }
  endHand();
}

function playerSplit() {
  if (gameOver) return;

  const hand = playerHands[currentHandIndex];
  if (!canSplitHand(hand) || bank < bet) return;

  bank -= bet;
  splitUsed = true;

  const [firstCard, secondCard] = hand.cards;
  hand.cards = [firstCard, drawCard()];
  const newHand = createHand([secondCard, drawCard()], bet);
  playerHands.push(newHand);
  currentHandIndex = 0;
  lastDraw = { owner: 'player', handIndex: currentHandIndex, cardIndex: hand.cards.length - 1 };

  playSound('split');
  setMessage('Hand gesplitst! Speel eerst hand 1.');
  renderGame(false);
}

function endHand() {
  const nextHandIndex = playerHands.findIndex((hand, index) => !hand.completed && index !== currentHandIndex);
  if (nextHandIndex !== -1) {
    currentHandIndex = nextHandIndex;
    setMessage(`Nu hand ${currentHandIndex + 1}.`);
    renderGame(false);
    return;
  }

  revealDealer();
  dealerPlay();
}

async function dealerPlay() {
  renderGame(true);
  await wait(600);

  while (calculateHand(dealerHand) < 17) {
    dealerHand.push(drawCard());
    lastDraw = { owner: 'dealer', cardIndex: dealerHand.length - 1 };
    playSound('deal');
    renderGame(true);
    await wait(650);
  }

  determineWinner();
}

function determineWinner() {
  const dealerTotal = calculateHand(dealerHand);
  const results = playerHands.map((hand, index) => {
    const total = calculateHand(hand.cards);
    let text = `Hand ${index + 1}: `;

    if (total > 21) {
      text += `BUST`;
    } else if (dealerTotal > 21) {
      bank += hand.bet * 2;
      text += `WINT`;
    } else if (total > dealerTotal) {
      bank += hand.bet * 2;
      text += `WINT`;
    } else if (total === dealerTotal) {
      bank += hand.bet;
      text += `GELIJK`;
    } else {
      text += `VERLIES`;
    }

    return text;
  });

  const hasWin = playerHands.some(hand => {
    const total = calculateHand(hand.cards);
    return total <= 21 && (dealerTotal > 21 || total > dealerTotal);
  });

  setMessage(results.join(' | '), hasWin ? 'win' : 'lose');
  gameOver = true;
  updateWallet();
  renderGame(true);
  playSound(hasWin ? 'round' : 'bust');
}

function revealDealer() {
  renderGame(true);
}

function setMessage(text, type = 'info') {
  message.textContent = text;
  message.className = `message ${type}`;
}

function unlockAudio() {
  if (soundContext) return;
  soundContext = new (window.AudioContext || window.webkitAudioContext)();
  startJazzMusic();
}

function startJazzMusic() {
  if (!soundContext || jazzInterval) return;
  const chordProgression = [440, 523.25, 659.25, 587.33];
  let step = 0;

  function playNote(freq, duration = 0.18, type = 'sine') {
    const osc = soundContext.createOscillator();
    const gain = soundContext.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(soundContext.destination);
    gain.gain.setValueAtTime(0.0001, soundContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, soundContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, soundContext.currentTime + duration);
    osc.start(soundContext.currentTime);
    osc.stop(soundContext.currentTime + duration + 0.02);
  }

  function playChord(notes) {
    notes.forEach((note, index) => {
      playNote(note, 0.25, index === 0 ? 'triangle' : 'sine');
    });
  }

  jazzInterval = setInterval(() => {
    const root = chordProgression[step % chordProgression.length];
    playChord([root, root * 1.25, root * 1.5]);
    playNote(root * 0.5, 0.15, 'square');
    step += 1;
  }, 700);
}

function playSound(type) {
  if (!soundContext) return;
  const osc = soundContext.createOscillator();
  const gain = soundContext.createGain();
  osc.connect(gain);
  gain.connect(soundContext.destination);
  osc.type = type === 'bust' ? 'sawtooth' : 'triangle';

  let frequency = 440;
  let duration = 0.12;

  switch (type) {
    case 'hit':
      frequency = 520;
      duration = 0.1;
      break;
    case 'stand':
      frequency = 360;
      duration = 0.12;
      break;
    case 'double':
      frequency = 640;
      duration = 0.16;
      break;
    case 'split':
      frequency = 580;
      duration = 0.16;
      break;
    case 'deal':
      frequency = 460;
      duration = 0.1;
      break;
    case 'bust':
      frequency = 260;
      duration = 0.24;
      break;
    case 'round':
      frequency = 780;
      duration = 0.22;
      break;
    default:
      frequency = 440;
  }

  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, soundContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, soundContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, soundContext.currentTime + duration);
  osc.start(soundContext.currentTime);
  osc.stop(soundContext.currentTime + duration + 0.02);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
