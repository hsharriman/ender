import { ParallelLongForm } from "./theorems/complete/proof1/LongParallel";
import { InPlaceParallel } from "./theorems/complete/proof1/InPlaceParallel";
import { InPlaceProof2 } from "./theorems/complete/proof2/InPlaceProof2";
import { Proof2Long } from "./theorems/complete/proof2/LongProof2";

function App() {
  return (
    <div className="w-screen h-screen">
      {/* <div className="font-mono text-lg text-violet-300">🅔🅝🅓🅔🅡</div> */}
      {/* <AngleBisector /> */}
      {/* <ParallelProp /> */}
      {/* {InPlaceParallel()} */}
      {/* <ParallelLongForm /> */}
      <InPlaceProof2 />
      {/* <Proof2Long /> */}
    </div>
  );
}

export default App;
