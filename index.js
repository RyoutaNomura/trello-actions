const core = require('@actions/core');
const github = require('@actions/github');

try {
  const targetActionName = core.getInput('target-action-name');
  console.log(targetActionName);
  const title = github.context.payload.pull_request.title;
  const description = github.context.payload.pull_request.body;
  const author = github.context.payload.pull_request.user.login;

  console.log(title);
  console.log(author);
  console.log(description);
} catch (error) {
  core.setFailed(error.message);
}
