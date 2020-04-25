import { Pixel } from './DEF';

export function pabs(px){
    return new Pixel(Math.abs(px.R), Math.abs(px.G), Math.abs(px.B));
}

export function max3d(a, b, c){
	return Math.max(a, b, c);
}

// export function max3d(p3d){
// 	return max3d(p3d.R, p3d.G, p3d.B);
// }

export function sum3d(p3d){
	return p3d.R+p3d.G+p3d.B;
}

export function hypot3d(p3d){
	return Math.round( sqrt(p3d.R*p3d.R + p3d.G*p3d.G + p3d.B*p3d.B + 0.0) );
}

export function Gradient_3D(col1, col2){
	let res;
	dcol = pabs(col1-col2);

	res = max3d(Math.abs(dcol.R-dcol.G), Math.abs(dcol.R-dcol.B), Math.abs(dcol.B-dcol.R))*30 + max3d(dcol)*3 + sum3d(dcol);// + hypot3d(dcol)/5;
	res /= 3;
	if(res>255) res=255;
	return res;
}

export function Gaussian(d, x){
	return 0;
}

export function Dist(p1, p2=null){
	if(p2==null) return Math.hypot(p1.x, p1.y);
	else return Math.hypot(p1.x-p2.x, p1.y-p2.y);
}

export function Good_Angle(ang){
	if(ang < 0) ang += 360; else if(ang > 360) ang -= 360;
	return ang;
}
