var eventsMatrix = [[]];

var loadJS = function(url, implementationCode, location){
    //url is URL of external file, implementationCode is the code
    //to be called from the file, location is the location to 
    //insert the <script> element

    var scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = implementationCode;
    scriptTag.onreadystatechange = implementationCode;

    location.appendChild(scriptTag);
};

var mainFunction = async function(){
    var UHButtonText;
    var UHButtonColor;
    var UHTextColor;
    var UHPlacementMode;
    var UHAutomaticPosition;
    var UHManualContainerID;

    if(typeof UserHelpButtonText !== 'undefined') {
        UHButtonText = UserHelpButtonText;
    }
    if(typeof UserHelpButtonColor !== 'undefined') {
        UHButtonColor = UserHelpButtonColor
    }
    if(typeof UserHelpTextColor !== 'undefined') {
        UHTextColor = UserHelpTextColor
    }
    if(typeof UserHelpPlacementMode !== 'undefined') {
        UHPlacementMode = UserHelpPlacementMode
    }
    if(typeof UserHelpAutomaticPosition !== 'undefined') {
        UHAutomaticPosition = UserHelpAutomaticPosition
    }
    if(typeof UserHelpManualContainerID !== 'undefined') {
        UHManualContainerID = UserHelpManualContainerID
    }

    await fetch("https://us-central1-userhelp-30d32.cloudfunctions.net/app/getButtonData", {
        method: "POST",
        body: JSON.stringify({UserHelpPublicProjectID: UserHelpPublicProjectID})
    })
    .then(async(res) => {
        if(res.status == 500) {
            return;
        }
        const buttonData = await res.json()
        
        if(typeof UHButtonText == 'undefined') {
            UHButtonText = buttonData.UserHelpButtonText
        }
        if(typeof UHButtonColor == 'undefined') {
            UHButtonColor = buttonData.UserHelpButtonColor
        }
        if(typeof UHTextColor == 'undefined') {
            UHTextColor = buttonData.UserHelpTextColor
        }
        if(typeof UHPlacementMode == 'undefined') {
            UHPlacementMode = buttonData.UserHelpPlacementMode
        }
        if(typeof UHAutomaticPosition == 'undefined') {
            UHAutomaticPosition = buttonData.UserHelpAutomaticPosition
        }
        if(typeof UHManualContainerID == 'undefined') {
            UHManualContainerID = buttonData.UserHelpManualContainerID
        }
    })


    var drawerSection = document.createElement("section")
    drawerSection.id = "drawer-name"
    drawerSection.className = "drawer"
    drawerSection.setAttribute("data-drawer-target",true)
    drawerSection.innerHTML = `<div class="drawer__overlay" data-drawer-close tabindex="-1"></div>
    <div class="drawer__wrapper">
        <div class="drawer__header">
        <div style="font-family: sans-serif;font-weight: bold;font-size: 18px;color:black">
            ${UHButtonText}
        </div>
        <button class="drawer__close" data-drawer-close aria-label="Close Drawer"></button>
        </div>
        <div class="drawer__content">
        <iframe id="UserHelpIframe" frameBorder="0" style="width:100%; height:100%" src="https://platform.userhelp.co/bugReport/${UserHelpPublicProjectID}/${generateUUID()}"></iframe>

        </div>
    </div>`
    document.body.appendChild(drawerSection)

    drawer();

    if ("MutationObserver" in window) {
        rrwebRecord({
            emit(event, isCheckout) {
              // isCheckout is a flag to tell you the events has been checkout
              if (isCheckout) {
                eventsMatrix.push([]);
              }
              const lastEvents = eventsMatrix[eventsMatrix.length - 1];
              lastEvents.push(event);
            },
            checkoutEveryNms: 60 * 1000, // checkout every 60 seconds
        });
    }
    
    // Create the button element
    const userHelpButton = document.createElement("button");
    userHelpButton.id = "userHelpButton"
    
    // Set the button text
    userHelpButton.textContent = UHButtonText;

    // Set any additional styles if needed
    userHelpButton.style.backgroundColor = UHButtonColor
    userHelpButton.style.color = UHTextColor
    userHelpButton.style.display = "flex"
    userHelpButton.style.alignItems = "center"

    if(UHPlacementMode == "hidden") {
        userHelpButton.style.display = "none"
    }

    if(UHPlacementMode == "automatic") {
        switch (UHAutomaticPosition) {
            case "bottomRight":
                userHelpButton.classList.add("userHelpButtonBottomRight")
                break;
            
            case "bottomLeft":
                userHelpButton.classList.add("userHelpButtonBottomLeft")
                break;

            case "topRight":
                userHelpButton.classList.add("userHelpButtonTopRight")
                break;

            case "topLeft":
                userHelpButton.classList.add("userHelpButtonTopLeft")
                break;
        
            default:
                userHelpButton.classList.add("userHelpButtonBottomRight")
                break;
        }
    }

    userHelpButton.setAttribute("data-drawer-trigger","true")
    userHelpButton.setAttribute("aria-controls","drawer-name")
    userHelpButton.setAttribute("aria-expanded","false")

    // Function to be executed when the button is clicked
    function handleClick() {
        var result = bowser.getParser(window.navigator.userAgent);
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`url${window.location.href}`, "*");
        iframe.contentWindow.postMessage(`browser${JSON.stringify({...result.parsedResult, size:{
            width:window.innerWidth,
            height:window.innerHeight
        }})}`, "*");
    }

    window.addEventListener('message', function(event) {
        if(event.data == "captureScreenshot") {
            captureScreenshot()
        }

        if(event.data == "getLatestRecording") {
            try {
                const iframe = document.getElementById("UserHelpIframe");
                const len = eventsMatrix.length;
                const events = len > 1 ? eventsMatrix[len - 2].concat(eventsMatrix[len - 1]):eventsMatrix[len - 1]
                if(events.length > 0) {
                    iframe.contentWindow.postMessage(`recording${JSON.stringify({events})}`, "*");
                }
            } catch (error) {
                console.log("Error getting recording", error)
            }
        }
    })

    window.onerror = function (msg, url, lineNo, columnNo, error) {
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`error${JSON.stringify({
            msg:msg,
            url:url,
            lineNo:lineNo,
            columnNo:columnNo,
            error:error
        })}`, "*");
    }

    async function captureScreenshot() {
        document.getElementsByClassName("drawer__overlay")[0].click();
        setTimeout(async function() {

            const browser = bowser.getParser(window.navigator.userAgent);
            const isValidBrowser = browser.satisfies({
            desktop:{
                chrome: ">=94",
                edge: ">=94",
                opera: ">=80",
            }
            });

            if(isValidBrowser) {
                navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' }, preferCurrentTab:true })
                .then((stream) => {
                    const videoTrack = stream.getVideoTracks()[0];
                    const imageCapture = new ImageCapture(videoTrack);

                    imageCapture.grabFrame()
                    .then(async(imageBitmap) => {

                        const canvas = document.createElement('canvas');
                        canvas.width = imageBitmap.width;
                        canvas.height = imageBitmap.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(imageBitmap, 0, 0);
                        const screenshotDataUrl = canvas.toDataURL('image/png');
                        sendScreenshot(screenshotDataUrl)
                    })
                    .catch((error) => {
                        console.error('Error capturing screenshot:', error);
                    })
                    .finally(() => {
                        videoTrack.stop();
                    });
                })
                .catch((error) => {
                    console.log(error)
                });
            } else {
                createLoadingOverlay();
                html2canvas(document.body, {
                    proxy:"https://us-central1-userhelp-30d32.cloudfunctions.net/app/proxy",
                    y:document.documentElement.scrollTop || document.body.scrollTop,
                    height:window.innerHeight,
                    logging:false,
                }).then(function(canvas) {
                    const screenshotDataUrl = canvas.toDataURL('image/png')
                    sendScreenshot(screenshotDataUrl)
                    removeLoadingOverlay()
                })
            }
        }, 500);
    }

    // Attach the event listener to the button
    userHelpButton.addEventListener("click", handleClick);

    // Append the button to the body of the website
    var placement = null;
    if(typeof UHManualContainerID !== 'undefined' && UHPlacementMode == "manual") {
        placement = document.getElementById(UHManualContainerID)
    }
    if(placement) {
        placement.appendChild(userHelpButton)
    } else {
        document.body.appendChild(userHelpButton);
    }

    window.UserHelpSetName = function(name) {
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`setName${JSON.stringify(name)}`, "*");
    }
    window.UserHelpSetEmail = function(email) {
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`setEmail${JSON.stringify(email)}`, "*");
    }
    window.UserHelpSetUserID = function(userID) {
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`setUserID${JSON.stringify(userID)}`, "*");
    }

    window.openUserHelpButton = function() {
        userHelpButton.click()
    }
    
    const performance = window.performance;
    new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            const { name, initiatorType, duration, transferSize } = entry;
    
            const internalResources = ["markerjs2","userhelp","bowser","rrweb","html2canvas","web-vitals"]

            if(internalResources.some(resource => name.includes(resource))) {
                return;
            }

            const resource = {
                name: name,
                initiatorType: initiatorType,
                duration: duration,
                transferSize: transferSize
            }

            const iframe = document.getElementById("UserHelpIframe");
            iframe.contentWindow.postMessage(`addResourcePerformance${JSON.stringify(resource)}`, "*");
        });
    }).observe({ type: 'resource', buffered:true })


    new PerformanceObserver((list) => {
        list.getEntries().forEach((navigationEntry) => {
            const navigation = {
                domContentLoadedTime: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
                loadTime: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
                redirectCount: navigationEntry.redirectCount,
                redirectTime: navigationEntry.redirectEnd - navigationEntry.redirectStart
            }
            const iframe = document.getElementById("UserHelpIframe");
            iframe.contentWindow.postMessage(`setNavigationPerformance${JSON.stringify(navigation)}`, "*");
        });
    }).observe({ type: 'navigation', buffered:true })

    performance.clearResourceTimings();

    var webVitalsDetails = {
        CLS:null,
        FID:null,
        LCP:null
    }
    webVitals.onCLS(function(e) {
        webVitalsDetails.CLS = e;
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`setWebVitals${JSON.stringify(webVitalsDetails)}`, "*");
    });
    webVitals.onFID(function(e) {
        webVitalsDetails.FID = e;
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`setWebVitals${JSON.stringify(webVitalsDetails)}`, "*");
    });
    webVitals.onLCP(function(e) {
        webVitalsDetails.LCP = e;
        const iframe = document.getElementById("UserHelpIframe");
        iframe.contentWindow.postMessage(`setWebVitals${JSON.stringify(webVitalsDetails)}`, "*");
    });

    window.isUserHelpReady = true;
}

