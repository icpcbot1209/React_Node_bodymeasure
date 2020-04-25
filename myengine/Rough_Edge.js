import { BODY_IMAGE_WIDTH, BODY_IMAGE_HEIGHT, MAX_POLYGON_EDGES, Point_2D, gcos, gsin, Polygon_2D, Point_List, Body_Image, Body_Params} from "./DEF";
import { CGamPoint } from "./GamPoint";
import { CGamLine } from "./GamLine";
import { Gradient_3D, Dist } from "./Util_Funcs.js";

export const EDGE_FAT_RATE		    = 200
export const EDGE_FAT_DELTA	    = 200
export const ATTACK_PIXEL_DELTA	= 30
export const BLUR_MASK_DELTA		= 1
export const PURT_MASK_DELTA		= 1
export const ATTACK_ANGLE_DELTA	= 30
export const SEARCH_DIV_COU		= 10
export const DEFAULT_DELTA		    = 5
export const DIV_ATTACK_STEP		= 8

export const GOOD_GRAD_THRESHOLD	= 250
export const BAD_GRAD_THRESHOLD	= 150
export const CANT_BELIEVE_THRESHOLD= 50

export const MIN_FAT_PER = -100
export const MAX_FAT_PER = 300

export const PARAM_COUNT   = 10
export const ROUGH_EDGE_GAP= 10
export const DIST_RATE     = 0.5

export const STATE_DETECTED    = 1
export const STATE_NODETECTED  = 0



export var Detect_Points = new Polygon_2D();

export const In_Image = (pt) => {
    if(pt.iX()<0 || pt.iX()>=BODY_IMAGE_WIDTH || pt.iY()<0 || pt.iY()>=BODY_IMAGE_HEIGHT) return 0;
};

export const POLY_ATT_MASK_SIZE = 1
export const POLY_PUR_MASK_SIZE = 1


// #define PV(pid1, pid2) (Poly->Points[(pid2)]-Poly->Points[(pid1)])
// #define VPV(pid1, pid2) Virt_Vector(PV((pid1),(pid2)))
// const PP(pid) = (Poly.Points[pid])
// #define PQ(pid) (Poly->Quality[pid])
// #define CP(pid) (Correct_Polygon.Points[pid])

export class Rough_Edge {
    constructor(){
        this.msg = "";
        this.Edge_Fat_Per = 0; //int
        this.Demo_Edge = new Polygon_2D(); //Polygon_2D
        this.Edge_Polygon = new Polygon_2D(); //Polygon_2D
        this.Correct_Polygon = new Polygon_2D(); //Polygon_2D
        this.Last_State = 0; //int

        this.Move_Direction = []; for(let i=0; i<MAX_POLYGON_EDGES; i++) this.Move_Direction.push(new Point_2D());
        this.Attack_Polygon = new Point_List(); //Point_List
        this.Attack_Direction = new Point_2D(); //Point_2D
        this.pbImage = new Body_Image(); //Body_Image
        this.pBody = new Body_Params(); //Body_Params

        this.Min_Param = []; //int[PARAM_COUNT]
        this.Max_Param = []; //int[PARAM_COUNT]
    }

