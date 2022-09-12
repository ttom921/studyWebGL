import { createShader, createProgram, loadImage } from './lib/utils.js';

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_offset;

varying vec2 v_texcoord;
void main() {
    vec2 position= a_position + u_offset;
    gl_Position = vec4(
        position / u_resolution * vec2(2,-2) + vec2(-1,1),
        0,1
    );
    v_texcoord=a_texcoord;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture,v_texcoord);
}
`;
async function setup() {
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl');

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    const attributes = {
        position: gl.getAttribLocation(program, 'a_position'),
        texcoord: gl.getAttribLocation(program, 'a_texcoord'),
    };
    const uniforms = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        texture: gl.getUniformLocation(program, 'u_texture'),
        offset: gl.getUniformLocation(program, 'u_offset'),
    };
    //image process
    //建立三張texture
    const textures = await Promise.all([
        'https://i.imgur.com/EDLB71ih.jpg',
        'https://i.imgur.com/KT2nqZNh.jpg',
        'https://i.imgur.com/diRWq5ph.jpg',
    ].map(async url => {
        const image = await loadImage(url);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,//level
            gl.RGB,//internalFormat
            gl.RGB,//format
            gl.UNSIGNED_BYTE,//type
            image,//data
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return texture;
    }));


    //a_position
    const buffers = {};
    buffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.enableVertexAttribArray(attributes.position);
    gl.vertexAttribPointer(
        attributes.position,
        2,//size
        gl.FLOAT,//type
        false,//normalize
        0,//stride
        0,//offset
    );
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            0, 0,//A
            150, 0,//B
            150, 150,//C

            0, 0, //D
            150, 150,//E
            0, 150,//F
        ]),
        gl.STATIC_DRAW,
    );

    // a_texcoord
    buffers.texcoord = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);

    gl.enableVertexAttribArray(attributes.texcoord);
    gl.vertexAttribPointer(
        attributes.texcoord,
        2,//size
        gl.FLOAT,//type
        false,// normalize
        0,//stride
        0,//offset
    );
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            0, 0,//A
            1, 0,//B
            1, 1,//C

            0, 0,//D
            1, 1,//E
            0, 1//F
        ]),
        gl.STATIC_DRAW,
    );
    //
    const directionDeg = Math.random() * 2 * Math.PI;
    return {
        gl,
        program, attributes, uniforms,
        buffers, textures,
        state: {
            texture: 0,
            offset: [0, 0],
            direction: [Math.cos(directionDeg), Math.sin(directionDeg)],
            speed: 0.08,
        },
        time: 0,
    };
}
async function render(app) {
    const {
        gl,
        program, uniforms,
        textures,
        state,
    } = app;
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(program);

    gl.uniform2f(uniforms.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2fv(uniforms.offset, state.offset);

    // texture uniform
    const textureUnit = 0;
    gl.bindTexture(gl.TEXTURE_2D, textures[state.texture]);
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.uniform1i(uniforms.texture, textureUnit);
    //
    // gl.clearColor(108 / 255, 225 / 255, 153 / 255, 1);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    //
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function startLoop(app, now = 0) {
    const { state, gl } = app;
    const timeDiff = now - app.time;
    app.time = now;
    state.offset = state.offset.map(
        (v, i) => v + state.direction[i] * timeDiff + state.speed
    );
    if (state.offset[0] + 150 > gl.canvas.width) {
        state.direction[0] *= -1;
        state.offset[0] = gl.canvas.width = 150;
    } else if (state.offset[0] < 0) {
        state.direction[0] *= -1;
        state.offset[0] = 0;
    }

    if (state.offset[1] + 150 > gl.canvas.height) {
        state.direction[1] *= -1;
        state.offset[1] = gl.canvas.height - 150;
    } else if (state.offset[1] < 0) {
        state.direction[1] *= -1;
        state.offset[1] = 0
    }
    render(app);
    requestAnimationFrame(now => startLoop(app, now));
}
async function main() {

    const app = await setup();
    window.app = app;
    window.gl = app.gl;
    const controlsForm = document.getElementById('controls');
    controlsForm.addEventListener('input', () => {
        const fromData = new FormData(controlsForm);
        app.state.texture = parseInt(fromData.get('texture'));
        app.state.speed = parseFloat(fromData.get('speed'));
        //console.log(`speed=`, app.state.speed);
    });
    startLoop(app);
}

main();