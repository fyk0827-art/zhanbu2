/** 生成器在融合平台中的路由前缀（BrowserRouter 绝对路径） */
export const GENERATOR_BASE = "/generator";

export function generatorPath(path: string = ""): string {
  if (!path || path === ".") return GENERATOR_BASE;
  if (path.startsWith(GENERATOR_BASE)) return path;
  return `${GENERATOR_BASE}/${path.replace(/^\//, "")}`;
}
