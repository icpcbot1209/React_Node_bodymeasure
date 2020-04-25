const MIN_NECK_WIDTH = 10
const MAX_NECK_WIDTH = 60
const MIN_BODY_WIDTH = 60
const MAX_BODY_WIDTH = 120

import { Rough_Edge, STATE_NODETECTED, ROUGH_EDGE_GAP, POLY_PUR_MASK_SIZE } from "./Rough_Edge";
import { Point_2D } from './DEF';

export class Front_Rough_Edge extends Rough_Edge {
    constructor(){
        super();
    }

    // void Front_Rough_Edge::Init( Body_Params* _pBody)
    Init(_pBody){
        this.pBody = _pBody;
        this.Last_State = STATE_NODETECTED;
        this.Make_Initial_Front_Rough_Edge();
    }

    // bool Front_Rough_Edge::Make_Initial_Front_Rough_Edge()
    Make_Initial_Front_Rough_Edge(){
        this.Load_Sample_Edge_and_Direction();
        this.Edge_Fat_Per = Math.round(100 + (455*(0.18 + 0.00054 * this.pBody.Fat_Per) - (this.Demo_Edge.Points[8].x - this.Demo_Edge.Points[13].x)) * 100 / (this.Move_Direction[8].x - this.Move_Direction[13].x));

        if(!this.pBody.Is_Male){
            this.Demo_Edge.Points[8].x += 10;
            this.Demo_Edge.Points[9].x += 10;
            this.Demo_Edge.Points[10].x += 10;
    
            this.Demo_Edge.Points[11].x -= 10;
            this.Demo_Edge.Points[12].x -= 10;
            this.Demo_Edge.Points[13].x -= 10;
        }

        this.Set_Fat(this.Demo_Edge, this.Edge_Fat_Per);
        this.Set_Fat(this.Demo_Edge, -100, this.Correct_Polygon);
        this.Edge_Polygon = this.Demo_Edge;

        return true;
    }

    // void Front_Rough_Edge::Load_Sample_Edge_and_Direction()
    Load_Sample_Edge_and_Direction(){
        let Poly = this.Demo_Edge;
        let Direct = this.Move_Direction;

        Poly.Point_Count = 19;
        Poly.Points[1].x = 192; Poly.Points[1].y = 490; Direct[1].x = 0; Direct[1].y = 0;
        Poly.Points[2].x = 226; Poly.Points[2].y = 447; Direct[2].x = 5; Direct[2].y = 0;
        Poly.Points[3].x = 211; Poly.Points[3].y = 394; Direct[3].x = 5; Direct[3].y = 0;
        Poly.Points[4].x = 234; Poly.Points[4].y = 389; Direct[4].x = 10; Direct[4].y = 0;
        Poly.Points[5].x = 252; Poly.Points[5].y = 335; Direct[5].x = 10; Direct[5].y = 0;
        Poly.Points[6].x = 294; Poly.Points[6].y = 304; Direct[6].x = 10; Direct[6].y = 0;
        Poly.Points[7].x = 310; Poly.Points[7].y = 310; Direct[7].x = 10; Direct[7].y = 0;
        Poly.Points[8].x = 224; Poly.Points[8].y = 301; Direct[8].x = 10; Direct[8].y = 0;
        Poly.Points[9].x = 236; Poly.Points[9].y = 247; Direct[9].x = 10; Direct[9].y = 0;
        Poly.Points[10].x = 236; Poly.Points[10].y = 78; Direct[10].x = 10; Direct[10].y = 0;
        Poly.Points[11].x = 148; Poly.Points[11].y = 78; Direct[11].x = -10; Direct[11].y = 0;
        Poly.Points[12].x = 148; Poly.Points[12].y = 247; Direct[12].x = -10; Direct[12].y = 0;
        Poly.Points[13].x = 160; Poly.Points[13].y = 301; Direct[13].x = -10; Direct[13].y = 0;
        Poly.Points[14].x = 74; Poly.Points[14].y = 310; Direct[14].x = -10; Direct[14].y = 0;
        Poly.Points[15].x = 90; Poly.Points[15].y = 304; Direct[15].x = -10; Direct[15].y = 0;
        Poly.Points[16].x = 132; Poly.Points[16].y = 328; Direct[16].x = -10; Direct[16].y = 0;
        Poly.Points[17].x = 150; Poly.Points[17].y = 389; Direct[17].x = -10; Direct[17].y = 0;
        Poly.Points[18].x = 173; Poly.Points[18].y = 394; Direct[18].x = -5; Direct[18].y = 0;
        Poly.Points[19].x = 158; Poly.Points[19].y = 447; Direct[19].x = -5; Direct[19].y = 0;

        for(let i=1; i<=19; i++){
            Poly.Points[i].y += -10;
        }

        Poly.Quality.fill(0, 0, Poly.Quality.length);
    }

