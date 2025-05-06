// Dot art with p5.js
// A flock of dots that behave like birds and occasionally form an eye

// Configuration parameters
const config = {
    canvasWidth: 400,
    canvasHeight: 400,
    dotCount: 300,
    dotSizeMin: 3,
    dotSizeMax: 3,
    maxSpeed: 3,
    maxForce: 0.05,
    flockingRules: {
        separation: {
            weight: 1.5,
            distance: 25
        },
        alignment: {
            weight: 1.0,
            distance: 50
        },
        cohesion: {
            weight: 1.0,
            distance: 50
        }
    },
    mouseInfluenceRadius: 150,
    mouseRepelStrength: 3,
    eyeFormation: {
        enabled: true,
        interval: 300, // frames between eye formations
        duration: 180, // frames to maintain eye shape
        radius: 100,
        pupilRadius: 30
    },
    colorSchemes: [
        // Blue-purple scheme
        {
            background: [0, 0, 0],
            dots: [
                [255, 255, 255],
                [255, 255, 255],
                [255, 255, 255],
                [255, 255, 255],
                [255, 255, 255]
            ]
        },

    ]
};

// Global variables
let dots = [];
let selectedColorScheme;
let showDebug = false;
let eyeFormationTimer = 0;
let isFormingEye = false;
let eyeCenter = createVector(0, 0);
let eyeTarget = createVector(0, 0);

function setup() {
    createCanvas(config.canvasWidth, config.canvasHeight);

    // Randomly select a color scheme
    selectedColorScheme = random(config.colorSchemes);

    // Create the dots
    for (let i = 0; i < config.dotCount; i++) {
        dots.push({
            position: createVector(random(width), random(height)),
            velocity: createVector(random(-1, 1), random(-1, 1)),
            acceleration: createVector(0, 0),
            size: random(config.dotSizeMin, config.dotSizeMax),
            color: random(selectedColorScheme.dots),
            maxSpeed: config.maxSpeed,
            maxForce: config.maxForce,
            targetPosition: createVector(0, 0)
        });
    }

    // Set the background
    background(selectedColorScheme.background);

    // Initialize eye center
    eyeCenter = createVector(width / 2, height / 2);
}

function draw() {
    // Clear with semi-transparent background for trailing effect
    background(selectedColorScheme.background[0],
        selectedColorScheme.background[1],
        selectedColorScheme.background[2],
        25);

    // Create a mouse vector
    const mousePos = createVector(mouseX, mouseY);

    // Eye formation logic
    if (config.eyeFormation.enabled) {
        eyeFormationTimer++;

        // Start new eye formation
        if (!isFormingEye && eyeFormationTimer >= config.eyeFormation.interval) {
            isFormingEye = true;
            eyeFormationTimer = 0;
            eyeTarget = createVector(random(width * 0.3, width * 0.7),
                random(height * 0.3, height * 0.7));
        }

        // End eye formation
        if (isFormingEye && eyeFormationTimer >= config.eyeFormation.duration) {
            isFormingEye = false;
            eyeFormationTimer = 0;
        }
    }

    // Update and draw dots
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Reset acceleration
        dot.acceleration.mult(0);

        if (isFormingEye) {
            // Calculate target position for eye formation
            const angle = map(i, 0, dots.length, 0, TWO_PI);
            const radius = i < dots.length * 0.8 ? config.eyeFormation.radius : config.eyeFormation.pupilRadius;
            const targetX = eyeTarget.x + cos(angle) * radius;
            const targetY = eyeTarget.y + sin(angle) * radius;
            dot.targetPosition.set(targetX, targetY);

            // Steer towards eye formation
            const eyeForce = seek(dot, dot.targetPosition);
            eyeForce.mult(2); // Stronger force for eye formation
            dot.acceleration.add(eyeForce);
        } else {
            // Normal flocking behavior
            const separation = calculateSeparation(dot, i);
            const alignment = calculateAlignment(dot, i);
            const cohesion = calculateCohesion(dot, i);

            separation.mult(config.flockingRules.separation.weight);
            alignment.mult(config.flockingRules.alignment.weight);
            cohesion.mult(config.flockingRules.cohesion.weight);

            dot.acceleration.add(separation);
            dot.acceleration.add(alignment);
            dot.acceleration.add(cohesion);
        }

        // Apply mouse influence if within radius
        if (mouseIsPressed) {
            const distToMouse = p5.Vector.dist(dot.position, mousePos);
            if (distToMouse < config.mouseInfluenceRadius) {
                const repelDir = p5.Vector.sub(dot.position, mousePos);
                const strength = map(distToMouse, 0, config.mouseInfluenceRadius, config.mouseRepelStrength, 0);
                repelDir.normalize().mult(strength);
                dot.acceleration.add(repelDir);
            }
        }

        // Update velocity
        dot.velocity.add(dot.acceleration);
        dot.velocity.limit(dot.maxSpeed);

        // Update position
        dot.position.add(dot.velocity);

        // Handle border wrapping
        if (dot.position.x < 0) dot.position.x = width;
        if (dot.position.x > width) dot.position.x = 0;
        if (dot.position.y < 0) dot.position.y = height;
        if (dot.position.y > height) dot.position.y = 0;

        // Draw the dot
        drawDot(dot);
    }

    // Show debug info if enabled
    if (showDebug) {
        displayDebugInfo();
    }
}

