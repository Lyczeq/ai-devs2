import OpenAI from "openai";

const client = new OpenAI();

export async function moderateInput(input: string) {
  const response = await client.moderations.create({ input });

  return response;
}

export function isInputFlagged(
  response: OpenAI.Moderations.ModerationCreateResponse
) {
  return response.results.at(0)?.flagged ?? false;
}
