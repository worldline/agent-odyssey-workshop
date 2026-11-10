"use strict";
const launch=document.getElementById('launch-presentation');
launch.addEventListener('click',async()=>{
  launch.disabled=true;launch.textContent='Opening…';
  try {
    const response=await fetch('/presenter/launch',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(!response.ok)throw new Error('Unable to launch');
    launch.textContent='Presentation opened';
  } catch { launch.textContent='Try again';launch.disabled=false;launch.title='Brave could not be launched. Check that port 9234 is available.'; }
});
