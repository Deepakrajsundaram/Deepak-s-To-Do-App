const STORAGE_KEY="minimal-todo-tasks-v1";
const THEME_KEY="minimal-todo-theme";
const todayKey=key(new Date());

const defaultTasks=[
 {id:crypto.randomUUID(),name:"Finish ETL deployment",priority:"high",time:"5:00 PM",date:todayKey,done:false},
 {id:crypto.randomUUID(),name:"Review portfolio",priority:"medium",time:"7:00 PM",date:todayKey,done:false},
 {id:crypto.randomUUID(),name:"SQL practice",priority:"medium",time:"8:00 PM",date:todayKey,done:false},
 {id:crypto.randomUUID(),name:"Morning workout",priority:"low",time:"7:00 AM",date:todayKey,done:true}
];

let tasks=loadTasks();
let filter="all";
let selectedDate=todayKey;
let calendarDate=new Date();
let openSwipe=null;

function key(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function safeId(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`}
function esc(v){const d=document.createElement("div");d.textContent=v;return d.innerHTML}
function loadTasks(){
 try{
   const saved=localStorage.getItem(STORAGE_KEY);
   const data=saved?JSON.parse(saved):defaultTasks;
   return data.map(t=>({...t,id:t.id||safeId(),date:t.date||todayKey,priority:t.priority||"medium",done:Boolean(t.done)}));
 }catch{return defaultTasks}
}
function saveTasks(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks))}
function priorityLabel(p){return p.charAt(0).toUpperCase()+p.slice(1)}
function taskCard(t){
 const i=tasks.findIndex(x=>x.id===t.id);
 return `<div class="task-wrap">
   <button class="task-delete" data-delete="${t.id}"><span>⌫</span>Delete</button>
   <div class="task ${t.done?"done":""}" data-id="${t.id}" data-index="${i}">
     <button class="check">${t.done?"✓":""}</button>
     <div class="info"><div class="name">${esc(t.name)}</div><div class="meta"><span class="dot ${t.priority}"></span>${priorityLabel(t.priority)}</div></div>
     <div class="time">${esc(t.time||"")}</div>
   </div>
 </div>`;
}
function renderToday(){
 const d=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(new Date());
 document.getElementById("currentDate").textContent=d;
 const todays=tasks.filter(t=>t.date===todayKey);
 document.getElementById("todayList").innerHTML=todays.length?todays.map(taskCard).join(""):`<div class="empty">No tasks for today</div>`;
 const done=todays.filter(t=>t.done).length;
 document.getElementById("progressCount").textContent=`${done} / ${todays.length}`;
 document.getElementById("progressFill").style.width=todays.length?`${done/todays.length*100}%`:"0%";
 const overdueData=JSON.parse(localStorage.getItem("minimal-todo-overdue-v1")||"[]");
 document.getElementById("overdueList").innerHTML=overdueData.length?overdueData.map(t=>`<div class="task-wrap"><button class="task-delete" data-overdue="${t.id}"><span>⌫</span>Delete</button><div class="task"><div class="check"></div><div class="info"><div class="name">${esc(t.name)}</div><div class="meta"><span class="dot ${t.priority||"medium"}"></span>${priorityLabel(t.priority||"medium")}</div></div><div class="time overdue-time">${esc(t.time||"Overdue")}</div></div></div>`).join(""):`<div class="empty">Nothing overdue</div>`;
}
function renderTasks(){
 const q=document.getElementById("searchInput").value.trim().toLowerCase();
 const list=tasks.filter(t=>{
   if(filter==="active"&&t.done)return false;
   if(filter==="completed"&&!t.done)return false;
   return t.name.toLowerCase().includes(q);
 });
 document.getElementById("tasksList").innerHTML=list.length?list.map(taskCard).join(""):`<div class="empty">No matching tasks</div>`;
}
function renderCalendar(){
 const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
 document.getElementById("monthTitle").textContent=new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric"}).format(calendarDate);
 const first=new Date(y,m,1),start=first.getDay(),days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate();
 let html="";
 for(let i=0;i<42;i++){
   const n=i-start+1;
   let d,other=false;
   if(n<1){d=new Date(y,m-1,prevDays+n);other=true}else if(n>days){d=new Date(y,m+1,n-days);other=true}else d=new Date(y,m,n);
   const k=key(d),has=tasks.some(t=>t.date===k);
   html+=`<button class="day ${other?"other ":""}${k===todayKey?"today ":""}${k===selectedDate?"selected ":""}${has?"has-task":""}" data-date="${k}">${d.getDate()}</button>`;
 }
 document.getElementById("calendarGrid").innerHTML=html;
 document.querySelectorAll(".day").forEach(b=>b.onclick=()=>{selectedDate=b.dataset.date;renderCalendar();bindInteractions()});
 const selected=tasks.filter(t=>t.date===selectedDate);
 const d=new Date(selectedDate+"T12:00:00");
 document.getElementById("selectedDateTitle").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(d);
 document.getElementById("calendarList").innerHTML=selected.length?selected.map(taskCard).join(""):`<div class="empty">No tasks on this date</div>`;
}
function render(){renderToday();renderTasks();renderCalendar();bindInteractions()}
function bindInteractions(){
 document.querySelectorAll(".task[data-id]").forEach(el=>{
   el.onclick=e=>{
     if(e.target.closest(".task-delete"))return;
     const t=tasks.find(x=>x.id===el.dataset.id);
     if(t){t.done=!t.done;saveTasks();render()}
   };
 });
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=e=>{e.stopPropagation();deleteTask(b.dataset.delete)});
 document.querySelectorAll("[data-overdue]").forEach(b=>b.onclick=e=>{
   e.stopPropagation();
   let list=JSON.parse(localStorage.getItem("minimal-todo-overdue-v1")||"[]");
   list=list.filter(x=>x.id!==b.dataset.overdue);
   localStorage.setItem("minimal-todo-overdue-v1",JSON.stringify(list));
   render();toast("Task deleted");
 });
 bindSwipes();
}
function bindSwipes(){
 document.querySelectorAll(".task").forEach(task=>{
   let sx=0,sy=0,moved=false;
   task.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;moved=false},{passive:true});
   task.addEventListener("touchmove",e=>{
     const dx=e.touches[0].clientX-sx,dy=e.touches[0].clientY-sy;
     if(Math.abs(dy)>Math.abs(dx)+8){moved=false;return}
     if(dx<-10){moved=true;task.style.transform=`translateX(${Math.max(dx,-82)}px)`}
   },{passive:true});
   task.addEventListener("touchend",e=>{
     if(!moved){task.style.transform="";return}
     const dx=e.changedTouches[0].clientX-sx;
     task.style.transform=dx<-40?"translateX(-82px)":"translateX(0)";
   },{passive:true});
 });
}
function deleteTask(id){tasks=tasks.filter(t=>t.id!==id);saveTasks();render();toast("Task deleted")}
function switchView(id){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 document.getElementById(id).classList.add("active");
 document.querySelectorAll(".nav-button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
}
function open(id){document.getElementById(id).classList.add("open")}
function close(id){document.getElementById(id).classList.remove("open")}
function addTask(){
 const input=document.getElementById("taskInput"),name=input.value.trim();
 if(!name)return;
 tasks.unshift({id:safeId(),name,priority:"medium",time:"Today",date:todayKey,done:false});
 saveTasks();input.value="";close("taskSheet");render();toast("Task added");
}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400)}
function setDark(dark){
 document.body.classList.toggle("dark",dark);
 localStorage.setItem(THEME_KEY,dark?"dark":"light");
 document.getElementById("darkToggle").classList.toggle("on",dark);
 document.getElementById("themeColor").content=dark?"#111216":"#f7f7fa";
}

document.querySelectorAll(".nav-button").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTasks();bindInteractions()});
document.getElementById("searchInput").oninput=renderTasks;
document.getElementById("addButton").onclick=()=>open("taskSheet");
document.getElementById("saveTask").onclick=addTask;
document.getElementById("taskInput").onkeydown=e=>{if(e.key==="Enter")addTask()};
document.getElementById("menuButton").onclick=()=>open("menuSheet");
document.getElementById("settingsButton").onclick=()=>open("settingsSheet");
document.getElementById("menuSettings").onclick=()=>{close("menuSheet");open("settingsSheet")};
document.getElementById("closeMenu").onclick=()=>close("menuSheet");
document.getElementById("closeSettings").onclick=()=>close("settingsSheet");
document.getElementById("clearCompleted").onclick=()=>{
 const before=tasks.length;tasks=tasks.filter(t=>!t.done);saveTasks();close("menuSheet");render();toast(before===tasks.length?"No completed tasks":"Completed tasks cleared")
};
document.getElementById("darkToggle").onclick=()=>setDark(!document.body.classList.contains("dark"));
document.getElementById("prevMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();bindInteractions()};
document.getElementById("nextMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();bindInteractions()};
["taskSheet","menuSheet","settingsSheet"].forEach(id=>document.getElementById(id).onclick=e=>{if(e.target.id===id)close(id)});

setDark(localStorage.getItem(THEME_KEY)==="dark");
render();
