import * as core from "@actions/core";
import * as github from "@actions/github";
import * as TrelloApi from "./trello-api";
import { ActionContext, createActionContext } from "./action-context";
import log4js from "log4js";

const logger = log4js.getLogger();
logger.level = "all";

const resolveTrelloUrlFrom = (text?: string): Array<string> => {
  if (text) {
    return text.match(/https:\/\/trello\.com\/c\/.*/g) || [];
  } else {
    return [];
  }
};

const attachPrToCard = async (
  context: ActionContext,
  trelloUrls: Array<string>,
  prUrl?: string
): Promise<void> => {
  if (!prUrl) {
    throw new Error("pull-request url is not defined");
  }

  Promise.all(
    trelloUrls.map(async (url) => {
      const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
        new Array(2))[1];

      const attachments = await TrelloApi.getAttachmentsOnACard(
        context.inputs.trelloApiKey,
        context.inputs.trelloApiToken,
        cardId
      );
      if (attachments.findIndex((a) => a.url === prUrl) > -1) {
        logger.info(`${prUrl} is already attached to ${cardId}`);
        logger.info(`skipped updating ${cardId}`);
      } else {
        logger.info(`attaching github url to card: ${cardId}`);
        TrelloApi.createAttachmentOnCard(
          context.inputs.trelloApiKey,
          context.inputs.trelloApiToken,
          cardId,
          { url: prUrl }
        );
      }
    })
  );
};

const moveCard = async (
  context: ActionContext,
  trelloUrls: Array<string>,
  destListId: string
): Promise<void> => {
  if (!destListId) {
    throw new Error("dest-list-id is not defined");
  }

  Promise.all(
    trelloUrls.map(async (url) => {
      const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
        new Array(2))[1];
      TrelloApi.updateACard(
        context.inputs.trelloApiKey,
        context.inputs.trelloApiToken,
        cardId,
        { idList: destListId }
      );
    })
  );
};

try {
  const context = createActionContext();
  logger.info(`target action is ${context.inputs.targetActionName}`);

  if (github.context.payload.pull_request) {
    const trelloUrls = resolveTrelloUrlFrom(
      github.context.payload.pull_request.body
    );

    if (trelloUrls.length === 0) {
      logger.info("target card not found.");
    } else {
      logger.info(`target cards: ${trelloUrls}`);

      switch (context.inputs.targetActionName) {
        case "attach-pr-to-card":
          attachPrToCard(
            context,
            trelloUrls,
            github.context.payload.pull_request.html_url
          );
          break;
        case "move-card":
          moveCard(
            context,
            trelloUrls,
            core.getInput("list-id-containing-completed-cards")
          );
          break;
        default:
          throw new Error(
            `target action name cannot be resolved: ${context.inputs.targetActionName}`
          );
      }
    }
  }
} catch (error) {
  core.setFailed(error.message);
}
