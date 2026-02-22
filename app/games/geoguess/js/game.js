(function(window){
  const NUM_ROUNDS = 10;
  let round = 0, score = 0, currentIdx = null, districts = [], hintsUsed = 0;
  let isDataLoaded = false; // Flag to prevent multiple fetches
  
  // DOM Cache
  const scoreEl = document.getElementById('score');
  const roundEl = document.getElementById('round');
  const optionsEl = document.getElementById('options');
  const nextBtn = document.getElementById('nextBtn');
  const districtDescriptionEl = document.getElementById('districtDescription');
  
  const finalModal = document.getElementById('finalModal');
  const finalTitle = document.getElementById('finalTitle');
  const finalMessage = document.getElementById('finalMessage');
  const disclaimerModal = document.getElementById('disclaimerModal');
  const disclaimerLink = document.getElementById('disclaimerLink');
  const closeDisclaimerBtn = document.getElementById('closeDisclaimerBtn');
  const homeBtn = document.getElementById('homeBtn');

  function updateStatus(){
    scoreEl.textContent = `Score: ${score} / ${NUM_ROUNDS * 10}`;
    roundEl.textContent = `Round: ${round} / ${NUM_ROUNDS}`;
  }
  
  function showDistrictDescription(districtName){
    const descData = window.getDistrictDescription(districtName);
    const rawState = districts[currentIdx]?.state || 'India';
    const state = rawState.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (descData && descData.fact) {
      districtDescriptionEl.textContent = `This district belongs to ${state}, and is known as ${descData.fact}.`;
    } else {
      districtDescriptionEl.textContent = `This district is located in the state of ${state}.`;
    }
    districtDescriptionEl.style.display = 'block';
  }

  /**
   * INITIALIZE: Only called once when the page loads
   */
  function initApp() {
    if (isDataLoaded) return;

    MapModule.init().then(m => {
      const features = (m && m.features) || [];
      districts = features.map((f, i) => ({
        idx: i,
        district: Utils.getDistrictName(f.properties),
        state: Utils.getStateName(f.properties),
        displayName: Utils.getDistrictName(f.properties)
      })).filter(d => d.district);

      isDataLoaded = true;
      resetGameSession(); // Start the first game
    }).catch(err => {
      console.error("Data loading failed", err);
    });
  }

  /**
   * RESET: Clears stats and starts Round 1 without re-fetching GeoJSON
   */
  function resetGameSession(){
    round = 0; 
    score = 0;
    updateStatus();
    districtDescriptionEl.style.display = 'none';
    finalModal.classList.add('hidden'); 
    disclaimerModal.classList.add('hidden');
    
    // Refresh map layout for 40/60 split sizing
    setTimeout(() => { MapModule.map.invalidateSize(); }, 200);

    nextRound();
  }

  function nextRound(){
    hintsUsed = 0;
    nextBtn.disabled = true;
    nextBtn.textContent = "Next Round";
    
    if(round >= NUM_ROUNDS) {
      showFinal();
      return;
    }
    
    round += 1;
    updateStatus();
    currentIdx = Math.floor(Math.random() * districts.length);
    
    MapModule.map.invalidateSize();
    MapModule.highlightDistrict(districts[currentIdx].idx);
    
    showDistrictDescription(districts[currentIdx].displayName);
    renderOptionsFor(currentIdx);
  }

  function renderOptionsFor(idx) {
    optionsEl.innerHTML = '';
    const correct = districts[idx].displayName;
    const currentState = districts[idx].state;
    
    const stateNames = districts.filter(d => d.state === currentState).map(d => d.displayName);
    const wrong = Utils.pickWrongOptions(stateNames, correct, 3);
    const opts = Utils.shuffle([correct, ...wrong]);

    const fragment = document.createDocumentFragment();
    opts.forEach(optText => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = Utils.toTitleCase(optText);
      btn.addEventListener('click', () => handleChoice(btn, optText, correct));
      fragment.appendChild(btn);
    });
    
    const hintBtn = document.createElement('button');
    hintBtn.className = 'opt-btn';
    hintBtn.style.gridColumn = 'span 2';
    hintBtn.innerHTML = '💡 Use Hint';
    hintBtn.addEventListener('click', () => {
        hintsUsed++;
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
        
        if (hintsUsed === 1) {
            MapModule.showAdjoiningDistricts(districts[currentIdx].idx);
            hintBtn.innerHTML = '💡 Hint: Show Names';
        } else {
            MapModule.labelAdjoiningDistricts(districts[currentIdx].idx);
            hintBtn.disabled = true;
            hintBtn.textContent = 'No more hints';
        }
    });
    fragment.appendChild(hintBtn);
    optionsEl.appendChild(fragment);
  }

  function handleChoice(btn, chosen, correct) {
    const children = optionsEl.querySelectorAll('.opt-btn');
    children.forEach(c => { c.disabled = true; c.classList.add('disabled'); });

    if (chosen.toUpperCase() === correct.toUpperCase()) {
      btn.classList.add('correct');
      score += 10;
      MapModule.markCorrect(districts[currentIdx].idx);
    } else {
      btn.classList.add('wrong');
      children.forEach(c => {
        if (c.textContent.toUpperCase() === Utils.toTitleCase(correct).toUpperCase()) {
          c.classList.add('correct');
        }
      });
    }
    
    nextBtn.disabled = false;
    if (round === NUM_ROUNDS) {
      nextBtn.textContent = "Finish Game";
    }
  }

  function showFinal(){
    finalModal.classList.remove('hidden');
    
    const percentage = (score / (NUM_ROUNDS * 10)) * 100;
    let title = "";
    let message = "";

    if (percentage === 100) {
      title = "🏆 Perfect 10/10!";
      message = "You're a Geography God! Exceptional knowledge of India.";
    } else if (percentage >= 80) {
      title = "🌟 Great Job!";
      message = `Scored ${score / 10}/10. You really know your map!`;
    } else if (percentage >= 50) {
      title = "📍 Not Bad!";
      message = `Scored ${score / 10}/10. Keep exploring to become a master.`;
    } else {
      title = "🗺️ Keep Exploring!";
      message = `Scored ${score / 10}/10. India is vast, time to learn more!`;
    }

    finalTitle.textContent = title;
    // Using innerHTML to allow the <br> line break
    finalMessage.innerHTML = `<strong>Final Score: ${score}</strong><br>${message}`;
  } 

  // --- Event Listeners ---

  homeBtn.onclick = () => {
    window.location.href = 'https://geoma.in'; 
  };

  disclaimerLink.addEventListener('click', (e) => {
    e.preventDefault();
    disclaimerModal.classList.remove('hidden');
  });

  closeDisclaimerBtn.addEventListener('click', () => {
    disclaimerModal.classList.add('hidden');
  });

  nextBtn.addEventListener('click', nextRound);
  
  document.getElementById('restartBtn').addEventListener('click', () => {
    MapModule.resetStyles();
    resetGameSession(); // Instant Reset
  });

  document.getElementById('modalRestartBtn').addEventListener('click', () => {
    MapModule.resetStyles();
    resetGameSession(); // Instant Reset
  });

  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    finalModal.classList.add('hidden');
  });

  // Start initialization
  initApp();

})(window);