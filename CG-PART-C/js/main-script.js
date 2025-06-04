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
	dark_violet = new THREE.Color(0x9400D3),
	orangy_brown = new THREE.Color(0x994f0b),
	dark_green = new THREE.Color(0x045700);
let terrain, skydome;
let trees = [];
let materials = [];

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
	generateTrees();
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
			for (let i = 0; i < 5000; i++) {
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				const r = Math.random() * 1 + 0.5; // Random radius between 0.05 and 0.15
				const flowerColor = flowerColors[Math.floor(Math.random() * (flowerColors.length +1 ) % flowerColors.length)];
				ctx.fillStyle = flowerColor.getStyle();
				ctx.beginPath();
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

///////////////////////
/* GENERATE TREE */
///////////////////////

function generateTrees(){

	let trunk = createMaterial(orangy_brown);
	let leafs = createMaterial(dark_green);

	createTree(0, 0, 0, trunk, leafs, 1);

	trees.forEach((tree) => {
		scene.add(tree)
	});
}

function createTree(x, y, z, trunk, leafs, scale = 1){
	let tree = new THREE.Object3D();

	// Tronco
	createPart(tree,"cylinder", trunk, 0, 3, 0, 1, 6, 1);
	// Tronco encortiçado
	createPart(tree,"cylinder", trunk, 0, 7.5, 0, 1.5, 3, 1.5);
	// Ramo esquerdo
	createPart(tree,"cylinder", trunk, -2, 11, -1, 0.5, 6, 0.5, -30, 0, 45);
	// Copa esquerda
	createPart(tree,"sphere", leafs, -4, 13, -2, 2, 2, 2);
	//Ramo direito
	createPart(tree,"cylinder", trunk, 1.5, 10.5, 0.75, 1, Math.sqrt(20), 1, 30, 0, -45);
	//Ramo direito frente
	createPart(tree,"cylinder", trunk, 1.5, 15, 3.75, 0.5, 8, 0.5, 40, 0, 20);
	//Copa direita frente
	createPart(tree,"sphere", leafs, 0, 18, 6, 3, 3, 3);
	//Ramo diretio trás
	createPart(tree,"cylinder", trunk, 6, 13.5, -0.75, 0.5, 8, 0.5, -60, 0, -50);
	//Copa direita trás
	createPart(tree,"sphere", leafs, 9, 15, -3, 3, 3, 3);

	tree.position.set(x, y, z);
	tree.scale.set(scale, scale, scale);
	trees.push(tree);
}

///////////////////////
/* GENERATE OBJECTS */
///////////////////////

function createPart(obj, shape, material, xpos = 0, ypos = 0, zpos = 0, xsize = 1, ysize = 1, zsize = 1, xrot = 0, yrot = 0, zrot = 0) {
	let geometry;

    switch (shape.toLowerCase()) {
        case "sphere":
            geometry = createSphere(xsize, 100, 100);
            break;
		case "cylinder":
			geometry = createCylinder(xsize, ysize, zsize, 100);
			//geometry = new THREE.CylinderGeometry(xsize, xsize, ysize, 100);
			break;
        default:
            console.error("Shape not recognized:", shape);
            return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xpos, ypos, zpos);
	mesh.rotation.set(xrot * (Math.PI / 180), yrot * (Math.PI / 180), zrot * (Math.PI / 180));
    obj.add(mesh);

	return mesh;

}

function createCylinder(xsize = 1, height = 2, zsize = 1, radialSegments = 32) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    // Top and bottom center points
    const halfHeight = height / 2;
    const topCenter = [0, halfHeight, 0];
    const bottomCenter = [0, -halfHeight, 0];

    // Arrays to store the top and bottom circle vertices
    const topVertices = [];
    const bottomVertices = [];

    // Generate circle vertices
    for (let i = 0; i < radialSegments; i++) {
        const theta = (i / radialSegments) * Math.PI * 2;
        const x = Math.cos(theta) * xsize;
        const z = Math.sin(theta) * zsize;
        topVertices.push([x, halfHeight, z]);
        bottomVertices.push([x, -halfHeight, z]);
    }

    // Add top and bottom center
    positions.push(...topCenter);
    positions.push(...bottomCenter);

    // Add top and bottom circle vertices to positions
    topVertices.forEach(v => positions.push(...v));
    bottomVertices.forEach(v => positions.push(...v));

    // Indices for top face
    for (let i = 0; i < radialSegments; i++) {
        const next = (i + 1) % radialSegments;
        indices.push(
            0, // top center
            2 + next,
            2 + i
        );
    }

    // Indices for bottom face
    for (let i = 0; i < radialSegments; i++) {
        const next = (i + 1) % radialSegments;
        indices.push(
            1, // bottom center
            2 + radialSegments + i,
            2 + radialSegments + next
        );
    }

    // Indices for side faces
    for (let i = 0; i < radialSegments; i++) {
        const next = (i + 1) % radialSegments;
        const topA = 2 + i;
        const topB = 2 + next;
        const bottomA = 2 + radialSegments + i;
        const bottomB = 2 + radialSegments + next;

        // First triangle
        indices.push(topA, bottomB, bottomA);
        // Second triangle
        indices.push(topB, bottomB, topA);
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();

    return geometry;
}

function createSphere(radius = 1, widthSegments = 32, heightSegments = 16) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const phi = v * Math.PI;

        for (let x = 0; x <= widthSegments; x++) {
            const u = x / widthSegments;
            const theta = u * Math.PI * 2;

            const px = -radius * Math.cos(theta) * Math.sin(phi);
            const py =  radius * Math.cos(phi);
            const pz =  radius * Math.sin(theta) * Math.sin(phi);

            positions.push(px, py, pz);
        }
    }

    for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < widthSegments; x++) {
            const a = y * (widthSegments + 1) + x;
            const b = a + widthSegments + 1;

            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();

    return geometry;
}

function createMaterial(color = 0xFF0000, wireframe = false) {
	const material = new THREE.MeshBasicMaterial({ color: color, wireframe: wireframe});
	materials.push(material);
	return material;
}

///////////////////////
/* OTHER */
///////////////////////

function enableFreeCamera() {
	controls = new OrbitControls(moving, renderer.domElement);
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.autoRotate = false;
}
init();
animate();