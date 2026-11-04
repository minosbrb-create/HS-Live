    const player = document.getElementById('player');
    const videoEmbed = document.querySelector('.video-embed');
    const maintenanceScreen = document.getElementById('maintenanceScreen');
    let maintenanceMode = false;
    let maintenancePoll = null;
    const maintenanceBrand = document.getElementById('maintenanceBrand');
    const siteBrandName = document.getElementById('siteBrandName');
    function applyBrandName(config) {
      const brandName = typeof config?.brandName === 'string' ? config.brandName.trim().slice(0, 40) : '';
      for (const element of [siteBrandName, maintenanceBrand]) {
        if (!brandName || brandName === 'HoliSofi') {
          element.replaceChildren(document.createTextNode('Holi'), Object.assign(document.createElement('span'), { textContent: 'Sofi' }));
        } else {
          element.textContent = brandName;
        }
      }
    }
    function applyVideoSource(config) {
      const configuredIdentifier = typeof config?.videoChannel === 'string' ? config.videoChannel.trim() : '';
      const channel = config?.videoPlatform === 'youtube' || config?.videoPlatform === 'drive'
        ? configuredIdentifier
        : configuredIdentifier.toLowerCase();
      let src = '';
      if (config?.videoPlatform === 'vk' && /^[a-z0-9_-]{1,64}$/.test(channel)) {
        src = `https://live.vkvideo.ru/app/embed/${encodeURIComponent(channel)}`;
        videoEmbed.title = `Transmisión en vivo de ${channel} en VK Video`;
      } else if (config?.videoPlatform === 'twitch' && /^[a-z0-9_]{1,25}$/.test(channel)) {
        src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(location.hostname)}`;
        videoEmbed.title = `Transmisión en vivo de ${channel} en Twitch`;
      } else if (config?.videoPlatform === 'youtube' && /^[a-zA-Z0-9_-]{11}$/.test(channel)) {
        src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(channel)}?playsinline=1`;
        videoEmbed.title = 'Video de YouTube';
      } else if (config?.videoPlatform === 'drive' && /^[a-zA-Z0-9_-]{10,200}$/.test(channel)) {
        src = `https://drive.google.com/file/d/${encodeURIComponent(channel)}/preview`;
        videoEmbed.title = 'Video de Google Drive';
      }
      if (src) videoEmbed.src = src;
    }
    async function getSiteConfig() {
      try {
        const response = await fetch('/api/site-config', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok) return null;
        return await response.json();
      } catch { return null; }
    }
    function showMaintenance() {
      if (maintenanceMode) return;
      maintenanceMode = true;
      document.body.classList.add('maintenance-mode');
      maintenanceScreen.hidden = false;
      videoEmbed.removeAttribute('src');
      document.getElementById('twitchChat').removeAttribute('src');
    }
    async function checkMaintenanceMode() {
      const config = await getSiteConfig();
      if (!config) return;
      applyBrandName(config);
      if (config.maintenance) showMaintenance();
      else if (maintenanceMode) location.reload();
    }
    function startMaintenancePolling() {
      if (maintenancePoll === null) maintenancePoll = window.setInterval(checkMaintenanceMode, 5 * 60_000);
    }
    function stopMaintenancePolling() {
      if (maintenancePoll !== null) {
        window.clearInterval(maintenancePoll);
        maintenancePoll = null;
      }
    }
    async function initializeSite() {
      const config = await getSiteConfig();
      applyBrandName(config);
      if (config?.maintenance) showMaintenance();
      else {
        applyVideoSource(config || { videoPlatform: 'vk', videoChannel: 'numeatest' });
        refreshTwitchChannelInfo();
      }
      if (!document.hidden) startMaintenancePolling();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopMaintenancePolling();
      else {
        checkMaintenanceMode();
        startMaintenancePolling();
      }
    });
    let controlsIdleTimer = null;
    function resetPlayerControlsTimer() {
      player.classList.remove('controls-idle');
      window.clearTimeout(controlsIdleTimer);
      if (document.fullscreenElement === player || player.matches(':hover') || player.contains(document.activeElement)) {
        controlsIdleTimer = window.setTimeout(() => player.classList.add('controls-idle'), 1800);
      }
    }
    player.addEventListener('pointermove', resetPlayerControlsTimer);
    player.addEventListener('pointerdown', resetPlayerControlsTimer);
    window.addEventListener('keydown', resetPlayerControlsTimer);
    document.addEventListener('fullscreenchange', resetPlayerControlsTimer);
    const chat = document.getElementById('chat');
    const chatColumn = document.querySelector('.chat-column');
    const layout = document.querySelector('.layout');
    let chatHidden = false;
    function alignChatWithPlayer() {
      if (window.innerWidth <= 680 || chatHidden) {
        chatColumn.style.removeProperty('height');
        return;
      }
      chatColumn.style.height = `${Math.round(player.getBoundingClientRect().height)}px`;
    }
    function renderChatVisibility() {
      const mobile = window.innerWidth <= 680;
      layout.classList.toggle('chat-hidden', chatHidden && !mobile);
      chat.classList.toggle('collapsed', chatHidden && mobile);
      const expanded = String(!chatHidden);
      const action = chatHidden ? 'Mostrar chat' : 'Ocultar chat';
      const mobileToggle = document.getElementById('chatToggle');
      const desktopToggle = document.getElementById('desktopChatToggle');
      mobileToggle.setAttribute('aria-expanded', expanded);
      document.getElementById('toggleLabel').textContent = action;
      desktopToggle.setAttribute('aria-expanded', expanded);
      desktopToggle.setAttribute('aria-label', action);
      desktopToggle.title = action;
      document.getElementById('desktopChatLabel').textContent = action;
      requestAnimationFrame(alignChatWithPlayer);
    }
    window.addEventListener('resize', () => { renderChatVisibility(); alignChatWithPlayer(); });
    if ('ResizeObserver' in window) new ResizeObserver(alignChatWithPlayer).observe(player);
    requestAnimationFrame(alignChatWithPlayer);
    function toggleChat() { chatHidden = !chatHidden; renderChatVisibility(); }
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('desktopChatToggle').addEventListener('click', toggleChat);
    const twitchChat = document.getElementById('twitchChat');
    const twitchChatLink = document.querySelector('.chat-fallback a');
    const twitchFollowLink = document.querySelector('.follow-button');
    const twitchSubscribeLink = document.querySelector('.gift-sub');
    let activeTwitchChannel = '';
    function setTwitchChannel(channelLogin) {
      const normalizedLogin = typeof channelLogin === 'string' ? channelLogin.trim().toLowerCase() : '';
      if (!/^[a-z0-9_]{1,25}$/.test(normalizedLogin) || normalizedLogin === activeTwitchChannel) return;
      activeTwitchChannel = normalizedLogin;
      twitchChat.title = `Chat de Twitch de ${normalizedLogin}`;
      twitchChatLink.href = `https://www.twitch.tv/${normalizedLogin}/chat?popout=`;
      twitchChatLink.textContent = `Abrir chat de ${normalizedLogin} en Twitch`;
      twitchFollowLink.href = `https://www.twitch.tv/${normalizedLogin}`;
      twitchFollowLink.setAttribute('aria-label', `Abrir Twitch para seguir el canal de ${normalizedLogin}`);
      twitchFollowLink.title = `Abre Twitch para seguir el canal de ${normalizedLogin}`;
      twitchSubscribeLink.href = `https://www.twitch.tv/subs/${normalizedLogin}`;
      twitchSubscribeLink.setAttribute('aria-label', `Suscribirse o regalar una suscripción al canal ${normalizedLogin} en Twitch`);
      if (location.protocol !== 'file:') {
        twitchChat.src = `https://www.twitch.tv/embed/${normalizedLogin}/chat?parent=${encodeURIComponent(location.hostname)}&darkpopout`;
      }
    }
    if (location.protocol === 'file:') {
      document.body.classList.add('file-preview');
    }
    const twitchInfo = document.getElementById('twitchChannelInfo');
    const twitchInfoText = document.getElementById('twitchChannelInfoText');
    const twitchChannelCard = document.getElementById('twitchChannelCard');
    const twitchChannelAvatar = document.getElementById('twitchChannelAvatar');
    const twitchChannelName = document.getElementById('twitchChannelName');
    const twitchChannelTitle = document.getElementById('twitchChannelTitle');
    const twitchChannelDescription = document.getElementById('twitchChannelDescription');
    async function refreshTwitchChannelInfo() {
      try {
        const response = await fetch('/api/twitch-channel', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        const info = await response.json();
        if (maintenanceMode) return;
        if (info.channelLogin) setTwitchChannel(info.channelLogin);
        if (!response.ok) return;
        if (!info.configured) return;
        twitchChannelName.textContent = info.displayName || info.channelLogin || '';
        twitchChannelAvatar.src = info.profileImageUrl || '';
        twitchChannelAvatar.alt = info.displayName ? `Avatar de ${info.displayName}` : '';
        twitchChannelTitle.textContent = info.title || '';
        twitchChannelTitle.hidden = !info.title;
        twitchChannelDescription.textContent = info.description || '';
        twitchChannelDescription.hidden = !info.description;
        const parts = [info.isLive ? 'EN VIVO' : 'OFFLINE'];
        if (info.isLive && info.category) parts.push(info.category);
        if (info.isLive && Number.isFinite(info.viewerCount)) parts.push(`${info.viewerCount.toLocaleString('es-MX')} viendo`);
        twitchInfoText.textContent = parts.join(' · ');
        twitchInfo.classList.toggle('is-live', Boolean(info.isLive));
        twitchChannelCard.hidden = false;
      } catch {}
    }
    if (location.protocol !== 'file:') initializeSite();
