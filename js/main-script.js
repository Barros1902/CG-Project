import * as THREE from "three";
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';;/*
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";*/ //TODO SOLVE IMPORTS

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer, ball, ball2, controls;
let camera, cameras = [], activeCamera, ort_frontal, ort_lateral, ort_topo, perspective;
let torso, head, leftArm, rightArm, leftLeg, rightLeg;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {

	scene = new THREE.Scene();

	scene.background = new THREE.Color(0xDBBF70);

}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCamera(type, fov, aspect, near, far, posx, posy, posz, lookx, looky, lookz) {

	if (type == "perspective") {
		camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(posx, posy, posz);
		camera.lookAt(lookx, looky, lookz);
	} else if (type == "orthographic") {
		camera = new THREE.OrthographicCamera(-aspect * 2, aspect * 2, 2, -2, near, far);
		camera.position.set(posx, posy, posz);
		camera.lookAt(lookx, looky, lookz);
	} else {
		console.error("Invalid camera type specified. Use 'perspective' or 'orthographic'.");
		return;
	}

	scene.add(camera);
	cameras.push(camera);
	return camera;

	
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {}

////////////
/* UPDATE */
////////////
function update() {}

/////////////
/* DISPLAY */
/////////////
function render() {

	renderer.render(scene, activeCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	createScene();

	ort_frontal = createCamera("orthographic", 90, window.innerWidth / window.innerHeight, 1, 1000, 0, 0, 50, 0, 0, 0);
	ort_lateral = createCamera("orthographic", 90, window.innerWidth / window.innerHeight, 1, 1000, 100, 0, 0, 0, 0, 0);
	ort_topo = createCamera("orthographic", 90, window.innerWidth / window.innerHeight, 1, 1000, 0, 100, 0, 0, 0, 0);
	perspective = createCamera("perspective", 70, window.innerWidth / window.innerHeight, 1, 1000, 10, 20, 20, 0, 0, 0);
	activeCamera = ort_frontal;
	window.addEventListener("resize", onResize);
	window.addEventListener("keydown", onKeyDown);
	createBall(0, 0, 0);
	createArm(0, 0, 0, "left");
	createTorso(0, 0, 0);
	controls = new OrbitControls(perspective, renderer.domElement);
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.autoRotate = true;
	render();
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
	requestAnimationFrame(animate);
	controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
	render();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
	
	renderer.setSize(window.innerWidth, window.innerHeight);
	if (window.innerHeight > 0 && window.innerWidth > 0) {
		cameras.forEach((cam) => {	
			if (cam.isPerspectiveCamera) {
				cam.aspect = window.innerWidth / window.innerHeight;
				cam.updateProjectionMatrix();
			}
			else if (cam.isOrthographicCamera) {
				cam.left = -window.innerWidth / window.innerHeight * 2;
				cam.right = window.innerWidth / window.innerHeight * 2;
				cam.top = 2;
				cam.bottom = -2;
				cam.updateProjectionMatrix();
			}
		});
	}
	render();

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
	switch (e.key){
		case "1":
			activeCamera = ort_frontal;
			break;
		case "2":
			activeCamera = ort_lateral;
			break;
		case "3":
			activeCamera = ort_topo;
			break;
		case "4":
			activeCamera = perspective;
			break;
	} 
	render();
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e) {}

//////////////////////
/* ROBO PARTS */
//////////////////////
function createBall(x, y, z) {
	const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
	const geometry = new THREE.SphereGeometry(0.1, 100, 100);
	ball = new THREE.Mesh(geometry, material);
	ball2 = new THREE.Mesh(geometry, material);
	ball.userData = { jumping: true, step: 0 };
	ball.position.set(x, y, z);
	ball2.position.set(x + 0.2, y + 0.2, z + 0.2);
  
	scene.add(ball);
	scene.add(ball2);
  }
function createArm(x, y, z, side) {
	if (side == "left") {
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
		const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 100);
		const arm = new THREE.Mesh(geometry, material);
		arm.position.set(x - 0.5, y, z);
		scene.add(arm);

	}
}
function createLeg(x, y, z, side) {
}
function createTorso(x, y, z) {
	// Part 1/ 10
	torso = new THREE.Object3D();
	createPart(torso,"box", x + 0, y + 0, z + 0, 0x00ff00, false, 12, 3, 1);
	// Part 2/ 10
	createPart(torso,"box", x + 0, y + 8, z + 2.5, 0x00ff00, false, 1, 3, 6);
	// Part 3/ 10
	createPart(torso,"box", x + -5.5, y + 8, z + 2.5, 0x00ff00, false, 1, 3, 6);
	// Part 4/ 10
	createPart(torso,"box", x + 5.5, y + 8, z + 2.5, 0x00ff00, false, 1, 3, 6);
	// Part 5/ 10
	createPart(torso,"box", x + 0, y + 10, z + 2.5, 0x00ff00, false, 12, 1, 6);
	// Part 6/ 10
	createPart(torso,"box", x + 0, y + 0, z + 3, 0x00ff00, false, 8, 3, 5);
	// Part 7/ 10
	createPart(torso,"box", x + 0, y + 5.5, z + 2.5, 0x00ff00, false, 12, 2, 6);
	// Part 8/ 10
	createPart(torso,"box", x + 0, y + 3, z + 2.5, 0x00ff00, false, 6, 3, 6);
	// Part 9/ 10
	createPart(torso,"cylinder", x + -5, y + -0.5, z + 2.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, 90);
	// Part 10/ 10
	createPart(torso,"cylinder", x + 5, y + -0.5, z + 2.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, -90);

	torso.position.set(x, y, z);
	scene.add(torso);
}
function createPart(obj, shape, xpos = 0, ypos = 0, zpos = 0, color = 0xFF0000, wireframe = false, xsize = 1, ysize = 1, zsize = 1, xrot = 0, yrot = 0, zrot = 0) {
	let geometry;

    switch (shape.toLowerCase()) {
        case "box":
            geometry = new THREE.BoxGeometry(xsize, ysize, zsize);
            break;
        case "sphere":
            geometry = new THREE.SphereGeometry(xsize, 100, 100);
            break;
		case "cylinder":
			geometry = new THREE.CylinderGeometry(xsize, xsize, ysize, 100);
			break;
        default:
            console.error("Shape not recognized:", shape);
            return;
    }

    const material = new THREE.MeshBasicMaterial({ color: color, wireframe: wireframe });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xpos, ypos, zpos);
	mesh.rotation.set(xrot * (Math.PI / 180), yrot * (Math.PI / 180), zrot * (Math.PI / 180));
    obj.add(mesh);

	return mesh;

}
function createHead(x, y, z) {
}


init();
animate();


