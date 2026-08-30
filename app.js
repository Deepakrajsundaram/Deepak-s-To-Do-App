const APP_VERSION="1.8";
(function ensureLatestVersion(){
  try{
    const params=new URLSearchParams(location.search);
    const refreshed=params.get("app_refresh")==="1";
    const loaded=localStorage.getItem("minimal-todo-app-version");
    if(loaded && loaded!==APP_VERSION && !refreshed){
      localStorage.setItem("minimal-todo-app-version",APP_VERSION);
      params.set("app_refresh","1");
      params.set("v",APP_VERSION);
      location.replace(location.pathname+"?"+params.toString()+location.hash);
      return;
    }
    localStorage.setItem("minimal-todo-app-version",APP_VERSION);
  }catch(e){}
})();
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
let editingTaskId=null;
let newTaskDate=todayKey, newTaskPriority="medium", newTaskTime="";

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
function dateLabel(k){
 const d=new Date(k+"T12:00:00");
 if(k===todayKey)return "Today";
 const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
 if(k===key(tomorrow))return "Tomorrow";
 return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short"}).format(d);
}
function taskCard(t){
 const i=tasks.findIndex(x=>x.id===t.id);
 return `<div class="task-wrap">
   <button class="task-delete" data-delete="${t.id}"><span>⌫</span>Delete</button>
   <div class="task ${t.done?"done":""}" data-id="${t.id}" data-index="${i}">
     <button class="check">${t.done?"✓":""}</button>
     <div class="info"><div class="name">${esc(t.name)}</div><div class="meta"><span class="dot ${t.priority}"></span>${priorityLabel(t.priority)}<span>·</span><span>${dateLabel(t.date)}</span></div></div>
     ${t.time?`<div class="time">${esc(t.time)}</div>`:""}
   </div>
 </div>`;
}
function taskTimeMinutes(t){
 if(!t.time)return Number.POSITIVE_INFINITY;
 const m=t.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
 if(!m)return Number.POSITIVE_INFINITY;
 let h=Number(m[1]); const min=Number(m[2]);
 if(m[3].toUpperCase()==="PM"&&h<12)h+=12;
 if(m[3].toUpperCase()==="AM"&&h===12)h=0;
 return h*60+min;
}
function priorityRank(p){return p==="high"?0:p==="medium"?1:2}
function sortTasks(list){
 return [...list].sort((a,b)=>{
   if(a.done!==b.done)return a.done?1:-1;
   const pr=priorityRank(a.priority)-priorityRank(b.priority);
   if(pr!==0)return pr;
   const tm=taskTimeMinutes(a)-taskTimeMinutes(b);
   if(tm!==0)return tm;
   return a.name.localeCompare(b.name);
 });
}
function renderToday(){
 const d=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(new Date());
 document.getElementById("currentDate").textContent=d;
 const todays=sortTasks(tasks.filter(t=>t.date===todayKey));
 document.getElementById("todayList").innerHTML=todays.length?todays.map(taskCard).join(""):`<div class="empty">No tasks for today</div>`;
 const done=todays.filter(t=>t.done).length;
 document.getElementById("progressCount").textContent=`${done} / ${todays.length}`;
 document.getElementById("progressFill").style.width=todays.length?`${done/todays.length*100}%`:"0%";
 const overdueData=JSON.parse(localStorage.getItem("minimal-todo-overdue-v1")||"[]");
 document.getElementById("overdueList").innerHTML=overdueData.length?overdueData.map(t=>`<div class="task-wrap"><button class="task-delete" data-overdue="${t.id}"><span>⌫</span>Delete</button><div class="task"><div class="check"></div><div class="info"><div class="name">${esc(t.name)}</div><div class="meta"><span class="dot ${t.priority||"medium"}"></span>${priorityLabel(t.priority||"medium")}</div></div><div class="time overdue-time">${esc(t.time||"Overdue")}</div></div></div>`).join(""):`<div class="empty">Nothing overdue</div>`;
}
function renderTasks(){
 const q=document.getElementById("searchInput").value.trim().toLowerCase();
 const list=sortTasks(tasks.filter(t=>{
   if(filter==="active"&&t.done)return false;
   if(filter==="completed"&&!t.done)return false;
   return t.name.toLowerCase().includes(q);
 }));
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
 const selected=sortTasks(tasks.filter(t=>t.date===selectedDate));
 const d=new Date(selectedDate+"T12:00:00");
 document.getElementById("selectedDateTitle").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(d);
 document.getElementById("calendarList").innerHTML=selected.length?selected.map(taskCard).join(""):`<div class="empty">No tasks on this date</div>`;
}
function render(){renderToday();renderTasks();renderCalendar();bindInteractions()}
function bindInteractions(){
 document.querySelectorAll(".task[data-id]").forEach(el=>{
   el.onclick=e=>{
     if(e.target.closest(".check")) return;
     if(e.target.closest(".task-delete")) return;
     openEdit(el.dataset.id);
   };
   el.querySelector(".check").onclick=e=>{
     e.stopPropagation();
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
function openEdit(id){const t=tasks.find(x=>x.id===id);if(!t)return;editingTaskId=id;editTaskInput.value=t.name;editTaskDate.value=t.date||todayKey;editTaskTime.value=timeToInput(t.time);editTaskPriority.value=t.priority||"medium";open("editSheet");setTimeout(()=>editTaskInput.focus(),100)}
function timeToInput(v){if(!v||v==="Today")return "";const m=v.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);if(!m)return "";let h=+m[1];if(m[3].toUpperCase()==="PM"&&h<12)h+=12;if(m[3].toUpperCase()==="AM"&&h===12)h=0;return `${String(h).padStart(2,"0")}:${m[2]}`}
function inputToTime(v){if(!v)return "";let [h,m]=v.split(":").map(Number);const ap=h>=12?"PM":"AM";h=h%12||12;return `${h}:${String(m).padStart(2,"0")} ${ap}`}
function updateTask(){const t=tasks.find(x=>x.id===editingTaskId),name=editTaskInput.value.trim();if(!t||!name)return;t.name=name;t.date=editTaskDate.value||todayKey;t.time=inputToTime(editTaskTime.value);t.priority=editTaskPriority.value;saveTasks();close("editSheet");editingTaskId=null;render();toast("Task updated")}
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
 tasks.unshift({id:safeId(),name,priority:newTaskPriority,time:newTaskTime,date:newTaskDate,done:false});
 saveTasks();input.value="";newTaskDate=todayKey;newTaskPriority="medium";newTaskTime="";
document.querySelectorAll("[data-date-choice]").forEach(x=>x.classList.toggle("active",x.dataset.dateChoice==="today"));
document.querySelectorAll("[data-priority]").forEach(x=>x.classList.toggle("active",x.dataset.priority==="medium"));
document.querySelectorAll("[data-time-choice]").forEach(x=>x.classList.toggle("active",x.dataset.timeChoice==="none"));
document.getElementById("newTaskDate").classList.add("hidden-input");document.getElementById("newTaskTime").classList.add("hidden-input");
close("taskSheet");render();toast("Task added");
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
document.getElementById("updateTask").onclick=updateTask;
document.getElementById("cancelEdit").onclick=()=>{close("editSheet");editingTaskId=null};
document.getElementById("taskInput").onkeydown=e=>{if(e.key==="Enter")addTask()};
document.querySelectorAll("[data-date-choice]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-date-choice]").forEach(x=>x.classList.toggle("active",x===b));
  if(b.dataset.dateChoice==="today"){newTaskDate=todayKey;newTaskDate.value="";}
  else if(b.dataset.dateChoice==="tomorrow"){const d=new Date();d.setDate(d.getDate()+1);newTaskDate=key(d)}
  else {document.getElementById("newTaskDate").classList.remove("hidden-input");document.getElementById("newTaskDate").focus();return}
  document.getElementById("newTaskDate").classList.add("hidden-input");
});
document.getElementById("newTaskDate").onchange=e=>{if(e.target.value)newTaskDate=e.target.value};
document.querySelectorAll("[data-priority]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-priority]").forEach(x=>x.classList.toggle("active",x===b));
  newTaskPriority=b.dataset.priority;
});
document.querySelectorAll("[data-time-choice]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-time-choice]").forEach(x=>x.classList.toggle("active",x===b));
  if(b.dataset.timeChoice==="pick"){document.getElementById("newTaskTime").classList.remove("hidden-input");document.getElementById("newTaskTime").focus()}
  else {newTaskTime="";document.getElementById("newTaskTime").classList.add("hidden-input")}
});
document.getElementById("newTaskTime").onchange=e=>{newTaskTime=inputToTime(e.target.value)};
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
["taskSheet","editSheet","menuSheet","settingsSheet"].forEach(id=>document.getElementById(id).onclick=e=>{if(e.target.id===id)close(id)});

setDark(localStorage.getItem(THEME_KEY)==="dark");
render();
