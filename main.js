import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Planet } from 'planet';
import { NoiseFilter } from 'noisefilter';

let settings = {
    planetColor: 0xffffff,
    planetResolution: 10,
    planetRadius: 10,
}



// Create scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
// Import planet creation functionality from planet.js
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White directional light
directionalLight.position.set(5, 5, 5).normalize(); // Position the light
scene.add(directionalLight);


// Create the planet
var planet = new Planet(settings.planetResolution); // Or any other resolution
planet.addToScene(scene);

// Position camera
camera.position.z = 3;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


const radiusInput = document.getElementById('radius');
radiusInput.addEventListener('change', (e) => {
    settings.planetRadius = parseInt(e.target.value, 10);

    planet.removeFromScene(scene);

    planet = new Planet(settings);

    planet.addToScene(scene);

});

const resolutionInput = document.getElementById('resolution');
resolutionInput.addEventListener('change', (e) => {
    settings.planetResolution = parseInt(e.target.value, 10);
    planet.removeFromScene(scene);

    planet = new Planet(settings);

    planet.addToScene(scene);
});

const colorInput = document.getElementById('color');
colorInput.addEventListener('change', (e) => {
    settings.planetColor = parseInt(e.target.value.replace('#', '0x'), 16);

    planet.removeFromScene(scene);

    planet = new Planet(settings);

    planet.addToScene(scene);

});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();