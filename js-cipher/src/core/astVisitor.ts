import * as acorn from 'acorn';
import * as astring from 'astring';

export interface ASTNode {
  type: string;
  [key: string]: any;
}

export interface Visitor {
  enter?: (node: ASTNode, parent: ASTNode | null) => ASTNode | void;
  exit?: (node: ASTNode, parent: ASTNode | null) => ASTNode | void;
}

export interface Visitors {
  enter?: (node: ASTNode, parent: ASTNode | null) => ASTNode | void;
  exit?: (node: ASTNode, parent: ASTNode | null) => ASTNode | void;
  [type: string]: Visitor | ((node: ASTNode, parent: ASTNode | null) => ASTNode | void) | undefined;
}

export function parse(code: string): ASTNode {
  return acorn.parse(code, {
    ecmaVersion: 2020,
    sourceType: 'module',
    locations: true
  }) as unknown as ASTNode;
}

export function generate(node: ASTNode): string {
  return astring.generate(node, {
    indent: '',
    lineEnd: '',
  });
}

export function traverse(node: ASTNode, visitors: Visitors, parent: ASTNode | null = null): ASTNode {
  let currentNode = { ...node };

  const hasGenericEnter = typeof visitors.enter === 'function';
  const hasGenericExit = typeof visitors.exit === 'function';
  
  const typeVisitor = visitors[node.type];
  const hasTypeVisitor = typeVisitor !== undefined && node.type !== 'enter' && node.type !== 'exit';

  if (hasGenericEnter) {
    const result = visitors.enter!(currentNode, parent);
    if (result !== undefined) {
      currentNode = result;
    }
  }

  if (hasTypeVisitor) {
    if (typeof typeVisitor === 'function') {
      const result = typeVisitor(currentNode, parent);
      if (result !== undefined) {
        currentNode = result;
      }
    } else if (typeVisitor && typeof typeVisitor === 'object' && typeVisitor.enter) {
      const result = typeVisitor.enter(currentNode, parent);
      if (result !== undefined) {
        currentNode = result;
      }
    }
  }

  const keys = Object.keys(currentNode);
  for (const key of keys) {
    const child = currentNode[key];
    
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        const item = child[i];
        if (item && typeof item === 'object' && item.type) {
          child[i] = traverse(item, visitors, currentNode);
        }
      }
    } else if (child && typeof child === 'object' && child.type) {
      currentNode[key] = traverse(child, visitors, currentNode);
    }
  }

  if (hasTypeVisitor && typeVisitor && typeof typeVisitor === 'object' && typeVisitor.exit) {
    const result = typeVisitor.exit(currentNode, parent);
    if (result !== undefined) {
      currentNode = result;
    }
  }

  if (hasGenericExit) {
    const result = visitors.exit!(currentNode, parent);
    if (result !== undefined) {
      currentNode = result;
    }
  }

  return currentNode;
}

export function findNodes(node: ASTNode, predicate: (n: ASTNode) => boolean): ASTNode[] {
  const results: ASTNode[] = [];
  
  traverse(node, {
    enter: (n) => {
      if (predicate(n)) {
        results.push(n);
      }
    }
  });
  
  return results;
}

export function replaceNodes(
  node: ASTNode,
  predicate: (n: ASTNode) => boolean,
  replacer: (n: ASTNode) => ASTNode
): ASTNode {
  return traverse(node, {
    enter: (n) => {
      if (predicate(n)) {
        return replacer(n);
      }
    }
  });
}