var drawer = function () {
    if (!Element.prototype.closest) {
        if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
        }
        Element.prototype.closest = function (s) {
        var el = this;
        var ancestor = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (ancestor.matches(s)) return ancestor;
            ancestor = ancestor.parentElement;
        } while (ancestor !== null);
        return null;
        };
    }


    // Trap Focus 
    // https://hiddedevries.nl/en/blog/2017-01-29-using-javascript-to-trap-focus-in-an-element
    //
    function trapFocus(element) {
        var focusableEls = element.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
        var firstFocusableEl = focusableEls[0];  
        var lastFocusableEl = focusableEls[focusableEls.length - 1];
        var KEYCODE_TAB = 9;

        element.addEventListener('keydown', function(e) {
        var isTabPressed = (e.key === 'Tab' || e.keyCode === KEYCODE_TAB);

        if (!isTabPressed) { 
            return; 
        }

        if ( e.shiftKey ) /* shift + tab */ {
            if (document.activeElement === firstFocusableEl) {
            lastFocusableEl.focus();
                e.preventDefault();
            }
            } else /* tab */ {
            if (document.activeElement === lastFocusableEl) {
            firstFocusableEl.focus();
                e.preventDefault();
            }
            }
        });
    }       


    //
    // Settings
    //
    var settings = {
        speedOpen: 50,
        speedClose: 350,
        activeClass: 'is-active',
        visibleClass: 'is-visible',
        selectorTarget: '[data-drawer-target]',
        selectorTrigger: '[data-drawer-trigger]',
        selectorClose: '[data-drawer-close]',
    };

    //
    // Methods
    //

    // Toggle accessibility
    var toggleAccessibility = function (event) {
        if (event.getAttribute('aria-expanded') === 'true') {
        event.setAttribute('aria-expanded', false);
        } else {
        event.setAttribute('aria-expanded', true);
        }   
    };

    // Open Drawer
    var openDrawer = function (trigger) {

        // Find target
        var target = document.getElementById(trigger.getAttribute('aria-controls'));

        // Make it active
        target.classList.add(settings.activeClass);

        // Make body overflow hidden so it's not scrollable
        document.documentElement.style.overflow = 'hidden';

        // Toggle accessibility
        toggleAccessibility(trigger);

        // Make it visible
        setTimeout(function () {
        target.classList.add(settings.visibleClass);
        trapFocus(target);
        }, settings.speedOpen); 

    };

    // Close Drawer
    var closeDrawer = function (event) {

        // Find target
        var closestParent = event.closest(settings.selectorTarget),
        childrenTrigger = document.querySelector('[aria-controls="' + closestParent.id + '"');

        // Make it not visible
        closestParent.classList.remove(settings.visibleClass);

        // Remove body overflow hidden
        document.documentElement.style.overflow = '';

        // Toggle accessibility
        toggleAccessibility(childrenTrigger);

        // Make it not active
        setTimeout(function () {
        closestParent.classList.remove(settings.activeClass);
        }, settings.speedClose);             

    };

    // Click Handler
    var clickHandler = function (event) {

        // Find elements
        var toggle = event.target,
        open = toggle.closest(settings.selectorTrigger),
        close = toggle.closest(settings.selectorClose);

        // Open drawer when the open button is clicked
        if (open) {
        openDrawer(open);
        }

        // Close drawer when the close button (or overlay area) is clicked
        if (close) {
        closeDrawer(close);
        }

        // Prevent default link behavior
        if (open || close) {
        event.preventDefault();
        }

    };

    // Keydown Handler, handle Escape button
    var keydownHandler = function (event) {

        if (event.key === 'Escape' || event.keyCode === 27) {

        // Find all possible drawers
        var drawers = document.querySelectorAll(settings.selectorTarget),
            i;

        // Find active drawers and close them when escape is clicked
        for (i = 0; i < drawers.length; ++i) {
            if (drawers[i].classList.contains(settings.activeClass)) {
            closeDrawer(drawers[i]);
            }
        }

        }

    };

    //
    // Inits & Event Listeners
    //
    document.addEventListener('click', clickHandler, false);
    document.addEventListener('keydown', keydownHandler, false);

};

