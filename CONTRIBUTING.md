# Contributing

Hey, welcome to the party! 🎉

Thank you so much for your interest in contributing to TheraBot!


## Asking questions, suggesting wonderful ideas or reporting bugs

You can [submit an issue️](https://github.com/Ionaru/TheraBot/issues) on this GitHub repository.


## Coding

### 📦 Prerequisites

You need Node.js and npm.

To install them on Debian-based systems:

```bash
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

For other systems, please find information on [the official Node.js website](https://nodejs.org/en/download/).


### 🏗️ Installation

First, clone this repository:

```bash
git clone https://github.com/Ionaru/TheraBot.git
cd TheraBot
```

Then install the required dependencies:

```bash
npm install
```

Yay! You are ready! 🍾


### ⤴️ Pull requests

Please make sure any code you submit is compliant and compatible with this repository's [license](./LICENSE).

#### Your first pull request
1. [Create a fork of this project](https://github.com/Ionaru/TheraBot/fork).
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/TheraBot.git`.
3. Add the original repository as remote to keep it up-to-date: `git remote add upstream https://github.com/Ionaru/TheraBot.git`.
4. Fetch the latest changes from upstream: `git fetch upstream`.
5. Create a new branch to work on: `git checkout -b MyNewFeatureName`.
6. Write some awesome improvements, tests and commit your work.
7. Make sure your changes comply with the established code: `npm run test`.
8. Push your changes to GitHub: `git push origin`.
9. On GitHub, go to your forked branch, and click **New pull request**.
10. Choose the correct branches, add a description and submit your pull request!

#### Continuing development
To create more pull requests, please follow the steps below:
1. Go back to the master branch: `git checkout master`.
2. Fetch the upstream changes: `git fetch upstream`.
3. Update the master branch with upstream changes: `git merge upstream/master`.
4. Repeat ["Your first pull request"](#your-first-pull-request) from step 5.

Thank you! 💜
