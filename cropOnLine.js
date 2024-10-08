// To do list:
//   - infinite undo/redo (history)
//   - buttons for undo, redo, recenter, zoom = 1.0, save, esc
//   - help button and improved overlay showing KB and Mouse controls

// Load from disk
// https://stackoverflow.com/questions/42498717/how-to-read-image-file-using-plain-javascript
// Load from url
// https://editor.p5js.org/shiffman/sketches/B1SmhBLJx
// https://p5js.org/reference/#/p5/createInput

p5.disableFriendlyErrors = false;
// document.addEventListener("keydown", (e) => e.ctrlKey && e.preventDefault()); // Prevent default ctrl + key functionality
document.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent context menu popup on right click

let bgc = 50,
    uibc,
    uihc,
    onLoadButton = false,
    uipx,
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
    enterKeyYPosDelta,
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
    img, // p5.Image object containing the loaded picture
    cropImg, // Cropped copy of the image
    w, // cropA width
    h, // cropA height
    onImg = false,
    cropA, // Crop area
    cropMinDistBorder = 15,
    cropTopDisp = 0,
    cropBottomDisp = 0,
    cropRightDisp = 0,
    cropLeftDisp = 0,
    xCoordDisp,
    yCoordDisp,
    onCropTop = false,
    onCropBottom = false,
    onCropRight = false,
    onCropLeft = false,
    onCropA = false,
    onCropAmouseX,
    onCropAMouseY,
    slideDispX = 0,
    slideDispY = 0,
    cropping = false, // Currently modifying crop area
    clickingToCrop = false, // Started mousepress to crop
    debugText,
    infoText,
    index,
    i,
    j,
    k,
    l,
    row,
    col,
    uintc8,
    inCrop;



function setup() {
  rectMode(CENTER);
  ellipseMode(CENTER);
  imageMode(CENTER);
  createCanvas(windowWidth, windowHeight);
  uipx = min(width,height)/(2*((1.25*width)>height) + 1.5*((1.25*width)<=height));
  loadButtonX = width/2;
  loadButtonY = height/2;
  loadButtonR = loadButtonX + uipx/2;
  loadButtonL = loadButtonX - uipx/2;
  loadButtonU = loadButtonY - uipx/2;
  loadButtonD = loadButtonY + uipx/2;
  enterKeyYPosDelta = uipx/7.75;

  load = createFileInput(loadFile);
  load.elt.style = "opacity: 0";
  load.size(uipx, uipx);
  load.position(loadButtonX-uipx/2, loadButtonY-uipx/2);

  linkField = createInput('', 'text');
  linkField.size(uipx-8, uipx/17.5);
  linkField.position(loadButtonX-linkField.size().width/2, loadButtonD+uipx/25);
  linkField.attribute('placeholder', ' ... or enter an image URL (CTRL+V)');
  
  uibc = color(20, 110, 130);
  uihc = color(100, 250, 250);
}



