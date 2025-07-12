const canvas = document.getElementById('trail');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const activeArea = document.getElementById('activeArea');
const logo = document.getElementById('logo');
const tooltip = document.getElementById('tooltip');

let isDragging = false;
let isInActiveArea = false;
let isFalling = false;
let mouseX = 0;
let mouseY = 0;
let logoX = window.innerWidth / 2;
let logoY = activeArea.getBoundingClientRect().top + 110;
const delay = 0.15;

const colors = ['fuchsia', 'turquoise', 'pink', 'violet'];
let particles = [];

// Detect touch support
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
tooltip.textContent = isTouchDevice ? 'Double tap anywhere' : 'Hover me';

let lastTouchTime = 0;
activeArea.addEventListener('touchstart', (e) => {
  const now = Date.now();
  if (now - lastTouchTime < 400) {
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    logoX = touchX - logo.offsetWidth / 2;
    logoY = touchY - logo.offsetHeight / 2;
    logo.style.left = `${logoX}px`;
    logo.style.top = `${logoY}px`;
    isDragging = false;
    isFalling = true;
    tooltip.style.display = 'none';
    fallBounce();
  }
  lastTouchTime = now;
});

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 4 + 1;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = 1;
    this.dx = (Math.random() - 0.5) * 2;
    this.dy = (Math.random() - 0.5) * 2;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.getGlow();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fill();
  }

  getGlow() {
    return `rgba(${this.getRGB(this.color)},${this.alpha})`;
  }

  getRGB(color) {
    const map = {
      fuchsia: '255,0,255',
      turquoise: '64,224,208',
      pink: '255,192,203',
      violet: '238,130,238'
    };
    return map[color] || '255,255,255';
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.02;
  }
}

let previousMouseX = 0;

function emitParticles(x, y) {
  const movingRight = mouseX > previousMouseX;
  const offsetX = movingRight ? -130 : 0;
  for (let i = 0; i < 5; i++) {
    const offsetY = Math.random() * 50 - 25;
    particles.push(new Particle(x + offsetX - 10, y + offsetY));
  }
  previousMouseX = mouseX;
}

document.addEventListener('mousemove', (e) => {
  const bounds = activeArea.getBoundingClientRect();
  mouseX = e.clientX;
  mouseY = e.clientY;
  isInActiveArea = mouseY >= bounds.top && mouseY <= bounds.bottom && mouseX >= bounds.left && mouseX <= bounds.right;
  if (!isInActiveArea && isDragging) {
    isDragging = false;
    isFalling = true;
    fallBounce();
  }
});

logo.addEventListener('mouseenter', () => {
  isDragging = true;
  tooltip.style.display = 'none';
});

logo.addEventListener('click', () => {
  if (!isFalling) {
    isDragging = false;
    isFalling = true;
    fallBounce();
  }
});

function fallBounce() {
  const logoHeight = logo.offsetHeight;
  const areaBounds = activeArea.getBoundingClientRect();
  const areaBottom = areaBounds.bottom;
  const areaTop = areaBounds.top;
  const mouseNearBottom = mouseY > areaBottom - logoHeight;

  let bounceY = logoY;
  let velocity = mouseNearBottom ? -18 : 0;
  const gravity = mouseNearBottom ? -0.6 : 0.7;
  const damping = 0.6;

  const targetFloor = mouseNearBottom
    ? areaTop + 90
    : areaBottom - logoHeight - 10;

  let bounceOnce = false;

  function drop() {
    velocity += gravity;
    bounceY += velocity;

    if (mouseNearBottom) {
      if (bounceY <= targetFloor) {
        bounceY = targetFloor;
        velocity *= -damping;
        if (Math.abs(velocity) < 1) {
          if (!bounceOnce) {
            velocity = 6;
            bounceOnce = true;
          } else {
            finishBounce();
            return;
          }
        }
      }
    } else {
      if (bounceY >= targetFloor) {
        bounceY = targetFloor;
        velocity *= -damping;
        if (Math.abs(velocity) < 1) {
          if (!bounceOnce) {
            velocity = -8;
            bounceOnce = true;
          } else {
            finishBounce();
            return;
          }
        }
      }
    }

    logo.style.top = `${bounceY}px`;
    logoY = bounceY;

    if (!bounceOnce) {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 100;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        const particle = new Particle(logoX + offsetX, bounceY + offsetY);
        particle.radius = Math.random() * 10 + 1;
        particle.alpha = Math.random() * 0.8 + 0.2;
        particle.alphaDecay = 0.008;
        particles.push(particle);
      }
    }

    requestAnimationFrame(drop);
  }

  function finishBounce() {
    logo.style.top = `${targetFloor}px`;
    logoY = targetFloor;
    isFalling = false;
    tooltip.style.display = "block";
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translate(0, 50%)";
  }

  drop();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isDragging && isInActiveArea) {
    const dx = mouseX - logoX;
    const dy = mouseY - logoY;
    logoX += dx * delay;
    logoY += dy * delay;
    emitParticles(logoX + 75, logoY + 75);
  }

  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  logo.style.left = `${logoX}px`;
  logo.style.top = `${logoY}px`;

  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
