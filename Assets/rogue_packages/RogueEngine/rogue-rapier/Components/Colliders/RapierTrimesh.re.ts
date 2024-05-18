import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import RogueRapier from '../../Lib/RogueRapier';
import RapierCollider from './RapierCollider';

export default class RapierTrimesh extends RapierCollider {
  worldScale = new THREE.Vector3();
  worldPos = new THREE.Vector3();

  tmpVec0 = new RAPIER.Vector3(0,0,0);
  tmpVec1 = new RAPIER.Vector3(0,0,0);
  tmpVec2 = new RAPIER.Vector3(0,0,0);
  tmpQuat0 = new RAPIER.Vector3(0,0,0);

  createShape() {
    if (!(this.object3d instanceof THREE.Mesh)) return;

    this.object3d.updateWorldMatrix(true, true);

    this.object3d.getWorldScale(this.worldScale);
    this.object3d.getWorldPosition(this.worldPos);
    this.object3d.getWorldQuaternion(this.worldQuaternion);

    const mesh = this.object3d;
    let geometry = (mesh.geometry as THREE.BufferGeometry);
    
    // geometry.computeBoundingSphere();
    // geometry.normalizeNormals();

    const vertices = this.getVertices(geometry);

	  if (!vertices.length) return;

    const indices = geometry.getIndex();

    if (!indices) return;

    let cleanIndiArray: number[] = [];

    for ( let i = 0; i < indices.count; i += 3 ) {
      const a = indices.getX( i );
      const b = indices.getX( i + 1 );
      const c = indices.getX( i + 2 );

      cleanIndiArray.push(a,b,c);
    }

    let colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, new Uint32Array(cleanIndiArray));
    this.collider = RogueRapier.world.createCollider(colliderDesc, this.body);
  }

  getVertices(geometry: THREE.BufferGeometry) {
    const position = geometry.attributes.position;
    const vertices = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      vertices[i * 3] = position.getX(i) * this.worldScale.x;
      vertices[i * 3 + 1] = position.getY(i) * this.worldScale.y;
      vertices[i * 3 + 2] = position.getZ(i) * this.worldScale.z;
    }

    return vertices;
  }
}

RE.registerComponent(RapierTrimesh);
        