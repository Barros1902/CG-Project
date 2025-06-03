import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, camera, cameras = [], renderer, controls;
let frustumSize = 35;
/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
	scene = new THREE.Scene();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCamera(type, fov, aspect, near, far, posx, posy, posz, lookx, looky, lookz, customFrustumSize = frustumSize) {

	let left = -customFrustumSize * aspect / 2;
	let right = customFrustumSize * aspect / 2;
	let top = customFrustumSize / 2;
	let bottom = -customFrustumSize / 2;
	if (type == "perspective") {
		camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(posx, posy, posz);
		camera.lookAt(lookx, looky, lookz);
	} else if (type == "orthographic") {
		camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		camera.position.set(posx, posy, posz);
		camera.lookAt(lookx, looky, lookz);
		camera.originalFrustumSize = customFrustumSize;
	} else {
		console.error("Invalid camera type specified. Use 'perspective' or 'orthographic'.");
		return;
	}

	scene.add(camera);
	cameras.push(camera);
	return camera;

	
}

function createCameras() {

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
	createCameras();
	enableFreeCamera();
	render();
	window.addEventListener("resize", onResize);
	window.addEventListener("keydown", onKeyDown);

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
	
	renderer.setSize(window.innerWidth, window.innerHeight);
	let aspect = window.innerWidth / window.innerHeight;

	if (window.innerHeight > 0 && window.innerWidth > 0) {
		cameras.forEach((cam) => {	
			if (cam.isPerspectiveCamera) {
				cam.aspect = aspect;
				cam.updateProjectionMatrix();
			}
			else if (cam.isOrthographicCamera) {
				cam.left = -cam.originalFrustumSize * aspect / 2;
				cam.right = cam.originalFrustumSize * aspect / 2;
				cam.top = cam.originalFrustumSize / 2;
				cam.bottom = -cam.originalFrustumSize / 2;
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
			//TODO SWITCH TO TEXT CAMPO
			break;
		case "2":
			//TODO SWITCH TO TEXT CEU
			break;
	}
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}

init();
animate();