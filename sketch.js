/**
 * 
 * Copied from https://gist.github.com/mjackson/5311256
 * 
 *
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

let lastEvent

function onTouch(evt) {
  evt.preventDefault();
  evt.cancelBubble = true
  evt.stopPropagation()
  if (evt.touches.length > 1 || (evt.type == "touchend" && evt.touches.length > 0))
    return;

  var newEvt = document.createEvent("MouseEvents");
  var touch = event.changedTouches[0]
  if (event.type === "touchstart") {
    newEvt.initMouseEvent("click", true, true, event.originalTarget.ownerDocument.defaultView, 0, touch.screenX, touch.screenY, touch.clientX, touch.clientY,evt.ctrlKey, evt.altKey, evt.shirtKey, evt.metaKey, 0, null);
    event.originalTarget.dispatchEvent(newEvt);
  }
}

const $score = document.getElementById('score')
const changeScore = (newScore) => {
  $score.innerHTML = `Score : ${newScore}`
}

const $speed = document.getElementById('speed')
const changeSpeed = (newSpeed) => {
  $speed.innerHTML = `${newSpeed} ms`
}

// Create a Clifford Algebra with 3,0,1 metric.
const objs = Algebra(3, 0, 1, () => {
  
  const scale = 0.1
  const AMPLITUDE = 2
  const HALF_AMPLITUDE = AMPLITUDE * 0.5
  const BASE_CAMERA_DISTANCE = 4.5
  const BASE_CAMERA_ROTATION_SPEED = 0.3
  const BASE_TIME_INTERVAL = 1500

  let hideObjs = false
  let hideTemps = true
  let gamePaused = false
  let deltaNoise = 0
  let cameraDistance = 1
  let score = 0
  changeScore(score)
  let timeInterval = BASE_TIME_INTERVAL
  changeSpeed(timeInterval)
  let objs = []
  let permanent = []
  let temps = []

  // Camera
  const camera = 0e0
  let cameraRotation = 0
  
  // Generator
  const generator = new Simple1DNoise()
  generator.setScale(0.1)
  generator.setAmplitude(AMPLITUDE)
  console.log(generator);

  // Degree
  const degree2radian = (deg) => (deg * (3.15149) / 360)

  // Color
  const rMult = 16 * 16 * 16 * 16
  const gMult = 16 * 16
  const rgb2hex = (r = 0, g = 0, b = 0) => r * rMult + g * gMult + b

  const point = (x, y, z) => 1e123 - x * 1e012 + y * 1e013 + z * 1e023
  const line = (px, py, pz, dx, dy, dz) => px * 1e01 + py & 1e02 + pz * 1e03 + dx * 1e12 + dy * 1e13 + dz * 1e23

  // rotation helper and Lathe function.
  const rot = (a, P) => Math.cos(a) + Math.sin(a) * P.Normalized
  const lathe = (X, n, P, m) => [...Array(n + 1)].map((x, i) => rot(i / n * Math.PI * (m || 1), P) >>> X)

  const dist_pp = (P1, P2) => (P1.Normalized & P2.Normalized).Length    // point to point


  // Useful joins
  const line_from_points = (P1, P2) => P1.Normalized & P2.Normalized;
  const plane_from_points = (P1, P2, P3) => P1 & P2 & P3;
  const plane_from_point_and_line = (P, L) => P & L;

  // Usefull meets
  const line_from_planes = (p1, p2) => p1 ^ p2;
  const point_from_planes = (p1, p2, p3) => p1 ^ p2 ^ p3;
  const point_from_line_and_plane = (L, P) => L ^ P;

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
  const sphere = (r = 1, x = 32, y = 16) => wrap(lathe(lathe(!(1e0 + r * scale * 1e1), y, 1e13, .5), x, 1e23))

  const makeSphere = () => {
    const obj = {
      data: sphere(Math.random() + 1),
      selected: false,
      translate: { x: generator.getVal(deltaNoise), y: 2, z: generator.getVal(deltaNoise + 10) },
      scale: 1,
      offset: { x: deltaNoise, z: deltaNoise + 10 },
      verticalSpeed: 0.01,
      name: '',
    }
    deltaNoise += 20
    setInterval(() => {
      obj.translate.x = (generator.getVal(obj.offset.x += 0.1)) - HALF_AMPLITUDE
      obj.translate.z = (generator.getVal(obj.offset.z += 0.1)) - HALF_AMPLITUDE
      obj.translate.y -= (obj.verticalSpeed)
    }, 25)
    return obj

  }

  // A selection of these objects.
  const addToTemps = (obj, timeout = 10000) => {
    temps.push(obj)
    setTimeout(() => {
      const idx = temps.findIndex((d) => d == obj)
      temps.splice(idx, 1)
    }, timeout)
  }

  // Default
  objs = [
    sphere(1),
    sphere(1),
    sphere(1),
  ].map((x, i) => {
    const obj = {
      data: x,
      selected: false,
      translate: { x: -(i / 3 | 0), y: 2, z: -(i % 3) + 1 },
      scale: 1,
      offset: { x: deltaNoise, z: deltaNoise + 10 },
      verticalSpeed: 0.01,
      name: '',
    }
    deltaNoise += 20
    setInterval(() => {
      obj.translate.x = (generator.getVal(obj.offset.x += 0.1)) - HALF_AMPLITUDE
      obj.translate.z = (generator.getVal(obj.offset.z += 0.1)) - HALF_AMPLITUDE
      obj.translate.y -= (obj.verticalSpeed)
    }, 25)
    return obj
  });

  // Permanents
  const defaultObj = () => {
    const array = []
    const p1 = point(1, 2, 0)
    const p2 = point(1, -2, 0)
    const ray = p2 & p1
    const p3 = point(1, -2, 1)
    const p4 = point(1, -2, 1)
    const ray12 = p4 & p3
    array.push(point(1, 2, 1)) // p0
    array.push(point(1, -2, 1)) // p1
    array.push(point(-1, 2, -1)) // p2
    array.push(point(-1, -2, -1)) // p3
    array.push(point(-1, 2, 1)) // p4
    array.push(point(-1, -2, 1)) // p5
    array.push(point(1, 2, -1)) // p6
    array.push(point(1, -2, -1))  // p7
    array.push(array[1] & array[0]) // ray0 : p1 & p0
    array.push(array[3] & array[2]) // ray1 : p3 & p2
    array.push(array[5] & array[4]) // ray2 : p5 & p4
    array.push(array[7] & array[6]) // ray3 : p7 & p6
    array.push(array[8] << array[0]) // plane1 : ray0 << p0 
    array.push(array[8] << array[1]) // plane1 : ray0 << p1
    permanent = array
  }
  defaultObj()


  // GAME LOOP
  const oneLoop = () => {
    if (timeInterval > 750) {
      timeInterval -= 10
      changeSpeed(timeInterval)
    }
    objs.push(makeSphere())
    setTimeout(oneLoop, timeInterval)
  }
  setTimeout(oneLoop, timeInterval)

  // Game over
  const gameOver = () => {
    console.log('lost')
    deltaNoise = 0
    score = 0
    changeScore(score)
    timeInterval = BASE_TIME_INTERVAL
    changeSpeed(timeInterval)
    objs = []
  }

  // Render and rotate them using the webGL2 previewer.
  const displayer = document.getElementById("displayer")
  console.log(displayer)
  displayer.appendChild(this.graph(() => {

    // Move camera
    camera.set(Math.cos(cameraRotation) + Math.sin(cameraRotation) * 1e13);

    // Get the time
    const time = performance.now() / 4000;
    const res = []

    
    permanent.forEach((obj, i) => {
      // res.push(0x11FF88)
      res.push(obj)
    });

    // Transform all objects
    objs.forEach((obj, i) => {
      if (hideObjs) return
      const X_Move = (obj.translate.x / 2) * 1e03
      const Y_Move = (obj.translate.y / 2) * 1e02
      const Z_Move = (obj.translate.z / 2) * 1e01
      const translate = (1 + 1e0 + Y_Move + X_Move + Z_Move)
      // const translate = (1 + 1e0 - 3e01 - ((i % 3) - 1) * 1.5e03 - ((i / 3 | 0) - 1.5) * 1.5e02)
      obj.transform = translate

      if (obj.translate.y < -2) {
        gameOver()
      }

      // Color it
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

    temps.forEach((obj, i) => {
      if ( hideTemps ) return
      if (obj.translate) {        
        const X_Move = (obj.translate.x / 2) * 1e03
        const Y_Move = (obj.translate.y / 2) * 1e02
        const Z_Move = (obj.translate.z / 2) * 1e01
        const translate = (1 + 1e0 + Y_Move + X_Move + Z_Move)
        obj.transform = translate
      }
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
    })


    // Return with a color
    // return [0xFF0088, ...objs]
    return res
  }, { gl: true, animate: true, camera, grid: true }));


  const center = (n, size) => (n - (size * 0.5)) / size

  displayer.addEventListener('touchstart', onTouch)
  displayer.addEventListener('touchend', onTouch)
  displayer.addEventListener('touchmove', onTouch)

  // Add a on click button
  displayer.addEventListener('click', (e) => {
    e.preventDefault()
    if (lastEvent && e.x == lastEvent.x && e.y == lastEvent.y) {
      lastEvent = undefined
      console.log('Duplicate prevented')
      return
    } 
    lastEvent = e

    // Get the x and y coordinates
    let [x, y] = [e.x, e.y]

    // Map them to center
    const ratioY = displayer.clientHeight / displayer.clientWidth
    // x = (center(x, (displayer.clientWidth + (displayer.offsetLeft))) * -4)
    const xOff = (displayer.offsetLeft / displayer.clientWidth ) * -4
    x = center(x, displayer.clientWidth) * -4 - xOff
    y = center(y, displayer.clientHeight) * ratioY * 4
    const CR2 = cameraRotation * 2

    // Plane point

    
    const translateP1 = {
      x: -Math.sin(CR2) * x,
      y,
      z: Math.cos(CR2) * x
    }
    const p1 = point(translateP1.x, translateP1.y, translateP1.z);
    p1.color = rgb2hex(255, 192, 225)
    p1.name = 'Plane point'
    addToTemps(p1)

    // Camera point
    const cameraPoint = point(Math.cos(CR2) * BASE_CAMERA_DISTANCE, 0, Math.sin(CR2) * BASE_CAMERA_DISTANCE)
    cameraPoint.color = rgb2hex(255, 62, 99)
    cameraPoint.name = 'Camera point'
    addToTemps(cameraPoint)


    // Ray
    const ray = p1 & cameraPoint
    ray.color = rgb2hex(255, 192, 225)
    ray.name = 'Ray'
    addToTemps(ray)

    // Test for intersection
    console.log('objs', objs)

    // Sort by distance
    objs.sort((A, B) => {
      // Find center
      const A_center = point(-A.translate.x, -A.translate.y, A.translate.z);
      const B_center = point(-B.translate.x, -B.translate.y, B.translate.z);
      const A_distance = dist_pp(A_center, cameraPoint)
      const B_distance = dist_pp(B_center, cameraPoint)
      return A_distance > B_distance
    })

    // Find the first intersection
    const objIntersectedIndex = objs.findIndex(obj => {

      // Find center of the sphere
      const center = point(-obj.translate.x, -obj.translate.y, obj.translate.z);
      
      // Ray from camera to center
      const rayFromCameraToCenter = center & cameraPoint;
      
      // Create orthogonal plane
      const plane = rayFromCameraToCenter << center;
      
      // Ray from camera to plane
      const pointInPlane = ray ^ plane
      
      center.color = rgb2hex(0, 62, 99);
      rayFromCameraToCenter.color = rgb2hex(120, 250, 20);
      plane.color = rgb2hex(20, 250, 20);
      pointInPlane.color = rgb2hex(255, 0, 0)

      addToTemps(center);
      addToTemps(rayFromCameraToCenter)
      addToTemps(plane);
      addToTemps(pointInPlane)

      // Find the distance
      const distance = dist_pp(center, pointInPlane)
      return distance < (scale*1.5)

      /*
      // OLD NOT WORKING VERSION
      const rayToCenter = center & p1
      rayToCenter.color = rgb2hex(10, 50, 125)
      addToTemps(rayToCenter)
      
      const d = dist_pp(center, p1)
      const intersected = d <= scale
      if (intersected) obj.selected = Boolean(1 - obj.selected)
      return intersected
      */
      
    })
    
    if (objIntersectedIndex != -1) {
      const objIntersected = objs[objIntersectedIndex]
      const i = objIntersectedIndex
      changeScore(score += 1)
      objIntersected.selected = Boolean(1 - objIntersected.selected)
      setTimeout(() => {
        objs = objs.slice(0, i).concat(objs.slice(i + 1))
      }, 200)
    }
    return false
  })

  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'h') hideObjs = true
    if (e.key === 'j') hideTemps = Boolean(1-hideTemps)
    if (e.key === 'space') gamePaused = Boolean(1-gamePaused)
  })

  document.body.addEventListener('keyup', (e) => {
    if (e.key === 'h') hideObjs = false
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
      cameraRotation += degree2radian(delta * BASE_CAMERA_ROTATION_SPEED)
    } else {
      lastX = -1
    }
  })

  return { ...objs, ...temps }

});
