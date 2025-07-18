const canvas = document.getElementById('trail');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const activeArea = document.getElementById('activeArea');
const logo = document.getElementById('logo');
const tooltip = document.getElementById('tooltip');

// Ensure logo is above all canvases
logo.style.position = 'absolute'; // Make sure position is absolute
logo.style.zIndex = '10'; // Higher z-index than all canvases

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

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 4 + 1; // This will be overridden in emitParticles
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = 1;
    // Reduce base particle speed slightly for more controlled movement
    this.dx = (Math.random() - 0.5) * 1.5;
    this.dy = (Math.random() - 0.5) * 1.5;
    // Add a property for alpha decay rate
    this.alphaDecay = 0.012; // Slower fade out (was 0.02)
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
    this.alpha -= this.alphaDecay; // Use the custom decay rate
  }
}

let previousMouseX = 0;

function emitParticles(x, y) {
  // Simplified emission - always from center
  let emissionX = x; // Always emit from center X
  let emissionY = y; // Always emit from center Y
  
  // Calculate movement for particle behavior only (not position)
  const dx = mouseX - previousMouseX;
  const dy = mouseY - logoY;
  
  let emissionAreaSize = 80; // Default emission area size
  let isIdle = false;
  
  // Only use movement to determine if we're idle
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
    isIdle = true;
    emissionAreaSize = 120; // Bigger area when idle
  }
  
  // Create particles with smaller size in a circular area around center
  const particleCount = isIdle ? 3 : 5; // Fewer particles when idle
  
  for (let i = 0; i < particleCount; i++) {
    // Create circular distribution using angle and distance from center
    const angle = Math.random() * Math.PI * 2; // Random angle (0-360 degrees)
    const distance = Math.random() * (emissionAreaSize/2); // Random distance from center
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;
    
    // Create particle with position within the circular emission area
    const particle = new Particle(emissionX + offsetX, emissionY + offsetY);
    
    // Make particles smaller
    particle.radius = Math.random() * 3 + 0.5; // Smaller radius
    
    // When idle, make particles drift more gently
    if (isIdle) {
      particle.dx *= 0.7;
      particle.dy *= 0.7;
      particle.alphaDecay = 0.008; // Even slower fade for idle particles
    }
    
    particles.push(particle);
  }

  previousMouseX = mouseX; // Update previous mouse position
}

