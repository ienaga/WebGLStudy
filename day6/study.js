document.addEventListener("DOMContentLoaded", function (event)
{
    main();
});


function main () {

    // canvas
    var w = 400; // 幅
    var h = 400; // 高さ
    var canvas = document.getElementById("canvas");
    canvas.width = w;
    canvas.height = h;
    var gl = canvas.getContext("webgl");


    // 座標セット
    // 始点
    var x = 50; // x座標
    var y = 280; // y座標

    // 終点
    var dx = 350; // x座標
    var dy = 130; // y座標

    // 線太さ
    var lineWidth = 100;


    // 始点と終点の角度を取得
    var angle = Math.atan2(y - dy, x - dx) / (Math.PI / 180) * -1;

    // border
    var lw = lineWidth + 1;

    // 4点の座標をセット
    var x1 = x + Math.cos((angle + 270) * Math.PI / 180) * lw / 2;
    var y1 = y + Math.sin((angle + 270) * Math.PI / 180) * lw / 2 * -1;

    var x2 = dx + Math.cos((angle + 270) * Math.PI / 180) * lw / 2;
    var y2 = dy + Math.sin((angle + 270) * Math.PI / 180) * lw / 2 * -1;

    var x3 = dx + Math.cos((angle + 90) * Math.PI / 180) * lw / 2;
    var y3 = dy + Math.sin((angle + 90) * Math.PI / 180) * lw / 2 * -1;

    var x4 = x + Math.cos((angle + 90) * Math.PI / 180) * lw / 2;
    var y4 = y + Math.sin((angle + 90) * Math.PI / 180) * lw / 2 * -1;

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (x2-(w/2))/(w/2), -(y2-(h/2))/(h/2),
        (x3-(w/2))/(w/2), -(y3-(h/2))/(h/2),
        (x4-(w/2))/(w/2), -(y4-(h/2))/(h/2)
    ];


    // clear
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // alphaを有効にする
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);


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


    // 線のフグメントシェーダー
    var rgba = [0.0, 0.0, 0.0, 1.0]; // Red, Green, Blue, Alpha

    // 4点からzを算出
    function edge (x0, y0, x1, y1, h)
    {
        var x = x1 - x0;
        var y = y1 - y0;
        var _y0 = (h - y0);
        var _y1 = (h - y1);

        var edges = [];
        var scale = 1.0 / Math.sqrt(x * x + y * y);
        edges[edges.length] = (_y0 - _y1) * scale;
        edges[edges.length] = (x1 - x0) * scale;
        edges[edges.length] = (x0 * _y1 - x1 * _y0) * scale;
        return edges;
    }

    var e0 = edge(x2, y2, x1, y1, h);
    var e1 = edge(x4, y4, x3, y3, h);

    var fSource = [
        "precision mediump float;",
        "void main(void) {",
            "vec3 pos = vec3(gl_FragCoord.xy, 1.0);",
            "float a0 = clamp(dot(vec3("+ e0.join(",") +"), pos), 0.0, 1.0);",
            "float a1 = clamp(dot(vec3("+ e1.join(",") +"), pos), 0.0, 1.0);",
            "gl_FragColor = vec4("+ rgba.join(",") +") * min(a0, a1);",
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length/2);
    


    // 先端の三角形の長さ
    var rl = (lineWidth / 2) / Math.cos(45 * Math.PI / 180);



    // 先端の描画 - 1


    // 円のフグメントシェーダー
    var rgba = [0.0, 0.0, 0.0, 1.0]; // Red, Green, Blue, Alpha
    var fSource = [
        "precision mediump float;",
        "void main(void) {",
            "vec3 s = vec3("+ x +", "+ (h - y) +", "+ (lineWidth / 2) +");",
            "float x = gl_FragCoord.x - s[0];",
            "float y = gl_FragCoord.y - s[1];",
            "float d = sqrt(x * x + y * y);",
            "float r = s[2] + 0.5;",
            "if (d < r) {",
                "vec4 color = vec4("+ rgba.join(",") +");",
                "float alpha = clamp(1.0 - (d + 1.0 - r), 0.0, 1.0);",
                "gl_FragColor = color * alpha;",
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


    // 先端の三角形の座標
    var x1 = x + Math.cos(angle * Math.PI / 180) * rl;
    var y1 = y + Math.sin(angle * Math.PI / 180) * rl * -1;

    var x2 = x + Math.cos((angle - 90) * Math.PI / 180) * rl;
    var y2 = y + Math.sin((angle - 90) * Math.PI / 180) * rl * -1;

    var x3 = x + Math.cos((angle - 270) * Math.PI / 180) * rl;
    var y3 = y + Math.sin((angle - 270) * Math.PI / 180) * rl * -1;

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (x2-(w/2))/(w/2), -(y2-(h/2))/(h/2),
        (x3-(w/2))/(w/2), -(y3-(h/2))/(h/2)
    ];


    // 描画する
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length/2);



    // 先端の描画 - 1


    // 円のフグメントシェーダー
    var rgba = [0.0, 0.0, 0.0, 1.0]; // Red, Green, Blue, Alpha
    var fSource = [
        "precision mediump float;",
        "void main(void) {",
            "vec3 s = vec3("+ dx +", "+ (h - dy) +", "+ (lineWidth / 2) +");",
            "float x = gl_FragCoord.x - s[0];",
            "float y = gl_FragCoord.y - s[1];",
            "float d = sqrt(x * x + y * y);",
            "float r = s[2] + 0.5;",
            "if (d < r) {",
                "vec4 color = vec4("+ rgba.join(",") +");",
                "float alpha = clamp(1.0 - (d + 1.0 - r), 0.0, 1.0);",
                "gl_FragColor = color * alpha;",
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


    // 先端の三角形の座標
    var x1 = dx + Math.cos((angle + 90) * Math.PI / 180) * rl;
    var y1 = dy + Math.sin((angle + 90) * Math.PI / 180) * rl * -1;

    var x2 = dx + Math.cos((angle + 180) * Math.PI / 180) * rl;
    var y2 = dy + Math.sin((angle + 180) * Math.PI / 180) * rl * -1;

    var x3 = dx + Math.cos((angle + 270) * Math.PI / 180) * rl;
    var y3 = dy + Math.sin((angle + 270) * Math.PI / 180) * rl * -1;

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (x2-(w/2))/(w/2), -(y2-(h/2))/(h/2),
        (x3-(w/2))/(w/2), -(y3-(h/2))/(h/2)
    ];


    // 描画する
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length/2);


}