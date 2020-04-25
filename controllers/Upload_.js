const path = require("path");
const myengine = require("../myengine");

let sendJsonResponse = function (res, status, content) {
  res.status(status);
  res.json(content);
};

exports.doCalc = async (req, res) => {
  let { uniqueName, isMale, height, weight } = req.body;

  if (req.files === null) {
    return res
      .status(500)
      .json({ Messages: "Front/Side images is missing", status: 0 });
  } else if ("undefined" == typeof req.files.frontFile) {
    return res
      .status(500)
      .json({ Messages: "Front file is missing", status: 0 });
  } else if ("undefined" == typeof req.files.sideFile) {
    return res
      .status(500)
      .json({ Messages: "Side file is missing", status: 0 });
  } else if (
    "undefined" == typeof req.body.height ||
    req.body.height.trim() == ""
  ) {
    return res
      .status(500)
      .json({ Messages: "Height is not correct", status: 0 });
  } else if (
    "undefined" == typeof req.body.weight ||
    req.body.weight.trim() == ""
  ) {
    return res
      .status(500)
      .json({ Messages: "Weight is not correct", status: 0 });
  }

  const frontFile = req.files.frontFile;
  const sideFile = req.files.sideFile;

  let srcPath0 = path.resolve(
    `./upload_photos/${uniqueName}-front-${Date.now()}${path.extname(
      frontFile.name
    )}`
  );
  let srcPath1 = path.resolve(
    `./upload_photos/${uniqueName}-side-${Date.now()}${path.extname(
      sideFile.name
    )}`
  );

  try {
    await frontFile.mv(srcPath0);
    await sideFile.mv(srcPath1);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }

  let bodyParams = {};
  try {
    bodyParams = await myengine.doCalc(
      uniqueName,
      isMale,
      height,
      weight,
      srcPath0,
      srcPath1
    );

    if (!bodyParams)
      // return res.status(400).json({ msg: "Height or Weight is not correct." });
      return res
        .status(400)
        .json({ Messages: "Height or Weight is not correct.", status: 0 });

    let data = {
      Neck_Round_Length: bodyParams.Neck_Round_Length,
      Arm_Round_Length: bodyParams.Arm_Round_Length,
      Waist_Round_Length: bodyParams.Waist_Round_Length,
      Hip_Round_Length: bodyParams.Hip_Round_Length,
      thigh_Round_Length: bodyParams.thigh_Round_Length,
      calf_Round_Length: bodyParams.calf_Round_Length,
      Chest_Round_Length: bodyParams.Chest_Round_Length,
      forearm_Round_Length: bodyParams.forearm_Round_Length,
    };
    return res.status(200).json({ data: data, Messages: "Success", status: 1 });
  } catch (err) {
    return res.status(500).json({ Messages: "Server error!", status: 0 });
  }
};
