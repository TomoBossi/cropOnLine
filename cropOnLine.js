// Load from disk
// https://stackoverflow.com/questions/42498717/how-to-read-image-file-using-plain-javascript
// Load from url
// https://editor.p5js.org/shiffman/sketches/B1SmhBLJx
// https://p5js.org/reference/#/p5/createInput

p5.disableFriendlyErrors = false;
document.addEventListener("keydown", (e) => e.ctrlKey && e.preventDefault()); // Prevent default ctrl + key functionality
document.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent context menu popup on right click

let bgc = 35,
    uibc,
    uihc,
    onLoadButton = false,
    uipx = 225,
    loadButtonX,
    loadButtonY,
    loadButtonR,
    loadButtonL,
    loadButtonU,
    loadButtonD,
    loaded = false,
    reader = new FileReader(),
    linkField,
    link,
    valid, // Valid link
    onEnterKey = false,
    formatList = ['.png', '.jpg', '.gif'],
    format, // Format of currently opened picture
    http,
    error = false,
    onEscKey,
    zoom = 1.0,
    maxZ = 50.0,
    minZ = 0.05,
    wheelDelta,
    zoomInW,
    zoomOutW,
    hRef,
    vRef,
    hPan = 0,
    vPan = 0,
    xCoord,
    yCoord,
    newLoad = false, // Switch for running code once
    img,
    onImg = false,
    debugText; // p5.Image object containing the loaded picture



function setup() {
  rectMode(CENTER);
  ellipseMode(CENTER);
  imageMode(CENTER);
  createCanvas(windowWidth, windowHeight);
  loadButtonX = width/2;
  loadButtonY = height/2;
  loadButtonR = loadButtonX + uipx/2;
  loadButtonL = loadButtonX - uipx/2;
  loadButtonU = loadButtonY - uipx/2;
  loadButtonD = loadButtonY + uipx/2;

  load = createFileInput(loadFile);
  load.elt.style = "opacity: 0";
  load.size(uipx, uipx);
  load.position(loadButtonX-uipx/2, loadButtonY-uipx/2);
  // load.style('cursor', 'pointer'); // Doesn't work properly because of "No file selected" text interaction
  
  linkField = createInput('', 'text');
  linkField.size(uipx-8, 15);
  linkField.position(loadButtonX-linkField.size().width/2, loadButtonD+10);
  linkField.attribute('placeholder', '... or enter an image URL');
  
  uibc = color(20, 110, 130);
  uihc = color(100, 250, 250);
}



function draw() {
  background(35);
  onLoadButton = false;
  onEnterKey = false;
  onEscKey = false;
  onImg = false;
  loadGUI();

  if (img) {
    if (newLoad) {
      newLoad = false;
      reCenter();
      hRef = (width -img.width *zoom)/2;
      vRef = (height-img.height*zoom)/2;
    }
    updateZoom(minZ, maxZ);
    updatePan();
    mousePosToMatrixIndex();
    image(img, width/2+hPan*zoom, height/2+vPan*zoom, img.width*zoom, img.height*zoom);
    debugInfo();
  }
}



function updateZoom(min, max) {
  zoomInKb  = keyIsPressed && (key === '+');
  zoomOutKb = keyIsPressed && (key === '-');
  if (zoomInKb) {
    zoom *= 1.04;
  } else if (zoomOutKb) {
    zoom *= 0.96;
  } 
  if (mouseIsPressed) {
    if (mouseButton === CENTER) {
      zoom -= 2*zoom*(mouseY-pmouseY)/height;
    }
  }
  if (wheelDelta) {
    zoomInW  = wheelDelta < 0;
    zoomOutW = wheelDelta > 0;
    if (zoomInW) {
      zoom *= 1.15;
    } else {
      zoom *= 0.85;
    }
    wheelDelta = 0;
    zoomInW = false
    zoomOutW = false
  }
  zoom = constrain(zoom, min, max);
}



function updatePan() {
  let r = keyIsDown(RIGHT_ARROW) || keyIsDown(68);
  let l = keyIsDown(LEFT_ARROW) || keyIsDown(65);
  let u = keyIsDown(UP_ARROW) || keyIsDown(87);
  let d = keyIsDown(DOWN_ARROW) || keyIsDown(83);
  if (r) {
    hPan -= 10/zoom;
  } if (l) {
    hPan += 10/zoom;
  } if (u) {
    vPan += 10/zoom;
  } if (d) {
    vPan -= 10/zoom;
  }
  if (mouseIsPressed) {
    if (mouseButton === RIGHT) {
      hPan += (mouseX-pmouseX)/zoom;
      vPan += (mouseY-pmouseY)/zoom;
    }
  }
  hRef = (width -img.width *zoom)/2 + hPan*zoom;
  vRef = (height-img.height*zoom)/2 + vPan*zoom;
}



