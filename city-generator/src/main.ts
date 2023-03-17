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
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  size: number;

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
    this.size = parameters.size;
    this.renderer = new THREE.WebGLRenderer();

    const { size, renderer, addPoint } = this;
    const aspect = container.offsetWidth / container.offsetHeight;
    this.camera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 1, 1000);

    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableRotate = false;
    this.camera.position.z = this.size;
    
    renderer.setPixelRatio(aspect);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    addPoint(new Node(1, 1));
    addPoint(new Node(15, 15));

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target satisfies HTMLDivElement;

        const { offsetWidth, offsetHeight } = el;
        const aspect = offsetWidth / offsetHeight;
        const { camera, renderer, size } = this;

        camera.left = -size * aspect;
        camera.right = size * aspect;

        camera.updateProjectionMatrix();

        renderer.setSize(offsetWidth, offsetHeight);
        this.animate();
      }
    })    
    resizeObserver.observe(container);
    
    this.animate();
  }

  animate = () => {
    requestAnimationFrame( this.animate );
    this.renderer.render(this.scene, this.camera)
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
