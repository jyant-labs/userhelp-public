var link = document.createElement( "link" );
link.href = "https://cdn.jsdelivr.net/gh/jyant-labs/userhelp-public@latest/userhelp-public.min.css";
link.type = "text/css";
link.rel = "stylesheet";

document.getElementsByTagName( "head" )[0].appendChild( link );

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


var yourCodeToBeCalled = function(){
    // Create the button element
    const userHelpButton = document.createElement("button");
    userHelpButton.id = "userHelpButton"

    // Set the button text
    userHelpButton.textContent = UserHelpButtonText;

    // Set any additional styles if needed
    userHelpButton.style.backgroundColor = UserHelpButtonColor
    userHelpButton.style.color = UserHelpTextColor

    if(UserHelpPlacementMode == "automatic") {
        switch (UserHelpAutomaticPosition) {
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

    }

    window.addEventListener('message', function(event) {
        if(event.data == "captureScreenshot") {
            captureScreenshot()
        }
    });

    window.onerror = function(e) {
        console.log(e)
    }
    

    async function captureScreenshot() {
        document.getElementsByClassName("drawer__overlay")[0].click();
        setTimeout(function(){
            if(getMobileOperatingSystem() != "Android" && getMobileOperatingSystem() != "iOS") {
                navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' }, preferCurrentTab:true })
                .then((stream) => {
                    const videoTrack = stream.getVideoTracks()[0];
                    const imageCapture = new ImageCapture(videoTrack);

                    imageCapture.grabFrame()
                    .then((imageBitmap) => {
                        const canvas = document.createElement('canvas');
                        canvas.width = imageBitmap.width;
                        canvas.height = imageBitmap.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(imageBitmap, 0, 0);
                        const screenshotDataUrl = canvas.toDataURL('image/png');
                        const iframe = document.getElementById("UserHelpIframe");
                        iframe.contentWindow.postMessage(screenshotDataUrl, "*");
                        document.getElementById("userHelpButton").click();
                        // Do something with the screenshotDataUrl, such as displaying it in an image element or sending it to a server.
                    })
                    .catch((error) => {
                        console.error('Error capturing screenshot:', error);
                    })
                    .finally(() => {
                        videoTrack.stop();
                    });
                })
                .catch((error) => {
                    console.error('Error accessing screen:', error);
                });
            } else {
                html2canvas(document.body).then(function(canvas) {
                    const screenshotDataUrl = canvas.toDataURL('image/png');
                    const iframe = document.getElementById("UserHelpIframe");
                    iframe.contentWindow.postMessage(screenshotDataUrl, "*");
                    document.getElementById("userHelpButton").click();
                });
            }
            
        }, 350);
    }


    // Attach the event listener to the button
    userHelpButton.addEventListener("click", handleClick);

    // Append the button to the body of the website
    const placement = document.getElementById("UserHelpManualContainerID")
    if(placement) {
        placement.appendChild(userHelpButton)
        console.log("cant find placement")
    } else {
        document.body.appendChild(userHelpButton);
    }
}

window.onload = function() {
    if(getMobileOperatingSystem() != "Android" && getMobileOperatingSystem() != "iOS") {
        yourCodeToBeCalled()
    } else {
        loadJS('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', yourCodeToBeCalled, document.head);
    }
}

function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

var drawer = function () {

    /**
    * Element.closest() polyfill
    * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
    */
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

drawer();

document.write(`
<section class="drawer" id="drawer-name" data-drawer-target>
<div class="drawer__overlay" data-drawer-close tabindex="-1"></div>
<div class="drawer__wrapper">
    <div class="drawer__header">
    <div style="font-family: sans-serif;font-weight: bold;">
        ${UserHelpButtonText}
    </div>
    <button class="drawer__close" data-drawer-close aria-label="Close Drawer"></button>
    </div>
    <div class="drawer__content">
    <iframe id="UserHelpIframe" frameBorder="0" style="width:100%; height:100%" src="https://app.userhelp.co/template/${UserHelpPublicProjectID}/${crypto.randomUUID()}"></iframe>
    </div>
</div>
</section>`)