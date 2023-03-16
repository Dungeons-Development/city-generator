import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="display"></div>
`

class Main {
  constructor(
    container: HTMLDivElement,
    private parameters: {
      size: number,
      roadDensity: number,
      entryRoadCount: number,
    },
  ) {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer();

    const cameraSize = parameters.size * 2;
    const camera = new THREE.OrthographicCamera(-cameraSize, cameraSize, cameraSize, -cameraSize, 1, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;

    function animate() {
      requestAnimationFrame( animate );

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render( scene, camera );
    }

    animate();
  }
}

class Node {
  constructor(
    private x: number,
    private y: number
  ) {}
  getPosition() {
    return {
      x,
      y,
    };
  }
}

const init = () => {
  const container = document.getElementById<HTMLDivElement>('display');
  if (!container) throw new Error("fuck");
  new Main(container, { size: 1, roadDensity: 3, entryRoadCount: 3, });
};

init();
