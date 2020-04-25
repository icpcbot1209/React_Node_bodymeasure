import { Rough_Edge, STATE_NODETECTED, ROUGH_EDGE_GAP, Detect_Points } from './Rough_Edge';
import { Point_2D } from './DEF';
import { Dist } from './Util_Funcs';

export class Side_Rough_Edge extends Rough_Edge{
    constructor(){
        super();
    }

    Init(_pBody){
        this.pBody = _pBody;
        this.Last_State = STATE_NODETECTED;
        this.Make_Initial_Side_Rough_Edge();
    }

    // bool Side_Rough_Edge::Make_Initial_Side_Rough_Edge()
    Make_Initial_Side_Rough_Edge(){
        this.Load_Sample_Edge_and_Direction();
        this.Edge_Fat_Per = Math.round(100 + (455*(0.16 + 0.000683 * this.pBody.Fat_Per) - (this.Demo_Edge.Points[6].x - this.Demo_Edge.Points[16].x)) * 100 / (this.Move_Direction[6].x - this.Move_Direction[16].x));

        if(!this.pBody.Is_Male) {
            this.Demo_Edge.Points[6].x += 20;
            this.Demo_Edge.Points[9].x += 10;
            this.Demo_Edge.Points[10].x += 10;
        }

        this.Set_Fat(this.Demo_Edge, this.Edge_Fat_Per);
        this.Set_Fat(this.Demo_Edge, -100, this.Correct_Polygon);
        this.Edge_Polygon = this.Demo_Edge;
    
        return true;
    }

    
    // void Side_Rough_Edge::Load_Sample_Edge_and_Direction( Polygon_2D* Poly/*=NULL*/, Point_2D* Direct/*=NULL*/ )
    Load_Sample_Edge_and_Direction(Poly=null, Direct=null){
        if(Poly==null) Poly = this.Demo_Edge;
        if(Direct==null) Direct = this.Move_Direction;

        Poly.Point_Count = 19;
        Poly.Points[1].x = 190; Poly.Points[1].y = 490; Direct[1].x = 0; Direct[1].y = 0;
        Poly.Points[2].x = 235; Poly.Points[2].y = 437; Direct[2].x = 5; Direct[2].y = 0;
        Poly.Points[3].x = 225; Poly.Points[3].y = 398; Direct[3].x = 5; Direct[3].y = 0;
        Poly.Points[4].x = 210; Poly.Points[4].y = 390; Direct[4].x = 5; Direct[4].y = 0;
        Poly.Points[5].x = 210; Poly.Points[5].y = 380; Direct[5].x = 7; Direct[5].y = 0;
        Poly.Points[6].x = 214; Poly.Points[6].y = 355; Direct[6].x = 9; Direct[6].y = 0;
        Poly.Points[7].x = 221; Poly.Points[7].y = 309; Direct[7].x = 12; Direct[7].y = 0;
        Poly.Points[8].x = 224; Poly.Points[8].y = 275; Direct[8].x = 12; Direct[8].y = 0;
        Poly.Points[9].x = 217; Poly.Points[9].y = 246; Direct[9].x = 10; Direct[9].y = 0;
        Poly.Points[10].x = 210; Poly.Points[10].y = 113; Direct[10].x = 7; Direct[10].y = 0;
        Poly.Points[11].x = 150; Poly.Points[11].y = 80; Direct[11].x = -7; Direct[11].y = 0;
        Poly.Points[12].x = 150; Poly.Points[12].y = 176; Direct[12].x = -7; Direct[12].y = 0;
        Poly.Points[13].x = 145; Poly.Points[13].y = 248; Direct[13].x = -7; Direct[13].y = 0;
        Poly.Points[14].x = 153; Poly.Points[14].y = 277; Direct[14].x = -10; Direct[14].y = 0;
        Poly.Points[15].x = 150; Poly.Points[15].y = 309; Direct[15].x = -7; Direct[15].y = 0;
        Poly.Points[16].x = 150; Poly.Points[16].y = 354; Direct[16].x = -7; Direct[16].y = 0;
        Poly.Points[17].x = 160; Poly.Points[17].y = 389; Direct[17].x = -7; Direct[17].y = 0;
        Poly.Points[18].x = 153; Poly.Points[18].y = 407; Direct[18].x = -5; Direct[18].y = 0;
        Poly.Points[19].x = 145; Poly.Points[19].y = 437; Direct[19].x = -5; Direct[19].y = 0;

        for(let i=1; i<=Poly.Point_Count; i++){
            Poly.Points[i].y += -20;
        }

        Poly.Quality.fill(0, 0, Poly.Quality.length);
    }


