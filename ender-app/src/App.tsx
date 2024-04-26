import { Check1 } from "./theorems/checking/p1/Check1";
import { Complete1 } from "./theorems/complete/proof1/Complete1";
import { Complete2 } from "./theorems/complete/proof2/Complete2";

function App() {
  return (
    <div className="w-screen h-screen">
      {/* {new Check1().inPlace()} */}
      {new Check1().longForm()}
      {/* {new Complete1().inPlace()} */}
      {/* {new Complete1().longForm()} */}
      {/* {new Complete2().inPlace()} */}
      {/* {new Complete2().longForm()} */}
    </div>
  );
}

export default App;
