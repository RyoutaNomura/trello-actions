const core = require('@actions/core');
const github = require('@actions/github');

try {
  const targetActionName = core.getInput('target-action-name');
  console.log(targetActionName);
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(payload);

} catch (error) {
  core.setFailed(error.message);
}
