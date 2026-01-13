/**
 * Custom Tag Manager Container Script
 * This script should be placed on advertiser websites
 * Usage: <script src="https://yourdomain.com/container.js?id=CONTAINER_ID"></script>
 */

(function() {
  'use strict';

  // Parse container ID from script URL
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const scriptSrc = currentScript.src;
  const urlParams = new URLSearchParams(scriptSrc.split('?')[1]);
  const containerId = urlParams.get('id');

  if (!containerId) {
    console.error('[CTM] Container ID not provided');
    return;
  }

  // Configuration
  const CONFIG = {
    apiEndpoint: 'https://yourdomain.com/api', // Replace with your domain
    containerId: containerId,
    debug: urlParams.get('debug') === 'true'
  };

  // Logger
  const log = {
    info: (...args) => CONFIG.debug && console.log('[CTM]', ...args),
    error: (...args) => console.error('[CTM]', ...args),
    warn: (...args) => CONFIG.debug && console.warn('[CTM]', ...args)
  };

  // Data Layer
  window.dataLayer = window.dataLayer || [];
  
  // Enhanced Data Layer push with event handling
  const originalPush = window.dataLayer.push;
  window.dataLayer.push = function() {
    const result = originalPush.apply(window.dataLayer, arguments);
    
    // Process each pushed item
    for (let i = 0; i < arguments.length; i++) {
      const item = arguments[i];
      if (item && item.event) {
        log.info('Event pushed:', item.event, item);
        triggerEvent(item.event, item);
      }
    }
    
    return result;
  };

  // Container state
  const state = {
    loaded: false,
    config: null,
    executedTags: new Set(),
    dataLayer: window.dataLayer
  };

  // Event listeners storage
  const eventListeners = {};

  /**
   * Load container configuration from API
   */
  async function loadConfig() {
    try {
      log.info('Loading configuration for container:', CONFIG.containerId);
      
      const response = await fetch(`${CONFIG.apiEndpoint}/config/${CONFIG.containerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const config = await response.json();
      state.config = config;
      state.loaded = true;
      
      log.info('Configuration loaded:', config);
      
      return config;
    } catch (error) {
      log.error('Failed to load configuration:', error);
      return null;
    }
  }

  /**
   * Check if trigger conditions are met
   */
  function checkTrigger(trigger, eventData = {}) {
    if (!trigger) return true;

    switch (trigger.type) {
      case 'pageview':
        return true;

      case 'dom_ready':
        return document.readyState === 'complete' || document.readyState === 'interactive';

      case 'window_load':
        return document.readyState === 'complete';

      case 'custom_event':
        return eventData.event === trigger.eventName;

      case 'url_match':
        const currentUrl = window.location.href;
        if (trigger.matchType === 'equals') {
          return currentUrl === trigger.url;
        } else if (trigger.matchType === 'contains') {
          return currentUrl.includes(trigger.url);
        } else if (trigger.matchType === 'regex') {
          return new RegExp(trigger.url).test(currentUrl);
        }
        return false;

      case 'element_visibility':
        const element = document.querySelector(trigger.selector);
        return element && isElementVisible(element);

      case 'click':
        // Click events are handled separately
        return false;

      default:
        log.warn('Unknown trigger type:', trigger.type);
        return false;
    }
  }

  /**
   * Check if element is visible
   */
  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Replace variables in string
   */
  function replaceVariables(str, eventData = {}) {
    if (typeof str !== 'string') return str;

    return str.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const varName = variable.trim();
      
      // Check in event data
      if (eventData[varName] !== undefined) {
        return eventData[varName];
      }

      // Built-in variables
      switch (varName) {
        case 'page.url':
          return window.location.href;
        case 'page.hostname':
          return window.location.hostname;
        case 'page.path':
          return window.location.pathname;
        case 'page.title':
          return document.title;
        case 'page.referrer':
          return document.referrer;
        default:
          // Check in dataLayer
          const dlValue = getDataLayerValue(varName);
          return dlValue !== undefined ? dlValue : match;
      }
    });
  }

  /**
   * Get value from dataLayer
   */
  function getDataLayerValue(key) {
    for (let i = window.dataLayer.length - 1; i >= 0; i--) {
      if (window.dataLayer[i][key] !== undefined) {
        return window.dataLayer[i][key];
      }
    }
    return undefined;
  }

  /**
   * Execute a tag
   */
  function executeTag(tag, eventData = {}) {
    // Check if already executed (for once-per-page tags)
    if (tag.fireOnce && state.executedTags.has(tag.id)) {
      log.info('Tag already executed (fireOnce):', tag.name);
      return;
    }

    log.info('Executing tag:', tag.name, 'Type:', tag.type);

    try {
      switch (tag.type) {
        case 'html':
          executeHtmlTag(tag, eventData);
          break;

        case 'script':
          executeScriptTag(tag, eventData);
          break;

        case 'image':
          executeImageTag(tag, eventData);
          break;

        case 'custom':
          executeCustomTag(tag, eventData);
          break;

        default:
          log.warn('Unknown tag type:', tag.type);
      }

      state.executedTags.add(tag.id);
      
      // Fire success callback if provided
      if (tag.onSuccess) {
        window.dataLayer.push({
          event: 'ctm.tagFired',
          tagId: tag.id,
          tagName: tag.name
        });
      }

    } catch (error) {
      log.error('Error executing tag:', tag.name, error);
      
      // Fire error callback if provided
      if (tag.onError) {
        window.dataLayer.push({
          event: 'ctm.tagError',
          tagId: tag.id,
          tagName: tag.name,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute HTML tag
   */
  function executeHtmlTag(tag, eventData) {
    const html = replaceVariables(tag.html, eventData);
    const container = document.createElement('div');
    container.innerHTML = html;
    
    // Execute scripts in the HTML
    const scripts = container.getElementsByTagName('script');
    for (let script of scripts) {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.head.appendChild(newScript);
    }
    
    // Append other elements
    const elements = Array.from(container.children).filter(el => el.tagName !== 'SCRIPT');
    elements.forEach(el => document.body.appendChild(el));
  }

  /**
   * Execute script tag
   */
  function executeScriptTag(tag, eventData) {
    const script = document.createElement('script');
    
    if (tag.src) {
      script.src = replaceVariables(tag.src, eventData);
      script.async = tag.async !== false;
    } else if (tag.code) {
      const code = replaceVariables(tag.code, eventData);
      script.textContent = code;
    }

    if (tag.attributes) {
      Object.keys(tag.attributes).forEach(key => {
        script.setAttribute(key, replaceVariables(tag.attributes[key], eventData));
      });
    }

    document.head.appendChild(script);
  }

  /**
   * Execute image pixel tag
   */
  function executeImageTag(tag, eventData) {
    const img = new Image();
    img.src = replaceVariables(tag.src, eventData);
    img.style.display = 'none';
    document.body.appendChild(img);
  }

  /**
   * Execute custom JavaScript tag
   */
  function executeCustomTag(tag, eventData) {
    const code = replaceVariables(tag.code, eventData);
    const func = new Function('data', code);
    func(eventData);
  }

  /**
   * Process tags based on triggers
   */
  function processTags(eventData = {}) {
    if (!state.config || !state.config.tags) return;

    state.config.tags.forEach(tag => {
      if (!tag.enabled) return;

      // Check all triggers
      const triggersMet = tag.triggers.every(trigger => 
        checkTrigger(trigger, eventData)
      );

      if (triggersMet) {
        executeTag(tag, eventData);
      }
    });
  }

  /**
   * Trigger custom event
   */
  function triggerEvent(eventName, eventData = {}) {
    log.info('Triggering event:', eventName);
    processTags({ ...eventData, event: eventName });
  }

  /**
   * Setup click listeners
   */
  function setupClickListeners() {
    if (!state.config || !state.config.tags) return;

    state.config.tags.forEach(tag => {
      tag.triggers.forEach(trigger => {
        if (trigger.type === 'click' && trigger.selector) {
          document.addEventListener('click', (e) => {
            const target = e.target.closest(trigger.selector);
            if (target) {
              log.info('Click trigger matched:', trigger.selector);
              executeTag(tag, {
                event: 'click',
                element: target,
                clickText: target.textContent,
                clickUrl: target.href || ''
              });
            }
          }, true);
        }
      });
    });
  }

  /**
   * Initialize container
   */
  async function init() {
    log.info('Initializing Custom Tag Manager...');

    // Load configuration
    const config = await loadConfig();
    if (!config) {
      log.error('Failed to initialize: configuration not loaded');
      return;
    }

    // Process pageview tags
    processTags({ event: 'pageview' });

    // Setup DOM ready listener
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        processTags({ event: 'dom_ready' });
        setupClickListeners();
      });
    } else {
      processTags({ event: 'dom_ready' });
      setupClickListeners();
    }

    // Setup window load listener
    if (document.readyState === 'complete') {
      processTags({ event: 'window_load' });
    } else {
      window.addEventListener('load', () => {
        processTags({ event: 'window_load' });
      });
    }

    log.info('Custom Tag Manager initialized successfully');
  }

  // Public API
  window.ctm = {
    version: '1.0.0',
    containerId: CONFIG.containerId,
    push: (data) => window.dataLayer.push(data),
    trigger: triggerEvent,
    getState: () => ({ ...state, config: null }), // Don't expose full config
    debug: (enable) => {
      CONFIG.debug = enable;
      log.info('Debug mode:', enable);
    }
  };

  // Start initialization
  init();
})();
