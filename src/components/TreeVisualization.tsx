import React, { useState, useEffect } from 'react';
import { TreeNode } from '../types/TreeNode';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface TreeVisualizationProps {}

export const TreeVisualization: React.FC<TreeVisualizationProps> = () => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationLog, setAnimationLog] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth - 40; // Account for padding
      const height = window.innerHeight - 200; // Account for controls and header
      setDimensions({ width: Math.max(800, width), height: Math.max(400, height) });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize with a sample tree
  useEffect(() => {
    const root = new TreeNode(50);
    root.insert(30);
    root.insert(70);
    root.insert(20);
    root.insert(40);
    root.insert(60);
    root.insert(80);
    root.insert(15);
    root.insert(25);
    root.insert(35);
    root.insert(45);
    root.calculatePositions(dimensions.width / 2, 80, dimensions.width / 8);
    setTree(root);
  }, [dimensions]);

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
      tree.calculatePositions(dimensions.width / 2, 80, dimensions.width / 8);
      setTree(new TreeNode(tree.value));
      // Reconstruct the tree to trigger re-render
      const newTree = reconstructTree(tree);
      newTree.calculatePositions(dimensions.width / 2, 80, dimensions.width / 8);
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
        const lineColor = (node.isHighlighted || node.left.isHighlighted) ? '#f59e0b' : '#64748b';
        elements.push(
          <g key={`line-${node.value}-left`}>
            {/* Shadow line */}
            <line
              x1={node.x + 1}
              y1={node.y + 1}
              x2={node.left.x + 1}
              y2={node.left.y + 1}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="3"
              className="transition-all duration-300"
            />
            {/* Main line */}
            <line
              x1={node.x}
              y1={node.y}
              x2={node.left.x}
              y2={node.left.y}
              stroke={lineColor}
              strokeWidth="3"
              className="transition-all duration-300"
              strokeLinecap="round"
            />
          </g>
        );
        elements.push(...renderNode(node.left));
      }

      if (node.right) {
        const lineColor = (node.isHighlighted || node.right.isHighlighted) ? '#f59e0b' : '#64748b';
        elements.push(
          <g key={`line-${node.value}-right`}>
            {/* Shadow line */}
            <line
              x1={node.x + 1}
              y1={node.y + 1}
              x2={node.right.x + 1}
              y2={node.right.y + 1}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="3"
              className="transition-all duration-300"
            />
            {/* Main line */}
            <line
              x1={node.x}
              y1={node.y}
              x2={node.right.x}
              y2={node.right.y}
              stroke={lineColor}
              strokeWidth="3"
              className="transition-all duration-300"
              strokeLinecap="round"
            />
          </g>
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

      const nodeRadius = 30;
      const strokeWidth = node.isHighlighted ? 4 : 2;

      elements.push(
        <g key={`node-${node.value}`} className="cursor-pointer">
          {/* Shadow */}
          <circle
            cx={node.x + 2}
            cy={node.y + 2}
            r={nodeRadius}
            fill="rgba(0,0,0,0.1)"
            className="transition-all duration-300"
          />
          {/* Main circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={nodeColor}
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            className="transition-all duration-300 filter drop-shadow-lg"
            style={{
              filter: node.isHighlighted ? 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.6))' : 
                      node.isSearchResult ? 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.6))' :
                      'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
          {/* Inner highlight */}
          <circle
            cx={node.x - 8}
            cy={node.y - 8}
            r="6"
            fill="rgba(255,255,255,0.3)"
            className="transition-all duration-300"
          />
          {/* Text */}
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dy="0.35em"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            className="transition-all duration-300"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            {node.value}
          </text>
          {/* Pulse animation for highlighted nodes */}
          {node.isHighlighted && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 10}
              fill="none"
              stroke={nodeColor}
              strokeWidth="2"
              opacity="0.6"
              className="animate-ping"
            />
          )}
        </g>
      );

      return elements;
    };

    return (
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        className="border-2 border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {renderNode(tree)}
      </svg>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          🌳 Binary Search Tree Visualization
        </h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Tree visualization area */}
        <div className="flex-1 p-4 flex items-center justify-center">
          {renderTree()}
        </div>
        
        {/* Control panel */}
        <div className="w-80 bg-white shadow-lg border-l flex flex-col">
          {/* Input Controls */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              🎯 Tree Operations
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter a number to insert or search:
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 42"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInsert();
                    }
                  }}
                  disabled={isAnimating}
                  className="w-full text-lg py-3 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={handleInsert}
                  disabled={isAnimating || !inputValue}
                  variant="default"
                  className="w-full font-semibold py-3 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  ➕ Insert Node
                </Button>
                <Button
                  onClick={handleSearch}
                  disabled={isAnimating || !inputValue || !tree}
                  variant="secondary"
                  className="w-full font-semibold py-3 text-lg"
                >
                  🔍 Search Node
                </Button>
              </div>
              {isAnimating && (
                <div className="text-center p-3 bg-blue-100 rounded-lg">
                  <div className="text-blue-600 font-medium animate-pulse">
                    🤖 Processing algorithm...
                  </div>
                </div>
              )}
              {!inputValue && !isAnimating && (
                <div className="text-center text-sm text-gray-500 italic">
                  💡 Enter a number above to get started
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="p-4 border-b bg-green-50">
            <h3 className="text-md font-semibold text-gray-700 mb-3">⚡ Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  setInputValue('25');
                  setTimeout(() => handleInsert(), 100);
                }}
                disabled={isAnimating}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Add 25
              </Button>
              <Button
                onClick={() => {
                  setInputValue('75');
                  setTimeout(() => handleInsert(), 100);
                }}
                disabled={isAnimating}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Add 75
              </Button>
              <Button
                onClick={() => {
                  setInputValue('10');
                  setTimeout(() => handleInsert(), 100);
                }}
                disabled={isAnimating}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Add 10
              </Button>
              <Button
                onClick={() => {
                  setInputValue('90');
                  setTimeout(() => handleInsert(), 100);
                }}
                disabled={isAnimating}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Add 90
              </Button>
            </div>
          </div>

          {/* Traversal Section */}
          <div className="p-4 border-b">
            <h3 className="text-md font-semibold text-gray-700 mb-3">🌲 Tree Traversal</h3>
            <div className="space-y-2">
              <Button
                onClick={() => handleTraversal('inorder')}
                disabled={isAnimating || !tree}
                variant="outline"
                className="w-full justify-start"
              >
                In-order (L → Root → R)
              </Button>
              <Button
                onClick={() => handleTraversal('preorder')}
                disabled={isAnimating || !tree}
                variant="outline"
                className="w-full justify-start"
              >
                Pre-order (Root → L → R)
              </Button>
              <Button
                onClick={() => handleTraversal('postorder')}
                disabled={isAnimating || !tree}
                variant="outline"
                className="w-full justify-start"
              >
                Post-order (L → R → Root)
              </Button>
            </div>
          </div>
          
          {/* Utility Section */}
          <div className="p-4 border-b">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Utilities</h3>
            <div className="space-y-2">
              <Button
                onClick={clearHighlights}
                disabled={isAnimating}
                variant="outline"
                className="w-full"
              >
                Clear Highlights
              </Button>
              <Button
                onClick={clearTree}
                disabled={isAnimating}
                variant="destructive"
                className="w-full"
              >
                Clear Tree
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-b">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Default Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Found</span>
              </div>
            </div>
          </div>

          {/* Algorithm Log */}
          <div className="flex-1 p-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Algorithm Log</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded border text-xs">
              {animationLog.length === 0 ? (
                <p className="text-gray-500">
                  Perform operations to see algorithm steps...
                </p>
              ) : (
                animationLog.map((log, index) => (
                  <p key={index} className="font-mono text-gray-700">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};