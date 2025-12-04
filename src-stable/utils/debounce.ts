export function debounce(fn, wait=100){
  let t=null;
  return (...args)=>{ if(t) clearTimeout(t); t = window.setTimeout(()=>{ fn(...args); t=null; }, wait); }
}
export default debounce
