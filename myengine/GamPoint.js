
const FIX = (x) => (Math.round(x))

export class CGamPoint{

    constructor(x=0, y=0){
        this.x = x;
        this.y = y;
    }

    DistanceSqr(){
        return (this.x * this.x + this.y * this.y);
    }

    Distance(){
        return Math.sqrt(this.DistanceSqr());
    }

    oprPlus(other){
        return new CGamPoint(this.x+other.x, this.y+other.y);
    }

    oprMinus(other){
        return new CGamPoint(this.x-other.x, this.y-other.y);
    }

    oprMultiply(mul){
        return new CGamPoint(this.x*mul, this.y*mul);
    }

    oprDivide(div){
        return new CGamPoint(this.x/div, this.y/div);
    }

    iX(){
        return FIX(this.x);
    }

    iY(){
        return FIX(this.y);
    }

    oprSmall(other){
        if( this.iX() != other.iX() ) return this.iX() < other.iX();
        return this.iY()<other.iY();
    }

    oprEqual(other){
        return (this.iX() == other.iX()) && (this.iY()== other.iY());
    }

    oprAnd(other){
        return (this.x*other.x + this.y*other.y);
    }

    oprPow(other){
        return (this.x*other.y - this.y*other.x);
    }


    GetRotation(angle, center=null){
        if(center == null) return CGamPoint(this.x*Math.cos(angle) - this.y*Math.sin(angle), this.y*Math.cos(angle) + x*Math.sin(angle));

        let dp = this.oprMinus(center);
        dp = dp.GetRotation(angle);
        return dp.oprPlus(center);
    }

    GetScale(scale, center=null){
        if(center==null) return this.oprMultiply(scale);

        let dp = this.oprMinus(center);
        dp = dp.oprMultiply(scale);
        dp = dp.oprPlus(center);
        return dp;
    }

    Transform(angle, scale, center = null){
        if(center == null) return this.GetRotation(angle).GetScale(scale);

        let dp = this.oprMinus(center);
        dp = dp.Transform(angle, scale);
        return dp.oprPlus(center);
    }







}