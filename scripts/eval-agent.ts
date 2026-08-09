import Module from "node:module";

type ModuleWithLoad = typeof Module & {
  _load(request: string, parent?: unknown, isMain?: boolean): unknown;
};

const moduleWithLoad = Module as ModuleWithLoad;
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function load(request: string, parent?: unknown, isMain?: boolean) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
  const { runAgentEvaluations } = await import("@/server/agent/evaluator");
  const results = await runAgentEvaluations();
  const failed = results.filter((result) => !result.passed);

  for (const result of results) {
    const marker = result.passed ? "PASS" : "FAIL";
    console.log(`${marker} ${result.name}`);
    for (const failure of result.failures) console.log(`  - ${failure}`);
  }

  console.log(`\n${results.length - failed.length}/${results.length} agent evals passed.`);
  if (failed.length) process.exit(1);
}

void main();
