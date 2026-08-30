const STORAGE_KEY="minimal-todo-tasks-v1";
const THEME_KEY="minimal-todo-theme";
const todayKey=toKey(new Date());

const defaults=[
{name:"Finish ETL deployment",priority:"high",time:"5:00 PM",date:todayKey,done:false},
{name:"Review portfolio",priority:"medium",time:"7:00 PM",date:todayKey,done:false},
{name:"SQL practice",priority:"medium",time:"8:00 PM",date:todayKey,done:false},
{name:"Morning workout",priority:"low",time:"7:00 AM",date:todayKey,done:true}
];

const overdue=[
{name:"Submit expense report",priority:"high",time:"2 days ago"},
{name:"Reply to client email",priority:"medium",time:"1 day ago"}
];

let tasks=loadTasks();
let currentFilter="all";
let selectedDate=todayKey;
let calendarDate=new Date();

function toKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}

function loadTheme(){
  const dark=localStorage.getItem(THEME_KEY)==="dark";
  document.body.classList.toggle("dark",dark);
  document.getElementById("darkToggle")?.classList.toggle("on",dark);
}
function setDarkMode(dark){
  document.body.classList.toggle("dark",dark);
  localStorage.setItem(THEME_KEY,dark?"dark":"light");
  document.getElementById("darkToggle").classList.toggle("on",dark);
}

function loadTasks(){
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    const parsed=saved?JSON.parse(saved):defaults;
    return parsed.map(t=>({...t,date:t.date||todayKey,id:t.id||crypto.randomUUID()}));
  }catch{return defaults.map(t=>({...t,id:crypto.randomUUID()}))}
}
function saveTasks(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks))}
function esc(v){const d=document.createElement("div");d.textContent=v;return d.innerHTML}
function priorityLabel(p){return p.charAt(0).toUpperCase()+p.slice(1)}

function taskCard(task,index,allowDelete=true){
  return `<div class="task-wrap">
    ${allowDelete?`<button class="task-delete" data-delete="${task.id}"><span>⌫</span>Delete</button>`:""}
    <div class="task ${task.done?"done":""}" data-index="${index}">
      <button class="check">${task.done?"✓":""}</button>
      <div class="info"><div class="name">${esc(task.name)}</div>
        <div class="meta"><span class="dot ${task.priority}"></span>${priorityLabel(task.priority)}</div>
      </div>
      <div class="time">${esc(task.time||"")}</div>
    </div>
  </div>`
}

function overdueCard(task){
  return `<div class="task-wrap">
    <button class="task-delete" data-overdue="${task.id}"><span>⌫</span>Delete</button>
    <div class="task">
      <div class="check"></div><div class="info"><div class="name">${esc(task.name)}</div>
      <div class="meta"><span class="dot ${task.priority}"></span>${priorityLabel(task.priority)}</div></div>
      <div class="time overdue-time">${esc(task.time)}</div>
    </div>
  </div>`
}

function bindSwipe(){
  document.querySelectorAll(".task-wrap").forEach(wrap=>{
    const task=wrap.querySelector(".task");
    if(!task)return;
    let startX=0,startY=0,dragging=false;
    task.addEventListener("touchstart",e=>{
      startX=e.touches[0].clientX;startY=e.touches[0].clientY;dragging=true;
    },{passive:true});
    task.addEventListener("touchmove",e=>{
      if(!dragging)return;
      const dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;
      if(Math.abs(dy)>Math.abs(dx)+8){dragging=false;return}
      if(dx<-15)task.style.transform=`translateX(${Math.max(dx,-82)}px)`;
    },{passive:true});
    task.addEventListener("touchend",e=>{
      if(!dragging)return;
      const dx=e.changedTouches[0].clientX-startX;
      task.style.transform=dx<-40?"translateX(-82px)":"translateX(0)";
      dragging=false;
    });
  });
}

function bindDeleteButtons(){
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    deleteTask(btn.dataset.delete);
  });
  document.querySelectorAll("[data-overdue]").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const i=overdue.findIndex(x=>x.id===btn.dataset.overdue);
    if(i>=0){overdue.splice(i,1);render();toast("Task deleted")}
  });
}

function deleteTask(id){
  tasks=tasks.filter(t=>t.id!==id);
  saveTasks();render();toast("Task deleted");
}

function toggleTask(index){
  tasks[index].done=!tasks[index].done;
  saveTasks();render();
}

function renderToday(){
  document.getElementById("currentDate").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(new Date());
  const todays=tasks.filter(t=>t.date===todayKey);
  document.getElementById("today").innerHTML=todays.length?todays.map(t=>taskCard(t,tasks.indexOf(t))).join(""):`<div class="empty">No tasks for today</div>`;
  document.getElementById("overdue").innerHTML=overdue.length?overdue.map(overdueCard).join(""):`<div class="empty">Nothing overdue</div>`;
  const done=todays.filter(t=>t.done).length,total=todays.length;
  document.getElementById("progressCount").textContent=`${done} / ${total}`;
  document.getElementById("progressFill").style.width=total?`${done/total*100}%`:"0%";
}

