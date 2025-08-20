export class TreeNode {
  value: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  x: number = 0;
  y: number = 0;
  isHighlighted: boolean = false;
  isVisited: boolean = false;
  isSearchResult: boolean = false;

  constructor(value: number) {
    this.value = value;
  }

  insert(value: number): TreeNode {
    if (value < this.value) {
      if (this.left === null) {
        this.left = new TreeNode(value);
      } else {
        this.left.insert(value);
      }
    } else if (value > this.value) {
      if (this.right === null) {
        this.right = new TreeNode(value);
      } else {
        this.right.insert(value);
      }
    }
    return this;
  }

  search(value: number): TreeNode | null {
    if (value === this.value) {
      return this;
    } else if (value < this.value && this.left) {
      return this.left.search(value);
    } else if (value > this.value && this.right) {
      return this.right.search(value);
    }
    return null;
  }

  inOrderTraversal(callback: (node: TreeNode) => void): void {
    if (this.left) {
      this.left.inOrderTraversal(callback);
    }
    callback(this);
    if (this.right) {
      this.right.inOrderTraversal(callback);
    }
  }

  preOrderTraversal(callback: (node: TreeNode) => void): void {
    callback(this);
    if (this.left) {
      this.left.preOrderTraversal(callback);
    }
    if (this.right) {
      this.right.preOrderTraversal(callback);
    }
  }

  postOrderTraversal(callback: (node: TreeNode) => void): void {
    if (this.left) {
      this.left.postOrderTraversal(callback);
    }
    if (this.right) {
      this.right.postOrderTraversal(callback);
    }
    callback(this);
  }

  getAllNodes(): TreeNode[] {
    const nodes: TreeNode[] = [this];
    if (this.left) {
      nodes.push(...this.left.getAllNodes());
    }
    if (this.right) {
      nodes.push(...this.right.getAllNodes());
    }
    return nodes;
  }

  calculatePositions(x: number = 400, y: number = 50, horizontalSpacing: number = 100): void {
    this.x = x;
    this.y = y;

    // Calculate the width needed for each subtree
    const leftWidth = this.left ? this.getSubtreeWidth(this.left) : 0;
    const rightWidth = this.right ? this.getSubtreeWidth(this.right) : 0;
    
    // Improved spacing calculation
    const baseSpacing = Math.max(60, horizontalSpacing);
    const verticalSpacing = 90;

    if (this.left) {
      const leftX = x - Math.max(baseSpacing, leftWidth * 40);
      this.left.calculatePositions(leftX, y + verticalSpacing, baseSpacing * 0.75);
    }

    if (this.right) {
      const rightX = x + Math.max(baseSpacing, rightWidth * 40);
      this.right.calculatePositions(rightX, y + verticalSpacing, baseSpacing * 0.75);
    }
  }


  private getSubtreeWidth(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + Math.max(this.getSubtreeWidth(node.left), this.getSubtreeWidth(node.right));
  }

  clearHighlights(): void {
    this.isHighlighted = false;
    this.isVisited = false;
    this.isSearchResult = false;
    if (this.left) this.left.clearHighlights();
    if (this.right) this.right.clearHighlights();
  }
}