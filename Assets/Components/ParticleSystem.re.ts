import * as RE from 'rogue-engine';
import { 
  Vector3,
  Points,
  BufferGeometry,
  BufferAttribute,
  Color,
  ShaderMaterial,
  Audio,
  PointsMaterial,
  MathUtils,
} from 'three';

export default class ParticleSystem extends RE.Component {
  @RE.props.num() movementSpeed = 0.15;
  @RE.props.num() totalObjects = 500;
  @RE.props.num() objectSize = 0.2;
  @RE.props.num() maxTime: number = 0.3;
  @RE.props.num() maxDistance: number = 2;
  @RE.props.num(0, 1) vanishingRatio = 0.5;
  @RE.props.color() color = new Color("#FF0FFF");
  @RE.props.material() material: PointsMaterial;
  @RE.props.audio(true) sound: Audio;
  @RE.props.num() volume: number = 1;
  @RE.props.checkbox() once: boolean = false;
  @RE.props.checkbox() isActive: boolean = false;

  private particleSystem: Points;
  // private isActive: boolean;
  private dirs: number[] = [];
  private time: number = 0;
  private previousStatus = false;

  black = new Color("#000000");

  start() {
    this.explodeAnimation();
    if (this.sound && this.sound.context.state === "running") {
      this.sound.setVolume(this.volume);
      this.sound.play();
    }
  }

  update() {
    if (!this.isActive && this.time === 0) {
      if (this.previousStatus !== this.isActive) {
        this.reset();
        this.particleSystem.visible = false;
      }
      if (this.particleSystem.visible) {
        this.particleSystem.visible = false;
      }
      return;
    };
    
    if (!this.particleSystem.visible) {
      this.particleSystem.visible = true;
    }

    this.previousStatus = this.isActive;

    const deltaTime = RE.Runtime.deltaTime;

    this.time += deltaTime * 1000;
    // this.color.lerpColors(this.color, this.black, ((this.maxTime - this.time) / 1000) * deltaTime);

    const hsl = {h: 0, s: 0, l: 0};
    this.color.getHSL(hsl);

    // if (this.time/this.maxTime > 0.5) {
      const lerpValue = MathUtils.lerp(hsl.l, 0, (this.vanishingRatio*(this.time / this.maxTime)));
      const lerpSaturation = MathUtils.lerp(hsl.s, 0, (this.vanishingRatio*(this.time / this.maxTime)));
      this.color.setHSL(hsl.h, lerpSaturation, lerpValue);
    // }

    // this.color.setHSL(hsl.h, hsl.s, hsl.l - (((this.time * 100) / this.maxTime)) / 100);
    // this.color.lerp(this.black, this.time / this.maxTime);
    // this.color.lerpHSL(this.color, )

    if (this.time >= this.maxTime) {
      if (this.once) {
        this.particleSystem.geometry.dispose();
        this.particleSystem.removeFromParent();
        this.object3d.children.length === 0 && this.object3d.removeFromParent();
      }
      this.reset();
      return;
    }

    if (this.particleSystem && this.particleSystem.geometry instanceof BufferGeometry) {
      const newPositions: number[] = [];
      const newSizes: number[] = [];
      let trackingIndex = 0;

      for (let i = 0; i < this.totalObjects; i++) {
        const positionArray =  this.particleSystem.geometry.attributes.position.array;

        const posx = positionArray[trackingIndex] + this.dirs[trackingIndex] * deltaTime;
        const posy = positionArray[trackingIndex+1] + this.dirs[trackingIndex+1] * deltaTime;
        const posz = positionArray[trackingIndex+2] + this.dirs[trackingIndex+2] * deltaTime;

        newPositions.push(posx, posy, posz);

        let distance = new Vector3().distanceTo(new Vector3(posx, posy, posz));

        if (distance > this.maxDistance)
          newSizes[i] = 0;
        else
          newSizes[i] = this.objectSize;

        trackingIndex += 3;
      }

      const newPositionTyped = new Float32Array(newPositions);
      this.particleSystem.geometry.setAttribute("position", new BufferAttribute(newPositionTyped, 3));
      this.particleSystem.geometry.attributes.position["needsUpdate"] = true;

      const newSizesTyped = new Float32Array(newSizes);
      this.particleSystem.geometry.setAttribute("size", new BufferAttribute(newSizesTyped, 1));
      this.particleSystem.geometry.attributes.size["needsUpdate"] = true;
    }
  }

  reset() {
    this.dirs = [];

    for (let i = 0; i < this.totalObjects; i++) {
      this.dirs.push(
        (Math.random() * this.movementSpeed) - (this.movementSpeed / 2),
        (Math.random() * this.movementSpeed) - (this.movementSpeed / 2), 
        (Math.random() * this.movementSpeed) - (this.movementSpeed / 2) 
      );
    }

    const positions = new Float32Array(this.totalObjects * 3);
    this.particleSystem.geometry["setAttribute"]("position", new BufferAttribute(positions, 3));
    this.time = 0;
  }

  explodeAnimation() {
    if (!(this.color instanceof Color)) {
      this.color = new Color(this.color);
    }

    const geometry = new BufferGeometry();

    for (let i = 0; i < this.totalObjects; i++) {
      this.dirs.push(
        (Math.random() * this.movementSpeed) - (this.movementSpeed / 2),
        (Math.random() * this.movementSpeed) - (this.movementSpeed / 2), 
        (Math.random() * this.movementSpeed) - (this.movementSpeed / 2) 
      );
    }

    const material = this.material?.clone() || this.createMaterial();

    const positions = new Float32Array(this.totalObjects * 3);
    geometry.setAttribute("position", new BufferAttribute(positions, 3));

    const sizes = new Float32Array(this.totalObjects);
    sizes.map((v, i)=> {
      sizes[i] = this.objectSize;
      return sizes[i];
    });

    material.size = this.objectSize;

    material.color = this.color;

    geometry.setAttribute("size", new BufferAttribute(sizes, 1));

    const colors = new Float32Array(this.totalObjects * 3);
    colors.map((v, i)=> {
      this.color.toArray(colors, i * 3);
      return colors[i];
    });

    geometry.setAttribute("ca", new BufferAttribute(colors, 3));

    const particles = new Points(geometry, material);

    particles.matrixAutoUpdate = true;

    this.particleSystem = particles;
    this.particleSystem.userData.isParticle = true;

    this.object3d.add(this.particleSystem);
  }

  createMaterial() {
    return new ShaderMaterial( {
      uniforms: {
        color: { value: this.color },
      },
      vertexShader: `
      attribute float size;
      attribute vec4 ca;
      varying vec4 vColor;
			void main() {
        vColor = ca;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = size * ( 300.0 / - mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
			}
      `,
      fragmentShader: `
      uniform vec3 color;
      varying vec4 vColor;
			void main() {
				if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
				gl_FragColor = vec4( color * vColor.xyz, 1.0 );
			}
      `
    } );
  }
}

RE.registerComponent(ParticleSystem);