// Draw a single dot
function drawDot(dot) {
    noStroke();
    fill(dot.color);

    // Draw with a slight elongation in the direction of movement
    push();
    translate(dot.position.x, dot.position.y);
    rotate(dot.velocity.heading());

    // Bird-like shape
    beginShape();
    vertex(dot.size, 0);
    vertex(-dot.size, dot.size / 2);
    vertex(-dot.size / 2, 0);
    vertex(-dot.size, -dot.size / 2);
    endShape(CLOSE);

    pop();
}

// Separation: steer to avoid crowding local flockmates
function calculateSeparation(dot, index) {
    const steer = createVector(0, 0);
    let count = 0;

    for (let i = 0; i < dots.length; i++) {
        if (i !== index) {
            const other = dots[i];
            const d = p5.Vector.dist(dot.position, other.position);

            if (d > 0 && d < config.flockingRules.separation.distance) {
                const diff = p5.Vector.sub(dot.position, other.position);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }
    }

    if (count > 0) {
        steer.div(count);
    }

    if (steer.mag() > 0) {
        steer.normalize();
        steer.mult(dot.maxSpeed);
        steer.sub(dot.velocity);
        steer.limit(dot.maxForce);
    }

    return steer;
}

// Alignment: steer towards the average heading of local flockmates
function calculateAlignment(dot, index) {
    const sum = createVector(0, 0);
    let count = 0;

    for (let i = 0; i < dots.length; i++) {
        if (i !== index) {
            const other = dots[i];
            const d = p5.Vector.dist(dot.position, other.position);

            if (d > 0 && d < config.flockingRules.alignment.distance) {
                sum.add(other.velocity);
                count++;
            }
        }
    }

    if (count > 0) {
        sum.div(count);
        sum.normalize();
        sum.mult(dot.maxSpeed);

        const steer = p5.Vector.sub(sum, dot.velocity);
        steer.limit(dot.maxForce);
        return steer;
    } else {
        return createVector(0, 0);
    }
}

// Cohesion: steer to move toward the average position of local flockmates
function calculateCohesion(dot, index) {
    const sum = createVector(0, 0);
    let count = 0;

    for (let i = 0; i < dots.length; i++) {
        if (i !== index) {
            const other = dots[i];
            const d = p5.Vector.dist(dot.position, other.position);

            if (d > 0 && d < config.flockingRules.cohesion.distance) {
                sum.add(other.position);
                count++;
            }
        }
    }

    if (count > 0) {
        sum.div(count);
        return seek(dot, sum);
    } else {
        return createVector(0, 0);
    }
}

// Seek function for cohesion
function seek(dot, target) {
    const desired = p5.Vector.sub(target, dot.position);
    desired.normalize();
    desired.mult(dot.maxSpeed);

    const steer = p5.Vector.sub(desired, dot.velocity);
    steer.limit(dot.maxForce);
    return steer;
}

// Change color scheme on key press
function keyPressed() {
    if (key === ' ') {
        selectedColorScheme = random(config.colorSchemes);
    }

    // Toggle debug info with 'd' key
    if (key === 'd') {
        showDebug = !showDebug;
    }

    // Toggle eye formation with 'e' key
    if (key === 'e') {
        config.eyeFormation.enabled = !config.eyeFormation.enabled;
    }
}

// Add new dots on mouse click
function mouseClicked() {
    for (let i = 0; i < 5; i++) {
        dots.push({
            position: createVector(mouseX, mouseY),
            velocity: createVector(random(-1, 1), random(-1, 1)),
            acceleration: createVector(0, 0),
            size: random(config.dotSizeMin, config.dotSizeMax),
            color: random(selectedColorScheme.dots),
            maxSpeed: config.maxSpeed,
            maxForce: config.maxForce,
            targetPosition: createVector(0, 0)
        });
    }

    // Limit total number of dots
    if (dots.length > config.dotCount * 1.5) {
        dots = dots.slice(dots.length - config.dotCount);
    }
}

function displayDebugInfo() {
    fill(255);
    noStroke();
    textSize(12);
    text(`Dots: ${dots.length}`, 10, 20);
    text(`Framerate: ${floor(frameRate())}`, 10, 40);
    text(`Eye Formation: ${isFormingEye ? 'Active' : 'Inactive'}`, 10, 60);
    text(`Timer: ${eyeFormationTimer}`, 10, 80);
    text(`Press 'e' to toggle eye formation`, 10, 100);
}

function windowResized() {
    resizeCanvas(min(windowWidth - 40, config.canvasWidth),
        min(windowHeight - 40, config.canvasHeight));
} 