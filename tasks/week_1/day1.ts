import { getAuthTokenForTask, getTask, sendAnswer } from "../../lib/auth";

const token = await getAuthTokenForTask("helloapi");
const task = await getTask(token);

const answer = task.cookie;
await sendAnswer(token, answer);
