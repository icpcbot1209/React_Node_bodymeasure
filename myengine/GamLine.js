import { CGamPoint } from "./GamPoint";

export class CGamLine{
    constructor(st=new CGamPoint(), en=new CGamPoint()){
        this.st = st;
        this.en = en;
    }

    GetLineVector(){
        return this.en.oprMinus(this.st);
    }

    Distance(){
        return this.GetLineVector().Distance();
    }

    DistanceSqr(){
        return this.GetLineVector().DistanceSqr();
    }

    SplitLine(n){
        let pv = [];
        n = Math.max(1, n);
        let dv = this.en.oprMinus(this.st);
        dv = dv.oprDivide(n);
        pv.push(this.st);
        for(let i=1; i<=n; i++) {
            pv.push( this.st.oprPlus( dv.oprMultiply(i) ) );
        }

        return pv;
    }

    GetRotation(angle, center=null){
        let line = new CGamLine();
        if(center==null){
            line.st = this.st.GetRotation(angle);
            line.en = this.en.GetRotation(angle);
            return line;
        } else {
            line = this.oprMinus(center);
            line = line.GetRotation(angle);
            return line.oprPlus(center);
        }
    }

    oprPlus(pnt){
        return CGamLine(this.st.oprPlus(pnt), this.en.oprPlus(pnt));
    }

    oprMinus(pnt){
        return CGamLine(this.st.oprMinus(pnt), this.en.oprMinus(pnt));
    }

    Transform(angle, scale, center=null){
        if(center==null){
            return CGamLine(this.st.Transform(angle, scale), this.en.Transform(angle, scale));
        } else {
            return CGamLine(this.st.Transform(angle, scale, center), this.en.Transform(angle, scale, center));
        }
    }
}

