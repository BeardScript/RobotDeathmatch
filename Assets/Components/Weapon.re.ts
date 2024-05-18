import RapierCollider from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierCollider';
import RogueRapier from '@RE/RogueEngine/rogue-rapier/Lib/RogueRapier';
import RAPIER from '@dimforge/rapier3d-compat';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import Player from './Player.re';

const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();
const q3 = new THREE.Quaternion();

const fullMuzzleFlashScale = new THREE.Vector3(1, 1, 1);

const v1 = new THREE.Vector3();

type BulletParticle = {
  obj: THREE.Object3D;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  distance: number;
  t: number;
}

function randomRange(min: number, max: number, floor = false) {
  let rand = Math.random() * (max - min);

  return floor ? Math.floor(rand) + min : rand + min;
}

function lerpV3(a: THREE.Vector3, b: THREE.Vector3, t: number, h: number) {
  a.x = THREE.MathUtils.damp(a.x, b.x, t, h);
  a.y = THREE.MathUtils.damp(a.y, b.y, t, h);
  a.z = THREE.MathUtils.damp(a.z, b.z, t, h);
}

export default class Weapon extends RE.Component {
  @RE.props.select() firingStyle = 0;
  firingStyleOptions = ["Raycast", "Projectile"];

  @RE.props.num(0) damage = 35;

  @RE.props.num(1) shots = 1;
  @RE.props.num(0) spread = 0;

  @RE.props.prefab() projectileParticle: RE.Prefab;
  @RE.props.num() particleSpeed = 15;

  @RE.props.audio(true) shotSFX: THREE.PositionalAudio;
  @RE.props.num(0, 0.5) shotSFXRolloff = 0.07;
  @RE.props.audio(true) reloadSFX: THREE.PositionalAudio;
  @RE.props.object3d() muzzleFlash: THREE.Object3D;

  @RE.props.select() firingMode = 0;
  firingModeOptions = ["Semi-Auto", "Auto"];

  @RE.props.num() firingRate = 200;
  @RE.props.num() fireRateCounter = 0;
  @RE.props.num() reloadTime = 2000;
  @RE.props.num() reloadCounter = 0;
  @RE.props.num() magSize = 30;
  @RE.props.num() totalRounds = 150;
  @RE.props.num() curRounds = this.totalRounds;
  @RE.props.num() loadedRounds = this.magSize;

  @RE.props.vector3() hipRecoilMin = new THREE.Vector3(8, 6, 10);
  @RE.props.vector3() hipRecoilMax = new THREE.Vector3(10, 6, 10);

  @RE.props.vector3() aimedRecoilMin = new THREE.Vector3(2, 4, 7);
  @RE.props.vector3() aimedRecoilMax = new THREE.Vector3(4, 4, 7);

  @RE.props.checkbox() overheat = false;
  @RE.props.num() heatPerShot = 10;
  @RE.props.num() maxHeat = 100;
  @RE.props.num() cooldownRate = 300;
  @RE.props.num() curHeat = 0;

  @RE.props.num() swaySmoothness = 8;
  @RE.props.num(0, 1) aimMovementFactor = 0.3;

  parentObject: THREE.Object3D;

  bulletMark = new THREE.Mesh(new THREE.SphereGeometry(0.02));

  isEquiped = false;
  overheated = false;

  swayDir = new THREE.Vector3();
  projectilesContainer: THREE.Object3D;

  private bullets: {[uuid: string]: BulletParticle} = {};

  private _rapierBody: RapierBody;

  get rapierBody() {
    if (!this._rapierBody) {
      this._rapierBody = RapierBody.get(this.parentObject);
    }

    return this._rapierBody;
  }

  get isReloading() {
    return this.reloadCounter !== 0;
  }

  get canShoot() {
    if (!this.isEquiped) return false;
    return this.fireRateCounter === 0 && this.loadedRounds > 0 && !this.isReloading && !this.overheated;
  }