    //////////////////////////////////////////////////////////////////////////
    /// Detect
    //////////////////////////////////////////////////////////////////////////
    
    // bool Side_Rough_Edge::Detect_Head( Body_Image* Image, Polygon_2D* Poly )
    Detect_Head(Image, Poly){
        let mxret = {value:0}, mxang={value:0}, mxdst={value:0};
        let dp=new Point_2D(), tv=new Point_2D();

        // Check Top Head
        if(!this.Detect_Point(Image, Poly, 1, new Point_2D(0, -1), 3, 35, 5)) return false;

        // Check Forward Line 5-6
        if(!this.Search_Seg_Angle2(Image, Poly, 5, 6, 15, -1, true, 20, mxret, mxang, dp, mxdst)) return false;
        Poly.Points[6] = Poly.Points[6].oprPlus(dp);
        tv = Virt_Vector(Poly.Points[6].oprMinus(Poly.Points[5]));
        dp = Virt_Vector(Poly.Points[6].oprMinus(Poly.Points[5])).oprMultiply( (mxdst.value - ROUGH_EDGE_GAP) / Dist(tv) );
        Poly.Points[5] = Poly.Points[5].oprPlus(dp);
        Poly.Points[6] = Poly.Points[6].oprPlus(dp);
        
        if(!this.Search_Seg_Angle2(Image, Poly, 6, 5, 10, -1, false, 20, mxret, mxang, dp, mxdst)) return false;
        Poly.Points[5] = Poly.Points[5].oprPlus(dp);
        tv = Virt_Vector(Poly.Points[6].oprMinus(Poly.Points[5]));
        dp = Virt_Vector(Poly.Points[6].oprMinus(Poly.Points[5])).oprMultiply( (mxdst.value - ROUGH_EDGE_GAP) / Dist(tv) );
        Poly.Points[5] = Poly.Points[5].oprPlus(dp);
        Poly.Points[6] = Poly.Points[6].oprPlus(dp);
        
        if(Math.abs(Dist(Poly.Points[5].oprMinus(this.Correct_Polygon.Points[5])) - Dist(Poly.Points[6].oprMinus(this.Correct_Polygon.Points[6]))) > ROUGH_EDGE_GAP/2){
            this.Correct_Polygon.Points[5] = Poly.Points[5].oprPlus(this.Correct_Polygon.Points[6]).oprMinus(Poly.Points[6]);
        }
    
        /// Check Back Line 16-17
        if(!this.Search_Seg_Angle2(Image, Poly, 16, 17, 15, -1, true, 20, mxret, mxang, dp, mxdst)) return false;
        Poly.Points[17] = Poly.Points[17].oprPlus(dp);
        tv = Virt_Vector(Poly.Points[17].oprMinus(Poly.Points[16]));
        dp = Virt_Vector(Poly.Points[17].oprMinus(Poly.Points[16])).oprMultiply((mxdst.value - ROUGH_EDGE_GAP) / Dist(tv));
        Poly.Points[16] = Poly.Points[16].oprPlus(dp);
        Poly.Points[17] = Poly.Points[17].oprPlus(dp);
    
        if(!this.Search_Seg_Angle2(Image, Poly, 17, 16, 10, -1, false, 20, mxret, mxang, dp, mxdst)) return false;
        Poly.Points[16] = Poly.Points[16].oprPlus(dp);
        tv = Virt_Vector(Poly.Points[17].oprMinus(Poly.Points[16]));
        dp = Virt_Vector(Poly.Points[17].oprMinus(Poly.Points[16])).oprMultiply((mxdst.value - ROUGH_EDGE_GAP) / Dist(tv));
        Poly.Points[16] = Poly.Points[16].oprPlus(dp); 
        Poly.Points[17] = Poly.Points[17].oprPlus(dp);
    
        if(!this.Detect_Point(Image, Poly, 17, Virt_Vector(Poly.Points[17].oprMinus(Poly.Points[16])), 3, ROUGH_EDGE_GAP*3/2, ROUGH_EDGE_GAP/2)) return false;
        if(!this.Detect_Point(Image, Poly, 16, Virt_Vector(Poly.Points[17].oprMinus(Poly.Points[16])), 3, ROUGH_EDGE_GAP*3/2, ROUGH_EDGE_GAP/2)) return false;
    
        if(Math.abs(Dist(Poly.Points[16].oprMinus(this.Correct_Polygon.Points[16])) - Dist(Poly.Points[17].oprMinus(this.Correct_Polygon.Points[17]))) > ROUGH_EDGE_GAP/2){
            this.Correct_Polygon.Points[17] = Poly.Points[17].oprPlus(this.Correct_Polygon.Points[16]).oprMinus(Poly.Points[16]);
        }
        
        return true;
    }

