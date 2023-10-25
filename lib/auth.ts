const API_KEY = Bun.env.API_KEY;

type Response = {
  code: number;
  msg: string;
  token: string;
};

export async function getAuthTokenForTask(taskName: string) {
  const response = await fetch(`https://zadania.aidevs.pl/token/${taskName}`, {
    method: "POST",
    body: JSON.stringify({
      apikey: API_KEY,
    }),
  });

  const json = (await response.json()) as Response;
  return json.token;
}

export async function getTask(token: string) {
  const response = await fetch(`https://zadania.aidevs.pl/task/${token}`);
  const task = await response.json();

  console.log({ task });
  return task;
}

export async function sendAnswer(token: string, answer: string) {
  const response = await fetch(`https://zadania.aidevs.pl/answer/${token}`, {
    method: "POST",
    body: JSON.stringify({
      answer,
    }),
  });

  const answerResponse = await response.json();

  console.log({ answerResponse });

  return answerResponse;
}
