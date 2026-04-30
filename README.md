# Ender

## Run the Project

### Prerequisites

- Node.js 18+ (recommended)
- npm

Install dependencies once (there will be many critical dependency errors caused by create-react-app, I'm sorry):

```bash
npm install
```

### Interface (React app)

#### Run with LLM feedback enabled (FOLLOW THESE FOR THE HUMAN-AI INTERACTION FINAL PROJECT)

The browser harness expects `REACT_APP_OPENAI_API_KEY` (Create React App only exposes `REACT_APP_*` vars to browser code).

Option A (recommended for this repo): put your key in `src/llm-feedback/.env`:

```bash
REACT_APP_OPENAI_API_KEY=your_key_here
```

Then run:

```bash
npm run start:with-llm-env
```

Option B: set `REACT_APP_OPENAI_API_KEY` in your shell (or a CRA env file like `.env.local`) and run `npm start`.

#### LLM feedback walkthrough (Harness)

1. Start the app with LLM enabled (`npm run start:with-llm-env`).
2. Open [http://localhost:3000](http://localhost:3000).
3. Click the `Harness` button to open `ProofObjHarness`.
4. Click the `Show Editor` button (top-right) to open the proof selector/editor.
5. Use the proof dropdown to switch examples:
   - files with an `inc` suffix include an intentional mistake
   - files with an `incomplete` suffix are missing steps
6. LLM feedback appears for incorrect/incomplete proofs in the step feedback panel.

#### Run without LLM feedback

```bash
npm start
```

This starts the UI at [http://localhost:3000](http://localhost:3000).

### CLI proof checker

Run the checker on one proof file:

```bash
npm run checkProof -- src/checker/proofs/tutorial.txt
```

Run debug checker:

```bash
npm run debugProof -- src/checker/proofs/tutorial.txt
```

The CLI checker does not require OpenAI/LLM configuration.

### Common proof files

Proof samples live in `src/checker/proofs/` (for example: `tutorial.txt`, `tutinc.txt`, `s1c1.txt`, `s2c2.txt`).

## Contributing

1. Open a branch with the naming convention `<user-alias>/<description>` (i.e., `hharriman/render-points`)
2. Push your changes to your branch
3. Open a PR to `main`. The first word of your PR title should be one of:
   a. `feat:` A new feature is being added with this PR
   b. `fix:` A fix is implemented in this PR
   c. `chore:` Some utility/devops/upkeep is done
4. In the PR description provide a list of the changes that were made

## CRA Reference

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
