//console.log("hello");
//建立Shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (ok) return shader;

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (ok) return program;

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);

}

const vertexShaderSource = `
attribute vec2 a_position;
void main(){
    gl_Position =  vec4(a_position,0,1);
}
`;

const fragmentShaderSource = `
void main(){
    gl_FragColor = vec4(0.4745, 0.3333, 0.2823, 1);
}
`;

//取得gl
const gl = canvas.getContext('webgl');
window.gl = gl;

//
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
console.log({ positionAttributeLocation });
//建立buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(
    positionAttributeLocation,
    2,//size
    gl.FLOAT, //type
    false,//normalize
    0,//stride
    0,//offset
);
//填充資料
gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
        0, 0.2,
        0.2, -0.1,
        -0.2, -0.1,
    ]),
    gl.STATIC_DRAW,
);
gl.useProgram(program);


gl.clearColor(108 / 255, 225 / 255, 153 / 255, 1);
gl.clear(gl.COLOR_BUFFER_BIT);


gl.drawArrays(gl.TRIANGLES, 0, 3);