    //////////////////////////////////////////////////////////////////////////
    ///		Detect

    // bool Front_Rough_Edge::Detect_Head( Body_Image* Image, Polygon_2D* Poly )
    Detect_Head(Image, Poly){
        	/// Check Top Head
        if(!this.Detect_Point(Image, Poly, 1, new Point_2D(0,-1), 3, 50, 5)) return false;

        /// Find Right Neck Point
        if(!this.Detect_Point(Image, Poly, 3, new Point_2D(-1,0), 3, 20)) return false;
        
        /// Find Left Neck Point
        if(!this.Detect_Point(Image, Poly, 18, new Point_2D(1,0), 3, 20)) return false;

        /// Check Neck Width
        let neck_width;
        neck_width = this.Correct_Polygon.Points[3].x - this.Correct_Polygon.Points[18].x;
        if(neck_width < MIN_NECK_WIDTH || neck_width > MAX_NECK_WIDTH) return false;

        console.log('head_detected');
        return true;

    }


    // bool Front_Rough_Edge::Detect_Body( Body_Image* Image, Polygon_2D* Poly )
    Detect_Body(Image, Poly){
        /// Check Waist
        if(!this.Detect_Point(Image, Poly, 8, Point_2D(-1,0), 3, 40)) return false;
        if(!this.Detect_Point(Image, Poly, 13, Point_2D(1,0), 3, 40)) return false;

        /// Check Hip
        if(!this.Detect_Point(Image, Poly, 9, Point_2D(-1,0), 3, 30)) return false;
        if(!this.Detect_Point(Image, Poly, 12, Point_2D(1,0), 3, 30)) return false;

        /// Check Body Width
        let body_width;
        body_width = this.Correct_Polygon.Points[9].x - this.Correct_Polygon.Points[12].x;
        if(body_width < MIN_BODY_WIDTH || body_width > MAX_BODY_WIDTH) return false;

        console.log('body_detected');
        return true;
    }

    // bool Front_Rough_Edge::Detect_Human( Body_Image* Image )
    Detect_Human(Image){
        this.pbImage = Image;
        let Poly = this.Edge_Polygon;

        if(!this.Detect_Head(Image, Poly)) return false;
        if(!this.Detect_Body(Image, Poly)) return false;

        return true;
    }
    ///
    //////////////////////////////////////////////////////////////////////////



    //////////////////////////////////////////////////////////////////////////
    ///		Adjust
    // bool Front_Rough_Edge::Adjust_Head( Body_Image* Image, Polygon_2D* Poly )
    Adjust_Head(Image, Poly){
        let dx; 
        let dp = new Point_2D();
        // Adjust 3, 4
        dx = (this.Correct_Polygon.Points[3].x + ROUGH_EDGE_GAP) - Poly.Points[3].x;
        Poly.Points[3].x += dx;

        // Adjust 18, 17
        dx = (this.Correct_Polygon.Points[18].x - ROUGH_EDGE_GAP) - Poly.Points[18].x;
        Poly.Points[18].x += dx;

        // Adjust Top_Head
        Poly.Points[1].x = (Poly.Points[3].x + Poly.Points[18].x)/2;
        
        // Adjust 2, 19
        dx = (Poly.Points[2].x - Poly.Points[19].x)/2;
        Poly.Points[2].x = Poly.Points[1].x + dx;
        Poly.Points[19].x = Poly.Points[1].x - dx;

        return true;
    }

