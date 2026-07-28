export type CategoryRow = {
  id: number;
  parent: number | null;
  name: string;
  slug: string;
  count?: number;
  sort_order?: number;
};

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  count?: number;
  sort_order?: number;
  children: CategoryNode[];
};

/**
 * Builds a nested CategoryNode tree array from a flat list of category rows.
 */
export function buildTree(rows: CategoryRow[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const validIds = new Set(rows.map(r => r.id));

  rows.forEach(r => {
    const parentId = r.parent && r.parent !== 0 && validIds.has(r.parent) ? r.parent : null;
    map.set(r.id, {
      id: r.id,
      name: r.name,
      slug: r.slug,
      parent: parentId,
      count: r.count || 0,
      sort_order: r.sort_order || 0,
      children: []
    });
  });

  const roots: CategoryNode[] = [];

  rows.forEach(r => {
    const node = map.get(r.id)!;
    const parentId = r.parent && r.parent !== 0 && validIds.has(r.parent) ? r.parent : null;
    if (!parentId) {
      roots.push(node);
    } else {
      const parentNode = map.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
}

/**
 * Performs a DFS traversal to return an array of category IDs (ancestor path + target)
 * leading to the node matching `activeSlug`.
 */
export function findPathToSlug(tree: CategoryNode[], activeSlug: string): number[] {
  const path: number[] = [];

  function dfs(nodes: CategoryNode[], targetSlug: string): boolean {
    for (const node of nodes) {
      path.push(node.id);
      if (node.slug.toLowerCase() === targetSlug.toLowerCase()) {
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (dfs(node.children, targetSlug)) {
          return true;
        }
      }
      path.pop();
    }
    return false;
  }

  dfs(tree, activeSlug);
  return path;
}
