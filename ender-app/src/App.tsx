import { ParallelLongForm } from "./theorems/complete/proof1/LongParallel";
import { InPlaceParallel } from "./theorems/complete/proof1/InPlaceParallel";
import { InPlaceProof2 } from "./theorems/complete/proof2/InPlaceProof2";
import { Proof2Long } from "./theorems/complete/proof2/LongProof2";
import { InPlaceP1 } from "./theorems/checking/p1/InPlaceP1";

function App() {
  return (
    <div className="w-screen h-screen">
      {/* {InPlaceParallel()} */}
      <ParallelLongForm />
      {/* <InPlaceProof2 /> */}
      {/* <Proof2Long /> */}
      {/* <InPlaceP1 /> */}
    </div>
  );
}

export default App;
