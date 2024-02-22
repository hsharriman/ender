import { AngleBisector } from "./theorems/AngleBisector";
import { ParallelProp } from "./theorems/ParallelProp";

function App() {
  return (
    <div className="bg-neutral-900 w-screen h-full p-5">
      <div className="font-mono text-lg text-violet-300">🅔🅝🅓🅔🅡</div>
      {/* <AngleBisector /> */}
      <ParallelProp />
    </div>
  );
}

export default App;
