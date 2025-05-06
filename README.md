# Dot Art with p5.js - Bird Flocking Simulation with Eye Formation

An interactive art piece created with p5.js that simulates a flock of birds (boids algorithm), generating a beautiful moving dot pattern that mimics bird flocking behavior and occasionally forms an eye shape.

## Features

- Dots move like a flock of birds using the boids algorithm
- Three key flocking behaviors:
  - Separation: birds avoid crowding each other
  - Alignment: birds tend to follow the same direction as neighbors
  - Cohesion: birds move toward the center of nearby flockmates
- Eye formation behavior:
  - Dots periodically form an eye shape with a pupil
  - Eye appears at random positions on the canvas
  - Formation lasts for a few seconds before returning to flocking
- Bird-like shapes that rotate in the direction of movement
- Mouse interaction: press and hold to repel birds
- Click to add more birds at cursor position
- Press spacebar to change color schemes
- Press 'd' to toggle debug info display
- Press 'e' to toggle eye formation on/off
- Responsive design that works on different screen sizes

## How to Run

1. Simply open the `index.html` file in a modern web browser
2. No installation or build process required

## Interactions

- **Press and hold mouse**: Repels nearby birds
- **Click**: Adds new birds at the cursor position
- **Press spacebar**: Changes the color scheme
- **Press 'd'**: Toggles debug information display
- **Press 'e'**: Toggles eye formation behavior on/off

## The Boids Algorithm

The simulation uses Craig Reynolds' Boids algorithm with three primary rules:
1. **Separation**: Birds steer to avoid crowding local flockmates
2. **Alignment**: Birds steer towards the average heading of local flockmates  
3. **Cohesion**: Birds steer toward the average position of local flockmates

These simple rules create complex emergent behavior that mimics real bird flocks.

## Eye Formation

The eye formation is created by:
1. Periodically selecting a random position on the canvas
2. Arranging 80% of the dots in a circular pattern (the eye)
3. Arranging the remaining 20% in a smaller circle (the pupil)
4. Maintaining the formation for a few seconds
5. Returning to normal flocking behavior

## Customization

You can modify the following parameters in the `sketch.js` file:

- Canvas size
- Number of birds
- Bird size range
- Movement speed and force limits
- Flocking rules (separation, alignment, cohesion) weights and distances
- Eye formation parameters (interval, duration, radius)
- Mouse influence radius
- Color schemes

## Created With

- [p5.js](https://p5js.org/) - JavaScript library for creative coding