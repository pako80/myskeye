/* Photoreal Earth (three.js). Driven by globe.js: it supplies camera, spin and cross-fade each frame,
   so the vector globe can dissolve into this one. If the textures fail to load, `ready` stays false
   and the vector globe simply keeps running. */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const hero = document.getElementById('top');
const vector = document.getElementById('globe');
if (hero && vector) {
  const IMG = 'https://unpkg.com/three-globe@2.31.0/example/img/';
  const canvas = document.createElement('canvas');
  canvas.id = 'earth';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.opacity = '0';
  hero.insertBefore(canvas, vector);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  const tiltGroup = new THREE.Group();
  scene.add(tiltGroup);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 128),
    new THREE.MeshPhongMaterial({ color: 0xffffff, specular: new THREE.Color(0x4a5a70), shininess: 14, bumpScale: 0.03 })
  );
  tiltGroup.add(earth);

  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(-1, 1, 5);
  scene.add(sun);

  const api = { ready: false };
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  const prep = (t, color) => { t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); if (color) t.colorSpace = THREE.SRGBColorSpace; return t; };
  loader.load(IMG + 'earth-day.jpg', (t) => {
    earth.material.map = prep(t, true);
    earth.material.emissiveMap = earth.material.map;   // keeps the shadow side readable, like Google Earth
    earth.material.emissive = new THREE.Color(0xffffff);
    earth.material.emissiveIntensity = 0.55;
    earth.material.needsUpdate = true;
    api.ready = true;
  });
  loader.load(IMG + 'earth-topology.png', (t) => { earth.material.bumpMap = prep(t); earth.material.needsUpdate = true; });
  loader.load(IMG + 'earth-water.png', (t) => { earth.material.specularMap = prep(t); earth.material.needsUpdate = true; });

  let key = '';
  api.render = (s) => {
    canvas.style.opacity = String(s.mix);
    if (s.mix <= 0.001) return;
    const k = [s.W, s.H, s.dpr, s.f, s.dx, s.dy, s.D].join();
    if (k !== key) {
      key = k;
      renderer.setPixelRatio(s.dpr);
      renderer.setSize(s.W, s.H, false);
      canvas.style.width = s.W + 'px';
      canvas.style.height = s.H + 'px';
      camera.aspect = s.W / s.H;
      camera.fov = (2 * Math.atan(s.H / 2 / s.f) * 180) / Math.PI;   // same focal length as the vector globe
      camera.position.set(0, 0, s.D);
      camera.setViewOffset(s.W, s.H, -s.dx, -s.dy, s.W, s.H);         // same on-screen centre
      camera.updateProjectionMatrix();
    }
    earth.rotation.y = s.yaw;
    tiltGroup.rotation.x = s.tilt;
    renderer.render(scene, camera);
  };
  window.skEarth = api;
}