    // int Polygon_Wave_Attack( int* oBest_dLegnth=NULL, Body_Image* Image=NULL, Point_List* Attack_Poly=NULL, Point_2D* Attack_Direct=NULL, int Attack_Length=ATTACK_PIXEL_DELTA, int BLUR_MASK_SIZE=BLUR_MASK_DELTA, int PURT_MASK_SIZE=PURT_MASK_DELTA);
    Polygon_Wave_Attack(oBest_dLength=null, Image=null, Attack_Poly=null, Attack_Direct=null, Attack_Length=ATTACK_PIXEL_DELTA, BLUR_MASK_SIZE=BLUR_MASK_DELTA, PURT_MASK_SIZE=PURT_MASK_DELTA){
        if(Image==null) Image = this.pbImage;
        if(Attack_Poly==null) Attack_Poly = this.Attack_Polygon;
        if(Attack_Direct == null) Attack_Direct = this.Attack_Direction;

        let lines = []; //vector<CGamLine>
        let points = [], total_points = []; //vector<CGamPoint>

        let i, j, k, point_count, attack_step;
  
        for(i=1; i<Attack_Poly.Point_Count; i++){
            lines.push( new CGamLine( new CGamPoint(Attack_Poly.Points[i].x, Attack_Poly.Points[i].y),   
                                    new CGamPoint(Attack_Poly.Points[i+1].x, Attack_Poly.Points[i+1].y)));
        }
        
        for(i=0; i<lines.length; i++){
            points = lines[i].SplitLine( Math.floor( lines[i].Distance() ) );
            j=0;
            for(k=1; k<points.length; k++){
                if( !(points[j].oprEqual(points[k])) ){
                    points[++j] = points[k];
                }
            }
            points.splice(j+1); //resize(j+1) //removes after jth
            for(j=0; j<points.length; j++){
                total_points.push(points[j]);
            }
        }

        j=0;
        for(i=1; i<total_points.length; i++){
            if( !(total_points[j].oprEqual(total_points[i])) ){
                total_points[++j] = total_points[i];
            }
        }
        total_points.splice(j+1);
        point_count = j+1;

        let attack_dir = new CGamPoint(Attack_Direct.x, Attack_Direct.y);
        attack_dir = attack_dir.oprDivide( attack_dir.Distance() ).oprMultiply( Attack_Length + 3 );
        let dir_line = new CGamLine( new CGamPoint(), attack_dir );
        points = dir_line.SplitLine( Attack_Length + 3 );
        
        j=0;
        for(k=1; k<points.length; k++){
            if(!(points[j].oprEqual(points[k]))){
                points[++j] = points[k];
            }
        }
        points.splice(j+1);
        attack_step = j+1;

        let gradient = [];
        for(i=0; i<attack_step-1; i++){
            gradient.push([]);
            for(j=0; j<point_count; j++){
                let pt1 = total_points[j].oprPlus(points[i]);
                let pt2 = total_points[j].oprPlus(points[i+1]);
                if(!In_Image(pt1) || !In_Image(pt2)) {gradient[i].push(0); continue;}
                let c1 = Image.Pixel[pt1.iY()][pt1.iX()];
                let c2 = Image.Pixel[pt2.iY()][pt2.iX()];
                let grad = Gradient_3D(c1, c2);
                gradient[i].push(grad);
            }
        }

        let mx = 0;
        let mx_i = 0;
        let row_sum;

        let mx_depth = [];
        let grad_list = [];
        let scou = Math.floor(point_count*8/10);
        let row_sums = [];

        for(i=0; i<attack_step; i++){
            for(j=0; j<point_count; j++){
                let sum=0;
                let cnt=0;
                for(let u = -BLUR_MASK_SIZE; u <= BLUR_MASK_SIZE; u++){
                    for(let v = -BLUR_MASK_SIZE; v<= BLUR_MASK_SIZE; v++){
                        let cx = i+u;
                        let cy = j+v;
                        if(cx<0 || cx>=gradient.length || cy<0 || cy >= total_points.length) continue;
                        sum += gradient[cx][cy];
                        cnt++;
                    }
                }
                grad_list.push(sum/cnt);
            }
            grad_list.sort();
            row_sum = 0;
            for(j=0; j<scou; j++) row_sum = grad_list[j];

            row_sums.push(row_sum / point_count);
        }

        let mn;
        for(i=0; i<attack_step-3; i++){
            mn = 100000;
            for(j=1; j<3; j++){
                if(mn > row_sums[i+j]) mn = row_sums[i+j];
            }
            if(mx < row_sums[i] - mn){
                mx = row_sums[i] - mn;
                mx_i = i;
            }
        }

        if(oBest_dLength != null) oBest_dLength.value = Math.round( points[mx_i].Distance() );

        if(mx<25) return -1;
        mx = (mx+255)/2;
        if(mx>255) mx=255;

        return mx;
    }

