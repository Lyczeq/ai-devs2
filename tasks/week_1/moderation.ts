import OpenAI from "openai";
import { TaskResolver, Task } from "../../lib/auth";
import { isInputFlagged, moderateInput } from "../../lib/moderation";
type ModerationTask = Task & {
  input: ReadonlyArray<string>;
};

const taskResolver = new TaskResolver("moderation");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { input } = taskResolver.getTask() as ModerationTask;

const results = await Promise.all(input.map(moderateInput));
console.log({ results });
const answer = results.map((result) => (isInputFlagged(result) ? 1 : 0));
console.log({ answer });
taskResolver.sendAnswer(answer);
