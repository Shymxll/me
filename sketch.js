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
            interval: 600, // frames between eye formations
            duration: 380, // frames to maintain eye shape
            outerRadius: 100, // white of the eye (sclera)
            irisRadius: 20,   // colored part (iris)
            pupilRadius: 10    // center black part (pupil)
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
                targetPosition: p.createVector(0, 0),
                eyePartIndex: 0 // 0: white, 1: iris, 2: pupil
            });
        }

        // Initialize eye target to center of canvas
        eyeTarget = p.createVector(p.width / 2, p.height / 2);

        // Assign each dot a fixed part of the eye
        const whiteCount = Math.floor(dots.length * 0.5); // 50% for the white
        const irisCount = Math.floor(dots.length * 0.3);  // 30% for the iris
        // Remaining 20% for the pupil

        // Randomly assign eye parts
        for (let i = 0; i < dots.length; i++) {
            if (i < whiteCount) {
                dots[i].eyePartIndex = 0; // white part
                dots[i].color = p.color(57, 255, 20); // neon green
            } else if (i < whiteCount + irisCount) {
                dots[i].eyePartIndex = 1; // iris part
                dots[i].color = p.color(57, 255, 20); // neon green iris
            } else {
                dots[i].eyePartIndex = 2; // pupil part
                dots[i].color = p.color(0, 0, 0); // black pupil
            }
        }

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
                // Always set the eye target to the center of the canvas
                eyeTarget = p.createVector(p.width / 2, p.height / 2);
                console.log("Starting eye formation at center");
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
                // Calculate target position for eye formation based on dot's eye part
                const angle = p.map(i % (dots.length / 3), 0, dots.length / 3, 0, p.TWO_PI);
                let radius;

                if (dot.eyePartIndex === 0) {
                    // White part (outer)
                    radius = config.eyeFormation.outerRadius;
                } else if (dot.eyePartIndex === 1) {
                    // Iris part (middle)
                    radius = config.eyeFormation.irisRadius;
                } else {
                    // Pupil part (inner)
                    radius = config.eyeFormation.pupilRadius;
                }

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

                // Add boundary force to keep dots inside the canvas
                const boundaryForce = createBoundaryForce(dot);
                boundaryForce.mult(1.5); // Stronger force for boundaries
                dot.acceleration.add(boundaryForce);
            }

            // Update velocity and position
            dot.velocity.add(dot.acceleration);
            dot.velocity.limit(dot.maxSpeed);
            dot.position.add(dot.velocity);

            // Keep dots inside boundaries with bounce effect
            const margin = dot.size;

            if (dot.position.x < margin) {
                dot.position.x = margin;
                dot.velocity.x *= -1; // Reverse x velocity (bounce)
            }
            if (dot.position.x > p.width - margin) {
                dot.position.x = p.width - margin;
                dot.velocity.x *= -1; // Reverse x velocity (bounce)
            }
            if (dot.position.y < margin) {
                dot.position.y = margin;
                dot.velocity.y *= -1; // Reverse y velocity (bounce)
            }
            if (dot.position.y > p.height - margin) {
                dot.position.y = p.height - margin;
                dot.velocity.y *= -1; // Reverse y velocity (bounce)
            }

            // Draw dot with its assigned color (only in eye formation)
            if (isFormingEye) {
                p.fill(dot.color);
            } else {
                // Normal color when not in eye formation
                p.fill(255);
            }
            p.noStroke();
            p.circle(dot.position.x, dot.position.y, dot.size * 2);
        }
    };

    // Create a force to keep dots inside the boundaries
    function createBoundaryForce(dot) {
        const force = p.createVector(0, 0);
        const margin = 50; // How close to the edge before feeling the force
        const maxForce = 0.1; // Maximum boundary force

        // Left boundary
        if (dot.position.x < margin) {
            const strength = p.map(dot.position.x, 0, margin, maxForce, 0);
            force.x += strength;
        }

        // Right boundary
        if (dot.position.x > p.width - margin) {
            const strength = p.map(dot.position.x, p.width - margin, p.width, 0, -maxForce);
            force.x += strength;
        }

        // Top boundary
        if (dot.position.y < margin) {
            const strength = p.map(dot.position.y, 0, margin, maxForce, 0);
            force.y += strength;
        }

        // Bottom boundary
        if (dot.position.y > p.height - margin) {
            const strength = p.map(dot.position.y, p.height - margin, p.height, 0, -maxForce);
            force.y += strength;
        }

        return force;
    }

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
            console.log("Forcing eye formation at center");
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
    // Disable global p5 instance to prevent defaultCanvas creation
    p5.disableFriendlyErrors = true;
    new p5(sketch, 'canvasContainer');
}); 