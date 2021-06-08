export function substituteShader(
  shaderTemplate: string,
  substitutions: { [chunkName: string]: string }
): string {
  let shader = shaderTemplate;

  while (true) {
    let isChanged = false;

    Object.entries(substitutions).forEach(
      ([chunkName, replacement]) => {
        const regex = new RegExp(`#include <${chunkName}>`, "g");
        if (shader.match(regex)) {
          isChanged = true;
          shader = shader.replace(
            new RegExp(`#include <${chunkName}>`, "g"),
            replacement
          );
        }
      }
    );

    if (!isChanged) break;
  }

  return shader;
}
