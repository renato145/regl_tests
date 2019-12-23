// import { frame, clear } from 'regl';
import { randomNormal, range } from 'd3';
export const regl = require('regl')();

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
  frag: `
  // set the precision of floating point numbers
  precision highp float;

  // this value is populated by the vertex shader
  varying vec3 fragColor;

  void main() {
    // gl_FragColor is a special variable that holds the color
    // of a pixel
    gl_FragColor = vec4(fragColor, 1);
  }
  `,
  vert: `
  // per vertex attributes
  attribute vec2 positionStart;
  attribute vec2 positionEnd;
  attribute vec3 colorStart;
  attribute vec3 colorEnd;

  // variables to send to the fragment shader
  varying vec3 fragColor;

  // values that are the same for all vertices
  uniform float pointWidth;
  uniform float stageWidth;
  uniform float stageHeight;
  uniform float elapsed;
  uniform float duration;

  // helper function to transform from pixel space to normalized
  // device coordinates (NDC). In NDC (0,0) is the middle,
  // (-1, 1) is the top left and (1, -1) is the bottom right.
  vec2 normalizeCoords(vec2 position) {
    // read in the positions into x and y vars
    float x = position[0];
    float y = position[1];

    return vec2(
      2.0 * ((x / stageWidth) - 0.5),
      // invert y to treat [0,0] as bottom left in pixel space
      -(2.0 * ((y / stageHeight) - 0.5)));
  }

  // helper function to handle cubic easing (copied from d3 for consistency)
  // note there are pre-made easing functions available via glslify.
  float easeCubicInOut(float t) {
    t *= 2.0;
    t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;
    if (t > 1.0) {
      t = 1.0;
    }
    return t;
  }

  void main() {
    // update the size of a point based on the prop pointWidth
    gl_PointSize = pointWidth;
    // number between 0 and 1 indicating how far through the animation this
    // vertex is.
    float t;
    // drawing without animation, so show end state immediately
    if (duration == 0.0) {
      t = 1.0;
    // otherwise we are animating, so use cubic easing
    } else {
      t = easeCubicInOut(elapsed / duration);
    }
    // interpolate position
    vec2 position = mix(positionStart, positionEnd, t);
    // interpolate and send color to the fragment shader
    fragColor = mix(colorStart, colorEnd, t);
    // scale to normalized device coordinates
    // gl_Position is a special variable that holds the position of a vertex
    gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);
  }`,

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