document.addEventListener('mousemove', (e) => {
  const bounds = activeArea.getBoundingClientRect();

  // Update mouse position
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Check if within vertical bounds
  const withinVerticalBounds = mouseY >= bounds.top && mouseY <= bounds.bottom;
  // Check if within horizontal bounds
  const withinHorizontalBounds = mouseX >= bounds.left && mouseX <= bounds.right;

  // Trigger bounce to center if outside horizontal bounds
  if (!withinHorizontalBounds) {
    bounceToCenter();
  }

  // Consider within active area only if within vertical bounds
  isInActiveArea = withinVerticalBounds;

  // Trigger bounce if outside vertical bounds or horizontal bounds
  if ((!withinVerticalBounds || !withinHorizontalBounds) && isDragging) {
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
  const logoWidth = logo.offsetWidth;
  const areaBounds = activeArea.getBoundingClientRect();
  const areaBottom = areaBounds.bottom;
  const areaTop = areaBounds.top;
  const areaLeft = areaBounds.left;
  const areaRight = areaBounds.right;
  
  // Determine bounce direction
  const mouseNearBottom = mouseY > areaBottom - logoHeight;
  const mouseNearTop = mouseY < areaTop;
  const mouseNearLeft = mouseX < areaLeft;
  const mouseNearRight = mouseX > areaRight - logoWidth;
  
  // Check if we're bouncing horizontally or vertically
  const isHorizontalBounce = mouseNearLeft || mouseNearRight;
  
  // Setup bounce variables
  let bounceY = logoY;
  let bounceX = logoX;
  let velocityY = mouseNearBottom ? -18 : (mouseNearTop ? 18 : 0);
  let velocityX = 0;
  
  if (isHorizontalBounce) {
    velocityX = mouseNearLeft ? 18 : -18; // Push right if near left, left if near right
  }
  
  const gravity = mouseNearBottom ? -0.6 : 0.7;
  const horizontalDrag = 0.8; // Drag factor for horizontal movement
  const damping = 0.6;

  // Calculate target positions
  const targetFloorY = mouseNearBottom
    ? areaTop + 90
    : areaBottom - logoHeight - 10;
    
  const targetFloorX = mouseNearLeft
    ? areaLeft + 10
    : mouseNearRight ? areaRight - logoWidth - 10 : bounceX;

  let bounceOnce = false;

  function drop() {
    // Update vertical position with gravity
    velocityY += gravity;
    bounceY += velocityY;
    
    // Update horizontal position with drag (slows down over time)
    bounceX += velocityX;
    velocityX *= horizontalDrag; // Apply drag to slow down horizontal movement
    
    // Handle vertical bounce
    if (mouseNearBottom) {
      if (bounceY <= targetFloorY) {
        bounceY = targetFloorY;
        velocityY *= -damping;

        if (Math.abs(velocityY) < 1) {
          if (!bounceOnce) {
            velocityY = 6;
            bounceOnce = true;
          } else {
            finishBounce();
            return;
          }
        }
      }
    } else if (mouseNearTop) {
      if (bounceY >= targetFloorY) {
        bounceY = targetFloorY;
        velocityY *= -damping;
        
        if (Math.abs(velocityY) < 1) {
          if (!bounceOnce) {
            velocityY = -8;
            bounceOnce = true;
          } else {
            finishBounce();
            return;
          }
        }
      }
    } else {
      // Normal vertical bounce (same as before)
      if (bounceY >= targetFloorY) {
        bounceY = targetFloorY;
        velocityY *= -damping;

        if (Math.abs(velocityY) < 1) {
          if (!bounceOnce) {
            velocityY = -8;
            bounceOnce = true;
          } else {
            finishBounce();
            return;
          }
        }
      }
    }
    
    // Handle horizontal bounce
    if (mouseNearLeft) {
      if (bounceX >= targetFloorX) {
        bounceX = targetFloorX;
        velocityX *= -damping;
      }
    } else if (mouseNearRight) {
      if (bounceX <= targetFloorX) {
        bounceX = targetFloorX;
        velocityX *= -damping;
      }
    }

    // Update logo position
    logo.style.top = `${bounceY}px`;
    logo.style.left = `${bounceX}px`;
    logoY = bounceY;
    logoX = bounceX;
    
    // Update tooltip position class
    updateTooltipPosition();

    if (mouseNearBottom && !bounceOnce) {
      bounceOnce = true; // Ensure particles eject only once
      for (let i = 0; i < 15; i++) { // Reduce particle count
        const angle = Math.random() * Math.PI * 2; // Random angle for circular pattern
        const radius = Math.random() * 100; // Increase radius for wider dispersion
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        const particle = new Particle(logoX + offsetX, bounceY + offsetY);
        particle.radius = Math.random() * 3 + 0.5; // Same size as regular particles
        particle.alpha = Math.random() * 0.8 + 0.2; // Varying initial opacity
        particle.alphaDecay = 0.008; // Lingering longer
        particles.push(particle);
      }
    }

    requestAnimationFrame(drop);
  }

  function finishBounce() {
    // Set final position
    logo.style.top = `${targetFloorY}px`;
    logoY = targetFloorY;
    
    // Also set final horizontal position if needed
    if (isHorizontalBounce) {
      logo.style.left = `${targetFloorX}px`;
      logoX = targetFloorX;
    }
    
    isFalling = false;

    // Update tooltip position class
    updateTooltipPosition();
    
    tooltip.style.display = "block";
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translate(0, 50%)";
  }

  drop();
}

class BackgroundParticle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 30 + 5; // Reduced diameter range
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = Math.random() * 0.1 + 0.05; // Lower opacity
    this.dy = Math.random() * 0.5 + 0.1; // Slow floating speed
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.getRGB(this.color)},${this.alpha})`;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 50; // Increased glow
    ctx.fill();
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
    this.y += this.dy;
    if (this.y - this.radius > canvas.height) {
      this.y = -this.radius; // Reset to top when it goes out of view
      this.x = Math.random() * canvas.width; // Randomize x position
    }
  }
}

const backgroundParticles = Array.from({ length: 20 }, () => new BackgroundParticle()); // Create background particles

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  backgroundParticles.forEach(particle => {
    particle.update();
    particle.draw();
  });

  if (isDragging && isInActiveArea) {
    // Calculate where the logo should be positioned so its center is at the mouse position
    const logoWidth = logo.offsetWidth;
    const logoHeight = logo.offsetHeight;
    const targetX = mouseX - (logoWidth / 2);
    const targetY = mouseY - (logoHeight / 2);
    
    // Smoothly move toward the target position
    const dx = targetX - logoX;
    const dy = targetY - logoY;
    logoX += dx * delay;
    logoY += dy * delay;

    // Calculate center of the logo for consistent particle emission
    const centerX = logoX + (logoWidth / 2); // Proper center calculation
    const centerY = logoY + (logoHeight / 2);
    
    // Emit particles at a rate based on movement
    const isMoving = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    if (isMoving) {
      emitParticles(centerX, centerY); // Emit particles from center when moving
    } else {
      // When barely moving, emit particles less frequently
      if (Math.random() < 0.05) { // Only about 5% of frames
        previousMouseX = centerX; // Update previous position
        emitParticles(centerX, centerY);
      }
    }
  }

  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  logo.style.left = `${logoX}px`;
  logo.style.top = `${logoY}px`;
  
  // Update tooltip position class based on logo position
  updateTooltipPosition();

  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Update tooltip position class after resize
  updateTooltipPosition();
});

canvas.style.zIndex = "1"; // Set a lower z-index to ensure canvas is behind the logo image

const starsCanvas = document.createElement('canvas');
starsCanvas.id = 'starsCanvas';
starsCanvas.width = window.innerWidth;
starsCanvas.height = window.innerHeight;
document.body.appendChild(starsCanvas);


const starsCtx = starsCanvas.getContext('2d');

class Star {
  constructor() {
    this.x = Math.random() * starsCanvas.width;
    this.y = Math.random() * starsCanvas.height;
    this.radius = Math.random() * 2 + 0.5; // Small faint stars
    this.alpha = Math.random() * 0.5 + 0.1; // Low opacity
    this.alphaChange = (Math.random() * 0.02 - 0.01); // Twinkling effect
  }

  draw() {
    starsCtx.beginPath();
    starsCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    starsCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    starsCtx.fill();
  }

  update() {
    this.alpha += this.alphaChange;
    if (this.alpha <= 0.1 || this.alpha >= 0.5) {
      this.alphaChange *= -1; // Reverse direction of twinkling
    }
    
    // Reset position when out of view
    if (this.y - this.radius > starsCanvas.height) {
      this.y = -this.radius; // Reset to top when it goes out of view
      this.x = Math.random() * starsCanvas.width; // Randomize x position
    }
  }
}

const stars = Array.from({ length: 100 }, () => new Star()); // Create stars

function animateStars() {
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);

  stars.forEach(star => {
    star.update();
    star.draw();
  });

  requestAnimationFrame(animateStars);
}

animateStars();

const shootingStarCanvas = document.createElement('canvas');
shootingStarCanvas.id = 'shootingStarCanvas';
shootingStarCanvas.width = window.innerWidth;
shootingStarCanvas.height = window.innerHeight;
document.body.appendChild(shootingStarCanvas);// Set shooting star canvas below main canvas

const shootingStarCtx = shootingStarCanvas.getContext('2d');

class ShootingStar {
  constructor() {
    this.x = Math.random() * shootingStarCanvas.width; // Random horizontal position
    this.y = 0; // Always start at the top
    const angle = Math.random() * Math.PI / 2 + Math.PI / 4; // Random angle between 45° and 135°
    this.dx = Math.cos(angle) * (Math.random() * 5 + 2); // Horizontal speed based on angle
    this.dy = Math.sin(angle) * (Math.random() * 5 + 2); // Vertical speed based on angle
    this.radius = Math.random() * 3 + 2; // Size of the star
    this.alpha = 1; // Initial opacity
    this.tailLength = 20; // Length of the tail
  }

  draw() {
    // Draw the tail
    const gradient = shootingStarCtx.createLinearGradient(this.x, this.y, this.x - this.dx * this.tailLength, this.y - this.dy * this.tailLength);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    shootingStarCtx.beginPath();
    shootingStarCtx.moveTo(this.x, this.y);
    shootingStarCtx.lineTo(this.x - this.dx * this.tailLength, this.y - this.dy * this.tailLength);
    shootingStarCtx.strokeStyle = gradient;
    shootingStarCtx.lineWidth = this.radius;
    shootingStarCtx.stroke();

    // Draw the star
    shootingStarCtx.beginPath();
    shootingStarCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    shootingStarCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    shootingStarCtx.fill();
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.02; // Fade out
  }
}

let shootingStar = null;

function animateShootingStar() {
  shootingStarCtx.clearRect(0, 0, shootingStarCanvas.width, shootingStarCanvas.height);

  if (shootingStar) {
    shootingStar.update();
    shootingStar.draw();

    if (shootingStar.alpha <= 0) {
      shootingStar = null; // Remove the star after it fades out
    }
  }

  requestAnimationFrame(animateShootingStar);
}

function spawnShootingStar() {
  shootingStar = new ShootingStar();
}

setInterval(spawnShootingStar, 6000);
animateShootingStar();

function isTouchDevice() {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
}

// Update tooltip text based on device type
function updateTooltipText() {
  if (tooltip) {
    tooltip.textContent = isTouchDevice() 
      ? 'Hi! Drag me around. I\'m a web-fragment'
      : 'Hi! Hover me! I\'m a web-fragment';
  }
}

// Call the function immediately
updateTooltipText();

// Add touch events for mobile devices
activeArea.addEventListener('touchstart', (e) => {
  e.preventDefault();

  const bounds = activeArea.getBoundingClientRect();
  const touch = e.touches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;

  if (touchY >= bounds.top && touchY <= bounds.bottom && touchX >= bounds.left && touchX <= bounds.right) {
    isDragging = true;
    tooltip.style.display = 'none';

    logoX = touchX - logo.offsetWidth / 2;
    logoY = touchY - logo.offsetHeight / 2;
    logo.style.left = `${logoX}px`;
    logo.style.top = `${logoY}px`;
  }
});

let lastTapTime = 0;
let wasDragging = false; // Track if the user was dragging before touchend

activeArea.addEventListener('touchend', (e) => {
  const now = Date.now();
  const touch = e.changedTouches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;
  const bounds = activeArea.getBoundingClientRect();
  
  // Store current dragging state and reset it
  wasDragging = isDragging;
  
  // If user was dragging and released finger, apply bounce effect
  if (wasDragging) {
    isDragging = false;
    
    // Check if touch ended outside the active area
    const outsideActiveArea = touchY < bounds.top || touchY > bounds.bottom || 
                              touchX < bounds.left || touchX > bounds.right;
    
    if (outsideActiveArea) {
      mouseX = touchX; // Set mouseX/Y for fallBounce calculation
      mouseY = touchY;
      isFalling = true;
      fallBounce();
    } else {
      // If inside area but stopped dragging, just emit some particles
      // Calculate center of the logo for consistent particle emission
      const logoWidth = logo.offsetWidth;
      const logoHeight = logo.offsetHeight; 
      const centerX = logoX + logoWidth / 2;
      const centerY = logoY + logoHeight / 2;
      
      emitParticles(centerX, centerY);
    }
  } 
  // Double tap detection (only if we weren't dragging)
  else if (now - lastTapTime < 300) { 
    if (touchY >= bounds.top && touchY <= bounds.bottom && touchX >= bounds.left && touchX <= bounds.right) {
      logoX = touchX - logo.offsetWidth / 2;
      logoY = touchY - logo.offsetHeight / 2;
      logo.style.left = `${logoX}px`;
      logo.style.top = `${logoY}px`;

      // Calculate center of the logo for consistent particle emission
      const logoWidth = logo.offsetWidth;
      const logoHeight = logo.offsetHeight;
      const centerX = logoX + logoWidth / 2;
      const centerY = logoY + logoHeight / 2;
      
      // Emit particles from center
      previousMouseX = centerX;
      emitParticles(centerX, centerY);
      isFalling = true;
      fallBounce();
    }
  }
  
  lastTapTime = now;
});

// Add touchmove event to create trails while moving
activeArea.addEventListener('touchmove', (e) => {
  e.preventDefault();
  
  if (isDragging) {
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // Check if touch is still within active area
    const bounds = activeArea.getBoundingClientRect();
    const withinVerticalBounds = touchY >= bounds.top && touchY <= bounds.bottom;
    const withinHorizontalBounds = touchX >= bounds.left && touchX <= bounds.right;
    const withinActiveArea = withinVerticalBounds && withinHorizontalBounds;
    
    if (!withinActiveArea) {
      // If touch goes outside active area, trigger bounce animation
      isDragging = false;
      isFalling = true;
      mouseX = touchX; // Set mouseX/Y for fallBounce calculation
      mouseY = touchY;
      fallBounce();
      return;
    }
    
    // Calculate target position so logo center follows touch position
    const logoWidth = logo.offsetWidth;
    const logoHeight = logo.offsetHeight;
    const targetX = touchX - (logoWidth / 2);
    const targetY = touchY - (logoHeight / 2);
    
    // Smoothly move toward the target position
    const dx = targetX - logoX;
    const dy = targetY - logoY;
    logoX += dx * delay;
    logoY += dy * delay;
    
    // Emit particles for the trail effect
    // Calculate center of the logo for consistent particle emission
    // Reuse the logoWidth and logoHeight variables
    const centerX = logoX + logoWidth / 2;
    const centerY = logoY + logoHeight / 2;
    
    // Use touch movement data for emission
    emitParticles(centerX, centerY);
    
    // Update logo position
    logo.style.left = `${logoX}px`;
    logo.style.top = `${logoY}px`;
    
    // Update tooltip position class for touch movement
    updateTooltipPosition();
  }
});

// Function to check logo position and update tooltip class
function updateTooltipPosition() {
  const viewportWidth = window.innerWidth;
  const logoWidth = logo.offsetWidth;
  const logoCenter = logoX + (logoWidth / 2);
  const isOnLeftHalf = logoCenter < (viewportWidth / 2);

  // Add or remove 'right' class based on position
  if (isOnLeftHalf) {
    tooltip.classList.add('right');
  } else {
    tooltip.classList.remove('right');
  }
}

// Call updateTooltipPosition initially
updateTooltipPosition();

// Function to handle bounce back to center when outside horizontal bounds
function bounceToCenter() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const logoWidth = logo.offsetWidth;
  const logoHeight = logo.offsetHeight;

  // Check if logo is outside horizontal bounds
  if (logoX < 0 || logoX + logoWidth > viewportWidth) {
    // Calculate center position
    const centerX = (viewportWidth - logoWidth) / 2;
    const centerY = (viewportHeight - logoHeight) / 2;

    // Smoothly move logo to center
    logo.style.transition = "left 0.5s ease, top 0.5s ease";
    logo.style.left = `${centerX}px`;
    logo.style.top = `${centerY}px`;

    // Update logo position variables
    logoX = centerX;
    logoY = centerY;
    
    // Update tooltip position class
    updateTooltipPosition();
  }
}
