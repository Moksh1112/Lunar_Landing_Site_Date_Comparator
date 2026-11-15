// Home Moon scene (three.js). Loaded on demand by HomeMoon after the page's first paint, so the
// headline and navigation never wait for three.js or the texture. Behaviour is unchanged from the
// previous inline version: same scene, lighting, satellite, animation, reduced-motion still frame,
// off-screen/hidden-tab pause and full GPU cleanup.
import * as THREE from "three";
import moonTex from "../landing/assets/moon_lroc_color_4k.jpg";

/** Mount the scene into `el`; returns a cleanup function, or null if WebGL cannot start. */
export function mountMoonScene(el: HTMLElement): (() => void) | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.5, 8.6);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-4, 1.5, 3);
  scene.add(sun);

  // Same texture as before, decoded off the main thread (ImageBitmap, flipped at decode so flipY stays
  // false). The texture object exists from the start, exactly as with TextureLoader, so the shader
  // program compiled below is the one used after the image arrives.
  let disposed = false;
  let ready = false;
  let bitmap: ImageBitmap | null = null;
  const tex = new THREE.Texture();
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }).load(moonTex, (img) => {
    if (disposed) {
      img.close();
      return;
    }
    bitmap = img;
    tex.image = img;
    tex.needsUpdate = true;
    if (ready) renderer.render(scene, camera);
  });
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 96, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
  moon.rotation.x = 0.12;
  scene.add(moon);

  // Satellite: gold bus, two solar wings, a dish; orbits on a tilted plane.
  const sat = new THREE.Group();
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.22), new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.7, roughness: 0.35 }));
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d2c4d, metalness: 0.4, roughness: 0.5, emissive: 0x0a1020 });
  for (const x of [-0.28, 0.28]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.14), wingMat);
    w.position.x = x;
    sat.add(w);
  }
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.05, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xdddddd, side: THREE.DoubleSide }));
  dish.position.z = 0.14;
  dish.rotation.x = -Math.PI / 2;
  sat.add(bus, dish);
  const orbit = new THREE.Group();
  orbit.rotation.set(0.35, 0, -0.25);
  sat.position.x = 2.25;
  orbit.add(sat);
  scene.add(orbit);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.004, 6, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }));
  ring.rotation.x = Math.PI / 2;
  orbit.add(ring);

  const resize = () => {
    const s = el.clientWidth;
    renderer.setSize(s, s, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  let raf = 0;
  let last = performance.now();
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  });
  io.observe(el);
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (visible && !document.hidden) {
      moon.rotation.y += dt * 0.08;
      orbit.rotation.y += dt * 0.45;
      sat.rotation.y += dt * 0.6;
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (disposed) return;
    ready = true;
    if (reduce) {
      orbit.rotation.y = 0.9;
      renderer.render(scene, camera);
    } else raf = requestAnimationFrame(frame);
  };
  // Compile shaders without blocking the main thread where KHR_parallel_shader_compile is supported;
  // animation starts once programs are ready (on failure, start anyway as before).
  // compileAsync polls each material's program until ready; GPU resources are released only after it
  // settles, because disposing mid-compile makes three's poll dereference a deleted program.
  let compiled = false;
  const compiling = renderer.compileAsync(scene, camera).then(start, start).finally(() => {
    compiled = true;
  });

  const release = () => {
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
    tex.dispose();
    bitmap?.close();
    renderer.dispose();
    renderer.forceContextLoss(); // release the WebGL context now, so repeated Home visits do not accumulate contexts
  };

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    renderer.domElement.remove();
    if (compiled) release();
    else void compiling.then(release);
  };
}
