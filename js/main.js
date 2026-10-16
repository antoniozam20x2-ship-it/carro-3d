/* ============================================================
   Deportivo 3D — visor low-poly con Three.js (demo)
   Todo el carro es geometría procedural: no hay archivos de
   modelo externos. Solo se necesita un navegador con WebGL.
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas   = document.getElementById('escena');
const overlay  = document.getElementById('carga');
const hintEl   = document.getElementById('hint');
const resetBtn = document.getElementById('reset');

if (window.matchMedia('(hover: none)').matches) {
  hintEl.textContent = 'Arrastra para girar · pellizca para acercar';
}

/* ---------------- renderer ---------------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  overlay.innerHTML = '<p class="err">Tu navegador no pudo iniciar WebGL.<br>Prueba con Chrome, Edge o Safari actualizados.</p>';
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* ---------------- escena y fondo ---------------- */
const FONDO = 0x141c29;
const scene = new THREE.Scene();
scene.background = texturaDegradado();
scene.fog = new THREE.Fog(FONDO, 16, 52);

function texturaDegradado() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0.00, '#212c41');
  gr.addColorStop(0.42, '#141c29');
  gr.addColorStop(1.00, '#070a0f');
  g.fillStyle = gr;
  g.fillRect(0, 0, 8, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- cámara y controles ---------------- */
const MIRA = new THREE.Vector3(0, 0.72, 0);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 300);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(MIRA);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.rotateSpeed = 0.85;
controls.zoomSpeed = 0.8;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = 1.50;
controls.update();

/* dos encuadres: pantalla ancha y pantalla vertical (celular) */
const VISTAS = {
  ancha: {
    dir: new THREE.Vector3(0.68, 0.40, 0.74).normalize(),
    fov: 34, ancho: 5.2, alto: 2.8, margen: 1.34
  },
  vertical: {
    dir: new THREE.Vector3(0.80, 0.44, 0.41).normalize(),
    fov: 40, ancho: 4.4, alto: 3.0, margen: 1.15
  }
};
let vista = VISTAS.ancha;

/* ---------------- luces ---------------- */
const key = new THREE.DirectionalLight(0xffffff, 2.7);
key.position.set(5.5, 9, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 2;
key.shadow.camera.far = 30;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.02;
key.shadow.camera.updateProjectionMatrix();
scene.add(key);

const relleno = new THREE.DirectionalLight(0x9fc0ff, 1.0);
relleno.position.set(-7, 4.5, 3);
scene.add(relleno);

const contra = new THREE.DirectionalLight(0xffc98a, 1.5);
contra.position.set(-4, 3.2, -7.5);
scene.add(contra);

scene.add(new THREE.HemisphereLight(0xd7e6ff, 0x1a1418, 0.55));

/* ---------------- reflejos de estudio ---------------- */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

/* ---------------- piso ---------------- */
const piso = new THREE.Mesh(
  new THREE.CircleGeometry(55, 64),
  new THREE.MeshStandardMaterial({ color: 0x161d2a, roughness: 0.55, metalness: 0.2 })
);
piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
scene.add(piso);

/* ---------------- materiales ---------------- */
const matPintura = new THREE.MeshStandardMaterial({ color: 0xc01340, metalness: 0.55, roughness: 0.30, flatShading: true });
const matVidrio  = new THREE.MeshStandardMaterial({ color: 0x0a1120, metalness: 0.95, roughness: 0.07, flatShading: true });
const matNegro   = new THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.15, roughness: 0.75, flatShading: true });
const matPozo    = new THREE.MeshStandardMaterial({ color: 0x0c0e12, metalness: 0.20, roughness: 0.70, flatShading: true, side: THREE.DoubleSide });
const matLlanta  = new THREE.MeshStandardMaterial({ color: 0x14161b, metalness: 0.05, roughness: 0.92, flatShading: true });
const matRin     = new THREE.MeshStandardMaterial({ color: 0xc6ced9, metalness: 1.0,  roughness: 0.22, flatShading: true });
const matFaro    = new THREE.MeshStandardMaterial({ color: 0xcfe0ff, emissive: 0x9dc4ff, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.18 });
const matCalavera= new THREE.MeshStandardMaterial({ color: 0x2a0008, emissive: 0xff1744, emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.30 });

