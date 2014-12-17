/*
 *  locale.js
 *  handles i18n
 *
 */

var Stmx = (function (Stmx) {
  Stmx.app = Stmx.app || {};

  // Default language is set by browser, or is US English if undetermined
  var defaultLocale = navigator.language || 'en-US';

  function init() {
    // Current language is the one set by Streetmix or is the browser default, if unset
    var locale = getLocale() || defaultLocale;

    initSettingDropdown(locale);
    doTheI18n(locale);
  }

  function initSettingDropdown(locale) {
    var el = document.querySelector('#language-select');

    // Set the dropdown to the current language.
    // If current language is not in the list, fallback to US English.
    el.value = locale;
    if (!el.value) {
      el.value = 'en-US';
    }

    el.addEventListener('change', onNewLocaleSelected);
  }

  function onNewLocaleSelected() {
    setLocale(this.value);
  }

  function getLocale() {
    return window.localStorage.getItem('locale');
  }

  function setLocale(locale) {
    window.localStorage.setItem('locale', locale);
    doTheI18n(locale);
  }

  function clearLocale() {
    window.localStorage.removeItem('locale');
    // TODO: clear language cache here if it's activated
  }

  function doTheI18n(locale) {
    var options = {
      lng: locale,
      namespaces: ['app', 'segments'],
      defaultNs: 'app',
      useCookie: false,
      fallbackLng: false, //'en-US',
      load: 'current',
      debug: true,
      resGetPath: '/locales/__lng__/__ns__.json'
    };

    i18n.init(options, function (t) {
      $('body').i18n();
    });
  }

  // Public
  Stmx.app.locale = {
    init: init,
    get: getLocale,
    set: setLocale,
    clear: clearLocale
  }

  return Stmx;

}(Stmx || {}));
