import * as core from "@actions/core";
import * as github from "@actions/github";

try {
  const targetActionName = core.getInput("target-action-name");
  console.log(targetActionName);

  if (github.context.payload.pull_request) {
    const title = github.context.payload.pull_request.title;
    const description = github.context.payload.pull_request.body;
    const author = github.context.payload.pull_request.user.login;
    console.log(title);
    console.log(author);
    console.log(description);
  }
} catch (error) {
  core.setFailed(error.message);
}
