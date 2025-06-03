import * as THREE from "three";
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';;/*

/*import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";*/

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
const CAMPO = 0, CEU = 1;
let scene, camera, cameras = [], activeCamera, moving, renderer, controls;
let frustumSize = 35;
let currentTextureType = CAMPO; 
let white = new THREE.Color(0xffffff), 
	yellow = new THREE.Color(0xffff00),
	lilac = new THREE.Color(0xDDA0DD),
	light_blue = new THREE.Color(0xADD8E6),
	light_green = new THREE.Color(0x90EE90),
	dark_blue = new THREE.Color(0x00008B),
	dark_violet = new THREE.Color(0x9400D3);
let terrain, skydome;

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
	createCamera("perspective", 60, window.innerWidth / window.innerHeight, 0.1, 1000, 0, 20, 50, 0, 0, 0);
	moving = createCamera("perspective", 70, window.innerWidth / window.innerHeight, 1, 1000, 10, 20, 20, 0, 0, 0);

	activeCamera = moving; // Set the active camera to the first one created
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createObjects() {
	createTerrain();
}

function createTerrain() {
	const loader = new THREE.TextureLoader();
	loader.load('js/heightmap.jpeg', (heightMapTexture) => {
		const geometry = new THREE.PlaneGeometry(100, 100, 199, 199);
		const heightMapImage = heightMapTexture.image;

		const canvas = document.createElement("canvas");
		canvas.width = heightMapImage.width;
		canvas.height = heightMapImage.height;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(heightMapImage, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

		for( let i = 0; i < geometry.attributes.position.count; i++) {
			const x = i % canvas.width;
			const y = Math.floor(i / canvas.width);
			const pixelIndex = (y * canvas.width + x) * 4; // RGBA
			const height = imageData[pixelIndex] / 255; // Scale height to a reasonable value
			geometry.attributes.position.setZ(i, height * 10);
		}

		geometry.computeVertexNormals();

		const terrainMaterial = new THREE.MeshStandardMaterial({
			map: generateTextures(CAMPO),
			flatShading: true,
		});

		terrain = new THREE.Mesh(geometry, terrainMaterial);
		terrain.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
		scene.add(terrain);
		const skyGEO = new THREE.SphereGeometry(500, 32, 32);
		const skyMaterial = new THREE.MeshBasicMaterial({
			map: generateTextures(CEU),
			side: THREE.BackSide // Render the inside of the sphere
		});
		skydome = new THREE.Mesh(skyGEO, skyMaterial);
		scene.add(skydome);
	});
}

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
	createObjects();
	//TODO This are just test lights, remove them later
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(30, 50, 30);
	scene.add(light);
	const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
	scene.add(ambientLight);
	render();
	window.addEventListener("resize", onResize);
	window.addEventListener("keydown", onKeyDown);

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {

	requestAnimationFrame(animate);
	render();
}

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
			currentTextureType = CAMPO;
			terrain.material.map = generateTextures(CAMPO);
			terrain.material.needsUpdate = true;
			break;
		case "2":
			currentTextureType = CEU;
			skydome.material.map = generateTextures(CEU);
			skydome.material.needsUpdate = true;
			break;
	}
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}

///////////////////////
/* GENERATE TEXTURES */
///////////////////////
function generateTextures(type) {
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	switch (type) {
		case CAMPO:
			
			const grassColor = new THREE.Color(0x228B22);
			ctx.fillStyle = grassColor.getStyle();
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const flowerColors = [white, yellow, lilac, light_blue];
			for (let i = 0; i < 500; i++) {
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				const r = Math.random() * 0.1 + 0.05; // Random radius between 0.05 and 0.15
				const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
				ctx.fillStyle = flowerColor.getStyle();
				ctx.arc(x, y, r, 0, Math.PI * 2);
				ctx.fill();
			}
			break;

		case CEU:
			
			const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
			gradient.addColorStop(0, dark_blue.getStyle());
			gradient.addColorStop(1, dark_violet.getStyle());
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			for (let i = 0; i < 5000; i++) {
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				const r = Math.random() * 0.1 + 0.05; // Random radius between 0.05 and 0.15
				const starColor = white.getStyle();
				ctx.fillStyle = starColor;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.PI * 2);
				ctx.fill();
			}
			break;
		
	}
	return new THREE.CanvasTexture(canvas);
}

function enableFreeCamera() {
	controls = new OrbitControls(moving, renderer.domElement);
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.autoRotate = false;
}
init();
animate();