    // bool Side_Rough_Edge::Detect_Body( Body_Image* Image, Polygon_2D* Poly )
    Detect_Body(Image, Poly){
        let mxret, mxang={value:0}, dp=new Point_2D();
        let aang;

        aang = this.get_seg_angle(Poly.Points[5], Poly.Points[6]);
        if(!this.Search_Seg_Angle(Image, Poly, 6, 7, aang-20, aang+20, -1, true, 30, mxret, mxang, dp)) return false;
        Poly.Points[7] = Poly.Points[7].oprPlus(dp); PQ[7] = mxret;
        if(!this.Detect_First_Point(Image, Poly, 7, new Point_2D(-1,0), 2, 20, 3, 5)) return false;
        Poly.Points[7].x = this.Correct_Polygon.Points[7].x + ROUGH_EDGE_GAP;

        aang = this.get_seg_angle(Poly.Points[6], Poly.Points[7]);
        if(!this.Search_Seg_Angle(Image, Poly, 7, 8, aang-20, aang+20, -1, true, 30, mxret, mxang, dp)) return false;
        Poly.Points[8] = Poly.Points[8].oprPlus(dp); PQ[8] = mxret;
        if(!this.Detect_First_Point(Image, Poly, 8, new Point_2D(-1,0), 2, 20, 3, 5)) return false;
        Poly.Points[8].x = this.Correct_Polygon.Points[8].x + ROUGH_EDGE_GAP;

        /// Find Point 9
        if(Poly.Points[9].x > Poly.Points[8].x) Poly.Points[9].x = Poly.Points[8].x;
        if(this.Detect_First_Point(Image, Poly, 9, new Point_2D(-1,0), 3, 30, 0, 5)){
            Poly.Points[9].x = this.Correct_Polygon.Points[9].x + ROUGH_EDGE_GAP;
            if(Poly.Points[9].x < Poly.Points[6].x-20 || Poly.Points[9].x > Poly.Points[9].x + 10){
                Poly.Points[9].x = Poly.Points[6].x;
            }
        }else{
            Poly.Points[9].x = Poly.Points[6].x;
        }

        /// Find Point 10
        Poly.Points[10].x = Poly.Points[9].x - 7;
        if(this.Detect_First_Point(Image, Poly, 10, new Point_2D(-1,0), 3, 40, 0, 5)){
            Poly.Points[10].x = this.Correct_Polygon.Points[10].x + ROUGH_EDGE_GAP;
        }else{
            Poly.Points[10].x = Poly.Points[5].x;
        }

        /// Find Point 15
        aang = this.get_seg_angle(Poly.Points[17], Poly.Points[16]);
        if(!this.Search_Seg_Angle(Image, Poly, 16, 15, aang-20, aang+40, -1, false, 30, mxret, mxang, dp)) return false;
        Poly.Points[15] = Poly.Points[15].oprPlus(dp); PQ[15] = mxret;
        if(!this.Detect_First_Point(Image, Poly, 15, new Point_2D(1,0), 2, 20, 3, 5)) return false;
        Poly.Points[15].x = this.Correct_Polygon.Points[15].x - ROUGH_EDGE_GAP;

        /// Find Point 14
        aang = this.get_seg_angle(Poly.Points[16], Poly.Points[15]);
        if(!this.Search_Seg_Angle(Image, Poly, 15, 14, aang-10, aang+10, -1, false, 30, mxret, mxang, dp)) return false;
        Poly.Points[14] = Poly.Points[14].oprPlus(dp); PQ[14] = mxret;
        if(!this.Detect_First_Point(Image, Poly, 14, new Point_2D(1,0), 2, 20, 3, 5)) return false;
        Poly.Points[14].x = this.Correct_Polygon.Points[14].x - ROUGH_EDGE_GAP;

        return true;
    }

        
    // bool Side_Rough_Edge::Detect_Hip( Body_Image* Image, Polygon_2D* Poly )
    Detect_Hip(Image, Poly) {

        let mxret, mxang, mxdst; let dp = new Point_2D();

        /// Find Point 13

        if(Poly.Points[13].y > Poly.Points[14].y-20){
            Poly.Points[13].y = Poly.Points[14].y-20;
        }

        let op = Poly.Points[13];
        rescp = [];
        Poly.Points[13].y -= 40;
        for(let i = -40; i <= 20; i += 10){
            if(this.Detect_First_Point(Image, Poly, 13, new Point_2D(1,0), 2, 30, 0, 5)){
                rescp.push(this.Correct_Polygon.Points[13]);
            }
            Poly.Points[13].y += 10;
        }

        if(rescp.length==0) return false;

        this.Correct_Polygon.Points[13] = rescp[0];
        let sz_1 = rescp.length-1;
        for(let i=1; i<sz_1; i++){
            dp = (rescp[i-1].oprPlus(rescp[i+1])).oprDivide(2);
            if(Dist(dp, rescp[i])>10) continue;
            if(rescp[i].x < this.Correct_Polygon.Points[13].x){
                this.Correct_Polygon.Points[13] = rescp[i];
            }
        }
        Poly.Points[13] = this.Correct_Polygon.Points[13].oprPlus(new Point_2D(-ROUGH_EDGE_GAP, 0));

        /// Find Point 11
        if(this.Detect_First_Point(Image, Poly, 11, new Point_2D(1,0), 3, 30, 0, 5)){
            Poly.Points[11].x = this.Correct_Polygon.Points[11].x - ROUGH_EDGE_GAP;
            if(Poly.Points[11].x < Poly.Points[15].x-10 || Poly.Points[11].x > Poly.Points[15].x + 20){
                Poly.Points[11].x = Poly.Points[15].x;
            }
        }else{
            Poly.Points[11].x = Poly.Points[15].x;
        }

        /// Find Point 12
        if(this.Detect_First_Point(Image, Poly, 12, new Point_2D(1,0), 3, 40, 0, 5)){
            Poly.Points[12].x = this.Correct_Polygon.Points[12].x - ROUGH_EDGE_GAP;
        }else{
            Poly.Points[12].x = Poly.Points[11].x;
        }

        return true;
    }