    // bool Front_Rough_Edge::Adjust_Shoulder_Once( Body_Image* Image, Polygon_2D* Poly, int Shoulder_Length, int* omxret, int* omxang, int* omxdst)
    Adjust_Shoulder_Once(Image, Poly, Shoulder_Length, omxret, omxang, omxdst){
        let mxret1 = {value:0}, mxang1 = {value:0}, mxdst1 = {value:0};
        let mxret2 = {value:0}, mxang2 = {value:0}, mxdst2 = {value:0};

        Poly.Points[21] = (Poly.Points[3]*3 + Poly.Points[4]*7)/10;
        Poly.Points[22] = (Poly.Points[18]*3 + Poly.Points[17]*7)/10;
        
        let dang = 10;
        let mxres = {value:0}, nres={value:0}, mxang={value:0}, mxdst={value:0};
        let dp = new Point_2D(), att_dir = new Point_2D();

        att_dir.x = 0; att_dir.y = -1;
        for(let ang = dang/2; ang<45; ang+=dang){
            if(!this.Search_Seg_Angle(Image, Poly, 3, 21, 360-ang-dang/2, 360-ang+dang/2, Shoulder_Length, true, 25, mxret1, mxang1, dp, mxdst1, att_dir)) continue;
            if(!this.Search_Seg_Angle(Image, Poly, 18, 22, 180+ang-dang/2, 180+ang+dang/2, Shoulder_Length, false, 25, mxret2, mxang2, dp, mxdst2, att_dir)) continue;
            nres.value = Math.min(mxret1.value, mxret2.value);
            if(Math.abs(mxdst1.value - mxdst2.value) > 5) nres.value -= (Math.abs(mxdst1.value - mxdst2.value)-5) * 20;
            if(nres.value > mxres.value) {
                mxres.value = nres.value;
                mxang.value = ((360-mxang1.value) + (mxang2.value-180))/2;
                mxdst.value = (mxdst1.value + mxdst2.value) / 2;
            }
        }

        if(mxres.value == 0) return false;

        omxret.value = mxres.value;
        omxang.value = mxang.value;
        omxdst.value = mxdst.value;

        return true;
    }

    // bool Front_Rough_Edge::Adjust_Shoulder( Body_Image* Image, Polygon_2D* Poly )
    Adjust_Shoulder(Image, Poly){
        let res = false;
        let omxret = {value:0}, omxang = {value:0}, omxdst = {value:0};
        let mxang = 0, tw = 0, mxret = 0;

        for(let SLen = 10; SLen <= 25; SLen += 5){
            if(!this.Adjust_Shoulder_Once(Image, Poly, SLen, omxret, omxang, omxdst)) continue;
            res = true;
            mxang = (mxang*tw + omxang.value*omxret.value) / (tw+omxret.value);
	    	mxret = (mxret*tw + omxret.value*omxret.value) / (tw+omxret.value);
    		tw += omxret.value;
        }

        if(!res) return false;

        Poly.Points[4] = Angle_Plus(Poly.Points[3], 360-mxang, Dist(Poly.Points[3], Poly.Points[4]));
        Poly.Points[17] = Angle_Plus(Poly.Points[18], 180+mxang, Dist(Poly.Points[18], Poly.Points[17]));
    
        Poly.Quality[3] = Poly.Quality[4] = Poly.Quality[17] = Poly.Quality[18] = mxret;
    
        return true;

    }

    // bool Front_Rough_Edge::Adjust_Body( Body_Image* Image, Polygon_2D* Poly)
    Adjust_Body(Image, Poly) {
        Poly.Points[8] = this.Correct_Polygon.Points[8]; Poly.Points[9] = this.Correct_Polygon.Points[9];
        Poly.Points[12] = this.Correct_Polygon.Points[12]; Poly.Points[13] = this.Correct_Polygon.Points[13];
    
        return true;
    }
    
    // bool Front_Rough_Edge::Adjust_Human( Body_Image* Image )
    Adjust_Human(Image){
        this.pbImage = Image;
        let Poly = this.Edge_Polygon;

        if(!this.Adjust_Head(Image, Poly)) return false;
        if(!this.Adjust_Shoulder(Image, Poly)) return false;
        if(!this.Adjust_Body(Image, Poly)) return false;

        return true;
    }
    //////////////////////////////////////////////////////////////////////////


    //////////////////////////////////////////////////////////////////////////
    ///		Correct

