# Contributing to the SpectralOps VS code extension

SpectralOps VS code extension is open source and we love to receive contributions from our community — you! 

There are many ways to contribute,
from writing tutorials or blog posts,
improving the documentation,
submitting bug reports and feature requests or writing code.
feedback and ideas are always welcome.

## Code contributions

If you have a bugfix or new feature that you would like to contribute,
please find or open an issue about it first.
Talk about what you would like to do.
It may be that somebody is already working on it,
or that there are particular issues that you should know about before implementing the change.

### Submitting your changes

Generally, we require that you test any code you are adding or modifying.
Once your changes are ready , submit for review and we will make sure will review it , your effort is much appreciated!

### Workflow

All feature development and most bug fixes hit the master branch first.
Pull requests should be reviewed by someone with commit access.
Once approved, the author of the pull request,
or reviewer if the author does not have commit access,
should "Squash and merge".

## Run extension and debug

Clone the repository, then run `yarn` in the directory.

- Open repository directory in VS Code run `yarn esbuild` and press `F5` to run extension in a new VS Code window.
- This allows extension debugging within VS Code.
- You can find output from your extension in the debug console and output channel.

Please install all recommended extension that are suggested by VS Code when first opening the cloned directory. You can also do install them manually with the list of extensions defined in `.vscode/extensions.json`. This will ensure consistent formatting with the current codebase.

## Make changes

Code changes require extension reload when run in debug.

- You can relaunch the extension from the debug toolbar after changing code.
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Run tests and debug

- Unit tests

  - Run `yarn test:unit` for a single execution.
  - Make sure to re-run the command to pick up new files, if new `**.test.ts` is added.

