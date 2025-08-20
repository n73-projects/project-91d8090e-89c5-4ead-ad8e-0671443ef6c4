import React, { useState, useEffect } from 'react';
import { TreeNode } from '../types/TreeNode';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TreeVisualizationProps {}

export const TreeVisualization: React.FC<TreeVisualizationProps> = () => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationLog, setAnimationLog] = useState<string[]>([]);

  // Initialize with a sample tree
  useEffect(() => {
    const root = new TreeNode(50);
    root.insert(30);
    root.insert(70);
    root.insert(20);
    root.insert(40);
    root.insert(60);
    root.insert(80);
    root.calculatePositions();
    setTree(root);
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const addAnimationLog = (message: string) => {
    setAnimationLog(prev => [...prev.slice(-4), message]);
  };

  const handleInsert = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || isAnimating) return;

    setIsAnimating(true);
    addAnimationLog(`Inserting value: ${value}`);

    if (!tree) {
      const newTree = new TreeNode(value);
      newTree.calculatePositions();
      setTree(newTree);
      addAnimationLog(`Created root node with value: ${value}`);
    } else {
      // Animate the insertion process
      await animateInsertion(tree, value);
      tree.insert(value);
      tree.calculatePositions();
      setTree(new TreeNode(tree.value));
      // Reconstruct the tree to trigger re-render
      const newTree = reconstructTree(tree);
      newTree.calculatePositions();
      setTree(newTree);
    }

    setInputValue('');
    setIsAnimating(false);
  };

  const reconstructTree = (node: TreeNode): TreeNode => {
    const newNode = new TreeNode(node.value);
    if (node.left) {
      newNode.left = reconstructTree(node.left);
    }
    if (node.right) {
      newNode.right = reconstructTree(node.right);
    }
    return newNode;
  };

  const animateInsertion = async (node: TreeNode, value: number) => {
    node.clearHighlights();
    let current = node;

    while (current) {
      current.isHighlighted = true;
      setTree(reconstructTree(tree!));
      await sleep(800);

      if (value < current.value) {
        addAnimationLog(`${value} < ${current.value}, go left`);
        if (!current.left) {
          addAnimationLog(`Found insertion point: left child of ${current.value}`);
          break;
        }
        current.isHighlighted = false;
        current = current.left;
      } else if (value > current.value) {
        addAnimationLog(`${value} > ${current.value}, go right`);
        if (!current.right) {
          addAnimationLog(`Found insertion point: right child of ${current.value}`);
          break;
        }
        current.isHighlighted = false;
        current = current.right;
      } else {
        addAnimationLog(`Value ${value} already exists in tree`);
        current.isHighlighted = false;
        return;
      }
    }

    current.isHighlighted = false;
  };

  const handleSearch = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || !tree || isAnimating) return;

    setIsAnimating(true);
    tree.clearHighlights();
    addAnimationLog(`Searching for value: ${value}`);

    let current: TreeNode | null = tree;
    let found = false;

    while (current) {
      current.isHighlighted = true;
      setTree(reconstructTree(tree));
      await sleep(800);

      if (value === current.value) {
        current.isSearchResult = true;
        addAnimationLog(`Found ${value}!`);
        found = true;
        break;
      } else if (value < current.value) {
        addAnimationLog(`${value} < ${current.value}, go left`);
        current.isHighlighted = false;
        current = current.left;
      } else {
        addAnimationLog(`${value} > ${current.value}, go right`);
        current.isHighlighted = false;
        current = current.right;
      }
    }

    if (!found) {
      addAnimationLog(`Value ${value} not found in tree`);
    }

    setTree(reconstructTree(tree));
    setInputValue('');
    setIsAnimating(false);
  };

  const handleTraversal = async (type: 'inorder' | 'preorder' | 'postorder') => {
    if (!tree || isAnimating) return;

    setIsAnimating(true);
    tree.clearHighlights();
    addAnimationLog(`Starting ${type} traversal`);

    const visitedOrder: number[] = [];

    const animateNode = async (node: TreeNode) => {
      node.isHighlighted = true;
      node.isVisited = true;
      visitedOrder.push(node.value);
      setTree(reconstructTree(tree));
      await sleep(800);
      node.isHighlighted = false;
    };

    try {
      if (type === 'inorder') {
        await inOrderTraversalAnimated(tree, animateNode);
      } else if (type === 'preorder') {
        await preOrderTraversalAnimated(tree, animateNode);
      } else {
        await postOrderTraversalAnimated(tree, animateNode);
      }

      addAnimationLog(`${type} traversal result: ${visitedOrder.join(' → ')}`);
    } catch (error) {
      addAnimationLog('Traversal completed');
    }

    setIsAnimating(false);
  };

  const inOrderTraversalAnimated = async (node: TreeNode | null, callback: (node: TreeNode) => Promise<void>): Promise<void> => {
    if (!node) return;
    await inOrderTraversalAnimated(node.left, callback);
    await callback(node);
    await inOrderTraversalAnimated(node.right, callback);
  };

  const preOrderTraversalAnimated = async (node: TreeNode | null, callback: (node: TreeNode) => Promise<void>): Promise<void> => {
    if (!node) return;
    await callback(node);
    await preOrderTraversalAnimated(node.left, callback);
    await preOrderTraversalAnimated(node.right, callback);
  };

  const postOrderTraversalAnimated = async (node: TreeNode | null, callback: (node: TreeNode) => Promise<void>): Promise<void> => {
    if (!node) return;
    await postOrderTraversalAnimated(node.left, callback);
    await postOrderTraversalAnimated(node.right, callback);
    await callback(node);
  };

  const clearTree = () => {
    setTree(null);
    setAnimationLog([]);
  };

  const clearHighlights = () => {
    if (tree) {
      tree.clearHighlights();
      setTree(reconstructTree(tree));
    }
  };

  const renderTree = () => {
    if (!tree) return null;

    const renderNode = (node: TreeNode): React.ReactElement[] => {
      const elements: React.ReactElement[] = [];

      // Render connections to children
      if (node.left) {
        elements.push(
          <line
            key={`line-${node.value}-left`}
            x1={node.x}
            y1={node.y}
            x2={node.left.x}
            y2={node.left.y}
            stroke="#64748b"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        );
        elements.push(...renderNode(node.left));
      }

      if (node.right) {
        elements.push(
          <line
            key={`line-${node.value}-right`}
            x1={node.x}
            y1={node.y}
            x2={node.right.x}
            y2={node.right.y}
            stroke="#64748b"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        );
        elements.push(...renderNode(node.right));
      }

      // Render the node itself
      const nodeColor = node.isSearchResult
        ? '#10b981' // green for search result
        : node.isHighlighted
        ? '#f59e0b' // amber for highlighted
        : node.isVisited
        ? '#8b5cf6' // purple for visited
        : '#3b82f6'; // blue for default

      elements.push(
        <g key={`node-${node.value}`}>
          <circle
            cx={node.x}
            cy={node.y}
            r="25"
            fill={nodeColor}
            stroke="#1e293b"
            strokeWidth="3"
            className="transition-all duration-300"
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dy="0.35em"
            fill="white"
            fontSize="16"
            fontWeight="bold"
          >
            {node.value}
          </text>
        </g>
      );

      return elements;
    };

    return (
      <svg width="800" height="500" className="border rounded-lg bg-gray-50">
        {renderNode(tree)}
      </svg>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Binary Search Tree Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            {/* Tree Visualization */}
            <div className="w-full flex justify-center">
              {renderTree()}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInsert();
                    }
                  }}
                  disabled={isAnimating}
                  className="w-32"
                />
                <Button
                  onClick={handleInsert}
                  disabled={isAnimating || !inputValue}
                  variant="default"
                >
                  Insert
                </Button>
                <Button
                  onClick={handleSearch}
                  disabled={isAnimating || !inputValue || !tree}
                  variant="secondary"
                >
                  Search
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleTraversal('inorder')}
                  disabled={isAnimating || !tree}
                  variant="outline"
                  size="sm"
                >
                  In-order
                </Button>
                <Button
                  onClick={() => handleTraversal('preorder')}
                  disabled={isAnimating || !tree}
                  variant="outline"
                  size="sm"
                >
                  Pre-order
                </Button>
                <Button
                  onClick={() => handleTraversal('postorder')}
                  disabled={isAnimating || !tree}
                  variant="outline"
                  size="sm"
                >
                  Post-order
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={clearHighlights}
                  disabled={isAnimating}
                  variant="outline"
                  size="sm"
                >
                  Clear Highlights
                </Button>
                <Button
                  onClick={clearTree}
                  disabled={isAnimating}
                  variant="destructive"
                  size="sm"
                >
                  Clear Tree
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Default Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                <span>Currently Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span>Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Search Result</span>
              </div>
            </div>

            {/* Animation Log */}
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg">Algorithm Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {animationLog.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      Perform operations to see algorithm steps...
                    </p>
                  ) : (
                    animationLog.map((log, index) => (
                      <p key={index} className="text-sm font-mono">
                        {log}
                      </p>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};