    // bool Rough_Edge::Attack_For_Correct( Polygon_2D* Poly, int pid, int Attack_Length, int Attack_Angle, int No_Delta )
    Attack_For_Correct(Poly, pid, Attack_Length, Attack_Angle, No_Delta){
    // 	int Best_dLength, Best_dAngle, ret;
    // 
    // 	int dl = Round(Dist(Attack_Direction * 16));
    // 	ret = Polygon_Wave_Attack(&Best_dLength, &Best_dAngle, NULL, NULL, NULL, Attack_Length, Attack_Angle);
    // 	if(ret<0){
    // 		Poly->Points[pid] += (Attack_Direction * No_Delta * 16) / dl;
    // 		Poly->Quality[pid] = 1;
    // 		return false;
    // 	}else{
    // 		Poly->Points[pid] += (Attack_Direction * Best_dLength * 16) / dl;
    // 		Poly->Quality[pid] = ret;
    // 		return true;
    // 	}
    }

    // Point_2D Rough_Edge::Direct_Plus(Point_2D poi, Point_2D direct, int delta){}
    Direct_Plus(poi, direct, delta){
        let dl = Math.round(Dist(direct));
        if(dl == 0) return poi;
        let dp = (direct.oprMultiply(delta).oprDivide(dl));
        return poi.oprPlus(dp);
    }

    // Point_2D Rough_Edge::Angle_Plus(Point_2D poi, int angle, double delta)
    Angle_Plus(poi, angle, delta){
        while(angle>=360) angle-=360;
        while(angle<0) angle+=360;
        
        return poi.oprPlus( Point_2D( Math.round(delta*gcos[angle])/32768, Math.round(delta*gsin[angle])/32768 ) );
    }

    /// Turn Right 90 Degree
    // Point_2D Rough_Edge::Virt_Vector(Point_2D poi)
    Virt_Vector(poi){
        return new Point_2D(poi.y, -poi.x);
    }

    /// This Function is for Segment Attack
    // void Rough_Edge::Make_Attack_Polygon_Direction( Point_2D Attack_Point, Point_2D Attack_Direct, int Width )
    Make_Attack_Polygon_Direction(Attack_Point, Attack_Direct, Width){
        this.Attack_Polygon.Point_Count = 2;
        let vd = this.Virt_Vector(Attack_Direct);
        this.Attack_Polygon.Points[1] = this.Direct_Plus(Attack_Point, vd, Width);
        this.Attack_Polygon.Points[2] = this.Direct_Plus(Attack_Point, vd, -Width);
        this.Attack_Direction = Attack_Direct;
    }

    // void Rough_Edge::Make_Attack_Polygon_Direction( Point_2D Attack_Point1, Point_2D Attack_Point2, Point_2D Attack_Direct )
    Make_Attack_Polygon_Direction2(Attack_Point1, Attack_Point2, Attack_Direct){
        this.Attack_Polygon.Point_Count = 2;
        this.Attack_Polygon.Points[1] = Attack_Point1;
        this.Attack_Polygon.Points[2] = Attack_Point2;
        this.Attack_Direction = Attack_Direct;
    }

    // int Rough_Edge::get_seg_angle(Point_2D poi1, Point_2D poi2)
    get_seg_angle(poi1, poi2){
        let n_ang = Math.round(Math.atan2( 0.0 + poi2.y - poi1.y, 0.0 + poi2.x - poi1.x ) * 57.29578);
        if(n_ang < 0) n_ang += 360;
        if(n_ang > 360) n_ang -= 360;
        return n_ang;
    }

