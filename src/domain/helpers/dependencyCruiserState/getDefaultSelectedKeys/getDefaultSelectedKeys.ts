import { getAncestorKeys, isNodeModulesPath } from '../../pathUtils';

function collectAllPaths(sources: string[]): Set<string> {
  return new Set(sources.flatMap(source => [source, ...getAncestorKeys(source)]));
}

function getTopLevelFolderKeys(sources: string[]): string[] {
  return [
    ...new Set(
      sources
        .map(source => {
          const slash = source.indexOf('/');
          return slash === -1 ? null : source.slice(0, slash);
        })
        .filter((folder): folder is string => folder != null),
    ),
  ].sort();
}

/** Default selection: all paths under top-level folders except `node_modules`. */
export function getDefaultSelectedKeys(sources: string[]): string[] {
  const allPaths = collectAllPaths(sources);
  const nonNodeModulesPaths = [...allPaths].filter(path => !isNodeModulesPath(path));

  return [
    ...new Set(
      getTopLevelFolderKeys(sources)
        .filter(folder => !isNodeModulesPath(folder))
        .flatMap(folder => [
          folder,
          ...nonNodeModulesPaths.filter(path => path === folder || path.startsWith(`${folder}/`)),
        ]),
    ),
  ];
}