    // bool Side_Rough_Edge::Detect_Human( Body_Image* Image )
    Detect_Human(Image){
        this.pbImage = Image;
        let Poly = this.Edge_Polygon;

        if(!this.Detect_Head(Image, Poly)) return false;
        if(!this.Detect_Body(Image, Poly)) return false;
        if(!this.Detect_Hip(Image, Poly)) return false;

        return true;
    }




    //////////////////////////////////////////////////////////////////////////
    /// Adjust
    //////////////////////////////////////////////////////////////////////////

    // bool Side_Rough_Edge::Adjust_Head( Body_Image* Image, Polygon_2D* Poly )
    Adjust_Head(Image, Poly){
        return true;
    }

    // bool Side_Rough_Edge::Adjust_Shoulder_Joint( Body_Image* Image, Polygon_2D* Poly)
    Adjust_Shoulder_Joint(Image, Poly){
        Detect_Points.Point_Count = 0;
        Poly.Points[54] = Direct_Plus(Poly.Points[16], PV(16,15), 20);
        Poly.Points[55] = Direct_Plus(Poly.Points[16], PV(16,17), 20);
        if(!this.Div_Seg_Attack(Image, Poly, 54, 55, 4, -20, 20, true, 40)) return false;

        for(let i=2; i<Detect_Points.Point_Count; i++){
            Detect_Points.Points[i].x = (Detect_Points.Points[i-1].x + Detect_Points.Points[i].x*2 + Detect_Points.Points[i+1].x) / 4;
        }

        let minx = 10000, mindy = 10000, minid=0;
        for(let i=1; i<=Detect_Points.Point_Count; i++){
            if(Detect_Points.Points[i].x < minx){
                minid = i;
                minx = Detect_Points.Points[i].x;
                mindy = Math.abs(Detect_Points.Points[i].y - Poly.Points[16].y);
            }else if(Detect_Points.Points[i].x==minx){
                if(Math.abs(Detect_Points.Points[i].y - Poly.Points[16].y) < mindy){
                    minid = i;
                    mindy = Math.abs(Detect_Points.Points[i].y - Poly.Points[16].y);
                }
            }
        }

        this.Correct_Polygon.Points[16] = Detect_Points.Points[minid];
        Poly.Points[16] = this.Correct_Polygon.Points[16].oprPlus(new Point_2D(-ROUGH_EDGE_GAP, 0));
        PQ[16] = 255;

        return true;
    }

