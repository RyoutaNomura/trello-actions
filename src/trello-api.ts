import fetch from "node-fetch";
import log4js from "log4js";

const logger = log4js.getLogger();
logger.level = "all";

export interface TrelloContext {
  apiKey: string;
  apiToken: string;
  boardId: string;
}

export interface Attachment {
  id: string;
  btyes: string;
  date: string;
  edgeColor: string;
  idMember: string;
  isUpload: boolean;
  mimeType: string;
  name: string;
  previews: Array<string>;
  url: string;
  pos: number;
}

export const getAttachmentsOnACard = async (
  trelloContext: TrelloContext,
  id: string
): Promise<Array<Attachment>> => {
  const url = new URL(`https://trello.com/1/cards/${id}/attachments`);
  url.search = new URLSearchParams({
    key: trelloContext.apiKey,
    token: trelloContext.apiToken,
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `error occurred while requesting ${id} with response: ${await response.text()}`
    );
  }
  return await response.json();
};

export const createAttachmentOnCard = async (
  trelloContext: TrelloContext,
  id: string,
  params: {
    url: string;
  }
): Promise<void> => {
  const url = new URL(`https://trello.com/1/cards/${id}/attachments`);

  const response = await fetch(url, {
    method: "POST",
    body: new URLSearchParams({
      key: trelloContext.apiKey,
      token: trelloContext.apiToken,
      url: params.url,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `error occurred while updating ${id} with response: ${await response.text()}`
    );
  }
  logger.info(`successfully updated ${id}`);
};

export const updateACard = async (
  trelloContext: TrelloContext,
  id: string,
  params: {
    idList: string;
  }
): Promise<void> => {
  const res = await fetch(`https://trello.com/1/cards/${id}`, {
    method: "PUT",
    body: new URLSearchParams({
      key: trelloContext.apiKey,
      token: trelloContext.apiToken,
      idList: params.idList,
      pos: "top",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `error occurred while updating ${id} with response: ${text}`
    );
  }
  logger.info(`successfully updated ${id}`);
};
