import React, { useState, useEffect } from 'react';
import { TreeNode } from '../types/TreeNode';
import { Button } from './ui/button';

interface TreeVisualizationProps {}

export const TreeVisualization: React.FC<TreeVisualizationProps> = () => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationLog, setAnimationLog] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 500 });

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth - 40;
      const height = window.innerHeight - 300; // Account for header and input
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
      newTree.calculatePositions(dimensions.width / 2, 80, dimensions.width / 8);
      setTree(newTree);
      addAnimationLog(`Created root node with value: ${value}`);
    } else {
      await animateInsertion(tree, value);
      tree.insert(value);
      tree.calculatePositions(dimensions.width / 2, 80, dimensions.width / 8);
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

      elements.push(
        <g key={`node-${node.value}`} className="cursor-pointer">
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={nodeColor}
            stroke="#ffffff"
            strokeWidth="3"
            className="transition-all duration-300"
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dy="0.35em"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            className="transition-all duration-300"
          >
            {node.value}
          </text>
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
      
      {/* Input Section - TOP OF SCREEN */}
      <div className="bg-gradient-to-r from-blue-100 to-green-100 p-4 border-b-4 border-blue-500">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-blue-400">
            <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
              ➕ ADD NUMBERS TO TREE ➕
            </h2>
            <div className="flex gap-4 items-end justify-center">
              <div className="flex-1 max-w-xs">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                  Enter a number:
                </label>
                <input
                  type="number"
                  placeholder="Type here (e.g., 42)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInsert();
                    }
                  }}
                  disabled={isAnimating}
                  className="w-full text-2xl py-4 px-4 border-4 border-blue-500 focus:border-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg focus:outline-none disabled:opacity-50 bg-yellow-50 text-center font-bold shadow-lg"
                  style={{ minHeight: '70px' }}
                />
              </div>
              <Button
                onClick={handleInsert}
                disabled={isAnimating || !inputValue}
                variant="default"
                className="px-8 py-4 text-xl font-bold bg-green-600 hover:bg-green-700 text-white h-[70px]"
              >
                INSERT
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isAnimating || !inputValue || !tree}
                variant="secondary"
                className="px-8 py-4 text-xl font-bold h-[70px]"
              >
                SEARCH
              </Button>
            </div>
            {isAnimating && (
              <div className="text-center mt-4 text-lg text-blue-600 font-bold animate-pulse">
                🤖 Processing algorithm...
              </div>
            )}
            <div className="flex gap-2 justify-center mt-4">
              <span className="text-sm text-gray-600">Quick add:</span>
              {[10, 25, 75, 90].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setInputValue(num.toString());
                    setTimeout(() => handleInsert(), 100);
                  }}
                  disabled={isAnimating}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Tree visualization area */}
        <div className="flex-1 p-4 flex items-center justify-center">
          {renderTree()}
        </div>
        
        {/* Control panel */}
        <div className="w-80 bg-white shadow-lg border-l flex flex-col">
          
          {/* Traversal Section */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🌲 Tree Traversal</h3>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🛠️ Utilities</h3>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-3">🎨 Legend</h3>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-3">📋 Algorithm Log</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded border text-xs">
              {animationLog.length === 0 ? (
                <p className="text-gray-500">
                  Use the input field at the top to see algorithm steps...
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