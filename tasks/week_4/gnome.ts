import { HumanMessage, SystemMessage } from "langchain/schema";
import { Task, TaskResolver } from "../../lib/auth";
import { ChatOpenAI } from "langchain/chat_models/openai";
import OpenAI from "openai";

type GnomeTask = Task & {
  url: string;
};

const taskResolver = new TaskResolver("gnome");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { url } = taskResolver.getTask() as GnomeTask;

const openai = new OpenAI();

const { choices } = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "system",
      content:
        "You'll receive an image to analyze. If there's a gnome in the image, return what's the color of it's hat.IMPORTANT, do it in polish, return just color and nothing else. If there's no gnome in the image return 'ERROR'",
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: url,
          },
        },
      ],
    },
  ],
});

console.log(choices.at(0)?.message);

if (choices.at(0)?.message) {
  await taskResolver.sendAnswer(choices.at(0)?.message.content);
}
