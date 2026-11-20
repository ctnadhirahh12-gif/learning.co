document.addEventListener("DOMContentLoaded",()=>{
 const $=id=>document.getElementById(id);
 let soundEnabled=true,audioContext=null,bgMusicTimer=null,bgMusicMode=null,activityMusicMode=null;
 function playToneSequence(freqs,type="sine",step=.12){
  if(!soundEnabled)return;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   audioContext=audioContext||new AC();
   if(audioContext.state==="suspended")audioContext.resume();
   const now=audioContext.currentTime;
   freqs.forEach((freq,i)=>{
    const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=now+i*step;
    osc.type=type;osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.15,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+.22);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.24);
   });
  }catch(e){console.warn("Audio unavailable",e);}
 }
 function playAnswerSound(isCorrect){
  playToneSequence(isCorrect?[784,988,1175]:[330,247,185],isCorrect?"sine":"triangle",.13);
 }
 function playEncouragementSound(){playToneSequence([659,784,988,1175,1319],"sine",.09);}
 function playQuizStartSound(){playToneSequence([523,659,784,1047],"sine",.14);}
 function playQuizMilestoneSound(){playToneSequence([784,988,1175,1397,1568],"sine",.11);}
 function playGameStartSound(){playToneSequence([392,523,659,784],"triangle",.16);}
 function playGameSound(){playToneSequence([440,554,659],"triangle",.10);}
 function playGameCorrectSound(){playToneSequence([587,740,880,1175],"triangle",.11);}
 function playGameWrongSound(){playToneSequence([294,220,165],"square",.12);}

 // Original synthesized background music: separate looping themes for Quiz and Game.
 // Music starts only after the user presses the activity's Ready button.
 function stopBackgroundMusic(){
  if(bgMusicTimer){clearInterval(bgMusicTimer);bgMusicTimer=null;}
  bgMusicMode=null;
 }
 function playBackgroundNote(freq,start,duration,wave="sine",volume=.025){
  if(!soundEnabled||!audioContext)return;
  const osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type=wave;osc.frequency.setValueAtTime(freq,start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.linearRampToValueAtTime(volume,start+.12);
  gain.gain.setValueAtTime(volume,start+Math.max(.15,duration-.18));
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(audioContext.destination);
  osc.start(start);osc.stop(start+duration+.03);
 }
 function scheduleBackgroundMusic(mode){
  if(!soundEnabled)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  audioContext=audioContext||new AC();
  if(audioContext.state==="suspended")audioContext.resume();
  stopBackgroundMusic();bgMusicMode=mode;
  const quizChords=[[261.63,329.63,392.00],[220.00,261.63,329.63],[174.61,220.00,261.63],[196.00,246.94,293.66]];
  const gameChords=[[261.63,329.63,392.00],[293.66,369.99,440.00],[220.00,261.63,329.63],[246.94,311.13,369.99]];
  const quizMelody=[523.25,659.25,587.33,493.88,440.00,523.25,587.33,659.25,392.00,493.88,523.25,587.33,440.00,523.25,659.25,587.33];
  const gameMelody=[523.25,659.25,783.99,659.25,587.33,698.46,880.00,698.46,523.25,659.25,783.99,987.77,698.46,783.99,880.00,783.99];
  const runLoop=()=>{
   if(!soundEnabled||!audioContext||bgMusicMode!==mode)return;
   const now=audioContext.currentTime+.06;
   const chords=mode==="quiz"?quizChords:gameChords;
   const melody=mode==="quiz"?quizMelody:gameMelody;
   const beat=mode==="quiz"?.5:.42;
   chords.forEach((chord,bar)=>{
    const at=now+bar*beat*4;
    chord.forEach((note,index)=>playBackgroundNote(note,at,beat*3.7,mode==="quiz"?"sine":"triangle",mode==="quiz"?.018:.014));
    // Soft arpeggio gives each activity its own recognizable musical feel.
    for(let step=0;step<4;step++){
     const note=chord[(step+(mode==="quiz"?0:1))%chord.length]*2;
     playBackgroundNote(note,at+step*beat,.34,mode==="quiz"?"sine":"triangle",mode==="quiz"?.012:.016);
    }
   });
   melody.forEach((note,i)=>playBackgroundNote(note,now+i*beat,beat*.72,mode==="quiz"?"sine":"square",mode==="quiz"?.009:.012));
  };
  runLoop();
  bgMusicTimer=setInterval(runLoop,beatDuration(mode));
 }
 function beatDuration(mode){return mode==="quiz"?8000:6720;}
 function startActivityMusic(mode){
  activityMusicMode=mode;
  if(!soundEnabled)return;
  try{scheduleBackgroundMusic(mode);}catch(e){console.warn("Background music unavailable",e);}
 }
 const soundToggle=$("sound-toggle");
 const soundControlWrap=document.querySelector(".sound-control-wrap");
 function updateSoundToggle(){
  if(!soundToggle)return;
  soundToggle.setAttribute("aria-pressed",String(soundEnabled));
  $("sound-toggle-label").textContent=`Sound: ${soundEnabled?"ON":"OFF"}`;
  soundToggle.classList.toggle("sound-off",!soundEnabled);
  soundToggle.querySelector(".sound-icon").textContent=soundEnabled?"♫":"♪";
 }
 if(soundToggle)soundToggle.addEventListener("click",()=>{
  soundEnabled=!soundEnabled;updateSoundToggle();
  if(!soundEnabled){stopBackgroundMusic();if("speechSynthesis"in window)window.speechSynthesis.cancel();}
  else if(activityMusicMode)startActivityMusic(activityMusicMode);
 });
 updateSoundToggle();
 const learnWelcomeText="Welcome to the world of learning! Explore new ideas, build useful skills and discover how small learning habits can make a big difference.";
 function speakLearnWelcome(){
  if(!("speechSynthesis" in window))return;
  const synth=window.speechSynthesis;synth.cancel();
  const speak=()=>{
   const voices=synth.getVoices();
   const femaleNames=/female|samantha|ava|aria|jenny|zira|susan|siri|victoria|karen|moira|tessa|serena|google.*female/i;
   const english=voices.filter(v=>/^en([_-]|$)/i.test(v.lang));
   const preferred=english.find(v=>femaleNames.test(v.name+" "+v.voiceURI))
     ||english.find(v=>/female/i.test(v.name))
     ||null;
   const utterance=new SpeechSynthesisUtterance(learnWelcomeText);
   if(preferred)utterance.voice=preferred;
   utterance.lang=preferred?.lang||"en-US";
   utterance.rate=1.12;utterance.pitch=1.42;utterance.volume=1;
   synth.speak(utterance);
  };
  if(synth.getVoices().length){speak();}
  else{
   let done=false;
   const onVoices=()=>{if(done)return;done=true;synth.removeEventListener("voiceschanged",onVoices);speak();};
   synth.addEventListener("voiceschanged",onVoices);
   setTimeout(()=>{if(!done){done=true;synth.removeEventListener("voiceschanged",onVoices);speak();}},1200);
  }
 }
 function showPage(id){
  stopBackgroundMusic();activityMusicMode=null;
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  if(soundControlWrap)soundControlWrap.hidden=!(id==="quiz"||id==="game");
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="learn")speakLearnWelcome();else if("speechSynthesis" in window)window.speechSynthesis.cancel();
  if(id==="quiz"){$("quiz-ready-modal").hidden=false;$("quiz-milestone-modal").hidden=true;}
  if(id==="game"){$("game-ready-modal").hidden=false;}
 }
 document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
 const replayWelcome=$("replay-learn-welcome");if(replayWelcome)replayWelcome.addEventListener("click",speakLearnWelcome);
 ["brand-home","footer-home"].forEach(id=>$(id).addEventListener("click",e=>{e.preventDefault();showPage("home");window.scrollTo({top:0,behavior:"smooth"});}));

 const questions=[
 // TED-Ed: 3 tips on how to study effectively
 {v:"Study Skills",q:"According to the study-skills video, which technique helps you check what you can remember without looking at the material?",o:["Self-testing","Reading the same page repeatedly","Highlighting every sentence"],a:0,e:"Self-testing makes you retrieve information from memory."},
 {v:"Study Skills",q:"What is spaced practice?",o:["Studying everything in one night","Spreading study sessions over time","Only studying before a test"],a:1,e:"Spaced practice means reviewing information across separate sessions."},
 {v:"Study Skills",q:"Why is it useful to take breaks between study sessions?",o:["To avoid learning anything","To give your brain time between focused sessions","To replace all revision"],a:1,e:"Breaks help structure focused learning rather than cramming continuously."},
 {v:"Study Skills",q:"Which is a better way to check whether you understand a topic?",o:["Close your notes and explain it from memory","Look at the answer while explaining","Copy the whole textbook"],a:0,e:"Retrieving and explaining information helps reveal what you remember."},
 {v:"Study Skills",q:"What is the main message of the video about effective studying?",o:["Study longer without stopping","Use learning strategies that help memory","Avoid testing yourself"],a:1,e:"The video introduces practical methods to improve how we learn and remember."},
 {v:"Study Skills",q:"When using self-testing, what should a student do first?",o:["Try to recall the answer before checking notes","Read the answer aloud first","Skip difficult questions"],a:0,e:"Try to retrieve the information first, then check your answer."},
 {v:"Study Skills",q:"Which study habit best matches spaced practice?",o:["One long revision session the night before","Short review sessions on different days","Never reviewing old topics"],a:1,e:"Spacing revision across days is the key idea of spaced practice."},
 {v:"Study Skills",q:"What should you do after answering a practice question?",o:["Ignore whether it was correct","Check the answer and learn from mistakes","Delete your notes"],a:1,e:"Feedback helps you identify gaps and correct misunderstandings."},
 // TED-Ed: How to practice effectively
 {v:"Effective Practice",q:"What is practice?",o:["Repeating an action with the goal of improvement","Doing an action once","Avoiding difficult tasks"],a:0,e:"The video describes practice as repetition aimed at improvement."},
 {v:"Effective Practice",q:"What can effective practice help you develop?",o:["More confusion","Ease, speed and confidence","A reason to stop learning"],a:1,e:"The video explains that practice can make performance easier, faster and more confident."},
 {v:"Effective Practice",q:"What is the purpose of repeating a skill?",o:["To improve performance over time","To make no changes","To avoid feedback"],a:0,e:"Repetition with a goal helps improve a skill."},
 {v:"Effective Practice",q:"Which example shows purposeful practice?",o:["Playing randomly without focus","Repeating a difficult section while trying to improve it","Giving up after one attempt"],a:1,e:"Purposeful repetition focuses on improving a specific part of a skill."},
 {v:"Effective Practice",q:"According to the video, practice affects which part of us?",o:["The inner workings of the brain","Only our clothes","The weather"],a:0,e:"The lesson explains how practice affects the brain."},
 {v:"Effective Practice",q:"If a student wants to improve a presentation, what is a useful approach?",o:["Practise presenting and work on areas that need improvement","Avoid speaking before presentation day","Only read the title"],a:0,e:"Repeated practice can build skill and confidence."},
 {v:"Effective Practice",q:"Which statement best describes improvement through practice?",o:["Skills can improve with repeated effort","Skills never change","Only naturally talented people improve"],a:0,e:"Practice is a way to develop ability over time."},
 {v:"Effective Practice",q:"What should be the aim of a practice session?",o:["To repeat without attention","To work towards making the skill better","To finish as quickly as possible"],a:1,e:"Practice should have improvement as its goal."},
 // TED-Ed: What lack of sleep does to the teenage brain
 {v:"Teen Brain & Sleep",q:"What is the main topic of the third video?",o:["How sleep deprivation affects teenagers","How to design a school uniform","How to cook healthy meals"],a:0,e:"The video explores how insufficient sleep affects teenagers' bodies and brains."},
 {v:"Teen Brain & Sleep",q:"According to the video, how much sleep do teenagers generally need each night?",o:["4–5 hours","6 hours","8–10 hours"],a:2,e:"The video refers to the recommended 8–10 hours of sleep for teenagers."},
 {v:"Teen Brain & Sleep",q:"Which group is the focus of the video?",o:["Teenagers","Retired adults","Babies"],a:0,e:"The lesson focuses on adolescent sleep and the teenage brain."},
 {v:"Teen Brain & Sleep",q:"What is one issue discussed as affecting teenagers' sleep?",o:["Early school start times","Too many holidays","Long lunch breaks"],a:0,e:"The video discusses how early school start times can reduce teenagers' sleep."},
 {v:"Growth Mindset",q:"What does a growth mindset encourage students to believe?",o:["Abilities can develop through effort and learning","People can never improve","Mistakes mean you should stop"],a:0,e:"The talk encourages the idea that abilities can grow through effort, strategies and feedback."},
 {v:"Growth Mindset",q:"How should a student respond to a difficult task?",o:["Avoid it forever","See it as a chance to learn and improve","Assume they cannot do it"],a:1,e:"A challenge can be an opportunity to develop new skills."},
 {v:"Growth Mindset",q:"What is a helpful way to think about mistakes?",o:["They are proof of failure","They are part of the learning process","They should always be hidden"],a:1,e:"Mistakes can provide useful feedback and support improvement."},
 {v:"Learning New Skills",q:"When beginning to learn a new skill, what is a useful first step?",o:["Break it into smaller parts and practise regularly","Try to master everything at once","Wait until you feel naturally talented"],a:0,e:"Starting with manageable parts and focused practice helps make progress."},
 {v:"Learning New Skills",q:"What does studying smarter involve?",o:["Planning focused sessions and using effective strategies","Studying without breaks all night","Only rereading without checking understanding"],a:0,e:"Effective learning combines planning, focus and strategies that help you understand and remember."}
 ];
 let qi=0,score=0,answered=false;
 function renderQuiz(){const q=questions[qi];answered=false;$("quiz-stage").textContent=`Question ${qi+1} of ${questions.length}`;$("quiz-score").textContent=`Score: ${score}`;$("quiz-number").textContent=`${String(qi+1).padStart(2,"0")} / 25`;$("quiz-video").textContent=q.v;$("quiz-progress").style.width=`${(qi+1)/questions.length*100}%`;$("question-text").textContent=q.q;$("answer-feedback").innerHTML="";$("quiz-next").classList.add("hidden");$("answer-options").innerHTML="";q.o.forEach((opt,i)=>{const b=document.createElement("button");b.className="answer-option";b.textContent=`${String.fromCharCode(65+i)}. ${opt}`;b.addEventListener("click",()=>answerQuiz(i));$("answer-options").appendChild(b);});}
 function answerQuiz(i){
  if(answered)return;answered=true;
  const q=questions[qi],ok=i===q.a;
  playAnswerSound(ok);if(ok)score++;
  [...$("answer-options").children].forEach((b,n)=>{b.disabled=true;if(n===q.a)b.classList.add("correct");else if(n===i)b.classList.add("wrong");});
  $("quiz-score").textContent=`Score: ${score}`;
  $("answer-feedback").innerHTML=`<div class="feedback ${ok?"good":"bad"}"><strong>${ok?"✓ Correct!":"✕ Not quite."}</strong><p>${q.e}</p></div>`;
  const milestone=[7,15,20].includes(qi+1);
  $("quiz-next").classList.toggle("hidden",milestone);
  $("quiz-next").textContent=qi===questions.length-1?"See my result →":"Next question →";
  if(milestone){
   $("quiz-milestone-title").textContent=qi+1===20?"You're so close to the finish!":"Amazing effort!";
   $("quiz-milestone-message").textContent=`You've answered ${qi+1} questions! ${qi+1===20?"Only 5 more to go. Keep it up — you've got this!":"You're doing great. Every question brings you one step closer to your goal!"}`;
   $("quiz-milestone-modal").hidden=false;playQuizMilestoneSound();
  }
 }
 $("quiz-next").addEventListener("click",()=>{if(!answered)return;if(qi<questions.length-1){qi++;renderQuiz();}else finishQuiz();});
 function resetQuiz(){qi=0;score=0;renderQuiz();showPage("quiz");}
 $("quiz-restart").addEventListener("click",resetQuiz);$("result-retry").addEventListener("click",resetQuiz);
 $("quiz-ready-button").addEventListener("click",()=>{$("quiz-ready-modal").hidden=true;playQuizStartSound();startActivityMusic("quiz");});
 $("game-ready-button").addEventListener("click",()=>{$("game-ready-modal").hidden=true;playGameStartSound();startActivityMusic("game");});
 $("quiz-milestone-close").addEventListener("click",()=>{$("quiz-milestone-modal").hidden=true;$("quiz-next").classList.remove("hidden");});
 document.querySelectorAll("[data-close-modal]").forEach(button=>button.addEventListener("click",()=>{$(button.dataset.closeModal).hidden=true;}));


 // Celebration: colourful fireworks plus a short browser-generated sound after the user finishes.
 let fireworkTimer=null;
 function celebrate(){const canvas=$("fireworks-canvas"),ctx=canvas.getContext("2d");canvas.width=canvas.clientWidth*devicePixelRatio;canvas.height=canvas.clientHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);let particles=[];const w=canvas.clientWidth,h=canvas.clientHeight;const colors=["#ffd36e","#ff78bd","#5ee7dc","#a987f4","#ffffff"];for(let burst=0;burst<8;burst++){const cx=Math.random()*w,cy=Math.random()*h*.7;for(let j=0;j<34;j++){const a=Math.PI*2*j/34,s=1+Math.random()*3;particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:65+Math.random()*25,c:colors[burst%colors.length]});}}let frame=0;function draw(){ctx.clearRect(0,0,w,h);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.life--;ctx.globalAlpha=Math.max(0,p.life/80);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0);if(particles.length&&frame++<120)requestAnimationFrame(draw);}draw();playCelebrationSound();}
 function playCelebrationSound(){playToneSequence([523.25,659.25,783.99,1046.5],"sine",.13);}
 function finishQuiz(){const pct=score/questions.length;$("final-score").textContent=`${score}/${questions.length}`;$("final-message").textContent=pct>=.8?"Amazing work! You have a strong understanding of the learning videos.":pct>=.5?"Nice effort! Review the videos and keep building your knowledge.":"Good try! Every attempt is a chance to learn. Watch the videos again and try once more.";showPage("result");setTimeout(celebrate,180);}
 renderQuiz();
 const panelWrap=$("footer-panel-wrap"),panelContent=$("footer-panel-content");
 const panelHTML={
  help:`<span class="panel-kicker">LEARNING.CO SUPPORT</span><h2>How can we help?</h2><p>Here is a quick guide to using the website.</p><div class="help-steps"><article><strong>01 · Explore SDG 4</strong><p>Open <b>About SDG 4</b> to learn about the goal, its targets and simple actions you can take.</p></article><article><strong>02 · Watch and learn</strong><p>Go to <b>Learn</b>, choose a video and watch it before attempting the quiz.</p></article><article><strong>03 · Test your knowledge</strong><p>Complete the 25-question quiz. You will hear feedback sounds for correct and incorrect answers.</p></article><article><strong>04 · Play together</strong><p>Open <b>Game</b> to play a pass-and-play challenge with 2–5 students on one device.</p></article></div><p class="panel-note">Tip: If a video does not load, check your internet connection or open it directly on YouTube.</p>`,
  faq:`<span class="panel-kicker">GOOD TO KNOW</span><h2>Frequently Asked Questions</h2><div class="panel-faq"><details open><summary>How do I use Learning.co?</summary><p>Use the top navigation to explore SDG 4, watch learning videos, take the quiz and play the group game.</p></details><details><summary>Are the quiz questions based on the videos?</summary><p>Yes. Yes. The 25-question quiz covers study skills, effective practice, teenage sleep, growth mindset and learning new skills from the video library.</p></details><details><summary>Can friends play the game together?</summary><p>Yes. Two to five students can take turns in Team Challenge. You can also play Tic-Tac-Toe with a friend or Memory Match on your own.</p></details><details><summary>Will my scores be saved?</summary><p>Quiz and game scores are shown at the end of each activity, but are not saved after the page is refreshed. Use the Sound button near the navigation to turn game and quiz sounds on or off.</p></details><details><summary>Why is a video not playing?</summary><p>Check your internet connection. Some videos may have YouTube embedding restrictions; you can open the video on YouTube instead.</p></details><details><summary>Can I replay the quiz or game?</summary><p>Yes. Use the retry or play-again button shown after completing an activity.</p></details><details><summary>Can I turn the sounds off?</summary><p>Yes. Use the Sound ON/OFF button below the navigation. Sound is on by default.</p></details></div>`,
  contact:`<span class="panel-kicker">WE'D LOVE TO HEAR FROM YOU</span><h2>Contact Information</h2><p>Have a question, suggestion or feedback? Fill in the form below.</p><form id="contact-form" class="panel-contact-form"><label for="contact-name">Your name</label><input id="contact-name" name="name" type="text" placeholder="Enter your name" required><label for="contact-email">Email address</label><input id="contact-email" name="email" type="email" placeholder="name@example.com" required><label for="contact-subject">Subject</label><select id="contact-subject" name="subject"><option>General enquiry</option><option>Website help</option><option>Suggestion or feedback</option><option>Report a problem</option></select><label for="contact-message">Message</label><textarea id="contact-message" name="message" rows="4" placeholder="Write your message here..." required></textarea><button class="primary-btn" type="submit">Send message →</button><p id="contact-status" class="contact-status" aria-live="polite"></p></form><p class="panel-note">This is a demonstration form. Messages are not sent or stored until a form service or backend is connected.</p>`
 };
 document.querySelectorAll("[data-footer-panel]").forEach(link=>link.addEventListener("click",e=>{
  e.preventDefault();const key=link.dataset.footerPanel;panelContent.innerHTML=panelHTML[key]||panelHTML.help;panelWrap.hidden=false;panelWrap.scrollIntoView({behavior:"smooth",block:"center"});
 }));
 $("footer-panel-close").addEventListener("click",()=>{panelWrap.hidden=true;});
 document.addEventListener("submit",e=>{
  if(e.target.id!=="contact-form")return;e.preventDefault();
  if(!e.target.reportValidity())return;
  $("contact-status").textContent="Thank you! Your message has been noted in this demo. Connect a form service or backend to receive submissions.";
  e.target.reset();
 });

 // Pass-and-play mini game for up to five students. Each player takes turns on the same device.
 const gameQuestions=[
 {q:"Which study method asks you to recall information without looking at notes?",o:["Self-testing","Cramming","Copying"],a:0},
 {q:"What does spaced practice mean?",o:["Studying once only","Reviewing over separate sessions","Skipping revision"],a:1},
 {q:"What is the goal of practice?",o:["Improvement","Avoiding effort","Finishing first"],a:0},
 {q:"What can repeated practice help build?",o:["Ease, speed and confidence","Sleepiness only","No change"],a:0},
 {q:"What is the focus of the teenage sleep video?",o:["Sleep and the teenage brain","Exam timetables only","Sports equipment"],a:0},
 {q:"How much sleep do teenagers generally need each night, according to the video?",o:["8–10 hours","3–4 hours","5 hours"],a:0},
 {q:"Which factor is discussed as affecting teen sleep?",o:["Early school start times","School colours","Homework stationery"],a:0},
 {q:"What should a learner do after a practice quiz?",o:["Check answers and learn from mistakes","Ignore all feedback","Delete the questions"],a:0},
 {q:"Which habit can support teenage wellbeing?",o:["Getting enough sleep","Staying awake all night","Skipping rest"],a:0},
 {q:"What links all three learning videos?",o:["Ways to support learning and improvement","How to become famous","How to avoid school"],a:0}
 ];
 let players=[],turn=0,round=0,gameAnswered=false,gameScores=[];
 const inputs=$("player-inputs");
 $("add-player").addEventListener("click",()=>{const count=inputs.children.length;if(count>=5)return;const input=document.createElement("input");input.value=`Player ${count+1}`;input.setAttribute("aria-label",`Player ${count+1} name`);inputs.appendChild(input);if(inputs.children.length===5)$("add-player").classList.add("hidden");});
 $("start-game").addEventListener("click",()=>{players=[...inputs.querySelectorAll("input")].map((x,i)=>x.value.trim()||`Player ${i+1}`);if(players.length<2){alert("Please add at least two players.");return;}gameScores=players.map(()=>0);turn=0;round=0;$("game-setup").classList.add("hidden");$("game-result").classList.add("hidden");$("game-play").classList.remove("hidden");renderGame();});
 function renderScoreboard(){$("game-scoreboard").innerHTML=players.map((p,i)=>`<span class="score-chip ${i===turn?"current":""}">${escapeHTML(p)} · ${gameScores[i]} pts</span>`).join("");}
 function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function renderGame(){gameAnswered=false;renderScoreboard();$("game-turn").textContent=`${players[turn]}'s turn · Round ${round+1} of ${gameQuestions.length}`;const q=gameQuestions[round];$("game-question").textContent=q.q;$("game-feedback").innerHTML="";$("game-next").classList.add("hidden");$("game-options").innerHTML="";q.o.forEach((o,i)=>{const b=document.createElement("button");b.className="answer-option";b.textContent=`${String.fromCharCode(65+i)}. ${o}`;b.addEventListener("click",()=>answerGame(i));$("game-options").appendChild(b);});}
 function answerGame(i){if(gameAnswered)return;gameAnswered=true;const q=gameQuestions[round],ok=i===q.a;if(ok)playGameCorrectSound();else playGameWrongSound();if(ok)gameScores[turn]++;[...$("game-options").children].forEach((b,n)=>{b.disabled=true;if(n===q.a)b.classList.add("correct");else if(n===i)b.classList.add("wrong");});$("game-feedback").innerHTML=`<div class="feedback ${ok?"good":"bad"}">${ok?"Correct! One point added.":"Not quite! The correct answer is highlighted."}</div>`;renderScoreboard();$("game-next").classList.remove("hidden");$("game-next").textContent=round===gameQuestions.length-1?"See final scores →":"Next turn →";}
 $("game-next").addEventListener("click",()=>{if(!gameAnswered)return;round++;turn=(turn+1)%players.length;if(round<gameQuestions.length)renderGame();else finishGame();});
 function finishGame(){$("game-play").classList.add("hidden");$("game-result").classList.remove("hidden");const max=Math.max(...gameScores);const winners=players.filter((p,i)=>gameScores[i]===max);$("game-winner").textContent=winners.length>1?`It's a tie: ${winners.join(" & ")}!`:`Winner: ${winners[0]}!`;$("game-final-scores").innerHTML=players.map((p,i)=>`<div class="game-final-line">${escapeHTML(p)} — <strong>${gameScores[i]} points</strong></div>`).join("");}
 function resetGame(){inputs.innerHTML="";for(let i=1;i<=2;i++){const x=document.createElement("input");x.value=`Player ${i}`;x.setAttribute("aria-label",`Player ${i} name`);inputs.appendChild(x);} $("add-player").classList.remove("hidden");$("game-play").classList.add("hidden");$("game-result").classList.add("hidden");$("game-setup").classList.remove("hidden");}
 $("game-again").addEventListener("click",resetGame);

 // Extra mini-games: two-player Tic-Tac-Toe and six-pair Memory Match.
 document.querySelectorAll("[data-game-mode]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("[data-game-mode]").forEach(b=>b.classList.toggle("active",b===btn));
  ["team","xo","memory"].forEach(mode=>$(mode+"-game-mode").classList.toggle("hidden",mode!==btn.dataset.gameMode));
 }));
 let xoBoard=Array(9).fill(""),xoTurn="X",xoDone=false;
 const xoWins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 function renderXO(){
  $("xo-board").innerHTML="";
  xoBoard.forEach((value,i)=>{const b=document.createElement("button");b.className="xo-cell";b.textContent=value;b.disabled=!!value||xoDone;b.setAttribute("aria-label",`Cell ${i+1}${value?", "+value:" empty"}`);b.addEventListener("click",()=>playXO(i));$("xo-board").appendChild(b);});
 }
 function playXO(i){
  if(xoBoard[i]||xoDone)return;xoBoard[i]=xoTurn;playGameSound();
  const win=xoWins.find(line=>line.every(n=>xoBoard[n]===xoTurn));
  if(win){xoDone=true;$("xo-status").textContent=`Player ${xoTurn} wins! Great game!`;win.forEach(n=>$("xo-board").children[n].classList.add("xo-winning"));playGameCorrectSound();}
  else if(xoBoard.every(Boolean)){xoDone=true;$("xo-status").textContent="It's a draw! Play again?";}
  else{xoTurn=xoTurn==="X"?"O":"X";$("xo-status").textContent=`Player ${xoTurn}'s turn`;}
  renderXO();
  if(win)win.forEach(n=>$("xo-board").children[n].classList.add("xo-winning"));
 }
 function resetXO(){xoBoard=Array(9).fill("");xoTurn="X";xoDone=false;$("xo-status").textContent="Player X's turn";renderXO();}
 $("xo-reset").addEventListener("click",resetXO);resetXO();

 const memoryItems=[["📚","Learning"],["💡","Ideas"],["🌱","Growth"],["🎯","Focus"],["🧠","Memory"],["⭐","Goals"]];
 let memoryDeck=[],memoryOpen=[],memoryMatched=0,memoryMoves=0,memoryLock=false;
 function resetMemory(){
  memoryDeck=[...memoryItems,...memoryItems].map((item,i)=>({id:i,pair:item[1],face:item[0],open:false,matched:false})).sort(()=>Math.random()-.5);
  memoryOpen=[];memoryMatched=0;memoryMoves=0;memoryLock=false;renderMemory();
 }
 function renderMemory(){
  $("memory-moves").textContent=`Moves: ${memoryMoves}`;$("memory-pairs").textContent=`Pairs: ${memoryMatched} / 6`;
  $("memory-board").innerHTML="";
  memoryDeck.forEach((card,i)=>{const b=document.createElement("button");b.className="memory-card"+(card.open||card.matched?" revealed":"")+(card.matched?" matched":"");b.textContent=card.open||card.matched?card.face:"?";b.disabled=card.matched||memoryLock;b.setAttribute("aria-label",card.open||card.matched?card.pair:"Hidden memory card");b.addEventListener("click",()=>flipMemory(i));$("memory-board").appendChild(b);});
 }
 function flipMemory(i){
  const card=memoryDeck[i];if(memoryLock||card.open||card.matched)return;
  card.open=true;memoryOpen.push(i);playGameSound();
  if(memoryOpen.length===2){
   memoryMoves++;const [a,b]=memoryOpen.map(n=>memoryDeck[n]);
   if(a.pair===b.pair){a.matched=b.matched=true;memoryMatched++;memoryOpen=[];playGameCorrectSound();if(memoryMatched===6){$("memory-moves").textContent=`Completed in ${memoryMoves} moves!`;playGameCorrectSound();}}
   else{memoryLock=true;playGameWrongSound();setTimeout(()=>{a.open=b.open=false;memoryOpen=[];memoryLock=false;renderMemory();},850);}
  }
  renderMemory();
 }
 $("memory-reset").addEventListener("click",resetMemory);resetMemory();


});