import { Polygon_2D, Body_Params, Body_Image, Pixel, Get_Pixel } from "./DEF";
import { STATE_NODETECTED, STATE_DETECTED } from "./Rough_Edge";
import { Front_Rough_Edge } from "./Front_Rough_Edge";
import { Side_Rough_Edge } from "./Side_Rough_Edge";
import { sum3d, pabs } from "./Util_Funcs";

const MIN_FAT_PER = -100;
const MAX_FAT_PER = 300;

export class CPerson {
  constructor() {
    this.uniqueName = "";
    this.url0 = "";
    this.url1 = "";

    this.Now_Is_Front = true;

    this.mBody = new Body_Params(); // save all calculation parameters of body
    this.mLST = new Body_Params(); //type of Body_Params, saves params
    this.mRST = new Body_Params(); //
    this.mHip = new Body_Params(); //
    this.mBelly = new Body_Params(); //
    this.mBack = new Body_Params(); //

    this.Edge = null; // pointer to FRE or SRE, type of Rough_Edge

    this.fBodyImage = new Body_Image(); //
    this.sBodyImage = new Body_Image();
    this.tBodyImage = new Body_Image();
    this.Good_Image = new Body_Image();
    this.pbImage = this.fBodyImage;

    this.nowImage = null;
    this.lsImage = null;

    this.FRE = new Front_Rough_Edge();
    this.SRE = new Side_Rough_Edge();
    this.Good_Rough_Polygon = new Polygon_2D();
  }

  Init(uniqueName, height, weight, Is_Male) {
    if (height < 120) return false;
    if (weight < 30) return false;

    let exp_weight = (height - 100) * 0.9;
    let fp = Math.round(((weight - exp_weight) * 100) / exp_weight);
    if (fp > MAX_FAT_PER || fp < MIN_FAT_PER) return false;

    this.uniqueName = uniqueName;
    this.mBody = new Body_Params();
    this.mBody.Is_Male = Is_Male;
    this.mBody.Height = Math.round(height * 10);
    this.mBody.Weight = Math.round(weight * 10);
    this.mBody.Fat_Per = fp;

    return true;
  }

  Prepare_Front_Edge() {
    this.Now_Is_Front = true;
    this.pbImage = this.fBodyImage;
    this.nowImage = null;
    this.lsImage = null;

    this.Edge = this.FRE;
    this.Edge.Init(this.mBody); // here must make the Edge_Polygon
  }

  Prepare_Side_Edge() {
    this.Now_Is_Front = false;
    this.pbImage = this.sBodyImage;
    this.nowImage = null;
    this.lsImage = null;

    this.Edge = this.SRE;
    this.Edge.Init(this.mBody);
  }

  // bool CPerson::Very_Diff_Image(Body_Image* img1, Body_Image* img2)
  Very_Diff_Image(img1, img2) {
    let i, j, dx, dy;
    let col1 = new Pixel(),
      col2 = new Pixel();
    let w_10 = BODY_IMAGE_WIDTH - 10;
    let h_10 = BODY_IMAGE_HEIGHT - 10;
    let s = 0,
      mn,
      nd,
      acou = 0;

    for (i = 10; i < w_10; i += 5) {
      for (j = 10; j < h_10; j += 5) {
        col1 = Get_Pixel(img1, i, j);
        mn = 10000;
        for (dx = -2; dx <= 2; dx++) {
          for (dy = -2; dy <= 2; dy++) {
            col2 = Get_Pixel(img2, i + dx, j + dy);
            nd = sum3d(pabs(col1 - col2));
            if (nd < mn) mn = nd;
          }
        }
        s += mn;
        acou++;
      }
    }
    if (s > 50000) return true;
    return false;
  }

  // bool CPerson::Upgrade_Edge()
  Upgrade_Edge() {
    if (this.Edge == null) return false;
    if (this.nowImage == null) return false;
    if (this.lsImage != null) {
      if (this.Very_Diff_Image(this.nowImage, this.lsImage)) {
        this.Edge.Last_State = STATE_NODETECTED;
        return false;
      }
    }

    if (!this.Edge.Detect_Human(this.nowImage)) {
      switch (this.Edge.Last_State) {
        case STATE_NODETECTED:
          break;
        case STATE_DETECTED:
          this.Edge.Last_State = STATE_NODETECTED;
          break;
      }

      this.Edge.Edge_Polygon = JSON.parse(JSON.stringify(this.Edge.Demo_Edge));
      return false;
    }

    if (!this.Edge.Adjust_Human(this.nowImage)) {
      switch (this.Edge.Last_State) {
        case STATE_NODETECTED:
          break;
        case STATE_DETECTED:
          this.Edge.Last_State = STATE_NODETECTED;
          break;
      }

      this.Edge.Edge_Polygon = JSON.parse(JSON.stringify(this.Edge.Demo_Edge));
      return false;
    }

    this.Edge.Last_State = STATE_DETECTED;

    this.Good_Image = JSON.parse(JSON.stringify(this.nowImage));
    this.Good_Rough_Polygon = this.Get_Rough_Edge();
    return true;
  }

  // void CPerson::Extract_Correct_Edge()
  Extract_Correct_Edge() {
    if (this.Edge == null) return;

    this.Edge.Correct_Human(this.Good_Image, this.Good_Rough_Polygon);
  }

  // void CPerson::Set_Correct_Edge( Polygon_2D cPoly )
  Set_Correct_Edge(cPoly) {
    if (this.Edge == null) return;

    this.Edge.Correct_Polygon = cPoly;
    this.Edge.Calc_Body_Params();
  }

  // bool CPerson::Calc_Body_Params()
  Calc_Body_Params() {
    if (this.Edge == null) return false;

    return this.Edge.Calc_Body_Params();
  }

  // Polygon_2D CPerson::Get_Rough_Edge( void )
  Get_Rough_Edge() {
    if (this.Edge == null) return this.FRE.Edge_Polygon;
    return this.Edge.Edge_Polygon;
  }

  // Polygon_2D CPerson::Get_Correct_Edge( void )
  Get_Correct_Edge() {
    if (this.Edge == null) return this.FRE.Edge_Polygon;
    return this.Edge.Correct_Polygon;
  }

