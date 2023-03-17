import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

document.querySelector<HTMLDivElement>('#app').innerHTML = `
  <div id="display"></div>
`

interface AssetMask {
  imageUrl: string,
  wieght: number,
  minCount?: number,
  maxCount?: number,
}

class Main {
  scene: THREE.Scene;

  constructor(
    container: HTMLDivElement,
    private parameters: {
      size: number,
      roadDensity: number,
      entryRoadCount: number,
      isWaterFront: boolean,
      assetsMask?: {
        roads: AssetMask[],
        buildings: AssetMask[],
        walls: AssetMask[],
        environment: AssetMask[],
      },
    },
  ) {
    this.scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer();

    const cameraSize = parameters.size * 2;
    const camera = new THREE.OrthographicCamera(-cameraSize, cameraSize, cameraSize, -cameraSize, 1, 500);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    camera.position.z = cameraSize / 2;
    
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    this.addPoint(new Node(1, 1));
    this.addPoint(new Node(15, 15));

    const animate = () => {
      requestAnimationFrame( animate );
      
      renderer.render(this.scene, camera)
    }

    animate();
  }

  addPoint = (node: Node) => {
    const { x, y } = node.getPosition();

    const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(x, y, 1);
    this.scene.add( sphere );
  }
}

class Node {
  constructor(
    private x: number,
    private y: number
  ) {}
  getPosition() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}

const init = () => {
  const container = document.getElementById<HTMLDivElement>('display');
  if (!container) throw new Error('Ahhh');
  new Main(container, { size: 25, roadDensity: 3, entryRoadCount: 3, isWaterFront: true });
};

init();