    // bool Rough_Edge::Div_Seg_Attack(Body_Image* Image, Polygon_2D* Poly, int pid1, int pid2, int div_step, int stdang, int eddang, bool Attack_Right, int Attack_Pix_Delta)
    Div_Seg_Attack(Image, Poly, pid1, pid2, div_step=DIV_ATTACK_STEP, stdang = -20, eddang = 20, Attack_Right = true, Attack_Pix_Delta = ATTACK_PIXEL_DELTA){
        let tl = Math.round(Dist(Poly.Points[(pid2)]-Poly.Points[(pid1)]));
        let atcnt = tl / div_step;

        let mxret = {value:0}, mxang = {value:0}, mxdst = {value:0}, dp = new Point_2D();

        if(tl<=1) return false;
        

        Poly.Points[51] = Poly.Points[pid1]; Poly.Points[52] = this.Direct_Plus(Poly.Points[51], (Poly.Points[(pid2)]-Poly.Points[(pid1)]), div_step);
        if(!this.Search_Seg_Angle(Image, Poly, 51, 52, stdang, eddang, 1, Attack_Right, Attack_Pix_Delta, mxret, mxang, dp, mxdst)) return false;
        if(!this.Find_Edge_Point(Image, Poly, pid1, 51, 52, 0, Attack_Right)) return false;
        Poly.Points[51]= Poly.Points[pid1];

        Detect_Points.insert(this.Correct_Polygon.Points[pid1]);

        for(let i=0; i<atcnt; i++){
            if(!this.Search_Seg_Angle(Image, Poly, 51, 52, stdang, eddang, -1, Attack_Right, Attack_Pix_Delta, mxret, mxang, dp, mxdst)) return false;
            if(!this.Find_Edge_Point(Image, Poly, 52, 51, 52, 0, Attack_Right)) return false;
            
            Detect_Points.insert(this.Correct_Polygon.Points[52]);

            Poly.Points[53] = Poly.Points[52]; this.Correct_Polygon.Points[53] = this.Correct_Polygon.Points[52];
            Poly.Points[52] = this.Direct_Plus(Poly.Points[52], (Poly.Points[(52)]-Poly.Points[(51)]), div_step);
		    Poly.Points[51] = Poly.Points[53]; this.Correct_Polygon.Points[51] = this.Correct_Polygon.Points[53];
        }
        
        let dl = tl - atcnt * div_step;
        if(dl>1){
            Poly.Points[52] = this.Direct_Plus(Poly.Points[51], (Poly.Points[52] - Poly.Points[51]), dl);
            Poly.Points[51] = this.Direct_Plus(Poly.Points[52], (Poly.Points[51] - Poly.Points[52]), div_step);
            if(!Search_Seg_Angle(Image, Poly, 51, 52, stdang, eddang, -1, Attack_Right, Attack_Pix_Delta, mxret, mxang, dp, mxdst)) return false;
            Poly.Points[pid2] = Poly.Points[52];
            if(!Find_Edge_Point(Image, Poly, pid2, 51, 52, 0, Attack_Right)) return false;

        }else{
            Poly.Points[pid2] = Poly.Points[51]; this.Correct_Polygon.Points[pic2] = this.Correct_Polygon.Points[51];
        }
        
        Detect_Points.insert(this.Correct_Polygon.Points[pid2]);

        return true;
    }

