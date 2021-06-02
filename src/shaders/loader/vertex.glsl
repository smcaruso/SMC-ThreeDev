            varying vec2 vUV;

            void main() {
                gl_Position = vec4(position, 1.0);
                vUV = uv;
            }