  // Body_Params CPerson::Get_Body_Params( void )
  Get_Body_Params() {
    return this.mBody;
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  // bool CPerson::Calc_Real_Size()
  Calc_Real_Size() {
    let flag = this.get_One_Body_Param(this.mBody);
    if (this.mBody.LST > -1) {
      this.mLST = this.mBody;
      this.mLST.Left_Should_Type = this.mBody.LST;
      if (this.get_One_Body_Param(this.mLST)) {
        if (this.mBody.RST > -1) {
          this.mRST = this.mBody;
          this.mRST.Right_Should_Type = this.mBody.RST;
          if (this.get_One_Body_Param(this.mRST)) {
            this.mBody.Should_Width =
              0.6 * this.mBody.Should_Width +
              0.2 * this.mLST.Should_Width +
              0.2 * this.mRST.Should_Width;
            this.mBody.Chest_Round_Length =
              0.6 * this.mBody.Chest_Round_Length +
              0.2 * this.mLST.Chest_Round_Length +
              0.2 * this.mRST.Chest_Round_Length;
          } else {
            this.mBody.Should_Width =
              0.7 * this.mBody.Should_Width + 0.3 * this.mLST.Should_Width;
            this.mBody.Chest_Round_Length =
              0.7 * this.mBody.Chest_Round_Length +
              0.3 * this.mLST.Chest_Round_Length;
          }
        } else {
          this.mBody.Should_Width =
            0.7 * this.mBody.Should_Width + 0.3 * this.mLST.Should_Width;
          this.mBody.Chest_Round_Length =
            0.7 * this.mBody.Chest_Round_Length +
            0.3 * this.mLST.Chest_Round_Length;
        }
      }
    } else {
      if (this.mBody.RST > -1) {
        this.mRST = this.mBody;
        this.mRST.Right_Should_Type = this.mBody.RST;
        if (this.get_One_Body_Param(this.mRST)) {
          this.mBody.Should_Width =
            0.7 * this.mBody.Should_Width + 0.3 * this.mRST.Should_Width;
          this.mBody.Chest_Round_Length =
            0.7 * this.mBody.Chest_Round_Length +
            0.3 * this.mRST.Chest_Round_Length;
        }
      }
    }
    if (this.mBody.Back > -1) {
      this.mBack = this.mBody;
      this.mBack.Back_Type = this.mBody.Back;
      if (this.get_One_Body_Param(this.mBack)) {
        this.mBody.Back_Length =
          0.7 * this.mBody.Back_Length + 0.3 * this.mBack.Back_Length;
      }
    }
    if (this.mBody.Belly > -1) {
      this.mBelly = this.mBody;
      this.mBelly.Belly_Type = this.mBody.Belly;
      if (this.get_One_Body_Param(this.mBelly)) {
        this.mBody.Waist_Round_Length =
          0.7 * this.mBody.Waist_Round_Length +
          0.3 * this.mBelly.Waist_Round_Length;
      }
    }
    if (this.mBody.Hip > -1) {
      this.mHip = this.mBody;
      this.mHip.Hip_Type = this.mBody.Hip;
      if (this.get_One_Body_Param(this.mHip)) {
        this.mBody.Hip_Round_Length =
          0.7 * this.mBody.Hip_Round_Length + 0.3 * this.mHip.Hip_Round_Length;
      }
    }
    return true;
  }

  // Body_Image* CPerson::Get_Body_Image( void )
  Get_Body_Image() {
    if (this.nowImage == null) {
      this.nowImage = this.pbImage;
      return this.nowImage;
    } else if (this.lsImage == null) {
      this.lsImage = this.tBodyImage;
    }
    let tmp = this.nowImage;
    this.nowImage = this.lsImage;
    this.lsImage = tmp;

    return this.nowImage;
  }

  // Polygon_2D CPerson::Get_Demo_Edge( void )
  Get_Demo_Edge() {
    if (this.Edge == null) return this.FRE.Demo_Edge;
    return this.Edge.Demo_Edge;
  }

  // Body_Image* CPerson::Get_Good_Image( void )
  Get_Good_Image() {
    if (this.Now_Is_Front) {
      this.fBodyImage = JSON.parse(JSON.stringify(this.Good_Image));
    } else {
      this.sBodyImage = JSON.parse(JSON.stringify(this.Good_Image));
    }
    return this.Good_Image;
  }

  // Body_Image* CPerson::Get_Now_Image( void )
  Get_Now_Image() {
    return this.nowImage;
  }

  // Body_Image* CPerson::Get_Front_Good_Image( void )
  Get_Front_Good_Image() {
    return this.fBodyImage;
  }

  // Body_Image* CPerson::Get_Side_Good_Image( void )
  Get_Side_Good_Image() {
    return this.sBodyImage;
  }

  // bool CPerson::get_One_Body_Param(Body_Params& body)
  get_One_Body_Param(body = new Body_Params()) {
    if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.125134 * body.Height + 1.29991 * body.Fat_Per + 183.513
      );
      body.Back_Length = Math.floor(
        0.413137 * body.Height + 0.742378 * body.Fat_Per + 23.9467
      );
      body.Chest_Round_Length = Math.floor(
        0.40304 * body.Height + 4.33813 * body.Fat_Per + 223.78
      );
      body.Waist_Round_Length = Math.floor(
        0.346426 * body.Height + 5.07102 * body.Fat_Per + 222.517
      );
      body.Hip_Round_Length = Math.floor(
        0.427326 * body.Height + 3.68544 * body.Fat_Per + 175.122
      );
      body.Should_Width = Math.floor(
        0.19234 * body.Height + 0.832925 * body.Fat_Per + 111.677
      );
      body.Arm_Length = Math.floor(
        0.355933 * body.Height + 0.131993 * body.Fat_Per - 5.51214
      );
      body.Arm_Round_Length = Math.floor(
        0.124366 * body.Height + 1.56883 * body.Fat_Per + 82.6798
      );
      body.forearm_Round_Length = Math.floor(
        0.09195955 * body.Height + 0.9851185 * body.Fat_Per + 75.90855
      );
      body.thigh_Round_Length = Math.floor(
        0.213663 * body.Height + 3.68544 * body.Fat_Per + 87.561
      );
      body.calf_Round_Length = Math.floor(
        (0.213663 * body.Height + 3.68544 * body.Fat_Per + 87.561) / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0595531 * body.Height + 0.401407 * body.Fat_Per + 69.1373
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.130498 * body.Height + 1.37813 * body.Fat_Per + 171.787
      );
      body.Back_Length = Math.floor(
        0.401396 * body.Height + 0.697041 * body.Fat_Per + 40.7245
      );
      body.Chest_Round_Length = Math.floor(
        0.549064 * body.Height + 4.95289 * body.Fat_Per - 37.8459
      );
      body.Waist_Round_Length = Math.floor(
        0.370996 * body.Height + 5.34237 * body.Fat_Per + 164.554
      );
      body.Hip_Round_Length = Math.floor(
        0.467813 * body.Height + 4.02301 * body.Fat_Per + 96.7541
      );
      body.Should_Width = Math.floor(
        0.184822 * body.Height + 1.16145 * body.Fat_Per + 120.462
      );
      body.Arm_Length = Math.floor(
        0.344947 * body.Height - 0.174917 * body.Fat_Per + 17.0755
      );
      body.Arm_Round_Length = Math.floor(
        0.0976746 * body.Height + 1.78284 * body.Fat_Per + 129.434
      );
      body.forearm_Round_Length = Math.floor(
        0.0713164 * body.Height + 1.037743 * body.Fat_Per + 112.3221
      );
      body.thigh_Round_Length = Math.floor(
        (0.467813 * body.Height + 4.02301 * body.Fat_Per + 96.7541) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.467813 * body.Height + 4.02301 * body.Fat_Per + 96.7541) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0449582 * body.Height + 0.292646 * body.Fat_Per + 95.2102
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 1
    ) {
      body.Neck_Round_Length = Math.floor(
        0.18558 * body.Height + 0.801029 * body.Fat_Per + 84.2769
      );
      body.Back_Length = Math.floor(
        0.200885 * body.Height - 0.738903 * body.Fat_Per + 406.752
      );
      body.Chest_Round_Length = Math.floor(
        0.102451 * body.Height + 4.50573 * body.Fat_Per + 753.443
      );
      body.Waist_Round_Length = Math.floor(
        0.074237 * body.Height + 4.4552 * body.Fat_Per + 698.123
      );
      body.Hip_Round_Length = Math.floor(
        0.188142 * body.Height + 4.71284 * body.Fat_Per + 582.909
      );
      body.Should_Width = Math.floor(
        0.0460973 * body.Height + 1.03147 * body.Fat_Per + 353.087
      );
      body.Arm_Length = Math.floor(
        0.422516 * body.Height + 0.586486 * body.Fat_Per - 130.397
      );
      body.Arm_Round_Length = Math.floor(
        0.130723 * body.Height + 2.59196 * body.Fat_Per + 58.5647
      );
      body.forearm_Round_Length = Math.floor(
        0.0856856 * body.Height + 1.495115 * body.Fat_Per + 48.5647
      );
      body.thigh_Round_Length = Math.floor(
        (0.188142 * body.Height + 4.71284 * body.Fat_Per + 582.909) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.188142 * body.Height + 4.71284 * body.Fat_Per + 582.909) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0406482 * body.Height + 0.39827 * body.Fat_Per + 101.416
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.103171 * body.Height + 1.10926 * body.Fat_Per + 222.177
      );
      body.Back_Length = Math.floor(
        0.611161 * body.Height + 0.589118 * body.Fat_Per - 309.719
      );
      body.Chest_Round_Length = Math.floor(
        0.426527 * body.Height + 3.67611 * body.Fat_Per + 173.798
      );
      body.Waist_Round_Length = Math.floor(
        0.446997 * body.Height + 4.49754 * body.Fat_Per + 42.6726
      );
      body.Hip_Round_Length = Math.floor(
        0.43721 * body.Height + 2.98206 * body.Fat_Per + 156.257
      );
      body.Should_Width = Math.floor(
        0.0956522 * body.Height + 0.842504 * body.Fat_Per + 272.377
      );
      body.Arm_Length = Math.floor(
        0.271889 * body.Height - 0.418055 * body.Fat_Per + 140.287
      );
      body.Arm_Round_Length = Math.floor(
        0.0757904 * body.Height + 1.55793 * body.Fat_Per + 162.469
      );
      body.forearm_Round_Length = Math.floor(
        0.06910525 * body.Height + 0.9095805 * body.Fat_Per + 113.7146
      );
      body.thigh_Round_Length = Math.floor(
        (0.446997 * body.Height + 4.49754 * body.Fat_Per + 42.6726) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.446997 * body.Height + 4.49754 * body.Fat_Per + 42.6726) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0624201 * body.Height + 0.261231 * body.Fat_Per + 64.9602
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.144785 * body.Height + 1.34021 * body.Fat_Per + 149.162
      );
      body.Back_Length = Math.floor(
        0.432074 * body.Height + 0.611723 * body.Fat_Per - 8.37023
      );
      body.Chest_Round_Length = Math.floor(
        0.423603 * body.Height + 4.42602 * body.Fat_Per + 190.742
      );
      body.Waist_Round_Length = Math.floor(
        0.426754 * body.Height + 4.67808 * body.Fat_Per + 97.0058
      );
      body.Hip_Round_Length = Math.floor(
        0.497743 * body.Height + 3.5145 * body.Fat_Per + 55.5531
      );
      body.Should_Width = Math.floor(
        0.186454 * body.Height + 0.915557 * body.Fat_Per + 120.017
      );
      body.Arm_Length = Math.floor(
        0.338975 * body.Height - 0.371539 * body.Fat_Per + 29.9814
      );
      body.Arm_Round_Length = Math.floor(
        0.121515 * body.Height + 1.6911 * body.Fat_Per + 83.0256
      );
      body.forearm_Round_Length = Math.floor(
        0.0879903 * body.Height + 0.995868 * body.Fat_Per + 82.16585
      );
      body.thigh_Round_Length = Math.floor(
        (0.426754 * body.Height + 4.67808 * body.Fat_Per + 97.0058) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.426754 * body.Height + 4.67808 * body.Fat_Per + 97.0058) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0544656 * body.Height + 0.300636 * body.Fat_Per + 81.3061
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0760684 * body.Height + 1.90628 * body.Fat_Per + 256.599
      );
      body.Back_Length = Math.floor(
        0.311394 * body.Height + 0.747171 * body.Fat_Per + 206.327
      );
      body.Chest_Round_Length = Math.floor(
        0.330719 * body.Height + 4.85429 * body.Fat_Per + 359.195
      );
      body.Waist_Round_Length = Math.floor(
        0.430557 * body.Height + 5.21709 * body.Fat_Per + 102.84
      );
      body.Hip_Round_Length = Math.floor(
        0.310608 * body.Height + 4.90855 * body.Fat_Per + 363.713
      );
      body.Should_Width = Math.floor(
        0.175341 * body.Height + 0.797668 * body.Fat_Per + 133.9
      );
      body.Arm_Length = Math.floor(
        0.390633 * body.Height + 0.924821 * body.Fat_Per - 67.8275
      );
      body.Arm_Round_Length = Math.floor(
        0.12924 * body.Height + 1.56561 * body.Fat_Per + 79.0547
      );
      body.forearm_Round_Length = Math.floor(
        0.063830645 * body.Height + 0.969614 * body.Fat_Per + 127.55385
      );
      body.thigh_Round_Length = Math.floor(
        (0.430557 * body.Height + 5.21709 * body.Fat_Per + 102.84) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.430557 * body.Height + 5.21709 * body.Fat_Per + 102.84) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        -0.00157871 * body.Height + 0.373618 * body.Fat_Per + 176.053
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.129546 * body.Height + 1.16596 * body.Fat_Per + 182.315
      );
      body.Back_Length = Math.floor(
        0.351035 * body.Height + 0.615093 * body.Fat_Per + 133.843
      );
      body.Chest_Round_Length = Math.floor(
        0.436224 * body.Height + 4.18472 * body.Fat_Per + 180.603
      );
      body.Waist_Round_Length = Math.floor(
        0.460315 * body.Height + 4.71342 * body.Fat_Per + 61.0182
      );
      body.Hip_Round_Length = Math.floor(
        0.475811 * body.Height + 3.86795 * body.Fat_Per + 90.7006
      );
      body.Should_Width = Math.floor(
        0.169831 * body.Height + 0.963351 * body.Fat_Per + 148.349
      );
      body.Arm_Length = Math.floor(
        0.365807 * body.Height - 0.0974023 * body.Fat_Per - 15.9922
      );
      body.Arm_Round_Length = Math.floor(
        0.127677 * body.Height + 1.46319 * body.Fat_Per + 79.2077
      );
      body.forearm_Round_Length = Math.floor(
        0.0960583 * body.Height + 0.926472 * body.Fat_Per + 70.9779
      );
      body.thigh_Round_Length = Math.floor(
        (0.460315 * body.Height + 4.71342 * body.Fat_Per + 61.0182) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.460315 * body.Height + 4.71342 * body.Fat_Per + 61.0182) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0644396 * body.Height + 0.389754 * body.Fat_Per + 62.7481
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.107016 * body.Height + 1.17531 * body.Fat_Per + 218.462
      );
      body.Back_Length = Math.floor(
        0.296329 * body.Height + 0.315974 * body.Fat_Per + 239.263
      );
      body.Chest_Round_Length = Math.floor(
        0.501774 * body.Height + 3.95218 * body.Fat_Per + 64.0016
      );
      body.Waist_Round_Length = Math.floor(
        0.394488 * body.Height + 4.05689 * body.Fat_Per + 186.905
      );
      body.Hip_Round_Length = Math.floor(
        0.638671 * body.Height + 3.96779 * body.Fat_Per - 196
      );
      body.Should_Width = Math.floor(
        0.197756 * body.Height + 0.981782 * body.Fat_Per + 97.476
      );
      body.Arm_Length = Math.floor(
        0.532077 * body.Height - 0.198258 * body.Fat_Per - 303.362
      );
      body.Arm_Round_Length = Math.floor(
        0.129997 * body.Height + 1.33208 * body.Fat_Per + 82.5099
      );
      body.forearm_Round_Length = Math.floor(
        0.117307 * body.Height + 0.8603335 * body.Fat_Per + 37.702695
      );
      body.thigh_Round_Length = Math.floor(
        (0.394488 * body.Height + 4.05689 * body.Fat_Per + 186.905) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.394488 * body.Height + 4.05689 * body.Fat_Per + 186.905) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.104617 * body.Height + 0.388587 * body.Fat_Per - 7.10451
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.147658 * body.Height + 1.27119 * body.Fat_Per + 147.594
      );
      body.Back_Length = Math.floor(
        0.454734 * body.Height + 0.523564 * body.Fat_Per - 38.344
      );
      body.Chest_Round_Length = Math.floor(
        0.56703 * body.Height + 4.60303 * body.Fat_Per - 63.5904
      );
      body.Waist_Round_Length = Math.floor(
        0.553334 * body.Height + 4.96299 * body.Fat_Per - 114.249
      );
      body.Hip_Round_Length = Math.floor(
        0.510788 * body.Height + 3.53352 * body.Fat_Per + 37.507
      );
      body.Should_Width = Math.floor(
        0.206489 * body.Height + 0.984622 * body.Fat_Per + 82.8683
      );
      body.Arm_Length = Math.floor(
        0.352257 * body.Height + 0.182439 * body.Fat_Per + 2.54363
      );
      body.Arm_Round_Length = Math.floor(
        0.133866 * body.Height + 1.63996 * body.Fat_Per + 61.8113
      );
      body.forearm_Round_Length = Math.floor(
        0.09763825 * body.Height + 1.0550595 * body.Fat_Per + 63.8123
      );
      body.thigh_Round_Length = Math.floor(
        (0.553334 * body.Height + 4.96299 * body.Fat_Per - 114.249) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.553334 * body.Height + 4.96299 * body.Fat_Per - 114.249) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0614105 * body.Height + 0.470159 * body.Fat_Per + 65.8133
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 5
    ) {
      body.Neck_Round_Length = Math.floor(
        0.100087 * body.Height + 1.57458 * body.Fat_Per + 216.147
      );
      body.Back_Length = Math.floor(
        0.235262 * body.Height + 1.35038 * body.Fat_Per + 301.786
      );
      body.Chest_Round_Length = Math.floor(
        0.484382 * body.Height + 5.08513 * body.Fat_Per + 80.9691
      );
      body.Waist_Round_Length = Math.floor(
        0.105027 * body.Height + 6.48818 * body.Fat_Per + 642.617
      );
      body.Hip_Round_Length = Math.floor(
        0.785132 * body.Height + 4.67676 * body.Fat_Per - 455.806
      );
      body.Should_Width = Math.floor(
        0.251951 * body.Height + 0.751796 * body.Fat_Per + 7.72614
      );
      body.Arm_Length = Math.floor(
        0.259163 * body.Height + 0.360298 * body.Fat_Per + 149.823
      );
      body.Arm_Round_Length = Math.floor(
        -0.0117464 * body.Height + 1.60403 * body.Fat_Per + 319.346
      );
      body.forearm_Round_Length = Math.floor(
        0.09763825 * body.Height + 1.0550595 * body.Fat_Per + 63.8123
      );
      body.thigh_Round_Length = Math.floor(
        (0.105027 * body.Height + 6.48818 * body.Fat_Per + 642.617) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.105027 * body.Height + 6.48818 * body.Fat_Per + 642.617) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        -0.00628997 * body.Height + 0.541937 * body.Fat_Per + 183.017
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 1 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.174788 * body.Height + 1.3232 * body.Fat_Per + 101.21
      );
      body.Back_Length = Math.floor(
        0.39791 * body.Height + 0.206875 * body.Fat_Per + 52.6241
      );
      body.Chest_Round_Length = Math.floor(
        0.232233 * body.Height + 3.41466 * body.Fat_Per + 542.338
      );
      body.Waist_Round_Length = Math.floor(
        0.294658 * body.Height + 4.72397 * body.Fat_Per + 335.011
      );
      body.Hip_Round_Length = Math.floor(
        0.30412 * body.Height + 3.03021 * body.Fat_Per + 393.978
      );
      body.Should_Width = Math.floor(
        0.229503 * body.Height + 0.717087 * body.Fat_Per + 47.3332
      );
      body.Arm_Length = Math.floor(
        0.449433 * body.Height - 0.0407169 * body.Fat_Per - 165.185
      );
      body.Arm_Round_Length = Math.floor(
        0.108708 * body.Height + 1.22811 * body.Fat_Per + 109.23
      );
      body.forearm_Round_Length = Math.floor(
        0.08034645 * body.Height + 0.775496 * body.Fat_Per + 96.4212
      );
      body.thigh_Round_Length = Math.floor(
        (0.294658 * body.Height + 4.72397 * body.Fat_Per + 335.011) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.294658 * body.Height + 4.72397 * body.Fat_Per + 335.011) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0519849 * body.Height + 0.322882 * body.Fat_Per + 83.6124
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 1 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.211462 * body.Height + 1.62695 * body.Fat_Per + 39.8614
      );
      body.Back_Length = Math.floor(
        0.32718 * body.Height + 0.794079 * body.Fat_Per + 171.539
      );
      body.Chest_Round_Length = Math.floor(
        0.472749 * body.Height + 4.23465 * body.Fat_Per + 143.468
      );
      body.Waist_Round_Length = Math.floor(
        0.545071 * body.Height + 4.30579 * body.Fat_Per - 36.8131
      );
      body.Hip_Round_Length = Math.floor(
        0.408409 * body.Height + 3.43835 * body.Fat_Per + 233.565
      );
      body.Should_Width = Math.floor(
        0.222997 * body.Height + 0.854177 * body.Fat_Per + 62.9477
      );
      body.Arm_Length = Math.floor(
        0.309608 * body.Height - 0.111951 * body.Fat_Per + 81.1657
      );
      body.Arm_Round_Length = Math.floor(
        0.143203 * body.Height + 1.16093 * body.Fat_Per + 71.6081
      );
      body.forearm_Round_Length = Math.floor(
        0.11095365 * body.Height + 0.7781765 * body.Fat_Per + 56.05105
      );
      body.thigh_Round_Length = Math.floor(
        (0.545071 * body.Height + 4.30579 * body.Fat_Per - 36.8131) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.545071 * body.Height + 4.30579 * body.Fat_Per - 36.8131) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0787043 * body.Height + 0.395423 * body.Fat_Per + 40.494
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 1 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.18681 * body.Height + 0.938654 * body.Fat_Per + 89.3325
      );
      body.Back_Length = Math.floor(
        0.766244 * body.Height + 1.22367 * body.Fat_Per - 591.11
      );
      body.Chest_Round_Length = Math.floor(
        0.648212 * body.Height + 3.41933 * body.Fat_Per - 151.582
      );
      body.Waist_Round_Length = Math.floor(
        0.611292 * body.Height + 3.4278 * body.Fat_Per - 142.289
      );
      body.Hip_Round_Length = Math.floor(
        0.549182 * body.Height + 3.7119 * body.Fat_Per - 28.1387
      );
      body.Should_Width = Math.floor(
        0.354586 * body.Height + 1.41392 * body.Fat_Per - 178.109
      );
      body.Arm_Length = Math.floor(
        0.462049 * body.Height + 1.0887 * body.Fat_Per - 211.84
      );
      body.Arm_Round_Length = Math.floor(
        0.149735 * body.Height + 1.58044 * body.Fat_Per + 37.7304
      );
      body.forearm_Round_Length = Math.floor(
        0.0929717 * body.Height + 0.987635 * body.Fat_Per + 73.6337
      );
      body.thigh_Round_Length = Math.floor(
        (0.611292 * body.Height + 3.4278 * body.Fat_Per - 142.289) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.611292 * body.Height + 3.4278 * body.Fat_Per - 142.289) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0362084 * body.Height + 0.39483 * body.Fat_Per + 109.537
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.159246 * body.Height + 1.6814 * body.Fat_Per + 122.087
      );
      body.Back_Length = Math.floor(
        0.515204 * body.Height + 0.409102 * body.Fat_Per - 154.805
      );
      body.Chest_Round_Length = Math.floor(
        0.354656 * body.Height + 3.90885 * body.Fat_Per + 305.077
      );
      body.Waist_Round_Length = Math.floor(
        0.600342 * body.Height + 5.50536 * body.Fat_Per - 230.295
      );
      body.Hip_Round_Length = Math.floor(
        0.615701 * body.Height + 3.52757 * body.Fat_Per - 143.618
      );
      body.Should_Width = Math.floor(
        0.243165 * body.Height + 1.40745 * body.Fat_Per + 8.15062
      );
      body.Arm_Length = Math.floor(
        0.35388 * body.Height - 0.586654 * body.Fat_Per + 9.89635
      );
      body.Arm_Round_Length = Math.floor(
        0.220072 * body.Height + 0.974248 * body.Fat_Per - 71.3707
      );
      body.forearm_Round_Length = Math.floor(
        0.1377626 * body.Height + 0.6750955 * body.Fat_Per + 4.03165
      );
      body.thigh_Round_Length = Math.floor(
        (0.600342 * body.Height + 5.50536 * body.Fat_Per - 230.295) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.600342 * body.Height + 5.50536 * body.Fat_Per - 230.295) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0554532 * body.Height + 0.375943 * body.Fat_Per + 79.434
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0811167 * body.Height + 1.41663 * body.Fat_Per + 259.523
      );
      body.Back_Length = Math.floor(
        0.381889 * body.Height + 0.755725 * body.Fat_Per + 74.8025
      );
      body.Chest_Round_Length = Math.floor(
        0.72817 * body.Height + 4.9355 * body.Fat_Per - 346.285
      );
      body.Waist_Round_Length = Math.floor(
        0.748576 * body.Height + 5.63324 * body.Fat_Per - 463.055
      );
      body.Hip_Round_Length = Math.floor(
        0.764937 * body.Height + 4.06975 * body.Fat_Per - 397.553
      );
      body.Should_Width = Math.floor(
        0.202916 * body.Height + 0.903987 * body.Fat_Per + 90.8577
      );
      body.Arm_Length = Math.floor(
        0.371754 * body.Height + 0.251308 * body.Fat_Per - 41.4137
      );
      body.Arm_Round_Length = Math.floor(
        0.188901 * body.Height + 1.63419 * body.Fat_Per - 25.2067
      );
      body.forearm_Round_Length = Math.floor(
        0.1089253 * body.Height + 1.0459525 * body.Fat_Per + 48.73865
      );
      body.thigh_Round_Length = Math.floor(
        (0.748576 * body.Height + 5.63324 * body.Fat_Per - 463.055) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.748576 * body.Height + 5.63324 * body.Fat_Per - 463.055) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0289496 * body.Height + 0.457715 * body.Fat_Per + 122.684
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.199509 * body.Height + 0.150298 * body.Fat_Per + 94.1053
      );
      body.Back_Length = Math.floor(
        0.546601 * body.Height + 0.668611 * body.Fat_Per - 207.816
      );
      body.Chest_Round_Length = Math.floor(
        0.454927 * body.Height + 4.4002 * body.Fat_Per + 147.506
      );
      body.Waist_Round_Length = Math.floor(
        0.696033 * body.Height + 4.70827 * body.Fat_Per - 347.184
      );
      body.Hip_Round_Length = Math.floor(
        0.586479 * body.Height + 5.69017 * body.Fat_Per - 152.377
      );
      body.Should_Width = Math.floor(
        0.21764 * body.Height + 0.332012 * body.Fat_Per + 89.7863
      );
      body.Arm_Length = Math.floor(
        0.386823 * body.Height + 0.0716972 * body.Fat_Per - 52.5334
      );
      body.Arm_Round_Length = Math.floor(
        0.13476 * body.Height + 1.79375 * body.Fat_Per + 56.4489
      );
      body.forearm_Round_Length = Math.floor(
        0.10819555 * body.Height + 0.961979 * body.Fat_Per + 51.10965
      );
      body.thigh_Round_Length = Math.floor(
        (0.696033 * body.Height + 4.70827 * body.Fat_Per - 347.184) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.696033 * body.Height + 4.70827 * body.Fat_Per - 347.184) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0816311 * body.Height + 0.130208 * body.Fat_Per + 45.7704
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.11309 * body.Height + 1.33459 * body.Fat_Per + 204.082
      );
      body.Back_Length = Math.floor(
        0.433047 * body.Height + 0.557354 * body.Fat_Per - 5.91658
      );
      body.Chest_Round_Length = Math.floor(
        0.378596 * body.Height + 4.06368 * body.Fat_Per + 267.692
      );
      body.Waist_Round_Length = Math.floor(
        0.37527 * body.Height + 4.79471 * body.Fat_Per + 173.448
      );
      body.Hip_Round_Length = Math.floor(
        0.44181 * body.Height + 3.60551 * body.Fat_Per + 150.629
      );
      body.Should_Width = Math.floor(
        0.185249 * body.Height + 0.923883 * body.Fat_Per + 121.658
      );
      body.Arm_Length = Math.floor(
        0.357755 * body.Height - 0.0144036 * body.Fat_Per - 7.89136
      );
      body.Arm_Round_Length = Math.floor(
        0.0871231 * body.Height + 1.54321 * body.Fat_Per + 146.792
      );
      body.forearm_Round_Length = Math.floor(
        0.07507585 * body.Height + 1.0143475 * body.Fat_Per + 105.08665
      );
      body.thigh_Round_Length = Math.floor(
        (0.37527 * body.Height + 4.79471 * body.Fat_Per + 173.448) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.37527 * body.Height + 4.79471 * body.Fat_Per + 173.448) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0630286 * body.Height + 0.485485 * body.Fat_Per + 63.3813
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.125876 * body.Height + 2.17352 * body.Fat_Per + 179.199
      );
      body.Back_Length = Math.floor(
        0.355017 * body.Height + 0.0538106 * body.Fat_Per + 128.9
      );
      body.Chest_Round_Length = Math.floor(
        0.342643 * body.Height + 3.35096 * body.Fat_Per + 350.175
      );
      body.Waist_Round_Length = Math.floor(
        0.189931 * body.Height + 3.43179 * body.Fat_Per + 516.767
      );
      body.Hip_Round_Length = Math.floor(
        0.334278 * body.Height + 4.36158 * body.Fat_Per + 336.28
      );
      body.Should_Width = Math.floor(
        0.136318 * body.Height + 1.22725 * body.Fat_Per + 198.289
      );
      body.Arm_Length = Math.floor(
        0.372203 * body.Height - 0.165276 * body.Fat_Per - 26.8447
      );
      body.Arm_Round_Length = Math.floor(
        0.0491493 * body.Height + 1.55676 * body.Fat_Per + 220.041
      );
      body.forearm_Round_Length = Math.floor(
        0.05615025 * body.Height + 0.9988385 * body.Fat_Per + 141.48835
      );
      body.thigh_Round_Length = Math.floor(
        (0.189931 * body.Height + 3.43179 * body.Fat_Per + 516.767) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.189931 * body.Height + 3.43179 * body.Fat_Per + 516.767) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0631512 * body.Height + 0.440917 * body.Fat_Per + 62.9357
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.113161 * body.Height + 1.03633 * body.Fat_Per + 202.838
      );
      body.Back_Length = Math.floor(
        0.430311 * body.Height + 0.384633 * body.Fat_Per + 1.30174
      );
      body.Chest_Round_Length = Math.floor(
        0.306233 * body.Height + 2.17211 * body.Fat_Per + 391.399
      );
      body.Waist_Round_Length = Math.floor(
        0.306919 * body.Height + 3.09983 * body.Fat_Per + 293.447
      );
      body.Hip_Round_Length = Math.floor(
        0.367676 * body.Height + 2.0369 * body.Fat_Per + 278.69
      );
      body.Should_Width = Math.floor(
        0.0970242 * body.Height + 0.74604 * body.Fat_Per + 272.273
      );
      body.Arm_Length = Math.floor(
        0.364282 * body.Height - 0.263398 * body.Fat_Per - 14.4853
      );
      body.Arm_Round_Length = Math.floor(
        0.057291 * body.Height + 0.942882 * body.Fat_Per + 195.541
      );
      body.forearm_Round_Length = Math.floor(
        0.0539104 * body.Height + 0.5763575 * body.Fat_Per + 140.0913
      );
      body.thigh_Round_Length = Math.floor(
        (0.306919 * body.Height + 3.09983 * body.Fat_Per + 293.447) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.306919 * body.Height + 3.09983 * body.Fat_Per + 293.447) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0505298 * body.Height + 0.209833 * body.Fat_Per + 84.6416
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.151423 * body.Height + 1.3736 * body.Fat_Per + 140.826
      );
      body.Back_Length = Math.floor(
        0.360336 * body.Height + 0.343321 * body.Fat_Per + 119.149
      );
      body.Chest_Round_Length = Math.floor(
        0.376415 * body.Height + 4.12639 * body.Fat_Per + 275.221
      );
      body.Waist_Round_Length = Math.floor(
        0.447594 * body.Height + 4.57931 * body.Fat_Per + 57.9009
      );
      body.Hip_Round_Length = Math.floor(
        0.354219 * body.Height + 3.02019 * body.Fat_Per + 312.431
      );
      body.Should_Width = Math.floor(
        0.184017 * body.Height + 0.384351 * body.Fat_Per + 133.559
      );
      body.Arm_Length = Math.floor(
        0.356905 * body.Height - 0.213246 * body.Fat_Per - 0.834704
      );
      body.Arm_Round_Length = Math.floor(
        0.124377 * body.Height + 2.06 * body.Fat_Per + 76.0592
      );
      body.forearm_Round_Length = Math.floor(
        0.09860435 * body.Height + 1.3149235 * body.Fat_Per + 60.7105
      );
      body.thigh_Round_Length = Math.floor(
        (0.447594 * body.Height + 4.57931 * body.Fat_Per + 57.9009) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.447594 * body.Height + 4.57931 * body.Fat_Per + 57.9009) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0728317 * body.Height + 0.569847 * body.Fat_Per + 45.3618
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0999258 * body.Height + 1.15487 * body.Fat_Per + 234.519
      );
      body.Back_Length = Math.floor(
        0.428278 * body.Height + 0.657168 * body.Fat_Per + 3.41013
      );
      body.Chest_Round_Length = Math.floor(
        0.417475 * body.Height + 4.40477 * body.Fat_Per + 206.857
      );
      body.Waist_Round_Length = Math.floor(
        0.432531 * body.Height + 4.95894 * body.Fat_Per + 103.261
      );
      body.Hip_Round_Length = Math.floor(
        0.53616 * body.Height + 3.83618 * body.Fat_Per - 9.07395
      );
      body.Should_Width = Math.floor(
        0.172489 * body.Height + 1.00957 * body.Fat_Per + 144.093
      );
      body.Arm_Length = Math.floor(
        0.382748 * body.Height - 0.0481729 * body.Fat_Per - 48.3078
      );
      body.Arm_Round_Length = Math.floor(
        0.129745 * body.Height + 1.38313 * body.Fat_Per + 81.1899
      );
      body.forearm_Round_Length = Math.floor(
        0.10504845 * body.Height + 0.9027695 * body.Fat_Per + 57.76165
      );
      body.thigh_Round_Length = Math.floor(
        (0.432531 * body.Height + 4.95894 * body.Fat_Per + 103.261) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.432531 * body.Height + 4.95894 * body.Fat_Per + 103.261) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0803519 * body.Height + 0.422409 * body.Fat_Per + 34.3334
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.137955 * body.Height + 1.35166 * body.Fat_Per + 163.898
      );
      body.Back_Length = Math.floor(
        0.615249 * body.Height + 0.801084 * body.Fat_Per - 322.703
      );
      body.Chest_Round_Length = Math.floor(
        0.686424 * body.Height + 3.55433 * body.Fat_Per - 221.032
      );
      body.Waist_Round_Length = Math.floor(
        0.73494 * body.Height + 5.11429 * body.Fat_Per - 414.164
      );
      body.Hip_Round_Length = Math.floor(
        0.697725 * body.Height + 4.11843 * body.Fat_Per - 291.477
      );
      body.Should_Width = Math.floor(
        0.176763 * body.Height + 0.64796 * body.Fat_Per + 142.247
      );
      body.Arm_Length = Math.floor(
        0.315715 * body.Height + 0.0483284 * body.Fat_Per + 62.58
      );
      body.Arm_Round_Length = Math.floor(
        0.20844 * body.Height + 1.25284 * body.Fat_Per - 48.3164
      );
      body.forearm_Round_Length = Math.floor(
        0.14498755 * body.Height + 0.895284 * body.Fat_Per - 9.24095
      );
      body.thigh_Round_Length = Math.floor(
        (0.73494 * body.Height + 5.11429 * body.Fat_Per - 414.164) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.73494 * body.Height + 5.11429 * body.Fat_Per - 414.164) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0815351 * body.Height + 0.537728 * body.Fat_Per + 29.8345
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.200946 * body.Height + 1.43741 * body.Fat_Per + 55.0651
      );
      body.Back_Length = Math.floor(
        0.405798 * body.Height + 0.364578 * body.Fat_Per + 50.3386
      );
      body.Chest_Round_Length = Math.floor(
        0.363737 * body.Height + 3.19178 * body.Fat_Per + 330.461
      );
      body.Waist_Round_Length = Math.floor(
        0.349913 * body.Height + 4.11251 * body.Fat_Per + 270.772
      );
      body.Hip_Round_Length = Math.floor(
        0.429797 * body.Height + 3.47604 * body.Fat_Per + 177.692
      );
      body.Should_Width = Math.floor(
        0.177232 * body.Height + 0.598355 * body.Fat_Per + 145.223
      );
      body.Arm_Length = Math.floor(
        0.390616 * body.Height + 0.116779 * body.Fat_Per - 64.076
      );
      body.Arm_Round_Length = Math.floor(
        0.122567 * body.Height + 1.47969 * body.Fat_Per + 92.4294
      );
      body.forearm_Round_Length = Math.floor(
        0.09997145 * body.Height + 0.939972 * body.Fat_Per + 68.00455
      );
      body.thigh_Round_Length = Math.floor(
        (0.349913 * body.Height + 4.11251 * body.Fat_Per + 270.772) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.349913 * body.Height + 4.11251 * body.Fat_Per + 270.772) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0773759 * body.Height + 0.400254 * body.Fat_Per + 43.5797
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.236394 * body.Height + 1.28094 * body.Fat_Per - 2.62286
      );
      body.Back_Length = Math.floor(
        0.490916 * body.Height + 1.02696 * body.Fat_Per - 119.933
      );
      body.Chest_Round_Length = Math.floor(
        0.620377 * body.Height + 3.2634 * body.Fat_Per - 111.427
      );
      body.Waist_Round_Length = Math.floor(
        0.787382 * body.Height + 4.35577 * body.Fat_Per - 488.807
      );
      body.Hip_Round_Length = Math.floor(
        0.738747 * body.Height + 3.7777 * body.Fat_Per - 359.021
      );
      body.Should_Width = Math.floor(
        0.190679 * body.Height + 0.782735 * body.Fat_Per + 118.386
      );
      body.Arm_Length = Math.floor(
        0.300997 * body.Height + 0.232979 * body.Fat_Per + 89.3964
      );
      body.Arm_Round_Length = Math.floor(
        0.264949 * body.Height + 1.55398 * body.Fat_Per - 152.329
      );
      body.forearm_Round_Length = Math.floor(
        0.1627427 * body.Height + 0.9688105 * body.Fat_Per - 41.6046
      );
      body.thigh_Round_Length = Math.floor(
        (0.787382 * body.Height + 4.35577 * body.Fat_Per - 488.807) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.787382 * body.Height + 4.35577 * body.Fat_Per - 488.807) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0605364 * body.Height + 0.383641 * body.Fat_Per + 69.1198
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0742238 * body.Height + 1.16544 * body.Fat_Per + 276.639
      );
      body.Back_Length = Math.floor(
        0.434489 * body.Height + 0.54756 * body.Fat_Per - 15.7761
      );
      body.Chest_Round_Length = Math.floor(
        0.331211 * body.Height + 4.04995 * body.Fat_Per + 348.107
      );
      body.Waist_Round_Length = Math.floor(
        0.23972 * body.Height + 4.68995 * body.Fat_Per + 407.583
      );
      body.Hip_Round_Length = Math.floor(
        0.383839 * body.Height + 3.84346 * body.Fat_Per + 251.988
      );
      body.Should_Width = Math.floor(
        0.175007 * body.Height + 0.772744 * body.Fat_Per + 140.743
      );
      body.Arm_Length = Math.floor(
        0.347801 * body.Height + 0.0300581 * body.Fat_Per + 8.78789
      );
      body.Arm_Round_Length = Math.floor(
        0.131933 * body.Height + 1.63917 * body.Fat_Per + 68.8324
      );
      body.forearm_Round_Length = Math.floor(
        0.0940466 * body.Height + 1.0181525 * body.Fat_Per + 71.87835
      );
      body.thigh_Round_Length = Math.floor(
        (0.23972 * body.Height + 4.68995 * body.Fat_Per + 407.583) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.23972 * body.Height + 4.68995 * body.Fat_Per + 407.583) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0561602 * body.Height + 0.397135 * body.Fat_Per + 74.9243
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.156038 * body.Height + 0.878561 * body.Fat_Per + 144.754
      );
      body.Back_Length = Math.floor(
        0.401878 * body.Height + 0.15375 * body.Fat_Per + 65.749
      );
      body.Chest_Round_Length = Math.floor(
        0.378017 * body.Height + 4.13948 * body.Fat_Per + 272.749
      );
      body.Waist_Round_Length = Math.floor(
        0.359507 * body.Height + 5.07246 * body.Fat_Per + 216.966
      );
      body.Hip_Round_Length = Math.floor(
        0.479862 * body.Height + 3.79807 * body.Fat_Per + 95.1898
      );
      body.Should_Width = Math.floor(
        0.223921 * body.Height + 0.962026 * body.Fat_Per + 54.1321
      );
      body.Arm_Length = Math.floor(
        0.334823 * body.Height - 0.586442 * body.Fat_Per + 50.1397
      );
      body.Arm_Round_Length = Math.floor(
        0.0905302 * body.Height + 1.98428 * body.Fat_Per + 133.085
      );
      body.forearm_Round_Length = Math.floor(
        0.07950295 * body.Height + 1.190959 * body.Fat_Per + 95.6519
      );
      body.thigh_Round_Length = Math.floor(
        (0.359507 * body.Height + 5.07246 * body.Fat_Per + 216.966) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.359507 * body.Height + 5.07246 * body.Fat_Per + 216.966) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0684757 * body.Height + 0.397638 * body.Fat_Per + 58.2188
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 4 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.130354 * body.Height + 1.58994 * body.Fat_Per + 173.558
      );
      body.Back_Length = Math.floor(
        0.413106 * body.Height + 0.567005 * body.Fat_Per + 26.2381
      );
      body.Chest_Round_Length = Math.floor(
        0.333909 * body.Height + 3.94603 * body.Fat_Per + 352.424
      );
      body.Waist_Round_Length = Math.floor(
        0.311516 * body.Height + 4.57397 * body.Fat_Per + 295.059
      );
      body.Hip_Round_Length = Math.floor(
        0.343893 * body.Height + 3.59626 * body.Fat_Per + 320.741
      );
      body.Should_Width = Math.floor(
        0.207974 * body.Height + 0.58504 * body.Fat_Per + 84.036
      );
      body.Arm_Length = Math.floor(
        0.401014 * body.Height - 0.0990202 * body.Fat_Per - 77.042
      );
      body.Arm_Round_Length = Math.floor(
        0.0706428 * body.Height + 1.58182 * body.Fat_Per + 174.392
      );
      body.forearm_Round_Length = Math.floor(
        0.0705807 * body.Height + 0.983207 * body.Fat_Per + 112.9196
      );
      body.thigh_Round_Length = Math.floor(
        (0.311516 * body.Height + 4.57397 * body.Fat_Per + 295.059) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.311516 * body.Height + 4.57397 * body.Fat_Per + 295.059) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0705186 * body.Height + 0.384594 * body.Fat_Per + 51.4472
      );
      return true;
    } else if (
      body.Left_Should_Type == 3 &&
      body.Right_Should_Type == 4 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0848278 * body.Height + 0.926544 * body.Fat_Per + 269.629
      );
      body.Back_Length = Math.floor(
        0.496844 * body.Height + 0.697811 * body.Fat_Per - 117.561
      );
      body.Chest_Round_Length = Math.floor(
        0.437537 * body.Height + 3.64162 * body.Fat_Per + 201.843
      );
      body.Waist_Round_Length = Math.floor(
        0.560876 * body.Height + 4.35049 * body.Fat_Per - 86.4804
      );
      body.Hip_Round_Length = Math.floor(
        0.441236 * body.Height + 3.59017 * body.Fat_Per + 159.926
      );
      body.Should_Width = Math.floor(
        0.182711 * body.Height + 0.823739 * body.Fat_Per + 125.772
      );
      body.Arm_Length = Math.floor(
        0.434981 * body.Height - 0.0271078 * body.Fat_Per - 139.953
      );
      body.Arm_Round_Length = Math.floor(
        0.194313 * body.Height + 1.10499 * body.Fat_Per - 26.5545
      );
      body.forearm_Round_Length = Math.floor(
        0.13329305 * body.Height + 0.622335 * body.Fat_Per + 14.7182
      );
      body.thigh_Round_Length = Math.floor(
        (0.560876 * body.Height + 4.35049 * body.Fat_Per - 86.4804) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.560876 * body.Height + 4.35049 * body.Fat_Per - 86.4804) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0722731 * body.Height + 0.13968 * body.Fat_Per + 55.9909
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.10572 * body.Height + 1.17696 * body.Fat_Per + 216.271
      );
      body.Back_Length = Math.floor(
        0.412046 * body.Height + 0.373422 * body.Fat_Per + 27.874
      );
      body.Chest_Round_Length = Math.floor(
        0.370377 * body.Height + 3.80344 * body.Fat_Per + 286.825
      );
      body.Waist_Round_Length = Math.floor(
        0.42669 * body.Height + 4.33613 * body.Fat_Per + 88.2872
      );
      body.Hip_Round_Length = Math.floor(
        0.480927 * body.Height + 3.00902 * body.Fat_Per + 92.2605
      );
      body.Should_Width = Math.floor(
        0.205447 * body.Height + 0.834212 * body.Fat_Per + 88.7946
      );
      body.Arm_Length = Math.floor(
        0.357922 * body.Height + 0.14166 * body.Fat_Per - 9.63892
      );
      body.Arm_Round_Length = Math.floor(
        0.158223 * body.Height + 1.62745 * body.Fat_Per + 25.3898
      );
      body.forearm_Round_Length = Math.floor(
        0.1125672 * body.Height + 1.009427 * body.Fat_Per + 41.59675
      );
      body.thigh_Round_Length = Math.floor(
        (0.42669 * body.Height + 4.33613 * body.Fat_Per + 88.2872) / 2
      );
      body.calf_Round_Length = Math.floor(
        ((0.42669 * body.Height + 4.33613 * body.Fat_Per + 88.2872) / 2 )/ 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0669114 * body.Height + 0.391404 * body.Fat_Per + 57.8037
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.179094 * body.Height + 1.47901 * body.Fat_Per + 90.176
      );
      body.Back_Length = Math.floor(
        0.327767 * body.Height + 0.755963 * body.Fat_Per + 169.075
      );
      body.Chest_Round_Length = Math.floor(
        0.684616 * body.Height + 4.67491 * body.Fat_Per - 258.444
      );
      body.Waist_Round_Length = Math.floor(
        0.605788 * body.Height + 4.35971 * body.Fat_Per - 204.358
      );
      body.Hip_Round_Length = Math.floor(
        0.524037 * body.Height + 3.34007 * body.Fat_Per + 13.2056
      );
      body.Should_Width = Math.floor(
        0.199087 * body.Height + 0.933685 * body.Fat_Per + 100.162
      );
      body.Arm_Length = Math.floor(
        0.467413 * body.Height + 0.362546 * body.Fat_Per - 208.142
      );
      body.Arm_Round_Length = Math.floor(
        0.197643 * body.Height + 1.31702 * body.Fat_Per - 40.0791
      );
      body.forearm_Round_Length = Math.floor(
        0.12436025 * body.Height + 0.988833 * body.Fat_Per + 19.70305
      );
      body.thigh_Round_Length = Math.floor(
        (0.605788 * body.Height + 4.35971 * body.Fat_Per - 204.358) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.605788 * body.Height + 4.35971 * body.Fat_Per - 204.358) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0510775 * body.Height + 0.660646 * body.Fat_Per + 79.4852
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.113801 * body.Height + 1.31577 * body.Fat_Per + 208.005
      );
      body.Back_Length = Math.floor(
        0.456699 * body.Height + 0.533156 * body.Fat_Per - 44.6606
      );
      body.Chest_Round_Length = Math.floor(
        0.473535 * body.Height + 3.55754 * body.Fat_Per + 127.213
      );
      body.Waist_Round_Length = Math.floor(
        0.484829 * body.Height + 4.08628 * body.Fat_Per + 27.2638
      );
      body.Hip_Round_Length = Math.floor(
        0.599032 * body.Height + 3.68679 * body.Fat_Per - 115.684
      );
      body.Should_Width = Math.floor(
        0.19606 * body.Height + 0.85334 * body.Fat_Per + 104.287
      );
      body.Arm_Length = Math.floor(
        0.358677 * body.Height + 0.10208 * body.Fat_Per - 11.5471
      );
      body.Arm_Round_Length = Math.floor(
        0.186001 * body.Height + 1.65071 * body.Fat_Per - 23.2594
      );
      body.forearm_Round_Length = Math.floor(
        0.13471115 * body.Height + 1.0887015 * body.Fat_Per + 2.69795
      );
      body.thigh_Round_Length = Math.floor(
        (0.484829 * body.Height + 4.08628 * body.Fat_Per + 27.2638) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.484829 * body.Height + 4.08628 * body.Fat_Per + 27.2638) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0834213 * body.Height + 0.526693 * body.Fat_Per + 28.6553
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0991778 * body.Height + 1.36098 * body.Fat_Per + 230.495
      );
      body.Back_Length = Math.floor(
        0.422326 * body.Height + 0.785264 * body.Fat_Per + 7.33652
      );
      body.Chest_Round_Length = Math.floor(
        0.52068 * body.Height + 4.78603 * body.Fat_Per + 17.5861
      );
      body.Waist_Round_Length = Math.floor(
        0.5716 * body.Height + 6.4398 * body.Fat_Per - 172.975
      );
      body.Hip_Round_Length = Math.floor(
        0.585955 * body.Height + 4.63551 * body.Fat_Per - 122.676
      );
      body.Should_Width = Math.floor(
        0.22507 * body.Height + 0.741767 * body.Fat_Per + 53.9981
      );
      body.Arm_Length = Math.floor(
        0.276184 * body.Height + 0.353968 * body.Fat_Per + 123.417
      );
      body.Arm_Round_Length = Math.floor(
        0.112188 * body.Height + 1.66877 * body.Fat_Per + 100.192
      );
      body.forearm_Round_Length = Math.floor(
        0.08276415 * body.Height + 1.0402175 * body.Fat_Per + 91.93755
      );
      body.thigh_Round_Length = Math.floor(
        (0.5716 * body.Height + 6.4398 * body.Fat_Per - 172.975) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.5716 * body.Height + 6.4398 * body.Fat_Per - 172.975) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0533403 * body.Height + 0.411665 * body.Fat_Per + 83.6831
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.139355 * body.Height + 1.31213 * body.Fat_Per + 161.01
      );
      body.Back_Length = Math.floor(
        0.453039 * body.Height + 0.77761 * body.Fat_Per - 44.7417
      );
      body.Chest_Round_Length = Math.floor(
        0.3843 * body.Height + 4.33153 * body.Fat_Per + 254.526
      );
      body.Waist_Round_Length = Math.floor(
        0.356744 * body.Height + 4.7611 * body.Fat_Per + 206.177
      );
      body.Hip_Round_Length = Math.floor(
        0.462522 * body.Height + 3.49099 * body.Fat_Per + 116.101
      );
      body.Should_Width = Math.floor(
        0.191395 * body.Height + 0.890788 * body.Fat_Per + 111.633
      );
      body.Arm_Length = Math.floor(
        0.367583 * body.Height + 0.218101 * body.Fat_Per - 25.453
      );
      body.Arm_Round_Length = Math.floor(
        0.129666 * body.Height + 1.60523 * body.Fat_Per + 75.247
      );
      body.forearm_Round_Length = Math.floor(
        0.0949716 * body.Height + 1.009044 * body.Fat_Per + 71.3166
      );
      body.thigh_Round_Length = Math.floor(
        (0.356744 * body.Height + 4.7611 * body.Fat_Per + 206.177) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.356744 * body.Height + 4.7611 * body.Fat_Per + 206.177) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0602772 * body.Height + 0.412858 * body.Fat_Per + 67.3862
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.178334 * body.Height + 1.5322 * body.Fat_Per + 92.2284
      );
      body.Back_Length = Math.floor(
        0.405243 * body.Height + 0.949294 * body.Fat_Per + 33.3858
      );
      body.Chest_Round_Length = Math.floor(
        0.226722 * body.Height + 4.30268 * body.Fat_Per + 537.092
      );
      body.Waist_Round_Length = Math.floor(
        0.147041 * body.Height + 4.9415 * body.Fat_Per + 567.101
      );
      body.Hip_Round_Length = Math.floor(
        0.387106 * body.Height + 4.65579 * body.Fat_Per + 237.928
      );
      body.Should_Width = Math.floor(
        0.137157 * body.Height + 1.04741 * body.Fat_Per + 204.169
      );
      body.Arm_Length = Math.floor(
        0.386401 * body.Height + 0.105487 * body.Fat_Per - 61.3647
      );
      body.Arm_Round_Length = Math.floor(
        0.100379 * body.Height + 1.75941 * body.Fat_Per + 122.971
      );
      body.forearm_Round_Length = Math.floor(
        0.06646585 * body.Height + 1.1279475 * body.Fat_Per + 119.4515
      );
      body.thigh_Round_Length = Math.floor(
        (0.147041 * body.Height + 4.9415 * body.Fat_Per + 567.101) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.147041 * body.Height + 4.9415 * body.Fat_Per + 567.101) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0325527 * body.Height + 0.496485 * body.Fat_Per + 115.932
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.132322 * body.Height + 1.39267 * body.Fat_Per + 169.401
      );
      body.Back_Length = Math.floor(
        0.452913 * body.Height + 0.658939 * body.Fat_Per - 38.9324
      );
      body.Chest_Round_Length = Math.floor(
        0.344607 * body.Height + 3.75839 * body.Fat_Per + 317.752
      );
      body.Waist_Round_Length = Math.floor(
        0.346652 * body.Height + 4.39034 * body.Fat_Per + 220.532
      );
      body.Hip_Round_Length = Math.floor(
        0.330615 * body.Height + 3.31649 * body.Fat_Per + 339.931
      );
      body.Should_Width = Math.floor(
        0.231063 * body.Height + 0.746601 * body.Fat_Per + 44.9663
      );
      body.Arm_Length = Math.floor(
        0.34057 * body.Height + 0.100938 * body.Fat_Per + 19.5696
      );
      body.Arm_Round_Length = Math.floor(
        0.160986 * body.Height + 1.51699 * body.Fat_Per + 21.9993
      );
      body.forearm_Round_Length = Math.floor(
        0.11546615 * body.Height + 0.938958 * body.Fat_Per + 37.289
      );
      body.thigh_Round_Length = Math.floor(
        (0.330615 * body.Height + 3.31649 * body.Fat_Per + 339.931) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.330615 * body.Height + 3.31649 * body.Fat_Per + 339.931) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0699463 * body.Height + 0.360926 * body.Fat_Per + 52.5787
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.119644 * body.Height + 1.7387 * body.Fat_Per + 191.008
      );
      body.Back_Length = Math.floor(
        0.393772 * body.Height + 0.935651 * body.Fat_Per + 60.4004
      );
      body.Chest_Round_Length = Math.floor(
        0.517607 * body.Height + 5.09047 * body.Fat_Per + 14.2161
      );
      body.Waist_Round_Length = Math.floor(
        0.431773 * body.Height + 5.34892 * body.Fat_Per + 73.8242
      );
      body.Hip_Round_Length = Math.floor(
        0.40395 * body.Height + 3.83726 * body.Fat_Per + 215.083
      );
      body.Should_Width = Math.floor(
        0.153796 * body.Height + 1.03752 * body.Fat_Per + 175.486
      );
      body.Arm_Length = Math.floor(
        0.32504 * body.Height + 0.0565037 * body.Fat_Per + 48.8218
      );
      body.Arm_Round_Length = Math.floor(
        0.162209 * body.Height + 1.60919 * body.Fat_Per + 16.7064
      );
      body.forearm_Round_Length = Math.floor(
        0.09903765 * body.Height + 1.0271995 * body.Fat_Per + 62.7912
      );
      body.thigh_Round_Length = Math.floor(
        (0.330615 * body.Height + 3.31649 * body.Fat_Per + 339.931) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.330615 * body.Height + 3.31649 * body.Fat_Per + 339.931) / 2 / 1.8
      );
      body.Wrist_Round_Length = Math.floor(
        0.0358663 * body.Height + 0.445209 * body.Fat_Per + 108.876
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.25651 * body.Height + 1.41666 * body.Fat_Per - 36.1723
      );
      body.Back_Length = Math.floor(
        0.271963 * body.Height + 1.06337 * body.Fat_Per + 250.755
      );
      body.Chest_Round_Length = Math.floor(
        0.443285 * body.Height + 5.00641 * body.Fat_Per + 153.318
      );
      body.Waist_Round_Length = Math.floor(
        0.329486 * body.Height + 5.50836 * body.Fat_Per + 256.649
      );
      body.Hip_Round_Length = Math.floor(
        0.55808 * body.Height + 3.83699 * body.Fat_Per - 42.0849
      );
      body.Should_Width = Math.floor(
        0.0684446 * body.Height + 1.31453 * body.Fat_Per + 317.217
      );
      body.Arm_Length = Math.floor(
        0.282339 * body.Height - 0.0767526 * body.Fat_Per + 124.009
      );
      body.Arm_Round_Length = Math.floor(
        0.345768 * body.Height + 1.68425 * body.Fat_Per - 292.094
      );
      body.forearm_Round_Length = Math.floor(
        0.21206975 * body.Height + 1.1431225 * body.Fat_Per - 129.22065
      );
      body.thigh_Round_Length = Math.floor(
        (0.55808 * body.Height + 3.83699 * body.Fat_Per - 42.0849) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.55808 * body.Height + 3.83699 * body.Fat_Per - 42.0849) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0783715 * body.Height + 0.601995 * body.Fat_Per + 33.6527
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.136995 * body.Height + 1.38311 * body.Fat_Per + 165.303
      );
      body.Back_Length = Math.floor(
        0.425244 * body.Height + 0.556358 * body.Fat_Per + 10.125
      );
      body.Chest_Round_Length = Math.floor(
        0.501383 * body.Height + 4.43208 * body.Fat_Per + 61.7182
      );
      body.Waist_Round_Length = Math.floor(
        0.492673 * body.Height + 4.96883 * body.Fat_Per - 2.78411
      );
      body.Hip_Round_Length = Math.floor(
        0.536705 * body.Height + 3.85132 * body.Fat_Per - 10.032
      );
      body.Should_Width = Math.floor(
        0.182518 * body.Height + 0.94243 * body.Fat_Per + 127.956
      );
      body.Arm_Length = Math.floor(
        0.368173 * body.Height + 0.0201808 * body.Fat_Per - 25.2029
      );
      body.Arm_Round_Length = Math.floor(
        0.142257 * body.Height + 1.49215 * body.Fat_Per + 57.2488
      );
      body.forearm_Round_Length = Math.floor(
        0.10749715 * body.Height + 0.970959 * body.Fat_Per + 52.44305
      );
      body.thigh_Round_Length = Math.floor(
        (0.536705 * body.Height + 3.85132 * body.Fat_Per - 10.032) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.536705 * body.Height + 3.85132 * body.Fat_Per - 10.032) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0727373 * body.Height + 0.449768 * body.Fat_Per + 47.6373
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.230523 * body.Height + 1.4072 * body.Fat_Per + 7.88429
      );
      body.Back_Length = Math.floor(
        0.459589 * body.Height + 1.03823 * body.Fat_Per - 62.2098
      );
      body.Chest_Round_Length = Math.floor(
        0.534595 * body.Height + 4.45881 * body.Fat_Per - 1.5993
      );
      body.Waist_Round_Length = Math.floor(
        0.641544 * body.Height + 4.8766 * body.Fat_Per - 263.558
      );
      body.Hip_Round_Length = Math.floor(
        0.536685 * body.Height + 3.58545 * body.Fat_Per + 0.00285371
      );
      body.Should_Width = Math.floor(
        0.185859 * body.Height + 1.17936 * body.Fat_Per + 115.599
      );
      body.Arm_Length = Math.floor(
        0.306056 * body.Height + 0.320357 * body.Fat_Per + 72.8875
      );
      body.Arm_Round_Length = Math.floor(
        0.176447 * body.Height + 1.21426 * body.Fat_Per + 6.56473
      );
      body.forearm_Round_Length = Math.floor(
        0.12677 * body.Height + 0.812063 * body.Fat_Per + 23.256965
      );
      body.thigh_Round_Length = Math.floor(
        (0.536685 * body.Height + 3.58545 * body.Fat_Per + 0.00285371) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.536685 * body.Height + 3.58545 * body.Fat_Per + 0.00285371) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.077093 * body.Height + 0.409866 * body.Fat_Per + 39.9492
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.162197 * body.Height + 1.49112 * body.Fat_Per + 123.135
      );
      body.Back_Length = Math.floor(
        0.395665 * body.Height + 0.39856 * body.Fat_Per + 65.4031
      );
      body.Chest_Round_Length = Math.floor(
        0.514171 * body.Height + 4.91509 * body.Fat_Per + 25.1042
      );
      body.Waist_Round_Length = Math.floor(
        0.526584 * body.Height + 5.19152 * body.Fat_Per - 63.222
      );
      body.Hip_Round_Length = Math.floor(
        0.519632 * body.Height + 4.39936 * body.Fat_Per + 3.1345
      );
      body.Should_Width = Math.floor(
        0.246639 * body.Height + 1.01277 * body.Fat_Per + 17.1892
      );
      body.Arm_Length = Math.floor(
        0.332317 * body.Height + 0.142422 * body.Fat_Per + 32.3618
      );
      body.Arm_Round_Length = Math.floor(
        0.153767 * body.Height + 1.51503 * body.Fat_Per + 38.6691
      );
      body.forearm_Round_Length = Math.floor(
        0.128994 * body.Height + 1.006578 * body.Fat_Per + 15.874565
      );
      body.thigh_Round_Length = Math.floor(
        (0.519632 * body.Height + 4.39936 * body.Fat_Per + 3.1345) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.519632 * body.Height + 4.39936 * body.Fat_Per + 3.1345) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.104221 * body.Height + 0.498126 * body.Fat_Per - 6.91997
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 5
    ) {
      body.Neck_Round_Length = Math.floor(
        0.133399 * body.Height + 0.815657 * body.Fat_Per + 181.016
      );
      body.Back_Length = Math.floor(
        0.374232 * body.Height + 0.517188 * body.Fat_Per + 98.9057
      );
      body.Chest_Round_Length = Math.floor(
        0.69531 * body.Height + 4.25533 * body.Fat_Per - 258.099
      );
      body.Waist_Round_Length = Math.floor(
        0.790272 * body.Height + 4.44948 * body.Fat_Per - 479.632
      );
      body.Hip_Round_Length = Math.floor(
        0.68193 * body.Height + 3.41154 * body.Fat_Per - 240.808
      );
      body.Should_Width = Math.floor(
        0.158582 * body.Height + 1.15382 * body.Fat_Per + 166.827
      );
      body.Arm_Length = Math.floor(
        0.178075 * body.Height + 0.0876412 * body.Fat_Per + 300.649
      );
      body.Arm_Round_Length = Math.floor(
        0.141865 * body.Height + 1.38242 * body.Fat_Per + 62.6202
      );
      body.forearm_Round_Length = Math.floor(
        0.1239065 * body.Height + 1.0497085 * body.Fat_Per + 24.864
      );
      body.thigh_Round_Length = Math.floor(
        (0.68193 * body.Height + 3.41154 * body.Fat_Per - 240.808) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.68193 * body.Height + 3.41154 * body.Fat_Per - 240.808) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.105948 * body.Height + 0.716997 * body.Fat_Per - 12.8922
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 1 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.13513 * body.Height + 1.30153 * body.Fat_Per + 166.284
      );
      body.Back_Length = Math.floor(
        0.37846 * body.Height + 0.724662 * body.Fat_Per + 89.6869
      );
      body.Chest_Round_Length = Math.floor(
        0.454314 * body.Height + 6.35775 * body.Fat_Per + 129.961
      );
      body.Waist_Round_Length = Math.floor(
        0.371247 * body.Height + 6.90872 * body.Fat_Per + 180.198
      );
      body.Hip_Round_Length = Math.floor(
        0.42687 * body.Height + 5.26458 * body.Fat_Per + 169.846
      );
      body.Should_Width = Math.floor(
        0.197737 * body.Height + 1.41539 * body.Fat_Per + 96.9001
      );
      body.Arm_Length = Math.floor(
        0.376062 * body.Height - 0.309284 * body.Fat_Per - 32.7481
      );
      body.Arm_Round_Length = Math.floor(
        0.0910024 * body.Height + 2.22188 * body.Fat_Per + 143.005
      );
      body.forearm_Round_Length = Math.floor(
        0.0749308 * body.Height + 1.3739525 * body.Fat_Per + 107.14455
      );
      body.thigh_Round_Length = Math.floor(
        (0.43721 * body.Height + 2.98206 * body.Fat_Per + 156.257) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.43721 * body.Height + 2.98206 * body.Fat_Per + 156.257) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0588592 * body.Height + 0.526025 * body.Fat_Per + 71.2841
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 1 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0175344 * body.Height + 1.0101 * body.Fat_Per + 382.362
      );
      body.Back_Length = Math.floor(
        0.51398 * body.Height + 0.236325 * body.Fat_Per - 138.915
      );
      body.Chest_Round_Length = Math.floor(
        0.289791 * body.Height + 3.44718 * body.Fat_Per + 461.008
      );
      body.Waist_Round_Length = Math.floor(
        0.330628 * body.Height + 3.79242 * body.Fat_Per + 323.783
      );
      body.Hip_Round_Length = Math.floor(
        0.533283 * body.Height + 2.42717 * body.Fat_Per + 21.9527
      );
      body.Should_Width = Math.floor(
        0.148196 * body.Height + 0.809887 * body.Fat_Per + 190.844
      );
      body.Arm_Length = Math.floor(
        0.297264 * body.Height + 0.452206 * body.Fat_Per + 83.5261
      );
      body.Arm_Round_Length = Math.floor(
        -0.0309449 * body.Height + 1.44988 * body.Fat_Per + 365.04
      );
      body.forearm_Round_Length = Math.floor(
        0.00232065 * body.Height + 0.7847915 * body.Fat_Per + 242.682
      );
      body.thigh_Round_Length = Math.floor(
        (0.533283 * body.Height + 2.42717 * body.Fat_Per + 21.9527) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.533283 * body.Height + 2.42717 * body.Fat_Per + 21.9527) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0355862 * body.Height + 0.119703 * body.Fat_Per + 120.324
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 0 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.105843 * body.Height + 1.53976 * body.Fat_Per + 217.936
      );
      body.Back_Length = Math.floor(
        0.298004 * body.Height + 1.01953 * body.Fat_Per + 212.265
      );
      body.Chest_Round_Length = Math.floor(
        0.183552 * body.Height + 5.54127 * body.Fat_Per + 592.529
      );
      body.Waist_Round_Length = Math.floor(
        0.286741 * body.Height + 5.6975 * body.Fat_Per + 333.315
      );
      body.Hip_Round_Length = Math.floor(
        0.155017 * body.Height + 4.39089 * body.Fat_Per + 633.527
      );
      body.Should_Width = Math.floor(
        0.147469 * body.Height + 1.55506 * body.Fat_Per + 181.431
      );
      body.Arm_Length = Math.floor(
        0.334838 * body.Height + 0.258986 * body.Fat_Per + 28.4713
      );
      body.Arm_Round_Length = Math.floor(
        0.0356179 * body.Height + 1.9113 * body.Fat_Per + 230.627
      );
      body.forearm_Round_Length = Math.floor(
        0.05651275 * body.Height + 1.154603 * body.Fat_Per + 134.61195
      );
      body.thigh_Round_Length = Math.floor(
        (0.155017 * body.Height + 4.39089 * body.Fat_Per + 633.527) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.155017 * body.Height + 4.39089 * body.Fat_Per + 633.527) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0774076 * body.Height + 0.397906 * body.Fat_Per + 38.5969
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.151666 * body.Height + 1.1932 * body.Fat_Per + 145.721
      );
      body.Back_Length = Math.floor(
        0.576319 * body.Height + 0.200533 * body.Fat_Per - 235.492
      );
      body.Chest_Round_Length = Math.floor(
        0.718291 * body.Height + 4.12479 * body.Fat_Per - 301.571
      );
      body.Waist_Round_Length = Math.floor(
        0.944955 * body.Height + 5.51637 * body.Fat_Per - 801.865
      );
      body.Hip_Round_Length = Math.floor(
        0.651942 * body.Height + 3.48172 * body.Fat_Per - 185.462
      );
      body.Should_Width = Math.floor(
        0.190052 * body.Height + 0.76045 * body.Fat_Per + 122.02
      );
      body.Arm_Length = Math.floor(
        0.264997 * body.Height + 0.105891 * body.Fat_Per + 149.802
      );
      body.Arm_Round_Length = Math.floor(
        0.317387 * body.Height + 1.31112 * body.Fat_Per - 232.029
      );
      body.forearm_Round_Length = Math.floor(
        0.1960252 * body.Height + 0.827622 * body.Fat_Per - 91.93405
      );
      body.thigh_Round_Length = Math.floor(
        (0.651942 * body.Height + 3.48172 * body.Fat_Per - 185.462) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.651942 * body.Height + 3.48172 * body.Fat_Per - 185.462) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0746634 * body.Height + 0.344124 * body.Fat_Per + 48.1609
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.101414 * body.Height + 1.38792 * body.Fat_Per + 229.433
      );
      body.Back_Length = Math.floor(
        0.711183 * body.Height - 0.161175 * body.Fat_Per - 463.607
      );
      body.Chest_Round_Length = Math.floor(
        0.258561 * body.Height + 4.66932 * body.Fat_Per + 471.342
      );
      body.Waist_Round_Length = Math.floor(
        0.277724 * body.Height + 4.92609 * body.Fat_Per + 371.267
      );
      body.Hip_Round_Length = Math.floor(
        0.413173 * body.Height + 4.15271 * body.Fat_Per + 201.248
      );
      body.Should_Width = Math.floor(
        0.148375 * body.Height + 0.93403 * body.Fat_Per + 189.984
      );
      body.Arm_Length = Math.floor(
        0.438179 * body.Height - 0.0199848 * body.Fat_Per - 147.305
      );
      body.Arm_Round_Length = Math.floor(
        0.0774822 * body.Height + 1.66693 * body.Fat_Per + 161.971
      );
      body.forearm_Round_Length = Math.floor(
        0.0683481 * body.Height + 0.9593135 * body.Fat_Per + 120.7387
      );
      body.thigh_Round_Length = Math.floor(
        (0.413173 * body.Height + 4.15271 * body.Fat_Per + 201.248) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.413173 * body.Height + 4.15271 * body.Fat_Per + 201.248) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.059214 * body.Height + 0.251697 * body.Fat_Per + 79.5064
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.14372 * body.Height + 1.34071 * body.Fat_Per + 153.24
      );
      body.Back_Length = Math.floor(
        0.438742 * body.Height + 0.605175 * body.Fat_Per - 16.0281
      );
      body.Chest_Round_Length = Math.floor(
        0.39044 * body.Height + 4.18274 * body.Fat_Per + 245.581
      );
      body.Waist_Round_Length = Math.floor(
        0.40691 * body.Height + 4.41253 * body.Fat_Per + 119.977
      );
      body.Hip_Round_Length = Math.floor(
        0.463963 * body.Height + 3.12707 * body.Fat_Per + 118.904
      );
      body.Should_Width = Math.floor(
        0.171228 * body.Height + 0.92465 * body.Fat_Per + 147.5
      );
      body.Arm_Length = Math.floor(
        0.404976 * body.Height + 0.286487 * body.Fat_Per - 92.6698
      );
      body.Arm_Round_Length = Math.floor(
        0.129344 * body.Height + 1.50892 * body.Fat_Per + 74.121
      );
      body.forearm_Round_Length = Math.floor(
        0.09269055 * body.Height + 0.9911995 * body.Fat_Per + 75.10275
      );
      body.thigh_Round_Length = Math.floor(
        (0.463963 * body.Height + 3.12707 * body.Fat_Per + 118.904) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.463963 * body.Height + 3.12707 * body.Fat_Per + 118.904) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0560371 * body.Height + 0.473479 * body.Fat_Per + 76.0845
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        -0.0315967 * body.Height + 1.08595 * body.Fat_Per + 451.803
      );
      body.Back_Length = Math.floor(
        0.398561 * body.Height + 0.51636 * body.Fat_Per + 50.194
      );
      body.Chest_Round_Length = Math.floor(
        0.292272 * body.Height + 4.29891 * body.Fat_Per + 424.78
      );
      body.Waist_Round_Length = Math.floor(
        0.0661185 * body.Height + 5.01449 * body.Fat_Per + 698.769
      );
      body.Hip_Round_Length = Math.floor(
        0.358614 * body.Height + 3.32445 * body.Fat_Per + 291.317
      );
      body.Should_Width = Math.floor(
        0.0615289 * body.Height + 0.872054 * body.Fat_Per + 337.207
      );
      body.Arm_Length = Math.floor(
        0.47324 * body.Height + 0.139003 * body.Fat_Per - 206.971
      );
      body.Arm_Round_Length = Math.floor(
        0.0463298 * body.Height + 1.87917 * body.Fat_Per + 215.926
      );
      body.forearm_Round_Length = Math.floor(
        0.05216125 * body.Height + 1.199995 * body.Fat_Per + 144.2448
      );
      body.thigh_Round_Length = Math.floor(
        (0.358614 * body.Height + 3.32445 * body.Fat_Per + 291.317) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.358614 * body.Height + 3.32445 * body.Fat_Per + 291.317) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0579927 * body.Height + 0.52082 * body.Fat_Per + 72.5636
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0643215 * body.Height + 1.13198 * body.Fat_Per + 289.502
      );
      body.Back_Length = Math.floor(
        0.474848 * body.Height + 1.30485 * body.Fat_Per - 88.5185
      );
      body.Chest_Round_Length = Math.floor(
        0.426949 * body.Height + 4.03122 * body.Fat_Per + 193.289
      );
      body.Waist_Round_Length = Math.floor(
        0.388054 * body.Height + 4.47648 * body.Fat_Per + 160.699
      );
      body.Hip_Round_Length = Math.floor(
        0.332979 * body.Height + 2.53377 * body.Fat_Per + 353.832
      );
      body.Should_Width = Math.floor(
        0.281764 * body.Height + 1.36601 * body.Fat_Per - 44.8521
      );
      body.Arm_Length = Math.floor(
        0.290699 * body.Height + 0.323023 * body.Fat_Per + 103.805
      );
      body.Arm_Round_Length = Math.floor(
        0.222396 * body.Height + 1.31936 * body.Fat_Per - 81.5578
      );
      body.forearm_Round_Length = Math.floor(
        0.1358307 * body.Height + 0.8100315 * body.Fat_Per + 4.12675
      );
      body.thigh_Round_Length = Math.floor(
        (0.332979 * body.Height + 2.53377 * body.Fat_Per + 353.832) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.332979 * body.Height + 2.53377 * body.Fat_Per + 353.832) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0492654 * body.Height + 0.300703 * body.Fat_Per + 89.8113
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.139937 * body.Height + 0.9177 * body.Fat_Per + 168.78
      );
      body.Back_Length = Math.floor(
        0.31145 * body.Height + 1.08713 * body.Fat_Per + 189.228
      );
      body.Chest_Round_Length = Math.floor(
        0.306878 * body.Height + 4.20612 * body.Fat_Per + 386.531
      );
      body.Waist_Round_Length = Math.floor(
        0.413992 * body.Height + 4.89515 * body.Fat_Per + 108.215
      );
      body.Hip_Round_Length = Math.floor(
        0.474171 * body.Height + 4.86295 * body.Fat_Per + 76.7418
      );
      body.Should_Width = Math.floor(
        0.131541 * body.Height + 1.1458 * body.Fat_Per + 211.862
      );
      body.Arm_Length = Math.floor(
        0.515146 * body.Height + 0.168612 * body.Fat_Per - 281.825
      );
      body.Arm_Round_Length = Math.floor(
        0.103781 * body.Height + 2.26119 * body.Fat_Per + 109.881
      );
      body.forearm_Round_Length = Math.floor(
        0.0822225 * body.Height + 1.3929165 * body.Fat_Per + 87.31655
      );
      body.thigh_Round_Length = Math.floor(
        (0.474171 * body.Height + 4.86295 * body.Fat_Per + 76.7418) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.474171 * body.Height + 4.86295 * body.Fat_Per + 76.7418) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.060664 * body.Height + 0.524643 * body.Fat_Per + 64.7521
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.110178 * body.Height + 1.52276 * body.Fat_Per + 210.66
      );
      body.Back_Length = Math.floor(
        0.392605 * body.Height + 0.643755 * body.Fat_Per + 59.0106
      );
      body.Chest_Round_Length = Math.floor(
        0.39669 * body.Height + 4.36838 * body.Fat_Per + 231.165
      );
      body.Waist_Round_Length = Math.floor(
        0.28087 * body.Height + 4.79313 * body.Fat_Per + 357.17
      );
      body.Hip_Round_Length = Math.floor(
        0.456648 * body.Height + 3.56879 * body.Fat_Per + 122.773
      );
      body.Should_Width = Math.floor(
        0.18532 * body.Height + 0.94115 * body.Fat_Per + 121.411
      );
      body.Arm_Length = Math.floor(
        0.352725 * body.Height - 0.0695802 * body.Fat_Per + 2.78016
      );
      body.Arm_Round_Length = Math.floor(
        0.139949 * body.Height + 1.36767 * body.Fat_Per + 59.4333
      );
      body.forearm_Round_Length = Math.floor(
        0.10573865 * body.Height + 0.90381 * body.Fat_Per + 54.70715
      );
      body.thigh_Round_Length = Math.floor(
        (0.456648 * body.Height + 3.56879 * body.Fat_Per + 122.773) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.456648 * body.Height + 3.56879 * body.Fat_Per + 122.773) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0715283 * body.Height + 0.43995 * body.Fat_Per + 49.981
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0673243 * body.Height + 1.4603 * body.Fat_Per + 284.202
      );
      body.Back_Length = Math.floor(
        0.395455 * body.Height + 0.680695 * body.Fat_Per + 60.3858
      );
      body.Chest_Round_Length = Math.floor(
        0.424126 * body.Height + 4.22989 * body.Fat_Per + 191.821
      );
      body.Waist_Round_Length = Math.floor(
        0.559393 * body.Height + 4.83269 * body.Fat_Per - 112.882
      );
      body.Hip_Round_Length = Math.floor(
        0.503638 * body.Height + 3.60957 * body.Fat_Per + 43.2469
      );
      body.Should_Width = Math.floor(
        0.157151 * body.Height + 1.13049 * body.Fat_Per + 164.661
      );
      body.Arm_Length = Math.floor(
        0.399276 * body.Height + 0.0210813 * body.Fat_Per - 74.567
      );
      body.Arm_Round_Length = Math.floor(
        0.165299 * body.Height + 1.73082 * body.Fat_Per + 13.0859
      );
      body.forearm_Round_Length = Math.floor(
        0.12209145 * body.Height + 1.09964 * body.Fat_Per + 24.85365
      );
      body.thigh_Round_Length = Math.floor(
        (0.503638 * body.Height + 3.60957 * body.Fat_Per + 43.2469) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.503638 * body.Height + 3.60957 * body.Fat_Per + 43.2469) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0788839 * body.Height + 0.46846 * body.Fat_Per + 36.6214
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 1 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.173253 * body.Height + 1.39657 * body.Fat_Per + 111.094
      );
      body.Back_Length = Math.floor(
        0.424539 * body.Height + 0.28593 * body.Fat_Per + 30.8349
      );
      body.Chest_Round_Length = Math.floor(
        0.398119 * body.Height + 4.24822 * body.Fat_Per + 248.484
      );
      body.Waist_Round_Length = Math.floor(
        0.36715 * body.Height + 4.76163 * body.Fat_Per + 228.403
      );
      body.Hip_Round_Length = Math.floor(
        0.481933 * body.Height + 4.53129 * body.Fat_Per + 68.0091
      );
      body.Should_Width = Math.floor(
        0.298599 * body.Height + 0.576149 * body.Fat_Per - 54.3209
      );
      body.Arm_Length = Math.floor(
        0.395492 * body.Height + 0.154286 * body.Fat_Per - 77.1007
      );
      body.Arm_Round_Length = Math.floor(
        0.229583 * body.Height + 1.55956 * body.Fat_Per - 88.9275
      );
      body.forearm_Round_Length = Math.floor(
        0.1381191 * body.Height + 1.007049 * body.Fat_Per + 2.4733
      );
      body.thigh_Round_Length = Math.floor(
        (0.481933 * body.Height + 4.53129 * body.Fat_Per + 68.0091) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.481933 * body.Height + 4.53129 * body.Fat_Per + 68.0091) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0466552 * body.Height + 0.454538 * body.Fat_Per + 93.8741
      );
      return true;
    } else if (
      body.Left_Should_Type == 2 &&
      body.Right_Should_Type == 0 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.154802 * body.Height + 1.52132 * body.Fat_Per + 136.157
      );
      body.Back_Length = Math.floor(
        0.302946 * body.Height + 0.845718 * body.Fat_Per + 216.331
      );
      body.Chest_Round_Length = Math.floor(
        0.304745 * body.Height + 3.63364 * body.Fat_Per + 389.662
      );
      body.Waist_Round_Length = Math.floor(
        0.227515 * body.Height + 3.91449 * body.Fat_Per + 422.39
      );
      body.Hip_Round_Length = Math.floor(
        0.365448 * body.Height + 3.27842 * body.Fat_Per + 285.745
      );
      body.Should_Width = Math.floor(
        0.168568 * body.Height + 1.21227 * body.Fat_Per + 150.188
      );
      body.Arm_Length = Math.floor(
        0.273331 * body.Height - 0.0131877 * body.Fat_Per + 135.396
      );
      body.Arm_Round_Length = Math.floor(
        0.183378 * body.Height + 1.3771 * body.Fat_Per - 15.1744
      );
      body.forearm_Round_Length = Math.floor(
        0.1216567 * body.Height + 0.908047 * body.Fat_Per + 27.6414
      );
      body.thigh_Round_Length = Math.floor(
        (0.365448 * body.Height + 3.27842 * body.Fat_Per + 285.7457) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.365448 * body.Height + 3.27842 * body.Fat_Per + 285.745) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0599354 * body.Height + 0.438994 * body.Fat_Per + 70.4572
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.227127 * body.Height + 1.07493 * body.Fat_Per + 16.4175
      );
      body.Back_Length = Math.floor(
        0.475796 * body.Height + 0.805876 * body.Fat_Per - 84.1155
      );
      body.Chest_Round_Length = Math.floor(
        0.385187 * body.Height + 4.64103 * body.Fat_Per + 259.262
      );
      body.Waist_Round_Length = Math.floor(
        0.380573 * body.Height + 5.17761 * body.Fat_Per + 167.281
      );
      body.Hip_Round_Length = Math.floor(
        0.506117 * body.Height + 4.087 * body.Fat_Per + 44.4065
      );
      body.Should_Width = Math.floor(
        0.19412 * body.Height + 1.03079 * body.Fat_Per + 106.426
      );
      body.Arm_Length = Math.floor(
        0.421056 * body.Height + 0.482471 * body.Fat_Per - 121.818
      );
      body.Arm_Round_Length = Math.floor(
        0.175492 * body.Height + 1.41646 * body.Fat_Per + 2.21769
      );
      body.forearm_Round_Length = Math.floor(
        0.12974715 * body.Height + 0.9614485 * body.Fat_Per + 15.475295
      );
      body.thigh_Round_Length = Math.floor(
        (0.506117 * body.Height + 4.087 * body.Fat_Per + 44.4065) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.506117 * body.Height + 4.087 * body.Fat_Per + 44.4065) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0840023 * body.Height + 0.506437 * body.Fat_Per + 28.7329
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.129561 * body.Height + 1.22165 * body.Fat_Per + 189.808
      );
      body.Back_Length = Math.floor(
        0.332389 * body.Height + 0.268632 * body.Fat_Per + 175.523
      );
      body.Chest_Round_Length = Math.floor(
        0.476113 * body.Height + 3.24563 * body.Fat_Per + 134.028
      );
      body.Waist_Round_Length = Math.floor(
        0.495368 * body.Height + 4.07431 * body.Fat_Per + 15.9052
      );
      body.Hip_Round_Length = Math.floor(
        0.494516 * body.Height + 3.14881 * body.Fat_Per + 74.6025
      );
      body.Should_Width = Math.floor(
        0.217364 * body.Height + 0.742961 * body.Fat_Per + 74.9844
      );
      body.Arm_Length = Math.floor(
        0.349773 * body.Height - 0.0249748 * body.Fat_Per + 10.1562
      );
      body.Arm_Round_Length = Math.floor(
        0.139533 * body.Height + 1.36107 * body.Fat_Per + 63.4694
      );
      body.forearm_Round_Length = Math.floor(
        0.099208 * body.Height + 0.9090215 * body.Fat_Per + 67.1104
      );
      body.thigh_Round_Length = Math.floor(
        (0.494516 * body.Height + 3.14881 * body.Fat_Per + 74.6025) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.494516 * body.Height + 3.14881 * body.Fat_Per + 74.6025) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.058883 * body.Height + 0.456973 * body.Fat_Per + 70.7514
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0772784 * body.Height + 1.36022 * body.Fat_Per + 273.786
      );
      body.Back_Length = Math.floor(
        0.478706 * body.Height + 0.722136 * body.Fat_Per - 80.12
      );
      body.Chest_Round_Length = Math.floor(
        0.552724 * body.Height + 4.11639 * body.Fat_Per - 27.8049
      );
      body.Waist_Round_Length = Math.floor(
        0.607578 * body.Height + 4.73805 * body.Fat_Per - 202.714
      );
      body.Hip_Round_Length = Math.floor(
        0.463287 * body.Height + 3.7414 * body.Fat_Per + 112.398
      );
      body.Should_Width = Math.floor(
        0.228546 * body.Height + 1.02399 * body.Fat_Per + 47.8876
      );
      body.Arm_Length = Math.floor(
        0.300728 * body.Height - 0.284736 * body.Fat_Per + 98.1768
      );
      body.Arm_Round_Length = Math.floor(
        0.132962 * body.Height + 1.87621 * body.Fat_Per + 64.1054
      );
      body.forearm_Round_Length = Math.floor(
        0.0957069 * body.Height + 1.119138 * body.Fat_Per + 69.82565
      );
      body.thigh_Round_Length = Math.floor(
        (0.463287 * body.Height + 3.7414 * body.Fat_Per + 112.398) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.463287 * body.Height + 3.7414 * body.Fat_Per + 112.398) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0584518 * body.Height + 0.362066 * body.Fat_Per + 75.5459
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.130977 * body.Height + 1.48283 * body.Fat_Per + 173.871
      );
      body.Back_Length = Math.floor(
        0.380696 * body.Height + 0.782664 * body.Fat_Per + 78.7926
      );
      body.Chest_Round_Length = Math.floor(
        0.536149 * body.Height + 4.39356 * body.Fat_Per - 8.06065
      );
      body.Waist_Round_Length = Math.floor(
        0.445018 * body.Height + 5.29771 * body.Fat_Per + 43.4472
      );
      body.Hip_Round_Length = Math.floor(
        0.48251 * body.Height + 3.6096 * body.Fat_Per + 87.0761
      );
      body.Should_Width = Math.floor(
        0.199661 * body.Height + 0.846364 * body.Fat_Per + 99.7708
      );
      body.Arm_Length = Math.floor(
        0.361977 * body.Height - 0.185965 * body.Fat_Per - 14.4815
      );
      body.Arm_Round_Length = Math.floor(
        0.148083 * body.Height + 1.67498 * body.Fat_Per + 48.4982
      );
      body.forearm_Round_Length = Math.floor(
        0.10387695 * body.Height + 1.03802 * body.Fat_Per + 58.84345
      );
      body.thigh_Round_Length = Math.floor(
        (0.43721 * body.Height + 2.98206 * body.Fat_Per + 156.257) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.43721 * body.Height + 2.98206 * body.Fat_Per + 156.257) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0596709 * body.Height + 0.40106 * body.Fat_Per + 69.1887
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.204395 * body.Height + 1.20209 * body.Fat_Per + 52.0726
      );
      body.Back_Length = Math.floor(
        0.137015 * body.Height + 1.73752 * body.Fat_Per + 505.23
      );
      body.Chest_Round_Length = Math.floor(
        0.922821 * body.Height + 4.03753 * body.Fat_Per - 647.781
      );
      body.Waist_Round_Length = Math.floor(
        0.729693 * body.Height + 5.07195 * body.Fat_Per - 418.895
      );
      body.Hip_Round_Length = Math.floor(
        0.551727 * body.Height + 3.97026 * body.Fat_Per - 25.9899
      );
      body.Should_Width = Math.floor(
        0.341399 * body.Height + 1.13425 * body.Fat_Per - 137.678
      );
      body.Arm_Length = Math.floor(
        0.191329 * body.Height + 0.871556 * body.Fat_Per + 280.225
      );
      body.Arm_Round_Length = Math.floor(
        0.270604 * body.Height + 1.86738 * body.Fat_Per - 151.964
      );
      body.forearm_Round_Length = Math.floor(
        0.13575314 * body.Height + 0.995365 * body.Fat_Per + 10.7555
      );
      body.thigh_Round_Length = Math.floor(
        (0.551727 * body.Height + 3.97026 * body.Fat_Per - 25.9899) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.551727 * body.Height + 3.97026 * body.Fat_Per - 25.9899) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.00090228 * body.Height + 0.12335 * body.Fat_Per + 173.475
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.117614 * body.Height + 1.39865 * body.Fat_Per + 197.899
      );
      body.Back_Length = Math.floor(
        0.4961 * body.Height + 0.879544 * body.Fat_Per - 125.889
      );
      body.Chest_Round_Length = Math.floor(
        0.300539 * body.Height + 3.88341 * body.Fat_Per + 396.106
      );
      body.Waist_Round_Length = Math.floor(
        0.253287 * body.Height + 3.92266 * body.Fat_Per + 403.959
      );
      body.Hip_Round_Length = Math.floor(
        0.487642 * body.Height + 4.1411 * body.Fat_Per + 74.5671
      );
      body.Should_Width = Math.floor(
        0.128875 * body.Height + 0.861422 * body.Fat_Per + 218.577
      );
      body.Arm_Length = Math.floor(
        0.43579 * body.Height + 0.111561 * body.Fat_Per - 148.308
      );
      body.Arm_Round_Length = Math.floor(
        0.0787223 * body.Height + 2.01159 * body.Fat_Per + 156.497
      );
      body.forearm_Round_Length = Math.floor(
        0.07637315 * body.Height + 1.2325475 * body.Fat_Per + 99.65485
      );
      body.thigh_Round_Length = Math.floor(
        (0.487642 * body.Height + 4.1411 * body.Fat_Per + 74.5671) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.487642 * body.Height + 4.1411 * body.Fat_Per + 74.5671) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.074024 * body.Height + 0.453505 * body.Fat_Per + 42.8127
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.112026 * body.Height + 1.39247 * body.Fat_Per + 210.461
      );
      body.Back_Length = Math.floor(
        0.35797 * body.Height + 0.876323 * body.Fat_Per + 114.908
      );
      body.Chest_Round_Length = Math.floor(
        0.374103 * body.Height + 4.34859 * body.Fat_Per + 277.437
      );
      body.Waist_Round_Length = Math.floor(
        0.340249 * body.Height + 4.77853 * body.Fat_Per + 258.387
      );
      body.Hip_Round_Length = Math.floor(
        0.425714 * body.Height + 3.51072 * body.Fat_Per + 187.905
      );
      body.Should_Width = Math.floor(
        0.212379 * body.Height + 0.795659 * body.Fat_Per + 82.5781
      );
      body.Arm_Length = Math.floor(
        0.381503 * body.Height + 0.157123 * body.Fat_Per - 50.1959
      );
      body.Arm_Round_Length = Math.floor(
        0.161386 * body.Height + 1.25274 * body.Fat_Per + 28.6871
      );
      body.forearm_Round_Length = Math.floor(
        0.1136445 * body.Height + 0.801438 * body.Fat_Per + 45.2696
      );
      body.thigh_Round_Length = Math.floor(
        (0.425714 * body.Height + 3.51072 * body.Fat_Per + 187.905) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.425714 * body.Height + 3.51072 * body.Fat_Per + 187.905) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.065903 * body.Height + 0.350136 * body.Fat_Per + 61.8521
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0324795 * body.Height + 1.38223 * body.Fat_Per + 350.065
      );
      body.Back_Length = Math.floor(
        0.380909 * body.Height + 0.965523 * body.Fat_Per + 73.6949
      );
      body.Chest_Round_Length = Math.floor(
        0.303663 * body.Height + 4.31339 * body.Fat_Per + 404.304
      );
      body.Waist_Round_Length = Math.floor(
        0.459483 * body.Height + 5.22391 * body.Fat_Per + 45.4572
      );
      body.Hip_Round_Length = Math.floor(
        0.316087 * body.Height + 3.69325 * body.Fat_Per + 372.76
      );
      body.Should_Width = Math.floor(
        0.0691143 * body.Height + 0.925301 * body.Fat_Per + 323.455
      );
      body.Arm_Length = Math.floor(
        0.504635 * body.Height + 0.349213 * body.Fat_Per - 268.42
      );
      body.Arm_Round_Length = Math.floor(
        0.099202 * body.Height + 1.39821 * body.Fat_Per + 138.185
      );
      body.forearm_Round_Length = Math.floor(
        0.101508 * body.Height + 0.8693465 * body.Fat_Per + 69.2002315
      );
      body.thigh_Round_Length = Math.floor(
        (0.316087 * body.Height + 3.69325 * body.Fat_Per + 372.76) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.316087 * body.Height + 3.69325 * body.Fat_Per + 372.76) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.103814 * body.Height + 0.340483 * body.Fat_Per + 0.215463
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 5
    ) {
      body.Neck_Round_Length = Math.floor(
        -0.175137 * body.Height + 1.72171 * body.Fat_Per + 694.973
      );
      body.Back_Length = Math.floor(
        0.293192 * body.Height + 1.07893 * body.Fat_Per + 217.725
      );
      body.Chest_Round_Length = Math.floor(
        0.568546 * body.Height + 3.71015 * body.Fat_Per - 34.9092
      );
      body.Waist_Round_Length = Math.floor(
        0.310238 * body.Height + 4.24412 * body.Fat_Per + 340.951
      );
      body.Hip_Round_Length = Math.floor(
        0.330337 * body.Height + 3.26113 * body.Fat_Per + 365.444
      );
      body.Should_Width = Math.floor(
        0.136679 * body.Height + 0.98439 * body.Fat_Per + 203.037
      );
      body.Arm_Length = Math.floor(
        0.348826 * body.Height + 0.503614 * body.Fat_Per - 2.66759
      );
      body.Arm_Round_Length = Math.floor(
        0.229537 * body.Height + 1.16665 * body.Fat_Per - 78.7417
      );
      body.forearm_Round_Length = Math.floor(
        0.15795525 * body.Height + 0.80273 * body.Fat_Per - 27.9666
      );
      body.thigh_Round_Length = Math.floor(
        (0.330337 * body.Height + 3.26113 * body.Fat_Per + 365.444) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.330337 * body.Height + 3.26113 * body.Fat_Per + 365.444) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0863735 * body.Height + 0.43881 * body.Fat_Per + 22.8085
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 3 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.306273 * body.Height + 1.04618 * body.Fat_Per - 112.642
      );
      body.Back_Length = Math.floor(
        0.488373 * body.Height + 0.678575 * body.Fat_Per - 107.396
      );
      body.Chest_Round_Length = Math.floor(
        0.412489 * body.Height + 3.38348 * body.Fat_Per + 256.327
      );
      body.Waist_Round_Length = Math.floor(
        0.821129 * body.Height + 4.20254 * body.Fat_Per - 555.318
      );
      body.Hip_Round_Length = Math.floor(
        0.357765 * body.Height + 4.50695 * body.Fat_Per + 296.347
      );
      body.Should_Width = Math.floor(
        0.16923 * body.Height + 1.13844 * body.Fat_Per + 152.092
      );
      body.Arm_Length = Math.floor(
        0.380263 * body.Height - 0.304528 * body.Fat_Per - 42.402
      );
      body.Arm_Round_Length = Math.floor(
        0.0796395 * body.Height + 1.27657 * body.Fat_Per + 176.812
      );
      body.forearm_Round_Length = Math.floor(
        0.15795525 * body.Height + 0.814763 * body.Fat_Per + 140.4165
      );
      body.thigh_Round_Length = Math.floor(
        (0.357765 * body.Height + 4.50695 * body.Fat_Per + 296.347) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.357765 * body.Height + 4.50695 * body.Fat_Per + 296.347) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0413053 * body.Height + 0.352956 * body.Fat_Per + 104.021
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 0 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0459908 * body.Height + 1.53062 * body.Fat_Per + 315.344
      );
      body.Back_Length = Math.floor(
        0.43913 * body.Height + 0.694812 * body.Fat_Per - 21.8727
      );
      body.Chest_Round_Length = Math.floor(
        0.311607 * body.Height + 3.94434 * body.Fat_Per + 378.773
      );
      body.Waist_Round_Length = Math.floor(
        0.195867 * body.Height + 4.85765 * body.Fat_Per + 474.336
      );
      body.Hip_Round_Length = Math.floor(
        0.334297 * body.Height + 3.02 * body.Fat_Per + 343.719
      );
      body.Should_Width = Math.floor(
        0.168364 * body.Height + 0.797924 * body.Fat_Per + 154.751
      );
      body.Arm_Length = Math.floor(
        0.363916 * body.Height - 0.0446985 * body.Fat_Per - 16.9638
      );
      body.Arm_Round_Length = Math.floor(
        0.129183 * body.Height + 1.50883 * body.Fat_Per + 79.6241
      );
      body.forearm_Round_Length = Math.floor(
        0.0903766 * body.Height + 1.0544675 * body.Fat_Per + 79.59445
      );
      body.thigh_Round_Length = Math.floor(
        (0.334297 * body.Height + 3.02 * body.Fat_Per + 343.719) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.334297 * body.Height + 3.02 * body.Fat_Per + 343.719) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0515702 * body.Height + 0.600105 * body.Fat_Per + 79.5648
      );
      return true;
    } else if (
      body.Left_Should_Type == 1 &&
      body.Right_Should_Type == 0 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0465378 * body.Height + 0.294211 * body.Fat_Per + 348.735
      );
      body.Back_Length = Math.floor(
        0.249915 * body.Height - 0.546475 * body.Fat_Per + 334.934
      );
      body.Chest_Round_Length = Math.floor(
        0.485409 * body.Height + 4.37214 * body.Fat_Per + 88.6365
      );
      body.Waist_Round_Length = Math.floor(
        0.269805 * body.Height + 4.66806 * body.Fat_Per + 377.566
      );
      body.Hip_Round_Length = Math.floor(
        0.564206 * body.Height + 4.76974 * body.Fat_Per - 80.2205
      );
      body.Should_Width = Math.floor(
        0.127659 * body.Height + 0.923912 * body.Fat_Per + 221.908
      );
      body.Arm_Length = Math.floor(
        0.400629 * body.Height - 0.570523 * body.Fat_Per - 67.0614
      );
      body.Arm_Round_Length = Math.floor(
        0.0262626 * body.Height + 1.45573 * body.Fat_Per + 253.026
      );
      body.forearm_Round_Length = Math.floor(
        0.0534456 * body.Height + 1.0623015 * body.Fat_Per + 141.2146
      );
      body.thigh_Round_Length = Math.floor(
        (0.564206 * body.Height + 4.76974 * body.Fat_Per - 80.2205) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.564206 * body.Height + 4.76974 * body.Fat_Per - 80.2205) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0806286 * body.Height + 0.668873 * body.Fat_Per + 29.4032
      );
      return true;
    } else if (
      body.Left_Should_Type == 0 &&
      body.Right_Should_Type == 1 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.024842 * body.Height + 1.24897 * body.Fat_Per + 355.693
      );
      body.Back_Length = Math.floor(
        0.324418 * body.Height + 0.588956 * body.Fat_Per + 172.313
      );
      body.Chest_Round_Length = Math.floor(
        0.183458 * body.Height + 3.6518 * body.Fat_Per + 589.786
      );
      body.Waist_Round_Length = Math.floor(
        0.194868 * body.Height + 4.03507 * body.Fat_Per + 479.687
      );
      body.Hip_Round_Length = Math.floor(
        0.184213 * body.Height + 2.91904 * body.Fat_Per + 587.661
      );
      body.Should_Width = Math.floor(
        -0.00286793 * body.Height + 0.416922 * body.Fat_Per + 443.751
      );
      body.Arm_Length = Math.floor(
        0.338784 * body.Height - 0.107178 * body.Fat_Per + 21.6533
      );
      body.Arm_Round_Length = Math.floor(
        -0.101336 * body.Height + 1.49256 * body.Fat_Per + 466.883
      );
      body.forearm_Round_Length = Math.floor(
        -0.0358907 * body.Height + 0.9078885 * body.Fat_Per + 293.998
      );
      body.thigh_Round_Length = Math.floor(
        (0.184213 * body.Height + 2.91904 * body.Fat_Per + 587.661) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.184213 * body.Height + 2.91904 * body.Fat_Per + 587.661) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0295546 * body.Height + 0.323217 * body.Fat_Per + 121.113
      );
      return true;
    } else if (
      body.Left_Should_Type == 0 &&
      body.Right_Should_Type == 0 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.127016 * body.Height + 0.89482 * body.Fat_Per + 186.49
      );
      body.Back_Length = Math.floor(
        0.47034 * body.Height + 0.605901 * body.Fat_Per - 73.0308
      );
      body.Chest_Round_Length = Math.floor(
        0.489083 * body.Height + 5.11379 * body.Fat_Per + 65.1692
      );
      body.Waist_Round_Length = Math.floor(
        0.440788 * body.Height + 5.07388 * body.Fat_Per + 52.4035
      );
      body.Hip_Round_Length = Math.floor(
        0.529662 * body.Height + 4.06964 * body.Fat_Per + 8.72208
      );
      body.Should_Width = Math.floor(
        0.21486 * body.Height + 1.12625 * body.Fat_Per + 75.5366
      );
      body.Arm_Length = Math.floor(
        0.377666 * body.Height + 0.123302 * body.Fat_Per - 41.7147
      );
      body.Arm_Round_Length = Math.floor(
        0.165471 * body.Height + 2.13954 * body.Fat_Per + 14.4321
      );
      body.forearm_Round_Length = Math.floor(
        0.1128607 * body.Height + 1.185103 * body.Fat_Per + 41.96695
      );
      body.thigh_Round_Length = Math.floor(
        (0.529662 * body.Height + 4.06964 * body.Fat_Per + 8.722087) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.529662 * body.Height + 4.06964 * body.Fat_Per + 8.72208) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0602504 * body.Height + 0.230666 * body.Fat_Per + 69.5018
      );
      return true;
    } else if (
      body.Left_Should_Type == 0 &&
      body.Right_Should_Type == 0 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0442583 * body.Height + 1.47574 * body.Fat_Per + 324.193
      );
      body.Back_Length = Math.floor(
        0.40815 * body.Height + 0.615562 * body.Fat_Per + 47.9781
      );
      body.Chest_Round_Length = Math.floor(
        0.590635 * body.Height + 3.64802 * body.Fat_Per - 75.4052
      );
      body.Waist_Round_Length = Math.floor(
        0.56856 * body.Height + 4.59554 * body.Fat_Per - 128.67
      );
      body.Hip_Round_Length = Math.floor(
        0.415181 * body.Height + 3.72903 * body.Fat_Per + 197.429
      );
      body.Should_Width = Math.floor(
        0.171844 * body.Height + 0.863378 * body.Fat_Per + 147.574
      );
      body.Arm_Length = Math.floor(
        0.417382 * body.Height - 0.0376421 * body.Fat_Per - 109.701
      );
      body.Arm_Round_Length = Math.floor(
        0.160594 * body.Height + 1.37117 * body.Fat_Per + 28.7708
      );
      body.forearm_Round_Length = Math.floor(
        0.08231985 * body.Height + 1.0174625 * body.Fat_Per + 94.6649
      );
      body.thigh_Round_Length = Math.floor(
        (0.415181 * body.Height + 3.72903 * body.Fat_Per + 197.429) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.415181 * body.Height + 3.72903 * body.Fat_Per + 197.429) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0040457 * body.Height + 0.663755 * body.Fat_Per + 160.559
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.126962 * body.Height + 1.15896 * body.Fat_Per + 183.013
      );
      body.Back_Length = Math.floor(
        0.478125 * body.Height + 0.606634 * body.Fat_Per - 85.1567
      );
      body.Chest_Round_Length = Math.floor(
        0.404858 * body.Height + 4.22139 * body.Fat_Per + 233.316
      );
      body.Waist_Round_Length = Math.floor(
        0.427464 * body.Height + 4.77756 * body.Fat_Per + 97.9905
      );
      body.Hip_Round_Length = Math.floor(
        0.37368 * body.Height + 3.44455 * body.Fat_Per + 277.617
      );
      body.Should_Width = Math.floor(
        0.189351 * body.Height + 1.04642 * body.Fat_Per + 113.4
      );
      body.Arm_Length = Math.floor(
        0.417202 * body.Height + 0.239653 * body.Fat_Per - 111.382
      );
      body.Arm_Round_Length = Math.floor(
        0.140641 * body.Height + 1.32538 * body.Fat_Per + 55.6631
      );
      body.forearm_Round_Length = Math.floor(
        0.1006359 * body.Height + 0.8419915 * body.Fat_Per + 62.3439
      );
      body.thigh_Round_Length = Math.floor(
        (0.37368 * body.Height + 3.44455 * body.Fat_Per + 277.617) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.37368 * body.Height + 3.44455 * body.Fat_Per + 277.617) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0606308 * body.Height + 0.358603 * body.Fat_Per + 69.0247
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 2
    ) {
      body.Neck_Round_Length = Math.floor(
        0.079783 * body.Height + 1.017 * body.Fat_Per + 266.407
      );
      body.Back_Length = Math.floor(
        0.389416 * body.Height + 0.60331 * body.Fat_Per + 75.8236
      );
      body.Chest_Round_Length = Math.floor(
        0.364202 * body.Height + 4.44108 * body.Fat_Per + 297.949
      );
      body.Waist_Round_Length = Math.floor(
        0.45858 * body.Height + 4.30069 * body.Fat_Per + 20.9545
      );
      body.Hip_Round_Length = Math.floor(
        0.427633 * body.Height + 3.47997 * body.Fat_Per + 184.737
      );
      body.Should_Width = Math.floor(
        0.194262 * body.Height + 0.764576 * body.Fat_Per + 104.88
      );
      body.Arm_Length = Math.floor(
        0.373266 * body.Height + 0.0236529 * body.Fat_Per - 30.3986
      );
      body.Arm_Round_Length = Math.floor(
        -0.00295114 * body.Height + 1.77149 * body.Fat_Per + 309.28
      );
      body.forearm_Round_Length = Math.floor(
        0.04983143 * body.Height + 1.042698 * body.Fat_Per + 152.74982
      );
      body.thigh_Round_Length = Math.floor(
        (0.427633 * body.Height + 3.47997 * body.Fat_Per + 184.737) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.427633 * body.Height + 3.47997 * body.Fat_Per + 184.737) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.102614 * body.Height + 0.313906 * body.Fat_Per - 3.78036
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 1 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.173246 * body.Height + 1.18181 * body.Fat_Per + 100.203
      );
      body.Back_Length = Math.floor(
        0.504221 * body.Height + 1.16339 * body.Fat_Per - 137.428
      );
      body.Chest_Round_Length = Math.floor(
        0.541786 * body.Height + 4.86849 * body.Fat_Per - 25.0756
      );
      body.Waist_Round_Length = Math.floor(
        0.639156 * body.Height + 6.07522 * body.Fat_Per - 289.795
      );
      body.Hip_Round_Length = Math.floor(
        0.441384 * body.Height + 4.13696 * body.Fat_Per + 148.272
      );
      body.Should_Width = Math.floor(
        0.208381 * body.Height + 0.826838 * body.Fat_Per + 86.4343
      );
      body.Arm_Length = Math.floor(
        0.265568 * body.Height + 0.391874 * body.Fat_Per + 149.305
      );
      body.Arm_Round_Length = Math.floor(
        0.167352 * body.Height + 1.57643 * body.Fat_Per + 5.97199
      );
      body.forearm_Round_Length = Math.floor(
        0.1137643 * body.Height + 1.0060725 * body.Fat_Per + 37.689095
      );
      body.thigh_Round_Length = Math.floor(
        (0.441384 * body.Height + 4.13696 * body.Fat_Per + 148.272) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.441384 * body.Height + 4.13696 * body.Fat_Per + 148.272) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0601766 * body.Height + 0.435715 * body.Fat_Per + 69.4062
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.132573 * body.Height + 1.1849 * body.Fat_Per + 175.325
      );
      body.Back_Length = Math.floor(
        0.404719 * body.Height + 0.822184 * body.Fat_Per + 37.0473
      );
      body.Chest_Round_Length = Math.floor(
        0.596593 * body.Height + 4.4454 * body.Fat_Per - 100.853
      );
      body.Waist_Round_Length = Math.floor(
        0.65197 * body.Height + 5.41052 * body.Fat_Per - 287.082
      );
      body.Hip_Round_Length = Math.floor(
        0.563194 * body.Height + 4.30788 * body.Fat_Per - 66.4124
      );
      body.Should_Width = Math.floor(
        0.162356 * body.Height + 0.889239 * body.Fat_Per + 159.694
      );
      body.Arm_Length = Math.floor(
        0.394748 * body.Height + 0.135259 * body.Fat_Per - 73.0589
      );
      body.Arm_Round_Length = Math.floor(
        0.0923465 * body.Height + 1.68777 * body.Fat_Per + 135.347
      );
      body.forearm_Round_Length = Math.floor(
        0.0865181 * body.Height + 1.0495385 * body.Fat_Per + 85.7555
      );
      body.thigh_Round_Length = Math.floor(
        (0.563194 * body.Height + 4.30788 * body.Fat_Per - 66.4124) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.563194 * body.Height + 4.30788 * body.Fat_Per - 66.4124) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0806897 * body.Height + 0.411307 * body.Fat_Per + 36.164
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 3 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 4
    ) {
      body.Neck_Round_Length = Math.floor(
        0.0964883 * body.Height + 1.23954 * body.Fat_Per + 236.469
      );
      body.Back_Length = Math.floor(
        0.59737 * body.Height + 0.0963762 * body.Fat_Per - 283.417
      );
      body.Chest_Round_Length = Math.floor(
        0.365777 * body.Height + 4.34763 * body.Fat_Per + 310.956
      );
      body.Waist_Round_Length = Math.floor(
        0.533573 * body.Height + 5.16774 * body.Fat_Per - 63.516
      );
      body.Hip_Round_Length = Math.floor(
        0.402654 * body.Height + 3.45597 * body.Fat_Per + 234.28
      );
      body.Should_Width = Math.floor(
        0.178711 * body.Height + 0.892641 * body.Fat_Per + 133.458
      );
      body.Arm_Length = Math.floor(
        0.397736 * body.Height + 0.07744 * body.Fat_Per - 78.3035
      );
      body.Arm_Round_Length = Math.floor(
        0.191191 * body.Height + 1.44471 * body.Fat_Per - 30.8154
      );
      body.forearm_Round_Length = Math.floor(
        0.1251838 * body.Height + 0.9060585 * body.Fat_Per + 21.77815
      );
      body.thigh_Round_Length = Math.floor(
        (0.402654 * body.Height + 3.45597 * body.Fat_Per + 234.28) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.402654 * body.Height + 3.45597 * body.Fat_Per + 234.28) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0591766 * body.Height + 0.367407 * body.Fat_Per + 74.3717
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.163461 * body.Height + 1.28526 * body.Fat_Per + 118.938
      );
      body.Back_Length = Math.floor(
        0.421773 * body.Height + 0.790326 * body.Fat_Per + 17.2972
      );
      body.Chest_Round_Length = Math.floor(
        0.4911 * body.Height + 4.39663 * body.Fat_Per + 82.1133
      );
      body.Waist_Round_Length = Math.floor(
        0.306382 * body.Height + 5.44058 * body.Fat_Per + 303.539
      );
      body.Hip_Round_Length = Math.floor(
        0.373015 * body.Height + 4.17184 * body.Fat_Per + 280.485
      );
      body.Should_Width = Math.floor(
        0.17551 * body.Height + 0.819986 * body.Fat_Per + 140.599
      );
      body.Arm_Length = Math.floor(
        0.380802 * body.Height + 0.301843 * body.Fat_Per - 49.8575
      );
      body.Arm_Round_Length = Math.floor(
        0.142401 * body.Height + 1.79715 * body.Fat_Per + 53.815
      );
      body.forearm_Round_Length = Math.floor(
        0.10550315 * body.Height + 1.114292 * body.Fat_Per + 54.0574
      );
      body.thigh_Round_Length = Math.floor(
        (0.373015 * body.Height + 4.17184 * body.Fat_Per + 280.485) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.373015 * body.Height + 4.17184 * body.Fat_Per + 280.485) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0686053 * body.Height + 0.431434 * body.Fat_Per + 54.2998
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 2 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.2456 * body.Height + 1.64313 * body.Fat_Per - 31.3437
      );
      body.Back_Length = Math.floor(
        0.501161 * body.Height + 0.767052 * body.Fat_Per - 127.056
      );
      body.Chest_Round_Length = Math.floor(
        0.922273 * body.Height + 5.18351 * body.Fat_Per - 696.349
      );
      body.Waist_Round_Length = Math.floor(
        0.83694 * body.Height + 5.76476 * body.Fat_Per - 624.432
      );
      body.Hip_Round_Length = Math.floor(
        0.803664 * body.Height + 3.89705 * body.Fat_Per - 467.098
      );
      body.Should_Width = Math.floor(
        0.241213 * body.Height + 0.865162 * body.Fat_Per + 24.6029
      );
      body.Arm_Length = Math.floor(
        -0.076582 * body.Height + 0.692677 * body.Fat_Per + 703.006
      );
      body.Arm_Round_Length = Math.floor(
        0.248312 * body.Height + 1.81428 * body.Fat_Per - 137.641
      );
      body.forearm_Round_Length = Math.floor(
        0.1744635 * body.Height + 1.1848845 * body.Fat_Per - 70.951565
      );
      body.thigh_Round_Length = Math.floor(
        (0.803664 * body.Height + 3.89705 * body.Fat_Per - 467.098) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.803664 * body.Height + 3.89705 * body.Fat_Per - 467.098) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.100615 * body.Height + 0.555489 * body.Fat_Per - 4.26213
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 4 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 0 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.144213 * body.Height + 1.39402 * body.Fat_Per + 146.995
      );
      body.Back_Length = Math.floor(
        0.485525 * body.Height + 0.89116 * body.Fat_Per - 103.119
      );
      body.Chest_Round_Length = Math.floor(
        0.457285 * body.Height + 4.13642 * body.Fat_Per + 130.412
      );
      body.Waist_Round_Length = Math.floor(
        0.426891 * body.Height + 4.68534 * body.Fat_Per + 81.5535
      );
      body.Hip_Round_Length = Math.floor(
        0.395692 * body.Height + 3.1459 * body.Fat_Per + 236.643
      );
      body.Should_Width = Math.floor(
        0.168601 * body.Height + 0.856264 * body.Fat_Per + 147.393
      );
      body.Arm_Length = Math.floor(
        0.413138 * body.Height + 0.159773 * body.Fat_Per - 102.767
      );
      body.Arm_Round_Length = Math.floor(
        0.149454 * body.Height + 1.48255 * body.Fat_Per + 35.6734
      );
      body.forearm_Round_Length = Math.floor(
        0.1063712 * body.Height + 0.9654095 * body.Fat_Per + 49.60805
      );
      body.thigh_Round_Length = Math.floor(
        (0.395692 * body.Height + 3.1459 * body.Fat_Per + 236.643) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.395692 * body.Height + 3.1459 * body.Fat_Per + 236.643) / 2 / 2
      );
      body.Wrist_Round_Length = Math.floor(
        0.0632884 * body.Height + 0.448269 * body.Fat_Per + 63.5427
      );
      return true;
    } else if (
      body.Left_Should_Type == 4 &&
      body.Right_Should_Type == 4 &&
      body.Hip_Type == 2 &&
      body.Belly_Type == 2 &&
      body.Back_Type == 3
    ) {
      body.Neck_Round_Length = Math.floor(
        0.122432 * body.Height + 0.828099 * body.Fat_Per + 202.281
      );
      body.Back_Length = Math.floor(
        0.410899 * body.Height + 0.807404 * body.Fat_Per + 24.2527
      );
      body.Chest_Round_Length = Math.floor(
        0.364955 * body.Height + 3.08825 * body.Fat_Per + 335.302
      );
      body.Waist_Round_Length = Math.floor(
        0.262005 * body.Height + 3.62655 * body.Fat_Per + 433.074
      );
      body.Hip_Round_Length = Math.floor(
        0.514264 * body.Height + 2.8053 * body.Fat_Per + 51.84
      );
      body.Should_Width = Math.floor(
        0.216388 * body.Height + 0.549739 * body.Fat_Per + 76.8933
      );
      body.Arm_Length = Math.floor(
        0.376865 * body.Height + 0.0688897 * body.Fat_Per - 40.3757
      );
      body.Arm_Round_Length = Math.floor(
        0.214214 * body.Height + 1.20792 * body.Fat_Per - 57.8564
      );
      body.forearm_Round_Length = Math.floor(
        0.14901765 * body.Height + 0.7438275 * body.Fat_Per - 12.40025
      );
      body.thigh_Round_Length = Math.floor(
        (0.514264 * body.Height + 2.8053 * body.Fat_Per + 51.84) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.514264 * body.Height + 2.8053 * body.Fat_Per + 51.84) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0838213 * body.Height + 0.279735 * body.Fat_Per + 33.0559
      );
      return true;
    } else {
      body.Neck_Round_Length = Math.floor(
        0.130897 * body.Height + 1.17581 * body.Fat_Per + 178.15
      );
      body.Back_Length = Math.floor(
        0.433686 * body.Height + 0.564734 * body.Fat_Per - 7.50687
      );
      body.Chest_Round_Length = Math.floor(
        0.444565 * body.Height + 3.90492 * body.Fat_Per + 165.923
      );
      body.Waist_Round_Length = Math.floor(
        0.416766 * body.Height + 4.67668 * body.Fat_Per + 122.083
      );
      body.Hip_Round_Length = Math.floor(
        0.468548 * body.Height + 3.41701 * body.Fat_Per + 114.207
      );
      body.Should_Width = Math.floor(
        0.170367 * body.Height + 0.833915 * body.Fat_Per + 149.346
      );
      body.Arm_Length = Math.floor(
        0.370639 * body.Height + 0.0315181 * body.Fat_Per - 30.398
      );
      body.Arm_Round_Length = Math.floor(
        0.119725 * body.Height + 1.40742 * body.Fat_Per + 94.8278
      );
      body.forearm_Round_Length = Math.floor(
        0.0904877 * body.Height + 0.8871485 * body.Fat_Per + 81.79705
      );
      body.thigh_Round_Length = Math.floor(
        (0.468548 * body.Height + 3.41701 * body.Fat_Per + 114.207) / 2
      );
      body.calf_Round_Length = Math.floor(
        (0.468548 * body.Height + 3.41701 * body.Fat_Per + 114.207) / 2 / 1.5
      );
      body.Wrist_Round_Length = Math.floor(
        0.0612504 * body.Height + 0.366877 * body.Fat_Per + 68.7663
      );
    }
    return false;
  }
}
