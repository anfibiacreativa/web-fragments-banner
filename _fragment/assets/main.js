const canvas = document.getElementById('trail');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const activeArea = document.getElementById('activeArea');
const logo = document.getElementById('logo');
const tooltip = document.getElementById('tooltip');

let isDragging = false;
let isInActiveArea = false;
let mouseX = 0;
let mouseY = 0;
let logoX = window.innerWidth / 2;
let logoY = activeArea.getBoundingClientRect().top + 110;
let vx = 0;
let vy = 0;
const delay = 0.15;

const colors = ['fuchsia', 'turquoise', 'yellow'];
let particles = [];

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
      yellow: '255,255,0'
    };
    return map[color] || '255,255,255';
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.02;
  }
}

function emitParticles(x, y) {
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(x, y));
  }
}

document.addEventListener('mousemove', (e) => {
  const bounds = activeArea.getBoundingClientRect();
  mouseX = e.clientX;
  mouseY = e.clientY;

  const withinActiveArea = mouseY >= bounds.top && mouseY <= bounds.bottom;
  isInActiveArea = withinActiveArea;

  if (!isInActiveArea && isDragging) {
    isDragging = false;
    fallBounce();
  }
});

logo.addEventListener('mouseenter', () => {
  isDragging = true;
  tooltip.style.display = 'none';
});

logo.addEventListener('mouseleave', () => {
  // Do nothing
});

logo.addEventListener('click', () => {
  isDragging = false;
  fallBounce();
});

function fallBounce() {
  const logoHeight = logo.offsetHeight;
  const areaBounds = activeArea.getBoundingClientRect();
  const areaBottom = areaBounds.bottom;
  const areaTop = areaBounds.top;
  const logoBottom = logoY + logoHeight;
  const mouseNearBottom = (mouseY > areaBottom - logoHeight);

  let bounceY = logoY;
  let velocity = mouseNearBottom ? -18 : 0; // up or down
  const gravity = mouseNearBottom ? -0.6 : 0.7;
  const damping = 0.6;

  const targetFloor = mouseNearBottom
    ? areaTop + 90 // bounce up max
    : areaBottom - logoHeight - 10; // bounce down target

  function drop() {
    velocity += gravity;
    bounceY += velocity;

    // Limit bounce range
    if (mouseNearBottom) {
      if (bounceY <= targetFloor) {
        bounceY = targetFloor;
        velocity *= -damping;

        if (Math.abs(velocity) < 1) {
          bounceY = targetFloor;
          logo.style.top = `${bounceY}px`;
          logoY = bounceY;
          return;
        }
      }
    } else {
      if (bounceY >= targetFloor) {
        bounceY = targetFloor;
        velocity *= -damping;

        if (Math.abs(velocity) < 1) {
          bounceY = targetFloor;
          logo.style.top = `${bounceY}px`;
          logoY = bounceY;
          return;
        }
      }
    }

    logo.style.top = `${bounceY}px`;
    logoY = bounceY;

    // Bokeh jet on upward bounce
    if (mouseNearBottom) {
      for (let i = 0; i < 10; i++) {
        particles.push(new Particle(logoX + Math.random() * 20 - 10, bounceY));
      }
    }

    requestAnimationFrame(drop);
  }

  drop();
}


function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isDragging && isInActiveArea) {
    let dx = mouseX - logoX;
    let dy = mouseY - logoY;
    logoX += dx * delay;
    logoY += dy * delay;
    emitParticles(logoX, logoY);
  }

  logo.style.left = `${logoX}px`;
  logo.style.top = `${logoY}px`;

  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});