  start() {
    this.muzzleFlash = this.object3d.getObjectByName("MuzzleFlash") as THREE.Mesh;

    this.muzzleFlash && fullMuzzleFlashScale.copy(this.muzzleFlash.scale);
    this.muzzleFlash?.scale.set(0, 0, 0);
    this.muzzleFlash && (this.muzzleFlash.visible = false);

    this.projectilesContainer = RE.Runtime.scene.getObjectByName("Projectiles") as THREE.Object3D;

    if (!this.projectilesContainer) {
      this.projectilesContainer = new THREE.Object3D();
      this.projectilesContainer.name = "Projectiles";
      RE.Runtime.scene.add(this.projectilesContainer);
    }
  }

  update() {
    this.animateMuzzleFlash();
    this.calculateFiringRate();
    this.doReload();
    this.cooldown();

    this.updateParticles();
  }

  cooldown() {
    this.curHeat -= this.cooldownRate * RE.Runtime.deltaTime;
    this.curHeat = Math.max(0, this.curHeat);

    if (this.overheated && this.curHeat <= 0) {
      this.curHeat = 0;
      this.overheated = false;
    }
  }

  calculateFiringRate() {
    if (this.fireRateCounter !== 0) {
      this.fireRateCounter -= RE.Runtime.deltaTime * 1000;
      if (this.fireRateCounter < 0) this.fireRateCounter = 0;
    }
  }

  shoot(dir: THREE.Vector3) {
    if (!this.canShoot) return;

    if (this.overheat) {
      this.curHeat += this.heatPerShot;

      if (this.curHeat >= this.maxHeat) {
        this.overheated = true;
      }
    }

    this.fireRateCounter = this.firingRate;
    this.loadedRounds -= 1;

    this.muzzleFlash?.scale.set(0, 0, 0);
    this.muzzleFlash?.rotateZ(THREE.MathUtils.degToRad(90));
    this.muzzleFlash && (this.muzzleFlash.visible = true);

    for (let i = 0; i < this.shots; i++) {
      const bullet = this.projectileParticle.instantiate(this.projectilesContainer);
      this.muzzleFlash.getWorldPosition(bullet.position);
      // this.object3d.getWorldPosition(bullet.position);
      bullet.position.x = this.parentObject.position.x;
      bullet.position.z = this.parentObject.position.z;
      // this.parentObject.getWorldQuaternion(bullet.quaternion);

      bullet.position.add(dir);
      const tgt = bullet.position.clone();
      bullet.position.sub(dir);

      bullet.lookAt(tgt);

      // q1.copy(RE.Runtime.camera.quaternion);

      const distance = 40;
      const targetPos = RE.Runtime.camera.position.clone();

      if (this.spread > 0) {
        let rotateX = Math.min(randomRange(-this.spread, this.spread), this.spread);
        let rotateY = Math.min(randomRange(-this.spread, this.spread), this.spread);

        bullet.rotateX(THREE.MathUtils.degToRad(rotateX));
        bullet.rotateY(THREE.MathUtils.degToRad(rotateY));
        // RE.Runtime.camera.rotateX(THREE.MathUtils.degToRad(rotateX));
        // RE.Runtime.camera.rotateY(THREE.MathUtils.degToRad(rotateY));
      } else {
        // RE.Runtime.camera.quaternion.copy(this.object3d.quaternion);
      }

      const startPos = bullet.position.clone();

      bullet.translateZ(distance);
      targetPos.copy(bullet.position);
      bullet.translateZ(-distance);

      this.bullets[bullet.uuid] = {obj: bullet, targetPos, distance, startPos, t: 0};

      this.shootRaycast(dir, (intersection) => {
        this.bullets[bullet.uuid].targetPos.copy(intersection.point);
        this.bullets[bullet.uuid].distance = bullet.position.distanceTo(targetPos);

        bullet.lookAt(targetPos);
        const enemy = RE.getNearestWithTag(intersection.object, "Enemy");

        if (enemy) {
          // we hit an enemy
          const enemyCharacter = Player.get(enemy);
          enemyCharacter?.applyDamage();
        }
      });

      // RE.Runtime.camera.quaternion.copy(q1);
    }

    if (this.shotSFX) {
      this.shotSFX.isPlaying && this.shotSFX.stop();
      const detune = randomRange(-100, 100);
      this.shotSFX.detune = detune;
      this.shotSFX.setRolloffFactor(this.shotSFXRolloff);
      this.shotSFX.play();
    }
  }

