import * as THREE from 'three';
import { NoiseFilter } from 'noisefilter';


class ShapeGenerator {
    constructor(settings) {
        this.settings = settings;
        this.noisefilter = new NoiseFilter();
    }

    calculatePointOnPlanet(pointOnUnitSphere) {
        const radius = (this.settings && typeof this.settings.planetRadius === 'number')
            ? this.settings.planetRadius
            : 1;

        // Use .clone() to avoid modifying the original pointOnUnitSphere vector
        // Use .multiplyScalar() for correct vector-scalar multiplication
        return pointOnUnitSphere.clone().multiplyScalar(radius);
    }
}

class TerrainFace {
    constructor(shapeGenerator, geometry, resolution, localUp) { // Changed parameter name from mesh to geometry for clarity
        this.geometry = geometry; // Store the BufferGeometry instance passed from Planet class
        this.resolution = resolution;
        this.localUp = localUp;

        this.axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
        this.axisB = new THREE.Vector3().crossVectors(localUp, this.axisA).normalize();
        // Ensure axisA is also orthogonal to localUp and axisB
        this.axisA.crossVectors(this.axisB, localUp).normalize();

        this.shapeGenerator = shapeGenerator;
    }

    constructMesh(elevationGenerator) {
        const vertices = [];
        const indices = [];
        const uvs = [];

        for (let y = 0; y < this.resolution; y++) {
            for (let x = 0; x < this.resolution; x++) {
                // Calculate position on face
                const percentX = x / (this.resolution - 1); // Define percentX
                const percentY = y / (this.resolution - 1); // Define percentY

                const pointOnUnitCube = this.localUp.clone()
                    .addScaledVector(this.axisA, (percentX - 0.5) * 2)
                    .addScaledVector(this.axisB, (percentY - 0.5) * 2);

                const pointOnUnitSphere = pointOnUnitCube.normalize();

                const elevation = this.shapeGenerator.noisefilter.evaluate(pointOnUnitSphere);

                // Get the point on the planet using the ShapeGenerator
                const pointOnPlanet = this.shapeGenerator.calculatePointOnPlanet(pointOnUnitSphere);
                vertices.push(
                    pointOnPlanet.x * elevation,
                    pointOnPlanet.y * elevation,
                    pointOnPlanet.z * elevation
                );

                uvs.push(percentX, percentY);

                if (x < this.resolution - 1 && y < this.resolution - 1) {
                    const currentIndex = x + y * this.resolution;
                    indices.push(
                        currentIndex, currentIndex + this.resolution + 1, currentIndex + this.resolution, // Flipped order for correct winding
                        currentIndex, currentIndex + 1, currentIndex + this.resolution + 1 // Flipped order
                    );
                }
            }
        }

        // Set attributes directly on the geometry instance received in the constructor
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        this.geometry.setIndex(indices);
        this.geometry.computeVertexNormals(); // Important for lighting

        // No need to return anything or reassign this.mesh.geometry
    }
}

class Planet {
    constructor(settings) {
        let resolution = settings.planetResolution || 10;
        this.color = settings.planetColor || 0xffffff;

        this.resolution = Math.max(2, Math.min(256, resolution));

        this.shapeGenerator = new ShapeGenerator(settings);

        this.object = new THREE.Group(); // Initialize object group

        // Meshes and terrainFaces will be populated by initialize
        this.meshes = [];
        this.terrainFaces = [];


        this.initialize();
        this.generateMesh();
    }

    initialize() {
        // Clear existing meshes from the group and reset arrays
        while (this.object.children.length > 0) {
            this.object.remove(this.object.children[0]);
        }
        this.meshes = [];
        this.terrainFaces = [];

        const directions = [
            new THREE.Vector3(0, 1, 0),   // up
            new THREE.Vector3(0, -1, 0),  // down
            new THREE.Vector3(1, 0, 0),   // right (was -1, 0, 0 for left)
            new THREE.Vector3(-1, 0, 0),  // left (was 1, 0, 0 for right)
            new THREE.Vector3(0, 0, 1),   // forward
            new THREE.Vector3(0, 0, -1)   // back
        ];

        for (let i = 0; i < 6; i++) {
            const geometry = new THREE.BufferGeometry(); // This geometry will be populated by TerrainFace
            const material = new THREE.MeshStandardMaterial({
                //wireframe: true,
                color: this.color // Optional: random color per face for debugging
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.meshes.push(mesh);
            this.object.add(mesh);

            // Pass the geometry instance to TerrainFace
            this.terrainFaces.push(new TerrainFace(this.shapeGenerator, geometry, this.resolution, directions[i]));
        }
    }

    generateMesh() {
        for (const face of this.terrainFaces) {
            face.constructMesh(); // This will now populate the geometry of each mesh
        }
    }

    setResolution(newResolution) {
        this.resolution = Math.max(2, Math.min(256, newResolution));
        this.initialize(); // Re-creates meshes with new geometries
        this.generateMesh(); // Populates the new geometries
    }

    addToScene(scene) {
        scene.add(this.object);
    }

    removeFromScene(scene) {
        scene.remove(this.object);
    }
}

export { Planet };