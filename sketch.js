// Create a Clifford Algebra with 3,0,1 metric.
const objs = Algebra(3, 0, 1, () => {


  let middleClickPressed = false

  // scale
  const scale = 0.1

  // Degree
  const degree2radian = (deg) => (deg * (3.15149) / 360)

  // rotation helper and Lathe function.
  const point = (x, y, z) => 1e123 - x * 1e012 + y * 1e013 + z * 1e023
  const line = (px, py, pz, dx, dy, dz) => px * 1e01 + py & 1e02 + pz * 1e03 + dx * 1e12 + dy * 1e13 + dz * 1e23
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
  const cube = (r = 1) => cylinder(r * scale, r * scale * 1.33, 4)

  // A selection of these objects.
  const objs = [
    cube(1),
    cube(1),
    cube(1),
  ].map((x, i) => ({ data: x, selected: false, rot: { x: degree2radian(45), y: 0, z: 0 } }));

  // Camera
  const camera = 0e0
  let cameraRotationX = 0


  // Render and rotate them using the webGL2 previewer.
  const displayer = document.getElementById("displayer")
  displayer.appendChild(this.graph(() => {

    // Get the time
    const time = performance.now() / 4000;
    // cameraRotationX = time
    const res = []

    // Transform all objects
    objs.forEach((obj, i) => {
      camera.set(Math.cos(cameraRotationX) + Math.sin(cameraRotationX) * 1e13);
      const rotation = obj.rot || { x: 0, y: 0, z: 0 }
      const rotX = rot(rotation.x, 1e23)
      const rotY = rot(rotation.y, 1e12)
      const rotZ = rot(rotation.z, 1e13)
      const X_Move = 1e03 * scale
      const Y_Move = 0e01 * scale
      const Z_Move = 1e02 * scale
      const translate = (1 + 2e0 - Y_Move - ((i % 3) - 1) * X_Move - ((i / 3 | 0) - 1.5) * Z_Move)
      obj.transform = (translate * rotZ * rotY * rotX)
      res.push(obj.selected ? 0x11FF88 : 0xFF0088)
      res.push(obj)
    });

    // Return with a color
    // return [0xFF0088, ...objs]
    return res
  }, { gl: 1, animate: true, camera }));


  const center = (n, size) => (n - (size * 0.5)) * 2 / size

  // Add a on click button
  displayer.addEventListener('click', (e) => {
    console.log('event is ', e)
    let [x, y] = [e.x, e.y]
    x = center(x, window.innerWidth)
    y = center(y, window.innerHeight)
    console.log(`${x} and ${y}`)
    console.log(objs)

    const p1 = point(x, y, 0);
    const p2 = point(x, y, -10)
    const ray = line(p1.e012, p1.e013, p1.e023, p2.e012, p2.e013, p2.e023)
    objs.push(p1)
    objs.push(p2)
    objs.push(ray)

    // Test for intersection
    objs[4].selected = objs[4].selected ? false : true


    const time = performance.now() / 4000;
    console.log('time is ', time)

  })

  let lastX = -1
  document.body.addEventListener('mousemove', (e) => {
    if (e.shiftKey) {
      const delta = -(lastX - e.x)
      lastX = e.x
      cameraRotationX += degree2radian(delta)
    }
  })

  return objs

});
console.log(objs)