    // bool Rough_Edge::Search_Curve_Angle( Body_Image* Image, Point_2D p1, Point_2D p2, bool Attack_Right /*= true*/, 
    //     int st_dang /*= -10*/, int ed_dang /*= 10*/, int Attack_Pixel_Delta /*= ATTACK_PIXEL_DELTA*/, 
    //     int *mxret /*= NULL*/, int *mxang /*= NULL*/, int* mxdst /*= NULL*/, Point_2D* dp/*=NULL*/, 
    //     int Purt_Pix_Delta /*= 0*/, int div_attack_step /*= DIV_ATTACK_STEP*/, Polygon_2D* Out_Poly/*=NULL*/ )
    // {
    // // 	int n_ang, st_ang, ed_ang, delta_ang, ang, ret;
    // // 	int pix_delta = Round(Dist(p1-p2));
    // // 	Point_2D tp, vv;
    // // 	int _mxret, _mxang, _mxdst;
    // // 	Point_2D _dp;
    // // 	int BestdLength, BestdAngle;
    // // 
    // // 	n_ang = get_seg_angle(p1, p2);
    // // 	st_ang = n_ang + st_dang; ed_ang = n_ang + ed_dang;
    // // 	delta_ang = 1;
    // // 	
    // // 	_mxret = -1;
    // // 	for(int fang=st_ang; fang<=ed_ang; fang+=delta_ang){
    // // 		ang = fang;
    // // 		while(ang >= 360) ang-=360;
    // // 		while(ang < 0) ang += 360;
    // // 		tp = Angle_Plus(p1, ang, pix_delta);
    // // 		vv = Virt_Vector(tp - p1);
    // // 		if(!Attack_Right) vv=vv*(-1);
    // // 
    // // 		Make_Attack_Polygon_Direction(p1, tp, vv);
    // // 		ret = Polygon_Wave_Attack(&BestdLength, &BestdAngle,
    // // 			Image, NULL, NULL, Attack_Pixel_Delta, 0, Purt_Pix_Delta, div_attack_step, Out_Poly);
    // // 
    // // 		if(ret > _mxret){
    // // 			_mxret = ret;
    // // 			_mxang = ang + BestdAngle;
    // // 			_mxdst = BestdLength;
    // // 		}
    // // 	}
    // // 	if(_mxret<0) return false;
    // // 
    // // 	if(Debug_Mode) Alert(_mxang);
    // // 
    // // 	tp = Angle_Plus(p1, _mxang, Round(Dist(p1-p2)));
    // // 	_dp = tp - p2;
    // // 
    // // 	if(mxret!=NULL) *mxret = _mxret;
    // // 	if(mxang!=NULL) *mxang = _mxang;
    // // 	if(mxdst!=NULL) *mxdst = _mxdst;
    // // 	if(dp!=NULL) *dp = _dp;
    // // 
    // // 	return true;
    // }



    // bool Rough_Edge::Search_Seg_Angle(Body_Image* Image, Polygon_2D* Poly, int pid1, int pid2,
    //     int st_ang, int ed_ang, int pix_delta, bool Attack_Right, int Attack_Pixel_Delta, 
    //     int* mxret, int* mxang, Point_2D* dp, int* mxdst, Point_2D* att_dir){
    Search_Seg_Angle(Image, Poly, pid1, pid2, st_ang, ed_ang, pix_delta, Attack_Right, Attack_Pixel_Delta, mxret, mxang, dp, mxdst=null, att_dir=null){

        let tp=new Point_2D(), vv=new Point_2D();
        let ret, oBest_dLength={value:0};
        let delta_ang;

        if(pix_delta==-1){
            pix_delta = Math.round(Dist( Poly.Points[pid1].oprMinus( Poly.Points[pid2] ) )*0.9);
        }
        
        delta_ang = 1;
        mxret.value = -1; let ang;
        for(let fang = st_ang; fang <= ed_ang; fang += delta_ang){
            ang = fang;
            while(ang >= 360) ang -= 360;
            while(ang < 0) ang += 360;
            tp = this.Angle_Plus(Poly.Points[pid1], ang, pix_delta);
            vv = this.Virt_Vector(tp - Poly.Points[pid1]);
            if(!Attack_Right) vv = vv*(-1);

            if(att_dir!=null) vv = att_dir;
            this.Make_Attack_Polygon_Direction2(Poly.Points[pid1], tp, vv);
            ret = this.Polygon_Wave_Attack( oBest_dLength, null, null, null, Attack_Pixel_Delta );

            if(ret > mxret.value){
                mxret.value = ret; mxang.value = fang;
                if(mxdst!=null) mxdst.value = oBest_dLength.value;
            }
        }
        if(mxret.value<0) return false;

        tp = this.Angle_Plus(Poly.Points[pid1], mxang.value, Math.round( Dist((Poly.Points[pid]).oprMinus(Poly.Points[pid2])) ));
        dp = tp.oprMinus(Poly.Points[pid2]);

        return true;
    }

