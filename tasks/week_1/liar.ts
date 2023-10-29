import OpenAI from "openai";
import { Task, TaskResolver } from "../../lib/auth";

type SendDataResponse = Task & {
  answer: string;
};

const client = new OpenAI();

const taskResolver = new TaskResolver("liar");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();

const form = new FormData();
const myQuestion = "What is capital of Poland?";
form.append("question", myQuestion);

const { answer } = (await taskResolver.sendData({
  body: form,
})) as SendDataResponse;

const gptResponse = await client.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "user",
      content: `Hi I asked the other AI modal this question: ${myQuestion}. This is his answer: ${answer}. Does his answer really answers on my question? Is is true? If so, respond 'YES', if no respond 'NO'.`,
    },
  ],
});

const gptAnswer = gptResponse.choices.at(0)?.message.content;

if (gptAnswer) {
  await taskResolver.sendAnswer(gptAnswer);
}
