import { runWorkerLoop } from "./index";
import { runSchedulerLoop } from "./scheduler";

async function main() {
  await Promise.all([runWorkerLoop(), runSchedulerLoop()]);
}

main().catch((err) => {
  console.error("Worker/Scheduler fatal error:", err);
  process.exit(1);
});
