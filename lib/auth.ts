const AIDEVS_API_KEY = Bun.env.AIDEVS_API_KEY;

type Response = {
  code: number;
  msg: string;
  token: string;
};

export type Task = {
  code: number;
  msg: string;
};

export class TaskResolver {
  #apiKey = AIDEVS_API_KEY;
  #token = "";
  taskName: string;
  #task: any;

  constructor(taskName: string) {
    this.taskName = taskName;
  }

  async getAuthTokenForTask() {
    const response = await fetch(
      `https://zadania.aidevs.pl/token/${this.taskName}`,
      {
        method: "POST",
        body: JSON.stringify({
          apikey: this.#apiKey,
        }),
      }
    );

    const json = (await response.json()) as Response;
    this.#token = json.token;
  }

  async sendData(options: FetchRequestInit) {
    const response = await fetch(
      `https://zadania.aidevs.pl/task/${this.#token}`,
      {
        method: "POST",
        ...options,
      }
    );

    const dataResponse = await response.json();
    console.log({ dataResponse });

    return dataResponse;
  }

  async fetchTask() {
    const response = await fetch(
      `https://zadania.aidevs.pl/task/${this.#token}`
    );
    const task = await response.json();

    console.log({ task });
    this.#task = task;
  }

  getTask() {
    return this.#task;
  }

  async sendAnswer(answer: unknown) {
    const body = JSON.stringify({
      answer,
    });

    const response = await fetch(
      `https://zadania.aidevs.pl/answer/${this.#token}`,
      {
        method: "POST",
        body,
      }
    );

    const answerResponse = await response.json();

    console.log({ answerResponse });

    return answerResponse;
  }
}