    // bool Side_Rough_Edge::Adjust_Bossom( Body_Image* Image, Polygon_2D* Poly)
    Adjust_Bossom(Image, Poly){
        Detect_Points.Point_Count = 0;
        Poly.Points[54] = this.Direct_Plus(Poly.Points[6], PV(6,7), 20);
        Poly.Points[55] = this.Direct_Plus(Poly.Points[6], PV(6,5), 20);
        if(!Div_Seg_Attack(Image, Poly, 54, 55, 8, -30, 30, false, 30)) return false;

        for(let i=2; i<Detect_Points.Point_Count; i++){
            Detect_Points.Points[i].x = (Detect_Points.Points[i-1].x + Detect_Points.Points[i].x*2 + Detect_Points.Points[i+1].x) / 4;
        }

        let minx = 0, mindy = 10000, minid=0;
        for(let i=1; i<=Detect_Points.Point_Count; i++){
            if(Detect_Points.Points[i].x > minx){
                minid = i;
                minx = Detect_Points.Points[i].x;
                mindy = mabs(Detect_Points.Points[i].y - Poly.Points[6].y);
            }else if(Detect_Points.Points[i].x==minx){
                if(mabs(Detect_Points.Points[i].y - Poly.Points[6].y) < mindy){
                    minid = i;
                    mindy = mabs(Detect_Points.Points[i].y - Poly.Points[6].y);
                }
            }
        }

        this.Correct_Polygon.Points[6] = Detect_Points.Points[minid];
        Poly.Points[6] = this.Correct_Polygon.Points[6].oprPlus(new Point_2D(ROUGH_EDGE_GAP, 0));

        return true;
    }

    // bool Side_Rough_Edge::Adjust_Chest( Body_Image* Image, Polygon_2D* Poly)
    Adjust_Chest(Image, Poly){
        let mxret={value:0}, mxang={value:0}; 
        let dp = new Point_2D();

        Poly.Points[6].y = Poly.Points[16].y;
        if(!this.Search_Seg_Angle2(Image, Poly, 6, 7, 20, 10, true, 40, mxret, mxang, dp)) return false;
        if(!this.Find_Edge_Point(Image, Poly, 6, 6, 7, 0, true)) return false;

        return true;
    }

