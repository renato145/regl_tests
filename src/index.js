import { range, randomNormal } from 'd3';
export const regl = require('regl')();
export const fs = require('../shaders/draw_dots.fs.glsl').default;
export const vs = require('../shaders/draw_dots.vs.glsl').default;

const duration = 1500;
const numPoints = 100000;
// the size of the points we draw on screen
const pointWidth = 10;
// dimensions of the viewport we are drawing in
const width = window.innerWidth;
const height = window.innerHeight;
// random number generator from d3-random
const rng = randomNormal(0, 0.15);

// layouts
const greenCircleLayout = points => {
  const rng = randomNormal(0, 0.05);
  points.forEach((d, i) => {
    d.x = (rng() + Math.cos(i)) * (width / 2.5) + width / 2;
    d.y = (rng() + Math.sin(i)) * (height / 2.5) + height / 2;
    d.color = [0, Math.random(), 0]; // random amount of green
  });
}

const blueNormalLayout = points => {
  const rng = randomNormal(0, 0.15);

  points.forEach(d => {
    d.x = (rng() * width) + (width / 2);
    d.y = (rng() * height) + (height / 2);

    // blue-green color
    d.color = [0, 0.5, 0.9];
  });
}

const layouts = [greenCircleLayout, blueNormalLayout];
let currentLayout = 0;

const createDrawPoints = points => regl({
  frag: fs,
  vert: vs,

  attributes: {
    positionStart: points.map(d => [d.sx, d.sy]),
    positionEnd: points.map(d => [d.tx, d.ty]),
    colorStart: points.map(d => d.colorStart),
    colorEnd: points.map(d => d.colorEnd)
  },

  // params passed to the function
  uniforms: {
    pointWidth: regl.prop('pointWidth'),
    stageWidth: regl.prop('stageWidth'),
    stageHeight: regl.prop('stageHeight'),
    duration: regl.prop('duration'),
    elapsed: ( ({ time }, { startTime = 0 }) => (time - startTime) * 1000)
  },

  // specify the number of points to draw
  count: points.length,

  // specify that each vertex is a point (not part of a mesh)
  primitive: 'points',
});

const animate = ( layout, points ) => {
  console.log('Animating with new layout');
  points.forEach(d => {
    d.sx = d.tx;
    d.sy = d.ty;
    d.colorStart = d.colorEnd;
  });

  layout(points);
  points.forEach(d => {
    d.tx = d.x;
    d.ty = d.y;
    d.colorEnd = d.color;
  })

  const drawPoints = createDrawPoints(points);

  // start animation loop
  let startTime = null;
  const frameLoop = regl.frame(({ time }) => {
    if (startTime === null) {
      startTime = time;
    }

    // clear the buffer
    regl.clear({
      // background color (black)
      color: [0, 0, 0, 1],
      depth: 1,
    });

    // draw the points using our created regl func
    // note that the arguments are available via `regl.prop`.
    drawPoints({
      pointWidth,
      stageWidth: width,
      stageHeight: height,
      duration,
      startTime
    });

    if (time - startTime > (duration / 1000)) {
      console.log('done animating, moving to next layout');
      frameLoop.cancel();
      currentLayout = (currentLayout + 1) % layouts.length;
      animate(layouts[currentLayout], points)
    }
  });
};

// create initial set of points
const points = range(numPoints).map(() => ({
  tx: width / 2,
  ty: height / 2,
  colorEnd: [0, 0, 0],
}));

// initial animation
animate(layouts[currentLayout], points);
