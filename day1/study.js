document.addEventListener("DOMContentLoaded", function (event)
{
    main();
});


function main () {

    // canvas
    var canvas = document.getElementById("canvas");
    canvas.width = 400;
    canvas.height = 400;
    var gl = canvas.getContext("webgl");


    // clear
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // 空のバッファオブジェクトを生成
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);


    // 頂点シェーダー
    var vSource = [
        "precision mediump float;",
        "attribute vec2 vertex;",
        "void main(void) {",
            "gl_Position = vec4(vertex, 0.0, 1.0);",
        "}"
    ].join("\n");

    var vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vSource);
    gl.compileShader(vShader);
    gl.getShaderParameter(vShader, gl.COMPILE_STATUS);


    // フグメントシェーダー
    var rgba = [255, 255, 255, 255]; // Red, Green, Blue, Alpha
    var fSource = [
        "precision mediump float;",
        "void main(void) {",
        "vec4 color = vec4("+ rgba.join(",") +");",
        "gl_FragColor = color / 255.0;",
        "}"
    ].join("\n");

    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fSource);
    gl.compileShader(fShader);
    gl.getShaderParameter(fShader, gl.COMPILE_STATUS);


    // プログラムオブジェクトの生成
    var program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.getProgramParameter(program, gl.LINK_STATUS);
    gl.useProgram(program);


    // シェーダー側の変数をjs側で受け受け取る
    var vertex = gl.getAttribLocation(program, "vertex");
    gl.enableVertexAttribArray(vertex);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, 0, 0);


    // 描画する
    // 座標
    var vertices = [
        //  x座標, y座標
        0.0,  0.0,
        1.0,  1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length/2);

}