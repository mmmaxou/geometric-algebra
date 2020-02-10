// Create a Clifford Algebra with 3,0,1 metric.
const objs = Algebra(3, 0, 1, () => {

  // rotation helper and Lathe function.
  const point = (x, y, z) => 1e123 - x * 1e012 + y * 1e013 + z * 1e023
  const rot = (a, P) => Math.cos(a) + Math.sin(a) * P.Normalized
  const lathe = (X, n, P, m) => [...Array(n + 1)].map((x, i) => rot(i / n * Math.PI * (m || 1), P) >>> X)

  // wrap takes X, a double array of points, and generates triangles.
  const wrap = (X) => {
    const u = X.length - 1
    const v = X[0].length - 1
    X = [].concat.apply([], X);
    const P = []
    const vp = v + 1
    for (var i = 0; i < u * vp; i += vp)
      for (var j = 0; j < v; j++)
        P.push([i + j, i + j + 1, vp + i + j], [i + j + 1, vp + i + j, vp + i + j + 1]);
    return P.map(x => x.map(x => X[x]));
  }

  // Basic primitives constructed by Lathing points, line segments, etc.
  const cylinder = (r = 1, h = 1, x = 32) => wrap(lathe([!1e0, !(1e0 + r * 1e3), !(1e0 + r * 1e3 + h * 1e1), !(1e0 + h * 1e1)], x, 1e23))
  const torus = (r = .3, r2 = .25, x = 32, y = 16) => wrap(lathe((1 + r * .5e03) >>> lathe(!(1e0 + r2 * (1e1 + 1e3) / 2 ** .5), y, 1e13), x, 1e23))
  const sphere = (r = 1, x = 32, y = 16) => wrap(lathe(lathe(!(1e0 + r * 1e1), y, 1e13, .5), x, 1e23))
  const cone = (r = 1, h = 1, x = 64) => wrap(lathe([!1e0, !(1e0 + r * 1e3), !(1e0 + h * 1e1)], x, 1e23))
  const arrow = () => [...cone(.15, .3), ...cone(.15, 0), ...cylinder(.05, -2)]

  // A selection of these objects.
  const objs = [
    arrow(),
    torus(0.8, .3),
    sphere(.8),
    sphere(.8, 3, 2),
    cone(1, 2 ** .5, 3),
    cone(1, 2 ** .5, 4),
    cone(1, 2 ** .5),
    torus(.8, .2, 5, 32),
    cylinder(),
    cylinder(1, 2 ** .5, 4),
    torus(.8, .3, 4, 4),
    torus(.8, .3, 64, 4)
  ].map(x => ({ data: x }));

  const camera = 0e0

  // Render and rotate them using the webGL2 previewer.
  const displayer = document.getElementById("displayer")
  displayer.appendChild(this.graph(() => {

    // Get the time
    const time = performance.now() / 1000;
    camera.set(Math.cos(time) + Math.sin(time) * 1e13)

    const res = []

    // Transform all objects
    objs.forEach((obj, i) => {
      const scale = 1.5
      const rotY = rot(time, 1e12)
      const rotZ = rot(time * 0.331, 1e13)
      const X_Move = 1e03 * scale
      const Y_Move = 3e01 * scale
      const Z_Move = 1e02 * scale
      const translate = (1 + 2e0 - Y_Move - ((i % 3) - 1) * X_Move - ((i / 3 | 0) - 1.5) * Z_Move)
      obj.transform = (translate * rotZ * rotY).Scale(0.1)
      res.push(obj.selected ? 0x11FF88 : 0xFF0088)
      res.push(obj)
    });

    // Return with a color
    // return [0xFF0088, ...objs]
    return res
  }, { gl: 1, animate: true, camera }));


  const center = (n, size) => (n - (size / 2)) / size

  // Add a on click button
  displayer.addEventListener('click', (e) => {
    console.log('event is ', e)
    let [x, y] = [e.x, e.y]
    x = center(x, window.innerWidth)
    y = center(y, window.innerHeight)
    console.log(`${x} and ${y}`)
    console.log(objs)

    const p1 = point(x, y, 0);
    objs.push(p1)

    // Test for intersection
    objs[4].selected = objs[4].selected ? false : true

  })

  return objs

});
console.log(objs)