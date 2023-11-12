const width = window.innerWidth, height = window.innerHeight;

// init
const camera = new THREE.OrthographicCamera(-1, +1, height / width, -height / width, 0.01, 1000);
camera.position.z = 1;


const scene = new THREE.Scene();

let points = [];
const segments = 128;
const orbits = 50;

const lines = [];
for (i = 0; i < orbits; i++)
{
	let line_geometry = new THREE.BufferGeometry().setFromPoints(points);
	let line_material = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, linewidth: 1 });
	let line = new THREE.LineLoop(line_geometry, line_material);
	line.material.color.setHSL(1 - i / orbits, 1, 0.5);
	scene.add(line);
	lines.push(line);

	points = [];
	let scale = Math.pow(1.05, i) * 0.1;
	for (j = 0; j < segments; j++) {
		let s = j / segments * Math.PI * 2;
		let x = Math.sin(s * 1) * scale;
		let y = Math.sin(s * 2 + Math.PI * 0.5) * scale;
		let z = Math.sin(s * 2) * scale;
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
scene.add(trail);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// animation
function animation(time) {

	let t = time / 5000 / orbits;
	vertices = trail.geometry.attributes.position.array;

	for (i = 0; i < orbits; i++) {
		let scale = Math.pow(1.05, i) * 0.1;
		let s = Math.PI * 2;
		let X = Math.sin(s * 1 * t * (i + 1)) * scale;
		let Y = Math.sin(s * 2 * t * (i + 1) + Math.PI * 0.5) * scale;
		let Z = Math.sin(s * 2 * t * (i + 1)) * scale;
		vertices[i * 3 + 0] = X;
		vertices[i * 3 + 1] = Y;
		vertices[i * 3 + 2] = Z;
	}
	trail.geometry.attributes.position.needsUpdate = true;

	trail.geometry.computeBoundingBox();
	trail.geometry.computeBoundingSphere();

	controls.update(); 
	renderer.render(scene, camera);
}