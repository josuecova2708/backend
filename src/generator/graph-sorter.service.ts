import { Injectable } from '@nestjs/common';
import { TableInfo } from './interfaces';
import { CyclicDependencyException } from './exceptions/generator.exceptions';

enum Color {
  WHITE = 'WHITE', // Not visited
  GRAY = 'GRAY', // In current DFS stack (ancestor)
  BLACK = 'BLACK', // Fully processed
}

@Injectable()
export class GraphSorterService {
  /**
   * Phase 2: Build dependency graph from FK relationships and return
   * tables in topological order (dependencies first).
   * Self-references are excluded from the graph edges.
   * Detects cycles using DFS with node coloring.
   */
  sort(tables: TableInfo[]): TableInfo[] {
    const tableMap = new Map<string, TableInfo>();
    const adjacency = new Map<string, Set<string>>(); // table -> depends on (set of tables)

    // Build lookup map
    for (const table of tables) {
      tableMap.set(table.name, table);
      adjacency.set(table.name, new Set());
    }

    // Build adjacency list from FK relationships
    for (const table of tables) {
      for (const col of table.columns) {
        if (col.isForeignKey && col.foreignKey && !col.isSelfReference) {
          const depTable = col.foreignKey.table;
          // Only add edge if the referenced table exists in our set
          if (tableMap.has(depTable)) {
            adjacency.get(table.name)!.add(depTable);
          }
        }
      }
    }

    // Topological sort with cycle detection using DFS + coloring
    const color = new Map<string, Color>();
    const parent = new Map<string, string | null>();
    const result: string[] = [];

    for (const tableName of tableMap.keys()) {
      color.set(tableName, Color.WHITE);
      parent.set(tableName, null);
    }

    for (const tableName of tableMap.keys()) {
      if (color.get(tableName) === Color.WHITE) {
        this.dfs(tableName, adjacency, color, parent, result);
      }
    }

    // Result is in reverse topological order (dependencies first)
    return result.map((name) => tableMap.get(name)!);
  }

  private dfs(
    node: string,
    adjacency: Map<string, Set<string>>,
    color: Map<string, Color>,
    parent: Map<string, string | null>,
    result: string[],
  ): void {
    color.set(node, Color.GRAY);

    const dependencies = adjacency.get(node) || new Set();

    for (const dep of dependencies) {
      const depColor = color.get(dep);

      if (depColor === Color.GRAY) {
        // Cycle detected — reconstruct the cycle path
        const cycle = this.reconstructCycle(node, dep, parent);
        throw new CyclicDependencyException(cycle);
      }

      if (depColor === Color.WHITE) {
        parent.set(dep, node);
        this.dfs(dep, adjacency, color, parent, result);
      }
    }

    color.set(node, Color.BLACK);
    result.push(node);
  }

  /**
   * Reconstruct the cycle path for a descriptive error message.
   * Walks back from `from` through parent pointers until reaching `to`.
   */
  private reconstructCycle(from: string, to: string, parent: Map<string, string | null>): string[] {
    const cycle: string[] = [to];
    let current: string | null = from;

    while (current && current !== to) {
      cycle.push(current);
      current = parent.get(current) || null;
    }

    cycle.push(to); // Close the cycle
    return cycle.reverse();
  }
}