function reCenter() {
  hPan = 0;
  vPan = 0;
  zoom = min(width*0.9/img.width, height*0.9/img.height, 1.0);
}



function mousePosToMatrixIndex() {
  xCoord = floor((mouseX-hRef)/zoom);
  yCoord = floor((mouseY-vRef)/zoom);
  onImg  = xCoord >= 0 && xCoord < img.width && yCoord >= 0 && yCoord < img.height;
}



function debugInfo() {
  textAlign(LEFT, BOTTOM);
  textFont('calibri');
  textStyle(NORMAL);
  fill(255,160);
  stroke(0,160);
  strokeWeight(3);
  textSize(15);
  debugText = 'ZOOM: '+String(zoom.toFixed(3))+'\nPIXEL COORDS: (';
  if (onImg) {
    debugText+= String(xCoord)+', '+String(yCoord)+')';
  } else {
    debugText+= '-, -)';
  }
  debugText+= '\nORIGINAL SIZE: ('+String(img.width)+', '+String(img.height)+')';
  text(debugText, 3, height);
}



function loadGUI() {
  if (!loaded) { // Load menu
    link = linkField.value();
    valid = formatList.includes(link.slice(-4, link.length));
    loadButton(loadButtonX, loadButtonY);
    drawLoadingInfoUI();
    drawEnterKey();
  } 
  if (loaded && !img) { // Loading/Error
    textFont('helvetica');
    textAlign(CENTER, CENTER);
    fill(180);
    stroke(0, 50);
    strokeWeight(3);
    textStyle(BOLDITALIC);
    textSize(uipx/13);
    if (error) {
      text('Invalid file or URL', width/2, height/2);
      drawEscKey(width/2, height/2+uipx/4);
    } else {
      text('Loading...', width/2, height/2);
    }
  }
}



function loadButton(x, y) {
  fill(uibc);
  noStroke();
  rect(loadButtonX, loadButtonY, uipx, uipx, 4);
  noFill();
  strokeWeight(uipx/20);
  stroke(uihc);
  rect(x, y, uipx*2/3, uipx*2/3, 0.0001);
  fill(uibc);
  noStroke();
  rect(x, y-uipx/7, uipx*2.5/3, uipx*1.75/3);
  fill(uihc);
  stroke(uihc);
  line(x-uipx/5, y+uipx/20+uipx/6, x+uipx/5, y+uipx/20+uipx/6);
  line(x-uipx/5, y-uipx/10+uipx/6, x+uipx/5, y-uipx/10+uipx/6);
  line(x-uipx/5, y-uipx/4+uipx/6, x+uipx/5, y-uipx/4+uipx/6);
  noFill();
  strokeWeight(uipx/40);
  rect(x, y, uipx*2.75/3, uipx*2.75/3, 3);
  onLoadButton = (mouseX<loadButtonR)*(mouseX>loadButtonL)*(mouseY<loadButtonD)*(mouseY>loadButtonU);
  if (onLoadButton) {
    fill(0,255,255,60);
    strokeWeight(2);
    rect(loadButtonX, loadButtonY, uipx, uipx, 4);
  }
  textFont('helvetica');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  stroke(0, 50);
  strokeWeight(3);
  fill(uihc);
  textSize(uipx/18);
  text('click (or drag + drop file here)', width/2, loadButtonU+uipx/8);
  textStyle(BOLDITALIC);
  textSize(uipx/7);
  strokeWeight(5);
  text('File Upload', width/2, loadButtonU+uipx/3.7);
}



function drawLoadingInfoUI() {
  textFont('helvetica');
  textAlign(CENTER, CENTER);
  textSize(uipx/16);
  textStyle(ITALIC);
  fill(140);
  stroke(0, 50);
  strokeWeight(3);
  text('github.com/TomoBossi/CropOnLine', width/2, height-uipx/16);
  fill(160);
  textSize(uipx/15);
  text('supported formats:', width/2, uipx/4);
  textSize(uipx/14);
  text('.png .jpg .gif', width/2, uipx/3);
  fill(180);
  textSize(uipx/13);
  textStyle(BOLDITALIC);
  text('Online Image Cropping Tool', width/2, uipx/10);
}



