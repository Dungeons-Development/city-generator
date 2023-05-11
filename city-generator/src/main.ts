import './style.css'
import * as THREE from 'three';
import { Vector2 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

import { Node } from './classes/node';
import { generateWaterfrontMesh, generateWaterLine } from './utils/shapes/bezier-curve';

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
      userInput?: {
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
    this.addBorders(radius);
    this.addWaterFront(25);
    
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
    // TODO: CHANGE BACK TO -1 WHEN THIS IS DONE
    cube.position.set(0, 0, -2);
    this.scene.add(cube);
  }
  
  addBorders = (radius: number) => {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const points = [
      new THREE.Vector3(radius, radius, 0),
      new THREE.Vector3(-radius, radius, 0),
      new THREE.Vector3(-radius, -radius, 0),
      new THREE.Vector3(radius, -radius, 0),
      new THREE.Vector3(radius, radius, 0),
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    this.scene.add(line);
  }
  
  addWaterFront = (radius: number) => {
    const waterline = generateWaterLine(radius);
    const waterfrontMesh = generateWaterfrontMesh(waterline, radius);
    this.scene.add(waterfrontMesh);
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
    userInput: {
      //water: [
        //new Vector2(-25, -25),
        //new Vector2(25, 25),
        //new Vector2(25, -25),
        //new Vector2(-25, -25),
      //]
    },
  });
};

init();
