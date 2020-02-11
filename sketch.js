// Create a Clifford Algebra with 3,0,1 metric.
const objs = Algebra(3, 0, 1, () => {


  let middleClickPressed = false

  // scale
  const scale = 0.1
  const BASE_CAMERA_DISTANCE = 4.5
  let cameraDistance = 1

  // Degree
  const degree2radian = (deg) => (deg * (3.15149) / 360)

  // Color
  const rMult = 16 * 16 * 16 * 16
  const gMult = 16 * 16
  const rgb2hex = (r = 0, g = 0, b = 0) => r * rMult + g * gMult + b

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
  ].map((x, i) => ({
    data: x,
    selected: false,
    rot: { x: degree2radian(45), y: 0, z: 0 },
    translate: { x: 0, y: 0, z: 0 }
  }));

  // Camera
  const camera = 0e0
  let cameraRotation = 0


  // Render and rotate them using the webGL2 previewer.
  const displayer = document.getElementById("displayer")
  displayer.appendChild(this.graph(() => {

    // Get the time
    const time = performance.now() / 4000;
    // cameraRotation = time
    const res = []

    // Transform all objects
    objs.forEach((obj, i) => {
      camera.set(Math.cos(cameraRotation) + Math.sin(cameraRotation) * 1e13);
      const rotation = obj.rot || { x: 0, y: 0, z: 0 }
      const rotX = rot(rotation.x, 1e23)
      const rotY = rot(rotation.y, 1e12)
      const rotZ = rot(rotation.z, 1e13)
      const X_Move = 1e03 * scale
      const Y_Move = 0e01
      const Z_Move = 1e02 * scale
      const translate = (1 + 1e0 - 2 * Y_Move - ((i % 3)) * X_Move - ((i / 3 | 0)) * Z_Move)
      obj.transform = (translate * rotZ * rotY * rotX)
      let color
      if (obj.color) {
        color = obj.color
      } else if (obj.selected) {
        color = 0x11FF88
      } else {
        color = 0xFF0088
      }
      res.push(color)
      res.push(obj)
    });

    // Return with a color
    // return [0xFF0088, ...objs]
    return res
  }, { gl: 1, animate: true, camera }));


  const center = (n, size) => (n - (size * 0.5)) / size

  // Add a on click button
  displayer.addEventListener('click', (e) => {
    e.preventDefault()

    // Get the x and y coordinates
    let [x, y] = [e.x, e.y]

    // Map them to center
    const ratioX = window.innerWidth / window.innerHeight
    const ratioY = window.innerHeight / window.innerWidth
    x = center(x, window.innerWidth) * -4
    y = center(y, window.innerHeight) * ratioY * 4
    const CR2 = cameraRotation * 1.9

    // Plane point
    const p1 = point(-Math.sin(CR2) * x, y, Math.cos(CR2) * x);
    p1.color = rgb2hex(0, 0, 255)

    // Camera point
    const p2 = point(Math.cos(CR2) * BASE_CAMERA_DISTANCE, 0, Math.sin(CR2) * BASE_CAMERA_DISTANCE)

    // Ray
    const ray = p1 & p2

    // Add to array
    objs.push(p1)
    objs.push(p2)
    objs.push(ray)

    // Test for intersection
    // objs[4].selected = objs[4].selected ? false : true

    let i = 0
    const idInterval = setInterval(() => {
      if (i === 100) {
        clearInterval(idInterval)
      } else {
        const v = 100 / i
        p1.color = rgb2hex(
          255 - (255 * v),
          255 - (24 * v),
          255 - (64 * v),
        )
        p2.color = rgb2hex(
          255 - (0 * v),
          255 - (64 * v),
          255 - (24 * v),
        )
        ray.color = rgb2hex(
          255 - (0 * v),
          255 - (0 * v),
          255 - (0 * v),
        )
        console.log(objs)
      }
      ++i
    }, 100)


    return false
  })

  let lastX = -1
  document.body.addEventListener('mousemove', (e) => {
    if (e.shiftKey) {
      if (lastX === -1) {
        lastX = e.x
        return
      }
      const delta = -(lastX - e.x)
      lastX = e.x
      cameraRotation += degree2radian(delta)
    } else {
      lastX = -1
    }
  })

  return objs

});