    // bool Rough_Edge::Search_Seg_Angle(Body_Image* Image, Polygon_2D* Poly, int pid1, int pid2,
    //     int ang_delta, int pix_delta, bool Attack_Right, int Attack_Pixel_Delta, 
    //     int* mxret, int* mxang, Point_2D* dp, int* mxdst, Point_2D* att_dir){
    Search_Seg_Angle2(Image, Poly, pid1, pid2, ang_delta, pix_delta, Attack_Right, Attack_Pixel_Delta, mxret, mxang, dp, mxdst=null, att_dir=null){
        let nang = this.get_seg_angle(Poly.Points[pid1], Poly.Points[pid2]);
        return Search_Seg_Angle(Image, Poly, pid1, pid2, nang-ang_delta, nang+ang_delta, pix_delta, Attack_Right, Attack_Pixel_Delta, mxret, mxang, dp, mxdst, att_dir);
    }

    // void Rough_Edge::Set_Fat( Polygon_2D* iPoly, int _Fat_Per, Polygon_2D* oPoly/*=NULL*/ )
    Set_Fat(iPoly, _Fat_Per, oPoly=null){
        if(iPoly == null) return;
        if(oPoly == null) oPoly = iPoly;

        if(_Fat_Per < MIN_FAT_PER) _Fat_Per = MIN_FAT_PER;
        if(_Fat_Per > MAX_FAT_PER) _Fat_Per = MAX_FAT_PER;

        if(oPoly == this.Edge_Polygon) this.Edge_Fat_Per = _Fat_Per;

        for(let i=1; i<=iPoly.Point_Count; i++){
            oPoly.Points[i] = (iPoly.Points[i]).oprPlus( this.Move_Direction[i].oprMultiply( _Fat_Per/100 ) );
        }
    }

    // void Rough_Edge::Move_Points(int stid, int edid, Point_2D dp, Polygon_2D* Poly)
    Move_Points(stid, edid, dp, Poly){
        if(Poly == null) Poly = this.Edge_Polygon;
        if(stid < 1) stid = 1;
        if(edid > Poly.Point_Count) edid = Poly.Point_Count;
        for(let i=stid; i<=edid; i++){
            Poly.Points[i] = Poly.Points[i].oprPlus(dp);
        }
    }

    // bool Rough_Edge::Detect_First_Point(Body_Image* Image, Polygon_2D* Poly, int Pid, Point_2D att_dir, int att_width,
    //     int att_deep, int init_gap, int att_step)
    Detect_First_Point(Image, Poly, Pid, att_dir, att_width, att_deep, init_gap, att_step){
        let op = Poly.Points[Pid];
        let sp = this.Direct_Plus( Poly.Points[Pid], att_dir, init_gap );

        let ret = false;
        Poly.Points[Pid] = sp;
        for(let i=0; i<att_deep; i+=att_step){
            if(Detect_Point(Image, Poly, Pid, att_dir, att_width, att_step, 0)) {ret = true; break;}
            Poly.Points[Pid] = Direct_Plus( Poly.Points[Pid], att_dir, att_step );
        }
        Poly.Points[Pid] = op;

        return ret;
    }

