// import { frame, clear } from 'regl';
import { randomNormal, range } from 'd3';
export const regl = require('regl')();

const numPoints = 5000;

// the size of the points we draw on screen
const pointWidth = 4;

// dimensions of the viewport we are drawing in
const width = window.innerWidth;
const height = window.innerHeight;

// random number generator from d3-random
const rng = randomNormal(0, 0.15);

// create initial set of points
const points = range(numPoints).map(() => ({
  x: (rng() * width) + (width / 2),
  y: (rng() * height) + (height / 2),
  color: [0, Math.random(), 0],
}));

const drawPoints = regl({
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
  attribute vec2 position;
  attribute vec3 color;

  // variables to send to the fragment shader
  varying vec3 fragColor;

  // values that are the same for all vertices
  uniform float pointWidth;
  uniform float stageWidth;
  uniform float stageHeight;

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

  void main() {
    // update the size of a point based on the prop pointWidth
    gl_PointSize = pointWidth;

    // send color to the fragment shader
    fragColor = color;

    // scale to normalized device coordinates
    // gl_Position is a special variable that holds the position
    // of a vertex
    gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);
  }`,

  attributes: {
    position: points.map(d => [d.x, d.y]),
    color: points.map(d => d.color),
  },

  // params passed to the function
  uniforms: {
    pointWidth: regl.prop('pointWidth'),
    stageWidth: regl.prop('stageWidth'),
    stageHeight: regl.prop('stageHeight'),
  },

  // specify the number of points to draw
  count: points.length,

  // specify that each vertex is a point (not part of a mesh)
  primitive: 'points',
});

// start the regl draw loop
regl.frame(() => {
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
  });
});
