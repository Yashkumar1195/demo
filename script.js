/* Escape the Hacker's Network — dependency-free, offline browser prototype.
   Open index.html directly. All links and attachments are fictional simulations. */
(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const STORAGE_KEY = 'escape-hackers-network-v1';
  const SAVE_VERSION = 1;
  const FAST_LIMIT = 165;

  // Fictional training samples: no URL is navigable and no attachment executes.
  const EMAILS = [
    {
      id: 1, subject: 'Urgent Account Suspension', sender: 'security@paypa1-update.com',
      senderName: 'PayPal Account Security', replyTo: 'verify@paypa1-update.com', phishing: true,
      body: 'Dear customer,\n\nYour payment account will be suspended in 30 minutes. We detected unusual activity and need you to verify your identity immediately.\n\nUse the secure verification button below and enter your account password to prevent suspension. Failure to act will permanently restrict your account.\n\nAccount Security Team',
      displayLink: 'Verify my PayPal account', destination: 'https://paypa1-update.com/account/verify', attachment: 'None',
      observations: ['The sender domain contains the digit “1” in “paypa1”.', 'The message gives a 30-minute deadline and asks for a password.', 'The verification destination is paypa1-update.com.'],
      explanation: 'paypa1-update.com uses a look-alike domain: the digit 1 replaces the letter l. The urgent suspension warning and credential request are phishing red flags.',
      hint3: 'This email is phishing: the sender is impersonating PayPal with a look-alike domain and an urgent verification request.'
    },
    {
      id: 2, subject: 'Corporate Bonus Announcement', sender: 'hr-rewards@company-internal.net.ru',
      senderName: 'ACME Corporate Rewards', replyTo: 'bonus-team@company-internal.net.ru', phishing: true,
      body: 'Hello team,\n\nCongratulations! You qualify for a special corporate performance bonus. Download and open the attached bonus statement to confirm your payment details.\n\nThis reward is available only today. If your computer displays a security warning, click Run anyway to finish the approval.\n\nCorporate HR Rewards',
      displayLink: 'Corporate rewards portal', destination: 'https://company-internal.net.ru/rewards', attachment: 'Bonus_Statement.pdf.exe',
      observations: ['The sender ends in company-internal.net.ru, rather than acme-corp.com.', 'The attachment has a final .exe extension after .pdf.', 'The sender uses corporate HR branding and asks you to bypass a security warning.'],
      explanation: 'The sender uses an external look-alike corporate identity. Bonus_Statement.pdf.exe is an executable, not a PDF. Never run an unexpected attachment or bypass a warning to claim a reward.',
      hint3: 'This email is phishing: it impersonates corporate HR from a suspicious external domain and includes an executable attachment.'
    },
    {
      id: 3, subject: 'Cloud Storage Shared Document', sender: 'notifications@onedrive-secure-share.info',
      senderName: 'OneDrive Document Sharing', replyTo: 'sharing@onedrive-secure-share.info', phishing: true,
      body: 'A document has been shared with you.\n\nYour colleague has invited you to review “Project Budget — Final”. Sign in with your work email and password to view the document.\n\nFor security, this sharing link expires soon. Please use the link below to continue.\n\nCloud Sharing Notifications',
      displayLink: 'https://onedrive.live.com/shared/Project-Budget', destination: 'https://onedrive-secure-share.info/redirect?target=work-login', attachment: 'None — online document invitation',
      observations: ['The visible link says onedrive.live.com.', 'The actual destination begins onedrive-secure-share.info.', 'The sender uses an .info domain and requests a work-account sign-in.'],
      explanation: 'The displayed OneDrive address hides a different destination. onedrive-secure-share.info is a suspicious impersonation domain; the fake redirect is designed to collect your work credentials.',
      hint3: 'This email is phishing: it impersonates OneDrive, and the actual redirect destination does not match the visible link.'
    },
    {
      id: 4, subject: 'Legitimate IT Maintenance Notice', sender: 'it-helpdesk@acme-corp.com',
      senderName: 'ACME IT Helpdesk', replyTo: 'it-helpdesk@acme-corp.com', phishing: false,
      body: 'Hello colleagues,\n\nScheduled intranet maintenance will take place on Saturday from 10:00 to 11:00. Some internal services may be briefly unavailable.\n\nNo action is required. IT will never ask you to send your password by email. You can review the maintenance schedule on our usual internal intranet.\n\nThank you,\nACME IT Helpdesk',
      displayLink: 'https://intranet.acme-corp.com/maintenance', destination: 'https://intranet.acme-corp.com/maintenance', attachment: 'None',
      observations: ['The sender and Reply-To use the expected acme-corp.com domain.', 'The visible link and destination both use the internal intranet.', 'This notice requests no password, payment, download, or urgent action.'],
      explanation: 'This training email is legitimate: its sender uses the expected internal domain, its link goes to the internal intranet, and it requests no urgent credentials. In real email, verify authentication and context too; a display address alone is not proof.',
      hint3: 'This email is legitimate in this scenario: the sender and link use the expected internal domain, and no urgent credential request is made.'
    },
    {
      id: 5, subject: 'CEO Urgent Gift Card Request', sender: 'ceo.office9942@gmail.com',
      senderName: 'ACME Chief Executive', replyTo: 'ceo.office9942@gmail.com', phishing: true,
      body: 'I am in a confidential meeting and need your help right away.\n\nPlease purchase five gift cards for a client appreciation event. Send me clear photos of the redemption codes by replying to this email. I will reimburse you later.\n\nDo not call me or discuss this with anyone. It is urgent.\n\nSent from my phone,\nCEO',
      displayLink: 'No link — reply with gift-card codes', destination: 'None', attachment: 'None',
      observations: ['The sender uses gmail.com instead of the company domain.', 'The request asks for gift-card redemption codes and promises reimbursement.', 'The sender demands urgency, secrecy, and no phone verification.'],
      explanation: 'This is CEO impersonation. A public email address, an urgent gift-card request, and instructions to avoid verification are strong warning signs. Verify unusual requests through a known, separate contact channel.',
      hint3: 'This email is phishing: it impersonates the CEO using a public email provider and requests gift-card codes urgently.'
    }
  ];

  const ZONE_DATA = [
    ['A', 'Phishing Detective', 'Email threat analysis'],
    ['B', 'Password Fortress', 'Credential security'],
    ['C', 'Malware Hunter', 'Threat containment'],
    ['D', 'Network Defender', 'Network protection'],
    ['E', 'Social Engineering', 'Human threat detection'],
    ['F', 'Final Hacker Showdown', 'Confront ZERO']
  ];

  const GameState = {
    data: null,
    running: false,
    create(settings) {
      return {
        version: SAVE_VERSION, started: false, currentLevel: 1, screen: 'room', score: 0,
        health: 100, selectedEmail: 0, correctAnswers: 0, elapsed: 0,
        emails: EMAILS.map(() => ({ decision: null, correct: null, inspected: false, opened: false, hintTier: 0 })),
        phishingComplete: false, phishingPassed: false, fastBonus: false, phishingBaseScore: 0,
        badge: false, evidence: false, lockerOpened: false, keycard: false,
        passwordComplete: false, unlockedZones: ['A'], notes: '',
        player: { x: 31, y: 77 },
        settings: { sound: true, reducedEffects: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false, ...settings }
      };
    },
    reset() {
      const settings = { ...this.data.settings };
      this.data = this.create(settings);
      this.data.started = true;
      this.running = true;
      Player.clear();
      PasswordLevel.clear();
      Storage.save();
    }
  };

  // Save only bounded, known fields. A password never enters GameState or Storage.
  const Storage = {
    available: true,
    load() {
      const fresh = GameState.create();
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (!parsed || parsed.version !== SAVE_VERSION) return fresh;
        const number = (n, fallback, min, max) => Number.isFinite(n) ? clamp(n, min, max) : fallback;
        fresh.settings.sound = typeof parsed.settings?.sound === 'boolean' ? parsed.settings.sound : fresh.settings.sound;
        fresh.settings.reducedEffects = typeof parsed.settings?.reducedEffects === 'boolean' ? parsed.settings.reducedEffects : fresh.settings.reducedEffects;
        fresh.started = parsed.started === true;
        fresh.score = Math.trunc(number(parsed.score, 0, -99999, 999999));
        fresh.health = number(parsed.health, 100, 0, 100);
        fresh.selectedEmail = Math.trunc(number(parsed.selectedEmail, 0, 0, 4));
        fresh.elapsed = number(parsed.elapsed, 0, 0, 86400);
        fresh.phishingBaseScore = Math.trunc(number(parsed.phishingBaseScore, 0, -99999, 999999));
        if (Array.isArray(parsed.emails) && parsed.emails.length === 5) {
          fresh.emails = parsed.emails.map((entry, index) => {
            const item = entry && typeof entry === 'object' ? entry : {};
            const decision = ['phishing', 'legitimate'].includes(item.decision) ? item.decision : null;
            return {
              decision, correct: decision === null ? null : (decision === 'phishing') === EMAILS[index].phishing,
              inspected: item.inspected === true, opened: item.opened === true,
              hintTier: Math.trunc(number(item.hintTier, 0, 0, 3))
            };
          });
        }
        fresh.correctAnswers = fresh.emails.filter(email => email.correct === true).length;
        fresh.phishingComplete = fresh.emails.every(email => email.decision !== null);
        fresh.phishingPassed = fresh.phishingComplete && fresh.correctAnswers >= 4;
        fresh.fastBonus = fresh.phishingPassed && parsed.fastBonus === true;
        fresh.badge = fresh.phishingPassed && parsed.badge === true;
        fresh.passwordComplete = fresh.badge && parsed.passwordComplete === true;
        fresh.evidence = parsed.evidence === true;
        fresh.lockerOpened = parsed.lockerOpened === true;
        fresh.keycard = fresh.passwordComplete;
        fresh.notes = typeof parsed.notes === 'string' ? parsed.notes.slice(0, 4000) : '';
        fresh.player = {
          x: number(parsed.player?.x, 31, 12, 88), y: number(parsed.player?.y, 77, 42, 84)
        };
        fresh.unlockedZones = fresh.badge ? ['A', 'B'] : ['A'];
        fresh.currentLevel = fresh.badge ? 2 : 1;
        const validScreens = ['room', 'phishing', 'phishing-result', 'password', 'demo'];
        fresh.screen = validScreens.includes(parsed.screen) ? parsed.screen : 'room';
        if (fresh.screen === 'password' && !fresh.badge) fresh.screen = 'room';
        if (fresh.screen === 'demo' && !fresh.passwordComplete) fresh.screen = 'room';
        if (fresh.screen === 'phishing-result' && !fresh.phishingComplete) fresh.screen = 'phishing';
        return fresh;
      } catch (_) {
        this.available = false;
        return fresh;
      }
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(GameState.data));
        this.available = true;
      } catch (_) { this.available = false; }
      UI.updateContinue();
    }
  };

  // Short oscillator sounds begin only after a user gesture; failures are harmless.
  const Audio = {
    context: null,
    unlock() {
      if (!GameState.data.settings.sound) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context ||= new AudioContext();
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      } catch (_) { /* Browser audio restrictions do not block gameplay. */ }
    },
    play(type = 'click') {
      if (!GameState.data.settings.sound) return;
      this.unlock();
      if (!this.context || this.context.state !== 'running') return;
      const sequences = {
        click: [[720, .055]], correct: [[620, .09], [930, .13]], wrong: [[180, .11], [125, .15]],
        door: [[240, .11], [440, .11], [660, .11], [880, .2]],
        warning: [[240, .1], [190, .12]], complete: [[523, .12], [659, .12], [784, .12], [1047, .25]]
      };
      try {
        let time = this.context.currentTime;
        for (const [frequency, duration] of sequences[type] || sequences.click) {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = type === 'wrong' || type === 'warning' ? 'triangle' : 'sine';
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(.045, time + .012);
          gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
          oscillator.connect(gain);
          gain.connect(this.context.destination);
          oscillator.start(time);
          oscillator.stop(time + duration + .02);
          time += duration + .035;
        }
      } catch (_) { /* Keep audio optional. */ }
    },
    toggle() {
      GameState.data.settings.sound = !GameState.data.settings.sound;
      UI.applySettings();
      Storage.save();
      if (GameState.data.settings.sound) this.play('click');
    }
  };

  const Dialogue = {
    say(message, status = 'SECURE CHANNEL · AIRI ONLINE') {
      $('#airi-message').textContent = message;
      $('#airi-status').textContent = status;
    },
    intro() {
      this.say('ZERO has breached the perimeter. Find the main terminal. We need your eyes on five incoming emails.');
      UI.modal('AIRI // Connection established', `<div class="dialogue-intro"><svg class="intro-portrait" aria-hidden="true"><use href="#airi-portrait"></use></svg><p>Welcome, analyst. ZERO has trapped us inside the network. Investigate the command center, secure the email terminal, and earn clearance to the Password Fortress.</p></div><p class="muted">Move with WASD / arrow keys. Get close and press E, or click a highlighted object. On mobile, use the direction pad.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">ENTER COMMAND CENTER ${icon('arrow')}</button></div>`);
    },
    terminal() {
      this.say("I've detected several suspicious emails. Let's investigate them before ZERO gains access.");
      UI.modal('AIRI // Incoming threat analysis', `<p class="modal-lead">“I've detected several suspicious emails. Let's investigate them before ZERO gains access.”</p><div class="briefing-grid"><div class="chip">5 EMAILS</div><div class="chip">4 CORRECT TO PASS</div><div class="chip">+25 FOR INVESTIGATION</div></div><p class="muted">Inspect the sender, link, and attachment. Report suspicious messages; choose Ignore for the legitimate notice. All content stays inside this training simulation.</p><div class="modal-actions"><button class="btn btn-primary" data-action="begin-phishing">BEGIN PHISHING INVESTIGATION ${icon('arrow')}</button></div>`);
    }
  };

  const Scoring = {
    add(points) {
      GameState.data.score += points;
      UI.hud();
    },
    accuracy() {
      const answered = GameState.data.emails.filter(email => email.decision !== null).length;
      return answered ? Math.round(GameState.data.correctAnswers / answered * 100) : 0;
    },
    format(score = GameState.data.score) {
      return score < 0 ? `−${String(Math.abs(score)).padStart(4, '0')}` : String(score).padStart(4, '0');
    }
  };

  const Player = {
    keys: new Set(),
    touch: new Set(),
    lastDirection: 1,
    clear() { this.keys.clear(); this.touch.clear(); $('#player')?.classList.remove('is-moving'); },
    update(delta) {
      if (!GameState.running || GameState.data.screen !== 'room' || UI.isModalOpen() || document.hidden) return;
      const down = key => this.keys.has(key) || this.touch.has(key);
      let x = Number(down('d') || down('arrowright') || down('right')) - Number(down('a') || down('arrowleft') || down('left'));
      let y = Number(down('s') || down('arrowdown') || down('down')) - Number(down('w') || down('arrowup') || down('up'));
      const moving = Boolean(x || y);
      $('#player').classList.toggle('is-moving', moving);
      if (moving) {
        const magnitude = Math.hypot(x, y);
        x /= magnitude; y /= magnitude;
        GameState.data.player.x = clamp(GameState.data.player.x + x * delta * 28, 12, 88);
        GameState.data.player.y = clamp(GameState.data.player.y + y * delta * 35, 42, 84);
        if (x) this.lastDirection = x > 0 ? 1 : -1;
        this.render();
        Interaction.updatePrompt();
      }
    },
    render() {
      const element = $('#player');
      element.style.left = `${GameState.data.player.x}%`;
      element.style.top = `${GameState.data.player.y}%`;
      element.style.setProperty('--facing', this.lastDirection);
    }
  };

  const Interaction = {
    objects: {
      terminal: { x: 49, y: 44, name: 'MAIN TERMINAL' },
      door: { x: 86, y: 50, name: 'SECURITY DOOR' },
      clue: { x: 20, y: 69, name: 'EVIDENCE CACHE' },
      locker: { x: 13, y: 47, name: 'LOCKER' }
    },
    nearest() {
      const { x, y } = GameState.data.player;
      return Object.entries(this.objects).map(([id, object]) => ({ id, ...object, distance: Math.hypot((object.x - x) * 1.1, object.y - y) })).sort((a, b) => a.distance - b.distance)[0];
    },
    updatePrompt() {
      const nearby = this.nearest();
      const prompt = $('#interact-prompt');
      const visible = GameState.running && GameState.data.screen === 'room' && nearby.distance <= 20;
      prompt.hidden = !visible;
      if (visible) {
        const touch = window.matchMedia?.('(pointer: coarse)').matches;
        prompt.innerHTML = `<span class="keycap">${touch ? 'TAP' : 'E'}</span> INTERACT <span class="muted">${nearby.name}</span>`;
        prompt.dataset.object = nearby.id;
      }
      $$('[data-object]', $('#room')).forEach(object => object.classList.toggle('is-nearby', visible && object.dataset.object === nearby.id));
    },
    interactNearest() {
      const nearby = this.nearest();
      if (nearby.distance <= 20) this.activate(nearby.id);
      else UI.toast('Move closer to a highlighted object, or click it to interact.');
    },
    activate(id) {
      if (!GameState.running || GameState.data.screen !== 'room') return;
      Player.clear();
      // Pointer interaction brings the player to the selected station.
      if (this.objects[id]) {
        GameState.data.player = { x: this.objects[id].x, y: Math.min(84, this.objects[id].y + 9) };
        Player.render();
        this.updatePrompt();
      }
      Audio.play();
      switch (id) {
        case 'terminal':
          if (GameState.data.phishingComplete) PhishingLevel.showResult();
          else if (GameState.data.emails.some(email => email.decision !== null || email.inspected)) PhishingLevel.begin();
          else Dialogue.terminal();
          break;
        case 'door':
          if (!GameState.data.badge) {
            Dialogue.say('That door needs Security Clearance 1. Secure the email terminal first.');
            UI.toast('SECURITY CLEARANCE REQUIRED. Complete Phishing Detective.', 'danger');
            Audio.play('warning');
          } else if (GameState.data.passwordComplete) PasswordLevel.showComplete();
          else PasswordLevel.begin();
          break;
        case 'clue':
          GameState.data.evidence = true;
          UI.hud(); Storage.save();
          UI.modal('Evidence acquired // trusted domain', `<div class="evidence-card">${icon('evidence')}<p class="eyebrow">ACME SECURITY POLICY</p><h3>Know your trusted domain.</h3><p>Your organization uses <strong>acme-corp.com</strong>. Its intranet is <strong>intranet.acme-corp.com</strong>.</p><p>Unexpected credential requests, disguised executables, look-alike URLs, and urgent gift-card requests deserve independent verification.</p></div><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">ADD TO EVIDENCE ${icon('check')}</button></div>`);
          Dialogue.say('Evidence logged. Compare the exact sender domain and destination, not just the logo or display name.');
          break;
        case 'locker':
          GameState.data.lockerOpened = true;
          UI.hud(); Storage.save();
          UI.modal('Security locker // field guide', `<p class="eyebrow">ANALYST TRAINING EQUIPMENT</p><h3>A good investigation starts with a second look.</h3><p>Use <strong>Inspect</strong> before deciding to earn a one-time +25 investigation bonus for each email. <strong>Evidence</strong> keeps your discoveries; <strong>Notes</strong> saves your own observations.</p><p>Correct classifications earn +100 points. Wrong classifications cost 25 points. You need at least 4 correct answers to earn your Security Badge.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">FIELD GUIDE COLLECTED ${icon('check')}</button></div>`);
          break;
      }
    }
  };

  const UI = {
    toastTimeout: null,
    lastFocus: null,
    isModalOpen() { return $('#main-modal').open; },
    modal(title, body) {
      Player.clear();
      const dialog = $('#main-modal');
      if (!dialog.open) this.lastFocus = document.activeElement;
      $('#modal-content').innerHTML = `<p class="eyebrow">SECURE SYSTEM INTERFACE</p><h2 class="modal-title" id="modal-title">${escapeHTML(title)}</h2>${body}`;
      dialog.setAttribute('aria-labelledby', 'modal-title');
      if (!dialog.open) dialog.showModal();
      const focusTarget = $('button, input, textarea, [tabindex="0"]', $('#modal-content')) || $('#modal-close');
      focusTarget?.focus();
    },
    closeModal() {
      const dialog = $('#main-modal');
      if (dialog.open) dialog.close();
    },
    toast(message, type = '') {
      const toast = $('#toast');
      toast.textContent = message;
      toast.hidden = false;
      toast.className = `toast is-visible${type ? ` is-${type}` : ''}`;
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => { toast.hidden = true; toast.classList.remove('is-visible'); }, 4400);
    },
    updateContinue() {
      const button = $('#continue-game');
      if (button) button.hidden = !GameState.data?.started;
    },
    applySettings() {
      const { sound, reducedEffects } = GameState.data.settings;
      document.body.classList.toggle('reduced-effects', reducedEffects);
      const button = $('#mute-button');
      button.innerHTML = icon(sound ? 'volume' : 'muted');
      button.setAttribute('aria-label', sound ? 'Mute sound' : 'Enable sound');
      button.setAttribute('aria-pressed', String(!sound));
      button.title = sound ? 'Sound on — click to mute' : 'Sound off — click to enable';
    },
    hud() {
      const state = GameState.data;
      $('#player-level').textContent = `LV. ${state.currentLevel}`;
      $('#health-fill').style.width = `${state.health}%`;
      $('#health-label').textContent = `${state.health}% SECURE`;
      $('#score-value').textContent = Scoring.format();
      const remaining = Math.max(0, FAST_LIMIT - Math.floor(state.elapsed));
      $('#timer-value').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      $('#timer-value').classList.toggle('danger', remaining <= 30 && !state.phishingComplete);
      $('#timer-value').title = 'Phishing speed bonus timer. Expiry does not end the investigation.';
      const objective = state.passwordComplete ? 'Zone B secured. Prototype mission complete.' : state.screen === 'password' ? 'Create a Fortress password to unlock the door.' : state.badge ? 'Enter the security door to reach Password Fortress.' : state.phishingComplete ? (state.phishingPassed ? 'Claim your Security Badge and unlock Zone B.' : 'Review the evidence and retry the investigation.') : 'Investigate the suspicious emails.';
      $('#objective-text').textContent = objective;
      const items = [];
      if (state.evidence) items.push(`${icon('evidence')} Evidence`);
      if (state.lockerOpened) items.push(`${icon('notes')} Field guide`);
      if (state.badge) items.push(`${icon('shield')} Security Badge`);
      if (state.keycard) items.push(`${icon('key')} Keycard`);
      $('#inventory-items').innerHTML = items.length ? items.map(item => `<span class="inventory-item">${item}</span>`).join('') : '<span class="inventory-empty">No items yet · explore the room</span>';
      $('#door-object').classList.toggle('unlocked', state.badge);
      $('#door-object').classList.toggle('open', state.passwordComplete);
      $('#zone-b-label').textContent = state.passwordComplete ? 'ZONE B · SECURED' : state.badge ? 'ZONE B · CLEARANCE GRANTED' : 'ZONE B · RESTRICTED';
      $('#room-status').textContent = state.passwordComplete ? 'NETWORK STABLE · ZONE B SECURED' : state.badge ? 'CLEARANCE 1 GRANTED · PASSWORD FORTRESS AVAILABLE' : 'SYSTEM UNDER ATTACK · TERMINAL REQUIRES INVESTIGATION';
      Zones.update();
    },
    setScreen(screen, save = true) {
      GameState.data.screen = screen;
      Player.clear();
      $('#room-screen').hidden = screen !== 'room';
      $('#challenge-screen').hidden = screen === 'room';
      this.hud();
      if (screen === 'room') {
        Player.render(); Interaction.updatePrompt();
      }
      if (save) Storage.save();
    },
    start() {
      this.closeModal();
      GameState.reset();
      $('#menu').hidden = true;
      $('#game').hidden = false;
      this.applySettings();
      this.setScreen('room');
      Dialogue.intro();
      Audio.play('complete');
      Hacker.reset();
    },
    resume() {
      this.closeModal();
      GameState.running = true;
      $('#menu').hidden = true;
      $('#game').hidden = false;
      this.applySettings();
      const screen = GameState.data.screen;
      if (screen === 'phishing') PhishingLevel.render();
      else if (screen === 'phishing-result') PhishingLevel.showResult(false);
      else if (screen === 'password') PasswordLevel.begin();
      else if (screen === 'demo') PasswordLevel.showComplete();
      else this.setScreen('room');
      Dialogue.say(GameState.data.passwordComplete ? 'Welcome back. Both training systems are secured.' : 'Session restored. Your investigation progress and score are saved.');
      Hacker.reset();
      this.toast('SESSION RESTORED. Continue your mission.', 'success');
    },
    menu() {
      this.closeModal(); Player.clear(); PasswordLevel.clear();
      GameState.running = false;
      Storage.save();
      $('#game').hidden = true;
      $('#menu').hidden = false;
      $('#hacker-notice').hidden = true;
      $('[data-action="continue"]', $('#menu'))?.focus();
    },
    room() {
      this.closeModal(); PasswordLevel.clear();
      this.setScreen('room');
      Dialogue.say(GameState.data.badge ? 'Your badge has unlocked the next security checkpoint. Head to the door on the right.' : 'Explore the room, gather evidence, then investigate the main terminal.');
    },
    settings() {
      const settings = GameState.data.settings;
      this.modal('Settings', `<div class="setting-row"><div><strong>Sound effects</strong><p class="muted">Short, synthesized interface sounds.</p></div><label class="switch"><input type="checkbox" id="setting-sound" ${settings.sound ? 'checked' : ''} aria-label="Sound effects"><span></span></label></div><div class="setting-row"><div><strong>Reduced effects</strong><p class="muted">Reduce motion, scanlines, and glitch effects.</p></div><label class="switch"><input type="checkbox" id="setting-effects" ${settings.reducedEffects ? 'checked' : ''} aria-label="Reduced effects"><span></span></label></div><p class="muted">Changes save automatically on this browser.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">DONE ${icon('check')}</button></div>`);
    },
    about() {
      this.modal('About the mission', `<p class="modal-lead">An interactive cybersecurity learning experience where players investigate phishing, strengthen passwords, and defend the network.</p><p>You are a security analyst trapped in a futuristic command center. With AIRI's guidance, identify ZERO's phishing attempts and secure the Password Fortress.</p><p class="muted">Playable prototype: Levels 1–2. Levels 3–6 are planned. Built with HTML, CSS, SVG, and vanilla JavaScript. Works offline with no server.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">BACK TO MISSION ${icon('arrow')}</button></div>`);
    },
    resetPrompt() {
      this.modal('Reset the demo?', '<p>This clears the current score, email decisions, collected items, notes, and zone progression. Your sound and effects settings are kept.</p><div class="modal-actions"><button class="btn btn-ghost" data-action="close-modal">CANCEL</button><button class="btn btn-danger" data-action="confirm-reset">RESET DEMO</button></div>');
    },
    notes() {
      this.modal('Analyst notes', `<p class="muted">Record your clues. Notes save automatically on this browser.</p><label class="field" for="analyst-notes">INVESTIGATION JOURNAL</label><textarea id="analyst-notes" maxlength="4000" rows="7" placeholder="What looks suspicious? Which domain should be trusted?">${escapeHTML(GameState.data.notes)}</textarea><p class="muted" id="notes-status">${GameState.data.notes.length}/4000 characters · saved locally${Storage.available ? '' : ' (storage unavailable; session only)'}</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">SAVE & CLOSE ${icon('check')}</button></div>`);
    },
    evidence() {
      const state = GameState.data;
      const inspected = state.emails.map((item, index) => ({ ...item, index })).filter(item => item.inspected);
      this.modal('Evidence archive', `<p class="eyebrow">${inspected.length}/5 MESSAGES INVESTIGATED</p>${state.evidence ? '<div class="evidence-card"><strong>Trusted domain reference</strong><p>ACME uses acme-corp.com and intranet.acme-corp.com. Verify unusual requests through a separate, known channel.</p></div>' : '<p class="muted">Collect the glowing evidence cache in the command center for a trusted-domain reference.</p>'}${inspected.length ? inspected.map(item => `<div class="evidence-entry"><h3>${escapeHTML(EMAILS[item.index].subject)}</h3><p>${escapeHTML(EMAILS[item.index].observations[0])}</p>${item.decision ? `<span class="chip ${item.correct ? 'success' : 'danger'}">${EMAILS[item.index].phishing ? 'PHISHING' : 'LEGITIMATE'} · ${item.correct ? 'CORRECTLY CLASSIFIED' : 'REVIEWED'}</span>` : '<span class="chip">AWAITING DECISION</span>'}</div>`).join('') : '<p>No message evidence yet. Inspect an email to add its header details here.</p>'}<div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">RETURN ${icon('arrow')}</button></div>`);
    },
    scan() {
      if (GameState.data.screen === 'phishing') {
        const email = EMAILS[GameState.data.selectedEmail];
        UI.toast('SCAN COMPLETE. Header, destination, and attachment are ready for inspection.');
        Dialogue.say(`Scan complete for “${email.subject}”. Open Inspect to compare the message details before deciding.`);
        $('.email-detail')?.classList.add('is-scanning');
        setTimeout(() => $('.email-detail')?.classList.remove('is-scanning'), 1000);
      } else if (GameState.data.screen === 'password') {
        Dialogue.say('The checkpoint checks seven password rules locally. Your practice password is never saved.');
        UI.toast('SCAN COMPLETE. Satisfy all seven rules to reach FORTRESS.');
      } else {
        UI.toast('SCAN COMPLETE. Main terminal, security door, evidence cache, and locker detected.');
        $('#room').classList.add('is-scanning');
        setTimeout(() => $('#room').classList.remove('is-scanning'), 1600);
        Dialogue.say('Four interactive objects detected. Find the evidence cache for the trusted-domain reference.');
      }
    }
  };

  const PhishingLevel = {
    begin() {
      UI.closeModal();
      if (GameState.data.phishingComplete) return this.showResult(false);
      this.render();
      Dialogue.say("Let's check the email headers for suspicious patterns. Our expected internal domain is acme-corp.com.");
    },
    render() {
      UI.setScreen('phishing', false);
      const state = GameState.data;
      const email = EMAILS[state.selectedEmail];
      const progress = state.emails[state.selectedEmail];
      const completed = state.emails.filter(item => item.decision !== null).length;
      $('#challenge-content').innerHTML = `
        <header class="challenge-header"><div><p class="eyebrow">ZONE A / ACTIVE INVESTIGATION</p><h1>PHISHING <span>DETECTIVE</span></h1><p class="muted">Trace the sender. Inspect the evidence. Make the call.</p></div><button class="btn btn-ghost" data-action="room">${icon('arrow')} COMMAND CENTER</button></header>
        <div class="stats-row"><span>${icon('mail')} REVIEWED <strong>${completed}/5</strong></span><span>CORRECT <strong>${state.correctAnswers}/5</strong></span><span>ACCURACY <strong>${Scoring.accuracy()}%</strong></span><span class="muted">4 correct to pass · speed bonus +50</span></div>
        <div class="phishing-layout"><aside class="inbox-panel panel"><div class="inbox-heading"><h2>INBOX <span class="email-count">(5)</span></h2><span class="live-dot"></span></div><p class="inbox-caption muted">ACME CORP · SECURE MAIL ANALYSIS</p><div class="email-list" role="list" aria-label="Investigation emails">${EMAILS.map((item, index) => {
          const entry = state.emails[index];
          return `<button class="email-item ${index === state.selectedEmail ? 'is-selected' : ''} ${entry.decision ? 'is-complete' : ''}" data-email="${index}" aria-pressed="${index === state.selectedEmail}"><span class="email-index">${String(index + 1).padStart(2, '0')}</span><span class="email-summary"><strong>${escapeHTML(item.subject)}</strong><span>${escapeHTML(item.sender)}</span></span><span class="email-state ${entry.decision ? (entry.correct ? 'success' : 'danger') : ''}">${entry.decision ? icon(entry.correct ? 'check' : 'close') : icon('mail')}</span></button>`;
        }).join('')}</div><div class="inbox-footer"><span class="chip">${icon('shield')} SANDBOX ACTIVE</span><p class="muted">Links and attachments are inert training samples.</p></div></aside>
        <article class="email-detail panel"><div class="email-topline"><span class="eyebrow">MESSAGE ${state.selectedEmail + 1} OF 5</span><span class="chip">${progress.decision ? 'REVIEW COMPLETE' : 'AWAITING ANALYSIS'}</span></div><h2>${escapeHTML(email.subject)}</h2><dl class="email-meta"><div><dt>FROM</dt><dd>${escapeHTML(email.senderName)} <span>&lt;${escapeHTML(email.sender)}&gt;</span></dd></div><div><dt>SUBJECT</dt><dd>${escapeHTML(email.subject)}</dd></div></dl><div class="email-body"><span class="field">BODY</span><p>${escapeHTML(email.body).replace(/\n/g, '<br>')}</p></div><div class="email-link"><span class="field">LINK</span><span>${escapeHTML(email.displayLink)}</span></div><div class="attachment"><span class="field">ATTACHMENT</span><span>${escapeHTML(email.attachment)}</span></div>
        <div class="email-actions"><button class="btn btn-ghost" data-action="open-email">${icon('mail')} OPEN</button><button class="btn btn-ghost" data-action="inspect-email">${icon('search')} ${progress.inspected ? 'INSPECTED' : 'INSPECT'}</button><button class="btn btn-danger" data-action="report-email" ${progress.decision ? 'disabled' : ''}>${icon('shield')} REPORT PHISHING</button><button class="btn btn-primary" data-action="ignore-email" ${progress.decision ? 'disabled' : ''}>${icon('check')} IGNORE <small>(LEGITIMATE)</small></button></div>
        ${progress.inspected ? this.inspectionHTML(email, progress) : '<p class="decision-tip muted">Investigate before deciding: Inspect earns +25 once per message. Ignore means you classify the message as legitimate.</p>'}
        ${progress.decision ? this.feedbackHTML(email, progress) : ''}
        </article></div>`;
      UI.hud();
      Storage.save();
    },
    inspectionHTML(email, progress) {
      return `<section class="inspection-panel"><div class="inspection-heading"><h3>${icon('search')} HEADER INSPECTION</h3><span class="chip success">+25 INVESTIGATION RECORDED</span></div><dl class="inspection-grid"><div class="inspection-row"><dt>Sender header</dt><dd>${escapeHTML(email.sender)}</dd></div><div class="inspection-row"><dt>Reply-To</dt><dd>${escapeHTML(email.replyTo)}</dd></div><div class="inspection-row"><dt>Link destination</dt><dd>${escapeHTML(email.destination)}</dd></div><div class="inspection-row"><dt>Attachment</dt><dd>${escapeHTML(email.attachment)}</dd></div></dl><h4>${progress.decision ? 'EVIDENCE & RED-FLAG REVIEW' : 'OBSERVATIONS · CHECK FOR RED FLAGS'}</h4><ul class="observations">${email.observations.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul><p class="muted">Compare the evidence with the trusted organization before choosing a classification.</p></section>`;
    },
    feedbackHTML(email, progress) {
      return `<section class="feedback ${progress.correct ? 'success' : 'danger'}" role="status"><div class="feedback-heading">${icon(progress.correct ? 'check' : 'close')}<h3>${progress.correct ? (email.phishing ? 'PHISHING DETECTED' : 'LEGITIMATE EMAIL') : 'CLASSIFICATION INCORRECT'}</h3><strong>${progress.correct ? '+100' : '−25'} POINTS</strong></div><p>${escapeHTML(email.explanation)}</p><div class="feedback-footer"><span class="muted">Your decision: ${progress.decision === 'phishing' ? 'Report phishing' : 'Ignore / legitimate'}</span><button class="btn btn-primary" data-action="next-email">${GameState.data.phishingComplete ? 'VIEW RESULTS' : 'NEXT MESSAGE'} ${icon('arrow')}</button></div></section>`;
    },
    select(index) {
      if (!Number.isInteger(index) || index < 0 || index >= EMAILS.length) return;
      GameState.data.selectedEmail = index;
      this.render();
      Dialogue.say(GameState.data.emails[index].decision ? 'This message has been reviewed. Read the explanation or move to the next message.' : 'Compare the actual sender address, link destination, and requested action. Logos and display names can be copied.');
    },
    open() {
      const index = GameState.data.selectedEmail;
      const email = EMAILS[index];
      GameState.data.emails[index].opened = true;
      Storage.save();
      UI.modal('Safe message preview', `<span class="chip">${icon('shield')} ISOLATED TRAINING SANDBOX</span><h3>${escapeHTML(email.subject)}</h3><p>${escapeHTML(email.body).replace(/\n/g, '<br>')}</p><div class="email-link"><span class="field">VISIBLE LINK</span><span>${escapeHTML(email.displayLink)}</span></div><div class="attachment"><span class="field">ATTACHMENT</span><span>${escapeHTML(email.attachment)}</span></div><p class="muted">This preview never opens an external link or executes an attachment. Close it, then use Inspect to review the actual destination.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">RETURN TO ANALYSIS ${icon('arrow')}</button></div>`);
    },
    inspect() {
      const progress = GameState.data.emails[GameState.data.selectedEmail];
      if (!progress.inspected) {
        progress.inspected = true;
        // A completed decision can still be reviewed, but cannot earn a late bonus.
        if (!progress.decision) {
          Scoring.add(25);
          UI.toast('EVIDENCE ANALYZED · +25 INVESTIGATION BONUS', 'success');
        }
      }
      this.render();
      if (progress.decision) {
        const chip = $('.inspection-heading .chip');
        if (chip) chip.textContent = 'EVIDENCE REVIEWED';
      }
      Dialogue.say('Look closely at the sender domain and link destination. Decide using all the evidence together.');
      $('.inspection-panel')?.scrollIntoView({ behavior: GameState.data.settings.reducedEffects ? 'instant' : 'smooth', block: 'nearest' });
    },
    decide(decision) {
      const state = GameState.data;
      if (state.screen !== 'phishing') return;
      const progress = state.emails[state.selectedEmail];
      if (progress.decision) return;
      const email = EMAILS[state.selectedEmail];
      progress.decision = decision;
      progress.correct = (decision === 'phishing') === email.phishing;
      if (progress.correct) state.correctAnswers += 1;
      else state.health = Math.max(0, state.health - 10);
      Scoring.add(progress.correct ? 100 : -25);
      Audio.play(progress.correct ? 'correct' : 'wrong');
      state.phishingComplete = state.emails.every(item => item.decision !== null);
      state.phishingPassed = state.phishingComplete && state.correctAnswers >= 4;
      if (state.phishingPassed && state.elapsed <= FAST_LIMIT && !state.fastBonus) {
        state.fastBonus = true;
        Scoring.add(50);
      }
      this.render();
      Dialogue.say(progress.correct ? 'Good work. Look closely at the sender domain and link destination.' : "Be careful. Something about this message needs a closer look. Read the evidence review before continuing.");
      const feedback = $('.feedback');
      feedback?.scrollIntoView({ behavior: GameState.data.settings.reducedEffects ? 'instant' : 'smooth', block: 'nearest' });
      $('[data-action="next-email"]')?.focus({ preventScroll: true });
    },
    next() {
      if (GameState.data.phishingComplete) return this.showResult();
      const next = GameState.data.emails.findIndex(item => item.decision === null);
      if (next >= 0) this.select(next);
    },
    showResult(playSound = true) {
      const state = GameState.data;
      if (!state.phishingComplete) return this.begin();
      UI.closeModal();
      UI.setScreen('phishing-result');
      const passed = state.phishingPassed;
      $('#challenge-content').innerHTML = `<div class="result-panel panel ${passed ? 'success' : 'danger'}"><div class="result-icon">${icon(passed ? 'check' : 'shield')}</div><p class="eyebrow">${passed ? 'THREAT ANALYSIS COMPLETE' : 'ADDITIONAL TRAINING REQUIRED'}</p><h1>${passed ? 'LEVEL 1 COMPLETE' : 'TERMINAL NOT YET SECURED'}</h1><h2>PHISHING DETECTIVE</h2><p class="muted">${passed ? 'The first terminal is secured. Your next clearance is ready.' : 'You need at least 4 correct classifications. Review the clues and try again.'}</p><div class="result-stats"><div><span>SCORE</span><strong>${Scoring.format()}</strong></div><div><span>CORRECT</span><strong>${state.correctAnswers}/5</strong></div><div><span>ACCURACY</span><strong>${Scoring.accuracy()}%</strong></div></div><div class="result-bonuses"><span class="chip">${icon('search')} ${state.emails.filter(email => email.inspected).length}/5 INVESTIGATED</span><span class="chip ${state.fastBonus ? 'success' : ''}">${state.fastBonus ? '+50 SPEED BONUS' : 'SPEED BONUS NOT EARNED'}</span></div><p class="airi-result"><strong>AIRI</strong> “${passed ? "Great job! You've secured the first terminal." : 'Every mistake is a chance to spot the next attack. Check domains, destinations, and attachments.'}”</p><div class="result-actions">${passed ? `<button class="btn btn-primary" data-action="claim-badge">${state.badge ? 'RETURN TO COMMAND CENTER' : 'CONTINUE'} ${icon('arrow')}</button>` : '<button class="btn btn-primary" data-action="retry-phishing">RETRY INVESTIGATION</button><button class="btn btn-ghost" data-action="review-emails">REVIEW EVIDENCE</button>'}<button class="btn btn-ghost" data-action="room">COMMAND CENTER</button></div>${!passed ? '<p class="muted">Retry resets this investigation’s points, hints, timer, and decisions. Room discoveries stay collected.</p>' : ''}</div>`;
      Dialogue.say(passed ? "Excellent work! You've secured the first terminal." : 'Review the explanations, then retry. You can do this.');
      if (playSound) Audio.play(passed ? 'complete' : 'warning');
      Storage.save();
    },
    retry() {
      const state = GameState.data;
      if (state.badge) return UI.toast('This terminal is already secured. Use Reset Demo for a new mission.');
      state.score = state.phishingBaseScore;
      state.emails = EMAILS.map(() => ({ decision: null, correct: null, inspected: false, opened: false, hintTier: 0 }));
      state.correctAnswers = 0; state.selectedEmail = 0; state.elapsed = 0;
      state.phishingComplete = false; state.phishingPassed = false; state.fastBonus = false; state.health = 100;
      this.begin();
      UI.toast('INVESTIGATION RESTARTED. Previous attempt points cleared.');
    },
    claimBadge() {
      if (!GameState.data.phishingPassed) return;
      const wasClaimed = GameState.data.badge;
      GameState.data.badge = true;
      GameState.data.currentLevel = 2;
      GameState.data.unlockedZones = ['A', 'B'];
      UI.room(); Storage.save();
      if (!wasClaimed) {
        Audio.play('door');
        UI.modal('Security Clearance 1 granted', `<div class="result-icon">${icon('shield')}</div><p class="eyebrow success">SECURITY BADGE ACQUIRED</p><h3>ZONE B UNLOCKED</h3><p>Your badge grants access to the Password Fortress checkpoint. Head to the security door on the right, or enter from the zone map.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">CONTINUE TO THE SECURITY DOOR ${icon('arrow')}</button></div>`);
      }
      Dialogue.say('Security Clearance 1 granted. Your badge gives you access to the Password Fortress. Enter the security door.');
    }
  };

  const Hints = {
    costs: [10, 20, 40],
    open() {
      if (GameState.data.screen !== 'phishing') {
        if (GameState.data.screen === 'password') {
          UI.modal('AIRI // Password hint', '<p>Build a long, unique practice passphrase: combine unrelated words, mix uppercase and lowercase, and add a number and symbol.</p><p>This checkpoint also rejects adjacent repeated characters and the blacklist terms password, admin, welcome, and qwerty anywhere in the input.</p><p class="muted">Never enter a real password here. For real accounts, use unique passwords and a password manager; enable MFA where available.</p><div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">GOT IT</button></div>');
        } else {
          Dialogue.say(GameState.data.badge ? 'Head to the security door on the right to enter Password Fortress.' : 'Investigate the main terminal. The glowing evidence cache tells you which internal domain to trust.');
          UI.toast(GameState.data.badge ? 'HINT: Enter the security door or select Zone B.' : 'HINT: Interact with the center terminal to start Level 1.');
        }
        return;
      }
      this.render();
    },
    render() {
      const email = EMAILS[GameState.data.selectedEmail];
      const progress = GameState.data.emails[GameState.data.selectedEmail];
      if (progress.decision) return UI.toast('This message is already classified. Its explanation is available below the email.');
      const hints = ["Check the sender's domain.", 'Look carefully at the link destination.', email.hint3];
      UI.modal('AIRI // Investigation hints', `<p class="eyebrow">CURRENT MESSAGE ONLY · ${escapeHTML(email.subject)}</p><div class="hint-progress">${[0, 1, 2].map(tier => `<span class="chip ${tier < progress.hintTier ? 'success' : ''}">TIER ${tier + 1} · −${this.costs[tier]}</span>`).join('')}</div>${progress.hintTier ? hints.slice(0, progress.hintTier).map((hint, index) => `<div class="hint-panel"><strong>HINT ${index + 1}</strong><p>${escapeHTML(hint)}</p></div>`).join('') : '<p>Hints apply only to this selected message. Each tier reveals more and deducts points once.</p>'}<div class="modal-actions">${progress.hintTier < 3 ? `<button class="btn btn-primary" data-action="buy-hint">REVEAL HINT ${progress.hintTier + 1} <span class="hint-cost">−${this.costs[progress.hintTier]} POINTS</span></button>` : '<span class="chip">ALL HINTS REVEALED</span>'}<button class="btn btn-ghost" data-action="close-modal">BACK TO EMAIL</button></div>`);
    },
    buy() {
      const progress = GameState.data.emails[GameState.data.selectedEmail];
      if (GameState.data.screen !== 'phishing' || progress.decision || progress.hintTier >= 3) return;
      Scoring.add(-this.costs[progress.hintTier]);
      progress.hintTier += 1;
      Storage.save();
      this.render();
    }
  };

  const PasswordLevel = {
    value: '',
    revealing: false,
    unlocking: false,
    unlockTimeout: null,
    ruleNames: ['Minimum 14 characters', 'Uppercase character', 'Lowercase character', 'Number', 'Special character', 'No consecutive duplicate characters', 'Not a common password'],
    evaluate(value) {
      const rules = [
        value.length >= 14,
        /[A-Z]/.test(value),
        /[a-z]/.test(value),
        /[0-9]/.test(value),
        /[^A-Za-z0-9\s]/.test(value),
        value.length > 0 && !/(.)\1/u.test(value),
        value.length > 0 && !['password', 'admin', 'welcome', 'qwerty'].some(word => value.toLowerCase().includes(word))
      ];
      const passed = rules.filter(Boolean).length;
      const fortress = passed === 7;
      let level = 0;
      if (value.length >= 6 && passed >= 3) level = 1;
      if (value.length >= 10 && passed >= 4) level = 2;
      if (value.length >= 14 && passed >= 5) level = 3;
      if (fortress) level = 4;
      return { rules, passed, fortress, level, label: ['VERY WEAK', 'WEAK', 'MEDIUM', 'STRONG', 'FORTRESS'][level] };
    },
    clear() {
      this.value = ''; this.revealing = false;
      const input = $('#password-input');
      if (input) input.value = '';
    },
    begin() {
      if (!GameState.data.badge) return UI.toast('SECURITY CLEARANCE REQUIRED.', 'danger');
      if (GameState.data.passwordComplete) return this.showComplete();
      UI.closeModal();
      this.clear();
      this.unlocking = false;
      UI.setScreen('password');
      $('#challenge-content').innerHTML = `<header class="challenge-header"><div><p class="eyebrow">ZONE B / CREDENTIAL DEFENSE</p><h1>PASSWORD <span>FORTRESS</span></h1><p class="muted">Create a strong password to unlock the next security zone.</p></div><button class="btn btn-ghost" data-action="room">${icon('arrow')} COMMAND CENTER</button></header><div class="password-layout"><section class="password-panel panel"><div class="password-panel-heading">${icon('key')}<span class="eyebrow">IDENTITY VERIFICATION PROTOCOL</span></div><h2>Build your digital defense.</h2><p class="muted">Use a made-up practice password. It stays in memory only and is never saved.</p><label class="field" for="password-input">PRACTICE PASSWORD</label><div class="password-input-wrap"><input id="password-input" type="password" autocomplete="new-password" autocapitalize="none" spellcheck="false" maxlength="128" placeholder="Create a unique practice passphrase" aria-describedby="password-guidance strength-status"><button class="btn btn-ghost password-toggle" data-action="toggle-password" aria-label="Show practice password">SHOW</button></div><p class="muted" id="password-guidance">Meet all seven rules below to achieve Fortress strength.</p><div class="strength-header"><span class="field">SECURITY LEVEL</span><strong class="strength-label" id="strength-label">VERY WEAK</strong></div><div class="strength-meter" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="strength-segment" data-strength="${i}"></span>`).join('')}</div><p id="strength-status" role="status" aria-live="polite">0 of 7 security rules satisfied.</p><ul class="password-rules">${this.ruleNames.map((name, index) => `<li class="rule" data-rule="${index}"><span class="rule-icon" aria-hidden="true">○</span><span>${name}</span><span class="sr-only rule-state">Not met</span></li>`).join('')}</ul><p class="muted password-blacklist">Training blacklist: password · admin · welcome · qwerty (including within longer strings). Adjacent repeated characters are not allowed.</p><button class="btn btn-primary unlock-button" data-action="unlock-door" id="unlock-door" disabled>${icon('lock')} UNLOCK DOOR</button></section><aside class="door-preview panel" id="fortress-door"><div class="door-caption"><span class="eyebrow">RESTRICTED ACCESS</span><h2>ZONE B</h2><p>PASSWORD FORTRESS</p></div><div class="door-visual"><div class="door-leaf door-left"></div><div class="door-leaf door-right"></div><div class="door-core">${icon('lock')}</div><div class="door-light"></div></div><p class="door-state" id="door-state">${icon('lock')} AWAITING FORTRESS CLEARANCE</p><div class="door-info"><span>SECURITY BADGE</span><strong class="success">VERIFIED</strong></div><div class="door-info"><span>PASSWORD PROTOCOL</span><strong id="protocol-state">PENDING</strong></div></aside></div>`;
      Dialogue.say('Create a long, unique practice password. Satisfy every rule to secure this checkpoint.');
      this.update();
      Storage.save();
    },
    update() {
      const evaluation = this.evaluate(this.value);
      const label = $('#strength-label');
      if (!label) return evaluation;
      label.textContent = evaluation.label;
      label.dataset.level = evaluation.level;
      $$('.strength-segment').forEach((segment, index) => {
        segment.classList.toggle('is-active', this.value.length > 0 && index <= evaluation.level);
        segment.dataset.level = evaluation.level;
      });
      $$('.rule').forEach((rule, index) => {
        rule.classList.toggle('is-met', evaluation.rules[index]);
        $('.rule-icon', rule).textContent = evaluation.rules[index] ? '✓' : '○';
        $('.rule-state', rule).textContent = evaluation.rules[index] ? 'Met' : 'Not met';
      });
      $('#strength-status').textContent = evaluation.fortress ? '🔐 SECURITY LEVEL: FORTRESS · Password accepted.' : `${evaluation.passed} of 7 security rules satisfied.`;
      $('#strength-status').classList.toggle('success', evaluation.fortress);
      $('#unlock-door').disabled = !evaluation.fortress || this.unlocking;
      $('#protocol-state').textContent = evaluation.fortress ? 'FORTRESS' : 'PENDING';
      $('#protocol-state').classList.toggle('success', evaluation.fortress);
      $('#door-state').innerHTML = evaluation.fortress ? `${icon('check')} PASSWORD ACCEPTED · READY TO UNLOCK` : `${icon('lock')} AWAITING FORTRESS CLEARANCE`;
      $('#fortress-door').classList.toggle('is-ready', evaluation.fortress);
      return evaluation;
    },
    toggleVisibility() {
      const input = $('#password-input');
      if (!input) return;
      this.revealing = !this.revealing;
      input.type = this.revealing ? 'text' : 'password';
      $('.password-toggle').textContent = this.revealing ? 'HIDE' : 'SHOW';
      $('.password-toggle').setAttribute('aria-label', this.revealing ? 'Hide practice password' : 'Show practice password');
      input.focus();
    },
    unlock() {
      if (this.unlocking || GameState.data.passwordComplete || !this.evaluate(this.value).fortress || GameState.data.screen !== 'password') return;
      this.unlocking = true;
      GameState.data.passwordComplete = true;
      GameState.data.keycard = true;
      // Persist completion before animation so a reload cannot lose progress.
      GameState.data.screen = 'demo';
      Storage.save(); UI.hud();
      $('#fortress-door').classList.add('is-unlocked');
      $('#door-state').innerHTML = `${icon('check')} ACCESS GRANTED · ZONE B UNLOCKED`;
      $('#unlock-door').disabled = true;
      $('#unlock-door').innerHTML = `${icon('check')} ACCESS GRANTED`;
      $('#password-input').disabled = true;
      Dialogue.say('Excellent. The Password Fortress is secured.');
      Audio.play('door');
      UI.toast('ACCESS GRANTED · ZONE B UNLOCKED', 'success');
      this.clear();
      clearTimeout(this.unlockTimeout);
      this.unlockTimeout = setTimeout(() => {
        this.unlocking = false;
        if (GameState.running && GameState.data.passwordComplete && GameState.data.screen === 'demo') this.showComplete();
      }, GameState.data.settings.reducedEffects ? 350 : 1900);
    },
    showComplete() {
      if (!GameState.data.passwordComplete) return this.begin();
      UI.closeModal(); this.clear();
      UI.setScreen('demo');
      $('#challenge-content').innerHTML = `<div class="result-panel panel success demo-result"><div class="result-icon">${icon('shield')}</div><p class="eyebrow">ACCESS GRANTED / ZONE B UNLOCKED</p><h1>PROTOTYPE<br>DEMO COMPLETE</h1><h2>You secured the network perimeter.</h2><p class="muted">More cybersecurity challenges coming in Levels 3–6.</p><div class="result-stats"><div><span>FINAL SCORE</span><strong>${Scoring.format()}</strong></div><div><span>EMAIL ACCURACY</span><strong>${Scoring.accuracy()}%</strong></div><div><span>SECURITY LEVEL</span><strong class="fortress-stat">FORTRESS</strong></div></div><div class="result-bonuses"><span class="chip success">${icon('check')} PHISHING DETECTIVE SECURED</span><span class="chip success">${icon('check')} PASSWORD FORTRESS SECURED</span></div><p class="airi-result"><strong>AIRI</strong> “Excellent. The Password Fortress is secured.”</p><p class="zero-result">ZERO // “You think a few passwords can stop me?”</p><div class="result-actions"><button class="btn btn-primary" data-action="room">EXPLORE COMMAND CENTER ${icon('arrow')}</button><button class="btn btn-ghost" data-action="map">VIEW NEXT ZONES</button><button class="btn btn-ghost" data-action="reset">RESET DEMO</button></div></div>`;
      Dialogue.say('Mission complete. Keep learning: verify unexpected messages, use unique passwords, and enable MFA for real accounts.');
      Storage.save();
    }
  };

  const Zones = {
    status(zone) {
      if (zone === 'A') return GameState.data.badge ? 'SECURED' : 'AVAILABLE';
      if (zone === 'B') return GameState.data.passwordComplete ? 'SECURED' : GameState.data.badge ? 'UNLOCKED' : 'LOCKED';
      return 'LOCKED';
    },
    update() {
      $$('[data-zone]').forEach(button => {
        const status = this.status(button.dataset.zone);
        button.classList.toggle('is-unlocked', status !== 'LOCKED');
        button.classList.toggle('is-complete', status === 'SECURED');
        button.classList.toggle('locked', status === 'LOCKED');
        const statusNode = $('.zone-status', button) || $('.zone-state', button);
        if (statusNode) statusNode.innerHTML = `${status === 'LOCKED' ? icon('lock') : icon('check')} ${status}`;
        button.setAttribute('aria-label', `Zone ${button.dataset.zone}, ${ZONE_DATA.find(item => item[0] === button.dataset.zone)?.[1] || ''}, ${status}`);
      });
    },
    open() {
      UI.modal('Network zone map', `<p class="muted">Secure each checkpoint to progress through ZERO's network. This prototype includes Zones A and B.</p><div class="modal-zone-map">${ZONE_DATA.map(([letter, title, description]) => `<button class="zone-card ${this.status(letter) !== 'LOCKED' ? 'is-unlocked' : ''}" data-zone="${letter}"><span class="zone-letter">${letter}</span><span><strong>ZONE ${letter}</strong><span class="zone-name">${title}</span><span class="muted zone-description">${description}</span></span><span class="zone-status">${this.status(letter) === 'LOCKED' ? icon('lock') : icon('check')} ${this.status(letter)}</span></button>`).join('')}</div><div class="modal-actions"><button class="btn btn-ghost" data-action="close-modal">CLOSE MAP</button></div>`);
      this.update();
    },
    enter(zone) {
      if (!GameState.running) return;
      if (this.status(zone) === 'LOCKED') {
        UI.toast('SECURITY CLEARANCE REQUIRED.', 'danger'); Audio.play('warning');
        if (zone !== 'B') Dialogue.say('That zone belongs to the next phase of the mission. Levels 3–6 are planned for the full game.');
        return;
      }
      UI.closeModal();
      if (zone === 'A') GameState.data.phishingComplete ? PhishingLevel.showResult(false) : Dialogue.terminal();
      if (zone === 'B') PasswordLevel.begin();
    }
  };

  const Hacker = {
    elapsed: 0,
    hideAt: 0,
    count: 0,
    reset() { this.elapsed = 0; this.hideAt = 0; this.count = 0; $('#hacker-notice').hidden = true; document.body.classList.remove('screen-glitch'); },
    update(delta) {
      if (!GameState.running || document.hidden || UI.isModalOpen() || GameState.data.passwordComplete) return;
      this.elapsed += delta;
      if (this.hideAt && this.elapsed >= this.hideAt) {
        $('#hacker-notice').hidden = true; document.body.classList.remove('screen-glitch'); this.hideAt = 0;
      }
      if (this.elapsed >= 44 + this.count * 85 && this.count < 3) {
        this.count += 1;
        $('#hacker-notice').hidden = false;
        this.hideAt = this.elapsed + 4.5;
        Audio.play('warning');
        if (!GameState.data.settings.reducedEffects) {
          document.body.classList.add('screen-glitch');
          setTimeout(() => document.body.classList.remove('screen-glitch'), 450);
        }
      }
    }
  };

  const actions = {
    start: () => UI.start(), continue: () => UI.resume(), settings: () => UI.settings(), about: () => UI.about(),
    menu: () => UI.menu(), reset: () => UI.resetPrompt(), 'confirm-reset': () => UI.start(),
    'close-modal': () => UI.closeModal(), room: () => UI.room(), map: () => Zones.open(), mute: () => Audio.toggle(),
    scan: () => UI.scan(), interact: () => Interaction.interactNearest(),
    inspect: () => GameState.data.screen === 'phishing' ? PhishingLevel.inspect() : GameState.data.screen === 'password' ? Hints.open() : Interaction.interactNearest(),
    hint: () => Hints.open(), evidence: () => UI.evidence(), notes: () => UI.notes(),
    'begin-phishing': () => PhishingLevel.begin(), 'open-email': () => PhishingLevel.open(), 'inspect-email': () => PhishingLevel.inspect(),
    'report-email': () => PhishingLevel.decide('phishing'), 'ignore-email': () => PhishingLevel.decide('legitimate'),
    'next-email': () => PhishingLevel.next(), 'retry-phishing': () => PhishingLevel.retry(),
    'review-emails': () => PhishingLevel.select(0), 'claim-badge': () => PhishingLevel.claimBadge(),
    'buy-hint': () => Hints.buy(), 'toggle-password': () => PasswordLevel.toggleVisibility(), 'unlock-door': () => PasswordLevel.unlock()
  };

  function bindEvents() {
    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      Audio.unlock();
      if (button.id === 'modal-close') return UI.closeModal();
      if (button.dataset.action && actions[button.dataset.action]) {
        if (button.dataset.action !== 'mute') Audio.play();
        actions[button.dataset.action]();
      } else if (button.dataset.email !== undefined) {
        Audio.play(); PhishingLevel.select(Number(button.dataset.email));
      } else if (button.dataset.zone) {
        Audio.play(); Zones.enter(button.dataset.zone);
      } else if (button.dataset.object) Interaction.activate(button.dataset.object);
    });
    document.addEventListener('input', event => {
      if (event.target.id === 'password-input') {
        PasswordLevel.value = event.target.value;
        PasswordLevel.update();
      }
      if (event.target.id === 'analyst-notes') {
        GameState.data.notes = event.target.value.slice(0, 4000);
        Storage.save();
        $('#notes-status').textContent = `${GameState.data.notes.length}/4000 characters · ${Storage.available ? 'saved locally' : 'session only; browser storage unavailable'}`;
      }
    });
    document.addEventListener('change', event => {
      if (event.target.id === 'setting-sound') GameState.data.settings.sound = event.target.checked;
      else if (event.target.id === 'setting-effects') GameState.data.settings.reducedEffects = event.target.checked;
      else return;
      UI.applySettings(); Storage.save(); Audio.play();
    });
    document.addEventListener('keydown', event => {
      const input = event.target.matches('input, textarea, select, [contenteditable="true"]');
      if (input) {
        if (event.key === 'Enter' && event.target.id === 'password-input') { event.preventDefault(); PasswordLevel.unlock(); }
        return;
      }
      if (!GameState.running || UI.isModalOpen() || GameState.data.screen !== 'room') return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault(); Player.keys.add(key);
      } else if (key === 'e' && !event.repeat) {
        event.preventDefault(); Interaction.interactNearest();
      }
    });
    document.addEventListener('keyup', event => Player.keys.delete(event.key.toLowerCase()));
    $$('[data-move]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        if (!GameState.running || UI.isModalOpen() || GameState.data.screen !== 'room') return;
        event.preventDefault(); Player.touch.add(button.dataset.move);
        button.setPointerCapture?.(event.pointerId);
      });
      const release = () => Player.touch.delete(button.dataset.move);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
    $('#main-modal').addEventListener('close', () => {
      Player.clear();
      if (UI.lastFocus?.isConnected && !UI.lastFocus.closest('[hidden]')) UI.lastFocus.focus({ preventScroll: true });
      UI.lastFocus = null;
    });
    window.addEventListener('blur', () => { Player.clear(); Storage.save(); });
    document.addEventListener('visibilitychange', () => {
      Player.clear();
      if (document.hidden) Storage.save();
    });
    window.addEventListener('pagehide', () => { Player.clear(); PasswordLevel.clear(); Storage.save(); });
    window.addEventListener('beforeunload', () => Storage.save());
  }

  // One delta-time loop drives movement, the active investigation timer, and ZERO.
  // Expiry only removes eligibility for the speed bonus; it never blocks learning.
  let previousTime = 0;
  let hudAccumulator = 0;
  let saveAccumulator = 0;
  function frame(timestamp) {
    const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, .1) : 0;
    previousTime = timestamp;
    Player.update(delta);
    if (GameState.running && !document.hidden && !UI.isModalOpen()) {
      if (GameState.data.screen === 'phishing' && !GameState.data.phishingComplete) GameState.data.elapsed += delta;
      Hacker.update(delta);
      hudAccumulator += delta; saveAccumulator += delta;
      if (hudAccumulator >= .5) { UI.hud(); hudAccumulator = 0; }
      if (saveAccumulator >= 5) { Storage.save(); saveAccumulator = 0; }
    }
    window.requestAnimationFrame(frame);
  }

  function init() {
    GameState.data = Storage.load();
    bindEvents();
    UI.applySettings(); UI.updateContinue(); UI.hud(); Player.render();
    $('#menu').hidden = false; $('#game').hidden = true;
    window.requestAnimationFrame(frame);
    // Readable integration hooks for the demo and browser QA; no password is exposed in state.
    window.Game = {
      get state() { return GameState.data; },
      get running() { return GameState.running; },
      modules: { GameState, Player, Interaction, UI, PhishingLevel, PasswordLevel, Scoring, Hints, Dialogue, Zones, Audio, Storage },
      evaluatePassword: value => PasswordLevel.evaluate(String(value)),
      start: () => UI.start(), resume: () => UI.resume(),
      emailCount: EMAILS.length
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
