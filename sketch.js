// Y-position of the floor (ground level)
let floorY3;

// Player character (soft, animated blob)
let blob3 = {
  x: 80,
  y: 0,

  r: 26,
  points: 48,
  wobble: 7,
  wobbleFreq: 0.9,

  t: 0,
  tSpeed: 0.01,

  vx: 0,
  vy: 0,

  accel: 0.55,
  maxRun: 4.0,
  gravity: 0.65,
  jumpV: -11.0,

  onGround: false,

  frictionAir: 0.995,
  frictionGround: 0.88,

  jumpFaceTimer: 0,
  jumpFaceDuration: 18,

  wallFaceTimer: 0,
  wallFaceDuration: 12,
};

let platforms = [];
let returnRamp;

function setup() {
  createCanvas(640, 360);
  floorY3 = height - 36;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  platforms = [
    { x: 0, y: floorY3, w: width, h: height - floorY3 },
    { x: 140, y: floorY3 - 24, w: 18, h: 24 }, // hurdle
    { x: 100, y: floorY3 - 70, w: 120, h: 12 },
    { x: 300, y: floorY3 - 120, w: 90, h: 12 },
    { x: 440, y: floorY3 - 220, w: 130, h: 12 },

    // Return ramp (finish)
    (returnRamp = { x: 520, y: floorY3 - 90, w: 90, h: 12 }),

    { x: 600, y: floorY3 - 120, w: 20, h: 120 },
    { x: 350, y: floorY3 - 200, w: 16, h: 80 },
  ];

  blob3.y = floorY3 - blob3.r - 1;
}

function draw() {
  background(240);

  // Platforms
  fill(200);
  for (const p of platforms) rect(p.x, p.y, p.w, p.h);

  // Finish flag
  drawFinishFlag(returnRamp);

  // Input
  let move = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1;
  blob3.vx += blob3.accel * move;

  // Friction
  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);

  // Gravity
  blob3.vy += blob3.gravity;

  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // Horizontal collision
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx !== 0) blob3.wallFaceTimer = blob3.wallFaceDuration;

      if (blob3.vx > 0) box.x = s.x - box.w;
      else if (blob3.vx < 0) box.x = s.x + s.w;

      blob3.vx = 0;
    }
  }

  // Vertical collision
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        box.y = s.y - box.h;
        blob3.vy = 0;
        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        box.y = s.y + s.h;
        blob3.vy = 0;
      }
    }
  }

  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  // Timers
  if (blob3.jumpFaceTimer > 0) blob3.jumpFaceTimer--;
  if (blob3.wallFaceTimer > 0) blob3.wallFaceTimer--;

  // Check if blob is standing on return ramp
  const onReturnRamp =
    blob3.onGround &&
    box.x + box.w > returnRamp.x &&
    box.x < returnRamp.x + returnRamp.w &&
    Math.abs(box.y + box.h - returnRamp.y) < 2;

  // Color logic
  let blobColor = color(20, 120, 255);
  if (blob3.jumpFaceTimer > 0) blobColor = color(60, 200, 120);
  else if (blob3.wallFaceTimer > 0) blobColor = color(220, 80, 80);

  // Draw blob
  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3, blobColor);

  // Faces (priority: happy > jump > angry)
  if (onReturnRamp) {
    drawHappyFace(blob3);
  } else if (blob3.jumpFaceTimer > 0) {
    drawSurpriseFace(blob3);
  } else if (blob3.wallFaceTimer > 0) {
    drawMadFace(blob3);
  }

  // HUD
  fill(0);
  text("Move: A/D or ←/→   Jump: Space/W/↑", 10, 18);
}

// AABB overlap
function overlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// Blob body
function drawBlobCircle(b, col) {
  fill(col);
  beginShape();
  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;
    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t,
    );
    const r = b.r + map(n, 0, 1, -b.wobble, b.wobble);
    vertex(b.x + cos(a) * r, b.y + sin(a) * r);
  }
  endShape(CLOSE);
}

// Finish flag
function drawFinishFlag(ramp) {
  const poleX = ramp.x + ramp.w - 40;
  const poleBottom = ramp.y;
  const poleTop = ramp.y - 40;

  stroke(80);
  strokeWeight(3);
  line(poleX, poleBottom, poleX, poleTop);

  const wave = sin(frameCount * 0.1) * 3;
  noStroke();
  fill(255, 80, 80);
  beginShape();
  vertex(poleX, poleTop);
  vertex(poleX + 18 + wave, poleTop + 6);
  vertex(poleX, poleTop + 12);
  endShape(CLOSE);
}

// 😊 Happy face (end of course)
function drawHappyFace(b) {
  push();
  translate(b.x, b.y);
  fill(255);
  noStroke();
  ellipse(-6, -4, 5, 5);
  ellipse(6, -4, 5, 5);
  noFill();
  stroke(255);
  strokeWeight(2);
  arc(0, 6, 12, 8, 0, PI);
  pop();
}

// 😮 Surprise face
function drawSurpriseFace(b) {
  push();
  translate(b.x, b.y);
  fill(255);
  noStroke();
  ellipse(-6, -4, 6, 6);
  ellipse(6, -4, 6, 6);
  noFill();
  stroke(255);
  strokeWeight(2);
  ellipse(0, 6, 6, 6);
  pop();
}

// 😠 Mad face
function drawMadFace(b) {
  push();
  translate(b.x, b.y);
  stroke(255);
  strokeWeight(2);
  line(-10, -10, -2, -6);
  line(10, -10, 2, -6);
  noStroke();
  fill(255);
  ellipse(-6, -2, 5, 5);
  ellipse(6, -2, 5, 5);
  noFill();
  stroke(255);
  arc(0, 8, 10, 6, PI, TWO_PI);
  pop();
}

// Jump
function keyPressed() {
  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob3.onGround
  ) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
    blob3.jumpFaceTimer = blob3.jumpFaceDuration;
  }
}
