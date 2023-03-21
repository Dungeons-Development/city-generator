import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import { Node } from './classes/node';
import { BoundingRadians } from './types/input';
import { getBezierCurves } from './utils/node';

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
  radius: number;

  constructor(
    container: HTMLDivElement,
    private parameters: {
      radius: number,
      roadDensity: number,
      entryRoadCount: number,
      isWaterFront: boolean,
      assetMask?: {
        roads: AssetMask[],
        buildings: AssetMask[],
        walls: AssetMask[],
        environment: AssetMask[],
      },
      userBounds?: {
        water?: BoundingRadians,
      },
    },
  ) {
    this.scene = new THREE.Scene();
    this.radius = parameters.radius;
    this.renderer = new THREE.WebGLRenderer();

    const { radius, renderer, addPoint } = this;
    const aspect = container.offsetWidth / container.offsetHeight;
    const mapSize = radius * 2;
    this.camera = new THREE.OrthographicCamera(-mapSize * aspect, mapSize * aspect, mapSize, -mapSize, 1, 1000);

    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableRotate = false;
    this.camera.position.z = mapSize;
    
    renderer.setPixelRatio(aspect);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target satisfies HTMLDivElement;

        const { offsetWidth, offsetHeight } = el;
        const aspect = offsetWidth / offsetHeight;
        const { camera, renderer, radius } = this;
        const mapSize = radius * 2;

        camera.left = -mapSize * aspect;
        camera.right = mapSize * aspect;

        camera.updateProjectionMatrix();

        renderer.setSize(offsetWidth, offsetHeight);
        this.animate();
      }
    })    
    resizeObserver.observe(container);

    this.addWaterFront(parameters.userBounds?.water);
    
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
    sphere.position.set(x, y, 0);
    this.scene.add(sphere);
  }
  
  addWaterFront = (bounds?: BoundingRadians) => {
    const bezierCurves = getBezierCurves(this.radius, bounds);
    console.log(bezierCurves);
    bezierCurves.map(curve => {
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      return new THREE.Line(geometry, material);
    }).forEach(curve => this.scene.add(curve));
    this.animate();
  }
}

const init = () => {
  const container = document.getElementById<HTMLDivElement>('display');
  if (!container) throw new Error('Ahhh');
  new Main(container, {
    radius: 25,
    roadDensity: 3,
    entryRoadCount: 3,
    isWaterFront: true,
    userBounds: {
      water: {
        start: Math.PI / 2,
        end: Math.PI * 2,
      },
    },
  });
};

init();