function renderTasks(){
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  let filtered=tasks.filter(t=>{
    if(currentFilter==="active"&&t.done)return false;
    if(currentFilter==="completed"&&!t.done)return false;
    return t.name.toLowerCase().includes(q);
  });
  document.getElementById("allTasks").innerHTML=filtered.length?
    filtered.map(t=>taskCard(t,tasks.indexOf(t))).join(""):`<div class="empty">No matching tasks</div>`;
}

function renderCalendar(){
  const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
  document.getElementById("monthTitle").textContent=new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric"}).format(calendarDate);
  const first=new Date(y,m,1),start=first.getDay(),days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate();
  let html="";
  for(let i=0;i<42;i++){
    const dayNum=i-start+1;
    let d,other=false;
    if(dayNum<1){d=new Date(y,m-1,prevDays+dayNum);other=true}
    else if(dayNum>days){d=new Date(y,m+1,dayNum-days);other=true}
    else d=new Date(y,m,dayNum);
    const key=toKey(d),has=tasks.some(t=>t.date===key);
    html+=`<button class="day ${other?"other ":""}${key===todayKey?"today ":""}${key===selectedDate?"selected ":""}${has?"has-task":""}" data-date="${key}">${d.getDate()}</button>`;
  }
  document.getElementById("calendarGrid").innerHTML=html;
  document.querySelectorAll(".day").forEach(b=>b.onclick=()=>{selectedDate=b.dataset.date;renderCalendar()});
  const selectedTasks=tasks.filter(t=>t.date===selectedDate);
  const dt=new Date(selectedDate+"T12:00:00");
  document.getElementById("selectedDateTitle").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long",month:"short",day:"numeric"}).format(dt);
  document.getElementById("calendarTasks").innerHTML=selectedTasks.length?selectedTasks.map(t=>taskCard(t,tasks.indexOf(t))).join(""):`<div class="empty">No tasks on this date</div>`;
}

function render(){
  renderToday();renderTasks();renderCalendar();
  bindSwipe();bindDeleteButtons();bindTaskClicks();
}

function bindTaskClicks(){
  document.querySelectorAll(".task[data-index]").forEach(el=>{
    el.addEventListener("click",e=>{
      if(e.target.closest(".task-delete"))return;
      const index=Number(el.dataset.index);
      toggleTask(index);
    });
  });
}

function switchView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));
  document.getElementById(id).classList.add("active-view");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  window.scrollTo(0,0);
}

function openSheet(){document.getElementById("sheet").classList.add("open");setTimeout(()=>document.getElementById("taskInput").focus(),50)}
function closeSheet(){document.getElementById("sheet").classList.remove("open")}

function addTask(){
  const input=document.getElementById("taskInput"),name=input.value.trim();
  if(!name)return;
  tasks.unshift({id:crypto.randomUUID(),name,priority:"medium",time:"Today",date:todayKey,done:false});
  saveTasks();input.value="";closeSheet();render();toast("Task added");
}

function toast(message){
  const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1500);
}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{
  currentFilter=b.dataset.filter;
  document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));
  renderTasks();bindSwipe();bindDeleteButtons();bindTaskClicks();
});
document.getElementById("searchInput").oninput=renderTasks;
document.getElementById("addButton").onclick=openSheet;
document.getElementById("saveTask").onclick=addTask;
document.getElementById("taskInput").onkeydown=e=>{if(e.key==="Enter")addTask()};
document.getElementById("sheet").onclick=e=>{if(e.target.id==="sheet")closeSheet()};
document.getElementById("prevMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();bindSwipe();bindDeleteButtons();bindTaskClicks()};
document.getElementById("nextMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();bindSwipe();bindDeleteButtons();bindTaskClicks()};

render();

// Header actions
const headerButtons=document.querySelectorAll(".top .icon");
headerButtons[0].onclick=()=>document.getElementById("menuSheet").classList.add("open");
headerButtons[1].onclick=()=>document.getElementById("settingsSheet").classList.add("open");

document.getElementById("darkToggle").onclick=()=>{
  setDarkMode(!document.body.classList.contains("dark"));
};

document.getElementById("closeSettings").onclick=()=>{
  document.getElementById("settingsSheet").classList.remove("open");
};
document.getElementById("closeMenu").onclick=()=>{
  document.getElementById("menuSheet").classList.remove("open");
};
document.getElementById("menuSettings").onclick=()=>{
  document.getElementById("menuSheet").classList.remove("open");
  document.getElementById("settingsSheet").classList.add("open");
};
document.getElementById("menuClearCompleted").onclick=()=>{
  const before=tasks.length;
  tasks=tasks.filter(t=>!t.done);
  saveTasks();
  document.getElementById("menuSheet").classList.remove("open");
  render();
  toast(before===tasks.length?"No completed tasks":"Completed tasks cleared");
};

document.getElementById("settingsSheet").onclick=e=>{
  if(e.target.id==="settingsSheet")e.currentTarget.classList.remove("open");
};
document.getElementById("menuSheet").onclick=e=>{
  if(e.target.id==="menuSheet")e.currentTarget.classList.remove("open");
};

loadTheme();
