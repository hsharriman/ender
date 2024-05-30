# Ender

## TODO
- [ ] Improve the proof class structure / cleanup (always ongoing)
- [ ] be able to render points
- [ ] highlighting angles on hover? when no tick is visible

## Stretch TODOs

- [ ] question logic/randomizing
- [ ] multiple choice question component
- [ ] redo relies on for long-form
- [ ] minifigures highlight on hover as well (for key terms)
- [ ] Change fonts (again?)
- [ ] highlighting of text when clicking on the diagram
- [ ] check for segments that overlap or are sub-sections of larger segment + keep track (then fix complete proof 3)
- [ ] hover tooltips for symbols like ||

## Less Urgent Bugs

- [ ] fix tick mark placement for angles in minifigures
- [ ] Make relies on resample if screen resizes
- [ ] go through todos in files
- [ ] hovering on point in long-form highlights wrong diagram label
- [ ] Make it so that hovering text doesn't cause the text to move

## TODO for infra/study

- [ ] anonymized ID for each participant
- [ ] uploading selected answers

## TODO for future proofs

- Circles
- Labeled segments

## Contributing
1. Open a branch with the naming convention `<user-alias>/<description>` (i.e., `hharriman/render-points`)
2. Push your changes to your branch
3. Open a PR to `main`. The first word of your PR title should be one of:
  a. `feat:` A new feature is being added with this PR
  b. `fix:` A fix is implemented in this PR
  c. `chore:` Some utility/devops/upkeep is done
4. In the PR description provide a list of the changes that were made


### Finding an issue to work on

Check out our list of [good first issues][].

- Before working on one of them, let us know that you are interested so we can
  give you more guidance! (Currently the issue descriptions are fairly brief.)

- Create a separate [branch][] in your forked repo to work on the issue:

  ```sh
  git switch --create my-branch
  git push --set-upstream fork my-branch
  ```

### Merging new changes from upstream

If you need to merge new changes from upstream (i.e. the original Penrose repo):

```sh
git fetch origin main:main
git merge main
```

After running the above, manage any [merge conflicts][], [commit][] to your
branch, and then [push][] to your fork:

```sh
git push
```

### Adding tests

For some PRs, it can be helpful to add tests that help verify the correctness of new features, and which ensure features don't break in future versions. Tests can be created as example diagrams in `packages/examples/src` and added to the [registry](#registry).

### Opening a pull request (PR)

When your work is ready for review:

- [Open a pull request][] (PR) by clicking on the **Contribute** button on the
  homepage of your forked repo
  (`https://github.com/<your-github-account-name>/penrose`).
- Put `fix:` or `feat:` at the beginning of the PR title depending on if it's a
  fix or a feature. We follow [conventional commit guidelines][] in our repo.
- Document your changes in the PR's description (including _specific paths for
  reproducing specific examples_, and link(s) to any issue(s) you address).
- Some things will be checked automatically by our [CI][]:
  - Make sure the system passes the regression tests.
  - Run [Prettier][] via `yarn format`.
- If you have permission, request review from the relevant person. Otherwise, no
  worries: we'll take a look at your PR and assign it to a maintainer.
- When your PR is approved, a maintainer will merge it.

If you hit any snags in the process, run into bugs, or just have questions,
please file an issue!


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
