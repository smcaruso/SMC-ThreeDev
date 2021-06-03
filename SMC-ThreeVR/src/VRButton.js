class VRButton {

	static createButton( renderer, options ) {

		if ( options ) {

			console.error( 'THREE.VRButton: The "options" parameter has been removed. Please set the reference space type via renderer.xr.setReferenceSpaceType() instead.' );

		}

		const button = document.createElement( 'button' );

		function showEnterVR( /*device*/ ) {

			let currentSession = null;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				await renderer.xr.setSession( session );
				button.textContent = 'Exit VR';

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				button.textContent = 'Enter VR';

				currentSession = null;

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = '25%';
			button.style.width = '50%';
			button.style.height = "100px;"

			button.textContent = 'Enter VR';

			button.onmouseenter = function () {

				button.style.background = 'rgb(180, 10, 10)';

			};

			button.onmouseleave = function () {

				button.style.background = 'rgb(255, 50, 50)';

			};

			button.onclick = function () {

				if ( currentSession === null ) {

					// WebXR's requestReferenceSpace only works if the corresponding feature
					// was requested at session creation time. For simplicity, just ask for
					// the interesting ones as optional features, but be aware that the
					// requestReferenceSpace call will fail if it turns out to be unavailable.
					// ('local' is always available for immersive sessions and doesn't need to
					// be requested separately.)

					const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor', 'hand-tracking' ] };
					navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function disableButton() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = '25%';
			button.style.width = '50%';
			button.style.background = 'rgb(100, 100, 100)';
			element.style.setProperty("box-shadow", "0.25em 0.25em 0.5em rgba(0, 0, 0, 0.5)");

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

		}

		function showWebXRNotFound() {

			disableButton();

			button.innerHTML = 'VR not supported, try <a href="https://www.smcaruso.com/">smcaruso.com</a>';

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.left = '25%';
			element.style.width = '50%';
			element.style.bottom = '1em';
			element.style.border = 'none';
			element.style.background = 'rgb(255, 50, 50)';
			element.style.color = 'rgb(255, 255, 255)';
			element.style.setProperty("font-size", "200%");
			element.style.setProperty("font-weight", "800");
			element.style.setProperty("box-shadow", "0.25em 0.25em 0.5em rgba(0, 0, 0, 0.5)");
			element.style.padding = '0.5em';
			element.style.textAlign = 'center';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		if ( 'xr' in navigator ) {

			button.id = 'VRButton';
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( supported ) {

				supported ? showEnterVR() : showWebXRNotFound();

			} );

			return button;

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {
				
				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WebXR requires HTTPS'; // TODO Improve message

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'VR not supported, try <a href="https://www.smcaruso.com/">smcaruso.com</a>';


			}

			message.style.textDecoration = 'none';

			stylizeElement( message );
			message.style.background = 'rgb(100, 100, 100)';

			return message;

		}

	}

}

export { VRButton };
