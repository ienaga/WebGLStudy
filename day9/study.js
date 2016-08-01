document.addEventListener("DOMContentLoaded", function (event)
{
    main();
});


function main () {

    // canvas
    var w = 500; // 幅
    var h = 500; // 高さ
    var canvas = document.getElementById("canvas");
    canvas.width = w;
    canvas.height = h;
    var gl = canvas.getContext("webgl");


    // 座標セット
    // 始点
    var x = 100; // x座標
    var y = 300; // y座標

    // 放物線座標
    var cx = 250; // x座標
    var cy = 100; // y座標

    // 終点
    var dx = 400; // x座標
    var dy = 300; // y座標

    // 線太さ
    var lineWidth = 100;


    // 始点と放物線座標、終点と放物線座標の角度を取得
    var angle1 = Math.atan2(y - cy, x - cx) / (Math.PI / 180) * -1;
    var angle2 = Math.atan2(dy - cy, dx - cx) / (Math.PI / 180) * -1;

    // 角度
    var a1 = 270;
    var a2 = 90;
    if (angle1 > 0) {
        a1 = 90;
        a2 = 270;
    }

    // border
    var lw = lineWidth + 1;

    // 4点の座標をセット
    var x1 = x + Math.cos((angle1 + a1) * Math.PI / 180) * lw / 2;
    var y1 = y + Math.sin((angle1 + a1) * Math.PI / 180) * lw / 2 * -1;

    var x2 = dx + Math.cos((angle2 - a1) * Math.PI / 180) * lw / 2;
    var y2 = dy + Math.sin((angle2 - a1) * Math.PI / 180) * lw / 2 * -1;

    var x3 = dx + Math.cos((angle2 - a2) * Math.PI / 180) * lw / 2;
    var y3 = dy + Math.sin((angle2 - a2) * Math.PI / 180) * lw / 2 * -1;

    var x4 = x + Math.cos((angle1 + a2) * Math.PI / 180) * lw / 2;
    var y4 = y + Math.sin((angle1 + a2) * Math.PI / 180) * lw / 2 * -1;

    // 外積から交差座標をセット
    var xc1 = cx + Math.cos((angle1 + a1) * Math.PI / 180) * lw / 2;
    var yc1 = cy + Math.sin((angle1 + a1) * Math.PI / 180) * lw / 2 * -1;
    var xc2 = cx + Math.cos((angle2 - a1) * Math.PI / 180) * lw / 2;
    var yc2 = cy + Math.sin((angle2 - a1) * Math.PI / 180) * lw / 2 * -1;

    // 外積
    var S1 = ((xc2 - x2) * (y1 - y2) - (yc2 - y2) * (x1 - x2)) / 2;
    var S2 = ((xc2 - x2) * (y2 - yc1) - (yc2 - y2) * (x2 - xc1)) / 2;

    var xc = x1 + (xc1 - x1) * (S1 / (S1 + S2));
    var yc = y1 + (yc1 - y1) * (S1 / (S1 + S2));

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (xc-(w/2))/(w/2), -(yc-(h/2))/(h/2),
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
    var fSource = [
        "precision highp float;",

        // From: http://research.microsoft.com/en-us/um/people/hoppe/ravg.pdf
        "float det(vec2 a, vec2 b) { return a.x * b.y - b.x * a.y; }",
        "vec2 get_distance_vector(vec2 b0, vec2 b1, vec2 b2) {",
            "float a = det(b0, b2), b = 2.0 * det(b1, b0), d = 2.0 * det(b2, b1);",
            "float f = b * d - a * a;",
            "vec2 d21 = b2 - b1, d10 = b1 - b0, d20 = b2 - b0;",
            "vec2 gf = 2.0 * (b * d21 + d * d10 + a * d20);",
            "gf = vec2(gf.y, -gf.x);",
            "vec2 pp = -f * gf / dot(gf, gf);",
            "vec2 d0p = b0 - pp;",
            "float ap = det(d0p, d20), bp = 2.0 * det(d10, d0p);",
            "float t = clamp((ap + bp) / (2.0 * a + b + d), 0.0 ,1.0);",
            "return mix(mix(b0, b1, t), mix(b1, b2, t), t);",
        "}",

        "void main(void) {",
            "vec2 xy = gl_FragCoord.xy;",
            "vec2 p0 = vec2("+ x +", "+ (h-y) +") - xy;",
            "vec2 p1 = vec2("+ cx +", "+ (h-cy) +") - xy;",
            "vec2 p2 = vec2("+ dx +", "+ (h-dy) +") - xy;",
            "float d = length(get_distance_vector(p0, p1, p2));",
            "vec2 t = vec2("+ (lineWidth/2) +", 0.0);",
            "float alpha = 1.0;",
            "if(d > t.x) {",
                "alpha = 1.0 - smoothstep(d, t.x, t.x + 0.25);",
            "}",
            "gl_FragColor = vec4("+ rgba.join(",") +") * alpha;",
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
                "float alpha = clamp(1.0 - (d + 1.0 - r), 0.0, 1.0);",
                "gl_FragColor = vec4("+ rgba.join(",") +") * alpha;",
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
    var x1 = x + Math.cos(angle1 * Math.PI / 180) * rl;
    var y1 = y + Math.sin(angle1 * Math.PI / 180) * rl * -1;

    var x2 = x + Math.cos((angle1 - 90) * Math.PI / 180) * rl;
    var y2 = y + Math.sin((angle1 - 90) * Math.PI / 180) * rl * -1;

    var x3 = x + Math.cos((angle1 - 270) * Math.PI / 180) * rl;
    var y3 = y + Math.sin((angle1 - 270) * Math.PI / 180) * rl * -1;

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (x2-(w/2))/(w/2), -(y2-(h/2))/(h/2),
        (x3-(w/2))/(w/2), -(y3-(h/2))/(h/2)
    ];


    // 描画する
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length/2);



    // 先端の描画 - 2


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
                "float alpha = clamp(1.0 - (d + 1.0 - r), 0.0, 1.0);",
                "gl_FragColor = vec4("+ rgba.join(",") +") * alpha;",
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
    var x1 = dx + Math.cos(angle2 * Math.PI / 180) * rl;
    var y1 = dy + Math.sin(angle2 * Math.PI / 180) * rl * -1;

    var x2 = dx + Math.cos((angle2 - 90) * Math.PI / 180) * rl;
    var y2 = dy + Math.sin((angle2 - 90) * Math.PI / 180) * rl * -1;

    var x3 = dx + Math.cos((angle2 - 270) * Math.PI / 180) * rl;
    var y3 = dy + Math.sin((angle2 - 270) * Math.PI / 180) * rl * -1;

    var vertices = [
        (x1-(w/2))/(w/2), -(y1-(h/2))/(h/2),
        (x2-(w/2))/(w/2), -(y2-(h/2))/(h/2),
        (x3-(w/2))/(w/2), -(y3-(h/2))/(h/2)
    ];


    // 描画する
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length/2);



}