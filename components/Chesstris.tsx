"use client";

import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import QueuePreview from "./QueuePreview";
import Settings,{useControls} from "./Settings";
import { hardDrop,move,rotate,spawn } from "../lib/game";
import type { Piece,PlayerId,RoomState } from "../lib/types";

const PLAYER_KEY="chesstris-player";
function getToken(){
  let t=localStorage.getItem(PLAYER_KEY);
  if(!t){t=crypto.randomUUID();localStorage.setItem(PLAYER_KEY,t);}
  return t;
}

export default function Chesstris(){
  const [controls,setControls]=useControls();
  const [code,setCode]=useState("");
  const [room,setRoom]=useState<RoomState|null>(null);
  const [pid,setPid]=useState<PlayerId|null>(null);
  const [piece,setPiece]=useState<Piece|null>(null);
  const [message,setMessage]=useState("Create a room or join one.");
  const [busy,setBusy]=useState(false);
  const repeat=useRef<Record<string,{timeout?:number;interval?:number}>>({});
  const current=useRef({controls,piece,me:null as RoomState["playerState"]["p1"] | null,myTurn:false,busy:false});
  const lockAction=useRef<() => void>(()=>{});

  const me=pid&&room?room.playerState[pid]:null;
  const myTurn=!!pid&&!!room&&room.turn===pid&&room.started&&!room.winner;
  current.current={controls,piece,me,myTurn,busy};

  useEffect(()=>{
    if(!room)return;
    const id=setInterval(async()=>{
      try{
        const r=await fetch(`/api/rooms/${room.code}`,{cache:"no-store"});
        if(r.ok)setRoom(await r.json());
      }catch{}
    },700);
    return()=>clearInterval(id);
  },[room?.code]);

  useEffect(()=>{
    if(myTurn&&me&&(!piece||piece.type!==me.queue[0]))setPiece(spawn(me.queue[0]));
    if(!myTurn)setPiece(null);
  },[myTurn,me?.queue?.[0],room?.updatedAt]);

  async function create(){
    setBusy(true);
    try{
      const r=await fetch("/api/rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId:getToken()})});
      const d=await r.json(); if(!r.ok)throw Error(d.error);
      setCode(d.code);setPid("p1");setRoom(d.state);setMessage(`Room ${d.code} created.`);
    }catch(e){setMessage(String(e));}finally{setBusy(false);}
  }

  async function join(){
    const c=code.trim().toUpperCase();
    if(!/^[A-Z0-9]{6}$/.test(c)){
      setMessage("Enter a 6-character room code.");
      return;
    }
    setBusy(true);
    try{
      const r=await fetch(`/api/rooms/${c}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"join",token:getToken()})});
      const d=await r.json();if(!r.ok)throw Error(d.error);
      setCode(c);setPid("p2");setRoom(d);setMessage("Joined. Player 1 starts.");
    }catch(e){setMessage(String(e));}finally{setBusy(false);}
  }

  function apply(dx:number,dy:number){
    if(!piece||!me||!myTurn)return;
    const n=move(me.board,piece,dx,dy);if(n)setPiece(n);
  }

  function moveCurrent(dx:number,dy:number,steps=1){
    const state=current.current;
    if(!state.myTurn||!state.me)return;
    setPiece(active=>{
      if(!active)return active;
      let next:Piece|null=active;
      for(let i=0;i<steps&&next;i++)next=move(state.me!.board,next,dx,dy);
      return next??active;
    });
  }

  function dropCurrent(){
    const state=current.current;
    if(!state.myTurn||!state.me)return;
    setPiece(active=>active?hardDrop(state.me!.board,active):active);
  }

  function spin(dir:1|-1){
    if(!piece||!me||!myTurn)return;
    const n=rotate(me.board,piece,dir);if(n)setPiece(n);
  }

  function spinCurrent(dir:1|-1){
    const state=current.current;
    if(!state.myTurn||!state.me)return;
    setPiece(active=>active?(rotate(state.me!.board,active,dir)??active):active);
  }

  function stopRepeat(key:string){
    const timers=repeat.current[key];
    if(!timers)return;
    if(timers.timeout!==undefined)clearTimeout(timers.timeout);
    if(timers.interval!==undefined)clearInterval(timers.interval);
    delete repeat.current[key];
  }

  function clearRepeats(){
    Object.keys(repeat.current).forEach(stopRepeat);
  }

  function startRepeat(key:string,fn:()=>void,dx=0){
    if(repeat.current[key])return;
    fn();
    const timers:{timeout?:number;interval?:number}={};
    repeat.current[key]=timers;
    timers.timeout=window.setTimeout(()=>{
      if(repeat.current[key]!==timers)return;
      if(key!=="down"&&current.current.controls.arr===0){
        moveCurrent(dx,0,10);
        return;
      }
      if(key==="down"&&current.current.controls.sdf===0){
        dropCurrent();
        return;
      }
      timers.interval=window.setInterval(()=>{
        if(key==="down"){
          moveCurrent(0,1,Math.max(1,Math.round(current.current.controls.sdf)));
        }else{
          moveCurrent(dx,0);
        }
      },Math.max(1,current.current.controls.arr));
    },Math.max(0,current.current.controls.das));
  }

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLElement&&(
        e.target.isContentEditable||
        e.target instanceof HTMLInputElement||
        e.target instanceof HTMLTextAreaElement||
        e.target instanceof HTMLButtonElement
      ))return;
      if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp","z","Z","x","X"," "].includes(e.key))e.preventDefault();
      if(!current.current.myTurn)return;
      if(e.key==="ArrowLeft")startRepeat("left",()=>moveCurrent(-1,0),-1);
      if(e.key==="ArrowRight")startRepeat("right",()=>moveCurrent(1,0),1);
      if(e.key==="ArrowDown")startRepeat("down",()=>moveCurrent(0,1));
      if(e.repeat)return;
      if(e.key==="ArrowUp"||e.key==="x"||e.key==="X")spinCurrent(1);
      if(e.key==="z"||e.key==="Z")spinCurrent(-1);
      if(e.key===" ")lockAction.current();
    };
    const up=(e:KeyboardEvent)=>{
      if(e.key==="ArrowLeft")stopRepeat("left");
      if(e.key==="ArrowRight")stopRepeat("right");
      if(e.key==="ArrowDown")stopRepeat("down");
    };
    addEventListener("keydown",down);addEventListener("keyup",up);
    addEventListener("blur",clearRepeats);
    return()=>{removeEventListener("keydown",down);removeEventListener("keyup",up);removeEventListener("blur",clearRepeats);clearRepeats();};
  },[]);

  async function lock(){
    if(!piece||!me||!pid||!room||!myTurn||busy)return;
    const final=hardDrop(me.board,piece);
    setBusy(true);
    try{
      const r=await fetch(`/api/rooms/${room.code}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"place",playerId:pid,token:getToken(),piece:final})});
      const d=await r.json();if(!r.ok)throw Error(d.error);
      setRoom(d);setPiece(null);
      setMessage(d.winner?`Player ${d.winner==="p1"?"1":"2"} wins.`:`Player ${d.turn==="p1"?"1":"2"}'s turn.`);
    }catch(e){setMessage(String(e));}finally{setBusy(false);}
  }
  lockAction.current=lock;

  if(!room)return <main className="shell">
    <header><div><div className="eyebrow">TURN BASED TETRIS × MODERN RULES</div><h1>CHESSTRIS</h1><p>Modern tetris based upon strategy!</p></div><Settings controls={controls} setControls={setControls}/></header>
    <section className="lobby card">
      <h2>Online room</h2><p>Vercel hosts the app/API; Upstash Redis stores room state.</p>
      <div className="lobby-row"><button className="primary" disabled={busy} onClick={create}>Create room</button>
      <input maxLength={6} placeholder="ROOM CODE" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <button disabled={busy} onClick={join}>Join room</button></div>
      <p className="status">{message}</p>
    </section>
  </main>;

  return <main className="shell">
    <header><div><div className="eyebrow">ONLINE MATCH · {room.code}</div><h1>CHESSTRIS</h1><p>Turn-based Tetris with Tetrio-style movement settings.</p></div><Settings controls={controls} setControls={setControls}/></header>
    <section className="topbar card">
      <div><span>YOU</span><strong>PLAYER {pid==="p1"?"1":"2"}</strong></div>
      <div><span>TURN</span><strong>{room.winner?`PLAYER ${room.winner==="p1"?"1":"2"}`:`PLAYER ${room.turn==="p1"?"1":"2"}`}</strong></div>
      <div><span>P1</span><strong>{room.playerState.p1.score.toLocaleString()} · {room.playerState.p1.lines}L</strong></div>
      <div><span>P2</span><strong>{room.playerState.p2.score.toLocaleString()} · {room.playerState.p2.lines}L</strong></div>
    </section>
    <section className="boards">
      <div className={`player-panel ${room.turn==="p1"?"active-turn":""}`}>
        <div className="player-head"><span>{pid==="p1"?"YOU · PLAYER 1":"OPPONENT · PLAYER 1"}</span><span>{room.playerState.p1.pieces} placements</span></div>
        <Board board={room.playerState.p1.board} active={pid==="p1"?piece??undefined:undefined} showGhost={pid==="p1"&&myTurn}/>
        {pid==="p1"&&<QueuePreview label="YOUR NEXT" pieces={room.playerState.p1.queue}/>}
        {pid==="p2"&&<QueuePreview label="OPPONENT NEXT" pieces={room.playerState.p1.queue}/>}
      </div>
      <div className="center card">
        <div className="turn">{room.winner?`PLAYER ${room.winner==="p1"?"1":"2"} WINS`:myTurn?"YOUR TURN":"OPPONENT'S TURN"}</div>
        <button className="primary lock" disabled={!myTurn||busy} onClick={lock}>LOCK PIECE <kbd>SPACE</kbd></button>
        <div className="controls"><button onClick={()=>apply(-1,0)} disabled={!myTurn}>←</button><button onClick={()=>spin(-1)} disabled={!myTurn}>↺</button><button onClick={()=>apply(0,1)} disabled={!myTurn}>↓</button><button onClick={()=>spin(1)} disabled={!myTurn}>↻</button><button onClick={()=>apply(1,0)} disabled={!myTurn}>→</button></div>
        <p className="status">{message}</p>
      </div>
      <div className={`player-panel ${room.turn==="p2"?"active-turn":""}`}>
        <div className="player-head"><span>{pid==="p2"?"YOU · PLAYER 2":"OPPONENT · PLAYER 2"}</span><span>{room.playerState.p2.pieces} placements</span></div>
        <Board board={room.playerState.p2.board} active={pid==="p2"?piece??undefined:undefined} showGhost={pid==="p2"&&myTurn}/>
        {pid==="p2"&&<QueuePreview label="YOUR NEXT" pieces={room.playerState.p2.queue}/>}
        {pid==="p1"&&<QueuePreview label="OPPONENT NEXT" pieces={room.playerState.p2.queue}/>}
      </div>
    </section>
    <footer className="card help"><span><kbd>← →</kbd> move</span><span><kbd>↑</kbd>/<kbd>X</kbd> rotate</span><span><kbd>Z</kbd> CCW</span><span><kbd>↓</kbd> SDF</span><span><kbd>SPACE</kbd> place</span><span>7-bag · SRS · garbage</span></footer>
  </main>;
}