/* ---------------- el carro ---------------- */
const carro = new THREE.Group();
scene.add(carro);

const ANCHO   = 1.86;   // ancho total de la carrocería
const R_ARCO  = 0.40;   // radio del paso de rueda
const Y_PISO  = 0.34;   // altura del piso de la carrocería
const Y_EJE   = 0.36;   // altura del eje de las ruedas
const X_DEL   = 1.42;   // eje de la rueda delantera
const X_TRA   = -1.42;  // eje de la rueda trasera
const Z_RUEDA = 0.79;   // separación lateral de las ruedas

function caja(w, h, d, x, y, z, mat, rz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (rz) m.rotation.z = rz;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* hueco del paso de rueda dentro del perfil lateral */
function pasoDeRueda(s, xc) {
  s.lineTo(xc - R_ARCO, Y_PISO);
  s.lineTo(xc - R_ARCO, Y_EJE);
  s.absarc(xc, Y_EJE, R_ARCO, Math.PI, 0, true);
  s.lineTo(xc + R_ARCO, Y_PISO);
}

/* carrocería: perfil lateral extruido a lo ancho */
(function carroceria() {
  const s = new THREE.Shape();
  s.moveTo(-2.20, Y_PISO);
  pasoDeRueda(s, X_TRA);
  s.lineTo(X_DEL - R_ARCO, Y_PISO);
  pasoDeRueda(s, X_DEL);
  s.lineTo(2.18, Y_PISO);
  s.lineTo(2.46, 0.58);    // nariz
  s.lineTo(2.05, 0.74);    // cofre
  s.lineTo(1.35, 0.86);    // cresta del guardafango
  s.lineTo(0.55, 0.80);    // base del parabrisas
  s.lineTo(0.28, 0.82);
  s.lineTo(-1.62, 0.96);   // línea de cintura
  s.lineTo(-2.30, 0.86);   // cubierta trasera
  s.lineTo(-2.42, 0.58);   // cola
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: ANCHO, bevelEnabled: false, curveSegments: 6, steps: 1
  });
  geo.translate(0, 0, -ANCHO / 2);

  const m = new THREE.Mesh(geo, matPintura);
  m.castShadow = true;
  m.receiveShadow = true;
  carro.add(m);
})();

/* cabina de cristal: se apoya en la línea de cintura */
(function cabina() {
  const s = new THREE.Shape();
  s.moveTo(0.24, 0.80);
  s.lineTo(-0.32, 1.28);   // techo delantero
  s.lineTo(-1.00, 1.26);   // techo trasero
  s.lineTo(-1.64, 0.94);   // luneta
  s.closePath();

  const W = 1.46;
  const geo = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false, steps: 1 });
  geo.translate(0, 0, -W / 2);

  const m = new THREE.Mesh(geo, matVidrio);
  m.castShadow = true;
  m.receiveShadow = true;
  carro.add(m);
})();

/* techo pintado sobre el cristal */
carro.add(caja(0.64, 0.06, 1.32, -0.66, 1.29, 0, matPintura, 0.03));

/* ---------------- ruedas ---------------- */
function rueda(x, z) {
  const g = new THREE.Group();

  const pozo   = new THREE.Mesh(new THREE.CylinderGeometry(0.395, 0.395, 0.26, 16, 1, true), matPozo);
  const llanta = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14, 1), matLlanta);
  const rin    = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.30, 10, 1), matRin);
  const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.32, 10, 1), matNegro);
  const buje   = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.34, 8, 1), matRin);

  [pozo, llanta, rin, centro, buje].forEach(function (m) {
    m.rotation.x = Math.PI / 2;
    m.castShadow = true;
    g.add(m);
  });

  g.position.set(x, Y_EJE, z);
  carro.add(g);
}
rueda(X_DEL,  Z_RUEDA);
rueda(X_DEL, -Z_RUEDA);
rueda(X_TRA,  Z_RUEDA);
rueda(X_TRA, -Z_RUEDA);

