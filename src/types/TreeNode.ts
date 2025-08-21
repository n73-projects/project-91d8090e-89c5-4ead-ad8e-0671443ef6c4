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
    // First pass: calculate the minimum width needed for each subtree
    this.calculateSubtreeWidths();
    
    // Second pass: position nodes with proper spacing to avoid overlaps
    this.positionNodes(x, y, horizontalSpacing);
  }

  private calculateSubtreeWidths(): number {
    let leftWidth = 0;
    let rightWidth = 0;
    
    if (this.left) {
      leftWidth = this.left.calculateSubtreeWidths();
    }
    if (this.right) {
      rightWidth = this.right.calculateSubtreeWidths();
    }
    
    // Store the width needed for this subtree
    return Math.max(1, leftWidth + rightWidth);
  }

  private positionNodes(x: number, y: number, baseSpacing: number): void {
    this.x = x;
    this.y = y;

    // Calculate space needed for each subtree based on their complexity
    const leftSize = this.left ? this.getSubtreeSize(this.left) : 0;
    const rightSize = this.right ? this.getSubtreeSize(this.right) : 0;
    
    // More compact spacing that still prevents overlaps
    const minSpacing = 60;  // Reduced minimum distance
    const spacingMultiplier = Math.max(1, Math.sqrt(leftSize + rightSize) * 0.4); // Reduced multiplier
    const effectiveSpacing = Math.max(minSpacing, baseSpacing * spacingMultiplier);
    const verticalSpacing = 80; // More compact vertical spacing
    
    if (this.left) {
      // More compact left positioning
      const leftSpacing = effectiveSpacing * Math.max(0.7, Math.sqrt(leftSize) * 0.5);
      const leftX = x - leftSpacing;
      this.left.positionNodes(leftX, y + verticalSpacing, baseSpacing * 0.85);
    }

    if (this.right) {
      // More compact right positioning
      const rightSpacing = effectiveSpacing * Math.max(0.7, Math.sqrt(rightSize) * 0.5);
      const rightX = x + rightSpacing;
      this.right.positionNodes(rightX, y + verticalSpacing, baseSpacing * 0.85);
    }
  }

  private getSubtreeSize(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + this.getSubtreeSize(node.left) + this.getSubtreeSize(node.right);
  }


  clearHighlights(): void {
    this.isHighlighted = false;
    this.isVisited = false;
    this.isSearchResult = false;
    if (this.left) this.left.clearHighlights();
    if (this.right) this.right.clearHighlights();
  }
}