    // bool Side_Rough_Edge::Adjust_Belly( Body_Image* Image, Polygon_2D* Poly)
    Adjust_Belly(Image, Poly){
        let mxret={value:0}, mxang={value:0}, mxdst={value:0}; 
        let dp=new Point_2D();
        let aang, nang;

        /// 7번점 찾기
        if(!this.Search_Seg_Angle2(Image, Poly, 7, 6, 15, 30, false, 40, mxret, mxang, dp, mxdst)) return false;
        Poly.Points[54] = Poly.Points[6].oprPlus(dp);
        if(!this.Find_Edge_Point(Image, Poly, 7, 54, 7, 0, true)) return false;

        /// 8번점 찾기
        aang = this.get_seg_angle(Poly.Points[6], Poly.Points[7]);
        nang = this.get_seg_angle(Poly.Points[7], Poly.Points[8]);
        if(!this.Search_Seg_Angle(Image, Poly, 7, 8, aang-nang-10, aang-nang+10, -1, true, 30, mxret, mxang, dp, mxdst)) return false;
        if(!this.Find_Edge_Point(Image, Poly, 8, 7, 8, 0, true)) return false;

        /// 9번점 찾기
        aang = this.get_seg_angle(Poly.Points[7], Poly.Points[8]);
        nang = this.get_seg_angle(Poly.Points[8], Poly.Points[9]);
        if(!this.Search_Seg_Angle(Image, Poly, 8, 9, aang-nang-10, aang-nang+10, -1, true, 30, mxret, mxang, dp, mxdst)) return false;
        if(!this.Find_Edge_Point(Image, Poly, 9, 8, 9, 0, true)) return false;

        /// 10번점 찾기
        Poly.Points[10].x = Poly.Points[9].x - 20;
        if(!this.Find_Edge_Point(Image, Poly, 10, 9, 10, 0, true)) return false;

        return true;
    }

    // bool Side_Rough_Edge::Adjust_Back( Body_Image* Image, Polygon_2D* Poly )
    Adjust_Back(Image, Poly){
        let mxret={value:0}, mxang={value:0}, mxdst={value:0}; 
        let dp=new Point_2D();
        if(!this.Search_Seg_Angle(Image, Poly, 16, 15, 0, 20, -1, false, 30, mxret, mxang, dp)) return false;
        Poly.Points[15] = Poly.Points[15].oprPlus(dp); PQ[15] = mxret.value;
        if(!this.Find_Edge_Point(Image, Poly, 15, 16, 15, 5, false)) return false;

        if(!this.Search_Curve_Angle(Image, Poly.Points[16], Poly.Points[17], true, -20, 20, 30, mxret, mxang, mxdst, dp, 5, 8, null)) return false;
        PQ[17] = mxret.value; Poly.Points[17] = Poly.Points[17].oprPlus(dp);

        return true;
    }

    // bool Side_Rough_Edge::Adjust_Body( Body_Image* Image, Polygon_2D* Poly )
    Adjust_Body(Image, Poly){
        let ret = true;
    // 	ret = Adjust_Shoulder_Joint(Image, Poly);
    // 	ret = Adjust_Chest(Image, Poly) && ret;
    // 	ret = Adjust_Belly(Image, Poly) && ret;
    // 	ret = Adjust_Back(Image, Poly) && ret;

        return ret;
    }

    // bool Side_Rough_Edge::Adjust_Leg( Body_Image* Image, Polygon_2D* Poly )
    Adjust_Leg(Image, Poly){
        //Find_Edge_Point(Image, Poly, 12, 11, 12, 10, true);
        //Find_Edge_Point(Image, Poly, 11, 11, 12, 10, true);
        //Div_Seg_Attack(Image, Poly, 12, 11, 20, -30, 30, false, 60);
        return true;
    }