/* ---------------- detalles ---------------- */
carro.add(caja(0.34, 0.06, 1.56,  2.26, Y_PISO,  0,      matNegro));         // splitter frontal
carro.add(caja(0.16, 0.18, 1.30, -2.34, 0.36,    0,      matNegro));         // difusor trasero
carro.add(caja(1.80, 0.09, 0.07,  0.00, 0.37,    0.925,  matNegro));         // faldón derecho
carro.add(caja(1.80, 0.09, 0.07,  0.00, 0.37,   -0.925,  matNegro));         // faldón izquierdo
carro.add(caja(0.52, 0.12, 0.86,  1.70, 0.815,   0,      matNegro, -0.17));  // toma de aire
carro.add(caja(0.12, 0.13, 0.40,  2.33, 0.46,    0.58,   matFaro));          // faro derecho
carro.add(caja(0.12, 0.13, 0.40,  2.33, 0.46,   -0.58,   matFaro));          // faro izquierdo
carro.add(caja(0.10, 0.13, 0.40, -2.37, 0.70,    0.56,   matCalavera));      // calavera derecha
carro.add(caja(0.10, 0.13, 0.40, -2.37, 0.70,   -0.56,   matCalavera));      // calavera izquierda
carro.add(caja(0.07, 0.34, 0.09, -2.02, 1.06,    0.60,   matNegro));         // soporte alerón
carro.add(caja(0.07, 0.34, 0.09, -2.02, 1.06,   -0.60,   matNegro));         // soporte alerón
carro.add(caja(0.48, 0.06, 1.44, -2.02, 1.25,    0,      matNegro, -0.10));  // ala
/* espejos */
carro.add(caja(0.12, 0.05, 0.14, 0.18, 0.85,    0.92, matNegro));
carro.add(caja(0.12, 0.05, 0.14, 0.18, 0.85,   -0.92, matNegro));
carro.add(caja(0.26, 0.10, 0.16, 0.18, 0.88,    0.99, matPintura));
carro.add(caja(0.26, 0.10, 0.16, 0.18, 0.88,   -0.99, matPintura));
/* escapes */
[0.34, -0.34].forEach(function (z) {
  const esc = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.24, 10, 1), matNegro);
  esc.rotation.z = Math.PI / 2;
  esc.position.set(-2.40, 0.44, z);
  esc.castShadow = true;
  carro.add(esc);
});

/* ---------------- encuadre ---------------- */
let distanciaBase = 8;

function encuadrar(conservar) {
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const dV = (vista.alto  / 2) / tan;
  const dH = (vista.ancho / 2) / (tan * camera.aspect);

  distanciaBase = Math.max(dV, dH) * vista.margen;

  if (conservar) {
    const v = camera.position.clone().sub(MIRA).setLength(distanciaBase);
    camera.position.copy(MIRA).add(v);
  } else {
    camera.position.copy(vista.dir).multiplyScalar(distanciaBase).add(MIRA);
  }

  controls.minDistance = distanciaBase * 0.55;
  controls.maxDistance = distanciaBase * 2.1;
  controls.update();
}

/* ---------------- tamaño / resize ---------------- */
let colocado = false;

function ajustar(conservar) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  camera.aspect = w / h;
  vista = camera.aspect < 1 ? VISTAS.vertical : VISTAS.ancha;
  camera.fov = vista.fov;
  camera.updateProjectionMatrix();

  encuadrar(conservar === undefined ? colocado : conservar);
  colocado = true;
}

window.addEventListener('resize', function () { ajustar(); });
window.addEventListener('orientationchange', function () { ajustar(); });

resetBtn.addEventListener('click', function () {
  vista = camera.aspect < 1 ? VISTAS.vertical : VISTAS.ancha;
  camera.position.copy(vista.dir).multiplyScalar(distanciaBase).add(MIRA);
  controls.target.copy(MIRA);
  controls.update();
});

ajustar(false);

/* ---------------- bucle ---------------- */
let primera = true;

function animar() {
  requestAnimationFrame(animar);
  controls.update();
  renderer.render(scene, camera);

  if (primera) {
    primera = false;
    overlay.classList.add('fuera');
    window.setTimeout(function () { overlay.remove(); }, 520);
  }
}
animar();

document.addEventListener('visibilitychange', function () {
  if (!document.hidden) ajustar();
});
