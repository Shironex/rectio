import { STORAGE } from '@/data/site';

/** Runs before the first paint, from the layout: applies the remembered theme and mode. */
export const BOOT_SCRIPT = `try{var r=document.documentElement,c=JSON.parse(localStorage.getItem('${STORAGE.theme}')||'{}');if(c.theme==='ledger'||c.theme==='default')r.dataset.theme=c.theme;if(c.mode==='light'||c.mode==='dark')r.dataset.mode=c.mode}catch(e){}`;