function draw() {
  background(bgc);
  onLoadButton = false;
  onEnterKey = false;
  onEscKey = false;
  onImg = false;
  cursor(ARROW);
  if (!cropping) {
    onCropTop = false;
    onCropBottom = false;
    onCropRight = false;
    onCropLeft = false;
    onCropA = false;
  }
  loading();
  if (img) {
    if (newLoad) {
      newLoad = false;
      reCenter();
      hRef = (width -img.width *zoom)/2;
      vRef = (height-img.height*zoom)/2;
      cropTopDisp = 0;
      cropBottomDisp = 0;
      cropRightDisp = 0;
      cropLeftDisp = 0;
      slideDispX = 0;
      slideDispY = 0;
    }
    updateZoom(minZ, maxZ);
    updatePan();
    mousePosToMatrixIndex();
    // Image
    image(img, width/2+hPan*zoom, height/2+vPan*zoom, img.width*zoom, img.height*zoom);
    // Dynamic overlay
    cropA = [hRef+(cropLeftDisp+slideDispX)*zoom, vRef+(cropTopDisp+slideDispY)*zoom, hRef+(img.width+cropRightDisp+slideDispX)*zoom, vRef+(img.height+cropBottomDisp+slideDispY)*zoom]; // Pensar en cómo actualizar
    if (cropA[0]>cropA[2]) {
      cropA = [cropA[2], cropA[1], cropA[0], cropA[3]]
    }
    if (cropA[1]>cropA[3]) {
      cropA = [cropA[0], cropA[3], cropA[2], cropA[1]]
    }
    fill(127.5+127.5*cos(frameCount/10), 35);
    rectMode(CORNERS);
    noStroke();
    rect(...cropA);
    rectMode(CENTER);
    if (!cropping) {
      onCropTop = abs(mouseY-cropA[1])<cropMinDistBorder;
      onCropBottom = abs(mouseY-cropA[3])<cropMinDistBorder;
      onCropLeft = abs(mouseX-cropA[0])<cropMinDistBorder;
      onCropRight = abs(mouseX-cropA[2])<cropMinDistBorder;
      onCropA = mouseX>cropA[0] && mouseX<cropA[2] && mouseY>cropA[1] && mouseY<cropA[3];
      onCropAMouseX = xCoord;
      onCropAMouseY = yCoord;
    }
    if (onCropTop && onCropBottom) {
      if (abs(mouseY-cropA[1])<abs(mouseY-cropA[3])) {
        onCropBottom = false;
      } else {
        onCropTop = false;
      }
    }
    if (onCropLeft && onCropRight) {
      if (abs(mouseX-cropA[0])<abs(mouseX-cropA[2])) {
        onCropRight = false;
      } else {
        onCropLeft = false;
      }
    }
    if (onCropA || onCropTop || onCropBottom || onCropLeft || onCropRight) {
      cursor('grab');
    } else {
      cursor(ARROW)
    }
    // Rulers
    strokeWeight(1+2*onCropTop*!cropping);
    stroke(127.5+127.5*!onCropTop+onCropTop*127.5*sin(frameCount/10), 50+100*onCropTop);
    line(0, cropA[1], width, cropA[1]); // Top
    strokeWeight(1+2*onCropBottom*!cropping);
    stroke(127.5+127.5*!onCropBottom+onCropBottom*127.5*sin(frameCount/10), 50+100*onCropBottom);
    line(0, cropA[3], width, cropA[3]); // Bottom
    strokeWeight(1+2*onCropLeft*!cropping);
    stroke(127.5+127.5*!onCropLeft+onCropLeft*127.5*sin(frameCount/10), 50+100*onCropLeft);
    line(cropA[0], 0, cropA[0], height); // Left
    strokeWeight(1+2*onCropRight*!cropping);
    stroke(127.5+127.5*!onCropRight+onCropRight*127.5*sin(frameCount/10), 50+100*onCropRight);
    line(cropA[2], 0, cropA[2], height); // Right
    // Borders
    strokeWeight(1+2*onCropTop*!cropping);
    stroke(127.5+127.5*sin(frameCount/10), 150+105*onCropTop);
    line(cropA[0], cropA[1], cropA[2], cropA[1]); // Top
    strokeWeight(1+2*onCropBottom*!cropping);
    stroke(127.5+127.5*sin(frameCount/10), 150+105*onCropBottom);
    line(cropA[0], cropA[3], cropA[2], cropA[3]); // Bottom
    strokeWeight(1+2*onCropLeft*!cropping);
    stroke(127.5+127.5*sin(frameCount/10), 150+105*onCropLeft);
    line(cropA[0], cropA[1], cropA[0], cropA[3]); // Left
    strokeWeight(1+2*onCropRight*!cropping);
    stroke(127.5+127.5*sin(frameCount/10), 150+105*onCropRight);
    line(cropA[2], cropA[1], cropA[2], cropA[3]); // Right
    // Help && Debug
    helpInfo();
    debugInfo();

    if (mouseIsPressed && clickingToCrop && mouseButton === LEFT && (onCropA || onCropTop || onCropBottom || onCropLeft || onCropRight)) {
      cropping = true;
      if (onCropTop || onCropBottom || onCropLeft || onCropRight) {
        if (onCropTop) {
          // cropTopDisp = constrain(yCoordDisp, 0, img.height); // Full range, buggy
          cropTopDisp = constrain(yCoordDisp, 0, img.height+cropBottomDisp-1);
        } else if (onCropBottom) {
          // cropBottomDisp = constrain(-img.height+yCoordDisp, -img.height, 0); // Full range, buggy
          cropBottomDisp = constrain(-img.height+yCoordDisp, -img.height+cropTopDisp+1, 0);
        }
        if (onCropLeft) {
          // cropLeftDisp = constrain(xCoordDisp, 0, img.width); // Full range, buggy
          cropLeftDisp = constrain(xCoordDisp, 0, img.width+cropRightDisp-1);
        } else if (onCropRight) {
          // cropRightDisp = constrain(-img.width+xCoordDisp, -img.width, 0); // Full range, buggy
          cropRightDisp = constrain(-img.width+xCoordDisp, -img.width+cropLeftDisp+1, 0);
        }
      } else if (onCropA) {
        slideDispX = constrain(xCoord-onCropAMouseX, -cropLeftDisp, -cropRightDisp);
        slideDispY = constrain(yCoord-onCropAMouseY, -cropTopDisp, -cropBottomDisp);
      }
    } else {
      cropping = false;
      cropTopDisp += slideDispY
      cropBottomDisp += slideDispY
      cropLeftDisp += slideDispX
      cropRightDisp += slideDispX
      slideDispX = 0;
      slideDispY = 0;
      // Update history (cropTopDisp, cropBottomDisp, etc.)
      // ...
    }
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
  zoom = min(width*0.75/img.width, height*0.75/img.height, 1.0);
}



function mousePosToMatrixIndex() {
  xCoord = floor((mouseX-hRef)/zoom);
  yCoord = floor((mouseY-vRef)/zoom);
  xCoordDisp = round((mouseX-hRef)/zoom);
  yCoordDisp = round((mouseY-vRef)/zoom);
  onImg  = xCoord >= 0 && xCoord < img.width && yCoord >= 0 && yCoord < img.height;
}



function debugInfo() {
  textAlign(LEFT, BOTTOM);
  textFont('calibri');
  textStyle(NORMAL);
  fill(255,160);
  stroke(0,160);
  strokeWeight(3);
  textSize(20);
  debugText = 'ZOOM: '+String(zoom.toFixed(3))+'\nPIXEL COORDS: (';
  if (onImg) {
    debugText+= String(xCoord)+', '+String(yCoord)+')';
  } else {
    debugText+= '-, -)';
  }
  debugText+= '\nORIGINAL SIZE: ('+String(img.width)+', '+String(img.height)+')';
  debugText+= '\nCROP SIZE: ('+String(round(abs(cropA[0]-cropA[2])/zoom))+', ';
  debugText+= String(round(abs(cropA[1]-cropA[3])/zoom))+')';
  text(debugText, 3, height);
}



function helpInfo() {
  textAlign(LEFT, TOP);
  textFont('calibri');
  fill(255,160);
  stroke(0,160);
  strokeWeight(3);
  textSize(20);
  textStyle(BOLD);
  if (mouseX + mouseY > 50) {
    infoText = 'INFO (hover)';
  } else {
    noCursor();
    textStyle(NORMAL);
    infoText = 'CROP: press and hold LMB on the rulers or the crop area itself and drag (mouse)';
    infoText+= '\nZOOM: +/- keys (KB) // scroll (mousewheel or trackpad) // press and hold mousewheel and drag up or down (mouse)';
    infoText+= '\nPAN: press and hold WASD or arrow keys (KB) // press and hold RMB and drag (mouse)';
    infoText+= '\nRESET VIEW: to reset the zoom and pan values to default press R key, or 1 key to set zoom to 1.0 (KB)';
    infoText+= '\nSAVE: to save the cropped image, press ENTER key (KB)';
    infoText+= '\nQUIT: to load a new image, press ESC key (KB)';
  }
  rectMode(CORNERS);
  text(infoText, 3, 3, width-3, height-3);
  rectMode(CENTER);
}



function loading() {
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
  textSize(uipx/14);
  text('supported formats: .png .jpg .gif', width/2, uipx/4);
  textSize(uipx/17.5);
  text('requires keyboard and mouse/trackpad', width/2, uipx/4+2*uipx/15);
  fill(180);
  textSize(uipx/13);
  textStyle(BOLDITALIC);
  text('Online Image Cropping Tool', width/2, uipx/10);
}



function drawEnterKey() {
  onEnterKey = (mouseX<width/2+(uipx/10*1.4)/2)*(mouseX>width/2-(uipx/10*1.4)/2)*(mouseY<loadButtonD+enterKeyYPosDelta+uipx/11+(uipx/10)/2)*(mouseY>loadButtonD+enterKeyYPosDelta+uipx/11-(uipx/10)/2)
  onEnterKey+= (mouseX<width/2+0.15*uipx/10+(uipx/10*1.1)/2)*(mouseX>width/2+0.15*uipx/10-(uipx/10*1.1)/2)*(mouseY<loadButtonD+enterKeyYPosDelta+uipx/11+0.5*uipx/10+(uipx/10))*(mouseY>loadButtonD+enterKeyYPosDelta+uipx/11+0.5*uipx/10-(uipx/10))
  fill(40+20*valid);
  if (valid && onEnterKey) {
    fill(uibc);
  }
  stroke(70+120*valid);
  strokeWeight(uipx/50);
  rect(width/2, loadButtonD+enterKeyYPosDelta+uipx/11, uipx/10*1.4, uipx/10, 3);
  rect(width/2+0.15*uipx/10, loadButtonD+enterKeyYPosDelta+uipx/11+0.5*uipx/10, uipx/10*1.1, uipx/10*2, 3);
  noStroke();
  rect(width/2, loadButtonD+enterKeyYPosDelta+uipx/11, uipx/10*1.4, uipx/10, 3);
  rect(width/2+0.15*uipx/10, loadButtonD+enterKeyYPosDelta+uipx/11+0.5*uipx/10, uipx/10*1.1, uipx/10*2, 3);
  stroke(120+120*valid);
  fill(120+120*valid);
  strokeWeight(uipx/100);
  line(width/2-uipx/50, loadButtonD+enterKeyYPosDelta+uipx/11+uipx/100, width/2+uipx/30, loadButtonD+enterKeyYPosDelta+uipx/11+uipx/100);
  line(width/2+uipx/30, loadButtonD+enterKeyYPosDelta+uipx/11+uipx/100, width/2+uipx/30, loadButtonD+enterKeyYPosDelta+uipx/11-uipx/75);
  triangle(width/2-uipx/50, loadButtonD+enterKeyYPosDelta+uipx/11+uipx/100+uipx/125, width/2-uipx/50, loadButtonD+enterKeyYPosDelta+uipx/11+uipx/100-uipx/125, width/2-uipx/50-uipx/100, loadButtonD+enterKeyYPosDelta+uipx/11+uipx/100)
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
  if (mouseButton === LEFT && (onCropA || onCropTop || onCropBottom || onCropLeft || onCropRight)) {
    clickingToCrop = true;
  }
}



function mouseReleased() {
  if (mouseButton === LEFT) {
    clickingToCrop = false;
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
  if (img && (keyCode === 49 || keyCode === 35 || keyCode === 97)) {
    reCenter();
    zoom = 1.0;
  }
  if (img && keyCode === 13) {
    saveCropImg();
  }
}



function reLoad() {
  img = null;
  format = null;
  loaded = false;
  error = false;
  load.show();
  linkField.show();
}



function getImage(e) { // File upload from disk
  let data64 = reader.result;
  // console.log(data64);
  // data:image/png;base64,iVBORw0KGgo
  // data:image/jpeg;base64,/9j/4QC8RX
  // data:image/gif;base64,R0lGODlh9AE
  if (data64.slice(5,10) == 'image') {
    try {
      loadImage(data64, function (newImage) { img = newImage });
      newLoad = true;
      format = data64.slice(11,14);
      if (format == 'jpe') {
        format = 'jpg';
      } 
      if (!formatList.includes('.'+format)) {
        format = 'png';
      }
      error = false;
    } catch {
      error = true;
    }
  } else {
    error = true;
  }
} function loadFile(file) {
  loaded = true;
  load.hide();
  linkField.hide();
  reader.onload = getImage;
  reader.readAsDataURL(file.file);
} function loadFromURL(URL) { // File upload from URL i.e. https://c.tenor.com/NFjEeHbk-zwAAAAC/cat.gif
  try {
    error = !UrlExists(URL);
  } catch {
    error = true;
  }
  if (!error) {
    loadImage(URL, function (newImage) { img = newImage });
    newLoad = true;
    format = URL.slice(-3, URL.length);
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



function saveCropImg() {
  // Bug: Large gifs produce code/color length bug (too many colours?)
  if (!cropping) {
    w = round(abs(cropA[0]-cropA[2])/zoom);
    h = round(abs(cropA[1]-cropA[3])/zoom);
    cropImg = createImage(w, h);
    if (format == 'gif') {
      // cropImg.gifProperties = img.gifProperties; // Not deep copy, shared references.
      // Possible solution: Build cropImg.gifProperties from the ground-up. Makes code more susceptible to break with future updates. All properties except "frames" are easy:
      cropImg.gifProperties = {};
      cropImg.gifProperties.displayIndex = 0;
      cropImg.gifProperties.loopLimit = img.gifProperties.loopLimit;
      cropImg.gifProperties.loopCount = img.gifProperties.loopCount;
      cropImg.gifProperties.frames = new Array(img.gifProperties.numFrames);
      cropImg.gifProperties.numFrames = img.gifProperties.numFrames;
      cropImg.gifProperties.playing = img.gifProperties.playing;
      cropImg.gifProperties.timeDisplayed = img.gifProperties.timeDisplayed;
      cropImg.gifProperties.lastChangeTime = 0;
      for (let i = 0; i < cropImg.gifProperties.numFrames; i++) { // For each gif frame
        cropImg.gifProperties.frames[i] = {};
        cropImg.gifProperties.frames[i].delay = img.gifProperties.frames[i].delay
        uintc8 = new Uint8ClampedArray(4*w*h);
        l = 0;
        for (let j = 0; j < 4*img.width*img.height; j += 4) { // This is, of course, very slow for larger crops with lots of frames
          index = int(j/4);
          row = floor(index/img.width);
          col = index%img.width;
          if (col >= cropLeftDisp && col < cropLeftDisp+w && row >= cropTopDisp && row < cropTopDisp+h) {
            for (let k = 0; k < 4; k++) {
              uintc8[l] = img.gifProperties.frames[i].image.data[j+k];
              l++;
            }
          }
        }
        cropImg.gifProperties.frames[i].image = new ImageData(uintc8, w, h);
      }
    } else {
      cropImg.copy(img, cropLeftDisp, cropTopDisp, w, h, 0, 0, w, h);
    }
    cropImg.save('croppedImage', format);
  }
}