    // bool Detect_Point(Body_Image* Image, Polygon_2D* Poly, int Pid, Point_2D att_dir, int att_width, int att_deep = ATTACK_PIXEL_DELTA, int init_gap = 0);
    Detect_Point(Image, Poly, Pid, att_dir, att_width, att_deep = ATTACK_PIXEL_DELTA, init_gap = 0){
        let o_bdLength={value:0}, ret;
        let res = true;
        let sp = new Point_2D();

        sp = this.Direct_Plus( Poly.Points[Pid], att_dir, init_gap );
        this.Make_Attack_Polygon_Direction( sp, att_dir, att_width );
        ret = this.Polygon_Wave_Attack(o_bdLength, Image, null, null, att_deep);

        if((ret)<0) {res=false; Poly.Quality[(Pid)]=0;} else {Poly.Quality[(Pid)]=(ret);}

        if(ret>0){
            this.Correct_Polygon.Points[Pid] = this.Direct_Plus(Poly.Points[Pid], att_dir, o_bdLength.value + init_gap);

        } else {
            this.Correct_Polygon.Points[Pid] = Poly.Points[Pid];
        }

        return res;
    }

    // void Rough_Edge::Point_Rotate(Point_2D* cp, Point_2D* dp, int rot_ang){
    Point_Rotate(cp, dp, rot_ang){
        if(rot_ang<0) rot_ang+=360;
        if(rot_ang>360) rot_ang-=360;
        let ep = dp.oprMinus(cp);
        dp.x = cp.x + ( ep.x * gcos[rot_ang] - ep.y * gsin[rot_ang] ) / 32768;
        dp.y = cp.y + ( ep.x * gsin[rot_ang] + ep.y * gcos[rot_ang] ) / 32768;
    }

    // bool Rough_Edge::Find_Edge_Point(Body_Image* Image, Polygon_2D* Poly, int pid, int spid, int epid, int stgap, bool Attack_Right){
    Find_Edge_Point(Image, Poly, pid, spid, epid, stgap = ROUGH_EDGE_GAP/2, Attack_Right = true){
        let deps;
        let ret = false;

        if(Attack_Right == false){
            let tmp = spid; spid = epid; epid = tmp; //swap(spid, epid)
        }
        
        Poly.Points[0] = Poly.Points[pid];
        Poly.Points[pid] = this.Direct_Plus( Poly.Points[pid], Virt_Vector(Poly.Points[epid]-Poly.Points[spid]), stgap );
        for(deps = ROUGH_EDGE_GAP; deps <= 4*ROUGH_EDGE_GAP; deps += ROUGH_EDGE_GAP){
            if(this.Detect_Point(Image, Poly, pid, Virt_Vector(Poly.Points[epid]-Poly.Points[spid]), 2, ROUGH_EDGE_GAP)) {ret=true; break;}
            Poly.Points[pid] = this.Direct_Plus( Poly.Points[pid], Virt_Vector(Poly.Points[epid]-Poly.Points[spid]), ROUGH_EDGE_GAP );
        }

        if(ret){
            Poly.Points[pid] = this.Direct_Plus(this.Correct_Polygon.Points[pid], Virt_Vector(Poly.Points[spid]-Poly.Points[epid]), ROUGH_EDGE_GAP);
        } else {
            Poly.Points[pid] = Poly.Points[0];
        }
        return ret;

    }

    // int cross(Point_2D v1, Point_2D v2)
    cross(v1, v2){
        return (v1.x * v2.y - v1.y * v2.x);
    }

    // Point_2D Rough_Edge::Cross_Point(Point_2D p1, Point_2D p2, Point_2D p3, Point_2D p4)
    Cross_Point(p1, p2, p3, p4){
        let resp = new Point_2D();
        let v1 = new Point_2D(), v2 = new Point_2D();
        v1 = p2.oprMinus(p1);
        v2 = p4.oprMinus(p3);

        if(v1.x*v2.y == v1.y*v2.x) return resp;
        if(v1.x*v2.y == -v1.y*v2.x) return resp;

        let r = 1.0 * this.cross(v1, p1.oprMinus(p3)) / this.cross(v1, v2);
        resp = p3 + v2 * r;

        return resp;
    }

}



