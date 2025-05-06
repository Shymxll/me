// P5.js dot art with eye formation
// Using instance mode for better compatibility

let sketch = function (p) {
    // Configuration
    const config = {
        dotCount: 300,
        dotSize: 5,
        maxSpeed: 2,
        eyeFormation: {
            enabled: true,
            interval: 300, // frames between eye formations
            duration: 180, // frames to maintain eye shape
            radius: 100,   // outer circle radius
            pupilRadius: 40 // inner circle (pupil) radius
        }
    };

    // Variables
    let dots = [];
    let eyeFormationTimer = 0;
    let isFormingEye = false;
    let eyeTarget;

    p.setup = function () {
        console.log("Setup starting...");

        // Create canvas
        p.createCanvas(400, 400);
        console.log("Canvas created");

        // Create dots
        for (let i = 0; i < config.dotCount; i++) {
            dots.push({
                position: p.createVector(p.random(p.width), p.random(p.height)),
                velocity: p.createVector(p.random(-1, 1), p.random(-1, 1)),
                acceleration: p.createVector(0, 0),
                size: p.random(3, config.dotSize),
                color: p.color(255),
                maxSpeed: config.maxSpeed,
                maxForce: 0.1,
                targetPosition: p.createVector(0, 0)
            });
        }

        // Initialize eye target
        eyeTarget = p.createVector(p.width / 2, p.height / 2);

        console.log("Setup complete");
    };

    p.draw = function () {
        // Clear background
        p.background(0);

        // Eye formation logic
        if (config.eyeFormation.enabled) {
            eyeFormationTimer++;

            // Start new eye formation
            if (!isFormingEye && eyeFormationTimer >= config.eyeFormation.interval) {
                isFormingEye = true;
                eyeFormationTimer = 0;
                eyeTarget = p.createVector(p.random(p.width * 0.3, p.width * 0.7),
                    p.random(p.height * 0.3, p.height * 0.7));
                console.log("Starting eye formation at", eyeTarget.x, eyeTarget.y);
            }

            // End eye formation
            if (isFormingEye && eyeFormationTimer >= config.eyeFormation.duration) {
                isFormingEye = false;
                eyeFormationTimer = 0;
                console.log("Ending eye formation");
            }
        }

        // Update and draw dots
        for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];

            // Reset acceleration
            dot.acceleration.mult(0);

            if (isFormingEye) {
                // Calculate target position for eye formation
                const angle = p.map(i, 0, dots.length, 0, p.TWO_PI);
                const radius = i < dots.length * 0.7 ? config.eyeFormation.radius : config.eyeFormation.pupilRadius;
                const targetX = eyeTarget.x + p.cos(angle) * radius;
                const targetY = eyeTarget.y + p.sin(angle) * radius;
                dot.targetPosition = p.createVector(targetX, targetY);

                // Steer towards eye formation
                const eyeForce = seek(dot, dot.targetPosition);
                eyeForce.mult(2); // Stronger force for eye formation
                dot.acceleration.add(eyeForce);
            } else {
                // Normal flocking behavior
                const separation = calculateSeparation(dot, i);
                const alignment = calculateAlignment(dot, i);
                const cohesion = calculateCohesion(dot, i);

                separation.mult(1.5);
                alignment.mult(1.0);
                cohesion.mult(1.0);

                dot.acceleration.add(separation);
                dot.acceleration.add(alignment);
                dot.acceleration.add(cohesion);
            }

            // Update velocity and position
            dot.velocity.add(dot.acceleration);
            dot.velocity.limit(dot.maxSpeed);
            dot.position.add(dot.velocity);

            // Wrap around edges
            if (dot.position.x < 0) dot.position.x = p.width;
            if (dot.position.x > p.width) dot.position.x = 0;
            if (dot.position.y < 0) dot.position.y = p.height;
            if (dot.position.y > p.height) dot.position.y = 0;

            // Draw dot
            p.fill(dot.color);
            p.noStroke();
            p.circle(dot.position.x, dot.position.y, dot.size * 2);
        }

        // Display status info
        p.fill(255);
        p.textSize(14);
        p.text("Dot Count: " + dots.length, 10, 20);
        p.text("Eye Formation: " + (isFormingEye ? "Active" : "Inactive"), 10, 40);
        p.text("Timer: " + eyeFormationTimer, 10, 60);
        p.text("Press 'e' to toggle eye formation", 10, 80);
    };

    // Key pressed handler
    p.keyPressed = function () {
        if (p.key === 'e') {
            config.eyeFormation.enabled = !config.eyeFormation.enabled;
            console.log("Eye formation " + (config.eyeFormation.enabled ? "enabled" : "disabled"));
        }

        if (p.key === 'f') {
            isFormingEye = true;
            eyeFormationTimer = 0;
            eyeTarget = p.createVector(p.width / 2, p.height / 2);
            console.log("Forcing eye formation");
        }
    };

    // Separation: steer to avoid crowding local flockmates
    function calculateSeparation(dot, index) {
        const steer = p.createVector(0, 0);
        let count = 0;
        const desiredSeparation = 25;

        for (let i = 0; i < dots.length; i++) {
            if (i !== index) {
                const d = p5.Vector.dist(dot.position, dots[i].position);

                if (d > 0 && d < desiredSeparation) {
                    const diff = p5.Vector.sub(dot.position, dots[i].position);
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
        const sum = p.createVector(0, 0);
        let count = 0;
        const neighborDist = 50;

        for (let i = 0; i < dots.length; i++) {
            if (i !== index) {
                const d = p5.Vector.dist(dot.position, dots[i].position);

                if (d > 0 && d < neighborDist) {
                    sum.add(dots[i].velocity);
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
            return p.createVector(0, 0);
        }
    }

    // Cohesion: steer to move toward the average position of local flockmates
    function calculateCohesion(dot, index) {
        const sum = p.createVector(0, 0);
        let count = 0;
        const neighborDist = 50;

        for (let i = 0; i < dots.length; i++) {
            if (i !== index) {
                const d = p5.Vector.dist(dot.position, dots[i].position);

                if (d > 0 && d < neighborDist) {
                    sum.add(dots[i].position);
                    count++;
                }
            }
        }

        if (count > 0) {
            sum.div(count);
            return seek(dot, sum);
        } else {
            return p.createVector(0, 0);
        }
    }

    // Seek function for steering towards a target
    function seek(dot, target) {
        const desired = p5.Vector.sub(target, dot.position);
        desired.normalize();
        desired.mult(dot.maxSpeed);

        const steer = p5.Vector.sub(desired, dot.velocity);
        steer.limit(dot.maxForce);
        return steer;
    }
};

// Create instance and add it to the page
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded, creating p5 instance");
    new p5(sketch, 'canvasContainer');
});

// Also try global mode
function setup() {
    console.log("Global mode setup");
    createCanvas(400, 400);
    background(0);
    fill(255);
    circle(width / 2, height / 2, 50);
}

function draw() {
    // Nothing in global mode
} 