  raycaster = new THREE.Raycaster();
  rayOrigin = new THREE.Vector3();
  rayDir = new THREE.Vector3();
  rapierRay = new RAPIER.Ray(this.rayOrigin, this.rayDir);

  private shootRaycast(dir: THREE.Vector3, onHit: (intersection: THREE.Intersection<THREE.Object3D>) => void) {
    this.muzzleFlash.getWorldPosition(this.rayOrigin);
    this.rayDir.copy(dir);
    this.rayDir.y = 0;

    const res = RogueRapier.world.castRay(this.rapierRay, 1000, true, undefined, undefined, undefined, this.rapierBody?.body);

    if (res) {
      const components = RE.getComponents(RapierCollider as any) as RapierCollider[];
      const collider = components.find(comp => comp.collider === res.collider);
      if (!collider) return;

      const obj = collider.object3d instanceof THREE.Mesh ? collider.object3d : collider.object3d.parent;
      if (!obj) return;

      this.raycaster.set(this.rayOrigin, this.rayDir);
      const intersections = this.raycaster.intersectObject(obj, true);

      if (intersections.length < 1) return;

      onHit(intersections[0]);
    }
  }

  updateParticles() {
    const remove: BulletParticle[] = [];
    for (let uuid in this.bullets) {
      const bullet = this.bullets[uuid];

      let distance = bullet.obj.position.distanceTo(bullet.startPos);
      distance = Math.max(distance, 1);

      lerpV3(bullet.obj.position, bullet.targetPos, (1/bullet.distance) * this.particleSpeed, RE.Runtime.deltaTime);

      // bullet.obj.position.lerp(bullet.targetPos, this.particleSpeed * (100/bullet.distance)  * RE.Runtime.deltaTime)

      distance = bullet.obj.position.distanceTo(bullet.startPos);

      if (distance >= (bullet.distance * 0.9)) remove.push(bullet);
    }

    remove.forEach(bullet => {
      delete this.bullets[bullet.obj.uuid];
      bullet.obj.parent?.remove(bullet.obj);
    });
  }

  onObjectRemoved(): void {
    const remove: BulletParticle[] = [];
    for (let uuid in this.bullets) {
      const bullet = this.bullets[uuid];
      remove.push(bullet);
    }

    remove.forEach(bullet => {
      delete this.bullets[bullet.obj.uuid];
      bullet.obj.parent?.remove(bullet.obj);
    });
  }

  reload() {
    if (this.curRounds <= 0) return;

    if (this.reloadCounter === 0 && this.loadedRounds < this.magSize) {
      if (this.reloadSFX) {
        this.reloadSFX.isPlaying && this.reloadSFX.stop();
        this.reloadSFX.duration = this.reloadTime/1000;
        this.reloadSFX.play();
      }

      this.reloadCounter = this.reloadTime;
    }
  }

  private doReload() {
    if (!this.isReloading || this.curRounds <= 0) return;

    this.reloadCounter -= RE.Runtime.deltaTime * 1000;

    if (this.reloadCounter <= 0) {
      this.reloadCounter = 0;
      const curRounds = this.curRounds - (this.magSize - this.loadedRounds);
      this.loadedRounds = this.curRounds < this.magSize ? this.curRounds : this.magSize;
      this.curRounds = Math.max(0, curRounds);
    }
  }

  animateMuzzleFlash() {
    if (!this.isEquiped) return;
    const fullSize = fullMuzzleFlashScale.z - 0.01;

    if (this.muzzleFlash?.visible && this.muzzleFlash?.scale.z >= fullSize) {
      this.muzzleFlash.visible = false;
    }

    if (this.muzzleFlash?.visible && this.muzzleFlash?.scale.z <= fullSize) {
      this.muzzleFlash?.scale.lerp(fullMuzzleFlashScale, RE.Runtime.deltaTime * 80);
    }
  }
}

RE.registerComponent(Weapon);
        