window.onload = function() {
    var link = document.createElement( "link" );
    link.href = "https://cdn.jsdelivr.net/gh/jyant-labs/userhelp-public@main/userhelp-public.min.css";
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName( "head" )[0].appendChild( link );

    link.onload = function() {
        loadJS('https://unpkg.com/markerjs2/markerjs2.js', function() {
            loadJS('https://cdn.jsdelivr.net/npm/bowser@2.11.0/es5.min.js', function() {
                loadJS("https://cdn.jsdelivr.net/npm/rrweb@latest/dist/record/rrweb-record.min.js", function() {
                    loadJS('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', function() {
                        loadJS("https://unpkg.com/web-vitals", mainFunction, document.head)
                    }, document.head)
                },document.head)
            }, document.head);
        }, document.head)        
    }       
}

const generateUUID = () => {
    let
      d = new Date().getTime(),
      d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      let r = Math.random() * 16;
      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
};

function sendScreenshot(screenshotDataUrl) {
    const img = document.createElement("img")
    img.setAttribute('crossorigin', 'anonymous')
    img.src = screenshotDataUrl

    img.onload = function() {
        document.body.appendChild(img)
        const markerArea = new markerjs2.MarkerArea(img);
        markerArea.uiStyleSettings.canvasBackgroundColor = "#1F2125"
        markerArea.settings.displayMode = 'popup';
        markerArea.addEventListener("render", (event) =>
        {
            const iframe = document.getElementById("UserHelpIframe");
            iframe.contentWindow.postMessage(event.dataUrl, "*");
        });
        markerArea.show();
        markerArea.addEventListener("close", (event) =>
        {
            document.body.removeChild(img)
            document.getElementById("userHelpButton").click();
        });
    }

}

function createLoadingOverlay() {
    // Create the overlay container
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'UH-loading-overlay';
    overlayContainer.setAttribute("data-html2canvas-ignore",true)

    // Create the overlay content with a spinner
    const overlayContent = document.createElement('div');
    overlayContent.classList.add('UH-overlay-content');
    overlayContent.setAttribute("data-html2canvas-ignore",true)

    const spinner = document.createElement('div');
    spinner.classList.add('UH-spinner');
    spinner.setAttribute("data-html2canvas-ignore",true)

    overlayContent.appendChild(spinner);
    overlayContainer.appendChild(overlayContent);
    
    document.body.appendChild(overlayContainer);
}

function removeLoadingOverlay() {
    const overlay = document.getElementById('UH-loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}
