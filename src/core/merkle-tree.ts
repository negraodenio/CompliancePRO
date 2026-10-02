import crypto from 'crypto';

export type MerkleNodePosition = 'LEFT' | 'RIGHT';

export interface MerkleProofStep {
  position: MerkleNodePosition;
  hash: string;
}

export interface MerkleInclusionProof {
  targetHash: string;
  leafIndex: number;
  totalLeaves: number;
  merkleRoot: string;
  proof: MerkleProofStep[];
}

export class MerkleTree {
  private readonly leaves: string[];
  private readonly layers: string[][];

  constructor(leafHashes: string[]) {
    if (!leafHashes || leafHashes.length === 0) {
      throw new Error('MerkleTree requires at least one leaf hash');
    }
    this.leaves = [...leafHashes];
    this.layers = this.buildLayers(this.leaves);
  }

  public static hashPair(left: string, right: string): string {
    return crypto.createHash('sha256')
      .update(`${left}:${right}`)
      .digest('hex');
  }

  private buildLayers(leaves: string[]): string[][] {
    const layers: string[][] = [leaves];
    let currentLayer = leaves;

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        nextLayer.push(MerkleTree.hashPair(left, right));
      }
      layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return layers;
  }

  public getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  public generateProof(index: number): MerkleInclusionProof {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Leaf index ${index} out of bounds (total leaves: ${this.leaves.length})`);
    }

    const targetHash = this.leaves[index];
    const proof: MerkleProofStep[] = [];
    let currentIndex = index;

    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex];
      const isEven = currentIndex % 2 === 0;
      const siblingIndex = isEven ? currentIndex + 1 : currentIndex - 1;

      if (siblingIndex < layer.length) {
        proof.push({
          position: isEven ? 'RIGHT' : 'LEFT',
          hash: layer[siblingIndex]
        });
      } else {
        proof.push({
          position: 'RIGHT',
          hash: layer[currentIndex]
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      targetHash,
      leafIndex: index,
      totalLeaves: this.leaves.length,
      merkleRoot: this.getRoot(),
      proof
    };
  }

  public static verifyProof(proof: MerkleInclusionProof): boolean {
    if (!proof || !proof.targetHash || !proof.merkleRoot) {
      return false;
    }

    let currentHash = proof.targetHash;

    for (const step of proof.proof) {
      if (step.position === 'LEFT') {
        currentHash = MerkleTree.hashPair(step.hash, currentHash);
      } else {
        currentHash = MerkleTree.hashPair(currentHash, step.hash);
      }
    }

    return currentHash.toLowerCase() === proof.merkleRoot.toLowerCase();
  }
}