    // bool Side_Rough_Edge::Adjust_Human( Body_Image* Image )
    Adjust_Human(Image){
        this.pbImage = Image;
        let Poly = this.Edge_Polygon;

        let ret = true;
    // 	ret = Adjust_Head(Image, Poly);
    // 	ret = Adjust_Body(Image, Poly) && ret;
    // 	ret = Adjust_Leg(Image, Poly) && ret;
    // 
    // 	if(ret==false){
    // 		//Make_Initial_Side_Rough_Edge();
    // 	}

        return ret;
    }


    //////////////////////////////////////////////////////////////////////////
    /// Correct
    //////////////////////////////////////////////////////////////////////////
    // bool Side_Rough_Edge::Correct_Human( Body_Image* Image, Polygon_2D* Good_Poly )
    Correct_Human(Image, Good_Poly){
        this.pbImage = Image;
        return true;
    }


    // bool Side_Rough_Edge::Calc_Body_Params()
    Calc_Body_Params(){
        
        let Poly = this.Edge_Polygon;
        // 
        // 	pBody.Neck_Side_Width = Round(Dist(Poly.Points[5) - Poly.Points[17)));
        // 	pBody.Chest_Side_Width = Round(Dist(Poly.Points[6) - Poly.Points[16)));
        // 	pBody.Waist_Side_Width = Poly.Points[7).x - Poly.Points[15).x;
        // 	pBody.Belly_Side_Width = Poly.Points[8).x - Poly.Points[14).x;
        // 	pBody.Hip_Side_Width = Poly.Points[9).x - Poly.Points[13).x;
        // 	pBody.Back_Length = Round(Dist(Poly.Points[13) - Poly.Points[16)) + Dist(Poly.Points[16)-Poly.Points[17)));
        // 
        // 	pBody.Belly_Height_Rate = (max(Poly.Points[7).x, Poly.Points[8).x) - min(Poly.Points[5).x, Poly.Points[6).x)) * 100 / (Poly.Points[6).x - Poly.Points[16).x);
        // 	pBody.Hip_Height_Rate =  (min(Poly.Points[15).x, Poly.Points[16).x) - min(Poly.Points[13).x, Poly.Points[14).x)) * 100 / (Poly.Points[6).x - Poly.Points[16).x);
        // 
        // 	pBody.Chest_Angle = get_seg_angle(Poly.Points[5), Poly.Points[6)) - 270;
        // 	pBody.Back_Angle = 270 - get_seg_angle(Poly.Points[17), Poly.Points[16));

        this.pBody.Belly_Height_Rate = (Math.max(Poly.Points[7].x, Poly.Points[8].x) - Math.min(Poly.Points[5].x, Poly.Points[6].x)) * 100 / (this.Correct_Polygon.Points[6].x - this.Correct_Polygon.Points[16].x);
        let Exp_Belly_Type;
        if(this.pBody.Fat_Per < 10){
            Exp_Belly_Type = 0;
        }else if(this.pBody.Fat_Per < 25){
            Exp_Belly_Type = 1;
        }else{
            Exp_Belly_Type = 2;
        }

        if(this.pBody.Belly_Height_Rate < 25){
            this.pBody.Belly_Type=0;
            if(this.pBody.Belly_Height_Rate<18) this.pBody.Belly = -1;
            else this.pBody.Belly = 1;
        }
        else if(this.pBody.Belly_Height_Rate < 65){
            this.pBody.Belly_Type=1;
            if(this.pBody.Belly_Height_Rate<50) this.pBody.Belly = 0;
            else this.pBody.Belly = 2;
        }
        else if(this.pBody.Belly_Height_Rate < 120){
            this.pBody.Belly_Type=2;
            if(this.pBody.Belly_Height_Rate<90) this.pBody.Belly = 1;
            else this.pBody.Belly = -1;
        }else{
            //return false;
            this.pBody.Belly_Type = Exp_Belly_Type;
            this.pBody.Belly = -1;
        }
        this.pBody.Belly_Type = (this.pBody.Belly_Type + Exp_Belly_Type)/2;
        if(this.pBody.Belly == this.pBody.Belly_Type) this.pBody.Belly = -1;
        else if(Math.abs(this.pBody.Belly - this.pBody.Belly_Type) > 1) this.pBody.Belly = -1;

        this.pBody.Hip_Height_Rate =  (Math.min(Poly.Points[15].x, Poly.Points[16].x) - Math.min(Poly.Points[13].x, Poly.Points[14].x)) * 100 / (this.Correct_Polygon.Points[6].x - this.Correct_Polygon.Points[16].x);
        let Exp_Hip_Type;
        if(this.pBody.Fat_Per < 10){
            Exp_Hip_Type = 1;
        }else if(this.pBody.Fat_Per < 20){
            Exp_Hip_Type = 2;
        }else{
            Exp_Hip_Type = 3;
        }

        if(this.pBody.Hip_Height_Rate < 0){
            this.pBody.Hip_Type = 1;
            if(this.pBody.Hip_Height_Rate < -5) this.pBody.Hip = -1;
            else this.pBody.Hip = 2;
        }else if(this.pBody.Hip_Height_Rate < 5){
            this.pBody.Hip_Type = 2;
            if(this.pBody.Hip_Height_Rate < 20) this.pBody.Hip = 1;
            else this.pBody.Hip = 3;
        }else if(this.pBody.Hip_Height_Rate < 30){
            this.pBody.Hip_Type = 3;
            if(this.pBody.Hip_Height_Rate < 40) this.pBody.Hip = 2;
            else this.pBody.Hip = -1;
        }else{
            //return false;
            this.pBody.Hip_Type = Exp_Hip_Type;
            this.pBody.Hip = -1;
        }
        this.pBody.Hip_Type = (this.pBody.Hip_Type * 2 + Exp_Hip_Type)/3;
        if(this.pBody.Hip == this.pBody.Hip_Type) this.pBody.Hip = -1;
        else if(Math.abs(this.pBody.Hip - this.pBody.Hip_Type) > 1) this.pBody.Hip = -1;


        this.pBody.Chest_Angle = this.get_seg_angle(Poly.Points[5], Poly.Points[6]) - 270;
        this.pBody.Back_Angle = 270 - this.get_seg_angle(Poly.Points[17], Poly.Points[16]);

        this.pBody.Back_Type = 3;

        if(this.pBody.Chest_Angle + this.pBody.Back_Angle < 30) return false;
        if(this.pBody.Chest_Angle + this.pBody.Back_Angle > 90) return false;

        if(this.pBody.Chest_Angle < 5){
            if(this.pBody.Back_Angle < 30){
                this.pBody.Back_Type = 4;
                if(this.pBody.Back_Angle < 20) this.pBody.Back = 3;
                else this.pBody.Back = 5;
            }else if(this.pBody.Back_Angle < 45){
                this.pBody.Back_Type = 5;
                if(this.pBody.Back_Angle < 40) this.pBody.Back = 4;
                else this.pBody.Back = 6;
            }else if(this.pBody.Back_Angle < 60){
                this.pBody.Back_Type = 6;
                if(this.pBody.Back_Angle < 50) this.pBody.Back = 5;
                else this.pBody.Back = -1;
            }else{
                return false;
            }
        }else if(this.pBody.Back_Angle < 10){
            if(this.pBody.Chest_Angle > 40){
                this.pBody.Back_Type = 0;
                if(this.pBody.Chest_Angle > 45) this.pBody.Back = -1;
                else this.pBody.Back = 1;
            }else if(this.pBody.Chest_Angle > 35){
                this.pBody.Back_Type = 1;
                if(this.pBody.Chest_Angle > 37.5) this.pBody.Back = 0;
                else this.pBody.Back = 2;
            }else if(this.pBody.Chest_Angle > 30){
                this.pBody.Back_Type = 2;
                if(this.pBody.Chest_Angle > 32.5) this.pBody.Back = 1;
                else this.pBody.Back = 3;
            }
        }

        /// Print Result
        return true;
    }




}