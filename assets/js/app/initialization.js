var initializing = false;
var bodyLoaded;
var readyStateCompleteLoaded;

var TRACK_ACTION_TOUCH_CAPABLE = 'Touch capability detected';

app.preInit = function() {
  initializing = true;
  ignoreStreetChanges = true;

  _detectDebugUrl();
  _detectSystemCapabilities();
}

app.init = function() {
  if (!debug.forceUnsupportedBrowser) {

    // TODO temporary ban
    if ((navigator.userAgent.indexOf('Opera') != -1) ||
        (navigator.userAgent.indexOf('Internet Explorer') != -1) ||
        (navigator.userAgent.indexOf('MSIE') != -1)) {
      mode = MODES.UNSUPPORTED_BROWSER;
      _processMode();
      return;
    }
  }

  _fillDom();
  _prepareSegmentInfo();

  // Check if no internet mode
  if (system.noInternet === true) {
    _setupNoInternetMode();
  }

  // Temporary as per https://github.com/Modernizr/Modernizr/issues/788#issuecomment-12513563
  Modernizr.addTest('pagevisibility', !!Modernizr.prefixed('hidden', document, false));

  // TODO make it better
  // Related to Enter to 404 bug in Chrome
  $.ajaxSetup({ cache: false });

  readyStateCompleteLoaded = false;
  document.addEventListener('readystatechange', _onReadyStateChange);

  bodyLoaded = false;
  window.addEventListener('load', _onBodyLoad);

  _addBodyClasses();
  _processUrl();
  _processMode();

  if (abortEverything) {
    return;
  }

  // Asynchronously loading…

  // …detecting country from IP for units and left/right-hand driving
  if ((mode == MODES.NEW_STREET) || (mode == MODES.NEW_STREET_COPY_LAST)) {
    _detectGeolocation();
  } else {
    geolocationLoaded = true;
  }

  // …sign in info from our API (if not previously cached) – and subsequent
  // street data if necessary (depending on the mode)
  _loadSignIn();

  // …images
  _loadImages();

  // Note that we are waiting for sign in and image info to show the page,
  // but we give up on country info if it’s more than 1000ms.
}

function _onEverythingLoaded() {
  switch (mode) {
    case MODES.NEW_STREET_COPY_LAST:
      _onNewStreetLastClick();
      break;
  }

  // Initalize i18n / localization
  Stmx.app.locale.init();

  _showWelcome();

  _onResize();
  _resizeStreetWidth();
  _updateStreetName();
  _createPalette();
  _createDomFromData();
  _segmentsChanged();
  _updateShareMenu();
  _updateFeedbackMenu();

  initializing = false;
  ignoreStreetChanges = false;
  lastStreet = _trimStreetData(street);

  _updatePageUrl();
  _buildStreetWidthMenu();
  _addScrollButtons(document.querySelector('#palette'));
  _addScrollButtons(document.querySelector('#gallery .streets'));
  _addEventListeners();

  if (mode == MODES.USER_GALLERY) {
    _showGallery(galleryUserId, true);
  } else if (mode == MODES.GLOBAL_GALLERY) {
    _showGallery(null, true);
  } else if (mode == MODES.ABOUT) {
    _showAboutDialogBox();
  }

  if (promoteStreet) {
    _remixStreet();
  }

  window.setTimeout(_hideLoadingScreen, 0);

  if (debug.forceLiveUpdate) {
    _scheduleNextLiveUpdateCheck();
  }

  // Track touch capability in Google Analytics
  if (system.touch === true) {
    _eventTracking.track(TRACK_CATEGORY_SYSTEM, TRACK_ACTION_TOUCH_CAPABLE, null, null, true);
  }
}

function _onBodyLoad() {
  bodyLoaded = true;

  document.querySelector('#loading-progress').value++;
  _checkIfEverythingIsLoaded();
}

function _onReadyStateChange() {
  if (document.readyState == 'complete') {
    readyStateCompleteLoaded = true;

    document.querySelector('#loading-progress').value++;
    _checkIfEverythingIsLoaded();
  }
}

function _hideLoadingScreen() {

  // NOTE:
  // This function might be called on very old browsers. Please make
  // sure not to use modern faculties.

  document.getElementById('loading').className += ' hidden';
}

function _fillDom() {
  // TODO Instead of doing like this, put variables in the index.html, and fill
  // them out?
  $('#undo').text(msg('BUTTON_UNDO'));
  $('#redo').text(msg('BUTTON_REDO'));

  $('#trashcan').text(msg('DRAG_HERE_TO_REMOVE'));

  $('#gallery .loading').text(msg('LOADING'));
  $('#loading > div > span').text(msg('LOADING'));

  $('#new-street').text(msg('BUTTON_NEW_STREET'));
  $('#copy-last-street').text(msg('BUTTON_COPY_LAST_STREET'));

  $('#street-width-read').attr('title', msg('TOOLTIP_STREET_WIDTH'));

  document.querySelector('#new-street').href = URL_NEW_STREET;
  document.querySelector('#copy-last-street').href = URL_NEW_STREET_COPY_LAST;

  _fillEmptySegments();
}

function _setupNoInternetMode() {
  // Disable all external links
  // CSS takes care of altering their appearance to resemble normal text
  $('body').on('click', 'a[href^="http"]', function (e) {
    e.preventDefault();
  })
}
