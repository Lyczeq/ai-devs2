import { HumanMessage, SystemMessage } from "langchain/schema";
import { Task, TaskResolver } from "../../lib/auth";
import { ChatOpenAI } from "langchain/chat_models/openai";

type MemeTask = Task & {
  image: string;
  text: string;
};

const sendImageToProcess = async (imageUrl: string, text: string) => {
  if (!process.env.RENDER_FORM_API_KEY) {
    throw new Error("No RENDER_FORM_API_KEY env");
  }

  const response = await fetch("https://api.renderform.io/api/v2/render", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-API-KEY": process.env.RENDER_FORM_API_KEY ?? "",
    },
    body: JSON.stringify({
      template: "prickly-banshees-smash-busily-1658",
      data: {
        "IMAGE.src": imageUrl,
        "TEXT.text": text,
      },
    }),
  });

  return response.json<{ href: string; requestId: string }>();
};

const taskResolver = new TaskResolver("meme");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { image, text } = taskResolver.getTask() as MemeTask;
const { href } = await sendImageToProcess(image, text);
await taskResolver.sendAnswer(href);
