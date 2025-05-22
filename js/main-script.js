import * as THREE from "three";
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';;/*
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";*/ //TODO SOLVE IMPORTS

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer, controls;
let camera, cameras = [], activeCamera, ort_frontal, ort_lateral, ort_topo, perspective, moving;
let torso, head, leftArm, rightArm, leftLeg, rightLeg, leftFoot, rightFoot;
let sceneparts = [];
let trailer;
let Qkey = false, Akey = false, Wkey = false, Skey = false, Ekey = false, Dkey = false, Rkey = false, Fkey = false, ArrowUp = false, ArrowDown = false, ArrowLeft = false, ArrowRight = false;
let legUnion, feetUnion;
let headRotationYAxis = -2, headRotationZAxis = 2;
let legRotationYAxis = 0.5, legRotationZAxis = 3.5;
let feetRotationYAxis = -16, feetRotationZAxis = 3;
let rotationSpeed = 1.5, armsSpeed = 0.05, trailerSpeed = 0.2;
let isWireframeOn = false;
const trailerTargetPosition = new THREE.Vector3(0, 7.5, 27);
let isTrailerAnimating = false;
let frustumSize = 35;
let first_deg = false;
let second_deg = false;
let third_deg = false;
let fourth_deg = false;



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

	let left = -frustumSize * aspect / 2;
	let right = frustumSize * aspect / 2;
	let top = frustumSize / 2;
	let bottom = -frustumSize / 2;
	if (type == "perspective") {
		camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(posx, posy, posz);
		camera.lookAt(lookx, looky, lookz);
	} else if (type == "orthographic") {
		camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
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
function createCameras() {

	ort_frontal = createCamera("orthographic", 90, window.innerWidth / window.innerHeight, 1, 1000, 0, 0, -50, 0, 0, 0);
	ort_lateral = createCamera("orthographic", 90, window.innerWidth / window.innerHeight, 1, 1000, 100, 0, 0, 0, 0, 0);
	ort_topo = createCamera("orthographic", 90, window.innerWidth / window.innerHeight, 1, 1000, 0, 100, 0, 0, 0, 0);
	perspective = createCamera("perspective", 70, window.innerWidth / window.innerHeight, 1, 1000, -20, 20, -20, 0, 0, 0);
	moving = createCamera("perspective", 70, window.innerWidth / window.innerHeight, 1, 1000, 10, 20, 20, 0, 0, 0);

	activeCamera = ort_frontal;
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
function checkCollisions() {
    const trailerBox = new THREE.Box3().setFromObject(trailer);
    const robotBox = new THREE.Box3().setFromObject(torso); // TODO: check if torso is the correct object to use


    if (trailerBox.intersectsBox(robotBox)) {
        handleCollisions();
    }
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {
    if (!isTrailerAnimating) {
        isTrailerAnimating = true;
    }
}

////////////
/* UPDATE */
////////////
function update() {
	if(Qkey && !Akey){
		if (feetUnion.rotation.x > -1.57) {
			feetUnion.rotation.x -= rotationSpeed * (Math.PI / 180);
			if (feetUnion.rotation.x < -1.57) {
				first_deg = true;
			}
		}
	}
	if(Akey && !Qkey){
	if (feetUnion.rotation.x < 0) {
			feetUnion.rotation.x += rotationSpeed * (Math.PI / 180);
			first_deg = false;
		}
	}
	if(Wkey && !Skey){
		if (legUnion.rotation.x > -1.57) {
			legUnion.rotation.x -= rotationSpeed * (Math.PI / 180);
			if(legUnion.rotation.x < -1.57){
				second_deg = true;
			}
		}
	}
	if(Skey && !Wkey){
		if (legUnion.rotation.x < 0) {
			legUnion.rotation.x += rotationSpeed * (Math.PI / 180);
			second_deg = false;
		}
	}
	if(Ekey && !Dkey){
		if (leftArm.position.x > 4.5) {
			leftArm.position.x -= armsSpeed;
			rightArm.position.x += armsSpeed;
			if(leftArm.position.x < 4.5){
				third_deg = true;
			}
		}
	}
	if(Dkey && !Ekey){
		if (leftArm.position.x < 7.5) {
			leftArm.position.x += armsSpeed;
			rightArm.position.x -= armsSpeed;
			third_deg = false;
		}
	}
	if(Rkey && !Fkey){
		if (head.rotation.x < 3.14) {
			head.rotation.x += rotationSpeed * 2 * (Math.PI / 180);
			if(head.rotation.x < 3.14){
				fourth_deg = true;
			}
		}
	}
	if(Fkey && !Rkey){
		if (head.rotation.x > 0) {
			head.rotation.x -= rotationSpeed * 2 * (Math.PI / 180);
			fourth_deg = false;
		}
	}
	
	checkCollisions();
	if (isTrailerAnimating) {
		trailer.position.lerp(trailerTargetPosition, 0.05);
		if (trailer.position.distanceTo(trailerTargetPosition) < 0.05) {
			trailer.position.copy(trailerTargetPosition);
			isTrailerAnimating = false;
		}
	}
	if(ArrowLeft && !ArrowRight && !isTrailerAnimating){
		trailer.position.x += trailerSpeed;
	}
	if(ArrowRight && !ArrowLeft && !isTrailerAnimating){
		trailer.position.x -= trailerSpeed;
	}
	if(ArrowUp && !ArrowDown && !isTrailerAnimating){
		trailer.position.z += trailerSpeed;
	}
	if(ArrowDown && !ArrowUp && !isTrailerAnimating){
		trailer.position.z -= trailerSpeed;
	}

}

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
	createRobo();
	createTrailer();
	enableFreeCamera();
	render();
	window.addEventListener("resize", onResize);
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
	controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
	update();
	render();
	requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
	
	renderer.setSize(window.innerWidth, window.innerHeight);
	let aspect = window.innerWidth / window.innerHeight;
	let left = -frustumSize * aspect / 2;
	let right = frustumSize * aspect / 2;
	let top = frustumSize / 2;
	let bottom = -frustumSize / 2;
	if (window.innerHeight > 0 && window.innerWidth > 0) {
		cameras.forEach((cam) => {	
			if (cam.isPerspectiveCamera) {
				cam.aspect = window.innerWidth / window.innerHeight;
				cam.updateProjectionMatrix();
			}
			else if (cam.isOrthographicCamera) {
				cam.left = left;
				cam.right = right;
				cam.top = top;
				cam.bottom = bottom;
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
		case "t":
			activeCamera = moving;
			break;
		case "7":
			if (isWireframeOn) {
				switchWireframe(false);
				isWireframeOn = false;
			}
			else {
				switchWireframe(true);
				isWireframeOn = true;
			}
			break;
		case "R":
		case "r":
			Rkey = true;
			break;
		case "F":
		case "f":
			Fkey = true;
			break;
		case "W":
		case "w":
			Wkey = true;
			break;
		case "S":
		case "s":
			Skey = true;
			break;
		case "Q":
		case "q":
			Qkey = true;
			break;
		case "A":
		case "a":
			Akey = true;
			break;
		case "E":
		case "e":
			Ekey = true;
			break;
		case "D":
		case "d":
			Dkey = true;
			break;
		case "ArrowUp":
            ArrowUp = true;
            break;
        case "ArrowDown":
            ArrowDown = true;
            break;
        case "ArrowLeft":
            ArrowLeft = true;
            break;
        case "ArrowRight":
            ArrowRight = true;
            break;
	} 
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function onKeyUp(e) {
	switch (e.key) {
		case "R":
		case "r":
			Rkey = false;
			break;
		case "F":
		case "f":
			Fkey = false;
			break;
		case "W":
		case "w":
			Wkey = false;
			break;
		case "S":
		case "s":
			Skey = false;
			break;
		case "Q":
		case "q":
			Qkey = false;
			break;
		case "A":
		case "a":
			Akey = false;
			break;
		case "E":
		case "e":
			Ekey = false;
			break;
		case "D":
		case "d":
			Dkey = false;
			break;
		case "ArrowUp":
            ArrowUp = false;
            break;
        case "ArrowDown":
            ArrowDown = false;
            break;
        case "ArrowLeft":
            ArrowLeft = false;
            break;
        case "ArrowRight":
            ArrowRight = false;
            break;
	}
}

//////////////////////
/* ROBO PARTS */
//////////////////////

function createTorso(x, y, z) {

	torso = new THREE.Object3D();
	// Part 1/10
	createPart(torso,"box", 0, 0, 0, 0xb5b5b5, false, 12, 3, 1);
	// Part 2/10
	createPart(torso,"box", 0, 8, 2.5, 0xff0000, false, 1, 3, 6);
	// Part 3/10
	createPart(torso,"box", -5.5, 8, 2.5, 0xff0000, false, 1, 3, 6);
	// Part 4/10
	createPart(torso,"box", 5.5, 8, 2.5, 0xff0000, false, 1, 3, 6);
	// Part 5/10
	createPart(torso,"box", 0, 10, 2.5, 0xff0000, false, 12, 1, 6);
	// Part 6/10
	createPart(torso,"box", 0, 0, 3, 0xff0000, false, 8, 3, 5);
	// Part 7/10
	createPart(torso,"box", 0, 5.5, 2.5, 0xff0000, false, 12, 2, 6);
	// Part 8/10
	createPart(torso,"box", 0, 3, 2.5, 0xff0000, false, 6, 3, 6);
	// Part 9/10
	createPart(torso,"cylinder", -5, -0.5, 2.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, 90);
	// Part 10/10
	createPart(torso,"cylinder", 5, -0.5, 2.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, -90);

	torso.position.set(x, y, z);
	
	scene.add(torso);
}
function createHead(x, y, z) {
	head = new THREE.Object3D();

	// Part 1/6
	createPart(head,"cylinder", 0, 0 - headRotationYAxis, 0 - headRotationZAxis, 0x0000ff, false, 2, 4, 2);
	// Part 2/6
	createPart(head,"cylinder", -2.25, 1.5 - headRotationYAxis, 0 - headRotationZAxis, 0x5b5b5b, false, 0.25, 7, 0.25);
	// Part 3/6
	createPart(head,"cylinder", 2.25, 1.5 - headRotationYAxis, 0 - headRotationZAxis, 0x5b5b5b, false, 0.25, 7, 0.25);
	// Part 4/6
	createPart(head,"cone", 0, 3 - headRotationYAxis, 0 - headRotationZAxis, 0x0000ff, false, 2, 2, 2);
	// Part 5/6
	createPart(head,"sphere", 1, 1 - headRotationYAxis, -1.5 - headRotationZAxis, 0xffffff, false, 0.5, 0.5, 0.5);
	// Part 6/6
	createPart(head,"sphere", -1, 1 - headRotationYAxis, -1.5 - headRotationZAxis, 0xffffff, false, 0.5, 0.5, 0.5);

	head.position.set(x, y + headRotationYAxis, z + headRotationZAxis);
	scene.add(head);
	
}
function createLeftArm(x,  y, z) {
	leftArm = new THREE.Object3D();
	// Part 1/3
	createPart(leftArm,"box", 0, 0, 0, 0xff0000, false, 3, 9, 3);
	// Part 2/3
	createPart(leftArm,"box", 0, -3, -4.5, 0xff0000, false, 3, 3, 6);
	// Part 3/3
	createPart(leftArm,"cylinder", 1, 3.5, 2, 0x5b5b5b, false, 0.5, 10, 0.5);

	leftArm.position.set(x, y, z);
	scene.add(leftArm);
}
function createRightArm(x,  y, z) {
	rightArm = new THREE.Object3D();
	// Part 1/3
	createPart(rightArm,"box", 0, 0, 0, 0xff0000, false, 3, 9, 3);
	// Part 2/3
	createPart(rightArm,"box", 0, -3, -4.5, 0xff0000, false, 3, 3, 6);
	// Part 3/3
	createPart(rightArm,"cylinder", -1, 3.5, 2, 0x5b5b5b, false, 0.5, 10, 0.5);

	rightArm.position.set(x, y, z);
	scene.add(rightArm);
}
function createLeftLeg(x,  y, z) {
	leftLeg = new THREE.Object3D();
	// Part 1/4
	createPart(leftLeg,"box", 0, 0, 0, 0x0000ff, false, 3, 12, 3);
	// Part 2/4
	createPart(leftLeg,"box", 0, 8, 0, 0xb5b5b5, false, 2, 4, 2);
	// Part 3/4
	createPart(leftLeg,"cylinder", 2.5, 2, -0.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, -90);
	// Part 4/4
	createPart(leftLeg,"cylinder", 2.5, -4, -0.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, -90);

	leftLeg.position.set(x, y, z);
	scene.add(leftLeg);
}
function createRightLeg(x,  y, z) {
	rightLeg = new THREE.Object3D();
	// Part 1/4
	createPart(rightLeg,"box", 0, 0, 0, 0x0000ff, false, 3, 12, 3);
	// Part 2/4
	createPart(rightLeg,"box", 0, 8, 0, 0xb5b5b5, false, 2, 4, 2);
	// Part 3/4
	createPart(rightLeg,"cylinder", -2.5, 2, -0.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, -90);
	// Part 4/4
	createPart(rightLeg,"cylinder", -2.5, -4, -0.5, 0x3c3c3c, false, 2, 2, 2, 0, 0, -90);

	rightLeg.position.set(x, y, z);
	scene.add(rightLeg);
}
function createLeftFoot(x,  y, z) {
	leftFoot = new THREE.Object3D();
	// Part 1/2
	createPart(leftFoot, "box", 0, 0, 0, 0x0000ff, false, 5, 2, 2);
	// Part 2/2
	createPart(leftFoot,"box", -1, 0, 1.5, 0x0000ff, false, 3, 2, 1);

	leftFoot.position.set(x, y, z);
	scene.add(leftFoot);

}
function createRightFoot(x,  y, z) {
	rightFoot = new THREE.Object3D();
	// Part 1/2
	createPart(rightFoot, "box", 0, 0, 0, 0x0000ff, false, 5, 2, 2);
	// Part 2/2
	createPart(rightFoot,"box", 1, 0, 1.5, 0x0000ff, false, 3, 2, 1);

	rightFoot.position.set(x, y, z);
	scene.add(rightFoot);

}
function createLegUnion() {
	legUnion = new THREE.Object3D();
	
	legUnion.add(leftLeg);
	legUnion.add(rightLeg);
	legUnion.add(feetUnion);

	leftLeg.position.y -= legRotationYAxis;
	leftLeg.position.z -= legRotationZAxis;
	rightLeg.position.y -= legRotationYAxis;
	rightLeg.position.z -= legRotationZAxis;
	feetUnion.position.y -= legRotationYAxis;
	feetUnion.position.z -= legRotationZAxis;

	legUnion.position.set(0, legRotationYAxis, legRotationZAxis);
	scene.add(legUnion);
}
function createFeetUnion() {
	feetUnion = new THREE.Object3D();
	
	feetUnion.add(leftFoot);
	feetUnion.add(rightFoot);

	leftFoot.position.y -= feetRotationYAxis;
	leftFoot.position.z -= feetRotationZAxis;
	rightFoot.position.y -= feetRotationYAxis;
	rightFoot.position.z -= feetRotationZAxis;

	feetUnion.position.set(0, feetRotationYAxis , feetRotationZAxis);
	//scene.add(feetUnion);
}
function createRobo() {
	createTorso(0, 0, 0);
	createHead(0, 12.5, 3.5);
	createLeftArm(7.5, 6, 7);
	createRightArm(-7.5, 6, 7);
	createLeftLeg(2.5, -11.5, 3);
	createRightLeg(-2.5, -11.5, 3);
	createLeftFoot(3.5, -16.5, -0.5)
	createRightFoot(-3.5, -16.5, -0.5);
	createFeetUnion();
	createLegUnion();
}

//////////////////////
/* TRAILER PARTS */
//////////////////////

function createTrailer() {
	trailer = new THREE.Object3D();
	// Part 1/7
	createPart(trailer, "box", 0, 0, 0, 0x202020, false, 12, 12, 20);
	// Part 2/7
	createPart(trailer,"cylinder", 5, -8, 7, 0x3c3c3c, false, 2, 2, 2, 0, 0, 90);
	// Part 3/7
	createPart(trailer,"cylinder", 5, -8, 1, 0x3c3c3c, false, 2, 2, 2, 0, 0, 90);
	// Part 4/7
	createPart(trailer,"cylinder", -5, -8, 7, 0x3c3c3c, false, 2, 2, 2, 0, 0, 90);
	// Part 5/7
	createPart(trailer,"cylinder", -5, -8, 1, 0x3c3c3c, false, 2, 2, 2, 0, 0, 90);
	// Part 6/7
	createPart(trailer, "box", 0, -7, -9.5, 0x202020, false, 1, 2, 1);
	// Part 7/7
	createPart(trailer, "box", 0, -7.5, 4, 0x202020, false, 8, 3, 10);

	trailer.position.set(10, 7.5, 27);
	scene.add(trailer);
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
		case "cone":
			geometry = new THREE.ConeGeometry(xsize, ysize, 100);
			break;
		case "sphere":
			geometry = new THREE.SphereGeometry(xsize, 100, 100);
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

//////////////////////
/* ENABLE WIREFRAME */
//////////////////////

function switchWireframe(value){

	scene.traverse((object) => {
		if (object.isMesh) {
			object.material.wireframe = value;
		}
	});
}

//////////////////////
/* EXTRA */
//////////////////////
function enableFreeCamera() {
	controls = new OrbitControls(moving, renderer.domElement);
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.autoRotate = false;
}
function isTruck() {
	if (first_deg && second_deg && third_deg && fourth_deg) {
		return true;
	}
	else {
		return false;
	}
}

init();
animate();


