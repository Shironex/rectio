import { STORAGE } from '@/data/site';

/** Runs before the first paint, from the layout: applies the remembered colour mode. */
export const BOOT_SCRIPT = `try{var r=document.documentElement,c=JSON.parse(localStorage.getItem('${STORAGE.theme}')||'{}');if(c.mode==='light'||c.mode==='dark')r.dataset.mode=c.mode}catch(e){}`;
