const STORAGE_KEY="minimal-todo-tasks-v1";
const defaults=[
{name:"Finish ETL deployment",priority:"high",time:"5:00 PM",done:false},
{name:"Review portfolio",priority:"medium",time:"7:00 PM",done:false},
{name:"SQL practice",priority:"medium",time:"8:00 PM",done:false},
{name:"Morning workout",priority:"low",time:"7:00 AM",done:true}
];
const overdue=[
{name:"Submit expense report",priority:"high",time:"2 days ago"},
{name:"Reply to client email",priority:"1 day ago"}
];
let tasks=load();
function load(){try{const x=localStorage.getItem(STORAGE_KEY);return x?JSON.parse(x):defaults}catch{return defaults}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks))}
function esc(v){const d=document.createElement("div");d.textContent=v;return d.innerHTML}
function card(t,i){return `<div class="task ${t.done?"done":""}" data-i="${i}"><button class="check">${t.done?"✓":""}</button><div class="info"><div class="name">${esc(t.name)}</div><div class="meta"><span class="dot ${t.priority}"></span>${t.priority[0].toUpperCase()+t.priority.slice(1)}</div></div><div class="time">${esc(t.time)}</div></div>`}
function render(){
document.getElementById("currentDate").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(new Date());
document.getElementById("today").innerHTML=tasks.map(card).join("");
document.getElementById("overdue").innerHTML=overdue.map(t=>`<div class="task"><div class="check"></div><div class="info"><div class="name">${esc(t.name)}</div><div class="meta"><span class="dot ${t.priority}"></span>${t.priority[0].toUpperCase()+t.priority.slice(1)}</div></div><div class="time">${esc(t.time)}</div></div>`).join("");
const done=tasks.filter(t=>t.done).length,total=tasks.length;
document.getElementById("progressCount").textContent=`${done} / ${total}`;
document.getElementById("progressFill").style.width=total?`${done/total*100}%`:"0%";
document.querySelectorAll("#today .task").forEach(el=>el.onclick=()=>{tasks[Number(el.dataset.i)].done=!tasks[Number(el.dataset.i)].done;save();render()});
}
function openSheet(){document.getElementById("sheet").classList.add("open");setTimeout(()=>document.getElementById("taskInput").focus(),50)}
function closeSheet(){document.getElementById("sheet").classList.remove("open")}
function add(){const input=document.getElementById("taskInput"),name=input.value.trim();if(!name)return;tasks.unshift({name,priority:"medium",time:"Today",done:false});save();input.value="";closeSheet();render()}
document.getElementById("addButton").onclick=openSheet;
document.getElementById("saveTask").onclick=add;
document.getElementById("taskInput").onkeydown=e=>{if(e.key==="Enter")add()};
document.getElementById("sheet").onclick=e=>{if(e.target.id==="sheet")closeSheet()};
render();
