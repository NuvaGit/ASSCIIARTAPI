const http = require('http');

const title = "Computer Science Student at UCD";
const subtitle = "Looking for Work";
const port = process.env.PORT || 3000;

const nameAscii = [
  "     ____.  _____  _________  ____  **.  **_____  ___________.___.____       _____    _______   ",
  "    |    | /  *  \\ \\*   ___ \\|    |/ *|  \\      \\ \\*   _____/|   |    |     /  _  \\   \\      \\  ",
  "    |    |/  /_\\  \\/    \\  \\/|      <    /   |   \\ |    __)_ |   |    |    /  /_\\  \\  /   |   \\ ",
  "/\\__|    /    |    \\     \\___|    |  \\  /    |    \\|        \\|   |    |___/    |    \\/    |    \\",
  "\\________\\____|__  /\\______  /____|__ \\ \\____|__  /_______  /|___|_______ \\____|__  /\\____|__  /",
  "                 \\/        \\/        \\/         \\/        \\/             \\/       \\/         \\/",
  "                                                                                                 "
];

const nameHighlightPositions = [];

for (let y = 0; y < nameAscii.length; y++) {
  for (let x = 0; x < nameAscii[y].length; x++) {
    if (nameAscii[y][x] !== ' ') {
      nameHighlightPositions.push({ x, y });
    }
  }
}

nameHighlightPositions.sort((a, b) => {
  const centerY = nameAscii.length / 2;
  const centerX = nameAscii[0].length / 2;
  
  const distA = Math.sqrt(Math.pow(a.y - centerY, 2) + Math.pow(a.x - centerX, 2));
  const distB = Math.sqrt(Math.pow(b.y - centerY, 2) + Math.pow(b.x - centerX, 2));
  
  return distB - distA; 
});

class Bubble {
  constructor(x, frameWidth, frameHeight) {
    this.x = x;
    this.y = frameHeight - 1;
    this.char = this.randomBubbleChar();
    this.speed = Math.random() * 0.5 + 0.3; 
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.active = true;
  }
  
  randomBubbleChar() {
    const bubbleChars = ['o', 'O', '°', '.', '*', '•', '◦', '○', '◯', '⚬'];
    return bubbleChars[Math.floor(Math.random() * bubbleChars.length)];
  }
  
  update() {
    this.y -= this.speed;
    
    if (Math.random() > 0.8) {
      this.x += (Math.random() > 0.5 ? 0.5 : -0.5);
    }
    
    if (this.y < 0) {
      this.active = false;
    }
  }
  
  draw(frame) {
    const intY = Math.floor(this.y);
    const intX = Math.floor(this.x);
    
    if (intY >= 0 && intY < this.frameHeight && intX >= 0 && intX < this.frameWidth) {
      if (frame[intY].charAt(intX) === ' ') {
        frame[intY] = setCharAt(frame[intY], intX, this.char);
      }
    }
  }
}

function generateFrame(frameCounter, bubbles, frameWidth, frameHeight) {
  const frame = Array(frameHeight).fill(' '.repeat(frameWidth));
  
  const centerY = Math.floor(frameHeight / 2);
  
  const nameY = centerY - Math.floor(nameAscii.length / 2);
  const nameX = Math.floor((frameWidth - nameAscii[0].length) / 2);
  
  for (let i = 0; i < nameAscii.length; i++) {
    if (nameY + i >= 0 && nameY + i < frameHeight) {
      frame[nameY + i] = setCharAt(frame[nameY + i], nameX, nameAscii[i]);
    }
  }
  
  const titleY = nameY - 2;
  const titleX = Math.floor((frameWidth - title.length) / 2);
  if (titleY >= 0 && titleY < frameHeight) {
    frame[titleY] = setCharAt(frame[titleY], titleX, title);
  }
  
  const subtitleY = nameY + nameAscii.length + 1;
  const subtitleX = Math.floor((frameWidth - subtitle.length) / 2);
  if (subtitleY >= 0 && subtitleY < frameHeight) {
    frame[subtitleY] = setCharAt(frame[subtitleY], subtitleX, subtitle);
  }
  
  const highlightCount = 15; 
  const highlightStartIdx = (frameCounter % nameHighlightPositions.length);
  
  for (let i = 0; i < highlightCount; i++) {
    const idx = (highlightStartIdx + i) % nameHighlightPositions.length;
    const pos = nameHighlightPositions[idx];
    
    if (nameY + pos.y >= 0 && nameY + pos.y < frameHeight) {
      const linePos = nameX + pos.x;
      
      const char = nameAscii[pos.y].charAt(pos.x);
      
      if (char !== ' ') {
        const highlightedChar = '@';
        frame[nameY + pos.y] = setCharAt(frame[nameY + pos.y], linePos, highlightedChar);
      }
    }
  }
  
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].draw(frame);
    
    if (!bubbles[i].active) {
      bubbles.splice(i, 1);
    }
  }
  
  if (Math.random() > 0.7) {
    const randomX = Math.floor(Math.random() * frameWidth);
    bubbles.push(new Bubble(randomX, frameWidth, frameHeight));
  }
  
  return frame.join('\n');
}

function setCharAt(str, index, text) {
  if (index < 0) return str;
  const startStr = str.substring(0, index);
  const endStr = index + text.length >= str.length ? '' : str.substring(index + text.length);
  return startStr + text + endStr;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked',
    'Connection': 'keep-alive'
  });
  
  const frameWidth = 120; 
  const frameHeight = 25;
  let frameCounter = 0;
  const bubbles = [];
  
  for (let i = 0; i < 15; i++) {
    const randomX = Math.floor(Math.random() * frameWidth);
    const randomY = Math.floor(Math.random() * frameHeight);
    const bubble = new Bubble(randomX, frameWidth, frameHeight);
    bubble.y = randomY; // Distribute initial bubbles throughout the screen
    bubbles.push(bubble);
  }
  
  function sendNextFrame() {
    res.write('\x1B[2J\x1B[H');
    
    res.write(generateFrame(frameCounter, bubbles, frameWidth, frameHeight));
    
    frameCounter++;
    
    setTimeout(sendNextFrame, 100);
  }
  
  sendNextFrame();
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});