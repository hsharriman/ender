import { Canvas } from './components/Canvas';
import Card from './components/Card';

function App() {
  return (
    <div className="bg-black w-screen h-screen p-5">
      <div className="font-mono text-lg text-slate-200">
        Ender
      </div>
      <Card idx={1} text={"Card test"}/>
    </div>
  );
}

export default App;
