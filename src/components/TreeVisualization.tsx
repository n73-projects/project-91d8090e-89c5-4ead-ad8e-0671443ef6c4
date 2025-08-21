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
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth - 40;
      const height = window.innerHeight - 300; // Account for header and input
      setDimensions({ width: Math.max(1000, width), height: Math.max(500, height) });
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
    root.calculatePositions(dimensions.width / 2, 80, Math.max(80, dimensions.width / 12));
    setTree(root);
  }, [dimensions]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const addAnimationLog = (message: string) => {
    setAnimationLog(prev => [...prev.slice(-6), message]);
  };

  const forceRerender = () => {
    setRenderTrigger(prev => prev + 1);
  };

  const calculateTreeBounds = (node: TreeNode | null): { minX: number, maxX: number, minY: number, maxY: number } => {
    if (!node) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    let minX = node.x - 35; // Account for node radius (30) + small buffer
    let maxX = node.x + 35;
    let minY = node.y - 35;
    let maxY = node.y + 35;

    if (node.left) {
      const leftBounds = calculateTreeBounds(node.left);
      minX = Math.min(minX, leftBounds.minX);
      maxX = Math.max(maxX, leftBounds.maxX);
      minY = Math.min(minY, leftBounds.minY);
      maxY = Math.max(maxY, leftBounds.maxY);
    }

    if (node.right) {
      const rightBounds = calculateTreeBounds(node.right);
      minX = Math.min(minX, rightBounds.minX);
      maxX = Math.max(maxX, rightBounds.maxX);
      minY = Math.min(minY, rightBounds.minY);
      maxY = Math.max(maxY, rightBounds.maxY);
    }

    return { minX, maxX, minY, maxY };
  };

  const handleInsert = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || isAnimating) return;

    setIsAnimating(true);

    if (!tree) {
      const newTree = new TreeNode(value);
      newTree.calculatePositions(dimensions.width / 2, 80, Math.max(80, dimensions.width / 12));
      setTree(newTree);
      addAnimationLog(`Created root node with value: ${value}`);
    } else {
      // Check if value already exists
      const existingNode = tree.search(value);
      if (existingNode) {
        addAnimationLog(`⚠️ Value ${value} already exists in tree`);
        setIsAnimating(false);
        setInputValue('');
        return;
      }

      // Run the animation first
      await animateInsertion(tree, value);
      
      // Then actually insert the value
      tree.insert(value);
      
      // Recalculate positions for the new tree structure
      tree.calculatePositions(dimensions.width / 2, 80, Math.max(80, dimensions.width / 12));
      
      // Clear all highlights and update the tree
      tree.clearHighlights();
      forceRerender();
      
      addAnimationLog(`✅ Node ${value} successfully inserted!`);
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
    let path: TreeNode[] = [];

    addAnimationLog(`🔄 Starting insertion of ${value}`);
    await sleep(400);

    while (current) {
      current.isHighlighted = true;
      path.push(current);
      
      // Force a re-render without reconstructing the entire tree
      forceRerender();
      
      // Show comparison with visual emphasis
      addAnimationLog(`📍 Comparing ${value} with ${current.value}...`);
      await sleep(1000);

      if (value < current.value) {
        // Highlight the left direction
        addAnimationLog(`✅ ${value} < ${current.value} → Go LEFT (smaller values)`);
        current.isVisited = true; // Mark as part of the path
        forceRerender(); // Update visual state
        await sleep(800);
        
        if (!current.left) {
          addAnimationLog(`🎯 Found insertion point: LEFT child of ${current.value}`);
          addAnimationLog(`💡 Rule: ${value} < ${current.value}, so ${value} goes to the left`);
          break;
        }
        current.isHighlighted = false;
        current = current.left;
      } else if (value > current.value) {
        // Highlight the right direction
        addAnimationLog(`✅ ${value} > ${current.value} → Go RIGHT (larger values)`);
        current.isVisited = true; // Mark as part of the path
        forceRerender(); // Update visual state
        await sleep(800);
        
        if (!current.right) {
          addAnimationLog(`🎯 Found insertion point: RIGHT child of ${current.value}`);
          addAnimationLog(`💡 Rule: ${value} > ${current.value}, so ${value} goes to the right`);
          break;
        }
        current.isHighlighted = false;
        current = current.right;
      } else {
        addAnimationLog(`⚠️ Value ${value} already exists in tree - no insertion needed`);
        current.isHighlighted = false;
        forceRerender();
        return;
      }
    }

    // Show the final insertion with a special animation
    addAnimationLog(`🎉 Inserting ${value} at the correct position!`);
    current.isHighlighted = false;
    current.isVisited = true;
    
    // Highlight the entire path taken
    for (const pathNode of path) {
      pathNode.isVisited = true;
    }
    forceRerender();
    await sleep(1000);
    
    addAnimationLog(`✨ ${value} successfully added! Tree maintains BST order.`);
  };

  const handleSearch = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || !tree || isAnimating) return;

    setIsAnimating(true);
    tree.clearHighlights();
    addAnimationLog(`🔍 Searching for value: ${value}`);

    let current: TreeNode | null = tree;
    let found = false;

    while (current) {
      current.isHighlighted = true;
      forceRerender();
      await sleep(800);

      if (value === current.value) {
        current.isSearchResult = true;
        addAnimationLog(`✅ Found ${value}!`);
        found = true;
        break;
      } else if (value < current.value) {
        addAnimationLog(`📍 ${value} < ${current.value}, go left`);
        current.isHighlighted = false;
        current.isVisited = true;
        current = current.left;
      } else {
        addAnimationLog(`📍 ${value} > ${current.value}, go right`);
        current.isHighlighted = false;
        current.isVisited = true;
        current = current.right;
      }
    }

    if (!found) {
      addAnimationLog(`❌ Value ${value} not found in tree`);
    }

    forceRerender();
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
      forceRerender();
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
      forceRerender();
    }
  };

  const renderTree = () => {
    if (!tree) return null;
    
    // Use renderTrigger to force re-renders (this variable forces React to update)
    void renderTrigger;

    const renderNode = (node: TreeNode): React.ReactElement[] => {
      const elements: React.ReactElement[] = [];

      // Render connections to children with directional arrows
      if (node.left) {
        const lineColor = (node.isHighlighted || node.left.isHighlighted) ? '#f59e0b' : 
                         (node.isVisited || node.left.isVisited) ? '#8b5cf6' : '#64748b';
        const lineWidth = (node.isHighlighted || node.left.isHighlighted) ? '4' : '3';
        
        // Calculate arrow position
        const dx = node.left.x - node.x;
        const dy = node.left.y - node.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;
        
        // Arrow position (80% along the line)
        const arrowX = node.x + (dx * 0.8);
        const arrowY = node.y + (dy * 0.8);
        
        elements.push(
          <g key={`line-${node.value}-left`}>
            {/* Main line */}
            <line
              x1={node.x}
              y1={node.y}
              x2={node.left.x}
              y2={node.left.y}
              stroke={lineColor}
              strokeWidth={lineWidth}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
            {/* Directional arrow */}
            <polygon
              points={`${arrowX},${arrowY} ${arrowX - unitX * 8 - unitY * 4},${arrowY - unitY * 8 + unitX * 4} ${arrowX - unitX * 8 + unitY * 4},${arrowY - unitY * 8 - unitX * 4}`}
              fill={lineColor}
              className="transition-all duration-300"
            />
            {/* "SMALLER" label */}
            <text
              x={node.x - 25}
              y={node.y + 15}
              fill="#666"
              fontSize="10"
              fontWeight="bold"
              className="transition-all duration-300"
            >
              &lt;
            </text>
          </g>
        );
        elements.push(...renderNode(node.left));
      }

      if (node.right) {
        const lineColor = (node.isHighlighted || node.right.isHighlighted) ? '#f59e0b' : 
                         (node.isVisited || node.right.isVisited) ? '#8b5cf6' : '#64748b';
        const lineWidth = (node.isHighlighted || node.right.isHighlighted) ? '4' : '3';
        
        // Calculate arrow position
        const dx = node.right.x - node.x;
        const dy = node.right.y - node.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;
        
        // Arrow position (80% along the line)
        const arrowX = node.x + (dx * 0.8);
        const arrowY = node.y + (dy * 0.8);
        
        elements.push(
          <g key={`line-${node.value}-right`}>
            {/* Main line */}
            <line
              x1={node.x}
              y1={node.y}
              x2={node.right.x}
              y2={node.right.y}
              stroke={lineColor}
              strokeWidth={lineWidth}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
            {/* Directional arrow */}
            <polygon
              points={`${arrowX},${arrowY} ${arrowX - unitX * 8 - unitY * 4},${arrowY - unitY * 8 + unitX * 4} ${arrowX - unitX * 8 + unitY * 4},${arrowY - unitY * 8 - unitX * 4}`}
              fill={lineColor}
              className="transition-all duration-300"
            />
            {/* "LARGER" label */}
            <text
              x={node.x + 15}
              y={node.y + 15}
              fill="#666"
              fontSize="10"
              fontWeight="bold"
              className="transition-all duration-300"
            >
              &gt;
            </text>
          </g>
        );
        elements.push(...renderNode(node.right));
      }

      // Render the node itself
      const nodeColor = node.isSearchResult
        ? '#10b981' // green for search result
        : node.isHighlighted
        ? '#f59e0b' // amber for highlighted (currently comparing)
        : node.isVisited
        ? '#8b5cf6' // purple for visited (part of path)
        : '#3b82f6'; // blue for default

      const nodeRadius = 30;
      const isActive = node.isHighlighted || node.isVisited;

      elements.push(
        <g key={`node-${node.value}`} className="cursor-pointer">
          {/* Main circle with enhanced styling */}
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={nodeColor}
            stroke="#ffffff"
            strokeWidth={isActive ? "4" : "3"}
            className="transition-all duration-300"
            style={{
              filter: node.isHighlighted 
                ? 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))' 
                : node.isVisited 
                ? 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))'
                : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
            }}
          />
          
          {/* Node value */}
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dy="0.35em"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            className="transition-all duration-300"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {node.value}
          </text>
          
          {/* Pulse animation for currently highlighted nodes */}
          {node.isHighlighted && (
            <>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 15}
                fill="none"
                stroke={nodeColor}
                strokeWidth="3"
                opacity="0.6"
                className="animate-ping"
              />
              {/* Comparison indicator */}
              <text
                x={node.x}
                y={node.y - 50}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize="14"
                fontWeight="bold"
                className="animate-bounce"
              >
                COMPARING
              </text>
            </>
          )}
          
          {/* Path indicator for visited nodes */}
          {node.isVisited && !node.isHighlighted && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 8}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              opacity="0.8"
              strokeDasharray="5,5"
              className="transition-all duration-300"
            />
          )}
          
          {/* Direction indicators */}
          {isActive && (
            <>
              {/* Left arrow for smaller values */}
              <g opacity="0.7">
                <circle cx={node.x - 45} cy={node.y} r="12" fill="#e5e7eb" stroke="#9ca3af"/>
                <text x={node.x - 45} y={node.y} textAnchor="middle" dy="0.35em" fontSize="12" fontWeight="bold" fill="#374151">
                  &lt;
                </text>
                <text x={node.x - 45} y={node.y + 20} textAnchor="middle" fontSize="8" fill="#6b7280">
                  smaller
                </text>
              </g>
              
              {/* Right arrow for larger values */}
              <g opacity="0.7">
                <circle cx={node.x + 45} cy={node.y} r="12" fill="#e5e7eb" stroke="#9ca3af"/>
                <text x={node.x + 45} y={node.y} textAnchor="middle" dy="0.35em" fontSize="12" fontWeight="bold" fill="#374151">
                  &gt;
                </text>
                <text x={node.x + 45} y={node.y + 20} textAnchor="middle" fontSize="8" fill="#6b7280">
                  larger
                </text>
              </g>
            </>
          )}
        </g>
      );

      return elements;
    };

    // Calculate the bounds of the tree to optimize viewBox
    const bounds = calculateTreeBounds(tree);
    const padding = 50; // Reduced padding
    const viewBoxX = bounds.minX - padding;
    const viewBoxY = bounds.minY - padding;
    const viewBoxWidth = bounds.maxX - bounds.minX + 2 * padding;
    const viewBoxHeight = bounds.maxY - bounds.minY + 2 * padding;

    return (
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        className="border-2 border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg"
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
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
            <div className="space-y-1 max-h-52 overflow-y-auto bg-gray-50 p-3 rounded border text-xs">
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