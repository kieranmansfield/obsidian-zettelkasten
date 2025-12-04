export type SegmentType = 'letters' | 'numbers';
export interface Segment { readonly type: SegmentType; readonly value: string; }

export class ZettelId {
  private readonly segments: readonly Segment[];
  constructor(raw: string | readonly Segment[]) {
    if (typeof raw === 'string') this.segments = Object.freeze(ZettelId.parse(raw));
    else { ZettelId.validateSegments(raw); this.segments = Object.freeze(raw.map(s=>({...s}))); }
  }
  public static parse(raw: string): Segment[] {
    if (raw.length===0) throw new Error('empty');
    const segs: Segment[] = [];
    let i=0; let expectLetters=true;
    while(i<raw.length){
      const start=i;
      if(expectLetters){
        while(i<raw.length && /[a-z]/.test(raw[i])) i++;
        if(i===start) throw new Error('expected letter');
        const v=raw.slice(start,i);
        if(!/^[a-z]+$/.test(v)) throw new Error('invalid letters');
        segs.push({type:'letters', value:v});
      } else {
        while(i<raw.length && /[0-9]/.test(raw[i])) i++;
        if(i===start) throw new Error('expected number');
        const v=raw.slice(start,i);
        if(!/^[0-9]+$/.test(v)) throw new Error('invalid numbers');
        segs.push({type:'numbers', value:v});
      }
      expectLetters=!expectLetters;
    }
    return segs;
  }
  private static validateSegments(segs: readonly Segment[]): void {
    if(segs.length===0) throw new Error('empty segments');
    let expectLetters=true;
    for(const s of segs){
      if(expectLetters){
        if(s.type!=='letters' || !/^[a-z]+$/.test(s.value)) throw new Error('invalid letters');
      } else {
        if(s.type!=='numbers' || !/^[0-9]+$/.test(s.value)) throw new Error('invalid numbers');
      }
      expectLetters=!expectLetters;
    }
  }
  public toString(){ return this.segments.map(s=>s.value).join(''); }
  public getSegments(){ return this.segments; }
  public depth(){ return this.segments.length; }
  public getParent(): ZettelId|null {
    if(this.segments.length<=1) return null;
    return new ZettelId(this.segments.slice(0,-1));
  }
  public static compare(a: ZettelId,b: ZettelId): -1|0|1 {
    const sa=a.getSegments(), sb=b.getSegments(), max=Math.max(sa.length,sb.length);
    for(let i=0;i<max;i++){
      const A=sa[i], B=sb[i];
      if(A===undefined) return -1;
      if(B===undefined) return 1;
      if(A.type===B.type){
        if(A.type==='letters'){
          const cmp = ZettelId.compareLetters(A.value,B.value);
          if(cmp<0) return -1; if(cmp>0) return 1;
        } else {
          const nA=Number.parseInt(A.value,10), nB=Number.parseInt(B.value,10);
          if(nA<nB) return -1; if(nA>nB) return 1;
        }
      } else return A.type==='letters'? -1:1;
    }
    return 0;
  }
  private static compareLetters(a:string,b:string){ const la=a.length, lb=b.length, m=Math.min(la,lb);
    for(let i=0;i<m;i++){ const ca=a.charCodeAt(i), cb=b.charCodeAt(i); if(ca<cb) return -1; if(ca>cb) return 1; }
    if(la<lb) return -1; if(la>lb) return 1; return 0;
  }
  public getNextChild(): ZettelId {
    const segs = this.getSegments().map(s=>({...s}));
    const last = segs[segs.length-1];
    if(last.type==='letters') segs.push({type:'numbers', value:'1'}); else segs.push({type:'letters', value:'a'});
    return new ZettelId(segs);
  }
  public static isValid(raw:string){ try{ ZettelId.parse(raw); return true;}catch{return false;} }
}
export default ZettelId