function drawEnterKey() {
  onEnterKey = (mouseX<width/2+(uipx/10*1.4)/2)*(mouseX>width/2-(uipx/10*1.4)/2)*(mouseY<loadButtonD+35+uipx/11+(uipx/10)/2)*(mouseY>loadButtonD+35+uipx/11-(uipx/10)/2)
  onEnterKey+= (mouseX<width/2+0.15*uipx/10+(uipx/10*1.1)/2)*(mouseX>width/2+0.15*uipx/10-(uipx/10*1.1)/2)*(mouseY<loadButtonD+35+uipx/11+0.5*uipx/10+(uipx/10))*(mouseY>loadButtonD+35+uipx/11+0.5*uipx/10-(uipx/10))
  fill(40+20*valid);
  if (valid && onEnterKey) {
    fill(uibc);
  }
  stroke(70+120*valid);
  strokeWeight(uipx/50);
  rect(width/2, loadButtonD+35+uipx/11, uipx/10*1.4, uipx/10, 3);
  rect(width/2+0.15*uipx/10, loadButtonD+35+uipx/11+0.5*uipx/10, uipx/10*1.1, uipx/10*2, 3);
  noStroke();
  rect(width/2, loadButtonD+35+uipx/11, uipx/10*1.4, uipx/10, 3);
  rect(width/2+0.15*uipx/10, loadButtonD+35+uipx/11+0.5*uipx/10, uipx/10*1.1, uipx/10*2, 3);
  stroke(120+120*valid);
  fill(120+120*valid);
  strokeWeight(uipx/100);
  line(width/2-uipx/50, loadButtonD+35+uipx/11+uipx/100, width/2+uipx/30, loadButtonD+35+uipx/11+uipx/100);
  line(width/2+uipx/30, loadButtonD+35+uipx/11+uipx/100, width/2+uipx/30, loadButtonD+35+uipx/11-uipx/75);
  triangle(width/2-uipx/50, loadButtonD+35+uipx/11+uipx/100+uipx/125, width/2-uipx/50, loadButtonD+35+uipx/11+uipx/100-uipx/125, width/2-uipx/50-uipx/100, loadButtonD+35+uipx/11+uipx/100)
}



function drawEscKey(x, y) {
  onEscKey = dist(mouseX, mouseY, x, y)<uipx/5/2;
  stroke(70+120*onEscKey);
  strokeWeight(2);
  fill(60);
  if (onEscKey) {
    fill(uibc);
  }
  ellipse(x, y, uipx/5);
  textFont('helvetica');
  textAlign(CENTER, CENTER);
  textSize(uipx/15);
  textStyle(NORMAL);
  fill(255);
  stroke(0, 50);
  strokeWeight(3);
  text('ESC', x, y+uipx/100);
}



function mousePressed() {
  if (valid && onEnterKey) {
    loadFromURL(link);
  }
  if (onEscKey) {
    reLoad();
  }
}



function mouseWheel(event) {
  wheelDelta = event.delta;
}



function keyPressed() {
  // https://www.toptal.com/developers/keycode
  // console.log(keyCode);
  if (keyCode === 27) {
    reLoad();
  }
  if (valid && keyCode === 13) {
    loadFromURL(link);
  }
  if (img && keyCode === 82) {
    reCenter();
  }
}



function reLoad() {
  img = null;
  loaded = false;
  error = false;
  load.show();
  linkField.show();
}



function getImage(e) { // File upload from disk
  let data64 = reader.result;
  try {
    loadImage(data64, function (newImage) { img = newImage });
    newLoad = true;
    error = false;
  } catch {
    error = true;
  }
} function loadFile(file) {
  loaded = true;
  load.hide();
  linkField.hide();
  reader.onload = getImage;
  reader.readAsDataURL(file.file);

} function loadFromURL(URL) { // File upload from URL https://c.tenor.com/NFjEeHbk-zwAAAAC/cat.gif
  try {
    error = !UrlExists(URL);
  } catch {
    error = true;
  }
  if (!error) {
    loadImage(URL, function (newImage) { img = newImage });
    newLoad = true;
  }
  loaded = true;
  load.hide();
  linkField.hide();
}



function UrlExists(URL) {
  http = new XMLHttpRequest();
  http.open('HEAD', URL, false);
  http.send();
  console.log(http.status);
  return ![0, 404].includes(http.status)
}