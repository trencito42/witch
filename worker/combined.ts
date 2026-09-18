import { runWorkerLoop } from "./index";
import { runSchedulerLoop } from "./scheduler";

await Promise.all([runWorkerLoop(), runSchedulerLoop()]);
