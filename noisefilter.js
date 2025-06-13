import SimplexNoise from 'simplex';

class NoiseFilter {
    constructor() {
        this.noise = new SimplexNoise();
    }

    evaluate(point) {
        // Generate noise value from the point coordinates
        let noiseValue = this.noise.noise3D(point.x, point.y, point.z);

        // Clamp the value between 0 and 1 (noise typically ranges from -1 to 1)
        noiseValue = (noiseValue + 1) / 2;
        return noiseValue;
    }
}

export { NoiseFilter };