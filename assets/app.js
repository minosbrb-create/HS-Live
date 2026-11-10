    const player = document.getElementById('player');
    const landscapeChatToggle = document.getElementById('landscapeChatToggle');
    const landscapeChatQuery = window.matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 700px), (orientation: landscape) and (pointer: coarse) and (max-device-height: 700px)');
    const portraitChatQuery = window.matchMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 680px), (orientation: portrait) and (pointer: coarse) and (max-device-width: 680px)');
    const smallTouchScreenQuery = window.matchMedia('(pointer: coarse) and (max-device-width: 680px)');
    const isMobileLayout = () => window.innerWidth <= 680 || smallTouchScreenQuery.matches;
    const mobileVisualViewport = window.visualViewport;
    let mobileBaseViewportHeight = mobileVisualViewport?.height || window.innerHeight;
    function syncMobileVisualViewport() {
      if (!window.matchMedia('(pointer: coarse)').matches) return;
      const height = mobileVisualViewport?.height || window.innerHeight;
      const top = mobileVisualViewport?.offsetTop || 0;
      if (height > mobileBaseViewportHeight) mobileBaseViewportHeight = height;
      document.documentElement.style.setProperty('--mobile-visual-height', `${Math.round(height)}px`);
      document.documentElement.style.setProperty('--mobile-visual-top', `${Math.round(top)}px`);
      const keyboardDelta = mobileBaseViewportHeight - height;
      const landscapeChatActive = landscapeChatQuery.matches && document.body.classList.contains('landscape-chat-open');
      const keyboardOpen = keyboardDelta > (landscapeChatActive ? 75 : 140);
      document.body.classList.toggle('mobile-keyboard-open', keyboardOpen);
      const chatFrame = document.getElementById('twitchChat');
      if (chatFrame) {
        const chatPanel = document.getElementById('chat');
        if (keyboardOpen && portraitChatQuery.matches && chatPanel) {
          const visibleHeight = chatPanel.getBoundingClientRect().height;
          const extraHeight = Math.min(180, Math.max(0, Math.round(visibleHeight * 0.4)));
          const frameHeight = Math.ceil(visibleHeight) + extraHeight;
          chatFrame.style.height = `${frameHeight}px`;
          chatFrame.style.flex = `0 0 ${frameHeight}px`;
          chatFrame.style.transform = `translateY(-${extraHeight}px)`;
        } else {
          chatFrame.style.removeProperty('height');
          chatFrame.style.removeProperty('flex');
          chatFrame.style.removeProperty('transform');
        }
      }
    }
    syncMobileVisualViewport();
    window.addEventListener('resize', syncMobileVisualViewport, { passive: true });
    mobileVisualViewport?.addEventListener('resize', syncMobileVisualViewport, { passive: true });
    mobileVisualViewport?.addEventListener('scroll', syncMobileVisualViewport, { passive: true });
    let landscapeControlTimer = null;
    function revealLandscapeControl() {
      if (!landscapeChatQuery.matches) return;
      document.body.classList.add('landscape-controls-visible');
      window.clearTimeout(landscapeControlTimer);
      landscapeControlTimer = window.setTimeout(() => {
        document.body.classList.remove('landscape-controls-visible');
      }, 4_000);
    }
    player.addEventListener('pointerdown', revealLandscapeControl, { passive: true });
    player.addEventListener('focusin', revealLandscapeControl);
    window.addEventListener('blur', () => {
      if (document.activeElement === videoEmbed) revealLandscapeControl();
    });
    function settleMobileViewport(resetBaseline = false) {
      window.setTimeout(() => {
        const height = mobileVisualViewport?.height || window.innerHeight;
        const chatHasFocus = document.activeElement === document.getElementById('twitchChat');
        if (resetBaseline || !chatHasFocus) mobileBaseViewportHeight = height;
        syncMobileVisualViewport();
        revealLandscapeControl();
      }, 500);
    }
    window.addEventListener('orientationchange', () => settleMobileViewport(true), { passive: true });
    document.addEventListener('fullscreenchange', () => settleMobileViewport(false), { passive: true });
    function setLandscapeChatOpen(open) {
      document.body.classList.toggle('landscape-chat-open', open);
      syncMobileVisualViewport();
      landscapeChatToggle.setAttribute('aria-expanded', String(open));
      landscapeChatToggle.setAttribute('aria-label', open ? 'Mostrar solo el video' : 'Mostrar chat');
      landscapeChatToggle.querySelector('span').textContent = open ? 'Solo video' : 'Mostrar chat';
      revealLandscapeControl();
    }
    landscapeChatToggle.addEventListener('click', async () => {
      const open = !document.body.classList.contains('landscape-chat-open');
      if (open && landscapeChatQuery.matches && document.fullscreenElement !== document.documentElement) {
        try { await document.documentElement.requestFullscreen(); } catch {}
      } else if (!open && document.fullscreenElement === document.documentElement) {
        try { await document.exitFullscreen(); } catch {}
      }
      setLandscapeChatOpen(open);
    });
    let videoEmbed = document.querySelector('.video-embed');
    videoEmbed.addEventListener('focus', revealLandscapeControl);
    if (landscapeChatQuery.matches) revealLandscapeControl();
    const playerControls = document.getElementById('playerControls');
    const playerControlActions = document.getElementById('playerControlActions');
    const desktopPlayerActions = document.getElementById('desktopPlayerActions');
    function placePlayerControlActions() {
      const inHeader = window.innerWidth > 900 && window.matchMedia('(pointer:fine)').matches && !document.body.classList.contains('theater-mode');
      const destination = inHeader ? desktopPlayerActions : playerControls;
      if (playerControlActions.parentElement !== destination) destination.append(playerControlActions);
      desktopPlayerActions.setAttribute('aria-hidden', String(!inHeader));
    }
    placePlayerControlActions();
    const mobilePlayerMenu = document.getElementById('mobilePlayerMenu');
    let mobilePlayerMenuTimer = null;
    function scheduleMobilePlayerMenuClose() {
      window.clearTimeout(mobilePlayerMenuTimer);
      if (playerControls.classList.contains('menu-open') && isMobileLayout()) {
        mobilePlayerMenuTimer = window.setTimeout(() => setMobilePlayerMenu(false), 3_000);
      }
    }
    function setMobilePlayerMenu(open) {
      playerControls.classList.toggle('menu-open', open);
      mobilePlayerMenu.setAttribute('aria-expanded', String(open));
      mobilePlayerMenu.setAttribute('aria-label', open ? 'Ocultar controles del video' : 'Mostrar controles del video');
      scheduleMobilePlayerMenuClose();
    }
    mobilePlayerMenu.addEventListener('click', () => {
      setMobilePlayerMenu(!playerControls.classList.contains('menu-open'));
    });
    document.addEventListener('pointerdown', event => {
      if (!playerControls.classList.contains('menu-open')) return;
      if (!playerControls.contains(event.target)) setMobilePlayerMenu(false);
      else scheduleMobilePlayerMenuClose();
    });
    const videoReload = document.getElementById('videoReload');
    const videoReloadLabel = videoReload.querySelector('span');
    const vkHelpDialog = document.getElementById('vkHelpDialog');
    const vkHelpButtons = [document.getElementById('vkHelpButton'), document.getElementById('vkHelpMobile')];
    for (const button of vkHelpButtons) button.addEventListener('click', () => vkHelpDialog.showModal());
    document.getElementById('vkHelpClose').addEventListener('click', () => vkHelpDialog.close());
    vkHelpDialog.addEventListener('click', event => {
      if (event.target === vkHelpDialog) vkHelpDialog.close();
    });
    const theaterToggle = document.getElementById('theaterToggle');
    const theaterToggleLabel = theaterToggle.querySelector('span');
    let currentVideoPlatform = '';
    let videoReloadTimer = null;
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
      const channel = config?.videoPlatform === 'youtube' || config?.videoPlatform === 'drive' || config?.videoPlatform === 'ok'
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
      } else if (config?.videoPlatform === 'ok' && /^\d{1,20}$/.test(channel)) {
        src = `https://ok.ru/videoembed/${encodeURIComponent(channel)}`;
        videoEmbed.title = 'Video de OK.ru';
      }
      if (src) videoEmbed.src = src;
      currentVideoPlatform = src && ['vk', 'youtube', 'ok'].includes(config?.videoPlatform) ? config.videoPlatform : '';
      document.body.classList.toggle('vk-video', currentVideoPlatform === 'vk');
      videoReload.hidden = !currentVideoPlatform;
      playerControls.classList.toggle('has-ok-video', currentVideoPlatform === 'ok');
    }
    videoReload.addEventListener('click', () => {
      if (!currentVideoPlatform || videoReload.disabled || !videoEmbed.getAttribute('src')) return;
      setMobilePlayerMenu(false);
      const currentSrc = videoEmbed.getAttribute('src');
      videoReload.disabled = true;
      videoReloadLabel.textContent = 'Espera...';
      const refreshedEmbed = videoEmbed.cloneNode(false);
      refreshedEmbed.src = currentSrc;
      refreshedEmbed.addEventListener('focus', revealLandscapeControl);
      videoEmbed.replaceWith(refreshedEmbed);
      videoEmbed = refreshedEmbed;
      window.clearTimeout(videoReloadTimer);
      videoReloadTimer = window.setTimeout(() => {
        videoReload.disabled = false;
        videoReloadLabel.textContent = 'Recargar video';
      }, 5_000);
    });
    function setTheaterMode(enabled) {
      document.body.classList.toggle('theater-mode', enabled);
      placePlayerControlActions();
      theaterToggle.setAttribute('aria-pressed', String(enabled));
      theaterToggle.setAttribute('aria-label', enabled ? 'Salir del modo teatro' : 'Activar modo teatro');
      theaterToggle.title = enabled ? 'Salir del modo teatro (Esc)' : 'Activar modo teatro';
      theaterToggleLabel.textContent = enabled ? 'Salir del teatro' : 'Modo teatro';
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
    theaterToggle.addEventListener('click', () => {
      setMobilePlayerMenu(false);
      setTheaterMode(!document.body.classList.contains('theater-mode'));
    });
    window.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (playerControls.classList.contains('menu-open')) setMobilePlayerMenu(false);
      else if (document.body.classList.contains('theater-mode')) setTheaterMode(false);
    });
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
      if (isMobileLayout() || chatHidden) {
        chatColumn.style.removeProperty('height');
        chatColumn.style.removeProperty('margin-top');
        chatColumn.style.removeProperty('align-self');
        return;
      }
      const playerRect = player.getBoundingClientRect();
      if (document.body.classList.contains('theater-mode')) {
        const layoutRect = layout.getBoundingClientRect();
        chatColumn.style.alignSelf = 'stretch';
        chatColumn.style.marginTop = '0px';
        chatColumn.style.height = `${Math.max(0, Math.round(layoutRect.height))}px`;
      } else {
        chatColumn.style.height = `${Math.round(playerRect.height)}px`;
        chatColumn.style.removeProperty('margin-top');
        chatColumn.style.removeProperty('align-self');
      }
    }
    function renderChatVisibility() {
      const mobile = isMobileLayout();
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
    window.addEventListener('resize', () => {
      placePlayerControlActions();
      if (!landscapeChatQuery.matches) {
        setLandscapeChatOpen(false);
        document.body.classList.remove('landscape-controls-visible');
        window.clearTimeout(landscapeControlTimer);
      }
      renderChatVisibility();
      alignChatWithPlayer();
    });
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
