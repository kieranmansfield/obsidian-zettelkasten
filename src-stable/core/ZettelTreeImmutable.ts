import { ZettelId } from "./ZettelID";
export type FileRef = { readonly path: string; readonly basename: string; }
export interface ZettelNode { readonly id: ZettelId; readonly children: readonly ZettelNode[]; readonly file?: FileRef }
export class ZettelTreeImmutable {
  public static buildForestFromFiles(files: Array<{ idString: string; path: string; basename: string }>): readonly ZettelNode[] {
    const nodeMap = new Map<string,ZettelNode>();
    for(const f of files){
      if(!ZettelId.isValid(f.idString)) continue;
      const id = new ZettelId(f.idString);
      nodeMap.set(id.toString(), { id, children: [], file: { path: f.path, basename: f.basename }});
    }
    const parentChildren = new Map<string|null, ZettelNode[]>();
    parentChildren.set(null, []);
    for(const node of nodeMap.values()) parentChildren.set(node.id.toString(), []);
    for(const node of nodeMap.values()){
      const p = node.id.getParent();
      if(p===null) parentChildren.get(null)!.push(node);
      else {
        const arr = parentChildren.get(p.toString()) ?? [];
        arr.push(node);
        parentChildren.set(p.toString(), arr);
      }
    }
    const constructed = new Map<string,ZettelNode>();
    const construct = (idStr:string, raw?: ZettelNode): ZettelNode => {
      const cached = constructed.get(idStr); if(cached) return cached;
      const rawChildren = parentChildren.get(idStr) ?? [];
      const children = rawChildren.map(c=>construct(c.id.toString(), c)).sort((a,b)=>ZettelId.compare(a.id,b.id));
      const node: ZettelNode = { id: raw? raw.id : new ZettelId(idStr), children, file: raw?.file };
      constructed.set(idStr, node); return node;
    };
    const roots = (parentChildren.get(null) ?? []).map(r=>construct(r.id.toString(), r)).sort((a,b)=>ZettelId.compare(a.id,b.id));
    return roots;
  }
  public static compactForest(roots: readonly ZettelNode[]){
    const idRenameMap = new Map<string,string>();
    const filePathRenameMap = new Map<string,string>();
    const lettersForIndex = (index:number) => { let n = BigInt(index)+1n; const parts:string[]=[]; while(n>0n){ const mod=(n-1n)%26n; parts.unshift(String.fromCharCode(Number(mod)+97)); n=(n-1n)/26n;} return parts.join(''); }
    const computeBasename = (oldName:string, oldId:string, newId:string) => oldName.startsWith(oldId)? newId+oldName.slice(oldId.length) : `${newId}-${oldName}`;
    const computePath = (oldPath:string, _oldName:string, newName:string)=> { const idx=oldPath.lastIndexOf('/'); return idx===-1? newName : oldPath.slice(0, idx+1)+newName; }
    const rewriteDescendants = (node:ZettelNode, oldRoot:string, newRoot:string) => { const stack=[...node.children]; while(stack.length){ const n = stack.pop()!; const oldIdStr = n.id.toString(); if(oldIdStr.startsWith(oldRoot)){ const suffix = oldIdStr.slice(oldRoot.length); const newIdStr = newRoot+suffix; idRenameMap.set(oldIdStr,newIdStr); if(n.file){ const newBase = computeBasename(n.file.basename, oldIdStr, newIdStr); const newPath = computePath(n.file.path, n.file.basename, newBase); filePathRenameMap.set(n.file.path, newPath); } } for(const c of n.children) stack.push(c); } }
    const process = (siblings: readonly ZettelNode[], parentIdStr: string): ZettelNode[] => {
      if(!siblings.length) return [];
      const sorted = [...siblings].sort((a,b)=>ZettelId.compare(a.id,b.id));
      const parentDepth = parentIdStr==='' ? 0 : new ZettelId(parentIdStr).getSegments().length;
      const remap = new Map<string,string>();
      sorted.forEach((node,i)=>{ const segs=node.id.getSegments(); if(parentDepth>=segs.length) return; const seg = segs[parentDepth]; if(seg.type!=='letters') return; const newLetters = lettersForIndex(i); const nextSegs = [...segs]; nextSegs[parentDepth] = { type: 'letters', value: newLetters }; const newId = new ZettelId(nextSegs).toString(); const oldId=node.id.toString(); if(newId!==oldId) remap.set(oldId,newId); });
      const out: ZettelNode[] = [];
      for(const node of sorted){
        const oldId = node.id.toString();
        const newIdStr = remap.get(oldId) ?? oldId;
        const newId = new ZettelId(newIdStr);
        if(newIdStr!==oldId) idRenameMap.set(oldId,newIdStr);
        const newChildren = process(node.children, newIdStr);
        let newFile = node.file;
        if(node.file && newIdStr!==oldId){
          const newBase = computeBasename(node.file.basename, oldId, newIdStr);
          const newPath = computePath(node.file.path, node.file.basename, newBase);
          newFile = { path: newPath, basename: newBase };
          filePathRenameMap.set(node.file.path, newPath);
        }
        if(remap.has(oldId)) rewriteDescendants(node, oldId, remap.get(oldId)!);
        out.push({ id: newId, children: newChildren, file: newFile });
      }
      return out;
    };
    const newRoots = process(roots, '');
    return { newForest: newRoots, idRenameMap, filePathRenameMap };
  }
}
export default ZettelTreeImmutable
