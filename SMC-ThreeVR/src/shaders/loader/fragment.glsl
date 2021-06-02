            uniform float uAlpha;
            uniform float uMouseX;
            uniform float uMouseY;

            varying vec2 vUV;

            void main() {

                gl_FragColor = vec4(
                    vUV.y * uMouseY + 0.5 * .125, // R
                    0, // G
                    vUV.x * uMouseX + 0.5 * 0.25, // B
                    uAlpha // A
                );

            }