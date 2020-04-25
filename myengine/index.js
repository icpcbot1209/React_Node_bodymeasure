var fs = require("fs");
var path = require("path");

var Jimp = require("jimp");

import { CPerson } from "./Person";
import { BODY_IMAGE_WIDTH, BODY_IMAGE_HEIGHT, Set_Pixel, Pixel } from "./DEF";

var Person = new CPerson();

export async function doCalc(
  uniqueName,
  isMale,
  height,
  weight,
  srcPath0,
  srcPath1
) {
  if (!Person.Init(uniqueName, height, weight, isMale)) return false;

  Person.Prepare_Front_Edge();
  await doIt(srcPath0);

  Person.Prepare_Side_Edge();
  await doIt(srcPath1);

  Person.Calc_Real_Size();

  let bodyParams = Person.Get_Body_Params();
  // let url0 = Person.url0;
  // let url1 = Person.url1;

  return bodyParams;
}

async function doIt(srcPath) {
  let bodyImage = Person.Get_Body_Image();
  await parseFromFile(srcPath, bodyImage);
  Person.Upgrade_Edge();
  Person.Get_Good_Image();
  Person.Get_Rough_Edge();
  Person.Calc_Body_Params();

  return true;
}

async function parseFromFile(srcPath, bodyImage) {
  let srcJimp = await Jimp.read(srcPath);

  let w = srcJimp.getWidth();
  let h = srcJimp.getHeight();
  let neww = 384;
  let newh = 512;
  let z = Math.max(neww / w, newh / h);

  let offx = 0,
    offy = 0;
  srcJimp.scale(z);
  let resultJimp = new Jimp(neww, newh, "yellow");
  resultJimp.composite(srcJimp, offx, offy);
  resultJimp.flip(false, true);

  await srcJimp.scan(0, 0, BODY_IMAGE_WIDTH, BODY_IMAGE_HEIGHT, function(
    x,
    y,
    idx
  ) {
    var red = this.bitmap.data[idx + 0];
    var green = this.bitmap.data[idx + 1];
    var blue = this.bitmap.data[idx + 2];
    var alpha = this.bitmap.data[idx + 3];
    Set_Pixel(bodyImage, x, y, new Pixel(red, green, blue));
  });
}
