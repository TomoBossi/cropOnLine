// Load from disk
// https://stackoverflow.com/questions/42498717/how-to-read-image-file-using-plain-javascript
// Load from url
// https://editor.p5js.org/shiffman/sketches/B1SmhBLJx
// https://p5js.org/reference/#/p5/createInput

p5.disableFriendlyErrors = false;

let bgc = 35,
    uibc,
    uihc,
    onHud = false,
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
    formatList = ['.png', '.jpg', '.gif'],
    format, // Format of currently opened picture
    img; // p5.Image object containing the loaded picture



function setup() {
  rectMode(CENTER);
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
  // load.style('cursor', 'pointer');
  
  linkField = createInput('', 'text');
  linkField.size(uipx-8, 15);
  linkField.position(loadButtonX-linkField.size().width/2, loadButtonD+10);
  linkField.attribute('placeholder', '... or enter an image URL');
  
  uibc = color(20, 110, 130);
  uihc = color(100, 250, 250);
}



function draw() {
  background(35);
  onHud = mouseX<loadButtonR && mouseX>loadButtonL && mouseY<loadButtonD && mouseY>loadButtonU;
  if (!loaded) {
    link = linkField.value();
    valid = formatList.includes(link.slice(-4, link.length));
    
    fill(uibc);
    noStroke();
    rect(loadButtonX, loadButtonY, uipx, uipx, 4);
    loadButton(loadButtonX, loadButtonY);
    if (onHud) {
      fill(0,255,255,60);
      strokeWeight(2);
      rect(loadButtonX, loadButtonY, uipx, uipx, 4);
    }
    
    textFont('helvetica');
    textAlign(CENTER, CENTER);
    textSize(uipx/16);
    textStyle(ITALIC);
    fill(100);
    stroke(0, 50);
    strokeWeight(3);
    text('github.com/TomoBossi/CropOnLine', width/2, height-uipx/16);
    fill(120);
    textSize(uipx/15);
    text('supported formats:', width/2, uipx/4);
    fill(140);
    textSize(uipx/14);
    text('.png .jpg .gif', width/2, uipx/3);
    fill(180);
    textSize(uipx/13);
    textStyle(BOLDITALIC);
    text('Online Image Cropping Tool', width/2, uipx/10);
    textStyle(BOLD);
    fill(uihc);
    textSize(uipx/18);
    text('click (or drag + drop file here)', width/2, loadButtonU+uipx/8);
    textStyle(BOLDITALIC);
    textSize(uipx/7);
    strokeWeight(5);
    text('File Upload', width/2, loadButtonU+uipx/3.7);
    
    fill(40);
    stroke(70);
    strokeWeight(uipx/50);
    rect(width/2, loadButtonD+35+uipx/11, uipx/10*1.5, uipx/10, 3);
    rect(width/2+0.2*uipx/10, loadButtonD+35+uipx/11+0.4*uipx/10, uipx/10*1.1, uipx/10*1.8, 3);
    noStroke();
    rect(width/2, loadButtonD+35+uipx/11, uipx/10*1.5, uipx/10, 3);
    rect(width/2+0.2*uipx/10, loadButtonD+35+uipx/11+0.4*uipx/10, uipx/10*1.1, uipx/10*1.8, 3);
    
  } if (img) {
    image(img, width/2, height/2, img.width, img.height);
  }
}



function loadButton(x, y) {
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
}



function keyPressed() {
  // https://www.toptal.com/developers/keycode
  console.log(keyCode);
  if (keyCode === 27) {
    reset();
  }
  if (valid && keyCode === 13) {
    loadFromURL(link);
  }
}



function reset() {
  img = null;
  loaded = false;
  load.show();
  linkField.show();
}



// Auxiliary functions for image loading
function getImage(e) { // File upload disk
  let dataURL = reader.result;
  loadImage(dataURL, function (newImage) { img = newImage }); // Try, based on format
} function loadFile(file) {
  loaded = true;
  load.hide();
  linkField.hide();
  reader.onload = getImage;
  reader.readAsDataURL(file.file);
} function loadFromURL(URL) { // File upload from URL
  img = createImg(URL); // Try, based on if file exists
  loaded = true;
  load.hide();
  linkField.hide();
  img.hide();
}