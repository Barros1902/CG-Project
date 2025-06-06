import * as THREE from "three";
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'https://unpkg.com/three@0.160.1/examples/jsm/webxr/VRButton.js';/*
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";*/

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
const CAMPO = 0, CEU = 1;
const LAMBERT = 0, PHONG = 1, TOON = 2, BASIC = 3;
let scene, camera, cameras = [], activeCamera, moving, perspective, stereo, renderer, controls;
let frustumSize = 35;
let lightEnabled = true, directionalLight;
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
let terrain, skydome, moon;
let trees = [];
let materials = [];
let currentMaterialType = LAMBERT, basicOn = false;
let meshs = [];
let terrainSize = 100, spaceBtwnTrees = 20, nOfTrees = 10;

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
	} else if (type == "stereo") {
		camera = new THREE.StereoCamera();
		camera.eyeSep = 0.064;
		return camera;
	} else {
		console.error("Invalid camera type specified. Use 'perspective' or 'orthographic'.");
		return;
	}

	scene.add(camera);
	cameras.push(camera);
	return camera;

	
}

function createCameras() {
	perspective = createCamera("perspective", 60, window.innerWidth / window.innerHeight, 0.1, 1000, -60, 40, 40, 20, 20, 0);
	moving = createCamera("perspective", 70, window.innerWidth / window.innerHeight, 1, 1000, 10, 20, 20, 0, 0, 0);
	stereo = createCamera("stereo", 60, window.innerWidth / window.innerHeight, 0.1, 1000, -60, 40, 40, 20, 20, 0);

	activeCamera = moving; // Set the active camera to the first one created
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createLights(){

	const moonLight = new THREE.PointLight(white, 1000); // cor, intensidade
	moonLight.position.copy(moon.position);
	scene.add(moonLight);

	directionalLight = new THREE.DirectionalLight(white, 0.5); // cor, intensidade
	directionalLight.position.set(30, 50, 30); // Posição da luz
	directionalLight.castShadow = true; // Ativa a sombra
	scene.add(directionalLight);

	// (opcional) visualizar direção da luz
	// const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
	// scene.add(helper);

}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createObjects() {
	createTerrain();
	generateTrees(nOfTrees);
	createMoon();
	generateHouse(20, 20, 20);
	generateOvni(-20, 20, -20);
}

function createMoon() {
	const moonGeometry = createSphere(5, 100, 100);
	const moonMaterial = new THREE.MeshStandardMaterial({
		color: white,             	// Cor base
		emissive: yellow,          	// Cor da luz emitida
		emissiveIntensity: 100,       	// Intensidade do brilho
		roughness: 0.5,               	// Um pouco rugosa para realismo
		metalness: 0.1                 	// Pouco metálica
	});
	moon = new THREE.Mesh(moonGeometry, moonMaterial);
	moon.position.set(30, 50, -50); // Posição da lua
	scene.add(moon);

}

function createTerrain() {

	const loader = new THREE.TextureLoader();
	loader.load('js/heightmap3.png', (heightMapTexture) => {
  		const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 200, 200);
  		const material = new THREE.MeshPhongMaterial({ map: generateTextures(CAMPO) });
  		terrain = new THREE.Mesh(geometry, material);
  		terrain.rotation.x = -Math.PI / 2;

  		const heightMapImage = heightMapTexture.image;

		// Espera até a imagem estar completamente carregada
		const canvas = document.createElement("canvas");
		canvas.width = heightMapImage.width;
		canvas.height = heightMapImage.height;
		const ctx = canvas.getContext("2d");

		// Importante: pode ser necessário esperar o onload para garantir que a imagem está acessível
		heightMapImage.onload = () => {
		ctx.drawImage(heightMapImage, 0, 0);
		const imageData = ctx.getImageData(0, 0, heightMapImage.width, heightMapImage.height).data;
		const vertices = geometry.attributes.position;
		const width = geometry.parameters.widthSegments + 1;
		const height = geometry.parameters.heightSegments + 1;

		for (let i = 0; i < vertices.count; i++) {
			const ix = i % width;
			const iy = Math.floor(i / width);
			const xImg = Math.floor(ix / width * heightMapImage.width);
			const yImg = Math.floor(iy / height * heightMapImage.height);
			const pixelIndex = (yImg * heightMapImage.width + xImg) * 4;
			const heightValue = imageData[pixelIndex] / 255 * 70; // altura normalizada
			vertices.setZ(i, heightValue);
		}

		vertices.needsUpdate = true;
		geometry.computeVertexNormals();
		};
  	// ou força o onload manualmente se já estiver carregada
  	if (heightMapImage.complete) heightMapImage.onload();
  	scene.add(terrain);
	});

	const skyGEO = new THREE.SphereGeometry(500, 32, 32);
	const skyMaterial = new THREE.MeshBasicMaterial({
		map: generateTextures(CEU),
		side: THREE.BackSide // Render the inside of the sphere
	});
	skydome = new THREE.Mesh(skyGEO, skyMaterial);
	scene.add(skydome);
	
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

	if (activeCamera === stereo) {
		stereo.update(moving);
		renderer.render(scene, stereo.cameraL);
		renderer.render(scene, stereo.cameraR);
	} else {
    	renderer.render(scene, activeCamera);
}
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	renderer.xr.enabled = true;
	document.body.appendChild(VRButton.createButton(renderer));

	createScene();
	createCameras();
	enableFreeCamera();
	createObjects();
	createLights();
	render();
	window.addEventListener("resize", onResize);
	window.addEventListener("keydown", onKeyDown);

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    renderer.setAnimationLoop(() => {
        render();
    });
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
	
	const ufo = scene.children.find(child => child.spotlight); // Find the UFO
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
		case "D":
		case "d":
			lightEnabled = !lightEnabled;
			directionalLight.visible = lightEnabled;
			console.log(`Luz Direcional ${lightEnabled ? 'ligada' : 'desligada'}`);
			break;
		case "Q":
		case "q":
			currentMaterialType = LAMBERT;
			switchMaterials(LAMBERT);
			break;
		case "W":
		case "w":
			currentMaterialType = PHONG;
			switchMaterials(PHONG);
			break;
		case "E":
		case "e":
			currentMaterialType = TOON;
			switchMaterials(TOON);
			break;
		case "R":
		case "r":
			currentMaterialType = BASIC;
			switchMaterials(BASIC);
			break;
		case "7":
			if (activeCamera != perspective){
				activeCamera = perspective
			}
			else {
				activeCamera = moving
			}
			break;
		case "P":
		case "p":
			if (ufo) {
				ufo.lightsOn = !ufo.lightsOn; // Toggle state
				toggleUFOLights(ufo, ufo.lightsOn);
			}
			break;
		case "S":
		case "s":
			if (ufo) {
				ufo.spotlightOn = !ufo.spotlightOn; // Toggle state
				toggleUFOSpotlights(ufo, ufo.spotlightOn);
			}
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
	canvas.width = 4096;
	canvas.height = 4096;
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
				const r = Math.random() * 10 + 5; // Random radius between 0.5 and 1.5
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
				const r = Math.random() * 1 + 0.5; // Random radius between 0.5 and 1.5
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
/* GENERATE HOUSE */
///////////////////////


function generateHouse(x, y, z) {	
	let house = new THREE.Object3D();
	let wall = createMaterial(white);
	let window = createMaterial(light_blue);
	let door = createMaterial(orangy_brown);
	let roof = createMaterial(orangy_brown);

	// parede frente
	createPart(house,"face", wall, 2, 0, 0, 26, 12 ,0, 0, 0, 0);
	// parede direita
	createPart(house,"face", wall, 0, 0, -13, 15, 12 ,0, 0, 270, 0);
	// parede esquerda
	createPart(house,"face", wall, 30, 0, 2, 15, 12 ,0, 0, 90, 0);
	// parede trás
	createPart(house,"face", wall, 28, 0, -11, 26, 12 ,0, 0, 180, 0);
	// suportes saidas
	createPart(house,"face", wall, 0, 0, 2, 2, 12, 0, 0, 0, 0);
	createPart(house,"face", wall, 28, 0, 2, 2, 12, 0, 0, 0, 0);
	createPart(house,"face", wall, 2, 0, -13, 2, 12, 0, 0, 180, 0);
	createPart(house,"face", wall, 16, 0, -13, 2, 12, 0, 0, 180, 0);
	createPart(house,"face", wall, 30, 0, -13, 2, 12, 0, 0, 180, 0);
	// suportes laterais
	createPart(house,"face", wall, 2, 0, -11, 2, 12, 0, 0, 90, 0);
	createPart(house,"face", wall, 16, 0, -11, 2, 12, 0, 0, 90, 0);
	createPart(house,"face", wall, 2, 0, 2, 2, 12, 0, 0, 90, 0);
	createPart(house,"face", wall, 28, 0, 0, 2, 12, 0, 0, 270, 0);
	createPart(house,"face", wall, 14, 0,-13, 2, 12, 0, 0, 270, 0);
	createPart(house,"face", wall, 28, 0,-13, 2, 12, 0, 0, 270, 0);
	// suporte teto
	createPart(house,"face", wall, 0, 12, -11, 2, 2, 0, 270, 0, 0);
	createPart(house,"face", wall, 14, 12, -11, 2, 2, 0, 270, 0, 0);
	createPart(house,"face", wall, 28, 12, -11, 2, 2, 0, 270, 0, 0);
	createPart(house,"face", wall, 0, 12, 2, 2, 2, 0, 270, 0, 0);
	createPart(house,"face", wall, 28, 12, 2, 2, 2, 0, 270, 0, 0);
	// teto
	createPart(house,"face", roof, 0, 12, 0, 30, 6.3, 0, 270+28.5, 0, 0);
	createPart(house,"face", roof, 30, 12, -11, 30, 6.3, 0, 90-28.5, 180, 0);
	//teto lateral
	createPart(house,"face", roof, 29.99, 12, -11, 6.3, 4, 0, 180-28.5, 90, 0);
	createPart(house,"face", roof, 29.99, 12, 0, 4, 6.3, 0, 270+28.5, 90, 0);
	createPart(house,"face", roof, 0.01, 12, 0, 6.3, 4, 0, 28.5, 270, 180);
	createPart(house,"face", roof, 0.01, 12, -11, 4, 6.3, 0, 270-28.5, 270, 180);
	//janelas
	createPart(house,"face", window, 4, 3, 0.01, 5, 5, 0, 0, 0, 0);
	createPart(house,"face", window, 21, 3, 0.01, 5, 5, 0, 0, 0, 0);
	createPart(house,"face", window, 25, 3, -11.01, 5, 5, 0, 0, 180, 0);
	createPart(house,"face", window, 10, 3, -11.01, 5, 5, 0, 0, 180, 0);
	//porta
	createPart(house,"face", door, 12.5, 0, 0.01, 5, 8, 0, 0, 0, 0);

	house.position.set(x, y, z);
	scene.add(house);

}


///////////////////////
/* GENERATE OVNI */
///////////////////////


function generateOvni(x, y, z) {	
    let ovni = new THREE.Object3D();
    let metal = createMaterial(white);
    let glass = createMaterial(light_blue);
    
    // Store lights for later control
    ovni.lights = [];
    ovni.spotlight = []; // Fixed: changed from spotlights to spotlight

    // Body
    createPart(ovni, "sphere", metal, 0, -2, 0, 9, 3*Math.PI/4, Math.PI/4, 180);
    // Dome
    createPart(ovni, "sphere", glass, 0, 6, 0, 3, Math.PI/2, Math.PI/2, 180);
    // Bottom
    createPart(ovni, "cylinder", metal, 0, 4.5, 0, 2, 2, 2);
    
    // Calculate and create sphere lights
    const radius = 4.5;
    for (let angle = 0; angle < 360; angle += 45) {
        const angleRad = angle * (Math.PI / 180);
        const xPos = radius * Math.cos(angleRad);
        const zPos = radius * Math.sin(angleRad);
        
        // Create sphere
        createPart(ovni, "sphere", metal, xPos, 4.5, zPos, 1);
        
        const sphereLight = new THREE.PointLight(white, 5);
        sphereLight.position.set(xPos, 2.5, zPos);
        ovni.add(sphereLight);
        ovni.lights.push(sphereLight);
    }

    // Add spotlight
    const spotlight = new THREE.SpotLight(white, 600);
    spotlight.position.set(0, 3, 0);
    spotlight.angle = Math.PI/12;
    spotlight.penumbra = 0.2;
    spotlight.decay = 1;
    spotlight.distance = 100;
    spotlight.target.position.set(0, -10, 0);

    ovni.add(spotlight);
    ovni.add(spotlight.target);
    ovni.spotlight.push(spotlight);

    ovni.position.set(x, y, z);
    scene.add(ovni);
    return ovni;
}

function toggleUFOLights(ufo, enabled) {
    ufo.lights.forEach(light => {
        light.visible = enabled;
    });
}

function toggleUFOSpotlights(ufo, enabled) {
    ufo.spotlight.forEach(light => {
        light.visible = enabled;
    });
}


///////////////////////
/* GENERATE TREE */
///////////////////////

function generateTrees(n = 1){

	let trunk = createMaterial(orangy_brown);
	let leafs = createMaterial(dark_green);

	let usedCoords = [];
	let t = 0;
	while(t < n){
		let rndx = Math.floor(Math.random() * (terrainSize / spaceBtwnTrees - 1) + 1);
		rndx = rndx * spaceBtwnTrees;
		rndx -= terrainSize/2;
		let rndz = Math.floor(Math.random() * (terrainSize / spaceBtwnTrees - 1) + 1);
		rndz = rndz * spaceBtwnTrees;
		rndz -= terrainSize/2;
		let randomAhBool = true;
		usedCoords.forEach((coord) => {
			if(arraysEqual(coord, [rndx, rndz])){
				randomAhBool = false;
			}
		});

		if (randomAhBool){
			console.log([rndx, rndz]);
			let rndscale = Math.random() * 0.3 + 0.7;
			let rndrot = Math.random() * 360;
			createTree(rndx, getYByRayCast(rndx, rndz), rndz, trunk, leafs, rndscale, rndrot);
			usedCoords.push([rndx, rndz]);
			++t;
		}
	}

	trees.forEach((tree) => {
		scene.add(tree)
	});
}

function createTree(x, y, z, trunk, leafs, scale = 1, rot = 0){
	let tree = new THREE.Object3D();

	// Tronco
	createPart(tree,"cylinder", trunk, 0, 3, 0, 1, 6, 1);
	// Tronco encortiçado
	createPart(tree,"cylinder", trunk, 0, 7.5, 0, 1.5, 3, 1.5);
	// Ramo esquerdo
	createPart(tree,"cylinder", trunk, -2, 11, -1, 0.5, 6, 0.5, -30, 0, 45);
	// Copa esquerda
	createPart(tree,"sphere", leafs, -4, 13, -2, 2);
	//Ramo direito
	createPart(tree,"cylinder", trunk, 1.5, 10.5, 0.75, 1, Math.sqrt(20), 1, 30, 0, -45);
	//Ramo direito frente
	createPart(tree,"cylinder", trunk, 1.5, 15, 3.75, 0.5, 8, 0.5, 40, 0, 20);
	//Copa direita frente
	createPart(tree,"sphere", leafs, 0, 18, 6, 3);
	//Ramo diretio trás
	createPart(tree,"cylinder", trunk, 6, 13.5, -0.75, 0.5, 8, 0.5, -60, 0, -50);
	//Copa direita trás
	createPart(tree,"sphere", leafs, 9, 15, -3, 3);

	tree.position.set(x, y, z);
	tree.scale.set(scale, scale, scale);
	tree.rotation.set(0, rot * (Math.PI / 180), 0);
	trees.push(tree);
}

///////////////////////
/* GENERATE OBJECTS */
///////////////////////

function createPart(obj, shape, materialId, xpos = 0, ypos = 0, zpos = 0, xsize = 1, ysize = 1, zsize = 1, xrot = 0, yrot = 0, zrot = 0) {
	let geometry;

    switch (shape.toLowerCase()) {
        case "sphere":
            geometry = createSphere(xsize, 100, 100, ysize, zsize);
            break;
		case "cylinder":
			geometry = createCylinder(xsize, ysize, zsize, 100);
			//geometry = new THREE.CylinderGeometry(xsize, xsize, ysize, 100);
			break;
		case "face":
			geometry = createFace(xsize, ysize);
			break;
        default:
            console.error("Shape not recognized:", shape);
            return;
    }

    const mesh = new THREE.Mesh(geometry, materials[materialId][currentMaterialType]);
    mesh.position.set(xpos, ypos, zpos);
	mesh.rotation.set(xrot * (Math.PI / 180), yrot * (Math.PI / 180), zrot * (Math.PI / 180));
    obj.add(mesh);
	meshs.push([mesh, materialId]);

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

function createSphere(radius = 1, widthSegments = 32, heightSegments = 16, phiStart = 0,  phiLength = Math.PI) {
	if (phiLength == 1) {
		phiLength = Math.PI;
		phiStart = 0;
	}
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    // Create sphere vertices
    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const phi = phiStart + v * phiLength;

        for (let x = 0; x <= widthSegments; x++) {
            const u = x / widthSegments;
            const theta = u * Math.PI * 2;

            const px = -radius * Math.cos(theta) * Math.sin(phi);
            const py = radius * Math.cos(phi);
            const pz = radius * Math.sin(theta) * Math.sin(phi);

            positions.push(px, py, pz);
        }
    }

    // Create sphere triangles
    for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < widthSegments; x++) {
            const a = y * (widthSegments + 1) + x;
            const b = a + widthSegments + 1;

            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    // Add cap vertices and triangles if sphere is truncated
    if (phiLength < Math.PI) {
        const capCenter = [0, radius * Math.cos(phiStart), 0];
        const startIndex = positions.length / 3;
        positions.push(...capCenter);

        // Add vertices for the cap edge
        for (let x = 0; x <= widthSegments; x++) {
            const u = x / widthSegments;
            const theta = u * Math.PI * 2;
            const phi = phiStart;

            const px = -radius * Math.cos(theta) * Math.sin(phi);
            const py = radius * Math.cos(phi);
            const pz = radius * Math.sin(theta) * Math.sin(phi);

            positions.push(px, py, pz);
        }

        // Create triangles for the cap
        for (let x = 0; x < widthSegments; x++) {
            indices.push(
                startIndex, // cap center
                startIndex + x + 1,
                startIndex + x + 2
            );
        }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();

    return geometry;
}


function createFace(width, height) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    // Define the 4 vertices of the face (rectangle)
    positions.push(
        0, 0, 0,       // vertex 0
        width, 0, 0,   // vertex 1
        width, height, 0, // vertex 2
        0, height, 0   // vertex 3
    );

    // Define triangles using indices
    indices.push(
        0, 1, 2, // first triangle
        0, 2, 3  // second triangle
    );

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

function createMaterial(color = 0xFF0000, wireframe = false) {
	const lambertMaterial = new THREE.MeshLambertMaterial({ color: color, wireframe: wireframe, flatShading: true });
	const phongMaterial = new THREE.MeshPhongMaterial({ color: color, wireframe: wireframe});
	const toontMaterial = new THREE.MeshToonMaterial({ color: color, wireframe: wireframe});
	const basicMaterial = new THREE.MeshBasicMaterial({ color: color, wireframe: wireframe});
	let index = materials.push([lambertMaterial, phongMaterial, toontMaterial, basicMaterial]);
	return index - 1;
}

///////////////////////
/* SWITCH MATERIALS */
///////////////////////

function switchMaterials(id){
	meshs.forEach(([mesh, material]) => {
		mesh.material = materials[material][id]
	});
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

function getYByRayCast(x, z){
	const raycaster = new THREE.Raycaster();
	const origin = new THREE.Vector3(x, 100, z); // Start above the terrain
	const direction = new THREE.Vector3(0, -1, 0); // Cast downwards
	raycaster.set(origin, direction);
	const intersects = raycaster.intersectObject(terrain);
	if (intersects.length > 0) {
		return intersects[0].point.y;
	}
	return null;
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

init();
animate();