document.addEventListener("DOMContentLoaded", function (event)
{
    main();
});


function main () {

    // 座標
    var x = 200; // 中心x座標
    var y = 200; // 中心y座標
    var r = 80; // 半径

    // canvas
    var w = 400; // 幅
    var h = 400; // 高さ
    var canvas = document.getElementById("canvas");
    canvas.width = w;
    canvas.height = h;
    var gl = canvas.getContext("webgl");


    // clear
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // 空のバッファオブジェクトを生成
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);


    // バーテックス(頂点)シェーダー
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
    var rgba = [0.0, 0.0, 0.0, 1.0]; // Red, Green, Blue, Alpha
    var fSource = [
        "precision mediump float;",
        "void main(void) {",
            "vec3 s = vec3("+ x +", "+ (h - y) +", "+ r +");",
            "float x = gl_FragCoord.x - s[0];",
            "float y = gl_FragCoord.y - s[1];",
            "if (sqrt(x * x + y * y) < s[2]) {",
                "gl_FragColor = vec4("+ rgba.join(",") +");",
            "} else {",
                "discard;",
            "}",
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

    // 座標セット

    // 4点の座標をセット
    var x1 = x - r;
    var y1 = y - r;

    var x2 = x + r;
    var y2 = y - r;

    var x3 = x - r;
    var y3 = y + r;

    var x4 = x + r;
    var y4 = y + r;

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (x2-(w/2))/(w/2), -(y2-(h/2))/(h/2),
        (x3-(w/2))/(w/2), -(y3-(h/2))/(h/2),
        (x4-(w/2))/(w/2), -(y4-(h/2))/(h/2)
    ];


    // 描画する
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length/2);


}