    // bool Front_Rough_Edge::Correct_Human( Body_Image* Image, Polygon_2D* Good_Poly )
    Correct_Human(Image, Good_Poly) {
        this.pbImage = Image;

        return true;
    }

        
    // bool Front_Rough_Edge::Calc_Body_Params()
    Calc_Body_Params(){

        let Poly = this.Edge_Polygon;

        // 	this.pBody.Neck_Front_Width = this.Correct_Polygon.Points(3).x - this.Correct_Polygon.Points(18).x;
        // 	this.pBody.Shoulder_Width = this.Correct_Polygon.Points(4).x - this.Correct_Polygon.Points(17).x;
        // 	this.pBody.Chest_Front_Width = this.pBody.Shoulder_Width * 8 / 10;
        // 	this.pBody.Waist_Front_Width = this.Correct_Polygon.Points(8).x - this.Correct_Polygon.Points(13).x;
        // 	this.pBody.Hip_Front_Width = this.Correct_Polygon.Points(9).x - this.Correct_Polygon.Points(12).x;
        // 	this.pBody.Belly_Front_Width = (this.pBody.Waist_Front_Width + this.pBody.Hip_Front_Width) / 2;
        // 	this.pBody.Wrist_Width = -1;
        // 	this.pBody.Upper_Part_Per = -1;
        // 	this.pBody.Left_Shoulder_Angle = 360 - get_seg_angle(Poly.Points(3), Poly.Points(4));
        // 	this.pBody.Right_Shoulder_Angle = get_seg_angle(Poly.Points(18), Poly.Points(17)) - 180;

        this.pBody.Left_Should_Type = 3;
        this.pBody.Right_Should_Type = 3;

        this.pBody.Left_Shoulder_Angle = 360 - this.get_seg_angle(Poly.Points[3], Poly.Points[4]);
        this.pBody.Right_Shoulder_Angle = this.get_seg_angle(Poly.Points[18], Poly.Points[17]) - 180;

        if(this.pBody.Left_Shoulder_Angle < 7.5) return false;
        if(this.pBody.Left_Shoulder_Angle < 12.5){
            this.pBody.Left_Should_Type = 6;
            if(this.pBody.Left_Shoulder_Angle < 10) this.pBody.LST = -1;
            else this.pBody.LST = 5;
        }else if(this.pBody.Left_Shoulder_Angle < 17.5){
            this.pBody.Left_Should_Type = 5;
            if(this.pBody.Left_Shoulder_Angle < 15) this.pBody.LST = 6;
            else this.pBody.LST = 4;
        }else if(this.pBody.Left_Shoulder_Angle < 22.5){
            this.pBody.Left_Should_Type = 4;
            if(this.pBody.Left_Shoulder_Angle < 20) this.pBody.LST = 5;
            else this.pBody.LST = 3;
        }else if(this.pBody.Left_Shoulder_Angle < 27.5){
            this.pBody.Left_Should_Type = 3;
            if(this.pBody.Left_Shoulder_Angle < 25) this.pBody.LST = 4;
            else this.pBody.LST = 2;
        }else if(this.pBody.Left_Shoulder_Angle < 32.5){
            this.pBody.Left_Should_Type = 2;
            if(this.pBody.Left_Shoulder_Angle < 30) this.pBody.LST = 3;
            else this.pBody.LST = 1;
        }else if(this.pBody.Left_Shoulder_Angle < 37.5){
            this.pBody.Left_Should_Type = 1;
            if(this.pBody.Left_Shoulder_Angle < 35) this.pBody.LST = 2;
            else this.pBody.LST = 0;
        }else if(this.pBody.Left_Shoulder_Angle < 42.5){
            this.pBody.Left_Should_Type = 0;
            if(this.pBody.Left_Shoulder_Angle < 45) this.pBody.LST = 1;
            else this.pBody.LST = -1;
        }else if(this.pBody.Left_Shoulder_Angle < 47.5){
            return false;
        }

        if(this.pBody.Right_Shoulder_Angle < 7.5) return false;
        if(this.pBody.Right_Shoulder_Angle < 12.5){
            this.pBody.Right_Should_Type = 6;
            if(this.pBody.Right_Shoulder_Angle < 10) this.pBody.RST = -1;
            else this.pBody.RST = 5;
        }else if(this.pBody.Right_Shoulder_Angle < 17.5){
            this.pBody.Right_Should_Type = 5;
            if(this.pBody.Right_Shoulder_Angle < 15) this.pBody.RST = 6;
            else this.pBody.RST = 4;
        }else if(this.pBody.Right_Shoulder_Angle < 22.5){
            this.pBody.Right_Should_Type = 4;
            if(this.pBody.Right_Shoulder_Angle < 20) this.pBody.RST = 5;
            else this.pBody.RST = 3;
        }else if(this.pBody.Right_Shoulder_Angle < 27.5){
            this.pBody.Right_Should_Type = 3;
            if(this.pBody.Right_Shoulder_Angle < 25) this.pBody.RST = 4;
            else this.pBody.RST = 2;
        }else if(this.pBody.Right_Shoulder_Angle < 32.5){
            this.pBody.Right_Should_Type = 2;
            if(this.pBody.Right_Shoulder_Angle < 30) this.pBody.RST = 3;
            else this.pBody.RST = 1;
        }else if(this.pBody.Right_Shoulder_Angle < 37.5){
            this.pBody.Right_Should_Type = 1;
            if(this.pBody.Right_Shoulder_Angle < 35) this.pBody.RST = 2;
            else this.pBody.RST = 0;
        }else if(this.pBody.Right_Shoulder_Angle < 42.5){
            this.pBody.Right_Should_Type = 0;
            if(this.pBody.Right_Shoulder_Angle < 45) this.pBody.RST = 1;
            else this.pBody.RST = -1;
        }else if(this.pBody.Right_Shoulder_Angle < 47.5){
            return false;
        }

        return true;
    }


}