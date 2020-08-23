import * as core from "@actions/core";

type TargetActionName = "attach-pr-to-card" | "move-card";

export interface ActionContext {
  inputs: {
    targetActionName: TargetActionName;
    trelloApiKey: string;
    trelloApiToken: string;
    boardId: string;
    listIdContainingCompletedCards?: string;
  };
}

export const createActionContext = (): ActionContext => {
  const targetActionName = core.getInput(
    "target-action-name"
  ) as TargetActionName;
  const trelloApiKey = core.getInput("trello-api-key");
  const trelloApiToken = core.getInput("trello-api-token");
  const boardId = core.getInput("board-id");
  const listIdContainingCompletedCards = core.getInput(
    "list-id-containing-completed-cards"
  );

  if (!targetActionName) {
    throw new Error("target-action-name not defined");
  }
  if (!trelloApiKey) {
    throw new Error("trello-api-key not defined");
  }
  if (!trelloApiToken) {
    throw new Error("trello-api-token not defined");
  }
  if (!boardId) {
    throw new Error("board-id not defined");
  }
  if (targetActionName === "move-card") {
    if (!listIdContainingCompletedCards) {
      throw new Error("list-id-containing-completed-cards not defined");
    }
  }

  return {
    inputs: {
      targetActionName,
      trelloApiKey,
      trelloApiToken,
      boardId,
      listIdContainingCompletedCards,
    },
  };
};
