import { useEffect, useState } from "react";

export type Controls = { das: number; arr: number; sdf: number };
const defaults: Controls = { das: 67, arr: 10, sdf: 20 };

export function useControls() {
  const [controls,setControls] = useState(defaults);
  useEffect(() => {
    const raw = localStorage.getItem("chesstris-controls");
    if (raw) setControls({...defaults,...JSON.parse(raw)});
  },[]);
  useEffect(() => localStorage.setItem("chesstris-controls",JSON.stringify(controls)),[controls]);
  return [controls,setControls] as const;
}

export default function Settings({controls,setControls}:{
  controls:Controls;
  setControls:React.Dispatch<React.SetStateAction<Controls>>;
}) {
  return <details className="settings">
    <summary>⚙ Tetrio-style controls</summary>
    <div className="settings-grid">
      <label>DAS <span>{controls.das} ms</span>
        <input type="number" min="0" max="1000" value={controls.das}
          onChange={e=>setControls(c=>({...c,das:Number(e.target.value)}))}/>
      </label>
      <label>ARR <span>{controls.arr} ms</span>
        <input type="number" min="0" max="1000" value={controls.arr}
          onChange={e=>setControls(c=>({...c,arr:Number(e.target.value)}))}/>
      </label>
      <label>SDF <span>{controls.sdf === 0 ? "∞" : `${controls.sdf}×`}</span>
        <input type="number" min="0" max="100" value={controls.sdf}
          onChange={e=>setControls(c=>({...c,sdf:Number(e.target.value)}))}/>
      </label>
      <button onClick={()=>setControls(defaults)}>Reset</button>
    </div>
  </details>;
}
