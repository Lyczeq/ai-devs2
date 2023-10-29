import OpenAI from "openai";
import { Task, TaskResolver } from "./../../lib/auth";

type BloggerTask = Task & {
  blog: ReadonlyArray<string>;
};

const client = new OpenAI({
  apiKey: Bun.env.OPENAI_KEY,
});

const taskResolver = new TaskResolver("blogger");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { blog, msg } = taskResolver.getTask() as BloggerTask;

const text = await client.chat.completions.create({
  messages: [
    {
      role: "user",
      content: `Please write a blog post. Each element from the given array should be a separate paragraph in the blog post that describe the element. Each one should have a original title.${JSON.stringify(
        blog
      )}. Do it in polish. Send it back in JSON in the following format {"answers": [each paragraph] }`,
    },
  ],
  model: "gpt-3.5-turbo",
});

if (text.choices[0].message.content) {
  await taskResolver.sendAnswer(
    JSON.parse(text.choices[0].message.content).answers
  );
}
