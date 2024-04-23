import { ParallelLongForm } from "./theorems/LongParallel";
import { InPlaceParallel } from "./theorems/InPlaceParallel";

function App() {
  return (
    <div className="w-screen h-screen">
      {/* <div className="font-mono text-lg text-violet-300">🅔🅝🅓🅔🅡</div> */}
      {/* <AngleBisector /> */}
      {/* <ParallelProp /> */}
      {/* {InPlaceParallel()} */}
      <ParallelLongForm />
    </div>
  );
}

export default App;
