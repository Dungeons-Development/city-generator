import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import { Node } from './classes/node';
import { getWaterFrontShape } from './utils/shapes/bezier-curve';

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
        water?: THREE.Vector2[],
      },
    },
  ) {
    this.scene = new THREE.Scene();
    this.radius = parameters.radius;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

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

    this.addDrawingRect(container.offsetWidth, container.offsetHeight);
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

  addDrawingRect = (width: number, height: number) => {
    const geometry = new THREE.BoxGeometry(width, height, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffcd });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, -1);
    this.scene.add(cube);
  }
  
  addWaterFront = (bounds?: BoundingRadians) => {
    const bezierCurves = getWaterFrontShape(this.radius, bounds);
    //const linePoints = bezierCurves.map(curve => curve.getPoints(100)).reduce((acc, points) => acc.push(...points) && acc, []);
    //const waterFront = new THREE.Shape();
    //waterFront.setFromPoints(linePoints);

    //const geometry = new THREE.ShapeGeometry(waterFront);
    //const material = new THREE.MeshBasicMaterial({ color: 0x0033BA });
    //const mesh = new THREE.Mesh(geometry, material) ;
    //this.scene.add(mesh);
    //this.animate();
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
    userInput: {
      //water: [],
    },
  });
};

init();
