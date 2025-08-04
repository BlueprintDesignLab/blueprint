// ------------------------------------------------
// 1) browser / bundler-friendly import
// import { posix } from '@arcmantle/posix-path-browser';

// 2) Node / bundler alias (uncomment if you run in Node)
import { posix } from 'path-browserify';
import { parse } from 'yaml';

interface Graph {
  nodes?: Record<string, Node>;
  edges?: Record<string, Edge>;
}

interface Node {
  main_file?: string;
  locked?: boolean;
  helper_files?: string[];
}

interface Edge {
  locked?: boolean;
  schema_file?: string;
  interface_file?: string;
  stub_files?: Record<string, string>;
}

/**
 * Returns true if the given file path is locked according to the Blueprint graph.
 * @param filePath  Path to test (relative or absolute, POSIX style)
 * @param graph     Parsed blueprint/graph.yaml
 */
export function isFileLocked(filePath: string, yaml: string): boolean {
  const graph = parse(yaml) as Graph;

  const target = posix.normalize(filePath);

  const lockedPaths = new Set<string>();

  // collect from nodes
  Object.values(graph.nodes ?? {}).forEach(n => {
    if (!n.locked) return;
    if (n.main_file) lockedPaths.add(posix.normalize(n.main_file));
    n.helper_files?.forEach(f => lockedPaths.add(posix.normalize(f)));
  });

  // collect from edges
  Object.values(graph.edges ?? {}).forEach(e => {
    if (!e.locked) return;
    if (e.schema_file) lockedPaths.add(posix.normalize(e.schema_file));
    if (e.interface_file) lockedPaths.add(posix.normalize(e.interface_file));
    Object.values(e.stub_files ?? {}).forEach(f =>
      lockedPaths.add(posix.normalize(f))
    );
  });

  // console.log(lockedPaths);
  return lockedPaths.has(target);
}