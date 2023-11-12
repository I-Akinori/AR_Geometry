const width = window.innerWidth, height = window.innerHeight;
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setClearColor(new THREE.Color(), 0);
renderer.setSize(width, height);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.visible = false;
const camera = new THREE.OrthographicCamera(-1, +1, height / width, -height / width, 0.01, 1000);
scene.add(camera);

var group = new THREE.Group();

const arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam'
});

arToolkitSource.init(() => {
    setTimeout(() => {
        onResize();
    }, 2000);
});

addEventListener('resize', () => {
    onResize();
});

function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
};

const arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'data/camera_para.dat',
    detectionMode: 'mono'
});

arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});

const arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
    type: 'pattern',
    patternUrl: 'data/patt.hiro',
    changeMatrixMode: 'cameraTransformMatrix'
});

let points = [];
const segments = 128;
const orbits = 32;

const lines = [];
for (i = 0; i < orbits; i++) {
    let line_geometry = new THREE.BufferGeometry().setFromPoints(points);
    let line_material = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    let line = new THREE.LineLoop(line_geometry, line_material);
    line.material.color.setHSL(1 - i / orbits, 1, 0.5);
    group.add(line);
    lines.push(line);

    points = [];
    let scale = Math.pow(1.05, i) * 0.1;
    for (j = 0; j < segments; j++) {
        let s = j / segments * Math.PI * 2;
        let x = Math.sin(s * 2) * scale;
        let y = Math.sin(s * 1) * scale;
        let z = Math.sin(s * 2 + Math.PI * 0.5) * scale; 
        points.push(new THREE.Vector3(x, y, z));
    }
    lines[i].geometry.setFromPoints(points);
}

const trail_geometry = new THREE.BufferGeometry();
const trail_material = new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true });
var vertices = [];
var colors = [];
for (i = 0; i < orbits; i++) {
    vertices.push(0); vertices.push(0); vertices.push(0);
    colors.push(lines[i].material.color.r); colors.push(lines[i].material.color.g); colors.push(lines[i].material.color.b);
}
trail_geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
trail_geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const trail = new THREE.Line(trail_geometry, trail_material);
group.add(trail);

scene.add(group);

var isDragging = false;
var previousTouchPosition = {
    x: 0,
    y: 0
};
var initialDistance = null;
function getDistance(touches) {
    var dx = touches[0].pageX - touches[1].pageX;
    var dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        isDragging = true;
        previousTouchPosition = {
            x: e.touches[0].pageX,
            y: e.touches[0].pageY
        };
    }
    if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
    }
}, { passive: false });

document.addEventListener('touchmove', function (e) {
    if (isDragging) {
        e.preventDefault();
        var currentTouchPosition = {
            x: e.touches[0].pageX,
            y: e.touches[0].pageY
        };

        var deltaMove = {
            x: currentTouchPosition.x - previousTouchPosition.x,
            y: currentTouchPosition.y - previousTouchPosition.y
        };

        var rotationSpeed = 0.005;
        group.rotation.y += deltaMove.x * rotationSpeed;
        group.rotation.x += deltaMove.y * rotationSpeed;

        previousTouchPosition = {
            x: currentTouchPosition.x,
            y: currentTouchPosition.y
        };
    }
    if (e.touches.length === 2) {
        var currentDistance = getDistance(e.touches);
        if (initialDistance) {
            e.preventDefault();
            var scale = currentDistance / initialDistance;
            group.scale.set(scale, scale, scale);
        }
    }
}, { passive: false });

document.addEventListener('touchend', function (e) {
    isDragging = false;
    initialDistance = null;
});

let time = 0;
const clock = new THREE.Clock();
requestAnimationFrame(function animate() {
    requestAnimationFrame(animate);
    if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
        scene.visible = camera.visible;
    }
    const delta = clock.getDelta();
    time += delta / orbits;
    var t = time / 10;
    vertices = trail.geometry.attributes.position.array;

    for (i = 0; i < orbits; i++) {
        let scale = Math.pow(1.05, i) * 0.1;
        let s = Math.PI * 2;
        let X = Math.sin(s * 2 * t * (i + 1)) * scale;
        let Y = Math.sin(s * 1 * t * (i + 1)) * scale;
        let Z = Math.sin(s * 2 * t * (i + 1) + Math.PI * 0.5) * scale; 
        vertices[i * 3 + 0] = X;
        vertices[i * 3 + 1] = Y;
        vertices[i * 3 + 2] = Z;
    }
    trail.geometry.attributes.position.needsUpdate = true;

    trail.geometry.computeBoundingBox();
    trail.geometry.computeBoundingSphere();

    renderer.render(scene, camera);
});
