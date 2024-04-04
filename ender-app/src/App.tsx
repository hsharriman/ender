import { ParallelV2 } from "./theorems/Parallelv2";

function App() {
  return (
    <div className="bg-neutral-900 w-screen h-full p-5">
      <div className="font-mono text-lg text-violet-300">🅔🅝🅓🅔🅡</div>
      {/* <AngleBisector /> */}
      {/* <ParallelProp /> */}
      {ParallelV2()}
    </div>
  );
}

export default App;
