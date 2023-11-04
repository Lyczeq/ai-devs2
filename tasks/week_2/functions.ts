import { Task, TaskResolver } from "../../lib/auth";

const taskResolver = new TaskResolver("functions");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();

const addUserSchema = {
  name: "addUser",
  description: "add new user",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "provide name of the user",
      },
      surname: {
        type: "string",
        description: "provide surname of the user",
      },
      year: {
        type: "integer",
        description: "provide user's year of born",
      },
    },
  },
};

await taskResolver.sendAnswer(addUserSchema);
