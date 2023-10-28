import { TaskResolver } from "../../lib/auth";

const taskResolver = new TaskResolver("helloapi");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { cookie } = await taskResolver.getTask();
taskResolver.sendAnswer(cookie);
