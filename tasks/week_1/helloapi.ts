import { Task, TaskResolver } from "../../lib/auth";

type HelloApiTask = Task & {
  cookie: string;
};

const taskResolver = new TaskResolver("helloapi");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { cookie } = (await taskResolver.getTask()) as HelloApiTask;
taskResolver.sendAnswer(cookie);
