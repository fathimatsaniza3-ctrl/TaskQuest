const $ = id => document.getElementById(id);
let gameActive = false, tapCount = 0, tapTimer = null, memoryPattern = [], memoryStep = 0;
// Demo-only login gate: any non-empty username/password opens the app.
$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!$("loginName").value.trim() || !$("loginPassword").value) return;
  document.body.classList.remove("app-locked");
  $("loginScreen").classList.add("hidden");
  toast(`Welcome, ${$("loginName").value.trim()}! Your procrastination awaits.`);
});
let focusInterval = null, focusRemaining = 0, focusTotal = 0, focusPaused = false;
let adInterval = null, adRemaining = 15;
let stats = JSON.parse(localStorage.getItem("taskquest_stats") || '{"quests":0,"wins":0,"minutes":0}');
function updateStats(){ $("questCount").textContent=stats.quests; $("winsCount").textContent=stats.wins; $("minutesCount").textContent=stats.minutes; localStorage.setItem("taskquest_stats",JSON.stringify(stats)); }
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200);}
let mandatoryGames = ["emoji","reaction","memory"];
let gameStage = 0;
function beginGame(){
 const task=$("taskName").value.trim();if(!task){$("taskName").focus();toast("Enter a task first to begin your quest.");return;}
 $("unlockedCard").classList.add("hidden");$("focusCard").classList.add("hidden");gameActive=true;gameStage=0;
 mandatoryGames=["emoji","reaction","memory"].sort(()=>Math.random()-.5);launchMandatoryGame();
}
function launchMandatoryGame(){
 gameActive=true;
 const names={emoji:"Emoji Emergency Decoder",reaction:"Panic Reflex Test",memory:"Brain-Rot Memory Vault"};
 const game=mandatoryGames[gameStage];
 $("gameStatus").textContent=`Mandatory game ${gameStage+1} of 3`;
 $("gameTitle").textContent=names[game];
 if(game==="emoji")setupEmojiGame();else if(game==="reaction")setupReactionGame();else setupMemoryGame();
}
function setupEmojiGame(){
 const questions=[
  {emoji:"📚🔥😭",answer:"Assignment panic",choices:["Assignment panic","Cooking dinner","Going on holiday"]},
  {emoji:"🛌⏰💀",answer:"Overslept again",choices:["Overslept again","Won the lottery","Became a superhero"]},
  {emoji:"📱👀➡️🌅",answer:"One more scroll became 3 hours",choices:["One more scroll became 3 hours","Studied for 10 hours","Phone battery is full"]},
  {emoji:"☕💻😎",answer:"Pretending to be productive",choices:["Pretending to be productive","Going scuba diving","Sleeping peacefully"]},
  {emoji:"🧠❌📄",answer:"Brain has left the chat",choices:["Brain has left the chat","Finished the assignment","Remembered everything"]}
 ];
 let index=0,score=0;const picked=questions.sort(()=>Math.random()-.5).slice(0,3);
 function render(){
  if(index>=3){if(score>=2){winGame();return;}index=0;score=0;toast("Emoji chaos! Try the decoder again.");}
  const q=picked[index];
  $("gameArea").innerHTML=`<div class="game-content fun-new-game"><div class="game-emoji">🧩</div><h3>Emoji Emergency Decoder</h3><p>Decode the situation before your last brain cell resigns. Get 2 out of 3 right!</p><div class="funny-score">Question ${index+1} / 3 · Correct: ${score}</div><div class="emoji-puzzle">${q.emoji}</div><div class="answer-grid">${q.choices.sort(()=>Math.random()-.5).map(c=>`<button class="answer-choice">${c}</button>`).join("")}</div><p class="game-feedback" id="gameFeedback">Choose wisely. Your GPA is watching.</p></div>`;
  document.querySelectorAll(".answer-choice").forEach(btn=>btn.onclick=()=>{if(!gameActive)return;document.querySelectorAll(".answer-choice").forEach(b=>b.disabled=true);const correct=btn.textContent===q.answer;if(correct){score++;btn.classList.add("correct-answer");$("gameFeedback").textContent="Correct! Your brain cell has been promoted. 🧠";}else{btn.classList.add("wrong-answer");$("gameFeedback").textContent=`Wrong! The correct answer was: ${q.answer}. The committee is disappointed.`;}index++;setTimeout(()=>{if(gameActive)render();},850);});
 }
 render();
}
function setupReactionGame(){
 let state="waiting",timeout=null,start=0;
 $("gameArea").innerHTML=`<div class="game-content fun-new-game"><div class="game-emoji">⚡</div><h3>Panic Reflex Test</h3><p>Wait for the button to turn GREEN, then click as fast as you can. Click early and the system will judge you.</p><div class="reaction-arena"><button class="reaction-button" id="reactionButton">WAIT…</button></div><div class="funny-score" id="reactionStatus">Your reflexes are currently on vacation.</div></div>`;
 const btn=$("reactionButton"),status=$("reactionStatus");
 timeout=setTimeout(()=>{if(!gameActive)return;state="go";start=performance.now();btn.classList.add("reaction-go");btn.textContent="CLICK NOW!";status.textContent="GO GO GO!";},1800+Math.random()*2600);
 btn.onclick=()=>{if(!gameActive)return;if(state==="waiting"){clearTimeout(timeout);state="failed";btn.textContent="TOO EARLY!";status.textContent="False start! Your impatience has been documented. Try again in 1.5 seconds.";btn.disabled=true;setTimeout(()=>{if(gameActive)setupReactionGame();},1500);}else if(state==="go"){const ms=Math.round(performance.now()-start);state="done";btn.disabled=true;btn.textContent=`${ms} ms`;status.textContent=ms<500?`Lightning fast: ${ms} ms! The goblin fears you.`:`Reaction time: ${ms} ms. Your brain was loading updates.`;setTimeout(()=>{if(gameActive)winGame();},1300);}};
}
function setupMemoryGame(){
 const symbols=["🍕","👾","🦄","💩","🚀","🧠","🍩","🛸"];
 const sequence=Array.from({length:4},()=>symbols[Math.floor(Math.random()*symbols.length)]);
 let step=0,showing=true;
 $("gameArea").innerHTML=`<div class="game-content fun-new-game"><div class="game-emoji">🧠</div><h3>Brain-Rot Memory Vault</h3><p>Memorize the 4-symbol sequence. Then tap the symbols in the same order. No screenshots, detective.</p><div class="memory-sequence" id="memorySequence">${sequence.join("　")}</div><div class="funny-score" id="memoryStatus">Memorize quickly…</div><div class="memory-pad" id="memoryPad">${symbols.map(x=>`<button class="memory-key" data-symbol="${x}" disabled>${x}</button>`).join("")}</div></div>`;
 setTimeout(()=>{if(!gameActive)return;showing=false;$("memorySequence").textContent="❔　❔　❔　❔";$("memoryStatus").textContent="Your turn! Repeat the sequence.";document.querySelectorAll(".memory-key").forEach(b=>b.disabled=false);},2300);
 document.querySelectorAll(".memory-key").forEach(btn=>btn.onclick=()=>{if(!gameActive||showing)return;const val=btn.dataset.symbol;if(val===sequence[step]){btn.classList.add("memory-correct");setTimeout(()=>btn.classList.remove("memory-correct"),250);step++;$("memoryStatus").textContent=`Correct sequence: ${step} / 4`;if(step===sequence.length){$("memoryStatus").textContent="Memory unlocked! Your last brain cell survives. 🏆";document.querySelectorAll(".memory-key").forEach(b=>b.disabled=true);setTimeout(()=>{if(gameActive)winGame();},900);}}else{$("memoryStatus").textContent="Wrong symbol! The memory goblin has wiped your attempt. Restarting…";document.querySelectorAll(".memory-key").forEach(b=>b.disabled=true);setTimeout(()=>{if(gameActive)setupMemoryGame();},1000);}});
}
function winGame(){
 if(!gameActive)return;gameActive=false;stats.wins++;updateStats();gameStage++;
 if(gameStage<3){$("gameStatus").textContent=`Game ${gameStage} cleared — next up!`;$("gameArea").innerHTML=`<div class="game-content"><div class="game-emoji">🎟️</div><h3>Game ${gameStage} of 3 completed!</h3><p>One nonsense checkpoint cleared. Your task is still locked.</p><p class="auto-next">Next ridiculous game loading…</p></div>`;toast(`Game ${gameStage} complete! Prepare for more nonsense.`);setTimeout(()=>{if(gameStage<3)launchMandatoryGame();},1200);return;}
 stats.quests++;updateStats();$("gameStatus").textContent="All 3 games conquered!";$("gameArea").innerHTML=`<div class="game-content"><div class="game-emoji">🏆🎉</div><h3>All 3 mandatory games completed!</h3><p>The task is finally unlocked. The Nonsense Committee is proud (for no reason).</p></div>`;
 $("unlockedTask").textContent=$("taskName").value.trim();$("unlockedCard").classList.remove("hidden");$("unlockedCard").scrollIntoView({behavior:"smooth",block:"center"});toast("All 3 games cleared! Quest unlocked.");
}
$("startGame").onclick=beginGame;
$("startFocus").onclick=()=>{
  // Every focus session is preceded by a deliberately pointless 15-second fake ad.
  clearInterval(adInterval);clearInterval(focusInterval);adRemaining=15;
  const ads=[
    {emoji:"🧃",title:"Try Procrastination Juice™",copy:"The only drink that gives you energy to avoid the thing you need to do.",foot:"Side effects include opening 47 tabs and forgetting why."},
    {emoji:"🛋️",title:"Introducing Executive Nap Pillow",copy:"For people who need a quick nap before their 1-minute focus session.",foot:"Now with 300% more excuses. Not approved by any pillow authority."},
    {emoji:"📎",title:"Premium Paperclip Plus",copy:"It clips papers together. That's literally the entire product.",foot:"Upgrade to Premium for a second paperclip. Terms are unnecessarily long."}
  ];
  let adIndex=0;
  const renderAd=()=>{$("fakeAdEmoji").textContent=ads[adIndex].emoji;$ ("fakeAdTitle").textContent=ads[adIndex].title;$ ("fakeAdCopy").textContent=ads[adIndex].copy;$ ("fakeAdFoot").textContent=ads[adIndex].foot;};
  renderAd();$("adCountdown").textContent=adRemaining;$ ("fakeAdProgress").style.width="0%";
  $("fakeAdOverlay").classList.remove("hidden");
  adInterval=setInterval(()=>{
    adRemaining--;$ ("adCountdown").textContent=adRemaining;
    // Rotate to another fake ad at 10 seconds remaining.
    if(adRemaining===10){adIndex++;renderAd();}
    $("fakeAdProgress").style.width=`${((15-adRemaining)/15)*100}%`;
    if(adRemaining<=0){clearInterval(adInterval);$("fakeAdOverlay").classList.add("hidden");startFocusTimer();}
  },1000);
};
function startFocusTimer(){
  focusTotal=Number($("duration").value)*60;focusRemaining=focusTotal;focusPaused=false;
  $("focusTask").textContent=$("taskName").value.trim();$("focusCard").classList.remove("hidden");$("focusCard").scrollIntoView({behavior:"smooth",block:"center"});
  renderTimer();clearInterval(focusInterval);focusInterval=setInterval(()=>{if(focusPaused)return;focusRemaining--;renderTimer();if(focusRemaining<=0){clearInterval(focusInterval);stats.minutes+=Number($("duration").value);updateStats();$("focusMessage").textContent="Session complete! You made time for your task. 🎉";showFunnyVideo();toast("Focus session completed! Enjoy your ridiculous reward video.");}},1000);
}
function renderTimer(){const m=Math.floor(focusRemaining/60),s=focusRemaining%60;$("timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;$("progress").style.width=`${((focusTotal-focusRemaining)/focusTotal)*100}%`;}
$("pauseFocus").onclick=()=>{focusPaused=!focusPaused;$("pauseFocus").textContent=focusPaused?"Resume":"Pause";};
function showFunnyVideo(){
  $("postFocusVideo").classList.remove("hidden");
  $("postFocusVideo").scrollIntoView({behavior:"smooth",block:"center"});
}
$("finishFocus").onclick=()=>{clearInterval(focusInterval);focusRemaining=0;renderTimer();$("focusMessage").textContent="Session ended. Every little bit counts.";showFunnyVideo();toast("Focus session ended. Here is your completely unnecessary reward.");};
$("resetStats").onclick=()=>{stats={quests:0,wins:0,minutes:0};updateStats();toast("Stats reset.");};
updateStats();

const excuses={
cosmic:["Mercury is in retrograde and my assignment has entered orbit.","A solar flare briefly scrambled my motivation coordinates.","The moon's gravitational pull has postponed my deadline by 3 business galaxies."],
technical:["My laptop is emotionally updating its operating system.","The Wi-Fi signal reached the internet but not my ambition.","My keyboard has filed a formal complaint against typing."],
academic:["The assignment is awaiting approval from the Department of Unnecessary Delays.","I submitted a request to begin beginning, and it is under review.","My procrastination committee has scheduled a meeting to discuss scheduling."],
dramatic:["I was ready to work, but the soundtrack of my life entered a dramatic intermission.","A plot twist occurred: I opened another tab.","I stared into the deadline abyss, and the abyss asked for an extension."]
};
const delays=["A pigeon has been appointed interim project manager.","Please complete a 7-step captcha to prove you are emotionally ready.","Your motivation is currently buffering at 2%.","The task has requested a formal introduction first.","A tiny committee is debating whether today is a weekday.","Your pencil requires a performance review.","The deadline has been moved to yesterday for dramatic effect."];
$("generateExcuse").onclick=()=>{const list=excuses[$("excuseType").value];$("generatedText").textContent=list[Math.floor(Math.random()*list.length)];$("generatedBox").classList.remove("hidden");};
$("generateEmail").onclick=()=>{const name=$("hodName").value.trim()||"Respected HOD";const task=$("taskName").value.trim()||"my pending task";$("generatedText").textContent=`Subject: Request for an Extremely Unnecessary Extension\n\nDear ${name},\n\nI hope this email finds you well and my assignment finds itself somewhere nearby. I am writing to inform you that “${task}” has been delayed due to a severe shortage of dramatic background music, a pending motivation approval, and a minor meeting with my procrastination committee.\n\nI humbly request an extension of 37 minutes, or until the universe gives me a sign (whichever arrives first).\n\nRegards,\nChief Delay Officer\n\nP.S. This is a joke email generated by TaskQuest. It has not been sent.`;$("generatedBox").classList.remove("hidden");};
$("copyText").onclick=()=>{navigator.clipboard?.writeText($("generatedText").textContent).then(()=>toast("Copied. Please do not actually email your HOD.")).catch(()=>toast("Select and copy the text manually."));};
$("spinWheel").onclick=()=>{const result=delays[Math.floor(Math.random()*delays.length)];const wheel=$("wheelGraphic");const spin=360*2+Math.floor(Math.random()*360);wheel.style.transform=`rotate(${spin}deg)`;$("wheelResult").textContent="The carnival committee is deciding…";setTimeout(()=>{$("wheelResult").textContent=result;$("wheelResult").classList.add("wiggle");setTimeout(()=>$("wheelResult").classList.remove("wiggle"),600);},1250);};

$("anotherQuest").onclick=()=>{
  $("taskName").value="";
  $("unlockedCard").classList.add("hidden");
  $("focusCard").classList.add("hidden");
  $("gameStatus").textContent="Awaiting paperwork";
  $("gameTitle").textContent="Emoji Emergency Decoder";
  $("gameArea").innerHTML=`<div class="game-placeholder"><div class="game-emoji">🎮</div><h3>Your mandatory game appears here</h3><p>Choose a task. Complete all 3 games one by one to unlock it.</p></div>`;
  $("taskName").focus();
  window.scrollTo({top:0,behavior:"smooth"});
  toast("A fresh quest. The nonsense never ends.");
};

// Full reset button at the very end of the site.
$("resetAll").onclick=()=>{
 if(!confirm("Reset the entire TaskQuest circus? All current progress will be cleared."))return;
 clearInterval(focusInterval);clearInterval(adInterval);gameActive=false;gameStage=0;focusRemaining=0;focusTotal=0;focusPaused=false;
 $("taskName").value="";$("courtTask").value="";$("unlockedCard").classList.add("hidden");$("focusCard").classList.add("hidden");$("postFocusVideo").classList.add("hidden");$("certificateCard").classList.add("hidden");$("fakeAdOverlay").classList.add("hidden");
 $("gameStatus").textContent="Awaiting paperwork";$("gameTitle").textContent="Emoji Emergency Decoder";$("gameArea").innerHTML=`<div class="game-placeholder"><div class="game-emoji">🎮</div><h3>Your mandatory games appear here</h3><p>Choose a task. Complete all 3 games one by one to unlock it.</p></div>`;
 $("bossMonster").textContent="👾";bossHealth=100;$("bossHealth").style.width="100%";$("bossStatus").textContent="Monster health: 100%";$("bossHit").textContent="Do one tiny thing ⚔️";
 approvals.clear();document.querySelectorAll("[data-approval]").forEach(b=>{b.classList.remove("approved");b.querySelector("span").textContent="Pending";});$("approvalStatus").textContent="0 / 3 approvals obtained. Your paperwork is emotionally incomplete.";
 $("courtVerdict").classList.add("hidden");$("generatedBox").classList.add("hidden");$("timer").textContent="00:00";$("progress").style.width="0%";$("focusMessage").textContent="One small step is still progress. You’ve got this.";
 stats={quests:0,wins:0,minutes:0};updateStats();window.scrollTo({top:0,behavior:"smooth"});toast("The circus has been reset. Your excuses have been wiped (temporarily).");
};

// Extra demo features: absurd court, approval stamps, boss battle, printable certificate.
const courtRulings=[
 {title:"GUILTY OF BEING A TASK",text:"The defendant is sentenced to one (1) tiny step, effective immediately. The court recommends opening the document before thinking about opening another tab."},
 {title:"NOT GUILTY — BUT SUSPICIOUS",text:"The court finds your task suspiciously important. You are hereby ordered to work on it for 120 seconds before appealing."},
 {title:"CASE DISMISSED FOR VIBES",text:"No evidence of productivity was found. However, the judge has a good feeling about you. Start with the easiest 2-minute piece."}
];
$("judgeTask").onclick=()=>{const task=$("courtTask").value.trim()||$("taskName").value.trim()||"Your mysterious task";const ruling=courtRulings[Math.floor(Math.random()*courtRulings.length)];$("verdictTitle").textContent=ruling.title;$("verdictText").textContent=`Regarding “${task}”: ${ruling.text}`;$("courtVerdict").classList.remove("hidden");toast("The court has reached a deeply unserious verdict.");};
let approvals=new Set();const approvalMessages={motivation:"Motivation Office: motivation has been located (briefly).",snack:"Snack Compliance: snack status is acceptable. Crumbs are pending.",vibes:"Vibes Committee: vibes approved with unnecessary enthusiasm."};
document.querySelectorAll("[data-approval]").forEach(btn=>btn.onclick=()=>{const key=btn.dataset.approval;if(approvals.has(key))return;approvals.add(key);btn.classList.add("approved");btn.querySelector("span").textContent="APPROVED ✓";$("approvalStatus").textContent=`${approvals.size} / 3 approvals obtained. `+(approvals.size===3?"Paperwork complete! Please proceed to do the actual task.":approvalMessages[key]);if(approvals.size===3){toast("All pointless approvals collected! The monster still awaits.");}});
let bossHealth=100;$("bossHit").onclick=()=>{bossHealth=Math.max(0,bossHealth-20);$("bossHealth").style.width=bossHealth+"%";$("bossStatus").textContent=bossHealth?`Monster health: ${bossHealth}% — tiny progress is working!`:`BOSS DEFEATED! You made actual progress. The monster has filed a complaint.`;$("bossMonster").classList.add("hit");setTimeout(()=>$("bossMonster").classList.remove("hit"),220);if(!bossHealth){$("bossMonster").textContent="💥🏆";$("bossHit").textContent="Victory! Do another tiny thing";$ ("certificateCard").classList.remove("hidden");$("certName").textContent="Chief Procrastination Survivor";$("certTask").textContent=`For courageously beginning: “${$("taskName").value.trim()||"A task of great mystery"}”`;$ ("certificateCard").scrollIntoView({behavior:"smooth",block:"center"});toast("Deadline Monster defeated! Certificate unlocked!");}};
$("printCertificate").onclick=()=>window.print();
